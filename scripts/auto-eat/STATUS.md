# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T13:08:24Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 11022 |
| probed total | 11063 |
| atoms staged (unsigned) | 8 |
| staged LIVE fraction of probed | 0.0598 (31/518) |
| surfaces staged | autoeat.erc8004.newagents, autoeat.hf.newmodels, autoeat.hf.spaces, autoeat.mcp.registry, autoeat.npm.registry, autoeat.swift.census, autoeat.xrpl.accounts, autoeat.xrpl.twoway |
| last signed batch | autoeat.xrpl.twoway @ 2026-09-01T13:01:56Z (6c50e9ff0c0611d7) |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 2000 |
| hf-model | 2731 |
| hf-space | 2294 |
| mcp-server | 529 |
| npm-registry | 2265 |
| xrpl-account | 1203 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

