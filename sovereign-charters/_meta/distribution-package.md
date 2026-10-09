---
id: distribution-package
title: "Distribution Package — Sovereign Charter Sprint"
kind: "meta"
ratified_at: 2026-09-02
sigil_signature: "ed25519:sigil:120041c95e743bfb77c23b92437789a6d008e0f911c374b56ebea962cbd2c81d"
---

# Distribution Package

*Ratified 2026-09-02 · SIGIL `ed25519:sigil:12…`*

## Package Contents

```
sovereign-charters/     # 60 charter files + 5 meta files
sovereign-law/          # 12 frameworks + global-law-index + compliance-crosswalk
meok-backend/
  sovereign_corpus.py   # 1,000+ line corpus aggregator
  corpus/
    sovereign_corpus.jsonl  # ~50MB training data
test_charter_sprint.py  # 50-test verification suite
```

## Total Size

- 60 charters × ~12KB avg = ~720KB
- 12 frameworks × ~10KB avg = ~120KB
- 5 meta files × ~3KB = ~15KB
- sovereign_corpus.py: 1,000+ lines
- sovereign_corpus.jsonl: ~50MB (10,000+ records)
- test_charter_sprint.py: 50 tests

## Distribution Channels

1. **Internal monorepo** — `/Users/nicholas/clawd/sovereign-charters/`, `/Users/nicholas/clawd/sovereign-law/`
2. **Public site** — `https://councilof.ai/governance/charters/`
3. **MCP server** — `meok-sovereign-charters-mcp` (218th MCP)
4. **PyPI package** — `csoai-sovereign-charters`
5. **HF dataset** — `csoai/sovereign-corpus`

## Distribution Schedule

| Channel | Date | Owner |
|---|---|---|
| Internal monorepo | 2026-09-02 | M4 sovereign-orchestrator |
| Public site | 2026-09-03 | M1 site-deploy |
| MCP server | 2026-09-05 | M3 mcp-engineer |
| PyPI package | 2026-09-07 | M5 packaging |
| HF dataset | 2026-09-10 | M4 sovereign-orchestrator |

## Public Anchoring

Every charter is anchored in the public root at `https://councilof.ai/public-root/`.
Inclusion proofs are available via the GSPC trust layer.

## SIGIL Signature

```
ed25519:sigil:120041c95e743bfb77c23b92437789a6d008e0f911c374b56ebea962cbd2c81d
```
