# Coverage, re-measured

Two reachability numbers the estate quotes, both re-run 2026-09-06 with the prior
figure beside them. Every row has the command under it.

## HF router

    curl -sL https://router.huggingface.co/v1/models      # 200, no token needed

The model list is readable anonymously — the token gates inference, not discovery.

| measured | advertised entries | top 60 of the queue | top 100 | all 947 text-generation |
|---|---:|---:|---:|---:|
| earlier (recorded in memory) | — | **13 of 60** | — | — |
| **2026-09-06** | **138** | **15 of 60 (25.0%)** | 20 of 100 (20.0%) | **92 of 947 (9.7%)** |

Reachability is up two models at the head and is still under 10% across the queue.

### The number that changed the conclusion

Every advertised entry names at least one provider, and every provider record reads
`status: live` — 326 of 326. So nothing is dark. But:

    models with a provider marked is_free:   0 of 138

**Not one router model is free.** Router coverage is no longer only endpoint-bound; it
is paid-only. With HF credits depleted, the router path is closed whatever the token
says, and that is the reason the pod GGUF path carries the mill rather than
supplementing it.

Providers behind the 138: deepinfra 69, featherless-ai 67, novita 65, zai-org 21,
together 18, nscale 17, fireworks-ai 16, baseten 13.

## Pod GGUF reachable set

    947 text-generation rows of the 2,773-row hub queue, each probed for an
    EXACT-NAME GGUF mirror (a loose "any gguf hit" rule overcounts by ~60%)

| measured | text-generation | exact-name GGUF | resolves a usable quant tag |
|---|---:|---:|---:|
| 2026-09-06 (first pass) | 947 | **575 (60.7%)** | 528 |
| **2026-09-06 (after the quant fixes)** | 947 | 575 (60.7%) | **532** |

The set did not move; the usable count did. Three defects in the tag resolver were
found by pulling rather than by reading — a case-blind preference that picked `fp16`
over `q2_k`, a split-file suffix parsed as the tag `00002`, and a rate limit reported as
"this repo publishes no quantisation". Fixed in PR #1577; an accept-list first attempt
cost 227 of 528 models and was replaced by a reject list ("not a shard index").

    UNCHECKABLE after the fixes: 0 of 575

## What each number is not

- **9.7%** is router coverage of the queue, not board coverage. A model the router
  advertises has no cell until a card exists for it.
- **60.7%** is GGUF availability, not cards. A GGUF that pulls is a model that can be
  graded, and PR #1549 records that a pod card does not clear the queue cell it was run
  for — that is an open ruling, not an achieved number.
- Neither figure may be added to the other. They are two routes to the same queue.
