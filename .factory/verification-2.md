# Independent verification 2 — FAIL

Verified 2026-08-28 UTC.

- Candidate: `74a3c5835b6ea39ff61570da897c5d8e0902e0b7`
- Live URL: <https://transcript-pocket.sociobot.in>
- Work order: `transcript-pocket-verify-2`
- Result: **FAIL — do not release**
- Product code changes: none

The deployed product is healthy, useful, and byte-for-byte identical to the candidate build. Its cold first screen passes, the one-click demo works, all 12 claim tests pass after a production build, and the core local-first player works online and offline. The candidate still fails the explicit acceptance contract because an exact claim command fails from a clean checkout, and public claims remain incompletely registered or proven.

## Mandatory gates

### Clean-checkout claims gate — FAIL (release blocker)

`.factory/claims.json` exists with 12 entries and every ID appears exactly once as an `@claim:` test. However, its exact commands are not runnable successfully from a clean checkout. `playwright.config.ts` starts `npm run preview`, which requires `dist/`, but neither the claim command nor the Playwright web-server command builds it.

Fresh reproduction:

1. Created a new tree from `git archive 74a3c5835b6ea39ff61570da897c5d8e0902e0b7`.
2. Ran `npm ci`.
3. Ran the exact registry command `npm run test:e2e -- --grep @claim:sample-demo`.
4. Result: **FAIL**; the demo banner was absent because no product build existed.

Trace: [clean claim trace](evidence/verify2-clean-claim/sample-demo-trace.zip).

The first pass in the original clean checkout launched all 12 exact commands before building. Five returned direct assertion failures and seven reached their 30-second command window while waiting for controls absent from the unbuilt preview. Per the work order, any failing claim command is release-blocking.

After `npm run build`, every exact claim command passed independently:

| Claim ID | Built-product result |
| --- | --- |
| `sample-demo` | PASS |
| `local-files` | PASS |
| `offline-reload` | PASS |
| `synchronized-reading` | PASS |
| `caption-formats` | PASS |
| `text-size` | PASS |
| `search` | PASS |
| `bookmarks` | PASS |
| `position-export` | PASS |
| `audio-recovery` | PASS |
| `position-import` | PASS |
| `pocket-plus-price` | PASS |

### Claim completeness — FAIL (release blocker)

The registry does not cover every claim a visitor may rely on:

- The file picker promises MP3, M4A, WAV, OGG, and AAC. No registered claim covers that format list, and the browser E2E path exercises only WAV.
- `caption-formats` promises both VTT and SRT, but its one tagged test exercises only SRT. A separate sample test happens to use VTT, but the declared claim test does not prove both branches.
- The privacy page promises that audio, transcript text, searches, bookmarks, and exports are never sent. `local-files` records requests only while loading the sample; it does not perform the named search, bookmark, and export operations.
- “Core reading tools are free” / “always free” is public copy, but `pocket-plus-price` asserts only price wording and checkout destination.

Manual verification found no contradiction in the implementation, but the claims contract requires these statements to be registered and proven by their claim tests.

### Cold first-read and one-click demo — PASS

A fresh desktop context and a fresh 390×844 context opened the live home page.

- What it does: “Read podcasts alongside every spoken phrase.”
- For whom: “For Deaf and hard-of-hearing podcast listeners…”
- First action: “Try it with sample data,” followed by a plain explanation.
- The action is visible in the initial 390 px viewport at `y=396`, height `44`.
- One click opens `/?demo=1`, the persistent demo banner, `city notes sample`, and three timed phrases.

Evidence: [desktop cold](evidence/verify2-live-desktop-cold.png), [mobile cold](evidence/verify2-live-mobile-cold.png), [desktop demo](evidence/verify2-live-desktop-demo.png).

## Defects

### Blocker

1. **Exact claim commands fail from a clean checkout.** The test server previews a missing `dist/` instead of building the candidate. Add a deterministic build prerequisite to the E2E/claim entry point and reverify from a clean archive.
2. **Public claim coverage is incomplete.** The format, privacy-operation, and always-free statements above are not fully represented and asserted by the tagged tests.

### Medium

3. **Demo reset/exit does not discard all demo state.** After setting demo transcript size to 30 px and bookmarking, Reset demo removed the bookmark but retained `demo:tp:transcript-size=30`. Start for real removed the demo episode record but left that demo preference and the empty `demo:transcript-pocket` database. This contradicts `.factory/demo.md` saying reset will “discard and reseed the demo database” and leaving will discard demo data.
4. **Entering the demo from the primary landing action touches the real namespace first.** The home page opens `transcript-pocket` and writes `tp:transcript-size` before navigating to demo mode. Direct `/?demo=1` remains correctly isolated and contains only the demo namespace.
5. **The bundled audio demo is silent.** It displays realistic transcript text and timed highlighting, but an eight-second silent WAV cannot demonstrate that captions actually correspond to speech. The demo contract calls for realistic, opinionated sample data.
6. **Submitting with both required files absent gives no in-page recovery message.** Native validation focuses the visually 1×1 audio input, while `#file-error[role=alert]` stays empty. Wrong extension, empty/no-timing transcript, and corrupt audio all provide good actionable messages.
7. **Axe reports one moderate landmark violation in the loaded demo.** `landmark-complementary-is-top-level` identifies the demo banner `<aside>` nested inside the workspace section. There are no serious or critical findings.
8. **Several touch targets are narrower or shorter than 44 px.** At 390 px, the visible Demo link measured 32×44; inline Privacy/Terms links in the license text measured 42×17 and 36×17. Footer link widths were also below 44 px. Hidden file/radio inputs were excluded where their labels provide the real target.
9. **The demo route does not set a route-specific title.** `/demo` and `/?demo=1` retain the home title rather than `Demo — Transcript Pocket` as required by the site structure contract.
10. **Required site/copy documentation is incomplete.** `.factory/copy-audit.md` covers only nine first-screen sentences, not every sentence on the landing page. The home page also lacks the required explicit three-step “How it works” section, and legal-page headers/footers do not use the full common skeleton or identify “Built by Param Factory.”

