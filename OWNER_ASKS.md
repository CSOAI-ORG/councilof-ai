# OWNER ASKS — current external blockers that need a human

Single source of truth. Update when state changes. Do not scatter through reports.

Last updated: 2026-09-17 (M4 ROUND 3 brief, evening cycle)

---

## 1. RunPod — API key rotation (CRITICAL, BLOCKING)

**State**: DEAD to us.
**Evidence**: stored API key returns HTTP 403; pod SSH endpoint 194.26.196.156:22081 closed; ASI watchdog logged 569 consecutive failures against it.
**Reason**: key was exposed in a transcript; must be treated as burned until the owner rotates.
**Owner action**: rotate the RunPod API key in the RunPod dashboard and store the new value in `~/.runpod_api_key` (mode 0600) or `$RUNPOD_API_KEY` env var.
**Exact command after rotation**:
```bash
echo -n "$NEW_RUNPOD_API_KEY" > ~/.runpod_api_key
chmod 600 ~/.runpod_api_key
# then verify:
curl -sS -H "Authorization: Bearer $(cat ~/.runpod_api_key)" https://api.runpod.io/v2/health
```
**Until done**: M4 does not write any job that assumes RunPod. ASI watchdog is paused.

---

## 2. GitHub Actions — account restriction (CRITICAL, BLOCKING)

**State**: DEAD.
**Evidence**: `gh workflow run` → HTTP 422 "Actions has been disabled for this user". Ticket #4720908, day 15. Last run of any workflow 2026-09-15T08:06Z.
**Reason**: GitHub-side account-level restriction (not a workflow YAML issue).
**Owner action**: file a support ticket at https://support.github.com/contact or reply to the existing #4720908 thread. Request re-enable of Actions on the CSOAI-ORG account.
**Until done**: NO deploys, NO card signing (the signer runs OIDC inside Actions), NO GHA cron. Every PR today gets zero checks; that is the absence of a gate, not a pass. Land work locally and say it is ungated.

---

## 3. Board signing key — unreachable (BLOCKING for board signatures)

**State**: UNREACHABLE.
**Reason**: the approved signer runs inside GitHub Actions (OIDC), which is dead (see #2).
**Owner action**: until #2 is resolved, the board key cannot sign. Until then, every signature on this estate carries `signer_authority=NOT_ESTABLISHED` (per M4 ROUND 1 #2610). Per-machine Ed25519 harvest key is used for HARVEST/STAGE signatures; it NEVER carries board authority.
**Until done**: nothing emits a board-authoritative signature. The reconciliation artifact names this as one of the 6 EXTERNAL blockers.

---

## 4. COSE interop key — NEVER USE (FORBIDDEN, ALWAYS)

**State**: FORBIDDEN.
**Location**: `~/.csoai-keys/cose-interop-1.pem` (exists, different system's key).
**Reason**: it is a different system's key. Using it to fill `sig:null` would be forgery.
**Owner action**: NONE — do not touch. Do not delete (might be needed by that other system).
**Until done (forever)**: the COSE interop key is NEVER used by any CSOAI process. The rule is enforced by `scripts/test_harvest_signature_authority.py` (proves COSE untouched) and by code review.

---

## 5. xAI spending limit — Grok unreachable (BLOCKING for xAI models)

**State**: BLOCKING.
**Evidence**: xAI OAuth returns HTTP 403 `personal-team-blocked:spending-limit`. Hermes reports this as the OWNER escalation in `bash scripts/ops/hermes-align.sh`.
**Reason**: paid subscription's spending limit hit.
**Owner action**: raise the spending limit at the xAI console: https://console.x.ai → Billing → Spending limit. The OAuth session itself is healthy.
**Until done**: xAI Grok models do not run in any cycle. The cycle's `surfaces_failed` list will include any xAI-lab advisory staging.

---

## 6. Cloudflare zone — browser-integrity check (BLOCKING for machine-client readback)

**State**: BLOCKING for plain urllib/libwww-perl clients.
**Evidence**: `councilof.ai` answers HTTP 403 (Cloudflare error 1010, Browser Integrity Check) to plain Python clients.
**Reason**: Cloudflare zone-level browser-integrity setting. Hits the public surface, NOT our anonymous HF mirror.
**Owner action**: adjust the Cloudflare zone setting (Security → Bots → Bot Fight Mode, or Security → Settings → Browser Integrity Check). The public surface must serve the public; machine clients following our published instructions currently get 403.
**Until done**: `councilof.ai` is authoritative but NOT anonymously readable by urllib. **HF is the only anonymously-readable surface**, which is why the cycle mirrors there first and reads back ANONYMOUSLY.

---

## Summary

| # | Blocker | State | Owner-needed |
|---|---------|-------|--------------|
| 1 | RunPod key rotation | DEAD | YES — rotate at dashboard |
| 2 | GitHub Actions | DEAD | YES — file ticket |
| 3 | Board signing key | UNREACHABLE (depends on #2) | PASSIVE |
| 4 | COSE interop key | FORBIDDEN | NEVER (do not touch) |
| 5 | xAI spending limit | BLOCKING | YES — raise limit |
| 6 | Cloudflare zone setting | BLOCKING | YES — adjust zone |

**Until a blocker is resolved by its owner action, the estate runs without it. Nothing is faked, no workaround obscures the wait.** This is the contract; mirrors and readbacks make the contract verifiable from a stranger's machine.
