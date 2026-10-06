#!/usr/bin/env node
/**
 * build-axis-pages.mjs — /axis/<axis> and /axes, rendered from THIS commit's /api/gspc.
 *
 * WHY. The per-axis pages were written by scripts/badger/csoai-axis-deep-builder.py, which curled
 * the DEPLOYED board (so it built from the previous deploy) and carried a hand-typed paragraph per
 * axis: "The 30-item bank" for governance (the board serves 237), "TIE on the live board (n=71,
 * acc=0.5915)" for jail (UNTESTED since C-2026-0929-02), a glossary with a fourth separation state
 * ("UNTRIED") the board has never used. /axes was a separate hand-kept list that disagreed with both
 * (persona audit T06, 2026-10-06). A typed state goes stale the day the board moves.
 *
 * WHAT. One payload, two outputs. The payload is the board this commit's own Function serves,
 * computed offline by scripts/surface/commit-board.mjs (the prerender's authority since 28 Sep), or
 * a file given with --payload / --board-reference. Every state, count and sentence on the pages is
 * read from that payload's axis row; the only typed prose is what a word means (taken from
 * state_enum) and what the page is not. Each state is also written as data-axis / data-status /
 * data-separation / data-n attributes, so scripts/axis-state-gate.mjs can compare values, not
 * phrases.
 *
 *   node scripts/surface/build-axis-pages.mjs                 # writes public/axis/*.html + public/axes.html
 *   node scripts/surface/build-axis-pages.mjs --out dist/client   # writes into a built tree
 *   node scripts/surface/build-axis-pages.mjs --check         # fails if the committed pages are stale
 *   node scripts/surface/build-axis-pages.mjs --payload board.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { headerHtml, SHELL_CSS } from "./static-shell.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** What each separation word means. Only words the payload's own state_enum.separation lists are
 *  rendered; a word this map does not define is printed without a definition rather than invented. */
const SEPARATION_MEANS = {
  SEPARATED: "the board's fixed test found the leader's lead over the runner-up real (p<0.05).",
  TIE: "the test ran and did not separate the leader from the runner-up. A TIE is not a win.",
  UNTESTED: "no separation test could be run on the published evidence. UNTESTED is not a tie.",
};

export function isFacts(row) {
  return row?.kind === "deterministic-facts";
}

/** The compound state a reader sees: MEASURED · TIE, or MEASURED · facts, no separation test. */
export function stateLabel(row) {
  const status = row?.status ?? "UNMEASURED";
  if (isFacts(row)) return `${status} · facts, no separation test`;
  if (status !== "MEASURED") return status;
  return `${status} · ${row?.separation ?? "UNTESTED"}`;
}

/** The separation value the page asserts: "" for a fact axis (no test applies). */
export function separationOf(row) {
  if (isFacts(row)) return "";
  return row?.status === "MEASURED" ? row?.separation ?? "UNTESTED" : "";
}

function stateAttrs(row) {
  return (
    `data-axis="${esc(row.axis)}" data-status="${esc(row.status ?? "UNMEASURED")}" ` +
    `data-separation="${esc(separationOf(row))}" data-n="${typeof row.n === "number" ? row.n : ""}"`
  );
}

function measuredWhen(row) {
  const t = row?.measurement_time;
  if (!t || typeof t !== "object") return null;
  const v = t.observed_on ?? t.observed_at ?? (t.not_after ? `not after ${t.not_after}` : null);
  if (!v) return null;
  return `${v}${t.precision ? ` (${t.precision} precision)` : ""}`;
}

const pct = (v) => (typeof v === "number" ? `${(v * 100).toFixed(1)}%` : null);

