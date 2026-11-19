// SPDX-License-Identifier: CC0-1.0
// Local self-study over existing Academy content. Its saved state IS an array of
// csoai.evidence-event/0.1 records: no new canonical schema or remote store.
import { canonB, sha256Hex } from "./run-exercises.mjs";

export const METHOD = "academy-verify-card-self-study";
export const VERSION = "1";
export const STORAGE_KEY = "csoai.academy.verify-card.self-study.v1";
export const MAX_BYTES = 128 * 1024;
export const LIMITS = Object.freeze([
  "Unsigned local self-study responses; identity, human presence, consent to research and competence are not established.",
  "Public practice tasks and reference choices are inspectable; they are not blinded or held-out study material.",
  "First response means first in this local session only. Local timestamps and content hashes are not trusted attestations.",
  "Task difficulty and transfer are not independently calibrated. These answers do not establish learning gains or execution authority.",
]);
const utf8 = (s) => new TextEncoder().encode(s);
const hash = async (v) => sha256Hex(utf8(canonB(v)));
const copy = (v) => JSON.parse(JSON.stringify(v));
const keysAre = (value, names) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...names].sort().join("|");
const bounded = (value, max) => typeof value === "string" && value.length > 0 && value.length <= max && !/[\u0000-\u001f]/.test(value);

export function timestamp(value, now = new Date().toISOString()) {
  if (typeof value !== "string" || !/^(?!0000)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value || Date.parse(value) > Date.parse(now)) throw new Error("A valid UTC timestamp no later than this read is required.");
  return value;
}

export async function definition(content, manifest) {
  if (!keysAre(content, ["version", "exercise_id", "title", "lesson", "rubric", "tasks"]) || content.version !== VERSION || content.exercise_id !== "verify-card" || !bounded(content.title, 150)) throw new Error("Unsupported self-study content version.");
  if (!Array.isArray(content.lesson) || content.lesson.length < 1 || content.lesson.length > 10 || content.lesson.some((s) => !bounded(s, 1500))) throw new Error("Invalid lesson content.");
  if (!keysAre(content.rubric, ["id", "version", "rule", "feedback"]) || Object.values(content.rubric).some((s) => !bounded(s, 1000))) throw new Error("Invalid scoring rubric.");
  const phases = ["PRE", "PRE", "POST", "POST", "TRANSFER", "TRANSFER"];
  if (!Array.isArray(content.tasks) || content.tasks.length !== phases.length) throw new Error("The complete versioned task set is required.");
  const tasks = [];
  for (const [i, task] of content.tasks.entries()) {
    if (!keysAre(task, ["id", "phase", "prompt", "choices", "reference_choice", "explanation"]) || !/^[a-z][a-z0-9-]{1,60}$/.test(task.id) || task.phase !== phases[i] || !bounded(task.prompt, 1200) || !bounded(task.explanation, 1000) || !Array.isArray(task.choices) || task.choices.length !== 3 || task.choices.some((s) => !bounded(s, 700)) || !Number.isInteger(task.reference_choice) || task.reference_choice < 0 || task.reference_choice > 2) throw new Error("Invalid or out-of-order task definition.");
    // Phase/id changes must not disguise reuse of the same presented case.
    tasks.push({ ...copy(task), case_sha256: await hash({ prompt: task.prompt, choices: task.choices }) });
  }
  if (new Set(tasks.map((t) => t.id)).size !== tasks.length || new Set(tasks.map((t) => t.case_sha256)).size !== tasks.length) throw new Error("Repeated task definition.");
  if (manifest?.schema !== "csoai.academy-exercises/0.1") throw new Error("The existing Academy exercise manifest is required.");
  const exercise = manifest.exercises?.find((e) => e.id === content.exercise_id);
  if (!exercise) throw new Error("The existing verify-card lesson is missing.");
  return { content: copy(content), exercise: copy(exercise), tasks, rubric_sha256: await hash(content.rubric), lesson_revision: `sha256:${await hash({ content, exercise })}` };
}

