#!/usr/bin/env node
/**
 * Wrapped-asset parity reader — CSOAI wrapper-economy ledger, first cut (2026-09-13).
 *
 * For each bridged stablecoin pair it reads, from public RPC with no key:
 *   wrapped_total_supply   totalSupply() of the wrapped token on the destination chain
 *   escrow_balance         balanceOf(escrow) of the canonical token on the origin chain
 * and reports escrow/wrapped as a point-in-time ratio. Both reads are pinned to a
 * provider-reported finalized block per chain and every raw hex result is sha256'd.
 *
 * States are never collapsed:
 *   ESCROW_PARITY_READ      both reads succeeded; ratio is what the chain said
 *   UNCHECKABLE_NATIVE_ISSUANCE the token is natively issued on the destination chain
 *                               (no escrow backs it); the wrapped supply is read, the ratio
 *                               is NOT computed — a native issuance is not "unbacked"
 *   INDEXED_CUSTODIAL           reserves sit with a custodian off-chain or on another ledger
 *                               (wBTC, cbBTC, wXRP, BUIDL); the wrapped supply is read, no
 *                               reserve is readable from here — INDEXED, not "unbacked"
 *   UNMEASURED                  a read failed; the error is recorded, nothing is inferred
 *
 * Not a rate, not a grade, not a reserve attestation, not a certificate. The escrow
 * addresses are the bridges' own published contracts; a reader can verify each one.
 *
 * Usage: node scripts/readers/wrapped-asset-parity-reader.mjs [--json] [--out <file>] [--stage <dir>]
 * Env:   EVM_RPC_<CHAIN> overrides a default endpoint (recorded, never silent), same as
 *        evm-erc20-reader.mjs. eth.llamarpc.com answered HTTP 525 on 2026-09-13, so the
 *        Ethereum default here is publicnode.
 */

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { normalizeAtomicAmount, rpcCall } from "./evm-erc20-reader.mjs";

export const SCHEMA = "csoai.wrapped-asset-parity/0.1";
export const READER_REVISION = "scripts/readers/wrapped-asset-parity-reader.mjs@0.1.1";

export const CHAINS = {
  ethereum: { rpc: "https://ethereum-rpc.publicnode.com", chainId: 1 },
  base: { rpc: "https://mainnet.base.org", chainId: 8453 },
  optimism: { rpc: "https://mainnet.optimism.io", chainId: 10 },
  arbitrum: { rpc: "https://arb1.arbitrum.io/rpc", chainId: 42161 },
  // polygon-rpc.com answers 401 without a key since 2026-09; publicnode is keyless.
  polygon: { rpc: "https://polygon-bor-rpc.publicnode.com", chainId: 137 },

    "zksync-era": { rpc: "https://mainnet.era.zksync.io", chainId: 324 },
  // Flare C-chain public RPC (keyless), for FXRP (FAssets).
  flare: { rpc: "https://flare-api.flare.network/ext/C/rpc", chainId: 14 },
};

const SEL = { totalSupply: "0x18160ddd", balanceOf: "0x70a08231", decimals: "0x313ce567" };

const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_ETH = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const DAI_ETH = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

// Bridge escrows (the bridges' published L1 contracts). Cited so a stranger can check them.
const ESCROW = {
  arbitrum_erc20_gateway: "0xcEe284F754E854890e311e3280b767F80797180d",
  optimism_l1_standard_bridge: "0x99C9fc46f92E8a1c0deC1b1747d010903E884bE1",
  optimism_dai_escrow: "0x467194771dAe2967Aef3ECbEDD3Bf9a310C76C65",
  base_l1_standard_bridge: "0x3154Cf16ccdb4C6d922629664174b904d80F2C35",
  polygon_pos_erc20_predicate: "0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf",
};

/**
 * backing_model:
 *   "escrow"  the wrapped supply is minted against tokens locked in a named L1 escrow
 *   "native"  the issuer mints natively on the destination chain (Circle CCTP / Tether native);
 *             an escrow read would be meaningless, so none is attempted
 *   "custodial" a custodian holds the reserve off-chain or on another ledger (BTC, XRP, fund
 *             shares); nothing on this chain can be read as the reserve, so only the wrapped
 *             supply is read and the pair stays INDEXED until a reserve read exists
 */
