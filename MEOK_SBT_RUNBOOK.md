# MEOK SBT — deploy & go-live runbook (Nick-authorized steps)

_The soulbound "own your AI forever" token. The program + client + the meok-one intent bridge
are scaffolded and ready. **Claude will not run any step in this file** — deploying, funding,
and minting move real assets / sign with real keys, which are your decisions. These are the
exact commands for you (or a trusted dev) to execute._

---

## What's already built (no chain action needed)
- **Program:** `solana-sbt/src/lib.rs` — native Solana soulbound program, 5 Charter-mapped SBT
  types; `CharacterGenesis` (Art. 6) = own-your-AI. Soulbound by design (no transfer instruction). Compiles.
- **Client:** `solana-sbt/client/sbt_client.ts` — `mint()`, `verify()`, `deriveSbtPda()`.
- **Bridge:** `meok-one/meok_one/sbt.py` + `/api/sbt/status` + `/api/sbt/mint-intent` — produces the
  exact mint payload for any character, but never signs/sends. `MEOK_SBT_LIVE` is OFF by default.
- **Keypair:** `solana-sbt/program-keypair.json` exists (program identity; **not** a funded wallet).

## Boundary (why Claude stops here)
Deploying a program, funding an issuer wallet, and minting tokens are **prohibited actions** for me
(they move funds / sign with private keys). I scaffold; you authorize + execute.

---

## Go-live (devnet first — free, safe)
```bash
# 0. prerequisites (you run): solana-cli + anchor/cargo-build-sbf, a funded DEVNET keypair
solana config set --url devnet
solana airdrop 2                      # devnet SOL is free

# 1. build the program
cd solana-sbt && cargo build-sbf

# 2. deploy to devnet → prints the real Program Id
solana program deploy target/deploy/meok_sbt.so

# 3. put the real Program Id everywhere
#    - solana-sbt/client/sbt_client.ts  (PROGRAM_ID)
#    - meok-one env:  MEOK_SBT_PROGRAM_ID=<id>  MEOK_SBT_NETWORK=devnet
```

## Wire meok-one → live minting (still your call)
```bash
# on the VM, set the issuer + flip live ON (only when you're ready)
MEOK_SBT_PROGRAM_ID=<deployed id>
MEOK_SBT_NETWORK=devnet           # then mainnet-beta when audited
MEOK_SBT_LIVE=1                   # /api/sbt/mint-intent → status "live-ready"
```
Then the flow is: user hatches/owns a character → meok-one `/api/sbt/mint-intent?id=<char>&owner=<wallet>`
→ hand that intent to `sbt_client.ts` run by the **issuer** keypair → `mint()` signs + sends.

## Mainnet (only after an audit)
- Get the program **audited** (soulbound logic, PDA derivation, issuer-only guards).
- `solana config set --url mainnet-beta`, fund the issuer wallet with real SOL, `solana program deploy`.
- Decide **custodial vs self-custody wallets** for users (huge UX + compliance implications — see
  `MEOK_EARNINGS_SBT_DESIGN`). Recommendation: launch off-chain, add chain as audited fast-follow.

## Decisions only you can make
1. **Solana vs an L2** (gas/UX).
2. **Custodial vs self-custody** user wallets.
3. **Off-chain-first launch (recommended) vs chain-on-day-1.**
4. Whether `$MEOK` ever becomes a transferable token (regulatory weight) — vs SBT-as-provenance only.
