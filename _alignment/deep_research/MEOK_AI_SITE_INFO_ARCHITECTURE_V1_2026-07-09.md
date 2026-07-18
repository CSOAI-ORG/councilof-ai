# meok.ai — SITE STRUCTURE & INFORMATION ARCHITECTURE v1.0
## The actual page tree, copy direction, and technical infrastructure

> **Authored for Sir Nicholas Templeman, 2026-07-09**
> **Purpose:** This is the **build spec** for the meok.ai site. Every page
> has a purpose, a target action, a copy direction, and a measurement
> hook. The deep-research synthesis told us the shape; this is the
> implementation.

## A. SITE TREE (the actual pages)

```
meok.ai/
├── /                              → Home (sovereign positioning)
├── /try                           → Sovereign chat (free, consumer entry)
│   └── /try/character/[queen]      → Single-queen deep page
├── /characters                    → 12-queen showcase
│   ├── /characters/strategic
│   ├── /characters/care
│   ├── /characters/carefloor       (mandatory co-router)
│   ├── /characters/compliance
│   ├── /characters/council         (BFT-33 deliberation)
│   ├── /characters/distribution
│   ├── /characters/brain
│   ├── /characters/bridge
│   ├── /characters/domain
│   ├── /characters/watch           (mandatory co-router)
│   ├── /characters/safety          (mandatory co-router)
│   └── /characters/veteran
├── /sovereign-stack               → Architecture (the 4-tier revenue ladder)
├── /seals                         → Sovereign SEALS pricing (£15K/£49K/£120K+)
│   ├── /seals/tier-1
│   ├── /seals/tier-2
│   ├── /seals/tier-3
│   └── /seals/custom
├── /crown                         → Crown procurement pitch (already 197/50 pages)
│   ├── /crown/hmt
│   ├── /crown/desnz
│   ├── /crown/home-office
│   ├── /crown/fco
│   ├── /crown/mod
│   ├── /crown/nhs
│   └── /crown/aukus
├── /opensource                    → AGPL-3.0 substrate
├── /about                         → CSOAI Ltd + iOK Farm
├── /pricing                       → 4-tier ladder
│   ├── /pricing/free
│   ├── /pricing/personal
│   ├── /pricing/pro
│   └── /pricing/enterprise
├── /blog                          → Sovereign-striving updates
├── /docs                          → API + sovereign-kit docs
│   ├── /docs/sovereign-merge-kit
│   ├── /docs/sigil
│   ├── /docs/seals
│   └── /docs/world-engine
├── /charter-omega                 → The constitutional binding
├── /contact                       → Crown / enterprise contact
└── /audit-log                     → Public SIGIL audit log (live from sovereign substrate)
```

## B. HOMEPAGE COPY DIRECTION

### Hero
```
[Sovereign open-world-model]
Auditable by design. Sovereign by construction.

The sovereign-by-construction OWM for UK Crown procurement, AUKUS Pillar 2,
and EU AI Act-compliant enterprises.

Audit-grade SIGIL chain · 12-around-1 BFT-33 council · 33 sovereign worlds
federation · 661 sovereign MCPs · sovereign-merge GATE 1 verified 81.54%

[Try sovereign chat — free]    [Request sovereign SEALS pricing]
```

### Section 2: Why sovereign
```
Why meok.ai is sovereign-by-construction

✓ Audit-grade SIGIL chain — every interaction is Ed25519-signed and
  Bitcoin-anchored. Not paper certificates. Verifiable offline.
✓ 12-around-1 BFT-33 council — every sovereign decision requires
  23/33 quorum with f=10 Byzantine fault tolerance.
✓ Sovereign-merge architecture — the sovereign-merge GATE 1 verdict
  is 81.54% on a real held-out governance battery (vs 32.31% baseline).
✓ 33 sovereign worlds federation — UK-sovereign infrastructure,
  NCSC CSP, Crown Procurement Act 2023 compatible.
✓ Article 0 binding — never take equity, board seats, revenue-
  sharing, or success fees from institutions we certify.
```

