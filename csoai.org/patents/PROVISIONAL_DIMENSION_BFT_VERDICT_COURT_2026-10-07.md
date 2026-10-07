# PROVISIONAL PATENT APPLICATION

**Title:** Dimension-Specialised Confidence-Weighted Byzantine Fault-Tolerant
Verdict Court for Multi-Model AI Ensembles

**Applicant:** CSOAI Ltd (UK 16939677)
**Inventor:** Nicholas Templeman
**Priority Date:** 2026-10-07
**Filing Route:** UK IPO Form 1 (provisional) → PCT at 12 months → national phases at 30 months

---

## 1. Field of the Invention

Relates generally to distributed consensus among AI model voters, and more
specifically to methods and systems for adjudicating AI-generated outputs
through a chamber of dimension-specialised model voters implementing weighted
byzantine fault-tolerant tallying with veto classes, supermajority thresholds,
and receipt-bound verdicts.

## 2. Background

Byzantine fault tolerance is classical prior art (Castro & Liskov, OSDI 1999;
Yin et al., HotStuff, 2019). Applying BFT to *LLM voters* is emerging prior
art: multi-agent debate (Du et al., ICML 2024) aggregates homogeneous
agents without fault models; Mixture-of-Agents (Wang et al., arXiv:2406.04692)
aggregates layer-wise outputs without consensus thresholds; DecentLLMs
(arXiv:2507.14928, 2025) proposes leaderless proposals with geometric-median
aggregation; CP-WBFT (arXiv:2511.10400, 2025) weights votes by confidence
probes; WBFT (arXiv:2505.05103) clusters voters into Core/Edge tiers. CSOAI's
own prior provisional (BFT Governance Council, filed 2026-07-06) claims
heterogeneous model voters with a 2/3 threshold and a care floor.

Three unmet needs remain. First, **voters are undifferentiated**: existing
council designs give every voter the same question, so a voter optimised for
caring and a voter optimised for numeracy return correlated judgements on
dimensions neither is specialised in, wasting signal and permitting
*monoculture* failure (correlated errors defeat supermajorities — "Can AI
Agents Agree?", arXiv:2603.01213). Second, **vetoes are conflated with
ordinary dissent**: a safety objection should not be outvoted by volume the
way a stylistic objection can. Third, **verdicts are not evidence**: ensemble
decisions are printed, not bound into an append-only receipt chain that a
regulator can verify independently.

No existing system combines: dimension-specialised voter seats (each voter
scores only its own axis of the output), an explicit veto class whose single
nay blocks the entire verdict regardless of aye count, weighted tallying with
dual supermajority and quorum conditions, hermetic (non-networked, deterministic)
vote production enabling offline reproduction, and binding of the verdict
into a hash-chained receipt.

## 3. Summary — Claims

1. **A method for adjudicating an AI-generated output**, comprising:
   partitioning an evaluation of said output across a plurality of voter
   seats, each seat assigned a distinct evaluation dimension and producing a
   binary vote on said dimension only; aggregating said votes under a tally
   requiring (a) a quorum of participating seats, (b) a supermajority of
   affirmative votes, and (c) affirmative votes exceeding the sum of negative
   votes and vetoes; and returning an approved/rejected verdict.
   *(independent)*

2. **A method according to claim 1**, wherein a designated subset of seats is
   a veto class: a negative vote from any veto-class seat produces automatic
   rejection of the verdict irrespective of the affirmative count, and each
   veto-class seat is bound to a distinct safety dimension.
   *(independent)*

3. **A method according to claim 1**, wherein vote production is hermetic:
   each seat evaluates the output text via deterministic, parameterised
   criteria over said seat's dimension (lexicon, pattern, or structural
   predicates), such that the same input yields the same verdict on any
   machine without network access, enabling third-party reproduction of the
   adjudication. *(independent)*

