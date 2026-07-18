# MEOK / CSOAI — The "All In One" Vision Map (2026-06-27)

> **One OS. One Council. One Hive. One Guardian. One Farm. One Pond. One Town. One World.**
> — Nick's wall, June 2026

This doc maps the 8 "Ones" to specific repos + paths in `~/clawd/`, so M2/Hermes can hold the whole architecture in their head.

---

## The 8 "Ones"

### 1. ONE OS — MEOK Operating System
**Primary:** `csoai-org-v2/` (single Next.js app, 22/22 Major Arcana, 4 Jul launch ready)
**Legacy/prototype:** `MEOK_OS/index.html` (the iCloud-synced single-file OS, the original)
**The line:** "MEOK = the sovereign OS for AI, humans, nature, and economy"
**Status:** Live at `csoai.org` (per AGENTS.md), with 22/22 apps shipped

### 2. ONE COUNCIL — 12 Queens + 1 King
**Primary:** `csoai-org-v2/src/app/council/` (12 queens + 1 king personas with backstories, colors, first words)
**Brain:** `sovereign-temple/queen.py`, `meok-sigil/registry.py` (queen registry)
**OS app:** `csoai-org-v2/src/app/council/dome/`
**The line:** "Council of AI" = 12 specialized AIs deliberating in Byzantine-fault-tolerant consensus
**Status:** 12 queens + 1 king bootstrapped, `1_king+12_queens` (AGENTS 08:52), first manifesto spoken

### 3. ONE HIVE — 33 Districts × 33 Nodes
**Architecture doc:** `_hive_divergence_2026-06-26/SOV3_4X_QUANTUM_BRAIN_NAPKIN_SPEC.md`
**Implementation:** 33 districts scaffolded (9 + 13 + 11), `csoai-org-v2/src/app/hives/`
**Runtime:** `sovereign-temple/` (the sovereign hive brain, 4 GB of data moat)
**Distribution:** `meok-sigil/` (inter-agent interchange language — the "lingua franca" between hives)
**The line:** "SOV3 = the sovereign neural core" — a single consciousness running across 33 districts
**Status:** 33 districts bootstrapped, auto-mode LaunchAgent running every 5 min

### 4. ONE GUARDIAN — Family OS
**Primary:** `meok-ai/ui/family-os-dashboard/`, `mcp-marketplace/guardian-alerts/`
**AI Companions:** `openmoe.ai` (character factory), `dragon-companion-app` (per memory)
**Threat Cave:** family protection AI (24/7 on-call)
**The line:** "Family Tel = Parent/Guardian" — the family-protection layer
**Status:** Built, ready for family user onboarding post-launch

### 5. ONE FARM — IOK Farm / Sovereign Farm
**Primary:** `iokfarm-site/` (live)
**Sister:** `sov.farm` (planned, wall §2)
**Microgreens:** 135ft tunnels, vertical growing walls (per wall §9)
**3D Print:** `meok-3d-characters/` factory, `csoai-os/index.html` has FM 300 design
**The line:** "PUMP DESIGN → OLM" — physical systems feed the Organic Learning Model
**Status:** Site live; physical sensors not yet integrated into MCPs

