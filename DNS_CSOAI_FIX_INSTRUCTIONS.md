# 🛠️ DNS Fix: csoai.org Domain Verification

I have audited the DNS for `csoai.org` against the Resend verification requirements. I identified **4 critical errors** causing the `not_started` status.

## 1. Multiple SPF Records (CRITICAL)
**Error:** Your domain has 3 separate SPF records. This is invalid per RFC 7208 and causes deliverability to fail.
**Action:** Remove all current TXT records on `@` starting with `v=spf1` and replace them with this single merged record:

| Type | Host | Value |
| :--- | :--- | :--- |
| TXT | `@` | `v=spf1 include:spf.resend.com include:spf.privateemail.com include:amazonses.com ~all` |

## 2. Missing `send` Subdomain MX (REQUIRED)
**Error:** Resend requires a custom mail-from subdomain (`send.csoai.org`) for bounce processing. The MX record is missing.
**Action:** Add this new record:

| Type | Host | Value | Priority |
| :--- | :--- | :--- | :--- |
| MX | `send` | `feedback-smtp.us-east-1.amazonses.com` | 10 |

## 3. Missing `send` Subdomain SPF (REQUIRED)
**Error:** The `send` subdomain also needs its own SPF record for verification.
**Action:** Add this new record:

| Type | Host | Value |
| :--- | :--- | :--- |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |

## 4. Duplicate/Conflicting DKIM (CLEANUP)
**Error:** I found two DKIM records on `resend._domainkey`. One is correct (from the email), the other is stale.
**Action:** Remove the record starting with `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDJTpYdI07...` and **KEEP** only the one matching the email:

| Type | Host | Value |
| :--- | :--- | :--- |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDaXJcPxp0qk6QCHghvKhxLPw1Uxk1GRqaZ47DJ0eVB/CXYLB1+oI5d/XPrk2HaPVzwrPBbDaJ96C/xxJNnRzUE+QnMsd21zgFEDgCVcqJY7JLyojP9JRHWDZ7fSlcc6BkGxnqgr9ltWIKh04akCq43Tlqs1wH1oMIp5F2T69cYGQIDAQAB` |

---
**Verification:** Once these are added in Namecheap, I will run a re-audit to confirm.
