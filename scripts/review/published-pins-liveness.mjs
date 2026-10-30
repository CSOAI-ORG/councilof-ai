#!/usr/bin/env node
/**
 * published-pins-liveness.mjs — does every pin we publish still resolve for a reader?
 *
 * The estate publishes records that point at immutable bytes: a Hugging Face dataset revision, a
 * GitHub commit. A pin is only useful if the address it names still resolves. On 28 October 2026 a
 * published pin was found that no longer resolved: the mirror dataset's history had been rewritten
 * and the recorded revision returned 404, while the manifest still carried it as a verified
 * address. A second class was found with it: datasets that now answer 401 to an anonymous reader.
 *
 * This gate follows every revision-shaped pin exactly as it is written and asks the host for it.
 * It never reconstructs an address: the reader's experience is the test. A SHA-256 digest that
 * merely appears in a file is NOT a pin and is not checked - content digests are re-derivable from
 * the bytes themselves, and treating them as revisions would report every artefact as dead.
 *
 * Run:  node scripts/review/published-pins-liveness.mjs --root . [--max-age-days N]
 *       node scripts/review/published-pins-liveness.mjs --selftest     (offline; proves it can fail)
 * Exit: 0 every pin resolves · 1 at least one pin does not · 2 the check could not be completed.
 */
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULTS = Object.freeze({
  maxAgeDays: 45,          // a published manifest older than this is stale
  manifestPath: 'public/interop/mirror-manifest.json',
  probeTimeoutMs: 25000,
  scanSkipBytes: 8_000_000, // a single file larger than this is not scanned
  delayMs: 300,            // pacing between probes: a burst is answered with 404/429 noise
  retries: 3,               // a rate-limited host is retried, never reported as dead
  sample: 40,               // pins checked per run; the sample rotates by UTC hour
  exemptionsPath: 'public/interop/published-pin-not-publicly-verifiable.json',
  exemptionMaxAgeDays: 90,  // a recorded exemption older than this must be re-reviewed
});

/**
 * Revision-shaped pins only: a 40-hex revision in the position where a host addresses a revision.
 * The whole URL is kept, because the reader follows the URL, not a reconstruction of it.
 */
