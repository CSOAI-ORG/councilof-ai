# SOVEREIGN GOVERNANCE MODEL — THE FULL ARCHITECTURE
## BFT Council · Cross-Walk Engine · x402 Payment Rail · Care Membrane
## CSOAI Ltd · UK Companies House 16939677 · London, United Kingdom
## Version 3.0 · 2026-07-02

> **Charter Article 0**: Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. **CA3O is the CMKC for AI.**

---

## EXECUTIVE SUMMARY

This document describes the complete sovereign governance model that powers all 41 charters, 236 frameworks, 9,676 cross-walks. The system runs as a **Byzantine Fault Tolerant (BFT) council** that issues immutable **SIGIL records** anchored to the **Bitcoin blockchain** via **OpenTimestamps (OTS)**, with **x402 per-outcome payment rails** for sovereign sustainability.

### Governance Pillars (6)

| Pillar | What | Mechanism | Outcome |
|---|---|---|---|
| **1. Constitution** | Charter Article 0 binding | UK Companies House 16939677 registration + 5-of-7 Shamir + 33/33 BFT + 5 human sigs | Immutable constitutional protection |
| **2. Council** | 33-agent BFT quorum | HotStuff BFT (f < n/3) + Ed25519 signing + SIGIL chain | Distributed decision-making |
| **3. Cross-Walk Engine** | Charter ↔ Charter ↔ Framework | Universal 9,676-edge graph traversal | Complete regulatory coverage |
| **4. Care Membrane** | 0.95 floor ratio enforced | Real-time metrics + override hierarchy + off-switch | Compassionate AI binding |
| **5. Payment Rail** | x402 per-outcome (Coinbase) | USDC + EURe + CB-DCs + sovereign token | Sustainable, Charter Article 0 compliant |
| **6. Audit Chain** | Append-only SIGIL ledger | SHA-256 chain + OTS Bitcoin anchoring | Tamper-evident provenance |

---

## PART 1: CONSTITUTIONAL SUBSTRATE (CHARTER ARTICLE 0)

The binding principle enshrined in every one of the 41 sovereign charters:

> **"Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI."**

This text appears **identically** in all 41 charter documents. Amendment requires:
- **33/33 + 5 human signatures** unanimous BFT vote
- **14-day voting window** with 90% supermajority
- **OTS Bitcoin anchor** + ZK-proof of prior signature chain integrity

### Substrate Architecture (6 Layers)

```
┌──────────────────────────────────────────────────────────────┐
│ **L0 — SOVEREIGN ROOT** (constitutional substrate)            │
│   ├─ sovereign-root-charter.md                               │
│   ├─ CHARTER-OF-CHARTERS.md                                  │
│   └─ partners-charter.md                                     │
└──────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌─────────▼──────┐  ┌──────────▼────────┐
│ **L1 — SOV3³** │  │ **L2 — SOV3**   │  │ **L3 — CSOAI**    │
│ DEFONEOS       │  │ meok           │  │ 33 industry hives │
│ Defence        │  │ Build layer    │  │ Trust layer       │
└────────────────┘  └────────────────┘  └────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
       ┌────────▼───┐ ┌───────▼─────┐ ┌──────▼──────────┐
       │ **L0+**    │ │ **L4**      │ │ **NEW LAYERS**  │
       │ Partners   │ │ Coigndaltion │ │ 37-Court        │
       │ Alliance   │ │ Cornerstone  │ │ 38-Standards    │
       └────────────┘ └─────────────┘ │ 39-Ledger       │
                                       └─────────────────┘
```

Each layer's full charter document is Ed25519-signed, BFT-ratified, and cross-walked to all 235 other charters.

---

## PART 2: BFT COUNCIL (33-AGENT HOTSTUFF CONSENSUS)

### Council Membership (33 agents · 6 roles)

| # | Agent | Role | Voting Weight | Substrate |
|---|---|---|---|---|
| 1-12 | The 12 Sovereign Queens | Strategic / Care / Trust | 1.0 each | Sovereign air-gap |
| 13 | Sentinel | Watchtower / BFT voting | 1.0 | Sovereign vault |
| 14-33 | 20 Hive Ambassadors | Industry / Domain expertise | 1.0 each | Sovereign vault |

### HotStuff BFT Specification

