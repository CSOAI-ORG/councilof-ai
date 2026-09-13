# TUI 2 — Global Financial and Asset Index
## Status: ACHIEVED
## Date: 2026-09-13

---

## Coverage Denominators

| Metric | Value | State |
|--------|-------|-------|
| Stablecoins indexed | 425 | INDEXED (DefiLlama) |
| Asset-chain entries | ~1,640 | INDEXED |
| Chains reported | 211 | INDEXED |
| Chains with active supply | 177 | INDEXED |
| Total supply | $310.8B | INDEXED |

## Deep Measurement Numerators

### Ethereum (32 assets, $170.68B)

| Asset | Supply | Contract |
|-------|--------|----------|
| USDT | $88.31B | 0xdAC17F958D2ee523a2206206994597C13D831ec7 |
| USDC | $50.46B | 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 |
| USDS | $6.70B | 0xdC035D45d973E3EC169d2276DDab16f1e407384F |
| sUSDS | $4.19B | 0xa3931d71877c0e7a3148cb7eb4463524fec27fbd |
| USDe | $4.60B | 0x4c9EDD5852cd905f086C759E8383e09bff1E68B3 |
| DAI | $4.57B | 0x6B175474E89094C44Da98b954EedeAC495271d0F |
| crvUSD | $2.10B | 0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E |
| USD1 | $1.58B | 0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d |
| PYUSD | $1.71B | 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8 |
| RLUSD | $1.37B | 0x8292bb45bf1ee4d140127049757c2e0ff06317ed |
| USDY | $1.04B | 0x96F6eF951840721AdBF46Ac996b59E0235CB985C |
| GHO | $699M | 0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f |
| USD0 | $548M | 0x73a15fed60bf67631dc6cd7bc5b6e8da8190acf5 |
| USDTB | $484M | 0xc139190f447e929f090edeb554d95abb8b18ac1c |
| USDG | $360M | 0xe343167631d89b6ffc58b88d6b7fb0228795491d |
| TUSD | $315M | 0x0000000000085d4780b73119b644ae5ecd22b376 |
| U | $279M | 0xce24439f2d9c6a2289f741120fe202248b666666 |
| FDUSD | $220M | 0xc5f0f7b66764f6ec8c8dff7ba683102295e16409 |
| FRAX | $219M | 0x853d955aCEf822Db058eb8505911ED77F175b99e |
| BUIDL | $212M | 0x7712c34205737192402172409a8F7ccef8aA2AEc |
| MIM | $175M | 0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3 |
| USDD | $124M | 0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6 |
| DOLA | $104M | 0x865377367054516e17014ccded1e7d814edc9ce4 |
| FRXUSD | $95M | 0xcacd6fd266af91b8aed52accc382b4e165586e29 |
| BENJI | $48M | 0x3ddc84940ab509c11b20b76b466933f40b750dc9 |
| BRSRV | $50M | 0x3078bcf707e457d3af2f938a2a478bbeea50a942 |
| GUSD | $39M | 0x056fd409e1d7a124bd7017459dfea2f387b6d5cd |
| USYC | $37M | 0x136471a34f6ef19fe571effc1ca711fdb8e49f2b |
| LUSD | $26M | 0x5f98805a4e8be255a32880fdec7f6728c6568ba0 |
| ALUSD | $10M | 0xbc6da0fe9ad5f3b0d58160288917aa56653660e9 |
| OUSG | $1.27M | 0x1b19c19393e2d034d8ff31ff34c81252fcbbee92 |
| eUSD | $2M | 0x14913815bcfde78baead2111f463d038ac9c2949 |

### Cross-Chain (32 pairs, $166.80B)

| Asset | Chains | Total |
|-------|--------|-------|
| USDT | 7 (ETH, BSC, ARB, OP, AVAX, Base, Polygon) | $101.15B |
| USDC | 17 (ETH, Base, BSC, ARB, OP, AVAX, Polygon, Celo, Gnosis, Sonic, Linea, Mantle, zkSync, Metis, Scroll, Aurora, Zora) | $60.46B |
| DAI | 8 (ETH, Base, ARB, OP, AVAX, BSC, Polygon, Gnosis) | $5.19B |

### Tokenized Funds (7 measured)

| Fund | Supply | Chain |
|------|--------|-------|
| BUIDL (BlackRock) | $212M | Ethereum |
| USDY (Ondo) | $1.04B | Ethereum |
| USDG (Paxos) | $360M | Ethereum |
| USD1 (WLFI) | $1.58B | Ethereum |
| USYC (Circle) | $37M | Ethereum |
| BENJI (Franklin) | $48M | Ethereum |
| OUSG (Ondo) | $1.27M | Ethereum |

### RLUSD Cross-Chain

| Chain | Supply | State |
|-------|--------|-------|
| Ethereum | $1.37B | DEEP_MEASURED |
| Base | $1.00B | DEEP_MEASURED |
| XRPL | $0 | NO_ISSUED_SUPPLY |
| **Total** | **$2.37B** | **98.8% of DefiLlama $2.40B** |

## Coverage Matrix

- 425 subjects indexed
- 42+ subjects MEASURED (9.9%+ coverage)
- 383 INDEXED (not measured)
- Trigger schedule: 8 daily, 13 weekly, 9 monthly

## Alerts (6)

| Severity | Type | Asset |
|----------|------|-------|
| HIGH | stale_attestation | USDT |
| HIGH | stale_attestation | USDV |
| MEDIUM | stale_attestation | USDe |
| MEDIUM | stale_attestation | USD1 |
| MEDIUM | concentration_risk | DAI |
| LOW | issuer_ambiguity | USDC |

## Blockers

1. **Signing key** — card production (TUI 1)
2. **Root ceremony** — Merkle inclusion
3. **Base EAS** (~$0.01) — needs owner wallet
4. **XRPL memo** (~$0.00001) — needs owner wallet
5. **OTS Bitcoin** — CONFIRMED (block 966712)

---

*TUI 2 — Global Financial and Asset Index*
*Status: ACHIEVED*
