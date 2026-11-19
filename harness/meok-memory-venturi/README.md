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

## 12 November: consume the targeted-invalidation repair

The r49 research lane reproduced two cases where a matching explicit impact during computation or cached-result validation did not stop the old result from returning. This change consumes that exact qualified cache candidate (SHA256 fee33861233dec6b7e89dbbf91582c0016c9538dd257f796ab9cef493fe1bebc) rather than creating a second cache. Its 12 targeted regressions and all34 existing source tests remain; seven added adoption checks exercise a bounded diagnostic in the existing research tool.

The library now retains per-tenant/source impact generations, captures them with the request and rechecks before reuse/retention. Matching complete impact increments the generation even when no result row has yet been stored. Unrelated sources and tenants preserve reuse. Existing truncated-coverage flushing and host access/source checks remain. This is not atomic cross-service revocation after the final recheck. Source-generation metadata needs an owner-approved retention policy before durable production use.

`memory_rehearsal` adds `targeted_invalidation`: five actual installed-library controls with a pinned cache-code digest, no model calls or private inputs. The existing trained-process replay remains unchanged. The research cache still uses an isolated temporary directory removed after each call; no existing user database or saved copy is migrated.

Run `python -B qualify_adoption.py` for a fresh53-method qualification and an old-source negative control. It does not copy earlier PASS files into the test directory. The exact old cache fails the intended fresh-result assertion; the candidate passes. HF composed qualification and deployed readback must be recorded separately. No new model training, speedup, GSPC admission, reviewer appointment or real-user memory-authority integration is inferred.
