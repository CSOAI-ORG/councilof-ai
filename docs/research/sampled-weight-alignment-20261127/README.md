# Sampled open-weight alignment — 27 November 2026
Status: unsigned exploratory research, not an admitted GSPC measurement or lineage verdict. One CSOAI-operated Mac executed the larger study; the second Mac was offline. Earlier narrower three-checkpoint study was reproduced across both Macs, not independent external replication.

## Method
Plan frozen before retrieval; exact revisions and tensor names in plan.json. Source-declared licences Apache-2.0; these artifacts contain derived measurements and byte digests, not raw weights or copied model card text. HTTP 206 and exact Content-Range, 1 MiB header cap, matching shapes, fixed contiguous 4,096-element slices and repeated first-slice read per model. Four layers and three tensor types. Two declared parent pairs, self comparison, cross-generation pairs and incompatible-shape control. 99 seeded permutations per comparable slice are synthetic alignment controls, not an empirical unrelated-model null.

## Observations
245,760 weight values, 589,824 selected weight bytes excluding headers/repeats. 60 slices across five checkpoints. Mean cosine self 1; SmolLM2 parent/descendant .9974008145; SmolLM parent/descendant .9977751383; cross-generation base .0058074722; cross-generation Instruct .0059758683. All 12 incompatible-shape comparisons were not comparable. No full-model inference, calibrated lineage detector, independence claim or population error rate.

## Reproduce
Copy plan.json and experiment.py into a NEW empty directory and run python3 experiment.py there. Network reads only, no full weight download or model execution. Preserve the original report with its own observation timestamp. Compare SHA256 of sorted compact JSON of models and comparisons (excluding timestamp) to f0f8c4207473f80f9464b6b76a51b43b6c56bca086729920f78d55b3a967b1d1. Retrieval failure is uncheckable. Sample hashes are not full checkpoint digests.

Existing Venturi capsule 429b6362bc312dec2dbf4083f2ef1662a57d8a335a7a3049011ac14fd156cef3 passed local RFC8785 comparison. Existing reaction bridge returned ACCEPTANCE_INCOMPLETE: human approval, executor authority/response, effect and receiver verification unknown. No new schema admission, GSPC promotion, authority, payment or external acceptance.

## Reuse
Candidate statistical profile for external provenance review, not Red Hat affiliation. Harness: incompatible shape and mutation controls. Academy: distinguish alignment from lineage and signatures from permission. Claim Maintenance: reread pinned sources without rewriting history. GSPC: held-out model families and qualified independent controls before admission. RAS: no paid delivery claim. Adjacent research only; no production changes.
