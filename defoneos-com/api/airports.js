// Global airports — OurAirports open data (keyless). Major (large) airports by default → visible at world view.
let CACHE = null, CT = 0;
function parseCSVLine(line) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else { if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; }
  }
  out.push(cur); return out;
}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const all = !!(req.query && req.query.all);
  const key = all ? 'all' : 'large';
  if (CACHE && CACHE.key === key && Date.now() - CT < 21600000) return res.status(200).json(CACHE.data);
  try {
    const r = await fetch('https://davidmegginson.github.io/ourairports-data/airports.csv', { signal: AbortSignal.timeout(15000) });
    const txt = await r.text();
    const lines = txt.split('\n'); const airports = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const f = parseCSVLine(lines[i]); const type = f[2];
      if (type === 'large_airport' || (all && type === 'medium_airport')) {
        const lat = parseFloat(f[4]), lon = parseFloat(f[5]);
        if (isNaN(lat) || isNaN(lon)) continue;
        if (/^\[Duplicate\]/.test(f[3] || '')) continue;
        airports.push({ name: f[3], lat, lon, type: (type || '').replace('_', ' '), iata: f[13] || '', country: f[8] || '' });
      }
    }
    const data = { ok: airports.length > 0, count: airports.length, airports, source: 'OurAirports · open data' };
    CACHE = { key, data }; CT = Date.now();
    res.status(200).json(data);
  } catch (e) { res.status(200).json({ ok: false, error: String(e), airports: [] }); }
}
