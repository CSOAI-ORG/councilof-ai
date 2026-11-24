# Diagnosis of calibration run 1 (analysis of PILOT rows)

Written 24 Nov 2026, before addendum 3 and before any code or data of the second run. Measurement, not certification. TIE is TIE. A flag is a detected change in behaviour on the probe items; it is not a cause.

## What is being diagnosed

Calibration run 1: GitHub Actions run 45279396175, master, 23 Nov 2026, all 92 registered batches present. Signed record sha256 `5de64693acd1ae4dce393c28f8cca9505790746031cafc67386e45104c9ade59`, signer `did:web:csoai.org#board-attestation-1`. The signed rates are published as signed and are never re-scored:

| Condition | Flags / trials | Rate | Wilson 95% | Mean T |
|---|---|---|---|---|
| C0 no change, temperature 0 (false-flag rate) | 19 / 30 | 0.6333 | 0.4551 to 0.7813 | 0.0317 |
| C5 no change, sampling at 0.5 (false-flag rate) | 12 / 20 | 0.6000 | 0.3866 to 0.7812 | 0.0300 |
| C1 sibling model | 10 / 10 | 1.0000 | 0.7225 to 1.0000 | 0.1000 |
| C2 Q4_K_M for Q8_0 | 5 / 10 | 0.5000 | 0.2366 to 0.7634 | 0.0250 |
| C3 one added system sentence | 10 / 10 | 1.0000 | 0.7225 to 1.0000 | 0.1500 |
| C4 temperature 0 to 0.5 | 7 / 10 | 0.7000 | 0.3968 to 0.8922 | 0.0350 |

The method as registered flagged about six times in ten when nothing changed. That is the result of run 1.

From here on the rows of run 1 are **pilot data**: they were read to choose a new rule. The new rule is judged only on a fresh run (addendum 3). Nothing below re-scores run 1.

## How this was read

The per-batch rows (`batch-*.json`, 92 files, 12 job artifacts) were downloaded with `gh run download 45279396175` into a scratch folder outside the repository and read with the repository's own `detector.py` (statistic and permutation test unchanged). Each row holds, per item, the 30 parsed answers and the sha256 of each raw reply; it holds the model file hash, llama.cpp tag, declared sampling and time. It does **not** hold the runner's CPU model, the operating system image, the job's identity, the server seed or the llama.cpp compiler/instruction-set line. The job each batch ran in is known only from the artifact it was uploaded in (`calibration-<shard>`). The `timing-*.json` files give seconds per batch and setup time per job.

## Findings, with counts

1. **There is no answer spread inside any batch.** All 92 batches x 20 items = 1,840 item-batches. In every one of the 1,840, all 30 repeats gave the same parsed answer. This includes the 400 item-batches of C5 and the 200 of C4 at temperature 0.5. For C5-01 the 30 raw reply hashes of each item are also identical (1 distinct hash per item, 20 of 20 items). So the temperature-0.5 conditions were not varying either. The shard runner starts every server with a fixed seed derived from the shard name (addendum 2, "a fixed server seed per shard"); with the prompt cache off and the same seed per request, identical prompts would be expected to give identical replies. The rows are consistent with that; they do not record the seed, so this is **not shown by the rows**.

2. **So the registered permutation test has no spread to compare against.** Inside an item the 30 + 30 pooled answers are re-split at random. When the baseline says "A" 30 times and the new batch says "B" 30 times, almost every re-split gives T* near 0 and the observed T cannot be matched: p takes its minimum value 1/2001 = 0.0005. Recomputed here: C0-12 (one item differs from the baseline) T = 0.05, p = 0.0005, FLAG. One moved item is enough: T = 1/20 = 0.05 is above the 0.03 floor and p is at its floor.

3. **One item of 20 moved between no-change batches.** Of the 30 C0 batches against the baseline, 11 moved no item (T = 0) and 19 moved exactly one item (T = 0.05). The item is `conformance:17f73b3d42a95935`. No other item changed its answer in any C0 batch. Across all no-change batches of any condition (C0, C2 to C5 against their baselines) the only item whose single answer ever differed from another batch of the same condition is that same one. The other 19 items gave the same answer in every C0, C2, C4 and C5 batch and in BASE and BASE5 (BASE and BASE5 differ on no item). C1 and C3 moved other items on purpose (point 6).

