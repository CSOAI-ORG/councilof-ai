// Coarse, city-level geolocation of the CALLER's own IP — used by the tour to fly the 3D
// globe roughly to where the viewer is. Nothing is stored; the viewer only sees their own
// approximate location. Free, no key (ipwho.is over HTTPS). Falls back gracefully.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  // Vercel/proxy client IP; take the first hop in x-forwarded-for.
  const xff = (req.headers['x-forwarded-for'] || '').toString();
  let ip = xff.split(',')[0].trim() || (req.socket && req.socket.remoteAddress) || '';
  ip = ip.replace(/^::ffff:/, '');
  const isPrivate = !ip || /^(10\.|127\.|192\.168\.|::1|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
  try {
    const url = isPrivate ? 'https://ipwho.is/' : ('https://ipwho.is/' + encodeURIComponent(ip));
    const d = await (await fetch(url)).json();
    if (d && d.success && typeof d.latitude === 'number') {
      return res.status(200).json({ lat: d.latitude, lon: d.longitude, city: d.city || '', region: d.region || '', country: d.country || '', approx: true });
    }
    return res.status(200).json({ error: 'geo unavailable', approx: true });
  } catch (e) {
    return res.status(200).json({ error: String((e && e.message) || e), approx: true });
  }
}
