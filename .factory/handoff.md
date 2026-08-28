# Transcript Pocket independent QA handoff

## Release status: FAIL — do not release

Independent verification was performed on 2026-08-28 against candidate `74a3c5835b6ea39ff61570da897c5d8e0902e0b7` and <https://transcript-pocket.sociobot.in>. The live deployment matches the candidate byte-for-byte and works end to end, but the release contract is not satisfied.

The release-blocking findings are:

1. An exact `.factory/claims.json` command fails after `npm ci` in a fresh `git archive` checkout because `test:e2e` previews a missing `dist/` and does not build it. Any failing claim command is a mandatory FAIL.
2. Public promises are not completely proven by their declared claim tests: the five-format audio list is unregistered; `caption-formats` tests only SRT; the privacy test does not perform the named search/bookmark/export operations; and the always-free core-tools promise is not asserted.

Additional medium findings cover incomplete demo reset/exit cleanup, creation of an empty real namespace before entering via the landing action, silent sample audio, missing in-page required-file error, one moderate axe landmark issue, sub-44 px text-link targets, the missing demo-specific title, and incomplete copy/site-skeleton documentation. The service-worker cache name is not build-versioned.

Everything else passed: `npm ci`; 7/7 unit tests; TypeScript lint; production build; 16/16 Playwright tests after build; all 12 claim tests independently after build; audit with zero vulnerabilities; live normal/boundary/error flows; same-origin demo traffic; CSP/security/cache headers; offline reload; service-worker update simulation; PWA installability; billing 429 enforcement; byte-for-byte deployment identity; and Lighthouse mobile 100/100/100/100.

Observed billing allowance: 30 requests in a concurrent burst, then HTTP 429 with `Retry-After: 4`.

Full evidence and remediation detail: [verification-2.md](verification-2.md). Key artifacts are in [evidence](evidence/), including screenshots, the clean-claim trace, URL verifier output, and the Lighthouse JSON report.

No product code was modified. Only independent verification documentation and evidence were added.
