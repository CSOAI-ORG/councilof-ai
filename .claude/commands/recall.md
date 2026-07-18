---
name: recall
description: Search SOV3 + Hindsight for facts about a topic
---

Search both memory systems for the given query:

1. Query SOV3 via POST localhost:3101/mcp with query_memories tool
2. Query Hindsight via POST localhost:8765/v1/default/banks/meok-empire/memories/recall
3. Combine and deduplicate results
4. Present the top 5 most relevant facts

This enables instant fact recall across all ingested business knowledge.

Usage: /recall What are MEOK pricing tiers?
