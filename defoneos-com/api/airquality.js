// DEFONEOS — air quality → dome overlay. World Air Quality Index (WAQI) map/bounds: live AQI
// stations GLOBALLY (replaces the EU-only Sensor.Community source). View-centered via lat/lon.
// Token in env (WAQI_TOKEN), out of git. Governed under Layer-0.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=900');
  const key = process.env.WAQI_TOKEN;
  if (!key) return res.status(200).json({ ok: false, error: 'WAQI token not configured', stations: [] });
  const lat = parseFloat(req.query && req.query.lat), lon = parseFloat(req.query && req.query.lon);
  let bounds;
  if (!isNaN(lat) && !isNaN(lon)) bounds = (lat - 12) + ',' + (lon - 16) + ',' + (lat + 12) + ',' + (lon + 16);
  else bounds = '-55,-170,72,175'; // world
  try {
    const d = await (await fetch('https://api.waqi.info/map/bounds/?latlng=' + bounds + '&token=' + key)).json();
    if (d.status !== 'ok') return res.status(200).json({ ok: false, error: (d.data || 'waqi error'), stations: [] });
    const stations = (d.data || []).map(s => ({ lat: s.lat, lon: s.lon, aqi: parseInt(s.aqi, 10), name: (s.station && s.station.name) || '' }))
      .filter(s => !isNaN(s.aqi) && s.lat != null).slice(0, 400);
    return res.status(200).json({ ok: true, source: 'World Air Quality Index (WAQI) · live AQI', count: stations.length, stations, ts: new Date().toISOString() });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e), stations: [] });
  }
}
