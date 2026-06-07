# EOD Audit — Accounts, Revenue & Email
**Date:** 2026-06-06 · **Scope:** STRICT READ-ONLY (no email sent, no Stripe changes, no money moved)

---

## Revenue (the headline)

**STRIPE BALANCE: UNKNOWN — could not read. SALES: UNKNOWN — could not confirm.**

The Stripe MCP connector (`plugin:small-business:stripe`) is installed but **not authenticated**. It requires an OAuth flow that needs Nick to approve in a browser — it cannot be completed autonomously inside a read-only audit. No live balance, charge count, product count, or payment-link count could be retrieved this run.

Fallbacks attempted, all negative:
- **Stripe CLI** (`/opt/homebrew/bin/stripe`) is installed but has **no configured key** (no `~/.config/stripe/config.toml`).
- **No usable live/test Stripe secret key** found in local env (`.env.local`, env vars all clean). This is consistent with the memory note that the previously-leaked live key was scrubbed + global-gitignored on 2026-04-26. The grep "hits" were documentation/setup `.md` files referencing key *formats*, not real keys.

> **#1 EOD question — "is there any revenue yet?" — could NOT be answered programmatically today.** Per prior session memory the standing answer has been **£0 / no sales**, but that is *not verified live this run*. **ACTION FOR NICK: connect Stripe** (run `/mcp` → authorize Stripe, or paste the OAuth callback URL) so balance + charges can be read. Auth URL was generated this session if you want to use it.

---

## Email actionables

**Gmail could NOT be read this run.** Both Gmail paths are blocked:
- Connector `f09d0a99…` (Gmail) returns **"This connector requires additional permissions. The user needs to reconnect it with the appropriate access"** on *every* call (search, labels — all fail). Needs reconnect with broader scope.
- Alt server `plugin:small-business:gmail` **rejects programmatic OAuth** ("does not support dynamic client registration — authenticate manually via `/mcp`").

So no inbox scan for (a) Stripe/payment notifications, (b) signups/trials, (c) actionable threads, or (d) drafts was possible.

| Subject | From | Why it needs Nick |
|---|---|---|
| *(none readable)* | — | Gmail connector blocked — **reconnect Gmail via `/mcp`** to enable the inbox scan |

> **ACTION FOR NICK: reconnect Gmail** (with read scope) — then re-run this audit to populate payment-signal + signup + actionable-thread + draft checks.

---

## Account health (reachable signals)

| System | Status | Notes |
|---|---|---|
| **PyPI (MEOK catalogue)** | ✅ Healthy / growing | `tools/pypi_check.py`: **282 PUBLISHED** / 337 names on disk / 55 not-yet-published. Up from 271/316 in last memory note — net progress. |
| **PyPI flagships** | ✅ All 8 live | `eu-ai-act-compliance-mcp`, `dora-compliance-mcp`, `nis2-compliance-mcp`, `cra-compliance-mcp`, `iso-42001-ai-mcp`, `bias-detection-mcp`, `watermarking-authenticity-mcp`, `meok-attestation-verify` — all return 200. (Reminder: real names ≠ `meok-` prefix; cite canonical names in outreach.) |
| **GitHub (CSOAI-ORG)** | ⚠️ Auth OK, CI noisy | `gh` logged in (CSOAI-ORG, full scopes). **50 unread notifications**: 44 `ci_activity`, 5 `author`, 1 `comment`. |
| **GitHub CI** | ⚠️ **Failing workflows** | Repeated **CodeQL failures on `meok-compliance-gateway` (main)** and a **ci failure on `CSOAI/feat/agentaudit-server`**. The 44 ci_activity notifications are largely these failures — worth a look. |
| **Stripe** | ❌ Not connected | See Revenue section — OAuth needed. |
| **Gmail** | ❌ Not connected | Needs reconnect — see Email section. |

### Account-health actionables for Nick
1. **Connect Stripe** (OAuth) — unblocks the only real revenue read. *Highest priority for an EOD revenue audit.*
2. **Reconnect Gmail** (read scope) — unblocks inbox/payment-signal scan.
3. **Investigate failing CI** — CodeQL on `meok-compliance-gateway` main is red repeatedly; `agentaudit-server` branch ci failed.
4. *(Optional)* Clear the 50-item GitHub notification backlog once CI is green.

---

## Audit integrity note
This was a **read-only** audit. No email was sent, no Stripe object was created/modified, no money was moved. The two headline data sources (Stripe, Gmail) were **inaccessible due to missing authentication**, not due to any data showing zero — those sections are honestly marked UNKNOWN rather than assumed. Re-run after connecting Stripe + Gmail for the real numbers.
