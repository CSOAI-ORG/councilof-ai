#!/usr/bin/env node
/**
 * XRPL Trust Line / Token Reader — CSOAI TUI-2 Financial Measurement
 *
 * Queries XRPL ledger for token trust lines, supply, and issuer data.
 * Every record retains: source, query, finalized ledger, raw hash, normalized calculation,
 * code revision, replay result, terms boundary, correction link.
 *
 * Usage: node scripts/readers/xrpl-trustline-reader.mjs <issuer_address> <currency_code>
 * Example: node scripts/readers/xrpl-trustline-reader.mjs rMxCKbEDwqr76QuheUdYwsXGm7fGMXbqi RLUSD
 */

import { createHash } from "node:crypto";

const XRPL_RPC = process.env.XRPL_RPC || "https://xrplcluster.com"; // Public XRPL full-history cluster

async function xrplCall(method, params) {
  const res = await fetch(XRPL_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params, id: 1 }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`XRPL error: ${json.error}: ${json.error_message || ""}`);
  return json.result;
}

async function readXRPLTrustLines(issuer, currency) {
  const record = {
    schema: "csoai.xrpl-trustline-reader/1.0",
    reader_revision: "scripts/readers/xrpl-trustline-reader.mjs@1.0.0",
    source: XRPL_RPC,
    chain: "xrpl",
    issuer,
    currency,
    queried_at: new Date().toISOString(),
    terms_boundary: "Public XRPL full-history cluster (xrplcluster.com). No API key. Rate limits apply.",
    correction_link: "https://github.com/CSOAI-ORG/councilof-ai/issues",
  };

  // Get current ledger
  const ledgerRes = await xrplCall("ledger", [{ ledger_index: "validated" }]);
  record.finalized_ledger = ledgerRes.ledger_index;
  record.ledger_hash = ledgerRes.ledger.ledger_hash;
  record.ledger_close_time = ledgerRes.ledger.close_time;

  // Get account info for issuer
  try {
    const accountInfo = await xrplCall("account_info", [
      { account: issuer, ledger_index: "validated" },
    ]);
    record.issuer_account = {
      sequence: accountInfo.account_data.Sequence,
      balance_xrp: accountInfo.account_data.Balance,
      owner_count: accountInfo.account_data.OwnerCount,
    };
  } catch (err) {
    record.issuer_account = { error: err.message };
  }

  // Get trust lines for the issuer (token holders)
  let allLines = [];
  let marker = undefined;
  let page = 0;
  let paginationComplete = false;
  const maxPages = Number.parseInt(process.env.XRPL_MAX_PAGES || "250", 10);
  while (true) {
    const params = [{ account: issuer, ledger_index: "validated", limit: 400 }];
    if (marker) params[0].marker = marker;
    
    const res = await xrplCall("account_lines", params);
    const lines = (res.lines || []).filter((l) => l.currency === currency);
    allLines.push(...lines);
    
    page++;
    if (!res.marker) {
      paginationComplete = true;
      break;
    }
    marker = res.marker;
    if (page >= maxPages) break;
  }

  record.pagination = {
    pages: page,
    max_pages: maxPages,
    complete: paginationComplete,
    continuation_marker_present: !paginationComplete,
  };

  // account_lines is queried from the issuer's perspective. Negative balances are
  // obligations held by counterparties; their absolute sum is circulating supply.
  let totalSupply = 0n;
  let holderCount = 0;
  const holders = [];

  const toAtomic = (value, decimals = 6) => {
    const negative = value.startsWith("-");
    const unsigned = negative ? value.slice(1) : value;
    const [whole = "0", fraction = ""] = unsigned.split(".");
    const atomic = BigInt(whole || "0") * (10n ** BigInt(decimals))
      + BigInt((fraction + "0".repeat(decimals)).slice(0, decimals));
    return negative ? -atomic : atomic;
  };
  
  for (const line of allLines) {
    const balance = toAtomic(String(line.balance));
    if (balance < 0n) {
      totalSupply += -balance;
      holderCount++;
      if (holders.length < 10) {
        holders.push({ account: line.account, balance: line.balance });
      }
    }
  }

  record.token = paginationComplete ? {
    currency,
    holder_count: holderCount,
    trust_line_count: allLines.length,
    totalSupply_raw_micro: totalSupply.toString(),
    totalSupply_normalized: (Number(totalSupply) / 1e6).toFixed(6),
    top_holders_from_issuer_perspective: holders,
    holders_method: "account_lines_paginated_complete",
  } : {
    currency,
    holder_count: null,
    trust_line_count: null,
    totalSupply_raw_micro: null,
    totalSupply_normalized: null,
    holders_method: "WITHHELD_INCOMPLETE_PAGINATION",
    unmeasured: ["holder_count", "trust_line_count", "total_supply"],
  };

  record.evidence_state = paginationComplete ? "OBSERVED_COMPLETE" : "UNMEASURED_INCOMPLETE_PAGINATION";

  // Replay hash
  record.replay_hash = createHash("sha256")
    .update(JSON.stringify({
      issuer, currency, ledger: record.finalized_ledger,
      ledgerHash: record.ledger_hash, lineCount: allLines.length,
    }))
    .digest("hex");

  record.raw_data_hash = createHash("sha256")
    .update(JSON.stringify(allLines))
    .digest("hex");

  return record;
}

// CLI
const [,, issuer, currency] = process.argv;
if (!issuer || !currency) {
  console.error("Usage: node xrpl-trustline-reader.mjs <issuer_address> <currency_code>");
  console.error("Example: node xrpl-trustline-reader.mjs rMxCKbEDwqr76QuheUdYwsXGm7fGMXbqi RLUSD");
  process.exit(1);
}

try {
  const result = await readXRPLTrustLines(issuer, currency);
  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
