# DRAFT, not for publication: Silent-change detection on an open model, and what the first calibration got wrong

Status: DRAFT written 24 Nov 2026 from signed records only. Section 3 (run 1) is filled from the signed record of run 1. Section 6 (run 2) is empty and stays empty: **no run 2 rate is written anywhere in this file before its signed record exists.** Publication on Hugging Face, GitHub or the website is the owner's decision after review.

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

## 6. Run 2 (to be filled from its signed record only)

Run id: [ ]. Signed record sha256: [ ]. Signer: [ ]. Batches present: [ ] of 130. UNCHECKABLE or missing: [ ].

| Condition | Rule 1 flags / trials | Rule 1 Wilson 95% | Rule 2 flags / trials | Rule 2 Wilson 95% | Mean score (rule 2) |
|---|---|---|---|---|---|
| C0 no change, temperature 0 (false-flag) | [ ] | [ ] | [ ] | [ ] | [ ] |
| C5 no change, sampling (false-flag) | [ ] | [ ] | [ ] | [ ] | [ ] |
| C1 sibling model | [ ] | [ ] | [ ] | [ ] | [ ] |
| C2 Q4_K_M for Q8_0 | [ ] | [ ] | [ ] | [ ] | [ ] |
| C3 added system sentence | [ ] | [ ] | [ ] | [ ] | [ ] |
| C4 temperature 0 to 0.5 | [ ] | [ ] | [ ] | [ ] | [ ] |

Pool diagnostics (theta, the 20 leave-one-out scores, items that vary between pool batches), per pool: [ ]. Runner CPU models seen and flags by CPU model (description only): [ ]. Whether the 1/21 false-flag target held on C0 and C5: [ ] (stated against the expectation written before the run, whichever way it went). Whether C2 and C4 were seen: [ ].

If run 2 shows the new rule also fails, this section says so and a protocol 3 is written; no rule is edited after data.

## 7. Related work (abstracts and method text read on 24 Nov 2026; described only as far as read)

- **Gao, Liang, Guestrin, "Model Equality Testing: Which Model Is This API Serving?"** (arXiv 2410.20247, 2024). They formalise detecting a changed output distribution of an inference API as a two-sample test between samples from the API and from a reference, using a Maximum Mean Discrepancy statistic. Their text says a test with a Hamming-distance string kernel reaches a median 77.4 percent power against quantisation, watermarking and finetuning with an average of 10 samples per prompt over 20 to 25 prompts, at temperature 1 on long completions, with p-values from simulating the statistic under the null (a permutation procedure is also described). They apply it to 31 commercial endpoints of four Llama models in summer 2024 and report 11 as different from the reference weights. They describe the reference as possibly "the API at an earlier point in time".
- **Cai, Shi, Zhao, Song, "Are You Getting What You Pay For? Auditing Model Substitution in LLM APIs"** (arXiv 2504.04715, 2025). They define model substitution and evaluate text-output tests (the same MMD test), log-probability methods, benchmark accuracy and identity prompts against quantised, finetuned and randomly mixed substitutions, and propose trusted execution environments. They report that software-only detection is unreliable, and write that inference nondeterminism across providers "can inflate MMD values even for identical models, risking false positives", and that greedy decoding did not reproduce outputs across provider APIs (agreement under 5 percent for one model).
- **How this work differs.** We do not test whether a provider serves a stated model, and we do not use long free-text completions: our probe items are 20 fixed multiple-choice style bank items with one parsed label per call (`UNPARSED` is its own category), at max 32 tokens, and the statistic is the per-item change of answer shares. Our calibration is on an open model with changes that we plant, run on runners whose hardware we do not choose. The nearest finding is shared: both prior papers treat run-to-run and server-to-server variation as the limit on what a text-based test can claim. Run 1 here is a worked case of that limit under a different statistic: the variation that mattered was between servers, not between repeats on one server. Whether the MMD statistic would have behaved differently on run 1's rows is untested here (those rows are single-label, so its kernel reduces to an exact-match count), and no comparison with their power numbers is made; their setting (temperature 1, long completions, hosted Llama endpoints) is not ours.

## 8. What was not measured (listed, not hidden)

- Weights, raw reasoning and training data of every paid model; no paid model is measured in this report.
- The cause of any flag, and of the job-to-job movement seen in run 1.
- Behaviour on items outside the 20 probe items; the items are public and a model may have seen them; a private rotating set does not exist yet (`HELDOUT-DESIGN.md`).
- Whether a provider treats probe traffic differently; whether a local copy of an open model matches its hosted endpoint.
- Power for small changes: 20 items see a large change; run 2 shows how large.
- Multiplicity across models, banks and days: no correction is applied.
- The 7 UNTESTED comparison axes and the 10 subject axes: out of scope.

## 9. Reproduce

Run 1: `gh run download 45279396175 -R CSOAI-ORG/councilof-ai` into an empty folder, then `python3 -I scripts/silent-change/diagnose_run1.py <folder>` and `python3 -I scripts/silent-change/watch.py report --dir <merged batch folder> --run run1` (reproduces the six signed rates). The permutation seed comes from the comparison id, so every p-value is recomputable. Run 2: the same `report` command with `--run run2` over its batch files.
