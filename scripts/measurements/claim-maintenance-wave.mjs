#!/usr/bin/env node
/**
 * Re-read captured sources without changing claim states or promoting a board axis.
 * Revisions are selected by verified supersedes links, not counted as new claims.
 * Digests retain their original coverage and extractor (Claim Maintenance §6.3.1).
 *
 * node scripts/measurements/claim-maintenance-wave.mjs --out /private/run/wave.json
 * node scripts/measurements/claim-maintenance-wave.mjs --replay /private/run/wave.json
 *
 * The adjacent .evidence directory holds frozen inputs and fetched response bodies.
 * Output paths must be new. Raw third-party bodies are private replay evidence.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { extractorFor, EXTRACTOR_RULE_1, SPEC_URL, sha256hex, verifyArtifact } from "../claim-capture.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const METHOD_FILES = ["scripts/measurements/claim-maintenance-wave.mjs", "scripts/claim-capture.mjs",
  "public/spec/claim-maintenance/v0.2/claim-maintenance-v0.2.md"];
const UA = "csoai-claim-maintenance-wave/0.2 (+https://councilof.ai)";
const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
const jsonBytes = (v) => JSON.stringify(v, null, 2) + "\n";
const identity = (c) => JSON.stringify([c.subject?.identifier_kind, c.subject?.identifier, c.claim_id]);

/** Only an explicit, byte-verified supersedes link retires a registry. */
export function selectClaims(registers) {
  const byName = new Map(registers.map((r) => [r.file, r]));
  if (byName.size !== registers.length) throw new Error("duplicate register filename");
  const parents = new Map();
  for (const r of registers) {
    const s = r.document.supersedes;
    if (!s) continue;
    const name = path.posix.basename(s.file || "");
    const parent = byName.get(name);
    if (!parent || s.file !== `/claims/${name}` || s.sha256 !== parent.sha256 ||
        s.registry_id !== parent.document.registry_id) throw new Error(`invalid supersedes link: ${r.file}`);
    parents.set(r.file, name);
  }
  for (const r of registers) {
    const seen = new Set();
    for (let p = r.file; p; p = parents.get(p)) {
      if (seen.has(p)) throw new Error("cyclic supersedes links");
      seen.add(p);
    }
  }
  const superseded = new Set(parents.values());
  const active = registers.filter((r) => !superseded.has(r.file));
  const groups = new Map();
  for (const r of active) for (const c of r.document.claims) {
    const key = identity(c);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ claim: c, register: r.file });
  }
  const claims = [], rejected = [];
  for (const [key, entries] of groups) {
    const c = entries[0].claim;
    const errors = entries.flatMap(({ claim }) => verifyArtifact(claim).errors);
    if (entries.some(({ claim }) => !claim.artifact_sha256)) errors.push("missing artifact_sha256");
    if (new Set(entries.map(({ claim }) => claim.artifact_sha256)).size !== 1)
      errors.push("conflicting active baselines; an explicit revision is required");
    if (!["visible-text", "raw-bytes"].includes(c.source_content_hash?.covers))
      errors.push("unsupported digest coverage");
    if (c.source_content_hash?.covers === "visible-text") {
      try { extractorFor(c.source_content_hash.extractor); } catch (e) { errors.push(e.message); }
    }
    const lineage = registers.flatMap((r) => r.document.claims.filter((v) => identity(v) === key)
      .map((v) => ({ register: r.file, register_sha256: r.sha256, artifact_sha256: v.artifact_sha256,
        captured_at: v.access_date, active: !superseded.has(r.file) })));
    const record = { claim: c, registers: entries.map((e) => e.register), lineage };
    if (errors.length) rejected.push({ ...record, reasons: [...new Set(errors)] });
    else claims.push(record);
  }
  return { claims, rejected, counts: {
    registry_rows: registers.reduce((n, r) => n + r.document.claims.length, 0),
    active_registry_rows: active.reduce((n, r) => n + r.document.claims.length, 0),
    unique_claims: groups.size, selected_claims: claims.length, rejected_claims: rejected.length,
    superseded_registers: [...superseded].sort(),
  } };
}

