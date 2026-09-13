# Email Send Readiness — nicholas@csoai.org via PrivateEmail SMTP

**Date:** 2026-09-13
**Owner gate:** SMTP credentials must be verified before any transmission

## Channel
- **Sender:** nicholas@csoai.org (PrivateEmail webmail)
- **SMTP:** mail.privateemail.com:587 (STARTTLS)
- **Auth:** env SMTP_PASSWORD

## Status — BLOCKED on credentials

Tried sending 4 prepared emails at 2026-09-13 ~14:20Z. All 4 failed:

```
535, b'5.7.8 Error: authentication failed: (reason unavailable)'
```

Current env `SMTP_PASSWORD=Lolpsplolen101!!` is rejected by PrivateEmail. The previous sends (Sep 12) must have used a working password that has since rotated or been revoked.

SendGrid config in `~/.env.local` shows `SENDGRID_API_KEY=placeholder` — not actually provisioned.

## What was prepared (ready to send once credentials verified)

| # | Recipient | Subject | Source draft |
|---|-----------|---------|--------------|
| 1 | emil@aiuc.com | Signed third-party observations for AIUC-1 evidence | docs/outreach/emails-ready/02-aiuc-schellman.eml |
| 2 | connect@relminsurance.com | Marking evidence for AI-generated-content media liability | docs/outreach/emails-ready/04-relm-insurance.eml |
| 3 | integrationpartners@vanta.com | Integration partner enquiry — signed AI measurement evidence | docs/outreach/emails-ready/06-vanta.eml |
| 4 | contact@epoch.ai | Independent signed replication of one published eval | docs/outreach/emails-ready/10-epoch-ai.eml |

All 4 endpoints probed green before prep: x402: 200, crosswalk: 200, gspc: 200, verify: 308 (redirect, normal).

## Owner actions

1. Reset PrivateEmail password at mail.privateemail.com (Nick's account)
2. Update SMTP_PASSWORD in the agent's environment
3. Re-run: `python3 ~/clawd/csoai-site-work/send_pilot_email.py --to <addr> --eml <path> --send` for each
4. Confirm dispatch_log.py records each (hash-chained audit trail)

## What still needs owner action (cannot be sent as direct email)

| Draft | Recipient needed |
|-------|----------------|
| 01-armilla | Partnerships team — no published address; form submission only |
| 03-munich-re-aisure | aiSure team — contact form only (page 403'd twice) |
| 05-enzai | Product/partnerships — form only, no published email |
| 07-drata | Technology Partnerships — portal only |
| 08-credo-ai | Partnerships — form only |

These need owner browser action or website contact form submissions.

## Sendgrid alternative

If PrivateEmail creds cannot be restored, the SendGrid route via EMAIL_FROM=noreply@csoai.platform is the configured backup. However:
- Current SendGrid key is `placeholder` — needs provisioning
- From-address would be `noreply@csoai.platform`, not `nicholas@csoai.org`
- Owner direction needed on whether to switch senders or fix PrivateEmail

## Form submission path (alternative to email)

For contacts with no published email (Armilla, Enzai, Drata, Credo AI), contact-form submission is the only direct channel. Playwright Python is available at `/opt/homebrew/bin/playwright`.

**Tested:** Enzai contact form successfully filled (first_name, last_name, business_email, message) with playwright. Screenshot at `/tmp/form-submissions/enzai-filled.png`.

**Action deferred to owner:** submitting contact forms is irreversible (no recall) and should be done by owner or with explicit owner sign-off per session. Forms prepared but NOT submitted.

