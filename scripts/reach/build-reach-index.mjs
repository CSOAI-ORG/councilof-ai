#!/usr/bin/env node
/**
 * build-reach-index.mjs — the compact, sharded index the MCP-server and x402 entity pages read.
 *
 * WHY THIS FILE EXISTS. The entity pages (/mcp-servers/<host>/, /x402/<host>/) are rendered by a
 * Pages Function at request time, not written as static files: the site sits a few hundred files
 * under the Pages 20,000-file cap. The MCP contract-parity rows they describe are 5,828 rows and
 * ~16 MB of JSON — far more than a Function can fetch and parse per request inside its CPU budget.
 * So this producer does the heavy read ONCE, from the SIGNED published records, and writes a small
 * number of shard files (public/reach/v1/) that a Function can read in one sub-millisecond parse.
 *
 * NOTHING HERE IS A NEW MEASUREMENT. Every value is copied from a board-signed record; the
 * manifest names each source record, its signature state and the sha256 of every file read, so a
 * reader can re-derive any shard from the published bytes. Values are copied, never recomputed.
 *
 * FAIL CLOSED. A source whose Ed25519 signature does not verify under the pinned board key, whose
 * record bytes do not match the signed sha256, or whose data file does not match the sha256 the
 * signed record pins, stops the run before anything is written. A half-built index is never
 * written over a whole one.
 *
 * OPT-OUT. scripts/census/probe-exclusions.json (the census's own exclusion list, read fail-closed
 * exactly as the prober reads it) and every endpoint a census run recorded as not attempted because
 * robots.txt disallowed CSOAI-census (or could not be read) are left out of the index entirely, so
 * they get no page and no sitemap entry. The manifest records the counts, never the names.
 *
 *   node scripts/reach/build-reach-index.mjs --write     # fetch signed sources (network), verify, write
 *   node scripts/reach/build-reach-index.mjs --x402      # offline: rebuild only the x402 census file
 *   node scripts/reach/build-reach-index.mjs --verify    # offline: every file the manifest pins is present
 *                                                        # with that sha256, shards parse, exclusions hold
 */
import { createHash, createPublicKey, verify as edVerify } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public/reach/v1");
const HF = "https://huggingface.co/datasets";
export const SCHEMA = "csoai.reach-index/0.1";
export const SHARDS = 16; // shard = first hex of sha256(host); 16 files keep the Pages file budget small
export const DIMS = ["AUTH", "PAYMENT", "PROTOCOL", "TOOLS", "VERSION"];
const MAX_DECLARED = 4;
const MAX_VALUE = 160;

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
export const shardOf = (host) => sha256(String(host).toLowerCase()).slice(0, 1);

/** The board key the site pins (functions/_lib/cardVerify.ts PINNED_ANCHORS) — read, never retyped. */
export function pinnedBoardKey(root = ROOT) {
  const src = readFileSync(join(root, "functions/_lib/cardVerify.ts"), "utf8");
  const m = src.match(/id:\s*"did:web:csoai\.org#board-attestation-1",\s*hex:\s*"([0-9a-f]{64})"/);
  if (!m) throw new Error("board-attestation-1 key not found in functions/_lib/cardVerify.ts");
  return m[1];
}

/** JSON.stringify of the key-sorted value: functions/_lib/cardVerify.ts jsCanonical, byte for byte. */
export function jsCanonical(v) {
  const rec = (x) => {
    if (Array.isArray(x)) return x.map(rec);
    if (x && typeof x === "object") {
      const out = {};
      for (const k of Object.keys(x).sort()) out[k] = rec(x[k]);
      return out;
    }
    return x;
  };
  return JSON.stringify(rec(v));
}

