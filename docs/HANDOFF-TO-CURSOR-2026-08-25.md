# Cursor Handoff — EUNOMIA/CSOAI measurement product → Council OS (2026-08-25)

*For the Cursor lane: everything below is built + verified live. Push it branded + polished into Council OS.*

## What is live NOW (verified HTTP 200)
| Surface | URL | What it is |
|---|---|---|
| EUNOMIA board | https://councilof.ai/eunomia | 10 financial-verification axes, 2-tier signed scores |
| First-Fine Watch | https://councilof.ai/first-fine-watch | R8-free signed counter + enforcement record + deadline calendar |
| EUNOMIA data | https://councilof.ai/eunomia-data | commercial x402 data rail (data-only, never scores) |
| Sectors | https://councilof.ai/sectors | white-label sector tiles (regulator/insurer/bond/cobol/vendor) |
| Registers | https://councilof.ai/registers | signed financial-axis register (CAT F6, stranger re-derivable) |
| HF gspc-board | https://huggingface.co/datasets/csoai/gspc-board | signed board dataset |
| HF gspc-bench-results | https://huggingface.co/datasets/csoai/gspc-bench-results | bench rows dataset |
| HF governance leaderboard | https://huggingface.co/spaces/csoai/gspc-governance-leaderboard | first-of-niche static leaderboard |
| A2A agent card | https://councilof.ai/.well-known/agent-card.json | A2A v1.0 card (JSON-RPC @ /mcp) |
| APIs | /api/eunomia-data · /api/registers | commercial data + register |

## The toolkit (in monorepo `main`)
`eu_ai_act_crosswalk` · `enforcement_corpus` (signed) · `x402_gate` (data-only) · `sector_tiles` · `claimguard` (publish gate) · `mcp_server` (R8/white-label) · `eat_chain` · `gspc_six_axis_e2e` · `sign_result` · `run_eunomia_axis` · `generate_eunomia_items`, + `trust/evidence-pack/` (4-doc underwriter set, ClaimGuard-green) + `ops/overnight-register-2026-08-24` (30 moves).

## What Cursor should do (push live, branded, polished)
1. **Brand + polish** the 5 councilof.ai pages (`/eunomia`, `/first-fine-watch`, `/eunomia-data`, `/sectors`, `/registers`) — they're functional, HTML-styled; apply the Council OS theme/branding pass.
2. **Wire into Council OS nav** — the 4 surfaces already added to the Measure menu (did: verify the newest `/registers` route is in the nav).
3. **E2E after polish** — run the 5-device Playwright suite on the polished pages.
4. **Add the HF datasets/Space + A2A card** to the Council OS "ecosystem" surfaces (catalog/partners links).

## Canon (binding — do not break)
Scores never sold · regulators free forever (R8) · no token · ClaimGuard gates every public claim · codenames never public · white-label (they brand it, we sign it; signer fixed `did:web:csoai.org#estate-chain-1`) · measurement ≠ certification.

## Owner-gated (Nick — not Cursor-executable)
A100 console restart (measurement volume) · HF DOIs (web-UI) · MCP publish (GitHub OAuth) · a2aagentlist/artinet web-forms · AIUC-1/Armilla/aiSure/Testudo outreach (drafts staged).

---

# ADDENDUM — White-label Regulator Tooling (the "hand them a working GSPC e2e" pivot)

*Built + verified live by the measurement lane. Feed to Cursor to push branded + polished into Council OS alongside the EUNOMIA surfaces above.*

## Live now (verified HTTP 200, canonical build)
| Surface | URL | What it is |
|---|---|---|
| Regulator findings | `/api/regulator-findings?deployment=X` | grades every EU AI Act obligation from the signed GSPC board + penalty tier |
| Article-granularity | `/api/regulator-findings?by=article` | EU AI Act Articles 4-55, worst measured gap per article + fine exposure |
| Sector filter | `/api/regulator-findings?sector=insurance\|bond\|cobol` | maps measured axes to that sector's frameworks (Solvency II/ESMA/AUKUS) |
| Challenge door | `/challenge` + `POST /api/challenge` | measured-subject redress — signed receipt, resolution feeds Value Ledger |
| Arena scoreboard | `/api/arena/scoreboard?verify=1` | the differentiator — recompute content_id, `match:true\|false` |
| Evidence pack | `/api/evidence-pack` | the 4-class underwriter/regulator evidence set |

## The toolkit (in monorepo `main`)
`harness/regulator/` — `eu_ai_act_findings.py` · `article_findings.py` · `sector_findings.py` · `eu_ai_act_article_map.json` · `functions/api/regulator-findings.ts` · `functions/api/challenge.ts` · `harness/arena/` (elo.py, canon.py, axis_arena.py, publish_scoreboard.py, eat_compliance_board.py) · `public/signed/*.json` (signed boards).

## What Cursor should do (align with Claude's Compass AG-UI/MCP architecture)
1. **Brand + polish** `/challenge` (redress form) and `/regulator-findings` — the findings **page is now built** (PR #633, axis/article/sector modes). Apply the Council OS theme/branding pass + extend the 5-device E2E to both.
2. **Render as AG-UI cards** (per Claude's Compass §1/§4): wire `regulator-findings` + `challenge` + `scoreboard` as MCP tools served over AG-UI so each returns a typed React card (Running → Done) inline in Council OS chat — the "hand them a working tool" becomes a chat card.
3. **Add to Council OS Measure nav**: `/regulator-findings`, `/challenge`, and the EUNOMIA surfaces (`/registers`, `/sectors`) into the menu.
4. **E2E after polish** — extend the 5-device Playwright suite to the new surfaces.

## Canon (binding — do not break)
Same as above, plus: **regulators get the signed stream FREE forever** (R8) · the verify path (`?verify=1` recompute) is the differentiator — keep it prominent, never bury it · UNMEASURED axes/rows render as `insufficient to rank`, never a 0 · white-label = they brand it, we sign it (signer fixed `did:web:csoai.org#card-attestation-1` for the arena boards).

