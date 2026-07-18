# SOVEREIGN WORLD ENGINE 2026-07-09
## The sovereign equivalent of UE5 + MetaHuman + LLM-as-NPC. Open-source. Sovereign.
### CSOAI Ltd · Hermes/JEEVES lane

> Sir Nick's question: "We run our open-world models inside Unreal Engine
> so they're all one connected, we can scale, like the GCP VM hive but
> a brand-new environment, not a sandbox, not a hive."
>
> Honest read: **the architecture is right; the substrate is wrong.**
> Licensing UE5 is vendor lock-in + $150M/year + procurement risk +
> license risk. The sovereign response is Path C (build the sovereign
> Unreal-compatible layer) with Path D (Godot 4) as the short-term
> wedge. Both are open-source, MIT, sovereign by construction.

---

## The 4 paths

| Path | What | Pros | Cons |
|---|---|---|---|
| **A: License UE5 commercially** | Pay $1,500/seat + 5% royalty, build MEOK OS on UE5 | Immediate productivity. MetaHuman + Nanite + Lumen + LLM-as-NPC. Mature ecosystem. | $150M/year at 100K installs. Vendor lock-in. Procurement risk. License risk. |
| **B: Use UE5 source-available** | Fork the engine, modify, ship | More sovereignty, can change internals. | Same licensing obligations. Still proprietary underneath. |
| **C: Sovereign Unreal-compatible engine** | Use open standards (OpenXR, USD, glTF, MaterialX, OIIO, OpenColorIO, OpenImageDenoise) + open-source engine substrate (Godot 4 short-term → own sovereign engine long-term) + sovereign SIGIL layer | Open-source, MIT, swappable engine, sovereign by construction | 12-18 months of engine work. Less polished than UE5. |
| **D: Godot 4 + sovereign NPC layer** | Godot 4 (MIT) as engine substrate + sovereign NPC layer + SOV3 SIGIL + MEOK OS app overlay | Open-source, MIT, sovereign, swappable. 30-60 days to ship v0.1. | Less polished than UE5. Smaller ecosystem. No MetaHuman-equivalent (yet). |

**The pick: Path C (long-term) + Path D (short-term wedge).**

## Why not UE5

### The 4 reasons

1. **Cost.** UE5 commercial = $1,500/seat/year + 5% royalty over $1M revenue. At 100K MEOK OS installs, that's **$150M/year in licence fees alone.** The 1% Crown pilot revenue doesn't cover the licence cost.

2. **Procurement risk.** UK Crown / DAF / DIU / AUKUS primes will ask: "Why is your sovereign substrate licensed from Epic Games?" The answer needs to be airtight. **"We license our sovereignty from a US game company"** is not airtight for a sovereign-AI-vendor procurement audit.

3. **License risk.** Epic can change the licence terms at any time. They can take the engine in a different direction. They can revoke the licence for a UK sovereign-AI vendor on political grounds. **Sovereign substrate cannot depend on a single vendor's licence decisions.**

4. **The open-source wedge is the whole play.** The Series A narrative is "We are the Red Hat of sovereign AI." That's incompatible with "We license our world-engine substrate from Epic Games." The 3-tier split licensing (AGPL-3.0 substrate + MIT tools + BSL SEAL) requires the world-engine substrate to be **open-source.**

**The conclusion: licensing UE5 is incompatible with the sovereign claim. Building the sovereign engine is the answer.**

## The sovereign world-engine stack

