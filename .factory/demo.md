# Demo sandbox

Open [/?demo=1](https://transcript-pocket.sociobot.in/?demo=1) to enter the one-click demo. The first screen loads the 8.46-second spoken MP3 `city-notes-sample.mp3` and a three-cue VTT excerpt about a field-recording interview. The spoken sample lets a listener hear the phrases that the player follows.

The demo writes only to IndexedDB database `demo:transcript-pocket`. It never reads the normal `transcript-pocket` database and its transcript-size preference is stored with a `demo:` localStorage prefix. The persistent banner identifies this mode and provides **Reset demo** (deletes every demo-prefixed value and reseeds the sample) and **Start for real** (deletes the demo database and every demo-prefixed value before returning to the normal file picker).

The VTT ships in `src/demo.ts`; the original synthetic speech MP3 ships at `public/assets/city-notes-sample.mp3`. No visitor media, account, or network setup is required. The service-worker shell precaches the MP3 and app shell, so the demo is also the entry point for the offline-reload claim test.
