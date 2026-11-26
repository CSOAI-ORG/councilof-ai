# Silent-change detector: pre-registration (protocol 1)

Written 22 Nov 2026, before any result exists. Committed on its own so the commit date proves the method was fixed before the data. The machine-readable twin is `protocol.json` in this folder; the runner refuses to start if its constants differ from it, and every result record carries the sha256 of both files.

Measurement, not certification. TIE is TIE. A flag is a detected change in behaviour on the probe items, nothing more.

## 1. Why

The live board (`GET https://councilof.ai/api/gspc`, read 22 Nov 2026): "34 axes measured · 14 model comparisons: 0 separated · 7 TIE · 7 UNTESTED". One run per cell cannot tell a real difference from the model's own run-to-run spread. This protocol runs each cell about 30 times so the spread is seen, then watches for movement against a signed baseline, including on paid models whose weights, raw reasoning and training data cannot be seen.

## 2. Items

20 frozen bank items: 10 from lane `provenance` and 10 from lane `conformance`, chosen by a fixed rule (smallest sha256 of lane, NUL, item text). Prompt and answer reader are the board's own (`axis_prompt`, `read_label`), unchanged. The items are public, so a model may have seen them; see "Limits".

## 3. Repeats and calls

K = 30 repeats of every item per batch, one request per repeat (never an n=30 parameter, which shares a prefix). All 600 calls of a batch are shuffled together with a seeded RNG so time of day is spread across items. Declared sampling: temperature 0, max_tokens 32, no system prompt.

## 4. Statistic

For each item, the share of each answer category in the baseline batch (p) and in the new batch (q). `UNPARSED` is a category. Per item `TV = 0.5 * sum |p - q|`. The statistic is `T = mean of TV over the 20 items`.

Its null distribution is made by shuffling: inside each item the 60 answers (30 + 30) are pooled and re-split at random 30/30, 2000 times. `p = (1 + #{T* >= T}) / 2001`. The seed comes from the comparison id, so anyone can recompute it.

This test assumes the baseline and the new batch are exchangeable when nothing has changed. The calibration's no-change trials (C0) check that assumption on real servers.

## 5. What counts as a flag

`p <= 0.01` AND `T >= 0.03`. The floor means: at least the equivalent of one item in ten moving by 30 points of share. Both numbers were chosen before data, as a trade between false alarms (many models, many days) and sensitivity. They are not tuned afterwards. If they turn out badly, that is reported and a protocol 2 is written; protocol 1 is not edited.

A flag says the answer distribution on the probe items moved by more than rerun spread. It does not say the cause (weights, serving stack, quantisation, routing, a changed prompt wrapper, our own parser, load), and it says nothing about quality, risk or compliance.

## 6. Baseline

The first batch for a model is its baseline (`BASELINE_SET`); nothing is compared. It is signed in GitHub Actions. It is replaced only by a person starting the workflow with `rebaseline=true`; the new record names the hash of the one it replaces. A flag stays a flag on later runs until that happens.

## 7. Calibration on open models (the method's credentials)

One open model at a pinned revision, run by the same code with the same statistic and flag rule. Exact repo, revision and file hashes go into `calibration-pins.json`, committed before the first calibration batch.

| Condition | What is done | Trials |
|---|---|---|
| C0 | same revision, run again | 30 |
| C1 | a different revision of the same model | 10 |
| C2 | a quantised copy of the same revision | 10 |
| C3 | one neutral sentence added as a system prompt | 10 |
| C4 | temperature 0 changed to 0.5 | 10 |

One trial = a full new batch compared with the one baseline batch. Reported per condition: flags out of trials, exact Wilson 95% interval, mean T. C0 is the false-flag rate. C1 to C4 are the detection rates. All five are reported, including any that go badly. Unit tests on synthetic data prove the code, not the method, and are never reported as calibration.

With 30 C0 trials, zero flags still leaves an upper bound near 0.11 (Wilson). The report says so; it does not claim a lower false-flag rate than the data supports.

## 8. Watch on paid models

Same code, same items, same statistic, same flag rule, under the public model name. OFF until: (a) the clauses file exists (it does, 22 Nov), (b) a named person has confirmed per provider that the governing agreement permits benchmarking and publication, recorded in `scripts/silent-change/paid_models.json`, (c) the C0 rate has been measured. One batch per model per day at a random minute inside a window. A flag is printed with the C0 rate and the detection rates beside it. No ranking exists; own-council models are never in a public table. No correction across models, banks and days is applied; the expected false flags per day is stated as models times the C0 rate.

## 9. Limits (stated now)

- 20 items can see a large movement, not a small one. The board's own minimum detectable differences for these lanes are 0.288 to 0.306 for a paired two-model comparison; this test is a different question (same model, per-item answer distribution) and its power is what calibration measures.
- Public items can be memorised or recognised. Repeating a leaked item 30 times measures the memory 30 times. A private rotating set is the answer; see `HELDOUT-DESIGN.md`. It does not exist yet.
- A provider that detects and special-cases probe traffic is not seen by this method.
- Replicas, routing and load vary by time; C0 measures how much of that shows as false flags.
- Hosted endpoints are a different arm from a local copy of the same model; no cross-claim is made.
- Raw reasoning, weights and training data of paid models stay in `unmeasured[]`.

