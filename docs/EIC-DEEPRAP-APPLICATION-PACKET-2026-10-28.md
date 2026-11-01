# EIC Pathfinder Challenges 2026 — DeepRAP · APPLICATION PACKET (CSOAI LTD)

**Call:** HORIZON-EIC-2026-PATHFINDERCHALLENGES-01-03 — *DeepRAP: Deep Reasoning, Abstraction & Planning towards
trustworthy Cognitive AI Systems*
**Deadline:** **28 October 2026, 17:00 Brussels (CET) = 16:00 UTC** — verified today from the EIC Work Programme 2026
and the DeepRAP Challenge Guide (last updated 22-09-2026).
**Indicative budget:** €32 M for DeepRAP (of €96 M across the three 2026 Challenges). **Grant per project: up to €4 M,
100 % of eligible costs, lump sum.** Proposal length: 30 pages (Part B).
**Evaluation weights (2026 Pathfinder Challenges):** excellence 50 %, impact 30 %, implementation 20 %.
**Programme Manager:** Hedi (Mohamed) KARRAY.

Everything in §2–§7 is written from the estate's own verified records (live board, public root, corrections ledger,
the wave-2/3 re-reads, the subject-axis banks). **§8 lists what a human must supply — the proposal is deliberately
not padded with invented numbers, and no figure below is a guess.**

---

## 1. The problem this proposal attacks

DeepRAP asks for cognitive AI systems that are *trustworthy* — capable of causal rather than correlational reasoning,
of abstraction that generalises from limited data, and of adaptive planning under uncertainty — and it asks for
**neuro-symbolic approaches, formal guarantees, and explainable rationales** to be built in, not asserted.

The gap is not that such systems are absent. It is that **the ecosystem that claims them cannot currently tell,
with evidence, whether a specific deployed system does what a given claim says.** A lab publishes a leaderboard; a
vendor publishes a model card; a standards body publishes a mapping; each is a *claim*, and each is re-published,
re-worded and quietly superseded on a timescale of days. In the estate's own monitoring, **32 of 77 public claim pages
changed their visible text within a single day** (wave 3, 2026-10-28, n=77, every URL re-read live, digests
published). Meanwhile a board that measures cognitive capability across 14 comparison axes currently separates a
leader on **zero** of them — 7 TIE, 7 UNTESTED — and a body that has signed 325 measurement cards still has to
publish, and keep publishing, the corrections to its own claims.

**This proposal builds the ground truth that makes "trustworthy cognitive AI" a measurable property of a deployed
system rather than a marketing adjective:** three instruments that turn cognitive claims into re-readable, signed,
refutable measurements — and that say *TIE* when the evidence says TIE.

---

## 2. The three instruments (the scientific core)

### 2.1 Separation as a measured quantity, with *non-separation* as a first-class result

**Problem.** Cognitive-capability comparisons are published as rankings. The estate's own board refuses to do this:
across 14 model-comparison axes, 0 axes separated a leader, and the board publishes that as the result — a TIE is a
TIE, and an untested axis is named as untested rather than filled with a plausible number.

**Instrument.** A separation estimator built to *refuse* false positives and to make a null result publishable:

- frozen, sha-pinned, **held-out** item banks, **n ≥ 30** per axis, with a byte-identical grader compiled from source
  at run time and hashed into the run (never ported);
- exact two-sided McNemar on paired per-item outcomes, plus Wilson intervals, against an incumbent **and a third arm**,
  with arm-distinctness asserted (an arm that collapses onto the incumbent is refused as vacuous);
- every probe labelled with its family and kind, so a behavioural axis and a financial axis can never be summed;
- n < 30 is a *lower bound*, never a score; a score of exactly 0 or 1 is refused by the gate.

**Why this is new for DeepRAP.** In a trustworthiness research programme, the expected contribution is a system that
is better at reasoning. The estate's contribution is a system that tells you **whether the reasoning system you are
about to deploy is the one that was measured** — a measurement instrument for the *evaluation* of cognitive
capability, with non-detection as a designed output. This directly serves the Challenge's demand for explainable
rationales: a rationale that cannot be re-derived from the run is not an explanation.

