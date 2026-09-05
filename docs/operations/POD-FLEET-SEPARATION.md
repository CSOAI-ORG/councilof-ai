# Pod-fleet separation — computed, not UNTESTED

`scripts/runpod_gspc_separation.py`, run over the pod's 112 durable runs on 2026-09-05.

## What it is, and what it is not

`/api/gspc` defines `separation_p` as **"McNemar exact p on discordant pairs (leader vs best
base)"** — a tuned leader against the strongest base model. **The pod runs five base models and no
tuned model, so it cannot produce that number, and this script never claims to.** Eleven board axes
read `separation: UNTESTED` and this does not change any of them.

What it answers is a different, honest question: *on one frozen bank, do the pod's own models differ
from each other by more than chance?* The output is namespaced `pod_fleet_separation` and carries
`not_board_separation: true` so it can never be read back as the board's field.

## Method

- The estate's own test, not a fresh one: `harness/owem/card_pipeline.mcnemar_exact`
  (exact two-sided binomial on discordant pairs, alpha 0.05).
- Pairing is by `item_id` **within one `bank_sha256`**. Runs graded against different bank bytes are
  never paired — a paired test over unpaired items is not a test.
- `n < 30` withholds the verdict as **UNQUOTABLE**, the same threshold `sign_mill_cards.py` uses to
  decide MEASURED. Unquotable is not TIE.
- An unparseable row aborts rather than being skipped: a dropped row silently understates `n`.

## Result — 112 runs, 14 axes

    SEPARATED 3 · TIE 10 · UNQUOTABLE 1 · UNCHECKABLE 0

| axis | n | top | acc | runner-up | acc | discordant | p | verdict |
|---|---|---|---|---|---|---|---|---|
| jail | 41 | mistral:7b | 0.902 | qwen2.5:1.5b | 0.073 | 38 | 0.00000 | **SEPARATED** |
| care | 199 | qwen2.5:0.5b-instruct | 0.462 | qwen2.5:1.5b | 0.236 | 107 | 0.00002 | **SEPARATED** |
| art5-safeguard | 36 | qwen2.5:7b | 0.944 | qwen2.5:1.5b | 0.583 | 17 | 0.00235 | **SEPARATED** |
| governance | 237 | mistral:7b | 0.498 | qwen2.5:7b | 0.498 | 122 | 1.00000 | TIE |
| conformance | 35 | qwen2.5:7b | 0.657 | qwen2.5:1.5b | 0.543 | 22 | 0.52347 | TIE |
| provenance | 32 | qwen2.5:7b | 0.812 | qwen2.5:1.5b | 0.719 | 9 | 0.50781 | TIE |
| safety | 36 | qwen2.5:7b | 0.750 | qwen2.5:1.5b | 0.694 | 10 | 0.75391 | TIE |
| openness | 32 | qwen2.5:7b | 0.750 | qwen2.5:1.5b | 0.688 | 8 | 0.72656 | TIE |
| continuity | 33 | qwen2.5:7b | 0.545 | qwen2.5:0.5b-instruct | 0.333 | 29 | 0.26493 | TIE |
| cross-reality | 32 | qwen2.5:7b | 0.625 | mistral:7b | 0.500 | 8 | 0.28906 | TIE |
| detector-interop | 33 | mistral:7b | 0.788 | qwen2.5:1.5b | 0.697 | 15 | 0.60724 | TIE |
| machinery-conformity | 33 | qwen2.5:1.5b | 0.424 | mistral:7b | 0.333 | 7 | 0.45312 | TIE |
| affect | 41 | qwen2.5:1.5b | 0.439 | qwen2.5:7b | 0.390 | 16 | 0.80362 | TIE |
| **swarm** | **8** | qwen2.5:7b | 0.500 | mistral:7b | 0.250 | 2 | 0.50000 | **UNQUOTABLE — n=8 < 30** |

A TIE is "no difference shown", never equality proven. `swarm` pairs on 8 items because its frozen
bank has 8 rows; that is a bank size, not a result.

## Re-run

    python3 scripts/runpod_gspc_separation.py --intake <dir of pod items.jsonl> --out sep.json

Fetch the inputs from the durable copy:

    huggingface-cli download csoai/runpod-gspc-intake --repo-type dataset --include '*items.jsonl'

## What is still missing for the board's 11 UNTESTED axes

They need **leader vs best base** on the board's own fleet. The pod cannot supply it while it holds
no tuned model. Either the board's fleet runs the same banks per item, or a tuned model joins the
pod — until then UNTESTED is the honest value and must not be replaced by this one.
