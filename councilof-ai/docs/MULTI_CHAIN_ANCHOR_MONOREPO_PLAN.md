# CSOAI — MULTI-CHAIN ANCHORING + MONO-REPO ARCHITECTURE
## The Layer 0 Ceremony + Master Harness Plan
**Date:** 2026-09-11

---

## 1. THE LAYER 0 CEREMONY — Three Roots, Five Chains

The whiteboard chain is: MEASURE → SIGN → ANCHOR → PUBLISH. We have MEASURE+SIGN. The anchoring layer needs to be:

### Root Type 1: ONLINE ROOT (hot, API-served)
- `root.json` at councilof.ai/root.json — the live measurement root
- 168 cards, Ed25519 signed, did:web:csoai.org
- Updated: hourly/weekly (cadence depends on measurement)
- **Current state:** LIVE but 4 days stale (Sep 7)

### Root Type 2: OFFLINE ROOT (cold, ceremony-only)
- The signing key lives in cold storage (OCI Vault or 2-of-3 MPC)
- The ceremony receipt is published: time, operator, vault OCID, pubkey hex
- **Current state:** Key ceremony not completed (TUI-1 P0)

### Root Type 3: RECOVERY ROOT (escrow, multi-sig)
- Publicly-verifiable encryption of shares to owner's recovery pubkey
- Test restore on throwaway node, then destroy
- **Current state:** Not built

### Multi-Chain Anchoring (5 chains, all permissionless):

| Chain | Method | Status | Cost | What It Proves |
|---|---|---|---|---|
| **Bitcoin (OTS)** | OpenTimestamps calendar submission | ✅ Infrastructure live (alice+bob) | ~$0 (free calendars) | "This root hash existed at this Bitcoin block time" |
| **XRPL** | Memo field on mainnet | ✅ Reader live, can write | ~$0.00001 (XRP fee) | "This root hash was published on XRPL ledger N" |
| **Ethereum** | EAS (Ethereum Attestation Service) or calldata | ✅ Reader live | ~$0.50-2 (gas) | "This root hash was attested on Ethereum" |
| **Base** | Same as Ethereum (L2, cheaper) | ✅ x402 rail lives here | ~$0.01 | "This root hash was anchored on Base" |
| **Rekor (Sigstore)** | Rekor API inclusion | ✅ 2.67B entries live | Free | "This root hash is in the software supply chain transparency log" |

**The claim:** "The only AI-governance registry anchored on 5 chains simultaneously."
Nobody else does this. Not Chainalysis. Not any governance vendor.

---

## 2. MASTER MONO-REPO HARNESS

### Current state (scattered):
- `~/clawd/councilof-ai/` — main repo (clawd workspace)
- `/tmp/` — measurement cards built today (ephemeral)
- `~/Downloads/` — strategy docs, crown jewels
- GitHub: CSOAI-ORG/councilof-ai (100 public repos)
- MCP Registry: 9 unique servers, 50+ version entries
- HuggingFace: csoai org (6 datasets/spaces)
- npm: csoai-gspc-mcp