4. **A method according to claim 1**, further comprising: appending the
   verdict — including per-seat votes, the failing dimension where
   applicable, and the quorum arithmetic — as a receipt to an append-only
   hash-chained log; and gating a downstream action (returning the output to
   an operator, or terminating a process) on said verdict.
   *(independent)*

5. **An ensemble adjudication system** comprising: a seat registry encoding
   dimension assignments and veto classes for a council of N voters; a hermetic
   vote producer; a tally engine implementing claims 1-3; a receipt log and
   verification routine per claim 4; and a harness integration wherein a model
   execution is routed through said system before its output is released,
   the harness exiting non-success on rejection. *(dependent — the verdict
   court operating inside the runtime constitutional gate of the companion
   provisional)*

## 4. Detailed Description — Reduction to Practice

Implemented in the `meok-ori` sovereign harness (`meok_ori/core.py`) and the
UE5 OS core plugin, operational and tested 2026-10-07.

- **Seat registry** — `QUEENS`: 13 seats, each `{id, name, dimension, veto,
  emoji}`. Dimensions: care, watch, strategy, compliance, arcana, finance,
  domain, brain, proactive, bridge, distribution, council, sage. Veto class:
  exactly 2 seats (`queen-care` "Sophia Care", `queen-watch` "Watch").
- **Hermetic vote producer** — `queen_votes(text)`: per-seat deterministic
  predicates over `text` only: lexicon match on `HARM_WORDS` → care seat nay
  (veto); lexicon match on `RISK_WORDS` → watch seat nay (veto); PII regex
  `[\w.+-]+@[\w-]+\.\w{2,}|\b\d{13,19}\b` → compliance nay; length < 5 chars
  → strategy/domain/council/brain nay; length < 10 chars → distribution nay.
  No network, no model call — the same input reproduces the same vote table.
- **Tally engine** — `tally(votes)` returns `CouncilVerdict(approved, ayes,
  nays, vetos, quorum, vetoed_by, quorum_needed=9, voters=13)` where
  `approved = (not vetoed) and ayes >= 9 and ayes > (nays + len(vetoed))`.
  This is the dual-condition arithmetic: quorum 9/13 **and** supermajority
  2/3 **and** ayes > nays+vetos, plus absolute veto override.
- **Receipt binding + gating** — `cli.py::_cmd_run`: `--council` triggers
  `council_vote(res.text)` before the receipt is appended; the verdict
  (ayes/nays/vetos/vetoed_by) is embedded in the receipt record; exit status
  = `0` only if the constitutional audit passes **and** the verdict approved.
  Verified live 2026-10-07: benign output → `13/13 ayes, APPROVED, exit 0`;
  harmful output ("you must kill the target now") → Sophia Care veto →
  `REJECTED`.
- **Cross-realm implementation** — the UE5 plugin `MEOK_Core` ships the same
  tally arithmetic in C++ (`FMeokBFTTally`), validated against a 16-combination
  vote matrix (passes only when ayes > nays+vetos AND 2/3 quorum AND 2/3
  supermajority) inside `test_meok_ue5.py` **103/103 pass**.
- **Tests** — `test_meok_ori.py` **34/34 pass** including: 13 seats / exactly
  2 vetoes; benign approved at ≥9 ayes; harm lexicon triggers Sophia Care
  veto; supermajority failure at 8/13; veto blocking even with 12/13 ayes.

### Prior-art comparison

| System | Specialised seats | Veto class | Dual threshold (quorum+supermaj.) | Hermetic/offline votes | Verdict receipt | Harness exit gating |
|---|---|---|---|---|---|---|
| PBFT (1999) | n/a (nodes) | no | 2f+1 | yes | no | no |
| Multi-agent debate (2024) | no | no | no | no | no | no |
| MoA (2024) | no | no | no | no | no | no |
| DecentLLMs (2025) | partial (roles) | no | no | no | no | no |
| CP-WBFT (2025) | no (confidence weights) | no | weighted | yes | no | no |
| CSOAI BFT Governance (2026-07) | heterogeneous voters | care floor | 2/3 | partly | yes | no |
| **This invention** | **per-dimension seats** | **yes, 2 seats** | **quorum ∧ supermaj ∧ ayes>n+v** | **yes** | **yes** | **yes (exit code)** |

