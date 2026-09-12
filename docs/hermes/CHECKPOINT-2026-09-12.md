# Hermes Checkpoint — 2026-09-12

**Time:** 2026-09-12T05:30:00Z  
**Master:** 4bb4c4446 (Merge PR #1941 — mill provenance consolidation)  
**CI:** GREEN  
**Production:** All 10 endpoints HTTP 200

## Shared Scoreboard

| Counter | Value | Kind |
|---------|-------|------|
| Canonical subjects indexed | 425 | catalogued |
| Deployments resolved | 1,640 | catalogued |
| Subjects deeply measured | 6 | measured |
| 22-axis cells accepted | 22 | measured |
| Regulatory provisions linked | 5 | measured |
| Signed cards verified | 335 | measured |
| Root leaves | 169 | catalogued |
| Rekor inclusions | 1 | witnessed |
| OTS submissions | 17 | stamped_pending |
| Bitcoin confirmations | 0 | not_yet |
| Other chain anchors | 0 | incomplete |
| x402 challenges | 3 | probed |
| Successful deliveries | 0 | blocked |
| Self-settlements | 6 | measured |
| Independent settlements | 1 | measured |
| Repeat buyers | 0 | measured |
| Dataset downloads | 68 | catalogued |
| External citations | 0 | unmeasured |
| Active directory listings | 6 | probed |
| Total spend | $0.00 | measured |
| Attributable revenue | $0.02 USDC | measured |
| Unresolved conflicts | 3 | declared |

## Terminal Status

### TUI 1 — Canonical Harness, Signing and Anchoring
**Today's condition:** "all accepted cards are provenance-bound, signed off-device, included in an auditable root manifest and deployable from master"

**Status:** MOSTLY MET
- Mill pipeline active: OIDC board-sign with provenance binding (PR #1941)
- 335 signed cards in card_index.json, all Ed25519 verified
- 169-card public root with signed envelope
- Rekor witness at log index 2791822965
- OTS submitted (17 files, pending Bitcoin)
- **Gap:** Base EAS + XRPL memo anchors incomplete (owner gate)

### TUI 2 — Global Financial and Asset Index
**Today's condition:** "one deduplicated catalog shows total subjects, deployments, measured coverage, freshness and the exact next measurement required"

**Status:** MET
- 425 assets indexed across 211 chains (DefiLlama)
- 1,640 deployment entries
- 6 deep measurements with direct on-chain readers:
  - USDT: Ethereum block 25954459 (eth_call totalSupply)
  - USDC: Ethereum block 25954459 (eth_call totalSupply)
  - DAI: CONTRACT_DEPRECATED (MakerDAO→Sky migration)
  - RLUSD: XRPL ledger 106913042 (account_info) + Ethereum block 25958868
  - USDC (Stellar): ledger 64378806 (Horizon API)
- Financial coverage graph at public/interop/financial-coverage-graph-2026-09-11.json
- **Gap:** Long-tail 419 assets still indexed-only

### TUI 3 — Models, Benchmarks and Regulatory Crosswalks
**Today's condition:** "the board can distinguish model, version, axis, test, regulation, evidence, result and limitation"

**Status:** PARTIALLY MET
- 22 GSPC axes measured (14 model-comparison + 8 deterministic-facts)
- 335 signed measurement cards
- 36 OIDC receipts published (PR #1929)
- 5/36 regulation-linked (EU AI Act Art 5)
- NIST crosswalk prepared
- **Gap:** 31/36 cards unlinked; NIST submission owner-gated

### TUI 4 — x402, MCP and Agent-Economy Interoperability
**Today's condition:** "an outside agent can discover, pay, receive evidence, verify independently and trace into public root"

**Status:** MOSTLY MET
- MCP: 12 tools (8 free + 4 paid), live
- A2A: 7 skills, live
- x402: 9 resources, Base USDC rail live (402 returned)
- Signed offer receipts confirmed (JWS EdDSA)
- Free door proves rail (amount=0)
- Discovery: /.well-known/x402.json live
- **Gap:** Payment step requires funded wallet (owner gate); MCP.so recently listed

### TUI 5 — Council OS and Master GSPC Board
**Today's condition:** "a first-time visitor can find a subject, understand its evidence state, inspect each axis and independently verify"

**Status:** PARTIALLY MET
- GSPC board live at /api/gspc (22 axes)
- Free verification at /gspc-verify
- Council OS referenced (30 panes per homepage)
- Sitemap, RSS, llms.txt all current
- **Gap:** Council OS rail registry not independently verified; mobile UX unknown

### TUI 6 — Distribution, Revenue and Human Awareness
**Today's condition:** "every published measurement has a discovery path, clear free value, a paid next step and measurable attribution"

**Status:** PARTIALLY MET
- MCP Registry: live (io.github.CSOAI-ORG/gspc)
- npm: published (csoai-gspc-mcp)
- HF: 50 datasets, 39 spaces, 7 collections
- Kaggle: 1 canonical dataset
- 3 attribution IDs registered
- Revenue: $0.02 from 1 external payer
- 15 targeted contacts prepared
- **Gap:** No repeat buyers; revenue scale requires evidence gates to pass

## Contradictions Detected

1. root_leaves: 167→169 (mill cards added via PR #1894)
2. merkle_root: 78d4e019→94e99db5 (recomputed)
3. self_settlements: 5→6 (new self-test)
4. DAI contract deprecated (MakerDAO→Sky migration, discovered by prior agent)

## Highest-Yield Next Actions

1. **Verify 36 OIDC receipts** from PR #1929 — check lifecycle state
2. **Consolidate financial coverage** — merge prior agent's reader scripts
3. **Audit Council OS rail** — count panes, verify each opens
4. **x402 end-to-end documentation** — complete the blocked steps honestly
5. **Distribution consolidation** — verify all directory listings current

## Owner Gates (cannot be resolved by agent)

1. x402 payment: funded Base wallet required
2. Base EAS anchor: funded wallet required
3. XRPL memo anchor: funded account required
4. NIST submission: communication gate for 16 Sep
5. PR merge: protected master requires review
