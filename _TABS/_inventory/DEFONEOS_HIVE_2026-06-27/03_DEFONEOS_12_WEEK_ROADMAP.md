# DEFONEOS Hive — 12-Week R&D Roadmap
## Foundation → Hardware → Standards → Pilot → £1M Contract
### 27 June 2026 → 19 September 2026

**Owner:** CSOAI Ltd UK 16939677 · Nicholas Templeman
**Hive:** DEFONEOS — 28th hive of meok.ai
**Sub-products:** `meok-defoneos` (build) + `csoai-defoneos` (standards)
**Source-of-truth:** `02_DEFONEOS_HIVE_CANONICAL_SPEC.md`, `01_UK_DEFENCE_AI_MARKET_BRIEF.md`, `04_DEFONEOS_P0_SIGIL.md`
**Money figures marked (E):** all estimates from public sources as of Jun 2026, not live quotes. Per-programme revenue figures assume DSTL evaluation contract terms from `~/clawd/csoai-docs/dstl_application.md` (£25-75k evaluation; £500k-£2M joint research) and DASA themed-call norms.
**Found-hours-per-week baseline:** assume Nick @ ~40h/wk total available; MEOK Labs engineering time shared with existing commitments (qidi-printer-mcp maintenance, openpatent.ai day-to-day, sovereign-temple-live).

---

## PHASE 1 — FOUNDATION (W1-3) — £0-5k spend, £25-75k revenue at pilot close
*Goal: a working defoneos-mcp hub + a public csoai-defoneos site + one demonstrable pilot.*

| Week | Deliverable | £ value (E) | Dependency | Hours (Nick) |
|---|---|---|---|---|
| **W1** | **defoneos-mcp** hub scaffold (Python, FastMCP) — registers with SOV3 bridge; bundles the 7 existing defence MCPs (airspace, drone-airspace, firmware-attestation, agent-prompt-injection-firewall, owasp-agentic, cybersecurity-ai, agent-identity-trust) + the bft-progress-council, ai-incident-reporting, meok-supply-chain-attestation, meok-uas-commercial-drone, meok-tacho-airspace-link. **One pip install** = the hive. | £0 (engineering) | All 7+ defence MCPs already on-disk | 30h |
| **W1** | **csoai-defoneos** Next.js site (5 static pages) — `/`, `/standards`, `/council`, `/procurement`, `/contact`. Minimal copy. Hosted on Vercel (free tier). | £0 | meok.ai Vercel infra already live | 12h |
| **W1** | **Care Membrane v1.0 (defence-public)** — machine-readable YAML at `defoneos-mcp/care-membrane-policy.yml`. Inherits from Dagon private compartment refusal patterns (no kinetic targeting, no personal surveillance, no face recognition). Public-distribution-safe. | £0 | Dagon compartment refusal list (on-disk) | 8h |
| **W2** | **defoneos-mcp** v0.2 — wire in the care-membrane as a pre-call gate on every tool. Add the 6 new agents (Care Membrane Custodians, Defence Procurement Liaisons, etc.) as config-only stubs (no real voting yet). | £0 | W1 hub | 20h |
| **W2** | **Procurement-grade 1-pager** — A4 PDF, "DEFONEOS: UK sovereign AI for defence", 1 page, AUKUS Pillar 2 alignment box, DSTL AISI alignment box, the 7 MCPs list, the iokfarm.co.uk testbed, contact. Submit to DAIC + DSTL + AWE + NCSC + DASA mailing lists. | £0 (distribution) | csoai-defoneos site | 12h |
| **W2** | **Internal pilot — Dagon compartment sanity check** — load Dagon's refusal patterns into defoneos-mcp care-membrane, run a 50-query test suite (10 from each defence domain), verify every response is care-membrane-gated. | £0 | Care Membrane v1.0 | 6h |
| **W3** | **Harvi-evaluation-mcp — design doc** — formal specification of the structured evaluation report format (JSON-schema for JSP 936 safety case consumption). Aligned with DSTL HARVI protocol + UK AISI Inspect framework. | £0 | `~/clawd/csoai-docs/dstl_application.md` | 16h |
| **W3** | **AUKUS Pillar 2 assurance spec v0.1 (skeleton)** — markdown outline of the 5-eyes audit chain, with placeholder sections for each jurisdiction (US CDAO, UK DAIC, AUS DSTG, CAN CFINTCOM, NZ DIA). | £0 | Five Eyes AI assurance WG posture (market brief §8) | 12h |
| **W3** | **First internal pilot — closed beta** — onboard 3 friendly testers (Mark D, Tom K, Sophie — pick from existing contact list in `csoai-docs/inventory.yml`). Get signed feedback. Iterate on the care-membrane. | £0 | W2 hub | 8h |