/** csoai.signed-run/0.1 sidecar: pinned key, preimage hash, and that it pins `recordBytes`. */
export function verifySidecar(sidecar, recordBytes, keyHex) {
  const p = sidecar?.payload, s = sidecar?.signature;
  if (!p || !s) return { state: "FAILS", reason: "sidecar lacks payload/signature" };
  if (s.did !== "did:web:csoai.org#board-attestation-1") return { state: "FAILS", reason: `signer ${s.did} is not the pinned board key` };
  const pre = Buffer.from(jsCanonical(p), "utf8");
  if (sha256(pre) !== s.payload_sha256) return { state: "FAILS", reason: "payload sha256 != signature.payload_sha256" };
  const spki = Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(keyHex, "hex")]);
  const key = createPublicKey({ key: spki, format: "der", type: "spki" });
  if (!/^[0-9a-f]{128}$/.test(String(s.sig_ed25519 || ""))) return { state: "FAILS", reason: "sig_ed25519 is not 64 hex bytes" };
  if (!edVerify(null, pre, key, Buffer.from(s.sig_ed25519, "hex"))) return { state: "FAILS", reason: "Ed25519 signature does not verify" };
  if (p.artifact?.sha256 !== sha256(recordBytes)) return { state: "FAILS", reason: "signed payload does not pin these record bytes" };
  return { state: "VERIFIES", payload_sha256: s.payload_sha256, signed_at: s.signed_at ?? null };
}

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": "csoai-reach-index/0.1 (+https://councilof.ai/census/)" }, signal: AbortSignal.timeout(90_000) });
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      if (r.status === 404) throw Object.assign(new Error(`HTTP 404 ${url}`), { fatal: true });
      if (i === 2) throw new Error(`HTTP ${r.status} ${url}`);
    } catch (e) {
      if (e.fatal || i === 2) throw e;
    }
    await new Promise((res) => setTimeout(res, 2000 * (i + 1)));
  }
  throw new Error(`unreachable ${url}`);
}
const resolve = (ds, path) => `${HF}/${ds}/resolve/main/${path}`;