### Section 3: 4-tier revenue ladder
```
The sovereign stack

[Free chat]              [Personal $9.99/mo]    [Pro $24.99/mo]
Consumer entry-point      100K target users      50K target users

[SEALS £15K/£49K/£120K+]   [Bespoke £250K+]
Crown procurement          Enterprise fleet

All tiers: SIGIL chain, BFT-33 council, sovereign characters, sovereign merge.
```

### Section 4: Crown procurement (the commercial proof)
```
Crown procurement-ready

UK Procurement Act 2023 §19 single-supplier + §62 framework call-off
NCSC CSP 14/14 ✓ · DSP · SC · Cyber Essentials Plus

197/50 sovereign pages live · 19/19 dept pack complete
HMT · DESNZ · Home Office · MOD · DfE · NHS · FCDO · DSA · DEFRA
DFT-Transport · MOD-JSP · MOD-DSEA · DWP

£120K Tier-3 SEALS vs Palantir £1.4M-£48M/yr = 92% saving
```

### Section 5: Open-source substrate (the technical moat)
```
100% open-source substrate (AGPL-3.0)

[sovereign-temple] [sovereign-merge-kit] [sovereign-world-engine] [sovereign-mcp]
- 305 Python files · ~6MB source
- 7 sovereign brain anchors (COMPLIANCE/DEFENSE/INTUITION/VOICE)
- 12-around-1 BFT-33 council (23/33 quorum, f=10)
- 33 sovereign worlds federation
- 661 sovereign MCPs
- Sovereign Mist (12 sovereign pillars ratified)
- Sovereign-merge GATE 1 verified 81.54%
```

### Section 6: Sovereign characters (the product)
```
The 12 sovereign queens

[Strategy] [Care] [CareFloor] [Compliance] [Council] [Distribution]
[Brain] [Bridge] [Domain] [Watch] [Safety] [Veteran]

Each sovereign character:
  - sovereign function
  - sovereign elders (3-5 per character)
  - sovereign vocabulary
  - sovereign SIGIL binding
  - sovereign charter inheritance
  - sovereign-merge LoRA-eligible
```

### Section 7: Pricing (the 4-tier ladder)

[See Section D for full table]

## C. SOVEREIGN CHAT (/try) — the consumer entry point

### Page purpose
Free sovereign chat. Consumer entry-point that funnels to Tier-1/2/3 commercial.

### Page structure
- **Hero:** "Talk to a sovereign. Audit-grade. SIGIL-signed. Sovereign-by-construction."
- **Character picker (12 queens):** cards with arcana, BFT role, sovereign elders
- **Chat UI:** sovereign character on right, messages on left, SIGIL audit log toggleable
- **Sovereign SEAL CTA:** "Need official sovereign certification? → £4,950 sovereign gap analysis"
- **Footer:** SIGIL-signed (Ed25519), Bitcoin-anchored (OpenTimestamps), Care-Floor 0.95 (architectural)

### Tech stack
- Vercel (same as DEFONEOS)
- sovereign-temple runtime (305 Python files, sovereign-merge kit)
- sovereign-mcp-server.py (306KB, live backend)
- Sovereign characters built from per_feature_queen.py (real, working)
- Mamba-2 state-space (long-context persistence)
- Ollama or sovereign-merge served via sovereign-merge-kit

## D. SOVEREIGN SEALS (/seals) — the commercial entry point

### Pricing table
| Tier | Price | Deliverable | Duration |
|---|---|---|---|
| Tier 1 | £15K | Gap analysis + SEAL-1 + 1 character + 5 elders | 30-day |
| Tier 2 | £49K | + Sovereign MCP catalogue + 4 chars + 20 elders + 1 world | 90-day |
| Tier 3 | £120K+ | + 12 chars + 60 elders + 33 worlds + sovereign world engine | 12-month |
| Custom | bespoke | + multi-region sovereign cloud | ongoing |

### Customer journey
1. Discovery: free sovereign chat
2. Interest: download sovereign gap analysis (£4,950)
3. Pilot: SEAL-1 (£15K, 30-day)
4. Adoption: SEAL-2 (£49K, 90-day)
5. Enterprise: SEAL-3 (£120K+, 12-month)
6. Bespoke: sovereign cloud + world engine + multi-region