const CSS = `${SHELL_CSS}  :root { --bg:#fff; --fg:#0b1a12; --muted:#4b5b52; --line:#e2e8e4; --accent:#0f766e; --warn:#92400e; }
  @media (prefers-color-scheme: dark) { :root { --bg:#0b1a12; --fg:#eafff4; --muted:#a7c4b6; --line:rgba(52,211,153,.18); --accent:#34d399; --warn:#fbbf24; } .site-header { background: rgba(11,26,18,.95); } }
  body { margin:0; font:16px/1.6 -apple-system,BlinkMacSystemFont,system-ui,sans-serif; background:var(--bg); color:var(--fg); }
  .wrap { max-width:48rem; margin:0 auto; padding:2rem 1rem 5rem; overflow-wrap:anywhere; }
  h1 { font-size:2rem; font-weight:800; letter-spacing:-0.02em; margin:0 0 .5rem; }
  h2 { font-size:1.2rem; margin:2rem 0 .5rem; color:var(--accent); }
  .lid { font:13px ui-monospace,monospace; color:var(--accent); border:1px solid var(--line); padding:.4rem .7rem; border-radius:6px; display:inline-block; margin:.5rem 0 1rem; }
  .state { font-weight:700; font-size:1.1rem; }
  .pill { display:inline-block; padding:.2rem .6rem; border-radius:999px; border:1px solid var(--line); color:var(--muted); font-size:.8rem; margin:.15rem .25rem .15rem 0; }
  dl { display:grid; grid-template-columns: minmax(8rem, 12rem) 1fr; gap:.4rem 1rem; }
  dt { color:var(--muted); font-weight:600; }
  dd { margin:0; }
  p, li { color:var(--fg); }
  .muted { color:var(--muted); font-size:.92rem; }
  .note { border-left:3px solid var(--accent); padding:.75rem 1rem; margin:1.25rem 0; }
  table { border-collapse:collapse; width:100%; font-size:.92rem; }
  th, td { text-align:left; padding:.45rem .5rem; border-bottom:1px solid var(--line); vertical-align:top; }
  th { color:var(--muted); font-size:.75rem; text-transform:uppercase; letter-spacing:.04em; }
  .scroll { overflow-x:auto; }
  a { color:var(--accent); }
  footer { margin-top:3rem; padding-top:1.5rem; border-top:1px solid var(--line); color:var(--muted); font-size:.85rem; }
  @media (max-width: 520px) { dl { grid-template-columns: 1fr; } dt { margin-top:.5rem; } }
`;