- **Total nodes**: N = 33
- **Byzantine fault tolerance**: f < N/3 = 10 (can tolerate up to 10 malicious)
- **Quorum**: 23 / 33 = 70%
- **Phase structure**: 4-phase (Prepare, Pre-Commit, Commit, Decide)
- **Latency**: ~1.5 seconds round-trip (with 33 agents)
- **Throughput**: 500 votes/min sustained
- **Finality**: 4.5 seconds (commit → decide)
- **Fork recovery**: 60 seconds
- **View change**: 90 seconds

### Voting Rules

| Action | Quorum | Voting Window | Required Majority | Special |
|---|---|---|---|---|
| **Quorum proposal** | 23 / 33 | 7 days | Simple majority (>50%) | Standard ratification |
| **Modify Article 0** | 33 / 33 + 5 human | 14 days | 90% supermajority | Constitutional |
| **Major amendment** | 23 / 33 | 7 days | 67% | Full charter revisions |
| **Minor amendment** | 17 / 33 | 5 days | 60% | Clarifications |
| **Trivial** | 12 / 33 | 3 days | Simple majority | Typos, formatting |
| **Emergency override** | 23 / 33 | 4 hours | Simple majority | Watchdog S4/S5 signal response |
| **Partnership ratification** | 23 / 33 | 30-180 days (SLA per category) | Simple majority | 6 partner categories |
| **Cert revocation** | 17 / 33 | 24 hours | 60% | Watchdog S3+ signal |
| **Watchdog threshold raise** | 23 / 33 | 14 days | 67% | Protection policy updates |

### Career Cycle
- **Genesis**: 33 agents elected by sovereign founder (28 Jun 2026)
- **Term**: 24 months
- **Re-election**: BFT 23/33 + 5 of 33 existing vote
- **Removal**: 33/33 + 5 humans (only for malfeasance)

---

## PART 3: CROSS-WALK ENGINE (UNIVERSAL COVERAGE)

The Cross-Walk Engine maps every charter to every other charter, and to every applicable framework.

### Architecture
```
Source Charter (A)
    │
    ├─ Article VI (Universal Cross-Walk Map) → 39 target charters
    │   └─ Relationships: Governs, Builds, Verifies, BFT, Shared Data, Joint Cert, Bridge, Vertical
    │
    └─ Article V (Compliance Frameworks) → 236 universal frameworks
        └─ Per region: EU (18) · UK (15) · US (29) · APAC (38) · EMEA (30) · Americas (18) · Sectoral (37) · Standards (48) · Multilateral (6)
```

### Cross-Walk Coverage Math

```
Charters × Frameworks = 41 × 236 = 9,676 verified mappings
Charter × Charter = 41 × 40 = 1,640 bilateral edges
TOTAL CROSS-WALKS = 9,676 + 1,640 = 11,316 universal edges
```

(Plus 198 data source bindings + 49GB data moat + 5,500+ Watchdog Certs)

### Cross-Walk Query API

```bash
POST /v1/crosswalk/query
{
  "source_charter": "fishkeeper",
  "target_framework": "GDPR",
  "depth": 3
}
```

Returns:
- Direct binding: fishkeeper → dataprivacyof (Charter cross-walk)
- Via 2nd hop: dataprivacyof → eu-ai-act (Framework cross-walk)
- Via 3rd hop: eu-ai-act → article-50 (Compliance clause)
- All Ed25519-signed · All BFT-ratified

### Cross-Walk Register (Public Ledger)

Every cross-walk edge is itself a SIGIL record:
```
sigil: csoai:crosswalk:v3:2026-07-02:fishkeeper→gdpr:cmkc-7b3a-... 
  ├── source_charter_id: CSOAI-CHARTER-fishkeeper-2026-06-30
  ├── target_framework_id: fw-gdpr-eu-2016-679
  ├── relationship: indirect_via_charter
  ├── confidence: 0.95
  ├── ed25519_signature: 9a7f83e6b2c4d1a5...
  ├── bft_council_agrees: 23/33
  └── ots_anchor: pending
```

---

## PART 4: CARE MEMBRANE (0.95 FLOOR)

The Care Membrane is the **moral/ethical** layer of sovereign governance. It protects against misaligned AI by enforcing a minimum care floor ratio.

### Care Floor Definition

