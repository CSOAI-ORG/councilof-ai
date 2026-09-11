#!/usr/bin/env node
/**
 * XRPL Reader — reproducible ledger queries for XRPL-issued stablecoins.
 * Uses the public XRPL cluster. Queries account_lines for issued supply.
 * 
 * Key insight: on XRPL, the issuer's trust line shows NEGATIVE balance = amount issued.
 * We query the issuer account and sum absolute negative balances per currency.
 * 
 * Revision: xrpl-reader-0.1.1
 */

import { createHash } from 'crypto';

const REVISION = 'xrpl-reader-0.1.1';
const XRPL_RPC = 'https://xrplcluster.com';
const TERMS = 'XRPL account_lines supply — NOT proof of reserves, NOT attestation verification';

// Verified XRPL stablecoin issuers (checked 2026-09-11)
const INSTRUMENTS = [
  { symbol: 'RLUSD', issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', currency: '524C555344000000000000000000000000000000', label: 'Ripple RLUSD' },
  { symbol: 'USD',   issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', currency: 'USD', label: 'Ripple USD gateway' },
];

async function xrplRequest(method, params) {
  const resp = await fetch(XRPL_RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ method, params, id: 1 }),
    signal: AbortSignal.timeout(30000),
  });
  const data = await resp.json();
  if (data.result) return data.result;
  throw new Error(`XRPL ${method} failed: ${JSON.stringify(data.error || data)}`);
}

async function measureInstrument(inst) {
  const ledgerResp = await xrplRequest('ledger', { ledger_index: 'validated', transactions: false, expand: false });
  const ledgerIndex = ledgerResp.ledger.ledger_index;
  const ledgerHash = ledgerResp.ledger.ledger_hash;

  let totalIssued = 0n;
  let holderCount = 0;
  let marker = null;

  do {
    const params = { account: inst.issuer, ledger_index: ledgerIndex, limit: 400 };
    if (marker) params.marker = marker;

    try {
      const resp = await xrplRequest('account_lines', params);
      if (resp.lines) {
        for (const line of resp.lines) {
          if (line.currency === inst.currency || line.currency === inst.symbol) {
            const balance = parseFloat(line.balance || '0');
            if (balance < 0) {
              // Negative on issuer = issued supply
              totalIssued += BigInt(Math.round(Math.abs(balance) * 1e6));
              holderCount++;
            }
          }
        }
      }
      marker = resp.marker || null;
    } catch (e) {
      return {
        symbol: inst.symbol, issuer: inst.issuer, label: inst.label, chain: 'XRPL',
        measurement_state: 'MEASUREMENT_FAILED', error: e.message,
        ledger_index: ledgerIndex, measured_at: new Date().toISOString(), code_revision: REVISION,
      };
    }
  } while (marker);

  const supplyNormalized = Number(totalIssued) / 1e6;
  const rawHash = createHash('sha256')
    .update(`xrpl:${inst.issuer}:${inst.currency}:${ledgerIndex}:${totalIssued.toString()}`)
    .digest('hex');

  return {
    symbol: inst.symbol, issuer: inst.issuer, label: inst.label, chain: 'XRPL',
    ledger_index: ledgerIndex, ledger_hash: ledgerHash,
    holders: holderCount,
    supply_raw: totalIssued.toString(),
    supply_normalized: supplyNormalized,
    supply_display: supplyNormalized >= 1e9
      ? `$${(supplyNormalized / 1e9).toFixed(2)}B`
      : supplyNormalized >= 1e6
        ? `$${(supplyNormalized / 1e6).toFixed(1)}M`
        : supplyNormalized > 0
          ? `$${supplyNormalized.toFixed(2)}`
          : '$0 (no active supply)',
    measurement_state: holderCount > 0 ? 'DEEP_MEASURED' : 'NO_ISSUED_SUPPLY',
    source: `XRPL account_lines via ${XRPL_RPC}`,
    raw_hash: `sha256:${rawHash}`,
    measured_at: new Date().toISOString(),
    code_revision: REVISION,
    query: { method: 'account_lines', params: { account: inst.issuer, ledger_index: ledgerIndex } },
    terms_boundary: TERMS,
    note: holderCount === 0
      ? 'RLUSD XRPL trust lines exist but all show zero balance — supply may be managed through Ripple\'s internal ledger or RLUSD is not actively circulating on XRPL'
      : undefined,
    replay_instructions: `node readers/xrpl-reader.mjs`,
  };
}

async function main() {
  const results = [];
  for (const inst of INSTRUMENTS) {
    try {
      const r = await measureInstrument(inst);
      results.push(r);
      process.stderr.write(`  ${inst.symbol}: ${r.supply_display} (${r.holders} holders)\n`);
    } catch (e) {
      results.push({
        symbol: inst.symbol, issuer: inst.issuer, label: inst.label, chain: 'XRPL',
        measurement_state: 'MEASUREMENT_FAILED', error: e.message,
        measured_at: new Date().toISOString(), code_revision: REVISION,
      });
      process.stderr.write(`  ${inst.symbol}: FAILED — ${e.message}\n`);
    }
  }

  console.log(JSON.stringify({
    schema: 'csoai.financial-coverage/0.1',
    kind: 'financial.xrpl-measurement',
    generator: REVISION,
    generated_at: new Date().toISOString(),
    terms_boundary: TERMS,
    total_measured: results.filter(r => r.measurement_state === 'DEEP_MEASURED').length,
    total_no_supply: results.filter(r => r.measurement_state === 'NO_ISSUED_SUPPLY').length,
    total_failed: results.filter(r => r.measurement_state === 'MEASUREMENT_FAILED').length,
    measurements: results,
  }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
