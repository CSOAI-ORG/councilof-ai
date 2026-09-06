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

function render(tmpl, t, snapshotJson, corpora) {
  const map = {
    LID: t.lid,                                  // verbatim, never re-phrased
    PUBLIC_COUNT: t.public_count,
    AXES: t.axes, MEASURED: t.measured_axes, UNMEASURED: t.unmeasured_axes,
    PUBLIC_LEADER_COUNT: t.public_leader_count,
    MODEL_FLEETS: t.model_fleets, FACT_RUNS: t.fact_runs,
    DOI: t.doi, BOARD_SNAPSHOT_JSON: snapshotJson, CARD_CORPORA_SECTION: corpora,
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
const snapshot = JSON.stringify(
  { schema: b.schema, as_of: b.as_of ?? null, totals: b.totals, axes_count: axesRows.length, axes: axesRows },
  null, 2);
const corpora = corporaSection();

const OUT = [
  ["scripts/llms/llms.txt.tmpl", "public/llms.txt"],
  ["scripts/llms/llms-full.txt.tmpl", "public/llms-full.txt"],
];

let drift = 0;
for (const [tf, of] of OUT) {
  const want = render(fs.readFileSync(p(tf), "utf8"), t, snapshot, corpora);
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
