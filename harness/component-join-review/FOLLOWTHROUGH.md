# Byte-bound receiver and existing-owner follow-through

10 November 2026. Continues #4180; no duplicate model, Space, scheduler or production router.

## Alignment before changes

The previous #4180 head `cd66b4ddc6bef29fcac943078e226cd8f6055630` now has six successful returned workflows, including pr-gates run `42753427130`. Those results qualify that head only.

The #4176 owner has already published the public research Space `csoai/meok-oowm-hybrid-lab` at `238e2f9a6f29bdcdc7185fc84ea304222ad5c9f2` and reported the additive Memory Venturi tool in the existing private runtime. This lane does not recreate or replace those services, update their weights, or claim their author's tests as its own.

An outside-observer HTTPS readback at `2026-11-10T05:28:46.056470Z` compared the pinned repository and live Space bytes for `core.mjs`, `ui.mjs`, `style.css`, `model/weights.json`, and `data/test.jsonl`: all five matched exactly with HTTP 200. That is served-artifact identity, not a new inference run or private-runtime qualification.

## Reproduced defect and correction

The existing join returned a shallow copy of its context. Changing the caller's label list after return changed the output without updating `review_sha256`. This was reproduced against the retained implementation. The corrected function detaches the nested context. Oversized numeric integers are also refused as invalid input instead of leaking an arithmetic overflow.

Original artifacts and hashes remain retained. No signed evidence was rewritten, and no production impact is inferred from this API-level finding.

## New receiver boundary

`receive_artifacts.py` consumes bounded UTF-8 artifact bytes plus separately supplied expected pins. It checks the exact bytes before extracting labels, probabilities or source context, then reuses the existing join. It accepts no URL, filesystem path, code or model provider from the request. The declared artifact format is the existing research receipt fields without its self-referential result digest.

The receiver does not trust an embedded hash as its own reference. Each caller pin binds the component ID, content revision and exact artifact SHA-256. Rehashing a changed dependency does not bypass comparison with the caller's current context.

This is not authentication: the host must obtain those pins and context through its existing trust path. Supplying attacker-selected bytes and attacker-selected pins still cannot establish source truth. Checksums, code identity, calibration, independent reviewer custody and permission remain distinct.

`review_json()` is an explicitly labelled caller-clock replay function. The MCP entrypoint uses `review_current_json()` and the receiver's UTC clock; a request-provided `now` field is rejected. This prevents a tool caller from backdating the expiry check. Source currentness and dependency completeness still require the existing owner's authenticated state, not a claimed field alone.

## Existing evidence contract, not another ledger

`evidence_json()` calls the repository's unchanged `packages/evidence-fabric/event.py` and produces `csoai.evidence-event/0.1`. It references the byte-verified artifact manifest and review identity, remains PARTIAL with `value=null`, has no signature/anchor, and withholds execution authority. Predicted probabilities are not re-labelled as measured event values. The canonical event source blob used locally is `7fa0d64ea0a02e322ac72dab446c2b2345d0844f`.

`mcp_receiver.py` is a finite stdio qualification entrypoint. The same review function can be imported by the existing host after owner acceptance; this source addition registers no live endpoint or daemon. `smoke_mcp.py` tests a valid result, byte tampering, stale dependency context, caller-clock refusal, and recovery using only synthetic fixtures.

## Actual local qualification

The retained 45-test suite was replayed first. The combined corrected suite passes **90 tests**: 42 original contract tests, three original mutation controls, 42 new receiver/clock/alias/numeric tests, and three new receiver mutation controls. Each deliberately weakened copy fails the intended assertion rather than failing to import or parse. The canonical event builder was reused byte-identically.

```sh
python3 -B -m unittest discover -s harness/component-join-review -p 'test_join*.py' -v
```

The existing Vitest discovery wrapper now requires all 90 tests. No workflow permissions or schedules change. Final-head hosted checks and actual protocol execution receipts must be read separately; the previous successful HF job is not re-described as a run of this new receiver.

## Existing-owner integration contract

- #4180 owns categorical output joining and its byte-bound receiver. Categorical outputs are not interchangeable with #4176's continuous population-state predictions.
- #4176 owns the trained process model, model/data releases and Memory Venturi. The public research consumer and private host remain in place.
- The dependency-graph owner retains retirement, evidence-append and complete traversal semantics. This receiver rejects incomplete/mismatched supplied context; it does not amend that graph or silently fix its callers.
- The existing HF publisher may import the tested `evidence_json(..., current=True)` callable into the owner-controlled runtime. Retain runtime identity, source lock, permissions, privacy and default model routes. Do not expose an additional autonomous executor.
- The release owner retains protected review, merge and live endpoint acceptance. This is a coordination handoff, not another owner's acknowledgement.

No new paid compute, training, model inference, credential extraction, signature, external reply, scheduler, physical photonic experiment or customer acceptance is part of this continuation. The current connected Hub repository scope remains read-only; the now-existing public lab is not therefore described as missing. Pilot terms still require explicit owner acceptance and were not accepted here.