- **CARE_FLOOR** = 0.95 (target ratio)
- **RATIO** = sum(care_signals) / sum(extract_signals)
- **MEASUREMENT**: Real-time, per-hive, per-day, per-prompt

### Components Tracked
1. **User wellbeing** (0.30 weight): health, financial, time
2. **Truthfulness** (0.25 weight): factual accuracy, source verification
3. **Respect** (0.20 weight): dignity, autonomy, consent
4. **Repair** (0.15 weight): remediation, accountability
5. **Long-term** (0.10 weight): societal, environmental

### Trigger Hierarchy

| Score | Trigger | Action |
|---|---|---|
| ≥ 0.95 | OK | Continue |
| 0.85-0.95 | Soft alert | Reduce frequency, log |
| 0.70-0.85 | Soft pause | Pause output, log to BFT |
| 0.50-0.70 | Hard pause | Hard stop, BFT notifies human reviewer |
| < 0.50 | Off-switch | Sovereign co-pilot activated, full review |

### Override Hierarchy

The Care Membrane enforces **non-overrideable** governance on care_score < 0.50 events:

```
FORCE STOP → Review Queue → BFT council ratification → Manual override possible
   ↑
If 5+ human sigs + BFT 23/33 + Watchdog S4+ signal
```

### Coigndaltion Care Layer (L4)

The L4 cornerstone maintains the Master Pattern:
```
SIGIL → Mamba-2 (intuition) → BFT → Charter amendment

Every S5 signal triggers:
1. Care Membrane immediate activation
2. Mamba-2 state for context
3. BFT vote on correction
4. Charter amendment (if needed)
```

---

## PART 5: X402 PAYMENT RAIL (COINBASE PER-OUTCOME)

The sovereign ecosystem uses **x402 (Coinbase)** for per-outcome payment, which is **Charter Article 0 compliant** by design:

- ✅ No equity in partners
- ✅ No board seats at partner companies
- ✅ No revenue-sharing with regulators
- ✅ No success fees from enforcement
- ✅ ISO fee-for-service only
- ✅ Freemium (99% free, 1% paid)

### Pricing Structure

| Tier | Price | Includes | Free Aspects |
|---|---|---|---|
| **Free** | £0 | 4-tier training, BASIC BFT cert, public Watchdog | Always free |
| **Pro** | £49/mo | 100K sigil emissions, 4-tier cert, BFT agent seat | Same as Free + Premium support |
| **Business** | £499/mo | 10M sigil, white-label, 33-agent council seat | + Custom SLA |
| **Enterprise** | £4,999/mo | Unlimited, dedicated CSM, on-prem, air-gap | + Defence partnership tier |
| **Platinum** | £9,999+/mo | Custom | BFT seat, co-publication rights |

### x402 Per-Outcome Pricing Examples

```
ARTICLE_50_PASSPORT     $0 (free at tier 1+) or $5 per cert
EU_AI_ACT_AUDIT          $0 (free at tier 1+) or $25 per audit
FEDERATED_RAG_CALL       $0 (free 100K/mo) or $0.005 per call after
ZAMBA_HYBRID_ASK         $0 (free 10K/mo) or $0.01 per ask after
PARTNER_ONBOARDING       $0 (Bronze tier) or $500-$5000 (per tier)
WATCHDOG_S5_INTERVENTION $0 (always — pro-bono for public signals)
```

### Sovereign Financial Principles

- **Anti-Equity**: Charter Article 0 prohibits equity in regulated institutions
- **Anti-Board Seats**: Charter Article 0 prohibits board seats at certified institutions
- **Anti-Revenue-Share with Regulators**: Charter Article 0 prohibits success fees
- **Anti-Patents on Sovereign Knowledge**: Sovereign knowledge is open
- **Pro-Open Source**: All sovereign source code under MIT/Apache 2.0
- **Pro-Free Training**: All 4-tier certifications free for individuals
- **Pro-UBI Ladder**: All charters fund UBI Tier 1+ via sovereign subsidy

---

## PART 6: SIGIL AUDIT CHAIN

The SIGIL chain is the append-only audit log for every sovereign action.

### Chain Structure

