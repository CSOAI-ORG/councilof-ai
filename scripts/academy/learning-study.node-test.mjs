// SPDX-License-Identifier: CC0-1.0
// Explicit synthetic software checks; no learner or learning gain is asserted.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import * as S from "../../public/academy/exercises/learning-study.mjs";

const dir = new URL("../../public/academy/exercises/", import.meta.url);
const content = JSON.parse(readFileSync(new URL("study-content.json", dir), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("exercises.json", dir), "utf8"));
const def = await S.definition(content, manifest);
const clone = (x) => JSON.parse(JSON.stringify(x));
const at = (n) => `2026-11-10T01:00:${String(n).padStart(2, "0")}.000Z`;
const sessionRef = "00000000-0000-4000-8000-000000000001";
async function start() { return S.startStudy(def, { at: at(0), origin: "SYNTHETIC", sessionRef }); }
async function full() {
  let state = await start(), n = 1;
  for (const task of def.tasks) {
    if (state.stage === "LESSON") state = await S.continueLesson(def, state.events, at(n++));
    state = await S.respond(def, state.events, task.reference_choice, at(n++));
  }
  return state;
}

test("definition binds exact lesson, existing exercise, rubric and distinct tasks", async () => {
  assert.match(def.lesson_revision, /^sha256:[0-9a-f]{64}$/);
  assert.equal(new Set(def.tasks.map((t) => t.case_sha256)).size, 6);
  const changed = clone(manifest); changed.exercises.find((e) => e.id === "verify-card").expected += ".";
  assert.notEqual((await S.definition(content, changed)).lesson_revision, def.lesson_revision);
});

test("changing task identifiers or phase cannot disguise repeated presented content", async () => {
  const repeated = clone(content);
  repeated.tasks[2].prompt = repeated.tasks[0].prompt;
  repeated.tasks[2].choices = repeated.tasks[0].choices;
  await assert.rejects(S.definition(repeated, manifest), /Repeated task/);
});

test("the complete software sequence retains six first responses and distinct transfer", async () => {
  const state = await full();
  assert.equal(state.stage, "DONE");
  assert.equal(state.events.length, 8);
  assert.deepEqual(S.results(def, state), ["PRE", "POST", "TRANSFER"].map((phase) => ({ phase, expected: 2, recorded: 2, matched: 2, abstained: 0 })));
  for (const ev of state.events) {
    assert.equal(ev.schema, "csoai.evidence-event/0.1");
    assert.equal(ev.state, "PARTIAL"); assert.equal(ev.value, null); assert.equal(ev.signature, null);
    assert.equal(ev.observed.academy_self_study.data_origin, "SYNTHETIC");
  }
});

test("export and import preserve exact canonical event IDs and next step", async () => {
  const begun = await start();
  const partial = await S.respond(def, begun.events, 0, at(1));
  const resumed = await S.parseStudy(def, JSON.stringify(partial.events));
  assert.deepEqual(resumed.events, partial.events);
  assert.equal(resumed.task.id, "pre-unavailable");
  const completed = await full();
  assert.deepEqual((await S.parseStudy(def, JSON.stringify(completed.events))).events, completed.events);
});

test("wrong answers and skipped answers remain distinct", async () => {
  let state = await start();
  state = await S.respond(def, state.events, 0, at(1));
  state = await S.respond(def, state.events, null, at(2));
  assert.deepEqual(S.results(def, state)[0], { phase: "PRE", expected: 2, recorded: 2, matched: 0, abstained: 1 });
  assert.equal(state.stage, "LESSON");
});

test("the lesson is required between before and after responses", async () => {
  let state = await start();
  await assert.rejects(S.continueLesson(def, state.events, at(1)), /before responses/);
  state = await S.respond(def, state.events, 1, at(1));
  state = await S.respond(def, state.events, 2, at(2));
  await assert.rejects(S.respond(def, state.events, 0, at(3)), /not awaiting/);
});

test("a completed session cannot add another answer or revise prior responses", async () => {
  const state = await full();
  await assert.rejects(S.respond(def, state.events, 0, at(9)), /not awaiting/);
  const changed = clone(state.events); changed[1].observed.academy_self_study.selected_index = 0;
  await assert.rejects(S.validateEvents(def, changed), /altered/);
});

test("a recomputed hash cannot conceal an inflated response score", async () => {
  const state = await full(), events = clone(state.events);
  const p = { ...events[1].observed.academy_self_study, selected_index: 0, response_label: "PASS" };
  events[1] = await S.eventFor(def, p, at(1));
  await assert.rejects(S.validateEvents(def, events), /altered/);
});

test("a recomputed hash cannot conceal repeated attempts or another phase", async () => {
  const state = await full();
  for (const patch of [{ attempt: 2 }, { phase: "POST" }, { task_id: "post-tamper" }]) {
    const events = clone(state.events);
    events[1] = await S.eventFor(def, { ...events[1].observed.academy_self_study, ...patch }, at(1));
    await assert.rejects(S.validateEvents(def, events), /altered/);
  }
});

