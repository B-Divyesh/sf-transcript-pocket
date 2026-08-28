# Transcript Pocket

Transcript Pocket is a private, offline-capable player that puts synchronized VTT or SRT captions beside audio files a listener already owns. It is designed for Deaf and hard-of-hearing podcast listeners who need consistent transcript support without uploading their media or creating an account.

Production URL: <https://transcript-pocket.sociobot.in>

## What it does

- Opens local MP3, M4A, WAV, OGG, and AAC files using the browser’s media support.
- Parses common WebVTT and SubRip timestamps and UTF-8, UTF-16, or Windows-1252 text.
- Highlights the current phrase and lets a listener seek by selecting any phrase.
- Supports transcript search, 18–30 px reading text, keyboard controls, playback speed, and bookmarks.
- Saves the selected episode, captions, position, and bookmarks in IndexedDB when the listener opts in.
- Exports and imports a portable JSON position/bookmark file. Audio is never included in exports.
- Installs as a PWA and restores a saved episode without a network connection.
- Offers an optional US$12 one-time Pocket Plus license for manual day/night appearance controls. Every accessibility and data-ownership feature is free.

This app does not transcribe, download, scrape, certify, or host media or transcripts.

## Run locally

Requires Node.js 22 or a current LTS release.

```sh
npm install
npm run dev
```

Open the printed local URL. The app has no backend and no required environment variables.

## Test and build

```sh
npm test
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`. Static output is written to `./dist`, with `dist/index.html` at its root. The end-to-end suite uses Playwright 1.58.2 and starts `vite preview` automatically. It verifies the 390 px flow, axe accessibility, local file pairing, search, bookmarks, IndexedDB restoration, and offline reload.

## Deployment

Deploy the contents of `dist/` as a static site with clean directory URLs enabled. No infrastructure, DNS, or billing resources are managed in this repository.

The production billing endpoint defaults to `https://api.sociobot.in`. A staging build can use the pilot engine without code changes:

```sh
VITE_BILLING_BASE_URL=https://pilot-api.sociobot.in npm run build
```

The factory must register the `transcript-pocket` product slug before checkout is live. No provider product ID or secret is stored here.

Atkinson Hyperlegible Next and IBM Plex Mono are bundled locally under the SIL Open Font License 1.1; the full notices ship at `/FONT-LICENSES.txt`.

## Privacy and storage

Audio and transcript contents remain in the browser. There are no analytics, ads, runtime CDNs, remote fonts, or cloud library. The only optional external request is a once-daily Pocket Plus license check; checkout happens on the hosted Sociobot/Dodo page. See `/privacy/` and `/terms/` in the built app.

## Project notes

- Product brief: [`.factory/brief.json`](.factory/brief.json)
- Visual system and generated-art provenance: [`.factory/design.md`](.factory/design.md)
- Verification and handoff: [`.factory/handoff.md`](.factory/handoff.md)

Licensed under the MIT License.
