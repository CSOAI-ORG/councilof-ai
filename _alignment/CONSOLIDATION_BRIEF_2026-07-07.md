<!-- MEOK_SOV3 consolidation brief — auto-synthesized 2026-07-07 -->
<!-- Source: 18 canonical on-disk docs (newest per topic), 265 extracted facts (130 RUNNING / 116 DESIGNED / 19 STUB), 101 caveats. -->
<!-- This is a DERIVED consolidation, not a hand-authored charter. Verify any number against the newest primary doc before external use. -->

# CONSOLIDATION BRIEF — SOV3³ / OOWM Sovereign-AI Estate

*Single source of truth replacing overlapping tab-briefings. Compiled from the newest on-disk docs supplied in the evidence bundle. Status tags — RUNNING (verified/live), DESIGNED (spec/target), STUB (hardcoded/mock) — are preserved exactly as tagged in source docs; where a doc's own caveats contradict its status tag, both are shown.*

---

## Executive summary

The estate is a mix of genuinely live infrastructure and a much larger body of specification/aspirational material, most of it dated 2026 (future-dated relative to this review, which is itself a flag to verify document provenance before citing).

**Confirmed RUNNING:** a backend on :8000 (37/37 tests reported), a SOV3 substrate on :3101 (330 tools reported live), a sovereign DB with SIGIL hash-chain links, 518 public repos in CSOAI-ORG (though a separate scan reports 584 — see drift ledger), 7 trained neural-network governance models on MEOK MCP v3.0.0 (3 solid, up to 4 weak/tiny-sample), and Phase-1 local execution of the 12-General architecture as Python processes on a single Mac/Ollama instance.

**Predominantly DESIGNED:** the 12-General × 5-dimension × BFT-council OOWM architecture, the GCP-scale 5D Hive deployment (Phase 2/3), the 8-layer Layer-0 protocol stack, the 41-charter/123–236-framework crosswalk registry, the 33-agent BFT constitutional council, the x402 payment rail, and all Y1–Y5 revenue projections.

**STUB / hardcoded:** `handle_oowm_status`'s always-true flags, several SovSpace inventory figures (104 MCPs, 2,047 tests, 118 pages), the "SPEC SHIPPED" claim for the 12-General build (only 5 of 12 wired), and `ship-everything.sh`'s 479-package claim (unexecuted).

Numeric counts drift substantially across documents for the same underlying metric (MCP counts, page counts, test counts, framework counts, charter counts). None of these should be quoted as a single number without checking the newest file on disk — see the Count-Drift Ledger.

---

## OOWM & SOV3³ architecture

