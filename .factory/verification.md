# Independent verification — FAIL

Tested 2026-08-28 UTC.

- Candidate: `90e2fd1f08a0cd198df6be2064fca7fb0f36564e`
- Live URL: <https://transcript-pocket.sociobot.in>
- Work order: `transcript-pocket-verify-1`
- Result: **FAIL — do not release**
- Product code changes: none

The live deployment is healthy and byte-for-byte matches the candidate build, and the core local-file player works. The candidate nevertheless fails three mandatory acceptance gates: the claims registry is missing, there is no one-click sample-data demo, and the cold first screen does not state the intended audience or show a first action.

## Mandatory gate results

### Claims gate — FAIL (release blocker)

`.factory/claims.json` does not exist at the exact candidate commit. Per the claims acceptance contract, this is release-blocking and means there were no claim commands to run. Claims in the landing page, privacy page, terms, and README therefore have no registered `@claim:<id>` test. Examples include offline reload, local-only files, no upload/tracking, synchronized phrase following, format/encoding support, position export, no audio in exports, and once-daily license verification.

### Cold first-read test — FAIL (release blocker)

Cold 1280×720 and 390×844 browser contexts were opened against the live URL.

- What it does: the visible copy says it pairs owned audio with VTT/SRT and follows the words.
- For whom: the first screen does not name Deaf or hard-of-hearing podcast listeners. A visitor can only infer “someone who already owns an audio file and sidecar.”
- What to click first: no primary action is visible. At 1280×720 the only visible actions were the wordmark and “Pocket Plus”; at 390×844 only the wordmark was visible. File selection is below the fold.
- The home-page `<h1>` is the product name, “Transcript Pocket”; the job headline “Bring the audio. Read every beat.” is an `<h2>` and is not a plain audience-specific job statement.

Evidence: [desktop first screen](evidence/live-desktop-first.png), [390 px cold first screen](evidence/live-mobile-cold.png), [browser probe](evidence/browser-probe.json), and [mobile/manifest probe](evidence/supplemental-probe.json).

### Demo sandbox — FAIL (release blocker)

- There is no “Try it with sample data” action anywhere on the page.
- `/demo` returns the ordinary app shell, not seeded sample data.
- There is no persistent “Demo — sample data, nothing is saved” banner, Reset demo, Start for real, or separate demo storage namespace.
- `.factory/demo.md` is absent.

The smallest useful experience therefore requires the visitor to supply two compatible files and cannot be evaluated in one click.

## Defects

### Blocker

1. **Required claims registry and claim tests are absent.** See mandatory claims gate above.
2. **Required one-click isolated demo is absent.** See demo gate above.
3. **First screen fails the five-second plain-words contract.** It neither names the intended audience nor exposes the first action in the initial viewport, on desktop or mobile.

### High

4. **Unsupported/corrupt audio is reported as success with no recovery message.** A file named `broken.mp3` containing non-audio bytes plus a valid VTT opened the workspace. The audio element reported `error.code=4`, `networkState=3`, and `readyState=0`, while the UI said “Saved locally for your next visit.” `#file-error` remained empty.
5. **Claim-like public copy is unlisted and unverified.** This affects privacy and offline promises users could rely on, not just marketing wording.

### Medium

6. **Required site/deployment structure is incomplete.** There is no `staticwebapp.config.json`, `robots.txt`, `sitemap.xml`, designed 404 route, canonical metadata, Open Graph metadata, or Twitter card. Unknown routes such as `/404` return the home app with HTTP 200; `robots.txt` and `sitemap.xml` return 404.
7. **Required CSP is absent.** HTTPS redirect, HSTS, `Referrer-Policy`, and `X-Content-Type-Options` are present, but the live responses have no `Content-Security-Policy`.
8. **Production caching does not meet the immutable-asset policy.** Even hashed JS and CSS use `Cache-Control: public, must-revalidate, max-age=30`, rather than long-lived immutable caching. The manifest is served as `application/octet-stream` rather than a manifest JSON media type, although Chromium parsed it without errors.
9. **Keyboard focus is not moved into the revealed player.** After successful file submission, `document.activeElement` is `BODY`; the previous submit control was hidden. This makes the major state change harder to locate for keyboard and screen-reader users.
10. **Several visible links have sub-44 px hit areas.** Examples measured on desktop: wordmark 228×28, “Pocket Plus” 88×17, Privacy 42×17, Terms 36×17, and Font licenses 80×18.
11. **Loaded-player landmark structure has an axe violation.** Axe reports one moderate `landmark-complementary-is-top-level` issue for the nested bookmarks `aside`. There were no serious or critical axe findings.
12. **Invalid JSON import exposes a parser error instead of an actionable message.** The UI displayed `Expected property name or '}' in JSON at position 1 (line 1 column 2)` and did not tell the listener what file to choose next.
13. **Required verification documents are absent.** `.factory/copy-audit.md` is missing in addition to `.factory/demo.md` and `.factory/claims.json`.

### Low

14. The footer does not include a version/build ID as required by the site skeleton.

## What passed

### Clean checkout, install, tests, and build

