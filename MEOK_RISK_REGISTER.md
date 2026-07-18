# MEOK AI Labs — Risk Register

**Required by:** EU AI Act Article 9 (Risk Management System) — continuous lifecycle process
**Scope:** All published MEOK MCPs + the meok-attestation-api + the public sites
**Last reviewed:** 2026-06-07
**Review cadence:** Monthly + on every major release
**Owner:** Nicholas Templeman (nicholas@meok.ai)

---

## Top 10 risks (sorted by severity × likelihood)

### R-01 — STRIPE_SECRET_KEY env-var drop in Vercel
- **Severity:** Critical — PAYG billing breaks silently.
- **Likelihood:** Low.
- **Detection:** `payg-smoke.yml` daily check + auto-issue on `/payg/health` returning `stripe_configured: false`.
- **Mitigation:** Vercel env vars are write-only; periodic dashboard review; the daily smoke is the canary.
- **Last review:** 2026-06-07 — `/payg/health` returns `stripe_configured: true`.

### R-02 — STRIPE_WEBHOOK_SECRET env-var drop in Vercel
- **Severity:** Critical — webhooks accepted unsigned could provision tokens to attackers.
- **Likelihood:** Low.
- **Detection:** same as R-01 — `/payg/health` returns `webhook_configured: false` when dropped.
- **Mitigation:** Hard-fail at module load if `MEOK_ATTESTATION_KEY` missing without `MEOK_ALLOW_EPHEMERAL_SIGNING_KEY=1`. Stripe signature verification rejects all unsigned events.
- **Last review:** 2026-06-07 — verified.

### R-03 — EUR-Lex SPARQL endpoint schema change
- **Severity:** Medium — `eurlex_sync.py` could start returning empty bindings (this has happened before).
- **Likelihood:** Medium — EUR-Lex Cellar publishes occasional schema updates.
- **Detection:** Daily sync produces a non-zero count of new articles. The GH Actions job opens an issue if the daily sync diff is suspicious.
- **Mitigation:** The sync uses defensive Python (urllib + JSON over SPARQL results); helpers handle empty bindings gracefully.
- **Last review:** 2026-06-07 — 7 consecutive successful daily syncs.

### R-04 — Inflated download claims
- **Severity:** Medium — audit risk from claiming numbers we can't verify.
- **Likelihood:** Was high; now low after sweep.
- **Detection:** All public-facing claims now cite `pypistats.org` verifiable numbers.
- **Mitigation:** "fix: replace inflated MCP counts with verifiable numbers" commit (753155f) closed the 234/247/255+ claims down to honest 26 PyPI + 6,798/mo installs (now 16,300/mo verified).
- **Last review:** 2026-06-07.

### R-05 — CSOAI severed-brand leak
- **Severity:** Medium — confuses customers, dilutes credibility.
- **Likelihood:** Low (one-time fix done).
- **Detection:** `grep -r "Powered by CSOAI" meok/ui/src` should return 0 hits.
- **Mitigation:** Earlier sweep removed all marketing references; legal `CSOAI LTD · Companies House 16939677` retained intentionally.
- **Last review:** 2026-06-07 — `curl meok.ai | grep "Powered by CSOAI"` returns empty.

### R-06 — Personal-data leak in MCP tool calls
- **Severity:** High — GDPR breach if a customer pastes personal data into a tool input and we log it.
- **Likelihood:** Low — tools are stateless and don't persist anything customer-side.
- **Detection:** Tool docstrings disclose stateless/idempotent behaviour.
- **Mitigation:** No tool writes to a persistent store. PAYG balance file lives in customer's `~/.meok/`. Server-side balance lives in Stripe customer metadata only.
- **Last review:** 2026-06-07.

### R-07 — Article 50 misclassification of tool output as synthetic content
- **Severity:** Low — interpretation is conservative on our side anyway.
- **Likelihood:** Low.
- **Mitigation:** All tool outputs marked `"meok_origin": "ai-assisted-compliance-analysis"` or `"verbatim_source": "EUR-Lex Cellar API"`. Verbatim regulation text is the majority of every response.
- **Last review:** 2026-06-07.

### R-08 — Notified Body capacity squeeze (Q3 2027)
- **Severity:** Medium — our £5,000 gap analysis depends on customers being able to schedule a downstream Notified Body.
- **Likelihood:** High — only ~50–60 qualified ISO 42001 consultants globally.
- **Mitigation:** The councilof.ai pitch explicitly warns customers about this; the £5,000 product is positioned as accelerating their Notified Body engagement.
- **Last review:** 2026-06-07.

### R-09 — PyPI account compromise
- **Severity:** Critical — attacker could publish a backdoor MCP to 16,300 monthly installs.
- **Likelihood:** Low — 2FA on PyPI.
- **Mitigation:** PyPI 2FA enabled. Sigstore signing on releases. CodeQL on every push.
- **Last review:** 2026-06-07.

### R-10 — Article 50 Code of Practice change
- **Severity:** Medium — a regulatory shift could invalidate `meok-watermark-attest-mcp` framing.
- **Likelihood:** Medium — Code of Practice is in active draft.
- **Detection:** Daily EUR-Lex sync + manual review of Code of Practice publications.
- **Mitigation:** The MCP carries a `last_reviewed_against_code_of_practice` constant updated on review.
- **Last review:** 2026-06-07.

---

## Change log

| Date | Change |
|---|---|
| 2026-06-07 | Initial register published. R-01..R-10 documented. |
</parameter>
</invoke>