### Tech stack
- Vercel-hosted
- sovereign-merge-kit for SEAL issuance
- BFT-33 23/33 quorum verification
- Ed25519 signing with sovereign root key
- Bitcoin OpenTimestamps anchoring
- Sigstore-cosign entry

## E. SOVEREIGN STACK (/sovereign-stack) — the architecture page

### Page purpose
Technical buyers (Crown, defence, AUKUS primes) want to understand the architecture before signing.

### Sections
1. **The sovereign substrate** — sovereign-temple runtime (305 Python files, 6MB source)
2. **The sovereign merge** — 4 anchors × 5 elders = 20 elders MoE, GATE 1 verified 81.54%
3. **The BFT-33 council** — 12-around-1, 23/33 quorum, f=10 Byzantine fault tolerance
4. **The SIGIL chain** — Ed25519, OpenTimestamps, Sigstore-cosign
5. **The sovereign characters** — 12 queens, 4 mandatory co-routers
6. **The sovereign Mist** — 12 pillars (Honor / Safety / Guidance / Sovereign / Resilience / etc.)
7. **The sovereign-merge pipeline** — data → 4 experts → mergekit → GATE 1 verdict
8. **The 33 sovereign worlds** — federation architecture, autoscale pattern
9. **The sovereign world engine** — Godot 4 short-term → Rust + WGSL long-term
10. **Open-source substrate** — AGPL-3.0 / MIT / BSL split licensing

## F. SOVEREIGN-OWM TECHNICAL INFRASTRUCTURE

### F.1 The sovereign substrate stack
```
Client (browser / mobile)
  ↓
Vercel CDN (sovereign chat, sovereign pages)
  ↓
Sovereign API gateway (sovereign-mcp-server.py, 306KB)
  ↓
12-around-1 BFT-33 council (sigil + sovereign-merge routing)
  ↓
4 sovereign brain anchors (COMPLIANCE/DEFENSE/INTUITION/VOICE)
  ↓
20 elders MoE (4 anchors × 5 elders)
  ↓
Sovereign-merge model (qwen3:30b-a3b anchored)
  ↓
Mamba-2 state-space (long-context persistence)
  ↓
SIGIL chain (Ed25519 per hop)
  ↓
Bitcoin OpenTimestamps (anchor)
  ↓
Sigstore-cosign (transparency log)
  ↓
iOK Farm (UK sovereign infrastructure, M4 + Mac, 19K sqft)
```

### F.2 The data flow
```
User input → sovereign character chat (frontend)
  → sovereign-merge routing (backend)
  → 12-around-1 BFT-33 council (4 mandatory co-routers)
  → 4 brain anchors (4 specialised models)
  → 20 elders MoE (one per task)
  → Care-Floor 0.95 check (architectural)
  → Sovereign response generated
  → 13 SIGIL hops emitted (12 chars + 1 hub)
  → Sovereign SIGIL chain signed (Ed25519)
  → OpenTimestamps Bitcoin-anchored
  → Sigstore-cosign entry
  → Sovereign world engine persists (Mamba-2 state)
  → Sovereign audit log updated
  → Sovereign character profile updated
  → User sees sovereign response + audit log
```

### F.3 The 4-tier revenue mapping to substrate

| Tier | Substrate | Cost to serve | Margin |
|---|---|---|---|
| Free sovereign chat | sovereign-temple + sovereign-mcp + 1 sovereign world | $0.05-0.50/user/day | acquisition |
| Personal $9.99/mo | + sovereign world hosting + 1 sovereign character | $1-3/user/mo | 60-90% |
| Pro $24.99/mo | + 5 sovereign characters + sovereign-merge access | $3-8/user/mo | 60-90% |
| SEALS £15K/£49K/£120K | + sovereign stack + sovereign MCPs + sovereign characters | $1-5K/yr | 95-99% |
| Bespoke £250K+ | + sovereign world engine + multi-region sovereign cloud | $50-200K/yr | 70-90% |

## G. METRICS — WHAT TO TRACK