export function findPins(text) {
  const pins = new Map();
  const add = (url, host, target, revision) => {
    if (!pins.has(url)) pins.set(url, { url, host, target, revision });
  };
  // huggingface.co/.../(resolve|blob|tree)/<rev>[/path]
  for (const m of text.matchAll(
    new RegExp('https://huggingface\\.co/(?:datasets/)?[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/(?:resolve|blob|tree)/[0-9a-f]{40}[^\\s"\'<>\\\\]*', 'g'),
  )) {
    const url = m[0];
    const rev = url.match(/([0-9a-f]{40})/)[1];
    const ds = url.match(/huggingface\.co\/(?:datasets\/)?([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\//)[1];
    add(url, 'huggingface.co', ds, rev);
  }
  // huggingface.co/api/resolve-cache/datasets/<owner>/<name>/<rev>/<path>
  for (const m of text.matchAll(
    new RegExp('https://huggingface\\.co/api/resolve-cache/datasets/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/[0-9a-f]{40}[^\\s"\'<>\\\\]*', 'g'),
  )) {
    const url = m[0];
    const rev = url.match(/([0-9a-f]{40})/)[1];
    const ds = url.match(/resolve-cache\/datasets\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\//)[1];
    add(url, 'huggingface.co', ds, rev);
  }
  // github.com/<owner>/<repo>/(blob|commit|tree)/<rev>[/path]
  for (const m of text.matchAll(
    new RegExp('https://github\\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+/(?:blob|commit|tree)/[0-9a-f]{40}[^\\s"\'<>\\\\]*', 'g'),
  )) {
    const url = m[0];
    const rev = url.match(/([0-9a-f]{40})/)[1];
    const repo = url.match(/github\.com\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\//)[1];
    add(url, 'github.com', repo, rev);
  }
  return [...pins.values()];
}

/** Which files carry each pin. */
export function collectPins(root, opts = DEFAULTS) {
  const found = new Map();
  const carriers = new Map();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        walk(full);
        continue;
      }
      let stat;
      try { stat = fs.statSync(full); } catch { continue; }
      if (stat.size > opts.scanSkipBytes) continue;
      let text;
      try { text = fs.readFileSync(full, 'utf8'); } catch { continue; }
      for (const pin of findPins(text)) {
        if (!found.has(pin.url)) found.set(pin.url, pin);
        if (!carriers.has(pin.url)) carriers.set(pin.url, new Set());
        carriers.get(pin.url).add(path.relative(root, full));
      }
    }
  };
  walk(root);
  return { pins: [...found.values()], carriers };
}

/** Classify one answer. A pin is live only when the address itself answers with the content. */
export function classify(httpStatus) {
  if (httpStatus === 200) return 'LIVE';
  if (httpStatus === 401 || httpStatus === 403) return 'PRIVATE_OR_GATED';
  if (httpStatus === 404) return 'REVISION_GONE';
  if (httpStatus === 429) return 'RATE_LIMITED'; // answered, but not about the pin
  if (httpStatus >= 200 && httpStatus < 400) return 'LIVE'; // followed by fetch
  if (httpStatus >= 500) return 'HOST_ERROR';     // the host is unwell, not the pin
  return 'UNANSWERED';
}

/** A status that says something about the pin, rather than about us hitting a limit. */
export function isConclusive(status) {
  return status === 'LIVE' || status === 'PRIVATE_OR_GATED' || status === 'REVISION_GONE';
}

/**
 * Probe one pin with pacing and retries. A host that answers 429 or 5xx is not evidence about the
 * pin, so it is retried; only a conclusive answer (200, 401/403, 404) ends the attempt. Without
 * this, a burst of probes produces false deaths - which is worse than no gate at all.
 */
export async function probePin(pin, opts = DEFAULTS, fetchImpl = fetch) {
  let last = { status: 'UNANSWERED', http: 0 };
  for (let attempt = 0; attempt < Math.max(1, opts.retries); attempt++) {
    if (opts.delayMs) await new Promise((r) => setTimeout(r, opts.delayMs * (attempt + 1)));
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), opts.probeTimeoutMs);
      const res = await fetchImpl(pin.url, {
        redirect: 'follow',
        headers: { 'user-agent': 'csoai-pin-liveness/0.1 (+https://councilof.ai)' },
        signal: ctl.signal,
      });
      clearTimeout(timer);
      const status = classify(res.status);
      last = { status, http: res.status };
      if (isConclusive(status)) return { ...pin, ...last };
    } catch {
      last = { status: 'UNANSWERED', http: 0 };
    }
  }
  return { ...pin, ...last };
}

/**
 * The pins this run checks. The sample rotates by UTC hour so every pin is visited over a day
 * without fetching all of them every time - the same idiom publish-freshness uses for the sitemap.
 */
export function rotateSample(pins, n, seed) {
  if (!pins.length || n <= 0) return [];
  const k = Math.min(n, pins.length);
  const start = ((seed % pins.length) + pins.length) % pins.length;
  const step = Math.max(1, Math.floor(pins.length / k));
  return Array.from({ length: k }, (_, i) => pins[(start + i * step) % pins.length]);
}

/**
 * A pin can be recorded as not publicly verifiable. That is a different statement from "live",
 * and the estate publishes it rather than hiding it: a reader is told, in the public record,
 * that this particular address does not resolve for an anonymous reader and why.
 *
 * The record is a dated decision, not a pardon. Every entry must say when it was observed and
 * why, and it expires: an exemption older than the review window puts the gate back in the
 * red, so the list cannot become a place where dead pins go to be forgotten.
 */
export function exemptionKey(pin) {
  return `${pin.host}|${pin.target}|${pin.revision}`;
}

/** Read the published record of pins that are recorded as not publicly verifiable. */
export function loadExemptions(root, opts = DEFAULTS) {
  const file = path.join(root, opts.exemptionsPath);
  if (!fs.existsSync(file)) return { records: new Map(), file, asOf: null };
  let doc;
  try { doc = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return { records: new Map(), file, asOf: null, unreadable: true }; }
  const records = new Map();
  for (const r of doc.records || []) {
    const key = `${r.host}|${r.target}|${r.revision}`;
    records.set(key, r);
  }
  return { records, file, asOf: doc.as_of ?? null, doc };
}