test("missing and reordered phase records are rejected", async () => {
  const state = await full();
  const missing = clone(state.events); missing.splice(3, 1);
  await assert.rejects(S.validateEvents(def, missing), /phase order/);
  const swapped = clone(state.events); [swapped[4], swapped[6]] = [swapped[6], swapped[4]];
  await assert.rejects(S.validateEvents(def, swapped), /altered|timestamps/);
});

test("source, rubric and lesson revisions cannot silently migrate", async () => {
  const state = await full();
  for (const field of ["lesson_revision", "rubric_sha256"]) {
    const events = clone(state.events); events[0].observed.academy_self_study[field] = "f".repeat(64);
    await assert.rejects(S.validateEvents(def, events), /version differs/);
  }
  const edited = clone(content); edited.tasks[0].prompt += " Changed.";
  await assert.rejects(S.validateEvents(await S.definition(edited, manifest), state.events), /version differs/);
});

test("timestamps must be real, strictly ordered and not future", async () => {
  const state = await full();
  for (const bad of ["0000-01-01T01:00:00.000Z", "2026-02-30T01:00:00.000Z", "2026-11-10T01:00:00.000Z", "2999-11-10T01:00:00.000Z", "2026-11-10\n# heading"]) {
    const events = clone(state.events);
    events[1] = await S.eventFor(def, events[1].observed.academy_self_study, bad);
    await assert.rejects(S.validateEvents(def, events), /timestamp/);
  }
});

test("extra authority, identity or private fields are not accepted or re-exported", async () => {
  const state = await full();
  for (const patch of [{ execution_authorized: true }, { participant_name: "PRIVATE_SENTINEL" }]) {
    const events = clone(state.events);
    events[0] = await S.eventFor(def, { ...events[0].observed.academy_self_study, ...patch }, at(0));
    await assert.rejects(S.validateEvents(def, events), /altered/);
  }
  const extra = clone(state.events); extra[0].signature = { signed_by: "human" };
  await assert.rejects(S.validateEvents(def, extra), /altered/);
});

test("mixed sessions and data origins are rejected", async () => {
  const state = await full();
  for (const patch of [{ session_ref: "00000000-0000-4000-8000-000000000002" }, { data_origin: "SUPPLIED_REFERENCE" }]) {
    const events = clone(state.events);
    events[1] = await S.eventFor(def, { ...events[1].observed.academy_self_study, ...patch }, at(1));
    await assert.rejects(S.validateEvents(def, events), /Mixed sessions/);
  }
});

test("malformed, oversized and non-session files fail without a replacement state", async () => {
  for (const raw of ["not JSON", "[]", "{}", " ".repeat(S.MAX_BYTES + 1)]) await assert.rejects(S.parseStudy(def, raw));
  const state = await start();
  await assert.rejects(S.respond(def, state.events, true, at(1)), /one choice/);
  await assert.rejects(S.respond(def, state.events, 3, at(1)), /one choice/);
});

test("duplicate and escaped duplicate JSON keys are rejected instead of normalized away", async () => {
  const state = await start(), raw = JSON.stringify(state.events);
  for (const fragment of ['"kind":"ALTERED","kind":"START"', '"kind":"ALTERED","\\u006bind":"START"']) {
    await assert.rejects(S.parseStudy(def, raw.replace('"kind":"START"', fragment)), /Duplicate JSON/);
  }
  assert.deepEqual(S.strictJson('{"text":"braces { \\\" }","nested":[{"a":1},{"a":2}]}'), { text: 'braces { " }', nested: [{ a: 1 }, { a: 2 }] });
});

test("the page keeps self-study distinct from exercise transcripts and public practice from held-out studies", () => {
  const page = readFileSync(new URL("index.html", dir), "utf8");
  assert.match(page, /id="self-study"/);
  assert.match(page, /separate from the reproducibility exercises/);
  assert.match(page, /id="download"/);
  assert.match(S.LIMITS.join(" "), /not blinded or held-out/);
});

test("another tab cannot overwrite retained first responses during a delayed save or import", async () => {
  const initial = await start();
  let saved = JSON.stringify(initial.events);
  const storage = { getItem: () => saved, setItem: (_, value) => { saved = value; }, removeItem: () => { saved = null; } };
  const firstTabRaw = saved;
  const secondTab = await S.respond(def, initial.events, 1, at(1));
  assert.equal(S.persistEvents(storage, firstTabRaw, secondTab.events).state, "SAVED");
  const secondTabRaw = saved;
  const delayedFirstTab = await S.respond(def, initial.events, 0, at(2));
  assert.equal(S.persistEvents(storage, firstTabRaw, delayedFirstTab.events).state, "CONFLICT");
  assert.equal(saved, secondTabRaw);
  assert.equal(S.persistEvents(storage, firstTabRaw, null).state, "CONFLICT");
  assert.equal(saved, secondTabRaw);
  assert.equal(delayedFirstTab.events[1].observed.academy_self_study.selected_index, 0, "unsaved branch remains exportable");
});

test("persistence requires a readback and reports blocked storage", async () => {
  const state = await start();
  const noWrite = { getItem: () => null, setItem: () => {} };
  assert.equal(S.persistEvents(noWrite, null, state.events).state, "READBACK_MISMATCH");
  const unavailable = { getItem: () => { throw new Error("blocked"); } };
  assert.equal(S.persistEvents(unavailable, null, state.events).state, "UNAVAILABLE");
});
