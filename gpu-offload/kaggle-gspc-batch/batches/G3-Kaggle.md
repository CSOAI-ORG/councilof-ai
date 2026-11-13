# G3-Kaggle batch: NAMED ONLY. Nothing has run. No spend, no push. (Measure, 16 Oct 2026)

Label: **GSPC-G3-Kaggle**. This is a separate comparison group, because G2 is locked to the RTX PRO 4500 GPU type (G2-manifest.json `group_lock`). G3 cells can't be paired or tied with G2 cells. A run on T4 and a run on P100 are two different groups too, so pick one GPU type for the whole batch.

## Models (16): all are new to GSPC
Excluded: the 8 G2 models (mistral:7b, deepseek-r1:8b, gemma3:12b, qwen2.5:3b, llama3.2:3b, qwen2.5:0.5b, qwen3:8b, qwen2.5:7b), all 31 G2-live cards, and every B1014 newmodels/models.tsv entry (LFM2.5, Ternary Bonsai 2, MiMo, DeepSeek V4.1, and the closed models).
Digest = sha256 of the manifest bytes fetched from registry.ollama.ai on 16 Oct at about 03:45 BST. This is the same rule G2 uses: I re-fetched qwen3:8b and got 500a1f06…, which matches G2-manifest.json. The raw manifests are in `manifests/`. I left out gemma4:latest because it's a moving alias, and qwen3.6/phi5/smollm3 returned 404.
Release dates were not verified. These tags are new to GSPC, not necessarily newly released.

| tag | manifest sha256 | GB | fits | est GPU-h |
|---|---|---|---|---|
| ollama:gemma4:12b | `6114515d63c17436a7c0417d82820ac65ad643e2806c5a3c89cb62846436ed0b` | 8.02 | P100 or 2xT4 | 0.8 |
| ollama:gemma3n:e4b | `0a377808afeaafcbf5dcc2b1844594a1b60a50cd18e7e3e469cfd64e7bb7faa5` | 9.77 | P100 or 2xT4 | 0.8 |
| ollama:qwen3.5:9b | `56671c2ab9385f9cfcb404638e32cd62d88e3501d44822208363c010179a3c90` | 6.55 | P100 or 2xT4 | 0.5 |
| ollama:qwen3.5:4b | `d8b0f5e9760cd1682034f292d7ef72ec46f432149be0df7574bf2d6e92e38c04` | 3.32 | P100 or 2xT4 | 0.3 |
| ollama:qwen3:14b | `bdbd181c33f2ed1b31c972991882db3cf4d192569092138a7d29e973cd9debe8` | 9.28 | P100 or 2xT4 | 0.8 |
| ollama:qwen3:4b | `359d7dd4bcdab3d86b87d73ac27966f4dbb9f5efdfcc75d34a8764a09474fae7` | 2.5 | P100 or 2xT4 | 0.3 |
| ollama:ministral-3:14b | `4760c35aeb9d9e9c6174c2492562c0b999e80a222804fd96b1915ab72bbcdcf7` | 9.08 | P100 or 2xT4 | 0.8 |
| ollama:ministral-3:8b | `1922accd5827ebe6829e536369195db25eaf664528dc66206d646ea3bb386b71` | 6.02 | P100 or 2xT4 | 0.5 |
| ollama:phi4:14b | `ac896e5b8b34a1f4efa7b14d7520725140d5512484457fab45d2a4ea14c69dba` | 9.05 | P100 or 2xT4 | 0.8 |
| ollama:phi4-mini:3.8b | `78fad5d182a7c33065e153a5f8ba210754207ba9d91973f57dffa7f487363753` | 2.49 | P100 or 2xT4 | 0.3 |
| ollama:granite4:tiny-h | `566b725534ea0e9824f844abe6a78e1ab6f7357f1efb549be94908cb681513bb` | 4.23 | P100 or 2xT4 | 0.5 |
| ollama:olmo-3:7b | `b8d4c92ac9c103f858f4f09a418b62de8ca1abf1b20b4020006346535634dd35` | 4.47 | P100 or 2xT4 | 0.5 |
| ollama:glm4:9b | `5b699761eca535dc55047ad9d2dbf54e3b8697709419ef78a70503ed4bfbcf44` | 5.46 | P100 or 2xT4 | 0.5 |
| ollama:mistral-small3.2:24b | `5a408ab55df5c1b5cf46533c368813b30bf9e4d8fc39263bf2a3338cfa3b895b` | 15.18 | 2xT4 only | 1.5 |
| ollama:llama3.1:8b | `46e0c10c039e019119339687c3c1757cc81b9da49709a3b3924863ba87ca666e` | 4.92 | P100 or 2xT4 | 0.5 |
| ollama:deepseek-r1:14b | `c333b7232bdb521236694ffbb5f5a6b11cc45d98e9142c73123b670fca400b09` | 8.99 | P100 or 2xT4 | 1.5 |