## 5. Prior Art References

1. Castro, M. & Liskov, B., "Practical Byzantine Fault Tolerance," OSDI 1999.
2. Yin, M. et al., "HotStuff: BFT Consensus with Linearity," 2019.
3. Du, Y. et al., "Improving Factuality and Reasoning through Multiagent
   Debate," ICML 2024 — homogeneous agents, no fault model.
4. Wang, J. et al., "Mixture-of-Agents Enhances Large Language Model
   Capabilities," arXiv:2406.04692, 2024 — aggregation, no consensus vote.
5. Jo, et al., "DecentLLMs," arXiv:2507.14928, 2025 — geometric-median
   aggregation over ranked proposals.
6. Zheng, et al., "CP-WBFT," arXiv:2511.10400, 2025 — confidence-probe weights.
7. Sharma, R. et al., "Constitutional Classifiers," arXiv:2501.18837, 2025 —
   constitution-derived classifiers (dimension predicates are related art).
8. CSOAI provisional, "BFT Governance Council," 2026-07-06 — distinguished:
   undifferentiated heterogeneous voters with a non-configurable care floor;
   this invention adds dimension-specialised seats, an explicit veto class,
   hermetic reproduction, and harness exit gating.

## 6. Abstract

A verdict court for multi-model AI ensembles. A council of dimension-specialised
voter seats (13 seats, dimensions such as care, compliance, finance,
distribution) each scores an AI output on only its own axis via deterministic,
offline-reproducible predicates; two seats form a veto class whose single nay
rejects outright; the tally requires simultaneously a 9/13 quorum, a 2/3
supermajority, and affirmative votes exceeding the sum of negatives and
vetoes; the full verdict — per-seat votes, failing dimension, quorum
arithmetic — is appended to a hash-chained receipt; and a harness gates the
output's release and process exit status on the verdict. The novelty is the
fusion of specialised seats, veto classes, dual-threshold weighted tally,
hermetic reproducibility, and receipt binding into one adjudication pipeline.

## 7. Filing Instructions

- **UK IPO Form 1** (provisional). Priority date 2026-10-07.
- **PCT within 12 months**; national phases at 30 months.
- Target jurisdictions: UK, EPO, US (multi-agent tooling market).
- **OIN 2.0 scope check (MANDATORY, executed 2026-10-07):** governance-layer
  method; **NOT** Linux-kernel-adjacent. OIN grant-back does not apply. No
  Limitation Election required.
- **Continuation/divisional note:** claim 5 references the runtime
  constitutional gate (companion provisional of same date); claim 4 references
  the receipt chain defined in the inference-receipts provisional (same date).
  The three provisionals form a layered family: gate → court → receipts.

## 8. Novelty Statement

BFT thresholds, LLM voting, confidence weighting, and geometric-median
aggregation each exist in the prior art. The novelty is the **chambered
combination**: seats are partitioned by evaluation dimension so votes are
uncorrelated by construction (defeating monoculture); a veto class makes
safety dissent non-outvotable; the tally demands quorum ∧ supermajority ∧
ayes>negatives+vetoes simultaneously; votes are hermetic so any third party
can re-run the adjudication on the same output text offline; and the verdict
is receipt-bound and escalated to a process exit code, coupling ensemble
consensus to operational control. No cited system performs all six.

---

*Prepared for CSOAI Ltd (UK 16939677). Inventor: Nicholas Templeman.
This document constitutes a reduction to practice of the claimed inventions
via the council subsystem of the `meok-ori` sovereign harness (34/34 tests
passing, live approve/veto runs verified 2026-10-07) and the `MEOK_Core`
UE5 plugin BFT tally (103/103 tests passing).*
