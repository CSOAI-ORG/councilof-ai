# Printer bake — cite live `totals.public_count` only

**Date:** 2026-09-02 · MCP / HF / Kaggle printer surfaces

## Rule

Every printer (MCP tool response, Hugging Face Space card, Kaggle dataset card,
embed chrome) emits board totals from a **live** `GET https://councilof.ai/api/gspc`
and quotes **`totals.public_count` verbatim**.

- Do **not** type `"22 axis · 22 measured"` (or any count) into printer copy.
- Do **not** push to HF Hub unless `hf auth` / whoami is **`csoai`**.
- Do **not** invent MEASURED cells; UNMEASURED stays empty.
- Never certify.

## Live fetch (example)

```bash
curl -sS https://councilof.ai/api/gspc | jq -r '.totals.public_count'
```

Machine helper already in-tree: `mcp/gspc-server` `board_totals` →
`public_count` from live GET (see `mcp/gspc-server/index.mjs`).

## Example printer JSON

See [`public/interop/printer-public-count.example.json`](../public/interop/printer-public-count.example.json).

## HF / Kaggle

| Venue | Action this weld |
| --- | --- |
| Hugging Face Hub | **Blocked** unless whoami is `csoai` — docs + example only |
| Kaggle | Docs + example only — no dataset push |
| MCP | Cite existing live `board_totals` / `public_count` helper |

## Hard stops

- No wrangler
- No fake Rekor seal
- No certify
- Sign only when n≥30 + 4way + keystone