function shell({ title, description, canonical, body }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<meta name="robots" content="index,follow" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:type" content="article" />
<meta property="og:image" content="https://councilof.ai/og-image.png" />
<!-- Generated by scripts/surface/build-axis-pages.mjs from this commit's /api/gspc. Do not hand-edit. -->
<style>
${CSS}</style>
</head>
<body>
${headerHtml()}
<main class="wrap">
${body}
  <footer>
    <p><strong>CSOAI Ltd</strong> · UK Companies House 16939677 · <a href="/">councilof.ai</a></p>
    <p>Measurement, not certification. Anyone can re-check: <a href="/gspc-verify/">verifier</a> · <a href="/corrections/">corrections ledger</a>.</p>
  </footer>
</main>
</body>
</html>
`;
}

function lid(board) {
  const t = board?.totals ?? {};
  const parts = [t.public_count, t.separation_public_count].filter((s) => typeof s === "string" && s.trim());
  return parts.length ? parts.join(" · ") : "Current counts are on the live board, GET /api/gspc";
}

export function renderAxisPage(row, board) {
  const facts = isFacts(row);
  const name = row.axis;
  const task = row.task ? `${row.task}${row.bench ? ` (${row.bench})` : ""}` : row.bench ?? null;
  const state = stateLabel(row);
  const enumSep = Array.isArray(board?.state_enum?.separation) ? board.state_enum.separation : [];
  const nUnit = row.n_unit ?? (facts ? "observations in this run" : "bank items");
  const rows = [];
  const add = (dt, dd) => {
    if (dd !== null && dd !== undefined && dd !== "") rows.push(`    <dt>${esc(dt)}</dt><dd>${dd}</dd>`);
  };
  add("State", `<span ${stateAttrs(row)}>${esc(state)}</span>`);
  add("n", typeof row.n === "number" ? `${row.n} ${esc(nUnit)}${row.n_note ? `<br /><span class="muted">${esc(row.n_note)}</span>` : ""}` : "nothing measured");
  if (typeof row.distinct_items === "number")
    add("Distinct items", `${row.distinct_items}${row.distinct_items_source ? ` <span class="muted">— ${esc(row.distinct_items_source)}</span>` : ""}`);
  if (!facts) {
    if (row.leader)
      add(
        "Point leader",
        `${esc(row.leader)}${typeof row.accuracy === "number" ? ` · ${esc(pct(row.accuracy))} (accuracy ${row.accuracy})` : ""}` +
          (Array.isArray(row.interval) ? ` · 95% range ${esc(pct(row.interval[0]))}–${esc(pct(row.interval[1]))}` : ""),
      );
    else if (row.public_leader_state) add("Point leader", `none shown — <code>${esc(row.public_leader_state)}</code>`);
    add("Separation", separationOf(row) ? esc(separationOf(row)) : null);
    add("The board's sentence", row.separation_sentence ? esc(row.separation_sentence) : null);
    add("Why untested", row.separation_untested_reason ? esc(row.separation_untested_reason) : null);
    add("Test", row.separation_method ? `${esc(row.separation_method)}${typeof row.separation_p === "number" ? ` (p=${row.separation_p})` : ""}` : null);
  }
  add("Measured", measuredWhen(row) ? esc(measuredWhen(row)) : null);

  const links = [
    `<a href="/api/gspc?axis=${encodeURIComponent(name)}">this row on the live board (JSON)</a>`,
    row.evidence_url ? `<a href="${esc(row.evidence_url)}">the run evidence</a>` : null,
    row.dataset_url ? `<a href="${esc(row.dataset_url)}">the frozen bank</a>` : null,
    facts ? null : `<a href="/methodology/#separation">how separation is decided</a>`,
    `<a href="/corrections/">corrections ledger</a>`,
  ].filter(Boolean);

  const glossary = facts
    ? ""
    : `
  <h2>What the separation words mean</h2>
  <dl data-glossary="separation">
${enumSep.map((w) => `    <dt>${esc(w)}</dt><dd>${esc(SEPARATION_MEANS[w] ?? "see GET /api/gspc state_enum")}</dd>`).join("\n")}
  </dl>`;

  const body = `  <p class="lid">${esc(lid(board))}</p>
  <h1>${esc(name)}</h1>
  <p class="state" ${stateAttrs(row)}>${esc(state)}</p>
  <p><span class="pill">family: ${esc(row.family ?? "—")}</span><span class="pill">kind: ${esc(row.kind ?? "—")}</span></p>

  <h2>What this axis asks</h2>
  <p>${task ? esc(task) : "The board publishes no task description for this axis."}</p>

  <h2>The numbers, as the board serves them</h2>
  <dl>
${rows.join("\n")}
  </dl>
${row.note ? `
  <h2>The board's note</h2>
  <div class="note">${esc(row.note)}</div>` : ""}
${glossary}

  <h2>What this page is not</h2>
  <p>Measurement, not certification. A row is one run on one frozen bank on a stated date. It is not an approval, a compliance finding or a ranking of anything outside that bank. Signature checks and root inclusion are separate steps; none is inferred from this page.</p>

  <h2>Check it</h2>
  <p>${links.join(" · ")}</p>
  <p class="muted">Rendered from the board this site's build serves (GET /api/gspc), not typed by hand. If the board moves, this page moves with it on the next build.</p>`;

  return shell({
    title: `${name} — GSPC axis | Council of AI`,
    description: `${task ?? name}. State: ${state}. Read from GET /api/gspc. Measurement, not certification.`,
    canonical: `https://councilof.ai/axis/${name}`,
    body,
  });
}

