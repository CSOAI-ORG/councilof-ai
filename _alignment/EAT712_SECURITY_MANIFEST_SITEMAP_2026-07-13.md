# EAT-712 SEAL — Security + Manifest + Sitemap

**Date:** 2026-07-13 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What shipped

1. `/manifest.json` (2671 bytes) — machine-discoverable surface: 48 pages, 19 API endpoints, 23-article canon, 7 hard lines, Smithery-ready
2. `/sitemap.xml` (5151 bytes) — 39 URL entries with priorities, all 48 HTML pages SEO-indexed
3. `api/index.py` — rate-limit helper (`_rate_check`) + SIGIL verification helper (`_verify_sigil`) added
4. `vercel.json` — routes for `/manifest.json` + `/sitemap.xml`, static builds updated

## Security
- Rate-limit: 10 requests per 5-min window per IP
- SIGIL verification: Ed25519 hash-chain integrity check helper
- Signup rate-limit wired (ready for activation)
