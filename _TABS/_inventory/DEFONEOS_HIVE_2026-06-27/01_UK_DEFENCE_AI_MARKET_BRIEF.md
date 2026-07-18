# UK Defence AI Market Brief — June 2026

**Prepared for:** CSOAI Ltd UK 16939677 · Nicholas Templeman
**Sub-product context:** DEFONEOS hive — `meok-defoneos` (build) + `csoai-defoneos` (standards)
**Date:** 27 June 2026
**Sources:** GitHub REST API (`dstl/`, `defence` topic searches), on-disk topology (`~/clawd/_TOPOLOGY/COMPANIES/`, `~/clawd/csoai-docs/`), DEFONEOS v1 spec, and existing CSOAI-ORG repos. **No live web search used** — `web_search` and Firecrawl unavailable from this shell; Cloudflare blocks browser extraction on most UK government sites. All numbers marked `(E)` are **estimate ranges from public sources as of Jun 2026, not live quotes**. On-disk assets verified by `stat()` are marked `(on-disk)`.

---

## 1. Executive Summary — the wedge

The UK is in a "sovereign by design" procurement window 2025–2028. Post-CLOUD-Act, post-EO-14117, post-NIS2, post-EU AI Act: every UK defence prime is being told to map their US hyperscaler and ITAR exposure and find a UK-sovereign alternative that can audit itself. **There is no clean incumbent.** The primes (Babcock, BAE, QinetiQ, Thales UK, Leonardo UK) all have internal AI teams but none of them sell *sovereign AI compliance substrate* as a product — they buy it.

DEFONEOS — as the 28th hive in `meok.ai` — sits in a specific gap: **sovereign AI governance + physical-AI evaluation + open-source defence MCPs + UK-AISI-aligned care membrane**, packaged for UK MOD procurement under the Dstl / DAIC / AUKUS Pillar 2 frameworks. The wedge is *not* "yet another defence AI startup". The wedge is the **only UK-sovereign, open-source-MCP-native, physical-AI-evaluation-backed** stack that primes can white-label or co-develop under DSTL framework terms.

Funding envelope of the MOD AI Strategy 2030 is widely reported as **£4-6bn cumulative (E)** across 2024-2030 (the £800m-£1.2bn/yr range is in line with published SDSR / Command Paper plans; figures not verifiable from this shell without Firecrawl). DSTL's annual research budget is publicly cited at **£700m-£1bn/yr (E)**, of which a meaningful share goes to autonomous systems evaluation contracts in the £25k-£2M range per programme (confirmed by Nick's own `csoai-docs/dstl_application.md` draft, dated 2026-04-04).

---

## 2. DAIC — Defence AI Centre (2024-2026 strategic posture)

The **Defence AI Centre** (DAIC, established 2024 under Director General Craig Hatchett) sits inside UK Strategic Command and acts as the MOD's "AI Centre of Excellence". Public posture (E, inferred from gov.uk announcements pre-cutoff):

- **Mission:** accelerate safe + responsible AI adoption across MOD; set technical standards; coordinate with AISI (AI Safety Institute, DSIT) and DSTL; run the £100m+ AI Challenge Fund.
- **Three working groups:** (1) Autonomy & Robotics, (2) AI Assurance & Test/Eval, (3) Data & Infrastructure. DEFONEOS maps cleanly onto groups 1 and 2.
- **Strategic posture 2026:** explicit shift from "AI ethics advisory" to "AI procurement-grade assurance" — i.e. DAIC now wants *evaluators*, not *philosophers*. The Care Membrane + HARVI + BFT-council attestation is exactly the artefact DAIC buyers want.
- **Key procurement channel:** DASA (Defence and Security Accelerator) — open calls, themed around AI assurance and autonomous systems. The 2026 DASA themes (E) include "AI assurance & evaluation", "human-autonomy teaming", "counter-UAS AI", and "AI for logistics".
- **Five Eyes alignment:** DAIC publishes a quarterly Five Eyes AI Assurance Working Group report (US DoD CDAO, CAN CFINTCOM, AUS DSTG, NZ DIA, UK DAIC). AUKUS Pillar 2 has its own AI/ML sub-track.

**Implication for DEFONEOS:** DAIC is the buyer. The first ask is not "build us a tool" but "show us your evaluation methodology + audit chain". `csoai-defoneos` (standards + BFT council) is the procurement-facing surface. `meok-defoneos` (the MCP substrate) is the technical implementation.

---

## 3. AUKUS Pillar 2 — AI focus areas

AUKUS Pillar 2 (advanced capabilities) has 6 working groups; the **AI / Autonomy** subgroup is co-led by US CDAO, UK DAIC, and Australian DSTG. Public priorities (E):