/** One signed source: sidecar -> record -> each pinned file. Throws on any mismatch. */
async function signedSource(keyHex, ds, recordPath, signedPath, files) {
  const [recB, sigB] = await Promise.all([get(resolve(ds, recordPath)), get(resolve(ds, signedPath))]);
  const sig = verifySidecar(JSON.parse(sigB.toString("utf8")), recB, keyHex);
  if (sig.state !== "VERIFIES") throw new Error(`${ds}/${signedPath}: ${sig.reason}`);
  const record = JSON.parse(recB.toString("utf8"));
  const out = { dataset: ds, record: recordPath, record_url: `https://huggingface.co/datasets/${ds}/blob/main/${recordPath}`,
    signed: signedPath, signed_url: `https://huggingface.co/datasets/${ds}/blob/main/${signedPath}`,
    record_sha256: sha256(recB), signature: sig.state, signature_payload_sha256: sig.payload_sha256,
    schema: record.schema ?? null, as_of: record.as_of ?? null, files: {}, data: {} };
  for (const f of files) {
    const pin = record.published_files?.[f]?.sha256;
    if (!pin) throw new Error(`${ds}/${recordPath}: published_files does not pin ${f}`);
    const b = await get(resolve(ds, f));
    if (sha256(b) !== pin) throw new Error(`${ds}/${f}: sha256 ${sha256(b)} != pinned ${pin}`);
    out.files[f] = pin;
    out.data[f] = gunzipSync(b).toString("utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  }
  return out;
}

/** Newest dated daily record (record.YYYY-MM-DD.json) in a dataset root, from the HF tree listing. */
async function newestDaily(ds) {
  const tree = JSON.parse((await get(`https://huggingface.co/api/datasets/${ds}/tree/main`)).toString("utf8"));
  const dates = tree.map((x) => x.path.match(/^record\.(\d{4}-\d{2}-\d{2})\.json$/)?.[1]).filter(Boolean).sort();
  if (!dates.length) throw new Error(`${ds}: no dated daily record`);
  return dates.at(-1);
}

/** The census's own exclusion list, read fail-closed exactly as scripts/census/mcp-remote-probe.py reads it. */
export function loadExclusions(root = ROOT) {
  const doc = JSON.parse(readFileSync(join(root, "scripts/census/probe-exclusions.json"), "utf8"));
  if (doc.schema !== "csoai.probe-exclusions/0.1" || !Array.isArray(doc.entries)) throw new Error("probe-exclusions.json: not a csoai.probe-exclusions/0.1 document");
  return doc.entries.map((e) => {
    const v = String(e.value || "").trim();
    if (!["endpoint", "host"].includes(e.match) || !v) throw new Error(`probe-exclusions.json: bad entry ${JSON.stringify(e)}`);
    return { id: e.id || v, match: e.match, value: e.match === "endpoint" ? v.replace(/\/+$/, "").toLowerCase() : v.toLowerCase() };
  });
}
export function excludedBy(url, exclusions) {
  let u;
  try { u = new URL(url); } catch { return null; }
  const host = u.hostname.toLowerCase();
  const norm = `${u.protocol}//${u.host}${u.pathname}`.replace(/\/+$/, "").toLowerCase();
  for (const e of exclusions) {
    if (e.match === "endpoint" && norm === e.value) return e.id;
    if (e.match === "host" && (host === e.value || host.endsWith("." + e.value))) return e.id;
  }
  return null;
}
export const isRobotsReason = (reason) => /^robots\.txt\b|robots\.txt (rules )?disallow/i.test(String(reason || ""));

const clip = (s) => { const t = String(s ?? ""); return t.length > MAX_VALUE ? t.slice(0, MAX_VALUE - 1) + "…" : t; };
const fmtClaim = (c) => (c && typeof c === "object" ? clip(`${c.surface ?? "?"} · ${c.path ?? "?"} = ${c.value ?? ""}`) : null);

/** One contract-parity dimension, compacted: state, what was declared, what was observed, and why. */
export function compactDim(d) {
  if (!d || typeof d !== "object") return { s: "UNMEASURED" };
  const claims = Array.isArray(d.claims) ? d.claims : [];
  const live = (c) => /^live\b/i.test(String(c?.surface || ""));
  const declared = [...(Array.isArray(d.declared) ? d.declared : []), ...claims.filter((c) => !live(c))];
  const observed = [d.observed, d.live, ...claims.filter(live)].filter((c) => c && typeof c === "object");
  const out = { s: String(d.state || "UNMEASURED") };
  if (declared.length) {
    out.d = declared.slice(0, MAX_DECLARED).map(fmtClaim);
    if (declared.length > MAX_DECLARED) out.dn = declared.length;
  }
  if (observed.length) out.o = fmtClaim(observed[0]);
  if (d.detail) out.x = clip(d.detail);
  if (d.reason) out.r = clip(d.reason);
  return out;
}

const minIso = (a, b) => (!a ? b : !b ? a : a < b ? a : b);
const maxIso = (a, b) => (!a ? b : !b ? a : a > b ? a : b);

/** Capsule counts per normalised endpoint, read offline from the committed signed capsule shards. */
function capsuleCounts(root = ROOT) {
  const dir = join(root, "public/measurement-capsules/v0.2/endpoints");
  const out = new Map();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((n) => /^[0-9a-f]{2}\.json$/.test(n))) {
    const j = JSON.parse(readFileSync(join(dir, f), "utf8"));
    for (const e of Object.values(j.endpoints || {})) out.set(e.endpoint, (e.capsules || []).length);
  }
  return out;
}
const normEndpoint = (raw) => {
  try {
    const u = new URL(String(raw).trim());
    const port = u.port && !((u.protocol === "https:" && u.port === "443") || (u.protocol === "http:" && u.port === "80")) ? `:${u.port}` : "";
    let p = u.pathname || "/";
    if (p.length > 1) p = p.replace(/\/+$/, "") || "/";
    return `${u.protocol}//${u.hostname.toLowerCase()}${port}${p}${u.search}`;
  } catch { return null; }
};

/** Pure: signed rows in, shards out. Exported so the unit tests exercise the exact producer. */
export function buildMcp({ parityRows, populationRows = [], dailyRows = [], notAttempted = [], exclusions = [], capsules = new Map() }) {
  const robots = new Set();
  for (const r of [...populationRows, ...dailyRows, ...notAttempted]) {
    if ((r.state === "NOT_ATTEMPTED" || !r.state) && isRobotsReason(r.reason) && r.endpoint) robots.add(normEndpoint(r.endpoint));
  }
  const census = new Map(); // endpoint -> newest census row
  const seen = new Map();   // endpoint -> {first,last,n}
  const note = (ep, at) => {
    if (!at) return;
    const s = seen.get(ep) || { first: null, last: null, n: 0 };
    s.first = minIso(s.first, at); s.last = maxIso(s.last, at); s.n++;
    seen.set(ep, s);
  };
  for (const r of [...populationRows, ...dailyRows]) {
    const ep = normEndpoint(r.endpoint);
    if (!ep || r.state === "NOT_ATTEMPTED") continue;
    const at = r.finished || r.started || null;
    note(ep, at);
    const prev = census.get(ep);
    if (!prev || (at && (!prev._at || at > prev._at))) census.set(ep, { ...r, _at: at });
  }
  const hosts = new Map();
  const excluded = { operator_endpoints: 0, robots_endpoints: 0 };
  for (const r of parityRows) {
    const ep = normEndpoint(r.endpoint);
    if (!ep) continue;
    if (excludedBy(ep, exclusions)) { excluded.operator_endpoints++; continue; }
    if (robots.has(ep)) { excluded.robots_endpoints++; continue; }
    const host = String(r.host || new URL(ep).hostname).toLowerCase();
    const live = r.live || null;
    if (live?.finished) note(ep, live.finished);
    const c = census.get(ep);
    const dims = {};
    for (const k of DIMS) dims[k] = compactDim(r.dimensions?.[k]);
    const surf = {};
    for (const [k, v] of Object.entries(r.surfaces || {})) surf[k] = Array.isArray(v) ? v.map((x) => x.state).join("+") : String(v?.state ?? "");
    const e = {
      u: r.endpoint,
      reg: (r.registry_ids || []).slice(0, 5),
      inc: r.inclusion ?? null,
      own: !!r.own_estate,
      live: live ? { s: live.state, at: live.finished ?? null, http: live.http_status ?? null, pv: live.protocol_version ?? null, sv: live.server_version ?? null, nt: live.n_tools ?? null, src: live.probe_source ?? null } : null,
      dims,
      surf,
      cen: c ? { s: c.state, at: c._at, why: clip(c.reason), pv: c.protocol_version_negotiated ?? c.protocol_version ?? null, nt: c.n_tools ?? null, tr: c.transport ?? null, run: c.observation?.run ?? null } : null,
      seen: seen.get(ep) || null,
      caps: capsules.get(ep) ?? 0,
    };
    if (!hosts.has(host)) hosts.set(host, []);
    hosts.get(host).push(e);
  }
  const shards = Array.from({ length: SHARDS }, () => ({}));
  const list = [];
  for (const host of [...hosts.keys()].sort()) {
    const eps = hosts.get(host).sort((a, b) => a.u.localeCompare(b.u));
    shards[parseInt(shardOf(host), 16)][host] = eps;
    const st = { CONSISTENT: 0, INCONSISTENT: 0, SINGLE_SURFACE: 0, UNCHECKABLE: 0 };
    let last = null;
    for (const e of eps) {
      for (const k of DIMS) if (e.dims[k].s in st) st[e.dims[k].s]++;
      last = maxIso(last, e.seen?.last);
    }
    // [host, endpoints, CONSISTENT, INCONSISTENT, SINGLE_SURFACE, UNCHECKABLE, last seen, own estate]
    list.push([host, eps.length, st.CONSISTENT, st.INCONSISTENT, st.SINGLE_SURFACE, st.UNCHECKABLE, last, eps.some((e) => e.own) ? 1 : 0]);
  }
  return { shards, list, excluded, n_hosts: list.length, n_endpoints: list.reduce((a, r) => a + r[1], 0) };
}

/** Offline: x402 settlement-census cards (public/interop/x402-census-cards) keyed by host. */
export function buildX402(root = ROOT) {
  const dir = join(root, "public/interop/x402-census-cards");
  const round = JSON.parse(readFileSync(join(root, "public/interop/x402-census/index.json"), "utf8"));
  const hosts = {};
  for (const f of readdirSync(dir).filter((n) => /^[0-9a-f]{64}\.json$/.test(n)).sort()) {
    const raw = readFileSync(join(dir, f));
    const c = JSON.parse(raw.toString("utf8"));
    const p = c.payload || {};
    const host = String(p.host || c.subject || "").toLowerCase();
    if (!host) continue;
    (hosts[host] ||= []).push({
      card: `/interop/x402-census-cards/${f}`, card_sha256: sha256(raw), status: p.status ?? null, resource: p.resource ?? null,
      asset: p.asset ?? null, network: p.network ?? null, x402_version: p.x402_version ?? null, observed_at: p.observed_at ?? c.as_of ?? null,
      advertised_mime: p.advertised_mime ?? null, delivered_content_type: p.delivered_content_type ?? null, delivered_bytes: p.delivered_bytes ?? null,
      settle_tx: p.settle_tx ?? null, settle_tx_state: p.settle_tx_state ?? null, n: p.n ?? 1, unmeasured: c.unmeasured || [],
    });
  }
  return {
    schema: `${SCHEMA}#x402-census`, as_of: round.as_of ?? null,
    source: { index: "/interop/x402-census/index.json", rounds: (round.rounds || []).map((r) => r.url), ladder: round.ladder ?? null },
    doctrine: "One purchase per host per round. A host's series stays UNMEASURED until it has the paid observations the census ladder requires; nothing here is a per-host verdict.",
    hosts,
  };
}

const enc = (o) => JSON.stringify(o) + "\n";

/**
 * The dimension texts repeat across thousands of endpoints ("no surface declares a tool list or
 * count"), so each shard carries them once in a string table `t` and the dimensions hold indexes
 * into it. This keeps a shard small enough to parse inside a Function's CPU budget. The renderer
 * (functions/_lib/reach/mcp.ts resolveShard) turns the indexes back into the exact strings.
 */
export function internShard(hosts, shard) {
  const t = [];
  const at = new Map();
  const id = (v) => {
    if (v == null) return v;
    if (!at.has(v)) { at.set(v, t.length); t.push(v); }
    return at.get(v);
  };
  const out = {};
  for (const [h, eps] of Object.entries(hosts)) {
    out[h] = eps.map((e) => ({
      ...e,
      dims: Object.fromEntries(Object.entries(e.dims).map(([k, d]) => [k, {
        s: d.s, ...(d.d ? { d: d.d.map(id) } : {}), ...(d.dn ? { dn: d.dn } : {}),
        ...(d.o != null ? { o: id(d.o) } : {}), ...(d.x != null ? { x: id(d.x) } : {}), ...(d.r != null ? { r: id(d.r) } : {}),
      }])),
      ...(e.cen ? { cen: { ...e.cen, why: id(e.cen.why) } } : {}),
    }));
  }
  return { schema: `${SCHEMA}#mcp-shard`, shard, interned: "dims.*.d[], dims.*.o, dims.*.x, dims.*.r and cen.why are indexes into t", t, hosts: out };
}

/** Inverse of internShard: exact strings back. */
export function resolveShard(doc) {
  const t = doc.t || [];
  const r = (i) => (typeof i === "number" ? t[i] : i);
  const out = {};
  for (const [h, eps] of Object.entries(doc.hosts || {})) {
    out[h] = eps.map((e) => ({
      ...e,
      dims: Object.fromEntries(Object.entries(e.dims).map(([k, d]) => [k, { ...d, ...(d.d ? { d: d.d.map(r) } : {}), ...(d.o != null ? { o: r(d.o) } : {}), ...(d.x != null ? { x: r(d.x) } : {}), ...(d.r != null ? { r: r(d.r) } : {}) }])),
      ...(e.cen ? { cen: { ...e.cen, why: r(e.cen.why) } } : {}),
    }));
  }
  return out;
}

function writeAll(files) {
  const tmp = OUT + ".tmp-" + process.pid;
  rmSync(tmp, { recursive: true, force: true });
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(tmp, rel)), { recursive: true });
    writeFileSync(join(tmp, rel), body);
  }
  const old = OUT + ".old-" + process.pid;
  if (existsSync(OUT)) renameSync(OUT, old);
  renameSync(tmp, OUT);
  rmSync(old, { recursive: true, force: true });
}

