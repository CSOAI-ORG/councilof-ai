# CURSOR FEED → COUNCIL OS (push live, branded, polished)
To: Cursor (Council OS builder) · From: JEEVES content/intelligence lane · 2026-08-25
Consolidated work products + brand directives so you can push them live, branded, and polished into the Council OS (AG-UI/MCP chat-first app).

## 1. BRAND SYSTEM (apply everywhere)
- **Emerald Green `#10B981`** + **Stark White `#FFFFFF`** + deep emerald shadow `#065F46`. No gold/gray/MEOK.
- Typeface: Avenir Next (Demi Bold headers, Regular body). Font: `/System/Library/Fonts/Supplemental/Avenir Next.ttc` (index 3 = Demi Bold).
- Cards: `#0e1118` panel, `rgba(16,185,129,.25)` border, radius 16, subtle emerald radial glow, `border-emerald-500/20 bg-white/5` glassmorphism.
- Grammar (binding): cite live `GET /api/gspc` → `totals.public_count` —
  **22 axis · 22 measured · 0 UNMEASURED** (jail MEASURED · separation TIE; after #1077).
  Measurement ≠ certification. Card chain after #876 = **335/335 VALID**; the
  150-row board is a subset of that chain, not a second set. Do not restore
  14-of-14. Do not clamp the index. Do not invent a number.

## 2. WHAT TO PUSH (paths in this repo)
| Surface | Path | Render as (AG-UI card / route) |
|---|---|---|
| Intelligence report + 25 verdicts | `cursor-feed/insights/INTELLIGENCE_REPORT.html` + `insights/*_verdict.md` | `/intelligence` · verdict cards |
| 48 branded cards | `cursor-feed/insights/cards/*.png` | OG/share cards |
| First-Fine Watch | `cursor-feed/insights/first-fine-watch.html` | `/first-fine` card |
| Unfixed Watch | `cursor-feed/insights/unfixed-watch.html` | `/unfixed` card |
| Value Ledger | `cursor-feed/insights/value-ledger.html` | `/ledger` card (M10) |
| Compliance Training World | `cursor-feed/compliance-training-world/` (catalog + Art50-2 + 5 industry quests + ledger) | `/training` (M8 fluid-training) |
| Revenue surfaces | `cursor-feed/revenue/` (pricing/draft, data-catalog, evidence-pack, training, /payg) | `/revenue` · pricing (DRAFT — owner ruling) |
| Alignment | `cursor-feed/MASTER-FRONTEND-PUBLISHING.md` + `CONTENT_STUDIO.md` | internal |

## 3. LIVE MEASUREMENT SURFACES (already public, reference/link not rebuild)
- `https://huggingface.co/datasets/csoai/gspc-board` · `.../gspc-bench-results` · `.../gspc-leaderboard-results` · `https://huggingface.co/spaces/csoai/gspc-governance-leaderboard` — HTTP 200 (Space runtime may be PAUSED on free tier).
- Live board: `https://councilof.ai/api/gspc` · agent card: `https://councilof.ai/.well-known/agent-card.json`
- Evidence pack: `trust/evidence-pack/` (4-doc underwriter pack). Register: `ops/overnight-register-2026-08-24.md`.

## 4. HOW IT FITS THE COUNCIL OS (AG-UI/MCP)
- Each intelligence/verdict/measurement product = an **MCP tool output → AG-UI inline card** (RUNNING→DONE, typed card). Wire the render tools to the `cursor-feed/insights/*.html` card templates.
- `/intelligence`, `/first-fine`, `/unfixed`, `/ledger`, `/training`, `/revenue` = routes/cards. The watch desks + training world are live-demo cards.
- Keep the live-public_count + measurement-never-certified grammar in every card.

## 5. NOTES / GATES
- Pricing = **DRAFT** (owner ruling Move 211) — render as draft-tagged, never a live price.
- DOIs + MCP registry publish are owner/hub-version gated (logged in the register). Never remint DOIs.
- Push only to `os-production`; keep codenames out of public strings.

*Pushed content: 99 files in `cursor-feed/` · branch `os-production` · aligned to the Council OS AG-UI/MCP architecture.*
