// DEFONEOS — weather/forecast layer. Server-side proxy to Windy Point Forecast API (GFS).
// Returns current governed conditions (temp, wind, humidity, pressure) for any lat/lon.
// Key in env (WINDY_PF_KEY), out of git.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  const lat = parseFloat(req.query && req.query.lat), lon = parseFloat(req.query && req.query.lon);
  if (isNaN(lat) || isNaN(lon)) return res.status(200).json({ ok: false, error: 'lat/lon required' });
  const key = process.env.WINDY_PF_KEY;
  if (!key) return res.status(200).json({ ok: false, error: 'forecast key not configured' });
  try {
    const r = await fetch('https://api.windy.com/api/point-forecast/v2', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon, model: 'gfs', parameters: ['temp', 'wind', 'rh', 'pressure'], levels: ['surface'], key })
    });
    const d = await r.json();
    if (!d['temp-surface']) return res.status(200).json({ ok: false, error: d.message || 'no data' });
    const i = 0;
    const tempC = Math.round((d['temp-surface'][i] - 273.15) * 10) / 10;
    const wu = (d['wind_u-surface'] || [0])[i], wv = (d['wind_v-surface'] || [0])[i];
    const windMs = Math.sqrt(wu * wu + wv * wv);
    const windDir = Math.round((Math.atan2(-wu, -wv) * 180 / Math.PI + 360) % 360);
    const rh = d['rh-surface'] ? Math.round(d['rh-surface'][i]) : null;
    const pres = d['pressure-surface'] ? Math.round(d['pressure-surface'][i] / 100) : null;
    return res.status(200).json({
      ok: true, lat, lon, tempC, windMs: Math.round(windMs * 10) / 10, windKmh: Math.round(windMs * 3.6),
      windDir, humidity: rh, pressureHpa: pres, model: 'GFS · Windy Point Forecast',
      governance: 'Governed under DEFONEOS Layer-0 · SIGIL-loggable', ts: new Date().toISOString()
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e) });
  }
}
