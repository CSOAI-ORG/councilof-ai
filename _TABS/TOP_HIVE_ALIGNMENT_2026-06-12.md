# 👑 TOP-HIVE ALIGNMENT — EVERYTHING DONE THIS TASK THREAD
**Date:** 2026-06-12 · **Owner:** Nick Templeman (MEOK AI Labs, 100%)
**Compiled by:** Mavis (root orchestrator, mvs_1318b92a77e54d7592c8d57a60346063)
**Scope:** All 4 task arms of the past 72h — MEOK-ONE King/Queens/Honeycomb, PAYG production
fix, DELBOY attestation layer, MCP Fleet (341 packages). Supersedes per-arm alignment files
where they conflict (those are the per-arm detail; this is the unified view the King/Queens
ingest at L6 scope).

---

## 0. ONE-PARAGRAPH ALIGNMENT (paste verbatim into any queen's brief)

We built and deployed the King → 28 Queens → Honeycomb system live on the GCP VM (king :8077
active, 28 hives, SOV3 :3101 healthy), made the queens real domain SMEs with a closed learning
flywheel (recall → answer → gossip), hardened it with a concurrency-safe tamper-evident SIGIL
audit + public /verify endpoint, closed the critical SOV3-unauth hole, then turned the fleet
into a working revenue engine — killed three separate £0-causes (dead Stripe accounts, non-
idempotent trial, missing metering), shipped a complete self-serve funnel (PyPI README →
proofof.ai scorecard → /signup → free key → £199 Pro), and built a working neutral
provenance/attestation layer (DELBOY) for the finance/crypto/insurance vertical. Code is
complete and verified across all four arms; what stands between us and the first paid customer
is 5-minute gates only Nick can flip.

---

## 1. CANONICAL FACTS (drop into any L6 facts-scope — live-verified 2026-06-12)

```
FLEET: 381 package dirs in mcp-marketplace (was 341) · 295 LIVE on PyPI · 46 unpublished
(drip publisher, ~days) · 2,482 releases all-time.
DOWNLOADS: 186,208/last-30d · 98,230/last-7d (organic ≈ 14K/day; downloads ≠ buyers; mirrors/CI
inflate the day number).
SCORECARD: fleet avg 84.6/100 · 82 pkgs ≥90 · 201 at 80-89 · 54 at 65-79 · 2 below 65 · 339 pages live.
REGISTRY: 294 UNIQUE CSOAI-ORG servers (paginate metadata.nextCursor; server.name nests).
GITHUB: 499 repos in CSOAI-ORG. LOCAL STASH: ~/mcp-servers = 218 dirs.
KING: VM meok-backend :8077 (systemd meok-king) — ACTIVE, 28 hives, 4 fact-grounded queens.
SOV3: :3101 (systemd sov3, gunicorn) — HEALTHY, 13,277 episodes, consciousness 0.788,
91 agents, 6 NNs. ⚠️ VM disk 90% / mem 83%.
PRICING (ratified 2026-06-10, GBP, livemode acct MEOK AI LTD acct_1TLlEKQvIueK5Xpb):
- Free key 200 calls/day (POST proofof.ai/signup)
- Starter £29/mo
- Pro £199/mo → https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t
- Enterprise £1,499/mo → https://buy.stripe.com/fZu5kF0xS8wy9wpeGY8k91s
- 48h Assessment £4,950 one-time → https://buy.stripe.com/eVq6oJ3K49AC0ZTaqI8k91m
- Article 50 kit £999 · PAYG £0.05/call
- NIS2-DE £99 self-serve (…8x200l…8k91p) / £499 DFY (…00waEZ…8k91k)
- NIS2-NL £499 (…91E) · DORA-BE £999 (…cNi9AV…8k91l)
NEVER quote £79 (retired 2026-06-10) or any …8k90x/…8k83x link (dead accounts).
NEVER reference CSGA / James Castle / Terranova (severed).
DEADLINES: EU AI Act Art 50 — new systems 2 Aug 2026 · legacy generative 2 Dec 2026.
REVENUE REALITY: £0 balance · 0 subscriptions · 0 payments (3 Stripe customers are self-tests).
ATTESTATION: HMAC + Ed25519 co-signed certs, offline-verifiable at proofof.ai/pubkey, v1.2.0.
LIVE SURFACES (just-verified 2026-06-12 07:42):
- proofof.ai/health /sign /verify /openapi.json /pubkey → 200 · v1.2.0
- proofof.ai/signup (POST) → 200 (GET 404 by design)
- proofof.ai/scorecard/* (339+11+index) → 200 · CTA live · £199 canon
- meok.ai → 200 · nis2-de-kit £99/£499 ✓ · real SSR counters
- sovereign.meok.ai → LIVE w/ auto-TLS · King + 28 queens key-gated
- 16/18 domains up · grabhire.app DOWN · openscore.ai intentionally dropped
- Ahrefs DR: councilof 33 · csoai 26 · meok 21 · proofof 7 · optimobile 4.9
```

