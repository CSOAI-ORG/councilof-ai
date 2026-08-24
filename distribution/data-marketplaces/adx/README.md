# Azure Data Exchange (ADX) — staged listing (NOT SUBMITTED)

**Owner-gated for seller-of-record.** This folder holds CLI-ready artifacts only.

## Staged assets

| File | Purpose |
|------|---------|
| `listing-manifest.json` | Product metadata for ADX publish |
| `stage.sh` | Validates manifest; does not submit |

## Stage (dry run)

```bash
cd distribution/data-marketplaces/adx
./stage.sh
```

## Submit (owner only)

Requires Azure subscription + seller onboarding. Do not run `az dataproduct` publish without owner sign-off.

## Product honesty

- **Measurement datasets and API access** — not compliance certification
- Live board: `GET https://councilof.ai/api/gspc`
- Pricing: OWNER-BLOCKED — list as "contact" not invented $