function payload(def, session, kind) {
  return { kind, session_ref: session.session_ref, data_origin: session.data_origin, lesson_revision: def.lesson_revision, rubric_sha256: def.rubric_sha256 };
}

export async function eventFor(def, p, at) {
  const source = p.kind === "RESPONSE" ? p.case_sha256 : def.lesson_revision.slice(7);
  const ev = {
    schema: "csoai.evidence-event/0.1",
    subject: { kind: "web_page", locator: "https://councilof.ai/academy/exercises/#self-study" },
    claim: { text: "A local self-study interaction was supplied; human participation and learning are not established.", source_url: "https://councilof.ai/academy/exercises/study-content.json", source_sha256: source, read_at: at },
    method: { id: METHOD, version: VERSION, holder: "csoai" },
    declared: null, observed: { academy_self_study: p }, state: "PARTIAL", value: null,
    negative_control: { id: null, expected: null, got: "NOT_RUN" }, limits: [...LIMITS],
    supersedes: null, signature: null, anchors: { ots: "none", rekor: { log_index: null, uuid: null } }, maintenance: null,
  };
  const { signature, anchors, ...identified } = ev;
  return { ...ev, event_id: `sha256:${await hash(identified)}` };
}

export async function validateEvents(def, supplied, { now = new Date().toISOString() } = {}) {
  if (!Array.isArray(supplied) || supplied.length < 1 || supplied.length > def.tasks.length + 2 || utf8(JSON.stringify(supplied)).length > MAX_BYTES) throw new Error("A bounded self-study event array is required.");
  const events = copy(supplied);
  let session = null, count = 0, lesson = false, previous = null;
  for (const [i, ev] of events.entries()) {
    const p = ev?.observed?.academy_self_study;
    if (!p || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.session_ref) || !["SUPPLIED_REFERENCE", "SYNTHETIC"].includes(p.data_origin)) throw new Error("Unsupported anonymous session or origin.");
    if (p.lesson_revision !== def.lesson_revision || p.rubric_sha256 !== def.rubric_sha256) throw new Error("Saved lesson or rubric version differs from this page. Keep the original export; it cannot be resumed here.");
    if (!session) session = { session_ref: p.session_ref, data_origin: p.data_origin };
    if (p.session_ref !== session.session_ref || p.data_origin !== session.data_origin) throw new Error("Mixed sessions or origins cannot be resumed.");
    const at = timestamp(ev?.claim?.read_at, now);
    if (previous !== null && at <= previous) throw new Error("Self-study events must have strictly increasing timestamps.");
    previous = at;
    let expected = payload(def, session, p.kind);
    if (i === 0) {
      if (p.kind !== "START") throw new Error("A session must begin with its start event.");
    } else if (p.kind === "LESSON_CONTINUE") {
      if (count !== 2 || lesson) throw new Error("The lesson follows the two before responses exactly once.");
      lesson = true;
    } else if (p.kind === "RESPONSE") {
      const task = def.tasks[count];
      if (!task || (count >= 2 && !lesson)) throw new Error("Responses must follow the lesson and phase order.");
      if (p.selected_index !== null && (!Number.isInteger(p.selected_index) || p.selected_index < 0 || p.selected_index >= task.choices.length)) throw new Error("Select one choice or explicitly skip the task.");
      expected = { ...expected, task_id: task.id, phase: task.phase, case_sha256: task.case_sha256, selected_index: p.selected_index, attempt: 1, response_label: p.selected_index === null ? "ABSTAIN" : p.selected_index === task.reference_choice ? "PASS" : "FAIL" };
      count++;
    } else throw new Error("Unknown or repeated self-study step.");
    if (canonB(p) !== canonB(expected) || canonB(ev) !== canonB(await eventFor(def, expected, at))) throw new Error("Self-study event, response score or content binding was altered.");
  }
  return { events, session, responses: count, lesson, stage: count === def.tasks.length ? "DONE" : count === 2 && !lesson ? "LESSON" : "QUESTION", task: def.tasks[count] || null };
}

