# Manual Email Send Runbook
**Date:** 2026-06-17  
**Purpose:** Send the 40 staged emails without automated SMTP scripts  

---

## Files

All email drafts are in `/Users/nicholas/clawd/outreach-system/emails/`.

| Batch | Folder | Count |
|-------|--------|-------|
| Keystone warm intros | `keystone-warm-intro-2026-06-16/` | 5 |
| Care home cold outreach | root `outreach-system/emails/` (pattern `##_CH-###_initial.txt`) | 30 |
| D+10 follow-ups | `keystone-d10-followup-2026-06-25/` | 5 |
| **Total** | | **40** |

---

## Format

Each `.txt` file contains:

```
TO: recipient@example.com
SUBJECT: Email subject line

Body text...
```

## Sending via any email client

1. Open the `.txt` file.
2. Copy the `TO:` address.
3. Copy the `SUBJECT:` line.
4. Copy the body (everything after the blank line).
5. Paste into your email client.
6. Send from `nicholas@csoai.org` or your configured sending address.

## Rate limits

- **Keystone warm intros:** send all 5 in one batch (high priority).
- **Care home cold outreach:** send 10 per day over 3 days to protect sender reputation.
- **D+10 follow-ups:** schedule for 2026-06-25.

## Cert attachments

The 5 keystone emails reference attached sovereign attestation certificates. The cert bundles are in:

`outreach-system/emails/keystone-warm-intro-2026-06-16/cert_bundles/`

Attach the relevant JSON file to each keystone email:

| Email | Cert file |
|-------|-----------|
| 01_MONZO.txt | `monzo-ml-credit-v3_cert.json` |
| 02_CERA.txt | `cera-care-allocator-v2_cert.json` |
| 03_ACCURX.txt | `accurx-clinical-messaging_cert.json` |
| 04_ONFIDO.txt | `onfido-biometric-v3_cert.json` |
| 05_FACULTY.txt | `faculty-frontier-safety-eval_cert.json` |

## Tracking

After sending, append to `outreach-system/sent-log.jsonl`:

```json
{"file": "outreach-system/emails/keystone-warm-intro-2026-06-16/01_MONZO.txt", "to": "press@monzo.com", "subject": "...", "sent_at": "2026-06-17T10:00:00Z", "status": "sent_manual"}
```

## Automated alternative (once SMTP creds drop)

```bash
cd /Users/nicholas/clawd
python3 outreach-system/send_all.py --batch keystone
python3 outreach-system/send_all.py --batch care --limit 10 --delay 60
python3 outreach-system/send_all.py --batch followup
```
