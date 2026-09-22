#!/usr/bin/env node
/**
 * llms.txt / llms-full.txt — DERIVED, never typed.
 *
 * WHY THIS EXISTS. Both files told their readers "do not freeze numbers in this file" and
 * then froze them: the lid appeared verbatim three times, public_leader_count as "(live: 3)",
 * the board pair as "22·22·0", and llms-full.txt embedded a whole /api/gspc payload. A number
 * typed into a file is a number nothing retires — the exact failure council-os/QUOTING-NUMBERS.md
 * exists to stop. So the prose lives in scripts/llms/*.tmpl and every count is substituted at
 * build time from a NAMED source:
 *
 *   {{LID}} {{PUBLIC_COUNT}} {{AXES}} {{MEASURED}} {{UNMEASURED}}      GET /api/gspc → totals.*
 *   {{PUBLIC_LEADER_COUNT}} {{MODEL_FLEETS}} {{FACT_RUNS}} {{DOI}}      GET /api/gspc
 *   {{BOARD_SNAPSHOT_JSON}}                                            GET /api/gspc (whole body)
 *   {{CARD_CORPORA_SECTION}}                                           the three corpora files
 *   {{MCP_TOOLS}} {{MCP_FREE}} {{MCP_PAID}} {{MCP_FREE_WORD}} {{MCP_PAID_WORD}}
 *                                                                      functions/mcp/{gspc,paid}-tools.json
 *   {{AXIS_DOORS_SECTION}} {{AXIS_DEEP_SECTION}}                       GET /api/gspc → axes[] (one entry per row)
 *   {{PAID_DOORS_SECTION}}                                            council-os/capabilities.json (the ONE declaration)
 *
 * The per-axis sections were the second exception. llms-full.txt typed a "deep reference" block per
 * axis — family, kind, status, n, page URL — for 22 axes, with n values frozen in the template, and
 * no block at all for the slot ADR-002 added. A reader asking "which door serves axis X" got a
 * hand-copied list that the board had already outgrown. Both sections are now rendered from the
 * same axes[] array the snapshot is taken from: one row-door line per axis in llms.txt (no status,
 * no n — those live on the row) and one block per axis in llms-full.txt (status and n copied from
 * the same fetch as the snapshot above it, so the two can never disagree).
 *
 * The tool counts were the exception this file forgot about itself. The header said "DERIVED,
 * never typed" while the template typed "11 tools ... seven free readers plus four x402-metered"
 * — three numbers and two number-words that nothing retires. The door's tool set has changed twice
 * this month (witness_hash quarantined, then dropped from the packaged manifest), and each change
 * silently aged this file. They come from the same two JSON files the door itself reads.
 *
 * The lid is copied VERBATIM from totals.lid. It is never re-phrased here: re-phrasing is how
 * the error gets reintroduced.
 *
 * Templates live in scripts/, not public/ — anything under public/ is served.
 *
 *   node scripts/llms-txt.mjs            # write public/llms.txt + public/llms-full.txt
 *   node scripts/llms-txt.mjs --check    # CI: committed files must equal what we derive
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const BOARD = process.env.CSOAI_BOARD_URL || "https://councilof.ai/api/gspc";
const p = (...a) => path.join(REPO, ...a);
const readJSON = (f) => JSON.parse(fs.readFileSync(p(f), "utf8"));

// The door's own tool definitions — the same two files functions/mcp/[[path]].ts serves from.
const WORDS = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve"];
const numWord = (n) => WORDS[n] ?? String(n);
const mcpCounts = () => {
  const free = readJSON("functions/mcp/gspc-tools.json").tools.length;
  const paid = readJSON("functions/mcp/paid-tools.json").tools.length;
  return { free, paid, total: free + paid };
};

async function board() {
  const r = await fetch(BOARD, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`${BOARD} -> HTTP ${r.status}`);
  return r.json();
}

// The three card corpora share no members. /api/state records the relation; naming all three
// is the only way a reader knows which one a number is about. See council-os/CARD-CORPORA.md.
function corporaSection() {
  const bundle = readJSON("public/cards-bundle.json");
  const root = readJSON("public/root.json");
  const index = readJSON("public/signed/card_index.json");
  const n = Array.isArray(index.cards) ? index.cards.length : null;
  if (n === null || index.n_cards !== n || index.n_cells !== n) {
    throw new Error(`card_index.json is internally inconsistent (n_cards=${index.n_cards} n_cells=${index.n_cells} len=${n}) — neither number is quotable`);
  }
  return `## Card corpora (THREE, and they share no members)

Three artifacts here carry a "card count". They are about different bytes and their identifier
overlap is zero, so never add them, never reconcile them, and never let one stand in for another.

The counts are deliberately NOT printed here. They move with each build -- the public root's
card_count read 152 and 153 within one day of 2026-09-05, which is build timing and not
disagreement -- and a number frozen into a file is a number nothing retires. Quote them by FIELD
PATH from the live artifact instead:

- Wrappers on disk, a build aggregate that signs nothing and measures nothing:
  public/cards-bundle.json -> card_count
- Public-root Merkle leaves, kind "catalogued": https://councilof.ai/root.json -> card_count
  (read merkle_root and as_of from that same fetch, and say which host you fetched)
- Signed card index, kind "catalogued": https://councilof.ai/signed/card_index.json -> n_cards,
  which MUST equal n_cells and cards[].length; if they disagree, neither number is quotable
- ...of those, VERIFIED: https://councilof.ai/api/state -> card_chain.bodies_verified_valid,
  kind "measured" -- the only one of the three behind which a check was actually run
- The relation itself: https://councilof.ai/api/state -> signed_cards.corpus_relation

The root's OpenTimestamps proof covers root.json bytes only. It does not anchor the signed-card
index and it does not anchor GSPC.
`;
}

// One door per axis, addressed the way the board spells the axis id. Every URL below is a shape
// the edge serves today (/api/gspc?axis= filters the board to one row; /axis/<id> is the
// per-axis page the deep builder writes from the same board, served slashless). The bank or evidence URL is copied
// from the row: a model-comparison axis carries a frozen bank on the Hub, a deterministic-facts
// axis carries a run artifact, and a row that carries neither says so rather than inventing one.
const SITE = "https://councilof.ai";
const rowDoor = (a) => `${SITE}/api/gspc?axis=${encodeURIComponent(a.axis)}`;
// The edge serves the per-axis page slashless and answers /axis/<id>.html with a 308 to it, so the
// door named here is the one the edge serves, not the file name the builder writes.
const pageDoor = (a) => `${SITE}/axis/${a.axis}`;
const abs = (u) => (typeof u === "string" && u.startsWith("/") ? `${SITE}${u}` : u);
function bankOrEvidence(a) {
  const parts = [];
  if (a.dataset_url) parts.push(`bank ${a.dataset_url}`);
  if (a.evidence_url) parts.push(`evidence ${abs(a.evidence_url)}`);
  return parts.length ? parts.join(" · ") : "bank: none on this row (the board row is the evidence pointer)";
}

function axisDoorsSection(b) {
  const rows = b.axes || [];
  if (!rows.length) throw new Error("GET /api/gspc carried no axes[] — nothing to derive a door list from");
  const lines = rows.map((a) =>
    `- ${a.axis} (${a.family ?? "?"}, ${a.kind ?? "?"}): row GET ${rowDoor(a)} · page ${pageDoor(a)} · ${bankOrEvidence(a)} · MCP get_axis {"axis":"${a.axis}"}`);
  return `## Axis doors (one line per axis on the live board, derived from GET /api/gspc at generation)

Each line names the doors that serve ONE axis's result: the board row filtered to that axis, the
per-axis page, and the frozen bank or run artifact behind it. Status, n, leader and separation
live on the row and are deliberately not printed here — read the row. The same row is served by
the MCP tool get_axis (POST https://councilof.ai/mcp) for every axis the board carries.
Measurement, not certification.

${lines.join("\n")}
`;
}

function axisDeepSection(b) {
  const rows = b.axes || [];
  const block = (a) => {
    const l = [`### ${a.axis}`,
      `- family: \`${a.family ?? null}\``,
      `- kind: \`${a.kind ?? null}\``,
      `- status: \`${a.status ?? null}\``,
      `- n: ${a.n ?? null}${a.n_unit ? ` (${a.n_unit})` : ""}`];
    if (a.kind === "model-comparison") l.push(`- separation: \`${a.separation ?? null}\``);
    l.push(`- row: ${rowDoor(a)}`, `- page: ${pageDoor(a)}`);
    if (a.dataset_url) l.push(`- bank: ${a.dataset_url}`);
    if (a.evidence_url) l.push(`- evidence: ${abs(a.evidence_url)}`);
    return l.join("\n");
  };
  return rows.map(block).join("\n\n") + "\n";
}

// The paid HTTP doors, derived from council-os/capabilities.json — the ONE declaration that
// /.well-known/x402.json, public/openapi.json and this file are all rendered from.
//
// WHY THIS IS DERIVED. This file used to carry a hand-typed list of ten door URLs. The live
// manifest advertises twenty-one resources: the ten named doors, the free door, and the ten
// /api/pop/* population doors that functions/.well-known/x402.json.ts derives from the
// population registry. Every population door was therefore advertised to agents that read the
// manifest and absent from the file that AI crawlers read first — a door nobody could find from
// here, added by code that never touched this list. A list maintained beside the thing it
// describes goes stale the first time the thing moves.
function paidDoorsSection() {
  const reg = readJSON("council-os/capabilities.json");
  const doors = reg.capabilities
    .filter((c) => c.payment === "x402" || c.payment === "free_preview_then_x402")
    .filter((c) => c.path)
    .sort((a, b) => a.path.localeCompare(b.path));
  if (!doors.length) throw new Error("council-os/capabilities.json declares no paid door — absent is not zero");
  const lines = doors.map((c) => {
    const req = c.probe?.request ?? c.path;
    const preview = c.free_preview ? ` · free preview: ${SITE}${c.free_preview}` : "";
    return `  - ${SITE}${req}${preview}\n    ${c.description}`;
  });
  const freeDoors = reg.capabilities
    .filter((c) => c.kind !== "mcp_tool" && c.kind !== "a2a_skill" && c.payment === "free" && (c.probe?.expect_status ?? []).includes(402))
    .map((c) => `  - ${SITE}${c.path} — a live 402 route priced at zero: it settles, and charges nothing.`);
  return `- HTTP doors (GET or POST -> 402 unless \`X-PAYMENT\` / facilitator settlement). Derived from
  council-os/capabilities.json at generation; the same declaration renders /.well-known/x402.json
  and every operation in /openapi.json carrying x-payment-info. Do not count this list to learn how
  many doors there are — fetch GET ${SITE}/.well-known/x402.json and count \`resources\`.
${lines.join("\n")}
${freeDoors.length ? freeDoors.join("\n") + "\n" : ""}- Free preview: omit \`bundle=1\` or add \`preview=1\` as the 402 body documents. Verify stays free: ${SITE}/gspc-verify`;
}

function render(tmpl, t, snapshotJson, corpora, axisDoors, axisDeep) {
  const map = {
    LID: t.lid,                                  // verbatim, never re-phrased
    PUBLIC_COUNT: t.public_count,
    AXES: t.axes, MEASURED: t.measured_axes, UNMEASURED: t.unmeasured_axes,
    PUBLIC_LEADER_COUNT: t.public_leader_count,
    MODEL_FLEETS: t.model_fleets, FACT_RUNS: t.fact_runs,
    DOI: t.doi, BOARD_SNAPSHOT_JSON: snapshotJson, CARD_CORPORA_SECTION: corpora,
    AXIS_DOORS_SECTION: axisDoors, AXIS_DEEP_SECTION: axisDeep,
    PAID_DOORS_SECTION: paidDoorsSection(),
    ...(() => {
      const m = mcpCounts();
      return { MCP_TOOLS: m.total, MCP_FREE: m.free, MCP_PAID: m.paid,
               MCP_FREE_WORD: numWord(m.free), MCP_PAID_WORD: numWord(m.paid) };
    })(),
  };
  let out = tmpl;
  for (const [k, v] of Object.entries(map)) {
    if (v === undefined || v === null) throw new Error(`derivation source is missing for {{${k}}} — absent is not zero`);
    out = out.split(`{{${k}}}`).join(String(v));
  }
  const left = out.match(/\{\{[A-Z_]+\}\}/);
  if (left) throw new Error(`unsubstituted placeholder ${left[0]} — it has no named source`);
  return out;
}

let b;
try {
  b = await board();
} catch (e) {
  // A network blip must not turn a lane's PR red, and it must never read as a pass either.
  // UNCHECKABLE is a real third state: say it, name it, and do not claim the files match.
  if (CHECK) {
    console.error(`\u26a0 UNCHECKABLE: could not reach ${BOARD} (${e.message}).`);
    console.error(`  The committed llms files were NOT verified against live. This is not a pass.`);
    process.exit(0);
  }
  throw e;
}
// Do NOT mutate b.totals: the snapshot below must be a faithful copy of what the endpoint
// returns. Writing doi into totals would put a key there that /api/gspc does not carry.
const t = { ...(b.totals || {}), doi: b.doi ?? b.totals?.doi ?? null };
// Same SHAPE the file already published: schema/as_of/totals plus a per-axis summary row.
// The full payload is ~1129 lines and would swamp the file; a trimmed row per axis is what
// this file has always carried, so trimming here preserves it rather than shrinking it.
// Every field is copied from the response — nothing is computed, defaulted, or invented, and a
// field the API does not carry stays null rather than becoming 0.
const axesRows = (b.axes || []).map((a) => ({
  axis: a.axis, status: a.status, family: a.family, kind: a.kind,
  n: a.n ?? null, accuracy: a.accuracy ?? null, separation: a.separation ?? null,
}));
// totals.sweep_note is a dated prose note (the 2026-08-26 ADR-001 sweep) that states a board
// count in words. Mirroring prose into a static file is how a count goes stale: the note is
// true of the day it describes, but this file is read as current. It is therefore replaced by
// a pointer — visibly, never silently dropped — so the only counts in this file are the derived
// totals.* fields above. Every other key is copied verbatim. (C-2026-0916-01, facts-gate.)
const totalsForSnapshot = { ...(b.totals || {}) };
if (Object.prototype.hasOwnProperty.call(totalsForSnapshot, "sweep_note")) {
  totalsForSnapshot.sweep_note =
    "<not mirrored: a dated prose note. Read it live at GET /api/gspc -> totals.sweep_note>";
}
const snapshot = JSON.stringify(
  { schema: b.schema, as_of: b.as_of ?? null, totals: totalsForSnapshot, axes_count: axesRows.length, axes: axesRows },
  null, 2);
const corpora = corporaSection();
const axisDoors = axisDoorsSection(b);
const axisDeep = axisDeepSection(b);

const OUT = [
  ["scripts/llms/llms.txt.tmpl", "public/llms.txt"],
  ["scripts/llms/llms-full.txt.tmpl", "public/llms-full.txt"],
];

let drift = 0;
for (const [tf, of] of OUT) {
  const want = render(fs.readFileSync(p(tf), "utf8"), t, snapshot, corpora, axisDoors, axisDeep);
  if (CHECK) {
    const have = fs.existsSync(p(of)) ? fs.readFileSync(p(of), "utf8") : "";
    if (have !== want) {
      drift++;
      console.error(`✖ ${of} does not match what it derives from ${BOARD} + the corpora files.`);
      console.error(`   Regenerate:  node scripts/llms-txt.mjs`);
    } else {
      console.log(`✓ ${of} matches live (${t.public_count})`);
    }
  } else {
    fs.writeFileSync(p(of), want);
    console.log(`wrote ${of}  (${t.public_count}; lid verbatim)`);
  }
}
if (CHECK && drift) process.exit(1);
