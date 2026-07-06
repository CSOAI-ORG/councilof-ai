# 🐉 DAY 5 — csoai.org FOCUS — 12-move plan
**Date:** 2026-06-15 (Day 5 of 53, T-44 to Article 50)
**Focus:** csoai.org (the compliance/AI safety arm of MEOK AI Labs, UK Companies House 16939677)
**Why csoai:** highest-trust, highest-revenue surface. Article 50 content matrix is built. Stripe links are wired on pricing. Just need to plug conversion leaks + AEO + content polish.

**Asset inventory (verified by ls/grep):**
- 100+ HTML pages in public/
- 3 flagship pillar pages: `/mcp-distribution.html`, `/mcp-packs.html`, `/article-50-kit.html`
- All 8 Stripe payment links live on `/pricing` and `/checkout`
- **`public/security.asc`** is untracked (GPG signing key for csoai)
- Has 11 blog posts, 8 guides, ~50 industry pages
- 5 sites in the meok fleet all link to csoai.org

**Conversion leaks (audit):**
- `/article-50-kit.html` has 0 Stripe links (should have £999 buy button)
- `/enterprise.html` has 0 Stripe links (should have £1,499 buy button)
- `/partner.html` has 0 Stripe links (should have revenue-share CTA)
- `/verify.html` has 0 Stripe links (should have free keystone cert CTA)

| # | Move | Type | Time |
|---|------|------|------|
| 1 | Add Stripe buy button + £999 link to `/article-50-kit.html` | conversion | 15 min |
| 2 | Add Stripe buy button + £1,499 link to `/enterprise.html` | conversion | 10 min |
| 3 | Add Stripe + partner CTA to `/partner.html` | conversion | 10 min |
| 4 | Add free keystone cert CTA to `/verify.html` | conversion | 10 min |
| 5 | Add Article 50 Stripe buy to homepage `/index.html` (currently only has 3 links) | conversion | 15 min |
| 6 | Fix pricing.html H1 (missing) + add tier comparison table | content | 20 min |
| 7 | Add `public/security.asc` to git (GPG sig for content authenticity) | ops | 5 min |
| 8 | Add csoai.org to GitHub as `CSOAI-ORG/csoai-org.github.io` mirror (creates the phantom 404) | ops | 5 min |
| 9 | Write 1 csoai-flavoured prospect email (replaces Monzo generic) | content | 15 min |
| 10 | Add llms-full.txt to csoai.org (currently only llms.txt, full version is 4x richer) | AEO | 10 min |
| 11 | Add csoai.org to the daily keystone cert cron as a separate branding | content | 5 min |
| 12 | End-of-day seal + sigil | verify | 5 min |

**Total: ~2 hours of work, 100% no-env-keys, all on the canonical csoai-org/ repo.**
