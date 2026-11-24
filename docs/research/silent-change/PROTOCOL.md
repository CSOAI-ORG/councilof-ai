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
