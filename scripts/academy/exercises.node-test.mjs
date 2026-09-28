// SPDX-License-Identifier: CC0-1.0
// node --test scripts/academy/exercises.node-test.mjs
// Offline: no network. Live behaviour is the runner itself (node public/academy/exercises/run-exercises.mjs).
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIR = join(ROOT, "public/academy/exercises");
const runner = await import(pathToFileURL(join(DIR, "run-exercises.mjs")).href);
const builder = await import(pathToFileURL(join(ROOT, "scripts/academy/build-exercises.mjs")).href);
const page = readFileSync(join(DIR, "index.html"), "utf8");
const manifest = JSON.parse(readFileSync(join(DIR, "exercises.json"), "utf8"));
const meta = runner.exerciseMetadata();
const sha = (b) => createHash("sha256").update(b).digest("hex");

const visible = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ");

test("page and manifest are exactly what the producer writes from the runner", async () => {
  const out = await builder.build();
  assert.equal(readFileSync(join(DIR, "exercises.json"), "utf8"), out.json, "exercises.json is stale: node scripts/academy/build-exercises.mjs");
  assert.equal(page, out.html, "index.html is stale: node scripts/academy/build-exercises.mjs");
});

test("every exercise is a complete, reproducible exercise", () => {
  const ids = meta.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate exercise id");
  for (const e of meta) {
    for (const k of ["title", "teaches", "expected", "control"]) assert.ok(typeof e[k] === "string" && e[k].length > 20, `${e.id}.${k}`);
    assert.ok(e.steps.length >= 2, `${e.id} has steps`);
    assert.ok(e.inputs.length >= 1 && e.tools.length >= 1, `${e.id} names its inputs and tools`);
    assert.ok(Number.isInteger(e.minutes) && e.minutes > 0, `${e.id}.minutes`);
    assert.ok(e.realises.length >= 1, `${e.id} realises a module`);
    assert.match(page, new RegExp(`id="${e.id}"`), `${e.id} has an anchor on the page`);
  }
  assert.deepEqual(manifest.exercises.map((e) => e.id), ids);
  // The verify tools the course is built on are all exercised.
  const tools = meta.flatMap((e) => e.tools).join(" ");
  for (const t of ["verify_card", "verify_inclusion", "charter.json"]) assert.ok(tools.includes(t), `no exercise uses ${t}`);
});

test("every exercise realises a module the inventory knows", () => {
  const inv = join(ROOT, "council-os/academy/module-inventory.json");
  if (!existsSync(inv)) return; // the inventory lives outside some sparse checkouts
  const known = new Set(JSON.parse(readFileSync(inv, "utf8")).surfaces.flatMap((s) => s.modules.map((m) => m.id)));
  for (const e of meta) for (const m of e.realises) assert.ok(known.has(m), `${e.id} realises unknown module ${m}`);
});

test("no typed counts, prices or certificate offers in the course copy", () => {
  const texts = { page: visible(page), manifest: JSON.stringify(manifest) };
  for (const [name, t] of Object.entries(texts)) {
    assert.doesNotMatch(t, /\b\d[\d,]*\s+(?:axes|axis|slots|cards|measured|leaves)\b/i, `${name} types a count`);
    assert.doesNotMatch(t, /[$€£]\s?\d/, `${name} states a price`);
    assert.doesNotMatch(t, /\bcertificates?\b|\bcertified\b|\bget certified\b/i, `${name} uses certificate wording`);
    for (const m of t.matchAll(/\bcertif\w*/gi)) {
      const around = t.slice(Math.max(0, m.index - 40), m.index + 30);
      assert.match(around, /certifies nothing|not_a_certification/i, `${name}: "${around}"`);
    }
  }
});

