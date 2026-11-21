import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const here = (p) => fileURLToPath(new URL(p, import.meta.url));

test("declared Apache-2.0 npm package ships its licence", () => {
  const pkg = JSON.parse(readFileSync(here("./package.json"), "utf8"));
  const lic = readFileSync(here("./LICENSE"), "utf8");
  const canonical = readFileSync(here("../../scripts/spray/pypi/csoai-gspc/LICENSE"), "utf8");
  assert.equal(pkg.license, "Apache-2.0");
  assert.ok(pkg.files.includes("LICENSE"), "npm files allowlist must include LICENSE");
  assert.ok(lic.includes("Apache License") && lic.includes("Version 2.0, January 2004"));
  assert.equal(lic, canonical, "npm-local licence must match existing canonical Apache text");
});

test("MIT repository root and Apache plugin have explicit boundary", () => {
  const root = readFileSync(here("../../LICENSE"), "utf8");
  const plugin = JSON.parse(readFileSync(here("../../plugins/gspc/plugin.json"), "utf8"));
  const pluginLicence = readFileSync(here("../../plugins/gspc/LICENSE"), "utf8");
  assert.ok(root.startsWith("MIT License"));
  assert.equal(plugin.license, "Apache-2.0");
  assert.equal(pluginLicence, readFileSync(here("./LICENSE"), "utf8"));
});
