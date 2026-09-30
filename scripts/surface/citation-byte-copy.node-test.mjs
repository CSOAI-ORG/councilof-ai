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
  test(`${f}: the DOIs are kept and labelled unavailable`, () => {
    const cff = readFileSync(new URL(`../../${f}`, import.meta.url), "utf8");
    const dois = cff.match(/- type: doi/g) ?? [];
    assert.ok(dois.length >= 1);
    const unavailable = cff.match(/Zenodo record unavailable/g) ?? [];
    assert.equal(unavailable.length, dois.length);
  });
}
