## 15. Risk Register, Appendices & Glossary

A blueprint without a risk register is a promise without accountability. This closing chapter catalogues the threats that could derail MEOK, maps requirements to their sources, inventories the 25 product hives, and anchors the lexicon of sovereign AI terminology.

### 15.1 Risk Register

Eight critical threats are assessed below by probability (Low / Medium / High) and impact (Medium / High / Critical), each with a named owner and concrete mitigation drawn from the cross-verification analysis [^cross^].

| ID | Risk | P | I | Mitigation | Owner |
|----|------|---|---|------------|-------|
| R01 | **EU AI Act regulation changes** — The Digital Omnibus (May 2026) shifted Annex III enforcement to December 2027; further amendments could alter scope or penalty tiers [^227^][^228^]. | H | H | Horus regulatory monitoring with automated BFT alerting; OSCAL policy versioning via Venturalitica for 48-hour pivot [^253^]. | Compliance |
| R02 | **Apple Silicon ecosystem lock-in** — Keystone depends on M4 King / M2 Queen hardware; Apple pricing or API changes disrupt supply [^292^][^301^]. | M | M | Abstract hardware interface via Tauri V2 + Docker; 90-day portability path to Linux ARM / NVIDIA Jetson [^7^][^8^]. | Infrastructure |
| R03 | **Model licensing conflicts** — OpenMDW-1.1 permits fine-tuning, but commercial redistribution of OOWM checkpoints may face derivative-work ambiguity [^321^]. | M | H | Pre-fine-tuning legal review; Croissant 1.1 provenance metadata with PROV-O chain-of-custody on all training runs [^450^][^451^]. | Legal |
| R04 | **Community adoption failure** — Open-source AI averages 1-3% free-to-paid conversion [^494^]; MEOK's MMO UX shell has no comparable product. | M | H | Credits designed into RPG quest rewards from day one (easy = free, legendary = premium) [^21^]; target 5% via gamified onboarding [^610^]. | Product |
| R05 | **Hardware failure (M4 / M2)** — 24/7 inference on consumer MacBooks risks thermal throttling (~21% degradation after 5 min) [^292^]; SSD wear or sudden failure breaks A/B failover. | L | C | Horus Layer 3 monitoring; cold-spare M4 on standby; auto-failover to cloud via LiteLLM within 30 s [^225^][^310^]. | Infrastructure |
| R06 | **BFT consensus deadlock** — At scale (~500 BFT nodes across 25 hives), O(n^2) message complexity consumes revenue from 1-3% conversion hives [^470^][^551^]. | M | M | Council Federation: 12 Supreme Generals with delegated authority; sub-hive attestation rollups reduce nodes from 500 to 12 [^357^]. | Architecture |
| R07 | **Security vulnerability in Sigil** — A flaw in Ed25519 or BLS12-381 would compromise agent identity, vote integrity, and supply-chain attestation across all hives [^239^][^306^][^301^]. | L | C | Independent crypto audit + formal verification of BLS threshold library; $25K critical bug bounty before mainnet. | Security |
| R08 | **EU AI Act non-compliance penalty** — Penalties reach EUR 35M / 7% global turnover for prohibited practices; zero of 12 tested LLMs fully comply [^378^][^43^]. | L | C | AIR Blackbox (51+ checks) + Microsoft Agent Governance Toolkit as mandatory kernel; human-in-the-loop kill switch [^251^][^90^][^227^]. | Compliance |

**Aggregate exposure.** Three risks (R05, R07, R08) carry Critical impact despite Low probability — existential threats that halt the ecosystem if realised. All three share a mitigation thread: Horus Layer 3 monitoring plus BFT automated alerting. Two risks carry High probability (R01, R04); R01 is partially offset by MEOK's compliance-by-design architecture, which maps BFT Council governance directly to Article 14 oversight requirements. Four of eight risks trace to the compliance-cryptography intersection, validating early investment in the Sigil-BLS stack.

### 15.2 Appendices

#### Appendix A: Requirement Traceability Matrix Summary

The full matrix maps 201 requirements across twelve research dimensions to architectural decisions, code modules, and verification tests. This summary shows distribution and coverage as of July 2026.