### 2.2 Serving fidelity for cognitive systems: does the claimed mind answer?

**Problem.** A cognitive claim is made about a *model*; the answer comes from a *deployment*. The estate's own
separation work found the trap twice: a requested model alias was answered by a newer model in the same family
(requested `DeepSeek-V3-0324`, served `DeepSeek-V4.1-Flash`), and an arm that collapsed onto the incumbent would have
been published as a TIE that measured nothing.

**Instrument.** A serving-fidelity probe suite for cognitive deployments, measuring: the requested alias against the
returned model field; the system fingerprint against the declared one; exact-token echo and canary-token log-prob
parity; and undeclared quantisation or speculative-decoding drift. Each measurement is a signed, dated receipt; the
serving endpoint is the subject, not the code.

**Why this is new for DeepRAP.** DeepRAP's "trustworthy" asks that reasoning be explainable *in a deployed cognitive
system*. If the served artefact is not the measured artefact, every downstream claim — about reasoning, abstraction
or planning — is about something else. This is the missing trust anchor between a cognitive architecture and its
deployment, and it is measurable without a GPU: it is a property of the serving path, not of the weights.

### 2.3 Claim maintenance: a cognitive-validity instrument

**Problem.** Cognitive systems produce *claims* (plans, rationales, conclusions). Those claims are published, then
re-worded, quietly revised, or withdrawn, and no public mechanism notices. The estate's monitoring re-read 77 public
claim pages twice, 30 s apart, and hashed the extracted visible text: **62 of 77 changed raw bytes in three days**,
and wave 3 attributed **32 of 77** as genuine visible-text changes in a single day.

**Instrument.** A standing re-read loop with a text-digest baseline, a churn discriminator (two reads, 30 s apart), an
explicit materiality adjudication, and a public corrections ledger — 93 corrections today, of which **58 are
withdrawn from quotable use and 1,682 superseded**, each with a correction id, an old value, a new value, and a
reason. The ledger records `UNVERIFIED` where that is the truth, and `published_at: UNRECORDED` where the estate
cannot honestly say when a correction reached the public surface.

**Why this is new for DeepRAP.** This is the "abstraction and generalisation" discipline applied to *published
cognition*: a claim that drifts without a correction is a degraded abstraction, and a body that withdraws its own
claims in public is the only kind of measurement infrastructure a trustworthiness programme can rely on. It also
gives the Challenge a rare asset: **negative results as first-class evidence.**

---

## 3. Why CSOAI can do this (the capability evidence)

| Asset | Verified state (2026-10-27/28) |
|---|---|
| Live public measurement board | 33 axes · 23 measured · 10 unmeasured (subject family), 14 model-comparison axes with **0 separated** — published as such |
| Signed card corpus | public Merkle root, **325 leaves**, `as_of 2026-10-27T21:20:49Z`, Ed25519-signed, independently verifiable at a public URL |
| Corrections ledger | **93 corrections**, signature VALID; 58 withdrawn from quotable use; 1,682 superseded; withdrawal reasons published |
| Claim-maintenance re-reads | wave 1 (2026-10-24), wave 2 (2026-10-27), **wave 3 (2026-10-28)** — the first with an attributable, text-level delta (32/77 in 24 h) |
| Subject-axis banks | **five real banks** built from live bytes (n_valid 40/34/35/33/40), one must-fail negative control per item, each with a **declared frame** (population, inclusion rule, file digest, reachability) |
| Governance rails | fail-closed G2 gate (n ≥ 30, transport ≤ 5 %, unparsed ≤ 10 %, no endpoint scores, no duplicate cells); human merge as the only gate on the signing path |
| Public verification | a public, free, self-serve verifier; 12 published Agent Skills for machine consumers; an x402 rail for paid evidence |
| Regulatory mapping | the published east–west crosswalk now maps **51 of 417** frozen provisions (GDPR, CRA, DORA, NIS2, CSRD, EU AI Act, Illinois SB 315, GB/TC 260) |
| Standards seat | W3C AI agent-conformance participant; two IETF individual drafts; a live NIST AITE intake route |
| Distribution | councilof.ai, an Agent Skills discovery index, MCP surfaces, and a public proof ledger |

