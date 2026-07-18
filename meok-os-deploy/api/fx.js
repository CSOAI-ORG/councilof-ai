// Live currency conversion — free, no key (Frankfurter / ECB). Proxied server-side (Frankfurter
// isn't reliably CORS from the browser), so the client gets guaranteed CORS + the shared backend.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=600');
  const q = req.query || {};
  const amount = Math.min(1e12, Math.max(0, parseFloat(q.amount || '1') || 1));
  const from = (q.from || 'USD').toString().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const to = (q.to || 'GBP').toString().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  if (from === to) return res.status(200).json({ amount, from, to, result: amount, rate: 1 });
  try {
    const d = await (await fetch(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`)).json();
    const result = d && d.rates && d.rates[to];
    if (result == null) return res.status(200).json({ error: 'pair not supported (' + from + '→' + to + ')', from, to });
    return res.status(200).json({ amount, from, to, result: Math.round(result * 100) / 100, rate: Math.round((result / amount) * 10000) / 10000, date: d.date });
  } catch (e) { return res.status(200).json({ error: String(e && e.message || e) }); }
}
