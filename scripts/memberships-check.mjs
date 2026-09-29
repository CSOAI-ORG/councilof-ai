#!/usr/bin/env node
/**
 * memberships-check — re-fetches every PUBLIC evidence URL in public/interop/memberships.json
 * and fails when any answers non-200 or no longer names us.
 *
 * WHY. The membership strip on the home page and the footer is read from a committed manifest,
 * and every entry links to the page that is supposed to prove it. A roster can drop us, a
 * registry can purge a listing, a page can move. A strip that keeps rendering "member" after the
 * roster stopped saying so is the exact defect the kill list names: a listing quoted as a
 * standing. So this check exists to go RED: exit 1 on any public row whose evidence no longer
 * answers 200 with our name in the body. Private-evidence rows (a dated mailbox record) are
 * schema-validated but not fetched — nothing on the network can confirm them, and the manifest
 * says so with `public_evidence: false`.
 *
 * States. VERIFIED rows must name us. PENDING rows (a filing the owner has not yet submitted)
 * need only a reachable docket — the name is not there yet, and the manifest does not claim it is.
 *
 *   node scripts/memberships-check.mjs               # fetch every public evidence URL; exit 1 on any failure
 *   node scripts/memberships-check.mjs --schema-only # validate the manifest without the network
 *   node scripts/memberships-check.mjs --selftest    # prove the check can fail, with a fake fetcher and bogus rows
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST_PATH = join(ROOT, "public/interop/memberships.json");
export const UPDATES_PATH = join(ROOT, "public/interop/memberships-updates.json");

export const SCHEMA = "csoai.memberships/0.1";
export const KINDS = ["member", "participant", "contributor", "listed", "registered", "filed", "applied"];
export const STATES = ["VERIFIED", "UNVERIFIED", "PENDING"];
export const EVIDENCE_KINDS = ["public_url", "private_email", "account_page"];
export const UPDATES_SCHEMA = "csoai.memberships-updates/0.1";
export const UPDATE_KINDS = ["added", "corrected", "verified", "recorded"];
export const UPDATE_EVIDENCE_KINDS = ["public_url", "private_email", "command"];
/** Any one of these in the fetched body counts as "names us". A row may narrow it with check.expect. */
export const DEFAULT_EXPECT = ["Council of AI", "CSOAI", "Templeman", "councilof.ai"];
const UA = "Mozilla/5.0 (compatible; csoai-memberships-check/0.1; +https://councilof.ai/memberships)";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** A private-evidence row must cite a mailbox record by folder + id and carry a date. */
const MAILBOX_RE = /\b(INBOX|Sent)\s+\d+\b/;

/* ── schema ─────────────────────────────────────────────────────────────── */

export function validateManifest(m) {
  const problems = [];
  if (!m || typeof m !== "object") return ["manifest is not an object"];
  if (m.schema !== SCHEMA) problems.push(`schema must be ${SCHEMA}`);
  if (!DATE_RE.test(String(m.as_of ?? ""))) problems.push("as_of must be YYYY-MM-DD");
  if (m.signed !== false) problems.push("signed must be false (this manifest carries no signature; say so)");
  if (!Array.isArray(m.groups) || m.groups.length === 0) problems.push("groups[] missing");
  if (!Array.isArray(m.rows) || m.rows.length === 0) problems.push("rows[] missing");
  const groupIds = new Set((m.groups ?? []).map((g) => g.id));
  const ids = new Set();
  for (const row of m.rows ?? []) {
    for (const p of validateRow(row, groupIds)) problems.push(`${row?.id ?? "?"}: ${p}`);
    if (ids.has(row?.id)) problems.push(`${row.id}: duplicate id`);
    ids.add(row?.id);
  }
  return problems;
}

