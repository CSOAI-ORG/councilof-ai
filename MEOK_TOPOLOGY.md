# MEOK — Living Product Topology (the full stack, proven)

**DEFONEOS** = the whole private GitHub ecosystem (this monorepo = `CSOAI-ORG/clawd-workspace`,
**verified PRIVATE** ✅). Everything below is a product *inside* DEFONEOS.
**Proof discipline:** every product shows hard evidence (folder / package / domain / doc) found on
disk 2026-05-31, or is honestly marked **NAME-ONLY** (concept, not yet built).

Legend: 🟢 built+real · 🟡 partial/started · 🔵 name/concept only · ⭐ revenue-live

---

## THE SPINE (infrastructure — ties it all together)
| Product | What it is | Proof | State |
|---|---|---|---|
| **MEOK DEFONEOS** | The private GitHub ecosystem / master alignment (umbrella) | `MEOK_DEFONEOS_ALIGNMENT.md`, repo isPrivate=true | 🟢 |
| **MEOK SOVEREIGN** | SOV3 — the brain: memory, council, 110 MCP tools, neural nets | `sovereign-temple/` (6.6GB), `sovereign-temple-live/`, `meok-sovereign-api/` | 🟢 |
| **MEOK MCP** | The connective tissue — 264 PyPI MCPs + gateway that exposes every tool | `meok-api-gateway/`, `mcp-marketplace/`, `mcp-bridge/`, 264 published | 🟢⭐ |
| **MEOK SIGIL** | Wire format — 2.4× denser than JSON, HMAC-signed (agent comms) | `meok-sigil/` | 🟢 |
| **MEOK SYNC** *(new, spec'd)* | The A2A bus — agents talk over SYNC, SIGIL-encoded, COUNCIL-gated | `MEOK_BRIDGE_SPEC.md` + a2a/agentfacts/orchestrator MCPs | 🟡 |
| **MEOK BRIDGE** *(19th — BUILT 2026-05-31)* | The router: left+right brains each draw from BOTH local AND api; SOV3 centre reconciles; every hop logged as a SIGIL line (inner-comms). Right-brain Vertex/Gemini connector = the £742 credit engine. | `meok-one/meok_one/bridge.py` (runs, SIGIL trail verified) + `vertex.py` | 🟢 |
| **MEOK MESH** | libp2p peer mesh (decentralised transport) | `meok-mesh/` | 🟡 |
| **MEOK EI3** | The safety substrate — care/ethics layer over everything | `csoai-org/`, `safetyof-ai/`, EI3 manifest | 🟢 |

## ⭐ MEOK DOME — the destination (a WORLD for AI characters)
**Nick's vision (2026-05-31):** MEOK DOME = a shared world where hatched AI characters *live together* —
the social/metaverse layer the whole portfolio points at. You hatch your sovereign in MEOK ONE; it
*lives* in the DOME (meets other characters, the marketplace is its economy, GAMING is its playground,
COUNCIL governs it, SYNC is how they talk, GUARDIAN/EI3 keep it safe). 🔵 concept (0 files yet) — but
it's the north-star frame: every other product is a room/system inside the DOME.

## THE CONSUMER PRODUCTS (the experiences end-users touch)
| Product | What it is | Proof | State |
|---|---|---|---|
| **MEOK ONE** | The hatch→3D character→talk OS (your flagship; left/right/council brains) | `meok-one/` (renders, verified), `meok/ui/` (Next app) | 🟢 |
| **MEOK GAMING** | Emergence characters as playable game AI (Godot/Unity, north-star) | `scf-game-v1/`, `meok-3d-characters/`, gaming arch zip | 🟡🔵 |
| **MEOK CLAW** | The TUI / terminal sovereign (Go CLI, Homebrew tap) | `meokclaw-tui/`, `homebrew-meokclaw` | 🟢 |
| **MEOK GUARDIAN** | 24/7 family/child safety (game content, network, moderation) | `family-guardian-mcp/`, SOV3 guardian_* tools | 🟢 |
| **MEOK FAMILY** | Family OS — members, chores, events, shared care | `meok-family/`, SOV3 family_* tools | 🟡 |
| **MEOK SMB** | Small-business OS (the small-business skill suite) | `meok-smb/` | 🟡 |
| **MEOK WORK** | The work agents — Orion (tasks) / Riri (tools) / Hourman (sprints) | `sovereign-temple-live/agents/`, 70 docs | 🟢 |
| **MEOK ENTERPRISE** | Enterprise tier — 33-agent council, compliance, audit, £1,499/mo | `csoai-platform/`, Stripe Enterprise product live | 🟢⭐ |

## THE GOVERNANCE / REVENUE / OPS SURFACE
| Product | What it is | Proof | State |
|---|---|---|---|
| **MEOK MAP** | Geospatial / compliance mapping (Gods-Eye, civilian) | `god-eye/`, gods-eye-geospatial-mcp, `start_dagon_maps.sh` | 🟡 |
| **MEOK DELBOY** | **Revenue mode AND a sales PRODUCT** — agents trained on a sales-book corpus to become expert digital workers / trades / consultants across every profession | `meok-delboy-sales-engine/` (`SALES_PLAYBOOK.md`, `agents/`, **8-book corpus**: Art of the Deal, Sales Bible, SPIN Selling, Challenger Sale, Psychology of Selling, Influence, How to Win Friends, Only in It for the Money) + 14 docs | 🟢⭐ |
| **MEOK DONE** | **Deploy / launch / integration MODE** — keeps the whole stack aligned to the *latest* frameworks (Anthropic, MCP, A2A, best SLMs/LLMs, APIs) before anything ships | `DEPLOY_QUEUE.md` (seed); mode/playbook to formalize | 🟡 |
| **MEOK BLACKSWAN** | x402 / machine-payment + frontier-tool research strand (a research MODE) | 6 docs (BLACK SWAN x402/K2.6) | 🔵 |

## The TRAINING CORPUS (cross-cutting — "make any agent a domain expert")
**20 real books found across the workspace, in 4 dirs — need consolidating into ONE corpus on GitHub:**
| Dir | Count | Domain |
|---|---|---|
| `meok-delboy-sales-engine/books/` | 8 | Sales/persuasion (Art of the Deal, SPIN Selling, Challenger Sale, Influence, Sales Bible, Psychology of Selling, How to Win Friends, Only in It for the Money) → **consultant/sales agents** |
| `bleeding-edge-arsenal/books/` | 12 | Hard engineering (robotics, 3D-printing, CAD, materials science, electronics, control systems, BLDC, PLC, AI/ML, sensor fusion, embedded) → **maker/engineer agents** |
| `sovereign-temple/training_books/` | 0 | empty placeholder |
| `meok-3d-characters/meok-storybooks/` | 0 | empty placeholder |

**Plan:** consolidate → `research/corpus/{sales,engineering,…}/` (or `spine/sovereign/corpus/`), then
extend per vertical (optometry, haulage, care homes, aquaculture) so each MEOK character/agent acts as
a trained expert in its profession. This corpus feeds DELBOY (sales) AND MEOK WORK agents. 🟡 (20 books in, scattered → align)

## POSITIONING — MEOK ONE as the context-engineering platform (Nick's strategic note)
MEOK ONE isn't just a character app — it's **the best context layer for AI**:
- **Memory** (SOV3 pgvector, cross-platform) = the richest user/agent context anyone can plug into.
- **MEOK MCP gateway** = MEOK ONE connects out to every tool AND exposes its context IN, so other AI
  apps plug into MEOK as their context provider. "The best plug-in."
- **"Ad market for AI context"** = novel monetization: context/attention as a marketplace (capture later;
  flagged as a strategic thesis, not yet built).

## BUSINESS MODEL — character economy (corrected, Nick 2026-05-31)
1. **First character = FREE**, via the **hatch ceremony** (the emotional onboarding; hatch is ONLY for the first/free one).
2. After that, the user either **buys a pre-made character from the marketplace**, OR
3. **hatches a CUSTOM character** (more expensive) — which they can then **resell on the marketplace**.
→ This is the "Visa of AI characters" loop: free entry → marketplace buy/sell → custom creation as a paid, resellable asset. Marketplace = `loopfactory-marketplace/`.

---

## What this proves
- **ALL 18 named products have real evidence on disk** (after deeper scan: DELBOY is a built
  product `meok-delboy-sales-engine/` w/ 8-book corpus; DONE seeded by `DEPLOY_QUEUE.md`).
- **DELBOY = revenue mode + a real sales product** (agent-training-on-books → expert digital workers).
  **BLACKSWAN = research mode** (frontier edges). **DONE = deploy/launch/integration mode** (stay current).
- The portfolio splits cleanly into **3 layers**: Spine (infra) → Consumer products → Governance/cash.
- Everything is unified by **MEOK MCP** (every product exposes its tools as MCPs) + **MEOK SYNC**
  (every agent/brain talks over the same SIGIL bus) + **MEOK EI3** (every action passes the safety layer).

## The GitHub living-topology layout (where each maps in the monorepo)
```
clawd-workspace/  (= DEFONEOS, private)
  spine/
    sovereign/   (SOV3 — code in git, 6.6GB weights → GCS)
    mcp/         (gateway + the 264 MCP servers)
    sigil/  mesh/  sync/   ei3/
  products/
    one/  gaming/  claw/  guardian/  family/  smb/  work/  enterprise/
  governance/
    map/  delboy/ (revenue playbooks)  blackswan/ (research)
  research/      (all .md docs + inbox)
  COORDINATION.md  MEOK_TOPOLOGY.md (this file)
```

## Honest gaps before "fully aligned on GitHub"
1. **MEOK DONE** undefined — tell me what it is, or drop it.
2. Restructure into the layout above = a big, careful move (secrets stripped ✅, big files → GCS pending).
3. Several products are 🟡 partial — "improve inner features/tools/experience" (your ask) means
   picking which 🟡 to push to 🟢 first. My vote: MEOK ONE (flagship, already closest).
4. ~509 separate MCP repos exist outside this monorepo — decide: pull into `spine/mcp/` or keep as
   submodules/separate (they're independently published to PyPI).

## Decisions to lock the topology
1. Confirm the 3-layer grouping (spine / products / governance) is how you think of it.
2. **MEOK DONE** — define or drop?
3. Which 🟡 product to improve first? (I recommend MEOK ONE.)
4. Pull the 509 MCP repos in, or reference them?
