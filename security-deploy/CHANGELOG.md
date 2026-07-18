# MEOK changelog
# https://keepachangelog.com/ format
# All notable changes to the MEOK Sovereign AI OS + the 32-server MCP fleet

## [Unreleased]

## [2026-06-15] — D4 handoff
### Added
- New MEOK pages: pricing-vs-big4, customers, careers, partners-page, legal-acts-tracker, events, data-residency, supplier-portal
- New D5 pages: subscribe (7-day sequence), live-demo (1-model quick_scan)
- New D6 pages: clock-embed (1-line JS), aeo-registry (15 directories), transparency (full audit trail), cert-lookup (free tool), apply-48h (real Stripe checkout)
- New D7 pages: cs-submit, compare, free-trial, partner-sign, policy-gen, meme, care-special
- New D8 pages: press, investor-tau, compliance-dash, partner-finder, annual-report, hackathon-mu
- New ALIGN pages: manifest (SOV3 audit trail), audit-feed (live keystone), sitemap-index (all 60 sub-domains), badge (6 SVG), positions (3 open roles)
- New REV pages: keystone-playground, live-calendar, integrations-deep
### Changed
- Fixed status-ping script: follows Vercel 307 redirects (meok.ai + proofof.ai apex → www)
- Replaced founder-blog 5 long-form posts (got 321 chars, replaced with 5 separate hermes_ask calls)
### Security
- SOV3 security ensemble: 13th lens `adversarial_corpus` (BFT council, 45 nodes consensus)
- worm_guard: 4 new CRITICAL patterns from CL4R1T4S corpus (leetspeak + self-replication)
- New sandboxed adversarial corpus server (CL4R1T4S) on :8765, persistent via launchd
### Cron
- 5 launchd plists LOADED: auto-fire-emails (Mon 09:00), daily-sov3-sigil (daily 08:00), weekly-indexnow (Mon 10:00), status-ping (daily 09:00), adversarial-corpus-server (persistent)
- 3 crontab lines ALSO installed (2 layers of cron redundancy)
### Migration
- 8/8 source dirs on meok-backend:/home/nicholas/empire_mirror/ (CSOAI + MEOK + NetworkNick + Documents, 3.0GB total)
### Sigils
- SOV3 Ed25519 chain: 27+ sigils, latest digest `400d9819ac9e96ee` (sigil #41)

## [2026-06-13] — MEOK Gaming hive activation
### Added
- 3 MCP servers: blizzard-wow-mcp (10 tools), mmoagent-mcp, evergame-hive-mcp
- COAI certification (4 Sigil: A/H/M/P/C)
- 1 sigil chain of 9+ on Ed25519
- 3 GitHub repos
### Sigils
- 22 sigils on Ed25519 chain, latest digest `edb550f35040b05893480e19ef0eecaa2dc28bbb3577eb7ad4fb7686503af1cafb85308b931fbbe346ccfdda5abc83684cbc2d4d92d6795a35ccf77c4393ed08`

## [2026-05] — Keystone v1.0 → v1.2
### Added
- 17 keystone endpoints (HMAC-SHA256 + Ed25519)
- 4 paywalled tools (DORA audit_all_pillars, UK AI Bill sign_uk_ai_readiness_attestation, EU AI Act generate_documentation, EU AI Act audit_report)
- Sign + verify E2E proven: cert_id `MEOK-REGULA-70F29E6B600F` round-trips with `{valid: true, message: "Signature valid"}`
- 4 webhook handlers (Stripe checkout.session.completed + 3 others)

## [2026-04] — CSOAI.org incorporated
### Added
- CSOAI Ltd, UK Companies House 16939677
- 100% Nicholas Templeman ownership
- csoai.org: 6+ charter articles, 12-framework master crosswalk, AISI alignment

## [2026-03] — Sovereign AI OS launches
### Added
- meok.ai: 145KB home, 12+ character pages, persistent memory, multi-LLM routing
- Maternal Covenant: care-as-generative-principle for AI alignment
- 107 archetypes (Jungian + MBTI + Enneagram + Tarot synthesis)
- Birth ceremony: 7 questions → egg hatches → companion emerges
- 107 MEOK characters marketplace

[Unreleased]: https://meok.ai/changelog
