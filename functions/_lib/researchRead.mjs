/** Read-only retrieval of an explicit, source-pinned PUBLIC publication set.
 * No arbitrary URLs, private records, inference, grading, payment or authority.
 */
const STOP = new Set('a an and are as at be been by can could did do does for from get give how i in is it latest me of on or please recent research show studies study tell that the their there these this to was we what when where which with would find evidence published about'.split(' '));
const tokens = value => [...new Set((String(value).toLowerCase().replace(/\bmemory[\s_-]+venturi\b/g, 'measured reuse cache').match(/[a-z0-9]+/g) || []).filter(t => t.length > 2 && !STOP.has(t)))];
const HEX = /^[0-9a-f]{64}$/;
const COMMIT = /^[0-9a-f]{40}$/;
const REPO = 'https://github.com/CSOAI-ORG/councilof-ai';
const SCOPE = 'Selected exact excerpts from retained public research notes, not an exhaustive or live search. Reading them creates no new measurement, approval, adoption or execution authority.';
export function isResearchQuery(text) {
  const t = String(text || '').toLowerCase();
  return /\b(research|white[- ]?papers?|experiments?)\b/.test(t) || /\bmemory[- _]venturi\b/.test(t) || /\beat\b.*\b(evidence|sources?|findings|changes|status)\b/.test(t);
}
function validIndex(index) {
  if (!index || index.schema !== 'csoai.public-research-search/1' || !COMMIT.test(index.source_revision || '') || !Array.isArray(index.records) || !index.records.length || index.records.length > 100) return false;
  const ids = new Set();
  return index.records.every(row => {
    if (!row || typeof row.path !== 'string' || !/^(harness|packages)\/[a-zA-Z0-9_./-]+\.md$/.test(row.path) || row.path.split('/').includes('..') || ids.has(row.path)) return false;
    ids.add(row.path);
    return typeof row.title === 'string' && row.title.length > 0 && row.title.length <= 200 && typeof row.text === 'string' && row.text.length <= 50000 && HEX.test(row.source_sha256 || '') && HEX.test(row.text_sha256 || '') && row.url === `${REPO}/blob/${index.source_revision}/${row.path}`;
  });
}
function excerpt(text, queryTerms) {
  let section = '';
  const paragraphs = text.split(/\n\s*\n/).map((s, order) => {
    s = s.trim(); if (s.startsWith('#')) section = s;
    return {s, order, section};
  }).filter(p => p.s && !p.s.startsWith('#') && !p.s.startsWith('```') && !p.s.startsWith('|') && (!/\b[a-f0-9]{40,64}\b/.test(p.s) || queryTerms.some(t => ['hash','sha256','commit'].includes(t))));
  for (const p of paragraphs) { const found = new Set(tokens(p.s)); p.score = queryTerms.filter(t => found.has(t)).length + (queryTerms.some(t => ['reuse','cache','performance','speed','latency'].includes(t)) && /^At [\d,]+ records,/i.test(p.s) ? 4 : 0); }
  paragraphs.sort((a,b) => b.score - a.score || a.order - b.order);
  const value = (paragraphs[0]?.s || text).replace(/\s+/g, ' ');
  return value.length > 700 ? value.slice(0, 700) + '…' : value;
}
export async function researchRead(index, args = {}) {
  const base = {source: `${REPO}/tree/${index?.source_revision || 'master'}`, source_revision: index?.source_revision || null, signature_verification: 'NOT_RUN', model_called: false, new_measurement: false, grants_authority: false, note: SCOPE};
  if (!validIndex(index)) return {...base, state:'UNCHECKABLE', results:[], reason:'PUBLICATION_INDEX_INVALID'};
  for (const row of index.records) {
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(row.text)))].map(b => b.toString(16).padStart(2,'0')).join('');
    if (hash !== row.text_sha256) return {...base, state:'UNCHECKABLE', results:[], reason:'PUBLICATION_BYTES_CHANGED'};
  }
  if (!args || typeof args !== 'object' || Array.isArray(args)) return {...base, state:'INVALID_QUERY', results:[], reason:'SUPPLY_ONE_BOUNDED_QUERY'};
  if (typeof args.query !== 'string' || !args.query.trim() || args.query.length > 1000 || Object.keys(args).some(k => k !== 'query')) return {...base, state:'INVALID_QUERY', results:[], reason:'SUPPLY_ONE_BOUNDED_QUERY'};
  const q = tokens(args.query);
  if (!q.length) return {...base, state:'NEEDS_TOPIC', results:[], reason:'NAME_A_RESEARCH_TOPIC', note:'Name a topic such as measured reuse, source revisions or research-cycle retrieval. ' + SCOPE};
  const ranked = index.records.map((row, order) => {
    const title = new Set(tokens(row.title + ' ' + row.path));
    const body = new Set(tokens(row.text));
    const matched = q.filter(t => title.has(t) || body.has(t));
    return {row, order, score: matched.length + q.filter(t => title.has(t)).length * 2};
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score || a.order - b.order).slice(0,3);
  const results = ranked.map(({row}) => ({title:row.title, url:row.url, source_path:row.path, source_sha256:row.source_sha256, projection_sha256:row.text_sha256, source_revision:index.source_revision, excerpt:excerpt(row.text,q)}));
  return {...base, state: results.length ? 'RETAINED_PUBLIC_RESEARCH' : 'NO_RETAINED_MATCH', searched_publications:index.records.length, results};
}
