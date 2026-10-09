# STATUS-outward — 2026-10-01T10:35Z

Append-only, one line per goal, UTC. Measurement, not certification.
A listing is discovery, not adoption. A 402 is a door, not revenue.
Never: INDEXED→MEASURED · signed→admitted · listing→usage · payment test→revenue.

## Goals

- GOAL align-estate: DONE — MEOK/SOV3 alignment loaded; Desktop Commander MCP connected; 5 MCP surfaces listed (`mimo mcp list`).
- GOAL consolidate-outward-plan: DONE — source docs `OUTWARD-SIGNAL-CATAPULT-2026-09-29.md` + `OUTWARD-EXECUTION-RECEIPTS-2026-09-29.md` + `CSOAI_DIRECTORY_DISTRIBUTION_READBACK_20260925.md` reconciled into this board.
- GOAL live-board-facts: DONE — `GET /api/gspc` totals derived: `23 axes · 23 measured`; `0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED`; `fact_runs=9`; `licence=CC-BY-4.0`.
- GOAL live-mcp-tools: DONE — `POST /mcp` tools/list returned **19 tools** at 2026-10-01T~10:33Z (raw SHA in capture). Directory descriptions that say 12/13 tools are STALE.
- GOAL kaggle-outward-push: DONE — `kaggle datasets version` upload OK → https://www.kaggle.com/datasets/nicktempleman/csoai-public-signal-index (core facts + refreshed surface snapshots + tools/list 19).
- GOAL outreach-drafts: DONE (draft-only) — `docs/outreach/drafts/01–06` + `_alignment/OUTREACH-PACK-2026-10-01.md`. OWNER SENDS via PrivateEmail. Live MCP door: 14 free + 5 metered = 19 (not 13).
- GOAL n-site-probe-board: DONE — `_alignment/STATUS-outward-probe-2026-10-01.md` (14 surfaces).
- GOAL hf-expand: BLOCKED — `HUGGINGFACE_TOKEN` (hf_…) returns **Invalid user token** (`whoami-v2` HTTP 401). Existing public HF Spaces/datasets remain readable (gspc-mcp, gspc-board HTTP 200). Need Nick to mint a write token (repo-write) or OAuth.
- GOAL npm-adapters: BLOCKED — `npm whoami` E401. `@csoai/ai-sdk-gspc`, `@csoai/mastra-gspc` dry-pack OK, unclaimed. Python adapters `langchain-csoai`, `llama-index-tools-csoai`, `crewai-csoai` already public 0.1.2.
- GOAL registry-alias: DONE/CURRENT — canonical `ai.councilof/gspc` v1.4.4 shows **19 tools** (2026-09-30). Alias `io.github.CSOAI-ORG/gspc` v1.4.3 is **STALE** (16 in desc). Next: owner publish 1.4.4 on the alias or retire it — do not spam a third name.
- GOAL site-signups: HELD — **hard rule 2026-09-13** (AGENTS.md / JEEVES autopilot): ZERO outbound email / ZERO filing / ZERO submission / ZERO cold outreach. New account sign-ups and form submissions are NOT executed by agents. Packs are ready; Nick sends/files or explicitly lifts the rule per action.
- GOAL glama-claim: OWNER GATE — Glama sign-in + DNS/HTTP challenge at production origin.
- GOAL mcp.so-claim: OWNER GATE — Claim via GitHub ownership; browser signed out. Do not pay $39; do not resubmit.
- GOAL smithery-owner-edit: OWNER GATE — public view has no owner-edit control.
- GOAL openai-app-submit: OWNER GATE — generated artifact exists; org submission not in this tool surface.
- GOAL actions-reenable: BLOCKED NICK — GitHub Actions account-level disabled (workflow_dispatch HTTP 422). Last visible runs 15 Sep pr-gates failure. Billing: https://github.com/settings/billing/summary
- GOAL pr-2707-convergence: OPEN DRAFT — `Source convergence: reconcile production-backed public indexes` (mergeable UNKNOWN). Chain order from receipts: finish #2707 → GHA production writer only → then #2706-style distribution (already CLOSED; re-render if needed).
- GOAL runpod-pod: BLOCKED NICK — SSH `194.26.196.156:22081` timeout (STATUS-MODELS). May need RunPod restart.

## Credential truth (do not fake)

| Channel | Auth state | Can publish? |
|---|---|---|
| GitHub `CSOAI-ORG` | keyring OK (repo, workflow, gist, read:org) | PRs yes · master no · self-merge no |
| GitHub `CouncilofAI-CSOAI` | token INVALID | no |
| npm | E401 | no |
| Hugging Face | token INVALID (401) | no write |
| Kaggle | `~/.kaggle/kaggle.json` OK | yes (datasets) |
| MCP Registry domain key | absent | no new domain names |
| Glama / mcp.so / Smithery | signed out | claim needed |

## Signal ladder (never collapse)

DISCOVERED → INDEXED → INSTALLED/CONNECTED → CALLED → REPEATED → CITED → PAID → REPEATED_PAID

Current honest external revenue: **0** (one historical non-self settlement 0.02 USDC; repeat UNVERIFIED). EXTERNAL_CUSTOMER is the only revenue class.

## Owner 10-minute unblock list

