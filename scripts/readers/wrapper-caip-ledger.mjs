#!/usr/bin/env node
/**
 * Wrapped-asset ledger keyed by CAIP-19 — candidate batch generator (2026-09-28).
 *
 * For each wrapper pair (canonical asset -> bridged, wrapped or re-issued deployment) it:
 *   1. maps both sides to CAIP-2 chain ids and CAIP-19 asset ids (functions/api/wrapper/_caip2.json);
 *   2. pins ONE finalized block per chain: the first operator in functions/api/_evm_rpcs.json that
 *      reports a `finalized` block, confirmed by a DIFFERENT operator (registrable domain) returning
 *      the same hash at that height — no `latest` fallback;
 *   3. reads every value (decimals, totalSupply, escrow balanceOf) at that block from TWO different
 *      operators and keeps it only when both return the same bytes;
 *   4. fetches the custodian / bridge disclosure page and keeps one verbatim quote plus its URL,
 *      HTTP status and the sha256 of the bytes served;
 *   5. records one state: CONSISTENT, INCONSISTENT, SINGLE_SURFACE, UNCHECKABLE or UNMEASURED.
 *
 * Pairs come from two places already read and published by this repo, never from a new list:
 *   - the wrapper roster in scripts/readers/wrapped-asset-parity-reader.mjs (imported, not copied);
 *   - public/archive/evm-<asset>-<chain>/ — the signed per-deployment archives — paired with the
 *     same asset's Ethereum deployment wherever both exist on a chain the RPC list covers.
 *
 * NOTHING HERE SIGNS OR PUBLISHES. Every record is written unsigned with sign_status SIGN_PENDING and
 * publication HELD: the five-state vocabulary is not a kind the existing signer path admits
 * (scripts/adapters/staged_leaves.py admits PROBED / DISCOVERED / UNMEASURED), and a new
 * determination that names an issuer needs the owner's OK before it is published.
 *
 * Not a rate, grade, score, ranking or certificate; not an attestation, audit or proof of reserve;
 * not legal evidence. It says nothing about reserve adequacy or solvency: it compares two public
 * ledger numbers under the mechanism the operator itself describes.
 *
 * Usage: node scripts/readers/wrapper-caip-ledger.mjs --stage <dir> [--archive-map <file>] [--only <id,id>]
 *        node scripts/readers/wrapper-caip-ledger.mjs --archive-map <file>   (no network; index data only)
 */

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROSTER, CHAINS, operatorOf, ratioString } from "./wrapped-asset-parity-reader.mjs";
import { normalizeAtomicAmount } from "./evm-erc20-reader.mjs";

export const SCHEMA = "csoai.wrapper-caip19-ledger/0.1";
export const RECORD_KIND = "csoai.wrapper.caip19-candidate/0.1";
export const GENERATOR = "scripts/readers/wrapper-caip-ledger.mjs@0.1.0";
export const FINALITY = "RPC_FINALIZED_TAG_HASH_MATCHED_BY_SECOND_OPERATOR_NOT_INDEPENDENTLY_PROVEN_FINAL";
export const CAIP = JSON.parse(readFileSync(new URL("../../functions/api/wrapper/_caip2.json", import.meta.url), "utf8"));
const ARCHIVE_DIR = new URL("../../public/archive/", import.meta.url);

export const STATES = {
  CONSISTENT:
    "Both surfaces are on public chains and were read at pinned finalized blocks, each value returned byte-identical by two operators; the relation the quoted disclosure describes holds (escrowed canonical balance >= deployed supply, compared at equal decimals). A comparison of two ledger numbers, not a finding about reserves, solvency or safety.",
  INCONSISTENT:
    "Same reads; the relation the quoted disclosure describes does not hold at the two pinned blocks. The record quotes both sides: the disclosure, and the two values with their blocks and operators. Blocks on two chains are never simultaneous; a finding to publish, not a verdict.",
  SINGLE_SURFACE:
    "Only the deployment is on a chain read here; its counterpart (custodied BTC/XRP, a fund register, bank deposits) is not. The supply is read by two operators; no relation is evaluated.",
  UNCHECKABLE:
    "Both sides may be on public chains, but no per-pair relation exists to check (native burn-and-mint issuance, one adapter shared by many chains, per-chain issuance of the same fund), or the disclosure that would name the relation could not be quoted. Supplies read; no ratio claimed.",
  UNMEASURED:
    "No block could be pinned, two operators disagreed, or a read failed. The error is recorded; nothing is inferred.",
};

