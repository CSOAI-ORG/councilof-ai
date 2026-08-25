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
