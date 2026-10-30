#!/usr/bin/env node
// mcp_registry_census.mjs — enumerate the official MCP registry and emit a source record for
// the estate's N-site onboard lane.
//
// Why this exists: the nsite-onboard lane died on 2026-09-29 because build_queue.py could
// extract 138 distinct candidate surfaces from the owner's five source records and ALL 138
// were already in the Layer O registry. The queue came out empty, the loop stopped itself,
// and a 10-minute puller kept copying the stale log for 28 days.
//
// The fix is not to re-run the builder; it is to give it NEW source material. The official MCP
// registry is enumerable by cursor pagination, so its publisher hosts are a live, regenerable
// surface universe.
//
// IMPORTANT — what this is and is not. The registry's publisher hosts are dominated by hosting
// platforms that give each tenant a subdomain of a brand domain (.bowmark 1,116 servers,
// .linkbreakers 534, .sallim 457, …). Across 11,261 hosts there are only ~492 distinct last
// labels, almost all brand words. Onboarding one measures the PLATFORM, not any tenant of it.
// So this is a POPULATION census, published as a number — it is not a queue source. The lane's
// real sources are the Layer O registry and the sovereign-eater universe.
//
// Output:
//   evidence/sites-census/mcp_registry_census.json         — the census
//   evidence/sites-census/MCP-REGISTRY-SURFACES-<date>.md   — the source record
//
// Usage: node tools/sites/mcp_registry_census.mjs [--out-dir evidence/sites-census]

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const arg = (k, d = null) => {
  const i = argv.indexOf(`--${k}`);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : d;
};
const OUT_DIR = arg('out-dir', 'evidence/sites-census');
const BASE = 'https://registry.modelcontextprotocol.io/v0.1/servers';
const NOW = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const DATE = NOW.slice(0, 10);
const PAGE_CAP = 400;   // a bounded read, not the whole registry

const HOST_LEVEL = new Set([
  'europa.eu', 'google.com', 'microsoft.com', 'amazon.com', 'apple.com', 'coinbase.com',
  'cloudflare.com', 'nist.gov', 'oecd.org', 'github.com', 'gitlab.com', 'atlassian.com',
  'hub.docker.com', 'vercel.app', 'netlify.app', 'hf.space', 'workers.dev',
]);
const OWN = new Set([
  'councilof.ai', 'csoai.org', 'proofof.ai', 'openmoe.ai', 'asisecurity.ai', 'agisafe.ai',
  'safetyof.ai', 'meok.ai', 'defoneos.com', 'sovos.ai', 'emiliaprotocol.ai',
]);
// Domain-parking second-levels: real registrable domains under the public suffix list, but
// shared-hosting catch-alls where one owner hosts many unrelated tenants.
const PARKING = new Set([
  'br.com', 'au.com', 'us.com', 'uk.com', 'eu.com', 'de.com', 'gb.com', 'cn.com', 'in.com',
  'ru.com', 'za.com', 'it.com', 'fr.com', 'es.com', 'nl.com', 'se.com', 'jp.com', 'kr.com',
  'ca.com', 'mx.com', 'ar.com', 'co.com', 'me.com', 'tv.com', 'cc.com', 'ws.com', 'to.com',
  'asia.com', 'mobi', 'name', 'pro', 'biz.com', 'org.com', 'net.com', 'info.com',
]);

function registrable(host) {
  const h = String(host || '').toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
  if (!h || !h.includes('.')) return null;
  if (HOST_LEVEL.has(h)) return h;
  if (OWN.has(h)) return null;
  const parts = h.split('.');
  if (parts.length <= 2) return h;
  const two = parts.slice(-2).join('.');
  const isMulti = /^(co|org|gov|ac|com|net|edu)\.(uk|au|nz|jp|cn|br|in|za|kr|sg|ie|mx|tr|il|pl|ro)$/.test(two);
  if (isMulti) {
    const three = parts.slice(-3).join('.');
    if (PARKING.has(three)) return null;
    return three;
  }
  if (PARKING.has(two)) return null;
  return two;
}

