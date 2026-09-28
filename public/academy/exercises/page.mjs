// SPDX-License-Identifier: CC0-1.0
// Page wiring for /academy/exercises/: runs the same module Node runs and renders what it read.
// Every value shown is produced by a run; nothing numeric is written into the page.
import { EXERCISES, TRANSCRIPT_SCHEMA, runExercise } from "./run-exercises.mjs";

// A local review copy (127.0.0.1 / localhost) reads the public site; everything it reads sends CORS
// headers except the charter files, so charter-hash is UNCHECKABLE there and REPRODUCED in production.
const edge = ["127.0.0.1", "localhost"].includes(location.hostname) ? "https://councilof.ai" : location.origin;
const results = new Map();
const $ = (sel) => document.querySelector(sel);

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const c of children) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return node;
}
const compact = (v) => (typeof v === "string" ? v : JSON.stringify(v));

function row(label, ...value) {
  return el("tr", {}, el("th", { scope: "row" }, label), el("td", {}, ...value));
}

function render(target, r) {
  target.replaceChildren();
  target.append(el("span", { class: `state ${r.state}` }, r.state.replace("_", " ")));
  if (r.reason) target.append(" ", r.reason);
  const table = el("table");
  if (r.yours !== undefined) {
    table.append(row("Yours", el("code", {}, compact(r.yours))));
    table.append(row("Published", el("code", {}, compact(r.published))));
    table.append(row("Your sha256", el("code", {}, r.yours_sha256)));
    table.append(row("Published sha256", el("code", {}, r.published_sha256)));
    table.append(row("Control", `${r.control.description}: ${r.control.discriminates ? "failed as it must" : "did NOT fail"}`));
    if (r.cross_check) table.append(row("Cross-check", `${r.cross_check.tool}: ${r.cross_check.state}`));
    if (r.note) table.append(row("Note", r.note));
  }
  if (r.inputs?.length) {
    const list = el("ul");
    for (const i of r.inputs) list.append(el("li", {}, el("code", {}, i.url), ` — HTTP ${i.status}, sha256 `, el("code", {}, i.sha256.slice(0, 16) + "…")));
    table.append(row("Read", list));
  }
  table.append(row("Ran", `${r.started_at} → ${r.finished_at}`));
  target.append(table);
}

async function runOne(id) {
  const ex = EXERCISES.find((e) => e.id === id);
  const target = document.querySelector(`[data-result="${CSS.escape(id)}"]`);
  if (!ex || !target) return null;
  target.replaceChildren(el("span", { class: "state RUNNING" }, "RUNNING"), " reading the published bytes…");
  const r = await runExercise(ex, { edge });
  results.set(id, r);
  render(target, r);
  $("#download").hidden = results.size === 0;
  return r;
}

function setBusy(busy) {
  for (const b of document.querySelectorAll("button.run-one, #run-all")) b.disabled = busy;
}

function summary() {
  const states = [...results.values()].map((r) => r.state);
  const n = (s) => states.filter((x) => x === s).length;
  return `${results.size} of ${EXERCISES.length} run: ${n("REPRODUCED")} reproduced, ${n("NOT_REPRODUCED")} not reproduced, ${n("UNCHECKABLE")} uncheckable.`;
}

$("#run-all").addEventListener("click", async () => {
  setBusy(true);
  for (const ex of EXERCISES) {
    $("#run-status").textContent = `Running ${ex.title}…`;
    await runOne(ex.id);
  }
  setBusy(false);
  $("#run-status").textContent = summary();
});

for (const b of document.querySelectorAll("button.run-one")) {
  b.addEventListener("click", async () => {
    setBusy(true);
    await runOne(b.dataset.id);
    setBusy(false);
    $("#run-status").textContent = summary();
  });
}

$("#download").addEventListener("click", () => {
  const transcript = {
    schema: TRANSCRIPT_SCHEMA,
    edge,
    runner: "run-exercises.mjs (browser)",
    run_at: new Date().toISOString(),
    rubric: "An exercise is complete only when state is REPRODUCED: yours_sha256 == published_sha256 and the negative control failed as it must.",
    not_a_certification: true,
    results: EXERCISES.filter((e) => results.has(e.id)).map((e) => results.get(e.id)),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(transcript, null, 2) + "\n"], { type: "application/json" }));
  const a = el("a", { href: url, download: `academy-transcript-${transcript.run_at.slice(0, 19).replace(/:/g, "")}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