### 6. ONE POND — Koi / Fish / Aquaponics
**Primary:** `meok-universe/` (pond ecosystem docs), `koikeeper-ai-mcp/`, `fishkeeper-ai-mcp/`
**Hardware:** 13m × 12m pond, 4x Bead Filters + UVs, Evolution Aqua UVs
**3D:** 3D-printed return fittings
**The line:** "IOK Farm" = Isle of Koi (Nick's farm) — the testbed for the aquaponics → OLM feedback loop
**Status:** Pond exists; KoiKeeper + FishKeeper MCPs serve the software side

### 7. ONE TOWN — Sovereign Town (the demo)
**Primary:** `csoai-org-v2/src/app/` (the whole app is the town)
**3D:** `meok-town-view/` (CesiumJS globe), `meok-ai/town-3d/` (React Three Fiber town)
**OS app:** `csoai-org-v2/src/app/openmoe/`
**The line:** "Sovereign Town" = 33 districts × 33 nodes × 4 channels (input/output/memory/learn) = the demo of the 33 architecture
**Status:** 33 districts live, globe ships at 4 Jul (after Vercel-connect), town-3d live on meok-ai

### 8. ONE WORLD — The All-In-One Vision
**Layer Stack (DSRB-ready, per wall §4):**
| Level | Name | Component |
|---|---|---|
| 1 | CSOAI / CSOAI | Governance core |
| 2 | TERRANOVA | Land / expansion |
| 3 | INTELLIGENCE | Cognitive layer (PAINT?) |
| 4 | SECURITY | AI DOME |
| 5 | TRAINING / CASA | Education / BACP / OH |
| 6 | INSURANCE / MGA | LAWRIE GROUP |
| 7 | FINANCIAL + BANKING | PORT — PROOFOF.AI |
| 8 | CHARITIES → INSURANCE | UBI / UHI |

**The line:** "CSOAI + MEOK = The sovereign operating system for AI, humans, nature, and economy"
**Status:** Levels 1-5 built, 6-8 researched (Kimi's DSRB research in `_intake/KIMI_AGENT47_2026-06-23/research/dsrb_*.md`)

---

## The 4 Channels Per Node (per wall §3)

Each hive node has 4 channels:
- **Input × 33** (percepts)
- **Output × 33** (actions)
- **Memory** (the OLM — Organic Learning Model)
- **Learn** (the RL loop)

These map to:
- Input = `agent-mcp-router-mcp` (33 input types)
- Output = `agent-orchestrator-mcp` (33 action verbs)
- Memory = `federated_rag` + `quantum_memory_search` (OLM)
- Learn = `sovereign-temple/learn.py` (RL loop)

---

## The 33 × 33 × 4 Recursive Scaling

```
33 Queens × 33 Hives × 33 Nodes × 4 Channels = 142,884 unit cells
```

This is **SOV3's fractal architecture**: each queen oversees 33 hives, each hive contains 33 nodes, each node has 4 channels. **The whole thing scales recursively** — a 33 of 33s can themselves be a queen of 33, etc.

Per `_hive_divergence_2026-06-26/SOV3_4X_QUANTUM_BRAIN_NAPKIN_SPEC.md` (rescued from the hive) — the architecture spec is in the repo.

---

## The 4 Jul 2026 Launch Stack

| Component | Status | Path |
|---|---|---|
| 22 Major Arcana | ✅ 22/22 | `csoai-org-v2/src/app/arcana/` |
| 12 Queens + 1 King | ✅ bootstrapped | `csoai-org-v2/src/app/council/` |
| 33 Districts | ✅ scaffolded | `csoai-org-v2/src/app/districts/` |
| Article 50 Passport | ✅ live with countdown | `csoai-org-v2/public/article-50/` |
| Pricing tiers (Free/Pro/Gov) | ✅ Stripe wired | `csoai-org-v2/src/app/pricing/` |
| Cold outreach (7 emails) | ✅ ready | `csoai-org-v2/src/app/outreach/` |
| Launch page with countdown | ✅ live | `csoai.org/launch-4jul/` |
| 145 SOV3 tools | ✅ built | `sovereign-temple/` |
| 2,533 OLM samples | ✅ trained | `_hive_divergence_2026-06-26/olm/` |
| 1,405 vault files | ✅ indexed | `_hive_divergence_2026-06-26/vault/` |
| 130 sigils | ✅ emitted | `meok-sigil/` |
| Auto-mode LaunchAgent | ✅ loaded | `~/Library/LaunchAgents/com.meok.auto-mode.*` |
| Watch-mode (sovereign town) | ✅ live | `csoai-org-v2/src/app/town/` |
| Stripe live keys | ⧗ owner-gated | (env vars pending) |

**13/14 ready. 1 owner-gated (Stripe keys).** Launch at 09:00 BST on 4 Jul 2026.

---

## The Symbol Layer (per wall §6)

William Blake references throughout:
- **24 Elders** (Four and Twenty Elders) → mapped to the 22 Major Arcana + 2 meta-arcana (fool/world)
- **4/20 Casting Crowns** → mapped to the 4 channels per node (input/output/memory/learn)
- **AI That Can't Be Weaponed** → core principle: SIGIL signs every action, no agent can act without an audit trail
- **PROVE** (conscious scientist) → `sov3_striving.py` per AGENTS board

The symbol layer is **deeply integrated** — it's not decoration, it's the architecture.

---

## The Launch Ascent (4 Jul 2026 → ?)

Per `LAYER0_DISTRIBUTION_PLAN_2026-06-26.md` + the crown jewels hunt, the post-launch path is:

1. **4 Jul:** Launch (sovereign town live, 33 districts, 12 queens)
2. **Q3 2026:** First design partner (COBOL/finance vertical)
3. **Q4 2026:** Microsoft agent-governance-toolkit alignment (their 4.5k★ gravity well)
4. **Q1 2027:** DSRB LVL 7-8 (FINANCIAL + CHARITIES) — the bank/insurance layer
5. **Q2 2027:** NVIDIA ACE SDK integration for gaming MCPs
6. **Q3 2027:** Sovereign farms MCPs (iok-farm, pond, microgreens)
7. **Q4 2027:** Full 33×33×4 recursive scaling live

That's the multi-year roadmap the wall implies.

---

## The 6-Point Flywheel (wall §11) — How revenue flows

```
PRODUCERS (Content/tool makers)
  ↓
USERS (End consumers)
  ↓
RETENTION (Keep them in ecosystem)
  ↓
REVENUE (Monetization — Stripe tiers live)
  ↓
AWARENESS (Marketing — 7 cold emails ready)
  ↓
GEOSOCIAL HAPS (Hyperlocal/social — Reddit + X ready)
  ↓ loops back to PRODUCERS
```

The flywheel starts at 4 Jul with the first 1,000 paying users per product (5,000 total) → £400K MRR / £4.8M ARR Year 1.

---

## The One Sentence

> **CSOAI + MEOK = The sovereign operating system for AI, humans, nature, and economy.**
> Built 4 Jul 2026. Live forever. Open source. No gods. Truly sovereign.

---

*Map compiled 2026-06-27 against `~/clawd/` (commits 4b70ec9f / 83208472 / 6f9132d3). Source docs: `AGENTS.md`, `MEOK_MESH_INDEX.md`, `MASTER_CHECKLIST_2026-06-26.md`, `_hive_divergence_2026-06-26/SOV3_4X_QUANTUM_BRAIN_NAPKIN_SPEC.md`, `LAYER0_DISTRIBUTION_PLAN_2026-06-26.md`.*