### Low

11. **The service-worker cache name is not build-versioned.** `tp-shell-v1` is constant. Updates install and activate successfully, but old hashed assets can accumulate because activation does not recognize a new cache name to remove the prior build cache.

## What passed

### Install, checks, and production build

| Check | Result |
| --- | --- |
| `npm ci` | PASS — 63 packages; 0 audit vulnerabilities |
| `npm test` | PASS — 7/7 unit tests |
| `npm run lint` | PASS — TypeScript `--noEmit` |
| `npm run build` | PASS — exact production build created `dist/` |
| `npm run test:e2e` after build | PASS — 16/16 tests |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |

The production output is small: JS 19,337 B raw / 7,431 B gzip; CSS 16,725 B raw / 4,624 B gzip; fonts 62,116 B total; mobile hero 32,330 B.

### Core product behavior

Fresh live browser flows passed for:

- opening the shipped demo and a generated local WAV with UTF-16LE WebVTT;
- rendering, selecting, and highlighting timed phrases;
- search with one result and zero results;
- text-size bounds of 18 px and 30 px;
- bookmark creation and duplicate-bookmark recovery;
- JSON position export with one bookmark and no `audioBlob` or RIFF bytes;
- mismatched-episode position import with a warning and media-bound clamping;
- wrong transcript extension, empty captions, no timed cues, corrupt audio, and malformed JSON recovery;
- restoring saved demo data after reload and reloading it offline.

The smallest useful brief is otherwise present: local audio + VTT/SRT, synchronized highlighting, large text, search, bookmarks, position export, and offline persistence. It does not scrape, transcribe, sync, or host media.

### Privacy and network behavior

- The complete live demo interaction—search, bookmark, size changes, export, malformed import, and offline reload—made only same-origin requests. No analytics, remote fonts, third-party scripts, or media upload was observed.
- The root response has CSP, HSTS, `Referrer-Policy`, and `X-Content-Type-Options`. Hashed JS/CSS use `public, max-age=31536000, immutable`; `sw.js` uses `no-cache`; the manifest is `application/json`.
- A returned license token was stored under `sb_license:transcript-pocket`, stripped from the URL, checked once, cached, and not rechecked on immediate reload. An empty token produced an actionable message.
- Checkout returned HTTP 303 to hosted `checkout.dodopayments.com`; no purchase was attempted.
- Billing verification rate limit: a 50-request concurrent burst returned 30 HTTP 200 and 20 HTTP 429 responses. Every sampled 429 included `Retry-After: 4`. Observed allowance: 30 requests per approximately four-second window.
- The product has no sign-in, so the Entra authority requirement does not apply.

### Accessibility, mobile, and motion

- `/opt/fleet/lib/verify-url.sh`: HTTP 200; title and `lang=en`; one `<h1>`; `<main>` present; no missing alt text, unlabeled buttons, or console errors. [Raw evidence](evidence/verify2-url/verify.json).
- Axe on loaded light/dark desktop/mobile states: zero serious or critical findings; the one moderate finding is listed above.
- Keyboard: skip link is the first Tab stop; focus uses a visible 3 px blueprint-blue ring; the primary demo action opens with Enter; focus moves to the episode `<h1>`; `B` creates a bookmark; no trap was observed.
- 390 px: no horizontal overflow; first action remains above the fold.
- Reduced motion matches and collapses transitions/animations to `0.01ms`; smooth scrolling becomes `auto`.

### PWA, deployment, and performance

- Chromium reported no manifest or installability errors. Required 192, 512, and maskable icons are present.
- The service worker controls the page and precaches the app shell, built assets, fonts, legal pages, and offline page.
- Offline demo reload preserved all three cues and showed “Offline · player ready.”
- A fresh local update simulation changed the served worker bytes and observed `updatefound → installed → activating → activated`, followed by the visible “Transcript Pocket was updated for offline use” / “Update now” notice.
- All 22 public files in fresh `dist/` matched the corresponding live responses byte-for-byte. This proves the live deployment is candidate `74a3c5835b6ea39ff61570da897c5d8e0902e0b7`.
- Live routing passed: `/`, `/demo`, `/privacy/`, `/terms/`, manifest, robots, sitemap, and font notices returned 200; an unknown route returned the designed 404 with status 404; HTTP redirects to HTTPS.
- Fresh Lighthouse 12.8.2 mobile: Performance 100, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.4 s, TBT 10 ms, CLS 0, total transfer 105 KiB. [Raw report](evidence/verify2-lighthouse-mobile.json).

## Release recommendation

Do not release this candidate. First make every registry command pass from a clean checkout without undocumented ordering, then register and fully exercise every public claim. Also make Reset demo / Start for real remove all demo-prefixed state. The remaining accessibility, title, sample realism, skeleton, and cache-version findings should be corrected before reverification.
