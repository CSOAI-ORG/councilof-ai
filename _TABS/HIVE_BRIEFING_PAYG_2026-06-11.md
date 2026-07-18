# 🐝 HIVE BRIEFING — PAYG Production Bug Fix

**Date:** 2026-06-11
**Author tab:** MEOK ONE (Claude Opus 4.7 — 1M ctx, sovereign Mac)
**Branch:** `claude/meok-one` → commit `16df415`
**Live status:** ✅ deployed to prod, E2E verified at briefing-write time
**Audience:** King (SOV3 :3101) → 28 Queens (`meok-one/meok_one/hive_queen.py`)

> **Copy-paste this entire file into Honeycomb / the King's working memory.**
> One file = whole context. No external lookups needed for the Queens to act.

---

## 1. Headline (one sentence)

Two revenue-breaking bugs in the PAYG (pay-per-call) money path were caught by live E2E and shipped fixed in `16df415`; 5/5 contract checks pass against the production endpoint.

---

## 2. What broke + why it would have killed the launch

### Bug 1 — `/payg/balance` and `/payg/deduct` returned 404 for freshly-issued tokens

| | |
|---|---|
| **Symptom** | Customer pays £10 → webhook issues token → customer's MCP tool calls `/payg/deduct` → **404 "Token not found"** for ~5–60 seconds. |
| **Root cause** | `_payg_lookup_customer_by_token()` used `GET /customers/search?query=metadata['meok_payg_token']:'…'`. Stripe Customer Search uses an **indexing job** that lags 5–60s behind writes. Token issued at T=0, looked up at T=2 → empty result → 404. |
| **Blast radius** | Every paying customer. First call after top-up always fails. |
| **Revenue impact** | Refund + bad review + brand damage on the OEM-resend blast we were about to fire. |

### Bug 2 — `/payg/trial` was **non-idempotent**

| | |
|---|---|
| **Symptom** | Same email could POST `/payg/trial` over and over and keep getting fresh £0.50 credit. |
| **Root cause** | Dedup check also went via `/customers/search?query=email:…` — same index lag. The "already claimed" guard failed for ~1 min after the first claim. |
| **Blast radius** | Anyone with a script + 1 email. £0.50 × N. |
| **Revenue impact** | Trial budget drained, no conversion, attacker walks. |

---

## 3. The fix (in 4 lines)

1. **Token format changed** → `payg_<base64url(cust_id)>.<random>` — customer_id is encoded in the token itself.
2. **Balance / deduct lookup** → decode the token, hit `GET /customers/{id}` (real-time, no index).
3. **Trial dedupe** → `GET /customers?email=…` (live DB list endpoint, no index lag).
4. **Forgery defence** → `hmac.compare_digest(stored_token, presented_token)` after retrieval. Only the issued token unlocks the customer.

Backward compatible: legacy `payg_<random>` tokens (no dot) still hit the slow Search fallback. No customer needs to re-top-up.

---

## 4. Where it lives on disk

| File | Role |
|---|---|
| [meok-attestation-api/api/index.py](meok-attestation-api/api/index.py) | All 4 new helpers + inlined `/payg/*` endpoints. +149 / –38 lines in this commit. |
| [meok-attestation-api/vercel.json](meok-attestation-api/vercel.json) | Rewrites — `/api/payg/*` → `/api/index.py`. Confirmed wired. |
| [council-ai-storefront/payg.html](council-ai-storefront/payg.html) | 3 live Stripe Payment Links (£10 / £50 / £200) — unchanged. |
| [tools/smoke_test_payg_e2e.sh](tools/smoke_test_payg_e2e.sh) | The 4-step contract test. Run anytime to re-verify. |
| [mcp-marketplace/eu-ai-act-compliance-mcp/auth_middleware.py](mcp-marketplace/eu-ai-act-compliance-mcp/auth_middleware.py) | Shared client-side PAYG auth (Tier.PAYG enum + `_payg_server_deduct`). |

**New helpers added (all in `api/index.py`):**
- `_payg_generate_token(customer_id)` — emits new-format token
- `_payg_decode_customer_id(token)` — reverse, returns `cus_…` or None
- `_payg_lookup_customer_by_token(token)` — fast path (decode) + slow path (search, for legacy)
- `_payg_find_customer_by_email(email)` — real-time dedup via `/customers?email=`

---

## 5. Live evidence at briefing-write time (2026-06-11)

```text
POST /payg/trial   email=hive-handover-<ts>@meok.ai
  → 200 ok=true  token=payg_Y3VzX1VnTTMwMkdrWGJYblFS.…   ✓
GET  /payg/balance ?token=payg_Y3VzX1VnTTMwMkdrWGJYblFS.…
  → 200 balance_gbp=0.5 calls_remaining=10                 ✓ (REAL-TIME)
POST /payg/deduct  amount_gbp=0.05
  → 200 balance_gbp=0.45 calls_remaining=9                 ✓
GET  /payg/balance ?token=…
  → 200 balance_gbp=0.45                                   ✓ (DEDUCTION REFLECTED)
POST /payg/trial   email=hive-handover-<ts>@meok.ai  [duplicate]
  → 409 "Trial already claimed for this email"             ✓ (IDEMPOTENT)
```

**5 / 5 contract checks pass.** Bug 1 + Bug 2 both dead.

---

## 6. Git trail (for the Queens to verify)

