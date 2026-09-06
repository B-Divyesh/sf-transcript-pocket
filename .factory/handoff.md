# Transcript Pocket repair handoff

## Release status: PASS

Transcript Pocket is an offline, local-first player for Deaf and hard-of-hearing podcast listeners who already have audio and timed caption files. The first action is **Try it with sample data**; it immediately opens an audible eight-second listening sheet with synchronized phrases.

Implementation deployed to <https://transcript-pocket.sociobot.in>: `4b357cfff2e65a2be369b885422eeccb40337b18`.

Documentation/evidence base: `ba98705e8235f30ad88c72559585ef1ecdb7e22f`. The follow-on report-only commit records this reference and does not change the deployed product assets.

## What changed

- `test:e2e` now builds `dist/` itself. Every exact claim command therefore works after a documented clean `npm ci` checkout.
- The public-claim registry now has complete one-to-one coverage: VTT and SRT, five decoded audio formats, the full same-origin privacy flow, and the free core are all independently exercised.
- The demo ships original, audible synthetic speech, uses only the `demo:` IndexedDB/localStorage namespace, removes every demo key on reset or exit, and does not create an empty real database when entered from the landing action.
- Reset restores the seeded sample and removes demo bookmarks. Start for real removes all demo storage before returning home.
- Required-file failure is an in-page, focused recovery message. Text links meet the 44 px target. The demo route sets its own title. The loaded player and the loader now exchange the single active `<h1>` so each route/state has exactly one heading level one.
- The demo banner no longer creates a nested landmark. Plain section names, legal-page skeletons, complete copy audit, and the three-step How it works section resolve the earlier site-structure findings.
- Service-worker cache names receive a build version, and the audible sample is precached for the offline demo.

## Verification

Run from the repository:

```sh
npm ci
npm run lint
npm test
npm run build
npm run test:e2e
```

Results on the final implementation:

- TypeScript lint passed.
- Unit tests: 7/7 passed.
- Production build passed and produced `dist/`.
- Browser suite: 21/21 passed, including the Playwright axe checks with no serious, critical, or moderate violations in the loaded player.
- From a fresh `git archive` checkout after `npm ci`, all 14 commands declared in `.factory/claims.json` passed individually. Each command built its own missing `dist/` before starting Playwright.
- Lighthouse mobile (local production preview): performance 100, accessibility 100, best practices 100, SEO 100; FCP 906 ms, LCP 1506 ms, TBT 0 ms, CLS 0. The report is [repair-2-lighthouse-mobile-final.json](evidence/repair-2-lighthouse-mobile-final.json).
- The final HTTPS check passed in 567 ms with no console errors, one `<h1>`, `<main>`, `lang`, named buttons, and no missing image alt text. See [final live URL evidence](evidence/repair-2-live-url-final/verify.json).
- Fresh desktop and 390 px phone contexts both showed the job, audience, and sample action before scrolling. The sample had a 8.461-second decoded duration, kept its persistent demo label, used only `demo:transcript-pocket`, created a bookmark, and reset to zero bookmarks. Leaving demo left no IndexedDB database or localStorage keys. Final screenshots are in [repair-2-live-final](evidence/repair-2-live-final/).
- Fresh live route checks passed: `/`, `/demo`, `/privacy`, and `/terms` return 200 with their expected route titles and one `<h1>`; the designed `/not-a-real-page` returns HTTP 404 with a usable page. All 12 deployment shell assets matched the production `dist/` byte-for-byte.

The static deployment used the existing one-site configuration for `sf-transcript-pocket`; no backend, volumes, or replica settings are part of this product. Final deployment ID: `78ca1490-fc0e-4962-aa73-62cf6949586f`.

## Claims and billing

`.factory/claims.json` declares 14 claims, each with exactly one `@claim:` browser test and a demo-only sandbox. The catalog description is verb-first, 73 characters, and also copied to `/work/.evidence/catalog-description.txt`.

Pocket Plus remains an optional US$12 one-time license for appearance controls. Reading, captions, text size, search, bookmarks, and position export remain free without a license. The existing hosted checkout URL and terms were preserved. Billing registration is operated separately by the factory; no transaction or credential was used during this repair. Earlier independent verification had already observed the registered endpoint's 429 and `Retry-After` behavior; no billing code changed here.

## Known gaps and next steps

No known product defects remain in the repaired scope. The external billing registration remains an operational dependency of the factory billing operator, not a local product-state dependency. No action is needed for the free local-first player.
