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
  assert.equal(output.records.length, 4);
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
test("rejects silent commercial acceptance promotion", () => {
  const fake = clone(); fake.records[0].buyer_acceptance = "ACCEPTED";
  assert.throws(() => validate(fake), /Unsupported acceptance/);
  fake.records[0].buyer_acceptance_receipt = "https://example.org/receipt";
  assert.throws(() => validate(fake), /Unsupported acceptance/);
});
test("rejects unreviewed event dates and unqualified evidence statuses", () => {
  const future = clone(); future.records[0].source_event_date = "2026-11-21";
  assert.throws(() => validate(future), /Unqualified/);
  const invented = clone(); invented.records[0].stage = "REGULATORY_ENDORSEMENT";
  assert.throws(() => validate(invented), /Unqualified/);
});
