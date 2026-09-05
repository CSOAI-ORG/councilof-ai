/**
 * popup.js — two panes, both honest by construction.
 *   Board: prints totals.lid and totals.public_count VERBATIM from GET /api/gspc and one
 *          row per axis with its published state. No count is composed here.
 *   Verify: the signature verdict is computed offline by the repo's shared verifier;
 *          the inclusion row is the only network call and is labelled as such.
 */
import { BOARD_URL, boardView } from "./lib/board.mjs";
import { STATES, parseInput, verifyOffline, checkInclusion, inclusionSha } from "./lib/gspcVerify.mjs";

const $ = (id) => document.getElementById(id);

async function fetchJson(url) {
  const r = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
  let body = null;
  try {
    body = await r.json();
  } catch {
    body = null;
  }
  return { status: r.status, body };
}

/* ------------------------------------------------------------------ board */
function renderBoard(view) {
  $("lid").textContent = view.lid ?? "The payload carries no totals.lid — nothing is composed in its place.";
  $("public_count").textContent = view.public_count ? `totals.public_count: ${view.public_count}` : "";
  const tbody = $("axes").querySelector("tbody");
  tbody.textContent = "";
  for (const r of view.rows) {
    const tr = document.createElement("tr");
    const cells = [r.axis, r.family ?? "", r.status, r.leader];
    cells.forEach((v, i) => {
      const td = document.createElement("td");
      td.textContent = v;
      if (i === 2) td.className = "state";
      if (i === 3 && r.leaderState) td.className = "withheld";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  }
  $("axes").hidden = view.rows.length === 0;
  $("board-note").textContent = view.rows.length
    ? "A withheld leader is a state, not a zero. TIE is never a win. Fact runs carry no leader."
    : "";
}

async function loadBoard() {
  $("lid").textContent = "Loading the board…";
  $("board-note").textContent = "";
  try {
    const { status, body } = await fetchJson(BOARD_URL);
    if (status !== 200 || !body) {
      $("lid").textContent = `UNCHECKABLE — GET /api/gspc returned HTTP ${status}. The board could not be read; nothing is shown in its place.`;
      $("axes").hidden = true;
      return;
    }
    renderBoard(boardView(body));
  } catch (e) {
    $("lid").textContent = `UNCHECKABLE — GET /api/gspc could not be reached (${e?.message ?? e}).`;
    $("axes").hidden = true;
  }
}

/* ----------------------------------------------------------------- verify */
function li(text, cls) {
  const el = document.createElement("li");
  el.textContent = text;
  if (cls) el.className = cls;
  return el;
}

async function runVerify() {
  const out = $("verdict");
  const stateEl = $("v-state");
  const text = $("card").value.trim();
  out.hidden = false;
  stateEl.className = "";
  $("v-notes").textContent = "";
  $("v-checks").textContent = "";
  $("v-inclusion").textContent = "";
  $("v-meta").textContent = "";

  if (!text) {
    stateEl.textContent = STATES.UNCHECKABLE;
    stateEl.classList.add(STATES.UNCHECKABLE);
    $("v-reason").textContent = "Nothing pasted — nothing was checked.";
    return;
  }
  const parsed = parseInput(text);
  if (parsed.error) {
    stateEl.textContent = STATES.UNCHECKABLE;
    stateEl.classList.add(STATES.UNCHECKABLE);
    $("v-reason").textContent = parsed.error;
    return;
  }

  const v = await verifyOffline(parsed.value);
  stateEl.textContent = v.state;
  stateEl.classList.add(v.state);
  const meta = [v.family, v.axis && `axis ${v.axis}`, v.model && `model ${v.model}`, v.bodyStatus && `body.status ${v.bodyStatus}`, v.pinnedBy && `key ${v.pinnedBy}`].filter(Boolean).join(" · ");
  $("v-meta").textContent = meta ? `— ${meta}` : "";
  $("v-reason").textContent = v.reason;
  for (const n of v.notes ?? []) $("v-notes").appendChild(li(n));
  for (const c of v.checks ?? []) {
    const mark = c.ok === true ? "✓" : c.ok === false ? "✗" : "○";
    $("v-checks").appendChild(li(`${mark} ${c.label}: ${c.detail}`));
  }

  if ($("inclusion").checked) {
    const sha = inclusionSha(parsed.value, v);
    $("v-inclusion").textContent = "Root inclusion: checking GET /api/proof…";
    const inc = await checkInclusion(sha, fetchJson);
    $("v-inclusion").textContent = `Root inclusion (network): ${inc.state} — ${inc.reason}`;
  } else {
    $("v-inclusion").textContent = "Root inclusion: not checked (network off).";
  }
}

$("reload").addEventListener("click", loadBoard);
$("check").addEventListener("click", () => runVerify().catch((e) => {
  $("verdict").hidden = false;
  $("v-state").textContent = STATES.UNCHECKABLE;
  $("v-state").className = STATES.UNCHECKABLE;
  $("v-reason").textContent = `The check could not run: ${e?.message ?? e}. That is a statement about this check, not about the card.`;
}));
loadBoard();
