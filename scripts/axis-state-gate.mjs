#!/usr/bin/env node
/**
 * axis-state-gate — a static axis page may not state a separation, status or n that the board
 * it ships with does not serve.
 *
 * WHY. Persona audit T06 (2026-10-06): /axis/jail said "TIE on the live board (n=71,
 * acc=0.5915)" and carried a "separation: TIE" pill while GET /api/gspc said UNTESTED (since
 * C-2026-0929-02); /axes listed governance, provenance, care … as "sep=UNTESTED" while the board
 * said TIE; /benchmarks repeated "Jail MEASURED with separation TIE (2026-08-25)"; and the glossary
 * offered a separation word ("UNTRIED") the board has never had. facts-gate checks counts against
 * facts.json; nothing compared these pages' per-axis VALUES with the board's.
 *
 * WHAT. For dist/client/axis/<axis>.html, axes.html and benchmarks/index.html:
 *   1. Structured tokens (data-axis + data-status / data-separation / data-n, written by
 *      scripts/surface/build-axis-pages.mjs) must equal that axis's row in the payload, and a
 *      separation token must be a word in state_enum.separation (or empty on a fact axis).
 *   2. Fallback tokens in visible text and meta descriptions — "sep=X", "separation: X",
 *      "separation X" — are attributed to the nearest preceding axis name (or the page's own
 *      axis) and must be in state_enum.separation and equal the payload's value.
 *   3. A sentence that asserts a separated lead, or a TIE, for an axis whose payload says
 *      otherwise fails. Definitions (<dl data-glossary>) and "is not a win / is not a tie"
 *      sentences are not assertions.
 * It compares VALUES read off the page with VALUES read off the payload; it lists no phrase that
 * must or must not appear.
 *
 * PAYLOAD. --board-reference prerender-board-reference.json (the board the prerender served, as
 * facts-gate reads it), or --payload <board.json>, or else this commit's own /api/gspc computed
 * offline (scripts/surface/commit-board.mjs).
 *
 *   node scripts/axis-state-gate.mjs dist/client [--board-reference prerender-board-reference.json]
 *   node scripts/axis-state-gate.mjs --selftest
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function visible(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<dl\b[^>]*data-glossary[^>]*>[\s\S]*?<\/dl>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ");
}

function metaText(html) {
  return [...html.matchAll(/<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content="([^"]*)"/gi)]
    .map((m) => m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"))
    .join(" . ");
}

const expectedSep = (row) =>
  row?.kind === "deterministic-facts" ? "" : row?.status === "MEASURED" ? row?.separation ?? "UNTESTED" : "";

/** 1: structured data-* tokens. */
export function checkStructured(html, board, file) {
  const out = [];
  const rows = new Map((board.axes ?? []).map((a) => [a.axis, a]));
  const enumSep = new Set(board.state_enum?.separation ?? []);
  for (const m of html.matchAll(/<[a-z]+\b[^>]*\bdata-axis="([^"]+)"[^>]*>/gi)) {
    const tag = m[0];
    const axis = m[1];
    const row = rows.get(axis);
    if (!row) { out.push(`${file}: data-axis="${axis}" is not an axis on the board`); continue; }
    const attr = (k) => { const a = tag.match(new RegExp(`\\bdata-${k}="([^"]*)"`)); return a ? a[1] : null; };
    const sep = attr("separation");
    if (sep !== null) {
      if (sep !== "" && !enumSep.has(sep)) out.push(`${file}: ${axis} separation "${sep}" is not in state_enum.separation`);
      if (sep !== expectedSep(row)) out.push(`${file}: ${axis} says separation "${sep}", the board serves "${expectedSep(row)}"`);
    }
    const status = attr("status");
    if (status !== null && status !== (row.status ?? "UNMEASURED")) out.push(`${file}: ${axis} says status ${status}, the board serves ${row.status}`);
    const n = attr("n");
    if (n !== null && n !== "" && Number(n) !== row.n) out.push(`${file}: ${axis} says n=${n}, the board serves n=${row.n}`);
  }
  return out;
}

const SEP_TOKEN = /\b(?:sep\s*=\s*|separation\s*[:=]?\s*)([A-Z][A-Z_ ]*[A-Z])\b/g;
const NON_ENUM_SEP = /\bUNTRIED\b/;

