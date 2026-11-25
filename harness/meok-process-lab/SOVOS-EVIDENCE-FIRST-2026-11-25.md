# SOVOS evidence-first neural integration — 25 Nov 2026

## Research scope
This extends existing MEOK process-world, two-path Council, Venturi and reaction-bridge lanes. Not a foundation model, production authority, new GSPC measurement, biological mind or proof of general reasoning. Original models, dataset and source pins are in sovos_neural_stitch.py. Source experiment commit e9b1df2b303e7bdbe730e4af39e87456baf37ba9, SHA256 357bf7bdbe13aa917e63ff74d8e0225e3f898c1a8de1a4c41caa1aa844fbd60a. Three trained neural members, final latent widths 16/32/32. The data is MIT-licensed synthetic deterministic procurement episodes, not people or actual transactions. Train 1,600, validation 400, test 560; episode-disjoint. Test is already public, not a new blind test.

## Executed results
- Desktop Commander M2: exact source, NumPy 2.4.6, all controls passed.
- HF CPU job csoai/6b065a4fd0582cfbbefd9045 completed 03:47:37 UTC. NumPy 2.2.6, 180-second cap, no secrets, actual billed cost not returned. All result details retained in sovos-neural-stitch-hf-20261125.json. Mac and HF agree to floating-point precision on reported metrics.
- Kaggle private CPU kernel nicktempleman/sovos-neural-stitch-20261125 version 1 submitted using identical source; running at initial observation. No public notebook or dataset publication inferred.
- A new ridge readout (81 x 4 coefficients, 324 learned coefficients including bias; lambda .1) was fitted only on original train activations, then exported in sovos-fused-readout-candidate-20261125.json. No neural member weights updated. SHA256 d4567ac50bfea446b992ba6c6a9cf81bf9cbb40c1c8c316344081dd90dc13594, 5,222 bytes. Replayed after reloading, 7/7 rejection controls. First export rejected a legitimate control value of 9/8; corrected to the discrete training-domain expiry/tick lattice; negative controls retained. No final evaluation set selected or optimizer tuning performed on test.

| Variant | validation MAE | published test MAE | test worst |
|---|---:|---:|---:|
| persistence | .0552714 | .0613514 | 1.0 |
| raw-input ridge | .0249160 | .0290911 | .4958130 |
| existing ensemble | .0150929 | .0188549 | .5234665 |
| fused latent ridge | .0109420 | .0141346 | .4267264 |

25.0% relative MAE reduction on published test. Active (unexpired) test MAE .0309641 -> .0232122, 341 rows. Worst error remains material. The original deterministic simulator is the authoritative reference in this domain. Validation worst error increased slightly (.3595582 -> .3696280); do not claim uniform improvement. All six directional linear stitches outperform shuffled pair controls in MAE and output match to target head; not all beat the native target member. No universal cross-family language-model alignment.

| Last hidden layer memory, all three members, 560 test rows | payload bytes | zlib payload bytes | MAE | max output delta vs baseline |
|---|---:|---:|---:|---:|
| FP64 raw reference | 358400 | not measured | .018854919 | 0 |
| FP32 | 179200 | 65073 | .018854919 | 0.000000018 |
| FP16 | 89600 | 36444 | .018854043 | .000138225 |
| INT8 | 44824 | 18116 | .018907664 | .008232100 |
| packed INT4 | 22424 | 4925 | .026625924 | .127116815 |

Training-calibrated per-member scale included in INT8/INT4 bytes; excluded generic indexing/shape/retention overhead, model weights and compute. Measured original ensemble head after activation codec, not fused head. Compared with FP32, INT8 nearly 4x and INT4 nearly 8x smaller pre-zlib; lossless zlib on the already quantized payload does not restore lost precision. INT4 harmful here. No infinite storage; entropy bound, collisions, numerical loss and provenance remain. FP16 is best fidelity/capacity compromise here, INT8 conditional candidate. Never compress mandatory authority records lossily.

