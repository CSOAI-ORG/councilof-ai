# Nick's Runbook — Unblocking the Four Gates

**Generated:** 2026-09-15T04:10Z
**Status:** All PRs merged, deploy running, all permissionless goals complete.

---

## Gate 1: THE CEREMONY (90 minutes, this afternoon)

Everything is built, tested, and proven. The dry-run passed all 8 checks.

### What you need
- Freshly booted Mac (or airgapped machine)
- Three USB sticks (for Shamir shares)
- Physical d6 dice (two sets of 100+ rolls)
- Disconnected from all networks

### The commands (in order)

```bash
# 1. Clone/check out the repo on the ceremony machine
cd /path/to/councilof-ai

# 2. Run the ceremony
bash scripts/ceremony/run_ceremony.sh
```

It will prompt you:
1. **Paste ROOT-alpha rolls** (100+ d6 dice, digits 1-6 only, then Ctrl-D)
2. **Paste ROOT-beta rolls** (100+ d6 dice, digits 1-6 only, then Ctrl-D)

Everything else is automated. The script outputs:
- `card0-genesis.json` — the public genesis card
- `share-{1,2,3}.json` — your three Shamir shares
- `shamir-crosscheck.json` — the crosscheck proof

### After the ceremony
1. Copy `share-1.json`, `share-2.json`, `share-3.json` to three separate USB sticks
2. Distribute to three separate holders/locations
3. Physically destroy the ceremony directory (it will be printed)
4. Hand `card0-genesis.json` back to the machine — I'll wire Rekor push + triple anchor

### Verification
```bash
# Selftest (run 3 times before the real ceremony)
python3 scripts/ceremony/shamir_2of3.py selftest
python3 scripts/ceremony/ceremony_selftest.py

# After ceremony, verify card
python3 scripts/ceremony/genesis_card.py verify --card card0-genesis.json
```

### Checklist
Full checklist: `docs/operations/root-ceremony/ROOT-CEREMONY-CHECKLIST-2026-09-12.md`

---

## Gate 2: THE MERGE TRAIN

All PRs are merged. The deploy is running now.

### Recently merged (today)
| PR | Title | Merged |
|----|-------|--------|
| #2478 | TUI-4/5 V3: ceremony proof bundle, product block, /feed, THIN firewall | 04:03Z |
| #2479 | /start hub links + wrapper-dataset-refresh | 04:06Z |
| #2477 | fix: add auto-eat-sign to board-sign OIDC allowlist | 03:59Z |
| #2475 | tui3: RWA reconciliation + wrapper parity refresh | 03:43Z |
| #2473 | feat(mcp-trust): J26 — mcp_trust tool in MCP server | 03:39Z |
| #2474 | feat(B13+C8): OWASP ASI mapping page + badge sweep | 03:26Z |
| #2471 | feat(G5.1): product_block v0.1 | 02:44Z |
| #2470 | fix(TUI-2): derive board counts from API | 02:57Z |
| #2472 | fix: revert stablecoin index to restore readiness gate | 02:53Z |
| #2468 | art50-target-index: regenerate from live provider-diff | 02:52Z |

**No open PRs remaining.** The merge train is complete.

### Merge-me dashboard
```bash
python3 scripts/merge_me.py          # human-readable
python3 scripts/merge_me.py --json   # machine-readable
```

---

## Gate 3: BROWSER CLAIMS (G6.1 — one sitting)

After the ceremony, run these claims in one browser session:

1. **Forge Registry:** `forge publish` command (from docs/operations/A2A-REGISTRY-SUBMISSION-CHECKLIST-2026-09-11.md)
2. **PulseMCP:** Claim steps
3. **mcp.so:** Submission text
4. **mcp.directory:** Publisher page
5. **Glama:** Badge embed snippets for top-10 READMEs

All prep docs are in the repo. One checklist doc, one sitting.

---

## Gate 4: THE $25 SETTLEMENT (G6.3)

After ceremony + anchors:
1. Attribution verified BEFORE settlement
2. PayAI indexing checked AFTER
3. Nick signs the tx (one USDC transfer on Base)

---

## What the machine does for you after the ceremony

Once `card0-genesis.json` is handed back:
1. **Rekor push** — automatic via GHA `public-root.yml` on next publish
2. **XRPL memo** — I generate the unsigned tx, you sign with your XRPL wallet
3. **EVM Base anchor** — I generate the unsigned tx, you sign with your wallet
4. **ERC-8004 registration** — via your operational wallet

---

## Current estate state

| Metric | Value |
|--------|-------|
| root.json cards | 303 |
| root.json sha256 | `74797e30d6d98267...` |
| merkle_root | `e4cc26d16e9b6827...` |
| Rekor (dry-run) | WITNESSED, logIndex 2838908623 |
| OTS | ACTIVE, hourly upgrade loop |
| A2A agents | 12 cards, index live |
| Product block | 24 SKUs, schema updated |
| /feed | live, JSON + RSS |
| THIN firewall | active, 7/7 tests |
| Yield dashboard | live at /yield |
| CourtListener reader | 29 tests, live API verified |

---

*Council of AI — measurement, never certification.*
