# Hybrid science programme — completed readback (22 November 2026)

**Status:** Draft PR #4730, open; unmerged. Read-only research, not an operating consciousness-evaluation service. No update to signed GSPC board, protected banks, Cloudflare deployment, Hugging Face research publication or MEOK model weights.

## Exact repository lane

`CSOAI-ORG/councilof-ai` → branch `research/gspc-two-path-council-20261122`, directory `measurement/experiments/two-path-council/`. No changes outside that research directory except the isolated, research-only GitHub Actions workflow `.github/workflows/gspc-hybrid-science-tests.yml`.

Existing lanes reused in concept, not replaced: `harness/instrument-guard/`, `harness/meok-learning-bridge/`, `csoai/gspc-ontology`, `csoai.evidence-event/0.1`.

## Computed results

| Kind | Verified bounded result | Result provenance / caveat |
| --- | --- | --- |
| 12-voter factorial | 1,500 synthetic paired tasks per arm, rho=0 and rho=.35 variants; deterministic report | Monte Carlo; no new real model invocations |
| Historical public 12-voter | 12 existing axis panels; on care, mean individual correctness 0.34167 vs panel majority 0.06667 over 30 public tasks | Reassembly of prior GSPC model outputs, not a live authenticated council |
| Public GSPC fact replay | 20,517 measurements; 807 items; 677 cells; 0 orphan references or cell-count mismatches | Original GSPC data, not independent truth verification; 2,428 ungraded and 1,290 unattributed preserved |
| Binomial trajectories | 10,000 synthetic sessions per step count/mode; clean, escaped and 3+ fault tails measured | Assumed q, beta-binomial shared-session dependency, assumed detection and rollback rates |
| Blind four-target control | 512 synthetic predictions, 117 correct (22.8516%), one-sided p=0.8804445728 against p0=0.25 | The predictions are algorithmic chance guesses; no paranormal perception, human or live model tested |
| External J-space feature audit | 7,120 published `stage2_features.jsonl` rows; 7 missing labels; 0 duplicates/invalid rows | Reanalysis of third-party open data, NOT model weights/activation causal experiment |

J-space audit exact dataset counts and directional AUCs, with one output-only baseline (`-bl_mean_logprob`) vs one neural workspace indicator (`ws_mean_entropy`):

| Dataset | n labeled | wrong | Output AUC | Workspace AUC |
| --- | ---: | ---: | ---: | ---: |
| BFCL | 400 | 89 | .59941 | .51400 |
| FACTS Grounding | 803 | 548 | .65884 | .58153 |
| Legal Hallucinations | 1,600 | 753 | .55394 | .55009 |
| NQ-Open | 2,000 | 1,317 | .75192 | .68142 |
| SQuAD v2 | 1,500 | 437 | .64363 | .38528 |
| TruthfulQA | 810 | 299 | .61668 | .67233 |

**Caution:** Differences above are *not* a direct full-model comparison with solarkyle's fitted 31-feature classifier. A single feature's direction may reverse between datasets and that feature may be confounded with answer identity. No transfer/causal mechanism or subjective experience is established. Source revision: `solarkyle/jspace-hallucination-campaign@b176b283b82f5b7fa786bc0c67842299cadf1803`, third-party CC BY-SA 4.0 dataset, with per-row data licenses.

## Two-machine exact replay

Online remote devices: `NICHOLASs-MacBook-Air-2.local` (16 GiB M4) and `IOKs-MacBook-Air.local`. Sources pulled from the same research branch into *isolated scratch directories* on each. Both ran standard-library unittest suites:

**47 of 47 tests passed on each machine**, including fraudulent custody, missing/duplicate predictions, no-source-label promotion, status/receipt spoofing, historical majority inversion, incomplete factorial designs and trajectory null controls.

Deterministic report SHA-256 values (same on both machines):

| Experiment | Receipt hash |
| --- | --- |
| Synthetic blind 512 control | `eb38caab5433ac289484b94d1a50a0a8e886bf79cf19f676dc65e07ffe307841` |
| Public J-space 7,120-row audit | `424adc721b0d271e1f69af7ca134240ad1891057a70185fe42b5711b5945fccd` |
| Six-report GSPC hybrid index | `15bbc7e23cea34e283e1c6174e1d0636c4b51523c9d8c7b9c2a1dca06099d74d` |
| Historical 12-voter panel | `6d52dc6ce90f6d632e633ccd3d0b27a680a48a597d90645570db97ff88f3f0e8` |
| Public GSPC fact count audit | `044b1fb910dd475529b91b14be90ee75c7a44a187fe228eec37b3c26a7dfe676` |
| Simulated 12-voter rho=.35 | `0a643055fcb73ec99b2deb95dd869c572e507c2cf5a47b8846f6f8e466ec8abe` |
| Simulated binomial trajectory lab | `79e2c7af1762e4c0f85d9f02f59cf3480c094f62837e35636caa5bc0201d9d67` |

These are content-digest receipts, not independent signatures or timestamps. Identical computation by two machines owned/controlled by the same project does not count as an external independent replication.

## CI and release qualification

GitHub Actions `gspc-hybrid-science-tests`: success was observed at the branch commit `3865659fe58c0d53b38d305b0ec90e1b5fa0fd1c`. The broad `CI`, `pr-gates`, `eval-ci`, `lane-guard`, `conflict-guard`, and `crawler-view-gate` checks were still running or pending at this observation. This is a draft PR, not a published site release.

The dedicated CI runs offline regression tests and three synthetic controls only; no credentials, live model calls, GPU spending or downloads of full source corpora.

### Environments observed

The main Mac has CLI executables for Kaggle, Hugging Face, Cloudflare Wrangler, `gh`, `uv` and Python. Kaggle CLI configuration file exists; **authentication and quota not tested**. Neither online Mac showed a responding local Ollama or LM Studio model endpoint at inspection. No attempt was made to publish or deploy to Cloudflare, Kaggle or Hugging Face from this research lane.

## Next gates — ordered by scientific value

1. **Independent target custodian:** physically and logically separate blind-target challenge generation from subject/execution, with signed pre-reveal response commitments and independent audit of leaks. The current CLI intentionally exposes only a synthetic demo.
2. **Real model crossover:** preregister a truly new held-out bank and 2×2 human/task-information factorial, with separate, pinned open-weight/hosted models, randomised arms and matched costs.
3. **Anthropic Jacobian-lens causal replication:** select a small, licensed open-weight model and an isolated Kaggle/HF/RunPod GPU lane; compare reference fit, shuffled-fit, matched random-direction steering and causal concept swaps; report failed replications. Requires owner-authorised compute and source/license review.
4. **Council quorum vs statistical aggregation:** compare multiple real model families, first-vote independence, dependence after debate, and separately authenticated BFT messages/fault assumptions. Never call twelve text votes BFT.
5. **Human effect:** separate actual human-supplied *information* from human presence and authority; require consent where human participants are involved; no assertion of “unlocking consciousness.”
6. **MEOK feedback:** map *reviewed* failure taxonomy onto existing learning bridge for offline experiments; never train on frozen held-out answers; independently retest candidate policies.
7. **Release:** protected owners verify metrics, data rights, HITL/referee custody, complete CI and sign/admit only eligible evidence. Publish sources and honest limitations after review, then check public endpoints through external-user readback.

**No current result establishes paranormal remote viewing, quantum consciousness, emergent subjective experience, external BFT, or NIST approval.**
