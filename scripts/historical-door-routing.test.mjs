import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash, createPublicKey, verify } from "node:crypto";

const REPO = path.resolve(process.env.ROUTING_REVIEW_ROOT || path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
const { appRoutes, functionRoutes, isServed, linksIn, readRedirects, redirectTarget } =
  await import(pathToFileURL(path.join(REPO, "scripts/link-gate.mjs")).href);
const { check } = await import(pathToFileURL(path.join(REPO, "scripts/redirects-guard.mjs")).href);
const read = p => readFileSync(path.join(REPO, p));
const json = p => JSON.parse(read(p));
const appPaths = appRoutes(REPO);
const functionPaths = functionRoutes(path.join(REPO, "functions"));
const routes = new Set([...functionPaths, ...appPaths]);
const redirects = readRedirects(REPO);
const options = { appPaths, functionPaths, mirrorFiles: new Set() };
const physicalAssets = new Set();
function walk(dir, prefix = "") {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + "/" + entry.name;
    if (entry.isDirectory()) walk(path.join(dir, entry.name), rel);
    else if (entry.isFile()) physicalAssets.add(rel);
  }
}
walk(path.join(REPO, "public"));
const pack = "/packs/eu-article-50";
const names = ["article50_oscal.body", "article50_oscal.json", "article50_oscal.sig.json",
  "provbench.body", "provbench.json", "provbench.sig.json"];

test("the retained Article 50 reference reaches its declared evidence page", () => {
  const challenge = json("public/interop/x402-door-conformance-2026-09/mirrors/door-5-challenge.json");
  const ref = linksIn(challenge).find(r => r.at === "csoai.preview.obligation.existing_pack");
  assert.ok(ref);
  assert.equal(new URL(ref.url).pathname, pack);
  assert.ok(appPaths.has(pack));
  for (const route of [pack, pack + "/"])
    assert.equal(isServed(route, physicalAssets, routes, redirects, options), true);
});

test("the retained withdrawn-pricing reference redirects to the current free-rail explainer", () => {
  const audit = json("public/interop/x402-ref-audit-2026-09-05.json");
  const ref = linksIn(audit).find(r => r.at === "rows[15].ref");
  assert.ok(ref);
  assert.equal(new URL(ref.url).pathname, "/pricing-free");
  for (const route of ["/pricing-free", "/pricing-free/"]) {
    assert.deepEqual(redirectTarget(route, redirects, true), {
      to: "/dashboard/?tab=measured&task=pricing-overview", status: "302"
    });
    assert.equal(isServed(route, physicalAssets, routes, redirects, options), true);
  }
  assert.ok(json("client/src/data/publication-state.json").withdrawn_routes.includes("/pricing-free"));
});

test("all six existing pack files remain available as physical evidence assets", () => {
  for (const name of names) {
    const route = pack + "/" + name;
    assert.ok(physicalAssets.has(route), "missing original pack file: " + route);
    assert.equal(isServed(route, physicalAssets, routes, redirects, options), true, route);
  }
});

test("pack bodies still match and verify against their existing detached signatures", () => {
  const pinnedKey = "ZnF3DZUFc5QOoy+y07rvzNUyxJgza2kUQmn1nv4S9SY=";
  for (const name of ["article50_oscal", "provbench"]) {
    const body = read("public" + pack + "/" + name + ".body");
    const sidecar = json("public" + pack + "/" + name + ".sig.json");
    assert.equal(sidecar.pubkey_b64, pinnedKey);
    assert.equal(createHash("sha256").update(body).digest("hex"), sidecar.body_sha256);
    const key = createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(pinnedKey, "base64")]),
      type: "spki", format: "der"
    });
    const sig = Buffer.from(sidecar.sig_b64, "base64");
    assert.equal(verify(null, body, key, sig), true, name);
    const altered = Buffer.from(body); altered[0] ^= 1;
    assert.equal(verify(null, altered, key, sig), false, name + " altered body");
  }
});

test("unknown pack pages and missing evidence cannot borrow an app page", () => {
  for (const route of ["/packs/missing-page", pack + "/missing.json", pack + "/missing.body", "/unknown-route"])
    assert.equal(isServed(route, physicalAssets, routes, redirects, options), false, route);
  for (const name of names) {
    const route = pack + "/" + name;
    const missing = new Set(physicalAssets); missing.delete(route);
    assert.equal(isServed(route, missing, routes, redirects, options), false, route);
  }
  const missingPage = new Set(appPaths); missingPage.delete(pack);
  assert.equal(isServed(pack, physicalAssets, new Set([...functionPaths, ...missingPage]), redirects,
    { ...options, appPaths: missingPage }), false);
});

test("the actual redirect file has no new rejected, duplicate or over-budget rule", () => {
  const result = check(read("public/_redirects").toString("utf8"));
  assert.deepEqual(result.errs, []);
  assert.ok(result.staticCount <= 2000);
  assert.ok(result.dynamicCount <= 100);
  assert.equal(result.truncatedAtLine, null);
  assert.ok(result.invalid.every(r => r.kind === "infinite-loop" && r.line.split(/\s+/)[0] === "/*"));
});
