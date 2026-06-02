# SIGIL benchmark — 2026-06-02

Tokenizer: **tiktoken/o200k_base (real BPE)** · module: `meok_one/sigil.py` (live, incl. F/D multimodal).

| Corpus | n | English tok | JSON tok | SIGIL tok | vs JSON | vs English |
|---|--:|--:|--:|--:|--:|--:|
| Agent decisions (text) | 8 | 164 | 202 | 121 | **1.67× / −40%** | **1.36× / −26%** |
| Multimodal (vision F/D) | 4 | 148 | 132 | 95 | **1.39× / −28%** | **1.56× / −36%** |
| OVERALL | 12 | 312 | 334 | 216 | **1.55× / −35%** | **1.44× / −31%** |

- **Round-trip lossless:** 12/12 lines `encode(parse(x))==x` ✓
- **Throughput:** 24,000 full encode→parse→gloss cycles in 5.357s = **4,480 ops/sec** (pure stdlib, single thread)

**Honest read:** SIGIL is denser than JSON and far denser than English for both agent decisions and the multimodal *semantic* layer. The multimodal win is real but specific: SIGIL compresses the vision model's STRUCTURED OUTPUT (scene/objects/bbox), not raw pixels — agents pass the SIGIL summary instead of re-describing the frame. Every saved token is saved on EVERY agent hop, and the line stays glossable + hash-chained for audit.
