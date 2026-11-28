import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render, validate } from "./build-external-use-feed.mjs";

const current = JSON.parse(readFileSync(new URL("../client/src/data/external-use-reviewed.json", import.meta.url), "utf8"));
const clone = () => JSON.parse(JSON.stringify(current));

test("one reviewed set produces deterministic, source-linked public output", () => {
  const output = JSON.parse(render(current));
  assert.equal(output.kind, "csoai.public-external-evidence/0.1");
  assert.equal(output.not_a_census, true);
  assert.equal(output.qualification, "OWNER_REVIEWED_SOURCE_ONLY");
  assert.equal(output.records.length, 5);
  assert.ok(output.navigation.some(route => route.role === "execution_boundary" && route.state === "GET_DOCUMENTATION_ONLY_POST_NOT_INVOKED"));
  assert.ok(output.navigation.some(route => route.role === "artifact_verification" && route.state === "USER_SUPPLIED_RECORD_REQUIRED"));
  assert.ok(output.records.every(r => r.buyer_acceptance === "NOT_ESTABLISHED" && r.repeat_use === "NOT_ESTABLISHED"));
  assert.equal(render(current), render(current));
  const committed = readFileSync(new URL("../public/interop/external-use.json", import.meta.url), "utf8");
  assert.equal(committed, render(current), "Committed public feed must exactly match reviewed source");
});
test("rejects duplicate or missing-source observations", () => {
  const dup = clone(); dup.records[1].id = dup.records[0].id;
  assert.throws(() => validate(dup), /Duplicate/);
  const missing = clone(); missing.records[0].sources = [];
  assert.throws(() => validate(missing), /No sources/);
});
test("a self-hosted reference alone cannot masquerade as external use", () => {
  const selfOnly = clone();
  selfOnly.records[0].sources = [{ label: "Self reference", href: "https://github.com/CSOAI-ORG/councilof-ai/issues/1" }];
  assert.throws(() => validate(selfOnly), /No independently hosted source/);
});
test("known related-operator aliases cannot qualify as the sole external source", () => {
  for (const href of [
    "https://proofof.ai/scorecard/example",
    "https://api.meok.ai/example",
    "https://csoai.org./example",
    "https://github.com/Council-of-AI-CSOAI-org/repo",
    "https://github.com/%43SOAI-ORG/repo",
    "https://raw.githubusercontent.com/CSOAI-ORG/repo/master/README.md",
    "https://huggingface.co/datasets/CSOAI/example",
    "https://huggingface.co/spaces/MEOK/example",
  ]) {
    const data = clone();
    data.records[0].sources = [{ label: "Related operator", href }];
    assert.throws(() => validate(data), /No independently hosted source/, href);
  }
});
test("a related-operator link can supplement a reviewed outside source", () => {
  const data = clone();
  data.records[0].sources.push({ label: "Operator reference", href: "https://proofof.ai/example" });
  assert.doesNotThrow(() => validate(data));
});
test("rejects silent commercial acceptance promotion", () => {
  const fake = clone(); fake.records[0].buyer_acceptance = "ACCEPTED";
  assert.throws(() => validate(fake), /Unsupported acceptance/);
  fake.records[0].buyer_acceptance_receipt = "https://example.org/receipt";
  assert.throws(() => validate(fake), /Unsupported acceptance/);
});
test("rejects unreviewed event dates and unqualified evidence statuses", () => {
  const future = clone(); future.records[0].source_event_date = "2026-11-28";
  assert.throws(() => validate(future), /Unqualified/);
  const invented = clone(); invented.records[0].stage = "REGULATORY_ENDORSEMENT";
  assert.throws(() => validate(invented), /Unqualified/);
});
