# Transcript Pocket repair handoff

## Release status: repaired and buildable

This repair addresses every finding in the independent verification report for candidate `90e2fd1f08a0cd198df6be2064fca7fb0f36564e` (report commit `775070751c08b56c0e95c13272e6435cc6b34246`). The original local audio, timed-caption, bookmark, export/import, restore, PWA, and paid-license behavior remains in place.

## What changed

- Added the required claim registry at [claims.json](claims.json): 12 public claims, each mapped to exactly one `@claim:` Playwright regression.
- Added the one-click `/?demo=1` sandbox. It opens a seeded eight-second WAV and three-cue VTT sample, uses only IndexedDB database `demo:transcript-pocket`, shows the required persistent banner, and has Reset demo and Start for real controls. See [demo.md](demo.md).
- Rewrote the cold first screen with the audience named in the first sentence, a job-specific `<h1>`, and visible Try it with sample data / Choose your own files actions at both 1280×720 and 390×844.
- Validate media metadata before saving or opening a player. Corrupt audio now gives a recovery message; malformed position JSON now tells the listener to choose an exported Transcript Pocket position file.
- Move focus to the newly revealed player heading. The dynamic loaded heading remains the sole level-one heading; the bookmarks rail is now a section rather than a nested complementary landmark.
- Added 44 px header/footer link targets, canonical/Open Graph/Twitter metadata, social image, robots, sitemap, static-host CSP/cache/media policy, designed 404, footer build ID, copy audit, and a `lint` command.

## Verification run locally

All commands ran from a clean `npm ci` install on 2026-08-28 UTC:

```sh
npm ci
npm test
npm run lint
npm run build
npm run test:e2e
npm audit --audit-level=high
```

Results:

- Unit tests: 7/7 passed.
- Type/lint: passed (`tsc --noEmit`).
- Production build: passed; `dist/index.html` exists.
- Playwright: 16/16 passed. This covers desktop and 390 px first screens, keyboard focus transfer, axe cold/loaded checks, sample isolation/reset/leave flow, corrupt audio, malformed JSON, PWA offline reload, position export, and every registered claim.
- Claims registry check: all 12 claim IDs occur exactly once in the test suite.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4180/ .factory/evidence/repair-local`: HTTP 200, no console errors, title/lang/one `<h1>`/`<main>` present, zero missing image alt, zero unlabeled buttons. Raw result: [verify.json](evidence/repair-local/verify.json).
- Local Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 0.9 s, LCP 1.5 s, TBT 0 ms, CLS 0. Raw report: [lighthouse-mobile.json](evidence/repair-local/lighthouse-mobile.json).
- `staticwebapp.config.json` is valid in both the repository and `dist/`; it sets CSP, immutable hashed-asset caching, manifest media type, service-worker no-cache, `/demo` rewrite, and designed 404 response override. `robots.txt` and `sitemap.xml` are emitted to `dist/`.
- Production deployment: deployed `dist/` to the existing `sf-transcript-pocket` Azure Static Web App and verified the custom domain. The live site has the repaired headline and zero console errors; `manifest.json` is `application/json`, hashed JavaScript is `public, max-age=31536000, immutable`, `/demo` returns 200, and an unknown path returns 404. Raw live verifier result: [verify.json](evidence/repair-live/verify.json).

## Evidence and operation

- Local desktop/mobile screenshots: [desktop](evidence/repair-local/screenshot-desktop.png) and [390 px mobile](evidence/repair-local/screenshot-mobile.png). The live desktop/mobile verifier screenshots are in [repair-live](evidence/repair-live/).
- Run locally with `npm run dev`; verify the production build with `npm run build && npm run preview`.
- Demo entry: `/?demo=1`. The normal app is `/`; legal pages are `/privacy/` and `/terms/`.
- Deploy `dist/` as the static output. The included `staticwebapp.config.json` is the deployment policy; no application backend, infrastructure, DNS, or billing resource was changed.

## Known gaps

None.
