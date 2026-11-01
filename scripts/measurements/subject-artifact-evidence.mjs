#!/usr/bin/env node
/** Frozen source-artifact collection for the existing subject-axis review.
 * No third-party code execution, scores, subject counts, signatures or admission.
 * --freeze NEW_DIR; --collect DIR --out NEW_FILE; --replay FILE
 * Raw responses stay in the private run directory; the report contains references.
 */
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256hex } from "../claim-capture.mjs";
import { fetchSource } from "./claim-maintenance-wave.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE = "public/interop/subject-axis-live-20261027/";
const SELF = "scripts/measurements/subject-artifact-evidence.mjs";
const METHOD = [SELF, "scripts/measurements/claim-maintenance-wave.mjs", "scripts/claim-capture.mjs"];
const JSON_BYTES = (x) => Buffer.from(JSON.stringify(x, null, 2) + "\n");
const fail = (s) => { throw new Error(s); };
const sha1 = (b) => createHash("sha1").update(b).digest("hex");
const hex40 = (s) => typeof s === "string" && /^[0-9a-f]{40}$/.test(s);
const hex64 = (s) => typeof s === "string" && /^[0-9a-f]{64}$/.test(s);
const put = (dir, bytes) => {
  const digest = sha256hex(bytes), dest = path.join(dir, digest);
  if (!existsSync(dest)) writeFileSync(dest, bytes, { flag: "wx", mode: 0o600 });
  else if (sha256hex(readFileSync(dest)) !== digest) fail("retained object mismatch");
  return { sha256: digest, bytes: bytes.length };
};
const get = (dir, ref) => {
  if (!hex64(ref?.sha256)) fail("invalid retained object reference");
  const b = readFileSync(path.join(dir, ref.sha256));
  if (sha256hex(b) !== ref.sha256 || b.length !== ref.bytes) fail("retained object changed");
  return b;
};

export function repositoryFromURL(value) {
  const u = new URL(value);
  if (u.protocol !== "https:" || u.hostname !== "github.com" || u.username || u.password || u.port || u.search || u.hash) return null;
  const parts = u.pathname.replace(/\/$/, "").split("/").slice(1);
  if (parts.length !== 2 || !parts.every((p) => /^[A-Za-z0-9_.-]+$/.test(p) && p !== "." && p !== "..")) return null;
  return parts.join("/").replace(/\.git$/, "").toLowerCase();
}

// Filename candidates are review aids. They are not assertions about file semantics.
const CATEGORIES = {
  readme: /^(readme)(\.[^/]*)?$/i,
  license: /^(license|licence|copying)(\.[^/]*)?$/i,
  environment: /^(pyproject\.toml|package\.json|requirements[^/]*\.txt|environment[^/]*\.ya?ml|setup\.py)$/i,
  method_candidate: /(^|\/)([^/]*(method|protocol|reproduc|evaluation|specification)[^/]*)\.(md|rst|txt)$/i,
  test_candidate: /(^|\/)(test[^/]*\.(py|mjs|js|ts)|[^/]+\.(test|spec)\.(mjs|js|ts))$/i,
  result_candidate: /(^|\/)[^/]*(result|benchmark)[^/]*\.(json|csv|tsv|md)$/i,
};

export function selectArtifacts(tree, expectedSHA) {
  if (!hex40(expectedSHA) || tree.sha !== expectedSHA || tree.truncated !== false || !Array.isArray(tree.tree)) fail("incomplete or mismatched repository tree");
  const paths = new Set();
  for (const e of tree.tree) {
    if (typeof e.path !== "string" || e.path.startsWith("/") || e.path.split("/").some((s) => !s || s === "." || s === "..") || paths.has(e.path)) fail("invalid or duplicate tree path");
    paths.add(e.path);
    if (!hex40(e.sha)) fail("invalid tree entry digest");
  }
  const files = tree.tree.filter((e) => e.type === "blob" && ["100644", "100755"].includes(e.mode) && Number.isSafeInteger(e.size) && e.size > 0 && e.size <= 1024 * 1024);
  const out = [];
  for (const [category, pattern] of Object.entries(CATEGORIES)) {
    const matches = files.filter((e) => pattern.test(e.path)).sort((a, b) => a.path.split("/").length - b.path.split("/").length || a.path.localeCompare(b.path, "en"));
    out.push({ category, matching_paths: matches.length, selected: matches.slice(0, 1) });
  }
  return out;
}

