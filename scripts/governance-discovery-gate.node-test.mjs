import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { checkFiles } from "./governance-discovery-gate.mjs";

const PUBLIC = resolve("public");
const FILES = [
  "governance/manifest.json",
  "governance/bundle-index.json",
  "governance/committee-registry.json",
  ".well-known/csoai-governance.json",
  "_headers",
];

function candidate(run) {
  const root = mkdtempSync(join(tmpdir(), "csoai-governance-"));
  try {
    for (const file of FILES) {
      const target = join(root, file);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, readFileSync(join(PUBLIC, file)));
    }
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("canonical source has Council board/root links, configured roles, JSON headers and bound bytes", () => {
  assert.deepEqual(checkFiles(PUBLIC), []);
});

test("HTML at a JSON route fails closed", () => candidate((root) => {
  writeFileSync(join(root, ".well-known/csoai-governance.json"), "<!doctype html><title>Home</title>");
  assert.match(checkFiles(root).join("\n"), /invalid JSON/);
}));

test("a stale bundle digest fails closed", () => candidate((root) => {
  writeFileSync(join(root, "governance/manifest.json"), "{}\n");
  assert.match(checkFiles(root).join("\n"), /bundle digest/);
}));

test("a missing JSON route fails closed", () => candidate((root) => {
  rmSync(join(root, "governance/manifest.json"));
  assert.match(checkFiles(root).join("\n"), /missing or invalid JSON/);
}));

test("a wrong media type fails closed", () => candidate((root) => {
  const file = join(root, "_headers");
  writeFileSync(file, readFileSync(file, "utf8").replace(
    "/governance/manifest.json\n  Content-Type: application/json; charset=utf-8",
    "/governance/manifest.json\n  Content-Type: text/html; charset=utf-8",
  ));
  assert.match(checkFiles(root).join("\n"), /application\/json Content-Type/);
}));

test("a claimed live site or second measurement authority fails closed", () => candidate((root) => {
  const file = join(root, "governance/manifest.json");
  const manifest = JSON.parse(readFileSync(file, "utf8"));
  manifest.sites[0].http_verified = true;
  manifest.components.gspc = "https://agisafe.ai/api/gspc";
  writeFileSync(file, JSON.stringify(manifest) + "\n");
  const issues = checkFiles(root).join("\n");
  assert.match(issues, /site row may configure a role, not assert deployment/);
  assert.match(issues, /gspc: canonical Council link mismatch/);
}));

test("a dead institutional evidence URL fails closed", () => candidate((root) => {
  const file = join(root, "governance/committee-registry.json");
  const committee = JSON.parse(readFileSync(file, "utf8"));
  committee.external_participation[0].evidence = "https://councilof.ai/institutional-record/";
  writeFileSync(file, JSON.stringify(committee) + "\n");
  assert.match(checkFiles(root).join("\n"), /missing institutional-record route/);
}));
