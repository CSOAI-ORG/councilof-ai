# MEOK + SOV3 Execution Plan
## Post-Audit Recovery & 7-Day Sprint

**Date:** 29 May 2026  
**Audited by:** JEEVES  
**Status:** Systems built, deployments blocked, disk critical  

---

## AUDIT FINDINGS

### What's Working (Green)

| System | Port | Status | Notes |
|--------|------|--------|-------|
| **SOV3 Orchestrator** | 3101 | ✅ Healthy | 5 bridge modules mounted, neural models trained |
| **MEOK API** | 3200 | ✅ Healthy | Council, memory, neural inference endpoints live |
| **MEOK MCP** | 3102 | ✅ Healthy | Tool server responding |
| **MEOK ONE Gateway** | 3400 | ✅ Healthy | Unified proxy, all routes active |
| **Sovereign API** | 8888 | ✅ Healthy | Auth, characters, payments, waitlist |
| **SBT Bridge** | 3101/sbt | ✅ Live | Mock mode, mint/verify/revoke working |
| **A2A Bridge** | 3101/a2a | ✅ Live | Mock mode, skill→SBT mapping working |
| **Payment Bridge** | 3101/payments | ✅ Live | Mock mode, 3-rail orchestration ready |
| **Chronicle Bridge** | 3101/chronicle | ✅ Live | Mock mode, hash chain verified |
| **Storage Bridge** | 3101/storage | ✅ Live | Mock mode, S3-compatible API ready |

### What's Broken (Red)

| Issue | Severity | Root Cause | Owner |
|-------|----------|-----------|-------|
| **Disk 100% full** | 🔴 CRITICAL | 228GB consumed, 1.3GB free | **NEEDS ACTION NOW** |
| **MEOK_UI (3000)** | 🔴 DOWN | Returns 404, static server misconfigured | JARVIS territory |
| **SBT contract not deployed** | 🟡 BLOCKED | Devnet airdrop rate limited, 0 SOL | External / Claude? |
| **Vercel auth broken** | 🟡 BLOCKED | Browser auth succeeds, CLI rejects token | External / Claude? |
| **SeaweedFS not started** | 🟡 BLOCKED | Disk too full for volume allocation | Disk fix → restart |
| **Trust Registry offline** | 🟡 BLOCKED | PostgreSQL not running, API not started | Infrastructure |
| **All bridges in mock mode** | 🟡 DEGRADED | No live Solana RPC, no OpenChronicle DB, no SeaweedFS | Infrastructure |

### What's Missing (Not Built Yet)

| Component | Priority | Effort | Blocker |
|-----------|----------|--------|---------|
| **47 Generals → SOV3 task routing** | P0 | 2 days | None (code exists, needs wiring) |
| **Trust Registry API startup** | P0 | 1 day | PostgreSQL + disk |
| **Live Solana RPC integration** | P1 | 1 day | SOL airdrop / payer funded |
| **csoai.org Vercel deploy** | P1 | 2 hours | Vercel auth token |
| **loopfactory.ai deploy** | P1 | 2 hours | Vercel auth token |
| **OpenChronicle live instance** | P2 | 1 day | Docker or pip install |
| **SeaweedFS live cluster** | P2 | 1 day | Disk space + Docker |
| **Character factory GPU pipeline** | P2 | 3 days | RunPod credits |
| **Enterprise sales outreach** | P2 | Ongoing | None |

---

## THE CLAUDE HANDOFF

You said *"claude is fixing this."*

**What I assume Claude is fixing:**
- Vercel CLI authentication (browser → token → `vercel login --token`)
- Solana devnet airdrop or wallet funding
- Namecheap DNS fixes for safetyof.ai / optomobile.ai

**What I am responsible for:**
- Everything in this plan document
- Code architecture and builds
- SOV3 + MEOK ONE system integrity
- Strategic sequencing

**If Claude is NOT fixing the above, flag immediately.** Those are external auth blockers that require your credentials or manual steps.

---

## 7-DAY EXECUTION PLAN

### Day 0 (Today) — STOP THE BLEEDING

**Disk Crisis Resolution**

Current state: **100% full, 1.3GB free.** System will start failing writes.

Actions:
1. **Clear uv cache** — ✅ Done (freed ~925MB)
2. **Clear all pycache** — In progress (2,756 dirs)
3. **Delete old backups** — `~/clawd/backups/` (check size)
4. **Delete old model checkpoints** — `~/.hermes/checkpoints/`, `~/.cache/huggingface/`
5. **Delete unnecessary git repos** — `~/clawd/langfuse/` (fork, 6.8MB), others
6. **Move large assets to external** — Character factory outputs, video files

