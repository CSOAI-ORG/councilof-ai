# ASI AUTO-EAT — STATUS

_regenerated 2026-09-12T06:49:50Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 13166 |
| probed total | 13166 |
| atoms staged (unsigned) | 8 |
| staged LIVE fraction of probed | 0.2406 (1131/4700) |
| surfaces staged | autoeat.erc8004.newagents, autoeat.hf.newmodels, autoeat.hf.spaces, autoeat.mcp.registry, autoeat.npm.registry, autoeat.swift.census, autoeat.xrpl.accounts, autoeat.xrpl.twoway |
| last signed batch | autoeat.xrpl.accounts @ 2026-09-01T13:08:24Z (9f9b6ef8c585b8df) |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 1729 |
| hf-model | 4081 |
| hf-space | 4059 |
| mcp-server | 666 |
| npm-registry | 2408 |
| xrpl-account | 223 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