async function write() {
  const keyHex = pinnedBoardKey();
  const exclusions = loadExclusions();
  const cp = await signedSource(keyHex, "csoai/mcp-contract-parity", "record.v0.1.2.json", "record.v0.1.2.signed.json", ["rows.v0.1.2.jsonl.gz"]);
  const pop = await signedSource(keyHex, "csoai/mcp-remote-census", "record.v0.2.1.json", "record.v0.2.1.signed.json", ["results.v0.2.public.jsonl.gz"]);
  const day = await newestDaily("csoai/mcp-remote-census");
  const daily = await signedSource(keyHex, "csoai/mcp-remote-census", `record.${day}.json`, `record.${day}.signed.json`,
    [`probe/results.public.${day}.jsonl.gz`, `probe/not_attempted.${day}.jsonl.gz`]);
  const built = buildMcp({
    parityRows: cp.data["rows.v0.1.2.jsonl.gz"],
    populationRows: pop.data["results.v0.2.public.jsonl.gz"],
    dailyRows: daily.data[`probe/results.public.${day}.jsonl.gz`],
    notAttempted: daily.data[`probe/not_attempted.${day}.jsonl.gz`],
    exclusions,
    capsules: capsuleCounts(),
  });
  const files = {};
  built.shards.forEach((s, i) => { files[`mcp/${i.toString(16)}.json`] = enc(internShard(s, i.toString(16))); });
  files["mcp/list.json"] = enc({ schema: `${SCHEMA}#mcp-list`, columns: ["host", "endpoints", "CONSISTENT", "INCONSISTENT", "SINGLE_SURFACE", "UNCHECKABLE", "last_seen", "own_estate"], rows: built.list });
  files["x402-census.json"] = enc(buildX402());
  const strip = (s) => ({ dataset: s.dataset, record: s.record, record_url: s.record_url, signed: s.signed, signed_url: s.signed_url, record_sha256: s.record_sha256,
    signature: s.signature, signature_payload_sha256: s.signature_payload_sha256, schema: s.schema, as_of: s.as_of, files: s.files });
  const manifest = {
    schema: SCHEMA,
    what_this_is: "A compact, sharded copy of signed census records, so the entity pages under /mcp-servers/ and /x402/ can be rendered at request time. Every value is copied from the records named here; nothing is re-measured.",
    what_this_is_not: "Not a grade, ranking, rating or endorsement of any server, and says nothing about security, quality or safety.",
    producer: "scripts/reach/build-reach-index.mjs",
    built_at: new Date().toISOString(),
    shard_rule: `sha256(lower-case host), first hex digit; ${SHARDS} shards`,
    sources: { contract_parity: strip(cp), census_population: strip(pop), census_daily: strip(daily),
      probe_exclusions: { path: "scripts/census/probe-exclusions.json", sha256: sha256(readFileSync(join(ROOT, "scripts/census/probe-exclusions.json"))), entries: exclusions.length },
      capsules: { path: "/measurement-capsules/v0.2/endpoints/", note: "capsule counts per endpoint, read from the committed signed capsule shards" },
      x402_census: { path: "/interop/x402-census/index.json", cards: "/interop/x402-census-cards/" } },
    types: {
      "mcp-servers": { hosts: built.n_hosts, endpoints: built.n_endpoints, excluded: built.excluded,
        opt_out_rule: "an endpoint in scripts/census/probe-exclusions.json, or one a census run did not attempt because robots.txt disallowed CSOAI-census or could not be read, has no page" },
      x402: { census_hosts: Object.keys(JSON.parse(files["x402-census.json"]).hosts).length },
    },
    files: Object.fromEntries(Object.entries(files).map(([k, v]) => [k, sha256(Buffer.from(v))])),
  };
  files["manifest.json"] = JSON.stringify(manifest, null, 1) + "\n";
  writeAll(files);
  console.log(`[reach-index] wrote ${Object.keys(files).length} files: ${built.n_hosts} hosts / ${built.n_endpoints} endpoints (excluded ${JSON.stringify(built.excluded)}), ${manifest.types.x402.census_hosts} x402 census hosts`);
}

