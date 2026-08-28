# Transcript Pocket v1 handoff

## Shipped

- A complete Vite + TypeScript static PWA in `dist/` for pairing local audio with VTT/SRT sidecars.
- Robust cue parsing for WebVTT/SubRip timestamps, cue IDs/settings/tags, multiline text, UTF-8, UTF-16 LE/BE, and Windows-1252 fallback. Invalid and empty files receive actionable errors.
- Native audio transport plus ±10 second controls, speed selection, synchronized phrase highlighting, click-to-seek, keyboard shortcuts, 18–30 px transcript text, search, and bookmarks.
- Local-first IndexedDB persistence of the opted-in audio Blob, cues, position, and bookmarks. A listener can remove the offline copy while continuing in the current tab.
- Portable JSON position/bookmark export and import. The export explicitly omits audio and transcript content.
- Installable manifest with 192/512/maskable icons, versioned service-worker app-shell caching, dynamically precached hashed assets, offline fallback, and an in-app ready/update notice.
- US$12 one-time Pocket Plus flow using the Sociobot hosted checkout and daily-cached license verification. Return tokens and pasted restore tokens use `sb_license:transcript-pocket`; the URL token is stripped immediately. The free experience is never blocked by verification.
- Responsive blueprint drafting-sheet interface, light/dark system treatments, reduced-motion handling, 44 px targets, strong focus states, semantic structure, and original generated hero art.
- Privacy and terms pages, expanded README, MIT license, and no analytics, runtime CDN, third-party script, or remote font.

## Original art

The hero is original AI-generated work produced with the Param Factory Azure image deployment on 2026-08-28. The exact prompt and review are in `assets/src/transcript-pocket-hero.prompt.json`; the source PNG is retained in `assets/src/`. Production WebP files are 52 KB and 32 KB, below the 300 KB budget. The image was visually reviewed for geometry, artifacts, unintended symbols, text, brands, and watermark; no issues were found. Disclosure appears in the footer.

## Verification

Run from `/work/repo`:

```sh
npm install
npm test
npm run build
npm run test:e2e
```

Results on 2026-08-28:

- `npm test`: 7/7 unit tests passed.
- `npm run build`: passed; `dist/index.html` exists at the required root.
- `npm run test:e2e`: 2/2 Chromium journeys passed. This covers 390×844 rendering, local file pairing, search, bookmark creation, IndexedDB refresh recovery, `context.setOffline(true)`, offline reload, and privacy/terms routes.
- Playwright axe integration: 0 serious or critical violations on the first-use screen.
- `/opt/fleet/lib/verify-url.sh`: HTTP 200, 540 ms local load, no console/page errors, `lang=en`, one `<h1>`, `<main>` present, 0 images missing alt, and 0 unlabeled buttons.
- Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 92; FCP 0.9 s, LCP 1.4 s, TBT 0 ms, CLS 0.
- Production bundles: initial JS 16.58 KB raw / 6.52 KB gzip; CSS 15.05 KB raw / 4.18 KB gzip. No font payload. Both are comfortably inside the 200 KB JS and 50 KB CSS budgets.
- `npm audit`: 0 vulnerabilities.
- Visual inspection completed at 1440×1000 and 390×844 for empty and loaded-player states.

## Deployment and configuration

- Exact build command: `npm run build`
- Static deploy directory: `./dist`
- Default checkout/verify base: `https://api.sociobot.in`
- For staging, build with `VITE_BILLING_BASE_URL=https://pilot-api.sociobot.in`.
- The factory still needs to register the `transcript-pocket` product slug in the billing engine. No product ID is hardcoded.

## Known boundaries

- The player intentionally does not create transcripts or fetch podcast feeds. A listener supplies both files.
- Audio codec support follows the browser/operating system; some M4A variants may not play in every browser.
- Browsers set their own storage quotas. If a large episode cannot be persisted, the app explains that it remains usable for the current tab.
- Position exports identify the source filenames but do not include copyrighted audio or transcript content. A listener should reopen the matching episode before importing on a new device.
- Transcript accuracy and timing come from the supplied sidecar and are not accessibility or medical certification.
