# sovereign-memory-v2 · MCP
**Greenfield MCP #1** · Charter-anchored · 10 July 2026

Pydantic-AI long-term memory layer. Cognee-style graph memory + memvid-style video frames.
Built per `~/clawd/_alignment/RESEARCH_PACK_2026-07-07.md` Tier 1 finding (topoteretes/cognee, memvid/memvid).

## Tools
- `memory_add(content, kind)` → store + hash + sigil
- `memory_query(q, top_k=5)` → retrieve + chain references
- `memory_graph(entity_a, entity_b)` → return shortest-path sigil chain

## Care floor
0.95. Charter SHA-256 echoed per receipt.
