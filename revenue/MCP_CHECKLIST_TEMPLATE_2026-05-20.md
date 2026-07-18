# 100/100 Per-MCP Checklist + Top 10 Scorecard
**Generated:** 2026-05-20

## Master Checklist (100 points total)

Pass threshold: **≥85/100**. Any failure in section D (regulatory) is a blocker regardless of total.

### A. Distribution (24 pts)
- A1 (3) PyPI published, name matches `<slug>-mcp`
- A2 (3) PyPI version ≥1.0 updated <60 days
- A3 (2) PyPI README renders
- A4 (2) PyPI classifiers complete (MIT, Topic, Audience, Status ≥4-Beta)
- A5 (3) **npm @meok-ai scope** (NOT csga_global)
- A6 (3) GitHub repo at **meok-ai-labs org** + MIT LICENSE
- A7 (1) GitHub topics: mcp, mcp-server, model-context-protocol, compliance, vertical
- A8 (3) Anthropic MCP Registry server.json valid, version matches PyPI
- A9 (2) Smithery.ai published
- A10 (1) Glama.ai auto-indexed
- A11 (1) mcp.so submitted

### B. Documentation (14 pts)
- B1 (2) README ≥150 lines, 3+ usage examples
- B2 (2) Install for **all three** runtimes: uvx + pip + npx
- B3 (2) Screenshot or GIF
- B4 (1) Link to meok.ai/mcp/<slug>
- B5 (1) Cross-links to ≥3 related MCPs
- B6 (2) CHANGELOG.md Keep-a-Changelog
- B7 (2) Per-tool docstrings exposed via MCP definitions
- B8 (1) Migration guide for breaking changes
- B9 (1) API reference auto-generated

### C. Code Quality (16 pts)
- C1 (3) Type hints; pyright --strict clean
- C2 (3) ruff check . clean
- C3 (3) Test coverage ≥60%, ≥8 tests
- C4 (3) GitHub Actions CI on every PR
- C5 (2) .pre-commit-config.yaml enforces ruff + format + pyright
- C6 (2) pyproject.toml standardised

### D. Compliance Accuracy (16 pts) — ANY FAILURE = BLOCKER
- D1 (4) Source citations link to actual regulation (EUR-Lex CELEX, gov.uk, NIST)
- D2 (3) `last_verified` date stamps within 90 days of amendments
- D3 (3) Author attestation file: "AI-assisted, human-reviewed by [name] on [date]"
- D4 (2) Disclaimer footer: "not legal advice"
- D5 (2) Diff tracker: regulation amendment → auto-filed issue
- D6 (2) HMAC-signed attestation tool + key rotation docs

### E. Marketing Surface (12 pts)
- E1 (2) meok.ai/mcp/<slug> HTTP 200 + schema.org SoftwareApplication
- E2 (2) Stripe Starter (£29-49) + Pro (£99-149) with metadata mcp_slug + tier + mrr
- E3 (1) 14-day trial + /thanks redirect
- E4 (1) Buy URL in README, top of fold, no broken link
- E5 (2) PyPI install-count badge in README
- E6 (2) GitHub stars badge points to correct org
- E7 (2) Trust signals: MIT badge, MCP-registry badge, "X teams using"

### F. Funnel (10 pts)
- F1 (2) Free tier: uvx <name> works without API key/signup
- F2 (3) Stripe webhook → Resend welcome email on subscription.created with HMAC key + 5-step onboarding
- F3 (2) README onboarding: 5 concrete steps uvx → first signed artefact
- F4 (2) In-tool upgrade prompt at 80% usage
- F5 (1) Cross-sell strip on landing page (3 sibling MCPs)

### G. Maintenance (8 pts)
- G1 (2) .github/dependabot.yml for pip + github-actions
- G2 (1) Renovate.json for npm
- G3 (2) .github/ISSUE_TEMPLATE/ has bug.yml + feature.yml
- G4 (2) SECURITY.md + 24h SLA + security@meok.ai
- G5 (1) ROADMAP.md updated <30 days

## Top 10 MCP Scorecards

