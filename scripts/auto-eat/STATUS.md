# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T06:09:13Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 83 |
| probed total | 40 |
| atoms staged (unsigned) | 2 |
| staged LIVE fraction of probed | 0.9231 (36/39) |
| surfaces staged | autoeat.hf.newmodels, autoeat.mcp.registry |
| last signed batch | **none yet — no auto-eat card has signed green** |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 25 |
| hf-model | 25 |
| mcp-server | 14 |
| xrpl-account | 19 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

