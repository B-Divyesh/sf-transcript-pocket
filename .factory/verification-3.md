# Independent verification 3 — FAIL

Verified 2026-09-06 UTC.

- Work order: `transcript-pocket-verify-3`
- Live URL: <https://transcript-pocket.sociobot.in>
- Implementation reviewed: `4b357cfff2e65a2be369b885422eeccb40337b18`
- Documentation/evidence revision: `51055327a4492cfe3cee7584bf7e69d72a36ca5b`
- Product-code changes by this verification: none
- Result: **FAIL — 2 findings, including 1 untested public claim. Do not declare this release PASS.**

The implementation is otherwise functional and the deployed runtime corresponds to the implementation candidate. The two findings below prevent a PASS under the work order's accessibility and claims contracts.

## Findings

### Blocker — refund policy is a public, untested claim

The paid section says, “Sociobot/Dodo is the merchant of record and handles refunds. A refund revokes the license.” The terms page repeats that refunded purchases result in license revocation. This is a customer-facing billing/refund policy, but `.factory/claims.json` has no claim for it.

The closest claim, `pocket-plus-price`, tests only the displayed US$12 one-time wording and the checkout URL. Its tagged test does not exercise or fixture refund handling or a revoked-license response caused by a refund. This is **1 untested public claim**: the refund handling/revocation policy. Either register and test it with an appropriate recorded billing fixture, or remove the promise until it can be proven.

### Medium — 200% text resizing overflows the phone layout

In a fresh 390 × 844 phone context, setting the root text size to 200% produced `document.documentElement.scrollWidth = 473` while `clientWidth = 390`. The header action group extends to x=473 and moves the Demo link beyond the right edge. This fails the required 200% text-resize-without-loss baseline.

The overflow reproduces on both `/` and `/?demo=1`; it is not caused by demo data. At normal text size the 390 px layout has no horizontal overflow. The header needs a text-size-aware reflow or an equivalent compact arrangement.

## Mandatory gates

### Fresh clean-checkout claims — PASS (14/14)

A new tree was made with `git archive 51055327a4492cfe3cee7584bf7e69d72a36ca5b`, then `npm ci` was run. Every command below was run exactly as declared, independently, without a prior build. Each command built its own `dist/` and passed.

| Claim | Exact command | Result |
| --- | --- | --- |
| `sample-demo` | `npm run test:e2e -- --grep @claim:sample-demo` | PASS |
| `local-files` | `npm run test:e2e -- --grep @claim:local-files` | PASS |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS |
| `synchronized-reading` | `npm run test:e2e -- --grep @claim:synchronized-reading` | PASS |
| `caption-formats` | `npm run test:e2e -- --grep @claim:caption-formats` | PASS |
| `audio-formats` | `npm run test:e2e -- --grep @claim:audio-formats` | PASS |
| `text-size` | `npm run test:e2e -- --grep @claim:text-size` | PASS |
| `search` | `npm run test:e2e -- --grep @claim:search` | PASS |
| `bookmarks` | `npm run test:e2e -- --grep @claim:bookmarks` | PASS |
| `position-export` | `npm run test:e2e -- --grep @claim:position-export` | PASS |
| `audio-recovery` | `npm run test:e2e -- --grep @claim:audio-recovery` | PASS |
| `position-import` | `npm run test:e2e -- --grep @claim:position-import` | PASS |
| `pocket-plus-price` | `npm run test:e2e -- --grep @claim:pocket-plus-price` | PASS |
| `free-core` | `npm run test:e2e -- --grep @claim:free-core` | PASS |

This proves the 14 registered claims, but does not cure the separate unregistered refund-policy promise above.

### Local quality checks — PASS

In that same fresh archive checkout:

- `npm run lint` passed.
- `npm test` passed: 7/7 tests.
- `npm run build` passed and produced `dist/`.
- `npm run test:e2e` passed: 21/21 browser tests.

The full browser suite covers local audio/VTT/SRT behavior, all five declared audio formats, normal and corrupt-audio recovery, malformed-position recovery, transcript-size bounds, search, bookmarks, position export, demo reset/exit, one active h1, focus after loading, and offline reload.

## Live verification

Fresh desktop (1280 × 720) and phone (390 × 844) browser contexts opened the live home page at scroll position zero.

- **Job:** “Read podcasts alongside every spoken phrase.”
- **Audience:** Deaf and hard-of-hearing podcast listeners.
- **First action:** “Try it with sample data,” visible before scrolling (bottom y=676.2 on desktop; y=440.0 on phone).

The first action opened the realistic `city notes sample`: three timed cues and an audible 8.461-second MP3. The persistent “Demo — sample data, nothing is saved.” label was visible. Search reduced it to one phrase, a bookmark was created, Reset demo restored zero bookmarks and 20 px text, and Start for real left no demo IndexedDB database or `demo:` localStorage key. Requests observed across the demo were same-origin only, with no console errors.

The demo reloaded while the fresh phone context was offline and showed “Offline · player ready.” A local, in-memory verification harness changed only the service-worker response version after installation; it observed “A new offline sheet is ready.” and a visible “Update now” action. No live deployment was changed.

Direct live routes behaved as follows:

| Route | HTTP | Browser title | Result |
| --- | ---: | --- | --- |
| `/` | 200 | `Transcript Pocket — local audio with synchronized captions` | PASS |
| `/demo` | 200 | `Demo — Transcript Pocket` | PASS |
| `/privacy/` | 200 | `Privacy — Transcript Pocket` | PASS |
| `/terms/` | 200 | `Terms — Transcript Pocket` | PASS |
| `/not-a-real-page` | 404 | `Page not found — Transcript Pocket` | Expected designed 404 |

The 404 has a usable heading and return link. Its browser network log contains the expected failed-resource entry for the deliberate HTTP 404; this is not a defect.

All same-origin links found on `/`, `/demo`, `/privacy/`, and `/terms/` returned 200. The live shell has the expected CSP, HSTS, `Referrer-Policy`, and `X-Content-Type-Options` headers. Of the candidate build output, 22 delivered product assets matched byte-for-byte. `sw.js` matched after normalizing its intentional build-time cache version; the versioned service-worker behavior was separately exercised above. `staticwebapp.config.json` is deployment configuration and deliberately is not a publicly served asset (live request returns the designed 404).

`/opt/fleet/lib/verify-url.sh` passed; its raw result is [verify.json](evidence/verification-3-live/verify.json). The standalone `@axe-core/cli` could not start because this container has Playwright Chromium but no Selenium-discoverable Chrome binary. The allowed Playwright axe integration was run instead against live `/` and `/?demo=1`; both returned zero violations, including zero serious/critical violations.

## Earlier findings disposition

The previous verification reports' claims-command, demo isolation/reset, audible sample, recovery message, landmark, touch-target, demo-title, heading, copy-audit, three-step, legal-skeleton, and versioned-cache findings are resolved by the fresh tests and live checks above. The earlier designed-404 requirement is also resolved. This verification found the two new, still-open items listed under Findings.

## Handoff recommendation

Keep the candidate out of PASS status until the refund/revocation promise has a registered observable claim test (or is removed) and the 390 px layout retains all content at 200% text size without horizontal scrolling.