| MCP | Score | Top missing items | Quickest 30-min win |
|---|---|---|---|
| eu-ai-act-compliance | **72/100** | Version drift (pyproject 1.5.1, server.json 1.0.0, PyPI 1.4.4), no @meok-ai npm, no ruff, no dependabot, broken stars badge | `scripts/bump_version.sh` — +12 pts |
| bias-detection | **58/100** | Zero structured tests, server.json drift, no GIF, no D2 dates, no D3 attestation | Create `tests/`, 5 pytest cases, pytest-cov — +10 pts |
| ai-bom | **65/100** | README <150 lines, server.json drift, no @meok-ai, no D2 dates | Add CycloneDX example + SPDX 3.0 example + last_verified — +8 pts |
| dora-compliance | **63/100** | README only 93 lines, three-way version drift, no @meok-ai, no ruff | Release 1.2.9 + sync server.json + double README — +9 pts |
| nis2-compliance | **62/100** | README 90 lines (shortest), three-way drift, weak D1 | 100-line README rewrite + 3 EUR-Lex links — +8 pts |
| cra-compliance | **64/100** | server.json drift, no @meok-ai, no pre-commit, 1 test file | Sync server.json + ruff + pytest config — +7 pts |
| dora-nis2-crosswalk | **51/100** | Major version drift (1.0.3 vs PyPI 1.1.0), missing CHANGELOG+CONTRIBUTING+SECURITY+COC, no smithery.yaml | Copy 4 governance docs from eu-ai-act-compliance + bump versions — **+13 pts** |
| agent-prompt-injection-firewall | **48/100** (lowest) | README only 79 lines, missing all 4 governance docs, no smithery.yaml + manifest.json + ISSUE_TEMPLATE, no OWASP citation | Scaffold 4 governance docs + add OWASP LLM01 citations + 200-line README — **+15 pts** |
| watermarking-authenticity | **60/100** | Two-major version drift (1.0.3 vs PyPI 1.2.0), no CHANGELOG, npm local-only | Rebase to 1.2.0 + reconstruct CHANGELOG from git log — +9 pts |
| ai-incident-reporting | **53/100** | Major version drift, missing 4 governance docs, no smithery.yaml, 6 D1 citations missing | Copy 4 governance docs + smithery.yaml + bump to 1.1.0 — +12 pts |

**Average: 59.6/100.** Pass threshold 85. **No MCP currently passes.**

## Aggregate Gaps (≥7 of 10 affected)

1. **Version drift** pyproject↔server.json↔PyPI (10/10)
2. **No @meok-ai npm publish** (10/10) — csga_global rename not done
3. **No ruff/pyright config** (10/10)
4. **No .pre-commit-config.yaml** (10/10)
5. **No dependabot.yml** (10/10)
6. **No ROADMAP.md** (10/10)
7. **README <150 lines** (5/10: dora 93, nis2 90, ai-bom 133, agent-injection 79, ai-incident 129)
8. **Missing 4 governance docs** (4/10: crosswalk, injection-firewall, incident-reporting, partly watermarking)

## Automation Strategy

### Enforce via CI/scripts (do once, gates forever)

1. **`scripts/bump_version.sh <slug> <new_version>`** — reads pyproject, rewrites server.json + package.json, commits + tags. Closes A8+B6+E5.
2. **`scripts/lint_publish_meta.py`** — fails build if versions disagree or metadata incomplete. Run on every PR.
3. **`scripts/publish_all.sh`** — twine upload + npm publish --scope @meok-ai + mcp-publisher publish in sequence. Eliminates "PyPI updated, server.json forgotten".
4. **`meok-mcp-template`** GitHub template repo with `.github/workflows/{ci,publish,scorecard}.yml`, dependabot, ISSUE_TEMPLATE, pre-commit, governance docs, ROADMAP. New MCPs start at ~75/100.
5. **`scorecard.py`** — reads pyproject + server.json + README + tests + meok.ai HTTP code + PyPI stats → grade. Block CI merges that regress below 85.
6. **ruff + pyright in pyproject** added once to template; pre-commit picks up.
7. **Shared Cloudflare worker** keyed on Stripe webhook customer.subscription.created → metadata.mcp_slug → lookup template → Resend. Solves F2 portfolio-wide.
8. **schema.org JSON-LD layout** on `meok.ai/mcp/<slug>` — single Next.js layout change reads JSON manifest. Solves E1 portfolio-wide.

### Keep manual (editorial judgement)
- D1 citation (EUR-Lex CELEX requires human verification)
- D3 author attestation (Nick signs personally)
- B3 screenshots (per-MCP recording)
- B7 per-tool docstrings (hand-written)
- D5 regulatory diff watcher (human eyes on amendment text)
- README copywriting beyond template

### 30-day priority order

1. **Build meok-mcp-template + scorecard.py** (1 day) — unblocks everything
2. **Run bump_version.sh across all 10** (1 hour) — +60 grade points total
3. **Copy governance docs to crosswalk + injection-firewall + incident-reporting** (90 min) — +40 points
4. **Single shared Resend webhook + schema.org JSON-LD layout** (half day) — closes E1 + F2 portfolio-wide
5. **@meok-ai npm publish across all 10** (one afternoon) — closes A5
6. **Per-MCP screenshot session** (1 evening) — closes B3

After steps 1-6: bottom 3 (injection-firewall 48 → 80+, crosswalk 51 → 80+, incident-reporting 53 → 80+) jump above 80; top 4 (eu-ai-act, ai-bom, bias-detection, cra) cross 85 pass threshold.