export function loadRegisters(directory) {
  return readdirSync(directory).sort().filter((f) => /^claimreg-.*\.json$/.test(f) && !f.includes(".signed."))
    .map((file) => {
      const raw = readFileSync(path.join(directory, file));
      const document = JSON.parse(raw); // malformed registers must never silently disappear
      return { file, raw, sha256: sha256hex(raw), document };
    }).filter((r) => Array.isArray(r.document.claims) && r.document.claims.length);
}

/** A single timeout covers headers AND body; an incomplete body is never a comparison. */
export async function fetchSource(url, { fetchImpl = fetch, timeoutMs = 20000, maxBytes = 8 * 1024 * 1024 } = {}) {
  const started_at = new Date().toISOString();
  const ctl = new AbortController();
  let timer, reader;
  const meta = { source_url: url, started_at };
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => { ctl.abort(); reject(new Error("TIMEOUT")); }, timeoutMs);
  });
  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password)
      throw new Error("UNSUPPORTED_SOURCE_URL");
    const work = (async () => {
      const res = await fetchImpl(url, { headers: { "user-agent": UA, accept: "*/*" }, signal: ctl.signal, redirect: "follow" });
      Object.assign(meta, { http_status: res.status, final_url: res.url || url,
        content_type: res.headers.get("content-type") || null });
      if (!res.ok) { ctl.abort(); throw new Error(`HTTP_${res.status}`); }
      reader = res.body?.getReader();
      if (!reader) throw new Error("EMPTY_BODY");
      const chunks = [];
      let bytes = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > maxBytes) { ctl.abort(); throw new Error("BODY_TOO_LARGE"); }
        chunks.push(Buffer.from(value));
      }
      const body = Buffer.concat(chunks);
      if (!body.length) throw new Error("EMPTY_BODY");
      return { ...meta, ok: true, completed_at: new Date().toISOString(), body,
        body_bytes: body.length, body_sha256: sha256hex(body) };
    })();
    return await Promise.race([work, deadline]);
  } catch (err) {
    return { ...meta, ok: false, completed_at: new Date().toISOString(),
      reason: ctl.signal.aborted && !/HTTP_|BODY_TOO_LARGE/.test(err.message) ? "TIMEOUT" : String(err.message).slice(0, 160) };
  } finally {
    clearTimeout(timer);
    if (reader) void reader.cancel().catch(() => {});
  }
}

/** Outcomes describe fetched representations, never withdrawal, intent or truth. */
export function compareClaim(record, observation) {
  const c = record.claim, hash = c.source_content_hash;
  const base = { claim_id: c.claim_id, subject: c.subject?.name, identifier: c.subject?.identifier,
    source_url: c.source_url, captured_at: c.access_date, captured_digest: hash.value,
    coverage: hash.covers, extractor: hash.covers === "visible-text" ? (hash.extractor ?? EXTRACTOR_RULE_1) : null,
    artifact_sha256: c.artifact_sha256, claim_verbatim_sha256: c.claim_hash,
    registers: record.registers, lineage: record.lineage,
    observed_at: observation.completed_at, response_body_sha256: observation.body_sha256 || null };
  if (!observation.ok) return { ...base, comparable: false, outcome: "UNREACHABLE", reason: observation.reason };
  if (!Buffer.isBuffer(observation.body) || sha256hex(observation.body) !== observation.body_sha256)
    throw new Error("response body digest mismatch");
  let digest, text = null;
  try {
    if (hash.covers === "raw-bytes") digest = sha256hex(observation.body);
    else if (hash.covers === "visible-text") {
      if (!/^(text\/html|application\/xhtml\+xml|text\/plain)(?:;|$)/i.test(observation.content_type || ""))
        throw new Error("UNSUPPORTED_TEXT_CONTENT_TYPE");
      const charset = /charset\s*=\s*["']?([^;\s"']+)/i.exec(observation.content_type || "")?.[1];
      if (charset && !["utf-8", "utf8", "us-ascii"].includes(charset.toLowerCase()))
        throw new Error("UNSUPPORTED_TEXT_CHARSET");
      const html = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(observation.body);
      text = extractorFor(hash.extractor)(html);
      if (!text) throw new Error("EMPTY_EXTRACTED_TEXT");
      digest = sha256hex(text);
    } else throw new Error("UNSUPPORTED_DIGEST_COVERAGE");
  } catch (e) { return { ...base, comparable: false, outcome: "UNCOMPARABLE", reason: e.message }; }
  return { ...base, comparable: true, outcome: digest === hash.value ? "UNCHANGED" : "CHANGED",
    reread_digest: digest, reread_chars: text === null ? null : text.length,
    claim_text_observation: text === null ? "NOT_EXTRACTED_FROM_RAW_BODY" :
      norm(text).includes(norm(c.claim_verbatim)) ? "PRESENT_IN_EXTRACTED_TEXT" : "NOT_FOUND_IN_EXTRACTED_TEXT",
    disclosure: "NOT_DECIDABLE_BY_THIS_METHOD" };
}

export async function collectObservations(claims, fetcher = fetchSource) {
  const urls = [...new Set(claims.map((r) => r.claim.source_url))].sort();
  const observations = new Array(urls.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(4, urls.length) }, async () => {
    while (cursor < urls.length) {
      const i = cursor++;
      observations[i] = await fetcher(urls[i]);
    }
  }));
  return observations;
}

