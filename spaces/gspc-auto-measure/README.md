---
title: GSPC Auto-Measure
sdk: gradio
sdk_version: 6.31.0
app_file: app.py
pinned: true
license: cc-by-4.0
---

# GSPC Auto-Measure

One model and one frozen GSPC bank per request. The six-model, five-bank queue and the existing
`/measure_next` Markdown endpoint remain available. Runs use the existing ZeroGPU allocation.
The canonical source is [Council of AI](https://github.com/CSOAI-ORG/councilof-ai/tree/master/spaces/gspc-auto-measure).
`SOURCE_REVISION.json` binds this deployment to its exact committed source.

## Evidence returned

Every result includes the complete generated text and token IDs, SHA256 hashes of the raw output,
prompt and bank item, model/tokenizer revision, frozen bank revision, canonical grader hash,
generation protocol and runtime package versions. Stop reasons are explicitly labelled as token
observations (`eos_token`, `length`, `unknown`); they are not invented provider finish metadata.
A length stop is evidence of reaching the token limit, not proof that the answer is semantically incomplete.

The grader is generated verbatim from `harness/gspc-top100/mill_hub_queue.py::read_label`.
Menu echoes and label substrings do not count. The canonical last-line rule is preserved.
`accuracy` now uses `n_graded`; `parse_rate`, `n_attempted`, `n_unparsed`, and
`accuracy_all_attempted` expose the changed denominator. Unparsed items have `grade: null`.
Legacy keys (`run`, `model`, `bank`, `timestamp`, `accuracy`, `hits`, `total`, `items`, `answer`,
`hit`) remain; `answer` is now complete rather than truncated to sixty characters. Consumers
must use the `schema: csoai.gspc-auto-measure/2` field when comparing historical scores.

## Persistence and rotation

The Space reads the existing [results dataset](https://huggingface.co/datasets/csoai/gspc-auto-measure-results)
at an exact revision, verifies each v2 full-receipt SHA256, and recovers the next sequence from archived receipts. Legacy counters that
restarted are seeded by unique historical receipts. Each bank's window is derived from the global
sequence, so it no longer depends on a separate in-memory visit counter. An unavailable history
store fails before inference instead of silently resetting to zero.

**The persistence driver must archive the complete returned JSON.** This Space makes no Hub writes
and needs no new write token. Local `/tmp/results` files are ephemeral. Unarchived calls can repeat
after a restart; the UI states that limitation. `/measure_at` is an additive JSON endpoint that
lets a driver supply its durable sequence and replay a committed receipt idempotently. Calls are
serialized in this runtime. Separate replicas/drivers need one shared sequence owner; this is not
a distributed exactly-once guarantee.

## Qualification and scope

`python -m pytest spaces/gspc-auto-measure/test_measurement.py` checks full-output preservation,
canonical parsing, denominators, bank integrity, restart recovery, duplicate receipts and window
rotation without model calls. The bank/grader producer is
`node scripts/surface/build-lm-eval-tasks.mjs --check`; it also builds the portable lm-eval pack.

Results are unsigned diagnostic measurements. They do not write to the GSPC board, certify a model,
or establish independent GSPC admission. Historical results are unchanged. The prompt protocol
changed from truncated ad hoc text to the canonical axis template, so old and new runs require
separate protocol labels.
