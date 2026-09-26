/**
 * GET /api/ras/supply?asset=USDC&ledger=ethereum — one fresh, signed read of an issuer-listed
 * token deployment's totalSupply(), labelled by the strength of the evidence behind it.
 *
 * The method is scripts/readers/cross_ledger_supply.py (lane cross-ledger-usdc-20260925, spec
 * measurement/cross-ledger-supply-spec.md), EVM rows only, ported to the Worker:
 *   - the deployment address is parsed from the ISSUER'S OWN PAGE (Circle "USDC contract
 *     addresses", the .md rendering), fetched on this request and sha256'd — never typed here
 *   - Ethereum: finalized block; symbol/name/decimals/totalSupply by eth_call at that block; the
 *     totalSupply slot found empirically (the one slot in 0..24 whose value equals totalSupply());
 *     eth_getProof on it; account + storage proof verified HERE against the header's stateRoot
 *     (functions/api/_evm_proof.ts); header hash recomputed; a second independent operator reads
 *     the same block. All true → STATE_PROOF_VERIFIED. Anything short → OPERATOR_API with the reason.
 *   - other EVM ledgers on the issuer list: one keyless RPC, eth_call only → OPERATOR_API, as the
 *     reader labels its extra EVM rows.
 *   - symbol() not the asset → REJECTED: a delivered finding, no supply recorded against the asset.
 *   - the issuer page or the RPC unreadable → not delivered, not settled (our read failed, not the chain).
 *
 * NOT a reserve attestation, not a proof of backing, redeemability or solvency, not a rate, not a
 * grade. The header is not checked against consensus. The free daily artifact the reader
 * publishes stays free; this door sells one fresh read and a signature over it.
 */
import { x402Accepts, declareBazaarHttpGet } from "../_x402";
import { canonicalBytes, sha256Hex } from "../../_lib/cardSign";
import { rasDoor, nowIso, sha256Text, type RasEnv, type RasComputation } from "../_ras_door";
import { verifyEip1186, headerHash, type Eip1186Proof } from "../_evm_proof";
import { RAS_SUPPLY_DESCRIPTION } from "../_x402_descriptions";

export const SCHEMA = "csoai.ras.supply/0.1";
export const KIND = "csoai.ras.supply-read/0.1";
export const ATTESTS = "one fresh read of a token deployment's totalSupply() at the block named, labelled by evidence strength — not a reserve attestation, not a proof of backing, not a rate, not a grade";
const UA = "csoai-ras-supply/0.1 (cross-ledger-supply method; +https://councilof.ai)";

/** Issuer lists the reader knows. The page is the only source of addresses. */
export const ISSUERS: Record<string, { page: string; md: string; symbol: string }> = {
  USDC: {
    page: "https://developers.circle.com/stablecoins/usdc-contract-addresses",
    md: "https://developers.circle.com/stablecoins/usdc-contract-addresses.md",
    symbol: "USDC",
  },
};

/** Circle row label → ledger id + keyless RPC. Ethereum = the reader's EP.eth; the rest = its EXTRA_EVM. */
export const EVM_LEDGERS: Record<string, { label: string; rpc: string; operator: string; proof: boolean }> = {
  ethereum: { label: "Ethereum", rpc: "https://eth.drpc.org", operator: "dRPC", proof: true },
  arbitrum: { label: "Arbitrum", rpc: "https://arb1.arbitrum.io/rpc", operator: "arb1.arbitrum.io", proof: false },
  avalanche: { label: "Avalanche C-Chain", rpc: "https://avalanche-c-chain-rpc.publicnode.com", operator: "avalanche-c-chain-rpc.publicnode.com", proof: false },
  base: { label: "Base", rpc: "https://mainnet.base.org", operator: "mainnet.base.org", proof: false },
  celo: { label: "Celo", rpc: "https://forno.celo.org", operator: "forno.celo.org", proof: false },
  hyperevm: { label: "HyperEVM", rpc: "https://rpc.hyperliquid.xyz/evm", operator: "rpc.hyperliquid.xyz", proof: false },
  linea: { label: "Linea", rpc: "https://rpc.linea.build", operator: "rpc.linea.build", proof: false },
  optimism: { label: "OP Mainnet", rpc: "https://mainnet.optimism.io", operator: "mainnet.optimism.io", proof: false },
  polygon: { label: "Polygon PoS", rpc: "https://polygon-bor-rpc.publicnode.com", operator: "polygon-bor-rpc.publicnode.com", proof: false },
  sonic: { label: "Sonic", rpc: "https://rpc.soniclabs.com", operator: "rpc.soniclabs.com", proof: false },
  unichain: { label: "Unichain", rpc: "https://mainnet.unichain.org", operator: "mainnet.unichain.org", proof: false },
  zksync: { label: "ZKsync Era", rpc: "https://mainnet.era.zksync.io", operator: "mainnet.era.zksync.io", proof: false },
};
/** The reader's EP.eth2: independent second operators for the Ethereum block. */
export const ETH_SECOND = [
  { rpc: "https://rpc.mevblocker.io", operator: "MEV Blocker" },
  { rpc: "https://eth-mainnet.public.blastapi.io", operator: "Blast API" },
  { rpc: "https://ethereum-rpc.publicnode.com", operator: "PublicNode (Allnodes)" },
];
const SEL = { name: "0x06fdde03", symbol: "0x95d89b41", decimals: "0x313ce567", totalSupply: "0x18160ddd" };
const MAX_SLOT = 24;