export const NOT = [
  "not a rate, grade, score or ranking",
  "not a certificate, attestation, audit or proof of reserve",
  "not legal evidence and not a statutory verification",
  "no reserve adequacy, no solvency, no redemption or safety claim",
  "a listing is not an endorsement",
];

/** Disclosure sources, in the order tried; the first page that yields a verbatim match is quoted. */
const ARB_ERC20 = { url: "https://docs.arbitrum.io/build-decentralized-apps/token-bridging/token-bridge-erc20", re: "escrow", role: "bridge" };
const OP_STD = { url: "https://docs.optimism.io/app-developers/bridging/standard-bridge", re: "locked into the Standard Bridge", role: "bridge" };
const BASE_CONTRACTS = { url: "https://docs.base.org/base-chain/network-information/base-contracts", re: "L1StandardBridge 0x3154Cf16ccdb4C6d922629664174b904d80F2C35", role: "bridge_contracts", window: true };
const POLY_POS = { url: "https://docs.polygon.technology/pos/how-to/bridging/", re: "are locked and the same number of tokens are minted", role: "bridge" };
const MAKER_OP = { url: "https://raw.githubusercontent.com/makerdao/optimism-dai-bridge/master/README.md", re: "escrow", role: "bridge" };
const ZKSYNC = [
  { url: "https://docs.zksync.io/zksync-protocol/era-vm/contracts/bridging", re: "lock|escrow", role: "bridge" },
  { url: "https://docs.zksync.io/zksync-era/unique-features/bridging", re: "lock|escrow", role: "bridge" },
];
const CIRCLE_BRIDGED = { url: "https://www.circle.com/bridged-usdc", re: "locked in the bridge smart contract", role: "issuer" };
const CCTP = { url: "https://developers.circle.com/cctp", re: "burn-and-mint", role: "issuer" };
const USDT0 = { url: "https://docs.usdt0.to/technical-documentation/developer", re: "instructs the USDT0 Adapter to unlock tokens on Ethereum", role: "issuer", window: true };
const TETHER = { url: "https://tether.to/en/supported-protocols", re: "\\bPolygon\\b", role: "issuer", cs: true };
const COINBASE_WRAPPED = (slug) => ({ url: `https://www.coinbase.com/${slug}`, re: "backed 1:1 and held in custody", role: "custodian" });
const BUIDL_MULTI = { url: "https://www.prnewswire.com/news-releases/blackrock-launches-new-buidl-share-classes-across-multiple-blockchains-to-expand-access-and-potential-of-buidl-ecosystem-302304035.html", re: "new share classes on", role: "issuer" };

