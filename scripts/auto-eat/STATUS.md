# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T11:41:32Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 10320 |
| probed total | 10370 |
| atoms staged (unsigned) | 6 |
| staged LIVE fraction of probed | 0.0507 (26/513) |
| surfaces staged | autoeat.erc8004.newagents, autoeat.hf.newmodels, autoeat.hf.spaces, autoeat.mcp.registry, autoeat.npm.registry, autoeat.xrpl.accounts |
| last signed batch | autoeat.xrpl.accounts @ 2026-09-01T09:41:42Z (1db6aff59dd43597) |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 2000 |
| hf-model | 2511 |
| hf-space | 2191 |
| mcp-server | 528 |
| npm-registry | 2184 |
| xrpl-account | 906 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

