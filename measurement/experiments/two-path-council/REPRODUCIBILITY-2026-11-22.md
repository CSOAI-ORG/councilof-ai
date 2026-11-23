# Two-path Council: independent-machine replay and bounded findings

**Date:** 22 November 2026 (UTC)  
**Status:** owner-run research reproduction; **unsigned, draft PR only**, no change to public GSPC board, protected banks, model weights, or deployment.

## Materials and operations

Source branch: `research/gspc-two-path-council-20261122`.  
Reproducibility commands (run in this folder, Python 3 standard library, public HF connectivity for frozen audit):

```sh
python3 -B -m unittest -v test_two_path_council.py test_historical_twelve.py
python3 -B two_path_council.py --tasks 1500 --rho 0 --bootstrap 350 > independent.json
python3 -B two_path_council.py --tasks 1500 --rho .35 --bootstrap 350 > correlated.json
python3 -B audit_public_fact_ontology.py > fact-audit.json
python3 -B historical_twelve.py > historical-twelve.json
```

Frozen public HF revision for all historic data: `csoai/gspc-fact-table@d0605c2495bddae7956fec5c18403d8a49fd81ac`. Source manifest produced 28 October 2026. The code internally pins that revision. Source table and manifests have the same publisher; it is **not independent authentication**.

Two online remote computers received byte-identical committed source in **isolated scratch directories** (not the working tree):
- NICHOLASs-MacBook-Air-2.local, Python standard library.
- IOKs-MacBook-Air.local, Python standard library.

Both machines: **17/17 unittest cases pass**.

| Experiment | M4 | M2 | Receipt SHA-256 |
| --- | --- | --- | --- |
| Synthetic 1500 tasks, rho=0.35, 12 voters, 4 arms | reproduced | reproduced | `0a643055fcb73ec99b2deb95dd869c572e507c2cf5a47b8846f6f8e466ec8abe` |
| Public fact-table audit (20,517 rows, 807 items, 677 cells) | reproduced | reproduced | `044b1fb910dd475529b91b14be90ee75c7a44a187fe228eec37b3c26a7dfe676` |
| Retrospective 12-model public panel | reproduced | reproduced | `6d52dc6ce90f6d632e633ccd3d0b27a680a48a597d90645570db97ff88f3f0e8` |
| Synthetic 1500 tasks, rho=0 | reproduced on M4 | not repeated on M2 | `84dd8a012592c952fe13c75f3279323f08e506d91e9afd48f55032e9443df31d` |

Receipt hashes are a *digest of locally computed report JSON*, **not an Ed25519 attestation or an OpenTimestamps anchor**.

## Result 1: simulated independent vs correlated majority voting

For the `blind_hidden` arm and fixed seed `20261122`:

| Simulation | Individual mean | Twelve-voter accuracy (ties count as failure) | Difference | Effective voters (rough exchangeable variance analogy) |
| --- | ---: | ---: | ---: | ---: |
| rho=0 | 0.65900 | 0.81400 | +0.15500 | capped at 12 |
| rho=0.35 | 0.66420 | 0.66867 | +0.00447 | 2.447 |

These are **assumed-parameter synthetic data**. They do not measure a live model. The effective sample size analogy requires exchangeability/equal competence and is not a claim of 2.447 actual independent organisations.

## Result 2: frozen public measurement table reconciles

All 677 cell `n_rows/n_graded/n_ok` values re-derived from 20,517 public rows and all 807 public item identifiers resolve; zero mismatched cell counts, zero orphan item or cell references. **2,428 rows remain ungraded and 1,290 remain without model attribution**, reported rather than repaired.

Exploratory pairwise correctness correlations on common public banks (only pairs with 30 shared graded items):
- governance: mean `0.24175` (253 pairs);
- detector-interop: `0.26325` (120 pairs);
- continuity: `0.26979` (136 pairs);
- safety: `0.12432` (171 pairs);
- provenance: `0.19543` (171 pairs).

These pairs overlap in models and items, and their average is not a fresh council's error-correlation estimate. Thirty shared items yield unstable estimates. The public banks are **not held-out**.

## Result 3: retrospective twelve-voter panels made from real archived model outputs

Eligible models chosen by descending **number of available unique graded observations**, then lexicographic model ID; accuracy did not determine the roster. A panel exists only with twelve distinct model IDs and at least thirty common, uniquely graded public items. Majority needs at least seven **identical observed categorical answers**; 6:6 or diffuse vote counts are abstentions, not successes.

| Axis | n items | Mean individual accuracy | Majority all-item accuracy | Majority coverage |
| --- | ---: | ---: | ---: | ---: |
| care | 30 | 0.34167 | **0.06667** | 0.86667 |
| cross-reality | 30 | 0.45000 | 0.36667 | 0.56667 |
| continuity | 30 | 0.49722 | 0.56667 | 0.86667 |
| provenance | 30 | 0.64722 | 0.70000 | 0.90000 |
| safety | 30 | 0.81111 | 0.93333 | 0.93333 |

There are 12 eligible axis panels total. **No model was asked new questions; no authenticated BFT council was run; no independent ground truth or external referee exists here.** This is a historical counterexample against assuming majority always improves a decision. The differences are not statistically established across fresh tasks, and do not show which MEOK council configuration is best.

## What needs separate approval and execution before wider claims

1. Qualify newly generated private item banks with provenance and content-level held-out checks, pre-register exposure interventions and randomised assignment.
2. Run real model invocations (12 agents × 4 arms × >=30 new tasks), with pinned revisions, clean context reset and all failures included; this is a **new costly and authority-scoped compute experiment**, not done here.
3. Bring a separately controlled grader and referee with independent evidence custody; use negative controls to detect malformed commitments, duplicated voters, false evidence, unearned permission and inference leakage.
4. Treat BFT as a separate protocol experiment: signed authenticated principals, quorum intersections and equivocation/network/fault tests. Majority voting is not BFT.
5. Only then submit measured, bounded evidence through existing GSPC instrument guard, event schema, model separation and protected release gates. This draft has no authority to alter the signed board or MEOK live services.

NIST TEVV work supplies methodological alignment, not NIST validation. No change to freeze, provenance, ontology or existing historical card bytes.
