// Free openly-licensed media — Creative Commons via Openverse (800M+ images/audio).
// LIVE NOW anonymously (rate-limited). Higher limits when OPENVERSE_TOKEN is set
// (register a CC/Openverse app → client_id+secret → exchange for a bearer token).
// Always returns license + attribution so the user can credit correctly (CC requires it).

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = ((req.query && (req.query.q || req.query.query)) || '').toString().slice(0, 120).trim();
  const type = (req.query && req.query.type) === 'audio' ? 'audio' : 'images';
  const n = Math.min(parseInt((req.query && req.query.n) || '8', 10) || 8, 20);
  if (!q) return res.status(200).json({ q: '', type, results: [], source: 'openverse', auth: srcAuth() });

  const headers = { 'User-Agent': 'MEOK-Sovereign/1.0 (https://os.meok.ai)' };
  const tok = process.env.OPENVERSE_TOKEN;
  if (tok) headers['Authorization'] = 'Bearer ' + tok;   // higher rate limits when configured

  try {
    const r = await fetch(`https://api.openverse.org/v1/${type}/?q=${encodeURIComponent(q)}&page_size=${n}&mature=false`, { headers });
    const d = await r.json();
    const results = (d.results || []).map(x => ({
      title: x.title || 'Untitled',
      creator: x.creator || '',
      thumbnail: x.thumbnail || x.url || null,
      url: x.url || null,                       // direct media
      page: x.foreign_landing_url || null,      // source page
      license: ((x.license || '') + ' ' + (x.license_version || '')).trim().toUpperCase(),
      license_url: x.license_url || null,
      attribution: x.attribution || `"${x.title || 'Untitled'}"${x.creator ? ' by ' + x.creator : ''} — ${(x.license || '').toUpperCase()}`,
      provider: x.provider || ''
    }));
    return res.status(200).json({ q, type, count: d.result_count || results.length, results, source: 'openverse', auth: srcAuth() });
  } catch (e) {
    return res.status(200).json({ q, type, results: [], source: 'openverse', error: String(e), auth: srcAuth() });
  }
}
function srcAuth() { return process.env.OPENVERSE_TOKEN ? 'keyed (higher limits)' : 'anonymous (works; add OPENVERSE_TOKEN for higher limits)'; }
