# 🚨 CRN / Legal Entity Audit — 2026-05-17 — CRITICAL

A Companies House check found a name mismatch that could block Stripe payouts. Resolve before any customer money lands.

## The finding

| Identifier | Found at | Status |
|---|---|---|
| **CSOAI LTD — CRN 16939677** | Companies House public register | **ACTIVE** |
| "MEOK AI LTD" | Referenced in site footers, Stripe setup docs, README | **No matching CRN found via public search** |

Either:
1. **MEOK AI LTD IS incorporated** under a different number that just didn't surface in the search (possible), OR
2. **MEOK AI LTD is aspirational only** — never filed at Companies House — and CSOAI LTD is the legal entity behind everything

Both Stripe + bank + tax + grant claims must reference **the actually-incorporated entity**. A mismatch causes:
- Stripe payout holds (KYC mismatch)
- Bank account rejection
- Invalid R&D tax claim
- Invalid grant application
- Trademark registration in wrong name

## How to verify (5 minutes Nick)

```bash
# Open in browser:
https://find-and-update.company-information.service.gov.uk/search/companies?q=MEOK+AI
https://find-and-update.company-information.service.gov.uk/search/companies?q=CSOAI

# Or check the official record for CSOAI LTD:
https://find-and-update.company-information.service.gov.uk/company/16939677
```

Then check your Stripe account legal entity:

```
dashboard.stripe.com → Settings → Business
```

Compare the name + CRN there against Companies House. They MUST match.

## Three possible resolutions

### Resolution A: MEOK AI LTD exists, just wasn't found in public search
- Action: confirm the actual CRN
- Update site footers + README to show the correct CRN
- 30 minutes

### Resolution B: CSOAI LTD is the entity, MEOK AI Labs is a trading name
- Action: keep using CSOAI LTD as legal name
- Update everywhere: *"MEOK AI Labs is a trading name of CSOAI LTD, company number 16939677"*
- Site footers: add the disclosure
- Stripe: ensure legal entity = CSOAI LTD
- Bank: account must be in CSOAI LTD's name
- 2 hours

### Resolution C: Incorporate MEOK AI LTD as a new entity
- Action: file IN01 at Companies House (£12 online, instant)
- Transfer assets from CSOAI LTD → MEOK AI LTD
- Wind down CSOAI LTD OR keep as parent
- 1 day + lawyer £500 if transferring IP

**Recommendation:** Resolution B is fastest. CSOAI LTD is already incorporated, active, and presumably the bank account is in its name. The "MEOK AI Labs" trading name is well-established commercially — just disclose the legal entity properly.

## Site footers to update

Wherever "MEOK AI LTD" appears, change to:

> *"MEOK AI Labs is a trading name of CSOAI LTD, a company registered in England & Wales (no. 16939677). Registered office: [address]."*

Files to grep + edit:
```bash
grep -rl "MEOK AI LTD\|MEOK AI Ltd" ~/clawd/meok ~/clawd/csoai-org ~/clawd/csoai-org-v2 ~/clawd/haulage-app 2>/dev/null
```

## Why this matters TODAY (before any customer)

Stripe's first payout requires KYC alignment between:
1. Stripe legal-entity name (what you entered)
2. Companies House record (what you filed)
3. Bank account name (where the payout goes)

If any of those three diverge, Stripe holds the payout in compliance review for **5-15 working days**. First customer pays £29 → you wait 2 weeks to see it → frustrating but not fatal. First enterprise pays £499 → same delay = looks unprofessional + sales hurt.

**Fix it now while customer count is zero.**

## What to confirm next session

Once Nick has the CRN sorted:
- [ ] Confirm bank account name = CSOAI LTD (or whatever the legal entity is)
- [ ] Confirm Stripe legal entity = same
- [ ] Update meok.ai footer to disclose
- [ ] Update csoai.org footer (already says "© 2026 CSOAI")
- [ ] Update PyPI README "By MEOK AI Labs" with "trading name of CSOAI LTD"
- [ ] Update all Stripe product descriptions if needed
