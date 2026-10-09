# COMMERCIAL STATUS — 2026-09-14T07:30 UTC

## DONE-WHEN

| Condition | Status | Evidence |
|-----------|--------|----------|
| NIST sent (Sent header) | **BLOCKED** | Both passwords fail: keychain "NetworkNick1234!!" → 535, user "TesTes123@#$" → 535. himalaya envelope list -f Sent -s 5 → auth failure. Governor must reset password at privateemail.com webmail. |
| FDIC paste file on master | ✅ MERGED | PR #2219, docs/filings/FDIC-PASTE-2026-09-18.md |
| NLnet draft on master | ✅ MERGED | PR #2219, docs/grants/nlnet-2026-11.md (revenue fixed 0→0.02) |
| 5 status lines dated | ✅ MERGED | docs/outreach/drafts/DIRECTORY-STATUS-2026-09-14.md |
| 5 target drafts reviewed | ✅ ALL PASS | 5 files, all ≤120 words, 0 banned words in body |

## Funnel drafts (verified)
- chainlink-ccip.md: 106 words ✅
- layerzero-stargate.md: 87 words ✅
- network-firm-attestation.md: 117 words ✅
- evertas-custody-insurance.md: 109 words ✅
- journalist-wrapped-asset.md: 116 words ✅

## x402-list fields
- docs/outreach/drafts/x402-list-fields.md: already submitted, compliance A (14/14)

## PROOF
himalaya envelope list -f Sent -s 5 → "cannot authenticate to IMAP server"
Both passwords tested and rejected by server.

## Governor action
1. Log into privateemail.com webmail with nicholas@csoai.org
2. Check/reset password
3. Then: security delete-generic-password -s meok-keystone -a PRIVATEMAIL_PASSWORD && security add-generic-password -s meok-keystone -a PRIVATEMAIL_PASSWORD -w 'NEW_PASSWORD'
4. Then himalaya send

## 2026-09-14T07:40 UTC — NIST re-verification

Root drift detected: 291→298. PR #2316 merged (root count fix).
Revenue: $0.02 — unchanged, matches doc.
Word count: 1,060 — unchanged.
Witness pointer: 2026-09-14T04:13:39Z.

NIST comment on master: VERIFIED ACCURATE (298 root, $0.02, 1,060 words).
NIST email: BLOCKED (mailbox auth — governor must reset password).
