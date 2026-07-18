// DEFONEOS — live satellites → dome overlay. CelesTrak GP (NORAD TLE, keyless). Returns
// two-line element sets; the client propagates them with satellite.js so the dots move in
// real time. Default group: "visual" (brightest); also stations / starlink / active.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  const group = (req.query && req.query.group) || 'visual';
  try {
    const txt = await (await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=' + encodeURIComponent(group) + '&FORMAT=tle', { headers: { 'User-Agent': 'Mozilla/5.0 (DEFONEOS/1.0)' } })).text();
    const lines = txt.split(/\r?\n/); const sats = [];
    for (let i = 0; i + 2 < lines.length; i += 3) {
      const name = (lines[i] || '').trim(), l1 = (lines[i + 1] || '').trim(), l2 = (lines[i + 2] || '').trim();
      if (l1.charAt(0) === '1' && l2.charAt(0) === '2') sats.push({ name, l1, l2 });
    }
    return res.status(200).json({ ok: true, group, count: sats.length, sats: sats.slice(0, 220), source: 'CelesTrak GP · NORAD TLE', ts: new Date().toISOString() });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e), sats: [] });
  }
}
