# Odysseus memory layer vs SOV3 — what to lift
*2026-06-03 — Step 1. Source: github.com/pewdiepie-archdaemon/odysseus (MIT) read directly, not paraphrased.*

## The two architectures, side by side

| Dimension | **Odysseus** | **SOV3 (current)** |
|---|---|---|
| Vector store | ChromaDB (cosine, HNSW), **precomputed embeddings** fed in | ChromaDB (`jarvis_vector.py`) **+** pgvector elsewhere — Chroma manages its own embeddings (default model) |
| Embeddings | **Decoupled `EmbeddingClient`**: HTTP API (Ollama/vLLM/llama.cpp) → **fastembed ONNX (~50MB) zero-config fallback**; shared between RAG + memory | Mixed / implicit; Chroma default model; no single shared client; fastembed not used |
| Add/remove | O(1) `collection.add/delete` by id; dedup-on-add (`get(ids=)` first) | `add_documents` bulk; less explicit dedup |
| Memory model | `memory_extractor.py` (LLM extracts memories from convos) + `skills.py` (skills that evolve) | **FSRS spaced-repetition decay** (`memory_fsrs.py`, 15 refs) + graphrag + consolidation — *more* sophisticated decay/recall |
| Resilience | Fast-fail (3s connect) to local fallback so a down embedder doesn't stall startup | Less defensive; ChromaDB import-guarded but embedder not |
| Footprint | One clean `services/memory/` module set | **12+ overlapping memory modules** (jarvis_memory, graphrag, fsrs, hub, subconscious, letta, consolidation v2…) |

## Verdict: you're *ahead* on cognition, *behind* on plumbing
SOV3's memory **science** is more advanced — FSRS decay, graphrag, consolidation, care-weighting. That's real moat; Odysseus has none of it. **Don't fork Odysseus.** But its **plumbing is cleaner** in exactly the two places SOV3 has fought:

### Lift #1 — the decoupled `EmbeddingClient` (highest value)
Odysseus's `src/embeddings.py` pattern: one client, **HTTP embedding API first (Ollama/vLLM) → fastembed ONNX fallback**, shared by RAG *and* memory, with a 3s fast-fail so a down embedder degrades instead of hanging. SOV3 currently leans on Chroma's default embedder and has no shared, swappable client. **Port this**: a single `sov3_embeddings.py` that all 12 memory modules call. Benefits: sovereignty (local-first embeddings = on-brand for the SEAL story), one place to swap models, no startup stalls.

### Lift #2 — consolidate the 12 memory modules behind one store interface
Odysseus has *one* `MemoryVectorStore` with `add/remove/search/count`. SOV3 has a dozen modules that overlap. Adopt Odysseus's **single store interface** (precomputed embeddings in, O(1) id-based add/remove, dedup-on-add) as the bottom layer, and keep SOV3's FSRS/graphrag/consolidation as *layers on top* of it. This kills the sprawl without losing the science.

### Lift #3 — the security note (free, do now)
Odysseus's own `SECURITY.md`: keep ChromaDB/SearXNG/Ollama/vLLM/DBs **internal-only**, expose only the authenticated entrypoint via a trusted proxy. You run SOV3 over Cloudflare/Tailscale — confirm the vector store + Ollama aren't reachable beyond localhost (you already token-gated the SOV3 MCP; do the same audit for the embedder/Chroma ports).

## Concrete next step (if you want it)
A small `sov3_embeddings.py` (Odysseus `EmbeddingClient` pattern, ~80 lines) + repoint `jarvis_vector.py` to feed it precomputed vectors. That's the one lift with real payoff (sovereign local embeddings + no stalls + a single swap point) — and it leaves SOV3's FSRS/graphrag edge intact. **One module, not a fork.**
