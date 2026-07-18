// Radiation → dome overlay. Safecast is the open community radiation network, but its API is CORS-locked
// to its own origin, so we proxy it here (CORS *). Honest: community data — coverage & recency vary by area.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=1200');
  const q = req.query || {};
  const lat = parseFloat(q.lat), lon = parseFloat(q.lon), dist = Math.min(50000, parseInt(q.dist, 10) || 15000);
  if (isNaN(lat) || isNaN(lon)) return res.status(200).json({ ok: false, error: 'lat,lon required', points: [] });
  try {
    const url = `https://api.safecast.org/measurements.json?latitude=${lat}&longitude=${lon}&distance=${dist}&limit=200`;
    const d = await (await fetch(url, { headers: { 'User-Agent': 'DEFONEOS/1.0' }, signal: AbortSignal.timeout(12000) })).json();
    const points = (Array.isArray(d) ? d : []).filter(m => m.latitude && m.longitude && m.value != null)
      .map(m => ({ lat: +m.latitude, lon: +m.longitude, value: +m.value, unit: m.unit || 'cpm', at: m.captured_at || '' }))
      .slice(0, 200);
    res.status(200).json({ ok: points.length > 0, count: points.length, points, source: 'Safecast · open radiation network', note: 'Community radiation data — coverage & recency vary by area.' });
  } catch (e) { res.status(200).json({ ok: false, error: String(e), points: [] }); }
}