- **DESIGNED** — OOWM is a "sandwich" architecture: a sovereign, signed governance substrate wrapped around open-weight base models. It is explicitly *not* a from-scratch foundation model; the claimed moat is the signed/governed substrate, not the base model.
- **DESIGNED** — SOV3³ comprises 4 reconfigured "brain" configs around 1 OOWM base (drift: one doc says 3 — see ledger).
- **DESIGNED** — 12 Generals × 3 BFT council modes (fast/balanced/secure) × MOM (4 modality dispatchers) × MoE (8 specialized experts), each General mapped symbolically to a Sephirah (Dragon/#12 = Keter).
- **STUB** — Despite a "SPEC SHIPPED" status claim, only 5 of the 12 Generals × 3 BFT modes are described as actually "wired," with "100% tests pass" on that partial subset only.
- **STUB** — EAT-11 ORNITH simulation "verified consensus across council sizes 3/5/7 × 3 seeds," but network/adversary/failure-mode parameters are not documented — treat as a simulation stub, not a validated result.
- **DESIGNED** — 5D Hive: each General maps to 1 GCP VM (n2-standard-8), 5 dimensions per General (Spatial/Temporal/Logical/Wavelet/Quantum), Phase 2 (12 GCP VMs, europe-west2-a) and Phase 3 (33 hive-VMs) are both aspirational.
- **RUNNING** — Phase 1: 12 Generals currently run as local Python processes on M2/M4 Mac against a single Ollama instance. Separately, "M2 Mac Ollama has 14 models loaded" is reported as verified, but its stated verification date (28 Jun 2026) postdates the document header (29 Jun 2026) — an internal inconsistency to flag, not resolve.
- **RUNNING** — SOV3 MIDDLE substrate: 207 tools. Online federation layer: 275+ external MCP tools, 330 verified live (see drift note — MCP/tool totals vary widely across other docs, e.g., 371 servers/2,016 tools in the MEOK system card, 531 MCPs/~1,981 tools in the layer0 scorecard).
- **STUB** — `handle_oowm_status` returns hardcoded `True` for `mamba_warm`, `moe_loaded`, `moe_connected`. This is a status stub, not a live probe. **Never cite this as proof OOWM is running.**

---

## Model stack

- **DESIGNED** — qwen3:30b-a3b (Apache 2.0) is the designated offline base MoE model for the 192GB M4 Mac target. It is **not currently pulled** (ollama list is empty for it); the operative "king-hive" only has llama3.2:1b/3b. This must not be described as live until independently verified as loaded.
- **Inconsistency flagged** — the model-stack doc tags Mamba-2's 16-dimensional state vector as RUNNING, but the dedicated Mamba-2 technical spec doc explicitly footers itself "illustrative, not live certification" and tags the same 16-dim state vector as DESIGNED, with the caveat that no evidence exists that Mamba-2/SIGIL/OOWM are running systems. Treat the 16-dim state vector as **DESIGNED** pending resolution of this contradiction.
- **RUNNING** — 7 trained neural governance models verified on MEOK MCP v3.0.0 (see scorecard below for quality caveats).
- **DESIGNED** — Ed25519 hash-chained audit signing on every hop ("SIGIL chain") is specified in the model-stack doc; other docs (align-check, sovtown) report SIGIL emission as RUNNING/live — treat signing infrastructure as designed at the protocol level, with some downstream instances self-reported as active.
- **RUNNING** — Latest commit `177aaf0c` includes a gate-smoothing fix, real-data grounding, and a calibration harness.

---

## Governance NNs (scorecard)

Evidence names 6 of the 7 governance neural nets explicitly; the seventh is referenced only via the aggregate "4 of 7 weak" count and is not individually named in the evidence bundle — flag as a gap rather than filling it in.

| Model | Metric | Status |
|---|---|---|
| creativity_assessment_nn | r² 0.91 on 350 samples | **RUNNING** — solid |
| care_pattern_analyzer | MAE 0.037 on 600 samples | **RUNNING** — solid |
| relationship_evolution_nn | MAE 0.071 on 500 samples | **RUNNING** — solid |
| threat_detection_nn | 0.45 accuracy on 33 samples | **RUNNING** — weak, flagged for retraining |
| dependency_detection_nn | 0.22 accuracy on 50 samples | **RUNNING** — weak, flagged for retraining |
| care_validation_nn | 19 samples (no accuracy figure given) | **RUNNING** — tiny-sample, flagged |
| 7th model (unnamed) | not specified in evidence | unknown — not documented |

Bottom line: these are trained and running models producing real numbers — not stubs — but 4 of 7 are weak or tiny-sample by the evidence's own admission. Only creativity/care-pattern/relationship-evolution should be described as solid. The other four (including the unnamed seventh) should not be cited as validating "governance NN" claims without qualification.

---

## Layer-0 protocols

- **DESIGNED** — Layer 0 atom-type spec: 18 atom types (SIGIL, PROBE, VOTE, EVENT, HOOK, TICK, CACHE, QUERY, SNAPSHOT, INVOICE, WORM, IDENTITY, STATE, CHARTER, MINDSET, GENERAL, HIVE, BRIDGE), spanning an 8-layer stack (L0–L7). Layer 1 (6 primitives), Layer 2 (6 composites), Layer 4 (22 task MCPs), Layer 5 (12 General daemons), Layer 6 (444+ HTML pages/6 locales) are all specified, not confirmed live.
- **STUB** — 973 passing tests and the 518-element total count are asserted with a stated arithmetic breakdown but no verification method disclosed; treat as unverified figures until re-derived from source.
- **DESIGNED** — Backend target: 30+ endpoints on :8765; distribution target: 22+ MCPs on PyPI, 44+ pages on Vercel; Terraform target: 12 GCP VMs. None of these are confirmed running in this doc.
- **RUNNING** (separate doc, "layer0_align_check") — 350+ sibling commits checked over 2 days, 120 M4 commits, 1,500 total commits, 30 MCPs deployed/ship-ready, 554 OSCAL components verified, 61 production charters with data binding, 180 pages delivered (vs. 100 target), 5,500 sigils emitted, 198 data-binding sources, 2,760 charter cross-walks, 38 parallel work streams — all self-reported as RUNNING but explicitly caveated as self-reported/not externally audited.
- **DESIGNED** — 33-node agent BFT council with quorum threshold, referenced in the align-check doc, is DESIGNED (not yet an operating council), distinct from the RUNNING commit/sigil telemetry in the same document.
- **Mixed** ("layer0_scorecard") — P1 MCP federation (531 MCPs/~1,981 tools, 479 deploy-ready) is DESIGNED; P3 A2A substrate (20 MCPs/200 tests, 99% pass, 186/193) is RUNNING; P6 OSCAL/FedRAMP (97-component signed package, OSCAL 1.1.2 strict-valid) is RUNNING; P2, P4, P5, P7, P8 are DESIGNED. The "100/100 A+++++" score across all 8 protocols is a self-defined composite metric (scope × test-pass × signature-verifiability × moat-uniqueness) with no itemized sub-scores shown — treat the rating itself as a designed scoring framework, not independent certification.
- **STUB** — `ship-everything.sh`, the "master owner command" claimed to ship 479 packages to PyPI/npm/MCP registry in 20 minutes, is explicitly marked pending execution verification.

---

## Charters & crosswalks

- **DESIGNED** — Charter Index v3: 41 charters across 7 layers (L0, L0+, L1–L4, NEW), cross-walked to 123 frameworks (per charter-index doc) yielding 5,043 mappings; a separate governance doc states 236 frameworks and 9,676 cross-walk mappings (41×236), plus a 41×41 bilateral layer of 1,640 edges for 11,316 total edges. **These are two different, mutually inconsistent framework/crosswalk counts in the source material — do not present either as settled; see Count-Drift Ledger.**
- **STUB** — Three "NEW tier" root layers (SovereignCourt #37, SovereignStandards #38, SovereignLedger #39) are explicitly marked "currently building" — no file sizes or completion evidence published.
- **DESIGNED** — All 41 charters are asserted 100% bound to Charter Article 0 (fee-for-service only, no equity/revenue-share) and Ed25519-signed/BFT-ratified at 23/33 quorum. Charter Article 0's substantive language (no equity, board seats, revenue-sharing, or success fees; ISO fee-for-service only) recurs consistently across the gov-model, revenue-model, and mamba-spec docs and functions as the one clearly stable, repeatedly-invariant policy statement in the estate — but its live enforcement (BFT ratification actually having occurred) is asserted, not demonstrated.
- **RUNNING** — Regional framework counts (per the separate compliance_frameworks doc, v3, 236 total): EU 18, UK 15, US 25, APAC 37, EMEA non-EU 20, Americas non-US 12, sectoral from #136 — reported as live document content, not independently audited against external registries.
- **DESIGNED** — 38 industry charters bound to a "49GB data moat" across 198 data sources — no enumeration or audit trail provided in evidence.

---

## SovSpace

- **STUB** — SOVSPACE v51: 104 Sovereign MCPs, 2,047+ unit tests, 118 HTML pages, 18 unit tests for `meok-sovereign-twin-mcp`, 21 for `meok-sovereign-unreal-mcp`, `/sovspace.html` (28KB), `/ue5-bridge.html` (24KB) are all stated as "LAUNCH READY v51" with no external audit or build artifact attached — treat all specific counts as stub/self-reported until verified against the newest file.
- **DESIGNED** — 33 hive planets modeled in 3D, 30 UK Land Registry parcels (£20.3B stated value), 20 UK Companies House entities, 120 live sensors, 4-tier hive-planet hierarchy, 3 UE5 actor classes (SOVHivemind, SOVDrone, SOVCamera), 22 Layer-0 Protocol Hub protocols — all aspirational/target infrastructure, not confirmed deployed.
- **STUB** — "Crown lineage span 1795–3025" is fictional/branding framing embedded in the doc, not a technical claim; do not treat as real corporate or legal lineage.
- **DESIGNED** — Scheduled launch: 4 July 2026, 09:00 BST (recurs across multiple docs as a target date, not a confirmed completed event).
- Separately, "sovtown_sigil" (EAT-394 v39) reports 90 Sovereign MCPs, 1,840 unit tests, 529 HTML pages, live SIGIL feed (50 SIGILs streamed, 4s ticker interval, 33-hive activity grid, 10-deep hash-chain visualization, 3s auto-emit interval) as **RUNNING**, alongside a "100/100 LAUNCH READY v39" self-rating that is **DESIGNED** framing layered on top of the RUNNING telemetry. These MCP/test/page counts diverge materially from the SOVSPACE v51 figures above — see Count-Drift Ledger; do not average or reconcile them.

---

## Compliance

- **RUNNING** — Compliance-frameworks doc (v3): 236 total frameworks, expanded from an original 30 (v1) via a 113-framework Phase 1 addition and a 93-framework Phase 2 addition, described as a 7.87× expansion. Regional breakdown as above.
- **DESIGNED** — MEOK system card separately claims "12 compliance frameworks" (EU AI Act, GDPR, DORA, NIS2, CRA, NIST RMF, ISO 42001, ISO 27001, IEEE 7000, SOC 2, HIPAA, PCI DSS 4.0, plus MiCA/NIST CSF 2.0) as a distinct, much smaller designed target list. **The 12-framework figure and the 236-framework figure describe different scopes in different documents and must not be conflated** — see Count-Drift Ledger.
- **RUNNING** (self-reported) — Specific status tags: EU AI Act Regulation 2024/1689 is LIVE; UK AI Bill 2026 is PROPOSED; South Korea AI Basic Act passed Dec 2025; Singapore Model AI Governance Framework 2nd Ed 2024 is LIVE. These are document-internal status tags reflecting the doc's own stated date, not externally re-verified in this session.
- **DESIGNED** — OSCAL/FedRAMP 97-component signed package (compliance-trestle validated, OSCAL 1.1.2 strict-valid) is reported RUNNING in the layer0_scorecard doc; a separate doc (align-check) cites 554 OSCAL components verified — a large discrepancy; see Count-Drift Ledger.

---

## Business model

- **RUNNING** — CSOAI Ltd is a real registered entity: UK Companies House 16939677, London. Charter Article 0 (no equity/board seats/revenue-share/success fees; fee-for-service ISO model only) is stated as a binding, recurring policy.
- **RUNNING** — Published pricing tiers: Free (£0, 10K req/day, 1 free Article 50 passport/quarter), Pro (£49/user/mo or £490/yr), Business (£499/org/mo or £4,990/yr, up to 25 seats), Enterprise (£4,999–£9,999/mo, air-gapped option). Sovereign Operators, Defence Partners (DEFONEOS), and partner revenue splits (22%/18%/2% co-marketing) are stated as active pricing structure, not confirmed transacted revenue.
- **DESIGNED** — Y1–Y5 ARR projections (e.g., Y1 Pro ARR ≈ £3.18M from 5,400 users; Y5 Pro ARR ≈ £145.82M from 248,000 users; Y5 Business ARR ≈ £227.54M from 38,000 customers) are modeled targets, explicitly not audited actuals, with no stated confidence intervals or market validation.
- **DESIGNED** — x402 micropayment rail (Coinbase-based, per-outcome pricing e.g. £0.04/£0.03 per Article 50 passport, £49/£39 per EU AI Act audit) is described as shipped/pioneering but implementation and live-transaction status are not independently confirmed in evidence.
- **DESIGNED** — Outbound/inbound distribution funnel: ~10,000-account TAM, 200+ seeded leads (40 seeded + 1,053 side-by-side metrics), single SIGIL-signed leads DB — largely designed pipeline mechanics.
- **RUNNING** — PyPI fleet: 317 live packages (4 shipped same-day: iso20022/dlms/edi/fix), 63 more queued; MCP Registry entry at `io.github.CSOAI-ORG/meok-hatch` and a Hatch install page (`os.meok.ai/hatch-demo.html`) are reported live, with ArkForge trust signing described as live on the deployment VM.

---

## Honesty register

The evidence bundle repeatedly and consistently flags a specific set of items as **not** what they may appear to be. These distinctions are load-bearing and must not be softened:

- **`handle_oowm_status` is a hardcoded stub.** It returns `True` for `mamba_warm`, `moe_loaded`, and `moe_connected` unconditionally. It is not a live probe of the OOWM and must never be cited as evidence the system is running.
- **qwen3:30b-a3b is designed, not pulled.** It is the intended offline base MoE model for the 192GB M4 Mac target, but `ollama list` does not show it present; the actual local king-hive only has llama3.2:1b/3b. Any claim that qwen3:30b-a3b is "live" is unverified and should be treated as false until an actual load is confirmed.
- **4 of 7 trained governance NNs are weak or tiny-sample.** threat_detection_nn (0.45 accuracy, 33 samples), dependency_detection_nn (0.22 accuracy, 50 samples), and care_validation_nn (19 samples) are explicitly flagged for retraining/insufficient data; a fourth weak model is implied by the aggregate count but not individually named in evidence. Only creativity_assessment_nn, care_pattern_analyzer, and relationship_evolution_nn should be described as solid.
- **"Bitcoin anchor" and "consciousness 0.775" are labels, not literal technical claims.** Wherever the evidence uses Bitcoin-anchoring language (SIGIL chain, OpenTimestamps) or consciousness-adjacent scoring, these are architectural/branding metaphors layered onto SHA-256/Ed25519 hash-chaining mechanics — not evidence of an actual Bitcoin-network anchoring integration or a literal consciousness metric. Exclude from investor-facing copy.
- **EAT freezes SOVEREIGN-DEFENSE.** Per the estate's own designation, the EAT (evidence/alignment-tracking) process freezes the SOVEREIGN-DEFENSE component — meaning defense-track claims should be treated as frozen/held rather than actively updated pending further review, not as a live, moving target.
- Nearly every document in the bundle is future-dated (dates in 2026, several with internal date inconsistencies — e.g., a "verified 28 Jun 2026" claim inside a doc headed 29 Jun 2026). None of these dates are independently corroborated in this session; treat all "as of" language as self-reported.
- Several documents explicitly self-label their own claims as "illustrative, not live certification" (Mamba-2 spec, twice) — this framing should be taken at face value and extended in spirit to adjacent designed-but-unverified claims elsewhere in the estate.

---

## Count-drift ledger

The following metrics are reported with materially different numbers across documents in the evidence bundle. **In every case, cite the range below and note that counts drift across docs — verify against the newest file before quoting a single number.**

| Metric | Range observed | Notes |
|---|---|---|
| Brain configs / sovereign brains | 3 – 4 | SOV3³ described as "4 reconfigured brain configs" in model-stack doc vs. "3" elsewhere in drift table |
| Compliance frameworks (small-count context) | 12 – 13 | MEOK system card's "12 compliance frameworks" vs. a nearby 13-count reference; distinct from the much larger 123/236 framework totals below — do not conflate scopes |
| Total compliance frameworks (crosswalk context) | 123 – 236 | Charter Index v3 states 123; separate governance/compliance docs state 236 — likely different snapshots/scopes of the same expansion effort |
| HTML pages | 118 – 128 – 444 – 529 | SOVSPACE v51 (118), MEOK world-final (128), Layer-0 protocol spec target (444+), sovtown_sigil v39 (529) — four different documents, four different counts, no reconciliation given |
| OSCAL components | 97 – 554 | layer0_scorecard states 97 (signed, compliance-trestle validated); layer0_align_check states 554 verified — nearly 6× apart |
| Sovereign/hive MCPs deployed | 90 – 104 | sovtown_sigil (90) vs. SOVSPACE v51 (104); separately, estate-wide MCP repo counts range far higher (352–531 across other docs) — these are likely different scopes (deployed subset vs. full repo estate) but the bundle does not disambiguate |
| Total cross-walk/framework mappings | 123 – 236 | see framework total above; downstream mapping totals (5,043 vs. 9,676 vs. 11,316) compound this same base inconsistency and should not be quoted as a single figure |
| Unit tests | 1,840 – 2,047 | sovtown_sigil v39 (1,840) vs. SOVSPACE v51 (2,047+); a separate layer0 doc cites 973 and the MEOK world-final doc cites 428 — at least four different test-count figures exist across the bundle |

For all of the above, and for any other count not listed here but appearing in multiple docs (e.g., MCP/tool totals: 207 SOV3-MIDDLE tools, 275+/330 federation tools, 371 servers/2,016 tools, 531 MCPs/~1,981 tools, 352 MCP repos/1,987 tool functions, 584 total repos), treat every number as a snapshot of a particular document on a particular (future-dated, self-reported) date. None should be presented as the estate's current, settled figure.

---

## What's RUNNING vs DESIGNED vs STUB (summary table)

| Area | RUNNING (verified/live) | DESIGNED (spec/target) | STUB (hardcoded/mock/unverified) |
|---|---|---|---|
| OOWM / SOV3³ core | SOV3 MIDDLE substrate (~207 tools); federation layer (275+/330 tools, self-reported) | 4-brain sandwich around open-weight base; 12-General BFT × MOM × MoE spec; Ed25519 SIGIL signing protocol | `handle_oowm_status` hardcoded-True flags — never cite as proof OOWM is live |
| Model stack | 7 trained governance NNs produce real metrics (with caveats); latest commit `177aaf0c` gate-smoothing + calibration harness | qwen3:30b-a3b designated offline base MoE (Apache 2.0); 192GB M4 target; Ed25519 hash-chain signing | qwen3:30b-a3b **not pulled locally**; Mamba-2 16-dim state vector self-labeled "illustrative, not live" |
| Governance NNs | creativity_assessment_nn (r² 0.91), care_pattern_analyzer (MAE 0.037), relationship_evolution_nn (MAE 0.071) | — | threat 0.45/33, dependency 0.22/50, care_validation n=19 — weak/tiny-sample; 7th model unnamed |
| 5D Hive | Phase 1: 12 Generals as local Python processes on M2/M4 Mac + single Ollama | Phase 2 (12 GCP VMs, europe-west2-a); Phase 3 (33 hive-VMs); 5-dim-per-General model | "SPEC SHIPPED" claim — only 5 of 12 Generals actually wired |
| Layer-0 protocols | P3 A2A substrate (20 MCPs/200 tests, 99% pass); P6 OSCAL 97-component signed pkg (OSCAL 1.1.2 strict-valid) | 18 atom types / 8-layer stack (L0–L7); P1/P2/P4/P5/P7/P8; 33-node BFT council | `ship-everything.sh` 479-package claim (unexecuted); 973/518 test/element counts unverified |
| Charters & crosswalks | CSOAI Ltd real (Companies House 16939677); Charter Article 0 recurs invariant across docs | 41 charters / 7 layers; 123–236 frameworks; 5,043–11,316 crosswalk edges (drift) | NEW-tier #37 Court / #38 Standards / #39 Ledger — "currently building"; BFT ratification asserted not shown |
| SovSpace | sovtown_sigil v39: live SIGIL feed (50 streamed, 33-hive grid, 10-deep hash-chain viz) self-reported | 33 hive-planets in 3D; UE5 actor classes; UK Land Registry / Companies House twins; 4 Jul 2026 launch target | SOVSPACE v51 counts (104 MCPs / 2,047 tests / 118 pages) "LAUNCH READY" with no build artifact; "1795–3025 lineage" is branding |
| Compliance | EU AI Act 2024/1689 LIVE; 236-framework doc (v3) content; regional breakdown as document content | OSCAL/FedRAMP package; MEOK system-card's 12-framework target list (distinct scope) | 97 vs 554 OSCAL-component discrepancy unresolved; all "as-of" dates self-reported |
| Business model | Published pricing tiers (Free/Pro £49/Business £499/Enterprise £4,999–9,999); PyPI fleet 317 live pkgs | Y1–Y5 ARR projections (£3.18M→£145.82M Pro); x402 micropayment rail; partner revenue splits | Live-transaction/revenue status not demonstrated; TAM/lead-funnel figures are pipeline design |

## Provenance — 18 source docs consolidated

- _alignment/SOV3_OOWM_MODEL_STACK_2026-07-07.md
- _alignment/SOV33_ORGANIC_WORLD_MODEL_v1.0.0.md
- _alignment/SOV33_5D_HIVE_ARCHITECTURE_v1.0.0.md
- _alignment/SOV3_TUNING_SCORECARD_2026-06-29.md
- MEOK_SYSTEM_CARD.md
- MEOK_WORLD_FINAL_STATE_2026-07-02.md
- _alignment/CSOAI_DISTRIBUTION_UNIFIED_2026-07-07.md
- _alignment/EAT104_LAYER_0_PROTOCOL_2026-06-29.md
- LAYER0_ALIGNMENT_CHECK.md
- CSOAI_LAYER0_SCORECARD_2026-06-29.md
- sovereign-charters/00-MASTER-INDEX.md
- sovereign-charters/SOVEREIGN_GOVERNANCE_MODEL.md
- sovereign-charters/REVENUE_MODEL.md
- _alignment/EAT521_SOVSPACE_v51_2026-07-01.md
- _alignment/EAT394_SOVTOWN_SIGIL_v39_2026-06-30.md
- sovereign-charters/UNIVERSAL_COMPLIANCE_FRAMEWORKS_2026-07-02.md
- CSOAI_MCP_ESTATE_SCAN_2026-06-26.md
- sovereign-charters/csoai-launch-pack/CSOAI-MAMBA2-SSM-TECH-SPEC.md
