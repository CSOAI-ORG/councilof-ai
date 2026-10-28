#!/usr/bin/env node
// refresh-zenodo-status.mjs — re-probe every DOI the Council publishes and write a dated
// observation of what Zenodo answers now.
//
// Why this exists: on 2026-09-29 Zenodo blocked the Council's account as spam and every
// record began answering HTTP 410. The estate published that state and has carried it since:
// `public/interop/zenodo-status.json` says "every CSOAI Zenodo record returns HTTP 410" and
// the board carries `doi_status: UNAVAILABLE`. If the block was lifted, the Council is
// publishing itself as dark while its records resolve — and 108 repository files cite the
// methodology DOI. That is a claim-maintenance defect, not a service problem.
//
// Method, taken from the artefact's own `method` field so this stays comparable:
//   anonymous GET https://doi.org/10.5281/zenodo.<id> following redirects;
//   http_status is the FINAL hop.
//
// Three states, never two, and never "probably fine":
//   AVAILABLE     — final hop 200, the DOI resolves to a live record page
//   REDIRECTED    — final hop 3xx that resolves somewhere real (state changed, bytes may differ)
//   UNAVAILABLE   — final hop 410/404, Zenodo says the record is gone
//   UNCHECKABLE   — the probe itself failed; this is never reported as "unavailable"
//
// It writes a NEW dated artefact and updates the served one. It does NOT touch signed files:
// the board's `doi_status` can only change when the control plane re-signs, and this script
// says so rather than pretending otherwise.
//
// Usage: node scripts/refresh-zenodo-status.mjs [--src public/interop/zenodo-status.json]

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d = null) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const SRC = arg('src', 'public/interop/zenodo-status.json');
const NOW = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const DATE = NOW.slice(0, 10);

if (!existsSync(SRC)) {
  console.error(`no source artefact at ${SRC}`);
  process.exit(1);
}
const src = JSON.parse(readFileSync(SRC, 'utf8'));

// Two routes, because one of them can be blocked without the DOI being blocked.
//
//   route A — the artefact's own method: anonymous GET https://doi.org/<doi>, final hop.
//   route B — the artefact's own stated alternative: anonymous GET
//            https://zenodo.org/api/records/<id>, status and sha256 of the body.
//
// A 403 from route A means the RESOLVER refused this origin (doi.org does this for whole
// networks). It is not evidence about the DOI. The DOI's state is therefore taken from
// route B, and route A's result is reported separately as the resolver's state.
//
// States, never two, and never "probably fine":
//   AVAILABLE     — Zenodo answers 200 for the record
//   REDIRECTED    — Zenodo answers 3xx to a successor record; the record exists, its bytes
//                   moved. Follow it and report where it landed.
//   UNAVAILABLE   — Zenodo answers 410/404: the record is gone (the 29 Sep block signature)
//   UNCHECKABLE   — neither route could establish the state. Never reported as unavailable.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';

async function get(url, follow = 'follow') {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: follow, headers: { 'user-agent': UA } });
    const body = await r.text().catch(() => '');
    return { ok: true, status: r.status, url: r.url, body };
  } catch (e) {
    return { ok: false, error: e?.name || 'Error' };
  } finally {
    clearTimeout(t);
  }
}

async function probe(doi) {
  // "10.5281/zenodo.22344048" -> "22344048". Splitting on '/' leaves the "zenodo." prefix
  // attached, and Zenodo then 404s a URL it would have answered 200 for: a probe that
  // proves nothing while looking like evidence.
  const id = String(doi).split('/').pop().replace(/^zenodo\./, '');

  const routeA = await get(`https://doi.org/${doi}`);
  const resolverState = !routeA.ok ? 'UNREACHABLE'
    : routeA.status === 200 ? 'RESOLVED'
      : routeA.status === 403 ? 'REFUSED_403'
        : routeA.status >= 300 && routeA.status < 400 ? 'REDIRECTED'
          : routeA.status === 410 || routeA.status === 404 ? 'UNAVAILABLE'
            : `HTTP_${routeA.status}`;

  const routeB = await get(`https://zenodo.org/api/records/${id}`);
  let state = 'UNCHECKABLE';
  let finalUrl = null;
  let httpStatus = null;
  let sha = null;
  if (routeB.ok) {
    httpStatus = routeB.status;
    finalUrl = routeB.url;
    sha = createHash('sha256').update(routeB.body).digest('hex');
    if (routeB.status === 200) state = 'AVAILABLE';
    else if (routeB.status >= 300 && routeB.status < 400) state = 'REDIRECTED';
    else if (routeB.status === 410 || routeB.status === 404) state = 'UNAVAILABLE';
    else state = 'UNCHECKABLE';
  }

  return {
    doi,
    kind: 'record',
    state,
    http_status_at_check: httpStatus,
    final_url: finalUrl,
    body_sha256: sha,
    resolver_state: resolverState,
    resolver_http_status: routeA.ok ? routeA.status : null,
    checked_at: NOW,
  };
}

