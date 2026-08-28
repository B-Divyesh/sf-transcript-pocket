import { describe, expect, it } from 'vitest';
import { cueAtTime, decodeTranscript, formatTime, parseTranscript, readPositionFile } from '../../src/core';

describe('parseTranscript', () => {
  it('parses WebVTT identifiers, settings, tags, and multiline cues', () => {
    const cues = parseTranscript(`WEBVTT\n\nintro\n00:00:01.250 --> 00:00:03.500 align:start\n<v Alex>Hello &amp; welcome</v>\nto the show.\n\n00:04.000 --> 00:06.000\nSecond phrase`);
    expect(cues).toEqual([
      { id: 'cue-1', start: 1.25, end: 3.5, text: 'Hello & welcome to the show.' },
      { id: 'cue-2', start: 4, end: 6, text: 'Second phrase' }
    ]);
  });

  it('parses SRT commas and sorts out-of-order cues', () => {
    const cues = parseTranscript(`2\n00:00:05,000 --> 00:00:07,400\nLater\n\n1\n00:00:01,000 --> 00:00:02,000\nEarlier`);
    expect(cues.map((cue) => cue.text)).toEqual(['Earlier', 'Later']);
    expect(cues[1].end).toBe(7.4);
  });

  it('explains empty and invalid files', () => {
    expect(() => parseTranscript('')).toThrow(/empty/i);
    expect(() => parseTranscript('WEBVTT\n\nNo timings')).toThrow(/No timed phrases/i);
  });
});

describe('encoding support', () => {
  it('decodes UTF-16LE with a byte order mark', () => {
    const content = '00:00.000 --> 00:01.000\nCafé';
    const encoded = new TextEncoder().encode(content);
    const utf16 = new Uint8Array(2 + content.length * 2);
    utf16.set([0xff, 0xfe]);
    [...content].forEach((character, index) => {
      const code = character.charCodeAt(0);
      utf16[index * 2 + 2] = code & 0xff;
      utf16[index * 2 + 3] = code >> 8;
    });
    expect(encoded.length).toBeGreaterThan(0);
    expect(decodeTranscript(utf16.buffer)).toContain('Café');
  });
});

describe('playback helpers', () => {
  const cues = parseTranscript('00:00.000 --> 00:02.000\nFirst\n\n00:03.000 --> 00:04.000\nSecond');

  it('finds only a cue covering the current time', () => {
    expect(cueAtTime(cues, 1)).toBe(0);
    expect(cueAtTime(cues, 2.5)).toBe(-1);
    expect(cueAtTime(cues, 3.9)).toBe(1);
  });

  it('formats short and long times', () => {
    expect(formatTime(65.8)).toBe('1:05');
    expect(formatTime(3661)).toBe('1:01:01');
    expect(formatTime(Number.NaN)).toBe('0:00');
  });

  it('validates imported position files', () => {
    const result = readPositionFile(JSON.stringify({
      kind: 'transcript-pocket-position', version: 1, position: 12,
      audioName: 'show.mp3', transcriptName: 'show.vtt', bookmarks: [], exportedAt: '2026-01-01'
    }));
    expect(result.position).toBe(12);
    expect(() => readPositionFile('{"kind":"unknown"}')).toThrow(/not supported/i);
  });
});
