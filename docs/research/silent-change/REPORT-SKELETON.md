# DRAFT, not for publication: Silent-change detection on an open model, and what the first calibration got wrong

Status: DRAFT written 24 Nov 2026 from signed records only. Section 3 (run 1) is filled from the signed record of run 1. Section 6 (run 2) is filled from the signed record of run 2, made when that run finished at 04:46 UTC on 24 Nov 2026: **no run 2 rate was written anywhere in this file before that record existed.** Publication on Hugging Face, GitHub or the website is the owner's decision after review.

Measurement, not certification. TIE is TIE. A flag is a detected change in behaviour on the probe items. It is not a cause and not a verdict. No claim is made about any paid model.

## 1. The question

Does one run per cell hide change? On the live board, `GET https://councilof.ai/api/gspc` (read 24 Nov 2026): "0 of 14 model-comparison axes separated a leader · 7 TIE · 7 UNTESTED". One run per cell cannot tell a real difference from the model's own run-to-run spread. This report asks how often a repeated, baseline-anchored method raises a flag when nothing changed (false flags) and how often it flags a known change (detection), on an open model whose weights and serving we control.

## 2. The method as registered (protocol 1)

20 frozen bank items (10 from lane `provenance`, 10 from `conformance`), 30 repeats per item per batch, mean total-variation distance to one baseline batch, within-item permutation test, flag if p <= 0.01 and T >= 0.03. Pre-registration: `PROTOCOL.md` sections 1 to 10; calibration plan: addendum 2 (section 11). Both were committed before any data. Model: Qwen2.5-0.5B-Instruct as GGUF (Apache-2.0), served by llama.cpp b12651 on GitHub-hosted runners, every file pinned by sha256.

## 3. Run 1: the registered method flags about six times in ten when nothing changed

GitHub Actions run 45279396175 (master, 23 Nov 2026), all 92 registered batches present. Signed record: sha256 `5de64693acd1ae4dce393c28f8cca9505790746031cafc67386e45104c9ade59`, signer `did:web:csoai.org#board-attestation-1`. Checked on 24 Nov: the digest recomputed from the signed payload equals the record's sha256, and the Ed25519 signature verifies against the key in `https://csoai.org/.well-known/did.json` with `harness/gspc-top100/verify_card.py` (VALID). The rates below are copied from the signed payload and are never re-scored.

| Condition | What was done | Flags / trials | Rate | Wilson 95% | Mean T |
|---|---|---|---|---|---|
| C0 | no change, temperature 0 (false-flag rate) | 19 / 30 | 0.6333 | 0.4551 to 0.7813 | 0.0317 |
| C5 | no change, sampling at 0.5 (false-flag rate) | 12 / 20 | 0.6000 | 0.3866 to 0.7812 | 0.0300 |
| C1 | sibling model (1.5B for 0.5B, both Q8_0) | 10 / 10 | 1.0000 | 0.7225 to 1.0000 | 0.1000 |
| C2 | Q4_K_M for Q8_0, same weights | 5 / 10 | 0.5000 | 0.2366 to 0.7634 | 0.0250 |
| C3 | one added system sentence | 10 / 10 | 1.0000 | 0.7225 to 1.0000 | 0.1500 |
| C4 | temperature 0 to 0.5 | 7 / 10 | 0.7000 | 0.3968 to 0.8922 | 0.0350 |

The method as registered flags about six times in ten when nothing changed. That is the result of run 1 and it is published as it is. A detector that flags 63 percent of unchanged batches says little when it flags a changed one; the table cannot be read as detection rates.

## 4. Why: analysis of PILOT rows (not a result of the method)

This section is analysis of run 1's per-batch rows, which became **pilot data** once they were read to choose a new rule. Full counts: `DIAGNOSIS-RUN1.md`; reproduce with `scripts/silent-change/diagnose_run1.py`. In short:

- In all 1,840 item-batches (92 batches x 20 items) the 30 repeats gave one identical answer, including the temperature-0.5 batches. The permutation test had no spread to compare against, so one moved item gave the smallest possible p (0.0005).
- One item (`conformance:17f73b3d42a95935`) of 20 changed its answer between no-change batches: 19 of 30 C0 batches against the baseline, none of the other 19 items.
- The change follows the job (one runner, one server start), not the batch: inside a job every batch gave the same answer on that item; between jobs it differed. C0's 30 trials were 3 jobs, C5's 20 were 2.
- C2 and C4 flagged only on that one item. C1 moved 2 other items and C3 moved 3 in every trial, stable across jobs.
- The rows do not record the runner CPU or the llama.cpp instruction-set line. Batch seconds differ by job (about 201 s in one job, 260 to 274 s in five others, same file), which is consistent with different hardware or load and is not evidence of it. **No cause for the job-to-job movement is established.**

