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
 *   {{SEPARATED_LEADS}} {{TIES}} {{UNTESTED_SEPARATIONS}} {{COMPARISON_AXES}}  GET /api/gspc -> totals.*
 *   {{DISTRIBUTION_SECTION}}                                          public/interop/distribution-latest.json
 *   {{OTS_SECTION}}                                                   public/interop/ots/manifest.json
 *   {{EVIDENCE_RECORDS_SECTION}}                                      public/evidence/published-records.json (scripts/pubbus)
 *   {{DATED_MILL_ROOT_LINE}}                                          public/interop/card-root-latest.json -> immutable root bytes
 *
 * The separation fields were the exception that mattered most. Both files said "N axes measured"
 * and nothing said what measured MEANS here, so the sentence read as "N axes can tell one model
 * from another" — which is not what the board says and never was. Separation is a SEPARATE
 * determination that the board publishes in its own totals, and today not one comparison axis
 * carries a separated lead. Those four counts are now substituted beside the measured count, from
 * the same fetch, so the two can never drift apart.
 *
 * Distribution and the timestamp manifest are derived from artifacts ON DISK rather than a second
 * live fetch. Both are published artifacts of this repository: the loops land those exact bytes
 * and the edge serves them. Deriving from the file means these numbers move only when the file
 * moves, in the same commit, so --check can never go red because a download counter ticked or a
 * calendar proof upgraded between a lane's push and its gate. A gate that reddens when the estate
 * is working correctly is a gate that gets deleted.
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
import { createHash } from "node:crypto";
import path from "path";
import { fileURLToPath } from "url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const BOARD = process.env.CSOAI_BOARD_URL || "https://councilof.ai/api/gspc";
const p = (...a) => path.join(REPO, ...a);
const readJSON = (f) => JSON.parse(fs.readFileSync(p(f), "utf8"));

// The door's own tool definitions — the same two files functions/mcp/[[path]].ts serves from.
const WORDS = ["zero","one","two","three","four","five","six","seven","eight","nine","ten","eleven","twelve","thirteen","fourteen","fifteen","sixteen","seventeen","eighteen","nineteen","twenty"];
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

const fmtN = (n) => Number(n).toLocaleString("en-US");