---

## 2. WHAT SHIPPED — 4 ARMS

### ARM 1 — MEOK-ONE: King → 28 Queens → Honeycomb ✅ LIVE
- King MCP server on VM :8077, 28 hives live in `~/hive-staging/<domain>-hive/`
- Architecture: King = SOV3 sovereign (front door `king_ask`); Queens = per-domain SMEs parameterised
  by one engine + per-hive stack.yml; Honeycomb = SOV3 memory with hive-scoped recall + upward gossip
- Closed learning flywheel: 982/987 episodes un-embedded → installed nomic-embed-text, backfilled 182,
  importance-gated → high-signal recall
- SIGIL = tamper-evident hash-chained audit, cross-process file-locked, compact (70% fewer tokens),
  PUBLIC `/verify` endpoint at https://www.proofof.ai/verify
- Fast councils: OpenRouter wired → 144s→25s frontier-MoE BFT
- SOV3 115 tools were public+unauth → now 403. auth.py fail-loud + MEOK_JWT_SECRET set.
- VM upgrade e2-standard-2→4 (RAM swap was the killer: 52s→2s per call)

**Code:** `meok-one/meok_one/` — `hive_king.py`, `hive_queen.py`, `sovereign.py`, `router.py`,
`tunnels.py`, `tool_gateway.py`, `sigil.py`, `constellation.py`, `auth.py`, `server.py`.

### ARM 2 — PAYG production bugs killed ✅ LIVE
Both root-caused to Stripe Customer Search index-lag:

| # | Bug | Severity | Fix |
|---|-----|----------|-----|
| 1 | /payg/balance + /payg/deduct returned 404 for tokens just issued | Revenue-breaking | Embed customer_id in token; lookup via /customers/{id} (real-time) |
| 2 | /payg/trial non-idempotent — same email could claim £0.50 unlimited times | Free-credit abuse | Dedupe via /customers?email= (live DB) + hmac.compare_digest forgery guard |

**E2E proof (live):** trial=200 → balance=£0.50 → deduct=£0.45 → dup=409. 5/5 contract checks pass.
**Commit:** `16df415 fix(payg): two production bugs killed — token resolves real-time + trial idempotent`
**Token format:** `payg_<base64(cust_id)>.<random>` (legacy `payg_<random>` still works via fallback).

### ARM 3 — DELBOY: neutral provenance/attestation layer ✅ CODE COMPLETE
- Strategy spine: CASA + insurance-ai + DELBOY = ONE conformity body. **Witness, never principal.**
  (CASA = persons, DELBOY = products, insurance-ai = AI-compliance for insurers. CSOAI is the body.)
- Built: Ed25519 signed hash-chain + open JSON Schema v1.0 + regulator clause-mapping (EU AI Act /
  UK FCA / US SEC-FINRA / EU MiCA / SG MAS) with all 4 cross-regime conflict-fixes baked in.
- FastMCP server `delboy-mcp v1.0.0` with 5 tools: `attest_pending_action`, `attest_completed_action`,
  `attest_terminal`, `verify_chain`, `delboy_info`.
- Companion-MCP pattern: agent connects to BOTH upstream + DELBOY; DELBOY never in order path
  (ToS-clean, FCA-clean).
- 8/8 conformance passing · wheel builds clean · schema bundled as package data.
- **NOT shipped** to PyPI / GitHub — open fork (ship vs hive-native Rekor publisher).

