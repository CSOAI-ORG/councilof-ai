import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(REPO, relative), "utf8");
const SOURCE_URL = "https://huggingface.co/datasets/csoai/councilof-ai-source/resolve/6ff9855a2e2bc32d25d6474ce7e2da50f6f5fadb/source/scripts/verify_receipt.py";
const SOURCE_SHA256 = "dd310cbd62add18f83a535e4d442b4c891c7b967f33fd74d04874c2b36739336";

test("public receipt surfaces point to the dated source snapshot", () => {
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
    assert.ok(text.includes(SOURCE_URL), `${file} must identify the public source bytes`);
    assert.doesNotMatch(text, /github\.com\/CSOAI-ORG\/councilof-ai/);
  }

  const openapi = JSON.parse(read("public/openapi.json"));
  const receipt = openapi["x-x402"].offer_receipt;
  assert.equal(receipt.verify_source, SOURCE_URL);
  assert.equal(receipt.verify_source_sha256, SOURCE_SHA256);
  assert.equal(receipt.verify_hosted, "https://councilof.ai/api/receipts/verify");
  assert.ok(openapi.info["x-guidance"].includes(SOURCE_URL));
});

test("the referenced verifier source matches this checkout byte for byte", () => {
  const digest = createHash("sha256").update(read("scripts/verify_receipt.py")).digest("hex");
  assert.equal(digest, SOURCE_SHA256);
});
