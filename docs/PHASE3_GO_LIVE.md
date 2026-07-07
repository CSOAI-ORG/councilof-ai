# Phase 3 — Go-Live Checklist (make the funnel transactional)

> Phase 3 turns the live product into a **paying** funnel: visitor → `/assess` (free proof)
> → `/pricing` → checkout → **Ed25519 certificate issued** → onboarded. This checklist is the
> pre-flight gate. **Lane boundary:** the frontend funnel is this agent's lane and is verified
> ready; the **payment + signing + deploy trigger are M4/JEEVES + Nick** (credentials/keys this
> agent does not hold and will not enter). One shot per account — nothing goes live red.

## A. Pre-flight gates (must ALL be green before the switch)
| Gate | How to check | Owner | Status (2026-07-07) |
|---|---|---|---|
| Client build clean | `npm run build:client` | FE | ✅ (3× today) |
| Claims truth 12/0 | `node scripts/claims-e2e.mjs` (live) | shared | ✅ 12/0 |
| Product E2E green | `E2E_BASE=https://www.csoai.org node scripts/e2e-product.mjs` | FE | ✅ (see run) |
| Hive recon gate | `npm run hive:recon` | FE | ✅ all gates pass |
| Routes healthy | funnel sweep `/assess /pricing /login` → 200 | FE | ✅ 200 |
| MCP install path | `npx -y csoai-governance-mcp` handshakes | FE | ✅ live |

## B. Payment + entitlement (M4/JEEVES + Nick — credentials required)
- [ ] **Paddle** product + price IDs live; `/pricing` CTA points at the real checkout (not test).
- [ ] Paddle **webhook** → backend entitlement grant verified with a **test transaction** (sandbox → live).
- [ ] On successful payment, backend issues the **Ed25519 certificate** (signing key loaded server-side; never in the client bundle).
- [ ] `/login` auth issues the entitlement to the account; gated OS/tools unlock.
- [ ] Refund/chargeback path defined (revoke entitlement + cert).

## C. Signing + trust (M4)
- [ ] Signing key present on the brain host only; `/sign` returns real Ed25519 (len=128) — **verified live today**.
- [ ] Certificate payload schema fixed (what's attested, expiry, verification URL).
- [ ] `csoai_verify` verifies an issued cert offline.

## D. Cutover
- [ ] Announce a short freeze window in `AGENT_COORDINATION.md` (avoid a parallel-edit race).
- [ ] Flip `/pricing` to live checkout (single commit, small).
- [ ] Immediately run `claims-e2e` + `e2e-product` against live post-flip.
- [ ] Smoke a **real low-value transaction end-to-end** (buy → cert issued → verify) before any outreach.

## E. Rollback (if the transaction path misbehaves)
- [ ] Revert the `/pricing` CTA commit (checkout → "contact us" / waitlist) — funnel stays up, payment paused.
- [ ] Pause the Paddle webhook; no entitlements granted while paused.
- [ ] Nothing else on the site depends on payment, so the rest stays live.

## F. Outreach gate (hard dependency — Nick's rule)
**No outreach until the Hive recon/scoring harness covers the full ~2000-lead list.**
- [ ] JEEVES exports the lead universe (org-level, public schema — see DISTRIBUTION_HIVE §1) to JSON.
- [ ] `HIVE_ACCOUNTS=<leads.json> npm run hive:recon` scores all of them; report reviewed.
- [ ] Modeled rows (no cited vendor/posture) flagged for per-account recon before they're contacted.
- [ ] Then, and only then, outreach begins — every account already scored + demo-tailored.

---
*Frontend funnel verified ready. Remaining Phase-3 steps require M4's signing key + Paddle credentials + Nick's trigger. This agent will not enter credentials or execute payments.*