**Phase 1 total: ~124h Nick-time over 3 weeks. £0-5k spend. No external revenue yet — but the hive exists, the standards surface exists, and a credible closed-beta is running.**

**Phase 1 critical path:** W1 defoneos-mcp hub must be done before any of W2-W3. W3 harvi-evaluation-mcp design must be done before Phase 2 W4-6.

**Phase 1 exit gate:** `defoneos-mcp` installs cleanly via `pip install defoneos-mcp`; loads 12 MCPs; gates every tool on Care Membrane v1.0; the csoai-defoneos site is live; the AUKUS Pillar 2 assurance spec skeleton is on GitHub.

---

## PHASE 2 — HARDWARE R&D (W4-6) — £2-5k spend, £0 direct revenue but unblocks £25-75k evaluation pilot
*Goal: MEOK Labs physical R&D is demonstrably alive + harvi-evaluation-mcp is a real MCP that runs against real testbed data.*

| Week | Deliverable | £ value (E) | Dependency | Hours (Nick) |
|---|---|---|---|---|
| **W4** | **Qidi Max4 reactivation** — install new extruder ends (hardened bimetal for PA12-CF), re-verify `192.168.50.21:7125` reachable, run calibration cube. Verify qidi-printer-mcp can slice + start + monitor a print via Moonraker. | ~£150 (nozzles + filament) | Qidi on LAN | 8h |
| **W4** | **WOLF plate 7 (assembly test)** — slice + print the assembly-test plate in PA12-CF; assemble the 6 printed plates + gears + encoder; verify the Wolfrom gearbox meshes. **GREEN-LIGHT sets 2-12.** | ~£80 (PA12-CF + assembly time) | Qidi operational | 24h |
| **W4** | **harvi-evaluation-mcp** v0.1 — Python implementation of the W3 design doc. Loads HARVI protocol scenarios; emits JSON-schema-compliant evaluation reports. NOT yet tied to a real testbed. | £0 | W3 design doc | 20h |
| **W5** | **HARVI rig assembly** (council-approved 13-0 protocol, ~$200-250 AUD) — build the basic water/silicon rig at iokfarm.co.uk; verify it boots; document the 4-phase protocol on video. **First real defence-relevant physical artefact.** | ~£150 (parts) | HARVI spec on-disk | 16h |
| **W5** | **harvi-evaluation-mcp v0.2** — wire to iokfarm.co.uk sensor stream (temperature, pH, conductivity, DO via existing pond_design sensors). Run first end-to-end HARVI evaluation against a simple humanoid motion test (just the WOLF plate, not the full humanoid). | £0 | W4 harvi-evaluation-mcp + W4 Qidi + W4 WOLF | 24h |
| **W5** | **DSTL application packet update** — refresh `~/clawd/csoai-docs/dstl_application.md` with the new artefact inventory (defoneos-mcp, harvi-evaluation-mcp, WOLF assembled, Qidi reactivated). Re-circulate to DSTL via the existing DSTL grant path. | £0 | W4 + W5 | 6h |
| **W6** | **WOLF sets 2-4** — slice + print sets 2-4 (full Wolfrom gear + encoder + housing). This is the real cost-saving heart: 23 joints × ~£500 WOLF vs ~£14k Encos EC-A. Sets 2-4 = a complete knee + hip + shoulder stack. | ~£250 (PA12-CF × 3 sets) | W4 WOLF plate 7 gate passed | 32h |
| **W6** | **Asimov V8 fabrication path document** — formal write-up of the Path C (CNC-Al + SLM-316L + FDM PA12-CF) split with Xometry + Protolabs + PCBWay quotes. NOT a print — a procurement document. (Per `MEOK_LABS_TAB_PROFILE.md` honesty gap: don't claim a printed humanoid.) | £0 (just doc work) | Existing BOM on-disk | 12h |
| **W6** | **LeRobot SO-101 build** — order $250 of parts (SO-101 arm kit + camera + Pi 5); begin assembly. | ~£200 | Existing SOV3 lerobot_bridge.py | 8h |

**Phase 2 total: ~150h Nick-time over 3 weeks. £830-£880 spend (parts). No direct revenue — but the physical R&D is now demonstrably alive + the harvi-evaluation-mcp runs against a real testbed.**

**Phase 2 critical path:** Qidi must reactivate (W4) before WOLF plate 7 can print. HARVI assembly (W5) blocks harvi-evaluation-mcp v0.2 (W5).

**Phase 2 exit gate:** WOLF plate 7 assembled; HARVI rig assembled; harvi-evaluation-mcp emits a real evaluation report; Asimov V8 fabrication path document signed off; DSTL packet refreshed.

---

## PHASE 3 — STANDARDS (W7-9) — £3-8k spend, £0-50k revenue (DASA themed-call response)
*Goal: csoai-defoneos is a credible standards body — 33-agent BFT council shadow-mode + AUKUS Pillar 2 assurance spec v1.0.*

| Week | Deliverable | £ value (E) | Dependency | Hours (Nick) |
|---|---|---|---|---|
| **W7** | **33-agent BFT council — shadow mode** — bootstrap the 6 specialised quorums (see Canonical Spec §2) as configurable personas. 22/33 supermajority required for care-membrane changes; ≥16/33 for procurement attestations. Run 3 shadow votes on internal care-membrane policy questions. | £0 | Existing bft-progress-council + openpatent BFT | 24h |
| **W7** | **sapient-bridge-mcp v0.1** — wraps DSTL SAPIENT proto files as MCP tools (sensor_fusion / autonomous_decision_governance). Source from `gh api repos/dstl/SAPIENT-Proto-Files`. | £0 | DSTL SAPIENT on GitHub | 16h |
| **W7** | **stone-soup-bridge-mcp v0.1** — wraps DSTL Stone-Soup target tracking as MCP (track_init / track_update / track_merge). Source from `gh api repos/dstl/Stone-Soup`. | £0 | DSTL Stone-Soup on GitHub | 16h |
| **W8** | **yawning-titan-bridge-mcp v0.1** — wraps DSTL YAWNING-TITAN cyber-RL env as MCP (env_reset / env_step / agent_train). Source from `gh api repos/dstl/YAWNING-TITAN`. | £0 | DSTL YAWNING-TITAN on GitHub | 16h |
| **W8** | **AUKUS Pillar 2 assurance spec v0.5** — flesh out the 5-eyes audit chain. Concrete reference to US CDAO + UK DAIC + AUS DSTG + CAN CFINTCOM + NZ DIA positions. Compatible with the proposed AUKUS AI evaluation framework. | £0 | W3 skeleton + W7 BFT | 20h |
| **W8** | **DASA themed-call response** — submit a £50-150k DASA proposal for "AI assurance + physical evaluation for AUKUS Pillar 2 autonomous systems". The proposal cites defoneos-mcp + harvi-evaluation-mcp + the iokfarm.co.uk testbed. Submission deadline likely 14-21 days from open. | Potential £50-150k contract | W6 DSTL packet + W7-8 spec | 16h |
| **W9** | **five-eyes-attestation-mcp v0.1** — cross-jurisdiction audit chain. UK → US → AUS → CAN → NZ keys; every attestation Ed25519-signed + openpatent.ai-anchored + (optional) Bitcoin OTS. | £0 | Openpatent.ai proof + 33-agent BFT | 24h |
| **W9** | **JSP 936 alignment document v1.0** — formal mapping of every defoneos-mcp tool to a JSP 936 policy requirement. This is the procurement-grade artefact that DAIC + DSTL will read first. | £0 | W7-8 specs | 20h |
| **W9** | **csoai-defoneos whitepaper v1.0** — 30-page PDF, "DEFONEOS: A Sovereign, Open-Source, MCP-Native AI Compliance Substrate for UK Defence and AUKUS Pillar 2". Distribution: open access on csoai-defoneos site + sent to DSTL/DAIC/AWE/NCSC. | ~£300 (design + print) | All W7-W8 | 16h |

**Phase 3 total: ~168h Nick-time over 3 weeks. £300-£500 spend + £0-£150k DASA potential. The standards surface is now real.**

**Phase 3 critical path:** 33-agent BFT (W7) must be in shadow before any AUKUS spec vote (W8). W9 whitepaper is the natural input to W10-12 pilot.

**Phase 3 exit gate:** 33-agent BFT shadow mode + 3 new DSTL-bridge MCPs + AUKUS Pillar 2 assurance spec v0.5 + DASA themed-call submitted + JSP 936 alignment v1.0 + csoai-defoneos whitepaper v1.0.

---

## PHASE 4 — PILOT → £1M CONTRACT (W10-12) — £5-15k spend, £25k-£1M revenue (DSTL evaluation contract + prime subcontracts)
*Goal: one signed DSTL evaluation contract (£25-75k) + 1-2 prime subcontracts (£50-200k each) = path to £1M by W26.*

| Week | Deliverable | £ value (E) | Dependency | Hours (Nick) |
|---|---|---|---|---|
| **W10** | **DSTL evaluation pilot — formal engagement** — submit the `csoai-docs/dstl_application.md` Tier 2 contract (£25-75k). Site visit prep. Care Membrane + harvi-evaluation-mcp + WOLF + HARVI rig all in evidence pack. | £25-75k (signed) | Phase 1-3 artefacts | 24h |
| **W10** | **Babcock / BAE / Thales UK / Leonardo UK — first subcontract pitch** — convert the csoai-defoneos whitepaper (W9) + procurement-grade 1-pager (W2) into 4 prime-subcontract briefs. Each brief = 2-page tailored to the prime's defence-AI stance (see Canonical Spec §5). | Pipeline: £50-200k each | W9 whitepaper | 16h |
| **W10** | **Innovate UK Smart Grant / UKRI Future Leaders Fellowship applications** — open-call proposals for "harvi-evaluation-mcp commercialisation" + "care-membrane safety case for humanoids". ~£150-300k each. | Pipeline: £150-300k each | W5-W9 artefacts | 16h |
| **W11** | **First pilot evaluation — site visit** — host DSTL evaluator at iokfarm.co.uk. Run a real harvi-evaluation-mcp evaluation against the HARVI rig. Deliver the structured report under JSP 936 format. | Enables W12 contract signature | W10 contract | 24h |
| **W11** | **DSEI 2026 (Sep 2026) exhibit prep** — UK Sovereign SME Pavilion application (DASA-curated). Booth = a Qidi Max4 + a printed WOLF set + an iPad running defoneos-mcp. 5-min demo video. | Pipeline: DSEI exposure | All Phase 1-3 | 12h |
| **W11** | **LeRobot SO-101 first care-gated autonomous run** — assemble the SO-101 arm; wire to SOV3 lerobot_bridge.py; run a care-membrane-gated pick-and-place. First real embodied-AI run on the hive. | Demo + credibility | W6 LeRobot kit | 16h |
| **W12** | **Pilot close-out — £1M contract path** — combine signed DSTL evaluation + 1-2 prime subcontracts + 1 grant award into a path-to-£1M ARR document. The W12 deliverable is a deck + a signed P1 contract + a £50k-£200k P2 prime subcontract letter of intent. | £25-75k (signed) + £50-400k pipeline (LOI) | W10 + W11 | 24h |
| **W12** | **DEFONEOS HIVE SEAL — `DEFONEOS_RESEARCH_SEAL_2026-06-27.md`** — public seal document. Lists every artefact shipped in W1-12, every contract signed, every grant applied for, every whitepaper published. The 12-week milestone. | Public credibility | All Phase 1-3 + W10-W11 | 8h |

**Phase 4 total: ~140h Nick-time over 3 weeks. £5-15k spend. £25-75k signed + £50k-£400k LOI by W12 close, with a credible path to £1M by W26.**

**Phase 4 critical path:** DSTL evaluation contract must be negotiated and signed (W10) before site visit (W11) before close-out (W12).

**Phase 4 exit gate:** One signed DSTL evaluation contract (£25-75k) + one prime subcontract LOI (£50-200k) + DSEI 2026 application filed + Innovate UK/UKRI applications submitted + DEFONEOS HIVE SEAL published.

---

## Summary — 12-week burn-down

| Phase | Weeks | Spend (E) | Direct revenue (E) | Pipeline (E) | Cumulative |
|---|---|---|---|---|---|
| 1 Foundation | W1-3 | £0-5k | £0 | £0 | £0 signed |
| 2 Hardware R&D | W4-6 | £830-880 | £0 | £0 | £0 signed |
| 3 Standards | W7-9 | £300-500 | £0 | £50-150k DASA | £0 signed |
| 4 Pilot | W10-12 | £5-15k | £25-75k | £100-500k prime + £300-600k grants | £25-75k signed + £400-1.25M pipeline |
| **TOTAL** | **12 weeks** | **£6.1k-21.4k** | **£25-75k** | **£400k-1.25M** | **Path to £1M ARR by W26** |

---

## Risk register (12-week horizon)

1. **DSTL contract cycle is 6-9 months** — W12 signature may slip to W16-W26. **Mitigation:** DASA themed-call (W8) is the faster revenue path; if DASA answers first, it underwrites Phase 5-8.
2. **Qidi reactivation slips** — if the printer doesn't come back, W4-W6 are blocked. **Mitigation:** outsource the WOLF plate 7 print to a third-party farm (Xometry/Protolabs PCBWay quote) for ~£150. Plan B documented.
3. **HARVI assembly slips** — council-approved spec exists but the rig hasn't been built. **Mitigation:** defer HARVI physical build to W13-W18 if W5 slips; W5 harvi-evaluation-mcp can still run against simulated testbed data.
4. **DASA themed-call doesn't fit** — the 2026 call themes (E) include AI assurance but the wording changes each round. **Mitigation:** write the proposal so it slots into 3 adjacent themes (autonomy, counter-UAS, cyber).
5. **Prime subcontracts move slowly** — defence primes' procurement cycles are 6-12 months. **Mitigation:** aim for LOI by W12, signed contract by W26.
6. **Asimov humanoid on-disk gap** — must not be marketed as a printed artefact. The 28th hive sits on WOLF + HARVI + LeRobot, not Asimov.
7. **Dagon compartment leak** — any cross-reference in W1-W12 artefacts breaks the entire defence posture. Care-membrane compliance is non-negotiable.
8. **Funding gap in W1-W9** — the £6-21k spend is unfunded beyond Nick's own time + domain-sale revenue (per `harvi-funding/EXECUTE_NOW.md`). **Mitigation:** defer W6 LeRobot kit (£200) and W6 WOLF sets 2-4 (£250) if cash is tight.

---

## Companion documents

- `01_UK_DEFENCE_AI_MARKET_BRIEF.md` — the market wedge
- `02_DEFONEOS_HIVE_CANONICAL_SPEC.md` — the architecture
- `04_DEFONEOS_P0_SIGIL.md` — the 5 actions for THIS week
- `DEFONEOS_RESEARCH_SEAL_2026-06-27.md` — the final summary

**Author:** Hermes/JEEVES, MEOK M3, 2026-06-27.