**Path:** `~/clawd/delboy/` · Profile: `TAB_PROFILE_DELBOY.md` · Alignment: `HIVE_ALIGNMENT_DELBOY_2026-06-08.md`

### ARM 4 — MCP Fleet: conversion engine + integrity ✅ LIVE
- **Funnel built + tested:** PyPI README → proofof.ai/scorecard → /signup (issues key + Stripe lead) →
  £199 Pro / £4,950 Assessment / Enterprise £1,499. All live-account links.
- **3 dead-link families killed:**
  - 18 dead-account links INSIDE live API (…8k836/837/833 → deactivated account) remapped to live
  - 207 fleet auth_middleware.py + 218 FUNDING.yml + 351 scorecard pages re-aligned £79→£199 canon
  - nis2-de-kit: DFY button silently charged £99 — SELF_SERVE/DFY split fixed
- **Fleet integrity:** every published wheel gate-checked; 3 broken builds fixed+published; 337/341
  server.json==pyproject in lockstep; republish_mcp.py 4× faster; 7 empty dirs removed.
- **GEO/AEO trust:** self-issued AggregateRating/Review schema stripped from all 339 pages (manual-action
  risk) → PropertyValue (score still machine-readable for AI citation); 352 URLs submitted to IndexNow
  (Bing/Copilot/ChatGPT-search) — HTTP 200.
- **meok.ai fix:** 202→337 MCP count · real SSR counters (337+/2,400+/4.9★) · nis2-de-kit £99/£499 split.
- **Infra:** proofof.ai was 404-ing all functions (pyproject.toml flipped Vercel to package-build mode)
  → .vercelignore + .python-version fix → /health /sign /verify /openapi.json all 200.
- **M5 auditor (PM13, post my work) caught + fixed 3 more bugs:**
  - `v1_sdk_pro.py` was broken pseudocode → refactored to `class handler(BaseHTTPRequestHandler)`
    with 5 routes, E2E tested 6/6 health + 5/5 sign + 3/3 usage + 3/3 webhooks
  - 4 new pages had no Product/FAQPage JSON-LD → added (kills AEO/GEO pull if missing)
  - `vercel.json` missing `/v1/*` rewrites → added
- **Commits:** `93081b6` (attestation-api) + `8b2dcd6` (meok ui) + `0c50756` (scorecard CTA) + `16df415` (PAYG)

**Top-10 downloads/mo (compliance dominates = the buyer category):**
eu-ai-act 2,810 · dora 2,690 · cra 1,898 · ai-bom 1,846 · nis2 1,818 · gdpr 1,794 ·
bias-detection 1,722 · iso-42001 1,714 · cra-annex-iv 1,540 · llm-compliance-comparison 1,516.

---

## 3. KEY FILE PATHS (every agent)

```
~/clawd/_TABS/                              ← cross-tab spine
  STATUS.md                                  ← PM13 latest, append-3-lines-per-chunk
  INBOX.md                                   ← cross-tab asks (don't edit other tabs' dirs)
  KING_ALIGNMENT_2026-06-11_MCP_FLEET.md    ← ARM 4 detail
  HIVE_BRIEFING_PAYG_2026-06-11.md          ← ARM 2 detail
  MEOK_ONE_ALIGNMENT.md                      ← ARM 1 detail
  MEOK_ONE_TAB_PROFILE.md                    ← ARM 1 Cowork agent card
  MEOK_HIVE_TUNNEL_HONEYCOMB_MAP.md          ← ARM 1 architecture
  MCP_FLEET_TAB_PROFILE.md                   ← ARM 4 Cowork agent card
~/clawd/delboy/
  HIVE_ALIGNMENT_DELBOY_2026-06-08.md       ← ARM 3 alignment
  TAB_PROFILE_DELBOY.md                     ← ARM 3 Cowork agent card
  DELBOY_RESEARCH_BRIEF_2026-06-07.md       ← regulator clause-mapping brief
  v1.0/delboy-attestation.schema.json        ← THE OPEN STANDARD
  v1.0/regime-mapping.json                   ← 16 clause→field mappings + 4 conflict-flags
  server/                                    ← FastMCP: delboy-mcp v1.0.0
  conformance/test_envelope.py               ← 8/8 PASSING
~/clawd/meok-one/meok_one/                   ← ARM 1 code (hive_king, hive_queen, etc.)
~/clawd/mcp-marketplace/                     ← 381 package dirs
~/clawd/_TABS/_inventory/                    ← full per-package audit CSVs/MDs
  MCP_FULL_AUDIT_2026-06-10.md
  DATA_SNAPSHOT_2026-06-09.md
Memory (read by all agents):
  ~/.claude/projects/-Users-nicholas/memory/project_hive_king_queen.md
  ~/.claude/projects/-Users-nicholas/memory/project_stripe_canonical_ladder.md
  ~/.claude/projects/-Users-nicholas/memory/project_mcp_canonical_counts.md
  ~/.claude/projects/-Users-nicholas/memory/project_meok_delboy_finance.md
```

