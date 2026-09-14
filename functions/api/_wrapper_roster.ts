/**
 * Wrapped-asset roster — the SAME pairs scripts/readers/wrapped-asset-parity-reader.mjs reads.
 * functions/api/wrapper.test.ts pins the two rosters equal; edit the reader first, then mirror here.
 * A pair joins only with wrapped + canonical contracts and a named escrow, or a `native`/`custodial` note.
 */
export const WRAPPER_ROSTER = [
  {
    "id": "usdc.e:arbitrum",
    "wrapped": {
      "chain": "arbitrum",
      "symbol": "USDC.e",
      "address": "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDC",
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    "backing_model": "escrow",
    "escrow": "0xcEe284F754E854890e311e3280b767F80797180d",
    "escrow_name": "Arbitrum One ERC-20 gateway escrow"
  },
  {
    "id": "usdt:arbitrum",
    "wrapped": {
      "chain": "arbitrum",
      "symbol": "USDT",
      "address": "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDT",
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    },
    "backing_model": "native",
    "escrow": "0xcEe284F754E854890e311e3280b767F80797180d",
    "escrow_name": "Arbitrum One ERC-20 gateway escrow (legacy bridged remainder only)",
    "note": "Tether issues USDT natively on Arbitrum since 2025; the gateway escrow backs only the legacy bridged remainder. The wrapped supply is read; no parity is claimed."
  },
  {
    "id": "usdc.e:optimism",
    "wrapped": {
      "chain": "optimism",
      "symbol": "USDC.e",
      "address": "0x7F5c764cBc14f9669B88837ca1490cCa17c31607"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDC",
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    "backing_model": "escrow",
    "escrow": "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
    "escrow_name": "OP Mainnet L1StandardBridge"
  },
  {
    "id": "usdt:optimism",
    "wrapped": {
      "chain": "optimism",
      "symbol": "USDT",
      "address": "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDT",
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    },
    "backing_model": "escrow",
    "escrow": "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
    "escrow_name": "OP Mainnet L1StandardBridge"
  },
  {
    "id": "dai:optimism",
    "wrapped": {
      "chain": "optimism",
      "symbol": "DAI",
      "address": "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "DAI",
      "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    },
    "backing_model": "escrow",
    "escrow": "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
    "escrow_name": "OP Mainnet DAI bridge escrow (L1Escrow)"
  },
  {
    "id": "usdbc:base",
    "wrapped": {
      "chain": "base",
      "symbol": "USDbC",
      "address": "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDC",
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    "backing_model": "escrow",
    "escrow": "0x3154Cf16ccdb4C6d922629664174b904d80F2C35",
    "escrow_name": "Base L1StandardBridge"
  },
  {
    "id": "dai:base",
    "wrapped": {
      "chain": "base",
      "symbol": "DAI",
      "address": "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "DAI",
      "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    },
    "backing_model": "escrow",
    "escrow": "0x3154Cf16ccdb4C6d922629664174b904d80F2C35",
    "escrow_name": "Base L1StandardBridge"
  },
  {
    "id": "usdc:base",
    "wrapped": {
      "chain": "base",
      "symbol": "USDC",
      "address": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDC",
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    "backing_model": "native",
    "escrow": null,
    "escrow_name": null,
    "note": "Circle mints USDC natively on Base (CCTP burn-and-mint). No escrow exists to read; the wrapped supply is read, no parity is claimed."
  },
  {
    "id": "usdc:arbitrum",
    "wrapped": {
      "chain": "arbitrum",
      "symbol": "USDC",
      "address": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDC",
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    "backing_model": "native",
    "escrow": null,
    "escrow_name": null,
    "note": "Circle mints USDC natively on Arbitrum One (CCTP). No escrow exists to read; the wrapped supply is read, no parity is claimed."
  },
  {
    "id": "usdc.e:polygon",
    "wrapped": {
      "chain": "polygon",
      "symbol": "USDC.e",
      "address": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDC",
      "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
    },
    "backing_model": "escrow",
    "escrow": "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf",
    "escrow_name": "Polygon PoS bridge ERC20Predicate"
  },
  {
    "id": "usdt:polygon",
    "wrapped": {
      "chain": "polygon",
      "symbol": "USDT",
      "address": "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "USDT",
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    },
    "backing_model": "native",
    "escrow": "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf",
    "escrow_name": "Polygon PoS bridge ERC20Predicate (legacy bridged remainder only)",
    "note": "Tether issues USDT natively on Polygon; the PoS predicate backs only the legacy bridged remainder (escrow ≈1% of supply on 2026-09-13). The wrapped supply is read; no parity is claimed."
  },
  {
    "id": "dai:polygon",
    "wrapped": {
      "chain": "polygon",
      "symbol": "DAI",
      "address": "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063"
    },
    "canonical": {
      "chain": "ethereum",
      "symbol": "DAI",
      "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    },
    "backing_model": "escrow",
    "escrow": "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf",
    "escrow_name": "Polygon PoS bridge ERC20Predicate"
  },
  {
    "id": "wbtc:ethereum",
    "wrapped": {
      "chain": "ethereum",
      "symbol": "WBTC",
      "address": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
    },
    "canonical": {
      "chain": "bitcoin",
      "symbol": "BTC",
      "address": "custodian-held (BitGo et al.); not an EVM contract"
    },
    "backing_model": "custodial",
    "escrow": null,
    "escrow_name": null,
    "note": "BTC reserve held by custodians and self-published (wbtc.network / Chainlink PoR fed by the custodian). Nothing independent is readable from here; INDEXED, no parity claimed."
  },
  {
    "id": "cbbtc:base",
    "wrapped": {
      "chain": "base",
      "symbol": "cbBTC",
      "address": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"
    },
    "canonical": {
      "chain": "bitcoin",
      "symbol": "BTC",
      "address": "Coinbase custody; not an EVM contract"
    },
    "backing_model": "custodial",
    "escrow": null,
    "escrow_name": null,
    "note": "BTC reserve in Coinbase custody, self-published. INDEXED, no parity claimed."
  },
  {
    "id": "cbbtc:ethereum",
    "wrapped": {
      "chain": "ethereum",
      "symbol": "cbBTC",
      "address": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf"
    },
    "canonical": {
      "chain": "bitcoin",
      "symbol": "BTC",
      "address": "Coinbase custody; not an EVM contract"
    },
    "backing_model": "custodial",
    "escrow": null,
    "escrow_name": null,
    "note": "BTC reserve in Coinbase custody, self-published. INDEXED, no parity claimed."
  },
  {
    "id": "wxrp:ethereum",
    "wrapped": {
      "chain": "ethereum",
      "symbol": "wXRP",
      "address": "0x39fBBABf11738317a448031930706cd3e612e1B9"
    },
    "canonical": {
      "chain": "xrpl",
      "symbol": "XRP",
      "address": "custodian-held XRPL account (Wrapped.com); readable on XRPL, not from here"
    },
    "backing_model": "custodial",
    "escrow": null,
    "escrow_name": null,
    "note": "XRP reserve held on the XRP Ledger by the wrapper's custodian; a future XRPL-side read can pair with this supply. INDEXED, no parity claimed."
  },
  {
    "id": "buidl:ethereum",
    "wrapped": {
      "chain": "ethereum",
      "symbol": "BUIDL",
      "address": "0x7712c34205737192402172409a8F7ccef8aA2AEc"
    },
    "canonical": {
      "chain": "offchain",
      "symbol": "fund shares",
      "address": "transfer agent (Securitize); not on any chain"
    },
    "backing_model": "custodial",
    "escrow": null,
    "escrow_name": null,
    "note": "Tokenised fund shares; the reserve is the fund's assets held off-chain, reported by the transfer agent. INDEXED, no parity claimed."
  },
  {
    "id": "weth:arbitrum",
    "wrapped": { "chain": "arbitrum", "symbol": "WETH", "address": "0x82aF49448D82B08cD7C12Be3B9395C0e72f16154" },
    "canonical": { "chain": "ethereum", "symbol": "ETH", "address": "native ETH (not an ERC-20 contract)" },
    "backing_model": "custodial",
    "escrow": null,
    "escrow_name": null,
    "note": "WETH on Arbitrum at 0x82aF... is a WETH9 wrapper (deposit ETH, get WETH). totalSupply() returns empty on Arbiscan RPC (contract may be a minimal proxy with non-standard storage). ETH backing is the deposit mechanism. INDEXED, no parity claimed from here."
  },
  {
    "id": "usdc:zksync-era",
    "wrapped": { "chain": "zksync-era", "symbol": "USDC", "address": "0x1d17CBcF0D6D143135aE9C6B21C1fC6D80C59e3E" },
    "canonical": { "chain": "ethereum", "symbol": "USDC", "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" },
    "backing_model": "escrow",
    "escrow": "0x5797EA1b374f2A4F1E8BcE5156c3962b78E1C46a",
    "escrow_name": "zkSync Era L1 USDC Bridge (native bridge)"
  },
  {
    "id": "usdt0:optimism",
    "wrapped": { "chain": "optimism", "symbol": "USDT0", "address": "0x2E1dBfbf44d8855fDE5D5fD6c978a9b10bc27627" },
    "canonical": { "chain": "ethereum", "symbol": "USDT", "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    "backing_model": "native",
    "escrow": null,
    "escrow_name": null,
    "note": "USDT0 on Optimism via LayerZero OFT. Native issuance; no escrow; supply read, no parity claimed."
  },
  {
    "id": "usdt0:arbitrum",
    "wrapped": { "chain": "arbitrum", "symbol": "USDT0", "address": "0x2E1dBfbf44d8855fDE5D5fD6c978a9b10bc27627" },
    "canonical": { "chain": "ethereum", "symbol": "USDT", "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    "backing_model": "native",
    "escrow": null,
    "escrow_name": null,
    "note": "USDT0 on Arbitrum via LayerZero OFT. Native issuance; no escrow; supply read, no parity claimed."
  }
] as const;
