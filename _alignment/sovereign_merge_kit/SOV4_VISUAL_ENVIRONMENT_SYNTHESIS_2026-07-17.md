# SOV4 Visual + Environment Synthesis — grounded research + recipe (2026-07-17)
_Every external fact below is from a live web_search this session (dated sources). Every SOV-internal fact is read from disk. Assumptions flagged._

## The headline: you don't build most of this — it already exists (principle B: BANK THE LAST)

### 1. "Convert an OWEM to a VLM" — you ALREADY HAVE VLMs in the stack
The MEOK_SOV3 profile already names the vision brains: **moondream+zamba (MoM)** and **qwen-vl**. Don't convert a text model — WIRE the vision OWEM you already have. Grounded current options for small GPU:
- **Moondream 2 (1.9B)** — runs in ~2GB VRAM, the only practical VLM at that floor; limited on complex scenes. (Ollama, offline.)
- **Qwen3-VL 8B** — strongest open VLM on document benchmarks 2026; dynamic resolution to 4096×4096 (reads high-DPI scans); 8B competitive with Llama-3.2-Vision-11B at lower VRAM.
- **Gemma 3 4B** — multimodal, fits 8GB Q4, best small multimodal + 140 languages.
HONEST: pick ONE as the vision-OWEM, route to it for image/screenshot/chart/document tasks. It's a routed brain in the fleet, same pattern as the compliance charter-student — not a new architecture.

### 2. "SIGIL through visuals is faster" — REAL, and this is the genuine find
**DeepSeek-OCR (published, benchmarked): compresses visual context up to 20× while keeping 97% OCR accuracy below 10× compression.** ~2,500 tok/s on one A100 via vLLM. Dual-component: lightweight DeepEncoder + DeepSeek-3B-MoE-A570M decoder.
THIS is the honest mechanism behind your "sigil compression via visuals" instinct: rendering dense text/data as an image and letting a vision encoder compress it into far fewer tokens IS a real token-compression path — for DOCUMENT/DATA ingestion specifically. It does layout, tables, charts, even chemical formulae→SMILES.
HONEST BOUNDARY: this compresses INPUT tokens for ingestion; it does not make the model "think faster" and it's lossy on fine symbolic detail above 10× (97% is below 10×). Right tool for mass-document scanning, not for precise legal-citation reasoning (text wins there — principle F, measured pattern).

### 3. "Bridge UE5 worlds through MCP" — SHIPPING, first-party + community (don't build it)
- **UE 5.8 ships a FIRST-PARTY MCP server** (Experimental), embedded in the Editor, binds to http://127.0.0.1:8000/mcp. ANY MCP agent (Claude Code, Cursor, Gemini, Codex) drives it: spawn actors, lighting, materials, run tests. Identifier `ModelContextProtocol`; server name `unreal-mcp`. Caveat (Epic's own docs): experimental, incomplete, NO auth layer, calls run serially on the game thread.
- **Community (MIT, mature):** Monolith (UE5.7+, 1,125 actions / 15 modules, zero-Python C++ proxy); mcp-unreal (Go binary, 49 tools, Remote Control API port 30010); ivanmurzak/unreal-mcp (62 tools, 8 families, C++ plugin + .NET sidecar, screenshot/pixel-capture tools).
SO: SOV33 governs a UE5 world through the EXISTING MCP seam — exactly the settled architecture ("SOV33 doesn't live inside UE5, it GOVERNS it through one MCP contract"). You wire SOV's Layer-0 as an MCP client to the UE5 MCP server. No engine to build.

## The environment answer: SYNTHESIZE, don't build new
You asked: "build a new environment or synthesize existing into a hybrid sandbox hive?"
HONEST ANSWER — synthesize. Every piece exists:
- **Render/world layer** = UE5 5.8 + its MCP server (first-party) or Cesium 3D for geo. Free until $1M revenue.
- **Governed seam** = MCP (the same protocol Layer-0 already tunnels). SOV is an MCP client to UE5's MCP server.
- **Vision layer** = the VLM-OWEM (Moondream/Qwen3-VL) via Ollama, offline, small GPU.
- **Compression** = DeepSeek-OCR for mass-document→few-token ingestion.
- **Substrate** = Layer-0 (identity/care-floor/SIGIL/PBFT) — the soil all of it roots in.
Building a NEW engine/environment = the scope-inflation trap we've refused all along. The hybrid "hive" is a WIRING of these, governed by Layer-0, not a new sandbox.

## Honest architecture (the whole stack, one picture)
```
END USER speaks
   │
   ▼
Layer-0 substrate (soil): identity + care-floor 0.35 + SIGIL + PBFT   ← constant
   │
   ▼
Venturi/router → picks the OWEM per task (FLUID):
   • compliance  → charter-student adapter (+ live RAG, currency-stamped)
   • defense     → injection/toxicity detectors (measured 0.977/0.871)
   • vision      → Moondream/Qwen3-VL (image/chart/screenshot/document)
   • frontier    → federation API (DeepSeek/Kimi/GLM/Inkling) when funded
   │
   ▼
UE5/Cesium world (VIEW, via MCP): human walks the memory map; NOT compute-speed
   │
   ▼
answer → care-gate → SIGIL sign → currency stamp (as-of) → TLM memory → forest
```

## Honest boundaries (keep these out of investor copy)
- Visuals = HUMAN comprehension bandwidth. They do NOT make machine scanning faster; the index (RAG/kNN) does.
- "Each OWEM its own world, all connect to one" = topology (federation mesh over one Layer-0 root). Real as architecture; the SCALING is gated on actually having the GPUs.
- DeepSeek-OCR 20× is INPUT-token compression for documents, lossy >10×, not "thinking faster".
- UE5 MCP is Experimental + no auth — a governed deployment must put SOV's care-gate IN FRONT of it, never expose it raw.

## Recipe: wire the visual OWEM (when a GPU is available)
1. `ollama pull qwen3-vl:8b` (or `moondream` for 2GB floor)
2. Register as vision-OWEM in the router: DESC="image, chart, screenshot, document, diagram, visual, scan"
3. Route image-bearing queries to it; answer → care-gate → SIGIL → currency-stamp (same governed path)
4. For mass documents: DeepSeek-OCR front-end → compressed tokens → the reasoning brain
5. For the world view: SOV Layer-0 as MCP client → UE5 5.8 MCP server (localhost:8000/mcp), care-gate every tool call