export function verifyBlob(response, expected) {
  if (response.encoding !== "base64" || response.sha !== expected.sha || response.size !== expected.size || typeof response.content !== "string") fail("blob metadata mismatch");
  const encoded = response.content.replace(/\n/g, "");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) fail("invalid blob encoding");
  const b = Buffer.from(encoded, "base64");
  if (b.length !== expected.size || sha1(Buffer.concat([Buffer.from(`blob ${b.length}\0`), b])) !== expected.sha) fail("blob bytes do not match pinned tree");
  return b;
}

export function groupSources(rows) {
  const grouped = new Map();
  for (const r of rows) {
    const repo = repositoryFromURL(r.url), key = repo ? `github:${repo}` : `url:${r.url}`;
    if (!grouped.has(key)) grouped.set(key, { key, repository: repo, url: r.url, candidates: [] });
    grouped.get(key).candidates.push({ axis: r.axis, ordinal: r.ordinal, subject: r.subject, url: r.url });
  }
  return [...grouped.values()].sort((a, b) => a.key.localeCompare(b.key, "en"));
}

export function freeze(directory) {
  mkdirSync(directory, { recursive: false, mode: 0o700 });
  const objects = path.join(directory, "objects"); mkdirSync(objects, { mode: 0o700 });
  const summary = JSON.parse(readFileSync(path.join(ROOT, BASE + "subject-axis-live-run-20261027.json")));
  const rows = [], frames = [];
  for (const a of summary.subject_axes_banks) {
    const name = BASE + `bank-${a.axis}-live-20261027.json`, raw = readFileSync(path.join(ROOT, name)), bank = JSON.parse(raw);
    const gridBytes = readFileSync(bank.source_grid_file);
    if (sha256hex(gridBytes) !== bank.source_grid_sha256) fail(`changed original frame: ${a.axis}`);
    const grid = JSON.parse(gridBytes);
    if (grid.axis !== a.axis || !Array.isArray(grid.rows) || grid.rows.length !== bank.n_subjects_in_grid) fail("frame membership mismatch");
    frames.push({ axis: a.axis, bank_file: name, bank: put(objects, raw), original_grid: put(objects, gridBytes) });
    rows.push(...grid.rows.map((r, i) => ({ axis: a.axis, ordinal: i + 1, subject: r.subject, url: r.url })));
  }
  const method = METHOD.map((file) => ({ file, object: put(objects, readFileSync(path.join(ROOT, file))) }));
  const input = { schema: "csoai.subject-artifact-input/0.1", frozen_at: new Date().toISOString(), method, frames, rows,
    collection: { concurrency: 2, api_timeout_ms: 20000, api_max_bytes: 8 * 1024 * 1024, selected_file_max_bytes: 1024 * 1024,
      per_category_limit: 1, candidate_categories: Object.keys(CATEGORIES), frame_policy: "Every original row, including prior failures; one collection per exact URL or GitHub repository. Repository owners are not assumed to be organisations." },
    limit: "Artifact inventory, not publication quality, code execution, scientific reproduction, model identity, subject validity or axis admission." };
  writeFileSync(path.join(directory, "input.json"), JSON_BYTES(input), { flag: "wx", mode: 0o600 });
  return { frame_rows: rows.length, sources: groupSources(rows).length, input_sha256: sha256hex(JSON_BYTES(input)) };
}