## SOVOS integration architecture (proposal, not operational)
Horizontal = families, languages, specialist processes and tasks, each with separate typed interface, lineage, licences and trust scope. Vertical = layers, tokens, hidden states, intermediate plans, source/method/effect checks and action states. Time = event time and recording time, causal edges, correction/revocation and replay. Geometry is a revisioned projection of high-dimensional data; axes and angles are not intrinsic reasoning semantics. Use anchors, Procrustes, CKA and causal interventions; 3D PCA projection needs distortion and neighbourhood checks. Existing JSpaceTimeline is logarithmic display with 100-year clamp and not unbounded storage. SovSpace represents possible state trajectories and bounded rehearsals; J/C-space display judgement and actions; existing evidence-fabric and Layer 0 establish actual source/authority/effect boundaries. Do not make Unreal Engine or a canvas the authoritative database. UE5 Large World Coordinates, World Partition/Data Layers and HLOD are candidate visual paging only; use current UI first.

Venturi should hold derived representations keyed by model/layer/token/input/runtime/transform/method/source revision/consent, with expiry, invalidation and exact payload digest. Separate immutable released snapshots from mutable working pointers and caches; corrections append edges, never silently overwrite evidence. Chunked content-addressed storage, Parquet/Arrow for typed tables, tensor/array chunks in versioned object storage, HNSW-like search as derivative, multiresolution aggregation for visual navigation. Enforce access, deletion/retention and rights; preserve signed byte originals. Compare lossless dedup and compression before lossy codecs. Cross-domain data use provenance and explicit alignment, not indiscriminate joins. Same-base MergeKit merges compatible weights; incompatible widths/tokenizers require trained bridges, distillation or routing. Model stitching tests internal compatibility; task-vector arithmetic is not generally a safe cross-architecture operation. RAS requests do not supply training consent.

Frozen -> fluid -> frozen: retain admitted snapshot; replay new incidents in SovSpace; train candidate readout/adapter on authorized training data, compare untouched blinded GSPC task families and independent effect checks, publish qualified source/evidence and switch pointer only after review. Fluid -> frozen: capture exact source, inputs, version, result, uncertainty, timing and correction references. Train on approved examples, never hidden tests or unqualified decisions. Prior 12/33 council common-mode/referee experiments #4863 support proposal separation; 3 distinct source/method/effect requirements are conjunction, not 3 noisy votes. BFT remains NOT_DEMONSTRATED; existing Layer-0 holds retained.

## Research sources and next tests
- Model stitching, NeurIPS 2021: https://proceedings.neurips.cc/paper_files/paper/2021/hash/01ded4259d101feb739b06c399e9cd9c-Abstract.html
- Activation patching methodology and cautions: https://arxiv.org/abs/2404.15255
- Mechanistic interpretability feature extraction: https://tsglab.github.io/mechinterp-safety/handbook/feature-extraction/
- UE5 world partition and data layers: https://dev.epicgames.com/documentation/en-us/unreal-engine/world-partition-data-layers-in-unreal-engine
- NVIDIA CPO: https://www.nvidia.com/en-gb/networking/products/silicon-photonics/ — optical transport/power at distributed scale, not proof of improved model reasoning or unlimited capacity. CPU for orchestration/small numerical workloads, GPU for batched tensor/LLM work; instrument time, bytes moved, throughput, energy and costs. No hardware purchased.

Next: genuinely new deterministic simulator episodes, pre-registered candidate and separate oracle (no published bank tuning); fresh regime shifts, adversarial/revocation counterfactuals, compression of fused head, per-layer activation patches/ablations, shuffled anchors, cross-family open-weight checkpoints, dataset mixture versus routing versus distillation, blind Council variants at matched inference budget, calibration/uncertainty, held-out failure/safety tests via GSPC instrument guard. Use current #4764 reaction bridge, #4703 reciprocal contract, #4704 release parity, #4863 two-path research. No new production signer, scheduler, database, model default, or external authority. Real human grant -> qualified executor -> independent observer -> receiving-party acceptance remains unestablished.