export function renderAxesIndex(board) {
  const axes = Array.isArray(board?.axes) ? board.axes : [];
  const cmp = axes.filter((a) => !isFacts(a));
  const facts = axes.filter(isFacts);
  const tr = (a) => {
    const lead = isFacts(a)
      ? "—"
      : a.leader
        ? `${esc(a.leader)}${typeof a.accuracy === "number" ? ` · ${esc(pct(a.accuracy))}` : ""}`
        : a.public_leader_state
          ? `none shown — <code>${esc(a.public_leader_state)}</code>`
          : "—";
    return `      <tr ${stateAttrs(a)}><td><a href="/axis/${encodeURIComponent(a.axis)}">${esc(a.axis)}</a></td><td>${esc(stateLabel(a))}</td><td>${typeof a.n === "number" ? a.n : "—"}${a.n_unit ? ` <span class="muted">${esc(a.n_unit)}</span>` : ""}</td><td>${lead}</td></tr>`;
  };
  const table = (list) => `  <div class="scroll"><table>
    <thead><tr><th>Axis</th><th>State</th><th>n</th><th>Point leader</th></tr></thead>
    <tbody>
${list.map(tr).join("\n")}
    </tbody>
  </table></div>`;
  const body = `  <p class="lid">${esc(lid(board))}</p>
  <h1>All ${axes.length} GSPC axes</h1>
  <p>Every axis on the board, with the state the board serves for it and a page of its own. An empty slot would read UNMEASURED, never zero. A point leader is not a separated leader: TIE and UNTESTED are their own states, and neither is a win.</p>

  <h2>${cmp.length} model-comparison axes</h2>
  <p class="muted">A model fleet answers a frozen bank, graded deterministically. Our own models are removed before any comparison.</p>
${table(cmp)}

  <h2>${facts.length} deterministic-fact axes</h2>
  <p class="muted">A rule with no model and no judgement, reading named public sources. None is a model score, and no separation test applies.</p>
${table(facts)}

  <p class="muted">Rendered from the board this site's build serves (GET /api/gspc), not typed by hand. <a href="/api/gspc">The board as JSON</a> · <a href="/methodology/#separation">how separation is decided</a>.</p>`;
  return shell({
    title: "GSPC axes — what each one measures | Council of AI",
    description: "Every axis on the GSPC board with the state the board serves for it and a page of its own. Read from GET /api/gspc. Measurement, not certification.",
    canonical: "https://councilof.ai/axes",
    body,
  });
}

/** Every file this generator owns, keyed by repo-relative path. */
export function renderAll(board) {
  const out = {};
  for (const row of Array.isArray(board?.axes) ? board.axes : []) {
    if (typeof row?.axis !== "string" || !/^[a-z0-9-]+$/.test(row.axis)) throw Error(`AXIS_ID_NOT_A_SLUG ${row?.axis}`);
    out[`axis/${row.axis}.html`] = renderAxisPage(row, board);
  }
  out["axes.html"] = renderAxesIndex(board);
  return out;
}

export async function loadBoard({ payload, boardReference } = {}) {
  if (payload) return JSON.parse(readFileSync(resolve(ROOT, payload), "utf8"));
  if (boardReference) {
    const ref = JSON.parse(readFileSync(resolve(ROOT, boardReference), "utf8"));
    return JSON.parse(Buffer.from(ref.board_base64, "base64").toString("utf8"));
  }
  const { commitBoard } = await import("./commit-board.mjs");
  const { status, raw } = await commitBoard(ROOT);
  if (status !== 200) throw Error(`this commit's /api/gspc answered HTTP ${status}`);
  return JSON.parse(raw.toString("utf8"));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const val = (k) => {
    const i = args.indexOf(k);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const check = args.includes("--check");
  const outDir = resolve(ROOT, val("--out") ?? "public");
  const board = await loadBoard({ payload: val("--payload"), boardReference: val("--board-reference") });
  const files = renderAll(board);
  const stale = [];
  for (const [rel, html] of Object.entries(files)) {
    const p = join(outDir, rel);
    const cur = existsSync(p) ? readFileSync(p, "utf8") : null;
    if (cur === html) continue;
    if (check) stale.push(relative(ROOT, p));
    else {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, html);
    }
  }
  if (check && stale.length) {
    console.error(`✖ axis pages are stale against this commit's /api/gspc — run node scripts/surface/build-axis-pages.mjs\n  ${stale.join("\n  ")}`);
    process.exit(1);
  }
  console.log(
    check
      ? `✓ axis pages: ${Object.keys(files).length} files match this commit's /api/gspc`
      : `✓ axis pages: ${Object.keys(files).length - 1} axes + axes.html rendered into ${relative(ROOT, outDir) || "."}`,
  );
}
