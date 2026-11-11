#!/usr/bin/env node
/** Render the retained daily-signal snapshots into a public, unsigned report archive.
 * This producer reads local public snapshots only. It does not fetch sources,
 * execute checks, infer legal applicability, sign records or assign financial value.
 * Run: node scripts/build-daily-product.mjs [--check]
 */
import { createHash } from 'node:crypto';
import { maintenanceView } from './daily-maintenance-metadata.mjs';
import { serviceHandoff, renderServiceHandoff } from './report-service-handoff.mjs';
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PREFIX = '/reports/daily-signal/';
const SCHEMA = 'csoai.daily-signal/0.1';
const HASH = /^[a-f0-9]{64}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BYTES = 2 * 1024 * 1024;
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const integer = v => Number.isSafeInteger(v) && v >= 0;
const require = (ok, why) => { if (!ok) throw new Error(why); };
const ordered = v => Array.isArray(v) ? v.map(ordered) : object(v) ? Object.fromEntries(Object.keys(v).sort().map(k => [k, ordered(v[k])])) : v;
const encode = v => JSON.stringify(ordered(v), null, 2) + '\n';
export const escapeHtml = v => String(v ?? 'Not recorded').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const md = v => escapeHtml(v).replace(/[\\`*_[\]{}|]/g, '\\$&').replace(/\r?\n/g, ' ');

function day(value, label) {
  require(typeof value === 'string' && DATE.test(value), label + ': expected YYYY-MM-DD');
  const stamp = Date.parse(value + 'T00:00:00Z');
  require(Number.isFinite(stamp) && new Date(stamp).toISOString().slice(0, 10) === value, label + ': invalid calendar date');
  return stamp;
}

// JSON.parse supplies syntax validation; the second walk rejects duplicate object
// keys, including escaped spellings. It does not evaluate source text as code.
export function strictJson(text) {
  const parsed = JSON.parse(text);
  let i = 0;
  const ws = () => { while (/\s/.test(text[i] ?? '') && i < text.length) i++; };
  const string = () => {
    const start = i++;
    while (i < text.length) { if (text[i] === '\\') i += 2; else if (text[i++] === '"') break; }
    return JSON.parse(text.slice(start, i));
  };
  const value = () => {
    ws();
    if (text[i] === '"') { string(); return; }
    if (text[i] === '{') {
      i++; ws(); const seen = new Set();
      if (text[i] === '}') { i++; return; }
      while (true) {
        ws(); const key = string();
        require(!seen.has(key), 'duplicate JSON key: ' + key); seen.add(key);
        ws(); i++; value(); ws();
        if (text[i++] === '}') return;
      }
    }
    if (text[i] === '[') {
      i++; ws(); if (text[i] === ']') { i++; return; }
      while (true) { value(); ws(); if (text[i++] === ']') return; }
    }
    while (i < text.length && !/[\s,}\]]/.test(text[i])) i++;
  };
  value(); return parsed;
}

export function validateReport(report, filename) {
  require(object(report) && report.schema === SCHEMA, filename + ': unsupported report schema');
  const base = day(report.as_of, filename + ' as_of');
  require(filename === report.as_of + '.json', filename + ': filename/date mismatch');
  require(integer(report.horizon_days) && report.horizon_days <= 3660, filename + ': invalid horizon');
  for (const field of ['signals','unmapped','invalid_events','excluded_events','orphaned_mapping_event_ids','limitations']) require(Array.isArray(report[field]), filename + ': missing array ' + field);
  require(object(report.headline) && object(report.generated_from) && object(report.corrections), filename + ': missing report metadata');
  const ids = new Set(), positions = new Set();
  for (const [kind, rows] of [['signals', report.signals], ['excluded_events', report.excluded_events], ['invalid_events', report.invalid_events]]) {
    for (const row of rows) {
      require(object(row) && integer(row.source_index), filename + ': invalid source index');
      require(!positions.has(row.source_index), filename + ': duplicate source index'); positions.add(row.source_index);
      if (kind !== 'invalid_events' || row.event_sha256 !== undefined) {
        require(HASH.test(row.event_sha256 ?? ''), filename + ': invalid event digest');
        require(!ids.has(row.event_sha256), filename + ': duplicate event digest'); ids.add(row.event_sha256);
      }
      if (kind === 'signals') {
        const days = (day(row.date, filename + ' event date') - base) / 86400000;
        require(integer(row.days_until) && row.days_until === days && days <= report.horizon_days, filename + ': event outside stated window');
        require(object(row.mapping) && ['UNMAPPED','UNREVIEWED','STALE_OR_UNAVAILABLE','REVIEWED_DECLARATION'].includes(row.mapping.state), filename + ': invalid mapping state');
        require(typeof row.mapping.reason === 'string' && Array.isArray(row.mapped_provisions) && Array.isArray(row.gspc_axes), filename + ': missing mapping detail');
        require(row.source_status === 'CLOCK_ASSERTION_NOT_REVALIDATED' && row.evidence_coverage === null, filename + ': unsupported evidence claim');
        for (const key of ['instrument','jurisdiction','provision','requires','binds']) require(row[key] === null || typeof row[key] === 'string', filename + ': invalid ' + key);
        require(row.mapping.state !== 'REVIEWED_DECLARATION' || row.mapped_provisions.length > 0, filename + ': reviewed mapping without provisions');
      }
    }
  }
  const expected = {clock_events: positions.size, events_in_horizon: report.signals.length, mapped_events: report.signals.filter(s => s.mapping.state === 'REVIEWED_DECLARATION').length, invalid_events: report.invalid_events.length, excluded_events: report.excluded_events.length};
  expected.unmapped_events = expected.events_in_horizon - expected.mapped_events;
  for (const [key, count] of Object.entries(expected)) require(integer(report.headline[key]) && report.headline[key] === count, filename + ': count mismatch ' + key);
  require([...positions].every(n => n < expected.clock_events), filename + ': source index gap');
  const unmapped = report.signals.filter(s => s.mapping.state !== 'REVIEWED_DECLARATION').map(s => s.event_sha256).sort();
  require(report.unmapped.every(s => object(s) && HASH.test(s.event_sha256 ?? '')) && JSON.stringify(report.unmapped.map(s => s.event_sha256).sort()) === JSON.stringify(unmapped), filename + ': unmapped index mismatch');
  for (const role of ['clock','board','crosswalk','mappings','claims']) {
    const source = report.generated_from[role];
    require(object(source) && ['READ','ABSENT'].includes(source.state), filename + ': invalid source ' + role);
    require(source.path === null || (typeof source.path === 'string' && !source.path.startsWith('/') && !source.path.split(/[\\/]/).includes('..')), filename + ': invalid source path');
    require(source.state === 'READ' ? HASH.test(source.sha256 ?? '') && typeof source.path === 'string' : source.sha256 === null, filename + ': invalid source digest');
  }
  require(report.generated_from.clock.state === 'READ', filename + ': clock source absent');
  require(['PRESENT','ABSENT'].includes(report.corrections.register_state) && report.corrections.delta_state === 'NOT_COMPUTED', filename + ': invalid correction state');
  require(report.corrections.register_as_of === null || typeof report.corrections.register_as_of === 'string', filename + ': invalid correction source time');
  return report;
}

function boundedRead(path) {
  const st = lstatSync(path);
  require(st.isFile() && !st.isSymbolicLink() && st.size <= MAX_BYTES, 'Expected a regular report file within 2 MiB: ' + path);
  return readFileSync(path);
}

export function loadArchive(directory) {
  require(existsSync(directory) && lstatSync(directory).isDirectory() && !lstatSync(directory).isSymbolicLink(), 'Archive directory is unavailable or unsafe');
  const files = readdirSync(directory).filter(name => /^\d{4}-\d{2}-\d{2}\.json$/.test(name)).sort();
  require(files.length > 0, 'No dated daily-signal reports');
  const reports = files.map(filename => {
    const bytes = boundedRead(join(directory, filename));
    const report = validateReport(strictJson(bytes.toString('utf8')), filename);
    return {filename, report, sha256: digest(bytes)};
  });
  const latest = reports.at(-1);
  require(digest(boundedRead(join(directory, 'latest.json'))) === latest.sha256, 'latest.json differs from newest dated report');
  return reports;
}

export function compareReports(current, previous) {
  if (!previous) return {state:'PRIOR_REPORT_UNAVAILABLE', previous_report_id:null, added_event_ids:null, removed_event_ids:null, changed_event_ids:null, changed_source_roles:null, scope:'Retained daily report comparison; not new measurements or legal amendments.'};
  const before = new Map(previous.report.signals.map(s => [s.event_sha256, s]));
  const after = new Map(current.report.signals.map(s => [s.event_sha256, s]));
  // days_until changes with report day; exclude it from substantive row changes.
  const semantic = s => { const {days_until, ...rest} = s; return encode(rest); };
  const roles = [...new Set([...Object.keys(previous.report.generated_from), ...Object.keys(current.report.generated_from)])].sort();
  return {state:'COMPARED_RETAINED_REPORTS', previous_report_id:previous.sha256,
    added_event_ids:[...after.keys()].filter(id => !before.has(id)).sort(),
    removed_event_ids:[...before.keys()].filter(id => !after.has(id)).sort(),
    changed_event_ids:[...after.keys()].filter(id => before.has(id) && semantic(after.get(id)) !== semantic(before.get(id))).sort(),
    changed_source_roles:roles.filter(role => encode(current.report.generated_from[role] ?? null) !== encode(previous.report.generated_from[role] ?? null)),
    scope:'Changes in retained reports and source references. Window entry/exit is not a legal amendment; no new measurement is implied.'};
}

export function deriveFindings(entry) {
  const {report, sha256:reportId, filename} = entry;
  const findings = [];
  const add = (code, pointer, summary, action, eventId = null) => {
    const record = {code, source:{path:PREFIX + filename, report_sha256:reportId, json_pointer:pointer, event_sha256:eventId}, summary, qualification_action:action};
    findings.push({id:digest(encode(record)), ...record});
  };
  report.signals.forEach((row, i) => {
    if (row.mapping.state !== 'REVIEWED_DECLARATION') add('PROVISION_MAPPING_PENDING', '/signals/' + i + '/mapping', 'The deadline has no current reviewed provision mapping.', 'Review the exact event and versioned provision, then record a mapping bound to both source digests.', row.event_sha256);
  });
  if (report.signals.length) add('DEADLINE_SOURCES_NOT_REVALIDATED', '/signals', 'The report retains the regulatory clock assertions without revalidating their legal sources.', 'Confirm the official source version, applicability and date before relying on a deadline.');
  for (const [role, source] of Object.entries(report.generated_from)) if (source.state === 'ABSENT') add('SOURCE_ABSENT', '/generated_from/' + role, 'An input is absent: ' + role + '.', 'Supply the scoped source and preserve its revision, date and byte digest.');
  if (report.invalid_events.length) add('INVALID_CLOCK_RECORDS', '/invalid_events', 'Some clock records could not be placed in the date window.', 'Correct or explicitly retire the identified source records, preserving their history.');
  add('CLAIM_DELTA_NOT_COMPUTED', '/corrections', 'The retained claim register is a snapshot; a correction delta has not been computed.', 'Compare exact retained claim-register revisions and retain explicit supersession references.');
  return {schema:'csoai.daily-signal-findings/0.1', report_id:reportId, report_day:report.as_of, signed:false, scope:'Derived observations about this report; not findings of legal noncompliance.', findings};
}

function renderMarkdown(entry, comparison, findings, maintenance) {
  const r = entry.report;
  return [`# Council of AI — Daily evidence report`, '', `Report day: ${r.as_of}`, `Report SHA-256: ${entry.sha256}`, '',
    'This unsigned report organises retained source snapshots. It is not a fresh model measurement, legal assessment or financial valuation.', '',
    `Window: ${r.horizon_days} days. ${r.headline.events_in_horizon} deadline records; ${r.headline.mapped_events} reviewed mapping declarations; ${r.headline.unmapped_events} awaiting mapping.`, '',
    '## Deadline records', '', 'These dates and requirements are retained clock assertions and have not been revalidated by this report.', '',
    '| Date | Instrument | Provision | Mapping |', '|---|---|---|---|', ...r.signals.map(s => `| ${s.date} | ${md(s.instrument)} | ${md(s.provision)} | ${md(s.mapping.state)} |`), '',
    '## Comparison', '', comparison.state === 'PRIOR_REPORT_UNAVAILABLE' ? 'Prior report unavailable. No change or growth count is inferred.' : `Compared with report ${comparison.previous_report_id}: ${comparison.added_event_ids.length} entered the window, ${comparison.removed_event_ids.length} left, ${comparison.changed_event_ids.length} changed retained rows. ${comparison.changed_source_roles.length} source references changed. These counts are not new measurements or legal amendments.`, '',
    '## Findings and next actions', '', ...findings.findings.map(f => `- **${f.code}** — ${md(f.summary)} ${md(f.qualification_action)} Source: ${f.source.json_pointer}; finding ID ${f.id}.`), '',
    '## Maintenance metadata', '', maintenanceSummary(maintenance), '',
    '## Source provenance', '', ...Object.entries(r.generated_from).sort().map(([role, source]) => `- ${role}: ${md(source.state)}; path ${md(source.path)}; SHA-256 ${source.sha256 ?? 'not available'}.`),
    '', `Claim-register source timestamp: ${md(r.corrections.register_as_of)}. General per-source retrieval timestamps are not supplied. Selected declared dates, where present, are in maintenance metadata; report day is not a retrieval time.`, '',
    `[Source JSON](${PREFIX + entry.filename}) · [Archive](${PREFIX}) · [GPAI evidence matrix](/gpai) · [Claim maintenance](/claim-maintenance)`, ''].join('\n');
}