const run = promisify(execFile);
async function api(endpoint, objects) {
  if (!/^repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/(?:commits\/HEAD|git\/(?:trees\/[a-f0-9]{40}\?recursive=1|blobs\/[a-f0-9]{40})))?$/.test(endpoint)) fail("unapproved read endpoint");
  try {
    const { stdout } = await run("gh", ["api", "--hostname", "github.com", "--method", "GET", endpoint], { timeout: 20000, maxBuffer: 8 * 1024 * 1024, encoding: "buffer", env: { ...process.env, GH_PROMPT_DISABLED: "1", GH_PAGER: "cat" } });
    return { value: JSON.parse(stdout), retained: put(objects, stdout) };
  } catch (e) {
    // Do not surface CLI stderr, auth details or arbitrary external strings.
    fail(e.killed ? "API_TIMEOUT" : e.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" ? "API_BODY_TOO_LARGE" : "API_READ_FAILED");
  }
}

async function collectOne(source, objects) {
  const row = { ...source, observed_at: new Date().toISOString(), state: "UNAVAILABLE", admission_eligible: false };
  if (!source.repository) {
    const fetched = await fetchSource(source.url);
    const { body, ...meta } = fetched;
    return { ...row, state: fetched.ok ? "SOURCE_BYTES_RETAINED" : "UNAVAILABLE", response: meta, ...(body ? { body: put(objects, body) } : {}) };
  }
  try {
    const repo = await api(`repos/${source.repository}`, objects);
    if (repo.value.private !== false || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo.value.full_name)) fail("PUBLIC_REPOSITORY_NOT_CONFIRMED");
    row.repository_metadata = repo.retained; row.canonical_repository = repo.value.full_name;
    const commit = await api(`repos/${source.repository}/commits/HEAD`, objects);
    if (!hex40(commit.value.sha) || !hex40(commit.value.commit?.tree?.sha)) fail("INVALID_COMMIT");
    row.commit = commit.value.sha; row.commit_response = commit.retained; row.tree_sha = commit.value.commit.tree.sha;
    const tree = await api(`repos/${source.repository}/git/trees/${row.tree_sha}?recursive=1`, objects);
    row.tree_response = tree.retained;
    const selected = selectArtifacts(tree.value, row.tree_sha);
    row.artifacts = [];
    for (const category of selected) {
      if (!category.selected.length) { row.artifacts.push({ category: category.category, state: "NO_FILENAME_CANDIDATE", matching_paths: 0 }); continue; }
      const e = category.selected[0];
      const artifact = { category: category.category, matching_paths: category.matching_paths, path: e.path, git_blob_sha: e.sha, bytes: e.size,
        url: `https://github.com/${row.canonical_repository}/blob/${row.commit}/${e.path.split("/").map(encodeURIComponent).join("/")}` };
      try {
        const blob = await api(`repos/${source.repository}/git/blobs/${e.sha}`, objects);
        const body = verifyBlob(blob.value, e);
        row.artifacts.push({ ...artifact, state: "PINNED_BYTES_VERIFIED", api_response: blob.retained, body: put(objects, body) });
      } catch (e) { row.artifacts.push({ ...artifact, state: "UNAVAILABLE", reason: e.message }); }
    }
    row.state = "PINNED_REPOSITORY_INVENTORY";
  } catch (e) { row.reason = e.message; }
  return row;
}