export const DISCLOSURES = {
  "usdc.e:arbitrum": [ARB_ERC20, CIRCLE_BRIDGED],
  "usdt:arbitrum": [USDT0],
  "usdc.e:optimism": [OP_STD, CIRCLE_BRIDGED],
  "usdt:optimism": [OP_STD],
  "dai:optimism": [MAKER_OP],
  "usdbc:base": [BASE_CONTRACTS, OP_STD],
  "dai:base": [BASE_CONTRACTS, OP_STD],
  "usdc:base": [CCTP],
  "usdc:arbitrum": [CCTP],
  "usdc.e:polygon": [POLY_POS, CIRCLE_BRIDGED],
  "usdt:polygon": [TETHER],
  "dai:polygon": [POLY_POS],
  "wbtc:ethereum": [{ url: "https://wbtc.network/", re: "backed 1:1 by Bitcoin in secure custody", role: "custodian" }],
  "cbbtc:base": [COINBASE_WRAPPED("cbbtc")],
  "cbbtc:ethereum": [COINBASE_WRAPPED("cbbtc")],
  "wxrp:ethereum": [],
  "buidl:ethereum": [{ url: "https://securitize.io/learn/press/blackrock-launches-first-tokenized-fund-buidl-on-the-ethereum-network", re: "custodian|BNY", role: "issuer" }],
  "weth:arbitrum": [{ url: "https://docs.arbitrum.io/build-decentralized-apps/token-bridging/token-bridge-ether", re: "WETH|escrow|locked", role: "bridge" }],
  "usdc:zksync-era": ZKSYNC,
  "usdt0:optimism": [USDT0],
  "usdt0:arbitrum": [USDT0],
  "cbxrp:base": [COINBASE_WRAPPED("cbxrp")],
  "fxrp:flare": [{ url: "https://dev.flare.network/fxrp/overview", re: "backed by the FAssets system", role: "issuer" }],
  "jpmd:base": [{ url: "https://www.jpmorgan.com/payments/newsroom/jpm-coin-usd-deposit-token-institutional-clients", re: "bank-backed deposits", role: "issuer" }],
  // issuer_multichain pairs from public/archive/evm-*
  "buidl:arbitrum": [BUIDL_MULTI],
  "buidl:optimism": [BUIDL_MULTI],
  "buidl:polygon": [BUIDL_MULTI],
  "benji:arbitrum": [{ url: "https://digitalassets.franklintempleton.com/benji/", re: "Institutional Arbitrum An Ethereum layer 2", role: "issuer", window: true, cs: true }],
  "usdy:arbitrum": [{ url: "https://docs.ondo.finance/general-access-products/usdy", re: "\\bArbitrum\\b", role: "issuer", cs: true }],
  "bib01:arbitrum": [{ url: "https://backed.fi/", re: "\\bArbitrum\\b", role: "issuer", window: true, cs: true }],
  "bib01:base": [{ url: "https://backed.fi/", re: "\\bBase\\b", role: "issuer", window: true, cs: true }],
  "tbill:arbitrum": [{ url: "https://docs.openeden.com/", re: "\\bArbitrum\\b", role: "issuer", cs: true }],
  "mtbill:base": [{ url: "https://docs.midas.app/", re: "\\bBase\\b", role: "issuer", cs: true }],
  "ustbl:arbitrum": [{ url: "https://www.spiko.io/", re: "\\bArbitrum\\b", role: "issuer", window: true, cs: true }],
};

// ---------------------------------------------------------------- CAIP mapping (pure)

export function caip2Of(chain) {
  return CAIP.chains[chain]?.caip2 ?? null;
}

/** CAIP-19 of one roster side, or null with the reason. ERC-20 references are lower-cased. */
export function caip19Of(side) {
  const c = CAIP.chains[side.chain];
  if (!c) return { caip2: null, caip19: null, why_null: `chain "${side.chain}" has no CAIP-2 entry in functions/api/wrapper/_caip2.json` };
  if (!c.caip2) return { caip2: null, caip19: null, why_null: c.why_null };
  if (c.caip2.startsWith("eip155:") && /^0x[0-9a-fA-F]{40}$/.test(side.address || ""))
    return { caip2: c.caip2, caip19: `${c.caip2}/erc20:${side.address.toLowerCase()}` };
  if (c.native && side.symbol === c.native_symbol) return { caip2: c.caip2, caip19: `${c.caip2}/${c.native}` };
  return { caip2: c.caip2, caip19: null, why_null: `"${side.address}" is not a token contract on ${side.chain}` };
}

// ---------------------------------------------------------------- pairs

