# DRAFT, not for publication: Silent-change detection on open and paid models

Status: skeleton. Filled only from signed results, never before. No number below exists yet. Every field marked `[from signed record]` stays empty until a signed record supplies it. Publication on Hugging Face, GitHub or the website is the owner's decision after review.

Measurement, not certification. TIE is TIE. A flag is a detected change in behaviour on the probe items. It is not a cause and not a verdict.

## 1. The question
Does one run per cell hide change? On the live board, 0 of 14 comparison axes separate a leader (7 TIE, 7 UNTESTED) [live `/api/gspc`, read on the day of writing]. This report asks how often a repeated, baseline-anchored method notices a known change and how often it raises an alarm when nothing changed.

## 2. The method as registered
Pre-registration commit `f9d7537f9` and addendum `a913d0f24` [dates from git]. 20 frozen items, K = 30, mean total-variation, within-item permutation, flag if p <= 0.01 and T >= 0.03. Link to `PROTOCOL.md`. Any deviation is listed here with its reason; none is allowed to change the numbers reported.

## 3. Calibration on one open model
Model, repository, revision, file hashes: [from signed record]. Pins committed before data: [commit].

| Condition | Trials | Flags | Rate | Wilson 95% | Mean T |
|---|---|---|---|---|---|
| C0 same revision, run again (false-flag rate) | [ ] | [ ] | [ ] | [ ] | [ ] |
| C1 different revision | [ ] | [ ] | [ ] | [ ] | [ ] |
| C2 quantised copy | [ ] | [ ] | [ ] | [ ] | [ ] |
| C3 changed system prompt | [ ] | [ ] | [ ] | [ ] | [ ] |
| C4 changed sampling setting | [ ] | [ ] | [ ] | [ ] | [ ] |

Signed record digests: [ ]. Trials marked UNCHECKABLE and why: [ ].

## 4. Watch on paid models
Not started. Switched off until a person confirms each provider's benchmarking and publication terms. When on: for each model under its public name, days watched, flags, each beside the C0 and C1 to C4 rates above. Expected false flags per day = models x C0 rate. No ranking. Own-council models are not in any table.

## 5. What was not measured (listed, not hidden)
- Weights, raw reasoning and training data of every paid model (`unmeasured[]`).
- The cause of any flag.
- Behaviour on items outside the 20 probe items.
- Whether a provider treats probe traffic differently.
- Whether a local copy of an open model matches its hosted endpoint.
- Any private rotating item set: none exists yet.
- Power for small changes: the 20 items see a large change; the calibration shows how large.
- Multiplicity across models, banks and days: no correction is applied.
- The 7 UNTESTED comparison axes and the 10 subject axes: out of scope for this report.

## 6. Reading a flag
A flag says the answer distribution on the probe items moved by more than rerun spread, against a signed baseline taken on a stated date. Reasons it could move: the model, the serving stack, a quantisation, routing, a wrapper prompt, our own parser or bank, load. Which one is not known from this method.

## 7. Reproduce
`python3 scripts/silent-change/watch.py report --dir <calibration dir>` over the signed batch files; the permutation seed is derived from the comparison id, so every p-value is recomputable.