### Target state (mono-repo harness):
```
councilof-ai/
├── measurement/          # All measurement cards (signed + unsigned)
│   ├── rlusd/           # RLUSD cross-chain cards
│   ├── xrpl/            # XRPL ecosystem cards
│   ├── swift/           # SWIFT census cards
│   ├── x402/            # x402 ecosystem cards
│   ├── mcp/             # MCP trust board cards
│   ├── stablecoin/      # Stablecoin attestation watch
│   ├── lab-artifact/    # Lab framework diff cards
│   └── anchor/          # OTS/Rekor/chain anchor cards
├── readers/              # All data readers
│   ├── rlusd_eth.py     # Ethereum RLUSD reader
│   ├── rlusd_xrpl.py    # XRPL RLUSD reader
│   ├── x402_scan.py     # x402 ecosystem probe
│   ├── mcp_census.py    # MCP registry census
│   └── edgar_ai.py      # SEC EDGAR AI disclosure
├── anchoring/            # Multi-chain anchoring
│   ├── ots_submit.py    # OTS Bitcoin anchoring
│   ├── rekor_push.py    # Rekor Sigstore inclusion
│   ├── xrpl_memo.py     # XRPL memo anchoring
│   ├── eth_eas.py       # Ethereum EAS anchoring
│   └── base_anchor.py   # Base L2 anchoring
├── ceremony/             # Root ceremony
│   ├── key_custody.md   # Key custody decisions
│   ├── ceremony_receipt.md  # Ceremony receipt template
│   └── recovery.md      # Recovery procedure
├── site/                 # councilof.ai site
│   ├── rlusd/           # RLUSD dashboard (built today)
│   ├── art50/           # Art 50 countdown page
│   └── ...              # 495 pages
└── docs/                 # Strategy + operations
    ├── crown-jewels/    # V3 crown jewels
    ├── tui/             # TUI goals (1-6)
    └── press/           # Press releases + X threads
```

---

## 3. CURRENCY TRANSFER PIPELINE (how to improve XRP + all others)

### Current state:
- XRPL reader: 16 assets, 86.9K holders (verified)
- Ethereum reader: RLUSD only ($1.37B)
- DefiLlama: 425 stablecoins available (keyless API)

### The improvement plan:

**Phase 1 (this week):** Expand XRPL reader to all 9 XRPL stablecoins
- Add: USDV, AUDD, XSGD (3 missing from our 6)
- Result: 100% XRPL stablecoin coverage

**Phase 2 (next week):** Add Ethereum readers for top 10 stablecoins
- USDT ($183B), USDC ($74B), USDS ($6.6B), DAI ($4.78B), USDe ($4.53B)
- Each = one `totalSupply()` call + symbol verification
- Result: Cross-chain measurement for top 10 ($289B supply)

**Phase 3 (month):** Add attestation comparison
- Tether: quarterly reports (KPMG audit)
- Circle: daily CUSIP-level reserves (BlackRock USDXX)
- Compare attested vs on-chain for each
- Result: Attestation-gap series for all material stablecoins

**Phase 4 (ongoing):** Daily signed cards
- Cron: run all readers daily
- Publish: signed card per issuer per chain
- Alert: staleness detection (cadence-regression detector)

### The "bootstrap all and take a small piece" model:

**Free layer:**
- Live cross-chain supply (public API)
- Daily signed cards (free verify)
- Attestation-gap alerts (free for first 50)

**Paid layer ($25/mo per feed):**
- Historical series (30/90/365-day archives)
- Change alerts (whenever supply moves >1%)
- Multi-issuer comparison dashboard

**Premium layer ($250/mo):**
- Custom issuer monitoring (any stablecoin, any chain)
- Regulatory compliance evidence (GENIUS Act readiness)
- API access with attribution

**The bootstrap:** Start with RLUSD (done). Add USDC (easy — Circle publishes daily). Add USDT (Tether publishes quarterly). Each new issuer = one new reader + one new card type. The marginal cost is near-zero. The moat deepens with every issuer.

---

## 4. EXECUTION ORDER

| Priority | What | Effort | Impact |
|---|---|---|---|
| 🔴 P0 | OTS anchoring of current root | 1h | Completes Bitcoin anchor (V3-1) |
| 🔴 P0 | Rekor push of current root | 1h | Completes Sigstore anchor (V3-2) |
| 🟡 P1 | Expand XRPL to 9 stablecoins | 2h | 100% XRPL coverage |
| 🟡 P1 | Add USDC Ethereum reader | 1h | Second cross-chain stablecoin |
| 🟡 P1 | RLUSD dashboard deploy | 30m | Public surface for the measurement |
| 🟢 P2 | Top 10 stablecoin readers | 1d | $289B supply coverage |
| 🟢 P2 | Attestation-gap series | 1d | The paid product |
| 🟢 P2 | Mono-repo consolidation | 1d | Everything in one place |
