import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs, ageDays, findModel, formatRow } from "../bin/csoai.mjs";

test("parseArgs: command + subject", () => {
  const o = parseArgs(["check", "qwen3:0.6b"]);
  assert.equal(o.command, "check");
  assert.equal(o.subject, "qwen3:0.6b");
  assert.equal(o.json, false);
});

test("parseArgs: flags", () => {
  const o = parseArgs(["--json", "--contains", "check", "qwen3"]);
  assert.equal(o.json, true);
  assert.equal(o.contains, true);
  assert.equal(o.subject, "qwen3");
});

test("ageDays: whole days, invalid date is null", () => {
  const now = Date.parse("2026-09-12T00:00:00Z");
  assert.equal(ageDays("2026-08-19T09:24:39Z", now), 23);
  assert.equal(ageDays("not-a-date", now), null);
});

const MATRIX = {
  models: [
    { id: "qwen3:0.6b" },
    { id: "qwen3:4b" },
    { id: "clan-csoai-plain:latest" },
  ],
  cells: [
    { model: "qwen3:0.6b", axis: "arc-30", accuracy: 0.714, created: "2026-08-19T09:24:39Z", card: "ab12", card_url: "/signed/cards/ab12.json" },
    { model: "qwen3:4b", axis: "gsm8k-30", accuracy: 0.5, created: "2026-08-19T09:24:39Z", card: "cd34", card_url: "/signed/cards/cd34.json" },
  ],
};

test("findModel: exact match wins", () => {
  const r = findModel(MATRIX, "qwen3:0.6b", false);
  assert.equal(r.model, "qwen3:0.6b");
  assert.equal(r.cells.length, 1);
});

test("findModel: no exact match without --contains fails closed with candidates", () => {
  const r = findModel(MATRIX, "qwen3", false);
  assert.equal(r.model, null);
  assert.deepEqual(r.candidates, ["qwen3:0.6b", "qwen3:4b", "clan-csoai-plain:latest"]);
});

test("findModel: --contains takes the first substring match", () => {
  const r = findModel(MATRIX, "qwen3", true);
  assert.equal(r.model, "qwen3:0.6b");
});

test("formatRow: null accuracy renders an em dash, not a zero", () => {
  const line = formatRow({ axis: "jail", accuracy: null, age: 24, state: "VALID" });
  assert.match(line, /—/);
  assert.match(line, /VALID/);
  assert.doesNotMatch(line, /0\.0%/);
});
