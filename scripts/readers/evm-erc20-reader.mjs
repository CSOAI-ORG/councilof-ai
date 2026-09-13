#!/usr/bin/env node
/**
 * EVM ERC-20 Reader — CSOAI TUI-2 Financial Measurement
 *
 * Queries on-chain ERC-20 token data via public RPC.
 * Every record retains: source, query, finalized block, raw hash, normalized calculation,
 * code revision, replay result, terms boundary, correction link.
 *
 * Usage: node scripts/readers/evm-erc20-reader.mjs <chain> <contract_address>
 * Example: node scripts/readers/evm-erc20-reader.mjs ethereum 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
 */

import { createHash } from "node:crypto";

const CHAINS = {
  ethereum: {
    rpc: "https://eth.llamarpc.com",
    explorer: "https://api.etherscan.io/api",
    chainId: 1,
  },
  base: {
    rpc: "https://mainnet.base.org",
    explorer: "https://api.basescan.org/api",
    chainId: 8453,
  },
};

// ERC-20 ABI fragments (minimal)
const ERC20_SELECTORS = {
  name: "0x06fdde03",
  symbol: "0x95d89b41",
  decimals: "0x313ce567",
  totalSupply: "0x18160ddd",
  balanceOf: "0x70a08231",
};

export async function rpcCall(rpc, method, params) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

export function normalizeAtomicAmount(rawValue, decimals) {
  const raw = BigInt(rawValue);
  const divisor = 10n ** BigInt(decimals);
  const whole = raw / divisor;
  const fraction = raw % divisor;
  return decimals === 0
    ? whole.toString()
    : `${whole}.${fraction.toString().padStart(decimals, "0")}`;
}

export async function readERC20(chain, contract, blockTag = null) {
  const cfg = CHAINS[chain];
  if (!cfg) throw new Error(`Unknown chain: ${chain}. Supported: ${Object.keys(CHAINS).join(", ")}`);

  // Endpoint substitution: EVM_RPC_<CHAIN> env overrides the compiled-in default.
  // The record states both so a substitution is never silent.
  const envKey = `EVM_RPC_${chain.toUpperCase()}`;
  const rpcUsed = process.env[envKey] || cfg.rpc;
  const substituted = rpcUsed !== cfg.rpc;

  const record = {
    schema: "csoai.evm-erc20-reader/1.0",
    reader_revision: "scripts/readers/evm-erc20-reader.mjs@1.1.0",
    source: rpcUsed,
    endpoint_default: cfg.rpc,
    endpoint_used: rpcUsed,
    endpoint_substituted: substituted,
    endpoint_substitution_reason: substituted
      ? (process.env.EVM_RPC_SUBSTITUTION_REASON || "default endpoint unreachable at observation time")
      : null,
    chain,
    chainId: cfg.chainId,
    contract,
    queried_at: new Date().toISOString(),
    terms_boundary: "Public RPC (llamarpc.com / base.org). No API key required. Rate limits apply.",
    correction_link: "https://github.com/CSOAI-ORG/councilof-ai/issues",
  };

  // Block selection: an explicit hex block tag pins the read to that height
  // (replay of a recorded observation); otherwise pin to the provider-reported
  // finalized tag when available, falling back to latest with the weaker label.
  // All of these labels are provider-reported unless independently proven.
  let blockHex;
  let blockData;
  if (blockTag) {
    blockHex = blockTag;
    blockData = await rpcCall(rpcUsed, "eth_getBlockByNumber", [blockHex, false]);
    if (!blockData?.number || !blockData?.hash) throw new Error(`unknown pinned block ${blockTag}`);
    record.block_finality = "PINNED_BLOCK_PROVIDER_REPORTED_NOT_INDEPENDENTLY_PROVEN_FINAL";
  } else {
    try {
      blockData = await rpcCall(rpcUsed, "eth_getBlockByNumber", ["finalized", false]);
      if (!blockData?.number || !blockData?.hash) throw new Error("missing finalized block");
      blockHex = blockData.number;
      record.block_finality = "RPC_FINALIZED_TAG_PROVIDER_REPORTED_NOT_INDEPENDENTLY_PROVEN_FINAL";
    } catch {
      blockHex = await rpcCall(rpcUsed, "eth_blockNumber", []);
      blockData = await rpcCall(rpcUsed, "eth_getBlockByNumber", [blockHex, false]);
      record.block_finality = "RPC_LATEST_NOT_INDEPENDENTLY_PROVEN_FINAL";
    }
  }
  const blockNumber = parseInt(blockHex, 16);
  record.observed_block = blockNumber;

  // When substituted, probe the default endpoint once and record its live status honestly.
  if (substituted) {
    try {
      const probe = await fetch(cfg.rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
        signal: AbortSignal.timeout(15000),
      });
      record.endpoint_default_probe = { http_status: probe.status, probed_at: new Date().toISOString() };
    } catch (e) {
      record.endpoint_default_probe = { error: String(e && e.message || e), probed_at: new Date().toISOString() };
    }
  }

  record.block_hash = blockData.hash;
  record.block_timestamp = parseInt(blockData.timestamp, 16);

  // Read ERC-20 metadata
  const [nameHex, symbolHex, decimalsHex, totalSupplyHex] = await Promise.all([
    rpcCall(rpcUsed, "eth_call", [{ to: contract, data: ERC20_SELECTORS.name }, blockHex]),
    rpcCall(rpcUsed, "eth_call", [{ to: contract, data: ERC20_SELECTORS.symbol }, blockHex]),
    rpcCall(rpcUsed, "eth_call", [{ to: contract, data: ERC20_SELECTORS.decimals }, blockHex]),
    rpcCall(rpcUsed, "eth_call", [{ to: contract, data: ERC20_SELECTORS.totalSupply }, blockHex]),
  ]);

  // Decode responses
  const decodeString = (hex) => {
    if (hex === "0x" || !hex) return null;
    try {
      const bytes = Buffer.from(hex.slice(2), "hex");
      // ABI-encoded string: offset(32) + length(32) + data
      const len = parseInt(bytes.slice(32, 64).toString("hex"), 16);
      return bytes.slice(64, 64 + len).toString("utf8");
    } catch {
      return hex;
    }
  };

  const decodeUint = (hex) => {
    if (hex === "0x" || !hex) return null;
    return BigInt(hex).toString();
  };

  record.token = {
    name: decodeString(nameHex),
    symbol: decodeString(symbolHex),
    decimals: parseInt(decimalsHex, 16),
    totalSupply_raw: decodeUint(totalSupplyHex),
  };

  // Normalized total supply
  if (record.token.totalSupply_raw !== null && Number.isInteger(record.token.decimals)) {
    record.token.totalSupply_normalized = normalizeAtomicAmount(
      record.token.totalSupply_raw,
      record.token.decimals,
    );
  }

  // Replay hash
  record.replay_hash = createHash("sha256")
    .update(JSON.stringify({ chain, contract, blockNumber, blockHash: record.block_hash }))
    .digest("hex");

  // Raw data hash
  record.raw_data_hash = createHash("sha256").update(JSON.stringify(record.token)).digest("hex");

  return record;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, chain, contract, blockTag] = process.argv;
  if (!chain || !contract) {
    console.error("Usage: node evm-erc20-reader.mjs <chain> <contract_address> [block_hex]");
    console.error("Chains:", Object.keys(CHAINS).join(", "));
    console.error("Optional block_hex pins the read to that exact height (replay).");
    process.exit(1);
  }
  try {
    const result = await readERC20(chain, contract, blockTag || null);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