Target: **10GB free minimum.**

**Restart services after disk fix:**
- SeaweedFS (was blocked by disk check)
- MEOK_UI static server (port 3000 conflict)
- Trust Registry PostgreSQL

### Day 1 — LIVE THE BRIDGES

**Goal:** Move all 5 SOV3 bridges from `MOCK_MODE=true` to production-ready.

**Solana SBT Bridge**
- [ ] Fund payer wallet (`~/.config/solana/id.json`) with SOL
- [ ] Deploy SBT contract to devnet using `./deploy.sh`
- [ ] Switch `MOCK_MODE=false`, test live mint/verify
- [ ] Add PDA derivation and account deserialization

**A2A v1.0 Bridge**
- [ ] Verify A2A Signed Agent Card signature format (Google docs)
- [ ] Add JWT signature verification using Google JWK endpoint
- [ ] Auto-bridge incoming A2A cards to POAI SBTs

**Payment Bridge**
- [ ] Sign up for Pay.sh API key
- [ ] Add `PAY_SH_API_KEY` to environment
- [ ] Test end-to-end Pay.sh flow with devnet USDC
- [ ] Add Stripe webhook signature verification

**OpenChronicle Bridge**
- [ ] Install OpenChronicle (CarlDog variant) via pip or Docker
- [ ] Start MCP server on port 3001
- [ ] Switch `MOCK_MODE=false`, connect to live SQLite DB
- [ ] Configure Solana anchoring interval (hourly)

**SeaweedFS Bridge**
- [ ] Restart SeaweedFS with disk space available
- [ ] Create production buckets: characters, mcp-packages, audit-logs, blockchain-archive
- [ ] Configure S3 credentials and test upload/download
- [ ] Switch `MOCK_MODE=false`

### Day 2 — GENERALS GO LIVE

**Goal:** Wire the 47-generals hierarchy into SOV3 task routing.

**Current state:** `~/clawd/meok/agents/generals.py` has the Mongol decimal hierarchy (202 councils, 20 division generals, 4 senior generals, sovereign core) but it's not connected to SOV3's `/agent/task` endpoint.

**Actions:**
- [ ] Import `generals.py` into SOV3 startup sequence
- [ ] Create `SOV3General` wrapper class with OpenChronicle logging
- [ ] Wire `/agent/task` to route through General → Council → Agent
- [ ] Add engagement tracking (Ibn Khaldun cohesion model)
- [ ] Log every task dispatch to OpenChronicle hash chain
- [ ] Test: dispatch task → General routes → Council decides → Agent executes → Logged

### Day 3 — TRUST REGISTRY + VERIFICATION

**Goal:** Start the POAI Trust Registry API with real database.

**Actions:**
- [ ] Start PostgreSQL (local or via Docker Compose)
- [ ] Run Trust Registry migrations (`~/clawd/trust-registry-api/`)
- [ ] Start Trust Registry API on port 3001 (or alternate)
- [ ] Connect SBT bridge to Trust Registry for persistence
- [ ] Add `/verify/:sbtId` endpoint with <200ms target
- [ ] Add Stripe webhook handler for payment → verification trigger
- [ ] Test full flow: Payment → Verification → SBT Mint → Registry Update

### Day 4 — FRONTEND DEPLOYMENTS (Blocked on Vercel)

**Goal:** Deploy all frontends.

**Actions:**
- [ ] Fix Vercel CLI auth (`vercel login --token <token>`)
- [ ] Deploy `csoai.org` from `dist/client/` → Vercel
- [ ] Deploy `loopfactory-marketplace/` → `loopfactory.ai`
- [ ] Deploy `prooofof.ai` content → Vercel
- [ ] Fix `safetyof.ai` DNS (Namecheap A record → 76.76.21.21)
- [ ] Add `optomobile.ai` A record
- [ ] Push `vercel.json` redirects for fishkeeper.ai / koikeeper.ai → meok.ai

### Day 5 — MARKETPLACE BACKEND

**Goal:** Connect loopfactory.ai frontend to live data.

**Actions:**
- [ ] Populate marketplace with real MCP data (from `mcp-marketplace/`)
- [ ] Connect ProductCard to SBT verification API
- [ ] Add A2A agent card display
- [ ] Implement search + filter with OASF taxonomy
- [ ] Add POAI badge widget (<200ms verify)
- [ ] Test checkout flow: Browse → Select → Pay → Verify → Download

### Day 6 — END-TO-END INTEGRATION TEST

**Goal:** One complete transaction through the entire stack.