| Dimension | Req | Coverage | Verification | Key Gap |
|-----------|-----|----------|--------------|---------|
| Dim01 — MMO UX | 18 | 94% | High [^3^][^5^] | App Store blocked by macOS private API [^7^] |
| Dim02 — MCP Router | 22 | 88% | High [^217^][^384^] | Multi-tenancy not yet in MCP spec [^304^] |
| Dim03 — OOWM | 20 | 72% | Medium [^171^] | Mamba-2 SSD not cross-validated [^385^] |
| Dim04 — Fractal Memory | 16 | 91% | High [^263^][^248^] | 98% compression claim unverified [^219^] |
| Dim05 — BFT Council | 19 | 85% | Medium [^357^] | Sub-second claim excludes LLM inference |
| Dim06 — Keystone | 17 | 93% | High [^252^][^310^] | Benchmarks ~1 year old; refresh needed |
| Dim07 — Compliance | 21 | 81% | Medium [^251^][^90^] | CEN-CENELEC JTC21 standards evolving |
| Dim08 — Sigil Security | 14 | 96% | High [^240^][^301^] | Formal verification pending |
| Dim09 — Product Layer | 15 | 89% | High [^490^] | 3-node sub-hives = zero Byzantine tolerance |
| Dim10 — Data Moat | 12 | 76% | Medium [^450^] | 50-100K training examples likely low |
| Dim11 — Horus | 14 | 82% | Medium [^450^][^454^] | Auto-ingestion pipeline not yet built |
| Dim12 — Economics | 13 | 78% | Medium [^528^][^529^] | Conversion assumptions extrapolative |

Overall coverage: 86%. The weakest areas — OOWM (72%), Data Moat (76%), Hive Economics (78%) — are also the most innovation-heavy, with no comparable systems to validate against. Recommended response: prototype-first — ship one hive end-to-end before scaling to the full inventory.

#### Appendix B: 25-Domain Inventory Detail

Each hive maps to a subdomain, carries a BFT sub-council, and serves a distinct SME vertical. The raw node count (~500) is collapsed to 12 Supreme Generals via the Council Federation model (Risk R06).

| Cluster | Hive | Sub-Hives | Nodes | Model |
|---------|------|-----------|-------|-------|
| Logistics | grabhire.ai, palletise.ai, haulage.ai, routeplan.ai | 3-4 each | 3-5 | Commission + subscription |
| Aquaculture | fishkeeper.ai, aquafarm.ai | 3-4 each | 5 | Freemium + yield-based |
| Construction | buildsite.ai, tradesmatch.ai, materialquote.ai | 3-4 each | 3-7 | Per-project + match fees |
| Professional Services | consultme.ai, legalsign.ai, accountflow.ai | 3-4 each | 3-5 | Booking + SaaS |
| Health & Wellness | fitpath.ai, mindscape.ai | 3 each | 3-5 | Session + subscription |
| Retail | shopmind.ai, pricewatch.ai | 3-4 each | 3-5 | Per-SKU + SaaS |
| Education | skilltree.ai, tutormatch.ai | 3-4 each | 5 | Course + match fees |
| Property | rentguard.ai, estateflow.ai | 3-4 each | 5 | Per-tenant + transaction |
| Food & Hospitality | menumind.ai, tableflow.ai | 3 each | 3 | Per-location + cover |
| Energy | solarcalc.ai, usageopt.ai | 3 each | 3 | Lead + SaaS |
| Creative | brandforge.ai | 4 | 5 | Credit-based |

### 15.3 Glossary

| Term | Definition |
|------|-----------|
| **12W-HS** | 12-Generals Weighted HotStuff — MEOK's BFT consensus protocol with sub-second finality via (7,12)-threshold BLS signature aggregation [^357^][^356^]. |
| **BFT Council** | Byzantine Fault Tolerant governing body: 12 Supreme Generals; sub-councils of 3-7 nodes per hive. Quorum: 2f+1 where n >= 3f+1 [^357^]. |
| **Council Federation** | Hierarchical model where 12 Supreme Generals serve as sole consensus body; sub-hives receive delegated authority with periodic attestation rollups. |
| **Hive** | A sovereign AI product — subdomain-routed, BFT-governed, with full fractal memory and MMO UX shell. MEOK targets 25 at scale [^470^]. |
| **Horus** | Four-layer observation intelligence (Supreme / General / Keystone / Product) monitoring AI developments, competitors, regulation, and system health [^450^][^454^]. |
| **Keystone** | Dual-device hardware: M4 King (12GB, ~33-48 tok/s) + M2 Queen (8GB, ~15-25 tok/s) running Ollama on Apple Silicon [^292^][^301^]. |
| **MEOK Credit** | Unit of account: Standard (LLM queries), Council (3x, BFT decisions), Supreme (10x, cross-hive consensus). 67% of enterprise AI projected to use usage-based pricing by 2027 [^532^]. |
| **OOWM** | Omniscient Operational World Model — 16B-parameter model (Cosmos 3 Nano) fine-tuned on 15 years of SME data across 25 domains [^171^][^309^]. |
| **Sigil** | Cryptographic identity protocol: BIP32-Ed25519 hierarchical keys + content-addressable registry + Sigstore supply-chain attestation [^239^][^306^][^339^]. |
| **SME Sovereign** | End-user archetype: full data ownership, local hardware inference, pay-per-computation — no lock-in, no extraction, no vendor dependency. |
| **Sub-Hive** | Functional division within a hive — UX, Tool, Content, or Feature — each an independent deployable unit with its own memory layer [^470^]. |
