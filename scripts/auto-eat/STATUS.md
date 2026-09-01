# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T09:37:56Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 8344 |
| probed total | 9204 |
| atoms staged (unsigned) | 6 |
| staged LIVE fraction of probed | 0.4396 (491/1117) |
| surfaces staged | autoeat.erc8004.newagents, autoeat.hf.newmodels, autoeat.hf.spaces, autoeat.mcp.registry, autoeat.npm.registry, autoeat.xrpl.accounts |
| last signed batch | autoeat.xrpl.accounts @ 2026-09-01T09:12:28Z (6e6b42ef1cff9fe7) |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 1500 |
| hf-model | 2094 |
| hf-space | 2033 |
| mcp-server | 527 |
| npm-registry | 2000 |
| xrpl-account | 190 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