**Scenario:** Enterprise audits AI agent → POAI certifies → Listed on marketplace

```
1. Enterprise submits agent to councilof.ai
2. Human verifier tests safety (earning MEOK)
3. Guardian general approves via SOV3
4. OpenChronicle logs the decision (hash chain)
5. POAI mints SafetyCertification SBT on Solana
6. Trust Registry indexes the SBT
7. Agent listed on loopfactory.ai with POAI badge
8. Customer pays via Pay.sh (USDC)
9. Enterprise receives payment, customer receives verified agent
10. All steps logged in OpenChronicle, anchored to Solana hourly
```

### Day 7 — DOCUMENTATION + OUTREACH

**Goal:** Package everything for external consumption.

**Actions:**
- [ ] Update API documentation (Swagger/OpenAPI from FastAPI)
- [ ] Record demo video: "Mint a POAI SBT in 30 seconds"
- [ ] Write LinkedIn post about A2A v1.0 + POAI integration
- [ ] Submit CFP to Money20/20, Web Summit, Token2049
- [ ] Send Solana Foundation grant application
- [ ] Apply to GLG as SME (AI governance)
- [ ] Send 5 LinkedIn connection requests to Big 4 AI partners

---

## DECISION TREE: IF BLOCKERS PERSIST

### If Vercel auth still broken after Day 4
- **Fallback:** Use `npx serve` or GitHub Pages for temporary hosting
- **csoai.org:** Can serve from `dist/client/` via any static host
- **loopfactory.ai:** Next.js `output: 'export'` → static deploy to Netlify

### If Solana airdrop still rate-limited after Day 1
- **Fallback:** Fund wallet with $5 SOL from Coinbase/Binance/Kraken
- **Alternative:** Use Solana Playground or Remix for temporary devnet deploy
- **Last resort:** Keep mock mode but write all integration code for instant switch

### If disk stays critical after Day 0
- **Emergency:** Move `~/clawd/` to external SSD (you mentioned having one)
- **Immediate:** Delete `~/clawd/langfuse/` (fork, not your code)
- **Immediate:** Delete `~/clawd/_ARCHIVED_SEVERED_BRANDS/` (archived)
- **Immediate:** Delete `~/clawd/_private_dagon/` (private, backup elsewhere)
- **Immediate:** Delete `~/clawd/_TOPOLOGY/` (research, can regenerate)

### If Claude hasn't fixed Namecheap
- **safetyof.ai:** Keep pointing to wrong IP temporarily, fix when credentials available
- **optomobile.ai:** Cannot deploy without DNS — park the domain

---

## CRITICAL PATH

The order in which things MUST happen:

```
1. DISK SPACE (>10GB free)
    ↓
2. SOLANA PAYER FUNDED (>2 SOL)
    ↓
3. SBT CONTRACT DEPLOYED (devnet)
    ↓
4. BRIDGES SWITCH TO LIVE MODE
    ↓
5. VERCEL AUTH FIXED
    ↓
6. FRONTENDS DEPLOYED
    ↓
7. FIRST END-TO-END TEST
    ↓
8. GRANT APPLICATION SUBMITTED
    ↓
9. OUTREACH BEGINS
```

**Do NOT skip step 1.** Everything else fails if the disk is full.

---

## WHAT YOU SHOULD DO RIGHT NOW (Next 30 Minutes)

1. **Confirm what Claude is fixing.** Is it Vercel? Solana? Namecheap? All three?
2. **Free disk space.** Delete large items from the list above. Target 10GB.
3. **Fund Solana wallet.** Send 2 SOL to `D3wRLAsaVEWUAm3Y7ZXo21sfEd3SGYb8X4nLbLA8RE5w`
4. **Get Vercel token.** Visit `vercel.com/account/tokens` → copy token → send to me.

---

## METRICS OF SUCCESS

By end of Day 7, you should have:

| Metric | Target |
|--------|--------|
| Live SBTs minted | ≥10 |
| A2A cards bridged | ≥5 |
| Payment sessions created | ≥3 |
| Chronicle events logged | ≥100 |
| Storage objects uploaded | ≥10 |
| Frontends deployed | ≥3 |
| End-to-end test passed | 1 complete flow |
| Grant applications submitted | ≥1 |
| LinkedIn posts published | ≥1 |
| Big 4 connection requests | ≥5 |

---

*Plan prepared: 2026-05-29 05:20 GMT+1*  
*Status: Awaiting disk fix + Claude handoff confirmation*  
*Next review: After disk space >10GB and Vercel/Solana blockers resolved*
