# ASI AUTO-EAT — STATUS

_regenerated 2026-09-01T06:05:02Z — every number counted, none invented_

| field | value |
|---|---|
| queue DISCOVERED total | 0 |
| probed total | 0 |
| atoms staged (unsigned) | 0 |
| staged LIVE fraction of probed | n/a |
| surfaces staged | (none) |
| last signed batch | **none yet — no auto-eat card has signed green** |

## DISCOVERED by kind

| kind | count |
|---|---|

## Three-state invariant (structural)

- **DISCOVERED / UNMEASURED are first-class** — appearing here is not a score.
- Atoms are staged with `sig_ed25519: null`. This path holds no keys and cannot sign.
- A subject is **MEASURED only** once a card signs green through the GHA OIDC
  board-sign path and verifies. Until then it stays DISCOVERED/probed-LIVE.
- See `scripts/auto-eat/README.md` for the one dispatch that signs a feed batch.