/** Deployment pairs from the signed per-deployment archives: <asset>-<chain> paired with <asset>-ethereum. */
export function archivePairs() {
  const dirs = readdirSync(ARCHIVE_DIR).filter((d) => /^evm-[a-z0-9]+-[a-z0-9-]+$/.test(d) && !d.startsWith("evm-events"));
  const latest = (dir) => {
    const files = readdirSync(new URL(`${dir}/`, ARCHIVE_DIR)).filter((f) => f.endsWith(".jsonl")).sort();
    if (!files.length) return null;
    const lines = readFileSync(new URL(`${dir}/${files.at(-1)}`, ARCHIVE_DIR), "utf8").trim().split("\n");
    return JSON.parse(lines.at(-1)).card.payload;
  };
  const byAsset = {};
  for (const d of dirs) {
    const m = d.match(/^evm-(.+)-(ethereum|arbitrum|optimism|base|polygon|zksync-era|flare|avalanche|bsc|mantle)$/);
    if (!m) continue;
    (byAsset[m[1]] ||= {})[m[2]] = d;
  }
  const out = [];
  for (const [asset, chains] of Object.entries(byAsset).sort()) {
    if (!chains.ethereum) continue;
    const eth = latest(chains.ethereum);
    for (const [chain, dir] of Object.entries(chains).sort()) {
      if (chain === "ethereum" || !CHAINS[chain] || !CAIP.chains[chain]) continue;
      const dep = latest(dir);
      if (!dep?.address || !eth?.address) continue;
      out.push({
        id: `${asset}:${chain}`,
        wrapped: { chain, symbol: dep.checked?.symbol ?? asset.toUpperCase(), address: dep.address },
        canonical: { chain: "ethereum", symbol: eth.checked?.symbol ?? asset.toUpperCase(), address: eth.address },
        backing_model: "issuer_multichain",
        escrow: null,
        escrow_name: null,
        note: `Per-chain deployment of ${dep.product ?? asset}; the issuer documents per-chain issuance, not a lock on Ethereum. Both supplies are read; no per-pair relation exists to check.`,
        source_records: [`/archive/${dir}/index.json`, `/archive/${chains.ethereum}/index.json`],
      });
    }
  }
  return out;
}

export function allPairs() {
  const roster = ROSTER.map((e) => ({ ...e, source_records: [`/interop/wrapped-asset-parity-latest.json#${e.id}`] }));
  const seen = new Set(roster.map((e) => e.id));
  return [...roster, ...archivePairs().filter((p) => !seen.has(p.id))];
}

// ---------------------------------------------------------------- state (pure)

/** Compare two atomic amounts at equal decimals. Returns -1 / 0 / 1. */
export function cmpScaled(a, aDec, b, bDec) {
  const d = Math.max(aDec, bDec);
  const A = BigInt(a) * 10n ** BigInt(d - aDec);
  const B = BigInt(b) * 10n ** BigInt(d - bDec);
  return A === B ? 0 : A > B ? 1 : -1;
}

export function deriveState(rec) {
  if (rec.error) return { state: "UNMEASURED", reason: rec.error };
  // The relation checked for an escrow pair is the one the BRIDGE documents, so a bridge-side quote is required.
  const quoted = (rec.disclosures || []).some((d) => d.state === "QUOTED" && String(d.role || "").startsWith("bridge"));
  const r = rec.reads;
  if (rec.backing_model === "escrow") {
    if (!r.escrow_balance || !r.wrapped_total_supply) return { state: "UNMEASURED", reason: "escrow or supply read missing" };
    if (!quoted) return { state: "UNCHECKABLE", reason: "no bridge disclosure of the lock-and-mint relation could be quoted this run; the relation is not evaluated" };
    const c = cmpScaled(r.escrow_balance.atomic, r.escrow_balance.decimals, r.wrapped_total_supply.atomic, r.wrapped_total_supply.decimals);
    return c >= 0
      ? { state: "CONSISTENT", reason: "escrowed canonical balance >= deployed supply at the two pinned blocks" }
      : { state: "INCONSISTENT", reason: "escrowed canonical balance < deployed supply at the two pinned blocks" };
  }
  if (!r.wrapped_total_supply) return { state: "UNMEASURED", reason: "supply read missing" };
  if (rec.backing_model === "custodial") return { state: "SINGLE_SURFACE", reason: "the counterpart is held off the chains read here; supply only" };
  if (rec.backing_model === "native") return { state: "UNCHECKABLE", reason: "native issuance on the deployment chain (burn-and-mint or a shared adapter); no per-pair escrow exists" };
  if (rec.backing_model === "issuer_multichain") return { state: "UNCHECKABLE", reason: "per-chain issuance of one fund; the chains are linked by the issuer's register, not by a lock" };
  return { state: "UNMEASURED", reason: `unknown mechanism "${rec.backing_model}"` };
}

