import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveAll, rewriteModule } from "./derive-fin-run-attestation.mjs";

const MODULE_WITH_TWO_AXES = `export const AXES_FIN: AxisScore[] = [
  {
    axis: "provenance-controls", family: "financial", kind: "deterministic-facts",
    evidence_url: "/interop/financial-measure-run-v2.json",
    run_attestation: "ED25519_SIGNED",
    colour: "#fbbf24", hue: 43,
  },
  {
    axis: "reserve-attestation", family: "financial", kind: "deterministic-facts",
    evidence_url: "/interop/financial-measure-run-reserve-attestation.json",
    run_attestation: "CONTENT_ADDRESSED_UNSIGNED",
    colour: "#fbbf24", hue: 43,
  },
];
`;

const FIXTURES = {
  "interop/financial-measure-run-v2.json": JSON.stringify({
    schema: "csoai.fin-run/1", signature: "eyJhbGciOiJFZERTQSJ9.payload",
  }),
  "interop/financial-measure-run-reserve-attestation.json": JSON.stringify({
    schema: "csoai.fin-run/1", // no signature: content-addressed, unsigned
  }),
};

async function fixturePublicDir() {
  const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "fin-att-"));
  for (const [p, body] of Object.entries(FIXTURES)) {
    mkdirSync(join(dir, p.split("/").slice(0, -1).join("/")), { recursive: true });
    writeFileSync(join(dir, p), body);
  }
  return dir;
}

test("a signed artefact derives ED25519_SIGNED; an unsigned one derives CONTENT_ADDRESSED_UNSIGNED", async () => {
  const derived = deriveAll(MODULE_WITH_TWO_AXES, await fixturePublicDir());
  assert.equal(derived["provenance-controls"].state, "ED25519_SIGNED");
  assert.equal(derived["reserve-attestation"].state, "CONTENT_ADDRESSED_UNSIGNED");
});

test("a missing artefact is unsigned, never an invented state", async () => {
  const { mkdtempSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const empty = mkdtempSync(join(tmpdir(), "fin-att-empty-"));
  const derived = deriveAll(MODULE_WITH_TWO_AXES, empty);
  assert.equal(derived["provenance-controls"].state, "CONTENT_ADDRESSED_UNSIGNED");
  assert.equal(derived["reserve-attestation"].state, "CONTENT_ADDRESSED_UNSIGNED");
});

test("a structured (object) signature counts as signed — the v2 artefact ships one", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "fin-att-obj-"));
  mkdirSync(join(dir, "interop"), { recursive: true });
  writeFileSync(
    join(dir, "interop/financial-measure-run-v2.json"),
    JSON.stringify({ signature: { alg: "EdDSA", key: "board-1", value: "c2ln" } }),
  );
  writeFileSync(
    join(dir, "interop/financial-measure-run-reserve-attestation.json"),
    JSON.stringify({ signature: {} }), // an EMPTY object signature is not a signature
  );
  const derived = deriveAll(MODULE_WITH_TWO_AXES, dir);
  assert.equal(derived["provenance-controls"].state, "ED25519_SIGNED");
  assert.equal(derived["reserve-attestation"].state, "CONTENT_ADDRESSED_UNSIGNED");
});

test("an unparsable artefact is unsigned, never an invented state", async () => {
  const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const dir = mkdtempSync(join(tmpdir(), "fin-att-bad-"));
  mkdirSync(join(dir, "interop"), { recursive: true });
  writeFileSync(join(dir, "interop/financial-measure-run-v2.json"), "{not json");
  const derived = deriveAll(MODULE_WITH_TWO_AXES, dir);
  assert.equal(derived["provenance-controls"].state, "CONTENT_ADDRESSED_UNSIGNED");
});

test("rewrite flips only the disagreeing axis and leaves every other byte alone", async () => {
  // The module claims reserve-attestation is SIGNED; the artefact bytes say unsigned.
  const stale = MODULE_WITH_TWO_AXES.replace(
    'run_attestation: "CONTENT_ADDRESSED_UNSIGNED",\n    colour: "#fbbf24", hue: 43,\n  },\n];',
    'run_attestation: "ED25519_SIGNED",\n    colour: "#fbbf24", hue: 43,\n  },\n];',
  );
  const derived = deriveAll(MODULE_WITH_TWO_AXES, await fixturePublicDir());
  const { source, changed } = rewriteModule(stale, derived);
  assert.equal(changed, 1);
  assert.match(source, /axis: "reserve-attestation"[\s\S]*?run_attestation: "CONTENT_ADDRESSED_UNSIGNED"/);
  assert.match(source, /run_attestation: "ED25519_SIGNED"/); // provenance-controls untouched
});

test("rewrite is idempotent on an agreeing module", async () => {
  const derived = deriveAll(MODULE_WITH_TWO_AXES, await fixturePublicDir());
  const once = rewriteModule(MODULE_WITH_TWO_AXES, derived);
  assert.equal(once.changed, 0);
  const twice = rewriteModule(once.source, derived);
  assert.equal(twice.changed, 0);
  assert.equal(twice.source, MODULE_WITH_TWO_AXES);
});
