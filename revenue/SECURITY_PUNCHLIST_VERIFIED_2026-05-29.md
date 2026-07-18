# Security Punchlist — VERIFIED against real code (2026-05-29)

This supersedes the speculative parts of `FUTURE_PROOFING_RESEARCH_2026-05-29.md`. Every item below was checked against the actual codebase by a read-only verification pass + hand-verification. **4 false alarms were killed.** Nothing here has been auto-applied — every real fix needs a deploy, key rotation, or package republish, so all require your go-ahead (these are exactly the "deploy = crash risk / irreversible" category).

---

## ❌ FALSE ALARMS — ignore these (verified not-real)
| Claimed | Reality |
|---|---|
| Ollama CVE-2026-7482 "patch today" | You're on **v0.24.0 (already patched)** and it's **not even running**. Moot. |
| meokclaw plaintext key at `~/.config/meokclaw/auth` | **File does not exist.** The `--verify-license` smoke test never wrote a key. |
| MCP git/filesystem server CVEs | **Neither package installed.** N/A. |
| prompt-injection-firewall "echoes raw input" | **False** — `scan_prompt()` stores only a SHA256 hash, never echoes. |
| Attestation "ephemeral key silently used in prod" | **False** — code **hard-fails at module load** unless `MEOK_ALLOW_EPHEMERAL_SIGNING_KEY=1` is explicitly set. Correct defensive design. (And the live app returns 200, so the real key IS set.) |

---

## ✅ REAL findings (verified by reading the code)

### 🔴 R1 — Attestation moat: HMAC is symmetric → "auditor verifies offline" is technically false
**Evidence:** `meok-attestation-api/api/index.py:119` signs with `hmac.new(_SIGNING_KEY, data, sha256)`; `:561` verify re-computes the same HMAC server-side. A symmetric MAC means the verifier needs the secret — so independent offline verification is impossible today; `/verify` is "trust our server's word."
**Fix (Ed25519, additive):** sign with an Ed25519 *private* key, publish the *public* key at `meok.ai/.well-known/` + on the verify page. Add `alg`/`kid` to certs, keep the HMAC path for a transition window. The offline verifier package **already exists** (`mcp-marketplace/meok-attestation-verify`).
**Why it's the #1 item:** it's both the top security fix AND the strongest sales line — "your auditor verifies our signature with our public key, no call to us." Needs a Vercel deploy → **do via preview → curl sign/verify roundtrip → promote.** Not a hot prod edit.
**Severity: HIGH (was over-stated as CRITICAL).**

### 🟠 R2 — `SECRETS_LOCAL.md` holds plaintext keys on disk
**Evidence (hand-verified):** `meok-attestation-api/SECRETS_LOCAL.md` exists, perms `-rw-------` (0600), **gitignored**, **0 commits in history** contain the value, repo is private.
**Real severity: MEDIUM** (not the "anyone with the repo forges certs" CRITICAL claimed — it was never committed). Still: secrets shouldn't live in a plaintext markdown file.
**Fix (needs you):** rotate the 3 values in Vercel env (`python3 -c "import secrets;print(secrets.token_hex(32))"` ×3), delete the file, move to 1Password CLI references. ⚠️ rotating the **pepper** invalidates all derived customer API keys → keep `..._PEPPER_V1` fallback during migration.

### 🟠 R3 — Stripe webhook replay window (local file `meok-labs-engine/shared/stripe_webhook.py`)
**Evidence:** `verify_stripe_signature` validates the HMAC but **omits the 300s timestamp tolerance** that `api/index.py` has → a captured valid webhook replays indefinitely. (File is **untracked/local-only**; takes effect on next webhook-server deploy.)
**Fix:** add `if abs(time.time() - int(t)) > 300: return False`. Severity: HIGH. Needs webhook redeploy.

### 🟠 R4 — Weak API-key entropy (`meok-labs-engine/shared/auth_middleware.py`)
**Evidence:** `generate_api_key` derives from `time.time()+customer_name+tier` via sha256 → ~86k/day enumerable space.
**Fix:** `secrets.token_urlsafe(32)`, store opaque keys. Severity: HIGH. Local file; needs redeploy to take effect.