function verifyInput(directory, checkCurrentMethod = true) {
  const inputBytes = readFileSync(path.join(directory, "input.json")), input = JSON.parse(inputBytes), objects = path.join(directory, "objects");
  if (input.schema !== "csoai.subject-artifact-input/0.1" || input.frames.length !== 9 || new Set(input.frames.map((f) => f.axis)).size !== 9) fail("unexpected input frames");
  if (JSON.stringify(input.method.map((m) => m.file)) !== JSON.stringify(METHOD)) fail("unexpected method set");
  for (const m of input.method) {
    get(objects, m.object);
    if (checkCurrentMethod && sha256hex(readFileSync(path.join(ROOT, m.file))) !== m.object.sha256) fail("collector changed since freeze");
  }
  const expectedRows = [];
  for (const frame of input.frames) {
    const bank = JSON.parse(get(objects, frame.bank)), grid = JSON.parse(get(objects, frame.original_grid));
    if (bank.axis_id !== frame.axis || grid.axis !== frame.axis || bank.source_grid_sha256 !== frame.original_grid.sha256 || bank.n_subjects_in_grid !== grid.rows.length) fail("frame binding mismatch");
    expectedRows.push(...grid.rows.map((r, i) => ({ axis: frame.axis, ordinal: i + 1, subject: r.subject, url: r.url })));
  }
  if (JSON.stringify(input.rows) !== JSON.stringify(expectedRows)) fail("frame member changed or omitted");
  return { inputBytes, input, objects };
}

export async function collect(directory, output) {
  const { inputBytes, input, objects } = verifyInput(directory);
  if (existsSync(output)) fail("output already exists");
  writeFileSync(path.join(directory, "COLLECTION_STARTED"), new Date().toISOString() + "\n", { flag: "wx", mode: 0o600 });
  const sources = groupSources(input.rows), rows = new Array(sources.length), started_at = new Date().toISOString();
  let cursor = 0;
  await Promise.all(Array.from({ length: 2 }, async () => {
    while (cursor < sources.length) {
      const i = cursor++; rows[i] = await collectOne(sources[i], objects);
      // Retain progress without resuming a partially observed run as a fresh run.
      writeFileSync(path.join(directory, `source-${String(i).padStart(4, "0")}.json`), JSON_BYTES(rows[i]), { flag: "wx", mode: 0o600 });
      if ((i + 1) % 20 === 0) console.log(JSON.stringify({ completed_index: i + 1, total: sources.length }));
    }
  }));
  const report = { schema: "csoai.subject-artifact-evidence/0.1", started_at, completed_at: new Date().toISOString(), input_sha256: sha256hex(inputBytes),
    method: input.method.map((m) => ({ file: m.file, sha256: m.object.sha256 })), frame_rows: input.rows.length, sources: sources.length,
    verified_artifacts: rows.reduce((n, r) => n + (r.artifacts || []).filter((a) => a.state === "PINNED_BYTES_VERIFIED").length, 0),
    repositories_pinned: rows.filter((r) => r.state === "PINNED_REPOSITORY_INVENTORY").length,
    web_sources_retained: rows.filter((r) => r.state === "SOURCE_BYTES_RETAINED").length,
    unavailable_sources: rows.filter((r) => r.state === "UNAVAILABLE").length,
    axes_promoted: 0, admission_eligible: false, review_state: "AWAITING_CONSTRUCT_AND_SUBJECT_REVIEW", limit: input.limit,
    identity_limit: "Exact repository and URL deduplication only. Repositories, owners, artifacts and URLs are not independent subject counts.",
    rows };
  writeFileSync(output, JSON_BYTES(report), { flag: "wx" });
  writeFileSync(output + ".custody.json", JSON_BYTES({ evidence_directory: path.resolve(directory), report_sha256: sha256hex(JSON_BYTES(report)) }), { flag: "wx", mode: 0o600 });
  return { frame_rows: report.frame_rows, sources: report.sources, repositories_pinned: report.repositories_pinned, verified_artifacts: report.verified_artifacts, web_sources_retained: report.web_sources_retained, unavailable_sources: report.unavailable_sources, axes_promoted: 0 };
}

