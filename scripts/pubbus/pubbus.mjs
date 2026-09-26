#!/usr/bin/env node
/**
 * scripts/pubbus/pubbus.mjs — the publication bus. Every signed evidence record we harvest gets a
 * public page, a sitemap entry, an llms.txt line and an IndexNow URL, without anyone typing it.
 *
 *   node scripts/pubbus/pubbus.mjs                 # resolve, verify, publish (writes files)
 *   node scripts/pubbus/pubbus.mjs --dry-run       # everything except writing
 *   node scripts/pubbus/pubbus.mjs --index <file>  # use a local evidence index (csoai.evidence-index/0.1)
 *   node scripts/pubbus/pubbus.mjs --no-llms       # do not regenerate public/llms*.txt afterwards
 *
 * INPUT, in order: (1) the signed evidence index on Hugging Face, csoai/evidence-index index.json,
 * whose own signature is verified first; (2) a local index passed with --index; (3) otherwise the
 * known signed datasets (KNOWN_DATASETS), read at their current revision from the Hub tree API.
 *
 * PER SIGNED RECORD: verify the csoai.signed-run/0.1 signature against the key in
 * https://csoai.org/.well-known/did.json (refuse on any failure, including a tamper control that
 * does not fail) -> fetch the record the signature pins and require sha256 equality -> read the
 * OpenTimestamps state from the proof BYTES -> render public/evidence/<slug>/<version>/index.html
 * from the record's own fields -> refuse the page if its visible text carries any number the
 * record, its signed document or its timestamp files do not already publish.
 *
 * IDEMPOTENT: a version is keyed by the record's sha256. A record already published is a no-op
 * (no file is rewritten). A changed record is a new dated version; the previous one is marked
 * SUPERSEDED, never deleted. The only in-place update is a timestamp state that moved (a pending
 * proof that was upgraded), because that is new information about the same bytes.
 *
 * OUTPUTS (all derived; never hand-edit):
 *   public/evidence/<slug>/index.html, public/evidence/<slug>/<version>/index.html
 *   public/evidence/published-records.json             (read by scripts/llms-txt.mjs and /status)
 *   council-os/pubbus/indexnow-pending.txt              (the post-deploy step submits, then clears)
 *   council-os/pubbus/listing-updates.json              (402index / Harness X rows for NEW doors; never called here)
 * The sitemap needs no edit: scripts/generate-sitemap.mjs already lists every static
 * public/**\/index.html at its trailing-slash URL. _redirects needs none: Pages serves
 * /evidence/<slug>/ directly and canonicalises the bare form.
 *
 * Census and probe records are EVIDENCE linked from the board. Nothing here reads or writes
 * /api/gspc totals.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  HF, SITE, DID_URL, MANIFEST_SCHEMA, sha256, didKeys, verifySignedRun, otsStateOfBytes,
  slugFor, foreignNumbers, parseHfResolve, hfResolve, parseJsonRaw,
} from "./lib.mjs";
import { renderVersionPage, renderSlugIndex, renderStateBlock } from "./render.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const KNOWN_DATASETS = [
  "mcp-remote-census",
  "hf-mcp-spaces-census",
  "a2a-card-census",
  "mcp-contract-parity",
  "cross-ledger-supply",
  "agent-interop-census",
];
const INDEX_URL = `${HF}/datasets/csoai/evidence-index/resolve/main/index.json`;
const INDEX_SIGNED_URL = `${HF}/datasets/csoai/evidence-index/resolve/main/index.signed.json`;
const UA = "csoai-pubbus/0.1 (+https://councilof.ai/status)";

const OUT = {
  manifest: "public/evidence/published-records.json",
  indexnow: "council-os/pubbus/indexnow-pending.txt",
  listings: "council-os/pubbus/listing-updates.json",
  capabilities: "council-os/capabilities.json",
};

export async function httpFetcher(url) {
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow" });
      const bytes = Buffer.from(await r.arrayBuffer());
      if (r.status === 429 || r.status >= 500) { last = new Error(`HTTP ${r.status}`); await new Promise((s) => setTimeout(s, 2000 * (i + 1))); continue; }
      return { status: r.status, bytes };
    } catch (e) {
      last = e;
      await new Promise((s) => setTimeout(s, 2000 * (i + 1)));
    }
  }
  return { status: 0, bytes: Buffer.alloc(0), error: String(last?.message ?? last) };
}

const jsonOf = (buf) => JSON.parse(buf.toString("utf8"));
const stable = (o) => JSON.stringify(o, null, 1) + "\n";

// ---------------------------------------------------------------- input resolution
async function resolveCandidates(fetcher, keys, opts, report) {
  // (1) the signed evidence index on the Hub
  const idx = await fetcher(INDEX_URL);
  if (idx.status === 200) {
    const sig = await fetcher(INDEX_SIGNED_URL);
    let ok = false;
    if (sig.status === 200) {
      try {
        const doc = jsonOf(sig.bytes);
        const v = verifySignedRun(doc, keys);
        ok = v.state === "VERIFIED" && doc.payload?.artifact?.sha256 === sha256(idx.bytes);
      } catch { ok = false; }
    }
    report.index = { source: INDEX_URL, state: ok ? "VERIFIED" : "REFUSED_SIGNATURE" };
    if (ok) return candidatesFromIndex(jsonOf(idx.bytes));
  } else {
    report.index = { source: INDEX_URL, state: `UNAVAILABLE (HTTP ${idx.status})` };
  }
  // (2) a local index file
  if (opts.index) {
    report.index = { source: opts.index, state: "LOCAL_FILE (its signature is not checked here; each record is)" };
    return candidatesFromIndex(JSON.parse(fs.readFileSync(opts.index, "utf8")));
  }
  // (3) the known signed datasets at their current revision
  report.index.fallback = "KNOWN_DATASETS";
  const out = [];
  for (const ds of opts.datasets ?? KNOWN_DATASETS) {
    const info = await fetcher(`${HF}/api/datasets/csoai/${ds}`);
    if (info.status !== 200) { report.refused.push({ dataset: ds, state: "UNMEASURED", reason: `dataset API answered HTTP ${info.status}` }); continue; }
    const rev = jsonOf(info.bytes).sha;
    const tree = await treeOf(fetcher, ds, rev);
    if (tree === null) { report.refused.push({ dataset: ds, revision: rev, state: "UNMEASURED", reason: "the Hub tree API did not answer; the dataset was not read" }); continue; }
    const signed = tree.filter((p) => p.endsWith(".signed.json") && !p.startsWith("ots-upgraded/"));
    if (!signed.length) { report.refused.push({ dataset: ds, revision: rev, state: "REFUSED_UNSIGNED", reason: "no *.signed.json in the dataset at this revision; nothing to verify, so nothing is published" }); continue; }
    for (const p of signed.sort()) out.push({ dataset: ds, revision: rev, signedPath: p });
  }
  return out;
}

function candidatesFromIndex(index) {
  const out = [];
  for (const it of index.items ?? []) {
    if (it.kind !== "signed-record") continue;
    const u = parseHfResolve(it.url);
    if (u) out.push({ dataset: u.dataset, revision: u.revision, signedPath: u.path });
  }
  return out;
}

// Tree listings cached per fetcher, so two runs with different fetchers (tests) never share one.
const treeCache = new WeakMap();
async function treeOf(fetcher, ds, rev) {
  if (!treeCache.has(fetcher)) treeCache.set(fetcher, new Map());
  const trees = treeCache.get(fetcher);
  const k = `${ds}@${rev}`;
  if (!trees.has(k)) {
    const r = await fetcher(`${HF}/api/datasets/csoai/${ds}/tree/${rev}?recursive=1`);
    trees.set(k, r.status === 200 ? jsonOf(r.bytes).map((x) => x.path) : null);
  }
  return trees.get(k);
}

// ---------------------------------------------------------------- one record
async function processCandidate(c, fetcher, keys) {
  const { dataset, revision, signedPath } = c;
  const signedUrl = hfResolve(dataset, revision, signedPath);
  const refuse = (state, reason) => ({ ok: false, refused: { dataset, revision, path: signedPath, state, reason } });
  const s = await fetcher(signedUrl);
  if (s.status !== 200) return refuse("UNMEASURED", `signed document answered HTTP ${s.status}`);
  let doc;
  try { doc = jsonOf(s.bytes); } catch { return refuse("REFUSED_SIGNATURE", "signed document is not JSON"); }
  const verify = verifySignedRun(doc, keys);
  if (verify.state !== "VERIFIED") return refuse("REFUSED_SIGNATURE", verify.reason);
  const payload = doc.payload;
  const artifactPath = signedPath.replace(/\.signed\.json$/, ".json");
  const recordUrl = hfResolve(dataset, revision, artifactPath);
  const r = await fetcher(recordUrl);
  if (r.status !== 200) return refuse("UNMEASURED", `record ${artifactPath} answered HTTP ${r.status}`);
  const recordSha = sha256(r.bytes);
  if (recordSha !== payload?.artifact?.sha256) return refuse("REFUSED_BINDING", `sha256(${artifactPath}) does not equal the signed artifact.sha256`);
  let record;
  try { record = jsonOf(r.bytes); } catch { return refuse("REFUSED_RECORD", "record is not JSON"); }
  if (!record || typeof record !== "object" || Array.isArray(record)) return refuse("REFUSED_RECORD", "record is not a JSON object");

  // Timestamp state, from proof bytes; the sidecar and any upgrade receipt are sources, not verdicts.
  const treeRead = await treeOf(fetcher, dataset, revision);
  const tree = treeRead ?? [];
  const sources = [r.bytes.toString("utf8"), s.bytes.toString("utf8")];
  const ots = { state: "NO_PROOF_PUBLISHED", proof_url: null, proof_state: null, upgraded_proof_url: null, upgraded_proof_state: null, receipt_url: null, receipt_bitcoin: [] };
  if (treeRead === null) ots.state = "UNMEASURED";
  const proofPath = `${artifactPath}.ots`;
  if (tree.includes(proofPath)) {
    const pr = await fetcher(hfResolve(dataset, revision, proofPath));
    if (pr.status === 200) {
      ots.proof_url = hfResolve(dataset, revision, proofPath);
      ots.proof_state = otsStateOfBytes(pr.bytes);
      ots.state = ots.proof_state;
    }
  }
  const sidecar = artifactPath.replace(/\.json$/, ".ots.json");
  if (tree.includes(sidecar)) {
    const sc = await fetcher(hfResolve(dataset, revision, sidecar));
    if (sc.status === 200) sources.push(sc.bytes.toString("utf8"));
  }
  for (const rp of tree.filter((p) => /^ots-upgraded\/[^/]+\/OTS-UPGRADE\.json$/.test(p)).sort()) {
    const rr = await fetcher(hfResolve(dataset, revision, rp));
    if (rr.status !== 200) continue;
    let rec;
    try { rec = jsonOf(rr.bytes); } catch { continue; }
    const hit = (rec.proofs ?? []).find((p) => p.target_file === artifactPath && typeof p.upgraded === "string");
    if (!hit || !tree.includes(hit.upgraded)) continue;
    const up = await fetcher(hfResolve(dataset, revision, hit.upgraded));
    if (up.status !== 200) continue;
    ots.receipt_url = hfResolve(dataset, revision, rp);
    ots.upgraded_proof_url = hfResolve(dataset, revision, hit.upgraded);
    ots.upgraded_proof_state = otsStateOfBytes(up.bytes);
    ots.receipt_bitcoin = (hit.bitcoin ?? []).map((b) => ({ height: b.height, result: b.result, header_source: b.header_source }));
    if (ots.upgraded_proof_state === "BITCOIN_ATTESTATION_IN_PROOF") ots.state = ots.upgraded_proof_state;
    sources.push(rr.bytes.toString("utf8"));
  }

  const asOf = String(payload.artifact?.as_of ?? record.as_of ?? "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(asOf)) return refuse("REFUSED_RECORD", "neither the signed artifact nor the record states an as_of date");
  const slug = slugFor(dataset, artifactPath);
  const version = `${asOf.slice(0, 10)}-${recordSha.slice(0, 12)}`;
  const title = typeof record.title === "string" ? record.title : `csoai/${dataset}${slug === dataset ? "" : ` — ${slug}`}`;
  return {
    ok: true,
    v: {
      slug, dataset, version, title, verify, sources,
      // Rendering reads the bytes with every numeric literal kept as written (lib.RawNum).
      record: parseJsonRaw(r.bytes.toString("utf8")),
      payload: parseJsonRaw(s.bytes.toString("utf8")).payload,
      page: `/evidence/${slug}/${version}/`,
      as_of: asOf,
      read_state: typeof payload.read_state === "string" ? payload.read_state : typeof record.read_state === "string" ? record.read_state : null,
      revision, artifact_path: artifactPath, signed_path: signedPath,
      record_url: recordUrl, signed_url: signedUrl,
      record_sha256: recordSha, signed_sha256: sha256(s.bytes),
      supersedes_sha256: payload.supersedes_sha256 ?? record.supersedes?.sha256 ?? null,
      ots,
    },
  };
}

// ---------------------------------------------------------------- manifest
function manifestVersion(v) {
  return {
    version: v.version, page: v.page, state: v.state ?? "CURRENT",
    superseded_by: v.superseded_by ?? null, superseded_reason: v.superseded_reason ?? null,
    as_of: v.as_of, read_state: v.read_state, record_sha256: v.record_sha256, signed_sha256: v.signed_sha256,
    supersedes_sha256: v.supersedes_sha256, revision: v.revision, artifact_path: v.artifact_path, signed_path: v.signed_path,
    record_url: v.record_url, signed_url: v.signed_url,
    signature: { state: v.verify.state, did: v.verify.did, payload_sha256: v.verify.payload_sha256, signed_at: v.verify.signed_at, rule: v.verify.rule },
    ots: v.ots,
  };
}

/** Order a series and assign CURRENT / SUPERSEDED. Mutates and returns versions. */
export function orderSeries(versions) {
  versions.sort((a, b) => (a.as_of === b.as_of ? String(a.signature?.signed_at ?? a.verify?.signed_at ?? "").localeCompare(String(b.signature?.signed_at ?? b.verify?.signed_at ?? "")) : a.as_of.localeCompare(b.as_of)));
  // A version that another declares it supersedes always sorts before that one.
  for (let i = 0; i < versions.length; i++) {
    for (let j = i + 1; j < versions.length; j++) {
      if (versions[i].supersedes_sha256 && versions[i].supersedes_sha256 === versions[j].record_sha256) {
        const [x] = versions.splice(j, 1);
        versions.splice(i, 0, x);
      }
    }
  }
  versions.forEach((v, i) => {
    if (i === versions.length - 1) { v.state = "CURRENT"; v.superseded_by = null; v.superseded_by_page = null; v.superseded_reason = null; return; }
    const next = versions[i + 1];
    v.state = "SUPERSEDED";
    v.superseded_by = next.version;
    v.superseded_by_page = next.page;
    v.superseded_reason = next.supersedes_sha256 === v.record_sha256
      ? "The newer record declares that it supersedes this one (supersedes_sha256): a correction."
      : "A later dated record in the same series.";
  });
  return versions;
}

