// Live ADS-B aircraft — governed server-side connector. Primary feed: adsb.fi (community
// ADS-B, keyless, no rate-limit on cloud IPs); OpenSky kept as fallback. CORS-restricted
// sources reach the dome via this same-origin governed connector (care-membrane gate,
// SIGIL-loggable). Platform-level only — no individual tracking.
const UA = { 'User-Agent': 'Mozilla/5.0 (DEFONEOS/1.0)' };

async function adsbfi(lat, lon, dist) {
  const d = await (await fetch('https://opendata.adsb.fi/api/v2/lat/' + lat + '/lon/' + lon + '/dist/' + dist, { headers: UA, signal: AbortSignal.timeout(11000) })).json();
  return (d.aircraft || []).filter(a => a.lat != null && a.lon != null).slice(0, 400).map(a => ({
    cs: (a.flight || a.r || a.hex || '').trim(), lon: a.lon, lat: a.lat,
    alt: (a.alt_baro === 'ground' ? 0 : (a.alt_baro || 0)) * 0.3048, onground: a.alt_baro === 'ground',
    vel: a.gs, heading: a.track
  }));
}
async function opensky() {
  const r = await fetch('https://opensky-network.org/api/states/all?lamin=49.0&lomin=-11.0&lamax=61.0&lomax=2.5', { signal: AbortSignal.timeout(11000) });
  const d = await r.json();
  return (d.states || []).slice(0, 400).map(s => ({ cs: (s[1] || '').trim(), lon: s[5], lat: s[6], alt: s[7] || 0, onground: !!s[8], vel: s[9], heading: s[10] })).filter(s => s.lon != null && s.lat != null);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=8, stale-while-revalidate=30');
  const lat = parseFloat(req.query && req.query.lat), lon = parseFloat(req.query && req.query.lon);
  const qlat = isNaN(lat) ? 53.5 : lat, qlon = isNaN(lon) ? -1.5 : lon, dist = Math.min(250, Math.max(20, parseInt((req.query && req.query.dist) || 250)));
  let states = [], source = '';
  try { states = await adsbfi(qlat, qlon, dist); source = 'adsb.fi · community ADS-B (1090 MHz)'; } catch (_) {}
  if (!states.length) { try { states = await opensky(); source = 'OpenSky Network · ADS-B'; } catch (_) {} }
  return res.status(200).json({
    ok: states.length > 0, count: states.length, states, source,
    governed: true, gated_by: 'care-membrane', signable: 'SIGIL',
    note: 'Live ADS-B via governed connector. Platform-level only — no individual tracking.',
    ts: new Date().toISOString()
  });
}