// Distribution — every line carries the artifact's own state, coverage and as_of.
//
// WHY EVERY LINE NAMES covered/attempted. A distribution figure was once published here that was a
// partial read presented as the whole estate: a total with no denominator beside it, and nothing in
// the bytes said which counters had answered. The artifact this derives from already records that
// (state READ | PARTIAL | UNCHECKABLE | UNMEASURED, with covered and attempted on the row), so the
// only job here is to refuse to print the value without them. A counter that returned nothing is
// named on its own line and its value stays null — never 0, never quietly folded into the sum.
function distributionSection() {
  const d = readJSON("public/interop/distribution-latest.json");
  const t = d.totals || {};
  const pkgs = Array.isArray(d.packages) ? d.packages : [];
  if (!pkgs.length) throw new Error("distribution-latest.json carries no packages[] — absent is not zero");
  const by = {};
  for (const r of pkgs) by[r.registry] = (by[r.registry] || 0) + 1;
  const perReg = Object.keys(by).sort().map((k) => `${k} ${fmtN(by[k])}`).join(" · ");
  const totalLine = (key, label) => {
    const f = t[key];
    if (!f || f.value === undefined) throw new Error(`distribution-latest.json carries no totals.${key} — absent is not zero`);
    const bound = f.state === "PARTIAL" ? ", so it is a LOWER BOUND over those, never a total over all of them" : "";
    return `- ${label}: ${fmtN(f.value)} ${f.unit} — state ${f.state}, ${fmtN(f.covered)} of ${fmtN(f.attempted)} counters answered${bound}. Window: ${f.window}. as_of ${f.as_of}.`;
  };
  const silent = pkgs.filter((r) => r.downloads_30d === null || r.downloads_all_time === null);
  const silentLines = silent.length
    ? silent.map((r) => `- Counter that did not answer, named rather than absorbed: ${r.registry} \`${r.name}\` — ${r.reason ?? "no reason recorded"}. Its value is null, never 0.`).join("\n")
    : "- Every counter answered on this run; nothing is a lower bound for want of a reply.";
  const cc = d.registries?.pypi?.cross_check;
  const ccLine = cc && cc.pepy_over_pypistats_median
    ? `- Two third-party counters over the same PyPI packages DISAGREE: on ${cc.samples_compared} sampled packages ${cc.source_url.split("/")[2]} read about ${cc.pepy_over_pypistats_median}x lower than the source published above. That divergence is recorded, not resolved by picking one, and the LARGER of the two is what is published — which is exactly why it is labelled gross. Quote this ratio beside the number.`
    : "";
  // No heading here: llms.txt and llms-full.txt number their sections differently, so each
  // template supplies the heading and this returns the body both of them share.
  return `Derived at generation from https://councilof.ai/interop/distribution-latest.json (same bytes on
disk at public/interop/distribution-latest.json, schema ${d.schema}, artifact as_of ${d.as_of}).
Re-read it live; do not quote these figures without the state and coverage beside them.

- Packages published across three registries: ${fmtN(pkgs.length)} (${perReg}). Three registries are
  three populations. The package ROWS are added; the download counts of different registries are
  reported per registry and the totals below are the artifact's own, not an arithmetic of this line.
${totalLine("downloads_30d", "Downloads in the last 30 days")}
${totalLine("downloads_all_time", "Downloads since first release (cumulative)")}
- The 30-day and cumulative figures are different WINDOWS over the same packages. They are never
  added to each other, and neither is a count of people: mirrors, CI and crawlers are inside both.
${silentLines}${ccLine ? "\n" + ccLine : ""}
- A download is distribution. It is not adoption, not a user, not a customer, and not a measurement.
  Reach says how far the board travels; authority stays GET /api/gspc, the signed cards and free verify.
- Per-entity shares (CSOAI Ltd and MEOK AI Labs publish from one account and are labelled, never
  filtered) are on the artifact at \`by_entity\`; the estate total is every row.
`;
}

// Timestamp proofs — derived from the manifest this repo publishes, on disk.
//
// A proof is Bitcoin-attested or it is a submitted request, and the two are not the same claim.
// The manifest already separates them and names how it was built (every .ots file that actually
// deserializes, never a list of files we intended to stamp). Printing its counts here without its
// as_of would be the pretence this file exists to stop: an upgrade loop moves these numbers, so the
// artifact's own as_of travels with them and the live URL is named for a fresher read.
function otsSection() {
  const m = readJSON("public/interop/ots/manifest.json");
  const c = m.counts || {};
  for (const k of ["proofs", "bitcoin_attested", "calendar_pending", "subject_absent"]) {
    if (c[k] === undefined || c[k] === null) throw new Error(`ots manifest carries no counts.${k} — absent is not zero`);
  }
  return `Derived at generation from https://councilof.ai/interop/ots/manifest.json (same bytes on disk at
public/interop/ots/manifest.json, schema ${m.schema}, artifact as_of ${m.as_of}). An upgrade loop
keeps advancing these, so read the manifest for a fresher count rather than quoting this line alone.

- Detached OpenTimestamps proofs that actually deserialize: ${fmtN(c.proofs)}. The manifest is built by
  reading every .ots file in its scanned directories and keeping only those that parse — never from a
  list of files we intended to stamp.
- Of those, Bitcoin-attested (the proof bytes carry a BitcoinBlockHeaderAttestation): ${fmtN(c.bitcoin_attested)}.
- Still calendar-pending: ${fmtN(c.calendar_pending)}. A calendar-pending proof is a submitted request, not
  evidence of a time. \`submitted\` is not \`anchored\`.
- Proofs whose subject is not served beside them: ${fmtN(c.subject_absent)} — an anchor a reader cannot check
  what was stamped against. Published as a count rather than hidden.
- This producer does not check block headers against a Bitcoin node. \`ots verify\` against your own
  node does that, and an .ots is not a proof because of its file extension.
`;
}