/** The axis a position in the text refers to: the nearest preceding axis id within `reach`. */
function axisBefore(text, index, ids, reach = 160) {
  const from = Math.max(0, index - reach);
  const window = text.slice(from, index).toLowerCase();
  let best = null, at = -1;
  for (const id of ids) {
    const re = new RegExp(`(^|[^a-z0-9-])${id.replace(/[-]/g, "\\-")}(?![a-z0-9-])`, "g");
    let m;
    while ((m = re.exec(window)) !== null) if (m.index > at) { at = m.index; best = id; }
  }
  return best;
}

/** 2 + 3: fallback tokens and asserted states in prose. */
export function checkProse(html, board, file, pageAxis = null) {
  const out = [];
  const rows = new Map((board.axes ?? []).map((a) => [a.axis, a]));
  const ids = [...rows.keys()].sort((a, b) => b.length - a.length);
  const enumSep = new Set(board.state_enum?.separation ?? []);
  const text = `${metaText(html)} . ${visible(html)}`;

  if (NON_ENUM_SEP.test(text)) out.push(`${file}: uses "UNTRIED", which is not a separation state (state_enum.separation: ${[...enumSep].join(", ")})`);

  for (const m of text.matchAll(SEP_TOKEN)) {
    const word = m[1].trim();
    const first = word.split(/\s+/)[0];
    if (!/^(SEPARATED|TIE|UNTESTED|UNTRIED|NOT|N)$/.test(first)) continue; // "separation SENTENCE" etc. are not states
    const axis = axisBefore(text, m.index, ids) ?? pageAxis;
    if (!axis) continue;
    const row = rows.get(axis);
    if (!enumSep.has(first)) { out.push(`${file}: "${m[0].trim()}" (${axis}) is not a state_enum.separation word`); continue; }
    if (first !== expectedSep(row)) out.push(`${file}: "${m[0].trim()}" for ${axis}, the board serves "${expectedSep(row) || "no separation (fact axis)"}"`);
  }

  for (const sentence of text.split(/(?<=[.!?])\s+/)) {
    if (/\bis not a (?:win|tie)\b|\bare not wins\b|\bnot (?:a )?separated\b|\bno model separated\b|\bdid not separate\b/i.test(sentence)) continue;
    const assertsTie = /\bTIE on the live board\b|\b(?:is|reads|stays|was determined)\s+(?:a\s+)?TIE\b|\bseparation\s+TIE\b/.test(sentence);
    const assertsSep = /\bseparated (?:lead|leader)\b|\blead(?:er)? (?:is |was )?separated\b/i.test(sentence) && !/\bnot\b|\bno\b|\bnever\b/i.test(sentence);
    if (!assertsTie && !assertsSep) continue;
    const named = ids.filter((id) => new RegExp(`(^|[^a-z0-9-])${id.replace(/-/g, "\\-")}(?![a-z0-9-])`, "i").test(sentence));
    const targets = named.length ? named : pageAxis ? [pageAxis] : [];
    for (const axis of targets) {
      const want = expectedSep(rows.get(axis));
      if (assertsTie && want !== "TIE") out.push(`${file}: asserts a TIE for ${axis}, the board serves "${want || "no separation (fact axis)"}": ${JSON.stringify(sentence.slice(0, 140))}`);
      if (assertsSep && want !== "SEPARATED") out.push(`${file}: asserts a separated lead for ${axis}, the board serves "${want || "no separation (fact axis)"}": ${JSON.stringify(sentence.slice(0, 140))}`);
    }
  }
  return out;
}

export function checkPage(html, board, file, pageAxis = null) {
  return [...checkStructured(html, board, file), ...checkProse(html, board, file, pageAxis)];
}

function pagesIn(dist, board) {
  const ids = new Set((board.axes ?? []).map((a) => a.axis));
  const out = [];
  const axisDir = join(dist, "axis");
  if (existsSync(axisDir))
    for (const f of readdirSync(axisDir).sort()) {
      if (!f.endsWith(".html")) continue;
      const id = basename(f, ".html");
      // Dated reports under /axis/ (e.g. a named run) are not the axis page; only <axis>.html is.
      if (ids.has(id)) out.push({ path: join(axisDir, f), axis: id });
    }
  for (const rel of ["axes.html", "axes/index.html", "benchmarks/index.html", "benchmarks.html"])
    if (existsSync(join(dist, rel))) out.push({ path: join(dist, rel), axis: null });
  return out;
}