test("the LRMI / schema.org block describes the course the page lists", () => {
  const m = page.match(/<script type="application\/ld\+json">\n([\s\S]*?)\n<\/script>/);
  assert.ok(m, "no JSON-LD block");
  const ld = JSON.parse(m[1]);
  assert.equal(ld["@type"], "Course");
  assert.equal(ld.isAccessibleForFree, true);
  assert.equal(ld.offers, undefined, "a free course carries no offer or price");
  assert.equal(ld.provider["@id"], "https://councilof.ai/#org");
  assert.deepEqual(ld.hasPart.map((p) => p["@id"].split("#")[1]), meta.map((e) => e.id));
  for (const p of ld.hasPart) assert.equal(p.learningResourceType, "Exercise");
  assert.match(ld.timeRequired, /^PT\d+M$/);
});

test("the result digest rule matches Python json.dumps(sort_keys=True, separators=(',',':'))", async () => {
  const bytes = runner.resultBytes("card_chain.bodies_verified_valid", 7);
  assert.equal(new TextDecoder().decode(bytes), '{"measurement":"card_chain.bodies_verified_valid","value":7}');
  assert.equal(await runner.sha256Hex(bytes), sha(bytes));
});

test("Rule A keeps integral floats as CPython wrote them", () => {
  const raw = '{"b":0.0,"a":[1.0,2,"é"],"c":{"z":1e-06,"y":null}}';
  const text = new TextDecoder().decode(runner.canonA(runner.parsePreservingNumbers(raw)));
  assert.equal(text, '{"a":[1.0,2,"\\u00e9"],"b":0.0,"c":{"y":null,"z":1e-06}}');
});

test("a published card verifies offline under its pinned key, and a tampered copy does not", async () => {
  const index = JSON.parse(readFileSync(join(ROOT, "public/signed/card_index.json"), "utf8"));
  const row = index.cards.find((c) => c.card === index.head) || index.cards[0];
  const path = join(ROOT, "public", row.card_url);
  if (!existsSync(path)) return; // sparse checkout without card bodies
  const card = runner.parsePreservingNumbers(readFileSync(path, "utf8"));
  const good = await runner.verifyCardParsed(card, index.pubkey);
  assert.deepEqual(good, { state: "VALID", reason: null });
  const tampered = runner.parsePreservingNumbers(readFileSync(path, "utf8"));
  const k = Object.keys(tampered.body).sort().find((key) => typeof tampered.body[key] === "string");
  tampered.body[k] += ".";
  assert.equal((await runner.verifyCardParsed(tampered, index.pubkey)).state, "INVALID");
  assert.equal((await runner.verifyCardParsed(card, "00".repeat(32))).state, "INVALID", "a key other than the pinned one must fail");
});

// ------------------------------------------------ the harness, against the real shapes, offline

function fakeEdge(routes) {
  return async (url) => {
    const u = new URL(url);
    const hit = routes[u.pathname + u.search] ?? routes[u.pathname];
    if (hit === undefined) return new Response("not found", { status: 404 });
    if (hit instanceof Response) return hit;
    return new Response(typeof hit === "string" ? hit : JSON.stringify(hit), { status: 200, headers: { "content-type": "application/json" } });
  };
}
const H = (s) => sha(Buffer.from(s));
function tree(leaves) {
  // root.json node rule: parent = sha256(left || right) over raw digests; odd node paired with itself.
  let level = leaves.map((l) => Buffer.from(l, "hex"));
  const levels = [level];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) next.push(createHash("sha256").update(Buffer.concat([level[i], level[i + 1] ?? level[i]])).digest());
    levels.push((level = next));
  }
  const proof = (i) => levels.slice(0, -1).map((lv, d) => { const j = (i >> d) ^ 1; return (lv[j] ?? lv[i >> d]).toString("hex"); });
  return { root: level[0].toString("hex"), proof };
}