// Signed evidence records — derived from the publication bus manifest, on disk.
//
// scripts/pubbus/pubbus.mjs writes public/evidence/published-records.json when it publishes a
// page for a signed record (after verifying the signature). This section names each record's
// CURRENT page, its own as_of and read state, and where its bytes and signature live. It prints
// no count of records: the manifest is the list, and a count typed here would be one more number
// nothing retires. These records are evidence linked from the board, never board axes.
function evidenceRecordsSection() {
  const f = "public/evidence/published-records.json";
  if (!fs.existsSync(p(f))) {
    return "No signed evidence record page is published yet (public/evidence/published-records.json is absent).\n";
  }
  const m = readJSON(f);
  if (m.schema !== "csoai.pubbus-manifest/0.1" || !Array.isArray(m.records)) {
    throw new Error("published-records.json is not csoai.pubbus-manifest/0.1 — refusing to describe it");
  }
  const lines = [];
  for (const r of m.records) {
    const cur = (r.versions || []).find((v) => v.state === "CURRENT");
    if (!cur) continue;
    lines.push(
      `- ${r.title}: ${SITE}${cur.page} (as_of ${cur.as_of}; read_state ${cur.read_state ?? "not stated by the record"}; ` +
      `signature ${cur.signature.state} under ${cur.signature.did}; timestamp ${cur.ots.state}). ` +
      `Record bytes: ${cur.record_url} (sha256 ${cur.record_sha256}).`,
    );
  }
  return `Derived at generation from ${SITE}/evidence/published-records.json (same bytes on disk at
public/evidence/published-records.json, schema ${m.schema}). Each page shows the record's own numbers
verbatim with its stated limits, and a verify-it-yourself block (POST ${SITE}/api/verify with the
signed document; free). Census and probe records are EVIDENCE: they are never counted into the GSPC
board, whose totals stay GET ${SITE}/api/gspc. A superseded version stays published and says so.

${lines.join("\n")}
`;
}

