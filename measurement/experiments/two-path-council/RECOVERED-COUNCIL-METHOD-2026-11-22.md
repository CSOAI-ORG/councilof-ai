# Council mechanism recovered — preserved ruling, actual status and next validation (22 Nov 2026)

**Status:** research source recovery, not a new council operation or retroactive authorization.

## The actual recovered operational principle

Source of truth: `council-os/rulings/sources/COUNCIL-MECHANISM-PROPOSAL-2026-09-29.md`, copied from the original owner-side note and associated with adopted ruling-record approach `R-2026-0929-06`. That adopted *record format/ruling approach* is not proof that the reviewer panel was convened or that BFT was implemented.

**The scientific breakthrough in the design was not "12 votes give truth":**

1. **Pre-registered code over pinned bytes determines measurement states.** Models and humans never vote a score into existence.
2. **The council reviews *which rule applies*, whether its computation reproduces, whether hashes match and whether public wording stays within the evidence.** Reviewer outcomes are `CONCUR` / `DISSENT` / `CANNOT_REPRODUCE`, not yes/no guesses at hidden answers.
3. **The referee is deterministic/non-voting.** Separate owner/company authority remains with a genuine authorized human; signatures, UI controls and role declarations do not instantiate reviewers.
4. **Effective independence is measured, not assumed from model names.** If `n_eff < 2`, the design panel is ADVISORY. The design allows BFT-language only after authenticated independent-fault tests, with sufficient effective reviewers and an explicit network/quorum model.
5. **Receipt chain is separate:** measured evidence → rule/ruling → authority-specific human action → effect observed independently → correction/retest. No step may manufacture the next.

### Historical 12+1 and 3-around-1 connection

The separate 12-specialist exploration used 12-bit task votes, ternary uncertainty, Ed25519-envelope ideas, Wilson/binomial uncertainty and a non-voting referee. Quorum arithmetic and vote signing must be validated under the actual deployment topology, rather than inferred from an abstract count.

A separate educational dataset under `csoai/hitl-academy-orb3` describes **3-around-1 bidirectional provenance**: genesis `t0`, latest `tN` and referee. Its dataset card cites a 32/32 versus 11/32 experimental result; **that number has not been independently replayed in this lane**, and the module/XP copy is not a substitute for authenticated human competence or accepted decisions. This is worth investigating for the temporal observatory as a controlled source-order experiment, preserving its original evidence dates and bank exposures.

These are complementary:
- 12+1 distributes challenge/rule review among specialist perspectives;
- 3-around-1 tests chronology, newer correction visibility and whether a deterministic referee can reject superseded evidence;
- frozen source identity and independent verification keep the two from fabricating a new model measurement.

## Current implemented status is narrower

`scripts/rulings/panel.mjs` explicitly reports `PANEL_NOT_CONVENED`; `reviewRuling` throws and `measurePanelNEff` returns `UNMEASURED`. Do not claim it calls providers.

The public `public/interop/council-independence.json` records a dated **4 September 2026** three-leg, 10-comparable-item experiment with mean pairwise rho **1.0** and `n_eff=1.0`. It supports that limited observation only, not a global independence estimate for the 12-member design. The current role registry (`scripts/badger/csoai-bft-council.py`) explicitly has 33 DECLARED roles but no verified voter signatures and returns UNCHECKABLE.

The older simulated 33-voter artifacts under `_quarantine/simulated-bft-2026-09-04/` were quarantined for fabricated YES votes and non-Ed25519 signatures. They must never re-enter training, grading, production records or BFT claims.

### What the new evidence contributes

Public GSPC repeats include 66 keys with conflicting correctness on the same declared model×axis×item, and historical 12-model majority can degrade on some axes. Thus the referee's highest-value job is **checking provenance, rule applicability, error dependence and what is missing**, not converting all 12 votes into a winner. The human receives explicit uncertainty and a reproducible record, not an automatic instruction to approve.

## Exact acceptance plan

A. Select one frozen deterministic ruleset for a **ruling-class** question, not a model-score outcome. Register its source commit and input bytes before tests.

B. Implement `scripts/rulings/panel.mjs` via the *existing* owner-approved provider/identity interfaces; do not create a second council stack. Require unique per-principal signed vote envelopes, protected keys, replay/equivocation rejection, separated operators/hosts and full independent custody.

C. Test `n_eff` over held-out, diverse rulings with false/contradictory evidence and nonresponsive agents; use actual same-task vote histories and confidence intervals. Below independence thresholds, halt any BFT wording and mark advisory.

D. Cross-check deterministic output and evidence source with an independently developed verifier. Demonstrate forged-key refusal, corrupted/missing source, stale bank, wrong rule, bad rationale and unsupported public claim failures.

E. Record a *real named and authorised* reviewer/decider only when acceptance exists; never auto-appoint a human or infer consent from MOOC grades. Keep scoped Layer 0 and independent effect observation separate.

F. Only after protected governance approval and fresh release tests may this support a production council claim. Historical educational, self-run or simulated results remain correctly labelled.

**This document changes no rule, measurement, public site, training or human authority.**
