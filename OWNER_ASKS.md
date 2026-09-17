# OWNER ASKS — current external blockers + handoff items

Single source of truth. Updated when state changes. Do not scatter through reports.

Last updated: 2026-09-17 (per realignment brief 11:18 UTC)

---

## 1. RunPod — SSH heartbeat (BLOCKING, owner diagnostic only)

**State**: SSH heartbeat to `194.26.196.156:22081` timed out during the 17 Sep audit.
**Evidence**: `ssh -i /Users/nicholas/.runpod/ssh/runpodctl-ssh-key -p 22081 root@194.26.196.156 'date -u; cat /workspace/csoai-operations/state/latest.json'` timed out at 11:11 UTC.
**Lowest-risk first step** (run from a connected owner terminal):
```bash
ssh -i /Users/nicholas/.runpod/ssh/runpodctl-ssh-key -p 22081 root@194.26.196.156 'date -u; cat /workspace/csoai-operations/state/latest.json'
```
**Until done**: RunPod is **historical evidence only**. The mill ID `fpowppss5ngtkw` is not verified live. **Do not reset the mill or start A100 `l7g747oivyq6ab`** — owner-only call.
**Owner action**: Diagnose networking/endpoint identity from a connected terminal. Save the diagnostic output to `~/clawd/councilof-ai-work/receipts/runpod-heartbeat-<date>.json`.

---

## 2. GitHub Actions — disabled account-wide (CRITICAL, BLOCKING)

**State**: DEAD.
**Evidence**: `gh workflow run` → HTTP 422 "Actions has been disabled for this user". Ticket #4720908, day 15. Last run 2026-09-15T08:06Z.
**Owner action**: file a support ticket at https://support.github.com/contact or reply to ticket #4720908.
**Until done**: NO deploys, NO card signing (signer is OIDC inside Actions), NO GHA cron. Every PR today gets zero checks; that is the absence of a gate, not a pass. Land work locally and say it is ungated.

---

## 3. Board signing key — UNREACHABLE (depends on #2)

**State**: UNREACHABLE.
**Reason**: the approved signer runs inside GitHub Actions (OIDC), which is dead.
**Until done**: every signature on this estate carries `signer_authority=NOT_ESTABLISHED`. Per-machine Ed25519 harvest key is used for HARVEST/STAGE signatures; it NEVER carries board authority.
**Owner action**: When #2 is resolved, re-sign the live board with the canonical signer. The board drift (`SUPERSEDED_KNOWN_CLAIM_DEFECT`) is closed by this ceremony.

---

## 4. COSE interop key — NEVER USE (FORBIDDEN)

**State**: FORBIDDEN.
**Location**: `~/.csoai-keys/cose-interop-1.pem`.
**Reason**: different system's key. Using it would be forgery.
**Owner action**: NONE — do not touch. Do not delete (might be needed by that other system).

---

## 5. xAI spending limit — Grok unreachable

**State**: BLOCKING.
**Evidence**: xAI OAuth returns HTTP 403 `personal-team-blocked:spending-limit`.
**Owner action**: raise the spending limit at https://console.x.ai → Billing → Spending limit.

---

## 6. Cloudflare zone setting — machine clients 403'd

**State**: BLOCKING for plain urllib clients.
**Evidence**: `councilof.ai` answers HTTP 403 (Cloudflare error 1010, Browser Integrity Check) to plain Python clients.
**Owner action**: adjust the Cloudflare zone setting (Security → Bots → Bot Fight Mode, or Security → Settings → Browser Integrity Check).
**Until done**: anonymous readback of `councilof.ai` works because we use Mozilla UA; the browser-integrity check is bypassed. If the check tightens, our anonymous verification breaks.

---

## 7. HuggingFace token + org-write scope — BLOCKING HF mirror publication