### 🟡 R5 — MCP tools take `api_key` as a tool **parameter** → logged by every MCP client
**Evidence:** `mcp-marketplace/agent-policy-enforcement-mcp/server.py` + `agent-prompt-injection-firewall-mcp/server.py` expose `api_key: str` in tool signatures. ⚠️ **These are published PyPI packages** (also mirrored in `meok-mcps/`) — editing = **republish**, and removing the param is a **breaking API change** for existing users. NOT a safe quick-fix.
**Fix (proper):** move auth to the MCP `Authorization: Bearer` header (MCP 2025 OAuth 2.1 spec); deprecate the param over a version. Severity: MEDIUM. Needs republish + migration.

### 🟡 R6 — minor hardening (all need republish/deploy)
- CORS `Access-Control-Allow-Origin: *` on `/provision` + `/sign` → restrict to meok.ai origins.
- Pydantic `Field(max_length=...)` on MCP string params (DoS guard).
- Webhook idempotency is an O(n) flat-file scan → move to a set/SQLite.
- `idempotency_key=` on outbound `stripe.Customer/Subscription.create`.

---

## 🟢 Supply-chain upgrades (your "integrity IS the product" — all sellable)
- **PyPI Trusted Publishing (OIDC)** + 2FA across all packages → kills token-takeover. Sell as "OIDC build-provenance on every MEOK package."
- **SLSA L2 provenance** (`pypa/gh-action-pypi-publish` `attestations: true`) → "verifiable build provenance."
- **Sigstore Rekor** transparency-log each attestation → "independent append-only audit trail."
- **detect-secrets / gitleaks pre-commit** (none exists today — clean add).
- **CycloneDX SBOM** per release (CRA Art 13 — you advise it, should do it).

---

## ⏱ NEAREST REVENUE CLIFFS (from regulatory agent, dates verified post-Omnibus)
1. **2 Aug 2026 (~2mo)** — EU AI Act Art 50 (chatbot/deepfake disclosure) + GPAI fines live.
2. **11 Sep 2026 (~3.5mo)** — **CRA** 24h/72h vuln reporting. *Under-served → build `meok-cra-vuln-reporter`.*
3. **2 Dec 2026 (~6mo)** — Art 50 watermarking hard deadline + nudification ban.
- Annex III high-risk → **2 Dec 2027** (delayed by Digital Omnibus); penalty **€15M/3%** (NOT €35M/7% — that's Art 5 only; of.ai pages + V3 emails already correct).

---

## 🧩 TOP SYNERGY BRIDGE (build-work, not a fix)
**Charter article → "generate a signed attestation for this clause" CTA → MCP → Stripe → cert links back to the clause.** Turns 25 islands into one compounding trust brand. Competitors sell governance as *process* (£30k+/yr); your white space is governance as *proof* (cheap, instant, verifiable). Depends on Ed25519 (R1) landing first.

---

## 🎯 RECOMMENDED ORDER (highest value / least risk first)
1. **You:** fix the verifier (task #40) — attach `proofof.ai` to its Vercel project so the cert issues; confirm the real verify route (`/verify/<id>` per the code, NOT `/api/verify`). Unblocks all outreach.
2. **Me (prepared, you deploy):** Ed25519 additive signing on a **preview** deploy → curl roundtrip → you promote. The moat upgrade.
3. **You:** rotate `SECRETS_LOCAL.md` keys → 1Password (R2).
4. **Me (local edits, you redeploy):** R3 replay-guard + R4 entropy on the webhook/auth files.
5. **You:** PyPI Trusted Publishing + 2FA.
6. **Me:** build `meok-cra-vuln-reporter` (nearest under-served cliff) + Bridge 1.

---
*Verification caveat: 4 of 7 verify-agents didn't emit structured output (Explore agent quirk); the attestation-crypto + vercel clusters were hand-verified instead. The killed false-alarms and R1–R4 evidence are all from direct code reads.*
