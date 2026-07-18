# SOV33 OWEM — leading-edge consolidation (deep research, 2026-07-12)
_What the market already solved (reuse, don't rebuild) vs the ONE axis SOV33 is differentiated on.
Every claim below is from a dated 2026 source found this session; verify links before external use._

## FINDING 1 — the companion SHELL is commoditized. Do NOT rebuild it.
The open-source AI-companion space is mature as of 2026. Multiple projects already ship the ENTIRE
visual/UX/voice layer the MEOK blueprint specified:
- **Amica** — open VRM companion, emotional expressions, any-LLM backend (the blueprint's reference).
- **Utsuwa / Aikeya** (Svelte + Tauri) — VRM avatars, desktop OVERLAY with transparent always-on-top orb,
  draggable, global hotkeys, semantic memory (Transformers.js), **MCP tool calling**, BYO-key, 8-stage
  relationship tracking, WebXR "place her on your floor". Apache/MIT.
- **Open-LLM-VTuber** — fully offline, Live2D, desktop-pet transparent mode, visual perception, barge-in.
- **AvatarAI (PunithVT)** — photoreal lip-sync (MuseTalk), Whisper→LLM→Chatterbox→lip-sync, <2-4s, MIT.
- Building blocks named across all: **@pixiv/three-vrm** (VRM in Three.js), VRoid (avatar creation),
  Whisper (STT), Piper/Kokoro/Chatterbox (TTS), Ollama/LM Studio (local model), Tauri (desktop overlay).
**Implication:** the "visual layer we lack" is NOT a gap — it's a fork-and-wire. Adopt Utsuwa/Amica as the
shell; point it at SOV33 as the governed brain. Rebuilding it is months of wasted work on a solved problem.

## FINDING 2 — cross-platform MEMORY is a hot, crowded market. SOV33's edge is a SPECIFIC axis.
Every major assistant grew memory in 2026 (ChatGPT Dreaming, Claude Chat Memory, Gemini, Grok, Copilot) —
but **all siloed**; none reads another's. The fix everyone converged on: **an external memory layer exposed
over MCP** that every tool reads. Real players:
- **mem0** — 60k★ Apache-2.0, "universal memory layer", OpenMemory Chrome ext (ChatGPT/Claude/Perplexity),
  MCP server, 80% token reduction claim. THE incumbent.
- **MemoryLake / AI Context Flow / ai-memory-mcp** — same pattern: store once, expose over MCP, inject into
  any client. ai-memory-mcp is pure SQLite-FTS5, zero-cloud, Apache-2.0, mines Claude/ChatGPT exports.
- **THE GAP they all share** (per arXiv 2605.11032 "Portable Agent Memory"): mem0 = cloud lock-in, no
  crypto integrity; Zep = proprietary graph, no export; MCP itself is stateless (tools, not memory).
  NONE has cryptographic provenance + governance + true local sovereignty together.

## SOV33's DIFFERENTIATED POSITION (honest, narrow, defensible)
SOV33 should NOT try to out-feature mem0 on recall. Its edge is the axis the whole field lacks:
**GOVERNED + ATTESTED + SOVEREIGN portable memory.**
- **Attested** — SIGIL hash-chain (→ Ed25519 L5) signs every memory write. arXiv 2605.11032 validates this
  exact design (Merkle-DAG + BLAKE3 + Ed25519 root) as the missing integrity layer. SOV33 already has it.
- **Governed** — every recall/inject passes the care-floor (0.95) + identity tier before it reaches a model.
  No competitor gates memory by a safety property.
- **Sovereign** — memory is a local substrate file the USER owns (proven swap-persistent: model-independent),
  not a vendor cloud. This is the "you own it, platforms keep their data, user protected" pitch, literally.
- **The protocol to adopt** (proven by the whole market): expose SOV33 memory over **MCP** with export/import
  (pam_export_memory / pam_import_memory pattern) so ANY MCP client (Claude, ChatGPT, Cursor) reads the same
  SIGIL-signed store. That is the bridge — and it's ~1 MCP adapter, not a new product.

## THE LEAN STACK (most-advanced-yet-leanest — reuse the field, own the governance)
| Layer | REUSE (open-source, permissive) | SOV33 OWNS (the moat) |
|---|---|---|
| Avatar/render | Utsuwa/Amica + @pixiv/three-vrm + VRoid | — (fork the shell) |
| Voice | Whisper (STT) + Piper/Kokoro (TTS) | — |
| Desktop orb | Tauri overlay (from Utsuwa) | — |
| Local model | Ollama / llama.cpp | governed routing + care-floor |
| Memory recall | SQLite-FTS5 / embeddings (mem0-style) | **SIGIL-signed, care-gated, sovereign** |
| Cross-platform bridge | **MCP** (the universal connector) | governed memory export/import over MCP |
| Identity | Ed25519 | founder/human/AI passport tiers |
| Federation | A2A | BFT reputation + collusion-resistance (built) |

## THE ONE-LINE STRATEGY
Fork the commoditized shell; DON'T rebuild it. Compete on the ONE axis the memory market left open:
governed + attested + sovereign portable memory, bridged over MCP. That is buildable now, differentiated,
and honest — no new foundation model, no AGI claim, no out-featuring mem0 on recall we can't win.