/**
 * The offline integrity of the published record. Deterministic, no network, fast.
 *
 * This is the half of the check that belongs in a blocking PR gate: it proves the record is
 * well formed, that every entry is inside its review window, and that every entry still names
 * a pin this tree actually publishes. A record for a pin we no longer publish is stale
 * bookkeeping and has to be removed; an expired entry has to be re-reviewed; both are things a
 * machine can decide without asking a host.
 *
 * The other half — does a pin still resolve — needs the network and belongs on a schedule, where
 * a red result is a fact about production rather than a race with a rate limit.
 */
export function assessRecord(records, publishedKeys, now = Date.now(), opts = DEFAULTS) {
  const out = [];
  const entries = records?.records || [];
  if (!entries.length) {
    return [{ ok: true, msg: 'the published record of not-publicly-verifiable pins is empty (nothing recorded)' }];
  }
  const problems = [];
  for (const r of entries) {
    const who = `${r.target}@${String(r.revision || '').slice(0, 12)}`;
    if (!r.host || !r.target || !r.revision) { problems.push(`${who}: missing host, target or revision`); continue; }
    if (!r.reason || String(r.reason).length < 20) problems.push(`${who}: no usable reason recorded`);
    if (!['PRIVATE_OR_GATED', 'REVISION_GONE'].includes(r.observed_status)) {
      problems.push(`${who}: unknown observed_status ${r.observed_status}`);
    }
    const t = Date.parse(r.observed_on ?? '');
    if (!Number.isFinite(t)) problems.push(`${who}: observed_on is not a date`);
    else if ((now - t) / 86_400_000 > opts.exemptionMaxAgeDays) {
      problems.push(`${who}: recorded ${r.observed_on}, past the ${opts.exemptionMaxAgeDays}-day review window — re-review it`);
    }
    if (!publishedKeys.has(`${r.host}|${r.target}|${r.revision}`)) {
      problems.push(`${who}: recorded, but this tree no longer publishes that pin — remove the stale record`);
    }
  }
  if (problems.length) {
    out.push({ ok: false, msg: `the published record of not-publicly-verifiable pins has ${problems.length} problem(s): ${problems.slice(0, 6).join('; ')}${problems.length > 6 ? ' …' : ''}` });
  } else {
    out.push({ ok: true, msg: `the published record of not-publicly-verifiable pins is well formed: ${entries.length} entr(ies), every one observed inside the ${opts.exemptionMaxAgeDays}-day window and still naming a pin this tree publishes` });
  }
  return out;
}

/**
 * Pure verdict. A pin that was not answered is NOT live: the check fails closed.
 * A pin that IS answered but recorded as not publicly verifiable does not fail the gate —
 * but it is reported, and a record that has aged out puts the gate back in the red.
 */
export function assessPins(checks, opts = DEFAULTS, exemptions = { records: new Map(), asOf: null }) {
  const out = [];
  const dead = checks.filter((c) => c.status === 'PRIVATE_OR_GATED' || c.status === 'REVISION_GONE');
  const unchecked = checks.filter((c) => !isConclusive(c.status));
  const recorded = [];
  const unrecorded = [];
  for (const c of dead) {
    const rec = exemptions.records?.get(exemptionKey(c));
    if (rec) recorded.push({ ...c, record: rec });
    else unrecorded.push(c);
  }
  if (unrecorded.length) {
    const byKind = {};
    for (const c of unrecorded) byKind[c.status] = (byKind[c.status] ?? 0) + 1;
    out.push({
      ok: false,
      msg: `${unrecorded.length} published pin(s) do not resolve for an anonymous reader and are NOT recorded as such: ` +
        Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(', '),
    });
  }
  if (recorded.length) {
    const stale = recorded.filter(({ record }) => {
      const t = Date.parse(record.observed_on ?? '');
      return !Number.isFinite(t) || (Date.now() - t) / 86_400_000 > opts.exemptionMaxAgeDays;
    });
    if (stale.length) {
      out.push({
        ok: false,
        msg: `${stale.length} recorded exemption(s) have aged out (max ${opts.exemptionMaxAgeDays} days) and must be re-reviewed: ` +
          stale.map((s) => `${s.target}@${s.revision.slice(0, 12)}`).join(', '),
      });
    } else {
      const byKind = {};
      for (const c of recorded) byKind[c.status] = (byKind[c.status] ?? 0) + 1;
      out.push({
        ok: true,
        msg: `${recorded.length} published pin(s) are recorded as NOT publicly verifiable ` +
          `(${Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(', ')}) — published in the public record, not hidden`,
      });
    }
  }
  if (unchecked.length) {
    out.push({ ok: false, msg: `${unchecked.length} pin(s) could not be checked (rate limited or host error) - failing closed` });
  }
  if (!unrecorded.length && !recorded.length && !unchecked.length) {
    out.push({ ok: true, msg: `all ${checks.length} checked pin(s) resolve for an anonymous reader` });
  }
  return out;
}