**And the honest weaknesses, which the proposal answers rather than hides:** 0 of 14 comparison axes separated; ten
subject axes are declared slots, not measurements; the OIDC board signer was manual-only; the corrections' propagation
had never been re-read (it was, on 2026-10-28 — first result: 10 mechanically verifiable, 8 propagated, 2 candidates,
**both adjudicated as false positives**); and the 2026-10-27 corrections to the estate's own prior claims remain the
single best evidence that the substrate catches its own errors.

---

## 4. Work packages (30 pages Part B; lump sum; 100 % funding)

| WP | Months | Content | Instruments |
|---|---|---|---|
| WP1 | M1–M36 | **Separation ground truth.** Extend the estimator beyond behaviour to **cognitive capability**: reasoning, abstraction and planning axes with held-out, sha-pinned banks (n ≥ 30), exact McNemar against incumbent and a third arm, arm-distinctness asserted, non-separation published as a result. | 2.1 |
| WP2 | M1–M24 | **Serving fidelity for cognitive deployments.** Alias/fingerprint/canary-parity probes across cognitive deployments; drift detection for undeclared quantisation and speculative decoding; the resulting receipts become the substrate other work relies on. | 2.2 |
| WP3 | M1–M36, continuous | **Claim maintenance & correction.** Standing re-read of published cognitive claims (public institutions, labs, standards bodies, registries) with text-digest baselines, churn discrimination, human materiality adjudication, and a public corrections ledger with propagation readbacks. | 2.3 |
| WP4 | M6–M30 | **Cognitive-task benchmark design.** Task families for causal inference, concept formation from limited data, and hierarchical planning under uncertainty; each with a frozen bank, a negative control, and a byte-identical grader; the bank design is published with the run. | 2.1, 2.2 |
| WP5 | M1–M36 | **Standards and integration.** Extend the published crosswalk across the EU instrument set and into standards bodies; machine-readable evidence surfaces (Agent Skills, MCP, public verifier) so that a claim's evidence is consumable by a machine, not only by a reader. | 2.3 |
| WP6 | M1–M36 | **Portfolio activities (≥ 10 person-months).** Dedicated work package for the Challenge portfolio under the Programme Manager: shared benchmark design across projects, joint falsification reviews, and the cross-project evidence plumbing the portfolio requires. | Challenge Guide §4.1 |
| WP7 | M1–M36 | **Open dissemination.** Benchmarks, banks, graders, the estimator and the readback harness released openly under a permissive licence, with the signed corpus and every correction published. | all |

