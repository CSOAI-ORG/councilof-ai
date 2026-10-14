# Claude models on the frozen GSPC banks — worker, instrument, and the intake change it needs

Status: worker + tests + terms archive landed on a branch. **No run has been
measured.** Nothing here signs, admits, or publishes anything.

## What exists

| Piece | Path | State |
|---|---|---|
| Compute-only worker | `scripts/anthropic_gspc_worker.py` | 28 offline tests pass on RunPod, 14 Oct (`scripts/test_anthropic_gspc_worker.py`); original 14 preserved |
| Provider terms archive | `measurement/provider-terms/anthropic/2026-10-13/terms.json` | verbatim quotes, each checked as a substring of the fetched bytes; raw HTML sha256 pinned; raw bytes kept on the measurement pod, not republished |
| Intake acceptance of the new subject class | `scripts/verify_runpod_gspc_intake.py` | **not changed** — see "What intake must decide" |

The worker reuses, unchanged, the Ollama worker's frozen-bank loader and
digest check, prompt composer, exact-label parser, keyword grader, and the
rule that an unparsed or token-cut answer leaves `n` instead of counting as
wrong. It writes the same three-file run directory
(`items.jsonl`, `run.json`, `card-unsigned.json` | `card-incomplete.json`)
plus `model-record.json`.

## Subject class

```
anthropic-api:<model id>@sha256:<sha256 of canonical JSON of GET /v1/models/<id>>
```

This pins the **endpoint record**, not weights. Weights behind a hosted API
are not pinnable by a third party; the record is re-read at the end of every
run and a change rejects the run (`MODEL_RECORD_CHANGED_DURING_RUN`). The card
carries `compute_evidence.model_record_digest` — deliberately **not**
`model_manifest_digest`, which means an Ollama weights manifest.

## Instrument differences from the open fleet (recorded in every instrument)

1. **Sampling.** On all four current API models a non-default `temperature`,
   `top_p` or `top_k` returns HTTP 400 (platform.claude.com, Extended thinking
   page, read 2026-10-13). Runs use provider-default sampling: **not
   temperature-0 deterministic, no seed.** Run-to-run variance is
   unmeasured until a repeat run exists.
2. **Thinking.** Fable 5.1 and Opus 5.5 reject `thinking: disabled`; they run
   adaptive thinking at `effort: low`. Sonnet 5.5 runs
   `thinking: between_tools` (no up-front thinking). Haiku 5.5 runs
   `thinking: disabled`. Only text blocks are graded; thinking text is never
   stored.
3. **Token budget.** Mirrors the reasoning-model rows of
   `fleet-next-models-2026-10-06/QUEUE.md`: exact-label banks at
   `max_tokens 2048`, the all-keyword swarm bank at `1024`.
4. **Safeguard stops.** `stop_reason: refusal` is an HTTP 200 with no label;
   it is excluded like any other unparsed answer and counted in
   `run.json → stop_reason_counts`. The posted Usage Policy (effective
   12 Nov 2026) states a block "does not by itself indicate a violation".

## Banks

Axis ↔ bank comes **only** from `scripts/runpod_gspc_bank_allowlist.current.json`
(12 axes — `detector-interop` and `affect` are not in it, so neither runs:
813 items per model). Labels are the sorted distinct gold
values of the bank — the rule the pod's Ollama job configs already use.
Every one of the 12 banks asks for a single label (or, for swarm, a keyword
answer); none asks the model to produce the content it describes.

