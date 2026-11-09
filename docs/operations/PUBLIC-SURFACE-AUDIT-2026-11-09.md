# Public-surface audit — 2026-11-09

**Doc ID:** `csoai.public-surface-audit/2026-11-09` · lane: `lane/public-journey-audit` · scope: every surface a reader, a crawler or an agent reaches on `councilof.ai`
**Tools:** `scripts/audit/published-surface-audit.py` (the estate's own live-surface audit, unchanged) plus a dated door cross-check written from the published surfaces.
**Doctrine unchanged:** measurement, never certification · states, never zeroes · a dated read is never rewritten, a new reading is a new document.

Every number below was read on 2026-11-09. Where something is a finding rather than a fact, it says so.

---

## 1. The estate's own live-surface audit

```
python3 scripts/audit/published-surface-audit.py
Published-surface audit — 2 finding(s)
[MEDIUM] https://councilof.ai/  a Content-Security-Policy is present only as Report-Only
                                it cannot break a page, but it also cannot protect one until it is enforced
[MEDIUM] https://meok.ai/      security headers missing
                                strict-transport-security, permissions-policy, x-frame-options
by severity: medium=2
```

**Two findings, both real, both about the estate's own posture rather than about its content.**

### 1.1 `councilof.ai` — the CSP is Report-Only and therefore protects nothing

`public/_headers` serves
`Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' …`.

That is a **deliberate** choice, and the file says why: a wrong enforced CSP is a white screen, and this
repo has already had a white-screen incident (2026-08-11). The same comment names the next step:

> NEXT STEP (needs a real traffic window, not a guess): read the report over a week of production traffic,
> fix what it names, then promote this header to `Content-Security-Policy` and drop the -Report-Only suffix.

**That next step cannot be run as written, and the reason is specific: the policy names no reporting
destination.** There is no `report-uri`, no `report-to` and no `Reporting-Endpoints` header, and no
collector exists anywhere in the repository (`git ls-tree` and a grep for `report-uri|report-to|
Reporting-Endpoints` over `functions/`, `public/` and `scripts/` return nothing). A browser asked to report
violations to nowhere sends them nowhere. The traffic window the file asks for is therefore not
observable, and the policy cannot be promoted on evidence because there is no evidence to read.

Cloudflare's per-zone CSP reporting endpoint was checked on 2026-11-09 and **does not resolve for this
zone** (`councilof.ai.reporting-endpoints.csp.cloudflare.com` and `reporting-endpoints.csp.cloudflare.com`
both fail to resolve), so the reporting destination has to be one the estate controls and operates.

**What the static evidence already says, so that the window is not the only input.** Scanned the built
tree (843 html/js/css files in `dist/client`) against the policy's directives:

| directive | risk in the built tree | verdict |
|---|---|---|
| `object-src 'none'` | no `<object>` or `<embed>` tag in any built page | safe |
| `form-action 'self'` | no `<form>` with a non-`self` action | safe |
| `base-uri 'self'` | no `<base>` tag | safe |
| `script-src` | scripts are `'self'`; third-party origins appear in **content** (links and prose), not as script sources | needs the runtime report to be sure |
| `frame-src` | **not declared**, so `default-src 'self'` governs frames, and the built tree references `huggingface.co` and many third-party origins | **this is the directive that can break a page if enforced blind** |

So the static pass clears three of the strict directives and identifies `frame-src` as the one that needs
a runtime report before promotion. That is a narrower question than "read a week of traffic", and it is
answerable with one collector and one week.

**The fix, in order:** (1) add a reporting destination the estate controls and collects, and point the
Report-Only policy at it; (2) let the window run; (3) add the `frame-src` (and any other) directives the
report names; (4) promote the header and drop the `-Report-Only` suffix. Steps 1 and 3 are this lane's to
do. **Step 4 is a production-posture decision** and is left to the owner.

### 1.2 `meok.ai` — three security headers missing

The audit finds `meok.ai` without `strict-transport-security`, `permissions-policy` or `x-frame-options`.

**This is not this repository's surface.** No deployment file, `_headers`, `wrangler` configuration or
workflow in `councilof-ai` serves `meok.ai` (checked by name across the tree and across
`.github/workflows/`). The estate's own `_headers` comment describes `meok.ai` as "same estate, same
component library" — a sibling deployment with its own repository. **The fix belongs to whoever deploys
`meok.ai`**, and it is recorded here with the evidence so it is not lost. `councilof.ai` itself carries all
five headers (verified in the same run: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
`Permissions-Policy`, `Strict-Transport-Security`).

---

## 2. Door cross-check: does every door a published surface names answer?

The journey surfaces are the doors a stranger or an agent arrives at. The estate measured this on
2026-11-03 (issue #3843: 568 doors, 0 dead). That measurement's script lives in the jewel-audit lane's
delivery bundle and is **not in this repository**, so it cannot be re-run from the tree. This is a
cross-check, written from the published surfaces, and it is a check of the estate's own rule — "every path
a journey surface names must answer" — not a second rule.

**61 doors probed on 2026-11-09 across six groups** (the public doors the alignment plan names, the board
and its axes, the Council OS workspace, the ask/talk journey, the plugin and distribution surfaces, and the
signed/machine-readable evidence).

| state | count | meaning |
|---|---:|---|
| 2xx / 3xx | **51** | the door answers |
| 4xx | 10 | every one of them a door **no published surface names** |
| **dead among published doors** | **0** | — |

The ten were checked against `/catalog.json`, `/llms.txt`, `/llms-full.txt`, `/sitemap.xml`,
`/openapi.json`, `/`, `/dashboard/`, `/layer0/` and `/interop/` with an exact-path match:

| door | status | verdict |
|---|---|---|
| `/axis/accuracy.html` | 404 | our guess — the board publishes 34 axes and `accuracy` is not one of them |
| `/ask/`, `/talk/`, `/api/ask` | 404 | never named — the ask surface is the dashboard pane and `/api/chat` |
| `/plugins/` | 404 | never named by any published surface |
| `/interop/registry.json` | 404 | never named |
| `/.well-known/openai-plugin.json` | 404 | never named |
| `/api/evidence` | 404 | never named — `/api/evidence-bundle`, `/api/evidence-pack`, `/api/evidence/github` and `/api/evidence-intake` are named, and all four answer |
| `/api/catalog`, `/api/docket` | 404 | never named |

**The doors that answer oddly, answer honestly** — which is the estate's rule, not a defect:

| door | status | what it says |
|---|---|---|
| `/api/evidence-bundle` | 402 | a paid door refusing without payment — a declared state |
| `/api/rwa/evidence`, `/api/art50/marking-evidence` | 402 | the same |
| `/api/evidence-pack` | 200 | serves the pack |
| `/api/evidence/github` | 400 | "owner and repo are required" — it names what it needs |
| `/api/coverage-evidence` | 400 | names the required parameters |
| `POST /api/evidence-intake` | 503 | `WRITER_AUTH_UNAVAILABLE` — "No evidence-intake writer is configured; public browser persistence is unavailable", `measurement_state: UNMEASURED`, `writes_board: false` |

The intake door refusing with a reason, and publishing `UNMEASURED` rather than pretending to have
stored something, is the doctrine working.

---

## 3. The deploy, and why the live surface was stale for two days

`deploy.yml` failed on **every** master run from 2026-11-06T17:51Z, and the first real failure in each run
was the same pair of e2e assertions in `e2e/tests/dashboard-shell.spec.ts` (the rest of the job's failed
steps were cascade — the step-by-step verdicts show them `skipped`, not `failed`):

1. *"GSPC quests … never promote play into measurement"* — the assertion read the string "currently
   admitted ranking" inside a `dashboard-pane-play` pane. The pane no longer exists: the quests are
   `public/gspc-quests.html` with the copy in `client/src/components/lobby/play.ts`, which still says it
   "keeps historical board references separate from current admitted evidence" and "Your score stays in
   this browser; it is not training data or a GSPC measurement". "models are measured on" appears nowhere
   in `client/src`, so the promise the test guards still holds; the test was reading a UI the estate
   deliberately changed.
2. *"the home header carries a booking door to /assess/ within one click"* — `Header.tsx` renders that door
   only when `!homepage`; the homepage carries its own door inside the board panel. The test then fell
   through to clicking the **mobile** menu button in a desktop viewport and timed out.

**Both are now stated as the contract the code implements**, and the deploy is green: the last master run
(`64630b112`, 2026-11-08T22:30:17Z) completed `success`. Reproduced locally on current master — the four
assertions (2 × desktop, 2 × mobile) pass:

```
npx playwright test --config e2e/playwright.shell.config.ts -g "GSPC quests|booking door"
  4 passed (15.6s)
```

The estate's own `docs/operations/ALIGNMENT-PLAN-2026-11-03.md` §2 diagnosed and fixed the same pair
before this lane measured it. This record does not replace it; it confirms the fix from the outside, six
days later, and names what the window cost: **two days of master that never reached production.**

---

## 4. What this lane did NOT do, and why

- **It did not promote the CSP.** The precondition the header itself names — read the report over a real
  traffic window — cannot be met until a reporting destination exists (§1.1). Promoting blind is the white
  screen the file warns about.
- **It did not fix `meok.ai`'s headers.** That surface is not deployed from this repository (§1.2).
- **It did not write a second journey auditor.** The estate has one (issue #3843) whose script is not in the
  repository; this is a cross-check of the same rule, and the gap it exposes is the script's absence from
  the tree, not the rule.
- **It did not land the two stranded end-user lanes.** See the week plan, Track C.

## 5. Reproduce

```
python3 scripts/audit/published-surface-audit.py --json report.json
npx playwright test --config e2e/playwright.shell.config.ts -g "GSPC quests|booking door"
```

The door cross-check's probe list is in §2; it is a list of paths, not a rule, and anyone can re-run it
with `curl -o /dev/null -w '%{http_code}'`.
