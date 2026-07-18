# 📧 Monzo Email Variant (backup to LinkedIn DM)

> Per the morning rundown, the Monzo D+3 bump is the highest-leverage 10-min user action.
> LinkedIn DM is the primary channel. This is the **email backup** in case:
> - LinkedIn is disconnected
> - Anil prefers email
> - The D+3 LinkedIn DM doesn't get a response in 72h (use email for D+5 instead)

## To: press@monzo.com (or Anil's direct email if known)
## Channel: Email (via mailer, after Resend comes back)
## When: Thu 18 Jun 09:00 BST (LinkedIn first) OR Tue 22 Jun 09:00 BST (if LinkedIn fails)

```
Subject: Monzo — 4-day signed evidence for Annex III §1 (the 2 Aug cliff is 45 days out)

Hi Anil,

Hope the credit-scoring stack is going well. We're now at 4-day
signed cert issuance for Annex III §1 (the 2 Aug cliff is 45 days
out) — your DNB + EBA auditor can verify in 1 click, no contacting
us.

We're onboarding 3 banks on a Pro pilot. Worth a 20-min
walk-through before the cliff?

Live: https://proofof.ai
Real signed cert: https://meok-attestation-api.vercel.app/verify/MEOK-EUAIAC-A50-MONZO-2026

Best,
Nick Templeman · Founder, MEOK AI Labs · CSOAI Ltd (UK Companies House 16939677)
hello@meok.ai
```

## Why this version is different from the LinkedIn DM

| Aspect | LinkedIn DM (primary) | Email (backup) |
|--------|----------------------|----------------|
| Length | 46 words | 116 words |
| Tone | "checking in" | "we're open" |
| CTA | "20-min walk-through" | "20-min walk-through before the cliff" |
| Cert URL | (omitted — would clutter DM) | (included — proves the claim) |
| Sign-off | "— N" | Full name + title + company |
| Subject | (DM has no subject) | "Monzo — 4-day signed evidence for Annex III §1" |

## If sending via mailer (after Resend comes back)

Stage the email into the queue:

```bash
# Append to queue.jsonl
cat >> ~/clawd/hive-mailer/queue.jsonl <<'EOF'
{"to":"press@monzo.com","subject":"Monzo — 4-day signed evidence for Annex III §1 (the 2 Aug cliff is 45 days out)","body":"Hi Anil,\n\nHope the credit-scoring stack is going well. We're now at 4-day\nsigned cert issuance for Annex III §1 (the 2 Aug cliff is 45 days\nout) — your DNB + EBA auditor can verify in 1 click, no contacting\nus.\n\nWe're onboarding 3 banks on a Pro pilot. Worth a 20-min\nwalk-through before the cliff?\n\nLive: https://proofof.ai\nReal signed cert: https://meok-attestation-api.vercel.app/verify/MEOK-EUAIAC-A50-MONZO-2026\n\nBest,\nNick Templeman · Founder, MEOK AI Labs · CSOAI Ltd (UK Companies House 16939677)\nhello@meok.ai","status":"queued","campaign":"sprint-d6-monzo-email-backup","keystone_cert":"MEOK-EUAIAC-A50-MONZO-2026","queued_at":"2026-06-16 05:30:00"}
EOF
```

Then the mailer's next 30-min tick will pick it up and send it (assuming Resend `mail.meok.ai` is verified by then).

## If sending manually (now, before Resend comes back)

Just paste the body into Gmail/Outlook with the subject line and `press@monzo.com` as the to. Mark in `~/clawd/marketing/outreach-log-2026-06.md` as "D+3 Monzo sent via personal email (Resend down)".

## If both fail

Fall back to D+5 (22 Jun) case-study teaser (`marketing/DAY6_D5_FOLLOWUPS_CASE_TEASERS_2026-06-16.md`) with the Tidewell Capital angle.
