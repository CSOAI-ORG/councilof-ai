// node --test scripts/pubbus/ld.node-test.mjs
// Dataset JSON-LD for the evidence pages: offline, against fixture pages and a fixture Hub.
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLd, datasetLicenses, ldBlock, licenseUrl, versionDatasetLd, seriesDatasetLd, withLd, LD_OPEN } from "./ld.mjs";
import { visibleText } from "./lib.mjs";

const entry = {
  slug: "fixture-census",
  dataset: "fixture-census",
  title: "csoai/fixture-census",
  page_index: "/evidence/fixture-census/",
  versions: [
    {
      version: "2026-09-25-aaaaaaaaaaaa", page: "/evidence/fixture-census/2026-09-25-aaaaaaaaaaaa/", state: "CURRENT",
      as_of: "2026-09-25T06:54:10Z", record_sha256: "a".repeat(64), signed_sha256: "b".repeat(64),
      artifact_path: "record.json", signed_path: "record.signed.json",
      record_url: "https://huggingface.co/datasets/csoai/fixture-census/resolve/" + "c".repeat(40) + "/record.json",
      signed_url: "https://huggingface.co/datasets/csoai/fixture-census/resolve/" + "c".repeat(40) + "/record.signed.json",
    },
  ],
};
const page = "<!doctype html>\n<html><head><title>t</title>\n</head><body><main><p>visible 4144</p></main></body></html>\n";
const blocks = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));

test("version node carries the Dataset fields dataset search reads, copied from the manifest", () => {
  const n = versionDatasetLd(entry, entry.versions[0], "cc-by-4.0");
  assert.equal(n["@type"], "Dataset");
  assert.ok(n.name && n.description.length >= 50 && n.description.length <= 5000);
  assert.equal(n.url, "https://councilof.ai/evidence/fixture-census/2026-09-25-aaaaaaaaaaaa/");
  assert.equal(n.license, "https://creativecommons.org/licenses/by/4.0/");
  assert.equal(n.sameAs, "https://huggingface.co/datasets/csoai/fixture-census");
  assert.equal(n.subjectOf.url, "https://huggingface.co/api/datasets/csoai/fixture-census/croissant");
  assert.deepEqual(n.distribution.map((d) => d.contentUrl), [entry.versions[0].record_url, entry.versions[0].signed_url]);
  assert.equal(n.identifier, "sha256:" + "a".repeat(64));
});

test("an unknown or absent licence id is left out, never guessed", () => {
  assert.equal(licenseUrl("other"), null);
  assert.equal(licenseUrl(undefined), null);
  assert.equal("license" in versionDatasetLd(entry, entry.versions[0], null), false);
  assert.equal("license" in seriesDatasetLd(entry, "some-custom-licence"), false);
});

test("the block is idempotent, sits in <head>, and adds no visible text", () => {
  const b = ldBlock(versionDatasetLd(entry, entry.versions[0], "cc0-1.0"), entry.dataset);
  const once = withLd(page, b);
  assert.equal(withLd(once, b), once);
  assert.equal(once.split(LD_OPEN).length, 2);
  assert.ok(once.indexOf(LD_OPEN) < once.indexOf("</head>"));
  assert.equal(visibleText(once), visibleText(page));
  assert.equal(blocks(once)[0].license, "https://creativecommons.org/publicdomain/zero/1.0/");
  assert.match(once, /<link rel="alternate" type="application\/ld\+json" title="Croissant metadata \(Hugging Face\)" href="https:\/\/huggingface\.co\/api\/datasets\/csoai\/fixture-census\/croissant">/);
});

test("a '<' in a value cannot close the script element", () => {
  const e2 = { ...entry, title: "x</script><b>y" };
  const html = withLd(page, ldBlock(seriesDatasetLd(e2, "mit"), entry.dataset));
  assert.equal(blocks(html)[0].name, "x</script><b>y — signed evidence records");
  assert.equal((html.match(/<\/script>/g) || []).length, 1);
});

test("an unread licence leaves every page as it is; a read one writes both pages", async () => {
  const files = new Map([
    ["public/evidence/fixture-census/index.html", page],
    ["public/evidence/fixture-census/2026-09-25-aaaaaaaaaaaa/index.html", page],
  ]);
  const io = {
    exists: (r) => files.has(r),
    read: (r) => files.get(r),
    writeIfChanged: (r, t) => (files.get(r) === t ? false : (files.set(r, t), true)),
  };
  const down = await datasetLicenses(async () => ({ status: 503, bytes: Buffer.alloc(0) }), ["fixture-census"]);
  assert.deepEqual(applyLd([entry], down, io), []);
  const up = await datasetLicenses(async () => ({ status: 200, bytes: Buffer.from(JSON.stringify({ cardData: { license: "cc-by-4.0" } })) }), ["fixture-census"]);
  assert.deepEqual(applyLd([entry], up, io).sort(), ["/evidence/fixture-census/", "/evidence/fixture-census/2026-09-25-aaaaaaaaaaaa/"]);
  assert.deepEqual(applyLd([entry], up, io), []);
  const series = blocks(files.get("public/evidence/fixture-census/index.html"))[0];
  assert.equal(series.hasPart[0]["@id"], "https://councilof.ai/evidence/fixture-census/2026-09-25-aaaaaaaaaaaa/#dataset");
});
