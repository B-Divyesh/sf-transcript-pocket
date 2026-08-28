import type { SavedEpisode } from './storage';

const sampleTranscript = `WEBVTT

00:00.000 --> 00:02.400
Mara checks the field recorder before the train leaves.

00:02.400 --> 00:05.200
The guest names the small sound that changed her route.

00:05.200 --> 00:08.000
Keep this marker for the closing question.`;

function silentWav(seconds = 8): Blob {
  const sampleRate = 8000;
  const dataSize = sampleRate * seconds;
  const bytes = new Uint8Array(44 + dataSize);
  const view = new DataView(bytes.buffer);
  bytes.set(new TextEncoder().encode('RIFF'), 0);
  view.setUint32(4, 36 + dataSize, true);
  bytes.set(new TextEncoder().encode('WAVEfmt '), 8);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  bytes.set(new TextEncoder().encode('data'), 36);
  view.setUint32(40, dataSize, true);
  bytes.fill(128, 44);
  return new Blob([bytes], { type: 'audio/wav' });
}

export function sampleEpisode(): SavedEpisode {
  return {
    key: 'current',
    audioName: 'city-notes-sample.wav',
    audioType: 'audio/wav',
    audioBlob: silentWav(),
    transcriptName: 'city-notes-sample.vtt',
    cues: [
      { id: 'cue-1', start: 0, end: 2.4, text: 'Mara checks the field recorder before the train leaves.' },
      { id: 'cue-2', start: 2.4, end: 5.2, text: 'The guest names the small sound that changed her route.' },
      { id: 'cue-3', start: 5.2, end: 8, text: 'Keep this marker for the closing question.' }
    ],
    position: 0,
    bookmarks: [],
    updatedAt: new Date().toISOString()
  };
}

export const sampleTranscriptFile = sampleTranscript;
