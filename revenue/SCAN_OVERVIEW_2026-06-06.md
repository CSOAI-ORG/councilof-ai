# CSOAI-ORG Public Repo Scan — Privacy / Security / Safety / AEO-GEO

**Date:** 2026-06-06
**Scope:** GitHub org `CSOAI-ORG` — 429 repos total (402 public non-archived, 14 private, 13 misc/forks). Deep pass on flagship MCPs + active repos; shallow org-wide sweep on the long tail.
**Method:** `gh` code search (org-wide), raw Contents API reads, local clones of flagships + offenders, branch-protection/security-settings API.
**Auth:** `gh` as CSOAI-ORG (admin:org, repo, workflow).

---

## TASK 1 — PRIVACY / COMPROMISING SCAN

### Headline
- **No real personal PII leaked.** No home/personal address, no phone numbers, no NI/passport/DOB, no personal email (`nicholastempleman@gmail.com` returns zero hits). The only personal-identity references are Nick's *intended public dev identity* — `MEOK AI Labs (Nicholas Templeman)` in LICENSE files and the `nicholastempleman/` Smithery publishing namespace. These are legitimate authorship attribution, **not** a leak.
- **No real secrets.** Confirms the prior sweep: the only `sk_live`/`ghp_`/`AKIA` hits are secret-DETECTION regexes inside `code-reviewer-ai-mcp` and CI grep steps (false positives). No committed `.env`, no DB connection strings, no private IPs. Secret-scanning + push-protection are ENABLED org-wide, which is why keys aren't getting in.
- **The real exposure was severed-brand association** (CSGA / Terranova / James Castle), concentrated in one repo (`cobol-bridge-substrate`) plus copyright headers in three others. **All clear-cut cases remediated** (see below).
- **Family/guardian MCPs are safe.** The `family_*` / `guardian_*` tools live in the PRIVATE `sovereign-temple` repo, NOT in any public repo. The public `care-membrane-mcp` / `care-home-cqc-mcp` / `pet-care-ai-mcp` hold only keyword lists, schema, and regulation text — **no real family/child data**.

### REMEDIATED (clear-cut, done this session)

| Repo | Issue | Action | Commit / Change |
|---|---|---|---|
| `cobol-bridge-substrate` | **Worst offender.** Full public marketing site (24 files, 109 refs) fabricating a bio that ties **Nicholas Templeman** to **James Castle / Terranova Aerospace & Defence Group / CSGA** as "Chief AI Science Officer". `package.json` author `James Castle <james@csga-global.org>`, homepage `csga-global.org`, topic `csga`, deploy.sh cloning `CSGA-GLOBAL/cobol-bridge`. | **Made repo PRIVATE** (reversible; removes all exposure immediately without risk-editing a 24-file interlinked site). Also fixed metadata: homepage → `https://meok.ai`, removed `csga` topic. | visibility=PRIVATE |
| `retail-ai` | `Copyright (c) 2026 CSGA Global` + "CSGA Global MCP Ecosystem" in source comments (2 files) | Scrubbed → `MEOK AI Labs` (comment-only) | `chore: scrub severed-brand references` → pushed to main |
| `gaming-ai` | Same CSGA headers (5 files) | Scrubbed → `MEOK AI Labs` | pushed to main |
| `thn-global` | CSGA headers + `Author: THN Global — Terranova Health AI` in VERIFICATION.txt | Scrubbed → `MEOK AI Labs` | pushed to main |
| `dora-compliance-mcp` | Hardcoded local path `/Users/nicholas/clawd/...` in test docstring (leaks OS username) | Scrubbed → `pytest test_server.py -v` | `chore: scrub sensitive content` → pushed to main |

> Note: GitHub code-search index lags a few minutes behind pushes. Verified via raw Contents API that retail-ai / gaming-ai / thn-global live files now read "MEOK AI Labs". `James Castle` org-wide search → zero public hits.

### FLAGGED FOR NICK (do NOT auto-action — your call)

