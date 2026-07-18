# GROWTH BLOCKER INVENTORY — 2026-06-15
**Mode:** Report only. No fixes. No code changes. No pushes.
**Scope:** What's stopping us from signing customers, shipping MCPs, sending mail, taking payments.
**Inputs read:** 9 reports in `~/clawd/` + live `crash-recovery.py status` + grep of Stripe / SBT_MOCK_MODE / MEOK_MASTER_API_KEY state.

---

## PATH OF BEST DISCOVERY (where the real answers live)

| Rank | File | Why it matters |
|---|---|---|
| 1 | `/Users/nicholas/clawd/sovereign-temple/data/sigil_ledger.jsonl` | Authoritative list of "human-gated red lines" with explicit "awaiting KEY" notes — the ground truth the agents keep re-stating |
| 2 | `/Users/nicholas/clawd/csoai-platform/.env` | The actual Stripe/OpenAI/Anthropic env file — currently has literal `"REPLACE_WITH_..."` placeholders for all 3 critical keys |
| 3 | `/Users/nicholas/clawd/csoai-org/api/prices.js` | Stripe price IDs are all `price_*_placeholder` — no real Stripe products wired up even if keys were present |
| 4 | `/Users/nicholas/clawd/meok.ai/AGENTS.md` | The WAF-blocked Vercel deploy situation + 8 red lines (same list, more context) + the 5 distribution posts ready to fire |
| 5 | `/Users/nicholas/clawd/SBT_WIRING_PLAN_2026-06-15.md` | The 10 ranked risks of flipping `SBT_MOCK_MODE=false` — these are why the trust-attestation chain is in mock |
| 6 | `/Users/nicholas/clawd/SMITHERY_ATTEST_FIX_2026-06-15.md` + DAY6_DRAGON_MODE_RESULTS | Smithery: 127/202 pushed, **75 still diverged on `feat/*` branches**, blocking MCP marketplace presence |

---

## THE KINGPIN BLOCKER

> **`MEOK_MASTER_API_KEY` is absent from the runtime** — the sovereign attestation / Stripe checkout / keystone Pro tier sign-off all gate on a single key that is not in any `.env`, Secret Manager, or process env. Every paying-customer pipeline (Pro £199/mo, DORA audit, UK AI Bill signing, Annex IV docs) sits behind this one credential. Per sigil ledger line 67+68+71+210, this has been the #1 red line for ≥24h across ≥4 separate subagent reports. **Removing this unlocks: (a) live Stripe checkout, (b) Pro-tier keystone signing, (c) the 4 paywalled MCP tools that ARE the revenue wall.**

---

## 30-LINE BLOCKER INVENTORY

```
# | Blocker                                                  | Owner           | Cost to unblock         | Time-to-unblock
--+-----------------------------------------------------------+-----------------+-------------------------+------------------
1 | MEOK_MASTER_API_KEY missing (keystone + Stripe)          | nicholas (key)  | $0 (has the key)        | 5 min — paste in GCP Secret Manager
2 | csoai-platform/.env has REPLACE_WITH_… for Stripe + OAI  | nicholas (keys) | $0                      | 15 min — paste 3 real keys into 1 file
3 | csoai-org/api/prices.js uses price_*_placeholder         | nicholas        | $0                      | 30 min — create 8 real products in Stripe dashboard, paste price IDs
4 | STRIPE_WEBHOOK_SECRET unset (no live event ingestion)    | nicholas        | $0                      | 5 min — `stripe listen` → paste whsec_
5 | Smithery: 75/202 servers diverged on feat/* branches     | ops subagent    | $0                      | 2–4 hr — `gh pr` per server OR re-run roll-out against feat/*
6 | csoai-org custom domain `csoai.org` not aliased to prod  | nicholas        | $0                      | 30 sec — Vercel dashboard click
7 | llms.txt not served at csoai.org (file at repo root)     | ops             | $0                      | 1 commit — move to public/
8 | Vercel WAF `x-vercel-mitigated: deny` on new deploys     | Vercel (wait)   | $0                      | 24–48h — passive cooldown, can't accelerate
9 | MEOK Stripe checkout: csoai-org/payment.html wiring       | ops             | $0                      | 1 hr once #2 + #3 done
10 | weaviate (8080) + neo4j (7474) stopped (data layer)     | ops             | $0                      | 10 min — bring up via docker, not on critical customer path today
11 | SBT_MOCK_MODE=true → $0 on-chain revenue (PDA bug)     | ops subagent    | $0 (devnet SOL)         | 1–2 days — fix 7.3 prerequisites in SBT_WIRING_PLAN before flipping
12 | meok-ui dev server keeps losing BUILD_ID (disk pressure) | ops             | $0                      | reclaim 2 GB from 5 idle .ai sites' node_modules (needs user approval)
13 | meok-attestation free tier daily quota maxed (14 issued) | nicholas        | $0                      | INSTANT once #1 is in — flips to Pro tier
14 | Resend mailer probe 403 flap (3-strike patch SHIPPED)    | SHIPPED         | $0                      | RESOLVED in DAY6_DRAGON_MODE_RESULTS
15 | Smithery_API_KEY missing (marketplace publish)           | nicholas        | $0                      | 5 min — get from smithery.ai/settings
16 | mcp-publisher login: needs `gh auth` device-flow click   | nicholas        | $0                      | 60 sec browser click — unblocks 30+ MCP publishes
17 | CSOAI-ORG/delboy + mavis-mcp-marketplace GitHub repos don't exist | nicholas | $0            | 60 sec — click "create repo" twice; cron polls every 30 min
18 | Smithery 202 servers: 40 were "no-change" (already clean)| INFO            | $0                      | RESOLVED — re-stats confirmed
19 | OpenPatent VM push: local origin = openmore.ai (wrong)   | nicholas        | $0                      | 1 min — `git remote set-url` or accept rsync-only flow
20 | openpatent-drafting-fork container unhealthy (20h Up)    | ops             | $0                      | 30 min — investigate docker logs; pre-existing, not from DAY6
21 | weaviate + neo4j flapping (not currently customer-facing) | INFO           | $0                      | see #10
22 | Dragon Portal: deployed but no auth/identity gate        | ops             | $0                      | 1 day — wire Clerk or sigil chain before exposing
23 | Stripe payment.html on csoai.org: build artifacts stale  | ops             | $0                      | needs #6 + #3
24 | csoai.org AEO files: agent-card + security.txt live on -vercel.app but not apex | nicholas | $0 | wait DNS prop or see #6
25 | MCP server attestation signature gap (Ed25519 chain)     | ops             | $0                      | needs #1 (MEOK_MASTER_API_KEY)
26 | 290 MCP servers in mcp-marketplace, only 19 published     | ops             | $0                      | blocked on #5 + #15 + #16
27 | Anthropic model deprecation: claude-sonnet-4-5/opus-4 →  | ops             | $0–$200/mo             | audit & migrate to current IDs by Jun 15 (TODAY)
28 | meok-keystone free-tier quota → customers can't sign     | nicholas        | $0                      | INSTANT once #1
29 | x402 outcomes-based pricing on MCP tools: not enabled    | ops             | $0                      | ship £0.10–1.00/call on 10 tools (per DAY6_DRAGON_MODE_BRIEF action 5)
30 | 8 human-gated red lines (per meok.ai/AGENTS.md)          | nicholas        | $0                      | Keys + 1 GitHub repo + 1 browser click; SIGIL ledger has the full list
```

