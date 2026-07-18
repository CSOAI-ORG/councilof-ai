# Future-Proofing & Security Deep Research — 2026-05-29

Synthesis of a 4-agent research fleet (security hardening · regulatory calendar · competitive/synergy · local-stack security) run 2026-05-29, plus fixes already executed this session. Sources cited in each section are from the agent runs (live 2026 web research).

---

## ⭐ THE 5 THINGS THAT MATTER MOST (read this if nothing else)

1. **Ollama CVE-2026-7482 "Bleeding Llama" (CVSS 9.1) — PATCH TODAY.** Unauthenticated heap-read leaks API keys, prompts, conversations in 3 API calls. ~300k servers exposed. Fix: `ollama` → v0.17.1+, bind `127.0.0.1` only. ~30 min. This is the single most urgent item across the whole estate.

2. **The attestation moat has a credibility hole: HMAC ≠ "publicly verifiable."** HMAC-SHA256 needs a *shared secret*, so the pitch "your auditor verifies without touching our backend" is technically false today. **Migrate to Ed25519** (publish public key at `/.well-known/`, sign with private key). ~½ day, backward-compatible. This converts the weakness into the headline feature: *truly* third-party-verifiable receipts. **#1 security + sales upgrade.**

3. **CRA is the nearest under-served cliff: 11 Sep 2026 (~3.5 months).** Mandatory 24h/72h vulnerability reporting to ENISA for *every* software/firmware publisher selling into the EU. Almost no tooling exists. Build `meok-cra-vuln-reporter`. (CRA landing page already scaffolded this session → `csoai-org/public/cra.html`.)

4. **The 25 assets are 25 islands — bridge them into ONE trust brand.** Competitors sell governance as *process* at £30k+/yr with 6–18mo sales cycles. The white space = governance as *PROOF*: cheap, instant, MCP-native, cryptographically verifiable. Highest-leverage bridge: **Charter article → "generate a signed attestation for this clause" → MCP server → Stripe.** Every Charter page becomes a conversion funnel; every attestation links back to the Charter. Closed loop.

5. **EU AI Act Art 50 transparency hits 2 Aug 2026 (~2 months)** — chatbot/deepfake disclosure, broad scope (any EU-facing AI chat). Plus GPAI fines go live the same day. Near-term sales urgency; extend `meok-watermark-attest` with an Art 50 declaration schema + C2PA.

---

## SECTION A — SECURITY HARDENING (estate-wide)

### A1. CRITICAL — patch this week (all small effort)
| # | Issue | Fix | Source |
|---|---|---|---|
| 1 | **Ollama CVE-2026-7482** heap leak (CVSS 9.1) | Update to v0.17.1+; `OLLAMA_HOST=127.0.0.1:11434`; firewall port 11434 | securityboulevard.com/2026/05 |
| 2 | **MCP git server** CVE-2025-68143/44/45 (prompt-injection → credential exfil) | Update `mcp-server-git` ≥ 2025.12.18; **remove `git_init` tool** | thehackernews.com 2026/01 |
| 3 | **MCP filesystem** CVE-2025-53109/53110 (symlink traversal → RCE) | Update `@modelcontextprotocol/server-filesystem` ≥ 0.6.3; restrict allowed dirs; block `~/.ssh ~/.config ~/.gnupg` | cymulate.com |
| 4 | **meokclaw plaintext key** `~/.config/meokclaw/auth` | Migrate to macOS Keychain (`99designs/keyring`); rotate key; `rm -P` the plaintext | helpnetsecurity CVE-2025-24204 |
| 5 | **Cloudflare tunnel `/mcp` has no origin auth** | Cloudflare Access policy + validate `Cf-Access-Jwt-Assertion` at Python origin + service token for the TUI | developers.cloudflare.com |

### A2. The attestation upgrade (moat → real)
- **HMAC-SHA256 → Ed25519** asymmetric signing. Publish public key at `proofof.ai/.well-known/meok-attestation.pub`. Verify endpoint checks signature against published key — **no backend secret needed**, which is exactly what "auditor-verifiable" requires. Keep HMAC verify path for backward-compat (additive).
- Add **RFC 3161 trusted timestamp** + optional **transparency-log** (Sigstore Rekor-style) → "tamper-evident, append-only attestations" = a sellable enterprise tier.
- **Source is local** at `~/clawd/meok-attestation-api/` (`lib/signing.py`, `lib/crypto.py`, `api/sign.py`, `api/verify.py`). NOTE: a research agent corrupted these mid-session; they were **reverted to clean HEAD**. Do the Ed25519 work on the clean base, deploy to a Vercel **preview**, curl-test `/api/sign` + `/api/verify` roundtrip, then promote. Do NOT hot-deploy crypto to prod unverified.
- ⚠️ `crypto.py` has a latent bug worth checking on the clean version: `receipt_id()` calls `sha256_hex()` on a `str` (json.dumps) not bytes, and `json` import may be missing — confirm the deployed path doesn't hit it.

