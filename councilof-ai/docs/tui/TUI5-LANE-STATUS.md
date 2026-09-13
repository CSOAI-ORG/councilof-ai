# TUI 5 Lane Status — 13 September 2026

## Summary

TUI 5 (MCP Trust Board, GSPC vs AILuminate, OWASP report, PyRIT adapter) is **fully delivered and deployed**. All done-when endpoints are live (200). All PRs merged. No open PRs. The only remaining item (J26 agent SDK) is gated on TUI-4's J1 (12 analyst agent cards), which have not landed on master.

## Done-When Endpoints — ALL LIVE

| Endpoint | Status | Size | Detail |
|----------|--------|------|--------|
| `/trust` | 200 | 67KB | MCP Trust Board page |
| `/gspc-vs-ailuminate` | 200 | 67KB | GSPC vs AILuminate comparison |
| `/api/owasp-report` | 200 | 4KB | 10 OWASP categories, 1 covered (jail) |
| `/boards/mcp` | 200 | 67KB | Alias for /trust |
| `/interop/mcp-trust/latest.json` | 200 | 2.8KB | 500-host census, not partial |

## Merged PRs

| PR | Title | Merged |
|----|-------|--------|
| #1912 | MCP Trust Board: publish the verified handshake census | 2026-09-11T12:06:55Z |
| #1969 | mcp-trust: restore round-to-round diff writer | 2026-09-12T07:21:54Z |
| #1975 | J10 rework: OWASP report + PyRIT attachment — v0.2 | 2026-09-12T07:25:05Z |
| #1982 | J8 rework: GSPC vs AILuminate page + importer spec v0.2 | 2026-09-12T09:21:46Z |
| #2046 | TUI-5 benchmarkers: trust round 2 + first diff | 2026-09-12T17:24:03Z |

## Additional TUI-5 PRs Merged Today (13 Sep)

| PR | Title |
|----|-------|
| #2126 | fix(mill): export DS across the step boundary |
| #2129 | benchmarker provenance scorecards |
| #2130 | spray: skip on byte parity, never on as_of alone |
| #2132 | spray: publish confirmation is byte-strict too |

## Open PRs

None.

## J26 Gate

- **Item:** @csoai/agent SDK + mcp.councilof.ai remote server
- **Gate:** TUI-4 J1 (12 analyst agent cards)
- **Status:** GATED — agent-cards directory not found on master
- **Action:** Wait for TUI-4 to land J1

## Census State

- **Latest round:** 2026-09-13T12:11Z (today)
- **Hosts:** 500
- **Partial:** false
- **Diff:** Active (emits per-bucket deltas since round 2)

## What the Lane Delivered

1. **MCP Trust Board** — 500-host handshake census, counts-only, weekly cadence
2. **Round diff writer** — per-bucket deltas between rounds, cap-mismatch disclosure
3. **GSPC vs AILuminate** — honest breadth comparison page + importer spec
4. **OWASP LLM Top 10 report** — 10 categories, 1 defensible join (LLM01→jail), 9 UNMAPPED
5. **PyRIT jail-axis attachment** — evidence attachment, never verdict
6. **npm parity verified** — 12 tools (8 free + 4 paid), byte-identical both doors
7. **OFFER doc + SKU-INDEX** — free board live, per-server card via existing door

## What the Lane Did NOT Do (by design)

- Did not sign anything (unsigned card queued for publisher)
- Did not type live counts (derived from board modules)
- Did not implement J26 (gated on TUI-4 J1)
- Did not send outreach (owner gate)
- Did not submit IETF drafts (owner gate)

## Next Actions

1. **J26:** Unlocks when TUI-4's 12 analyst cards land on master
2. **Diff rendering:** Add diff visualization to /trust page when first real diff exists (after Monday's cron)
3. **Merge:** All PRs merged; no action needed
