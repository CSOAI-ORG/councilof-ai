# The pod's GGUF cards clear no hub-queue cells, and that may be correct

Measured 2026-09-06, before spending GPU on the 575-model batch.

## The reachable set

The hub queue holds 2,773 rows; 947 are `text-generation`, which is what the pod grades.
Scanned every one against the exact-name GGUF rule the local mill uses — a candidate
repo's name, minus a `-GGUF`/`.gguf` suffix, must EQUAL the model's name:

| | models |
|---|---:|
| an exact-name GGUF mirror exists | **575** |
| none | 371 |
| UNCHECKABLE (lookup failed) | 1 |
| **total text-generation** | **947** |

60.7% reachable. The loose "any gguf search hit" rule overcounts this by ~60%, which is
why the exact rule is the one quoted.

## The finding: those cards cannot fill the cells they were run for

`flip_queue_axis()` matches a card to a queue row by **exact string equality**:

```python
if str(r.get("id") or "") != model_id:
    continue
```

A queue row's `id` is `Qwen/Qwen2.5-1.5B-Instruct`. A pod card's `body.model` is

```
ollama:hf.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF:q4_k_m@sha256:3de61eb04f46…
```

These never match. Verified against the live queue: for all three sampled pod cards the
exact id is absent from the queue and the intended row is present.

Corroborated on the board: of 866 published cells, **zero** carry an `ollama:hf.co/*` id.
The 65 `ollama:*` cells are all ollama-library tags (`mistral:7b`, `qwen2.5:1.5b`,
`qwen3:4b`) from the earlier fleet.

**So batching all 575 models across 14 axes would produce roughly 8,000 cards and clear
zero queue cells.** The 12 cards already sitting on the pod from batches 1 and 2 have
cleared none.

## Why this is a ruling, not a bug to patch

The obvious "fix" is to write the queue's model id as the card's subject. That would be
attributing a **quantised** model's behaviour to the original weights. `q4_k_m` is a
different artifact from the fp16 model on the Hub, and can score differently; the estate
already refuses to let one model's identity stand in for another's — the worker halts
when a loaded manifest digest does not match the config's `expected_model_manifest_digest`.

The pod's current ids are the honest ones. What they are not is queue-clearing.

So the choice is explicit:

1. **Rule that a pinned quantisation measures the model.** The cell is filled by
   `Qwen/Qwen2.5-1.5B-Instruct` with the quant and manifest digest recorded in the card,
   and the board says somewhere legible that GGUF-transport cells are quantised
   measurements. 575 models become reachable.
2. **Rule that it does not.** The pod's GGUF work is a separate population — a
   quantisation axis of its own — and it never clears queue cells. Then the queue's
   coverage has to come from the provider-API mill, and the 575 number is not coverage.

Either is defensible. Neither is what is happening now, which is producing cards that
land nowhere and reporting the batches as progress.

## What was NOT done, and why

No further batches were run. Beyond this, two grading defects found the same day are
unmerged (the mill's substring predicate, and the pod intake counting an unanswered item
as a wrong one), and the pod runs a pinned release. Milling 8,000 cards through a grader
with a known denominator bug, into cells they cannot fill, is negative work.
