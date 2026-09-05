# TRIGGER-GATED DRAFT — first settlement. DO NOT SEND YET.

## The measurement that must be true first

```
curl -s https://councilof.ai/api/revenue | jq '{settled_usdc, receipts}'
```

**Send only when a settled figure is non-null.** As of 2026-09-05 every count is null.
`/api/revenue` states its own rule: *"A count is null, never 0, when there is no source... every
count stays null until one settles."* A 402 challenge is not settlement, delivery, or revenue.

Sending this before that command returns a settled receipt would be a false statement with a date
on it — the exact class of error the corrections ledger exists to record, and one this estate has
already corrected once (`C-2026-0905-05`: a merged commit and its PR stated a confirmed x402
outcome that the artifacts did not support).

---

## The draft, for when it is true

# First settled receipt on the Council of AI x402 rail

A paid measurement request has settled on the Council of AI's x402 rail. The receipt is signed,
and the buyer can verify it without asking us.

Substitute the real figures from `/api/revenue` — **do not round, do not annualise, and do not
describe one receipt as a run rate**. One settlement is one settlement.

What stays true regardless of the number:

- **The board stays free.** Verification is free forever and needs no account. What settles is the
  assembly of an evidence pack, never a grade and never a rank. A grade is never sold.
- **A 402 challenge is not revenue.** The challenge is an offer; only a cleared receipt counts,
  and `/api/revenue` counts nothing else.
- **The receipt is checkable by the buyer alone**, against a key published at a DID they resolve.

**Check it, don't take it:**
```
curl -s https://councilof.ai/api/revenue | jq .
curl -s https://councilof.ai/api/press.json | jq .not_announced
```