export const ROSTER = [
  { id: "usdc.e:arbitrum", wrapped: { chain: "arbitrum", symbol: "USDC.e", address: "0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8" },
    canonical: { chain: "ethereum", symbol: "USDC", address: USDC_ETH }, backing_model: "escrow", escrow: ESCROW.arbitrum_erc20_gateway, escrow_name: "Arbitrum One ERC-20 gateway escrow" },
  { id: "usdt:arbitrum", wrapped: { chain: "arbitrum", symbol: "USDT", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
    canonical: { chain: "ethereum", symbol: "USDT", address: USDT_ETH }, backing_model: "native", escrow: ESCROW.arbitrum_erc20_gateway, escrow_name: "Arbitrum One ERC-20 gateway escrow (legacy bridged remainder only)",
    note: "Tether issues USDT natively on Arbitrum since 2025; the gateway escrow backs only the legacy bridged remainder. The wrapped supply is read; no parity is claimed." },
  { id: "usdc.e:optimism", wrapped: { chain: "optimism", symbol: "USDC.e", address: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607" },
    canonical: { chain: "ethereum", symbol: "USDC", address: USDC_ETH }, backing_model: "escrow", escrow: ESCROW.optimism_l1_standard_bridge, escrow_name: "OP Mainnet L1StandardBridge" },
  { id: "usdt:optimism", wrapped: { chain: "optimism", symbol: "USDT", address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58" },
    canonical: { chain: "ethereum", symbol: "USDT", address: USDT_ETH }, backing_model: "escrow", escrow: ESCROW.optimism_l1_standard_bridge, escrow_name: "OP Mainnet L1StandardBridge" },
  { id: "dai:optimism", wrapped: { chain: "optimism", symbol: "DAI", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1" },
    canonical: { chain: "ethereum", symbol: "DAI", address: DAI_ETH }, backing_model: "escrow", escrow: ESCROW.optimism_dai_escrow, escrow_name: "OP Mainnet DAI bridge escrow (L1Escrow)" },
  { id: "usdbc:base", wrapped: { chain: "base", symbol: "USDbC", address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA" },
    canonical: { chain: "ethereum", symbol: "USDC", address: USDC_ETH }, backing_model: "escrow", escrow: ESCROW.base_l1_standard_bridge, escrow_name: "Base L1StandardBridge" },
  { id: "dai:base", wrapped: { chain: "base", symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" },
    canonical: { chain: "ethereum", symbol: "DAI", address: DAI_ETH }, backing_model: "escrow", escrow: ESCROW.base_l1_standard_bridge, escrow_name: "Base L1StandardBridge" },
  { id: "usdc:base", wrapped: { chain: "base", symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
    canonical: { chain: "ethereum", symbol: "USDC", address: USDC_ETH }, backing_model: "native", escrow: null, escrow_name: null,
    note: "Circle mints USDC natively on Base (CCTP burn-and-mint). No escrow exists to read; the wrapped supply is read, no parity is claimed." },
  { id: "usdc:arbitrum", wrapped: { chain: "arbitrum", symbol: "USDC", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831" },
    canonical: { chain: "ethereum", symbol: "USDC", address: USDC_ETH }, backing_model: "native", escrow: null, escrow_name: null,
    note: "Circle mints USDC natively on Arbitrum One (CCTP). No escrow exists to read; the wrapped supply is read, no parity is claimed." },
  { id: "usdc.e:polygon", wrapped: { chain: "polygon", symbol: "USDC.e", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174" },
    canonical: { chain: "ethereum", symbol: "USDC", address: USDC_ETH }, backing_model: "escrow", escrow: ESCROW.polygon_pos_erc20_predicate, escrow_name: "Polygon PoS bridge ERC20Predicate" },
  { id: "usdt:polygon", wrapped: { chain: "polygon", symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F" },
    canonical: { chain: "ethereum", symbol: "USDT", address: USDT_ETH }, backing_model: "native", escrow: ESCROW.polygon_pos_erc20_predicate, escrow_name: "Polygon PoS bridge ERC20Predicate (legacy bridged remainder only)",
    note: "Tether issues USDT natively on Polygon; the PoS predicate backs only the legacy bridged remainder (escrow ≈1% of supply on 2026-09-13). The wrapped supply is read; no parity is claimed." },
  { id: "dai:polygon", wrapped: { chain: "polygon", symbol: "DAI", address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063" },
    canonical: { chain: "ethereum", symbol: "DAI", address: DAI_ETH }, backing_model: "escrow", escrow: ESCROW.polygon_pos_erc20_predicate, escrow_name: "Polygon PoS bridge ERC20Predicate" },
  // Custodial wrappers — the reserve is not on an EVM chain we can read. Supply only; INDEXED.
  { id: "wbtc:ethereum", wrapped: { chain: "ethereum", symbol: "WBTC", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599" },
    canonical: { chain: "bitcoin", symbol: "BTC", address: "custodian-held (BitGo et al.); not an EVM contract" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "BTC reserve held by custodians and self-published (wbtc.network / Chainlink PoR fed by the custodian). Nothing independent is readable from here; INDEXED, no parity claimed." },
  { id: "cbbtc:base", wrapped: { chain: "base", symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" },
    canonical: { chain: "bitcoin", symbol: "BTC", address: "Coinbase custody; not an EVM contract" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "BTC reserve in Coinbase custody, self-published. INDEXED, no parity claimed." },
  { id: "cbbtc:ethereum", wrapped: { chain: "ethereum", symbol: "cbBTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf" },
    canonical: { chain: "bitcoin", symbol: "BTC", address: "Coinbase custody; not an EVM contract" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "BTC reserve in Coinbase custody, self-published. INDEXED, no parity claimed." },
  { id: "wxrp:ethereum", wrapped: { chain: "ethereum", symbol: "wXRP", address: "0x39fBBABf11738317a448031930706cd3e612e1B9" },
    canonical: { chain: "xrpl", symbol: "XRP", address: "custodian-held XRPL account (Wrapped.com); readable on XRPL, not from here" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "XRP reserve held on the XRP Ledger by the wrapper's custodian; a future XRPL-side read can pair with this supply. INDEXED, no parity claimed." },
  { id: "buidl:ethereum", wrapped: { chain: "ethereum", symbol: "BUIDL", address: "0x7712c34205737192402172409a8F7ccef8aA2AEc" },
    canonical: { chain: "offchain", symbol: "fund shares", address: "transfer agent (Securitize); not on any chain" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "Tokenised fund shares; the reserve is the fund's assets held off-chain, reported by the transfer agent. INDEXED, no parity claimed." },

  // WETH on Arbitrum — wrapped ETH via Arbitrum One bridge
  // Source: https://docs.arbitrum.io/build-decentralized-apps/token-bridging/bridge-tokens-overview
  { id: "weth:arbitrum", wrapped: { chain: "arbitrum", symbol: "WETH", address: "0x82aF49448D82B08cD7C12Be3B9395C0e72f16154" },
    canonical: { chain: "ethereum", symbol: "ETH", address: "native ETH (not an ERC-20 contract)" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "WETH on Arbitrum at 0x82aF... is a WETH9 wrapper (deposit ETH, get WETH). totalSupply() returns empty on Arbiscan RPC (contract may be a minimal proxy with non-standard storage). ETH backing is the deposit mechanism. INDEXED, no parity claimed from here." },

  // USDC on zkSync Era — bridged via zkSync Era native bridge
  // Source: https://docs.zksync.io/zksync-protocol/bridging/bridging-asset
  { id: "usdc:zksync-era", wrapped: { chain: "zksync-era", symbol: "USDC", address: "0x1d17CBcF0D6D143135aE9C6B21C1fC6D80C59e3E" },
    canonical: { chain: "ethereum", symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" }, backing_model: "escrow",
    escrow: "0x5797EA1b374f2A4F1E8BcE5156c3962b78E1C46a", escrow_name: "zkSync Era L1 USDC Bridge (native bridge)" },

  // USDT0 — LayerZero OFT. Token addresses from https://docs.usdt0.to/technical-documentation/deployments (read 2026-09-14):
  // Arbitrum One token 0xFd086bC7…, OP Mainnet token 0x01bFF417…, Ethereum OFT Adapter 0x6C96dE32….
  // Correction 2026-09-14: both rows previously named 0x2E1dBfbf44d8855fDE5D5fD6c978a9b10bc27627, where eth_call returns empty
  // on both chains (no token there), which is why both read UNMEASURED. USDT0 is not deployed as a token on Ethereum mainnet.
  { id: "usdt0:optimism", wrapped: { chain: "optimism", symbol: "USDT0", address: "0x01bFF41798a0BcF287b996046Ca68b395DbC1071" },
    canonical: { chain: "ethereum", symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" }, backing_model: "native",
    escrow: null, escrow_name: null,
    note: "USDT0 is a LayerZero OFT: USDT is locked in one OFT Adapter on Ethereum (0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee) against the combined supply of every USDT0 chain, so no per-chain escrow exists and no per-pair parity is claimed; treated as native issuance on this chain. Supply read." },
  { id: "usdt0:arbitrum", wrapped: { chain: "arbitrum", symbol: "USDT0", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9" },
    canonical: { chain: "ethereum", symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" }, backing_model: "native",
    escrow: null, escrow_name: null,
    note: "Same contract as usdt:arbitrum (it reports name and symbol USD₮0 on 2026-09-14). USDT0 is a LayerZero OFT: USDT is locked in one OFT Adapter on Ethereum (0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee) against the combined supply of every USDT0 chain, so no per-chain escrow exists and no per-pair parity is claimed; treated as native issuance on this chain. Supply read." },

  // Custodial additions 2026-09-14 (#011/#012). Each address was read on-chain the same day (name/symbol/decimals/totalSupply).
  // cbXRP on Base — https://basescan.org/token/0xcb585250f852c6c6bf90434ab21a00f02833a4af (name() "Coinbase Wrapped XRP").
  { id: "cbxrp:base", wrapped: { chain: "base", symbol: "cbXRP", address: "0xcb585250f852C6c6bf90434AB21A00f02833a4af" },
    canonical: { chain: "xrpl", symbol: "XRP", address: "Coinbase custody; not an EVM contract" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "XRP reserve in Coinbase custody, self-published. INDEXED, no parity claimed." },
  // FXRP on Flare — resolved on-chain: FlareContractRegistry 0xaD67FE66660Fb8dFE9d6b1b4240d8650e30F6019
  // getContractAddressByName("AssetManagerFXRP") → 0x2a3Fe068cD92178554cabcf7c95ADf49B4b0B6A8; its fAsset() → 0xAd552A648C74D49E10027AB8a618A3ad4901c5bE.
  { id: "fxrp:flare", wrapped: { chain: "flare", symbol: "FXRP", address: "0xAd552A648C74D49E10027AB8a618A3ad4901c5bE" },
    canonical: { chain: "xrpl", symbol: "XRP", address: "FAssets agents' XRPL accounts; not an EVM contract" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "Underlying XRP sits in FAssets agents' XRPL accounts with agent collateral posted on Flare; Flare documents the XRPL side as verified through its Data Connector. Neither the XRPL holdings nor the agent collateral are read here. INDEXED, no parity claimed." },
  // JPM Coin (JPMD) on Base — contract address published by J.P. Morgan at https://www.jpmorgan.com/kinexys/jpm-coin (read 2026-09-14).
  { id: "jpmd:base", wrapped: { chain: "base", symbol: "JPMD", address: "0x7e0aedc93d9f898be835a44bfca3842e52416b82" },
    canonical: { chain: "offchain", symbol: "USD deposits", address: "bank deposits at J.P. Morgan; not on any chain" }, backing_model: "custodial", escrow: null, escrow_name: null,
    note: "A bank deposit token: the claim it represents is a deposit held off-chain. Supply read only. INDEXED, no parity claimed." },
];

/**
 * Issuer profiles (#011, 2026-09-14) — what the issuer DOCUMENTS about the wrapper, beside what the chain says.
 * A profile is documentary context, never a read and never a measurement: every axis is UNMEASURED until a
 * reader exists for it. A claim is quoted or paraphrased only from the source listed with it; where the
 * issuer's own page could not be fetched, the claim says so and names the attributed source instead.
 */
export const PROFILE_RULE =
  "profile = issuer-documented context with sources and retrieval dates. It is not a read, not a measurement and not a reserve attestation. Every axis is UNMEASURED. A missing profile is null, never an empty claim.";

const AXES_UNMEASURED = { reserve_or_backing: "UNMEASURED", redemption: "UNMEASURED", custody_controls: "UNMEASURED", issuer_claim_vs_supply: "UNMEASURED" };
const D = "2026-09-14";

const USDC_E = (chain, bridge) => ({
  issuer: `third-party bridged USDC on ${chain} (canonical bridge token), not issued by Circle`,
  custodian: `the ${bridge} escrow contract named on this record`,
  chains_documented: [chain],
  backing_claim: {
    as_documented: "Circle describes bridged USDC as \"Backed by USDC on another blockchain locked in a smart contract\", deployed by a third-party team. Whether this legacy contract follows Circle's Bridged USDC Standard is UNVERIFIED.",
    method: "lock-and-mint bridge escrow",
    documented_by: "https://www.circle.com/bridged-usdc",
  },
  measurement_class: "ON_CHAIN_SUPPLY_AND_ESCROW_READ",
  axes: AXES_UNMEASURED,
  sources: [{ url: "https://www.circle.com/bridged-usdc", retrieved_at: D, kind: "issuer_page" }],
});

const USDT0 = (chain, token) => ({
  issuer: "USDT0 (LayerZero OFT deployment of Tether USDT)",
  custodian: "OFT Adapter on Ethereum 0x6C96dE32CEa08842dcc4058c14d3aaAD7Fa41dee (shared across every USDT0 chain)",
  chains_documented: ["ethereum (adapter)", "arbitrum", "optimism", "and other chains listed on the deployments page"],
  backing_claim: {
    as_documented: "On Ethereum the OAdapterUpgradeable \"Locks/Unlocks tokens for cross-chain transfers\" and interfaces with the TetherToken contract.",
    method: "single lock adapter on Ethereum; burn-and-mint across OFT chains",
    documented_by: "https://docs.usdt0.to/technical-documentation/developer",
  },
  measurement_class: "ON_CHAIN_SUPPLY_READ",
  axes: { ...AXES_UNMEASURED, cross_chain_aggregate_parity: "UNMEASURED" },
  sources: [
    { url: "https://docs.usdt0.to/technical-documentation/deployments", retrieved_at: D, kind: "issuer_docs", note: `token on ${chain}: ${token}` },
    { url: "https://docs.usdt0.to/technical-documentation/developer", retrieved_at: D, kind: "issuer_docs" },
  ],
});

const CBBTC = (chain) => ({
  issuer: "Coinbase",
  custodian: "Coinbase",
  chains_documented: [chain],
  backing_claim: {
    as_documented: "UNVERIFIED on a primary source today: https://www.coinbase.com/cbbtc returned HTTP 403 to a scripted fetch on 2026-09-14. No claim is quoted.",
    method: "custodian self-report (issuer page not read)",
    documented_by: null,
  },
  measurement_class: "ON_CHAIN_SUPPLY_READ",
  axes: AXES_UNMEASURED,
  sources: [{ url: "https://www.coinbase.com/cbbtc", retrieved_at: D, kind: "issuer_page", note: "HTTP 403 to fetch; not read" }],
});

export const PROFILES = {
  "usdc.e:arbitrum": USDC_E("arbitrum", "Arbitrum One ERC-20 gateway"),
  "usdc.e:optimism": USDC_E("optimism", "OP Mainnet L1StandardBridge"),
  "usdc.e:polygon": USDC_E("polygon", "Polygon PoS ERC20Predicate"),
  "usdt0:optimism": USDT0("optimism", "0x01bFF41798a0BcF287b996046Ca68b395DbC1071"),
  "usdt0:arbitrum": USDT0("arbitrum", "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"),
  "wbtc:ethereum": {
    issuer: "WBTC (BitGo named on the issuer page; other custodians not named there)",
    custodian: "BitGo (as named on wbtc.network); multi-jurisdictional custody reported elsewhere is UNVERIFIED here",
    chains_documented: ["Ethereum", "Solana", "TRON", "BNB Chain", "Base", "Kava", "Osmosis"],
    backing_claim: {
      as_documented: "\"Every WBTC is backed 1:1 by Bitcoin in secure custody, fully verifiable through the on-chain proof of Reserves.\"",
      method: "custodian-held BTC; issuer-published proof of reserves",
      documented_by: "https://wbtc.network/",
    },
    measurement_class: "ON_CHAIN_SUPPLY_READ",
    axes: AXES_UNMEASURED,
    sources: [{ url: "https://wbtc.network/", retrieved_at: D, kind: "issuer_page" }],
  },
  "cbbtc:base": CBBTC("base"),
  "cbbtc:ethereum": CBBTC("ethereum"),
  "cbxrp:base": {
    issuer: "Coinbase",
    custodian: "Coinbase",
    chains_documented: ["base"],
    backing_claim: {
      as_documented: "UNVERIFIED on a primary source today: https://www.coinbase.com/cbxrp returned HTTP 403 to a scripted fetch on 2026-09-14. A launch report (The Block, 2025-06) describes cbXRP as live on Base; that report is attributed, not read in full.",
      method: "custodian self-report (issuer page not read)",
      documented_by: null,
    },
    measurement_class: "ON_CHAIN_SUPPLY_READ",
    axes: AXES_UNMEASURED,
    sources: [
      { url: "https://www.coinbase.com/cbxrp", retrieved_at: D, kind: "issuer_page", note: "HTTP 403 to fetch; not read" },
      { url: "https://basescan.org/token/0xcb585250f852c6c6bf90434ab21a00f02833a4af", retrieved_at: D, kind: "explorer", note: "search-observed; on-chain name() read directly: Coinbase Wrapped XRP" },
      { url: "https://www.theblock.co/post/357087/coinbase-wrapped-xrp-doge-base", retrieved_at: D, kind: "attributed_report", note: "search-observed headline only" },
    ],
  },
  "fxrp:flare": {
    issuer: "Flare FAssets system (agent-operated)",
    custodian: "FAssets agents (underlying XRP on the XRP Ledger; collateral on Flare)",
    chains_documented: ["flare"],
    backing_claim: {
      as_documented: "\"FXRP is the FAsset representation of XRP on the Flare network\"; FAssets is described as a \"trustless, over-collateralized bridge\" that \"uses the Flare Data Connector (FDC) to verify XRPL transactions\".",
      method: "agent over-collateralisation plus FDC attestation of XRPL payments (as documented)",
      documented_by: "https://dev.flare.network/fxrp/overview",
    },
    measurement_class: "ON_CHAIN_SUPPLY_READ",
    axes: { ...AXES_UNMEASURED, agent_collateral_ratio: "UNMEASURED" },
    sources: [
      { url: "https://dev.flare.network/fxrp/overview", retrieved_at: D, kind: "issuer_docs" },
      { url: "https://flare-api.flare.network/ext/C/rpc", retrieved_at: D, kind: "onchain", note: "FlareContractRegistry getContractAddressByName(\"AssetManagerFXRP\") then fAsset() resolved the token address" },
    ],
  },
  "wxrp:ethereum": {
    issuer: "UNVERIFIED — the roster names Wrapped.com for this contract; no issuer page for it was read on 2026-09-14",
    custodian: "UNVERIFIED",
    chains_documented: ["ethereum"],
    backing_claim: { as_documented: "UNVERIFIED — no primary source for this contract was read today.", method: "UNVERIFIED", documented_by: null },
    premise_flag: "Two different tokens are called wXRP. This contract (name() \"Wrapped XRP\", symbol() \"WXRP\", 18 decimals, read 2026-09-14) is not the Hex Trust wXRP announced 2025-12-12 (LayerZero OFT; \"Each wXRP corresponds to one native XRP held in a segregated custody account with Hex Trust\"; chains Solana, Optimism, Ethereum, HyperEVM). No Hex Trust Ethereum contract address was found on a primary source today, so the Hex Trust token is not on the roster.",
    measurement_class: "ON_CHAIN_SUPPLY_READ",
    axes: AXES_UNMEASURED,
    sources: [
      { url: "https://etherscan.io/token/0x39fbbabf11738317a448031930706cd3e612e1b9", retrieved_at: D, kind: "explorer", note: "search-observed; on-chain name()/symbol() read directly" },
      { url: "https://www.hextrust.com/resources-collection/hex-trust-to-issue-and-custody-wrapped-xrp-wxrp", retrieved_at: D, kind: "issuer_page", note: "the other wXRP (Hex Trust); no contract address printed" },
    ],
  },
  "buidl:ethereum": {
    issuer: "BlackRock USD Institutional Digital Liquidity Fund (on-chain name() read 2026-09-14)",
    custodian: "fund assets: BNY as custodian and administrator; Securitize as transfer agent and tokenization platform — per the 2024-03-20 launch press release, search-observed (page body not retrieved)",
    chains_documented: ["ethereum", "aptos", "arbitrum", "avalanche", "optimism", "polygon"],
    backing_claim: {
      as_documented: "Tokenised fund shares; the fund's assets are held off-chain. Role assignments above are search-observed from the launch press release, not read in full today.",
      method: "tokenised fund shares; transfer-agent reporting",
      documented_by: null,
    },
    measurement_class: "ON_CHAIN_SUPPLY_READ",
    axes: { ...AXES_UNMEASURED, nav_vs_supply: "UNMEASURED" },
    sources: [
      { url: "https://securitize.io/learn/press/blackrock-launches-first-tokenized-fund-buidl-on-the-ethereum-network", retrieved_at: D, kind: "issuer_press_release", note: "page body not retrieved; roles search-observed" },
      { url: "https://www.prnewswire.com/news-releases/blackrock-launches-new-buidl-share-classes-across-multiple-blockchains-to-expand-access-and-potential-of-buidl-ecosystem-302304035.html", retrieved_at: D, kind: "issuer_press_release", note: "search-observed: additional chains" },
    ],
  },
  "jpmd:base": {
    issuer: "Kinexys by J.P. Morgan",
    custodian: "J.P. Morgan (the token represents a bank deposit)",
    chains_documented: ["base"],
    backing_claim: {
      as_documented: "JPM Coin (ticker JPMD) is \"J.P. Morgan's USD-denominated deposit token\", a \"digital representation of a bank deposit on public blockchain\" (J.P. Morgan newsroom, 2025-11-12). Contract address 0x7e0aedc93d9f898be835a44bfca3842e52416b82 is printed on the Kinexys JPM Coin page.",
      method: "bank deposit liability; off-chain",
      documented_by: "https://www.jpmorgan.com/payments/newsroom/jpm-coin-usd-deposit-token-institutional-clients",
    },
    measurement_class: "ON_CHAIN_SUPPLY_READ",
    axes: AXES_UNMEASURED,
    sources: [
      { url: "https://www.jpmorgan.com/kinexys/jpm-coin", retrieved_at: D, kind: "issuer_page", note: "publishes the Base contract address" },
      { url: "https://www.jpmorgan.com/payments/newsroom/jpm-coin-usd-deposit-token-institutional-clients", retrieved_at: D, kind: "issuer_press_release" },
    ],
  },
};

/**
 * DOCUMENTARY rows (#012, 2026-09-14) — institutional token programmes that cannot be read from a public chain
 * (private or permissioned ledgers, pilots, research prototypes). Class DOCUMENTARY: what the operator (or an
 * attributed report) publishes, with the retrieval date. No row is a read; every axis is UNMEASURED. Third-party
 * programmes are named as theirs — this ledger has no role in any of them.
 */
export const DOCUMENTARY_DEFINITION =
  "Institutional token programmes described from the operator's own publications, or from an attributed report where the operator's page could not be fetched. Nothing in a DOCUMENTARY row was read from a chain; every axis is UNMEASURED; status is as documented on the retrieval date, not as observed.";

const DOC_AXES = { ledger_observability: "UNMEASURED", supply_or_volume: "UNMEASURED", redemption: "UNMEASURED", operational_status: "UNMEASURED" };

export const DOCUMENTARY = [
  {
    id: "kinexys:jpmorgan", name: "Kinexys by J.P. Morgan", operator: "J.P. Morgan", class: "DOCUMENTARY",
    status_as_documented: "Operating; described by J.P. Morgan as its blockchain business unit, a provider of blockchain-based financial infrastructure since 2015, now offering USD deposit tokens on public blockchain.",
    what_as_documented: "Blockchain business unit; issues JPM Coin (JPMD), a USD deposit token on Base.",
    on_chain_observable: "PARTIAL — the JPMD contract on Base is published and read as roster pair jpmd:base; Kinexys's other ledgers are not observable from here.",
    attribution: null, axes: DOC_AXES,
    sources: [
      { url: "https://www.jpmorgan.com/payments/newsroom/jpm-coin-usd-deposit-token-institutional-clients", retrieved_at: D, kind: "operator_press_release", note: "dated 2025-11-12" },
      { url: "https://www.jpmorgan.com/kinexys/jpm-coin", retrieved_at: D, kind: "operator_page" },
    ],
  },
  {
    id: "citi-token-services:citi", name: "Citi Token Services", operator: "Citi", class: "DOCUMENTARY",
    status_as_documented: "Live commercial solution for cash between Singapore and New York as of the 2024-10-10 release; a 2025-11-26 Citi insights page describes operation \"in select markets\".",
    what_as_documented: "\"a private and permissioned blockchain that is solely owned and managed by Citi\"; \"Clients are not required to hold or manage any tokens to access the services.\"",
    on_chain_observable: "NO — private, permissioned ledger per the operator.",
    attribution: null, axes: DOC_AXES,
    sources: [
      { url: "https://www.citigroup.com/global/news/press-release/2024/citi-token-services-marks-new-milestone", retrieved_at: D, kind: "operator_press_release", note: "dated 2024-10-10" },
      { url: "https://www.citigroup.com/global/insights/citi-token-services-24-7-usd-clearing", retrieved_at: D, kind: "operator_page", note: "dated 2025-11-26" },
    ],
  },
  {
    id: "orion:hsbc", name: "HSBC Orion", operator: "HSBC", class: "DOCUMENTARY",
    status_as_documented: "Operating digital-assets platform; HM Treasury chose HSBC Orion as platform provider for the Digital Gilt Instrument (DIGIT) pilot (HSBC release, 2026-02-12).",
    what_as_documented: "A digital assets platform that has enabled issuance of over US$3.5 billion in digitally native bonds. A tokenised bond platform, not a deposit token or stablecoin; the release does not mention tokenised deposits.",
    on_chain_observable: "UNVERIFIED — the release does not state the ledger type.",
    attribution: null, axes: DOC_AXES,
    sources: [{ url: "https://www.hsbc.com/news-and-views/news/media-releases/2026/hsbc-orion-awarded-digit-platform-mandate", retrieved_at: D, kind: "operator_press_release", note: "dated 2026-02-12" }],
  },
  {
    id: "shared-ledger:swift", name: "Swift blockchain-based shared ledger (Swift's pilot)", operator: "Swift", class: "DOCUMENTARY",
    status_as_documented: "Attributed: CoinDesk (2026-07-09) reports Swift saying the ledger is ready for initial use by 17 banks across six continents, which are preparing to pilot live transactions. Swift's own release was not readable: swift.com returned HTTP 403 to fetches on 2026-09-14.",
    what_as_documented: "Attributed to Swift via CoinDesk: a shared layer for tokenised deposits issued on the banks' own ledgers, for 24/7 cross-border payments. Named banks in the report: UBS, BNP Paribas, BNY, Citi, HSBC, Wells Fargo.",
    on_chain_observable: "NO — permissioned; tokenised deposits stay on participating banks' ledgers per the report.",
    attribution: "CoinDesk, 2026-07-09; the Swift press release URL is recorded but was not read (HTTP 403).", axes: DOC_AXES,
    sources: [
      { url: "https://www.coindesk.com/business/2026/07/09/swift-rolls-out-24-7-blockchain-payment-systems-with-17-global-banks-across-six-continents", retrieved_at: D, kind: "attributed_report" },
      { url: "https://www.swift.com/news-events/press-releases/swifts-blockchain-ledger-ready-use-17-banks-set-pioneer-tokenised-cross-border-payments-trusted-global-infrastructure", retrieved_at: D, kind: "operator_press_release", note: "HTTP 403 to fetch; not read" },
    ],
  },
  {
    id: "gbtd:uk-finance", name: "GBTD — Great British Tokenised Deposits (UK Finance industry pilot)", operator: "UK Finance (industry pilot with participating banks)", class: "DOCUMENTARY",
    status_as_documented: "Pilot phase described as running \"until mid-2026\". That stated end date has passed as of 2026-09-14; the current status is UNVERIFIED.",
    what_as_documented: "\"GBTD\" is defined by UK Finance as Great British Tokenised Deposits — a digital representation of sterling commercial bank money. Participants listed: Barclays, HSBC, Lloyds Banking Group, Monzo, NatWest, Nationwide, Santander; supported by Quant, EY and Linklaters. Use cases: marketplace person-to-person payments, remortgaging, digital asset settlement.",
    on_chain_observable: "NO — no public contract or ledger is published on the page.",
    attribution: null, axes: DOC_AXES,
    sources: [
      { url: "https://www.ukfinance.org.uk/tokenised-sterling-deposits", retrieved_at: D, kind: "operator_page", note: "defines GBTD" },
      { url: "https://www.ukfinance.org.uk/news-and-insight/press-release/uk-finance-announces-live-pilot-phase-deliver-tokenised-sterling", retrieved_at: D, kind: "operator_press_release", note: "search-observed" },
    ],
  },
  {
    id: "agora:bis", name: "Project Agorá", operator: "BIS Innovation Hub with the Institute of International Finance (convenors)", class: "DOCUMENTARY",
    status_as_documented: "Experimental. The 2026-05-27 BIS release says the prototype showed tokenisation can address inefficiencies in wholesale cross-border payments and that work will advance to real-value testing; no production timeline is given.",
    what_as_documented: "A shared programmable platform with tokenised central bank reserves and tokenised commercial bank deposits. Central banks: Bank of England, Federal Reserve Bank of New York, Bank of France, Bank of Japan, Bank of Korea, Bank of Mexico, Swiss National Bank; more than 40 private-sector institutions; Bank of Canada joining.",
    on_chain_observable: "NO — research prototype; no public ledger.",
    attribution: null, axes: DOC_AXES,
    sources: [
      { url: "https://www.bis.org/press/p260527.htm", retrieved_at: D, kind: "operator_press_release", note: "dated 2026-05-27" },
      { url: "https://www.bis.org/publ/othp110.pdf", retrieved_at: D, kind: "operator_report", note: "search-observed; not read" },
    ],
  },
];

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const pad32 = (addr) => addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");

function endpoint(chain) {
  const cfg = CHAINS[chain];
  const used = process.env[`EVM_RPC_${chain.toUpperCase()}`] || cfg.rpc;
  return { used, substituted: used !== cfg.rpc, default: cfg.rpc, chainId: cfg.chainId };
}

/** One pinned block per chain per run, so every read in a record shares a height. */
async function pinBlock(rpc) {
  try {
    const b = await rpcCall(rpc, "eth_getBlockByNumber", ["finalized", false]);
    if (b?.number && b?.hash) return { number: parseInt(b.number, 16), hex: b.number, hash: b.hash, timestamp: parseInt(b.timestamp, 16), finality: "RPC_FINALIZED_TAG_PROVIDER_REPORTED_NOT_INDEPENDENTLY_PROVEN_FINAL" };
  } catch { /* fall through */ }
  const hex = await rpcCall(rpc, "eth_blockNumber", []);
  const b = await rpcCall(rpc, "eth_getBlockByNumber", [hex, false]);
  return { number: parseInt(hex, 16), hex, hash: b.hash, timestamp: parseInt(b.timestamp, 16), finality: "RPC_LATEST_NOT_INDEPENDENTLY_PROVEN_FINAL" };
}

async function call(rpc, to, data, blockHex) {
  // Public endpoints rate-limit bursts; one paced retry is allowed, then the read is
  // UNMEASURED with the error recorded. A retry never changes what the chain answers.
  let raw;
  for (let attempt = 0; attempt < 3; attempt++) {
    try { raw = await rpcCall(rpc, "eth_call", [{ to, data }, blockHex]); break; }
    catch (e) { if (attempt === 2 || !/rate limit|429/i.test(String(e))) throw e; await new Promise((r) => setTimeout(r, 2000 * (attempt + 1))); }
  }
  if (!raw || raw === "0x") throw new Error(`empty eth_call result from ${to}`);
  // Pace public endpoints: a burst of pins + reads across twelve pairs trips mainnet.base.org's
  // limiter (seen 2026-09-13, usdc:base UNMEASURED); 200 ms between calls keeps it honest.
  await new Promise((r) => setTimeout(r, 200));
  return { raw, value: BigInt(raw), raw_sha256: sha256(raw) };
}

/** Ratio as a decimal string with 6 places, computed in BigInt — no float in the record. */
export function ratioString(numerator, denominator) {
  if (denominator === 0n) return null;
  const scaled = (numerator * 1_000_000n) / denominator;
  const whole = scaled / 1_000_000n;
  const frac = (scaled % 1_000_000n).toString().padStart(6, "0");
  return `${whole}.${frac}`;
}

export async function readPair(entry, pins) {
  const w = endpoint(entry.wrapped.chain);
  const c = CHAINS[entry.canonical.chain] ? endpoint(entry.canonical.chain) : null;
  const rec = {
    id: entry.id,
    wrapped: { ...entry.wrapped, chainId: w.chainId, endpoint: w.used, endpoint_substituted: w.substituted, block: pins[entry.wrapped.chain] },
    canonical: c ? { ...entry.canonical, chainId: c.chainId, endpoint: c.used, endpoint_substituted: c.substituted, block: pins[entry.canonical.chain] } : { ...entry.canonical, chainId: null, endpoint: null, endpoint_substituted: false, block: null },
    backing_model: entry.backing_model,
    escrow: entry.escrow, escrow_name: entry.escrow_name,
    note: entry.note || null,
    reads: {},
    state: "UNMEASURED",
    error: null,
  };
  try {
    const dec = await call(w.used, entry.wrapped.address, SEL.decimals, pins[entry.wrapped.chain].hex);
    const decimals = Number(dec.value);
    const ts = await call(w.used, entry.wrapped.address, SEL.totalSupply, pins[entry.wrapped.chain].hex);
    rec.reads.wrapped_total_supply = { query: "totalSupply()", raw: ts.raw, raw_sha256: ts.raw_sha256, atomic: ts.value.toString(), normalized: normalizeAtomicAmount(ts.value.toString(), decimals), decimals };
    if (entry.backing_model === "escrow") {
      const eb = await call(c.used, entry.canonical.address, SEL.balanceOf + pad32(entry.escrow), pins[entry.canonical.chain].hex);
      rec.reads.escrow_balance = { query: `balanceOf(${entry.escrow})`, raw: eb.raw, raw_sha256: eb.raw_sha256, atomic: eb.value.toString(), normalized: normalizeAtomicAmount(eb.value.toString(), decimals), decimals };
      rec.escrow_over_wrapped = ratioString(eb.value, ts.value);
      rec.state = "ESCROW_PARITY_READ";
    } else if (entry.backing_model === "native") {
      rec.escrow_over_wrapped = null;
      rec.state = "UNCHECKABLE_NATIVE_ISSUANCE";
    } else {
      rec.escrow_over_wrapped = null;
      rec.state = "INDEXED_CUSTODIAL";
    }
  } catch (e) {
    rec.error = String((e && e.message) || e);
    rec.state = "UNMEASURED";
  }
  return rec;
}

export async function readAll(roster = ROSTER) {
  const chains = [...new Set(roster.flatMap((r) => [r.wrapped.chain, r.canonical.chain]))].filter((ch) => CHAINS[ch]);
  const pins = {};
  for (const ch of chains) {
    try { pins[ch] = await pinBlock(endpoint(ch).used); }
    catch (e) { pins[ch] = { error: String((e && e.message) || e) }; }
  }
  const records = [];
  for (const entry of roster) {
    if (pins[entry.wrapped.chain]?.error || (CHAINS[entry.canonical.chain] && pins[entry.canonical.chain]?.error)) {
      records.push({ id: entry.id, backing_model: entry.backing_model, state: "UNMEASURED", error: "block pin failed", wrapped: entry.wrapped, canonical: entry.canonical });
      continue;
    }
    records.push(await readPair(entry, pins));
  }
  const counts = {};
  for (const r of records) counts[r.state] = (counts[r.state] || 0) + 1;
  // Issuer-documented context, never a read: null where no profile has been compiled (not an empty claim).
  for (const r of records) r.profile = PROFILES[r.id] ?? null;
  return {
    schema: SCHEMA,
    reader_revision: READER_REVISION,
    as_of: new Date().toISOString(),
    attests: "point-in-time reads of wrapped totalSupply and origin-chain escrow balance at the pinned blocks named in each record; a ratio, not a rate, not a grade, not a reserve attestation, not a certificate",
    states: { ESCROW_PARITY_READ: "both reads succeeded at the pinned blocks; a read, not a measurement (the card doctrine reserves MEASURED for graded banks and refuses it on point-in-time cards)", UNCHECKABLE_NATIVE_ISSUANCE: "natively issued on the destination chain; no escrow exists; supply read, no ratio claimed", INDEXED_CUSTODIAL: "reserve held by a custodian off-chain or on another ledger; supply read; no reserve readable from here; no ratio claimed", UNMEASURED: "a read failed; error recorded; nothing inferred" },
    terms_boundary: "Public RPC endpoints, no API key. Endpoint substitutions are recorded per read.",
    correction_link: "https://github.com/CSOAI-ORG/councilof-ai/issues",
    license: "CC-BY-4.0 (Council of AI, CSOAI Ltd 16939677, councilof.ai)",
    pins,
    counts,
    records,
    profile_rule: PROFILE_RULE,
    documentary: { class: "DOCUMENTARY", definition: DOCUMENTARY_DEFINITION, counts: { DOCUMENTARY: DOCUMENTARY.length }, rows: DOCUMENTARY },
  };
}


/**
 * Stage one unsigned card-v0 atom per record for the board signer (scripts/adapters/
 * staged_leaves.py → public-root.yml). The adapter admits only PROBED / DISCOVERED / UNMEASURED,
 * so the read state lives in payload.parity_state and `state` says what happened: a public RPC
 * was probed (PROBED) or a read failed (UNMEASURED). Nothing here signs; the atom carries
 * sha256(canonical payload) and sig_ed25519:null, and the adapter refuses anything else.
 */
export async function stageAtoms(doc, dir) {
  const { mkdirSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");
  mkdirSync(dir, { recursive: true });
  const out = [];
  for (const r of doc.records) {
    const payload = {
      kind: "csoai.wrapper.parity/0.1",
      attests: doc.attests,
      id: r.id,
      backing_model: r.backing_model,
      wrapped: { chain: r.wrapped.chain, symbol: r.wrapped.symbol, address: r.wrapped.address, chainId: r.wrapped.chainId, block: r.wrapped.block?.number ?? null, block_hash: r.wrapped.block?.hash ?? null, block_time: r.wrapped.block?.timestamp ?? null },
      canonical: { chain: r.canonical.chain, symbol: r.canonical.symbol, address: r.canonical.address, chainId: r.canonical.chainId, block: r.canonical.block?.number ?? null, block_hash: r.canonical.block?.hash ?? null },
      escrow: r.escrow, escrow_name: r.escrow_name, note: r.note,
      reads: r.reads,
      escrow_over_wrapped: r.escrow_over_wrapped ?? null,
      parity_state: r.state,
      state: r.state === "UNMEASURED" ? "UNMEASURED" : r.state === "INDEXED_CUSTODIAL" ? "DISCOVERED" : "PROBED",
      error: r.error ?? null,
      fetched_at: doc.as_of,
      reader_revision: doc.reader_revision,
      unmeasured: r.state === "UNCHECKABLE_NATIVE_ISSUANCE" ? ["escrow_balance (natively issued; no escrow exists)"] : r.state === "INDEXED_CUSTODIAL" ? ["reserve (custodian-held off this chain; not readable here)"] : r.state === "UNMEASURED" ? ["chain reads (rpc failed; nothing inferred)"] : [],
    };
    const raw = canonicalBytes(payload);
    const card = {
      schema: "https://councilof.ai/schema/card-v0.json",
      surface: "public.notice",
      subject: `wrapped ${r.wrapped.symbol} on ${r.wrapped.chain} vs ${r.escrow_name || "native issuance"} — ${r.state}`,
      as_of: doc.as_of,
      source_urls: [r.wrapped.endpoint, r.canonical?.endpoint].filter((u, i, a) => u && u.startsWith("https://") && a.indexOf(u) === i),
      payload,
      tags: ["eater:wrapper-parity", "axis:distribution-integrity", `backing:${r.backing_model}`, `state:${r.state}`],
      unmeasured: payload.unmeasured,
      did_intended: "did:web:csoai.org#board-attestation-1",
      sha256: sha256(raw),
      sig_ed25519: null,
    };
    const bytes = canonicalBytes(card);
    if (bytes.length > 3072) { out.push({ id: r.id, staged: false, reason: `card ${bytes.length}B > 3072B` }); continue; }
    const fn = join(dir, `card-${r.id.replace(/[^a-z0-9]+/g, "-")}-unsigned.json`);
    writeFileSync(fn, JSON.stringify(card, null, 2) + "\n");
    out.push({ id: r.id, staged: true, file: fn, bytes: bytes.length });
  }
  return out;
}

/** Canonical bytes exactly as scripts/adapters/staged_leaves.py computes them: sorted keys, no spaces. */
export function canonicalBytes(obj) {
  const sortKeys = (v) => Array.isArray(v) ? v.map(sortKeys) : (v && typeof v === "object") ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])])) : v;
  return Buffer.from(JSON.stringify(sortKeys(obj)), "utf8");
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
  const doc = await readAll();
  const text = JSON.stringify(doc, null, 2);
  if (out) {
    writeFileSync(out, text); console.error(`wrote ${out}`);
    // A dated file is the record; `-latest.json` beside it is what live readers (the coverage
    // board) point at, so the dated name never has to be edited into a surface by hand.
    if (/-\d{4}-\d{2}-\d{2}\.json$/.test(out)) { const latest = out.replace(/-\d{4}-\d{2}-\d{2}\.json$/, "-latest.json"); writeFileSync(latest, text); console.error(`wrote ${latest}`); }
  }
  if (process.argv.includes("--stage")) {
    const res = await stageAtoms(doc, process.argv[process.argv.indexOf("--stage") + 1]);
    for (const r of res) console.error(`  stage ${r.id.padEnd(18)} ${r.staged ? `${r.bytes}B → ${r.file}` : `SKIPPED ${r.reason}`}`);
  }
  if (process.argv.includes("--json") || !out) console.log(text);
  else for (const r of doc.records) console.error(`${r.id.padEnd(18)} ${r.state.padEnd(28)} wrapped=${r.reads?.wrapped_total_supply?.normalized ?? "-"} escrow=${r.reads?.escrow_balance?.normalized ?? "-"} ratio=${r.escrow_over_wrapped ?? "-"}`);
}
