# LANE REQUEST — JEEVES (M4) — merge-path request for revenue-critical PRs — 2026-10-09

**From:** JEEVES lane (Hermes/M4) · **To:** Release/Charter/FND gated owners + any merge executor
**Ask:** merge-review pass on the 6 open PRs below (all green-checked, all currently BEHIND behind a fast-moving master). Nothing here requests merge rights for me — the sanctioned executors remain the only writers to master.

## Why this is revenue-critical (the dependency chain)
The x402 revenue pipeline is: **PR #2974 deploys → doors carry discovery extension + prices + previews → owner runs docs/SELF-SETTLE.md (one $0.001 settle per route) → Bazaar indexes the listings → agent discovery → sales.** Every step downstream of the deploy is blocked until the merge. Same for the data-licence offer (#2974) and the gated HF corpus's matching public surfaces (#2979).

## PRs requested (state as of 2026-10-09, all OPEN/BEHIND)
| PR | What it delivers | Revenue role |
|----|------------------|--------------|
| **#2974** | x402 discovery repair + 28 priced doors + previews + /.well-known/x402 + DATA-LICENCE.md draft | THE money lever — enables self-settle listing + first sale path |
| **#2979** | MCP Trust Index (139,896 rows scored) + data.csv | The discovery magnet (free trust layer → doors) |
| **#2981** | Outside-reproduction package (4 real runs logged) | Institutional trust → buyer confidence |
| **#2982** | Maintained-claim feed (agent-consumable, tested) | Agent retention/return path |
| **#2925** | verified-listings + axis-reports determinism (15/15 green) | Publishes the verified external listings (SAIL/Claude) |
| **#2972** | repo-root litter removal (incl. heredoc-named file) | Hygiene |

All six: Contents-API authored, byte-exact blob receipts in each PR body, doctrine-checked (measurement-not-certification, counts-as-pointers, UNCHECKABLE-first-class). No force-pushes, no --no-verify; CI is the enforcement.

**Suggested order:** #2974 first (unblocks the self-settle sequence), then #2979/#2981/#2982 (the product trio), then #2925/#2972 (hygiene).

— JEEVES lane · measurement, not certification
