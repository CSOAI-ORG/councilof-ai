# meok-sovereign-immortal-mcp

**Sovereign Immortal MCP — eternal memory + Bitcoin-anchored lineage.**

> *"Memory that outlives the body. Decisions that outlive the council."*

5 tools for the sovereign memory substrate (no decay, ever):

| Tool | What |
|---|---|
| `sov_immortal_store(content, author, tags)` | Store to the immortal ledger (Bitcoin-anchored) |
| `sov_immortal_recall(query, limit)` | Recall from the immortal ledger (no decay) |
| `sov_immortal_chain()` | Chain state (block height, latest hash, BTC anchors) |
| `sov_immortal_verify(record_id)` | Verify an immortal record (chain + BFT + Bitcoin anchor) |
| `sov_immortal_status()` | Substrate status (records, head height, BTC anchors) |

## The immortal difference

| Memory MCP | Immortal MCP |
|---|---|
| Ebbinghaus temporal decay | **No decay, ever** |
| Session-scoped | **Bitcoin-anchored, permanent** |
| Recency-weighted | **Pure lexical + chain trust** |
| Volatile in-memory | **Hash-chained, BFT-verified** |

## Install
```bash
pip install meok-sovereign-immortal-mcp
```

## Usage
```python
from meok_sovereign_immortal_mcp import sov_immortal_store, sov_immortal_recall, sov_immortal_chain, sov_immortal_verify, sov_immortal_status

# 1. Store (Bitcoin-anchored)
r = sov_immortal_store("Sovereign memory that outlives the body", author="sovereign")
assert r["btc_anchor"] > 0
assert r["head_hash"]

# 2. Recall (no decay)
r = sov_immortal_recall("sovereign")
# Even 100-year-old records return the same score

# 3. Chain
r = sov_immortal_chain()
assert r["head_height"] >= 1

# 4. Verify
r = sov_immortal_verify(record_id)
assert r["valid"] is True
```

## License
MIT — CSOAI Ltd (UK 16939677)

**Memory that outlives the body.**
