#!/usr/bin/env node
/**
 * csoai — the Council of AI command line. First command: `csoai check <model>`.
 *
 * `check` prints the signed axis/staleness snapshot for any model on the public
 * measurement record: one row per measured axis — accuracy, the card's age in
 * days (staleness is a first-class fact, not an embarrassment), and the
 * verification state of that card's Ed25519 signature against the PINNED key
 * in the bundled profile. Three states, never two: VALID, INVALID, UNCHECKABLE.
 *
 * What this command is NOT: a grade, a certification, or a score of your model.
 * It reports what was measured, when, and whether the signed bytes verify.
 *
 * Data source: https://councilof.ai/signed/card-matrix.json (derived at build
 * time from the signed card corpus) plus the individual card files it names.
 * The card axes are BENCHMARK axes — not the governance board axes; the board
 * is GET /api/gspc. The two sets are different on purpose.
 *
 * Offline verification of cards you already hold is `gspc-verify`
 * (packages/gspc-card-verifier) — that command never touches the network.
 *
 * EXIT CODES (a positive result is never returned on a path that did not complete)
 *   0  model found; every card VALID
 *   1  at least one card INVALID
 *   2  usage error, network failure, unknown model, or any card UNCHECKABLE
 */

import { verifyCard, defaultProfile } from "gspc-card-verifier";

const DEFAULT_BASE = "https://councilof.ai";
const MATRIX_PATH = "/signed/card-matrix.json";

const USAGE = `csoai — Council of AI CLI (measurement, never certification)

  csoai check <model>          signed axis/staleness snapshot for a measured model

Options for check
  --json                  machine-readable report on stdout
  --base <url>            estate origin (default: ${DEFAULT_BASE})
  --contains              substring match instead of exact model id
  -h, --help              this text

Exit: 0 all cards VALID · 1 any INVALID · 2 unknown model / fetch failed / any UNCHECKABLE
`;

function die(msg) {
  process.stderr.write(`csoai: ${msg}\n`);
  process.exit(2);
}

export function parseArgs(argv) {
  const o = { json: false, contains: false, base: DEFAULT_BASE, command: null, subject: null };
  const args = [...argv];
  while (args.length) {
    const a = args.shift();
    if (a === "-h" || a === "--help") { process.stdout.write(USAGE); process.exit(0); }
    else if (a === "--json") o.json = true;
    else if (a === "--contains") o.contains = true;
    else if (a === "--base") o.base = args.shift() ?? die("--base needs a value");
    else if (a.startsWith("--base=")) o.base = a.slice(7);
    else if (a.startsWith("-")) die(`unknown option: ${a}`);
    else if (!o.command) o.command = a;
    else if (!o.subject) o.subject = a;
    else die(`unexpected extra argument: ${a}`);
  }
  return o;
}

export function ageDays(createdISO, now = Date.now()) {
  const t = Date.parse(createdISO);
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / 86400000);
}

export function findModel(matrix, subject, contains) {
  const models = Array.isArray(matrix?.models) ? matrix.models : [];
  const cells = Array.isArray(matrix?.cells) ? matrix.cells : [];
  const exact = models.find((m) => m.id === subject);
  const model = exact
    ? subject
    : contains
      ? (models.filter((m) => m.id.includes(subject)).map((m) => m.id)[0] ?? null)
      : null;
  if (!model) return { model: null, cells: [], candidates: models.map((m) => m.id) };
  return { model, cells: cells.filter((c) => c.model === model), candidates: [] };
}

export function formatRow({ axis, accuracy, age, state }) {
  const acc = accuracy === null || accuracy === undefined ? "     —" : (accuracy * 100).toFixed(1).padStart(5) + "%";
  const ageS = age === null ? "  ?" : String(age).padStart(3) + "d";
  return `${String(axis).padEnd(24)} ${acc}  age ${ageS}  ${state}`;
}

async function fetchJson(url) {
  const r = await fetch(url, { headers: { "user-agent": "csoai-cli/0.2 (+https://councilof.ai)" } });
  if (!r.ok) throw new Error(`GET ${url} -> HTTP ${r.status}`);
  return r.json();
}

async function check(subject, opts) {
  const base = opts.base.replace(/\/$/, "");
  const matrix = await fetchJson(base + MATRIX_PATH);
  const { model, cells, candidates } = findModel(matrix, subject, opts.contains);
  if (!model) {
    const hint = candidates.filter((c) => c.includes(subject)).slice(0, 8);
    return {
      exit: 2,
      report: { found: false, subject, hint },
      text:
        `model not on the public measurement record: ${subject}\n` +
        (hint.length
          ? `closest ids:\n  ${hint.join("\n  ")}\n`
          : `the measured models are listed in ${MATRIX_PATH}\n`),
    };
  }
  const profile = defaultProfile();
  const rows = [];
  for (const cell of cells) {
    let state = "UNCHECKABLE";
    let code = "NOT_FETCHED";
    try {
      const card = await fetchJson(base + cell.card_url);
      const res = await verifyCard(card, profile);
      state = res.state;
      code = res.code;
    } catch {
      code = "FETCH_FAILED";
    }
    rows.push({
      axis: cell.axis,
      accuracy: cell.accuracy,
      age: ageDays(cell.created),
      state,
      code,
      card: cell.card,
      card_url: base + cell.card_url,
      created: cell.created,
    });
  }
  rows.sort((a, b) => a.axis.localeCompare(b.axis));
  const anyInvalid = rows.some((r) => r.state === "INVALID");
  const anyUncheckable = rows.some((r) => r.state === "UNCHECKABLE");
  const exit = anyInvalid ? 1 : anyUncheckable ? 2 : 0;
  const ages = rows.map((r) => r.age).filter((a) => a !== null);
  const oldest = ages.length ? Math.max(...ages) : null;
  const lines = [
    `csoai check — ${model}`,
    `signed cells: ${rows.length} · oldest card age: ${oldest === null ? "?" : oldest + "d"} · every row verified against the pinned did:web:csoai.org key`,
    ``,
    ...rows.map(formatRow),
    ``,
    anyInvalid
      ? `RESULT: at least one card INVALID — do not rely on this output; report it: https://councilof.ai/api/corrections`
      : anyUncheckable
        ? `RESULT: UNCHECKABLE rows present — 'could not check' is not a pass`
        : `RESULT: all ${rows.length} signed card(s) VALID · measurement, never certification`,
    `verify offline yourself: gspc-verify <card.json>  (packages/gspc-card-verifier)`,
  ];
  return {
    exit,
    report: { found: true, model, cells: rows, matrix_as_of: matrix.as_of ?? null },
    text: lines.join("\n") + "\n",
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.command !== "check")
    die(opts.command ? `unknown command: ${opts.command}` : "no command — try `csoai check <model>`");
  if (!opts.subject) die("check needs a model id — try `csoai check qwen3:0.6b`");
  let out;
  try {
    out = await check(opts.subject, opts);
  } catch (e) {
    die(`could not complete: ${e.message}`);
  }
  if (opts.json) process.stdout.write(JSON.stringify(out.report, null, 2) + "\n");
  else process.stdout.write(out.text);
  process.exit(out.exit);
}

// Run only as a script, not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) main();
