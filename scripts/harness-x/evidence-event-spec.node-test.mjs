import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { ROOT, SOURCE, DESTINATION, derive, render } from "../build-evidence-event-spec.mjs";

test("the published schema retains its exact source bytes and resolvable identity", () => {
  const outputs = derive();
  const bytes = outputs.get(`${DESTINATION}/schema.json`);
  assert.deepEqual(bytes, fs.readFileSync(path.join(ROOT, SOURCE)));
  assert.equal(JSON.parse(bytes).$id, "https://councilof.ai/spec/evidence-event/v0.1/schema.json");
  const html = outputs.get(`${DESTINATION}/index.html`).toString();
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.match(html, /href="https:\/\/councilof\.ai\/spec\/evidence-event\/v0\.1\/schema\.json"/);
  assert.match(html, /Schema validation alone does not perform those checks/);
});

test("the build check rejects missing or changed published artifacts", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "evidence-event-spec-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.dirname(path.join(root, SOURCE)), { recursive: true });
  fs.copyFileSync(path.join(ROOT, SOURCE), path.join(root, SOURCE));
  assert.throws(() => render(root, true), /publication drift/);
  render(root);
  assert.equal(render(root, true).state, "SOURCE_PARITY_VERIFIED");
  fs.appendFileSync(path.join(root, DESTINATION, "schema.json"), " ");
  assert.throws(() => render(root, true), /publication drift/);
  render(root);
  fs.appendFileSync(path.join(root, DESTINATION, "index.html"), "changed");
  assert.throws(() => render(root, true), /publication drift/);
});