// A direct immutable link for machine readers, derived from the same pointer the
// browser card panel checks. Keep the pointer as the moving entry point.
function datedMillRootLine() {
  const pointer = readJSON("public/interop/card-root-latest.json");
  const rootUrl = pointer.root_url;
  if (pointer.schema !== "csoai.card-root-pointer/1" ||
      pointer.kind !== "DISCOVERY_POINTER_ONLY" ||
      !/^\/interop\/card-root-\d{4}-\d{2}-\d{2}(?:-[a-f0-9]{12})?\.json$/.test(rootUrl) ||
      !/^[a-f0-9]{64}$/.test(pointer.root_sha256)) {
    throw new Error("mill-card root pointer is not checkable");
  }
  const bytes = fs.readFileSync(p(`public${rootUrl}`));
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== pointer.root_sha256) throw new Error("mill-card root bytes differ from pointer digest");
  const root = JSON.parse(bytes);
  if (root.kind !== "csoai.card-root/1" || root.as_of !== pointer.as_of ||
      root.n_leaves !== pointer.n_leaves || !Array.isArray(root.leaves) ||
      root.leaves.length !== root.n_leaves) {
    throw new Error("mill-card root count or timestamp differs from pointer");
  }
  const proofUrl = `${rootUrl}.ots`;
  const proof = fs.readFileSync(p(`public${proofUrl}`));
  const proofDigest = createHash("sha256").update(proof).digest("hex");
  const auditUrl = rootUrl.replace(/\.json$/, ".header-audit.json");
  const auditPath = p(`public${auditUrl}`);
  // No public-header audit for this root: state what the PROOF BYTES carry, read from the OTS manifest row
  // whose sha256_of_proof equals these bytes (ots_manifest_rebuild.py parses every proof). Never a frozen
  // "calendar-only" sentence: that froze a Bitcoin-attested proof as pending (llms-txt-derived.test.ts).
  const otsRow = (readJSON("public/interop/ots/manifest.json").proofs || [])
    .find((row) => row.path === proofUrl && row.sha256_of_proof === proofDigest);
  let proofState;
  if (otsRow && otsRow.state === "BITCOIN") {
    proofState = `Its .ots sidecar (SHA-256 ${proofDigest}) carries a BitcoinBlockHeaderAttestation, as parsed from the proof bytes into ${SITE}/interop/ots/manifest.json. No public-header audit is published for this root, so the block header is not independently corroborated here; this is not local Bitcoin full-node chain validation or verification of individual card measurements.`;
  } else if (otsRow && otsRow.state === "PENDING") {
    proofState = `Its .ots sidecar (SHA-256 ${proofDigest}) is calendar-pending: a submitted request, not evidence of a time, until a Bitcoin attestation is added. This is not local Bitcoin full-node chain validation.`;
  } else {
    throw new Error(`mill-card root proof ${proofUrl} (sha256 ${proofDigest}) has no matching row in public/interop/ots/manifest.json; rebuild the manifest`);
  }
  if (fs.existsSync(auditPath)) {
    const audit = readJSON(`public${auditUrl}`);
    const rows = Array.isArray(audit.public_header_evidence) ? audit.public_header_evidence : [];
    const heights = [...new Set(rows.map((row) => row.height))].sort((a, b) => a - b);
    const providers = [...new Set(rows.map((row) => row.provider))];
    const cells = new Set(rows.map((row) => `${row.provider}:${row.height}`));
    if (audit.schema !== "csoai.ots-public-header-audit/1" ||
        audit.record_state !== "UNSIGNED_PUBLIC_HEADER_AUDIT" ||
        audit.subject_sha256 !== digest ||
        audit.dated_root_has_ed25519_envelope !== false ||
        audit.individual_card_signature_checks !== "NOT_PERFORMED" ||
        root.sig_ed25519 || root.signature || root.ed25519_signature ||
        audit.isolated_upgraded_proof_sha256 !== proofDigest ||
        audit.finding !== "BITCOIN_BLOCK_HEADER_ATTESTATIONS_PUBLIC_API_CORROBORATED" ||
        heights.length < 1 || providers.length < 2 ||
        rows.length !== heights.length * providers.length || cells.size !== rows.length ||
        rows.some((row) => !audit.attestations?.some((attestation) =>
          attestation.height === row.height && attestation.merkle_root_from_proof === row.merkle_root)) ||
        rows.some((row) => !row.proof_merkle_match || !row.header_hash_recomputed || !row.pow_target_check ||
          !/^[a-f0-9]{64}$/.test(row.merkle_root))) {
      throw new Error("mill-card root public-header audit is not bound to root/proof bytes");
    }
    proofState = `Its .ots sidecar (SHA-256 ${proofDigest}) carries BitcoinBlockHeaderAttestation paths for block heights ${heights.join(" and ")}. An unsigned audit recomputed those paths against raw headers from ${providers.join(" and ")}: ${SITE}${auditUrl}. The dated root JSON has no Ed25519 signature envelope; any leaf-card signatures are separate. This is public-header corroboration, not local Bitcoin full-node chain validation or verification of individual card measurements.`;
  }
  return `- Dated immutable mill-card root (as of ${root.as_of}, ${root.n_leaves} leaves): ${SITE}${rootUrl} (SHA-256 ${digest}). ${proofState}`;
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
    // Separation is a different determination from measurement, so it travels as its own numbers.
    SEPARATED_LEADS: t.separated_leads, TIES: t.ties,
    UNTESTED_SEPARATIONS: t.untested_separations, COMPARISON_AXES: t.comparison_axes,
    DISTRIBUTION_SECTION: distributionSection(), OTS_SECTION: otsSection(),
    EVIDENCE_RECORDS_SECTION: evidenceRecordsSection(),
    DATED_MILL_ROOT_LINE: datedMillRootLine(),
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