export function validateRow(row, groupIds = null) {
  const p = [];
  if (!row || typeof row !== "object") return ["row is not an object"];
  for (const f of ["id", "org", "short", "group", "kind", "evidence", "evidence_kind", "state", "what_it_proves", "what_it_does_not_prove"]) {
    if (typeof row[f] !== "string" || !row[f].trim()) p.push(`${f} missing`);
  }
  if (!KINDS.includes(row.kind)) p.push(`kind must be one of ${KINDS.join("|")}`);
  if (!STATES.includes(row.state)) p.push(`state must be one of ${STATES.join("|")}`);
  if (!EVIDENCE_KINDS.includes(row.evidence_kind)) p.push(`evidence_kind must be one of ${EVIDENCE_KINDS.join("|")}`);
  if (groupIds && !groupIds.has(row.group)) p.push(`group ${row.group} is not declared`);
  if (typeof row.public_evidence !== "boolean") p.push("public_evidence must be boolean");
  if (row.since !== null && !DATE_RE.test(String(row.since))) p.push("since must be YYYY-MM-DD or null");
  if (row.since === null && row.state !== "PENDING") p.push("since may be null only for PENDING rows");
  if (row.evidence_kind === "public_url") {
    if (!/^https:\/\//.test(row.evidence)) p.push("public_url evidence must be https://");
    if (row.public_evidence !== true) p.push("public_url rows must set public_evidence: true");
  } else {
    if (row.public_evidence !== false) p.push("private rows must set public_evidence: false");
    if (!MAILBOX_RE.test(row.evidence)) p.push("private evidence must cite a mailbox record (INBOX <id> / Sent <id>)");
    if (!/\d{4}-\d{2}-\d{2}/.test(row.evidence)) p.push("private evidence must carry a date");
  }
  if (row.check && typeof row.check.url === "string" && !/^https:\/\//.test(row.check.url)) p.push("check.url must be https://");
  if ((row.question && !row.answer) || (row.answer && !row.question)) p.push("question and answer travel together");
  return p;
}

/**
 * The updates log is the dated record of what changed in the manifest. Its one load-bearing
 * invariant is that an entry which names a row names a row that EXISTS: an update pointing at a
 * deleted id renders a dead anchor and, worse, tells a reader something happened to a row that is
 * no longer there. That is the same class of defect as a strip outliving its evidence, so it is
 * checked here and it fails closed.
 */
export function validateUpdates(u, manifest) {
  const problems = [];
  if (!u || typeof u !== "object") return ["updates is not an object"];
  if (u.schema !== UPDATES_SCHEMA) problems.push(`schema must be ${UPDATES_SCHEMA}`);
  if (!DATE_RE.test(String(u.as_of ?? ""))) problems.push("as_of must be YYYY-MM-DD");
  if (u.signed !== false) problems.push("signed must be false (this artifact carries no signature; say so)");
  if (!Array.isArray(u.entries) || u.entries.length === 0) problems.push("entries[] missing");
  const known = new Set((manifest?.rows ?? []).map((r) => r.id));
  for (const [i, e] of (u.entries ?? []).entries()) {
    const at = `entries[${i}]`;
    if (!e || typeof e !== "object") { problems.push(`${at}: not an object`); continue; }
    if (!DATE_RE.test(String(e.date ?? ""))) problems.push(`${at}: date must be YYYY-MM-DD`);
    if (!UPDATE_KINDS.includes(e.kind)) problems.push(`${at}: kind must be one of ${UPDATE_KINDS.join("|")}`);
    if (!UPDATE_EVIDENCE_KINDS.includes(e.evidence_kind)) problems.push(`${at}: evidence_kind must be one of ${UPDATE_EVIDENCE_KINDS.join("|")}`);
    for (const f of ["headline", "detail", "evidence"]) {
      if (typeof e[f] !== "string" || !e[f].trim()) problems.push(`${at}: ${f} missing`);
    }
    if (!(e.row === null || typeof e.row === "string")) problems.push(`${at}: row must be a manifest row id or null`);
    if (typeof e.row === "string" && !known.has(e.row)) problems.push(`${at}: row ${e.row} is not in the manifest`);
    if (e.evidence_kind === "public_url" && !/^https:\/\//.test(String(e.evidence))) problems.push(`${at}: public_url evidence must be https://`);
    if (e.evidence_kind === "private_email" && !MAILBOX_RE.test(String(e.evidence))) problems.push(`${at}: private evidence must cite a mailbox record (INBOX <id> / Sent <id>)`);
  }
  return problems;
}

/* ── evaluation (pure) ──────────────────────────────────────────────────── */

export function expectedNames(row) {
  const e = row.check?.expect;
  if (Array.isArray(e) && e.length) return e;
  if (typeof e === "string" && e) return [e];
  return DEFAULT_EXPECT;
}

export function namesUs(body, names) {
  const hay = String(body ?? "").toLowerCase();
  return names.some((n) => hay.includes(String(n).toLowerCase()));
}

/** One fetched response against one row: ok, or the reason it is not. */
export function evaluateFetch(row, res) {
  if (!res || typeof res.status !== "number") return { ok: false, reason: "no response" };
  if (res.status !== 200) return { ok: false, reason: `HTTP ${res.status}` };
  if (row.state === "PENDING") return { ok: true, reason: "reachable (PENDING: name not expected yet)" };
  const names = expectedNames(row);
  if (!namesUs(res.body, names)) return { ok: false, reason: `200 but body does not contain any of: ${names.join(" | ")}` };
  return { ok: true, reason: "200 and names us" };
}

/* ── network ────────────────────────────────────────────────────────────── */

export async function defaultFetcher(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 30_000);
  try {
    const r = await fetch(url, {
      redirect: "follow",
      signal: ctl.signal,
      headers: { "user-agent": UA, accept: "application/json, text/html;q=0.9, */*;q=0.5" },
    });
    return { status: r.status, body: await r.text() };
  } catch (e) {
    return { status: 0, body: "", error: String(e?.message ?? e) };
  } finally {
    clearTimeout(t);
  }
}

/** Paged JSON index (limit/offset with pagination.total): walk every page until a name appears. */
async function checkPaged(row, fetcher) {
  const base = row.check.url ?? row.evidence;
  const limit = Number(row.check.limit ?? 1000);
  const names = expectedNames(row);
  let offset = 0;
  let total = Infinity;
  let pages = 0;
  while (offset < total && pages < 50) {
    const url = `${base}${base.includes("?") ? "&" : "?"}limit=${limit}&offset=${offset}`;
    const res = await fetcher(url);
    if (res.status !== 200) return { ok: false, reason: `HTTP ${res.status} at offset ${offset}`, url };
    if (namesUs(res.body, names)) return { ok: true, reason: `named at offset ${offset}`, url };
    try {
      const j = JSON.parse(res.body);
      total = Number(j?.pagination?.total ?? j?.total ?? NaN);
      if (!Number.isFinite(total)) total = 0;
    } catch {
      return { ok: false, reason: "page is not JSON", url };
    }
    offset += limit;
    pages += 1;
  }
  return { ok: false, reason: `walked ${pages} page(s) (${total} items): none names us`, url: base };
}

export async function checkRow(row, fetcher = defaultFetcher) {
  if (row.evidence_kind !== "public_url") return { id: row.id, ok: true, skipped: true, reason: `${row.evidence_kind}: not fetchable`, url: null };
  if (row.check?.mode === "paged") {
    const r = await checkPaged(row, fetcher);
    return { id: row.id, ok: r.ok, reason: r.reason, url: r.url };
  }
  const url = row.check?.url ?? row.evidence;
  const res = await fetcher(url);
  // A row already recorded as not resolving (state UNVERIFIED with a status_note, e.g. the Zenodo
  // 410 of 29 Sep 2026) is expected to fail its fetch. It goes RED the other way: if the evidence
  // answers 200 again, the row is stale in the opposite direction and must be re-verified.
  if (row.state === "UNVERIFIED" && typeof row.status_note === "string" && row.status_note.trim()) {
    const back = res && res.status === 200;
    return {
      id: row.id,
      ok: !back,
      reason: back ? "recorded unavailable, but the evidence answers 200 again: re-verify and clear status_note" : `recorded unavailable (HTTP ${res?.status ?? "none"}): ${row.status_note}`,
      url,
    };
  }
  const v = evaluateFetch(row, res);
  return { id: row.id, ok: v.ok, reason: res?.error ? `${v.reason} (${res.error})` : v.reason, url };
}

export async function runChecks(manifest, fetcher = defaultFetcher, updates = undefined) {
  const schema = validateManifest(manifest);
  if (updates !== undefined) for (const p of validateUpdates(updates, manifest)) schema.push(`updates: ${p}`);
  const results = [];
  if (schema.length === 0) {
    for (const row of manifest.rows) results.push(await checkRow(row, fetcher));
  }
  const failures = results.filter((r) => !r.ok);
  return {
    schemaProblems: schema,
    results,
    failures,
    checked: results.filter((r) => !r.skipped).length,
    skipped: results.filter((r) => r.skipped).length,
    exitCode: schema.length || failures.length ? 1 : 0,
  };
}

/* ── selftest: the check must be able to fail ───────────────────────────── */

export function selftestManifest() {
  const base = {
    group: "registries",
    kind: "listed",
    since: "2026-09-22",
    evidence_kind: "public_url",
    public_evidence: true,
    state: "VERIFIED",
    what_it_proves: "fixture",
    what_it_does_not_prove: "fixture",
  };
  return {
    schema: SCHEMA,
    as_of: "2026-09-22",
    signed: false,
    groups: [{ id: "registries", label: "Registries & indexes" }],
    rows: [
      { ...base, id: "good", org: "Good Roster", short: "Good", evidence: "https://example.test/good" },
      { ...base, id: "gone", org: "Gone Roster", short: "Gone", evidence: "https://example.test/gone" },
      { ...base, id: "renamed", org: "Silent Roster", short: "Silent", evidence: "https://example.test/silent" },
      { ...base, id: "pending", org: "Docket", short: "Docket", kind: "filed", since: null, state: "PENDING", evidence: "https://example.test/docket" },
    ],
  };
}

export async function selftestFetcher(url) {
  if (url.endsWith("/good")) return { status: 200, body: "<html>Members: Council of AI (CSOAI Ltd)</html>" };
  if (url.endsWith("/gone")) return { status: 404, body: "not found" };
  if (url.endsWith("/silent")) return { status: 200, body: "<html>Members: Someone Else</html>" };
  if (url.endsWith("/docket")) return { status: 200, body: "<html>Docket open for comment</html>" };
  return { status: 0, body: "", error: "unexpected url" };
}

export async function selftest() {
  const out = await runChecks(selftestManifest(), selftestFetcher);
  const failedIds = out.failures.map((f) => f.id).sort();
  const ok =
    out.schemaProblems.length === 0 &&
    out.exitCode === 1 &&
    failedIds.join(",") === "gone,renamed" &&
    out.results.find((r) => r.id === "good")?.ok === true &&
    out.results.find((r) => r.id === "pending")?.ok === true;
  // The schema layer must fail closed too: a private row that cites no mailbox record.
  const badSchema = validateRow({ ...selftestManifest().rows[0], evidence_kind: "private_email", public_evidence: false, evidence: "someone told me" });
  // And the updates layer: an entry pointing at a row id the manifest does not have.
  const badUpdate = validateUpdates(
    {
      schema: UPDATES_SCHEMA,
      as_of: "2026-09-22",
      signed: false,
      entries: [{ date: "2026-09-22", kind: "added", row: "no-such-row", headline: "h", detail: "d", evidence: "https://example.test/x", evidence_kind: "public_url" }],
    },
    selftestManifest(),
  );
  return { ok: ok && badSchema.length > 0 && badUpdate.length > 0, failedIds, badSchema, badUpdate };
}

/* ── main ───────────────────────────────────────────────────────────────── */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const args = process.argv.slice(2);
  if (args.includes("--selftest")) {
    const r = await selftest();
    console.log(`[memberships-check] selftest ${r.ok ? "PASS" : "FAIL"} — bogus rows that went red: ${r.failedIds.join(", ") || "none"}; schema rejects an unsourced private row: ${r.badSchema.length > 0}; updates reject a dangling row ref: ${r.badUpdate.length > 0}`);
    process.exit(r.ok ? 0 : 1);
  }
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  const updates = JSON.parse(readFileSync(UPDATES_PATH, "utf8"));
  if (args.includes("--schema-only")) {
    const problems = validateManifest(manifest);
    for (const p of validateUpdates(updates, manifest)) problems.push(`updates: ${p}`);
    for (const p of problems) console.error(`[memberships-check] schema: ${p}`);
    console.log(`[memberships-check] schema ${problems.length ? "FAIL" : "OK"} — ${manifest.rows?.length ?? 0} rows, ${updates.entries?.length ?? 0} update(s)`);
    process.exit(problems.length ? 1 : 0);
  }
  const out = await runChecks(manifest, defaultFetcher, updates);
  for (const p of out.schemaProblems) console.error(`[memberships-check] schema: ${p}`);
  for (const r of out.results) console.log(`${r.ok ? (r.skipped ? "skip" : " ok ") : "FAIL"} ${r.id.padEnd(22)} ${r.reason}${r.url ? `  ${r.url}` : ""}`);
  console.log(`[memberships-check] checked ${out.checked} public URL(s), skipped ${out.skipped} private row(s), ${out.failures.length} failure(s)`);
  process.exit(out.exitCode);
}
