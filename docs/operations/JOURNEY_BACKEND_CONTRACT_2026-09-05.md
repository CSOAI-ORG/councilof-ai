# JOURNEY BACKEND CONTRACT — propose→approve→fix→retest→receipt (spec, 2026-09-05)
The journey's runtime for propose→receipt is absent (/api/ras /remediation /jobs all 404).
Do NOT build UI over a missing backend. This spec names the backend contract to build first:

1. /api/jobs  POST {tool_spec} -> {job_id, status:"queued"}   (create a fix/re-test job)
               GET {job_id}       -> {status, artifacts[]}
2. /api/receipts POST {job_id, verification} -> {receipt_id}  (append-only, Ed25519-signed)
               GET {receipt_id}   -> {receipt} (stranger-verifiable)
3. /api/remediation GET {job_id}  -> {change_set, applied:bool}
- All writes append-only + signed (corrections-ledger honest-history rule).
- No success without a verifiable receipt. Receipts retained by subjects (Merkle != completeness).
- Build order: jobs -> receipts -> remediation. Then UI is permitted.