4. **Movement follows the job a batch ran in, not the batch.** Within one job (one llama-server process on one runner), every batch of one condition gave the same answer on that item. Between jobs it differed:

   | Condition | Job | Answer on the item |
   |---|---|---|
   | BASE, C0-01 to C0-11 | q05-q8-01 | VIOLATES |
   | C0-12 to C0-23 | q05-q8-02 | CONFORMS |
   | C0-24 to C0-30 | q05-q8-03 | CONFORMS |
   | BASE5, C5-01 to C5-08 | q05-q8-05 | VIOLATES |
   | C5-09 to C5-20 | q05-q8-06 | CONFORMS |
   | C4-01 to C4-07 | q05-q8-04 | CONFORMS |
   | C4-08 to C4-10 | q05-q8-05 | VIOLATES |
   | C2-01 to C2-05 | q05-q4-01 | CONFORMS |
   | C2-06 to C2-10 | q05-q4-02 | VIOLATES |

   The flag counts are exactly those job splits: C0 19 = the 12 + 7 trials in jobs 02 and 03 (baseline is in job 01); C5 12 = the trials in job 06 (baseline in job 05); C4 7 = the trials in job 04 (baseline in job 01, and C4 jobs 04 and 05 differ); C2 5 = the trials in job q05-q4-01 (the file is a different quantisation, so this is not a no-change control, but the other 19 items did not move at all, see 6).

5. **The "30 trials" of C0 are three servers, not thirty independent draws.** The 30 C0 batches ran in 3 jobs (11 with the baseline, 12, 7). C5's 20 ran in 2 jobs, C2's 10 in 2, C4's 10 in 2. The effective number of independent no-change draws was 2 or 3 per condition. Wilson intervals computed on 30 trials therefore look tighter than the evidence behind them.

6. **C2 and C4 flagged only on that one item.** In C2 and C4 the batches that flagged moved exactly the one item above and nothing else; the batches that did not flag moved nothing. On these 20 items neither Q4_K_M nor temperature 0.5 (with the fixed seed) moved any item that the job-to-job movement did not already move. So these two flags are not evidence of a detected change from the condition. **C1** moved 2 items (`provenance:2bc81d9c14a1f1b9`, `provenance:2c00fb35deb01d99`) in all 10 trials in all 4 of its jobs; **C3** moved 3 items (`provenance:0e2607c5b891a4b7`, `provenance:174f95f3562ebc3b`, `provenance:3e8debd6763515f2`) in all 10 trials in its 2 jobs. Those are stable across jobs: T = 0.10 and 0.15 against a between-job movement of 0.05 at most.

7. **What the rows say about the machine, and what they do not.** The rows do not record the runner CPU. The per-batch seconds differ by job for the same model file and the same batch: q05-q8-01 mean 201 s (range 197 to 207), the other five q05-q8 jobs 260 to 274 s. That is consistent with the jobs having run on different hardware or under different load. It is not evidence of it. A cause for the one item flipping between jobs (CPU instruction set, thread count, floating-point summation order, or something else) is **not established**; the item is, on the rows, a near-tie between two labels that the server resolves differently from one job to another. The next run records runner CPU model and the llama.cpp build line in every batch so this can be read instead of guessed.

8. **UNPARSED / transport.** Every batch had a transport error share of 0.0. Answer categories seen on the first repeat of each item: VIOLATES 877, DESTROYED 870, SURVIVES 50, CONFORMS 43 (counted over 92 x 20 = 1,840 first answers); no UNPARSED.

## What this does and does not mean

- Run 1 shows that, on one model served on GitHub-hosted runners, the registered rule's reference (within-batch spread) was zero, and that the real variation between independent servers was larger than that zero. It does not show what the false-flag rate of the registered rule is on a hosted API with real sampling.
- It does not say the 20 items are bad; it says one of them is a near-tie for this model and that identical-looking repeats inside a batch are not independent evidence.
- It says nothing about any paid model.

## Reproduce

`scripts/silent-change/diagnose_run1.py <dir of downloaded run-1 artifacts>` (added later in the pull request that carries this file) prints every count above.