// ---------------------------------------------------------------- network

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad32 = (addr) => addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const SEL = { decimals: "0x313ce567", totalSupply: "0x18160ddd", balanceOf: "0x70a08231" };
const UA = "csoai-wrapper-caip-ledger/0.1 (+https://councilof.ai)";

async function rpc(url, method, params) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      if (j.error) throw new Error(`RPC error: ${j.error.message}`);
      if (j.result === undefined || j.result === null) throw new Error("RPC empty result");
      return j.result;
    } catch (e) {
      if (attempt === 0 && /429|rate/i.test(String(e))) { await sleep(2000); continue; }
      throw e;
    }
  }
}

async function pinChain(chain) {
  const rpcs = CHAINS[chain].rpcs;
  const tried = [];
  let first = null;
  for (const url of rpcs) {
    try {
      const b = await rpc(url, "eth_getBlockByNumber", ["finalized", false]);
      if (!b?.number || !b?.hash) throw new Error("finalized block without number/hash");
      first = { b, url }; break;
    } catch (e) { tried.push(`${operatorOf(url)}: ${e.message || e}`); }
  }
  if (!first) throw new Error(`no operator reported a finalized block (${tried.join("; ")})`);
  const op1 = operatorOf(first.url);
  for (const url of rpcs) {
    if (operatorOf(url) === op1) continue;
    let b2;
    try { b2 = await rpc(url, "eth_getBlockByNumber", [first.b.number, false]); }
    catch (e) { tried.push(`${operatorOf(url)} (hash check): ${e.message || e}`); continue; }
    if (!b2?.hash) continue;
    if (b2.hash.toLowerCase() !== first.b.hash.toLowerCase())
      throw new Error(`block-hash disagreement at ${parseInt(first.b.number, 16)}: ${op1} ${first.b.hash}, ${operatorOf(url)} ${b2.hash}`);
    return { chain, caip2: caip2Of(chain), number: parseInt(first.b.number, 16), hex: first.b.number, hash: first.b.hash, timestamp: parseInt(first.b.timestamp, 16), finality: FINALITY, hash_operators: [op1, operatorOf(url)] };
  }
  throw new Error(`no second operator confirmed the finalized hash (${tried.join("; ")})`);
}

/** One eth_call at the pinned block, answered byte-identically by two different operators. */
async function dualCall(chain, pin, to, data) {
  const answers = [];
  const tried = [];
  for (const url of CHAINS[chain].rpcs) {
    const op = operatorOf(url);
    if (answers.some((a) => a.operator === op)) continue;
    let raw;
    for (const tag of [pin.hex, { blockHash: pin.hash }]) {
      try { raw = await rpc(url, "eth_call", [{ to, data }, tag]); break; }
      catch (e) { tried.push(`${op}${typeof tag === "object" ? " (by hash)" : ""}: ${e.message || e}`); }
    }
    await sleep(200);
    if (raw === undefined) continue;
    if (raw === "0x") { tried.push(`${op}: empty eth_call result`); continue; }
    answers.push({ operator: op, raw });
    if (answers.length === 2) break;
  }
  if (answers.length < 2) throw new Error(`fewer than two operators answered eth_call ${data.slice(0, 10)} to ${to} at ${pin.number} (${tried.join("; ")})`);
  if (answers[0].raw.toLowerCase() !== answers[1].raw.toLowerCase())
    throw new Error(`operator disagreement on ${data.slice(0, 10)} to ${to} at ${pin.number}: ${answers[0].operator} ${answers[0].raw} vs ${answers[1].operator} ${answers[1].raw}`);
  return { value: BigInt(answers[0].raw), raw: answers[0].raw, raw_sha256: sha256(answers[0].raw), operators: answers.map((a) => a.operator) };
}

