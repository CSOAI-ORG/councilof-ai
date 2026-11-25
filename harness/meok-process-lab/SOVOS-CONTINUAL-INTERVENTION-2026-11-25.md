# SOVOS continual adaptation and latent intervention — 25 November 2026

## Scope and exact replay
Extends merged #4865 and #4863, retains the frozen 324-coefficient candidate (SHA256 d4567ac50bfea446b992ba6c6a9cf81bf9cbb40c1c8c316344081dd90dc13594), the same three trained MEOK neural members, and the existing pinned SovSpace procurement oracle. No neural weight update, independent external reviewer, live authority, new GSPC score, or production model change.

Source precommitted at d369c5fc0336402aeb3467d7365dc8dd771b9a42; script SHA256 7e17b10d6cb12307d23a7d92964a81f18e53d444b7f703f0e09d0d695e937007. 3,072 generated training rows (1,024 nominal unused in adaptation; 1,024 each small and large used), 2,304 calibration rows, 4,608 test rows, disjoint scenario seeds, no reuse of previous test IDs. Original 1,600 training rows are retained as earlier experience. Two sequential adaptation stages: small then large. Frozen latent feature extractor throughout. Replay uses a fixed 256-row sample from original train at stage one and a further fixed 256-row sample from small train at stage two. This is row sampling, not an optimal memory selector or episode-preserving buffer. Anchored ridge uses a penalty towards the prior anchored head. All candidates fixed before new test generation.

Mac via Desktop Commander and HF CPU job https://huggingface.co/jobs/csoai/6b065e2e1460ffe1d5e9b5dd completed. HF job 180s timeout, actual elapsed 12.2s, charge not returned. All 471 numerical fields agree within 5.31e-14 maximum absolute difference, excluding environment version string; all other fields match. Same generated bank SHA256 values:
- train: 8b63d83d96d319e4ce0cc120e2569244e76a90816e9747451fffd47456b4efd7
- calibration: 254cf75adca2a53e4c0858240548227ac88ca59ca41372525e2cbfe55de47308
- test: 1bfb9ac1b9e298dae2821869b4080a1874c018e663032504f62d204c42b631c6

## Continual-learning comparison, final stage
| policy | nominal MAE | small MAE | large MAE |
|---|---:|---:|---:|
| frozen | .01346137 | .02709136 | .01032031 |
| latest-only | .01235526 | .02838201 | .00891185 |
| bounded replay | .01304413 | .02501636 | .00980248 |
| anchored | .01283134 | .02755097 | .00929656 |
| full history | .01375177 | .02488516 | .01063943 |

First-stage small-only fit improved small MAE but degraded nominal and large substantially. This is forgetting in an adapted linear readout, not catastrophic forgetting of all neural weights. Replay final-stage mean error beats frozen in each domain, but worst errors change nominal .533446 -> .535075, small .690097 -> .769510, large .369628 -> .351024. No safe promotion under a no-worst-regression condition. Full-history fit is not uniformly best under domain weighting and constrained outputs. No new head exported as selected; retain all results and evaluate a separate episode-aware replay policy with fresh seeds next.

## Internal latent interventions
Mean replacement and shuffled-row substitution of each of three member blocks raised average error in every cohort. Nominal original .01346, mean replacement .03984/.02899/.02581, shuffled .04177/.03768/.03305. These are controlled interventions on the readout inputs showing reliance on each member block; possible out-of-distribution activations; do not establish meaningful individual neural features or human-like reasoning.

Matched simulator intervention forecasting: compare evidence-aware minus baseline for the same seed and tick. Teacher-forced preceding observed states can convey the intervention effect; not a blind forward prediction or real-world causal claim. Effect MAE .01193 nominal/.01727 small/.01097 large versus zero-effect control .05567/.04100/.05750. False change (> .05 max component) on true zero-effect steps 7.98%/20.32%/7.13%; particularly poor small-domain reaction specificity.

## Venturi fidelity and uncertainty
For each cohort 1,536 rows: FP32 491,520 bytes; FP16 245,760; INT8 122,904; packed INT4 61,464 (payload only, including quantizer scales). This time measure the actual FUSED head after the codec. FP16 max output change <= .000236 across cohorts. INT8 max change reaches .064595 in small regime; INT4 reaches .327502 and raises all mean errors. Mean MAE alone would conceal this. Keep FP16 as a research candidate for derived activation memory, exact source and authority records lossless. No operational cache modified.

Disagreement between native ensemble members is a poor confidence guarantee: at a threshold set at the median calibration disagreement, coverage on active small cases .3741, MAE .06493 vs full active .05038; even nominal retains worst error .53345. Do not infer safety from agreement; use validated per-domain selective prediction and explicit UNKNOWN. All expiry/simplex, source, split and frozen-candidate controls passed.

## Integration handoff
Reuse existing Venturi cache revision binding, evidence-fabric and SovSpace reaction bridge; store derived candidate/transform/observation references not raw private tensors. SOVOS orchestration does not grant execution. GSPC independent instrument must retain unseen banks and separate qualification, including negative controls, tail errors, calibration and domain shifts. H.I.M. can review these research results only; no panel convened. No competing deployment, model registry, signer or dataset warehouse. Next: episode-aware bounded replay and worst-domain objective, paired closed-loop interventions, feature-level patching, and actual cross-family open-weight model activations. Do not reuse this test bank for training or tuning.
