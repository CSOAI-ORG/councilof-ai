# PRESS DRAFT — the first buyer's-eye measurement of the x402 Bazaar

**Status: DRAFT. Not sent. The owner sends, or does not.** Staged here per the outreach boundary —
no send queue, no named recipient, no outbound from this lane.

Facts only. **Every figure in this document — 316, 213, 100, 13, 174, 62, 144, 1.3398 USDC and the
percentages derived from them — comes from the published dataset named here and nowhere else**, and
is recomputable by anyone from it. The only exception is the revenue line, which is `/api/revenue`.
Dataset:
<https://huggingface.co/datasets/csoai/x402-settlement-census>

---

## The measurement

On 6 September 2026 we paid **316** conformant x402 hosts on Base (`eip155:8453`) with a correctly
signed USDC payment, one purchase each, and recorded what came back.

| Outcome | Hosts | Share |
|---|---:|---:|
| **REFUSED** — answered the retried request with 402/4xx anyway | **213** | 67.4% |
| **DELIVERED** — paid and answered | **100** | 31.6% |
| NO_CHALLENGE | 2 | 0.6% |
| MISMATCH — paid, answered 2xx, body was not the advertised type | 1 | 0.3% |

Total spend **1.3398 USDC**, all of it ours. 316 rows, and the four outcomes sum to 316.

**Two in three conformant hosts refused a correctly signed payment.** Being listed and conformant
is not the same as taking money and answering, and that gap is what the Bazaar indexes do not carry.

## Thirteen hosts took the money and delivered nothing

**13 hosts recorded an on-chain settlement in their own PAYMENT-RESPONSE and then answered the
retried request with 402/4xx** (`summary-2026-09-06.json` → `took_a_settlement_and_still_refused`)**.** Money moved; nothing came back. Total **0.193 USDC**.

Every one of those rows carries its settlement transaction hash, so a reader checks the chain
rather than taking our word for it.

## The refusal is concentrated, not spread

This is the part the headline number hides. Across the **314** hosts that advertised a payment
address, there are only **174 distinct `payTo` addresses** — so many "hosts" share an operator.

| | Hosts | Delivered |
|---|---:|---:|
| The five largest `payTo` operators | 107 (34% of all hosts) | **4 — 3.7%** |
| Every other operator | 207 | **96 — 46.4%** |

The single largest operator fronts **62 hosts and delivered on none of them** (grouped from `pay_to` and
`status` in `x402-settlement-census-2026-09-06.jsonl`). Meanwhile **144 of
the 174 addresses serve exactly one host each**.

A buyer who avoids the largest multi-host operators sees roughly **46%** delivery, not 32%. The
Bazaar is less decentralised than a host count suggests, and its failure rate is concentrated in a
few operators rather than spread evenly across the market.

## What this is not

- **Not a ranking, not a recommendation, and not an accusation.** No host was contacted, and no
  host is named here.
- **REFUSED is not proof of bad faith.** A host may rate-limit, require an account, or have changed
  its terms between the challenge and the retry.
- **One purchase per host, at one moment.** A single refusal is not a pattern. The second round is
  what would make it one.
- **Not revenue.** Every USDC here left our own wallet. Paying people is a cost. Our own
  `/api/revenue` reports **0** distinct non-self payers, status MEASURED — we have never been paid
  by a stranger, and we say so in the same breath as this.
- **Not certification.** We measure; we do not certify, accredit, or assess conformity.

## Reproduce it

The dataset (<https://huggingface.co/datasets/csoai/x402-settlement-census>) carries the row per
host, the summary, and the command. Anyone can rerun it against
the same 316 hosts and get their own numbers — that is the point of publishing it.

---

### Owner checklist before any of this is sent
- [ ] Confirm the framing is a measurement, never an accusation about a named party.
- [ ] Confirm no host or operator is identified by name anywhere in the final text.
- [ ] Confirm the "not revenue" line survives editing — it is the one most likely to be cut.
