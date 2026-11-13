# Council of AI GSPC — Agent Measurement Rules

1. **Measurement only**: Quote `totals.public_count` from `board_totals` verbatim. Never add, re-derive or round a count.
2. **Three verification states**: Card and capsule verification return `VALID`, `INVALID`, or `UNCHECKABLE`. "Could not check" is never "forged".
3. **Honest absences**: `UNMEASURED` and `UNREACHABLE` are first-class answers, not errors. Never fill an empty cell.
4. Measurement only: a card is evidence, never a grade, mark or endorsement. Verification is free.

Data: https://councilof.ai/api/gspc · Corrections ledger: https://councilof.ai/corrections/ (JSON: https://councilof.ai/api/corrections) · Verify a card, free: https://councilof.ai/gspc-verify/

Doctrine: `docs/DOCTRINE.md` sha256 `845fc1d200eb9e867fc8d682750409d6725084bac632726187759f8fefdfbe0a` (human page https://councilof.ai/doctrine/).
