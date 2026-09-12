import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import test from "node:test";

const reader = new URL("./xrpl-trustline-reader.mjs", import.meta.url);

async function runReader({ maxPages = "250" } = {}) {
  let accountLinesCalls = 0;
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => { body += chunk; });
    request.on("end", () => {
      const call = JSON.parse(body);
      let result;
      if (call.method === "ledger") {
        result = { ledger_index: 7, ledger: { ledger_hash: "ABC", close_time: 1 } };
      } else if (call.method === "account_info") {
        result = { account_data: { Sequence: 1, Balance: "0", OwnerCount: 2 } };
      } else if (call.method === "gateway_balances") {
        result = { ledger_index: 7, ledger_hash: "ABC", obligations: { RLUSD: "3.750001" } };
      } else {
        accountLinesCalls += 1;
        result = accountLinesCalls === 1
          ? { lines: [
              { account: "rOne", currency: "RLUSD", balance: "-1.250001" },
              { account: "rIssuerCredit", currency: "RLUSD", balance: "9" },
            ], marker: "next" }
          : { lines: [{ account: "rTwo", currency: "RLUSD", balance: "-2.5" }] };
      }
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ result }));
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    const output = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [reader.pathname, "rIssuer", "RLUSD"], {
        env: { ...process.env, XRPL_RPC: `http://127.0.0.1:${port}`, XRPL_MAX_PAGES: maxPages },
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (code) => code === 0 ? resolve(JSON.parse(stdout)) : reject(new Error(stderr)));
    });
    return output;
  } finally {
    server.close();
  }
}

test("complete pagination counts issuer obligations without floating-point arithmetic", async () => {
  const result = await runReader();
  assert.equal(result.pagination.complete, true);
  assert.equal(result.token.holder_count, 2);
  assert.equal(result.token.trust_line_count, 3);
  assert.equal(result.token.totalSupply_raw_micro, "3750001");
  assert.equal(result.token.totalSupply_normalized, "3.750001");
  assert.equal(result.token.holders_method, "account_lines_paginated_complete");
});

test("a pagination safety stop withholds counts and supply", async () => {
  const result = await runReader({ maxPages: "1" });
  assert.equal(result.pagination.complete, false);
  assert.equal(result.evidence_state, "UNMEASURED_INCOMPLETE_PAGINATION");
  assert.equal(result.token.holder_count, null);
  assert.equal(result.token.totalSupply_normalized, null);
});
