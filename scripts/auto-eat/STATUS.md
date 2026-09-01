# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T08:40:30Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 7487 |
| probed total | 6861 |
| atoms staged (unsigned) | 6 |
| staged LIVE fraction of probed | 0.5442 (2721/5000) |
| surfaces staged | autoeat.erc8004.newagents, autoeat.hf.newmodels, autoeat.hf.spaces, autoeat.mcp.registry, autoeat.npm.registry, autoeat.xrpl.accounts |
| last signed batch | autoeat.xrpl.accounts @ 2026-09-01T06:53:19Z (61c9d2e16e3f0697) |

## DISCOVERED by kind

| kind | count |
|---|---|
| erc8004 | 800 |
| hf-model | 2006 |
| hf-space | 2003 |
| mcp-server | 527 |
| npm-registry | 1997 |
| xrpl-account | 154 |

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