async function fetchPage(cursor) {
  const url = cursor ? `${BASE}?limit=100&cursor=${encodeURIComponent(cursor)}` : `${BASE}?limit=100`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 25000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!r.ok) return { ok: false, status: r.status };
    const j = await r.json();
    return { ok: true, servers: j.servers || [], next: j.metadata?.nextCursor ?? null };
  } catch (e) {
    return { ok: false, error: e?.name || 'Error' };
  } finally {
    clearTimeout(t);
  }
}

const hosts = new Map();
const domains = new Map();
let rows = 0, cursor = null, pages = 0;
const seenCursor = new Set();

while (pages < PAGE_CAP) {
  const page = await fetchPage(cursor);
  pages += 1;
  if (!page.ok) { console.error(`stopped at page ${pages}: ${page.status || page.error}`); break; }
  for (const row of page.servers || []) {
    const s = row.server || row;
    const url = s.url || s.remoteUrl || '';
    let host = null;
    try { host = url ? new URL(url).host : null; } catch { host = null; }
    if (!host && s.name) {
      const m = String(s.name).match(/^([a-z0-9.-]+\.[a-z]{2,})\//i);
      if (m) host = m[1];
    }
    if (!host) continue;
    rows += 1;
    hosts.set(host, (hosts.get(host) || 0) + 1);
    const dom = registrable(host);
    if (!dom) continue;
    if (!domains.has(dom)) domains.set(dom, { servers: 0, hosts: new Set() });
    const d = domains.get(dom);
    d.servers += 1;
    d.hosts.add(host);
  }
  if (!page.next) break;
  if (seenCursor.has(page.next)) break;
  seenCursor.add(page.next);
  cursor = page.next;
}

const top = [...domains.entries()]
  .map(([domain, d]) => ({ domain, servers: d.servers, hosts: [...d.hosts].slice(0, 6) }))
  .sort((a, b) => b.servers - a.servers || a.domain.localeCompare(b.domain));

const census = {
  kind: 'csoai.mcp-registry-census/0.1',
  as_of: NOW,
  source: BASE,
  bounded: `capped at ${PAGE_CAP} pages of 100 rows by design — a bounded read, not the whole registry`,
  note:
    'A census of what the official MCP registry publishes today. Distinct hosts are candidate ' +
    'SURFACES for CSOAI presence — a surface is a place a listing could exist, not a place it does.',
  rows_read: rows,
  pages_read: pages,
  distinct_hosts: hosts.size,
  distinct_domains: domains.size,
  distinct_last_labels: new Set([...hosts.keys()].map((h) => h.split('.').pop())).size,
  top_domains: top.slice(0, 500),
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'mcp_registry_census.json'), `${JSON.stringify(census, null, 2)}\n`);

const md = [];
md.push(`# MCP registry surfaces — publisher hosts (${DATE})`);
md.push('');
md.push('Source record for the N-site onboard lane. Enumerated from the official MCP registry');
md.push(`at ${BASE} by cursor pagination on ${NOW}, bounded at ${PAGE_CAP} pages.`);
md.push('');
md.push('Discipline: a surface is a place a CSOAI listing COULD exist. Presence is measured later by');
md.push('the onboarder with live reads; nothing here asserts CSOAI is listed anywhere.');
md.push('');
md.push('Caveat that matters: these publisher hosts are dominated by hosting platforms that give');
md.push('each tenant a subdomain of a brand domain, so one host is a PLATFORM, not a tenant.');
md.push('');
md.push('| surface | server rows |');
md.push('|---|---|');
for (const d of top) for (const h of d.hosts) md.push(`| ${h} | ${d.servers} |`);
md.push('');

const mdName = `MCP-REGISTRY-SURFACES-${DATE}.md`;
writeFileSync(join(OUT_DIR, mdName), `${md.join('\n')}\n`);

console.log(JSON.stringify({
  rows_read: rows, pages_read: pages, distinct_hosts: hosts.size,
  distinct_domains: domains.size, distinct_last_labels: census.distinct_last_labels,
  source_record: mdName,
}, null, 2));
