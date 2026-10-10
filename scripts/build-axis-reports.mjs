#!/usr/bin/env node
/**
 * build-axis-reports.mjs — one report per (GSPC board slot × subject), derived from signed cards.
 *
 * WHAT IT JOINS
 *   1. the 23 board slots      — functions/api/_gspc_axes_{a,b,c,fin}.ts, bundled with esbuild and
 *                                executed, so the slot list, kind and status are the SAME bytes that
 *                                GET /api/gspc serves. Never a second list of axes.
 *   2. the signed card corpus  — public/signed/card-matrix.json (one cell per model × corpus-axis) and
 *                                the card file behind every cell, verified (id + Ed25519) before use.
 *   3. the crosswalk           — client/src/data/regulator-crosswalk.json: obligation POINTERS
 *                                (always 'relevant-to') and `board_axis`, the join from a corpus axis
 *                                to a board slot. A slot with no join has no subject reports.
 *   4. card roots              — public/interop/card-root-*.json: which published root, if any,
 *                                carries each source card as a leaf.
 *
 * HONESTY (structural, not editorial)
 *   · A report reads MEASURED only when a source card's own body says status MEASURED at n >= 30.
 *     Otherwise it reads UNMEASURED and carries the reason. Today every card in the corpus carries
 *     accuracy but no n and no status, so every subject report is UNMEASURED — that is the finding.
 *   · Obligations appear only where the crosswalk maps them; otherwise the field is "UNMAPPED".
 *     No relation other than 'relevant-to' is accepted. Nothing here says a model violates or
 *     satisfies any provision, and nothing here is a grade, a rank or a conformity mark.
 *   · Every count in index.json is the length of an array built here. Nothing is typed.
 *   · A declared-slot axis (n 0, nothing measured) gets one index entry and no subject reports.
 *   · A deterministic-facts axis measures issuers or series, not models, so it has no subject report
 *     in this corpus; its index entry carries the board's own n and n_unit and says so.
 *
 * DETERMINISM
 *   canonical_sha256 = sha256 over the canonical JSON (keys sorted, no whitespace) of the report body
 *   minus `generated_at` and `canonical_sha256`. Unchanged inputs keep the existing file byte-for-byte
 *   (generated_at is preserved when the canonical hash is unchanged), so --check can go red only on
 *   real drift.
 *
 * USAGE
 *   node scripts/build-axis-reports.mjs            # write public/reports/**
 *   node scripts/build-axis-reports.mjs --check    # regenerate in memory; exit 1 if the tree is stale
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, relative } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_DEFAULT = join(HERE, "..");

export const SCHEMA_REPORT = "csoai.axis-report/0.1";
export const SCHEMA_INDEX = "csoai.axis-reports-index/0.1";
export const N_FLOOR = 30; // owner ruling 3 Sep 2026: MEASURED is emitted at n >= 30, never below

// ─── canonical JSON + hashing ────────────────────────────────────────────────
export function canonicalize(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalize).join(",") + "]";
  return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canonicalize(v[k])).join(",") + "}";
}
export const sha256 = (s) => createHash("sha256").update(s).digest("hex");
export function canonicalHash(report) {
  const { generated_at: _g, canonical_sha256: _c, ...body } = report;
  return sha256(canonicalize(body));
}

// ─── subject slug: filesystem/URL-safe, one-way, collision-checked at build ──
export function slugify(id) {
  return String(id).toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "");
}

// ─── the 23 slots: run the same modules /api/gspc imports ───────────────────
export async function loadSlots(repo = REPO_DEFAULT) {
  const { build } = await import("esbuild");
  const api = join(repo, "functions/api");
  const entry = ["a", "b", "c", "fin"].map((s) => `export { AXES_${s.toUpperCase()} } from "./_gspc_axes_${s}";`).join("\n");
  const r = await build({
    stdin: { contents: entry, resolveDir: api, loader: "ts" },
    bundle: true, format: "esm", platform: "neutral", write: false, logLevel: "silent",
  });
  const mod = await import("data:text/javascript;base64," + Buffer.from(r.outputFiles[0].text).toString("base64"));
  const slots = [...mod.AXES_A, ...mod.AXES_B, ...mod.AXES_C, ...mod.AXES_FIN];
  const ids = new Set();
  for (const s of slots) {
    if (ids.has(s.axis)) throw new Error(`duplicate slot id ${s.axis}`);
    ids.add(s.axis);
  }
  return slots;
}

// ─── card roots: which root carries which card ───────────────────────────────
function loadRootLeaves(repo) {
  const dir = join(repo, "public/interop");
  const byCard = new Map();
  if (!existsSync(dir)) return byCard;
  const files = readdirSync(dir).filter((f) => /^card-root-\d{4}-\d{2}-\d{2}(?:-[a-f0-9]{12})?\.json$/.test(f)).sort();
  for (const f of files) {
    let doc;
    try { doc = JSON.parse(readFileSync(join(dir, f), "utf8")); } catch { continue; }
    for (const leaf of doc.leaves || []) {
      for (const key of [leaf.id, leaf.card]) {
        if (typeof key !== "string") continue;
        if (!byCard.has(key)) byCard.set(key, []);
        byCard.get(key).push({ file: `/interop/${f}`, merkle_root: doc.merkle_root ?? null, index: leaf.index ?? null });
      }
    }
  }
  return byCard;
}

// ─── status derivation: the card body decides, never this script ────────────
export function deriveStatus(cards) {
  // cards: [{ id, body }] — newest first
  const measured = cards.filter((c) => c.body.status === "MEASURED" && Number.isInteger(c.body.n) && c.body.n >= N_FLOOR);
  if (measured.length) {
    const p = measured[0];
    return { status: "MEASURED", n: p.body.n, n_unit: p.body.n_unit ?? "bank items", reason: null, primary: p };
  }
  const p = cards[0];
  const n = p.body.n;
  let reason;
  if (!Number.isInteger(n)) {
    reason = "source card carries no n: accuracy is a single point on one small bank on one date, and the card does not state a sample size, so nothing here may read MEASURED";
  } else if (n < N_FLOOR) {
    reason = `n=${n} is below the ${N_FLOOR}-item floor; MEASURED is emitted at n >= ${N_FLOOR}, never below`;
  } else if (p.body.status !== "MEASURED") {
    reason = `source card states status '${p.body.status ?? "(absent)"}', not MEASURED`;
  } else {
    reason = "source card does not support MEASURED";
  }
  return { status: "UNMEASURED", n: Number.isInteger(n) ? n : 0, n_unit: p.body.n_unit ?? "bank items", reason, primary: p };
}

export function deriveSeparation(body) {
  if (typeof body.separation_p === "number") return body.separation_p;
  if (body.separation && typeof body.separation === "object" && typeof body.separation.p === "number") return body.separation.p;
  return "UNTESTED";
}

// ─── obligations: crosswalk pointers or UNMAPPED ────────────────────────────
export function deriveObligations(xwalk, sourceAxes) {
  const regById = Object.fromEntries((xwalk.regulators || []).map((r) => [r.id, r]));
  const tiers = xwalk.fine_tiers?.eu_ai_act || {};
  const noFine = xwalk.fine_tiers?.no_fine || { statutory_maximum: null, cited_to: null };
  const seen = new Set();
  const out = [];
  for (const ax of sourceAxes) {
    for (const p of xwalk.axes?.[ax]?.pointers || []) {
      if (p.relation !== "relevant-to") throw new Error(`illegal relation '${p.relation}' on ${ax}: only 'relevant-to' is a pointer`);
      const key = `${p.regulator}|${p.obligation}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const t = p.tier === "no_fine" || p.tier == null ? noFine : tiers[p.tier];
      if (!t) throw new Error(`unknown fine tier ${p.tier} on ${ax}`);
      out.push({
        regulator: p.regulator,
        regulator_name: regById[p.regulator]?.name ?? p.regulator,
        relation: "relevant-to",
        obligation: p.obligation,
        tier: p.tier ?? "no_fine",
        statutory_maximum: t.statutory_maximum ?? null,
        fine_cited_to: t.cited_to ?? null,
        no_fine_asserted_owed: true,
        via_axis: ax,
      });
    }
  }
  return out.length ? out : "UNMAPPED";
}

// ─── the tree, in memory ─────────────────────────────────────────────────────
export async function buildTree({ repo = REPO_DEFAULT, slots, verify, now = null } = {}) {
  // Determinism fix (7 Oct 2026): now derives from committed inputs (matrix.as_of), never wall-clock.
  slots ??= await loadSlots(repo);
  verify ??= (await import(pathToFileURL(join(repo, "public/signed/verify-card.mjs")).href)).verifyCard;

  const matrix = JSON.parse(readFileSync(join(repo, "public/signed/card-matrix.json"), "utf8"));
  now ??= matrix.as_of ?? "1970-01-01T00:00:00Z";
  const xwalk = JSON.parse(readFileSync(join(repo, "client/src/data/regulator-crosswalk.json"), "utf8"));
  const roots = loadRootLeaves(repo);
  const slotById = Object.fromEntries(slots.map((s) => [s.axis, s]));

  // corpus axis -> board slot, from the crosswalk only; refuse anything not on the board
  const sourcesBySlot = {};
  for (const [ax, a] of Object.entries(xwalk.axes || {})) {
    if (!("board_axis" in a)) throw new Error(`crosswalk axis ${ax} has no board_axis field (null is allowed; absence is not)`);
    if (a.board_axis === null) continue;
    if (!slotById[a.board_axis]) throw new Error(`crosswalk axis ${ax} joins to '${a.board_axis}', which is not an exported board slot`);
    (sourcesBySlot[a.board_axis] ??= []).push(ax);
  }
  for (const v of Object.values(sourcesBySlot)) v.sort();

  // verify every cell's card once
  const cardsByModelAxis = new Map(); // `${model}|${axis}` -> [{id, path, body, created}]
  for (const cell of matrix.cells || []) {
    if (!/^[a-f0-9]{64}$/.test(String(cell.card || ""))) throw new Error(`matrix cell carries an invalid card id: ${cell.card}`);
    const path = `/signed/cards/${cell.card}.json`;
    const card = JSON.parse(readFileSync(join(repo, "public", path), "utf8"));
    const verdict = await verify(card);
    if (verdict?.state !== "VALID") throw new Error(`card ${cell.card} is not VALID: ${verdict?.reason || verdict?.state}`);
    const k = `${cell.model}|${cell.axis}`;
    (cardsByModelAxis.has(k) ? cardsByModelAxis.get(k) : cardsByModelAxis.set(k, []).get(k))
      .push({ id: cell.card, path, body: card.body, created: card.body?.created ?? cell.created ?? null, whole_sha256: sha256(canonicalize(card)) });
  }

  const subjects = [...new Set((matrix.cells || []).map((c) => c.model))].sort();
  const slugOf = {};
  const slugSeen = new Map();
  for (const s of subjects) {
    const slug = slugify(s);
    if (!slug) throw new Error(`subject '${s}' slugifies to nothing`);
    if (slugSeen.has(slug) && slugSeen.get(slug) !== s) throw new Error(`slug collision: '${s}' and '${slugSeen.get(slug)}' both -> ${slug}`);
    slugSeen.set(slug, s);
    slugOf[s] = slug;
  }

  const files = new Map(); // rel path under public/reports -> { json } | { md }
  const reportRefs = [];
  const axisEntries = [];

  for (const slot of slots) {
    const sourceAxes = sourcesBySlot[slot.axis] || [];
    const obligations = deriveObligations(xwalk, sourceAxes);
    const entry = {
      axis: slot.axis, kind: slot.kind, family: slot.family ?? null, bench: slot.bench ?? null, task: slot.task ?? null,
      status: slot.status, n: slot.n ?? 0, n_unit: slot.n_unit ?? (slot.kind === "model-comparison" ? "bank items" : null),
      source_axes: sourceAxes, obligations,
      reports: { total: 0, measured: 0, unmeasured: 0 },
      subject_reports: "none",
    };
    if (slot.kind === "declared-slot") {
      entry.status = "UNMEASURED";
      entry.n = 0;
      entry.reason = slot.n_note ?? "declared slot: nothing has been measured";
      axisEntries.push(entry);
      continue;
    }
    if (slot.kind === "deterministic-facts") {
      entry.reason = "measures issuers, series or sources rather than model subjects; the signed card corpus holds no per-subject cell for this axis";
      axisEntries.push(entry);
      continue;
    }
    if (!sourceAxes.length) {
      entry.reason = "the board slot is measured at fleet level, but no corpus axis joins to it (crosswalk board_axis), so no subject report exists";
      axisEntries.push(entry);
      continue;
    }
    const subjectsHere = subjects.filter((s) => sourceAxes.some((ax) => cardsByModelAxis.has(`${s}|${ax}`)));
    if (!subjectsHere.length) {
      entry.reason = "no subject in the signed card corpus has a card on any joined corpus axis";
      axisEntries.push(entry);
      continue;
    }
    entry.subject_reports = "per subject below";
    for (const subject of subjectsHere) {
      const cards = sourceAxes.flatMap((ax) => cardsByModelAxis.get(`${subject}|${ax}`) || [])
        .sort((a, b) => String(b.created).localeCompare(String(a.created)) || a.id.localeCompare(b.id));
      const st = deriveStatus(cards);
      const primary = st.primary;
      const rows = Array.isArray(primary.body.rows) ? primary.body.rows : [];
      const rooted = cards.flatMap((c) => (roots.get(c.id) || roots.get(c.whole_sha256) || []).map((r) => ({ card: c.id, ...r })));
      const slug = slugOf[subject];
      const report = {
        schema: SCHEMA_REPORT,
        axis: slot.axis,
        kind: slot.kind,
        subject,
        subject_slug: slug,
        status: st.status,
        ...(st.reason ? { reason: st.reason } : {}),
        n: st.n,
        n_unit: st.n_unit,
        rows,
        ...(rows.length ? {} : { rows_note: "the source card publishes no per-item rows" }),
        separation: deriveSeparation(primary.body),
        obligations,
        source_axes: sourceAxes,
        source_cards: cards.map((c) => ({
          sha256: c.id, path: c.path, axis: c.body.axis, created: c.created,
          accuracy: typeof c.body.accuracy === "number" ? c.body.accuracy : null,
          n: Number.isInteger(c.body.n) ? c.body.n : null,
          status: c.body.status ?? null,
        })),
        root_ref: rooted.length ? rooted : "NOT_YET_ROOTED",
        as_of: cards[0].created,
        as_of_field: "the newest source card's body.created — when it was measured, never when this file was written",
        not_a: "grade, rank, conformity mark or legal determination. Measurement, not certification; verification is free.",
        api: `/api/report?subject=${encodeURIComponent(slug)}&axis=${encodeURIComponent(slot.axis)}`,
        verify: "/signed/verify-card.mjs against each source_cards[].path; /api/report for the index",
        canonical_rule: "canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)",
        generated_at: now,
      };
      report.canonical_sha256 = canonicalHash(report);
      const base = `${slug}/${slot.axis}`;
      files.set(`${base}.json`, { json: report });
      files.set(`${base}.md`, { md: renderMd(report) });
      entry.reports.total += 1;
      entry.reports[st.status === "MEASURED" ? "measured" : "unmeasured"] += 1;
      reportRefs.push({
        subject, slug, axis: slot.axis, kind: slot.kind, status: st.status, ...(st.reason ? { reason: st.reason } : {}),
        n: st.n, n_unit: st.n_unit, as_of: report.as_of, source_cards: cards.length,
        obligations: obligations === "UNMAPPED" ? "UNMAPPED" : obligations.length,
        rooted: rooted.length > 0,
        path_json: `/reports/${base}.json`, path_md: `/reports/${base}.md`, api: report.api,
        canonical_sha256: report.canonical_sha256,
      });
    }
    axisEntries.push(entry);
  }

  reportRefs.sort((a, b) => a.slug.localeCompare(b.slug) || a.axis.localeCompare(b.axis));
  const reasons = {};
  for (const r of reportRefs) if (r.reason) reasons[r.reason] = (reasons[r.reason] || 0) + 1;
  const subjectRows = subjects
    .map((s) => ({ subject: s, slug: slugOf[s], reports: reportRefs.filter((r) => r.subject === s).length, axes: reportRefs.filter((r) => r.subject === s).map((r) => r.axis) }))
    .filter((s) => s.reports > 0);
  const byKind = {};
  for (const a of axisEntries) byKind[a.kind] = (byKind[a.kind] || 0) + 1;

  const index = {
    schema: SCHEMA_INDEX,
    title: "Axis reports index — one report per GSPC board slot and subject that has a signed card behind it",
    honesty: {
      status: "A report reads MEASURED only when a source card's own body states MEASURED at n >= 30. Otherwise UNMEASURED with the reason. UNMEASURED is first-class and is never a zero.",
      obligations: "Crosswalk pointers only, relation always 'relevant-to'; UNMAPPED where the crosswalk has no pointer. Nothing here says a subject violates or satisfies a provision.",
      counts: "Every number below is the length of an array built by scripts/build-axis-reports.mjs from the inputs named in generated_from. Nothing is typed.",
      not_a: "grade, rank, conformity mark, or legal determination. Measurement, not certification. Verification is free.",
    },
    generated_from: {
      slots: "functions/api/_gspc_axes_{a,b,c,fin}.ts — executed, the same modules GET /api/gspc imports",
      cards: "public/signed/card-matrix.json and the verified card file behind every cell",
      crosswalk: "client/src/data/regulator-crosswalk.json (pointers + board_axis join)",
      roots: "public/interop/card-root-*.json leaves",
      note: "Rebuild: node scripts/build-axis-reports.mjs. Drift check: --check.",
    },
    as_of: matrix.as_of ?? null,
    as_of_field: matrix.as_of_field ?? null,
    counts: {
      axes: axisEntries.length,
      axes_by_kind: byKind,
      axes_with_subject_reports: axisEntries.filter((a) => a.reports.total > 0).length,
      subjects_in_corpus: subjects.length,
      subjects_with_reports: subjectRows.length,
      reports: reportRefs.length,
      measured: reportRefs.filter((r) => r.status === "MEASURED").length,
      unmeasured: reportRefs.filter((r) => r.status === "UNMEASURED").length,
      unmeasured_reasons: reasons,
      source_cards: reportRefs.reduce((s, r) => s + r.source_cards, 0),
      corpus_cells: (matrix.cells || []).length,
      corpus_cells_without_board_slot: (matrix.cells || []).filter((c) => xwalk.axes?.[c.axis]?.board_axis == null).length,
      reports_with_mapped_obligations: reportRefs.filter((r) => r.obligations !== "UNMAPPED").length,
      reports_unmapped: reportRefs.filter((r) => r.obligations === "UNMAPPED").length,
      reports_rooted: reportRefs.filter((r) => r.rooted).length,
    },
    axes: axisEntries,
    subjects: subjectRows,
    reports: reportRefs,
    canonical_rule: "canonical_sha256 = sha256(canonical JSON of this object minus generated_at and canonical_sha256; keys sorted, no whitespace)",
    generated_at: now,
  };
  index.canonical_sha256 = canonicalHash(index);
  files.set("index.json", { json: index });
  return { files, index };
}

// ─── markdown twin ───────────────────────────────────────────────────────────
const cell = (v) => String(v ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
export function renderMd(r) {
  const L = [];
  L.push(`# ${r.subject} × ${r.axis} — ${r.status}`);
  L.push("");
  L.push(`Measurement, not certification. This report is derived from signed cards; it is not a ${r.not_a}`);
  L.push("");
  L.push("| field | value |");
  L.push("|---|---|");
  L.push(`| axis | \`${cell(r.axis)}\` (${cell(r.kind)}) |`);
  L.push(`| subject | \`${cell(r.subject)}\` |`);
  L.push(`| status | **${r.status}** |`);
  if (r.reason) L.push(`| reason | ${cell(r.reason)} |`);
  L.push(`| n | ${r.n} ${cell(r.n_unit)} |`);
  L.push(`| separation | ${typeof r.separation === "number" ? `p=${r.separation}` : r.separation} |`);
  L.push(`| rows | ${r.rows.length}${r.rows.length ? "" : ` (${cell(r.rows_note)})`} |`);
  L.push(`| as_of | ${cell(r.as_of)} — ${cell(r.as_of_field)} |`);
  L.push(`| root_ref | ${Array.isArray(r.root_ref) ? r.root_ref.map((x) => `${x.file}#${x.index}`).join(", ") : r.root_ref} |`);
  L.push(`| canonical_sha256 | \`${r.canonical_sha256}\` |`);
  L.push(`| api | \`${cell(r.api)}\` |`);
  L.push("");
  L.push("## Source cards");
  L.push("");
  L.push("| sha256 | corpus axis | created | accuracy | n | card status |");
  L.push("|---|---|---|---|---|---|");
  for (const c of r.source_cards) L.push(`| [\`${c.sha256.slice(0, 16)}…\`](${c.path}) | ${cell(c.axis)} | ${cell(c.created)} | ${c.accuracy ?? "—"} | ${c.n ?? "—"} | ${c.status ?? "—"} |`);
  L.push("");
  L.push("## Obligations (crosswalk pointers — relevant-to, never a determination)");
  L.push("");
  if (r.obligations === "UNMAPPED") {
    L.push("UNMAPPED — the crosswalk carries no pointer for the corpus axes behind this report. Absence of a pointer is not absence of an obligation.");
  } else {
    L.push("| regulator | obligation | tier | statutory maximum (never asserted owed) | via corpus axis |");
    L.push("|---|---|---|---|---|");
    for (const o of r.obligations) L.push(`| ${cell(o.regulator_name)} | ${cell(o.obligation)} | ${cell(o.tier)} | ${cell(o.statutory_maximum ?? "none (no fine regime)")} | ${cell(o.via_axis)} |`);
  }
  L.push("");
  L.push("## Verify");
  L.push("");
  L.push(`Each source card verifies offline with \`/signed/verify-card.mjs\` (id recomputed, Ed25519 checked under the pinned key). ${cell(r.canonical_rule)}`);
  L.push("");
  return L.join("\n");
}

// ─── disk: write / check ─────────────────────────────────────────────────────
function walkOwned(outDir) {
  // Owned: index.json and every file inside a subject subdirectory. Top-level files that are not
  // index.json belong to other producers (e.g. the body-report) and are never touched.
  const owned = [];
  if (!existsSync(outDir)) return owned;
  for (const e of readdirSync(outDir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      for (const f of readdirSync(join(outDir, e.name))) owned.push(`${e.name}/${f}`);
    } else if (e.name === "index.json") owned.push("index.json");
  }
  return owned;
}

function sizeOf(dir) {
  let files = 0, bytes = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else { files += 1; bytes += statSync(p).size; }
    }
  };
  if (existsSync(dir)) walk(dir);
  return { files, bytes };
}

export async function writeTree({ repo = REPO_DEFAULT, check = false, ...opts } = {}) {
  const outDir = join(repo, "public/reports");
  const { files, index } = await buildTree({ repo, ...opts });
  const stale = [];
  const onDisk = new Set(walkOwned(outDir));

  for (const [rel, f] of files) {
    const abs = join(outDir, rel);
    const existing = existsSync(abs) ? readFileSync(abs, "utf8") : null;
    let next;
    if (f.json) {
      let keep = null;
      if (existing) { try { keep = JSON.parse(existing); } catch { keep = null; } }
      if (keep && keep.canonical_sha256 === f.json.canonical_sha256 && typeof keep.generated_at === "string") {
        f.json.generated_at = keep.generated_at; // unchanged inputs -> unchanged bytes
      }
      next = JSON.stringify(f.json, null, 1) + "\n";
    } else next = f.md;
    if (existing !== next) stale.push(rel);
    if (!check) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, next);
    }
    onDisk.delete(rel);
  }
  for (const rel of onDisk) {
    stale.push(`${rel} (orphan)`);
    if (!check) {
      rmSync(join(outDir, rel));
      const d = join(outDir, dirname(rel));
      if (dirname(rel) !== "." && existsSync(d) && readdirSync(d).length === 0) rmSync(d);
    }
  }
  const c = index.counts;
  const line = `axis-reports: ${c.axes} slots · ${c.subjects_with_reports} subjects · ${c.reports} reports (${c.measured} MEASURED · ${c.unmeasured} UNMEASURED) · ${c.reports_with_mapped_obligations} obligations-mapped · ${c.reports_unmapped} UNMAPPED · ${c.reports_rooted} rooted`;
  if (check) {
    if (stale.length) {
      console.error(`✗ axis-reports --check: ${stale.length} stale path(s) under public/reports — rerun node scripts/build-axis-reports.mjs`);
      for (const s of stale.slice(0, 20)) console.error(`  ${s}`);
      return { ok: false, stale, index };
    }
    console.log(`✓ axis-reports --check: tree is current — ${line}`);
    return { ok: true, stale, index };
  }
  const sz = sizeOf(outDir);
  const pub = sizeOf(join(repo, "public"));
  console.log(`${line} -> ${relative(repo, outDir)}/`);
  console.log(`axis-reports: public/reports = ${sz.files} files · ${(sz.bytes / 1024).toFixed(1)} KiB; public/ = ${pub.files} files (Cloudflare Pages cap 20,000 files, 25 MiB/file)`);
  return { ok: true, stale, index };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const check = process.argv.includes("--check");
  writeTree({ check }).then((r) => process.exit(r.ok ? 0 : 1), (e) => { console.error(`✗ axis-reports: ${e.message}`); process.exit(1); });
}