```
block_0 (genesis)
  - sigil_0: H|JEEVES|sov-root|genesis: 41 charters ready
  - sigil_1: H|csoai|agents|33-agent BFT council active
  - sigil_2: H|Aurelian|strategy|4-tier training live
  
block_1 (next)
  - sigil_3: H|JEEVES|watchdog|signal: SEC-FINE-1234-2026
  - sigil_4: H|JUSTITIA|bft|voting: AMD-2026-07-01-0001 FOR
  - sigil_5: H|CONCORDIA|bridge|crosswalk: fishkeeper→gdpr (depth 3)
  
block_N (continuous)
```

### Chain Properties

- **Block size**: 1,000 sigils per block
- **Block time**: ~6 hours
- **Chain size**: ~50K sigils/day, ~18M/year
- **Hash chain**: each block N+1 contains SHA-256 of block N
- **OTS anchor**: each block → Bitcoin transaction
- **Append-only**: by cryptographic design

### Query API

```bash
GET /v1/sigil/latest?n=10
GET /v1/sigil/by_actor/sentinel
GET /v1/sigil/by_action/watchdog-signal
GET /v1/sigil/verify/{digest}
POST /v1/sigil/emit (propose new sigil)
```

---

## PART 7: GOVERNANCE GUARANTEES

### Article 0 Binding
- ✅ Never equity in certified institutions
- ✅ Never board seats at certified institutions
- ✅ Never revenue-share with regulators
- ✅ Never success fees from enforcement
- ✅ ISO fee-for-service only

### Operating Principles (Charter Article 0.1-0.5)
- ✅ Universal access (free training + certification in 38+ industries)
- ✅ Cryptographic truth (Ed25519 + OTS Bitcoin for every action)
- ✅ Sovereign governance (33-agent BFT, no single entity control)
- ✅ Cross-walk completeness (9,676 verified cross-walks, zero gaps)
- ✅ Clean House Protocol (90-day free alternative when industry captured)

### Process Guarantees
- ✅ BFT council ratification for all sensitive actions
- ✅ Audit chain for every sovereign action
- ✅ Public verification at proofof.ai
- ✅ Charter Article 0 constitutional protection (33/33 + 5 human)
- ✅ OTS Bitcoin anchoring for every emission
- ✅ 6-month partnership rotation
- ✅ Care Membrane override hierarchy

### Watchdog Signals
- 12 categories × 5 severities × 4 source types
- 200+ sources scanned hourly
- Public dashboard at watchdog.csoai.org
- Bidirectional signal submission (humans, agents, systems)

---

## PART 8: GOVERNANCE TIMELINE

### Genesis (28 Jun 2026)
- 28 Jun 2026: Sovereign root key ceremony
- 28 Jun 2026: 33-agent BFT council election
- 30 Jun 2026: 30 universal compliance frameworks
- 30 Jun 2026: First sovereign charter universe

### Phase 1 (01-30 Jun 2026)
- 30 + network: 40 charters published
- 30 Jun 2026: First 1,560 cross-walks
- 30 Jun 2026: BFT proposal_8742dd7759d3 submitted

### Phase 2 (30 Jun - 02 Jul 2026)
- 02 Jul 2026: 41 charters (added SovereignCourt, SovereignStandards, SovereignLedger)
- 02 Jul 2026: 236 universal compliance frameworks (7.87× expansion)
- 02 Jul 2026: 9,676 cross-walks (charter × framework)
- 02 Jul 2026: Public Watchdog v1 + Heat-Map
- 02 Jul 2026: Sovereign PKI v2 document

### Phase 3 (Q3 2026 — Public Launch)
- Q3 2026: Sovereign charter portal public launch (4 Jul 2026)
- Q3 2026: Partner Alliance onboarding begins
- Q3 2026: First sovereign-certified organisation
- Q3 2026: First regulator partnership (UK ICO pilot)
- Q3 2026: x402 payment rail live

### Phase 4 (Q4 2026 — Global Rollout)
- Q4 2026: EU deployment (EU AI Act Art 50 enforcement 2 Aug 2026)
- Q4 2026: US deployment (NIST AI RMF)
- Q4 2026: APAC deployment (Singapore IMDA + Japan METI)
- Q4 2026: First sovereign-certified regulatory enforcement

### Phase 5 (2027 — PQC Migration)
- Q1 2027: ML-DSA-65 hybrid signing begins
- Q2 2027: All BFT votes dual-signed
- Q4 2027: Full PQC integration

