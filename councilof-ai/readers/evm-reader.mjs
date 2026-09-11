#!/usr/bin/env node
/**
 * EVM Reader — reproducible totalSupply() measurement for ERC-20 stablecoins.
 * Uses public RPC endpoints with failover.
 * Output: JSON with full provenance.
 * Revision: evm-reader-0.1.1
 */

import { createHash } from 'crypto';

const REVISION = 'evm-reader-0.1.1';

const RPC_ENDPOINTS = {
  ethereum: [
    'https://ethereum-rpc.publicnode.com',
    'https://1rpc.io/eth',
    'https://eth.drpc.org',
    'https://rpc.flashbots.net',
    'https://eth-mainnet.public.blastapi.io',
  ],
  base: [
    'https://base-rpc.publicnode.com',
    'https://1rpc.io/base',
    'https://base.drpc.org',
  ],
};

const TOTAL_SUPPLY_SELECTOR = '0x18160ddd';

const CONTRACTS = {
  ethereum: {
    USDT:   { addr: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6  },
    USDC:   { addr: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6  },
    DAI:    { addr: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
    USDS:   { addr: '0xdC035D45d973E3EC169d2276DDab16f1e407384F', decimals: 18 },
    USDe:   { addr: '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3', decimals: 18 },
    PYUSD:  { addr: '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8', decimals: 6  },
    RLUSD:  { addr: '0x8292Bb45bf1Ee4d140127049757C2E0fF06317eD', decimals: 18 },
    crvUSD: { addr: '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E', decimals: 18 },
    GHO:    { addr: '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f', decimals: 18 },
    FRAX:   { addr: '0x853d955aCEf822Db058eb8505911ED77F175b99e', decimals: 18 },
    USDD:   { addr: '0x0C10bF8FcB7Bf5412187A595ab97a3609160b5c6', decimals: 18 },
    FDUSD:  { addr: '0xc5f0f7b66764F6ec8C8Dff7BA683ba84b2f38D68', decimals: 18 },
    DOLA:   { addr: '0x865377367054516e17014CcdED1E7282bCC0571d', decimals: 18 },
  },
};

const TERMS = 'totalSupply() only — NOT proof of reserves, NOT attestation verification, NOT cross-chain total';

async function rpcCall(rpcUrls, method, params) {
  const errors = [];
  for (const url of rpcUrls) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await resp.json();
      if (data.result) return { result: data.result, rpc: url };
      errors.push(`${url}: ${JSON.stringify(data.error || 'no result')}`);
    } catch (e) {
      errors.push(`${url}: ${e.message}`);
    }
  }
  throw new Error(`All RPCs failed:\n${errors.join('\n')}`);
}

async function measureContract(chain, symbol, contractInfo) {
  const rpcs = RPC_ENDPOINTS[chain];
  if (!rpcs) throw new Error(`No RPC endpoints for chain: ${chain}`);

  const blockResp = await rpcCall(rpcs, 'eth_blockNumber', []);
  const blockHex = blockResp.result;
  const blockNum = parseInt(blockHex, 16);

  const supplyResp = await rpcCall(rpcs, 'eth_call', [
    { to: contractInfo.addr, data: TOTAL_SUPPLY_SELECTOR },
    blockHex,
  ]);
  const rawHex = supplyResp.result;
  const rawBig = BigInt(rawHex);
  const decimals = contractInfo.decimals;
  const supplyHuman = Number(rawBig) / (10 ** decimals);

  const rawHash = createHash('sha256')
    .update(`${chain}:${contractInfo.addr}:${blockNum}:${rawHex}`)
    .digest('hex');

  return {
    symbol, chain, contract: contractInfo.addr, decimals,
    block_number: blockNum, block_hex: blockHex,
    raw_hex: rawHex,
    raw_hash: `sha256:${rawHash}`,
    supply_raw: rawBig.toString(),
    supply_normalized: supplyHuman,
    supply_display: supplyHuman >= 1e9
      ? `$${(supplyHuman / 1e9).toFixed(2)}B`
      : supplyHuman >= 1e6
        ? `$${(supplyHuman / 1e6).toFixed(2)}M`
        : `$${supplyHuman.toFixed(2)}`,
    measurement_state: 'DEEP_MEASURED',
    source: `eth_call totalSupply() via ${supplyResp.rpc}`,
    measured_at: new Date().toISOString(),
    code_revision: REVISION,
    query: { method: 'eth_call', params: [{ to: contractInfo.addr, data: TOTAL_SUPPLY_SELECTOR }, blockHex] },
    terms_boundary: TERMS,
    replay_instructions: `node readers/evm-reader.mjs --chain ${chain} --contracts ${contractInfo.addr}`,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let chains = ['ethereum'];
  let specificContracts = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chain') chains = [args[++i]];
    if (args[i] === '--contracts') specificContracts = args[++i].split(',');
  }

  const results = [];
  for (const chain of chains) {
    const contracts = CONTRACTS[chain] || {};
    for (const [symbol, info] of Object.entries(contracts)) {
      if (specificContracts && !specificContracts.includes(info.addr)) continue;
      try {
        const r = await measureContract(chain, symbol, info);
        results.push(r);
        process.stderr.write(`  ✓ ${symbol} on ${chain}: ${r.supply_display} @ block ${r.block_number}\n`);
      } catch (e) {
        results.push({
          symbol, chain, contract: info.addr,
          measurement_state: 'MEASUREMENT_FAILED',
          error: e.message,
          measured_at: new Date().toISOString(),
          code_revision: REVISION,
        });
        process.stderr.write(`  ✗ ${symbol} on ${chain}: FAILED — ${e.message.slice(0,80)}\n`);
      }
    }
  }

  console.log(JSON.stringify({
    schema: 'csoai.financial-coverage/0.1',
    kind: 'financial.deep-measurement',
    generator: REVISION,
    generated_at: new Date().toISOString(),
    terms_boundary: TERMS,
    total_measured: results.filter(r => r.measurement_state === 'DEEP_MEASURED').length,
    total_failed: results.filter(r => r.measurement_state === 'MEASUREMENT_FAILED').length,
    measurements: results,
  }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
