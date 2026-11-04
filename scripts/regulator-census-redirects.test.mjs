import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("the census retains the measured resource without retaining signed redirect parameters", async t => {
  const directory = mkdtempSync(join(tmpdir(), "regulator-census-"));
  const output = join(directory, "result.json");
  const originalArgs = process.argv;
  t.after(() => { process.argv = originalArgs; rmSync(directory, { recursive: true, force: true }); });
  process.argv = [...originalArgs, "--out", output];

  const resource = "https://storage.example.test/public/list.csv";
  const signed = resource + "?%58-Amz-cReDeNtIaL=fixture-id&X-Amz-Signature=private-test-value#fragment";
  const ordinary = "https://register.example.test/data?page=2";
  const responses = [
    { type: "application/json", text: '{"meta":{"pagination":{"total":42}}}' },
    { url: ordinary, type: "application/json", text: "{}" },
    { url: signed, type: "text/csv", text: "line\n".repeat(25000) },
    { url: "https://example.test/page-not-found", type: "text/html", text: "Not found" },
    { error: new Error("Failed to read " + signed) },
    { url: resource + "?AWSAccessKeyId=fixture-id&Signature=private-test-value", type: "text/html", text: "" },
  ];
  t.mock.method(globalThis, "fetch", async url => {
    const response = responses.shift();
    if (response.error) throw response.error;
    return { url: response.url || url, status: 200, headers: new Headers({ "content-type": response.type }), text: async () => response.text };
  });

  await import("./regulator-census.mjs");
  const published = readFileSync(output, "utf8");
  const rows = Object.fromEntries(JSON.parse(published).targets.map(row => [row.id, row]));
  assert.equal(responses.length, 0);
  assert.equal(rows["gleif-lei"].final_url, null);
  assert.equal(rows["gleif-lei"].count.value, 42);
  assert.equal(rows["sec-edgar-companies"].final_url, ordinary);
  assert.equal(rows["ofac-sdn"].final_url, resource);
  assert.equal(rows["ofac-sdn"].state, "READABLE");
  assert.equal(rows["ofac-sdn"].count.value, 25000);
  assert.equal(rows["eu-ai-act-art71-db"].redirected_to_error_page, true);
  assert.equal(rows["esma-mica-register"].error, "Error: Failed to read " + resource);
  assert.equal(rows["ico-register"].final_url, resource);
  assert.doesNotMatch(published, /private-test-value|fixture-id|#fragment/i);
});