async function readAmount(chain, pin, token, data, query) {
  const dec = await dualCall(chain, pin, token, SEL.decimals);
  const v = await dualCall(chain, pin, token, data);
  const decimals = Number(dec.value);
  return { query, chain, block: pin.number, token, atomic: v.value.toString(), normalized: normalizeAtomicAmount(v.value.toString(), decimals), decimals, raw_sha256: v.raw_sha256, operators: v.operators, decimals_operators: dec.operators };
}

// ---------------------------------------------------------------- disclosures

const decode = (s) =>
  s.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&rsquo;/g, "’").replace(/&lsquo;/g, "‘").replace(/&ldquo;/g, "“").replace(/&rdquo;/g, "”")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
export const TEXT_NORMALIZATION = "script/style/noscript removed, HTML tags replaced by a space, entities decoded, whitespace runs collapsed to one space; the quote is a substring of that text";
export function visibleText(html) {
  return decode(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<noscript[\s\S]*?<\/noscript>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

/** The first sentence (or, for table-like pages, a word-bounded window) containing the pattern. */
export function quoteFrom(text, re, window = false, caseSensitive = false) {
  const rx = new RegExp(re, caseSensitive ? "" : "i");
  if (!window) {
    const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/);
    const s = sentences.find((x) => rx.test(x) && x.length >= 30 && x.length <= 600);
    if (s) return s.trim();
  }
  const m = rx.exec(text);
  if (!m) return null;
  let a = Math.max(0, m.index - 140), b = Math.min(text.length, m.index + m[0].length + 140);
  while (a > 0 && text[a - 1] !== " ") a++;
  while (b < text.length && text[b] !== " ") b++;
  return text.slice(a, b).trim();
}

async function fetchDisclosure(src, retrievedAt) {
  const base = { url: src.url, role: src.role, pattern: src.re, retrieved_at: retrievedAt, text_normalization: TEXT_NORMALIZATION };
  try {
    const res = await fetch(src.url, { headers: { "User-Agent": UA }, redirect: "follow", signal: AbortSignal.timeout(15000) });
    const buf = Buffer.from(await res.arrayBuffer());
    const out = { ...base, http_status: res.status, final_url: res.url, bytes_sha256: sha256(buf), bytes: buf.length };
    if (!res.ok) return { ...out, state: "UNMEASURED", quote: null, reason: `HTTP ${res.status}; nothing quoted` };
    const text = visibleText(buf.toString("utf8"));
    const q = quoteFrom(text, src.re, !!src.window, !!src.cs);
    if (!q || !text.includes(q)) return { ...out, state: "UNMEASURED", quote: null, reason: "the pattern was not found in the served text (page may render client-side); nothing quoted" };
    return { ...out, state: "QUOTED", quote: q };
  } catch (e) {
    return { ...base, state: "UNMEASURED", quote: null, http_status: null, reason: `fetch failed: ${e.message || e}` };
  }
}

// ---------------------------------------------------------------- run

export async function run({ only = null } = {}) {
  const asOf = new Date().toISOString();
  let pairs = allPairs();
  if (only) pairs = pairs.filter((p) => only.includes(p.id));
  const chains = [...new Set(pairs.flatMap((p) => [p.wrapped.chain, p.canonical.chain]))].filter((c) => CHAINS[c]);
  const pins = {};
  for (const ch of chains) {
    try { pins[ch] = await pinChain(ch); } catch (e) { pins[ch] = { chain: ch, error: String(e.message || e) }; }
  }
  const pageCache = new Map();
  const records = [];
  for (const p of pairs) {
    const w = caip19Of(p.wrapped), c = caip19Of(p.canonical);
    const rec = {
      kind: RECORD_KIND,
      id: p.id,
      caip: { wrapped: w, canonical: c },
      wrapped: p.wrapped,
      canonical: p.canonical,
      backing_model: p.backing_model,
      escrow: p.escrow ?? null,
      escrow_name: p.escrow_name ?? null,
      note: p.note ?? null,
      blocks: { wrapped: pins[p.wrapped.chain] ?? null, canonical: CHAINS[p.canonical.chain] ? pins[p.canonical.chain] ?? null : null },
      reads: {},
      escrow_over_wrapped: null,
      disclosures: [],
      state: "UNMEASURED",
      state_reason: null,
      error: null,
      source_records: p.source_records,
    };
    // Disclosures first: a page is fetched once per run and reused across pairs.
    for (const src of DISCLOSURES[p.id] ?? []) {
      if (!pageCache.has(src.url + "|" + src.re)) pageCache.set(src.url + "|" + src.re, await fetchDisclosure(src, asOf));
      rec.disclosures.push(pageCache.get(src.url + "|" + src.re));
    }
    if (!(DISCLOSURES[p.id] ?? []).length)
      rec.disclosures.push({ state: "UNMEASURED", url: null, quote: null, reason: "no primary disclosure source for this contract is known to this ledger; nothing quoted" });
    try {
      const wp = pins[p.wrapped.chain];
      if (!wp || wp.error) throw new Error(`block pin failed on ${p.wrapped.chain}: ${wp?.error ?? "chain not in the RPC list"}`);
      rec.reads.wrapped_total_supply = await readAmount(p.wrapped.chain, wp, p.wrapped.address, SEL.totalSupply, "totalSupply()");
      if (p.backing_model === "escrow" || p.backing_model === "issuer_multichain") {
        const cp = pins[p.canonical.chain];
        if (!cp || cp.error) throw new Error(`block pin failed on ${p.canonical.chain}: ${cp?.error ?? "chain not in the RPC list"}`);
        if (p.backing_model === "escrow") {
          rec.reads.escrow_balance = await readAmount(p.canonical.chain, cp, p.canonical.address, SEL.balanceOf + pad32(p.escrow), `balanceOf(${p.escrow})`);
          const d = Math.max(rec.reads.escrow_balance.decimals, rec.reads.wrapped_total_supply.decimals);
          rec.escrow_over_wrapped = ratioString(
            BigInt(rec.reads.escrow_balance.atomic) * 10n ** BigInt(d - rec.reads.escrow_balance.decimals),
            BigInt(rec.reads.wrapped_total_supply.atomic) * 10n ** BigInt(d - rec.reads.wrapped_total_supply.decimals),
          );
        } else {
          rec.reads.canonical_total_supply = await readAmount(p.canonical.chain, cp, p.canonical.address, SEL.totalSupply, "totalSupply()");
        }
      }
    } catch (e) {
      rec.error = String(e.message || e);
    }
    const s = deriveState(rec);
    rec.state = s.state;
    rec.state_reason = s.reason;
    if (rec.state === "INCONSISTENT") {
      rec.inconsistent_quotes = {
        disclosure: rec.disclosures.filter((d) => d.state === "QUOTED").map((d) => ({ url: d.url, quote: d.quote })),
        reads: {
          escrow_balance: `${rec.reads.escrow_balance.normalized} ${p.canonical.symbol} in ${p.escrow} on ${p.canonical.chain} at block ${rec.reads.escrow_balance.block} (${rec.reads.escrow_balance.operators.join(" + ")})`,
          wrapped_total_supply: `${rec.reads.wrapped_total_supply.normalized} ${p.wrapped.symbol} on ${p.wrapped.chain} at block ${rec.reads.wrapped_total_supply.block} (${rec.reads.wrapped_total_supply.operators.join(" + ")})`,
        },
      };
    }
    rec.not = NOT;
    rec.sign_status = "SIGN_PENDING";
    rec.publication = "HELD";
    rec.held_reason =
      "Unsigned candidate. The five-state vocabulary is not a record kind the existing signer path admits (staged_leaves.py: PROBED / DISCOVERED / UNMEASURED), and a new determination naming an issuer is published only with the owner's OK.";
    rec.fetched_at = asOf;
    rec.generator = GENERATOR;
    rec.sha256 = sha256(canonical({ ...rec, sha256: undefined }));
    records.push(rec);
  }
  const counts = {};
  for (const r of records) counts[r.state] = (counts[r.state] || 0) + 1;
  const disclosure_counts = {};
  for (const r of records) {
    const k = r.disclosures.some((d) => d.state === "QUOTED") ? "QUOTED" : "UNMEASURED";
    disclosure_counts[k] = (disclosure_counts[k] || 0) + 1;
  }
  return {
    schema: SCHEMA,
    generator: GENERATOR,
    as_of: asOf,
    name: "SovX wrapped-asset measurements",
    sign_status: "SIGN_PENDING",
    publication: "HELD",
    states: STATES,
    not: NOT,
    method: "measurement/wrapper-caip19-ledger-method.md",
    rpc_list: "functions/api/_evm_rpcs.json",
    caip_map: "functions/api/wrapper/_caip2.json",
    pins,
    counts,
    disclosure_counts,
    n_pairs: records.length,
    records,
  };
}

/** Canonical JSON: sorted keys, no whitespace, undefined dropped. */
export function canonical(v) {
  if (v === undefined) return undefined;
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map((x) => canonical(x) ?? "null").join(",")}]`;
  return `{${Object.keys(v).sort().filter((k) => v[k] !== undefined).map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`).join(",")}}`;
}

/** Index data for the public lookup: archive deployments keyed by CAIP-19 (existing public records only). */
export function archiveMap() {
  const rows = [];
  for (const p of archivePairs()) {
    for (const [side, rec] of [["wrapped", p.wrapped], ["canonical", p.canonical]]) {
      const { caip2, caip19 } = caip19Of(rec);
      const archive = side === "wrapped" ? p.source_records[0] : p.source_records[1];
      if (!rows.some((r) => r.caip19 === caip19)) rows.push({ caip19, caip2, chain: rec.chain, symbol: rec.symbol, address: rec.address.toLowerCase(), archive });
    }
  }
  rows.sort((a, b) => a.caip19.localeCompare(b.caip19));
  return {
    schema: "csoai.wrapper-caip19-archive-map/0.1",
    rule: "Per-deployment archives already published under /archive/evm-<asset>-<chain>/, keyed by CAIP-19. Generated by scripts/readers/wrapper-caip-ledger.mjs --archive-map; an index row, not a determination.",
    rows,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
  const mapOut = arg("--archive-map");
  if (mapOut) { writeFileSync(mapOut, JSON.stringify(archiveMap(), null, 2) + "\n"); console.error(`archive map -> ${mapOut}`); }
  const stage = arg("--stage");
  if (stage) {
    const only = arg("--only")?.split(",") ?? null;
    const doc = await run({ only });
    mkdirSync(join(stage, "candidates"), { recursive: true });
    for (const r of doc.records) writeFileSync(join(stage, "candidates", `${r.id.replace(/[^a-z0-9.-]/gi, "_")}.json`), JSON.stringify(r, null, 2) + "\n");
    const day = doc.as_of.slice(0, 10);
    writeFileSync(join(stage, `batch-${day}.json`), JSON.stringify(doc, null, 2) + "\n");
    console.log(JSON.stringify({ n_pairs: doc.n_pairs, counts: doc.counts, disclosure_counts: doc.disclosure_counts, pins: Object.fromEntries(Object.entries(doc.pins).map(([k, v]) => [k, v.error ? `ERROR ${v.error.slice(0, 120)}` : `${v.number} ${v.hash_operators.join("+")}`])) }, null, 2));
  }
  if (!mapOut && !stage) { console.error("usage: --stage <dir> [--only a,b] | --archive-map <file>"); process.exit(2); }
}
