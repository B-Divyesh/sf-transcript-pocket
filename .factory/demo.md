# Demo sandbox

Open [/?demo=1](https://transcript-pocket.sociobot.in/?demo=1) to enter the one-click demo. The first screen loads an eight-second silent WAV named `city-notes-sample.wav` and a three-cue, realistic VTT excerpt about a field-recording interview.

The demo writes only to IndexedDB database `demo:transcript-pocket`. It never reads the normal `transcript-pocket` database and its transcript-size preference is stored with a `demo:` localStorage prefix. The persistent banner identifies this mode and provides **Reset demo** (discard and reseed the demo database) and **Start for real** (discard the demo database and return to the normal file picker).

The sample WAV and VTT are generated deterministically in `src/demo.ts`; no visitor media, account, or network setup is required. The service-worker shell is precached, so the demo is also the entry point for the offline-reload claim test.