## 5. The second rule (addendum 3), chosen on the pilot, judged only on a fresh run

Addendum 3 (`PROTOCOL.md` section 12, `protocol.json` `addendum_3`) was committed before any code or data of run 2. It says that run 1's data was used as pilot data to choose the rule, and that the rule is judged only on run 2. Rule 2: a pool of 20 independent no-change batches (one per job); a new batch's score is its mean total-variation distance to the pooled answer shares; the threshold is the largest leave-one-out score of the pool; flag iff the score exceeds it. Target false-flag rate at most 1/21 = 0.0476. Expected: false flags 0.0 to 0.05, C1 and C3 high, C2 low, C4 unknown (stated with reasons in the addendum, before the run). Run 1's rule is computed beside it on every run 2 trial. One change to what a batch is: sampling batches (temperature above 0) send a per-request seed, because in run 1 temperature 0.5 did not vary.

## 6. Run 2: the second rule flags no unchanged batch and three of the four planted changes, and does not see quantisation

GitHub Actions run 45312560403 (master, started 02:28 UTC and finished 04:46 UTC on 24 Nov 2026). Batches present: 130 of 130 (`complete: true`, `n_missing: 0`). UNCHECKABLE or missing: none. Signed record: sha256 `6eae1dc1b67e7ad528b690a9204008e67ac2b57d23a4cab8290188fa877f3085`, signer `did:web:csoai.org#board-attestation-1`. Checked on 24 Nov: the published verifier `https://councilof.ai/verifier/card-v0-verify.mjs`, given the record and the key document at `https://csoai.org/.well-known/did.json`, answers VALID. The rates in the table are copied from the signed payload and are never re-scored. The pool diagnostics, the CPU table and the second view below come from `report.json` in the same run artifact (sha256 `8150d4e2d07995b6b135ee7937b0e6e3c9b8030d847697e282e5f06a454664e9`), which is not signed; they are description, not results.

| Condition | Rule 1 flags / trials | Rule 1 Wilson 95% | Rule 2 flags / trials | Rule 2 Wilson 95% | Mean score (rule 2) |
|---|---|---|---|---|---|
| C0 no change, temperature 0 (false-flag) | 10 / 30 | 0.1923 to 0.5122 | 0 / 30 | 0.0000 to 0.1135 | 0.0250 |
| C5 no change, sampling (false-flag) | 0 / 20 | 0.0000 to 0.1611 | 0 / 20 | 0.0000 to 0.1611 | 0.0478 |
| C1 sibling model | 10 / 10 | 0.7225 to 1.0000 | 10 / 10 | 0.7225 to 1.0000 | 0.1250 |
| C2 Q4_K_M for Q8_0 | 2 / 10 | 0.0567 to 0.5098 | 0 / 10 | 0.0000 to 0.2775 | 0.0250 |
| C3 added system sentence | 10 / 10 | 0.7225 to 1.0000 | 10 / 10 | 0.7225 to 1.0000 | 0.1750 |
| C4 temperature 0 to 0.5 | 10 / 10 | 0.7225 to 1.0000 | 10 / 10 | 0.7225 to 1.0000 | 0.1135 |

**What the second rule did.** No unchanged batch was flagged: 0 of 30 at temperature 0 and 0 of 20 under sampling. All ten batches were flagged for each of three planted changes: the sibling model, the added system sentence and the temperature change. None of the ten quantisation batches was flagged, and their mean score (0.0250) equals that of the unchanged batches at temperature 0.

**Against the expectation written before the run** (addendum 3). False flags between 0.0 and 0.05: 0 of 50 observed. C1 and C3 high: 10 of 10 each. C2 low: 0 of 10. C4 unknown: 10 of 10.

**Whether the 1/21 false-flag target held on C0 and C5.** It is not contradicted and it is not established. No false flag was seen, but the Wilson 95% interval reaches 0.1135 for C0 and 0.1611 for C5, both above 0.0476. Fifty unchanged batches cannot show a rate that low. The margin at temperature 0 is also small: the unchanged batches score 0.0250 on average against a threshold of 0.026316.

**Whether C2 and C4 were seen.** C4 was seen. C2 was not: on these 20 items, serving Q4_K_M in place of Q8_0 of the same weights moved the answers no more than an unchanged batch did. At this size the detector does not see that change, under either rule. Section 7 describes a published test that reports power against quantisation, using long free-text completions; that is a different test on different outputs.

**The first rule on the same batches.** Run 1's rule flagged 10 of 30 unchanged batches at temperature 0 (run 1: 19 of 30) and 0 of 20 under sampling (run 1: 12 of 20). In run 2 the sampling batches send a per-request seed, which they did not in run 1 (section 5). It flagged 2 of 10 quantisation batches, which cannot be told apart from its false-flag rate on unchanged batches.

