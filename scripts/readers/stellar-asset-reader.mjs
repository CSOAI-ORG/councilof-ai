#!/usr/bin/env node
/**
 * Stellar Asset Reader — CSOAI TUI-2 Financial Measurement
 *
 * Queries Stellar Horizon API for asset data.
 * Usage: node scripts/readers/stellar-asset-reader.mjs <asset_code> <issuer>
 * Example: node scripts/readers/stellar-asset-reader.mjs USDC GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3THOJ22IGXQIWE4BML
 *
 * Note: USBDC remains unmeasured until the Stellar issuer account and
 * transactions are independently identified (per TUI-2 brief).
 */

import { createHash } from "node:crypto";

const HORIZON = "https://horizon.stellar.org";

async function stellarGet(path) {
  const res = await fetch(`${HORIZON}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Stellar HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function readStellarAsset(assetCode, issuer) {
  const record = {
    schema: "csoai.stellar-asset-reader/1.0",
    reader_revision: "scripts/readers/stellar-asset-reader.mjs@1.1.0",
    source: HORIZON,
    chain: "stellar",
    asset_code: assetCode,
    asset_issuer: issuer,
    queried_at: new Date().toISOString(),
    terms_boundary: "Public Stellar Horizon API (horizon.stellar.org). No API key. Rate limits apply.",
    correction_link: "https://github.com/CSOAI-ORG/councilof-ai/issues",
  };

  // Get current ledger
  const ledger = await stellarGet("/ledgers?order=desc&limit=1");
  const latest = ledger._embedded.records[0];
  record.finalized_ledger = parseInt(latest.sequence);
  record.ledger_hash = latest.hash;
  record.ledger_closed_at = latest.closed_at;

  // Get asset info
  const assets = await stellarGet(
    `/assets?asset_code=${assetCode}&asset_issuer=${issuer}`
  );
  const asset = assets._embedded.records[0];
  if (!asset) {
    record.error = `Asset ${assetCode}:${issuer} not found`;
    return record;
  }

  record.token = {
    code: asset.asset_code,
    issuer: asset.asset_type === "credit_alphanum12" ? asset.asset_issuer : null,
    num_accounts: parseInt(asset.num_accounts),
    amount: String(asset.amount),
    amount_encoding: "exact_decimal_string",
    flags: asset.flags,
  };

  // Get order book for price reference
  try {
    const book = await stellarGet(
      `/order_book?selling_asset_type=native&buying_asset_type=credit_${assetCode.length <= 4 ? "alphanum4" : "alphanum12"}&buying_asset_code=${assetCode}&buying_asset_issuer=${issuer}&limit=1`
    );
    if (book.bids && book.bids.length > 0) {
      record.price_reference = {
        bid_price: String(book.bids[0].price),
        bid_amount: String(book.bids[0].amount),
        encoding: "exact_decimal_string",
      };
    }
  } catch {
    // Price reference is optional
  }

  // Replay hash
  record.replay_hash = createHash("sha256")
    .update(JSON.stringify({
      asset_code: assetCode, issuer,
      ledger: record.finalized_ledger,
      ledger_hash: record.ledger_hash,
      accounts: record.token.num_accounts,
    }))
    .digest("hex");

  record.raw_data_hash = createHash("sha256")
    .update(JSON.stringify(record.token))
    .digest("hex");

  return record;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, assetCode, issuer] = process.argv;
  if (!assetCode || !issuer) {
    console.error("Usage: node stellar-asset-reader.mjs <asset_code> <issuer>");
    console.error("Example: node stellar-asset-reader.mjs USDC GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3THOJ22IGXQIWE4BML");
    process.exit(1);
  }
  try {
    const result = await readStellarAsset(assetCode, issuer);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}