function putBlob(directory, raw) {
  const hash = sha256hex(raw), file = path.join(directory, hash);
  if (existsSync(file)) {
    if (sha256hex(readFileSync(file)) !== hash) throw new Error("corrupt retained blob");
  } else writeFileSync(file, raw, { flag: "wx", mode: 0o600 });
  return hash;
}

function countsFor(selected, rows, sources) {
  const outcomes = {};
  for (const r of rows) outcomes[r.outcome] = (outcomes[r.outcome] || 0) + 1;
  return { ...selected.counts, distinct_sources: sources.length,
    comparable_claims: rows.filter((r) => r.comparable).length,
    comparable_sources: new Set(rows.filter((r) => r.comparable).map((r) => r.source_url)).size, ...outcomes };
}

export function replayWave(wave, evidenceDirectory) {
  const get = (hash) => {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error("invalid evidence hash");
    const bytes = readFileSync(path.join(evidenceDirectory, "blobs", hash));
    if (sha256hex(bytes) !== hash) throw new Error("retained evidence digest mismatch");
    return bytes;
  };
  const inputBytes = get(wave.input_sha256), input = JSON.parse(inputBytes);
  if (jsonBytes(input) !== jsonBytes(wave.method) ||
      jsonBytes(input.methods.map((m) => m.file)) !== jsonBytes(METHOD_FILES))
    throw new Error("frozen input or method manifest mismatch");
  for (const method of input.methods) {
    get(method.sha256);
    if (sha256hex(readFileSync(path.join(ROOT, method.file))) !== method.sha256)
      throw new Error(`replay needs the frozen method: ${method.file}`);
  }
  const registers = input.registers.map((r) => ({ ...r, document: JSON.parse(get(r.sha256)) }));
  const selected = selectClaims(registers);
  const urls = [...new Set(selected.claims.map((r) => r.claim.source_url))].sort();
  if (jsonBytes(wave.sources.map((s) => s.source_url)) !== jsonBytes(urls))
    throw new Error("source set differs from frozen inputs");
  const observations = new Map(wave.sources.map((s) => [s.source_url,
    { ...s, ...(s.ok ? { body: get(s.body_sha256) } : {}) }]));
  const rows = selected.claims.map((r) => compareClaim(r, observations.get(r.claim.source_url)));
  if (jsonBytes(rows) !== jsonBytes(wave.rows)) throw new Error("replayed rows disagree with wave");
  if (jsonBytes(countsFor(selected, rows, wave.sources)) !== jsonBytes(wave.counts) ||
      jsonBytes(selected.rejected) !== jsonBytes(wave.rejected)) throw new Error("replayed denominator disagrees with wave");
  if (wave.status !== "CANDIDATE_OBSERVATION" || wave.axis_promotion_eligible !== false)
    throw new Error("this method cannot promote a measurement");
  return { verified: true, rows: rows.length, comparable: rows.filter((r) => r.comparable).length,
    sources: observations.size, input_sha256: wave.input_sha256,
    limitation: "Byte replay; not an independent witness, signature or proof of source honesty." };
}