// ---------------------------------------------------------------- run
export async function run(opts = {}) {
  const repo = opts.repo ?? REPO;
  const fetcher = opts.fetcher ?? httpFetcher;
  const dry = !!opts.dryRun;
  const report = { index: null, published: [], unchanged: [], ots_updated: [], superseded: [], refused: [], writes: [], listing_updates: 0 };
  const P = (rel) => path.join(repo, rel);
  const writeIfChanged = (rel, text) => {
    const abs = P(rel);
    const have = fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
    if (have === text) return false;
    report.writes.push(rel);
    if (!dry) { fs.mkdirSync(path.dirname(abs), { recursive: true }); fs.writeFileSync(abs, text); }
    return true;
  };

  let did = opts.didDoc;
  if (!did) {
    const d = await fetcher(DID_URL);
    if (d.status !== 200) return { ...report, fatal: `UNMEASURED: the DID document answered HTTP ${d.status}; nothing is verified, so nothing is published` };
    did = jsonOf(d.bytes);
  }
  const keys = didKeys(did);

  const manifest = fs.existsSync(P(OUT.manifest))
    ? JSON.parse(fs.readFileSync(P(OUT.manifest), "utf8"))
    : { schema: MANIFEST_SCHEMA, records: [], refused: [] };
  const bySlug = new Map(manifest.records.map((r) => [r.slug, r]));
  const before = new Map();
  for (const r of manifest.records) for (const v of r.versions) before.set(`${r.slug}/${v.version}`, `${v.state}|${v.superseded_by}`);

  const candidates = await resolveCandidates(fetcher, keys, opts, report);
  const fresh = new Map(); // key slug/version -> processed v (only new or ots-updated)
  const changedPages = new Set();

  for (const c of candidates) {
    const res = await processCandidate(c, fetcher, keys);
    if (!res.ok) { report.refused.push(res.refused); continue; }
    const v = res.v;
    const entry = bySlug.get(v.slug) ?? { slug: v.slug, dataset: v.dataset, title: v.title, page_index: `/evidence/${v.slug}/`, versions: [] };
    const existing = entry.versions.find((x) => x.record_sha256 === v.record_sha256);
    if (existing) {
      if (JSON.stringify(existing.ots.state) === JSON.stringify(v.ots.state)) { report.unchanged.push(`${v.slug}/${existing.version}`); continue; }
      // Same bytes, new timestamp state: keep the first pinned revision for record/signature links.
      Object.assign(v, { revision: existing.revision, record_url: existing.record_url, signed_url: existing.signed_url, version: existing.version, page: existing.page });
      v._previousOts = existing.ots;
      existing.ots = v.ots;
      report.ots_updated.push(`${v.slug}/${existing.version}`);
      fresh.set(`${v.slug}/${existing.version}`, v);
      continue;
    }
    entry.versions.push(manifestVersion(v));
    bySlug.set(v.slug, entry);
    fresh.set(`${v.slug}/${v.version}`, v);
    report.published.push(`${v.slug}/${v.version}`);
  }

  // States, then pages. A page whose visible numbers are not in its sources is refused and its
  // version withdrawn from the manifest before anything is written.
  for (const entry of bySlug.values()) {
    orderSeries(entry.versions);
    for (const mv of entry.versions) {
      const key = `${entry.slug}/${mv.version}`;
      const v = fresh.get(key);
      if (v) {
        Object.assign(v, { state: mv.state, superseded_by: mv.superseded_by, superseded_by_page: mv.superseded_by_page, superseded_reason: mv.superseded_reason });
        const html = renderVersionPage(v);
        // Identifiers the page prints beside the record's own text: version ids, as_of dates and
        // the pinned Hub revision. They are addresses, not figures.
        const extra = [...entry.versions.map((x) => `${x.version} ${x.as_of} ${x.revision}`), v.revision,
          v.ots.proof_url ?? "", v.ots.upgraded_proof_url ?? "", v.ots.receipt_url ?? ""];
        const foreign = foreignNumbers(html, [...v.sources, ...extra]);
        if (foreign.length) {
          report.refused.push({ dataset: v.dataset, revision: v.revision, path: v.signed_path, state: "REFUSED_RENDER", reason: `page would show numbers not in the record: ${foreign.slice(0, 8).join(", ")}` });
          fresh.delete(key);
          if (v._previousOts) {
            // An in-place timestamp update that cannot render keeps the published version as it was.
            mv.ots = v._previousOts;
            report.ots_updated = report.ots_updated.filter((x) => x !== key);
          } else {
            entry.versions = entry.versions.filter((x) => x !== mv);
            report.published = report.published.filter((x) => x !== key);
          }
          continue;
        }
        v._html = html;
      }
    }
    orderSeries(entry.versions);
  }
  for (const entry of [...bySlug.values()]) if (!entry.versions.length) bySlug.delete(entry.slug);

  for (const entry of bySlug.values()) {
    for (const mv of entry.versions) {
      const key = `${entry.slug}/${mv.version}`;
      delete mv.superseded_by_page;
      const v = fresh.get(key);
      const rel = `public${mv.page}index.html`;
      if (v?._html) {
        // Re-render with the FINAL state (a refusal above can change who is current).
        Object.assign(v, { state: mv.state, superseded_by: mv.superseded_by, superseded_by_page: entry.versions.find((x) => x.version === mv.superseded_by)?.page ?? null, superseded_reason: mv.superseded_reason });
        if (writeIfChanged(rel, renderVersionPage(v))) changedPages.add(mv.page);
      } else if (before.get(key) !== `${mv.state}|${mv.superseded_by}`) {
        // An existing page whose state moved: replace only its state block.
        const abs = P(rel);
        if (fs.existsSync(abs)) {
          const html = fs.readFileSync(abs, "utf8");
          const block = renderStateBlock({ ...mv, superseded_by_page: entry.versions.find((x) => x.version === mv.superseded_by)?.page ?? null }, entry.slug);
          const next = html.replace(/<!--pubbus:state-->[\s\S]*?<!--\/pubbus:state-->/, block);
          if (writeIfChanged(rel, next)) { changedPages.add(mv.page); if (mv.state === "SUPERSEDED") report.superseded.push(key); }
        }
      }
    }
    if (writeIfChanged(`public/evidence/${entry.slug}/index.html`, renderSlugIndex(entry))) changedPages.add(`/evidence/${entry.slug}/`);
  }

  // Refusals are published too: an UNMEASURED or refused record is a first-class state.
  const refusedPrev = new Map((manifest.refused ?? []).map((x) => [`${x.dataset}|${x.path ?? ""}`, x]));
  const refusedNext = [];
  for (const x of report.refused) {
    const k = `${x.dataset}|${x.path ?? ""}`;
    const prev = refusedPrev.get(k);
    refusedNext.push(prev && prev.state === x.state && prev.reason === x.reason ? prev : x);
  }
  // A record published now is no longer refused; a refusal not re-observed this run is kept (not re-read is not resolved).
  for (const [k, x] of refusedPrev) if (!refusedNext.some((y) => `${y.dataset}|${y.path ?? ""}` === k)) refusedNext.push(x);
  const publishedKeys = new Set([...bySlug.values()].flatMap((e) => e.versions.map((v) => `${e.dataset}|${v.signed_path}`)));
  const publishedDatasets = new Set([...bySlug.values()].map((e) => e.dataset));
  const refusedFinal = refusedNext
    .filter((x) => !publishedKeys.has(`${x.dataset}|${x.path ?? ""}`))
    .filter((x) => !(x.state === "REFUSED_UNSIGNED" && publishedDatasets.has(x.dataset))).sort((a, b) => `${a.dataset}|${a.path}`.localeCompare(`${b.dataset}|${b.path}`));

  const out = {
    schema: MANIFEST_SCHEMA,
    what_this_is: "Every signed evidence record the publication bus (scripts/pubbus) has verified and published as a page, with each version's state. Written by the bus; never hand-edited.",
    not_board: "Evidence linked from the GSPC board, never counted into it. Board totals: GET https://councilof.ai/api/gspc.",
    verification: "Each record's csoai.signed-run/0.1 signature was verified against https://csoai.org/.well-known/did.json with a tamper control, and the record's sha256 was recomputed and matched before its page was written. Timestamp states are read from the proof bytes.",
    records: [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
    refused: refusedFinal,
  };
  const manifestChanged = writeIfChanged(OUT.manifest, stable(out));

  // IndexNow: accumulate changed URLs; the post-deploy step submits them and clears the file.
  if (changedPages.size || manifestChanged) {
    const urls = new Set(fs.existsSync(P(OUT.indexnow)) ? fs.readFileSync(P(OUT.indexnow), "utf8").split("\n").filter(Boolean) : []);
    for (const p of changedPages) urls.add(`${SITE}${p}`);
    urls.add(`${SITE}/evidence/published-records.json`);
    if (!opts.noLlms) { urls.add(`${SITE}/llms.txt`); urls.add(`${SITE}/llms-full.txt`); }
    writeIfChanged(OUT.indexnow, [...urls].sort().join("\n") + "\n");
  }

  // Listing updates for NEW doors only (402index for paid doors, Harness X for any). Never called here.
  report.listing_updates = listingUpdates(P, writeIfChanged);

  if (!dry && !opts.noLlms && (changedPages.size || manifestChanged)) {
    const r = spawnSync(process.execPath, [path.join(repo, "scripts/llms-txt.mjs")], { cwd: repo, encoding: "utf8" });
    report.llms = r.status === 0 ? "regenerated" : `FAILED: ${(r.stderr || r.stdout).trim().slice(0, 300)}`;
  }
  report.changed = report.writes.length > 0;
  return report;
}

function listingUpdates(P, writeIfChanged) {
  if (!fs.existsSync(P(OUT.capabilities))) return 0;
  const caps = JSON.parse(fs.readFileSync(P(OUT.capabilities), "utf8")).capabilities ?? [];
  const live = caps.filter((c) => c.lifecycle === "LIVE").map((c) => c.id).sort();
  const prev = fs.existsSync(P(OUT.listings)) ? JSON.parse(fs.readFileSync(P(OUT.listings), "utf8")) : null;
  const baseline = new Set(prev?.doors_baseline ?? live);
  const pending = prev?.pending ?? { "402index": [], harness_x: [] };
  for (const c of caps) {
    if (c.lifecycle !== "LIVE" || baseline.has(c.id)) continue;
    const door = c.path ?? c.probe?.request ?? null;
    if (String(c.payment).includes("x402") && door) {
      pending["402index"].push({
        id: c.id, url: `${SITE}${door}`, name: c.name, protocol: "x402", http_method: c.method ?? c.probe?.method ?? "GET",
        description: c.description, provider: "Council of AI", category: "verification",
        endpoint: "POST https://402index.io/api/v1/register (authless, 10/h/IP) - submitted by the post-deploy step, never by the bus",
      });
    }
    pending.harness_x.push({ id: c.id, kind: c.kind, name: c.name, door, payment: c.payment, note: "add a row to council-os/distribution.json (harness-x lane) and re-render" });
    baseline.add(c.id);
  }
  const doc = {
    schema: "csoai.pubbus-listing-updates/0.1",
    rule: "A door is NEW when a LIVE capability in council-os/capabilities.json is absent from doors_baseline. The first run records the baseline and marks nothing pending, because nothing is new relative to it. The bus never calls a registry; the post-deploy step submits pending rows after the door answers live, then empties pending.",
    doors_baseline: [...baseline].sort(),
    pending,
  };
  writeIfChanged(OUT.listings, stable(doc));
  return pending["402index"].length + pending.harness_x.length;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const arg = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const rep = await run({ dryRun: argv.includes("--dry-run"), index: arg("--index"), noLlms: argv.includes("--no-llms") });
  console.log(JSON.stringify(rep, null, 2));
  process.exit(rep.fatal ? 2 : 0);
}