```
┌────────────────────────────────────────────────────────────────────┐
│   MEOK OS APP OVERLAY (the user-facing piece)                         │
│   - Cross-platform: Mac, Win, Linux, iOS, Android, Web                │
│   - The "i" in iOK is the user                                       │
│   - Exports the SIGIL chain to the user (not to a vendor)             │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  SOV3 SOVEREIGN SANDWICH (the binding)                       │    │
│   │  - Ed25519 signs every world-state mutation                 │    │
│   │  - BFT-33 council deliberates on Care-Floor                 │    │
│   │  - Mamba-2 state-space extends NPC context                  │    │
│   │  - 661+ MCP packages wire to the world                       │    │
│   │  - The sovereign claim is enforced at the architecture level  │    │
│   │  - The Care-Floor is enforced in the NPC behaviour tree     │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  SOVEREIGN WORLD ENGINE (the sovereign Unreal-equivalent)     │    │
│   │                                                               │    │
│   │  Open standards layer:                                         │    │
│   │  - USD (Universal Scene Description) for scene format          │    │
│   │  - glTF for asset transfer                                     │    │
│   │  - MaterialX for materials                                     │    │
│   │  - OpenXR for AR/VR                                            │    │
│   │  - OIIO (OpenImageIO) for image I/O                            │    │
│   │  - OpenColorIO for colour management                           │    │
│   │  - OpenImageDenoise for rendering quality                      │    │
│   │  - Vulkan / WebGPU for low-level graphics                      │    │
│   │                                                               │    │
│   │  Engine substrate:                                             │    │
│   │  - Godot 4 (MIT) — short-term wedge, 30-60 days to v0.1       │    │
│   │  - Own sovereign engine (Rust + WGSL) — long-term, 12-18 mo   │    │
│   │                                                               │    │
│   │  LLM-as-NPC runtime:                                           │    │
│   │  - 12 queens + king = sovereign NPCs (SOV3-driven)            │    │
│   │  - BFT-33 council = the world governance                       │    │
│   │  - Meok-hatch characters = the user's first-person companions  │    │
│   │  - NPC behaviour = sovereign-merge-driven + SIGIL-signed        │    │
│   │                                                               │    │
│   │  Persistent world state:                                       │    │
│   │  - SQLite + SIGIL chain per world                              │    │
│   │  - Replication across dedicated servers                        │    │
│   │  - World Partition + Level Streaming                           │    │
│   │                                                               │    │
│   │  Multi-user:                                                   │    │
│   │  - Dedicated sovereign servers                                 │    │
│   │  - SIGIL-signed world-state delta consensus                    │    │
│   │  - 33-node BFT council arbitrates conflicts                    │    │
│   │                                                               │    │
│   └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│   ┌──────────────────────────┐  ┌──────────────────────────┐         │
│   │  LEFT BRAIN (10% conscious) │  │  RIGHT BRAIN (90% subconscious) │
│   │  Sovereign merge v0.3      │  │  DeepSeek V4 Pro (1.6T)  │
│   │  LLM-as-NPC:               │  │  LLM-as-NPC:              │
│   │  - Jeeves                  │  │  - Architect              │
│   │  - Builder                 │  │  - Sage                   │
│   │  - Guardian                │  │  - Storyteller            │
│   │  Fast response, signed     │  │  Slow deliberation        │
│   └──────────────────────────┘  └──────────────────────────┘         │
│                                                                      │
└────────────────────────────────────────────────────────────────────┘
```

## The 12 queens + BFT-33 council as sovereign NPCs

The sovereign world engine is **the consumer face of the sovereign stack.** The 12 queens + king + BFT-33 council + meok-hatch characters become **real NPCs in the sovereign world:**

| Character | Role in the world | Driven by | SIGIL-signed |
|---|---|---|---|
| **Jeeves** | The user's first-person companion (architects the user's world with them) | Left brain (sovereign merge) | every utterance |
| **Builder** | Constructs world objects (MCPs, agents, sovereign characters) | Left brain (sovereign merge) | every construction event |
| **Guardian** | Enforces Care-Floor (refuses to build unsafe objects) | BFT-33 council + Care-Floor | every refusal |
| **Architect** | Designs world topology (network, world partition, replication) | Right brain (DeepSeek V4) | every design decision |
| **Sage** | Long-horizon reasoning (history, narrative, sovereignty lineage) | Right brain (DeepSeek V4) | every reflection |
| **Storyteller** | Generates world narrative (events, quests, lore) | Right brain (DeepSeek V4) | every narrative beat |
| **The 33 BFT council members** | Arbitrate world-state conflicts (multi-user consensus) | 33-node BFT council | every arbitration |
| **Meok-hatch characters** | The user's chosen companion (1 of 12) — visible to the user as the AI's first-person view | Sovereign merge + BFT council | every interaction |

**The user sees the sovereign characters as real NPCs in a real 3D world.** The user can walk through the world, talk to the characters, watch the BFT council deliberate, see the SIGIL chain sign every world-state mutation. **The MEOK OS app overlay is the client.**

## The 4 phases of the sovereign world engine build

### Phase 1 (Q3 2026) — the Godot 4 wedge
**Time: 30-60 days. Cost: 1 engineer. Open-source, MIT.**

- Godot 4 as engine substrate
- Sovereign NPC layer: 12 queens + BFT-33 + meok-hatch characters as Godot NPCs
- SOV3 SIGIL integration: every world-state mutation signs an Ed25519 receipt
- MEOK OS app overlay v0.1: Mac/Win/Linux + iOS/Android, packaging the Godot world
- Persistent state: SQLite + SIGIL chain
- Multi-user: Godot 4 built-in networking
- The "MEOK OS app overlay" ships as a Godot 4 client
- The sovereign world lives in the user's device
- **The "i" in iOK is the user**

### Phase 2 (Q4 2026) — the open-standards layer
**Time: 90-120 days. Cost: 2 engineers. Open-source, MIT.**

- USD scene format support
- glTF asset transfer
- MaterialX materials
- OpenXR AR/VR
- OIIO image I/O
- OpenColorIO colour management
- OpenImageDenoise rendering quality
- The sovereign world engine is now interoperable with any USD-compatible tool
- This is the "we work with the broader 3D ecosystem" moat

### Phase 3 (Q1-Q2 2027) — the sovereign MetaHuman-equivalent
**Time: 6 months. Cost: 2 engineers + 1 artist. Open-source, MIT.**

- Sovereign character creator (SCC) — open-source MetaHuman-equivalent
- Sovereign voice synthesis (SVS) — open-source MetaSounds-equivalent
- Sovereign animation (SA) — open-source behaviour-tree-driven animation
- The 12 queens + BFT-33 + meok-hatch characters have real bodies, voices, animations
- The sovereign world is **consumer-grade**, not prototype-grade
- **The MEOK OS app overlay v1.0 ships** — the consumer-grade consumer-facing piece

