// NASA FIRMS active-fire hotspots (VIIRS NRT) → dome overlay. Real satellite fire detections.
// Needs a FREE key (MAP_KEY) from firms.modaps.eosdis.nasa.gov in env FIRMS_KEY. Honest-gated until set.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  const key = process.env.FIRMS_KEY || '';
  if (!key) return res.status(200).json({ ok: false, gated: true, fires: [], reason: 'NASA FIRMS wildfire hotspots need a free MAP_KEY (firms.modaps.eosdis.nasa.gov) in env FIRMS_KEY.' });
  const q = req.query || {};
  const w = +q.w, s = +q.s, e = +q.e, n = +q.n, days = Math.min(3, parseInt(q.days, 10) || 1);
  if ([w, s, e, n].some(isNaN)) return res.status(200).json({ ok: false, error: 'bbox w,s,e,n required', fires: [] });
  try {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/${w},${s},${e},${n}/${days}`;
    const txt = await (await fetch(url, { signal: AbortSignal.timeout(15000) })).text();
    const lines = txt.trim().split('\n'); const hdr = (lines.shift() || '').split(',');
    const iLat = hdr.indexOf('latitude'), iLon = hdr.indexOf('longitude'), iFrp = hdr.indexOf('frp'), iConf = hdr.indexOf('confidence'), iDate = hdr.indexOf('acq_date');
    const fires = lines.slice(0, 500).map(l => { const c = l.split(','); return { lat: +c[iLat], lon: +c[iLon], frp: +c[iFrp] || 0, conf: c[iConf] || '', date: c[iDate] || '' }; }).filter(f => !isNaN(f.lat) && !isNaN(f.lon));
    res.status(200).json({ ok: fires.length > 0, count: fires.length, fires, source: 'NASA FIRMS · VIIRS active fire (NRT)' });
  } catch (e) { res.status(200).json({ ok: false, error: String(e), fires: [] }); }
}
