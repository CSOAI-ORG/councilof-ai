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
export const READER_REVISION = "scripts/readers/wrapped-asset-parity-reader.mjs@0.1.0";

export const CHAINS = {
  ethereum: { rpc: "https://ethereum-rpc.publicnode.com", chainId: 1 },
  base: { rpc: "https://mainnet.base.org", chainId: 8453 },
  optimism: { rpc: "https://mainnet.optimism.io", chainId: 10 },
  arbitrum: { rpc: "https://arb1.arbitrum.io/rpc", chainId: 42161 },
  // polygon-rpc.com answers 401 without a key since 2026-09; publicnode is keyless.
  polygon: { rpc: "https://polygon-bor-rpc.publicnode.com", chainId: 137 },
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