export function replay(output) {
  const custody = JSON.parse(readFileSync(output + ".custody.json")), raw = readFileSync(output);
  if (sha256hex(raw) !== custody.report_sha256) fail("report changed");
  const report = JSON.parse(raw), { inputBytes, input, objects } = verifyInput(custody.evidence_directory);
  if (report.input_sha256 !== sha256hex(inputBytes) || report.admission_eligible !== false || report.axes_promoted !== 0) fail("input or authority changed");
  if (report.schema !== "csoai.subject-artifact-evidence/0.1" || report.review_state !== "AWAITING_CONSTRUCT_AND_SUBJECT_REVIEW" || report.limit !== input.limit ||
      JSON.stringify(report.method) !== JSON.stringify(input.method.map((m) => ({ file: m.file, sha256: m.object.sha256 })))) fail("method or review metadata changed");
  const sources = groupSources(input.rows);
  if (sources.length !== report.rows.length || report.sources !== sources.length || report.frame_rows !== input.rows.length) fail("denominator mismatch");
  let blobs = 0, web = 0, pinned = 0, unavailable = 0;
  for (let i = 0; i < sources.length; i++) {
    const r = report.rows[i];
    for (const k of ["key", "repository", "url", "candidates"]) if (JSON.stringify(r[k]) !== JSON.stringify(sources[i][k])) fail("source membership changed");
    if (r.admission_eligible !== false) fail("source authority changed");
    if (r.state === "SOURCE_BYTES_RETAINED") {
      const b = get(objects, r.body);
      if (r.repository || !r.response.ok || r.response.source_url !== r.url || r.response.body_sha256 !== sha256hex(b) || r.response.body_bytes !== b.length) fail("source body binding mismatch");
      web++;
    } else if (r.state === "PINNED_REPOSITORY_INVENTORY") {
      const repo = JSON.parse(get(objects, r.repository_metadata)), c = JSON.parse(get(objects, r.commit_response)), tree = JSON.parse(get(objects, r.tree_response));
      if (repo.private !== false || repo.full_name !== r.canonical_repository || c.sha !== r.commit || c.commit.tree.sha !== r.tree_sha) fail("repository identity mismatch");
      const selected = selectArtifacts(tree, r.tree_sha);
      if (r.artifacts.length !== selected.length) fail("artifact category omitted");
      for (let j = 0; j < selected.length; j++) {
        const s = selected[j], a = r.artifacts[j], e = s.selected[0];
        if (a.category !== s.category || a.matching_paths !== s.matching_paths) fail("artifact selection mismatch");
        if (!e) { if (a.state !== "NO_FILENAME_CANDIDATE") fail("invented candidate"); continue; }
        if (a.path !== e.path || a.git_blob_sha !== e.sha || a.bytes !== e.size) fail("artifact tree binding mismatch");
        if (a.url !== `https://github.com/${r.canonical_repository}/blob/${r.commit}/${e.path.split("/").map(encodeURIComponent).join("/")}`) fail("artifact citation mismatch");
        if (a.state === "PINNED_BYTES_VERIFIED") {
          const b = verifyBlob(JSON.parse(get(objects, a.api_response)), e);
          if (!get(objects, a.body).equals(b)) fail("artifact retained bytes mismatch");
          blobs++;
        } else if (a.state !== "UNAVAILABLE") fail("unexpected artifact state");
      }
      pinned++;
    } else if (r.state === "UNAVAILABLE") unavailable++;
    else fail("unexpected source state");
  }
  if (blobs !== report.verified_artifacts || web !== report.web_sources_retained || pinned !== report.repositories_pinned || unavailable !== report.unavailable_sources) fail("report count mismatch");
  return { replayed_sources: sources.length, verified_artifacts: blobs, repositories_pinned: pinned, web_sources_retained: web, unavailable_sources: unavailable, axes_promoted: 0 };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, target, flag, output] = process.argv.slice(2);
  if (command === "--freeze" && target && !flag) console.log(JSON.stringify(freeze(target)));
  else if (command === "--collect" && target && flag === "--out" && output) console.log(JSON.stringify(await collect(target, output)));
  else if (command === "--replay" && target && !flag) console.log(JSON.stringify(replay(target)));
  else fail("use --freeze NEW_DIR | --collect DIR --out NEW_FILE | --replay FILE");
}