class ReadError extends Error { name = "ReadError"; }

// The reader's ROW_RE, verbatim: | <label> | [`<identifier>`](<explorer>) |
const ROW_RE = /^\|\s*([^|]+?)\s*\|\s*\[?`([^`]+)`\]?(?:\(([^)]*)\))?\s*\|\s*$/;

export function parseIssuerMd(md: string): Record<string, { identifier: string; explorer_url: string | null }> {
  let sec = md.includes("## Mainnet") ? md.split("## Mainnet").slice(1).join("## Mainnet") : "";
  sec = sec.split("## Testnet")[0];
  const rows: Record<string, { identifier: string; explorer_url: string | null }> = {};
  for (const line of sec.split(/\r?\n/)) {
    const m = line.trim().match(ROW_RE);
    if (m && m[1] !== "Blockchain" && !m[1].startsWith(":")) rows[m[1]] = { identifier: m[2], explorer_url: m[3] ?? null };
  }
  return rows;
}

async function rpc(url: string, method: string, params: unknown[]): Promise<{ result: any; sha256: string }> {
  let r: Response;
  try {
    r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "user-agent": UA }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(15000) });
  } catch (e) {
    throw new ReadError(`${new URL(url).host} ${method}: ${(e as Error).name}`);
  }
  const text = await r.text();
  if (!r.ok) throw new ReadError(`${new URL(url).host} ${method}: HTTP ${r.status}`);
  let j: any;
  try { j = JSON.parse(text); } catch { throw new ReadError(`${new URL(url).host} ${method}: not JSON`); }
  if (j?.error) throw new ReadError(`${new URL(url).host} ${method}: RPC error ${String(j.error?.message || JSON.stringify(j.error)).slice(0, 120)}`);
  if (j?.result === undefined || j?.result === null) throw new ReadError(`${new URL(url).host} ${method}: empty result`);
  return { result: j.result, sha256: await sha256Text(text) };
}

/** eth_getStorageAt over slots 0..MAX_SLOT: one batch request, sequential fallback when the operator refuses batches. */
async function storageSlots(url: string, addr: string, block: string): Promise<(bigint | null)[]> {
  const calls = Array.from({ length: MAX_SLOT + 1 }, (_, s) => ({ jsonrpc: "2.0", id: s, method: "eth_getStorageAt", params: [addr, "0x" + s.toString(16), block] }));
  try {
    const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "user-agent": UA }, body: JSON.stringify(calls), signal: AbortSignal.timeout(15000) });
    const j = (await r.json()) as { id: number; result?: string }[];
    if (Array.isArray(j) && j.length === calls.length && j.every((x) => typeof x.result === "string")) {
      const out: (bigint | null)[] = Array(calls.length).fill(null);
      for (const x of j) out[x.id] = BigInt(x.result as string);
      return out;
    }
  } catch { /* fall through to sequential */ }
  const out: (bigint | null)[] = [];
  for (let s = 0; s <= MAX_SLOT; s++) out.push(BigInt((await rpc(url, "eth_getStorageAt", [addr, "0x" + s.toString(16), block])).result));
  return out;
}

function abiStr(hx: string): string {
  const s = hx && hx !== "0x" ? hx.replace(/^0x/, "") : "";
  const b = new Uint8Array(s.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(s.slice(2 * i, 2 * i + 2), 16);
  if (b.length < 64) return new TextDecoder().decode(b).replace(/\0+$/, "").trim();
  const n = Number(BigInt("0x" + s.slice(64, 128)));
  return new TextDecoder().decode(b.subarray(64, 64 + n)).trim();
}

export function decStr(base: bigint, decimals: number): string {
  const d = 10n ** BigInt(decimals);
  return decimals === 0 ? base.toString() : `${base / d}.${(base % d).toString().padStart(decimals, "0")}`;
}

export async function readIssuer(asset: string): Promise<{ state: "READ"; md_sha256: string; rows: ReturnType<typeof parseIssuerMd>; fetched_at: string } | { state: "UNCHECKABLE"; error: string }> {
  const iss = ISSUERS[asset];
  try {
    const r = await fetch(iss.md, { headers: { accept: "text/markdown", "user-agent": UA }, signal: AbortSignal.timeout(15000) });
    if (!r.ok) return { state: "UNCHECKABLE", error: `issuer page HTTP ${r.status}` };
    const bytes = new Uint8Array(await r.arrayBuffer());
    const rows = parseIssuerMd(new TextDecoder().decode(bytes));
    if (!Object.keys(rows).length) return { state: "UNCHECKABLE", error: "issuer page carried no Mainnet table rows" };
    return { state: "READ", md_sha256: await sha256Hex(bytes), rows, fetched_at: nowIso() };
  } catch (e) {
    return { state: "UNCHECKABLE", error: `issuer page ${(e as Error).name}` };
  }
}

/** The read itself. Exported for the live test; the door wraps it. */
export async function readSupply(asset: string, ledger: string): Promise<RasComputation> {
  const iss = ISSUERS[asset];
  const led = EVM_LEDGERS[ledger];
  const issuer = await readIssuer(asset);
  if (issuer.state !== "READ") return { delivered: false, error: "issuer_list_unreadable", reason: issuer.error };
  const row = issuer.rows[led.label];
  if (!row) return { delivered: false, status: 404, error: "not_on_issuer_list", reason: `${iss.page} (read now, md sha256 ${issuer.md_sha256}) lists no Mainnet row "${led.label}"`, detail: { issuer_rows: Object.keys(issuer.rows) } };
  const addr = row.identifier;
  if (!/^0x[0-9a-fA-F]{40}$/.test(addr)) return { delivered: false, status: 404, error: "not_an_evm_address", reason: `issuer row "${led.label}" identifier is not an EVM address` };

  const fetched_at = nowIso();
  const notes: string[] = [];
  const unmeasured: string[] = [];
  const target = { asset, ledger, label: led.label, address: addr, issuer_page: iss.page, issuer_md: iss.md };
  const payload: Record<string, unknown> = {
    kind: KIND,
    attests: ATTESTS,
    target,
    issuer_list: { md_sha256: issuer.md_sha256, fetched_at: issuer.fetched_at, row_label: led.label },
    endpoint: led.rpc,
    operator: led.operator,
    fetched_at,
  };
  const source_urls = [iss.md, led.rpc];
  let evidence: Record<string, unknown> | undefined;
  try {
    let blk: any;
    let blockTag: string;
    if (led.proof) {
      blk = (await rpc(led.rpc, "eth_getBlockByNumber", ["finalized", false])).result;
      blockTag = blk.number;
      let recomputed: boolean | null = null;
      let headerErr: string | null = null;
      try { recomputed = headerHash(blk) === String(blk.hash).toLowerCase(); } catch (e) { recomputed = false; headerErr = String((e as Error).message).slice(0, 120); }
      payload.height = { kind: "block (finalized tag)", number: parseInt(blk.number, 16), hash: blk.hash, state_root: blk.stateRoot, timestamp: parseInt(blk.timestamp, 16), header_hash_recomputed: recomputed, ...(headerErr ? { header_hash_error: headerErr } : {}) };
    } else {
      blockTag = (await rpc(led.rpc, "eth_blockNumber", [])).result;
      blk = (await rpc(led.rpc, "eth_getBlockByNumber", [blockTag, false])).result;
      payload.height = { kind: "block (latest at read time, then pinned)", number: parseInt(blockTag, 16), hash: blk?.hash ?? null, timestamp: blk?.timestamp ? parseInt(blk.timestamp, 16) : null };
    }
    const ident: Record<string, unknown> = {};
    for (const k of led.proof ? (["symbol", "name", "decimals"] as const) : (["symbol", "decimals"] as const)) {
      const r = (await rpc(led.rpc, "eth_call", [{ to: addr, data: SEL[k] }, blockTag])).result as string;
      ident[k] = k === "decimals" ? Number(BigInt(r)) : abiStr(r);
    }
    payload.identity_sha256 = await sha256Text(JSON.stringify(ident));
    const ts = await rpc(led.rpc, "eth_call", [{ to: addr, data: SEL.totalSupply }, blockTag]);
    const supply = BigInt(ts.result);
    const decimals = Number(ident.decimals);
    payload.supply = { base_units: supply.toString(), decimals, decimal: decStr(supply, decimals), response_sha256: ts.sha256 };
    evidence = { identity: ident };
    if (ident.symbol !== iss.symbol) {
      payload.evidence_kind = "REJECTED";
      notes.push(`symbol() returned a value other than '${iss.symbol}'; no supply is recorded against ${asset}`);
      payload.supply = null;
      unmeasured.push("supply (identity rejected)");
    } else if (!led.proof) {
      payload.evidence_kind = "OPERATOR_API";
      payload.two_operators_agree = "NOT_TRIED";
      notes.push("EVM ledger outside the reader's proof core: one keyless RPC, eth_call only — one operator's answer, not a proof");
      unmeasured.push("state proof (not attempted on this ledger)");
    } else {
      payload.evidence_kind = "OPERATOR_API";
      const slots = await storageSlots(led.rpc, addr, blockTag);
      const cands = slots.map((v, i) => (v === supply ? i : -1)).filter((i) => i >= 0);
      payload.slot_search = { slots_scanned: `0..${MAX_SLOT}`, matching_slots: cands, method: "eth_getStorageAt at the pinned block, compared to eth_call totalSupply()" };
      if (cands.length !== 1) {
        notes.push(`slot search found ${cands.length} matching slots; no proof attempted → OPERATOR_API`);
        unmeasured.push("state proof (slot not uniquely identified)");
      } else {
        const slot = cands[0];
        const pr = await rpc(led.rpc, "eth_getProof", [addr, ["0x" + slot.toString(16)], blockTag]);
        const v = verifyEip1186(blk.stateRoot, addr, pr.result as Eip1186Proof, slot);
        const proofBlob = {
          kind: "csoai.eip1186-proof/0.1", address: addr, slot, block_number: parseInt(blk.number, 16), block_hash: blk.hash, state_root: blk.stateRoot, endpoint: led.rpc,
          how_to_check: "keccak(rlp(header fields)) must equal block_hash; walk accountProof from state_root along keccak(address); the account's storageRoot must equal storageHash; walk storageProof along keccak(uint256(slot)); the leaf is rlp(totalSupply).",
          response: pr.result,
        };
        payload.proof = {
          type: "EIP-1186 eth_getProof", slot, response_sha256: pr.sha256, proof_blob_sha256: await sha256Hex(canonicalBytes(proofBlob)),
          account_proof_verified: v.account_proof_verified, storage_proof_verified: v.storage_proof_verified,
          proven_value: v.proven_value, error: v.error, eth_call_value: supply.toString(), verified_in: "the Worker (functions/api/_evm_proof.ts)",
        };
        evidence = { ...evidence, proof: proofBlob };
        if (v.account_proof_verified && v.storage_proof_verified && v.proven_value === supply.toString()) {
          payload.evidence_kind = "STATE_PROOF_VERIFIED";
          notes.push(`slot ${slot} found empirically (only slot 0..${MAX_SLOT} equal to totalSupply()); account proof verified against stateRoot, storage proof against storageRoot, proven value == eth_call totalSupply()`);
        } else {
          notes.push(`proof did not verify or value differs from eth_call → OPERATOR_API; reason: ${v.error || "proven value != eth_call"}`);
          unmeasured.push("state proof (did not verify)");
        }
      }
      // Second operator: same block number — hash and totalSupply().
      const tried: Record<string, unknown>[] = [];
      let second: Record<string, unknown> | null = null;
      for (const op of ETH_SECOND) {
        try {
          const b2 = (await rpc(op.rpc, "eth_getBlockByNumber", [blockTag, false])).result;
          const t2 = await rpc(op.rpc, "eth_call", [{ to: addr, data: SEL.totalSupply }, blockTag]);
          const same = String(b2.hash).toLowerCase() === String(blk.hash).toLowerCase();
          second = { endpoint: op.rpc, operator: op.operator, independent: true, same_block_hash: same, state_root_matches: b2.stateRoot === blk.stateRoot, supply_base_units: BigInt(t2.result).toString(), response_sha256: t2.sha256, failed_before: tried.length };
          payload.two_operators_agree = same && BigInt(t2.result) === supply ? "true" : "false";
          break;
        } catch (e) {
          tried.push({ endpoint: op.rpc, error: String((e as Error).message).slice(0, 120) });
        }
      }
      payload.second_read = second ?? { all_failed: tried.length };
      if (!second) unmeasured.push("second operator (all failed)");
    }
  } catch (e) {
    // The chain read failed on OUR side: nothing was learned about the deployment.
    return { delivered: false, error: "chain_read_unmeasured", reason: String((e as Error).message || e).slice(0, 200), detail: { endpoint: led.rpc } };
  }
  payload.notes = notes;
  return { delivered: true, payload, subject: `${asset} on ${ledger} — ${payload.evidence_kind}`, source_urls, evidence, unmeasured };
}

export const onRequestGet: PagesFunction<RasEnv> = async ({ request, env }) => {
  const url = new URL(request.url);
  const origin = url.origin;
  const asset = (url.searchParams.get("asset") || "").trim().toUpperCase();
  const ledger = (url.searchParams.get("ledger") || "").trim().toLowerCase();
  const resourceUrl = `${origin}/api/ras/supply`;
  const accepts = x402Accepts(env, resourceUrl, { skuId: "ras_fresh_read", tier: "per_read", description: RAS_SUPPLY_DESCRIPTION, productId: "csoai.product.ras.supply" });
  const bazaar = declareBazaarHttpGet({
    method: "GET",
    queryParams: { asset: asset || "USDC", ledger: ledger || "ethereum" },
    queryParamsSchema: {
      properties: {
        asset: { type: "string", enum: Object.keys(ISSUERS), description: "asset whose issuer publishes a deployment list the reader parses" },
        ledger: { type: "string", enum: Object.keys(EVM_LEDGERS), description: "EVM ledger named on the issuer's list" },
      },
      required: ["asset", "ledger"],
    },
    outputExample: { schema: SCHEMA, kind: "receipt", result: { kind: KIND, evidence_kind: "STATE_PROOF_VERIFIED | OPERATOR_API | REJECTED", supply: { base_units: "<int>", decimals: 6 }, height: { number: "<int>", state_root: "<0x…>" }, proof: { account_proof_verified: true, storage_proof_verified: true } }, receipt: { sha256: "<hex>", sig_ed25519: "<hex or null>" } },
  });
  return rasDoor({
    request, env, schema: SCHEMA, surface: "ras.supply", resourceUrl,
    freePreviewPath: "/evidence/cross-ledger-usdc/",
    description: RAS_SUPPLY_DESCRIPTION,
    serviceName: "CSOAI Supply Read",
    tags: ["stablecoin", "supply", "eip-1186", "evidence", "x402"],
    accepts, bazaar,
    deliverable: "one signed card-v0 receipt over a fresh totalSupply() read (address parsed from the issuer's page on the request), with the EIP-1186 proof and its verification on Ethereum",
    never: ["a reserve attestation", "a proof of backing", "a rate", "a grade", "a certificate"],
    inputError: () => {
      if (!ISSUERS[asset]) return { status: 404, error: "unknown_asset", reason: `asset must be one of ${Object.keys(ISSUERS).join(", ")} (an asset whose issuer list the reader parses)`, detail: { known_assets: Object.keys(ISSUERS) } };
      if (!EVM_LEDGERS[ledger]) return { status: 404, error: "unknown_ledger", reason: `ledger must be one of ${Object.keys(EVM_LEDGERS).join(", ")}; non-EVM ledgers are read in the free daily artifact, not by this door`, detail: { known_ledgers: Object.keys(EVM_LEDGERS) } };
      return null;
    },
    compute: () => readSupply(asset, ledger),
    counter: "count:ras_supply_reads",
  });
};

export const onRequestPost = onRequestGet;
