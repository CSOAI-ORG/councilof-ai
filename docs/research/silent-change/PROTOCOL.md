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
