#!/usr/bin/env node
/**
 * lbtc-backing-reader.mjs — Liquid Network L-BTC backing ratio.
 *
 * Fetches the federation reserve balance and circulating L-BTC supply from
 * public Liquid Network APIs. No API keys required. Computes the backing
 * ratio as reserves ÷ supply, and outputs a structured card.
 *
 * Data sources (all public, no auth):
 *   - L-BTC supply: blockstream.info/liquid/api/asset/<lbtc_id>/supply
 *   - Federation reserves: liquid.network/api/v1/liquid/reserves
 *
 * The backing ratio is a MEASURED observation of on-chain state at request
 * time. It is not a claim about the security of the federation, the
 * validity of the peg, or the solvency of Blockstream.
 *
 * Usage:
 *   node scripts/readers/lbtc-backing-reader.mjs
 *   node scripts/readers/lbtc-backing-reader.mjs --out public/interop/lbtc-backing-$(date -u +%F).json
 */

const LBTC_ASSET = "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d";

// The two source URLs are overridable so the TEST can serve them from a local http server
// instead of the internet. That is the same shape as stellar-asset-reader.mjs
// (STELLAR_HORIZON) and xrpl-trustline-reader.mjs, and it is exactly why those two reader
// tests cannot flake. This reader's test used to hit blockstream.info and liquid.network
// for real: on 2026-10-26 the GitHub runner could not connect to them
// (AggregateError [ETIMEDOUT]) and the gate reported a broken chain for a network that was
// fine. A gate that reddens on a network flake teaches everybody to ignore the gate.
const SUPPLY_URL =
  process.env.LBTC_SUPPLY_URL ||
  `https://blockstream.info/liquid/api/asset/${LBTC_ASSET}/supply`;
const RESERVES_URL =
  process.env.LBTC_RESERVES_URL || "https://liquid.network/api/v1/liquid/reserves";

const out = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : null;

/**
 * A source that could not be read is NOT a broken measurement.
 *
 * The estate's rule, from scripts/verify-estate.mjs: "An unreachable host exits CANNOT-RUN
 * (0 under CI) rather than FAIL: a network flake is not a broken chain, and reporting it as
 * one teaches everybody to ignore the gate." This class marks exactly that case: the
 * observation could not be taken, so nothing was checked.
 *
 * It is deliberately NOT used for a source that answered with something unusable. A body that
 * will not parse is a real failure of the chain, not a reachability problem, and it must stay
 * red.
 */
class CannotRun extends Error {}

async function fetchText(url) {
  let res;
  try {
    res = await fetch(url, {
      headers: { "user-agent": "csoai-lbtc-backing-reader/0.1" },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (e) {
    throw new CannotRun(`${url} is unreachable (${e.message})`);
  }
  if (!res.ok) throw new CannotRun(`${url} answered ${res.status}`);
  return res.text();
}

async function main() {
  const [supplyRaw, reservesRaw] = await Promise.all([
    fetchText(SUPPLY_URL),
    fetchText(RESERVES_URL),
  ]);

  const supplySat = BigInt(supplyRaw.trim());
  const reservesData = JSON.parse(reservesRaw);
  const reservesSat = BigInt(reservesData.amount);
  const lastBlock = reservesData.lastBlockUpdate;

  const supplyBtc = Number(supplySat) / 1e8;
  const reservesBtc = Number(reservesSat) / 1e8;
  const ratio = Number(reservesSat) / Number(supplySat);
  const deficitBtc = supplyBtc - reservesBtc;

  const card = {
    schema: "csoai.lbtc-backing/0.1",
    as_of: new Date().toISOString(),
    measurement_class: "OBSERVED-UNSIGNED",
    asset: "L-BTC (Liquid Bitcoin)",
    issuer: "Blockstream (federation-controlled peg)",
    data: {
      circulating_supply_sat: supplySat.toString(),
      circulating_supply_btc: supplyBtc,
      federation_reserves_sat: reservesSat.toString(),
      federation_reserves_btc: reservesBtc,
      backing_ratio: Number(ratio.toFixed(6)),
      per_coin_btc: Number(ratio.toFixed(6)),
      deficit_btc: Number(deficitBtc.toFixed(2)),
      last_block_update: lastBlock,
    },
    incident: {
      date: "2026-09-06",
      description: "Elements range-proof verification-cache exploit; ~3,996 BTC pegged out (~95% of federation reserve)",
      remediation_claims: [
        { party: "Blockstream", claim: "the LBTC-to-BTC 1:1 peg will be covered", source: "Adam Back, Sep 11 2026", status: "TRACKED", fuse_days: 14 },
      ],
      peg_status: "peg-ins and peg-outs frozen since Sep 10 restart; emergency patch Elements v23.3.4 deployed",
    },
    sources: {
      supply: SUPPLY_URL,
      reserves: RESERVES_URL,
      incident_timeline: "https://blockstream.info/liquid",
    },
    note: "Backing ratio is an observed on-chain fact at request time. It is not a claim about federation security, peg validity, or Blockstream solvency. The deficit reflects the exploit, not normal operations.",
  };

  const json = JSON.stringify(card, null, 2);
  if (out) {
    const { writeFileSync, mkdirSync } = await import("node:fs");
    const { dirname } = await import("node:path");
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, json + "\n");
    console.log(`wrote ${out} (${json.length} B)`);
  } else {
    console.log(json);
  }

  // Summary
  console.error(`\nL-BTC backing: ${reservesBtc.toLocaleString()} reserves / ${supplyBtc.toLocaleString()} supply = ${(ratio * 100).toFixed(2)}%`);
  console.error(`Deficit: ${deficitBtc.toFixed(2)} BTC`);
  console.error(`Per L-BTC: ${(ratio * 100).toFixed(2)} cents`);
}

main().catch((e) => {
  if (e instanceof CannotRun) {
    // Nothing was checked, and no card is written: a card with no observation in it is not a
    // card. The exit code follows the estate convention - 0 under CI so a network flake does
    // not paint the chain red, 2 otherwise so a person running it by hand sees it.
    console.error(`CANNOT-RUN: ${e.message}.`);
    console.error(
      "This is a reachability problem, not a verification failure. Nothing was checked.",
    );
    process.exit(process.env.CI ? 0 : 2);
  }
  console.error(e);
  process.exit(1);
});