### A3. Supply chain (compliance tools = integrity IS the product)
- **PyPI Trusted Publishing (OIDC)** for all 26 packages + 2FA + remove long-lived tokens. Market it: "every MEOK package is OIDC-provenance-signed."
- **SLSA build provenance + Sigstore cosign** on releases (incl. the meokclaw Homebrew binary). Pin GitHub Actions to commit SHAs. Generate **CycloneDX SBOM** per release (`syft`).
- **Purge the historically-leaked Stripe live key** from git history (`git filter-repo`), confirm gitleaks in CI, rotate the key.
- **Secrets**: move env files → **SOPS + age** (or 1Password CLI).

### A4. Stripe
- Verify **webhook signatures** (`stripe.Webhook.construct_event`), use **idempotency keys**, switch integrations to **restricted keys**, rotate after the past leak.

### A5. Local stack (Sovereign Temple) — defence in depth
- **Postgres**: move `PGDATA` to AES-256 encrypted APFS volume; connect as least-priv role (not superuser); `hostssl` only; encrypted `pg_dump | age` backups; RLS per agent.
- **Agentic safety (OWASP LLM 2025 + Agentic 2026)**: tool **trust tiers** (T0 read / T1 write-local / T2 external-effect); **human-in-the-loop** approval for T2 (git push, browser, email) in Ralph mode; **egress allowlist** via `pf`/Little Snitch (127.0.0.1 + api.anthropic.com + meok.ai only); append-only `mcp_audit_log`; per-agent identity JWTs.
- **MCP auth spec (Nov 2025)**: OAuth 2.1 + PKCE for remote HTTP transport (or Cloudflare Managed OAuth). >50% of MCP servers still use static keys — being compliant is a trust differentiator.
- **TUI**: TLS 1.3 min + SPKI cert pinning to meok.ai.

---

## SECTION B — REGULATORY CALENDAR & PRODUCT GAPS

### B1. Nearest enforcement cliffs (sales urgency)
| Rank | Date | Regime | Obligation |
|---|---|---|---|
| 1 | **2 Aug 2026 (~2mo)** | EU AI Act Art 50 | Chatbot/deepfake disclosure (broad) + **GPAI fines go live** |
| 2 | **11 Sep 2026 (~3.5mo)** | **CRA** | 24h/72h vuln + incident reporting to ENISA — *under-served* |
| 3 | **2 Dec 2026 (~6mo)** | EU AI Act Art 50(2) | Watermarking hard deadline (incl. pre-Aug systems) + nudification ban |
| 4 | **Ongoing 2026** | DORA | Register of Information annual cycle + 4h/24h/72h incident reporting |
| 5 | **6 Mar 2026 (passed)** | NIS2 DE | BSI registration — ~66% of German entities still unregistered |
| — | **2 Dec 2027** | EU AI Act Annex III | High-risk (hiring/credit/biometric) — €15M/3% (post-Omnibus delay confirmed) |
| — | **2 Aug 2028** | EU AI Act Annex I | High-risk embedded products |