test("inclusion: REPRODUCED against a well-formed root, with a discriminating control", async () => {
  const leaves = [H("a"), H("b"), H("c")];
  const t = tree(leaves);
  const routes = { "/root.json": { card_sha256: leaves, card_count: 3, merkle_root: t.root, as_of: "fixture" } };
  leaves.forEach((l, i) => { routes[`/api/proof?sha=${l}`] = { index: i, proof: t.proof(i), merkle_root: t.root, card_count: 3 }; });
  const ex = runner.EXERCISES.find((e) => e.id === "inclusion");
  for (const leafIndex of [0, 1, 2]) {
    const r = await runner.runExercise(ex, { edge: "https://fixture.invalid", fetchImpl: fakeEdge({ ...routes, "/mcp": new Response('{"result":{"structuredContent":{"state":"VALID"}}}') }), leafIndex });
    assert.equal(r.state, "REPRODUCED", `leaf ${leafIndex}: ${r.reason}`);
    assert.equal(r.control.discriminates, true);
  }
});

test("inclusion: a root whose leaf list disagrees with card_count is NOT_REPRODUCED", async () => {
  const leaves = [H("a"), H("b"), H("c")];
  const t = tree(leaves);
  const fetchImpl = fakeEdge({ "/root.json": { card_sha256: leaves, card_count: 4, merkle_root: t.root } });
  const r = await runner.runExercise(runner.EXERCISES.find((e) => e.id === "inclusion"), { edge: "https://fixture.invalid", fetchImpl, leafIndex: 0 });
  assert.equal(r.state, "NOT_REPRODUCED");
});

test("charter-hash: equal digests reproduce, a different document does not", async () => {
  const doc = '{"charter":"fixture"}\n';
  const pointer = (digest) => ({ current: { machine: "https://fixture.invalid/charter.json", version: "0.1.0", sha256: digest } });
  const ex = runner.EXERCISES.find((e) => e.id === "charter-hash");
  const ok = await runner.runExercise(ex, { edge: "https://fixture.invalid", fetchImpl: fakeEdge({ "/.well-known/charter.json": pointer(H(doc)), "/charter.json": doc }) });
  assert.equal(ok.state, "REPRODUCED", ok.reason);
  const bad = await runner.runExercise(ex, { edge: "https://fixture.invalid", fetchImpl: fakeEdge({ "/.well-known/charter.json": pointer(H("other")), "/charter.json": doc }) });
  assert.equal(bad.state, "NOT_REPRODUCED");
  assert.notEqual(bad.yours_sha256, bad.published_sha256);
});

test("a refused read is UNCHECKABLE, never NOT_REPRODUCED", async () => {
  const fetchImpl = fakeEdge({ "/api/gspc": new Response("forbidden", { status: 403 }) });
  const r = await runner.runExercise(runner.EXERCISES.find((e) => e.id === "board-totals"), { edge: "https://fixture.invalid", fetchImpl });
  assert.equal(r.state, "UNCHECKABLE");
  assert.match(r.reason, /403/);
});

test("board-totals: counts derived from the rows must equal the totals", async () => {
  const axes = [{ status: "MEASURED" }, { status: "MEASURED" }, { status: "UNMEASURED" }];
  const ex = runner.EXERCISES.find((e) => e.id === "board-totals");
  const mcp = () => new Response('{"result":{"structuredContent":{"counts":[]}}}');
  const agree = await runner.runExercise(ex, { edge: "https://fixture.invalid", fetchImpl: fakeEdge({ "/api/gspc": { axes, totals: { axes: 3, measured_axes: 2, public_count: "fixture" } }, "/mcp": mcp() }) });
  assert.equal(agree.state, "REPRODUCED", agree.reason);
  const typed = await runner.runExercise(ex, { edge: "https://fixture.invalid", fetchImpl: fakeEdge({ "/api/gspc": { axes, totals: { axes: 3, measured_axes: 3, public_count: "fixture" } }, "/mcp": mcp() }) });
  assert.equal(typed.state, "NOT_REPRODUCED", "a total that disagrees with its rows must not reproduce");
});
