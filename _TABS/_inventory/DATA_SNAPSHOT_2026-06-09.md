# 📊 MEOK Fleet — Full Data Snapshot (2026-06-09)
*Pulled live: pypistats.org (downloads), Ahrefs free DR, curl (liveness), Vercel CLI, Stripe API.*

## TL;DR — strong distribution, zero monetisation (yet)
- **PyPI: 186,208 downloads / last 30 days** across the fleet — real traction.
- **Stripe: £0 balance · 0 active subscriptions · 0 succeeded payments.** Conversion = the gap.
- The £0-root-cause (wrong Stripe links) was fixed this session; links now hit the live account, but no checkouts have converted yet, and lead-capture (`/signup`) isn't live.

## PyPI downloads (pypistats — incl. mirrors/CI)
- **Last 30 days: 186,208** · last 7 days: 98,230 · last day: 26,961*
- *Today's 27K is inflated by this session's 335-package republish (mirrors re-pull new versions). Organic ≈ last_week/7 ≈ 14K/day.
- Coverage: **341 packages scanned · 230 have download stats · 111 too new for stats** (published this session; will appear in 1-2 days → fleet total will rise).

### Top 30 packages by last-month downloads
| # | Package | Day | Week | Month |
|---|---|--:|--:|--:|
| 1 | eu-ai-act-compliance-mcp | 263 | 1,453 | 2,810 |
| 2 | dora-compliance-mcp | 333 | 1,413 | 2,690 |
| 3 | cra-compliance-mcp | 182 | 1,223 | 1,898 |
| 4 | ai-bom-mcp | 152 | 874 | 1,846 |
| 5 | nis2-compliance-mcp | 165 | 867 | 1,818 |
| 6 | gdpr-compliance-ai-mcp | 151 | 1,388 | 1,794 |
| 7 | bias-detection-mcp | 119 | 694 | 1,722 |
| 8 | iso-42001-ai-mcp | 151 | 1,304 | 1,714 |
| 9 | meok-cra-annex-iv-classifier-mcp | 190 | 601 | 1,540 |
| 10 | llm-compliance-comparison-mcp | 141 | 949 | 1,516 |
| 11 | deepfake-detector-mcp | 133 | 903 | 1,497 |
| 12 | encoder-ai-mcp | 107 | 500 | 1,460 |
| 13 | meok-governance-engine-mcp | 143 | 787 | 1,441 |
| 14 | a2a-governance-bridge-mcp | 152 | 874 | 1,409 |
| 15 | meok-watermark-attest-mcp | 129 | 650 | 1,409 |
| 16 | sentiment-analysis-ai-mcp | 363 | 693 | 1,376 |
| 17 | csrd-compliance-mcp | 159 | 963 | 1,333 |
| 18 | clipboard-ai-mcp | 181 | 453 | 1,328 |
| 19 | canada-aida-ai-mcp | 130 | 839 | 1,250 |
| 20 | security-scanner-ai-mcp | 124 | 860 | 1,249 |
| 21 | dataprivacy-ai-mcp | 137 | 854 | 1,233 |
| 22 | healthcare-ai-governance-mcp | 146 | 716 | 1,228 |
| 23 | agent-audit-logger-mcp | 112 | 580 | 1,212 |
| 24 | soc2-compliance-ai-mcp | 157 | 845 | 1,209 |
| 25 | meok-mcp-injection-scan-mcp | 163 | 569 | 1,208 |
| 26 | drone-airspace-governance-mcp | 119 | 809 | 1,187 |
| 27 | explainability-report-mcp | 135 | 800 | 1,169 |
| 28 | ai-incident-reporting-mcp | 133 | 595 | 1,120 |
| 29 | agent-prompt-injection-firewall-mcp | 114 | 335 | 1,093 |
| 30 | ai-self-audit-mcp | 113 | 709 | 1,091 |
- **Pattern:** compliance MCPs (EU AI Act / DORA / CRA / NIS2 / GDPR / ISO-42001) dominate. That's the paying-buyer category — and exactly where the £79 Compliance Pro upsell belongs.

## Packages / MCPs
- ~337 buildable package dirs · **335 published on PyPI** · 230 with measurable downloads.
- All published wheels gate-checked (import-clean) + carry the canonical Pro link.

## Websites — liveness + domain authority (Ahrefs DR)
| Domain | HTTP | DR | Role |
|---|---|--:|---|
| councilof.ai | 200 | **33** | CSOAI council / compliance |
| csoai.org | 200 | **26** | AI governance hub |
| meok.ai | 200 | **21** | consumer flagship |
| proofof.ai | 200 | 7 | MCP scorecard + attestation API |
| optimobile.ai | 200 | 4.9 | optometry vertical |
| openmoe.ai | 200 | 0 | dev mirror (new) |
| haulage.app | 200 | 0 | logistics umbrella (new) |
| templeman-opticians.com | 200 | 0 | family optical+care |
| agisafe.ai / dataprivacyof.ai / biasdetectionof.ai / safetyof.ai | 200 | – | CSOAI sub-brands |
| fishkeeper.ai / koikeeper.ai / aquaponics.app | 200 | – | aquaculture vertical |
| cobolbridge.ai | 200 | – | COBOL migration |
| **grabhire.app** | **000 DOWN** | – | use haulage.app instead |
| **openscore.ai** | **000 DOWN** | – | intentionally dropped (INBOX decision) |
- 16/18 checked live. Organic-traffic numbers unavailable (Ahrefs plan limit); Vercel pageview analytics not CLI-exposed (PostHog is the chosen analytics, not yet wired).

## Vercel (account: nik's projects)
- 30+ projects. Key prod mappings: `ui`→meok.ai/try.meok.ai · `meok-attestation-api`→proofof.ai · `csoai-dashboard`→csoai.org · `haulage-app-umbrella`→haulage.app · `prooof-ai`→prooof.ai · plus verticals (planthire, grabhire-ai-uk, muckaway, industrial-hire, diyhelp, pokerhud, fine-calculator, countdown…).
- High deploy churn (40+ recent on attestation-api alone) — watch the 100/day account cap.

## Revenue (Stripe — MEOK AI LTD, acct_1TLlEKQvIueK5Xpb, livemode)
- **Available £0 · Pending £0 · 0 active subscriptions · 0 succeeded payments.**
- Funnel gaps blocking conversion: (1) lead-capture `/signup` not live (needs folding into `index.py`); (2) metering not enforced (needs Vercel KV — Nick gate); (3) LAUNCH50 promo code not added (Nick gate); (4) links only just repointed to the live account.

## The one-line strategic read
Top-of-funnel is real (**~186K downloads/mo, compliance-led**). Monetisation is **£0** — the bottleneck is conversion, not traffic. Highest-leverage next moves: wire `/signup` lead-capture into the live API, point compliance-MCP downloaders at the £79 upsell + capture emails, and close the Nick gates (KV, promo code, webhook).
