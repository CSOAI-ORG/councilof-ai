# /interop/x402-facilitator — UNSIGNED facilitator SR dry

Measurement, not certification. Separate from catalog 74/100. `writes_board=false`.

**Board cite only:** [GET /api/gspc](https://councilof.ai/api/gspc) → live `totals.public_count` (**22 axis · 22 measured**). Do not freeze counts here.

## Matrix (expand 2026-09-13)

| Subject | SR1 | SR2 | SR5 | Notes |
|---|---|---|---|---|
| GoPlausible | PASS | PASS | FAIL | zero-amount `isValid:true` |
| OpenX402 | UNCHECKABLE | UNCHECKABLE | UNCHECKABLE | `address_not_registered` confounds — **never invent PASS** |
| Dexter | UNCHECKABLE | UNCHECKABLE | UNCHECKABLE | `Cannot POST /verify` |

Verify-only dry · settle never called · ephemeral throwaway EOA · rate-limit ≥2s.

## Leaves

- `index.json` — machine index
- `matrix.json` — raw SR dry expand
- `capability-probe.json` — GET capability matrix
- `card-v0-*-facilitator-sr.unsigned.json` — UNSIGNED cards

UNSIGNED only. No SIGNED stamp without n≥30 + 4way + keystone.