**State**: token exists, but org-write scope is missing.
**Evidence**: keychain entry is `meok.ai`. Token authenticates but rejects org-write to `csoai/*` with HTTP 401 "Repository Not Found". `api.create_repo("csoai/standing-cycle")` returns 401 Unauthorized.
**Owner action**: at https://huggingface.co/settings/tokens — confirm the stored token has `write` scope AND your user is a member of the `csoai` org. If the token is fine but the org membership is missing, request org admin to add you at https://huggingface.co/organizations/csoai/settings/members.
**Until done**: every cycle's HF write fails honestly with `WRITE_FAILED` in the manifest. NO silent pass.

---

## 8. Kaggle — CLI not authenticated

**State**: BLOCKED at the public-readback layer.
**Evidence**: `kaggle datasets list --user csoai` returned "NOT AUTHENTICATED / no datasets returned". Historical reports saying "2 active datasets" are not a current anonymous verification.
**Owner action**: either (a) authenticate via `~/.kaggle/kaggle.json` then verify with anonymous HTTP, or (b) drop the live claim from public copy. Per the realignment brief: "Do not call Kaggle live or complete until a public readback is made."

---

## 9. Live board re-signing ceremony (depends on #2)

**State**: WAITING.
**Reason**: the live arrays say `23/22/1`; the preserved signed board snapshot says `22/22/0` and is marked `SUPERSEDED_KNOWN_CLAIM_DEFECT`. Re-signing is an owner ceremony.
**Owner action**: when #2 resolves, the board will be re-signed with the canonical signer. Until then, the drift is explicit in `/api/state`.

---

## 10. The 4 open M4 PRs — human review in an isolated canonical checkout

Per the realignment brief's ranked work queue #2–4:
- **#2611** signer authority is a field, Rekor counts only real submissions, axis↔corpus reconciled
- **#2612** m4 round 2: falsifiable proof cited, integrity patch reconciled, public-root churn measured
- **#2615** m4 round 3: evidence object, surface list, one door, standards bridge
- **#2591** OTS batch v17: 236 proofs (manifest 915)

**All with no checks because Actions is disabled.** Do not merge because the checks list is empty.

---

## 11. Email-first funding packet — PREPARE, DO NOT SEND

Per the realignment brief:
- Anthropic EOI (needs named clinical collaborator + IRB design — currently a poor fit)
- Founder CV (explicit missing fields: education, employment history, dates)
- Clinician/collaborator proposition
- C2PA conformance-admin seat, DIF contributor status, two W3C Community Groups, three IETF lists — warm written contexts

**No calls, no cold campaign, no claims of partnership.**

---

## 12. Revenue rule — preserve the one observed non-self settlement

Per the realignment brief:
- Current `/api/revenue`: SKU-1 = 8 issuances, MEASURED from REVENUE_KV
- One 0.02 USDC settlement, 1 distinct non-self payer
- Gate for adding SKUs: **at least 5 distinct payers in 30 days**; **repeat payer** is the next useful signal
- **Do not add SKUs**. Do not use self-funded tests as demand.

---

## Summary

| # | Item | State | Owner-needed |
|---|------|-------|--------------|
| 1 | RunPod SSH heartbeat | TIMEOUT | YES — diagnose from connected terminal |
| 2 | GitHub Actions | DEAD | YES — file/reply ticket |
| 3 | Board signing key | UNREACHABLE | PASSIVE (depends on #2) |
| 4 | COSE interop key | FORBIDDEN | NEVER |
| 5 | xAI spending limit | BLOCKING | YES — raise limit |
| 6 | Cloudflare zone setting | BLOCKING | YES — adjust zone |
| 7 | HF token org-write | BLOCKING | YES — token scope + org membership |
| 8 | Kaggle CLI | BLOCKED | YES — auth or drop claim |
| 9 | Board re-signing | WAITING | YES (depends on #2) |
| 10 | 4 open M4 PRs | NEEDS REVIEW | YES — human review, no checks |
| 11 | Email-first funding packet | PREPARE | YES — draft, do not send |
| 12 | Revenue rule | IN FORCE | NO — wait for repeat payer |

**Until a blocker is resolved, the estate runs without it. Nothing is faked, no workaround obscures the wait.**
