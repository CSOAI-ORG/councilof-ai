# Public corrections for bad RWA cards (NEXT_300 #293)

If a published RWA attestation card is wrong: **append** a corrections entry (`/api/corrections`) — never silent-edit. Expect `signature_state: STALE` until re-issue.

Same doctrine as index-method errata `C-2026-0825-01`. JMWH remains **demo-only** — never ship as a MEASURED product card.
