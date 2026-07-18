// DEFONEOS — knowledge/intel layer. Keyless federation of Wikipedia REST + Wikidata: pull a
// governed summary of ANY entity (company, place, person, org, law, event) with coordinates +
// thumbnail. This is the "Google-like intel" surface — but federated from open, citable sources
// and wrapped in the DEFONEOS governance layer (SIGIL-loggable, sovereign, no lock-in).
// Extend later: GLEIF (all legal entities), SEC EDGAR (filings), EUR-Lex (law), Google
// Knowledge Graph (key), Google Custom Search (key) — same proxy pattern.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  const q = (req.query && req.query.q || '').trim();
  if (!q) return res.status(200).json({ ok: false, error: 'no query' });
  try {
    const s = await (await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
      encodeURIComponent(q) + '&format=json&srlimit=1', { headers: { 'User-Agent': 'DEFONEOS/1.0 (intel)' } })).json();
    const hit = s.query && s.query.search && s.query.search[0];
    if (!hit) return res.status(200).json({ ok: false, error: 'no result', query: q });
    const sum = await (await fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' +
      encodeURIComponent(hit.title), { headers: { 'User-Agent': 'DEFONEOS/1.0 (intel)' } })).json();
    return res.status(200).json({
      ok: true, query: q,
      title: sum.title || hit.title,
      description: sum.description || '',
      extract: sum.extract || '',
      thumb: (sum.thumbnail && sum.thumbnail.source) || '',
      url: (sum.content_urls && sum.content_urls.desktop && sum.content_urls.desktop.page) || '',
      lat: (sum.coordinates && sum.coordinates.lat) != null ? sum.coordinates.lat : null,
      lon: (sum.coordinates && sum.coordinates.lon) != null ? sum.coordinates.lon : null,
      type: sum.type || '',
      source: 'Wikipedia + Wikidata · open, citable',
      governance: 'Federated under DEFONEOS Layer-0 · SIGIL-loggable · sovereign, no vendor lock-in',
      ts: new Date().toISOString()
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e), query: q });
  }
}
