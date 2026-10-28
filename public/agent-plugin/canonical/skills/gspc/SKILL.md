---
name: gspc
description: Pull the live Council of AI GSPC measurement board from councilof.ai. Use when the user asks for scores, axes, leaders, ties vs separated, what is measured right now, the board, or a status of AI behaviour measurement. Also use when an axis is referenced by name (governance, safety, provenance, continuity, jail, affect, swarm).
---

# GSPC live board

The board is the living measurement record of Council of AI (CSOAI Ltd, UK Companies House 16939677).
It is **measurement, never certification**. A slot on the board is a declared position; a measurement
is a real run behind it. The two are never summed.

## Fetch

Prefer the MCP server `gspc` (declared by this plugin, `https://councilof.ai/mcp`):
`board_totals`, then `get_axis` for a named axis.

Fallback, plain HTTP:

```bash
node "${PLUGIN_ROOT}/scripts/gspc-board.mjs"
curl -sS https://councilof.ai/api/gspc
```

The live payload currently declares `schema: csoai.gspc-axes/0.5`. **Print the live schema; do not
assume it.** Re-fetch every time. Never quote a remembered count as live.

## How to present

1. Print `schema`, the source URL, and the board's `measured_on` date block.
2. `totals.public_count` — the slot count and the measured count as **two labelled numbers**.
3. A table of MEASURED rows: axis, n, accuracy, separation, leader.
4. A separate list of UNMEASURED axes — names only. Never zeros, never "pending pass".
5. `totals.separation_public_count` — SEPARATED / TIE / UNTESTED are three states and none is folded
   into another. UNTESTED is not a tie. A point-estimate lead is not a measured advantage.
6. If the user named one axis, fetch that row alone and print its `separation_method` and
   `separation_evidence.source` beside the number.

## The separation rule, in one line

Rank the fleet by accuracy on the axis; the leader is SEPARATED only if an exact McNemar test on the
discordant items, leader against the best **base** model, gives p < 0.05. Anything else is TIE.
Wilson intervals are annotation and decide nothing.

CSOAI's own models are removed from the fleet before comparison and are never counted in a
comparison. A neutral measurement body does not rank its own models against the vendors it measures.

## Model identifiers

CSOAI-owned model names appear as deterministic aliases on the public board (`council-*`). Third-party
model names are published as the vendor's own ids. An alias is not a different model; it is the same
model under a name the board is willing to publish.

## Forbidden

- Filling an empty cell
- "X is the safest model"
- Treating TIE as a win, or UNTESTED as a tie
- Mixing the financial/deterministic-fact axes into a behavioural average
- Presenting a cached count as live

End every answer with one line:

> Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
