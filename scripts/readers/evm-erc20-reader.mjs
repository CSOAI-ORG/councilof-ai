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

async function rpcCall(rpc, method, params) {
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result;
}

async function readERC20(chain, contract) {
  const cfg = CHAINS[chain];
  if (!cfg) throw new Error(`Unknown chain: ${chain}. Supported: ${Object.keys(CHAINS).join(", ")}`);

  const record = {
    schema: "csoai.evm-erc20-reader/1.0",
    reader_revision: "scripts/readers/evm-erc20-reader.mjs@1.0.0",
    source: cfg.rpc,
    chain,
    chainId: cfg.chainId,
    contract,
    queried_at: new Date().toISOString(),
    terms_boundary: "Public RPC (llamarpc.com / base.org). No API key required. Rate limits apply.",
    correction_link: "https://github.com/CSOAI-ORG/councilof-ai/issues",
  };

  // Get latest block
  const blockHex = await rpcCall(cfg.rpc, "eth_blockNumber", []);
  const blockNumber = parseInt(blockHex, 16);
  record.observed_block = blockNumber;
  record.block_finality = "RPC_LATEST_NOT_INDEPENDENTLY_PROVEN_FINAL";

  // Get block hash for replay
  const blockData = await rpcCall(cfg.rpc, "eth_getBlockByNumber", [blockHex, false]);
  record.block_hash = blockData.hash;
  record.block_timestamp = parseInt(blockData.timestamp, 16);

  // Read ERC-20 metadata
  const [nameHex, symbolHex, decimalsHex, totalSupplyHex] = await Promise.all([
    rpcCall(cfg.rpc, "eth_call", [{ to: contract, data: ERC20_SELECTORS.name }, blockHex]),
    rpcCall(cfg.rpc, "eth_call", [{ to: contract, data: ERC20_SELECTORS.symbol }, blockHex]),
    rpcCall(cfg.rpc, "eth_call", [{ to: contract, data: ERC20_SELECTORS.decimals }, blockHex]),
    rpcCall(cfg.rpc, "eth_call", [{ to: contract, data: ERC20_SELECTORS.totalSupply }, blockHex]),
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
  if (record.token.totalSupply_raw && record.token.decimals) {
    const raw = BigInt(record.token.totalSupply_raw);
    const dec = record.token.decimals;
    const divisor = BigInt(10 ** dec);
    const whole = raw / divisor;
    const frac = raw % divisor;
    record.token.totalSupply_normalized = `${whole}.${frac.toString().padStart(dec, "0")}`;
  }

  // Replay hash
  record.replay_hash = createHash("sha256")
    .update(JSON.stringify({ chain, contract, blockNumber, blockHash: record.block_hash }))
    .digest("hex");

  // Raw data hash
  record.raw_data_hash = createHash("sha256").update(JSON.stringify(record.token)).digest("hex");

  return record;
}

// CLI
const [,, chain, contract] = process.argv;
if (!chain || !contract) {
  console.error("Usage: node evm-erc20-reader.mjs <chain> <contract_address>");
  console.error("Chains:", Object.keys(CHAINS).join(", "));
  process.exit(1);
}

try {
  const result = await readERC20(chain, contract);
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
