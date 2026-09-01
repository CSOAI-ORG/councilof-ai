# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T07:54:49Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 332 |
| probed total | 305 |
| atoms staged (unsigned) | 6 |
| staged LIVE fraction of probed | 0.7647 (52/68) |
| surfaces staged | autoeat.erc8004.newagents, autoeat.hf.newmodels, autoeat.hf.spaces, autoeat.mcp.registry, autoeat.npm.registry, autoeat.xrpl.accounts |
| last signed batch | autoeat.xrpl.accounts @ 2026-09-01T06:53:19Z (61c9d2e16e3f0697) |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 25 |
| hf-model | 145 |
| hf-space | 27 |
| mcp-server | 14 |
| npm-registry | 25 |
| xrpl-account | 96 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

