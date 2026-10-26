import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { describe, it } from "node:test";

const reader = new URL("./lbtc-backing-reader.mjs", import.meta.url);

// WHY A LOCAL SERVER. This test used to fetch blockstream.info and liquid.network for real.
// On 2026-10-26 the GitHub runner could not connect to them (AggregateError [ETIMEDOUT]) and
// pr-gates reported a failed chain for a network that was fine — a gate that reddens on a
// network flake teaches everybody to ignore the gate. stellar-asset-reader.node-test.mjs and
// xrpl-trustline-reader.node-test.mjs already serve their upstreams locally for exactly this
// reason; this reader now does the same, through the LBTC_SUPPLY_URL / LBTC_RESERVES_URL
// overrides the reader reads.
//
// The values below are the ones the reader was reading on 2026-10-26. They are FIXTURES, not
// live claims: this test asserts how the reader turns two source bodies into a card.
const SUPPLY_SAT = "424501461931";
const RESERVES_SAT = "364248422740";
const LAST_BLOCK = 973224;

function serve() {
  const server = createServer((request, response) => {
    if (request.url.startsWith("/supply")) {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end(SUPPLY_SAT);
      return;
    }
    if (request.url.startsWith("/reserves")) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ amount: RESERVES_SAT, lastBlockUpdate: LAST_BLOCK }));
      return;
    }
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
  });
  return server;
}

function run(env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [reader.pathname], {
      env: { ...process.env, ...env },
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function runAgainstLocalServer() {
  const server = serve();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const result = await run({
      LBTC_SUPPLY_URL: `http://127.0.0.1:${port}/supply`,
      LBTC_RESERVES_URL: `http://127.0.0.1:${port}/reserves`,
    });
    assert.equal(result.code, 0, `reader failed: ${result.stderr}`);
    return JSON.parse(result.stdout);
  } finally {
    server.close();
  }
}

describe("lbtc-backing-reader", () => {
  it("produces valid JSON with required fields", async () => {
    const card = await runAgainstLocalServer();

    assert.equal(card.schema, "csoai.lbtc-backing/0.1");
    assert.equal(card.measurement_class, "OBSERVED-UNSIGNED");
    assert.ok(card.as_of);
    assert.ok(card.data);
    assert.ok(card.data.circulating_supply_btc > 0);
    assert.ok(card.data.federation_reserves_btc > 0);
    assert.ok(card.data.backing_ratio > 0 && card.data.backing_ratio <= 1);
    assert.ok(card.data.deficit_btc >= 0);
    assert.ok(card.incident);
    assert.ok(card.incident.remediation_claims.length > 0);
    assert.ok(card.sources.supply);
    assert.ok(card.sources.reserves);
  });

  it("backing ratio matches manual calculation", async () => {
    const card = await runAgainstLocalServer();
    const expected = card.data.federation_reserves_btc / card.data.circulating_supply_btc;
    assert.ok(
      Math.abs(card.data.backing_ratio - expected) < 0.0001,
      `backing_ratio ${card.data.backing_ratio} != reserves/supply ${expected}`,
    );
  });

  it("card has incident with remediation fuse", async () => {
    const card = await runAgainstLocalServer();
    const claim = card.incident.remediation_claims[0];
    assert.equal(claim.status, "TRACKED");
    assert.ok(claim.fuse_days > 0);
    assert.ok(claim.source);
  });

  it("converts the source bodies exactly", async () => {
    const card = await runAgainstLocalServer();
    assert.equal(card.data.circulating_supply_sat, SUPPLY_SAT);
    assert.equal(card.data.federation_reserves_sat, RESERVES_SAT);
    assert.equal(card.data.circulating_supply_btc, 4245.01461931);
    assert.equal(card.data.federation_reserves_btc, 3642.4842274);
    assert.equal(card.data.backing_ratio, 0.858062);
    assert.equal(card.data.deficit_btc, 602.53);
    assert.equal(card.data.last_block_update, LAST_BLOCK);
  });

  it("an unreachable source is CANNOT-RUN, not a failed chain", async () => {
    // A port nothing is listening on. This is the case that reddened pr-gates on 2026-10-26.
    const result = await run({
      LBTC_SUPPLY_URL: "http://127.0.0.1:1/supply",
      LBTC_RESERVES_URL: "http://127.0.0.1:1/reserves",
      CI: "1",
    });
    assert.equal(result.stdout, "", "a card must not be printed when nothing was measured");
    assert.match(result.stderr, /CANNOT-RUN/);
    assert.match(result.stderr, /reachability problem, not a verification failure/);
    assert.equal(result.code, 0, "under CI an unreachable host exits 0, not 1");
  });

  it("an unreachable source is still visible to a person running it by hand", async () => {
    const result = await run({
      LBTC_SUPPLY_URL: "http://127.0.0.1:1/supply",
      LBTC_RESERVES_URL: "http://127.0.0.1:1/reserves",
      CI: "",
    });
    assert.match(result.stderr, /CANNOT-RUN/);
    assert.equal(result.code, 2, "outside CI an unreachable host exits 2, so it is not silent");
  });

  it("a source that answers with something unusable is a real failure", async () => {
    // The reader must not call a broken payload a reachability problem: the host answered, and
    // what it answered is wrong. That is a failure of the chain, and it stays red.
    const server = createServer((request, response) => {
      response.writeHead(200, { "content-type": "text/plain" });
      response.end("<html>not a number</html>");
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    try {
      const result = await run({
        LBTC_SUPPLY_URL: `http://127.0.0.1:${port}/supply`,
        LBTC_RESERVES_URL: `http://127.0.0.1:${port}/reserves`,
        CI: "1",
      });
      assert.equal(result.code, 1, "a payload that will not parse must fail, not be excused");
      assert.doesNotMatch(result.stderr, /CANNOT-RUN/);
    } finally {
      server.close();
    }
  });
});