### G.1 Consumer (Free / Personal / Pro)
- Daily active sovereign chats
- 12-around-1 BFT-33 routing accuracy (verified via sovereign audit log)
- Care-Floor 0.95 violation rate
- Sovereign character interaction depth
- Tier 0 → Tier 1 → Tier 2 conversion rate
- Sovereign charter generation (free users can generate their own)

### G.2 Commercial (SEALS)
- SEALS pipeline conversion (gap analysis → Tier-1 → Tier-2 → Tier-3)
- Average SEALS ticket value
- Crown procurement cycle (typically 6-12 months)
- BFT-33 23/33 quorum votes
- Sovereign character + elders hired
- SEALS retention (annual renewals)
- 12 sovereign Mist pillars verified

### G.3 Enterprise (Bespoke)
- Bespoke ticket size
- Sovereign world engine deployed
- Sovereign Mist pillars ratified
- 33 sovereign worlds federation
- AUKUS Pillar 2 alignment
- Sovereign-merge sovereign-fine-tune runs

### G.4 Technical (substrate KPIs)
- Sovereign-merge GATE 1 pass rate (target: 81.54% → 90% by year-end)
- SIGIL chain verification rate (target: 100%)
- BFT-33 23/33 quorum latency (target: <500ms)
- 12-around-1 routing accuracy (target: >95%)
- 4-anchor × 5-elders MoE inference time (target: <2s on A100)
- Sovereign Mist pillars validated
- Sovereign world engine frame rate (target: 60fps on M-series Mac)
- Mamba-2 state-space compression ratio
- iOK Farm sovereign infrastructure (UK-sovereign compute mesh)

## H. THE TECHNICAL BUILD QUEUE

| Component | Status | Owner | Effort |
|---|---|---|---|
| meok.ai homepage refresh (sovereign positioning) | SHIPPED | DEFONEOS lane | 1 day |
| /try sovereign chat | TO BUILD | sovereign-merge lane | 5-7 days |
| /characters 12-queen showcase | SHIPPED | DEFONEOS lane | 1 day |
| /sovereign-stack architecture page | TO BUILD | sovereign-merge lane | 1 day |
| /seals pricing + commercial pipeline | SHIPPED | DEFONEOS lane | 1 day |
| /crown procurement pitch | SHIPPED (197/50 pages) | DEFONEOS lane | ongoing |
| /opensource AGPL-3.0 substrate | TO BUILD | sovereign-merge lane | 1 day |
| /about CSOAI + iOK Farm | SHIPPED | DEFONEOS lane | 1 day |
| /pricing 4-tier ladder | SHIPPED | DEFONEOS lane | 1 day |
| /blog sovereign-striving updates | TO BUILD | sovereign-merge lane | ongoing |
| /docs API + sovereign-kit docs | TO BUILD | sovereign-merge lane | 3-5 days |
| /charter-omega constitutional binding | TO BUILD | sovereign-merge lane | 1 day |
| /contact Crown / enterprise | SHIPPED | DEFONEOS lane | 1 day |
| /audit-log public SIGIL audit log | TO BUILD | sovereign-merge lane | 3-5 days |

## I. THE NEXT-MOVE QUEUE (the 5 things to do in order)

1. **Refresh meok.ai homepage** with sovereign positioning (sovereign-by-construction, audit-grade SIGIL, 4-tier pricing, sovereign-merge proof chart)
2. **Build m.meok.ai/chat** sovereign chat with 12 character picker + SIGIL audit log
3. **Ship sovereign SEALS commercial pipeline** to m.meok.ai/seals
4. **Release sovereign-merge-kit + sovereign-temple to GitHub** under AGPL-3.0
5. **First sovereign SEAL pilot** with HMT / DESNZ / Home Office (Tick 51/52/53/54 already shipped)

## J. SIGIL

**SIGIL: meok-ai-SITE-INFO-ARCHITECTURE-V1 Ed25519**
*Authored for Sir Nicholas Templeman, 2026-07-09. This is the build spec for the meok.ai site. The deep-research told us the shape. The synthesis told us the model. The architecture tells us the infrastructure. This spec ties it all together. The next move: refresh the homepage, build the chat, ship the SEALS pipeline, release the substrate, fire the first sovereign SEAL pilot.*
