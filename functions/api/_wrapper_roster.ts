/**
 * Wrapped-asset roster — the SAME pairs scripts/readers/wrapped-asset-parity-reader.mjs reads.
 * functions/api/wrapper.test.ts pins the two rosters equal; edit the reader first, then mirror here.
 * A pair joins only with wrapped + canonical contracts and a named escrow, or a `native` note.
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
  }
] as const;
