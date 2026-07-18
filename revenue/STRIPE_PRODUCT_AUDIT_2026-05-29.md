# Stripe Product Audit — 2026-05-29

## Findings

- **Total active products**: ~60+ (API returns 100 per page, has_more=true)
- **Core products** (keep): ~25 MEOK/CSOAI branded products
- **Legacy/test products** (archive): Smoke tests, duplicates, old pricing tiers
- **Risk**: Buyers can accidentally land on £1-£9 test products instead of £79-£299 Pro tiers

## Recommended Actions

1. **Archive immediately** (no revenue, buyer confusion):
   - "Money Flow Smoke Test (£1 one-time)"
   - "MEOK Smoke Test — £1 Compliance Demo"
   - Any product with "test", "smoke", "legacy" in name

2. **Consolidate pricing tiers**: 
   - Currently have Starter/Pro/Pro+/Enterprise/Defence for EACH substrate
   - Consider bundling into 3 unified tiers across all substrates

3. **Verify livemode products**:
   - All products show `livemode: true` 
   - Some may be test products accidentally created in live mode
   - Cross-reference with actual sales data in Stripe Dashboard

## External Blocker

Stripe CLI auth may need refresh. If `stripe products list` fails, re-authenticate with:
```
stripe login
```

## Next Steps

- [ ] Archive 10-15 obvious test/smoke products
- [ ] Audit prices for consistency (£79 Pro vs £199 Pro vs £299 Pro+)
- [ ] Check which products have actual prices attached (many show `default_price: null`)
- [ ] Set up product metadata for programmatic filtering