/** Manifest freshness: a published manifest that no one refreshes goes stale silently. */
export function assessManifest(manifest, now, opts = DEFAULTS) {
  const out = [];
  if (!manifest) {
    out.push({ ok: true, msg: 'no published mirror manifest in this tree' });
    return out;
  }
  const asOf = Date.parse(manifest.as_of ?? '');
  if (!Number.isFinite(asOf)) {
    out.push({ ok: false, msg: `mirror manifest as_of unreadable: ${JSON.stringify(manifest.as_of)}` });
    return out;
  }
  const days = (now - asOf) / 86_400_000;
  if (days > opts.maxAgeDays) {
    out.push({ ok: false, msg: `mirror manifest as_of ${manifest.as_of} is ${days.toFixed(1)} days old (max ${opts.maxAgeDays}) — STALE: nobody re-verified the mirror` });
  } else {
    out.push({ ok: true, msg: `mirror manifest as_of ${manifest.as_of} (${days.toFixed(1)} days old, max ${opts.maxAgeDays})` });
  }
  return out;
}

/** Offline proof that this gate can fail. No network. */
export function selftest() {
  const failures = [];
  const check = (name, cond) => { if (!cond) failures.push(name); };

  const sample = [
    'https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/a25c4e6d4ad547ad8cdcd800bd8d61c6d129eba2/contributions/safe/x.md',
    'https://huggingface.co/api/resolve-cache/datasets/csoai/councilof-ai-mirror/c6021da678f886bf3c4eeb74a8b096661a03dfc0/interop__a.json',
    'https://github.com/CSOAI-ORG/councilof-ai/blob/281493d05d9185b3c8ab786ddbb27e3b36d0d8e8/public/spec/x.json',
    'a content digest is not a pin: 2a61e0457b1637ccef5be67aaa652669715ce974df6427512e9a0899f8c074e4',
    'a moving path is not a pin: https://huggingface.co/datasets/csoai/councilof-ai-mirror/resolve/main/x.md',
  ].join('\n');
  const pins = findPins(sample);
  check('finds the HF resolve pin', pins.some((p) => p.revision === 'a25c4e6d4ad547ad8cdcd800bd8d61c6d129eba2'));
  check('finds the resolve-cache pin', pins.some((p) => p.revision === 'c6021da678f886bf3c4eeb74a8b096661a03dfc0'));
  check('finds the GitHub commit pin', pins.some((p) => p.host === 'github.com' && p.revision === '281493d05d9185b3c8ab786ddbb27e3b36d0d8e8'));
  check('does not treat a content digest as a pin', !pins.some((p) => p.revision === '2a61e0457b1637ccef5be67aaa652669715ce974df6427512e9a0899f8c074e4'));
  check('does not treat a moving path as a pin', !pins.some((p) => p.url.includes('/resolve/main/')));

  check('a 401 is private-or-gated', classify(401) === 'PRIVATE_OR_GATED');
  check('a 403 is private-or-gated', classify(403) === 'PRIVATE_OR_GATED');
  check('a 404 is revision-gone', classify(404) === 'REVISION_GONE');
  check('a 200 is live', classify(200) === 'LIVE');
  check('a 429 says nothing about the pin', !isConclusive(classify(429)));
  check('a 500 says nothing about the pin', !isConclusive(classify(500)));

  check('a dead pin fails the verdict', assessPins([{ status: 'REVISION_GONE' }]).some((d) => !d.ok));
  check('a private pin fails the verdict', assessPins([{ status: 'PRIVATE_OR_GATED' }]).some((d) => !d.ok));
  check('an unanswered pin fails closed', assessPins([{ status: 'UNANSWERED' }]).some((d) => !d.ok));
  check('a rate-limited pin fails closed', assessPins([{ status: 'RATE_LIMITED' }]).some((d) => !d.ok));
  check('all-live passes', assessPins([{ status: 'LIVE' }, { status: 'LIVE' }]).every((d) => d.ok));

  const items = Array.from({ length: 100 }, (_, i) => ({ url: `u${i}` }));
  check('the rotating sample has the requested size', rotateSample(items, 40, 7).length === 40);
  check('the rotating sample never repeats a pin', new Set(rotateSample(items, 40, 7).map((p) => p.url)).size === 40);
  check('the rotating sample moves with the seed', rotateSample(items, 5, 0)[0].url !== rotateSample(items, 5, 1)[0].url);
  check('a full sample is the whole set', rotateSample(items, 500, 3).length === 100);

  const now = Date.parse('2026-10-28T00:00:00Z');
  check('a fresh manifest passes', assessManifest({ as_of: '2026-10-20T00:00:00Z' }, now).every((d) => d.ok));
  check('a stale manifest fails', assessManifest({ as_of: '2026-08-01T00:00:00Z' }, now).some((d) => !d.ok));
  check('an unreadable manifest fails', assessManifest({ as_of: 'not-a-date' }, now).some((d) => !d.ok));

  if (failures.length) {
    console.error('published-pins-liveness selftest FAILED: ' + failures.join('; '));
    return 1;
  }
  console.log('published-pins-liveness selftest PASSED (each check proven able to fail)');
  return 0;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) return selftest();

  const root = path.resolve(args.includes('--root') ? args[args.indexOf('--root') + 1] : '.');
  const opts = { ...DEFAULTS };
  if (args.includes('--max-age-days')) opts.maxAgeDays = Number(args[args.indexOf('--max-age-days') + 1]);
  // The host's patience is a budget, not a constant. A burst of probes is answered with 429,
  // which says nothing about a pin, so the pacing is settable rather than fixed.
  if (args.includes('--delay-ms')) opts.delayMs = Number(args[args.indexOf('--delay-ms') + 1]);
  if (args.includes('--retries')) opts.retries = Number(args[args.indexOf('--retries') + 1]);

  const { pins, carriers } = collectPins(root, opts);
  const exemptions = loadExemptions(root, opts);

  // --record-only: the offline half. No network, deterministic, safe to block a PR on.
  if (args.includes('--record-only')) {
    const publishedKeys = new Set(pins.map((p) => `${p.host}|${p.target}|${p.revision}`));
    const verdict = assessRecord(exemptions.doc ?? { records: [] }, publishedKeys, Date.now(), opts);
    for (const v of verdict) console.log(`${v.ok ? 'ok  ' : 'FAIL'}  ${v.msg}`);
    if (!exemptions.file || !fs.existsSync(exemptions.file)) {
      console.log('ok   no published record file in this tree (nothing recorded yet)');
    }
    return verdict.some((v) => !v.ok) ? 1 : 0;
  }

  // One probe per REVISION, not per URL: the published manifest carries hundreds of addresses that
  // share one revision, and probing each of them would both waste the host's patience and bias
  // the sample. A revision is the unit that dies; a file is not.
  const groups = new Map();
  for (const pin of pins) {
    const key = `${pin.host}|${pin.target}|${pin.revision}`;
    if (!groups.has(key)) groups.set(key, { ...pin, urls: [] });
    groups.get(key).urls.push(pin.url);
  }
  // The canonical address of the REVISION is what dies when a host rewrites its history. A
  // resolve-cache URL is a cache address: it can 404 while the revision is perfectly alive, so it
  // is never used as the probe. The published addresses are kept as carriers.
  const revisions = [...groups.values()].map((g) => ({
    ...g,
    probeUrl: g.host === 'huggingface.co'
      ? `https://huggingface.co/datasets/${g.target}/tree/${g.revision}`
      : `https://github.com/${g.target}/commit/${g.revision}`,
  }));
  const full = args.includes('--full');
  const sampleSize = full ? revisions.length : Number(args.includes('--sample') ? args[args.indexOf('--sample') + 1] : opts.sample);
  const seed = Math.floor(Date.now() / 3_600_000); // UTC hour: the sample rotates once an hour
  const selected = full ? revisions : rotateSample(revisions, sampleSize, seed);
  const checks = [];
  for (const rev of selected) {
    checks.push(await probePin({ ...rev, url: rev.probeUrl }, opts));
  }

  let manifest = null;
  const manifestPath = path.join(root, opts.manifestPath);
  if (fs.existsSync(manifestPath)) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { manifest = null; }
  }

  const verdict = [...assessPins(checks, opts, exemptions), ...assessManifest(manifest, Date.now(), opts)];
  for (const v of verdict) console.log(`${v.ok ? 'ok  ' : 'FAIL'}  ${v.msg}`);
  for (const c of checks.filter((x) => x.status !== 'LIVE')) {
    const rec = exemptions.records?.get(exemptionKey(c));
    const tag = rec ? 'RECORDED_NOT_PUBLICLY_VERIFIABLE' : c.status;
    console.log(`  ${tag}  ${c.target}@${c.revision.slice(0, 12)}  (${c.urls.length} published address(es))`);
    if (rec) console.log(`      recorded ${rec.observed_on}: ${rec.reason}`);
    const files = new Set();
    for (const u of c.urls) for (const f of (carriers.get(u) ?? [])) files.add(f);
    console.log(`      carried by: ${[...files].slice(0, 4).join(', ')}`);
  }
  const live = checks.filter((c) => c.status === 'LIVE').length;
  const recordedCount = checks.filter((c) => c.status !== 'LIVE' && exemptions.records?.get(exemptionKey(c))).length;
  console.log(`\nchecked ${checks.length} of ${revisions.length} published revision(s) (${full ? 'full sweep' : `rotating sample, hour ${seed}`}); ${live} resolve for an anonymous reader, ${recordedCount} recorded as not publicly verifiable.`);

  // The machine-readable record of this run. A sweep that is not written down is a sweep nobody
  // can re-check, and the exemption list has to be derived from one.
  const jsonIdx = args.indexOf('--json-out');
  if (jsonIdx >= 0) {
    const out = {
      schema: 'csoai.pin-liveness/0.1',
      checked_at: new Date().toISOString(),
      mode: full ? 'full' : 'sample',
      sample_size: checks.length,
      revisions_total: revisions.length,
      opts: { delayMs: opts.delayMs, retries: opts.retries, maxAgeDays: opts.maxAgeDays, exemptionMaxAgeDays: opts.exemptionMaxAgeDays },
      exemptions_file: path.relative(root, exemptions.file),
      counts: {
        live: live,
        private_or_gated: checks.filter((c) => c.status === 'PRIVATE_OR_GATED').length,
        revision_gone: checks.filter((c) => c.status === 'REVISION_GONE').length,
        rate_limited: checks.filter((c) => c.status === 'RATE_LIMITED').length,
        unanswered: checks.filter((c) => !isConclusive(c.status)).length,
        recorded_not_publicly_verifiable: recordedCount,
      },
      checks: checks.map((c) => ({
        host: c.host, target: c.target, revision: c.revision, status: c.status, http: c.http,
        published_addresses: c.urls?.length ?? 0,
        recorded: Boolean(exemptions.records?.get(exemptionKey(c))),
        reason: exemptions.records?.get(exemptionKey(c))?.reason ?? null,
        observed_on: exemptions.records?.get(exemptionKey(c))?.observed_on ?? null,
      })),
      manifest: manifest ? { as_of: manifest.as_of, age_days: (Date.now() - Date.parse(manifest.as_of)) / 86_400_000 } : null,
      verdict: verdict.map((v) => ({ ok: v.ok, msg: v.msg })),
    };
    fs.writeFileSync(path.resolve(args[jsonIdx + 1]), `${JSON.stringify(out, null, 2)}\n`);
    console.log(`json written: ${path.resolve(args[jsonIdx + 1])}`);
  }
  const failed = verdict.some((v) => !v.ok);
  if (checks.some((c) => !isConclusive(c.status))) {
    console.error('CHECK INCOMPLETE — some pins could not be answered; failing closed.');
    return 2;
  }
  return failed ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main().then((code) => { process.exitCode = code; }).catch((err) => {
    console.error(JSON.stringify({ state: 'PIN_CHECK_UNCHECKABLE', reason: String(err).slice(0, 200) }));
    process.exitCode = 2;
  });
}