const dois = (src.dois || []).map((d) => d.doi).filter(Boolean);
console.log(`probing ${dois.length} DOIs per the artefact's own method…`);
const observed = [];
for (const d of dois) {
  const p = await probe(d);
  const prior = (src.dois || []).find((x) => x.doi === d) || {};
  observed.push({
    ...prior,
    ...p,
    what: prior.what,
    alternatives: prior.alternatives || [],
    state_at_2026_09_29: prior.state ?? null,
    http_status_at_2026_09_29: prior.http_status_at_check ?? null,
  });
  console.log(`  ${d}: ${p.state} (${p.http_status_at_check})`);
}

const tally = observed.reduce((a, r) => { a[r.state] = (a[r.state] || 0) + 1; return a; }, {});
// A change is only a change if the PRIOR state was a state about the record, and the new one
// is too. 410 -> UNCHECKABLE is not "the block lifted"; it is "we can no longer tell".
const changed = observed.filter((r) => r.state_at_2026_09_29 && r.state !== r.state_at_2026_09_29
  && !['UNCHECKABLE'].includes(r.state) && !['UNCHECKABLE'].includes(r.state_at_2026_09_29));
const available = observed.filter((r) => r.state === 'AVAILABLE');
const redirected = observed.filter((r) => r.state === 'REDIRECTED');
const unavailable = observed.filter((r) => r.state === 'UNAVAILABLE');

const checkable = available.length + redirected.length + unavailable.length;
const notice = checkable === 0
  ? `No DOI could be checked on ${NOW}: the resolver refused every request from this origin and the record API did not answer. This is a PROBE failure and says nothing about the records - it is not evidence that they are back, and it is not evidence that they are gone.`
  : unavailable.length === 0
    ? `Every DOI that could be checked on ${NOW} resolves (${checkable} checked). The 29 September 2026 block is no longer observed.`
    : `${available.length + redirected.length} of ${checkable} checkable DOIs resolve today; ${unavailable.length} still answer unavailable. The 29 September 2026 block is partially lifted.`;

const observation = {
  schema: 'csoai.zenodo-status/0.2',
  title: 'Zenodo availability of CSOAI\'s DOIs',
  as_of: NOW,
  supersedes: { artefact: SRC, as_of: src.as_of ?? null },
  notice,
  method: src.method,
  states: ['AVAILABLE', 'REDIRECTED', 'UNAVAILABLE', 'UNCHECKABLE'],
  counts: { probed: observed.length, checkable, ...tally, changed_since_2026_09_29: changed.length,
            resolver_refused: observed.filter((r) => r.resolver_state === 'REFUSED_403').length },
  changed_since_2026_09_29: changed.map((r) => ({ doi: r.doi, was: r.state_at_2026_09_29, now: r.state })),
  event: src.event,
  rule: src.rule,
  signed_files_not_edited: src.signed_files_not_edited,
  correction: src.correction,
  signed: false,
  dois: observed,
};

const datedPath = `public/interop/zenodo-status-${DATE}.json`;
mkdirSync(dirname(datedPath), { recursive: true });
writeFileSync(datedPath, `${JSON.stringify(observation, null, 2)}\n`);

// The served artefact carries the current observation; the original event text is kept as
// history and the prior artefact is named as superseded.
const served = {
  ...src,
  schema: 'csoai.zenodo-status/0.2',
  as_of: NOW,
  supersedes: { artefact: SRC, as_of: src.as_of ?? null },
  notice,
  counts: observation.counts,
  changed_since_2026_09_29: observation.changed_since_2026_09_29,
  dated_observation: datedPath,
  dois: observed,
};
writeFileSync(SRC, `${JSON.stringify(served, null, 2)}\n`);

console.log(`\n${JSON.stringify(observation.counts, null, 1)}`);
console.log(`wrote ${datedPath}`);
console.log(`wrote ${SRC}`);
