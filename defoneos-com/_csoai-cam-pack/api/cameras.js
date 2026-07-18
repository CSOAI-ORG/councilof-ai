// DEFONEOS — public live cameras → dome overlay. Multi-region, public infrastructure only.
//
// Keyless sources wired now:
//  • TfL JamCams — live London traffic cameras (available-only).
//  • Ontario 511 (511on.ca) + Alberta 511 (511.alberta.ca) — public road cameras (same vendor API).
// Global upgrade (free key): Windy Webcams (50k+ webcams) when WINDY_KEY env is set.
//
// GUARDRAIL (Layer-0 hard stop · no surveillance): public, consented traffic/weather cameras
// only. NO ALPR/Flock, facial recognition, private CCTV, or unsecured-camera aggregators
// (Insecam/Opentopia expose private cameras — exactly the mass-surveillance we refuse).
const UA = { 'User-Agent': 'Mozilla/5.0 (DEFONEOS/1.0)' };

async function tflCams() {
  const a = await (await fetch('https://api.tfl.gov.uk/Place/Type/JamCam', { headers: UA })).json();
  return (a || []).map(c => {
    const ap = {}; (c.additionalProperties || []).forEach(p => { ap[p.key] = p.value; });
    return { name: c.commonName, lat: c.lat, lon: c.lon, image: ap.imageUrl, video: ap.videoUrl, city: 'London', available: ap.available !== 'false' };
  }).filter(c => c.lat != null && c.image && c.available);
}
async function fiveOneOne(base, label) {
  const a = await (await fetch(base + '/api/v2/get/cameras', { headers: UA })).json();
  return (a || []).map(c => {
    const v = (c.Views || []).find(x => x.Status === 'Enabled') || (c.Views || [])[0];
    return v ? { name: c.Location || c.Roadway || 'camera', lat: c.Latitude, lon: c.Longitude, image: v.Url, video: null, city: label, available: true } : null;
  }).filter(c => c && c.lat != null && c.image);
}
async function geocode(area) {
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(area), { headers: UA });
    const a = await r.json();
    if (a && a[0]) return { lat: parseFloat(a[0].lat), lon: parseFloat(a[0].lon) };
  } catch (e) {}
  return null;
}
// Windy Webcams API v3 — geo search is `nearby=lat,lng,radiusKm` (there is NO free-text q= param).
async function windyCams(key, lat, lon, radiusKm) {
  const geo = (lat != null && lon != null) ? ('&nearby=' + lat + ',' + lon + ',' + (radiusKm || 250)) : '';
  const url = 'https://api.windy.com/webcams/api/v3/webcams?limit=50&include=images,location,player,urls' + geo;
  const d = await (await fetch(url, { headers: { 'x-windy-api-key': key } })).json();
  return (d.webcams || []).map(w => ({
    name: w.title || 'webcam', lat: w.location && w.location.latitude, lon: w.location && w.location.longitude,
    image: w.images && w.images.current && (w.images.current.preview || w.images.current.thumbnail),
    video: w.player && w.player.day && w.player.day.embed, city: (w.location && w.location.city) || '', available: true
  })).filter(c => c.lat != null && c.image);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
  const area = (req.query && req.query.area || '').toLowerCase();
  let region = (req.query && req.query.region || '').toLowerCase();
  if (!region) {
    if (/toronto|ottawa|ontario|hamilton|niagara|windsor/.test(area)) region = 'ontario';
    else if (/calgary|edmonton|alberta|banff|red deer/.test(area)) region = 'alberta';
    else if (/london|\buk\b|britain|england/.test(area)) region = 'london';
  }
  const wk = process.env.WINDY_KEY;
  let cams = [], source = '';
  try {
    if (region === 'ontario') { cams = await fiveOneOne('https://511on.ca', 'Ontario'); source = 'Ontario 511 · public road cameras'; }
    else if (region === 'alberta') { cams = await fiveOneOne('https://511.alberta.ca', 'Alberta'); source = 'Alberta 511 · public road cameras'; }
    else if (region === 'london') { cams = await tflCams(); source = 'TfL JamCams · public London cameras'; }
    else if (wk) {
      let lat = parseFloat(req.query && req.query.lat), lon = parseFloat(req.query && req.query.lon);
      if ((isNaN(lat) || isNaN(lon)) && area) { const g = await geocode(area); if (g) { lat = g.lat; lon = g.lon; } }
      cams = await windyCams(wk, isNaN(lat) ? null : lat, isNaN(lon) ? null : lon, 250);
      source = 'Windy Webcams · global public network' + (area ? ' · near ' + area : '');
    }
    else {
      const [a, b, c] = await Promise.all([tflCams().catch(() => []), fiveOneOne('https://511on.ca', 'Ontario').catch(() => []), fiveOneOne('https://511.alberta.ca', 'Alberta').catch(() => [])]);
      cams = [...a.slice(0, 80), ...b.slice(0, 80), ...c.slice(0, 60)];
      source = 'London + Ontario + Alberta · public road cameras';
    }
    if (area && !region && !wk) cams = cams.filter(c => (c.name || '').toLowerCase().includes(area));
    cams = cams.slice(0, 240);
    return res.status(200).json({
      ok: true, source, count: cams.length, cameras: cams, global_available: !!wk,
      regions: ['london', 'ontario', 'alberta', wk ? 'global (windy)' : null].filter(Boolean),
      policy: 'Public, consented cameras only. No ALPR/Flock/facial-recognition/private-CCTV or unsecured-camera aggregators (Layer-0 hard stop: no surveillance).',
      upgrade: wk ? null : 'Add a free WINDY_KEY env var (windy.com/webcams API) to unlock 50k+ global public webcams.',
      ts: new Date().toISOString()
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e), cameras: [] });
  }
}