export async function main(args) {
  const value = (flag) => args[args.indexOf(flag) + 1];
  if (args[0] === "--replay" && args.length === 2) {
    const out = path.resolve(args[1]);
    console.log(jsonBytes(replayWave(JSON.parse(readFileSync(out)), out + ".evidence")));
    return;
  }
  if (args.length !== 2 || args[0] !== "--out" || !value("--out"))
    throw new Error("use --out NEW_PATH or --replay EXISTING_PATH (timestamps cannot be overridden)");
  const out = path.resolve(value("--out")), evidence = out + ".evidence";
  if (existsSync(out) || existsSync(evidence)) throw new Error("output/evidence already exists; use a new run path");
  const registers = loadRegisters(path.join(ROOT, "public/claims"));
  const selected = selectClaims(registers);
  if (!selected.claims.length) throw new Error("no valid claims selected");
  mkdirSync(path.dirname(out), { recursive: true });
  mkdirSync(evidence, { mode: 0o700 });
  const blobs = path.join(evidence, "blobs");
  mkdirSync(blobs, { mode: 0o700 });
  const input = { schema: "csoai.claim-maintenance.wave-input/0.2", frozen_at: new Date().toISOString(),
    specification: SPEC_URL, node: process.version,
    methods: METHOD_FILES.map((file) => ({ file, sha256: putBlob(blobs, readFileSync(path.join(ROOT, file))) })),
    registers: registers.map((r) => ({ file: r.file, sha256: putBlob(blobs, r.raw) })),
    selection: "verified supersedes links; unique subject identifier plus claim_id; conflicting active copies rejected",
    request: { timeout_ms: 20000, max_body_bytes: 8388608, concurrency: 4, user_agent: UA,
      body_representation: "Fetch-decoded HTTP response body; no text normalization for raw-bytes" },
    scope: "Convenience corpus of captured claims, clustered by source URL. No population inference." };
  const input_sha256 = putBlob(blobs, Buffer.from(jsonBytes(input)));
  writeFileSync(path.join(evidence, "input.json"), jsonBytes(input), { flag: "wx", mode: 0o600 });
  console.error(`Frozen ${input_sha256}; ${selected.counts.unique_claims} distinct claims, ${selected.claims.length} selected.`);
  const observations = await collectObservations(selected.claims);
  for (const s of observations) if (s.ok) putBlob(blobs, s.body);
  const byUrl = new Map(observations.map((s) => [s.source_url, s]));
  const rows = selected.claims.map((r) => compareClaim(r, byUrl.get(r.claim.source_url)));
  const wave = { schema: "csoai.claim-maintenance.wave/0.2", started_at: input.frozen_at,
    completed_at: new Date().toISOString(), input_sha256, method: input,
    status: "CANDIDATE_OBSERVATION", axis_promotion_eligible: false,
    counts: countsFor(selected, rows, observations),
    outstanding_gates: ["source-edit disclosure method", "withdrawal adjudication beyond text absence",
      "sampling and dependence review", "independent review and authorized admission"],
    does_not_prove: ["Whether any claim is true, false, withdrawn or changed silently.",
      "A count of independent subjects; multiple claims share a source response.",
      "A ranking, grade, signature, public measurement admission or human approval."],
    rejected: selected.rejected, sources: observations.map(({ body, ...s }) => s), rows };
  writeFileSync(out, jsonBytes(wave), { flag: "wx", mode: 0o600 });
  console.log(jsonBytes({ out, ...wave.counts, replay: replayWave(wave, evidence) }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { await main(process.argv.slice(2)); }
  catch (e) { console.error(e.message); process.exitCode = 1; }
}