---

## 5-LINE TIGHT INVENTORY (the subset that, if all 5 cleared, ~unblocks everything)

1. **`MEOK_MASTER_API_KEY` absent** — gates Stripe checkout + Pro keystone + 4 paywalled MCP tools. **KINGPIN.**
2. **Stripe `.env` files have `REPLACE_WITH_…` placeholders** — `csoai-platform/.env`, `csoai-org/api/prices.js`. Even with the master key, no product IDs to charge.
3. **Smithery 75/202 servers stuck on `feat/*` branches** — every MCP beyond the 19 published needs this unblocked; per-server git ops.
4. **`SBT_MOCK_MODE=true` + Solana program not deployed** — zero on-chain revenue, trust attestations are a dictionary, not a chain.
5. **8 human-gated red lines** (`meok.ai/AGENTS.md`): `gh auth` device flow, 2 empty GitHub repos, Smithery API key, Resend key, Stripe live flip, mcpize refresh, Clerk prod keys, MEOK_MASTER_API_KEY. **Removing the kingpin (#1) removes the most expensive of these.**

---

## CRISH-RECOVERY LIVE STATE (verified just now)

```
✅ meok-api:3200 ✅ sov3-mcp:3101 ✅ meok-ui:3000 ✅ postgres ✅ redis ✅ ollama
✅ farm-vision:8888 ✅ hindsight:8765 ✅ ensemble-loop
❌ weaviate:8080 (stopped — not customer-critical today)
❌ neo4j:7474 (stopped — not customer-critical today)
```
**No flap. No flapping services.** The infrastructure is up; the **growth blockers are credential + publish-flow + Stripe product gaps, not infrastructure health.**

---

## RECAP (one paragraph for parent agent)

The growth bottleneck is **identity & credentials**, not infrastructure or code. Day 6 just shipped three big things (csoai-org merge fix + 127 Smithery publishes + mailer flap patch), the 9 services on the critical path are all green, and the EAT/ZIP intelligence is digested. What's left: (1) the **MEOK_MASTER_API_KEY** (single credential that gates Stripe live + Pro keystone + 4 paywalled MCP tools — the entire £199/mo revenue wall), (2) **real Stripe `.env` values + product/price IDs** (currently literal `REPLACE_WITH_…` placeholders), (3) the **Smithery 75-server branch reconciliation**, and (4) a **browser click on `mcp-publisher login github`** device flow plus **2 empty GitHub repos** (`CSOAI-ORG/delboy`, `CSOAI-ORG/mavis-mcp-marketplace`) that the crons are polling for. The SBT/MOCK_MODE issue is the deepest technical debt but is correctly gated behind the 10 prerequisites in `SBT_WIRING_PLAN_2026-06-15.md` §7.3 — don't flip that flag yet.
