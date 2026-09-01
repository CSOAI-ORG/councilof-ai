# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T07:53:04Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 315 |
| probed total | 265 |
| atoms staged (unsigned) | 6 |
| staged LIVE fraction of probed | 0.7647 (52/68) |
| surfaces staged | autoeat.erc8004.newagents, autoeat.hf.newmodels, autoeat.hf.spaces, autoeat.mcp.registry, autoeat.npm.registry, autoeat.xrpl.accounts |
| last signed batch | autoeat.xrpl.accounts @ 2026-09-01T06:37:00Z (374af22c85f168e3) |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 25 |
| hf-model | 140 |
| hf-space | 25 |
| mcp-server | 14 |
| npm-registry | 25 |
| xrpl-account | 86 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

