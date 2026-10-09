# STATUS — Identity Packs (Step 1) — 2026-09-14T05:30:00Z

## Goal: Sign identity packs for owner execution

### ERC-8004 Registration Pack
- **Chain:** Base (eip155:8453)
- **Registry:** 0x8004A169FB4a3325136EB29fA0ceB6D2e539a432 (TransparentUpgradeableProxy)
- **Implementation:** 0x7274e874ca62410a93bd8bf61c69d8045e399c02
- **Register function:** verified to exist (selectors work, revert without auth)
- **Agent URI target:** https://councilof.ai
- **Status:** PREPARED_NOT_SIGNED (on master via PR #2300)

### XRPL Memo Pack
- **Memo bytes:** SHA-256 of current public Merkle root (32 bytes)
- **Root:** 8a121be5c52aeab4e9b1f4de824ecb397c671c0259f678cb75bc564b2eeb1446
- **Fee estimate:** ~0.00012 XRP
- **Status:** PREPARED_NOT_SIGNED (on master via PR #2300)

### Agent capabilities vs owner requirements
| Action | Agent can do? | Required from owner |
|--------|---------------|---------------------|
| Prepare pack (compute calldata, estimate cost) | YES | — |
| Verify chain state (registry, proxy, impl) | YES | — |
| Estimate cost in gas + USD | YES | — |
| Fund burner wallet with USDC on Base | NO | YES (MetaMask send) |
| Sign transaction with burner key | NO | YES (owner wallet) |
| Send register(string) tx on Base | NO | YES (0.02 ETH + USDC gas) |
| Submit XRPL memo tx | NO | YES (XUMM/own account) |

### Blockers (owner-gated)
1. Burner `0x6ea00613c...` has 0 USDC on Base (needs ~0.01 USDC + 0.005 ETH for gas)
2. Burner may not be authorized on the registry's admin slot
3. Owner MetaMask `0x212686...` has 0.101 ETH (enough for gas)

### Next actions (owner)
1. Send 0.02 USDC + 0.01 ETH to burner `0x6ea00613c15f2463bC10c7188215c4FA6f4943C6` on Base
2. Owner calls `register(string)` on `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
   with calldata: calldata hex from pack
3. Owner submits XRPL memo with 32-byte root sha256 to XRPL account
4. Owner provides tx hashes for both — agent records to STATUS

### Agent deliverables
- Pack files on master (PR #2300 merged)
- Calldata computation script ready
- Cost estimates verified against live gas oracle
- Agent ready to verify owner's tx after signing