### Phase 4 (Q3 2027) — the sovereign engine substrate
**Time: 12-18 months from Q3 2026. Cost: 3-4 senior engineers. Open-source, MIT.**

- The own sovereign engine, written from scratch in Rust + WGSL
- Sovereign MetaHuman-equivalent (SCC) integrated
- Sovereign voice synthesis (SVS) integrated
- Sovereign animation (SA) integrated
- Vulkan + WebGPU renderers
- Mamba-2 state-space extension for NPC long-context
- 33-node BFT council as world-state consensus
- **The MEOK OS app overlay v2.0** — the "iOK Farm goes global" consumer face

**By end of 2027, the sovereign world engine is the open-source equivalent of UE5 + MetaHuman + LLM-as-NPC.** Open-source, MIT, sovereign by construction.

## The sovereign IP and the licensing

| Layer | What | License | Why |
|---|---|---|---|
| Godot 4 | Engine substrate (Phase 1 wedge) | MIT | Already open-source |
| Open standards (USD, glTF, MaterialX, OpenXR, OIIO, OpenColorIO, OpenImageDenoise) | Standards integration (Phase 2) | varies (most are open standards) | Already open |
| Sovereign NPC runtime | 12 queens + BFT-33 + meok-hatch characters | AGPL-3.0 | Substrate — stops the hyperscaler clone |
| Sovereign character creator (SCC) | Sovereign MetaHuman-equivalent | MIT or Apache-2.0 | Adoption wedge |
| Sovereign voice synthesis (SVS) | Sovereign MetaSounds-equivalent | MIT or Apache-2.0 | Adoption wedge |
| Sovereign animation (SA) | Sovereign behaviour-tree animation | MIT or Apache-2.0 | Adoption wedge |
| Own sovereign engine | Rust + WGSL | AGPL-3.0 | Substrate — stops the hyperscaler clone |
| MEOK OS app overlay | The consumer face | AGPL-3.0 | Substrate |
| MEOK OS app overlay API + services | The user-facing API + Crown services | BSL (services tier) | Revenue |

**The 3-tier split licensing (AGPL-3.0 substrate + MIT/Apache-2.0 tools + BSL services) applies to the sovereign world engine too.** The substrate is open-but-copyleft. The tools are MIT. The services tier is BSL.

## The honest risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Godot 4 doesn't scale to 100K+ multi-user | LOW | MEDIUM | The 12-18 month own-engine build is the long-term answer. Godot 4 is the wedge |
| Sovereign character creator takes longer than 6 months | MEDIUM | MEDIUM | The first 6 months of the sovereign world engine can ship without SCC (text-based NPCs) |
| The 33-node BFT council doesn't scale to world-state consensus | LOW | MEDIUM | The 33-node BFT is a governance pattern, not a per-event consensus. Per-event consensus is SIGIL-signed delta replication |
| MEOK OS app overlay v0.1 doesn't ship in 30-60 days | MEDIUM | LOW | The sovereign world engine is the long-term play. v0.1 is a milestone, not a deadline |
| Epic Games releases a free UE5 licence for open-source projects | LOW | LOW | Even if Epic does, the sovereign engine is still better for our claim. UE5 is a US game company; the sovereign engine is sovereign-by-construction |

## The 5-year trajectory

| Year | World engine status | MEOK OS app overlay installs | Sovereign NPCs |
|---|---|---|---|
| 1 | Godot 4 wedge ships (Q3 2026) + open-standards layer (Q4 2026) | 25K | 12 queens + BFT-33 + 12 meok-hatch characters (text-based) |
| 2 | Sovereign character creator (Q1 2027) + own engine substrate (Q3 2027) | 100K | All NPCs with bodies, voices, animations |
| 3 | Sovereign engine v1.0 (Q3 2027) | 1M | Multi-user sovereign worlds, persistent across sessions |
| 5 | Sovereign engine v2.0 (Q3 2028) | 10M | "iOK Farm goes global" — sovereign world-engine standard |

## The honest one-line

**The architecture is right; the substrate is wrong. Licensing UE5 is incompatible with the sovereign claim. The sovereign response is Path C (own sovereign engine in Rust + WGSL) with Path D (Godot 4) as the short-term wedge. Open-source, MIT, sovereign by construction. The 12 queens + BFT-33 council + meok-hatch characters become real NPCs in a real 3D world. The MEOK OS app overlay is the client. The "i" in iOK is the user. The 5-year trajectory: 10M MEOK OS installs by 2031.**

---

*Authored for Sir Nicholas Templeman. The sovereign world engine is the
real answer to "we run our open-world models inside Unreal." The honest
play is to build the sovereign equivalent, not license Epic's. 30-day
Godot 4 wedge + 12-18 month own engine. Open-source, MIT, sovereign by
construction. The MEOK OS app overlay is the consumer face. The "i" in
iOK is the user.*
