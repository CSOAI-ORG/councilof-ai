# OEM resend — 17 May 2026 (post-Omnibus push)

**Why now**: the 7 May 2026 EU Digital Omnibus political agreement accelerated
the Article 50 AI-generated-content transparency deadline from 6 months to
3 months past application — meaning **2 December 2026 is the hard
watermarking-compliance cliff**, ~199 days out. That's the urgency this
follow-up rides.

**Why this OEM resend will land better than the first one**: the first email
had CTAs going to `nicholas@csoai.org` (severed-brand domain that wasn't
being read). 33 page CTAs were silently sending leads to a dead inbox.
That's fixed now (commit `revenue rescue`, deployed to meok.ai). So leads
this round actually reach you.

## Subject line — pick one

**A** (urgency-first):
> 199 days until the Article 50 watermarking cliff — slot opening this week

**B** (specific-prospect):
> Re: AI compliance — Omnibus just pulled your Article 50 deadline forward to 2 Dec 2026

**C** (audit-first):
> 48-hour compliance audit slot — opening Thursday, three left

I'd ship **B**. It frames a specific, falsifiable fact ("Omnibus pulled your
deadline forward") rather than a generic marketing line.

## Body — copy-paste, personalise the first line

```
Hi [name],

Quick update on the EU AI Act since we last spoke.

The 7 May 2026 Digital Omnibus political agreement accelerated the Article
50 AI-generated-content transparency deadline. It now lands on
2 December 2026 — that's 199 days out from today, down from the previous
6-month grace window.

If [Company] ships any generative AI to the EU market, by 2 Dec 2026 you
need:
- Machine-readable AI-origin marking on every generative output (C2PA or
  equivalent)
- First-interaction disclosure to end users
- Deployer disclosure for deepfakes / AI-manipulated public-interest text
- A signed attestation of the marking pipeline for audit defence

We just published a one-question check at meok.ai/scorecard that maps your
posture against Articles 4, 6, 9, 14, 26(9), 43, 50 and 72. Takes 60
seconds. Output is a signed gap report.

If you want the 48-hour pre-certification audit (£5,000, signed gap
report + remediation roadmap), I have one slot opening this Thursday.
buy.stripe.com/4gM7sN2G0bIKeQJfL28k833

Either way, hit reply with where you're stuck.

Nicholas
MEOK AI Labs
Companies House 16939677
nicholas@meok.ai
```

## Where each link goes (so you can verify before sending)

- **meok.ai/scorecard** → 10-question form, scoring is local, submit POSTs
  to attestation-api/sign + Buttondown subscribe. Live and working as of
  17 May 2026.
- **buy.stripe.com/4gM7sN2G0bIKeQJfL28k833** → £5,000 48h Gap Analysis,
  live Stripe link from council-ai-storefront.

## 5 prospects to hit first (per memory: 26 OEMs already in the pipeline)

The first 5 outreach already-sent recipients have the highest signal because
they've seen your earlier mail (warm) but couldn't reach you (broken
inbox). Send to those first. Then work down the remaining 21.

Track replies in `revenue/oem_replies_2026-05-17.md`.

## What I expect

- **Open rate**: 35-50% (warm follow-up + specific deadline)
- **Reply rate**: 5-15% (~1-4 replies across 26)
- **Booked calls**: 2-4
- **Converted to £5k audit**: 0-1
- **Converted to £79/mo + £199/mo**: 0-2

That's a realistic £5k-£10k revenue range from one resend cycle. The next
move is repeating this monthly with fresh deadlines + fresh evidence.
