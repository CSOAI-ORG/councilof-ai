# Morning Brief — 2026-09-16 16:22 BST
Measured this run. Pre-run script numbers are superseded.

## Local substrate
- SOV3 :3101 / MEOK MCP :3102 / MEOK API :3200 / MEOK UI :3000 / Farm Vis :8888 — **DOWN** (not listening; HTTP 000 ×2)
- `~/clawd/scripts/coordination-status.sh` — missing (rc=127)
- `ai.sovereign-temple.mcp-http` LaunchAgent — not registered
- UP: Postgres :5432, Hermes gateway :8644, RAS http.server :8899, vite preview :4183 (404)
- Tunnels looping exit 255: oracle2-ollama, sovos-remote-services, csoai.sovos-master-tunnel
- SSH: oracle-micro-2 UP (45d). meok-backend timeout. m2 timeout.

## Disk
- Data volume: 174Gi used / 228Gi, **24Gi free (89%)**. Pre-run “34% used” is the APFS sealed system volume, not Data.

## Public GSPC (live SOV3-adjacent metrics)
- GET https://councilof.ai/api/gspc 200 · schema csoai.gspc-axes/0.5
- 23 axes · 22 measured · 1 unmeasured (effect-binding)
- 14 model fleets · 8 fact runs · 0 SEPARATED · 2 TIE · 12 UNTESTED
- 3 public leaders · mean_accuracy 0.66 · mean_fleet_mean 0.5447
- public-root as_of **2026-09-15T07:13:43Z** · 305 cards (stale ~32h; Actions blocked)
- MCP: 13 tools (9 free / 4 metered)

## Revenue (live)
- Stripe MEOK AI LTD `acct_1TLlEKQvIueK5Xpb`: details_submitted=true, **charges_enabled=false**, **payouts_enabled=false**, **card_payments=inactive**
- Charges 24h: 0. History: 31, **0 succeeded** (30 `highest_risk_level`, 1 `incorrect_number`)
- Subs: 0. PI sample 100/100 canceled (has_more). Customers ≥100 (has_more)
- meok.ai `/article-50-kit` `/care-homes` `/verify` `/enterprise` `/partner` `/reseller` `/api/health`: all HTTP 200, **4337-byte SPA shell**, 0 Stripe links, title “MEOK — sovereign measurement”
- x402 GET /api/revenue: distinct_nonself_payers **1** · settlements **1** · settled **20000 atomic USDC = $0.02** · issuances 8 · self 10 excluded
- npm csoai-gspc-mcp last-week: 141 (2026-09-05..11). PyPI that package: 404 this probe
- meok-attestation-api.vercel.app /health /verify: **HTTP 402**

## Public surfaces
- councilof.ai + csoai.org apex → councilof.ai: 200 (258765B homepage)
- www.csoai.org: **timeout** (A records mix Namecheap parking 162.255.119.208 + CF 172.66.*)
- proofof.ai → councilof.ai 200

## Top revenue action (owner-gated)
Enable Stripe **card_payments / charges_enabled** on MEOK AI LTD. Until then the GBP catalog cannot settle; 31 live charges already failed.

Parallel same-day: send NIST AI 300-1 comment (deadline **16 Sep 2026**) from PrivateEmail. Draft: `~/clawd/_alignment/drafts/NIST-AI300-1-COMMENT-READY-2026-09-16.md`. Mailbox auth is an owner gate.

## Owner gates still open
1. Stripe charges_enabled
2. NIST comment send today
3. GitHub Actions billing (public-root refresh)
4. PrivateEmail password / Namecheap ticket NC-VLX-8765
