# Doctrine audit of the grant packs — clean, and why a string gate would be wrong

**Measured 2026-09-06 across `docs/grants`, `docs/company`, `docs/outreach` at `origin/master`.**

## Result

| Rule | Naive string hits | **Actual breaches** |
|---|---:|---:|
| No payment-processor names | 0 | **0** |
| No public prices for what we sell | 59 | **0** |
| No tiers | 2 | **0** |
| No "certified" / "accredited" claim | 12 | **0** |
| No "contracted" claim | 4 | **0** |
| **Total** | **77** | **0** |

The packs are clean. The number worth carrying forward is not the 0 — it is the **77**.

## Why a string-shaped gate here would fire 77 times on a clean tree

Every one of the 77 is a false positive, and they fail in four distinct ways:

- **Prices that are not prices.** £1.0M Berkus, £0.5M per-factor ceiling, £205 trademark cost.
  These are *valuations and our own costs*. The doctrine forbids publishing a price for what we
  sell; it does not forbid stating what the company is worth or what a filing costs. Nothing in
  these files attaches a price to a card, a verification, a query or a subscription — tested
  directly, **0 hits**.
- **Someone else's tier.** Both "free tier" matches describe **Microsoft for Startups** and
  **Google for Startups Cloud**. Describing a third party's offer is not publishing ours.
- **A domain name.** `certified.app` is the Hypercerts sign-up host. A substring match cannot tell
  a hostname from a claim.
- **Documents stating the prohibition.** `MONETISATION-MAP.md` says *"no ... certified or
  contracted"*; the DIGITAL concept note has a section headed **"What we will not write in the
  proposal"** that lists "Art 50 certified" as forbidden. **A string gate would fail the very
  sentences that enforce the rule** — and the obvious "fix" is to delete the prohibition.

That last one is the dangerous shape. A gate whose cheapest passing edit is *removing the
statement of the rule* is worse than no gate.

## What a correct check looks like

Test the **claim**, not the **string**:

```
price breach      = a currency amount on the same line as we charge / our price / per card /
                    per verification / per query / subscription / licence fee   -> 0 found
certified breach  = (we are | CSOAI is | Council of AI is | is now | has been) … (certified |
                    accredited | contracted)                                    -> 0 found
```

Both ran clean. "contracted specialists" and "would be contracted to an engineer" survive this,
correctly: those describe **hiring**, not a customer relationship.

## Not proposed as a gate

`scripts/` beyond `verify-estate.mjs` is not this lane's file area, and `brand-gate.mjs` already
covers `public/` — which is the surface that actually ships. This is filed so that if anyone does
gate `docs/`, they start from the claim-shaped predicates above rather than a word list, and know
in advance that a word list scores 77/0.

## Provenance

One offline pass over `origin/master`; no network, no probe budget. Re-run the two predicates
above to reproduce.
