import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import test from "node:test";

const reader = new URL("./stellar-asset-reader.mjs", import.meta.url);

async function runReader() {
  const server = createServer((request, response) => {
    const payload = request.url.startsWith("/ledgers")
      ? {
          _embedded: {
            records: [{ sequence: "64393517", hash: "ABC", closed_at: "2026-09-12T12:14:50Z" }],
          },
        }
      : request.url.startsWith("/assets")
        ? {
            _embedded: {
              records: [{
                asset_code: "USDC",
                asset_issuer: "GISSUER",
                accounts: { authorized: 7 },
                balances: { authorized: "309692310.1047549000000" },
                flags: { auth_required: false },
              }],
            },
          }
        : { bids: [] };
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(payload));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [reader.pathname, "USDC", "GISSUER"], {
        env: { ...process.env, STELLAR_HORIZON: `http://127.0.0.1:${port}` },
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (code) => code === 0 ? resolve(JSON.parse(stdout)) : reject(new Error(stderr)));
    });
  } finally {
    server.close();
  }
}

test("current Horizon balances shape preserves the exact decimal string", async () => {
  const result = await runReader();
  assert.equal(result.token.num_accounts, 7);
  assert.equal(result.token.amount, "309692310.1047549000000");
  assert.equal(result.token.amount_encoding, "exact_decimal_string");
  assert.equal(result.finalized_ledger, 64393517);
});