export async function startStudy(def, { at = new Date().toISOString(), origin = "SUPPLIED_REFERENCE", sessionRef = crypto.randomUUID() } = {}) {
  const session = { session_ref: sessionRef, data_origin: origin };
  return validateEvents(def, [await eventFor(def, payload(def, session, "START"), at)]);
}

export async function respond(def, supplied, selected, at = new Date().toISOString()) {
  const state = await validateEvents(def, supplied);
  if (state.stage !== "QUESTION") throw new Error("This step is not awaiting an answer.");
  const t = state.task;
  const p = { ...payload(def, state.session, "RESPONSE"), task_id: t.id, phase: t.phase, case_sha256: t.case_sha256, selected_index: selected, attempt: 1, response_label: selected === null ? "ABSTAIN" : selected === t.reference_choice ? "PASS" : "FAIL" };
  return validateEvents(def, [...supplied, await eventFor(def, p, at)]);
}

export async function continueLesson(def, supplied, at = new Date().toISOString()) {
  const state = await validateEvents(def, supplied);
  if (state.stage !== "LESSON") throw new Error("Complete the before responses first.");
  return validateEvents(def, [...supplied, await eventFor(def, payload(def, state.session, "LESSON_CONTINUE"), at)]);
}

export async function parseStudy(def, text, options = {}) {
  if (typeof text !== "string" || utf8(text).length > MAX_BYTES) throw new Error("Self-study import exceeds the size limit.");
  const parsed = strictJson(text);
  return validateEvents(def, parsed, options);
}

/** JSON.parse checks grammar; this second walk rejects ambiguous duplicate keys. */
export function strictJson(text) {
  let parsed;
  try { parsed = JSON.parse(text); } catch { throw new Error("Self-study import is not JSON."); }
  let i = 0;
  const ws = () => { while (i < text.length && /\s/.test(text[i])) i++; };
  const string = () => {
    const begin = i++;
    while (i < text.length) {
      if (text[i] === "\\") { i += 2; continue; }
      if (text[i++] === '"') return JSON.parse(text.slice(begin, i));
    }
    throw new Error("Unterminated JSON string.");
  };
  const value = (depth) => {
    if (depth > 40) throw new Error("Self-study JSON nesting exceeds the limit.");
    ws();
    if (text[i] === "{") {
      i++; ws(); const seen = new Set();
      if (text[i] === "}") { i++; return; }
      for (;;) {
        ws(); const key = string();
        if (seen.has(key)) throw new Error("Duplicate JSON object key in self-study import.");
        seen.add(key); ws(); i++; value(depth + 1); ws();
        if (text[i++] === "}") return;
      }
    }
    if (text[i] === "[") {
      i++; ws();
      if (text[i] === "]") { i++; return; }
      for (;;) { value(depth + 1); ws(); if (text[i++] === "]") return; }
    }
    if (text[i] === '"') { string(); return; }
    while (i < text.length && !/[\s,}\]]/.test(text[i])) i++;
  };
  value(0);
  return parsed;
}

export function results(def, state) {
  return ["PRE", "POST", "TRANSFER"].map((phase) => {
    const rows = state.events.map((e) => e.observed.academy_self_study).filter((p) => p.kind === "RESPONSE" && p.phase === phase);
    return { phase, expected: def.tasks.filter((t) => t.phase === phase).length, recorded: rows.length, matched: rows.filter((p) => p.response_label === "PASS").length, abstained: rows.filter((p) => p.response_label === "ABSTAIN").length };
  });
}

/** Compare-and-readback guard; callers may additionally hold a browser lock. */
export function persistEvents(storage, expectedRaw, events) {
  const raw = events === null ? null : JSON.stringify(events);
  try {
    if (storage.getItem(STORAGE_KEY) !== expectedRaw) return { state: "CONFLICT", expectedRaw };
    if (raw === null) storage.removeItem(STORAGE_KEY); else storage.setItem(STORAGE_KEY, raw);
    if (storage.getItem(STORAGE_KEY) !== raw) return { state: "READBACK_MISMATCH", expectedRaw };
    return { state: "SAVED", expectedRaw: raw };
  } catch { return { state: "UNAVAILABLE", expectedRaw }; }
}

