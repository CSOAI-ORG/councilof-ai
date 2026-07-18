# 📮 CSOAI Outreach — Deliverability, Warmup & Sending Runbook (B)

Goal: send the 2,363 staged drafts **without torching the csoai.org domain or hitting spam**.
This is the infra that must exist BEFORE any real send. All steps are owner-actioned.

## 0. Golden rules
- **Never send bulk from `csoai.org`.** Use a **separate sending subdomain/domain** so a spam hit
  can't poison your main-domain reputation or your Stripe/transactional email.
- Personalized + opt-out is already in every draft. Keep it that way.
- **Legal (UK/EU):** B2B cold email is allowed under **legitimate interest** (GDPR Art. 6(1)(f)) / PECR
  for corporate subscribers, IF: relevant to their role, easy opt-out honored, clear sender identity,
  suppression list respected. Individuals (sole traders/partnerships) need more care. Keep records.

## 1. Sending domain + DNS (do once)
1. Buy/allocate a sending domain e.g. **`csoai-mail.com`** or subdomain **`mail.csoai.org`** (a subdomain
   still shares some org reputation — a separate domain is safest for cold outreach).
2. DNS records:
   - **SPF:** `v=spf1 include:<your-mta> -all`
   - **DKIM:** publish the key your MTA generates (2048-bit).
   - **DMARC:** start `v=DMARC1; p=none; rua=mailto:dmarc@csoai.org;` → tighten to `p=quarantine` after 2 wks.
   - **BIMI** (optional, later): logo + VMC once DMARC is enforced.
   - **rDNS/PTR** on the sending IP → matches the HELO hostname.
3. **Reply-to a real, monitored inbox** (a human replies). Set up `outreach@csoai.org` forwarding.

## 2. Sending infrastructure — pick one (all OSS, from the arsenal)
| Option | What | Best for |
|---|---|---|
| **Postal** (self-hosted Postmark) | outbound MTA, IP pools, delivery tracking, webhooks | ⭐ programmatic cold outreach at scale |
| **Listmonk** | Go+PG single-binary list manager | broadcast lists, simple sequences |
| **Mailcow** | full mail server | if you also want inbound mailboxes |
> Recommended: **Postal** for sending + **Listmonk** for list/suppression management. Both self-host on a
> ~$10–20 VPS. Warm the **IP + domain** together.

## 3. Warmup schedule (4–6 weeks — do NOT skip)
A cold domain/IP that suddenly sends hundreds = instant spam-folder.
| Week | Volume/day | Notes |
|---|---|---|
| 1 | 10–20 | tier 0–3 hand-picked, expect replies (engagement = reputation) |
| 2 | 20–40 | keep bounce <2%, spam-complaint <0.1% |
| 3 | 40–80 | add tier 5–8 |
| 4 | 80–150 | begin tier 9 (SEC bulk) in slices |
| 5–6 | 150–300 | steady state; pause/slow if bounce or complaints rise |
- **Verify each address before send** (SMTP/MX check) to keep bounce low — a validator (OSS: check-if-email-exists) or a paid verifier.
- Seed a few Gmail/Outlook/Yahoo test inboxes; check inbox-vs-spam placement each ramp step.

## 4. Send loop (the actual mechanics)
- Source of truth: `drafts.jsonl` (2,363) → filtered by tier → enriched with `contact_email` → verified.
- Suppression list: anyone who replies STOP, bounces hard, or complains → **never contact again** (Listmonk handles this).
- Cadence per account: initial + at most **2 follow-ups**, 4–5 days apart, then stop.
- Log every send to a sent-ledger (reuse `outreach-system/sent-log.jsonl` pattern) — and, on-brand,
  **Ed25519-sign each send** (the P9 "Governed Outbound" primitive) so every outbound is provable + opt-out-auditable.

## 5. Order of operations (checklist)
- [ ] Sending domain + SPF/DKIM/DMARC/rDNS live
- [ ] Postal (+ Listmonk) deployed, DKIM verified, test send inboxes
- [ ] Enrich tier 0–3 emails (worksheet) → verify → import
- [ ] Warmup week 1: 10–20/day, tier 0–3, monitor placement + replies
- [ ] Ramp per schedule; suppression + follow-up caps enforced
- [ ] Only after weeks of clean sending: tier 9 bulk in warmed slices

## ⛔ Owner-gated (never auto-fire)
Domain purchase, DNS, deploying Postal, verifying/enriching emails, and **every send** are yours.
M4 can build the send script (dry-run), the verifier hook, and the signed-send ledger on request.