async function loadBoard(args) {
  const val = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  if (val("--payload")) return JSON.parse(readFileSync(resolve(REPO, val("--payload")), "utf8"));
  const ref = val("--board-reference");
  if (ref && existsSync(resolve(REPO, ref))) {
    const doc = JSON.parse(readFileSync(resolve(REPO, ref), "utf8"));
    return JSON.parse(Buffer.from(doc.board_base64, "base64").toString("utf8"));
  }
  const { commitBoard } = await import("./surface/commit-board.mjs");
  const { status, raw } = await commitBoard(REPO);
  if (status !== 200) throw Error(`this commit's /api/gspc answered HTTP ${status}`);
  return JSON.parse(raw.toString("utf8"));
}

async function run(args) {
  const dist = resolve(REPO, args.find((a, i) => !a.startsWith("--") && !(i > 0 && args[i - 1].startsWith("--"))) ?? "dist/client");
  const board = await loadBoard(args);
  if (!Array.isArray(board.axes) || !board.axes.length || !Array.isArray(board.state_enum?.separation)) {
    console.error("✖ axis-state-gate cannot run: the payload has no axes or no state_enum.separation");
    process.exit(2);
  }
  const pages = pagesIn(dist, board);
  if (!pages.length) {
    console.error(`✖ axis-state-gate cannot run: no axis pages under ${relative(REPO, dist) || "."}`);
    process.exit(2);
  }
  const findings = [];
  for (const p of pages) findings.push(...checkPage(readFileSync(p.path, "utf8"), board, relative(REPO, p.path), p.axis));
  if (findings.length) {
    console.error(`✖ axis-state-gate: ${findings.length} finding(s)`);
    for (const f of findings) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`✓ axis-state-gate: ${pages.length} pages agree with the board on every axis state, separation and n`);
}

async function selftest() {
  const FIX = join(REPO, "scripts", "__fixtures__", "axis-state-gate");
  const board = JSON.parse(readFileSync(join(FIX, "board.json"), "utf8"));
  const { renderAll } = await import("./surface/build-axis-pages.mjs");
  let bad = 0;
  const must = (name, findings, red) => {
    if ((findings.length > 0) !== red) { bad++; console.error(`✖ selftest ${name}: expected ${red ? "RED" : "GREEN"} ${JSON.stringify(findings.slice(0, 3))}`); }
    else console.log(`✓ selftest ${name}: ${red ? "goes red" : "stays green"}`);
  };
  // Failing controls: the bytes /axis/jail and /axes actually served before this gate existed.
  must("stale /axis/jail (TIE pill + 'TIE on the live board' + UNTRIED)", checkPage(readFileSync(join(FIX, "stale-axis-jail.html"), "utf8"), board, "axis/jail.html", "jail"), true);
  must("stale /axes (sep=UNTESTED on TIE axes)", checkPage(readFileSync(join(FIX, "stale-axes.html"), "utf8"), board, "axes.html"), true);
  must("stale /benchmarks meta (Jail … separation TIE)", checkPage('<meta name="description" content="The live GSPC board. Jail MEASURED with separation TIE (2026-08-25)."><p>x</p>', board, "benchmarks/index.html"), true);
  must("wrong data-n", checkPage('<p data-axis="governance" data-status="MEASURED" data-separation="TIE" data-n="30">x</p>', board, "axis/governance.html", "governance"), true);
  must("non-enum data-separation", checkPage('<p data-axis="governance" data-status="MEASURED" data-separation="UNTRIED" data-n="237">x</p>', board, "axis/governance.html", "governance"), true);
  must("asserted separated lead on a TIE axis", checkPage("<p>The governance leader is separated from the field.</p>", board, "axes.html"), true);
  // Honest forms stay green: the generated pages, a TIE stated where the board says TIE, a
  // definition, and a negation.
  const files = renderAll(board);
  for (const [rel, html] of Object.entries(files)) {
    const axis = rel.startsWith("axis/") ? rel.slice(5, -5) : null;
    must(`generated ${rel}`, checkPage(html, board, rel, axis), false);
  }
  must("TIE where the board says TIE", checkPage("<p>governance: separation TIE.</p>", board, "axes.html"), false);
  must("a TIE is not a win", checkPage("<p>A TIE is not a win, and UNTESTED is not a tie.</p>", board, "axis/jail.html", "jail"), false);
  if (bad) { console.error(`✖ axis-state-gate selftest FAILED (${bad})`); process.exit(1); }
  console.log("✓ axis-state-gate selftest: stale pages go red, generated and honest pages stay green");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) await selftest();
  else await run(args);
}