function refreshX402() {
  const mf = JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8"));
  const body = enc(buildX402());
  writeFileSync(join(OUT, "x402-census.json"), body);
  mf.files["x402-census.json"] = sha256(Buffer.from(body));
  mf.types.x402.census_hosts = Object.keys(JSON.parse(body).hosts).length;
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(mf, null, 1) + "\n");
  console.log(`[reach-index] x402-census.json: ${mf.types.x402.census_hosts} hosts`);
}

/** Offline integrity gate (build:client): pins hold, shards parse, every host is in its shard, no excluded endpoint is present. */
export function verifyIndex(root = ROOT) {
  const out = join(root, "public/reach/v1");
  const problems = [];
  let mf;
  try { mf = JSON.parse(readFileSync(join(out, "manifest.json"), "utf8")); } catch (e) { return [`manifest.json unreadable: ${e.message}`]; }
  if (mf.schema !== SCHEMA) problems.push(`manifest schema ${mf.schema} != ${SCHEMA}`);
  for (const [rel, pin] of Object.entries(mf.files || {})) {
    const p = join(out, rel);
    if (!existsSync(p)) { problems.push(`${rel} missing`); continue; }
    if (sha256(readFileSync(p)) !== pin) problems.push(`${rel} sha256 differs from the manifest`);
  }
  for (const s of ["contract_parity", "census_population", "census_daily"]) {
    if (mf.sources?.[s]?.signature !== "VERIFIES") problems.push(`source ${s} signature is not VERIFIES`);
  }
  const exclusions = loadExclusions(root);
  const list = JSON.parse(readFileSync(join(out, "mcp/list.json"), "utf8")).rows;
  let endpoints = 0;
  const shards = {};
  for (let i = 0; i < SHARDS; i++) shards[i.toString(16)] = resolveShard(JSON.parse(readFileSync(join(out, `mcp/${i.toString(16)}.json`), "utf8")));
  for (const [host, n] of list) {
    const eps = shards[shardOf(host)]?.[host];
    if (!eps) { problems.push(`${host} is listed but absent from shard ${shardOf(host)}`); continue; }
    if (eps.length !== n) problems.push(`${host}: list says ${n} endpoints, shard has ${eps.length}`);
    for (const e of eps) if (excludedBy(e.u, exclusions)) problems.push(`${e.u} is on the exclusion list but indexed`);
    endpoints += eps.length;
  }
  const inShards = Object.values(shards).reduce((a, s) => a + Object.keys(s).length, 0);
  if (inShards !== list.length) problems.push(`shards hold ${inShards} hosts, list holds ${list.length}`);
  if (mf.types?.["mcp-servers"]?.hosts !== list.length) problems.push(`manifest hosts ${mf.types?.["mcp-servers"]?.hosts} != list ${list.length}`);
  if (mf.types?.["mcp-servers"]?.endpoints !== endpoints) problems.push(`manifest endpoints ${mf.types?.["mcp-servers"]?.endpoints} != ${endpoints}`);
  return problems;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const arg = process.argv.slice(2);
  if (arg.includes("--write")) await write();
  else if (arg.includes("--x402")) refreshX402();
  else {
    const p = verifyIndex();
    if (p.length) { console.error(`[reach-index] ${p.length} problem(s):\n  ` + p.slice(0, 30).join("\n  ")); process.exit(1); }
    console.log("[reach-index] verify ok: every pinned file present with its sha256; shards and list agree; no excluded endpoint indexed");
  }
}
