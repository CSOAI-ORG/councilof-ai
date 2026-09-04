# `capabilities/registry.json` — one registry, N protocol doors

## The problem it solves

Measured on the live estate, 4 September 2026, before this existed:

| Door | Capabilities advertised |
|---|---|
| `openapi.json` | 67 paths |
| `POST /mcp` (`tools/list`) | 12 tools — **10 of them in no other door** |
| `/.well-known/agent-card.json` | 5 skills — **all 5 in no other door** |

**84 capabilities in total, and every single one reachable through exactly one door. Zero appeared
in more than one.** An agent's view of this estate depended entirely on which door it knocked on:
an A2A client saw five things, an MCP client saw twelve, an HTTP client saw sixty-seven, and the
three sets did not intersect. That is three products sharing a domain, not a fabric.

## The rule

**The registry is the source of truth. Doors are generated from it, never hand-edited.**

A capability names which protocols it is reachable through:

```json
{ "id": "get_root", "title": "Fetch the signed Merkle root",
  "endpoint": "/api/root", "method": "GET",
  "protocols": ["http", "mcp", "a2a"] }
```

Adding a protocol — a new plugin surface, another agent framework — becomes *one adapter reading
this file*, not another hand-maintained list that drifts by next week. That is the difference
between wiring N integrations and having a fabric.

## Enforcement

```
node scripts/capability-drift-guard.mjs --selftest   # the guard can fail
node scripts/capability-drift-guard.mjs              # live doors vs the registry
```

A door that cannot be fetched is reported **UNCHECKABLE**, never as agreement — silence is not
consent, and a guard that passes when it learned nothing enforces nothing.

## What this registry does NOT yet do

Seeded from the live doors on 2026-09-04, so it currently *records* the split rather than fixing
it: 84 capabilities each carrying a single protocol. The next step is the deliberate part, and it
is a judgement call per capability, not a bulk edit — decide which capabilities genuinely belong on
which doors, widen `protocols` accordingly, and let the generators emit the doors. The guard will
fail until each door matches, which is the point: the drift is now visible and blocking instead of
silent.
