# MEOK revision-bound memory Venturi

Additive research component for the existing receiver and Hugging Face lab. This is a derived result cache, not a new canonical memory ledger, an authority store, a model merge, or automatic learning.

## Executed and proposed scope

The implementation passed 34 standard-library regression tests locally and on the authorised M2. The retained experiment executes four policies on nine synthetic traces: three seeds and three nominal reuse levels, 120 requests each (36 variant runs, 4,320 request evaluations). The provider is actual PBKDF2 CPU computation, not a sleep or model API. It includes corrections, retirement, access revocation and truncated impact. The query-only comparator is deliberately unsafe and never selected by production routing.

The additive HF wrapper also exercises the already-trained 980-parameter process model, reusing the existing research_lab components and csoai.evidence-event/0.1 builder. Its integration tests need the exact existing HF assets; this source publication alone is not proof of deployment. No protected production merge or default model route is changed.

## Contract

The authenticated host supplies current access and authoritative source-revision callbacks, the validator, worker identity and replay policy. Tool callers cannot provide authentication or choose filesystem paths. Keys bind tenant/principal, policy epoch, model/tokenizer/adapter/runtime/prompt/sampling/validator revisions, exact request bytes, source revisions and TTL policy. Access and sources are rechecked before returning or retaining a result.

Every full hit is validated. A truncated impact traversal flushes the tenant's derived cache and changes its cache epoch; complete impact can invalidate selected dependencies. This hook consumes existing impact results and does not introduce a second graph. A lost invalidation message does not bypass current source checks. A graph projection's historical current flag is not an authoritative version service.

The SQLite store can reopen across processes on the same compatible local filesystem; the HF research function deliberately uses a fresh temporary directory per invocation and removes it afterwards. It does not solve the private working-bucket capacity issue or establish durable personal memory. Database digests are consistency checks, not tamper-proof authentication against a compromised host. There is no distributed atomicity, single-flight or training-data admission claim.

## Reproduction

python -m unittest -v test_memory_venturi.py
python memory_experiments.py

In an exact existing HF research snapshot with its pinned assets:
python -m unittest -v test_memory_venturi test_memory_ui test_research_lab test_core

Measured savings are workload-specific. End-to-end timing includes source/access checks, SQLite, hashing, verification and provider computation. It excludes fixture creation. Model correctness, real-user privacy, production latency, energy and hardware efficiency require separate evaluation.

## Integration ownership

Only memory_venturi.py, memory_experiments.py, memory_ui_tools.py and their tests belong to this change. Preserve the other lane's research lab, real Cosmos worker, model lock, consent, source manifest and UI. Mirror exact source files into the existing private Space only after tests and compare-and-swap revision checks. No new Space is required.