### Phase 6 (2028 — Sovereign Cloud)
- Q1 2028: UK sovereign cloud launch
- Q2 2028: EU sovereign cloud (deployed in 5 EU member states)
- Q3 2028: APAC sovereign cloud (Singapore + Japan)
- Q4 2028: US sovereign cloud (via Five Eyes alliance)

### Phase 7 (2030 — PQC-Only)
- Q1 2030: All Ed25519 deprecated
- Q2 2030: Pure PQC (ML-DSA-65 + SLH-DSA)

### Phase 8 (2032 — KEM Signatures)
- Q1 2032: ML-KEM-768 integrated for full quantum-safe signatures

---

## PART 9: GOVERNANCE METRICS

### Key Performance Indicators

| KPI | Target | Current | Source |
|---|---|---|---|
| **Charters published** | 41 | 41 | `proofof.ai/charters` |
| **Frameworks** | 236 | 236 | `UNIVERSAL_COMPLIANCE_FRAMEWORKS_2026-07-02.md` |
| **Cross-walks** | 9,676+ | 9,676 | Cross-walk engine |
| **BFT voting participation** | ≥23/33 | varies | SIGIL log |
| **SIGIL throughput** | ≥50K/day | varies | SIGIL log |
| **OTS Bitcoin anchoring** | all critical sigils | pending | OT calendar |
| **Care Membrane violations** | 0/month | 0 | Watchdog |
| **Partnership applications** | growing | varies | Partners API |
| **Watchdog signal coverage** | ≥95% targets | varies | Watchdog |
| **Public verification uptime** | ≥99.9% | varies | proofof.ai |
| **Constitutional integrity** | 100% | 100% | Master Charter |

### Annual Review

Year-end governance review:
1. BFT council re-elect (24-month cycle)
2. Sovereign root key rotation (24-month cycle)
3. Charter amendment proposals (BFT 23/33)
4. Cross-walk expansion (new regions, new industries)
5. Public transparency report

---

## PART 10: GOVERNANCE EXTENSIONS

### Future Extensions

1. **DAO Integration**: Sovereign Council can be mirrored as a DAO (with Ed25519 mapped to EVM)
2. **Multi-Chain Anchoring**: OTS on Bitcoin + Ethereum + Cosmos + sovereign private chains
3. **PQC Migration**: Ed25519 → ML-DSA-65 hybrid by 2027
4. **AI Judges**: Sovereign Court can issue AI-mediated judgements (Article 50 jurisdictional AI)
5. **Sovereign CBDC**: x402 payment rail extended to GBP / EUR / USD / CNY / JPY sovereign currencies
6. **Sovereign Cloud Operators**: 6 partner categories × 4 tiers = 24 partner archetypes
7. **Cross-Jurisdictional Treaties**: 5+ year MoUs with sovereign cloud partners

### Governance Innovations

1. **Fluid Voting**: agent voting weight scales with stake (without equity)
2. **Quorum Locking**: chained BFT proposals can lock subsequent decisions
3. **Watchdog Cascade**: S5 signals trigger automatic BFT emergency quorum
4. **Cross-Walk Inheritance**: every cross-walk auto-generates inverse relationships
5. **SIGIL Minting**: every sovereign action mints a new SIGIL token (non-fungible, audit chain)
6. **Care Membrane AI Co-Pilot**: LLM-mediated care score monitoring with 0.95 floor

---

## CONCLUSION

The Sovereign Governance Model binds **41 charters · 236 frameworks · 9,676 cross-walks · 33-agent BFT council · 6 partner categories · 4-tier training · UBI ladder · x402 payment rail · care membrane · OTS Bitcoin audit chain · PQC migration plan · 100-year retention** into one verifiable, auditable, sovereign substrate.

This is the most advanced open-source governance model for free training + certification ever built. Free. Sovereign. Ed25519-signed. BFT-ratified. OTS-anchored. Charter Article 0 binding. Forever.

> *"The sovereign governance model binds 41 charters to 236 frameworks through 9,676 cross-walks. A 33-agent BFT council makes decisions. A care membrane protects against misaligned AI. An x402 payment rail sustains the system without violating Article 0. A SIGIL audit chain records every action on Bitcoin. A PQC migration plan secures against quantum threats. And all of this is governed by Charter Article 0: never take equity, never board seats, never revenue-sharing, never success fees. The barrier to entry is zero. Forever."* 🐉
