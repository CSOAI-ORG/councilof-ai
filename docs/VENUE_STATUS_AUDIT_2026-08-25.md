# Venue Status Audit — 2026-08-25 (Ralph round 2)

Objective #1/#4: set accurate statuses for venues already DONE; verify live
surfaces. Every status below was probed **from outside** on 2026-08-25 with real
HTTP GET (redirect-following). A status label is a claim; a claim needs evidence.

## 1. Real live-status spine (the "living-db")

The objective names `living-db/venue_engine.py`; that path does not exist in any
checkout. The canonical live-status spine is the **`CSOAI-ORG/council-os`** repo
(`~/clawd/council-os`), where **`ops/live_status_check.py` is the only writer of
LIVE** in `registry/spine.json` (JL.5 by construction).

**Audit executed** (`python3 ops/live_status_check.py`):
- Gold-bank, harness, board and public-face organs across all 14 GSPC axes were
  probed from outside and written with evidence.
- **Result: 56 organs LIVE, 0 GATED** (corrected from a false 14-GATED state).

**Checker defect fixed (this round):** `urllib` does not follow HTTP **308**
(Permanent Redirect). `https://councilof.ai/gspc` serves 308 → `/gspc-scoreboard`
(200), so the checker had falsely recorded the public-face organ as GATED
(`http: null`). `ops/live_status_check.py` now follows 308 and records the truth.

## 2. Verified LIVE venues (stranger-checkable)

| Venue | Surface | Result |
|---|---|---|
| Council of AI home | `https://councilof.ai/` | **200** |
| GSPC board API | `https://councilof.ai/api/gspc` | **200** |
| GSPC public page | `https://councilof.ai/gspc` → `/gspc-scoreboard` | **200** |
| GSPC board page | `https://councilof.ai/gspc-scoreboard` | **200** |
| HF dataset gold-bank (14 axes) | `huggingface.co/api/datasets/csoai/gspc-{gov,agi,prv,asi,mcp,oss,mach,care,xr,det,art5,swarm,affect,jail}` | **200** |
| HF dataset (board/DONE) | `huggingface.co/api/datasets/csoai/gspc-board` | **200** |
| HF dataset (bench DONE) | `.../datasets/csoai/gspc-bench-results` | **200** |
| HF dataset (leaderboard DONE) | `.../datasets/csoai/gspc-leaderboard-results` | **200** |
| HF space (leaderboard, first-of-niche) | `huggingface.co/api/spaces/csoai/gspc-governance-leaderboard-spc` | **200** |
| GitHub org repo set (public) | CSOAI-ORG/{councilof-ai, cibola, csoai-static-deploy2, csoai-governance, council-os} | **resolve (public)** |

## 3. Corrections to the prior audit (round 1)

- **HF space is LIVE, not 404.** The space `csoai/gspc-governance-leaderboard-spc`
  returns **200**. Round 1 reported it as 404/absent — that is corrected.
- **HF organisation profile does not exist.** `huggingface.co/api/orgs/csoai` and
  `.../orgs/CSOAI` both return **404**. Datasets and the space are live under the
  `csoai` namespace, but there is no organisation profile/org page.
- **GitHub org is live; org-metadata API is scope-gated.** Individual repos resolve
  publicly (org exists), but `gh api orgs/CSOAI-ORG` requires the `admin:org`
  scope (current token has repo, workflow, read:org, gist).

## 4. NOT-LIVE / gaps (recorded, not overclaimed)

- **HF organisation profile** — 404 (no org page). Owner action if an org profile is wanted.
- **`CSOAI-ORG/csoai-gspc-mcp`** — `gh api repos/...` returned 404 (private or absent). Flag for owner verification. The HANDOFF references it as "live in MCP registry"; the GitHub repo did not resolve for this token.
- **GSPC `specialist` organs** — remain `LANE-REPORTED` (measure pods host-evicted 2026-08-24; watchdog sweeping). The checker refuses to upgrade lane claims without public resolution.
- **GSPC `jail` separation** — `UNTESTED`; public grammar stays **13 measured of 14** (owner ruling).

## 5. Codename-clean sweep (public-bound content)

- New content produced this round (`deterministic-legal-metrology_verdict.md/.html`
  + 2 cards) is **codename-clean** — no sovos/sov6/sov33/owem/dorado/cibola/MEOK
  (verified by regex scan). Grammar: "signed · measured · sovereign", "measurement,
  never certification".
- **Not edited (deliberately):** `public/` pages flagged in the earlier sweep. The
  spine ban list and the monorepo brand (`dorado`, `cibola`) conflict — resolving
  it is a shared-lane brand decision, left to the owner. No public page was touched.

## 6. Owner-gated items (not auto-committed)

- **MCP publish** — `mcp-publisher validate server.json` now **PASSES** after the
  one-line fix (`repository.source` = `"github"`, not a URL, per
  `server.schema.json` definitions/Repository). `mcp-publisher login github` is
  **interactive device flow** (device code → browser authorize) → publish is
  **owner-gated**. The fix is applied in a clone and validated; it is not committed
  to the public repo or published.
- **HF org profile** creation — owner.
- **Pricing** — owner ruling (render draft, never a live price).

*Evidence recorded in `registry/spine.json` (authoritative live status) and this doc.*
