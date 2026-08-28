export interface Cue {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface Bookmark {
  id: string;
  time: number;
  text: string;
  createdAt: string;
}

export interface PositionFile {
  kind: 'transcript-pocket-position';
  version: 1;
  audioName: string;
  transcriptName: string;
  position: number;
  bookmarks: Bookmark[];
  exportedAt: string;
}

function parseTimestamp(raw: string): number | null {
  const clean = raw.trim().replace(',', '.');
  const parts = clean.split(':');
  if (parts.length < 2 || parts.length > 3) return null;
  const seconds = Number(parts.pop());
  const minutes = Number(parts.pop());
  const hours = parts.length ? Number(parts.pop()) : 0;
  if (![seconds, minutes, hours].every(Number.isFinite)) return null;
  if (seconds < 0 || seconds >= 60 || minutes < 0 || minutes >= 60 || hours < 0) return null;
  return hours * 3600 + minutes * 60 + seconds;
}

function cleanCueText(value: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&nbsp;': ' ', '&lrm;': '', '&rlm;': ''
  };
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&(amp|lt|gt|nbsp|lrm|rlm);/gi, (entity) => entities[entity.toLowerCase()] ?? entity)
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parseTranscript(source: string): Cue[] {
  const normalized = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) throw new Error('The transcript file is empty. Choose a VTT or SRT file with timed phrases.');
  const blocks = normalized.split(/\n{2,}/);
  const cues: Cue[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trimEnd());
    if (!lines.length || /^(WEBVTT|NOTE|STYLE|REGION)(\s|$)/i.test(lines[0].trim())) continue;
    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex < 0) continue;
    const [startRaw, endWithSettings] = lines[timingIndex].split(/\s*-->\s*/, 2);
    const endRaw = endWithSettings?.trim().split(/\s+/)[0];
    const start = parseTimestamp(startRaw);
    const end = endRaw ? parseTimestamp(endRaw) : null;
    const text = cleanCueText(lines.slice(timingIndex + 1).join('\n'));
    if (start === null || end === null || end <= start || !text) continue;
    cues.push({ id: `cue-${cues.length + 1}`, start, end, text });
  }

  if (!cues.length) {
    throw new Error('No timed phrases were found. Check that the file uses VTT or SRT timestamps such as 00:01.000 --> 00:04.000.');
  }
  return cues.sort((a, b) => a.start - b.start || a.end - b.end);
}

export function decodeTranscript(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder('utf-16le').decode(bytes.subarray(2));
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    const swapped = new Uint8Array(bytes.length - 2);
    for (let index = 2; index + 1 < bytes.length; index += 2) {
      swapped[index - 2] = bytes[index + 1];
      swapped[index - 1] = bytes[index];
    }
    return new TextDecoder('utf-16le').decode(swapped);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder('windows-1252').decode(bytes);
  }
}

export function cueAtTime(cues: Cue[], time: number): number {
  let low = 0;
  let high = cues.length - 1;
  let candidate = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (cues[middle].start <= time) {
      candidate = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return candidate >= 0 && time < cues[candidate].end ? candidate : -1;
}

export function formatTime(seconds: number): string {
  const safe = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${minutes}:${String(secs).padStart(2, '0')}`;
}

export function readPositionFile(raw: string): PositionFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('That file is not valid position JSON. Choose a position file exported by Transcript Pocket.');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('This is not a Transcript Pocket position file.');
  const value = parsed as Partial<PositionFile>;
  if (value.kind !== 'transcript-pocket-position' || value.version !== 1 || typeof value.position !== 'number') {
    throw new Error('This position file is not supported.');
  }
  return {
    kind: 'transcript-pocket-position',
    version: 1,
    audioName: typeof value.audioName === 'string' ? value.audioName : '',
    transcriptName: typeof value.transcriptName === 'string' ? value.transcriptName : '',
    position: Math.max(0, value.position),
    bookmarks: Array.isArray(value.bookmarks)
      ? value.bookmarks.filter((item): item is Bookmark => Boolean(item && typeof item.id === 'string' && typeof item.time === 'number' && typeof item.text === 'string' && typeof item.createdAt === 'string'))
      : [],
    exportedAt: typeof value.exportedAt === 'string' ? value.exportedAt : new Date().toISOString()
  };
}
