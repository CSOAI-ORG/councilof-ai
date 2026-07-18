// DEFONEOS — space domain → dome overlay. Keyless: live ISS position (wheretheiss.at) +
// upcoming rocket launches with pad coordinates (Launch Library 2 / The Space Devs).
const UA = { 'User-Agent': 'Mozilla/5.0 (DEFONEOS/1.0)' };
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=20, stale-while-revalidate=120');
  let iss = null, launches = [];
  try {
    const d = await (await fetch('https://api.wheretheiss.at/v1/satellites/25544', { headers: UA })).json();
    iss = { lat: d.latitude, lon: d.longitude, alt: Math.round(d.altitude), vel: Math.round(d.velocity), visibility: d.visibility };
  } catch (_) {}
  try {
    const l = await (await fetch('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=12', { headers: UA })).json();
    launches = (l.results || []).map(r => ({
      name: r.name, net: r.net, status: (r.status || {}).abbrev || '',
      lat: (r.pad || {}).latitude != null ? parseFloat(r.pad.latitude) : null,
      lon: (r.pad || {}).longitude != null ? parseFloat(r.pad.longitude) : null,
      pad: (r.pad || {}).name || '', provider: ((r.launch_service_provider || {}).name) || ''
    })).filter(x => x.lat != null && x.lon != null);
  } catch (_) {}
  return res.status(200).json({ ok: true, iss, launches, source: 'ISS (wheretheiss.at) + Launch Library 2', ts: new Date().toISOString() });
}
