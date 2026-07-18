# Email Send Manifest — 2026-06-17
**Agent:** JEEVES  
**Status:** Ready to send once `EMAIL_ADDRESS` + `EMAIL_PASSWORD` are in `~/clawd/.env.local`

---

## Summary
| Category | Count | Priority |
|----------|-------|----------|
| Care home cold outreach (Templeman Opticians) | 30 | P1 |
| Fintech/regulator warm intros (MEOK keystone certs) | 5 | P0 |
| Fintech/regulator D+10 follow-ups | 5 | P1 |
| **Total ready-to-send files** | **40** | — |

**Note:** The historical "95 staged emails" figure likely includes csoai-dashboard database contacts (subscribers, users, applications). Those can be exported from the VM MySQL via `export-all-emails.ts` once `DATABASE_URL` is available locally.

---

## Batch 1 — Fintech Keystone Warm Intros (P0)
**Folder:** `outreach-system/emails/keystone-warm-intro-2026-06-16/`  
**Send immediately after SMTP credentials are set.**

| # | File | To | Subject |
|---|------|-----|---------|
| 1 | `01_MONZO.txt` | press@monzo.com | Monzo x MEOK — Article 50 readiness for your high-risk credit-scoring model |
| 2 | `02_CERA.txt` | ... | Cera x MEOK — EU AI Act attestation for care-scheduling ML |
| 3 | `03_ACCURX.txt` | ... | AccuRx x MEOK — Clinical messaging Article 50 readiness |
| 4 | `04_ONFIDO.txt` | ... | Onfido x MEOK — Biometric verification Article 50 readiness |
| 5 | `05_FACULTY.txt` | ... | Faculty x MEOK — Frontier safety eval attestation |

Each email includes an Ed25519-signed sovereign attestation certificate under `cert_bundles/`.

---

## Batch 2 — Care Home Cold Outreach (P1)
**Folder:** `outreach-system/emails/`  
**Pattern:** `##_CH-###_initial.txt`

30 care homes in Essex. Each email is personalized with care home name, contact name, and location. Templates are ready; no further drafting needed.

**Send rate:** 10 per day over 3 days to avoid spam reputation issues.

---

## Batch 3 — Fintech D+10 Follow-ups (P1)
**Folder:** `outreach-system/emails/keystone-d10-followup-2026-06-25/`  
**Scheduled send:** 2026-06-25 (D+10 after initial keystone send)  

5 follow-up emails to Monzo, Cera, AccuRx, Onfido, Faculty.

---

## Send Command (post-credentials)
```bash
cd /Users/nicholas/clawd

# Dry run first
python3 outreach-system/send_all.py --dry-run

# Send only the 5 fintech warm intros (P0)
python3 outreach-system/send_all.py --batch keystone

# Send care-home cold outreach, 10/day
python3 outreach-system/send_all.py --batch care --limit 10 --delay 60

# Send D+10 follow-ups on 2026-06-25
python3 outreach-system/send_all.py --batch followup

# Full blast (use cautiously)
python3 outreach-system/send_all.py
```

`send_all.py` exists and tested: `python3 outreach-system/send_all.py --dry-run` parses all 40 emails successfully.

---

## Verification
After send:
- Check SMTP logs / inbox for bounces.
- Confirm 40 messages accepted by outbound server.
- Update `outreach-system/sent-log.jsonl` with timestamps and bounce status.

---

*Manifest prepared. Awaiting SMTP credential drop.*
