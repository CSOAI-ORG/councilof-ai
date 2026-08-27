# Council OS harmonization plan — end-to-end 100/100

**Revision:** 2026-08-27 · Owner lane: Cursor · Repo: `CSOAI-ORG/councilof-ai` master

## North star

One glass workspace (Council Lobby overlay) where every demographic — regulator, insurer, enterprise, finance, platform — reaches the right product, simulation, or measurement surface without duplicate chrome, invented counts, or dead links.

## Architecture (what ships where)

| Shell | Route / trigger | Role |
|-------|-----------------|------|
| **Council Lobby** | `/?lobby=home` badge | Primary OS — board, verify, play, chat, GameBar |
| **/os** | Crawlable launcher | City, axis board, GameBar for SEO |
| **Council Space** | `/gspc-arena` | Arena, globe, towns, benchmarks |
| **Products** | `/products` | GPAI · CRA · INS · COBOL · RWA · MCP · ClaimGuard · registers |
| **Harness** | `harness/` on RunPod | Living measurement — not user-facing deploy |

## Phase 1 — UX unity (this PR)

- [x] Remove duplicate `CouncilConsole` floating badge (lobby only)
- [x] Mount `GameBar` in lobby Home; wire `markQuest("ask")` on composer send
- [x] Surface Compliance Training World (`public/compliance-training-world/`)
- [x] Play gallery: training world + Council Town cards
- [x] Expand `/products` with INS, regulators, ClaimGuard, XRPL, EUNOMIA registers
- [x] User-facing copy: "axes" → "axis" where it is marketing chrome (not API keys)
- [ ] Fix duplicate `/challenge` route (keep `ChallengeDoor` only) — done App.tsx

## Phase 2 — Products end-to-end

| Product | Route | Gate |
|---------|-------|------|
| GPAI | `/gpai-evidence` | Live copy from `/api/gspc` |
| INS | `/insurers` | `/api/evidence-pack` |
| COBOL | `/cobolbridge` | UNMEASURED honest |
| CRA | `/cra-readiness` | ENISA dates live |
| RWA / distribution | `/distribution-integrity` | financial axis JSON |
| XRPL | `/xrpl-attest` | interop attest run |
| EVM | `interop/evm-control-facts.json` | harness only until page ships |
| Regulators | `/regulator-findings` | R8-free API |
| ClaimGuard | `/claimguard` | open `products/claimguard` |
| GSPC MCP | `/mcp` | Worker 1.0.3 — **owner: CF_API_TOKEN** |

## Phase 3 — Council OS sims & games

| Item | Status | Next |
|------|--------|------|
| Coliseum | route | E2E visual pass |
| Academy | route | Link from training world |
| Compliance Training World | **shipped static** | React wrapper optional |
| Council Town | external iframe | Convex owner gate |
| Logic Duel / Swarm | in-build | Prolific + arena route |
| Games slate 2–6 | DESIGN | `council-os/GAMES_SLATE.md` |

## Phase 4 — Living measurement & MCP

1. **Harness** — `harness/arena/`, `harness/rwa-attest/`, `harness/owem/` on A100
2. **Open source** — publish `verify-card.mjs`, ClaimGuard, canon.py under MIT
3. **MCP** — registry 1.0.3 live; restore Worker runtime (owner CF token)
4. **ADR-001** — reconcile verify script vs live `22·15·7` board (owner)

## Phase 5 — Visual 100/100

- Playwright 5-device suite on lobby + products + arena
- Hydration check post-prerender (C-2026-0826-01)
- Single emerald/gold design system in `glass.ts`
- Demographics: unify `asks.ts`, `FOUR_BUYERS`, `LobbyHome` PEOPLE tiles

## Do not

- Remint DOIs · invent axis counts · join card_index storm
- Ship "certification" language · hide UNMEASURED
- Terminate RunPod pods · rapid-push GitHub Actions

## Verify before merge

```bash
npm run build:client
node scripts/check-prerender.mjs dist/client
# Manual: /, /os/, /products/, /?lobby=home, /compliance-training-world/catalog.html
```