/** Optional page integration. All response storage and file imports stay local. */
export async function mountStudy(root) {
  if (!root) return;
  const host = root.querySelector("[data-study-body]");
  const status = root.querySelector("[data-study-status]");
  const make = (tag, text, attrs = {}) => {
    const e = document.createElement(tag);
    if (text !== null) e.textContent = text;
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    return e;
  };
  const download = (raw, name) => {
    const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
    const link = make("a", "", { href: url, download: name });
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  let state = null, invalidRaw = null, busy = false, def, expectedRaw = null;
  const fail = (error) => { status.textContent = error instanceof Error ? error.message : String(error); };
  try {
    const [content, manifest] = await Promise.all(["study-content.json", "exercises.json"].map(async (name) => {
      const response = await fetch(new URL(name, import.meta.url), { cache: "no-cache" });
      if (!response.ok) throw new Error("Self-study content could not be loaded. The exercise runner remains available below.");
      const raw = await response.text();
      if (utf8(raw).length > MAX_BYTES) throw new Error("Self-study content exceeds the size limit.");
      return JSON.parse(raw);
    }));
    def = await definition(content, manifest);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      expectedRaw = saved;
      if (saved) {
        try { state = await parseStudy(def, saved); } catch (error) { invalidRaw = saved; fail(error); }
      }
    } catch { status.textContent = "Browser storage is unavailable. Keep a downloaded copy to resume later."; }
  } catch (error) { fail(error); return; }

  // Shared writes require a lock across cooperating tabs. Without Web Locks,
  // keep this session in memory/exportable rather than claim atomic retention.
  const locked = (work) => navigator.locks?.request ? navigator.locks.request(STORAGE_KEY, work) : Promise.reject(new Error("Browser storage coordination is unavailable."));
  const save = async (next) => {
    state = next; invalidRaw = null;
    let receipt;
    try { receipt = await locked(() => persistEvents(localStorage, expectedRaw, state.events)); }
    catch { receipt = { state: "UNAVAILABLE" }; }
    if (receipt.state === "SAVED") {
      expectedRaw = receipt.expectedRaw;
      status.textContent = "Saved on this device and read back. Download the events to keep a portable copy.";
    } else if (receipt.state === "CONFLICT") {
      status.textContent = "Another tab changed the saved copy. Your current answers are kept in memory and can be downloaded; they have not replaced that copy. Download them before reloading.";
    } else if (receipt.state === "READBACK_MISMATCH") {
      status.textContent = "The storage write could not be confirmed. Your current answers remain in memory and can be downloaded; check the saved copy after exporting this session.";
    } else status.textContent = "Local storage or coordination is unavailable. Your current session remains exportable in memory; download the events before leaving.";
  };
  const action = async (work) => {
    if (busy) return;
    busy = true;
    for (const e of host.querySelectorAll("button,input")) e.disabled = true;
    try { await work(); } catch (error) { fail(error); }
    finally { busy = false; render(); }
  };
  const button = (text, id, handler, secondary = false) => {
    const b = make("button", text, { type: "button", id, ...(secondary ? { class: "secondary" } : {}) });
    b.addEventListener("click", () => action(handler));
    return b;
  };
  function render() {
    host.replaceChildren();
    if (invalidRaw !== null) {
      host.append(make("p", "The saved copy cannot be resumed against the current content. You can keep its original bytes or clear this self-study copy."));
      host.append(button("Download original saved copy", "study-original", () => download(invalidRaw, "academy-self-study-original.json"), true));
    } else if (!state) {
      host.append(make("p", "Record two before responses, read the short lesson, then answer two after and two transfer scenarios. First responses are retained; explanations appear at the end. Skipping is recorded separately."));
      host.append(button("Start local self-study", "study-start", async () => save(await startStudy(def))));
    } else if (state.stage === "QUESTION") {
      const task = state.task;
      const names = { PRE: "Before the lesson", POST: "After the lesson", TRANSFER: "Transfer to another situation" };
      host.append(make("h3", names[task.phase]));
      const form = make("form", null, { id: "study-response" });
      const fieldset = make("fieldset", null);
      fieldset.append(make("legend", task.prompt));
      task.choices.forEach((choice, i) => {
        const label = make("label", null, { class: "study-choice" });
        label.append(make("input", null, { type: "radio", name: "study-choice", value: String(i), required: "" }), document.createTextNode(choice));
        fieldset.append(label);
      });
      const submit = make("button", "Keep this response", { type: "submit", id: "study-submit" });
      form.append(fieldset, submit);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const selected = form.querySelector("input:checked");
        if (selected) action(async () => save(await respond(def, state.events, Number(selected.value))));
      });
      host.append(form, button("Skip this question", "study-skip", async () => save(await respond(def, state.events, null)), true));
      host.append(make("p", `${state.responses} of ${def.tasks.length} first responses recorded in this session.`));
    } else if (state.stage === "LESSON") {
      host.append(make("h3", def.content.title));
      for (const paragraph of def.content.lesson) host.append(make("p", paragraph));
      host.append(make("p", "Use the existing exercise and download its separate transcript whenever you want to check the published bytes."));
      host.append(make("a", "Open the verify-card exercise below", { href: "#verify-card" }));
      host.append(make("p", "Continuing records this button press. It does not verify that a person read or understood the lesson."));
      host.append(button("Continue to after questions", "study-continue", async () => save(await continueLesson(def, state.events))));
    } else {
      host.append(make("h3", "Your retained responses"));
      const list = make("ul", null);
      for (const row of results(def, state)) list.append(make("li", `${row.phase}: ${row.matched} of ${row.recorded} responses match the declared reference; ${row.abstained} skipped.`));
      host.append(list, make("p", "These are descriptive results for public practice tasks. Differences between phases are not a measured learning gain. Human identity, comparable task difficulty and independent review are not established."));
      const feedback = make("details", null);
      feedback.append(make("summary", "Review the reference choices and explanations"));
      for (const task of def.tasks) feedback.append(make("p", `${task.prompt} Reference: ${task.choices[task.reference_choice]} ${task.explanation}`));
      host.append(feedback);
    }
    if (state) host.append(button("Download self-study events (JSON)", "study-export", () => download(JSON.stringify(state.events, null, 2) + "\n", "academy-self-study-events.json"), true));
    const label = make("label", "Resume from self-study events (JSON). A valid import replaces this local session.", { class: "study-import" });
    const input = make("input", null, { type: "file", accept: ".json,application/json", id: "study-import" });
    input.addEventListener("change", () => action(async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_BYTES) throw new Error("Self-study import exceeds the size limit.");
      const next = await parseStudy(def, await file.text());
      await save(next);
    }));
    label.append(input); host.append(label);
    if (state || invalidRaw !== null) host.append(button("Clear this local self-study", "study-clear", async () => {
      let receipt;
      try { receipt = await locked(() => persistEvents(localStorage, expectedRaw, null)); } catch { receipt = { state: "UNAVAILABLE" }; }
      if (receipt.state === "CONFLICT") throw new Error("The saved copy changed in another tab and was not cleared. Download this session before reloading.");
      if (receipt.state !== "SAVED") throw new Error("Clearing the saved copy could not be confirmed. This session remains in memory; download it before leaving and check browser storage separately.");
      expectedRaw = null;
      state = null; invalidRaw = null; status.textContent = "This local self-study has been cleared. Downloaded copies are unchanged.";
    }, true));
    host.append(make("p", `Lesson revision ${def.lesson_revision.slice(0, 23)}… · unsigned local events · no account or server submission`, { class: "meta" }));
  }
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY && event.newValue !== expectedRaw) status.textContent = "Another tab changed the saved copy. This tab retains its current session; export it before reloading. It will not overwrite the other copy.";
  });
  render();
}