## 10. Addendum 1 (22 Nov 2026, still before any data): data-quality gate

If more than 5 percent of the calls of a batch fail at the transport (network error, timeout, an HTTP error other than a refusal of credentials), the batch is `UNCHECKABLE`: it is not compared, not counted as a flag and not counted in any rate. A failed fetch is never read as "unchanged" or "changed". `UNPARSED` answers are not transport failures; they stay a category. Sections 1 to 9 are unchanged. This is recorded in `protocol.json` under `addendum_1`.

## 11. Addendum 2 (23 Nov 2026, still before any data): the open-model calibration as it will run

Written and committed before any calibration batch exists. Sections 1 to 10, the statistic and the flag rule are unchanged. The machine-readable twin is `addendum_2` in `protocol.json`. What changes is only how section 7 is carried out.

**Model.** Qwen2.5-0.5B-Instruct as GGUF files (Apache-2.0), served on the GitHub-hosted runner by the `llama-server` of llama.cpp release b12651 (pinned by tag and sha256). Three files, each pinned by repository, revision commit, file name and sha256 (listed in `addendum_2` and in `calibration-pins.json`). Each sha256 was checked on 23 Nov by downloading the file once into a scratch folder outside the clone and hashing it; the three hashes equal the ones the hub lists.

**Conditions as run.**

| Condition | What is done | Trials |
|---|---|---|
| BASE | 0.5B Q8_0, temperature 0, no system prompt (the one baseline batch) | 1 |
| C0 | the same file, run again | 30 |
| C1 | a sibling model: 1.5B Q8_0, otherwise the same | 10 |
| C2 | the same 0.5B weights, Q4_K_M instead of Q8_0 | 10 |
| C3 | the 0.5B Q8_0 with one added system sentence, "Read the question carefully before answering." | 10 |
| C4 | the 0.5B Q8_0 at temperature 0.5 | 10 |
| BASE5 | 0.5B Q8_0 at temperature 0.5 (the one baseline batch for C5) | 1 |
| C5 | the same as BASE5, run again (no change, answers varying) | 20 |

Two departures from section 7, both made now. (1) C1 was "a different revision of the same model". No such thing exists for these files: the 0.5B GGUF files carry the same sha256 in the first and second commits of their repository and in the current one, so there is nothing different to run. C1 is the sibling model instead. It is a bigger change than a revision would be, so a flag in C1 says less about small changes. (2) C5 is new. At temperature 0 on a serial local server a file repeats its answers, so C0 may show no movement at all, which says little about false flags when answers vary. C5 asks the false-flag question while the model is sampling. It is a second false-flag rate beside C0, and it is reported whatever it shows. Total: 92 batches of 600 calls, 55,200 calls.

