// build-models-measured.mjs: the model count on the home page, derived from the signed cards.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { derive, normalise, kindOf, UNPUBLISHABLE_NAME } from "./build-models-measured.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

test("normalise strips only the runtime wrapper", () => {
  assert.equal(normalise("ollama:mistral:7b@sha256:6577803aa9a036369e481d648a2baebb381ebc6e897f2bb9a766a2aa7bfbc1cf"), "mistral:7b");
  assert.equal(normalise("t4:Qwen/Qwen2.5-0.5B-Instruct"), "Qwen/Qwen2.5-0.5B-Instruct");
  assert.equal(normalise("clan-law-plain:latest"), "clan-law-plain");
  // A quantised Ollama tag and an HF repo stay two models.
  assert.notEqual(normalise("ollama:mistral:7b@sha256:ab12ab12ab12ab12ab12"), normalise("mistralai/Mistral-7B-Instruct-v0.2"));
  assert.equal(normalise(undefined), null);
});

test("our own models are classed by the own-model disclosure rules, never as third-party", () => {
  assert.equal(kindOf("sov34:latest"), "own");
  assert.equal(kindOf("clan-meok-plain:latest"), "own");
  assert.equal(kindOf("council-safe:latest"), "own");
  assert.equal(kindOf("muse-glimmer:latest"), "own_unconfirmed");
  assert.equal(kindOf("meta-llama/Llama-3.1-8B-Instruct"), "third_party");
});

test("the derived file is current, self-consistent, and publishes no codename", () => {
  const doc = derive();
  const onDisk = JSON.parse(readFileSync(join(ROOT, "public/interop/models-measured.json"), "utf8"));
  assert.deepEqual(onDisk, doc, "public/interop/models-measured.json is stale; run node scripts/build-models-measured.mjs");
  const third = doc.models.filter((m) => m.kind === "third_party").length;
  assert.equal(doc.headline.third_party_models, third);
  assert.equal(doc.headline.own_models_excluded, doc.models.filter((m) => m.kind === "own").length);
  assert.ok(third > 14, "the model count must not collapse to the model-comparison axis count");
  assert.equal(doc.sources.mill_cards_signed.cards_not_counted.signature_not_valid, 0);
  for (const m of doc.models) {
    assert.ok(!UNPUBLISHABLE_NAME.test(m.id), `codename in id ${m.id}`);
    for (const r of m.recorded_as) assert.ok(!UNPUBLISHABLE_NAME.test(r), `codename in ${r}`);
  }
  const ids = new Set(doc.models.map((m) => m.id));
  assert.equal(ids.size, doc.models.length, "a model is listed twice");
});
