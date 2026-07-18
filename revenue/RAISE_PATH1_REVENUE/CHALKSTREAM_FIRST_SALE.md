# First-Sale Package — ChalkStream (RSPCA Assured trout)
**2026-06-06 · DRAFT for Nick's review — NOT sent. Two gates before anything goes out (see bottom).**

## Why ChalkStream is target #1 (honest rationale)
- Real, established English chalkstream trout producer supplying premium retail (Waitrose/Harrods per public reporting) — verify current accounts in DD, don't assert in the email.
- Was RSPCA-suspended after the 2021 Viva! investigation, then reinstated → they have a concrete, public brand-survival reason to **over-document** welfare. That's the buying emotion.
- The **23 Jul 2025 RSPCA trout standard refresh (177 new clauses, mandatory whole-slaughter CCTV, banned methods)** means every RSPCA trout farm is re-papering compliance *right now*. Timing is the wedge.
- Contact (agent-sourced — **verify before use**): sales@chalkstreamfoods.co.uk / 01794 330000. This is a general sales line; ideal is the named welfare/technical manager — find on LinkedIn first.

## The sale shape (land small, expand)
1. **Entry: £79/mo UK FHI** — the legal must-have base layer (AW1 / EA discharge / movement docs / disease notification calendar). Below the decision-bar, fastest yes, most likely first card. Link: https://buy.stripe.com/aFa5kF3K41465g9fL28k90B
2. **Expand: £499/mo RSPCA Aquaculture** — the gap-analysis + audit-pack that maps directly onto the July-2025 refresh. Link: https://buy.stripe.com/8x28wR0xS7su23X7ew8k90z
3. Offer a **free 1-month RSPCA pilot** to remove all risk (needs your authorization — gate below).

## Cover note — DRAFT (do not send until gates cleared)
> Subject: RSPCA Assured trout — the 177 new clauses, as a gap-check not a binder
>
> Hi [NAME],
>
> Quick, specific one. The RSPCA Assured trout standard refresh that came into force last July added 177 clauses — whole-slaughter CCTV, welfare-outcome scoring, banned stun methods. Most farms are re-papering that by hand right now.
>
> We've turned the standard into a gap-check: you put in your operating data (stocking density, water chem, mortality, AMU, stun method), it returns a pass/fail against every clause and an audit-ready pack your assessor recognises — regenerated automatically when the standard changes.
>
> It's £79/mo for the CEFAS/EA/movement-record base layer, £499/mo for the full RSPCA gap-analysis + evidence pack. Every output is cryptographically signed and independently verifiable — nothing to take on trust.
>
> Worth a 20-minute look? I can run your last assessment through it on a free month so you see your own gap list before deciding.
>
> [Nick — signature/provenance line goes here once confirmed]

## Illustrative sample output (clearly labelled — NOT a real ChalkStream assessment)
*This is a synthetic example of what `meok-rspca-aquaculture-mcp` returns, to show in the call — not real farm data.*

```
gap_analysis(species="trout", farm_data={
  stocking_density_kgm3: 28 (raceway), ph: 7.2, dissolved_oxygen_mgl: 8.1,
  ammonia_mgl: 0.01, water_temp_c: 14, mortality_pct_day: 0.12,
  has_vhp: true, has_cctv_at_slaughter: false, has_welfare_officer: true })

→ score_pct: 82.4   status: conditional-pass   critical_fails: 1
  CRITICAL  T-G2  CCTV at killing point — MISSING (mandatory since Jul 2025)
  major     T-D1  Operational welfare indicators — no monthly OWI scoresheet on file
  pass      T-B1  stocking density 28 ≤ 35 kg/m³ raceway limit ✓
  pass      T-B2  water quality within range ✓
  remediation #1: install slaughter-point CCTV, 90-day retention (T-G2)
```
The "one critical fail = CCTV" is exactly the kind of finding that makes a re-papering farm pay — it's specific, dated, and tied to their assessor's checklist.

## TWO GATES before this sends (HARD STOP — your call, Nick)
1. **Provenance:** the broader outreach set leans on "I run a trout operation." Confirm that's *literally* true (you have a fish farm — is it trout?). If not, the cover note above is already neutral and doesn't claim it; keep it that way. We do not fake provenance — that's the whole principle.
2. **Authorization to send + free-pilot offer:** confirm you want to (a) send, (b) offer a free month. Also verify the contact is the right person (find the welfare/technical manager on LinkedIn, not the general sales inbox).

*Do NOT link meok.ai/aquaculture in the email — it's not deployed (404). The Stripe links above are the live path.*
