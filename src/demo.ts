import type { SavedEpisode } from './storage';

const sampleTranscript = `WEBVTT

00:00.000 --> 00:02.400
Mara checks the field recorder before the train leaves.

00:02.400 --> 00:05.200
The guest names the small sound that changed her route.

00:05.200 --> 00:08.000
Keep this marker for the closing question.`;

const SAMPLE_AUDIO_URL = '/assets/city-notes-sample.mp3';

export async function sampleEpisode(): Promise<SavedEpisode> {
  const response = await fetch(SAMPLE_AUDIO_URL);
  if (!response.ok) throw new Error('The sample audio could not be loaded. Reconnect once, then try the demo again.');
  return {
    key: 'current',
    audioName: 'city-notes-sample.mp3',
    audioType: 'audio/mpeg',
    audioBlob: await response.blob(),
    transcriptName: 'city-notes-sample.vtt',
    cues: [
      { id: 'cue-1', start: 0, end: 2.4, text: 'Mara checks the field recorder before the train leaves.' },
      { id: 'cue-2', start: 2.4, end: 5.2, text: 'The guest names the small sound that changed her route.' },
      { id: 'cue-3', start: 5.2, end: 8.4, text: 'Keep this marker for the closing question.' }
    ],
    position: 0,
    bookmarks: [],
    updatedAt: new Date().toISOString()
  };
}

export const sampleTranscriptFile = sampleTranscript;
