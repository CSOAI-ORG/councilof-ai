# YIELD: distinct_payers_by_door — Verification Report — 2026-09-14

## Status

`distinct_payers_by_door` is **already implemented** in `functions/api/revenue.ts` (lines 120, 194, 201, 221).

## Implementation

Derived from `settled:tx:*` records in REVENUE_KV:
- Reads all settlement records
- Groups by `(payer, resource)` pairs
- Returns `null` when no records (never 0)
- Returns `{}` when records exist but none count

## Tests

`functions/api/revenue.test.ts` — 8/8 passed:

| Test | Result |
|------|--------|
| null when no KV bound | ✅ |
| null when KV empty | ✅ |
| distinct_payers_by_door derived from records | ✅ |
| self-settlements excluded | ✅ |
| zero-value settlements excluded | ✅ |
| last_30d window | ✅ |
| settled_usdc_atomic correct | ✅ |
| bazaar outcomes tracked | ✅ |

## Proof

```bash
curl -s https://councilof.ai/api/revenue | jq .distinct_payers_by_door
# null (no records — honest state)
```

## Conclusion

No code changes needed. The field is live and tested. Revenue from external customers: $0.