1. **`cobol-bridge-substrate` final disposition.** I made it private as a protective stop-gap. Decide: (a) **rebrand** to meok-ai-labs and re-publish per the CobolBridge migration plan (rewrite the 24 HTML files — the entire `about.html` bio, `contact.html`, all footers, `package.json` name `@csga-global/cobol-bridge`, `server.js`), or (b) **delete** it (1 star, 0 forks — low loss), or (c) leave private. It should NOT go public again until the James Castle / Terranova / CSGA content is fully rewritten.
2. **`~/clawd/meok-labs-engine/shared` path pattern** appears in ~15 public MCP `server.py` files via `os.path.expanduser("~/clawd/...")` and a Docker `useradd nicholas`. This is *functional* (the shared auth_middleware import) and uses `~` (no hardcoded absolute username in most), so it's low-risk and I left it. If you want zero internal-path disclosure, the shared module should be vendored/pip-installed instead of sys.path-hacked — but that's a refactor, not a scrub.
3. **Public Stripe `buy.stripe.com` checkout links** are committed in many READMEs/servers (e.g. `cobol-bridge-substrate` CONTRIBUTING $999–$4,999/mo tiers, `slack-enterprise-mcp`, `unit-converter-ai-mcp`). These are *designed to be public* (checkout links, not keys) and you said never touch Stripe, so untouched. Flagging only because the cobol-bridge ones exposed the CSGA-branded enterprise pricing ladder — now private along with the repo.
4. **`templeman-opticians-site`** (public) is a harmless stub (README + LICENSE only; "domiciliary eye care across Esex [sic]" — county-level business descriptor, no address/staff). No action needed; flagging since it carries the family-business name.

---

## TASK 2 — SECURITY / SAFETY / AEO-GEO OVERVIEW

### SECURITY — OpenSSF posture

**Strong where it counts; one structural gap.**

What's in place (verified on flagships `eu-ai-act`, `dora`, `gdpr`, `hipaa`):
- **CodeQL** (`codeql.yml`) — least-privilege perms (`contents: read` + `security-events: write`, `actions: read`).
- **OSSF Scorecard** (`scorecard.yml`) — `permissions: read-all`, `persist-credentials: false`, weekly cron, publishes results.
- **Dependabot** — config present + Dependabot *security updates* ENABLED.
- **Secret scanning + push protection** — ENABLED (org-level effect; root cause of the "no leaked keys" result).
- **Supply-chain hardening on the publish workflow** (`mcp-smithery-publish.yml`) is genuinely best-in-class: top-level `permissions: {}`, job-scoped minimal perms, **all actions SHA-pinned** (not floating tags), `persist-credentials: false`, and **SLSA build-provenance attestation** (`actions/attest-build-provenance`). API keys are repo secrets, never inline.

**Top security gaps (prioritized):**
1. **No branch protection on `main`** — confirmed absent on every flagship checked. Anyone with write access can force-push to main, and the CodeQL/Scorecard/CI checks are not *required* before merge. **This is the #1 fix.** Recommend a ruleset (org-wide or per-flagship): require PR + require status checks (CI + CodeQL) + block force-push + dismiss-stale-reviews. (Cheaply applied via `gh api` rulesets across the fleet.)
2. **No signed releases / cosign.** Build-provenance attestation exists (good), but published artifacts/releases aren't cosign-signed. For "defence-grade governance" positioning, add `cosign` signing or rely on the attestation + Sigstore verification and document it.
3. **CI/security workflows are flagship-only consistency risk.** CodeQL/Scorecard/Dependabot are confirmed on flagships; the long tail (~390 repos) is not uniformly covered. Recommend a templated `.github` rollout (or org default workflows) so every public MCP gets CodeQL + Dependabot + Scorecard.

No risky workflow permissions found (no `permissions: write-all`, no `pull_request_target` with checkout-of-PR-head patterns observed in the flagships).

### SAFETY — MCP tool design

**Very safe by construction. No attacker-abusable tools found in the audited set.**
- **The fleet is overwhelmingly read-only / advisory.** Flagship `eu-ai-act` = 16 tools, all pure-compute (scan, classify, check_compliance, generate_documentation, search_regulation) over a local SQLite of regulation text. **Zero** `subprocess` / `os.system` / `eval` / `exec` / network / file-write / `shell=True`. Same shape across the compliance fleet.
- **Auth + rate-limiting is a shared, consistent layer.** `auth_middleware.py` (`check_access`, `require_tier`, tiered limits FREE 10/day → ENTERPRISE) is imported by the compliance MCPs; standalone servers (e.g. `care-membrane-mcp`) also implement per-caller daily rate limits. Free tiers are capped.
- **PII-in-output risk is low.** `audit_log` records a `result_summary` and a hashed key — not full user input. Tools are stateless; they don't persist or echo back arbitrary user PII.
- **The one action-taking MCP is well-guarded:** `email-automation-mcp` (`send_email`, `read_inbox`) actually uses `smtplib` to send real mail — but it's (a) gated by `check_access(api_key)`, (b) has a `confirm: bool = True` human-in-the-loop parameter, and (c) requires operator-supplied SMTP creds via env vars (nothing hardcoded). This is the right pattern; just ensure docs make the auth requirement loud.
- **Prompt-injection is handled defensively**, not just tolerated: `agent-prompt-injection-firewall-mcp` (scan_prompt / define_custom_rule / sign_firewall_attestation) and the compliance tools' own `THREAT_PATTERNS` regexes (jailbreak / "ignore safety" detection in `care-membrane-mcp`). No tool blindly executes instructions from its text input.

