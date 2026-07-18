# Sovereign-Space Simulation of the CSOAI Distribution Universe
## A governed method for profiling a finite, nameable market — white paper draft, 2026-07-08

### Abstract
CSOAI's addressable market is finite and public: ~2,350 organizations / ~4,700 deciders
(governments, regulators, Global-500, four regulated verticals). We treat distribution not as
marketing reach but as **completing a knowable map**. This paper describes a sovereign-space
simulation that enriches each lead into a subject-matter dossier, scores product-fit and market
wedge under a Care-Floor governance gate, and aggregates the results into framework↔charter
crosswalks. We report first results on **655 of 2,363 leads (28%)** — all tier-0-2 priority
accounts plus a tier-9 sample.

### 1. Method
Each lead is run as one governed simulation step:
```
persona × industry-charter × compliance-posture → needs → best-fit charter → wedge → care-floor gate → SIGIL
```
- **Enrichment** infers persona, sector, needs, charter-fit and differentiator from the
  structured public signals already held (company, jurisdiction, industry, compliance_posture,
  side_by_side, public AI signals). Every field is flagged `source=inferred`; mean confidence 0.40.
- **Wedge** is re-based to separate *measured gap* (evidence exists but is weak) from *no public
  evidence* and *no data* — avoiding a false "99.8% advantage" artifact.
- **Governance**: a Care-Floor confidence gate (≥0.35 → serve) and per-record SIGIL digest, the
  same signed spine as the live distribution engine.

### 2. Honest limitations (stated up front)
- **No live website crawl** — the environment cannot fetch general institutional sites.
  Enrichment is inference over held signals, not scraping. This bounds confidence and is why
  each field carries a confidence and an `inferred` tag.
- **28% coverage** — the remaining 1,707 leads await a subsequent enrichment pass (a per-frame
  LLM token ceiling capped this run). Findings marked HYPOTHESIS need the full set to confirm.
- **Sampling skew** — the 655 over-represent regulators/finance/pharma (the top tiers).

### 3. Results (655 leads, DATA-SUPPORTED)
- **Demand concentration:** only **25 of 46 charters** carry any lead demand; **21 have zero**.
  Top five absorb 64% (422/655 matched): accountability (108), data-privacy (104), asi-security (78),
  bias-detection (72), safety (60).
- **The buyer is the CCO/CRO/CISO triad** — Chief Compliance Officer (87), Chief Risk Officer
  (47), CISO (46), VP (58) — not the "Founder/CEO" the outreach copy assumed.
- **Demand surface** (dossier mention frequency): audit 572, compliance 554, governance 481,
  privacy 480, transparency 456, risk 444.
- **The real wedge is "no verifiable posture," not "weak posture."** Of 655 leads, only 8 show a
  measurable compliance gap; **232 have zero public compliance evidence at all**. The strongest
  market position is not "beat your stack" but "you have no signed compliance posture — we give
  you one."

### 4. New crosswalk candidates
51 charter↔framework crosswalk candidates were derived from dossier co-occurrence (each supported
by ≥5 leads); the four frameworks every high-demand charter's leads need are **ISO-42001,
NIST-AI-RMF, GDPR, EU-AI-Act**. Full list in `CSOAI_SIM_CROSSWALKS_2026-07-08.md`.

### 5. Charter improvements proposed
1. Consolidate or retire the 21 zero-demand charters; fold under the top five.
2. Add explicit ISO-42001 / NIST-AI-RMF / GDPR / EU-AI-Act crosswalks to the top-five charters.
3. Set charter primary persona to CCO/CRO/CISO per the demand data.
4. Add a "no-posture" product clause for the 232-lead zero-evidence segment (largest addressable).

### 6. Governance & reproducibility
Canonical `leads`/`side_by_side` tables are read-only; the simulation writes only to `lead_sim`
in a separate database. Every sim record is SIGIL-signed. An 8-check structural batch (8/8 PASS)
verifies canonical integrity, wedge re-basing, care-floor application, and model/serverintegrity.

### 7. Governance NN advance (parallel work)
The **dependency** governance signal — previously absent (zero training rows) — was built this
cycle: a leakage-free classifier on agent needs-state vectors predicts dependency/autonomy-break
events at **ROC-AUC 0.865** on 57 real positive events (1.1% base rate). Exposed as the
`detect_dependency` MCP tool. Honest caveat: small-n, early-warning signal, not a hard gate.

### Status register
- RUNNING: enrichment+sim pipeline, sim DB (655), dependency classifier, e2e batch 8/8, server compiles.
- DESIGNED: full 2,363 coverage, per-lead dependency scoring (needs per-lead needs vectors).
- BLOCKED: live website enrichment (no crawl), remaining 1,707 leads (LLM budget), live mesh (connector detached).
