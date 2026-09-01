# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T06:37:01Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 189 |
| probed total | 189 |
| atoms staged (unsigned) | 4 |
| staged LIVE fraction of probed | 0.7377 (45/61) |
| surfaces staged | autoeat.erc8004.newagents, autoeat.hf.newmodels, autoeat.mcp.registry, autoeat.xrpl.accounts |
| last signed batch | autoeat.xrpl.accounts @ 2026-09-01T06:25:18Z (539dad13720bb559) |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 25 |
| hf-model | 90 |
| mcp-server | 14 |
| xrpl-account | 60 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

