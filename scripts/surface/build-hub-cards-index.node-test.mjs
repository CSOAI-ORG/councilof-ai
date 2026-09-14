import { test } from "node:test";
import assert from "node:assert/strict";
import { rowFromCard } from "./build-hub-cards-index.mjs";

const base = {
  id: "a".repeat(64), signature: "ff",
  body: {
    model: "org/model", axis: "safety", n: 30, status: "MEASURED", run_id: "gha-7",
    evidence: { schema: "csoai.mill-item-evidence/0.2" },
    admission: { schema: "csoai.mill-evidence-admission/0.2", sha256: "b".repeat(64) },
  },
};

test("indexes only current admitted Hub cards", () => {
  assert.equal(rowFromCard("signed-safety-a.json", base).subject, "org/model");
  assert.equal(rowFromCard("x.json", { ...base, body: { ...base.body, model: "ollama:qwen:3b" } }), null);
  assert.equal(rowFromCard("x.json", { ...base, body: { ...base.body,
    evidence: { schema: "csoai.mill-item-evidence/0.1" } } }), null);
  assert.equal(rowFromCard("x.json", { ...base, body: { ...base.body, admission: undefined } }), null);
});
