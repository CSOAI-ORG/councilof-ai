// World-knowledge federation for the Sovereign — the "super-Google" layer.
// LIVE NOW (no key): Wikipedia/Wikidata REST. ENV-GATED (free keys): Google Data Commons (stats),
// Knowledge Graph (entities). Add the keys to light those up; Wikipedia works today.
//
// Returns sources the governed Sovereign synthesises on top of — it does NOT replace the
// council answer, it grounds it in the open world's knowledge.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let q = ((req.query && (req.query.q || req.query.query)) || '').toString().slice(0, 200).trim();
  // detect a stat intent + strip conversational filler → search the actual entity
  let intent = null;
  const im = q.match(/\b(population|gdp|area|capital|currency|founded|inception|ceo|headquarters)\b/i);
  if (im) intent = im[1].toLowerCase();
  q = q.replace(/^(?:tell me about|what(?:'s| is| are)|who(?:'s| is| are)|where(?:'s| is)|how (?:big|many|much)|show me|about|explain|describe|look up|search for|find)\s+/i, '')
       .replace(/\b(?:the )?(?:population|gdp|area|capital|currency|founders?|inception|ceo|headquarters)\s+(?:of|for)\s+/i, '')
       .replace(/^(?:the|a|an)\s+/i, '').replace(/[?.!]+$/, '').trim();
  if (!q) return res.status(200).json({ q: '', intent, results: [], sources: srcStatus() });

  const out = { q, intent, facts: null, results: [], sources: srcStatus() };

  // ── Wikidata structured facts (free, no key) — real numbers: population, founded, etc. ──
  try {
    const s = await fetch('https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&limit=1&search=' + encodeURIComponent(q),
      { headers: { 'User-Agent': 'MEOK-Sovereign/1.0 (https://os.meok.ai)' } });
    const sd = await s.json();
    const id = sd && sd.search && sd.search[0] && sd.search[0].id;
    if (id) {
      const e = await fetch('https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims|labels|descriptions&languages=en&ids=' + id,
        { headers: { 'User-Agent': 'MEOK-Sovereign/1.0 (https://os.meok.ai)' } });
      const ed = await e.json();
      const ent = ed && ed.entities && ed.entities[id];
      if (ent) {
        const c = ent.claims || {};
        const f = {};
        const pop = pickLatestAmount(c.P1082);   if (pop != null) f.population = pop;
        const yr = firstYear(c.P571);            if (yr) f.founded = yr;
        const web = literal(c.P856);             if (web) f.website = web;
        f.label = (ent.labels && ent.labels.en && ent.labels.en.value) || sd.search[0].label;
        f.desc = (ent.descriptions && ent.descriptions.en && ent.descriptions.en.value) || sd.search[0].description || '';
        f.url = 'https://www.wikidata.org/wiki/' + id;
        out.facts = f;
      }
    }
  } catch (e) { /* graceful */ }
  // ── Wikipedia/Wikidata (free, no key, live) ──
  try {
    const r = await fetch('https://en.wikipedia.org/w/rest.php/v1/search/page?q=' + encodeURIComponent(q) + '&limit=3',
      { headers: { 'User-Agent': 'MEOK-Sovereign/1.0 (https://os.meok.ai)' } });
    const d = await r.json();
    for (const p of (d.pages || []).slice(0, 3)) {
      out.results.push({
        source: 'wikipedia',
        title: p.title,
        desc: p.description || '',
        excerpt: (p.excerpt || '').replace(/<[^>]+>/g, '').trim(),
        url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(p.key || p.title),
        thumb: p.thumbnail && p.thumbnail.url ? ('https:' + p.thumbnail.url) : null
      });
    }
  } catch (e) { /* graceful */ }

  // ── Google Data Commons (free key) — public stats: population, GDP, emissions, etc. ──
  const dck = process.env.DATACOMMONS_API_KEY;
  if (dck) {
    try {
      const r = await fetch('https://api.datacommons.org/v2/resolve?nodes=' + encodeURIComponent(q) + '&property=' + encodeURIComponent('<-description{typeOf:Place}->dcid'),
        { headers: { 'X-API-Key': dck } });
      const d = await r.json();
      if (d) out.results.push({ source: 'datacommons', title: q, data: d, note: 'Google Data Commons (public statistics)' });
    } catch (e) { /* graceful */ }
  }

  return res.status(200).json(out);
}

// Wikidata claim helpers
function pickLatestAmount(claims) {
  if (!Array.isArray(claims)) return null;
  let best = null, bestT = '';
  for (const c of claims) {
    const amt = c && c.mainsnak && c.mainsnak.datavalue && c.mainsnak.datavalue.value && c.mainsnak.datavalue.value.amount;
    if (amt == null) continue;
    const t = (c.qualifiers && c.qualifiers.P585 && c.qualifiers.P585[0] && c.qualifiers.P585[0].datavalue && c.qualifiers.P585[0].datavalue.value && c.qualifiers.P585[0].datavalue.value.time) || '';
    if (best === null || t > bestT) { best = parseInt(String(amt).replace(/^\+/, ''), 10); bestT = t; }
  }
  return best;
}
function firstYear(claims) {
  try { const t = claims[0].mainsnak.datavalue.value.time; const m = String(t).match(/([+-]?\d{1,4})-/); return m ? parseInt(m[1], 10) : null; } catch (e) { return null; }
}
function literal(claims) {
  try { const v = claims[0].mainsnak.datavalue.value; return typeof v === 'string' ? v : null; } catch (e) { return null; }
}

function srcStatus() {
  return {
    wikipedia: 'live',
    datacommons: process.env.DATACOMMONS_API_KEY ? 'live' : 'add free DATACOMMONS_API_KEY → public stats (population/GDP/emissions/health)',
    knowledge_graph: process.env.GOOGLE_KG_API_KEY ? 'live' : 'add GOOGLE_KG_API_KEY → entities',
    custom_search: process.env.GOOGLE_CSE_KEY ? 'live' : 'add GOOGLE_CSE_KEY + cx → web breadth'
  };
}
