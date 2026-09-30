import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const plugin = JSON.parse(fs.readFileSync("public/interop/chatgpt-plugin.json", "utf8"));
const catalogue = JSON.parse(fs.readFileSync("public/interop/ai-platform-plugins.json", "utf8"));
const wk = JSON.parse(fs.readFileSync("public/.well-known/index.json", "utf8"));

test("ChatGPT action descriptor is bounded to implemented public routes", () => {
  const paths = Object.keys(plugin.paths).sort();
  assert.deepEqual(paths, [
    "/gspc",
    "/measurement/fresh-capsule",
    "/report",
    "/state",
    "/verify",
    "/x402",
  ]);
  for (const missing of ["/measure", "/anchor", "/learn-loop"]) assert.equal(plugin.paths[missing], undefined);
  assert.match(plugin.info.description, /23-axis/);
  assert.match(plugin["x-csoai-boundary"], /does not establish installation/);
});

test("AI platform catalogue records publication state separately from adoption", () => {
  const rows = catalogue.platforms.flatMap((p) => p.manifests);
  assert.equal(rows.length, catalogue.measurement.total);
  assert.equal(rows.filter((r) => r.state === "PUBLISHED_READABLE").length, catalogue.measurement.published_readable);
  assert.equal(rows.filter((r) => r.state === "MISSING_404").length, catalogue.measurement.missing_404);
  assert.equal(catalogue.measurement.published_readable, 20);
  assert.equal(catalogue.measurement.missing_404, 4);
  assert.match(catalogue.measurement.boundary, /does not mean third-party adoption/);
});

test("well-known discovery copy never hardcodes the retired 22-axis count", () => {
  const agents = wk.doors.find((d) => d.slug === "agents");
  assert.ok(agents);
  assert.doesNotMatch(agents.description, /22-axis/);
  assert.match(agents.description, /current derived axis count/);
});
