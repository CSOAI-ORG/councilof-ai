# packages/repro

One-command **stranger re-run** pack. The five things a third party needs for an EXACT
re-run, folded into one manifest:

    trace_hash (otel_trace_hash) · harness_version · seed · dataset_hash · grader_version

Any field not honestly known is written **UNCHECKABLE** — never a seed reverse-engineered
from a number. That is the gap versus Braintrust-style bundles, stated instead of hidden.
Filling those fields on *new* cards is the product; inventing them on old cards is not.

## `manifest.py` — the fold + the card reference (H24)

```bash
# from an existing card (lifts otel_trace_hash / dataset_hash / seed if present)
python3 packages/repro/manifest.py --card public/signed/cards/<id>.json
# or explicitly
python3 packages/repro/manifest.py --seed 1234 --harness-version owem@0.1 \
  --dataset-hash <64hex> --grader-version refuse-re@2 --trace-hash <64hex>
```

Emits a `repro-manifest-v0` document with a `repro_manifest_sha256`. A card **CAN reference
that sha** (`card_field(manifest)` -> `{"repro_manifest_sha256": ...}`) — the card points at
its repro pack, it never embeds it, and the reference never upgrades an UNCHECKABLE field to
known. Schema: `public/schema/repro-manifest-v0.json`. Does not sign, does not write the board.

## `repro.sh` — quick field check

Prints, for one card, which of the required fields are present and which are UNCHECKABLE.

## Tests

`python3 packages/repro/test_manifest.py` — no inputs => 5/5 UNCHECKABLE; sha recomputes and
is referenceable; fields lift from a card while missing ones stay UNCHECKABLE.