## Axes and banks (frozen G2, from /workspace/g2-247/kit/run_g2_loop.py.disabled BANK_SHA, matching banks/SHA256SUMS)
| axis | bank | sha256 |
|---|---|---|
| governance | gspc-gov.jsonl | b93f9808f01416737a5944fec0ab8c3eda1dbba808daf7dda33a516b0cd61997 |
| safety | gspc-agi.jsonl | f963e3c739c7d75bf4750d3638f2b9aad7a161f8043f8e353224d29af17718d5 |
| provenance | gspc-prv.jsonl | 5da9b25954ec575b1e86bca8306bd0cd6758161428717d60ac648dc52c8317d2 |
| continuity | gspc-asi.jsonl | 25dd6a72ac5ad661c33d74a72da54ab9ac7d282de9d388085de20161b1f90b20 |
| conformance | gspc-mcp.jsonl | dc494ae6d1cb8abe3fe9a9424a2b37631a3d15ebdde000b7a0409a67c757420f |
| openness | gspc-oss.jsonl | 644dc6de897896a88e90b8954abfa08d49b0e774f6270f30a9bf28b0831179ec |
| care | gspc-care.jsonl | cee5e47a31f1db6c117a0b2f4a4c026f9ebe267c28106e4901ea44189de1767e |
det (gspc-det.jsonl, d75e9680…) is EXCLUDED because det cells aren't citable. Affect is not a G2 axis.

## Method and gate (unchanged from G2)
Worker runpod_gspc_worker_serial.py sha ea59a9de4cb92b80910a4efddc7ab592c4d0bd2dc2a184eec811183f6b584491; exact-label max_tokens 128 / keyword 1024; timeout 225s; NUM_PARALLEL=1, max_loaded_models=1; T=0, seed 0, num_ctx 3072, think=false. G2 used ollama 0.35.0, so pin the same version.
Gate: n_valid >= 30; (unparsed + truncated) / attempted <= 10%; transport <= 5%; correct != 0 and correct != n_valid (otherwise HOLD). An incomplete run restarts from item 1. The first passing run is the run of record. Results are unsigned until intake.

## Budget
G2 timings, measured from the cycle runtime.json files (RTX PRO 4500, full 7 axes per model): 40–126 s for 0.5–12B models, 214 s for mistral:7b, and 703 s for deepseek-r1:8b. For T4/P100 I assumed roughly 4–6x slower, plus about 10 minutes per model to pull and load. That gives 0.3 h for under 4 GB, 0.5 h for under 7 GB, 0.8 h for under 10 GB, and 1.5 h for 24B or deepseek-r1. **Total is about 10.9 GPU-hours out of 30 per week.** These are estimates, not measured on T4. mistral-small3.2:24b (15.2 GB) needs 2xT4 split or offload and won't fit a P100 with ctx 3072.

## Hosted frontier via Kaggle Benchmarks: my ruling
Not eligible for G2/G3 cards. There's no pinned weights digest, the hosted model is not open-weight, and the serving runtime and settings aren't attestable. Results could at most be an unsigned, separately labelled hosted-API lane like B1014 or-paid, never cards under this method.
