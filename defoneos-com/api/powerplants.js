// Global power plants — WRI Global Power Plant Database (open data, keyless). Major plants (>=300 MW) → world-view.
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
  const min = Math.max(50, parseInt((req.query && req.query.min) || 300));
  if (CACHE && CACHE.min === min && Date.now() - CT < 21600000) return res.status(200).json(CACHE.data);
  try {
    const r = await fetch('https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.csv', { signal: AbortSignal.timeout(15000) });
    const txt = await r.text();
    const lines = txt.split('\n'); const plants = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i]) continue;
      const f = parseCSVLine(lines[i]);
      const mw = parseFloat(f[4]), lat = parseFloat(f[5]), lon = parseFloat(f[6]);
      if (isNaN(lat) || isNaN(lon) || isNaN(mw) || mw < min) continue;
      plants.push({ name: f[2], mw: Math.round(mw), lat, lon, fuel: f[7] || '', country: f[1] || '' });
    }
    const data = { ok: plants.length > 0, count: plants.length, plants, source: 'WRI Global Power Plant Database · open data' };
    CACHE = { min, data }; CT = Date.now();
    res.status(200).json(data);
  } catch (e) { res.status(200).json({ ok: false, error: String(e), plants: [] }); }
}