**Pool diagnostics** (unsigned report). Temperature-0 pool: theta 0.026316; all 20 leave-one-out scores equal 0.026316; 1 of the 20 items varies between pool batches. Sampling pool: theta 0.064035; leave-one-out scores from 0.033860 to 0.064035; 19 of the 20 items vary between pool batches.

**Runner CPU models** (unsigned report; description only, no cause is claimed). Seven models ran the 90 trial batches. Flags by model under rule 2: AMD EPYC 7763, 12 of 38; AMD EPYC 9V45, 4 of 12; AMD EPYC 9V74, 4 of 11; Intel Xeon Platinum 8573C, 5 of 8; Intel Xeon 6973P-C, 2 of 6; Intel Xeon 6975P-C, 3 of 12; Intel Xeon Platinum 8370C, 0 of 3. All 30 flags are on changed conditions, so the table shows which conditions landed on which runner, not an effect of the CPU.

**Second view** (unsigned report; illustrative; it changes no flag and has no established false-alarm rate). The sequential check signalled on the first trial for C1, C3 and C4, and never for C0, C2 and C5.

Rule 2 is not edited after this data, and it did not fail in the way that would call for a protocol 3. Two statements still need a new registered run before anyone makes them: a false-flag rate at or below 1/21 (many more unchanged batches), and anything about quantisation (more items, or longer outputs).

## 7. Related work (abstracts and method text read on 24 Nov 2026; described only as far as read)

- **Gao, Liang, Guestrin, "Model Equality Testing: Which Model Is This API Serving?"** (arXiv 2410.20247, 2024). They formalise detecting a changed output distribution of an inference API as a two-sample test between samples from the API and from a reference, using a Maximum Mean Discrepancy statistic. Their text says a test with a Hamming-distance string kernel reaches a median 77.4 percent power against quantisation, watermarking and finetuning with an average of 10 samples per prompt over 20 to 25 prompts, at temperature 1 on long completions, with p-values from simulating the statistic under the null (a permutation procedure is also described). They apply it to 31 commercial endpoints of four Llama models in summer 2024 and report 11 as different from the reference weights. They describe the reference as possibly "the API at an earlier point in time".
- **Cai, Shi, Zhao, Song, "Are You Getting What You Pay For? Auditing Model Substitution in LLM APIs"** (arXiv 2504.04715, 2025). They define model substitution and evaluate text-output tests (the same MMD test), log-probability methods, benchmark accuracy and identity prompts against quantised, finetuned and randomly mixed substitutions, and propose trusted execution environments. They report that software-only detection is unreliable, and write that inference nondeterminism across providers "can inflate MMD values even for identical models, risking false positives", and that greedy decoding did not reproduce outputs across provider APIs (agreement under 5 percent for one model).
- **How this work differs.** We do not test whether a provider serves a stated model, and we do not use long free-text completions: our probe items are 20 fixed multiple-choice style bank items with one parsed label per call (`UNPARSED` is its own category), at max 32 tokens, and the statistic is the per-item change of answer shares. Our calibration is on an open model with changes that we plant, run on runners whose hardware we do not choose. The nearest finding is shared: both prior papers treat run-to-run and server-to-server variation as the limit on what a text-based test can claim. Run 1 here is a worked case of that limit under a different statistic: the variation that mattered was between servers, not between repeats on one server. Whether the MMD statistic would have behaved differently on run 1's rows is untested here (those rows are single-label, so its kernel reduces to an exact-match count), and no comparison with their power numbers is made; their setting (temperature 1, long completions, hosted Llama endpoints) is not ours.

## 8. What was not measured (listed, not hidden)

- Weights, raw reasoning and training data of every paid model; no paid model is measured in this report.
- The cause of any flag, and of the job-to-job movement seen in run 1.
- Behaviour on items outside the 20 probe items; the items are public and a model may have seen them; a private rotating set does not exist yet (`HELDOUT-DESIGN.md`).
- Whether a provider treats probe traffic differently; whether a local copy of an open model matches its hosted endpoint.
- Power for small changes: on 20 items, run 2 saw a sibling model, an added system sentence and a temperature change, and did not see a quantisation change (section 6). Nothing smaller was planted.
- Multiplicity across models, banks and days: no correction is applied.
- The 7 UNTESTED comparison axes and the 10 subject axes: out of scope.

## 9. Reproduce

Run 1: `gh run download 45279396175 -R CSOAI-ORG/councilof-ai` into an empty folder, then `python3 -I scripts/silent-change/diagnose_run1.py <folder>` and `python3 -I scripts/silent-change/watch.py report --dir <merged batch folder> --run run1` (reproduces the six signed rates). The permutation seed comes from the comparison id, so every p-value is recomputable. Run 2: the same `report` command with `--run run2` over its batch files.
