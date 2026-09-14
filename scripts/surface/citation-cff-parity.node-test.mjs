// CITATION.cff lives at the repository root (GitHub's "Cite this repository") and must also be
// served at https://councilof.ai/CITATION.cff, which Pages only does for files under public/.
// PR #2359 added the root file only, so the served URL answered 404. The two copies must be identical.
import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

const root = readFileSync(new URL("../../CITATION.cff", import.meta.url), "utf8");
const served = readFileSync(new URL("../../public/CITATION.cff", import.meta.url), "utf8");

test("served CITATION.cff is byte-identical to the repository root copy", () => {
  assert.equal(served, root);
});

test("CITATION.cff declares the CFF format and names the publisher", () => {
  assert.match(root, /^cff-version:\s*\d/m);
  assert.match(root, /CSOAI|Council of AI/);
});
