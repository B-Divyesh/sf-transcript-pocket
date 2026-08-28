# Transcript Pocket verification handoff

## Release status: FAIL

Independent verification of commit `90e2fd1f08a0cd198df6be2064fca7fb0f36564e` at <https://transcript-pocket.sociobot.in> completed on 2026-08-28 UTC. Do not release this candidate.

The live site matches all 18 files from the candidate’s fresh production build byte-for-byte. This is a product acceptance failure, not a stale or failed deployment.

## Release blockers

1. `.factory/claims.json` is missing. The mandatory claims suite cannot run, and public offline/privacy/export claims are unregistered.
2. There is no one-click “Try it with sample data” demo, demo banner, isolated demo storage, reset/start-real controls, or `.factory/demo.md`.
3. The cold first screen fails the acceptance contract: it does not name Deaf or hard-of-hearing listeners, and no primary action is visible at 1280×720 or 390×844.
4. A corrupt `.mp3` opens an unusable player and is falsely reported as saved successfully; no audio error or recovery guidance appears.

Additional defects: missing CSP and long-lived immutable asset caching; missing canonical/OG/Twitter, robots, sitemap, deployment config, designed 404, copy audit, and footer build ID; lost keyboard focus after opening the player; undersized link targets; one moderate axe landmark issue; and a raw JSON parser message on malformed imports.

Full findings and evidence are in [verification.md](verification.md).

## What was verified successfully

- `npm ci`
- `npm test` — 7/7 passed
- `npm run build` — TypeScript and Vite passed; `dist/` produced
- `npm run test:e2e` — 2/2 passed
- `npm audit --audit-level=high` — 0 vulnerabilities
- Normal VTT/WAV flow, synchronized cue, search, text sizing, bookmarks, export/import, persistence, offline reload, and recovery from transcript errors
- No console/page errors and no cross-origin requests in the normal listening flow
- Zero axe serious/critical findings on cold, loaded, dark, privacy, and terms screens
- Keyboard reachability, visible 3 px focus, reduced motion, 390 px layout, and 200% text without horizontal overflow
- Valid PWA manifest, active service worker, offline shell/episode restore, and update toast/action
- Lighthouse mobile: Performance 99, Accessibility 100, Best Practices 100, SEO 100; LCP 1.3 s, TBT 140 ms, CLS 0
- Bundles within budget: 16.58 KB JS, 15.68 KB CSS, 62.12 KB fonts, 32.33 KB mobile hero
- Billing verify CORS and invalid verdict, return-token handling and daily cache, checkout 303, and API rate limiting (31×200 / 89×429 in a 120-request concurrent burst; `Retry-After: 4`)

No lint command exists. Sign-in, library/CLI consumer installation, and product-owned backend concurrency checks are not applicable.

## Reproduce

```sh
npm ci
npm test
npm run build
npm run test:e2e
```

Review `.factory/verification.md` and `.factory/evidence/` for independent browser, screenshot, URL-verification, and Lighthouse evidence.

## Next steps

Implement the four blockers first without weakening the local-only privacy model. Add claim-tagged demo tests for every public promise, then fix deployment headers/routes and keyboard/touch/error behavior. Re-run the full clean-clone and live verification after deployment.
