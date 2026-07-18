# CSOAI → M2 MacBook Hand-off
**Date:** 2026-06-23 · **For:** the M2 (CSOAI machine) · **From:** MEOK build host
**Pull this from:** `github.com/CSOAI-ORG/clawd-workspace` (this file lives at repo root)

> Division of labour: **M2 = CSOAI** (site, compliance, GTM, raise). **Other machine = MEOK** (flywheel, hives, gaming, Hermes, sovereign-town). This doc is what the M2 needs to be current.

## 1. Repos to pull (remotes confirmed 2026-06-23)
| Repo | Remote | Notes |
|---|---|---|
| `clawd` | `CSOAI-ORG/clawd-workspace` | Shared workspace — masters, csoai-platform, sovereign-town, this doc |
| CSOAI site | `CSOAI-ORG/csoai-research-institute` | Canonical CSOAI institute repo |
| csoai-platform | (inside clawd) | Protocol 0 + governance dashboard (hardened today) |

**Canonical CSOAI site (live):** per memory, live csoai.org = `csoai-org-v2` (Next.js, Vercel CLI deploy). Confirm before deploying; the sov-town bridge page is wired but un-deployed and the feed is stale.

## 2. State you're pulling into (honest)
- **csoai-platform Protocol 0**: hardened today (identity/discovery/comms/trust/txn/governance + snapshot/restore), real Stripe payments, JSON state store at `server/data/`, server startup bug fixed. Builds green. Pushed (b4fdd566).
- **Design system**: warm "sovereign" `meok-tokens.css` + `meok-theme` applied platform-wide; `csoai-org/meok-ai.html` product page added. Pushed (f9a8387).
- **Swarm**: claude/hermes/kimi wired to `/api/swarm/emit`; emit is contract-built, **not E2E-tested**.

## 3. ⚠️ Before you sync — warnings
- **`meok-os` has NO git remote** — it will not pull on the M2 until a remote is set on the MEOK host. (MEOK-side blocker.)
- These repos were **dirty/unpushed** at hand-off time (work may not yet be on GitHub): `meok-ai`, `meok-saas`, `meok-ai-frontend`, `meok-compliance-gateway`, `clawd` (5 agent-card JSONs), `councilof-ai`. Pull after the MEOK host pushes, or you'll see stale state.
- **🔴 Do not** initiate any local "King" signature on the M2 — the canonical King key is unencrypted on a mac and needs reconciling first.

## 4. CSOAI positioning (carry these — verified)
- Lead with **in-force** DORA / NIS2 / GDPR; EU AI Act high-risk is **2027**. Drop the "Aug 2 countdown."
- Moat = **sovereign offline-verifiable local signing + no single vendor** (attested-ledger niche alone is taken by MS/Asqav). Close the self-attestation gap via external anchoring.
- Raise comps: Vijil / Braintrust / Credo (avoid the Axiom $1.6B comp). Design-partner reference call beats a demo.
- `csoai.org /verify` currently validates nothing — fix or don't show it to a design partner.

## 5. July 4 (T-11)
Launch gate = 29 hives 100/100; proof points = 1 compliance report + 1 patent disclosure + 1 revenue txn, all signed. Full plan: `MEOK_MASTER_2026-06-23.md` + `JULY4_MASTER_PLAN_2026-06-16.md` (both in clawd).

## 6. First actions on the M2
1. `git pull` clawd + csoai-research-institute.
2. Read `MEOK_MASTER_2026-06-23.md` (the index).
3. Confirm the live csoai.org deploy target (csoai-org-v2) before any deploy.
4. Pick up CSOAI track; leave MEOK repos to the build host.