function renderHtml(entries, comparisons, findingPack, maintenance) {
  const latest = entries.at(-1), r = latest.report, comparison = comparisons.at(-1), h = escapeHtml;
  const title = 'Daily evidence reports | Council of AI';
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><meta name="description" content="Dated regulatory-clock reports, source provenance, mapping gaps and downloadable evidence indexes from Council of AI."><link rel="canonical" href="https://councilof.ai/reports/daily-signal/"><meta name="color-scheme" content="light"><style>
:root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#142b3c;background:#f3f6f8;line-height:1.6}*{box-sizing:border-box}body{margin:0}a{color:#075e89;text-underline-offset:3px}a:hover{color:#003d5d}a:focus-visible,summary:focus-visible{outline:3px solid #bd6c00;outline-offset:4px}.skip{position:absolute;left:1rem;top:-5rem;background:white;padding:.7rem;z-index:2}.skip:focus{top:1rem}.wrap{max-width:1160px;margin:auto;padding:0 24px}header{background:#102e42;color:white;border-bottom:4px solid #d5ae64}header .wrap{display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding-top:20px;padding-bottom:20px}.brand{font-weight:750;font-size:1.1rem;color:white;text-decoration:none}nav{display:flex;gap:20px;flex-wrap:wrap}nav a{color:#eef7ff}main{padding-top:42px!important;padding-bottom:48px!important}.eyebrow{font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;font-weight:750;color:#526c7c}h1{font-size:clamp(2rem,5vw,3.3rem);line-height:1.12;letter-spacing:-.035em;margin:12px 0 20px}h2{font-size:1.4rem;margin:0 0 14px}h3{font-size:1.05rem;margin:0 0 8px}.lead{max-width:780px;font-size:1.12rem;color:#3c5567}.badge{display:inline-block;padding:4px 10px;border-radius:20px;background:#e5edf3;font-size:.8rem;font-weight:700}.actions{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}.button{background:#0b5e86;color:white;text-decoration:none;border:1px solid #0b5e86;border-radius:6px;padding:10px 16px;font-weight:650}.button:hover{background:#074867;color:white}.button.secondary{background:white;color:#075e89}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:30px 0}.stat,section{background:white;border:1px solid #d8e1e7;border-radius:10px;padding:24px}.stat strong{font-size:2.1rem;display:block;line-height:1.2}.stat span{color:#496274}.stat small{display:block;color:#526879;margin-top:6px}section{margin-top:24px}.note{padding:14px 16px;background:#fff7e5;border-left:4px solid #b98b30;border-radius:3px;color:#4b3d25}.muted{color:#526879}.small{font-size:.875rem}code{font-size:.84rem;overflow-wrap:anywhere;white-space:normal}.maintenance-summary{overflow-wrap:anywhere}.table-wrap{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left;font-size:.94rem}caption{text-align:left;color:#526879;margin:0 0 14px}th,td{padding:13px 14px;border-bottom:1px solid #dfe6eb;vertical-align:top}th{font-size:.8rem;text-transform:uppercase;letter-spacing:.04em;background:#eef3f6}td:first-child{white-space:nowrap}.status{font-size:.78rem;font-weight:700;display:inline-block;background:#fff3d7;color:#6b4916;padding:3px 8px;border-radius:4px}.findings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.finding{padding:16px;border:1px solid #dfe6eb;border-radius:6px}.finding p{margin:6px 0}.finding code{font-size:.73rem}details{border-top:1px solid #dfe6eb;padding:14px 0}summary{cursor:pointer;font-weight:650}.grid-links{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.grid-links a{display:block;font-size:1.05rem;font-weight:700}.grid-links p{margin-bottom:0;color:#526879}footer{border-top:1px solid #d8e1e7;padding:22px 0;color:#526879}footer .wrap{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}@media(max-width:700px){.wrap{padding-left:16px;padding-right:16px}main{padding-top:28px!important}.stats,.findings,.grid-links{grid-template-columns:1fr}.stat{padding:16px}.stat strong{font-size:1.7rem}section{padding:18px}th,td{padding:11px 9px}header nav{gap:14px;font-size:.88rem}.actions .button{flex:1;text-align:center;min-width:145px}}
</style></head><body><a class="skip" href="#main">Skip to report</a><header><div class="wrap"><a class="brand" href="/">Council of AI</a><nav aria-label="Main navigation"><a href="/gpai">GPAI matrix</a><a href="/services">Evidence services</a><a href="/gspc-verify">Verify evidence</a></nav></div></header>
<main id="main" class="wrap"><div class="eyebrow">Evidence archive · ${h(r.as_of)}</div><h1>Daily evidence reports</h1><p class="lead">Follow deadline records, see where provision mappings need review, and retrieve the exact source snapshot behind each report.</p><span class="badge">Unsigned derived report</span><p class="muted small">Report day <time datetime="${r.as_of}">${r.as_of}</time> · ${r.horizon_days}-day window · ${entries.length} retained report${entries.length === 1 ? '' : 's'}</p>
<div class="actions"><a class="button" href="${PREFIX + r.as_of}.md" download>Download report</a><a class="button secondary" href="${PREFIX + latest.filename}">View source JSON</a><a class="button secondary" href="${PREFIX}findings.json">Findings JSON</a></div>
<div class="stats" aria-label="Report scope"><div class="stat"><strong>${r.headline.events_in_horizon}</strong><span>Deadline records in window</span><small>${r.headline.clock_events} records in the supplied clock</small></div><div class="stat"><strong>${r.headline.mapped_events}</strong><span>Reviewed mapping declarations</span><small>Mapping does not establish applicability</small></div><div class="stat"><strong>${r.headline.unmapped_events}</strong><span>Records awaiting mapping</span><small>Unknown evidence coverage remains visible</small></div></div>
<p class="note">These dates and requirements are retained clock assertions. Their official legal sources have not been revalidated by this report. A report refresh is not a new measurement or a legal assessment.</p>
<section aria-labelledby="deadlines"><h2 id="deadlines">Deadline records</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Deadline records; scroll horizontally on small screens"><table><caption>From the dated source JSON. Each row retains its event digest and source position.</caption><thead><tr><th scope="col">Date</th><th scope="col">Instrument and provision</th><th scope="col">Mapping</th><th scope="col">Evidence reference</th></tr></thead><tbody>${r.signals.map((s,i) => `<tr><td><time datetime="${s.date}">${s.date}</time><br><span class="muted small">${s.days_until} days from report</span></td><td><strong>${h(s.instrument)}</strong><br>${h(s.provision)}<br><span class="muted small">${h(s.jurisdiction)}</span></td><td><span class="status">${h(s.mapping.state.replaceAll('_',' '))}</span><br><span class="small">${h(s.mapping.reason)}</span></td><td><a href="${PREFIX + latest.filename}">Source record ${s.source_index}</a><br><code>/signals/${i}</code><details><summary>Event digest</summary><code>${s.event_sha256}</code></details></td></tr>`).join('') || '<tr><td colspan="4">No records fall inside this report’s stated window.</td></tr>'}</tbody></table></div></section>
<section aria-labelledby="changes"><h2 id="changes">Changes since the previous retained report</h2><p>${comparison.state === 'PRIOR_REPORT_UNAVAILABLE' ? 'A prior report is not available in this archive. No change or growth count has been inferred.' : `${comparison.added_event_ids.length} records entered the window, ${comparison.removed_event_ids.length} left, and ${comparison.changed_event_ids.length} retained rows changed. ${comparison.changed_source_roles.length} source references changed.`}</p><p class="muted small">Window changes are not necessarily regulatory amendments. Repeated reports and unchanged evidence are not counted as new measurements.</p></section>
<section aria-labelledby="findings"><h2 id="findings">Findings and next actions</h2><p class="muted">These findings describe evidence preparation and missing information. They are not findings of legal noncompliance.</p><div class="findings">${findingPack.findings.map(f=>`<article class="finding"><h3>${h(f.code.replaceAll('_',' '))}</h3><p>${h(f.summary)}</p><p><strong>Next action:</strong> ${h(f.qualification_action)}</p><p class="small muted">Source pointer: <code>${h(f.source.json_pointer)}</code></p><details><summary>Finding identity</summary><code>${f.id}</code></details></article>`).join('')}</div></section>
<section aria-labelledby="maintenance"><h2 id="maintenance">Maintenance metadata</h2><p class="maintenance-summary">${h(maintenanceSummary(maintenance))}</p><p class="muted small">Source metadata only. Exact source-byte changes are distinct from changes in selected metadata; unchanged metadata does not establish unchanged claims, current applicability or permission to act. Source rights remain unknown.</p></section>
<section aria-labelledby="provenance"><h2 id="provenance">Source provenance</h2><p>Report SHA-256: <code>${latest.sha256}</code></p><p class="muted small">The digest identifies the exact report bytes. It is not a signature or independent confirmation of the source claims.</p>${Object.entries(r.generated_from).sort().map(([role,s])=>`<details><summary>${h(role)} · ${h(s.state)}</summary><p>Source path: <code>${h(s.path)}</code></p><p>SHA-256: <code>${h(s.sha256)}</code></p></details>`).join('')}<p class="small muted">Claim-register source timestamp: ${h(r.corrections.register_as_of)}. General per-source retrieval timestamps are not supplied. Selected declared dates, where present, are in maintenance metadata; report day is not a retrieval time.</p></section>
<section aria-labelledby="archive"><h2 id="archive">Report archive</h2><div class="table-wrap" tabindex="0" role="region" aria-label="Report archive"><table><caption>Retained dated snapshots, with exact-byte identifiers.</caption><thead><tr><th scope="col">Report day</th><th scope="col">Files</th><th scope="col">SHA-256</th></tr></thead><tbody>${[...entries].reverse().map(e=>`<tr><td>${e.report.as_of}</td><td><a href="${PREFIX + e.filename}">JSON</a> · <a href="${PREFIX + e.report.as_of}.md">Markdown</a></td><td><code>${e.sha256}</code></td></tr>`).join('')}</tbody></table></div><p class="small"><a href="${PREFIX}index.json">Machine-readable archive</a> · <a href="${PREFIX}latest.json">Latest source JSON</a> · <a href="${PREFIX}latest.md">Latest Markdown</a></p></section>
${renderServiceHandoff(latest)}
<section aria-labelledby="next"><h2 id="next">Use the evidence</h2><div class="grid-links"><div><a href="/gpai">Explore the GPAI matrix</a><p>Review the evidence requirements and stated limits for model providers.</p></div><div><a href="/claim-maintenance">Maintain a claim</a><p>Follow evidence dependencies, changes and correction history.</p></div><div><a href="/services">Find an evidence service</a><p>Review available products, previews and delivery scope.</p></div></div></section></main><footer><div class="wrap"><span>Council of AI · Measurement and evidence</span><a href="/corrections">Corrections and review</a></div></footer></body></html>\n`;
}

function maintenanceSummary(view) {
  if (!view?.snapshot) return 'Maintenance metadata unavailable for this retained report. No new measurement or recheck outcome is inferred.';
  const c=view.comparison, board=view.snapshot.sources.board.metadata, claims=view.snapshot.sources.claims.metadata;
  return `State: ${c.state}. Selected semantic snapshot: ${view.snapshot.semantic_snapshot_id}. Card-corpus last measurement declared: ${board?.last_measurement_declared_at ?? 'unknown'} (not the governance board). Claim-register source timestamp declared: ${claims?.register_as_of_declared ?? 'unknown'}; last measurement not supplied by that register. ${c.byte_changed_roles === null ? 'No prior metadata comparison.' : `${c.byte_changed_roles.length} source-byte reference(s) changed; ${c.parsed_content_changed_roles.length} parsed-content reference(s) changed; ${c.semantic_changed_roles.length} selected metadata projection(s) changed.`} ${c.recheck_candidates.length} pending source-review candidate(s). Date consistency: board ${view.snapshot.sources.board.declared_date_check.state}, claims ${view.snapshot.sources.claims.declared_date_check.state}; measurement freshness NOT_ASSESSED. Rights UNKNOWN; no execution authority or model training.`;
}

export function buildProduct(directory) {
  const entries = loadArchive(directory);
  const comparisons = entries.map((e, i) => compareReports(e, entries[i - 1]));
  const maintenance = entries.map((e,i)=>maintenanceView(e.report,entries[i-1]?.report));
  const latest = entries.at(-1), findings = deriveFindings(latest);
  const files = new Map();
  for (let i = 0; i < entries.length; i++) files.set(entries[i].report.as_of + '.md', renderMarkdown(entries[i], comparisons[i], deriveFindings(entries[i]),maintenance[i]));
  files.set('latest.md', files.get(latest.report.as_of + '.md'));
  files.set('findings.json', encode(findings));
  const index = {schema:'csoai.daily-signal-index/0.1', latest_report_id:latest.sha256, latest_report_day:latest.report.as_of, signed:false,
    report_count:entries.length, measurement_count:null, valuation:null, scope:'Retained daily-signal snapshots; report count is not a measurement, framework or customer count.',
    maintenance_metadata:maintenance.at(-1),
    service_handoff:serviceHandoff(latest),
    reports:entries.map((e,i)=>({report_id:e.sha256, report_day:e.report.as_of, maintenance:maintenance[i].comparison, json_path:PREFIX+e.filename, markdown_path:PREFIX+e.report.as_of+'.md', counts:e.report.headline, comparison:comparisons[i]})).reverse()};
  files.set('index.json', encode(index));
  files.set('index.html', renderHtml(entries, comparisons, findings,maintenance.at(-1)));
  return {files, index};
}

export function main(argv = process.argv.slice(2), root = ROOT) {
  require(argv.length <= 1 && (!argv.length || argv[0] === '--check'), 'Usage: build-daily-product.mjs [--check]');
  const directory = join(root, 'public/reports/daily-signal'), {files,index} = buildProduct(directory);
  const check = argv.includes('--check');
  // Check every target before any write. No recursive cleanup or writes to source JSON.
  for (const name of files.keys()) {
    const target = join(directory,name);
    let st;
    try { st = lstatSync(target); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    require(!st || st.isFile() && !st.isSymbolicLink(), 'Unsafe output target: ' + name);
  }
  const stale = [...files].filter(([name, bytes]) => !existsSync(join(directory,name)) || readFileSync(join(directory,name),'utf8') !== bytes).map(([name])=>name);
  for (const name of files.keys()) {
    const target = join(directory,name);
    require(!existsSync(target + '.ots') || !stale.includes(name), 'Refusing to overwrite stamped output: ' + name);
  }
  if (check) require(stale.length === 0, 'Daily product differs: ' + stale.join(', '));
  else for (const [name,bytes] of files) if (stale.includes(name)) writeFileSync(join(directory,name),bytes,{flag:'w'});
  return {index, outputs:[...files.keys()], changed:stale};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const r = main(); console.log(`daily-product: ${r.index.report_count} retained report(s), ${r.outputs.length} outputs, latest ${r.index.latest_report_day}`); }
  catch (e) { console.error('daily-product: ' + e.message); process.exitCode = 1; }
}