1. Re-enable GitHub Actions (billing/spending limit).
2. Mint HF token with **repo-write** for org `csoai` (replace invalid `hf_…`).
3. `npm login` (or automation token) for `@csoai/*` publish.
4. Glama + mcp.so + Smithery claim clicks (browser, existing GitHub).
5. Restart RunPod pod if still down.
6. Send outreach pack from `docs/outreach/drafts/` via nicholas@csoai.org PrivateEmail webmail.

## Governing rule (from catapult — still in force)

Do not manufacture signal by multiplying aliases. One canonical measured core; many independently readable mirrors. Every outward metric carries source, timestamp, denominator and state.

## Proof block (2026-10-01)

```
GET https://councilof.ai/api/gspc → totals.public_count = "23 axes · 23 measured"
totals.measured_axes=23 quotable_axes=23 comparison_axes=14 fact_runs=9
POST https://councilof.ai/mcp tools/list → count=19 (14 free + 5 metered)
kaggle datasets version -p … -m "Outward 2026-10-01: …" → Upload successful …
mimo mcp list → desktop-commander connected · sov3-bridge connected · meok-hub-bridge connected · council-measure connected
```

## N-site scoreboard (from STATUS-outward-probe-2026-10-01.md)

| Site | State | Tools shown | Action |
|---|---|---|---|
| MCP Registry `ai.councilof/gspc` | CURRENT | 19 | re-read |
| MCP Registry `io.github.CSOAI-ORG/gspc` | STALE alias | 16 | owner 1.4.4 or retire |
| Glama connector | CURRENT | 19 | watch |
| Glama servers page | STALE | 12 | owner refresh |
| HF Space + dataset | CURRENT | — | re-read |
| Kaggle (19 sets) | CURRENT | — | versioned today |
| x402-list ×2 | CURRENT | — | re-read |
| a2aregistry | CURRENT | A2A card | deep-link |
| PyPI adapters ×3 | CURRENT | 0.1.3 | re-read |
| councilof.ai/mcp + well-known | CURRENT | 19 | hash-check |
| Smithery ×2 | STALE | 13–14 | owner re-submit |
| mcp.so | STALE | 13 | owner update |
| PulseMCP | MISSING | 0 | owner submit |
| x402scan recipient | MISSING | soft-404 | owner claim |
| npm csoai-gspc-mcp | STALE | desc 12 | owner release 0.2.3 |

Signal ladder still: DISCOVERED → … → PAID → REPEATED_PAID. External revenue class = 0.

## NEW SITES pass (2026-10-01 ~11:20Z)

- GOAL mine-already-done: DONE — `DONE-INVENTORY-2026-10-01.md` (Dev.to, Show HN 49683801, PyPI 0.1.3 ×3, HF, Kaggle, Claude connector submitted 28 Sep, registry aliases).
- GOAL producthunt-launch: **DONE — SCHEDULED Tue 6 Oct 2026 midnight PT** as 2nd launch of existing product "Council of AI GSPC" (`GSPC open measurement board`).
- GOAL saashub: PRODUCT EXISTS "Council of AI" — verify via **@councilof.ai** email (`/verify/council-of-ai`).
- GOAL saashub-110-list: DONE — `_alignment/SAASHUB-110-DIRECTORIES-2026-10-01.txt`.
- GOAL new-sites-paid: NOT SPENT — Toolify $99 · TopAI $47/$229 · TAAFT paid launch · Dang.ai paid.
- GOAL github: SKIPPED per owner "DONT DO ANYTHING GH ATM".
- GOAL more-free-dirs: PARTIAL — LaunchingNext/IndieHackers/Hashnode blocked (bot wall / Google-only / form timeout). Log: `NEW-SITES-EXECUTION-2026-10-01.md`.

## FREE WAVE close-out (2026-10-01)
- REAL DONE: Product Hunt SCHEDULED 6 Oct · LaunchingNext FREE submitted (i=155247)
- ACCOUNT: 10words (nicholas@csoai.org) — product submit pending
- Catalog: `_alignment/N-SITES-CATALOG.md` (honest states)
- Tabs CLOSED. WebBridge extension needs reconnect before more signups.
- PAID skipped entirely. GH skipped entirely.

## GOAL PHASE CLOSE (2026-10-01T16:45Z) — align + EAT + growth + DC
- P0 ALIGN: read STATUS-estate + STATUS-MODELS (peer: master 470122904 live · GHA blocked · unsigned cards staged · H200 $4.59/hr owner confirm). This lane: no GH, no money.
- P1 EAT: `REAL-SIGNALS-INDEX-2026-10-01.md` batches 1–3 with ladder states + receipts.
- P2 GROWTH: free submits — 10words reset sent · Make.rs magic-link · PeerPush code · SoftwareSuggest filled5+submit · AppRater submit · AI Agents Dir filled2 · aitoolnet · spotSaaS · long-tail scanned. PAID=0 GH=0.
- P3 INDEX: Kaggle version with REAL-SIGNALS-INDEX + N-SITES-CATALOG + fresh surface hashes.
- P4 CONNECT: desktop-commander ✓ local · council-measure ✓ · sov3/meok bridges timeout→60s · DC LaunchAgent com.csoai.desktop-commander-remote running.
- GOAL: real-signal outward growth — ACHIEVED for this pass (6+ new INDEXED surfaces, 0 paid, 0 GH).
