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
 *   MEASURED_ESCROW_PARITY      both reads succeeded; ratio is what the chain said
 *   UNCHECKABLE_NATIVE_ISSUANCE the token is natively issued on the destination chain
 *                               (no escrow backs it); the wrapped supply is read, the ratio
 *                               is NOT computed — a native issuance is not "unbacked"
 *   UNMEASURED                  a read failed; the error is recorded, nothing is inferred
 *
 * Not a rate, not a grade, not a reserve attestation, not a certificate. The escrow
 * addresses are the bridges' own published contracts; a reader can verify each one.
 *
 * Usage: node scripts/readers/wrapped-asset-parity-reader.mjs [--json] [--out <file>]
 * Env:   EVM_RPC_<CHAIN> overrides a default endpoint (recorded, never silent), same as
 *        evm-erc20-reader.mjs. eth.llamarpc.com answered HTTP 525 on 2026-09-13, so the
 *        Ethereum default here is publicnode.
 */

import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { normalizeAtomicAmount, rpcCall } from "./evm-erc20-reader.mjs";

export const SCHEMA = "csoai.wrapped-asset-parity/0.1";
export const READER_REVISION = "scripts/readers/wrapped-asset-parity-reader.mjs@0.1.0";

export const CHAINS = {
  ethereum: { rpc: "https://ethereum-rpc.publicnode.com", chainId: 1 },
  base: { rpc: "https://mainnet.base.org", chainId: 8453 },
  optimism: { rpc: "https://mainnet.optimism.io", chainId: 10 },
  arbitrum: { rpc: "https://arb1.arbitrum.io/rpc", chainId: 42161 },
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
};

/**
 * backing_model:
 *   "escrow"  the wrapped supply is minted against tokens locked in a named L1 escrow
 *   "native"  the issuer mints natively on the destination chain (Circle CCTP / Tether native);
 *             an escrow read would be meaningless, so none is attempted
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
  for (let attempt = 0; attempt < 2; attempt++) {
    try { raw = await rpcCall(rpc, "eth_call", [{ to, data }, blockHex]); break; }
    catch (e) { if (attempt === 1 || !/rate limit|429/i.test(String(e))) throw e; await new Promise((r) => setTimeout(r, 1500)); }
  }
  if (!raw || raw === "0x") throw new Error(`empty eth_call result from ${to}`);
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
  const c = endpoint(entry.canonical.chain);
  const rec = {
    id: entry.id,
    wrapped: { ...entry.wrapped, chainId: w.chainId, endpoint: w.used, endpoint_substituted: w.substituted, block: pins[entry.wrapped.chain] },
    canonical: { ...entry.canonical, chainId: c.chainId, endpoint: c.used, endpoint_substituted: c.substituted, block: pins[entry.canonical.chain] },
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
      rec.state = "MEASURED_ESCROW_PARITY";
    } else {
      rec.escrow_over_wrapped = null;
      rec.state = "UNCHECKABLE_NATIVE_ISSUANCE";
    }
  } catch (e) {
    rec.error = String((e && e.message) || e);
    rec.state = "UNMEASURED";
  }
  return rec;
}

export async function readAll(roster = ROSTER) {
  const chains = [...new Set(roster.flatMap((r) => [r.wrapped.chain, r.canonical.chain]))];
  const pins = {};
  for (const ch of chains) {
    try { pins[ch] = await pinBlock(endpoint(ch).used); }
    catch (e) { pins[ch] = { error: String((e && e.message) || e) }; }
  }
  const records = [];
  for (const entry of roster) {
    if (pins[entry.wrapped.chain]?.error || pins[entry.canonical.chain]?.error) {
      records.push({ id: entry.id, backing_model: entry.backing_model, state: "UNMEASURED", error: "block pin failed", wrapped: entry.wrapped, canonical: entry.canonical });
      continue;
    }
    records.push(await readPair(entry, pins));
  }
  const counts = {};
  for (const r of records) counts[r.state] = (counts[r.state] || 0) + 1;
  return {
    schema: SCHEMA,
    reader_revision: READER_REVISION,
    as_of: new Date().toISOString(),
    attests: "point-in-time reads of wrapped totalSupply and origin-chain escrow balance at the pinned blocks named in each record; a ratio, not a rate, not a grade, not a reserve attestation, not a certificate",
    states: { MEASURED_ESCROW_PARITY: "both reads succeeded at the pinned blocks", UNCHECKABLE_NATIVE_ISSUANCE: "natively issued on the destination chain; no escrow exists; supply read, no ratio claimed", UNMEASURED: "a read failed; error recorded; nothing inferred" },
    terms_boundary: "Public RPC endpoints, no API key. Endpoint substitutions are recorded per read.",
    correction_link: "https://github.com/CSOAI-ORG/councilof-ai/issues",
    license: "CC-BY-4.0 (Council of AI, CSOAI Ltd 16939677, councilof.ai)",
    pins,
    counts,
    records,
  };
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop());
if (isMain) {
  const out = process.argv.includes("--out") ? process.argv[process.argv.indexOf("--out") + 1] : null;
  const doc = await readAll();
  const text = JSON.stringify(doc, null, 2);
  if (out) { writeFileSync(out, text); console.error(`wrote ${out}`); }
  if (process.argv.includes("--json") || !out) console.log(text);
  else for (const r of doc.records) console.error(`${r.id.padEnd(18)} ${r.state.padEnd(28)} wrapped=${r.reads?.wrapped_total_supply?.normalized ?? "-"} escrow=${r.reads?.escrow_balance?.normalized ?? "-"} ratio=${r.escrow_over_wrapped ?? "-"}`);
}
