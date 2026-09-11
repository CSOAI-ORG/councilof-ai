#!/usr/bin/env node
/**
 * Stellar Reader — reproducible Horizon queries for Stellar-issued stablecoins.
 * Uses /assets endpoint for supply data, /accounts for holder data.
 * USBDC remains UNMEASURED until issuer account independently identified.
 * 
 * Revision: stellar-reader-0.1.1
 */

import { createHash } from 'crypto';

const REVISION = 'stellar-reader-0.1.1';
const HORIZON = 'https://horizon.stellar.org';
const TERMS = 'Stellar Horizon asset data — NOT proof of reserves, NOT attestation verification';

async function horizonGet(path) {
  const resp = await fetch(`${HORIZON}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Horizon ${resp.status}: ${body.slice(0, 200)}`);
  }
  return resp.json();
}

async function measureAsset(code, issuer, label) {
  const root = await horizonGet('/');
  const latestLedger = root.history_latest_ledger;

  // Get asset info from /assets endpoint
  let assetData = null;
  try {
    const assetsResp = await horizonGet(`/assets?asset_code=${code}&asset_issuer=${issuer}&limit=1`);
    const records = assetsResp._embedded?.records || [];
    if (records.length > 0) {
      assetData = records[0];
    }
  } catch {}

  // Get holder accounts
  let holderCount = 0;
  let totalSupply = 0;
  let pagingToken = null;
  let maxPages = 10;
  let page = 0;

  while (page < maxPages) {
    const params = new URLSearchParams({
      asset: `${code}:${issuer}`,
      limit: '200',
      order: 'desc',
    });
    if (pagingToken) params.set('cursor', pagingToken);

    try {
      const resp = await horizonGet(`/accounts?${params}`);
      const records = resp._embedded?.records || [];
      if (records.length === 0) break;

      for (const acct of records) {
        for (const balance of (acct.balances || [])) {
          if (balance.asset_code === code && balance.asset_issuer === issuer) {
            const bal = parseFloat(balance.balance || '0');
            if (bal > 0) {
              totalSupply += bal;
              holderCount++;
            }
          }
        }
      }

      pagingToken = records[records.length - 1]?.paging_token;
      if (!pagingToken || !resp._links?.next) break;
      page++;
    } catch (e) {
      break;
    }
  }

  const rawHash = createHash('sha256')
    .update(`stellar:${issuer}:${code}:${latestLedger}:${totalSupply.toFixed(7)}`)
    .digest('hex');

  return {
    symbol: code, issuer, label, chain: 'Stellar',
    ledger_index: latestLedger,
    holders: holderCount,
    asset_authorized: assetData?.balances?.authorized || 'unknown',
    supply_normalized: totalSupply,
    supply_display: totalSupply > 1e6
      ? `$${(totalSupply / 1e6).toFixed(1)}M`
      : totalSupply > 0
        ? `$${totalSupply.toFixed(0)}`
        : '$0',
    measurement_state: holderCount > 0 ? 'DEEP_MEASURED' : 'NO_HOLDERS_FOUND',
    source: `Stellar Horizon /accounts + /assets via ${HORIZON}`,
    raw_hash: `sha256:${rawHash}`,
    measured_at: new Date().toISOString(),
    code_revision: REVISION,
    terms_boundary: TERMS,
    note: holderCount === 0
      ? 'Horizon /accounts?asset= returned no accounts — API may require different filter format or asset issuer has changed'
      : undefined,
    replay_instructions: `node readers/stellar-reader.mjs`,
  };
}

async function main() {
  const root = await horizonGet('/');
  const latestLedger = root.history_latest_ledger;

  // Known Stellar assets (Circle's issuer address may have changed)
  const assets = [
    { code: 'USDC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3THOJXX4ER6K2MFIRPA', label: 'Circle USDC' },
    { code: 'EURC', issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3THOJXX4ER6K2MFIRPA', label: 'Circle EURC' },
  ];

  const results = [];
  for (const asset of assets) {
    try {
      const r = await measureAsset(asset.code, asset.issuer, asset.label);
      results.push(r);
      process.stderr.write(`  ${asset.code}: ${r.supply_display} (${r.holders} holders)\n`);
    } catch (e) {
      results.push({
        symbol: asset.code, issuer: asset.issuer, label: asset.label, chain: 'Stellar',
        measurement_state: 'MEASUREMENT_FAILED', error: e.message,
        measured_at: new Date().toISOString(), code_revision: REVISION,
      });
      process.stderr.write(`  ${asset.code}: FAILED — ${e.message.slice(0, 80)}\n`);
    }
  }

  // USBDC explicitly excluded
  results.push({
    symbol: 'USBDC', chain: 'Stellar',
    measurement_state: 'UNMEASURED',
    reason: 'Issuer account not independently identified',
    measured_at: new Date().toISOString(), code_revision: REVISION,
  });

  console.log(JSON.stringify({
    schema: 'csoai.financial-coverage/0.1',
    kind: 'financial.stellar-measurement',
    generator: REVISION,
    generated_at: new Date().toISOString(),
    terms_boundary: TERMS,
    latest_ledger: latestLedger,
    total_measured: results.filter(r => r.measurement_state === 'DEEP_MEASURED').length,
    total_unmeasured: results.filter(r => r.measurement_state === 'UNMEASURED').length,
    total_failed: results.filter(r => r.measurement_state === 'MEASUREMENT_FAILED').length,
    measurements: results,
  }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