**Safety flags (minor):**
- `email-automation-mcp` is the single highest-abuse-surface MCP — keep the `confirm` default `True` and the auth gate; never ship a variant that auto-sends. (No issue today; noting for future edits.)
- Consider documenting an explicit "all tools are read-only & stateless" line in every README/llms.txt (the eu-ai-act llms.txt already does this — it's a great trust signal for AI answer engines and security reviewers).

### AEO / GEO — AI answer-engine + generative-engine discoverability

**Headline:** The *flagship* discoverability is genuinely excellent — but it's concentrated in ~3 repos. The fleet has near-universal machine-readable MCP metadata (`server.json`, `.well-known/`) yet is **missing `llms.txt` on ~90% of repos** and lacks per-tool README docs outside the flagships. Closing that gap is the single biggest lever for ranking in ChatGPT / Claude / Perplexity / Google AI Overviews for "<framework> compliance MCP" queries.

What's strong:
- **`server.json` follows the official MCP schema** (`2025-12-11`) with proper `io.github.CSOAI-ORG/...` namespacing and PyPI package identifiers — present on nearly every repo. Great for MCP-registry / Smithery / Glama indexing.
- **`.well-known/mcp-server-card.json`** present fleet-wide — strong structured metadata for agent discovery.
- **Repo descriptions are keyword-rich and specific** (e.g. *"GDPR compliance MCP — DPIA automation, Article 30 records, Article 22 automated decision-making audit"*). This is exactly what LLM retrieval rewards.
- **The `eu-ai-act` `llms.txt` is best-in-class:** per-tool entries with params, return shapes, AND "Use when:" selection hints. An LLM asked "EU AI Act compliance MCP" would surface and correctly use this.

What's weak (gaps → recommendations):

**Top 5 AEO/GEO recommendations (prioritized):**
1. **Roll out `llms.txt` to the whole public fleet.** Confirmed present only on `eu-ai-act`, `nis2`, `bias-detection`; **absent on gdpr, hipaa, soc2, iso-42001, care-home-cqc, and the long tail.** `llms.txt` is the highest-leverage AEO artifact. Template it from the eu-ai-act one (per-tool: params, returns, "Use when:") and generate across all MCPs. This alone should materially lift AI-answer surfacing.
2. **Add a per-tool "## Tools" section to every README.** Long-tail READMEs (e.g. gdpr) have install + a one-line description but **no tool documentation** — LLMs have nothing concrete to cite. Mirror the llms.txt tool list into the README so both human and AI crawlers get it.
3. **Fix auto-generated H1 casing** ("Gdpr Compliance Ai MCP" → "GDPR Compliance AI MCP", "Eu Ai Act" → "EU AI Act"). The H1 is what AI Overviews quote as the title; acronym-correct titles read as authoritative and match query phrasing.
4. **Add FAQ / structured Q&A blocks** ("What is the EU AI Act high-risk deadline?", "Does this MCP need an API key?") to READMEs and a FAQ section in llms.txt. Answer-engines preferentially lift Q&A-shaped content into direct answers. Pair with JSON-LD `FAQPage`/`SoftwareApplication` schema on the public marketing pages (meok.ai/councilof.ai) that link to these repos.
5. **Strengthen the citation graph + freshness signals.** Ensure each repo's README links to the canonical hub (meok.ai / councilof.ai) AND those hubs link back to the repos and to an `llms.txt` at the domain root; keep `server.json`/PyPI versions in lockstep (some show e.g. v1.6.1 — keep CHANGELOG + version current, since recency boosts GEO ranking). Submit/refresh listings in the MCP Registry, Smithery, Glama, and mcp.so so multiple authoritative indexes corroborate the same metadata (answer-engines weight cross-source agreement).

---

## Summary of actions taken
- **Made private:** `cobol-bridge-substrate` (severed-brand site) + scrubbed its homepage/topic metadata.
- **Pushed scrubs to main:** `retail-ai`, `gaming-ai`, `thn-global` (CSGA/Terranova → MEOK AI Labs), `dora-compliance-mcp` (removed local path leak).
- **Verified clean:** no personal PII, no real secrets, family/guardian MCPs hold no real family data, flagship data dirs are regulation text only.
- **Did NOT touch:** any Stripe/pricing links, any code logic, the `~/clawd` functional path pattern (flagged instead).

**Report path:** `/Users/nicholas/clawd/revenue/SCAN_OVERVIEW_2026-06-06.md`
