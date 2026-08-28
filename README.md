# Transcript Pocket

Transcript Pocket lets Deaf and hard-of-hearing podcast listeners read timed captions beside audio files they already own.

Production URL: <https://transcript-pocket.sociobot.in>

## What it does

- Opens local audio with timed VTT or SRT captions.
- Highlights the phrase at the current playback position.
- Searches captions and adjusts reading text from 18 to 30 pixels.
- Saves bookmarks and a portable position file without audio bytes.
- Restores a saved sheet offline after its first visit.
- Offers Pocket Plus, an optional US$12 one-time license for appearance controls. Reading and export tools stay free.

## Try the demo

Open [/?demo=1](https://transcript-pocket.sociobot.in/?demo=1), or choose **Try it with sample data** on the first screen. It opens a three-cue sample listening sheet in a separate `demo:transcript-pocket` database. The banner can reset the sample or discard it before you start with your own files. See [`.factory/demo.md`](.factory/demo.md) for the sandbox details.

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
npm run lint
npm run build
npm run test:e2e
```

The exact production build command is `npm run build`. Static output is written to `./dist`, with `dist/index.html` at its root. The end-to-end suite uses Playwright 1.58.2 and starts `vite preview` automatically. It verifies the 390 px flow, axe accessibility, demo isolation, claim-tagged behavior, local file pairing, search, bookmarks, IndexedDB restoration, and offline reload.

## Deployment

Deploy the contents of `dist/` as a static site with clean directory URLs enabled. No infrastructure, DNS, or billing resources are managed in this repository.

The production billing endpoint defaults to `https://api.sociobot.in`. A staging build can use the pilot engine without code changes:

```sh
VITE_BILLING_BASE_URL=https://pilot-api.sociobot.in npm run build
```

The factory must register the `transcript-pocket` product slug before checkout is live. No provider product ID or secret is stored here.

Atkinson Hyperlegible Next and IBM Plex Mono are bundled locally under the SIL Open Font License 1.1; the full notices ship at `/FONT-LICENSES.txt`.

## Privacy and storage

Audio and transcript contents remain in the browser. There are no analytics, ads, runtime CDNs, remote fonts, or cloud library. A saved Pocket Plus token is checked with the Sociobot billing API; checkout happens on the hosted Sociobot/Dodo page. See `/privacy/` and `/terms/` in the built app.

## Project notes

- Product brief: [`.factory/brief.json`](.factory/brief.json)
- Visual system and generated-art provenance: [`.factory/design.md`](.factory/design.md)
- Verification and handoff: [`.factory/handoff.md`](.factory/handoff.md)
- Claims and exact regression commands: [`.factory/claims.json`](.factory/claims.json)

Licensed under the MIT License.