**Budget frame (lump sum, to be completed with the owner's figures).** €4 M ceiling, 100 % of eligible costs, 36
months, no unit-cost audit. Indicative allocation for the owner's arithmetic: WP1 22 %, WP2 18 %, WP3 16 %,
WP4 16 %, WP5 8 %, WP6 10 % (**≥ 10 person-months, Challenge Guide §4.1**), WP7 10 %. Remaining costs: staff effort
(including the Challenge portfolio effort), compute for held-out grading, travel and dissemination, and subcontracted
benchmark design. **No salary, rate or headcount figure below is invented: §8 lists the human facts required to
complete the budget table.**

---

## 5. The Challenge's own category self-assessment (Guide §3.1)

| Category | Focus | Secondary | Evidence / justification |
|---|---|---|---|
| **1 · Cognitive Function Capability** | ☐ **DR** ☐ DA ☐ DP ☐ **MC** | ☐ **DA** ☐ **DP** | **DR + MC (primary):** the instrument is an explainable decision procedure over per-item outcomes — every separation verdict is re-derivable from a hashed grader and a frozen bank. **DA (secondary):** claim-drift monitoring is generalisation-from-limited-data applied to published cognition, and the non-detection result (a TIE) is a designed abstraction of "no difference is present". **DP (secondary):** the maintenance loop is a continual re-planning cycle with contingency handling (two reads, a churn discriminator, an escalation path). |
| **2 · Technological Approach** | ☐ **NeSy** ☐ **FMI** | ☐ **CA** ☐ **MMI** ☐ **TM** | **NeSy + FMI (primary):** neural capability claims are separated by symbolic verification — sha-pinned banks, exact statistical tests, fail-closed gates, signed receipts with a Merkle root; a verdict that cannot be re-derived is not published. **TM (secondary):** the serving-fidelity axis is technology monitoring of the deployed artefact (alias, fingerprint, quantisation, speculative decoding). **CA (secondary):** the measurement loop is an architecture with an explicit trust policy (refuse, record, adjudicate, publish). **MMI (secondary):** subjects are multimodal evidence — text, logs, bytes, signed artefacts. |
| **3 · Application Domain** | ☐ **AS** ☐ **DSS** | ☐ **SD** ☐ **CS** ☐ HAIC | **AS (primary):** the subject is a deployed AI system, and the claim is about that system. **DSS (secondary):** the outputs are decision-support — assurance evidence for insurers, procurement and regulators. **SD (secondary):** the jail and prompt-overlay axes are the security surface, and the serving-fidelity instrument detects the weight-swap/quantisation class of attack. **CS (secondary):** the attestation chain (Ed25519, Merkle, public verification) is the cyber substrate. |
| **4 · Synergies** | ☐ **Ben** ☐ **Int** | ☐ **JPD** ☐ Ben | **Ben (primary):** benchmarking discipline — frozen held-out banks, n ≥ 30, negative controls per item, exact separation tests, refusal to publish an endpoint score. **Int (primary):** integration into regulatory and standards workflows (51/417 provisions mapped and published; a standards body can consume the evidence as machine-readable records). **JPD (secondary):** the joint P&D programme with three academic partners is the intended vehicle for the portfolio work package. |

---

## 6. Excellence / impact / implementation (the 2026 weights)

- **Excellence (50 %).** Novelty is the *instrument class*: separation with non-detection as a publishable result;
  serving fidelity as a measurable property of a cognitive deployment; claim maintenance as a cognitive-validity
  instrument. Methodological rigour is already demonstrated: frozen sha-pinned banks, exact McNemar, arm-distinctness
  assertions, must-fail negative controls per item, declared frames, a fail-closed gate, and a signed receipt chain
  anyone can re-verify. The estate's own corrections (58 withdrawn, 1,682 superseded) are the proof that the
  methodology is not self-congratulatory.
- **Impact (30 %).** The target users are the ones a trustworthiness programme cannot afford to serve badly:
  deployers of cognitive systems (the serving-fidelity instrument tells them *what is actually answering*),
  standards and regulatory bodies (machine-readable, re-readable evidence instead of self-attestation), and the
  research community (open benchmarks with the grader and the bank published alongside the result). The published
  crosswalk (51/417) and the public verifier are the distribution channels; Agent Skills and MCP make the evidence
  machine-consumable.
- **Implementation (20 %).** 36 months, WP structure with a continuous WP3, ≥ 10 person-months committed to portfolio
  activities per the Challenge Guide, and an open dissemination WP. Risk is managed by design: every measurement has a
  negative control, and the estate's own practice is to publish a refused or untested result rather than a convenient
  one.

---

## 7. Risks and mitigations (with the estate's own failures, stated)

| Risk | Mitigation |
|---|---|
| No separation is found (0/14 today) | Designed-for: the estimator publishes non-separation as the result. The scientific claim is that *finding nothing, rigorously, is the trustworthy answer* — and the banks are built so that a future separation is detectable when it is real. |
| The served model drifts from the claimed model | WP2 instruments it; a mismatch is a signed, dated finding, not a footnote. |
| Published claims drift silently | WP3 re-reads with a text-digest baseline and a published corrections ledger; propagation is re-read, not assumed (first run, 2026-10-28). |
| Ten subject axes are declared slots, not measurements | Named as the estate's current state, with the frame-and-predicate gap stated, and the frames declared rather than implied. |
| Benchmarks are over-fitted to the estimator | Held-out banks, byte-identical graders hashed at run time, negative controls per item, and a published negative result on the estimator's own controls. |
| The estate is small | Portfolio is designed for collaboration, not competition: WP6 is explicitly the joint work package, and the 3-piece academic programme is the intended vehicle. |

---

## 8. What a human must supply (the honest list — no invented facts)

1. ~~The applicant entity and the eligibility ruling.~~ **SETTLED 2026-10-29 — see
   `EIC-DEEPRAP-NOT-SUBMITTED-RECORD-2026-10-29.md` §3 (eligibility ruling) and §4 (non-submission reasons).**
   A **single-applicant** submission by CSOAI LTD was **eligible in principle**: the Challenge permits a single legal
   entity in a Member State **or Associated Country** (EIC Work Programme 2026 p. 33), the UK is an Associated Country
   (WP 2026 p. 176, fn 286), and the DeepRAP chapter (pp. 44–47) carries no eligibility carve-out. **No consortium was
   required** — it was an alternative route, so no partner had to be found, named or signed. The mid-cap restriction
   ("in the case of single beneficiary projects, mid-caps and larger companies will not be permitted") is satisfied on
   the public record (1 officer, 1 PSC holding 75 %+, FTE 1 — far below the 250-person SME and 499-employee mid-cap
   thresholds), **but no accounts have been filed (first due 2 Oct 2027), so there is no published turnover or balance
   sheet: SME status must be confirmed and declared by the applicant at submission.** The remaining human fact from
   this item is that declaration, not a ruling.
2. **The PIC** (person in charge) with delegated signature authority for the F&T portal, and the portal account.
3. **Key-staff CVs** (rationale, abstraction, planning; measurement science; legal/ethics) and the organisation's
   legal capacity statements.
4. **The budget numbers**: staff effort and rates, compute, travel, dissemination, subcontracted benchmark design —
   the WP percentages in §4 are a frame, not a budget.
5. **The consortium arrangement** (if required): partner, roles, letters, and the co-ordination roles.
6. **Declarations**: ethics, data protection, conflict of interest, and the F&T legal declarations — signed by a human.
7. **The three academic partners** for the joint P&D strand (the 3-piece programme: MIT, Stanford, EPFL — approaches
   not yet made).

---

## 9. Submission mechanics and an honest assessment of the remaining hours

- Submission is via the **Funding & Tender Opportunities Portal**, part B limited to **30 pages**, with the proposal
  entered through the portal's structured forms. The deadline is 17:00 Brussels = **16:00 UTC today**.
- A competitive Part B is **30 pages**. This packet supplies the scientific substance, the category self-assessment,
  the award-criteria mapping, the WP structure, the budget frame and the risk register — i.e. the hard part of the
  thinking, grounded in the estate's verified records.
- What it does **not** supply, because it cannot without a human: the applicant's CVs, the budget arithmetic, the
  consortium, the PIC's signature, and the portal forms.
- **The realistic paths by 16:00 UTC are therefore:** (a) the owner supplies §8 items 1–7 and a submit-ready Part B
  is assembled and uploaded today; or (b) if the eligibility ruling or the consortium cannot be settled today, the
  honest record is a **dated "not submitted, with reason"** — and this proposal is then carried, unchanged, to the
  next EIC Pathfinder Challenge window with the eligibility question already answered.
- **Nothing will be submitted under CSOAI LTD's name, and no legal declaration will be signed, by an agent.** The
  draft is the deliverable; the signature and the upload are the owner's.