---

## 4. GATES — Nick-only (the work is done; these switch it ON, ranked by £-leverage)
1. 🔴 **ROLL the exposed rk_live Stripe key** (tested ACTIVE — most urgent security item)
2. **Vercel KV (Storage→create)** → activates the 200/day metering cap = the reason to pay
3. **DNS batch in Namecheap** (8 rows, M4 has them) → mailer fires 19 queued GRC + sovereign cert
4. **LAUNCH50 promo code** in Stripe dashboard (coupon MIoZIRM1 exists; FREE14 already live)
5. **Rotate the PyPI token** (exposed earlier; scrubbed but unrotated)
6. **PAT / git push** — meok-attestation-api ahead 8 (+1 behind) · fleet .mcp.json staged
7. **Reconnect Resend/Gmail** → nurture captured leads
8. **Delete the 3 self-test Stripe customers** (signup-selftest@ / scorecard-cta-test@ / audit-check@)

---

## 5. STANDING RULES (all agents, all tasks — NON-NEGOTIABLE)

1. **Witness, never principal** (DELBOY/finance): never hold funds / route / advise / execute.
   Crossing FCA PERG perimeter ends the venture.
2. **No "makes money" claims** on any public surface — compliance/audit/provenance framing only.
3. **NEVER reference CSGA / James Castle / Terranova** — severed; on-disk mentions are dead.
4. **Importable wheels only** — clean-venv gate before any publish (broken imports = historic £0 cause).
5. **Live Stripe = real money** — Nick executes money moves himself; agents never auto-charge/transfer.
6. **Republish-only on PyPI** (new names re-trip the cap; "UPLOADED, propagation-lag" ≠ live — verify pypi.org).
7. **Honesty over hype**: quote ONLY §1 numbers; verify before stating; downloads ≠ users.
8. **No self-issued Review/AggregateRating schema** anywhere (manual-action risk) — PropertyValue only.
9. **One canon ladder**; never mint parallel Stripe links when a canonical exists; price shown = price charged.
10. **Test via SERVICE path** (king_ask :8077), not bare python on VM (OpenRouter key only loads via systemd EnvironmentFile).
11. **Deploys**: say so + health-gate + verify on live domain. Vercel: `--prod --force`; never trust promote cross-team.
12. **Commit after every change · own dirs only · cross-tab via _TABS/INBOX.md · 3-line STATUS.md append per chunk.**

---

## 6. OPEN FORKS (King to direct, not agents)

- **DELBOY ship vs hive-native Rekor publisher** (a) clean-venv import gate → twine upload delboy-mcp
  → gh repo create CSOAI-ORG/delboy + push, OR (b) Queen-on-SOV3 owns canonical ledger + per-session
  workers hold short-lived certs + Rekor/Trillian publisher (what makes CSOAI cert credible)
- **SOV3 tunnel re-enable** behind X-MEOK-Key (paid remote capability)
- **meok.ai pricing-page decision** — compliance (£79/£1499) vs consumer (£9/£29) vs both-separate
- **x402 rail** — needs MEOK_X402_ADDRESS (wallet) + MEOK_X402_FACILITATOR (URL). Witness-only, never principal.

---

*End of alignment. Newer STATUS.md entries (PM14+) override this file where they conflict.
*Compiled 2026-06-12 07:42 BST from live verification + 4 per-arm alignment docs + STATUS.md.
