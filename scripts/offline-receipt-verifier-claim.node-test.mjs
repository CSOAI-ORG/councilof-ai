import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(REPO, relative), "utf8");

test("public receipt surfaces do not promise an unpublished offline verifier", () => {
  const runtime = [
    "functions/.well-known/x402.json.ts",
    "functions/api/x402.ts",
    "functions/api/receipts/index.ts",
  ];
  const generated = [
    "scripts/build_openapi.py",
    "scripts/llms/llms.txt.tmpl",
    "public/llms.txt",
  ];

  for (const file of [...runtime, ...generated]) {
    const text = read(file);
    assert.doesNotMatch(text, /scripts\/verify_receipt\.py/);
    assert.doesNotMatch(text, /github\.com\/CSOAI-ORG\/councilof-ai/);
  }

  const openapi = JSON.parse(read("public/openapi.json"));
  const receipt = openapi["x-x402"].offer_receipt;
  assert.equal(receipt.verify_offline, undefined);
  assert.equal(receipt.verify_hosted, "https://councilof.ai/api/receipts/verify");
  assert.doesNotMatch(openapi.info["x-guidance"], /scripts\/verify_receipt\.py/);
});
