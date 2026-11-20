// CITATION.cff names a byte copy of the board by url + sha256 (scripts/cite-byte-copy.mjs).
// Fail closed: at least one such identifier must exist, and each must reproduce from the file
// Pages serves at that url.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { byteCopies } from "../cite-byte-copy.mjs";

for (const f of ["CITATION.cff", "public/CITATION.cff"]) {
  test(`${f}: every byte-copy identifier reproduces its sha256`, () => {
    const copies = byteCopies(readFileSync(new URL(`../../${f}`, import.meta.url), "utf8"));
    assert.ok(copies.length >= 1, "no byte-copy identifier");
    for (const c of copies) {
      const p = new URL(`../../public${new URL(c.url).pathname}`, import.meta.url);
      assert.ok(existsSync(p), `${c.url} is not in public/`);
      const b = readFileSync(p);
      assert.equal(createHash("sha256").update(b).digest("hex"), c.sha256);
      assert.equal(b.length, c.bytes);
    }
  });
  test(`${f}: the Zenodo DOIs are kept and labelled unavailable; other DOIs are not`, () => {
    // Zenodo's records for CSOAI are unavailable since 29 Sep 2026, so each Zenodo DOI stays listed
    // and says so. A DOI from another registrar resolves and must not carry that label: #4557 added
    // the Hugging Face DataCite DOI 10.57967/hf/10114 (state findable), which this test used to
    // count as a Zenodo DOI missing its label.
    const cff = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
    const entries = cff.split(/\n\s*- type: /).slice(1).filter((e) => e.startsWith("doi"));
    assert.ok(entries.length >= 1);
    assert.ok(entries.some((e) => /value:\s*"10\.5281\/zenodo\./.test(e)), "no Zenodo DOI kept");
    for (const e of entries) {
      const zenodo = /value:\s*"10\.5281\/zenodo\./.test(e);
      assert.equal(/Zenodo record unavailable/.test(e), zenodo, e.split("\n")[1]);
    }
  });
}