**Why this fits free compute.** A GitHub-hosted job may run 6 hours; a matrix may have 256 jobs; the Free plan allows 20 concurrent jobs (all read on 23 Nov from the `github/docs` source of the limits page; this repository's plan is unverified, so at most 8 jobs run at once). The 92 batches are cut into jobs of a few batches each, grouped by model file, each job planned at about an hour against a limit of six. The full registered plan runs; nothing is shrunk, so nothing in power is lost. A smaller smoke run exists (`trials_scale`) and is not calibration.

**Completeness.** The combined report is signed only if every registered batch is present and comparable. A missing batch is named, and a report with one is not signed. Rates are those of section 7: flags over comparable trials, exact Wilson 95% interval, mean T, for each of C0 to C5. Reading aids fixed now: 0 flags in 30 trials leaves an upper bound near 0.11; 0 in 20 near 0.16; 10 of 10 flags leave a lower bound near 0.72.

**Second view.** An illustrative CUSUM and Shewhart reading of each condition's T series, run with `measurement/experiments/metrology-controls/check_standard.py`. Its reference and spread come from resampling the baseline batch alone, its clock is the trial order, and it has no established false-alarm rate. It changes no flag, no rate and nothing that is signed.

**Rehearsal.** A local run on 2 items and 3 repeats proves the pipeline before the first Actions run. Its rows are never published, never signed and never counted; the report refuses a batch marked as rehearsal.

**Still true.** A flag is a detected change in answer behaviour on the probe items. It is not a cause, and nothing here says safe, unsafe, degraded or certified. The open model served on a runner is a different arm from a hosted endpoint; no cross-claim is made.

## 12. Addendum 3 (24 Nov 2026, after run 1 and before any code or data of run 2): a second decision rule

Committed on its own, before any code or new data of the second run. Machine-readable twin: `addendum_3` in `protocol.json`. Sections 1 to 11, run 1's statistic and flag rule stay as written and stay computable.

**Run 1's rows were used as pilot data.** Run 1 (GitHub Actions run 45279396175, signed record sha256 `5de64693acd1ae4dce393c28f8cca9505790746031cafc67386e45104c9ade59`) flagged 19 of 30 batches in C0 and 12 of 20 in C5 when nothing changed. Its rows were read to find out why (`DIAGNOSIS-RUN1.md`): inside every batch all 30 repeats of every item were identical, so the permutation test had no spread; the only movement was one near-tie item changing its answer from one job to another. Those rows chose the rule below. **The new rule is judged only on a fresh run (run 2).** Run 1's signed rates stay as signed and are never re-scored.

**The new rule (rule 2).** The reference for "no change" comes from repeated independent no-change batches.

- *Pool.* 20 batches of the same file and settings, each in its own job (one fresh runner and one llama-server start; one batch per job). Two pools: BASE (temperature 0) and BASE5 (temperature 0.5).
- *Pooled share.* For each item and answer category, the mean over the 20 batches of that batch's share. UNPARSED is a category.
- *Score.* S(x; pool) = the mean over the 20 items of total-variation distance between batch x's shares and the pooled shares. The same distance as run 1, with a pooled reference.
- *Threshold.* Score each pool batch against the other 19 (leave one out): L_1 to L_20. theta = max L_j.
- *Flag.* A new batch is a FLAG iff S(x; pool) > theta (strictly). No permutation, no p-value, no floor. If theta is 0, any movement flags.
- *False-flag target.* At most 1/21 = 0.0476, about 0.05 per no-change batch, if a fresh no-change batch is exchangeable with the pool batches. The new batch faces 20 pool batches and the pool batches face 19, which makes the rule slightly conservative; this is not corrected. The target is a design aim. C0 and C5 of run 2 measure whether it holds.

**Run 2 as it will run.** 130 batches in 130 jobs: BASE pool 20, BASE5 pool 20, C0 30, C1 10, C2 10, C3 10, C4 10, C5 20 (C0 to C4 against BASE, C5 against BASE5). A trial is never in the same job as any batch it is compared against. Both rules are reported for every trial, rule 1 against BASE-01 or BASE5-01 (the first batch of each pool) and rule 2 against the pool. The job order is a seeded shuffle so baseline and trial batches are spread in time.

**One change to what a batch is.** In run 1 temperature 0.5 did not vary: the server seed was fixed per shard and every repeat was identical. In run 2, batches with temperature above 0 send a per-request seed (an integer from sha256 of trial id, item id and repeat). Temperature 0 batches are unchanged. This makes C4, C5 and BASE5 sample the way a hosted endpoint does.

**Recorded in every batch from now on.** Runner CPU model, logical CPU count, image name and version, runner name, the llama.cpp tag, the version line llama-server prints and the system_info line of its log, the shard, run id and run attempt. Run 1's rows had none of these; no cause for the job-to-job movement was established, and none is claimed.

**Expected false-flag rate and power, and why.** From a synthetic simulation of rule 2 in the structure the pilot showed (identical answers inside a batch; a few near-tie items taking one of two labels per job; changes that move whole items; 20 items, 20 pool batches, 4,000 repetitions per cell). The simulation script is added after this commit and has to reproduce these numbers. The pilot has only 2 to 4 independent jobs per condition, so how many near-tie items a 20-job pool shows is not known.

| | Expected | Why |
|---|---|---|
| False flag (C0, C5) | at most 0.05; simulated 0.000 to 0.027 for 0 to 5 near-tie items | leave-one-out maximum over 20 gives at most 1/21 under exchangeability |
| C1 sibling model | 0.9 or more (simulated 1.00) | 2 of 20 items moved in 10 of 10 trials in all 4 jobs: S about 0.10 against 0.025 per near-tie item |
| C3 added sentence | 0.9 or more (simulated 1.00) | 3 of 20 items moved in 10 of 10 trials in both jobs: S about 0.15 |
| C2 Q4_K_M | low, near the false-flag level (0.0 to 0.1) | in run 1 it moved no item other than the near-tie one; a rule cannot see a movement the 20 items do not show |
| C4 temperature 0.5 | unknown, low to moderate | in run 1 it was not sampling; with per-request seeds shares may spread, by how much the pilot cannot say |
| One whole item moves | simulated 0.96 to 1.00 | S = 0.05 against a reference near 0 |

A partial shift in one item's answers is smaller and will usually not be seen. If C2 and C4 come out mostly NO_FLAG, that is a finding about what 20 items can see, not a failure of the rule, and is reported as such. No power is claimed for any change of a paid model, for items outside the 20, or for real sampling spread.

**Reporting.** For C0 to C5 and for each rule: flags over comparable trials, exact Wilson 95% interval, mean score, which items moved in each flag. With one batch per job, trials are independent draws. Flags by runner CPU model are shown as description only. The illustrative CUSUM view takes its reference and spread from the 20 leave-one-out scores. A report with any of the 130 batches missing is not signed; a failed job may be re-run (the same matrix entry).

**Still true.** A flag is a detected change in answer behaviour on the probe items. It is not a cause. Nothing here is a claim about any paid model. Measurement, not certification.
