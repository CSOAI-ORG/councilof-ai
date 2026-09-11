# Offer — mcp-trust-board

> One page. Derived from live probes produced by `scripts/mcp-trust-round.py`; implements docs/product/MCP-TRUST-BOARD-SPEC.md (v0.1).
> Prices are quoted at the 402 door — never here. Measurement, never certification.

| fact | value |
|---|---|
| free surface | `/trust` (alias `/boards/mcp`) — the public board page |
| free artefact | `/interop/mcp-trust/latest.json` + dated snapshots — counts only, host details withheld by design |
| round cadence | Weekly (`mcp-trust-board-round.yml`, Monday 04:41Z) |
| probe contract | One `initialize` per host per round; one `tools/list` only if the handshake answers; tools counted, never called, never named; no authentication ever attempted |
| metered surface | **Existing door only** — `POST /api/request-attestation` (`commission_card`): a named party may commission a signed card for *their own* server (handshake result, auth posture observed, timestamp, Ed25519, Merkle-anchored) |
| monitoring tier | **STAGED — no door exists.** A per-customer watch tier (posture drift alerts on servers the customer names) is specced in §8 of the spec as future work. Not advertised, no price typed, no seat pricing ever. When a door exists it quotes at its own 402. |
| not for sale | Host-level data about *other* parties' servers — withholding is doctrine, not a pricing tier |

## What the free board gives you
The counts-only handshake census: who answers a correct MCP `initialize`, who answers
with an auth challenge (a term sheet, not delivery), who is unreachable (never FAIL),
auth-scheme-family counts, and aggregate tool-count statistics. UNMEASURED cells stay
visible; a partial round is marked partial; a single observation is a snapshot — the
delta, once ≥2 complete rounds exist, is the board.

## What a commissioned card attests
What we observed about *your* server, when: handshake result, auth posture, timestamp —
a signed measurement, never a certificate, never a grade. Verification stays free
forever (`/gspc-verify`); every signed leaf checks against the public root.

## Proof commands
- `curl -s https://councilof.ai/interop/mcp-trust/latest.json | jq .counts`
- `python3 scripts/mcp-trust-round.py --selftest` (bucketing proofs, no network)
- Round reproduction: `python3 scripts/mcp-trust-round.py --cap 500` (dry; nothing signed, nothing paid)

## Ask
Read the free board. If you operate an MCP server and want your own signed posture
card, commission it at the existing door — the price is quoted at the 402, never here.
Owner approves any outbound; I do not mass-send.