The tree began clean at the requested commit.

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 63 packages installed; audit found 0 vulnerabilities |
| `npm test` | PASS — 7/7 unit tests |
| `npm run build` | PASS — TypeScript `--noEmit` and Vite production build; `dist/` produced |
| `npm run test:e2e` | PASS — 2/2 Playwright tests |
| Lint | Not available — no lint script or lint configuration exists |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |

### Core end-to-end behavior

The same representative flow passed locally and live using an 8-second WAV and three-cue VTT:

- opened local audio and captions;
- rendered and selected the synchronized current phrase at 2.5 seconds;
- searched to one match and to a zero-result state;
- bounded transcript text size at 18–30 px;
- created a bookmark and rejected a duplicate within one second;
- exported a JSON position file with one bookmark and no audio bytes;
- imported a mismatched-filename position and moved playback to 6 seconds with a warning;
- restored the episode and bookmark from IndexedDB after reload;
- removed network access and reloaded the saved player with all three cues.

Recovery messages passed for a wrong transcript extension, an empty transcript, a transcript with no timed cues, duplicate bookmark, mismatched position filename, and empty license field. Corrupt audio and malformed JSON recovery failed as described above.

### Privacy and paid unlock

- A full normal local-file flow made only same-origin requests; there were no analytics, remote fonts, third-party scripts, or media uploads.
- The return URL token was saved under `sb_license:transcript-pocket`, removed from the address bar, verified once, cached, and not reverified on immediate reload.
- Invalid-token verification returned HTTP 200 with `{"valid":false,"reason":"invalid","expires_at":null}` and correct CORS for the production origin.
- The checkout endpoint is registered and returned HTTP 303 to hosted `checkout.dodopayments.com`; no payment was attempted.
- Rate-limit burst: 120 concurrent invalid-token verification requests yielded 31 HTTP 200 and 89 HTTP 429 responses. The first numbered request observed as 429 was request 31. The 429 response included `Retry-After: 4` (and `x-ratelimit-after: 4`).
- Sign-in is not used, so the Entra authority requirement is not applicable.

### Accessibility and responsive behavior

- Worker `verify-url.sh`: HTTP 200, title and `lang=en` present, one `<h1>`, `<main>` present, no missing image alt, no unlabeled button, and no console/page errors.
- Axe: zero serious/critical findings on the cold screen, loaded player, dark treatment, privacy, and terms. One moderate loaded-player landmark issue is listed above.
- Keyboard: skip link was the first Tab stop; its visible focus outline measured 3 px solid blue. All file inputs and main controls were reachable; no keyboard trap was observed.
- 390 px layouts had no horizontal overflow. Simulated 200% root text at 390 px also had no horizontal overflow.
- Reduced-motion emulation matched, computed scroll behavior was `auto`, and transition/animation durations collapsed to `0.01ms`.
- Privacy and terms routes each returned 200 with route-specific titles and one `<h1>`.

### PWA and offline behavior

- Chromium parsed the manifest with no manifest errors; the required 192, 512, and maskable icons were present.
- The service worker activated and controlled the page. Cache `tp-shell-v1` contained the shell, legal pages, offline page, hashed JS/CSS, fonts, images, manifest, and icons.
- A saved player reloaded offline with its three cues and “Offline · player ready.”
- An update simulation changed the served worker bytes, called `registration.update()`, and produced the in-app message “A new offline sheet is ready.” with a visible “Update now” action.

### Performance and bundle budgets

Lighthouse 12.8.2 mobile against the live URL:

- Performance 99
- Accessibility 100
- Best Practices 100
- SEO 100
- FCP 1.0 s; LCP 1.3 s; TBT 140 ms; CLS 0; Speed Index 1.0 s

Fresh production build sizes:

- JS: 16,583 B raw / 6,554 B gzip (budget 200 KB)
- CSS: 15,684 B raw / 4,447 B gzip (budget 50 KB)
- Fonts: 62,116 B total (budget 120 KB)
- Mobile hero WebP: 32,330 B (budget 300 KB)

Raw Lighthouse evidence: [lighthouse-mobile.json](evidence/lighthouse-mobile.json).

### Deployment identity

Every one of the 18 files in the fresh `dist/` build matched the corresponding live response byte-for-byte, including HTML, service worker, manifest, hashed JS/CSS, fonts, images, and icons. This confirms the live deployment is the requested candidate despite the missing visible build ID.

HTTPS redirects correctly from HTTP. The observed certificate covered `transcript-pocket.sociobot.in` and was valid from 2026-08-28 through 2027-02-28.

## Evidence index

- [Browser probe JSON](evidence/browser-probe.json)
- [Mobile and manifest probe JSON](evidence/supplemental-probe.json)
- [Live desktop first screen](evidence/live-desktop-first.png)
- [Live mobile cold first screen](evidence/live-mobile-cold.png)
- [Live loaded workspace](evidence/live-desktop-workspace.png)
- [Worker URL verification JSON](evidence/verify-url/verify.json)
- [Lighthouse mobile JSON](evidence/lighthouse-mobile.json)

## Release recommendation

Do not release this candidate. Add the isolated one-click demo and its documentation, add a complete claims registry with one observable demo-based test per public claim, rewrite/reflow the first screen to satisfy the audience/action contract, and fix corrupt-audio recovery. Then address the deployment metadata, CSP/cache policy, and accessibility issues before reverification.