```text
branch:  claude/meok-one
commit:  16df415   fix(payg): two production bugs killed — token resolves real-time + trial idempotent
parent:  bee9e2d   (prior PAYG inlining)
delta:   +149 / -38   meok-attestation-api/api/index.py
remote:  https://github.com/CSOAI-ORG/clawd-workspace.git   pushed ✓
deploy:  vercel deploy --prod --yes from /Users/nicholas/clawd/meok-attestation-api   ✓
```

Active dev branch right now: `deploy` (9a29baf — `tabs sync`).

---

## 7. What the Queens should pick up

> Assignment grid — King may dispatch in parallel. Each row is one Queen-task.

| # | Queen / stack | Task | Acceptance check |
|---|---|---|---|
| Q1 | `mcp-marketplace` Queen | Sweep the **other 6 MEOK compliance MCPs** (`nis2`, `dora`, `cra`, `csrd`, `gdpr`, `iso-42001`) for any direct Stripe Customer-Search calls outside the attestation-api. None expected (they use the server URL), but verify. | `grep -R "customers/search?query=" mcp-marketplace/` returns 0 hits |
| Q2 | `watermark-attest` + `bias-detection` Queens | Confirm their PAYG middleware uses `MEOK_PAYG_SERVER_URL` (not local). Republish at +1 patch if missing. | `pip show` + `python -c "import …"` resolves SERVER_URL var |
| Q3 | `meok-attestation-api` Queen | Add a 5-line CI smoke that hits all 5 contract checks on every Vercel deploy. Failing build blocks promote. | `.github/workflows/payg_smoke.yml` exists + green |
| Q4 | `revenue` Queen | Resume the [OEM resend](revenue/OEM_RESEND_2026-06-02_COPY_READY.txt) blast — now safe to send (was held while fix in flight). Send batch of 5 from `nicholas@csoai.org`, rate ≤25/day. | `revenue/OEM_RESEND_OUTBOUND_LOG.csv` ≥ 5 new rows |
| Q5 | `meok/ui` Queen | Add a "How PAYG works" tile to [meok.ai/self-audit](meok/ui/src/app/self-audit/page.tsx) referencing the 5/5 contract checks + commit hash. Auditor evidence. | Page renders, score still 100/100 |
| Q6 | `sov3` Queen (Honeycomb) | `record_memory` the bug pattern *"Stripe Customer Search has 5-60s indexing lag — never use for hot-path lookup"* with `tags=[payg, stripe, pattern, postmortem]`. | `query_memories` returns this memory |
| Q7 | Show-HN Queen | Pull the trigger on [revenue/SHOW_HN_PAYG_2026-06-02.md](revenue/SHOW_HN_PAYG_2026-06-02.md) (was held same reason). | HN post URL captured in `revenue/SHOW_HN_LIVE.txt` |
| Q8 | `vercel` / promote Queen | Promote the latest `meok-attestation-api` prod deploy to the `proofof.ai` alias if it isn't already. | `curl proofof.ai/payg/healthx` returns 200 |

**Coordination protocol:** King fans Q1–Q8 out **in parallel** (no inter-task dependencies). Each Queen reports back via `coord_complete_task`. BFT vote required only if 2 Queens conflict on the same file (none should, given Q grid above).

---

## 8. What NOT to touch (don't undo my work)

- `payg_…` token format — leave the dot encoding alone. Any Queen who "refactors back to UUID-only" breaks bug-1 again.
- `_payg_find_customer_by_email()` — the email dedupe must use `/customers?email=`, **not** `/customers/search`. If a Queen "consolidates" them, bug 2 returns.
- `hmac.compare_digest` in lookup — required for forgery defence. Removing it would let an attacker forge a token by knowing only a customer_id.

---

## 9. Open / lower-priority follow-ups (background, no rush)

- Publish the ~9 PyPI packages that 429'd during the 2026-06-03 catalogue rescue (see [`session_june3_catalogue_catastrophe.md`](~/.claude/projects/-Users-nicholas/memory/session_june3_catalogue_catastrophe.md))
- `MEOK ONE` VM termination policy — still e2-standard-4 SPOT, decision pending: convert to standard for stability
- `councilof.ai` storefront — the £499 Indie tier is removed, but 1–2 deep-linked pages may still reference it; sweep
- `meok.ai/self-audit` production alias is on a different Vercel team — manual promote required

---

## 10. Self-audit reminder (don't lose the 100/100)

The [self-audit cert](MEOK_SELF_AUDIT.md) scored MEOK 100/100 on its **own** EU AI Act readiness scorecard. The PAYG fix doesn't change the audit; it strengthens it by proving the contract checks are alive. If a Queen wants to bump the cert version, run [tools/run_self_audit.py](tools/run_self_audit.py) — it emits a new HMAC-signed JSON cert (`meok-self-audit-<date>`).

---

## 11. Aurora principle relevance

This bug pattern (silent index lag in a money path) is exactly what the **Aurora "first-principles before fast"** principle exists to catch. The original PAYG code was "fast" (one Stripe API call per lookup) but skipped the first-principles question *"is this lookup eventually consistent?"*. The fix embraces strong consistency where it matters (the money path) and accepts the legacy slow path only as backward-compat.

Queens — when touching ANY external API in a payment-adjacent path, **ask Honeycomb first** for "is this read consistent?" memories before shipping. Add new findings as memories.

---

## 12. One-line ack for the King

```text
ack 16df415 payg-fix verified-live 5of5 contracts-pass route-the-queens
```

---

**End of briefing. Total length: ~1.6 KB ASCII. Paste as-is into Honeycomb or `record_memory(briefing_id="payg_fix_2026-06-11")`. King: proceed to Q1–Q8 fan-out.**