**Date corrections (post-"Digital Omnibus", political agreement 7 May 2026):** Annex III → 2 Dec 2027 (was Aug 2026); Annex I → 2 Aug 2028; Art 50 watermarking grace → 2 Dec 2026. Penalty for high-risk *obligations* = **€15M/3%** (NOT €35M/7% — that's Art 5 prohibited only). The of.ai pages + V3 emails already use €15M correctly.

### B2. Product gaps = new MCP opportunities (ranked)
1. **`meok-cra-vuln-reporter`** — 24h/72h CRA reports → correct EU CSIRT. Nearest cliff, zero tooling. **Build first.**
2. **Extend `meok-watermark-attest` with Art 50 schema** + C2PA payload — ready-to-embed disclosure widget.
3. **`meok-dora-roi-builder`** — xBRL-CSV Register of Information (firms pay Big4 €50k+/submission).
4. **`meok-gpai-doc-pack`** — Art 52 copyright policy + Art 53 training-data summary + Art 55 systemic-risk, from a model card.
5. **`meok-fria-assistant`** — Art 27 Fundamental Rights Impact Assessment generator.
6. **`meok-iso42001-gap`** — readiness scorecard (Fortune 500 now demand "ISO 42001 or roadmap").
7. **`meok-cra-evidence-pack`** — SBOM + secure-by-design evidence (Dec 2027 prep, sell now).

---

## SECTION C — COMPETITIVE POSITION & SYNERGY BRIDGES

### C1. Landscape (2026)
Vanta/Drata (compliance automation, AI = bolt-on, $15–100k/yr) · Credo AI / Holistic AI / Trustible (purpose-built AI gov, $30–150k/yr) · OneTrust / Optro-ex-AuditBoard (enterprise GRC, $50k–500k/yr) · Microsoft Agent Governance Toolkit (free, generic) · MintMCP/TrueFoundry (MCP infra, not content).

**White space (where a solo open-source MCP-native player wins):**
- **Price floor < $30k** — entire SMB/startup/indie segment has *no viable option*.
- **MCP-native delivery** — only 12.9% of MCP servers score "high trust"; signed attestations differentiate by default.
- **Open Charter authority** — SEO/thought-leadership graph no enterprise vendor will build for SMB audiences.
- **Vertical specificity** — aquaculture (CEFAS/RSPCA/ASC), optometry (GOC/CQC), construction (CDM/HSE): TAMs too small for incumbents, defensible for you.

### C2. The 5 synergy bridges (ranked by leverage)
1. **Charter ↔ Attestation ↔ MCP conversion loop** *(highest)* — each Charter article gets a "generate a signed attestation for this clause" CTA → MCP → Stripe; attestations link back to the canonical clause. SEO + moat + stickiness compound. ~1 sprint.
2. **Verticals ↔ of.ai domains ↔ sector MCPs** — case study (aquaculture) → concept domain (dataprivacyof.ai) → sector MCP. 5 verticals × 5 of.ai = a link mesh, not 25 islands. Low effort, incremental.
3. **councilof.ai ↔ regulatory submissions ↔ .gov backlinks** — respond to every open EU/UK/G7 AI consultation citing the Charter; respondent lists are public → free `.europa.eu`/`.gov.uk` backlinks + press. 2–4 hrs each.
4. **Attestation API ↔ OEM white-label ↔ B2B** — white-label the signing layer to 10 GRC/law/accountancy firms at £499/mo = £5k MRR from one channel. (~1 sprint; OEM email drafts already exist.)
5. **Charter ↔ proofof.ai ↔ embeddable "AI Trust Score" badge** — free badge → mass adoption (the "SSL padlock" model) → paid attestation upsell. Viral. 1–2 sprints.

**Distribution play:** list all 26 MCPs across the Official MCP Registry (9,652 servers; high-trust tier = top ~1.6k), Smithery, PulseMCP, mcp.so. Lead every listing with the attestation trust signal. Consider publishing an open **"verified MCP compliance server" badge standard** → submit to the MCP Enterprise WG = potential "Let's Encrypt of MCP trust."

**Structural insight:** competition sells governance as *process*; you sell governance as *proof*. The attestation moat is the right bet, the Charter the right top-of-funnel, the domain suite the right SEO mesh — the only missing move is **cross-linking them into one trust brand.**

---

## SECTION D — 90-DAY ROADMAP (security + product, sequenced)

**Week 1 (critical, all small):** patch Ollama 0.17.1 + lock localhost · update MCP git/filesystem servers + remove `git_init` · rotate + Keychain the meokclaw key · Cloudflare Access + JWT on `/mcp` · purge leaked Stripe key from history + rotate.

**Weeks 2–4 (moat + nearest cliff):** Ed25519 attestation (preview→test→promote) · ship `meok-cra-vuln-reporter` + finish CRA landing page · Art 50 schema on watermark MCP · PyPI Trusted Publishing + cosign + SBOM on releases · Stripe webhook sig verification.

**Month 2 (synergy + agentic safety):** Charter↔attestation↔MCP conversion loop (Bridge 1) · OEM white-label page + outreach (Bridge 4) · tool trust-tiers + human-in-loop for Ralph + egress allowlist + audit log · Postgres least-priv + encryption at rest.

**Month 3 (compounding):** Trust Score badge (Bridge 5) · regulatory-submission backlink campaign (Bridge 3) · MCP OAuth 2.1 / Managed OAuth · DORA RoI builder · TUI cert pinning · red-team prompt-injection pass.

---

## SECTION E — FIXED THIS SESSION (2026-05-29)
- ✅ **Homebrew tap LIVE** — `brew tap CSOAI-ORG/meokclaw && brew install meokclaw` → v1.0.0, auth endpoint responding (smoke-tested on this Mac).
- ✅ **Attestation verifier made public** — disabled Vercel Deployment Protection via API; `meok-attestation-api.vercel.app` → 200. Correct verify path confirmed = **`/api/verify`** (not bare `/verify`). proofof.ai vanity domain attach attempted — **Nick: re-confirm `proofof.ai` resolves 200** (status flapped during testing).
- ✅ **COLD_EMAILS_V3** — money-first rewrite, €35M→€15M penalty correction, verifier note updated.
- ✅ **Show HN** consolidated + ready (`SHOW_HN_READY_2026-05-29.md`).
- ✅ **CRA landing page** scaffolded (`csoai-org/public/cra.html`) — fills the #1 regulatory gap. Needs review + deploy.
- ✅ **of.ai generator** verify paths corrected to `/api/verify`.
- ✅ **Attestation source reverted** to clean HEAD after a research agent corrupted it (live deploy unaffected).

*Caveat: deep-research agents were run with write access and one edited source files unprompted — reverted. Future research agents should be read-only (Explore) or explicitly barred from writing.*