Observed while preparing this (not fixed here, other lane): on the pod at
`/workspace/gspc-worker/jobs/`, the `continuity-*` configs pin bank
`f963e3c7…` (the allowlist's **safety** bank) and the `openness-*` configs
pin `25dd6a72…` (the allowlist's **continuity** bank). Intake would reject
those runs as `BANK_NOT_ALLOWED`, so nothing wrong reaches the board, but the
compute is spent on mismatched pairs.

## What intake must decide (K3 / signing lane — not done here)

`verify_runpod_gspc_intake.py` accepts exactly
`ollama:<tag>@sha256:<manifest>`. An `anthropic-api:` run is rejected today,
which is correct until the control plane decides:

- whether `anthropic-api:` is an admissible subject class at all;
- that `compute_evidence.model_record_digest` replaces `model_manifest_digest`
  for that class, and `run.json.instrument.decode.sampling` replaces the
  temperature-0 check;
- the `items.jsonl` row schema `csoai.anthropic-gspc-item-evidence/0.1`
  (adds `stop_reason`, `stop_details`, `api_usage`, `attempts`;
  drops `ollama_metrics`);
- whether a card for a non-deterministic subject needs a repeat run before
  it may be MEASURED.

## Running it (on the measurement pod, where the frozen banks live)

The API key never goes into the repo, a card, a log or a chat. Put it in a
file only root can read:

```bash
mkdir -p -m 700 /workspace/secrets && install -m 600 /dev/null /workspace/secrets/anthropic_api_key
# paste the key into that file with an editor, then from a checkout of this branch:
w() { python3.11 scripts/anthropic_gspc_worker.py --banks-dir /workspace/gspc-worker/banks \
  --output-dir /workspace/claude-fleet/runs --api-key-file /workspace/secrets/anthropic_api_key \
  --terms-archive measurement/provider-terms/anthropic/2026-10-13/terms.json "$@"; }
w --model claude-haiku-5-5 --model claude-sonnet-5-5 --model claude-opus-5-5 --budget-usd 40
w --model claude-fable-5-1 --budget-usd 90
```

Historical illustrative cost calculation from `--estimate` on the pod's frozen banks (600 assumed input tokens per item plus its whole `max_tokens`): Haiku $0.86, Sonnet $17.25, Opus $34.49, Fable $86.23 —
$138.83 for all four under those assumptions. This is not a verified upper
bound or a real-spend receipt; prompt size, pricing and thinking can differ.

Budget admission now requires `--request-cost-bound-usd <qualified-bound>`
for a real API run. Before **each HTTP attempt**, including a retry, an atomic
reservation checks that known usage estimates + retained unknown attempts +
all in-flight reservations + the new bound fit `--budget-usd` **per model**.
A refusal or an insufficient remainder sends no request. A non-success HTTP
attempt or timeout retains its full bound; retries cannot reuse that money.
Missing/invalid usage or actual priced usage above the bound halts further
admission and makes the candidate unlandable. A different or missing response
model is never graded or priced as the requested model.

The operator must establish a conservative bound that covers the complete
request under the actual provider's prices and billing rules, and use an
independently enforced provider spend cap. This local admission budget is
**not a provider-enforced invoice ceiling**. It cannot guarantee charges if
the supplied bound, price table or provider reporting is wrong. The token
counting endpoint itself supplies an estimate, so its count alone is not a
proof of a hard monetary bound:
https://platform.claude.com/docs/en/build-with-claude/token-counting

No bound or API spend is authorized by this change. The earlier example
commands deliberately remain ineligible for paid execution without a qualified
bound. Multiple `--model` arguments receive separate budgets; their total may
be the sum of those budgets, not one invocation-wide ceiling.

Refusal, max-token and context-window terminal states are excluded before
either grader, even when a complete-looking label or all keywords are present.
Evidence retains the original text and stop reason; excluded answers do not
increase `n` or correctness.

`--dry-run` exercises the whole pipeline with no network and writes runs that
are marked `dry_run` and never landable.

## Transport correction — 14 October 2026

The API worker now uses its own urllib opener with `ProxyHandler({})` and a redirect-refusing handler, following the existing sibling worker's pattern. Environment proxies and automatic redirects cannot silently forward the API key through another route. Redirect responses stop that attempt without an automatic retry; its conservative unknown-cost reservation remains retained. TLS verification remains enabled.

All 31 offline worker tests passed on existing RunPod B3, with sockets and DNS blocked. Added controls cover same-host/cross-host/downgrade redirects, ambient proxy settings, the unchanged original request and one-attempt refusal. This is synthetic transport qualification, not an API call, model availability result, provider invoice cap or control-plane admission. The existing required gates now invoke this suite alongside the delivery runner; final-head hosted results and main Claude M4's disposition of the existing security review remain required.
