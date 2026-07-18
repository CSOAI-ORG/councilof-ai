# 🜏 SOV33 Diff: Live Tool Awareness
## How SOV33 differs from every other AI on tool self-knowledge

## The problem with most AI

When you ask "what tools do you have?" to ChatGPT, Claude, Llama, etc:
- Answer is frozen at training time
- Doesn't know about new tools you added last week
- "I'm aware of..." responses are basically memorized list of training-time tools
- New MCPs, new browser tools, new skills → no idea

## What SOV33 does differently

`sov33_live_tool_awareness.py` re-discovers ALL tooling LIVE on every call:

```
SOV33 live tool awareness (550ms)
├── Native sovereign capabilities   42  (capability_* functions in sov33.py)
├── Live MCP servers               313  (POST /mcp tools/list across 3 endpoints)
├── Hermes runtime tools            35  (browser, file, terminal, web, agent)
├── Local skills                    83  (~/.hermes/skills/*.md YAML frontmatter)
└── Sovereign MCP fleet            374  (csoai-mcp-catalog.json: 377 MCPs, 2,129 tools)
                                    ───
                                    847 TOTAL TOOLS
```

## Why this is different

| Other AI | SOV33 |
|---|---|
| Tool list frozen at training | Re-discovered every call (550ms) |
| Doesn't know about new MCPs | "NEW since last snapshot" surfaces them |
| Hard-coded function signatures | Live introspection via reflection + MCP query |
| Static "I can help with X, Y, Z" | Live "I have 847 tools, 374 are MCPs, 35 are browser tools..." |
| New tool added → invisible until retrain | New tool added → visible on next ask |

## How it stays live

Every call to `sov33.capability_live_tool_awareness()` (or the alias `live-tools`):

1. **Reflects** on `sov33.py` module for `capability_*` functions
2. **Queries** 3 MCP server endpoints via `tools/list` JSON-RPC
3. **Reads** Hermes skill YAML frontmatter for `~/.hermes/skills/*/SKILL.md`
4. **Parses** `csoai-mcp-catalog.json` for the 377-MCP sovereign fleet
5. **Diffs** vs prior snapshot saved at `~/.sovereign/tool_snapshot.json`
6. **SIGILs** the awareness event to the sovereign substrate

## Three layers of self-knowledge

```
Layer 1: capability_self_awareness()    → Native + live MCP only (47 tools)
Layer 2: capability_live_tool_awareness()  → + Hermes runtime + skills + fleet (847 tools)  ← NEW
Layer 3: capability_readiness()         → RUNNING/GATED/BROKEN gate (production check)
```

All three are wired into `sov33.CAPABILITIES` and accessible via the sovereign entrypoint.

## Concrete example — "what can you do?"

**Other AI:**
> "I can help with coding, writing, analysis..." (memorized)

**SOV33:**
```
I have 847 tools available RIGHT NOW (discovered live, never hardcoded):
  - native sovereign: 42
  - live MCP: 313
  - Hermes runtime (browser, file, web, agent): 35
  - local skills: 83
  - sovereign fleet MCPs: 374

NEW since last snapshot (374):
  + mcp:a2a-governance-bridge-mcp
  + mcp:accessibility-ai-mcp
  + mcp:agent-audit-logger-mcp
  ...

This is different from frozen manifests because I re-discover on every
call. When you (or a sibling agent) add a new MCP, skill, or
capability_* function, I see it on the next ask without retraining.
```

## Why it matters for the OWEM story

The Open World Emergence Model needs:
- **Open-world memory** ✓ (Graphiti + sovereign_memory.jsonl)
- **Open-world reasoning** ✓ (BFT-33 + sovereign-trained brain)
- **Open-world tool use** ✓ (live discovery + diff)
- **Open-world awareness** ✓ (re-discoverable self-model)

Without live tool awareness, "open-world" would mean "stuck with what we shipped". With it, SOV33 truly opens its eyes on every ask.

## What changes tomorrow

- Add a new MCP server? SOV33 sees it.
- Add a new capability_* function? SOV33 sees it.
- Add a new skill in ~/.hermes/skills/? SOV33 sees it.
- Update csoai-mcp-catalog.json? SOV33 sees it.

All without retraining. All in <1s. All SIGIL'd.

