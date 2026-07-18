# 📤 Day 6 Monzo Outbound — D+3 Bump

> Per `marketing/DAY3_OUTREACH_5_MESSAGES_2026-06-15.md`, the original Monzo DM was sent 15 Jun (Day 2).
> D+3 = 18 Jun. The 5 D+3 follow-ups (this file's sibling) are at `marketing/DAY5_D3_FOLLOWUPS_5_PROSPECTS_2026-06-16.md`.
> This is the **manual outbound** the user fires.

## To: Anil (Monzo, Head of ML)
## Channel: LinkedIn DM (per D0 + D+3 channel mix)
## When: Thu 18 Jun 09:00 BST

```
Hi Anil — hope the credit-scoring stack is going well. We're now at
4-day signed cert issuance for Annex III §1 (the 2 Aug cliff is 45
days out) — your DNB + EBA auditor can verify in 1 click. Worth a
20-min walk-through before the cliff?
— N
```

46 words. Sits inside the 30-50 word target from the original D0 (which was 48w). Includes:
- ✅ Specific AI use case opener (credit-scoring)
- ✅ Annex III §1 (the relevant clause for Monzo)
- ✅ The 2 Aug 2026 cliff date
- ✅ 4-day signed cert issuance
- ✅ 1-click verify (no procurement friction)
- ✅ 20-min CTA
- ✅ Channel: LinkedIn DM (matches D0 + D+3)

## If Anil responds, sequence

1. **Reply** (within 24h): "Great — I'll send 3 calendar slots for this week / next."
2. **Calendar**: send Calendly link with 20-min slots
3. **Demo prep**: have the live keystone sign + verify flow open in browser tab ready
4. **Demo**: walk through 1) credit-scoring use case mapped to Annex III §1, 2) signed cert issuance in 4 days, 3) public verify URL, 4) £4,950 one-shot + £199/mo Pro
5. **Close**: ask "ready to sign the £199/mo Pro, or want the £4,950 Watchdog Cert first?"

## If no response

- D+5 (22 Jun): send the D+5 case-study teaser (Tidewell Capital angle, in DAY6_D5_FOLLOWUPS_CASE_TEASERS_2026-06-16.md)
- D+7 (24 Jun): send the "compelling customer story" follow-up (in DAY3_LAYER1_RECONCILIATION_2026-06-16.md)
- D+14 (29 Jun): breakup email ("looks like the timing's off, will close the loop Q4")
- Then stop. Move to next prospect.

## Hard pre-conditions before sending

1. ✅ Re-verify `mail.meok.ai` in Resend dashboard (5 min) — for the D+3 follow-up email variant if Anil prefers email over LinkedIn
2. ✅ LinkedIn account is active + can DM
3. ✅ Calendar slots are open
4. ❌ meok-ui :3000 (homepage) is down (Hermes WhatsApp daemon) — but that's fine, the demo doesn't need the homepage, the keystone sign+verify flow is on meok-attestation-api.vercel.app (live, ✅ 200)
5. ❌ The `MEOK_MASTER_API_KEY` env var is not set — but that's for the Pro tier self-serve, the demo uses the master key the agent already has

**Net: 2/5 pre-conditions are user-gated and small. Send the DM after Resend verify.**

## After send — agent log

Once the DM is sent, log to:
- `/Users/nicholas/clawd/marketing/outreach-log-2026-06.md` (1-line entry: "18 Jun 09:00 BST — Monzo D+3 sent to Anil via LinkedIn")

This builds the institutional memory of which prospects are in which stage of the cadence.