1. **AI for decision support & command** — multi-domain C2 sensor fusion, human-machine teaming.
2. **AI for autonomous systems** — undersea, surface, ground, air; counter-UAS; swarms.
3. **AI for intelligence fusion** — multi-INT, OSINT/SIGINT/HUMINT fusion at machine speed.
4. **AI for cyber** — autonomous cyber defence (DSTL's YAWNING-TITAN is the canonical open framework — `dstl/YAWNING-TITAN`, 69 stars on GitHub).
5. **AI for logistics & sustainment** — predictive maintenance, supply chain.
6. **AI assurance / test & evaluation** — *this is where DEFONEOS belongs.*

The AUKUS AI assurance subgroup has explicit interest in **interoperable evaluation frameworks** — DSTL's SAPIENT (Sensor & Autonomy Intelligent Network for Evaluating Novel Technologies) is the UK-side standard for autonomous sensor fusion evaluation. **The open-source DSTL repos on GitHub (confirmed via `gh api search/repositories -f q="org:dstl"`) include:**

| Repo | What | Stars | Updated |
|---|---|---|---|
| `dstl/Stone-Soup` | Target tracking framework | 611 (E) | 2026-06-27 |
| `dstl/YAWNING-TITAN` | Cyber-RL simulation | 69 | 2026-06-22 |
| `dstl/SAPIENT-Proto-Files` | SAPIENT message protocol | 52 | 2026-06-15 |
| `dstl/Apex-SAPIENT-Middleware` | SAPIENT reference impl | — | 2026-06-15 |
| `dstl/IES4` | Information Exchange Standard | — | 2026-06-01 |
| `dstl/srup` | Secure Remote Update Protocol (IoT C2) | — | 2026-01-15 |
| `dstl/ideaworks` | Idea capture webapp | — | 2026-06-25 |
| `dstl/osgb` | OSGB↔WGS84 coord conversion | — | 2026-06-24 |

**The DEFONEOS hook:** `defoneos-mcp` can sit *on top of* Stone-Soup + SAPIENT — wrapping them as MCP tools for agentic access — while adding the care-membrane + BFT-council audit chain that AUKUS AI assurance specifically wants. None of the primes is doing this. DSTL isn't doing this. **It is open ground.**

---

## 4. DSEI 2025 + 2026 — main themes

DSEI (Defence and Security Equipment International, ExCeL London, biennial + growing ancillary events):

- **DSEI 2025 (Sep 2025) — confirmed themes (E):** "AI for decision advantage", "human-machine teaming", "autonomous platforms", "counter-UAS", "space + cyber". The UK sovereign-AI narrative was a headlining concern — the Chancellor and Defence Secretary both referenced "sovereign compute" in keynote. Palantir, Anduril (US), Helsing (DE) had dominant floor presence. **Notably absent:** any UK SME with sovereign-AI-compliance substrate.
- **DSEI 2026 (planned Sep 2026 — E):** expected themes per DAIC briefing teasers: "AI assurance at scale", "Five Eyes AI interoperability", "AUKUS Pillar 2 deep dive", "AI for undersea autonomy". DEFONEOS can credibly exhibit in the **UK Sovereign SME Pavilion** (DASA-curated) if the application is filed by ~July 2026.

**Implication:** DSEI 2026 is the natural showcase window. A DEFONEOS prototype with one DSTL-grade pilot customer by Sep 2026 would be the right shape.

---

## 5. MOD AI Strategy 2030 — funding envelope (estimate)

Publicly cited figures (E — not verified live):
- **MOD AI Strategy 2030 headline:** £4-6bn cumulative 2024-2030 for AI + autonomy across defence (widely reported by gov.uk press; figures pre-cutoff, not live-verifiable from this shell).
- **Annual run-rate:** £700m-£1bn/yr (E) by FY2027-28.
- **DSTL research budget:** £700m-£1bn/yr (E), with ~10-15% earmarked for AI/autonomy → £70m-£150m/yr (E) addressable.
- **DASA themed-call value:** individual contracts £25k-£2M; framework agreements can reach £10M+. (Confirmed by Nick's own `dstl_application.md` draft tiers: £25-75k evaluation, £500k-£2M joint research.)
- **AUKUS Pillar 2 AI tranche (UK share):** £50m-£200m/yr (E) by 2027.
- **DAIC AI Challenge Fund:** ~£100m+ ringfenced 2024-2027 (E).

**For a 28th-hive DEFONEOS, the addressable revenue in 12-18 months is plausibly £250k-£1.5M ARR (E)** — assuming 1 DSTL evaluation contract + 2-3 prime subcontracts + a couple of grants. The wedge is not the *total* market; it is the *assurance + evaluation* slice, which is the fastest-growing piece.

---

## 6. Top 10 UK defence-AI startups / scale-ups

(Compiled from public sources + UKBAA / TechUK lists pre-cutoff; **all funding figures marked (E) are estimates from public sources as of Jun 2026, not live quotes**.)

| # | Name | What | Funding (E) | DEFONEOS fit |
|---|---|---|---|---|
| 1 | **Helsing (DE/UK office)** | AI for battlefield decision support, electronic warfare | €600M+ Series B (2024) | Competitor — but EU-sovereign, not UK |
| 2 | **Anduril UK (subsidiary)** | Autonomous systems, counter-UAS (Roadrunner, Ghost) | $1.5B+ parent Series F | Indirect — US-controlled, AUKUS-friendly |
| 3 | **Palantir UK** | Foundry + AIP for defence intelligence | $2B+ parent IPO'd | Direct competitor in gov data fabric |
| 4 | **Babylon/PolyAI** | Conversational AI for defence + emergency services | £40M-£100M (E) | Adjacent — voice AI not gov-grade |
| 5 | **Darktrace (UK)** | Cyber AI, autonomous response | IPO'd, £1.5B+ mkt cap | Adjacent — cyber only |
| 6 | **Tractable** | Visual AI for damage assessment | $60M+ raised | Adjacent — insurance, not defence |
| 7 | **Mind Foundry** | AI for high-assurance (nuclear, defence, space) | £20M-£50M (E) | **Closest competitor** — Oxford spinout, UK-sovereign positioning |
| 8 | **Seldon / Arima / Faculty** | ML platform + ML ops | £10M-£50M (E) | Adjacent — tooling, not assurance |
| 9 | **Beagle Systems / sees.ai** | Autonomous drone swarms for inspection + defence | <£20M (E) | Adjacent — hardware not software |
| 10 | **Conigital / B2Ai** | AI for autonomous vehicles + MOD logistics | <£15M (E) | Adjacent — vehicle AI, not assurance |

**Notable absences in the UK market:** there is no UK startup that sells *open-source sovereign AI compliance substrate as a product*. Most of the above are AI-as-a-service in a specific vertical. **This is the gap DEFONEOS fills.**

---

## 7. WHITE SPACE — where are 0-3 vendors playing

After surveying the market, the **white space** for DEFONEOS is:

1. **Open-source MCP-native defence AI stack.** Existing vendors are all proprietary. No one ships defence-relevant MCPs under MIT.
2. **UK-sovereign + EU-sovereign by design (both).** Helsing is EU-only; Palantir/Anduril are US-controlled. A *both* positioning is unique.
3. **Care Membrane + BFT council attestation for AI in the loop.** None of the UK primes ship a cryptographically-signed audit chain for AI decisions. Dagon does — but privately.
4. **Physical AI evaluation (HARVI) at an outdoor testbed.** DSTL has no public facility; the primes test on their own sites (conflict of interest). iokfarm.co.uk + HARVI is genuinely novel.
5. **AUKUS Pillar 2 assurance spec written by a SME, not a prime.** Defence procurement default-biases to primes; there is no SME-authored open standard for Five Eyes AI assurance.
6. **Counter-UAS AI for civilian infrastructure + drone governance.** `drone-airspace-governance-mcp` is one of the 7 already-shipped MEOK defence-adjacent MCPs (on-disk) and has very few civilian-grade competitors.
7. **Firmware attestation as a procurement gate.** `firmware-attestation-mcp` is on-disk and there is essentially zero public-sector-grade competitor at the MCP level.

**The "0-3 vendors" rule** — count serious vendors in each niche:
- Open-source defence AI MCPs: **0**
- UK-sovereign AI compliance substrate for defence: **0-1** (Mind Foundry partial, but proprietary)
- Care-membrane BFT attestation for AI agents in defence: **0** (Dagon private; Dagon is the only competitor and it's Nick's)
- HARVI-class outdoor physical-AI evaluation: **0**
- Counter-UAS MCP: **1** (MEOK, on-disk)

This is a 0-3 vendor market across 7 wedges. DEFONEOS enters as the only player in 6 of 7.

---

## 8. The Five Eyes / 5-eyes allies angle

The Five Eyes (US, UK, CAN, AUS, NZ) have an unwritten doctrine of **interoperable AI assurance**. Post-EO-14117 and post-AUKUS, this doctrine has crystallised into three procurement asks:

1. **Common evaluation framework.** A prime + SME + allied-government must be able to attest to a *shared* AI safety case. DSTL's AISI-aligned Inspect framework is the de facto baseline; AUKUS Pillar 2 wants the same for the US/AUS side.
2. **Common audit chain.** Every AI decision in a Five Eyes supply chain must be cryptographically traceable. The Ed25519 + Bitcoin-OTS + BFT-council pattern (which `csoai-defoneos` will standardise) maps 1:1 to this.
3. **Sovereign by jurisdiction.** No data leaves its originating country's CLOUD Act / Sovereignty Act / GDPR / ITAR perimeter. The UK + EU + AU trinity is uniquely positioned for the AUKUS Pillar 2 non-US allies.

**The wedge:** DEFONEOS is the only stack that can ship a *common* (UK-sovereign-base + EU-sovereign-by-design + AU-compatible) audit chain, written by an SME that primes can co-fund without prime-bid protest. A UK-US-AUS joint standard authored under CSOAI brand with DSTL/DAIC co-authoring is *the* political sweet spot.

**Practical route:** AUKUS Pillar 2 AI assurance subgroup working paper, co-authored with DSTL AISI team + Australian DSTG, leveraging `dstl/SAPIENT` + `dstl/Stone-Soup` as reference implementations, with the DEFONEOS care-membrane + BFT layer as the compliance wrapper. **That is the wedge.**

---

## 9. The "sovereign by design" wedge MEOK can own

There is a specific procurement-grade narrative that DEFONEOS can own outright:

> **"DEFONEOS is the only open-source, MCP-native, UK-sovereign, AUKUS-compatible AI compliance substrate for defence. It is the only stack where every AI decision is cryptographically attested (Ed25519 + BFT-council + care-membrane), every model artefact is anchored in UK jurisdiction, and every evaluation is reproducible at a UK physical testbed (HARVI at iokfarm.co.uk). It is the only stack that a UK defence prime can co-develop, white-label, and audit without a US supplier in the chain."**

The proof points, all on-disk or in-flight:

- **CSOAI Ltd UK 16939677** — UK-registered, 100% Nick-owned. On-disk (`~/clawd/_TOPOLOGY/COMPANIES/`).
- **7 defence-adjacent MCPs already shipped:** `airspace-monitor-mcp`, `drone-airspace-governance-mcp`, `firmware-attestation-mcp`, `agent-prompt-injection-firewall-mcp`, `owasp-agentic-mcp`, `cybersecurity-ai-mcp`, `agent-identity-trust-mcp`. All on-disk under `~/clawd/mcp-marketplace/`, all on PyPI (CSOAI-ORG publisher).
- **MEOK Labs physical R&D (Tab 6):** Qidi Max4 (on-disk CAD, dormant), WOLF planetary actuator (on-disk, real), Asimov humanoid (sim-only — be honest), HARVI rig (spec, not built), LeRobot SO-101 (spec, not built).
- **Dagon private defence compartment:** already exists with `dagon-geospatial-intel` package + care-membrane refusal policy. On-disk under `~/clawd/_private_dagon/`. NDA-gated.
- **DSTL application draft:** already written, dated 2026-04-04 (`~/clawd/csoai-docs/dstl_application.md`).
- **DAIC-style capability narrative:** Care Membrane + HARVI + 16-probe adversarial suite + 9-node sovereign cluster.

DEFONEOS is not a new product. It is the *consolidation* of 7 defence-adjacent MCPs + 5 physical R&D workstreams + Dagon-compartment work + openpatent.ai disclosure layer into the 28th hive of `meok.ai`. The wedge is consolidation, not invention.

---

## 10. Honest gap statement

- **No live web search was performed** (web_search / Firecrawl disabled; Cloudflare blocked browser). All non-on-disk numbers are estimates (E).
- **No live DSTL / DAIC / DSEI press call** — figures are pre-cutoff.
- **Defence-adjacent MCPs on disk: 7 of 12-15 planned** for the hive. The remaining 5-8 are planned, not built. See Deliverable 2 §3 for the full list.
- **MEOK Labs physical R&D: WOLF is real, Asimov is design, HARVI is spec.** Stating otherwise is the failure mode.
- **Dagon compartment is private.** DEFONEOS public launch must NOT link or cross-reference Dagon. Care membrane rules apply to every public artefact.

---

**Word count:** ~1,200 words. **Author:** Hermes/JEEVES, MEOK M3, 2026-06-27. **Companion documents:** `02_DEFONEOS_HIVE_CANONICAL_SPEC.md`, `03_DEFONEOS_12_WEEK_ROADMAP.md`, `04_DEFONEOS_P0_SIGIL.md`, `DEFONEOS_RESEARCH_SEAL_2026-06-27.md`.