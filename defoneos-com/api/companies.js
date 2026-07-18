// UK official company registry — Companies House public data (companies only, no individuals).
// Governed connector. Needs a free Companies House REST key in env CH_KEY (owner-gated).
// Until the key is set this returns ok:false with a clear reason — it never fabricates records.
// Docs: https://developer.company-information.service.gov.uk/  (free, rate-limited)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const q = req.query || {};
  const term = (q.q || '').toString().trim();
  const key = process.env.CH_KEY || '';
  if (!key) return res.status(200).json({
    ok: false, gated: true, companies: [],
    reason: 'UK Companies House registry needs a free API key (CH_KEY). Owner: create one at developer.company-information.service.gov.uk and add it in Vercel env — no code change needed.',
    source: 'Companies House · official UK registry · companies only'
  });
  if (!term) return res.status(200).json({ ok: false, error: 'q (search term) required', companies: [] });
  try {
    const url = 'https://api.company-information.service.gov.uk/search/companies?items_per_page=20&q=' + encodeURIComponent(term);
    const auth = 'Basic ' + Buffer.from(key + ':').toString('base64');
    const r = await fetch(url, { headers: { Authorization: auth }, signal: AbortSignal.timeout(12000) });
    if (!r.ok) return res.status(200).json({ ok: false, error: 'Companies House HTTP ' + r.status, companies: [] });
    const d = await r.json();
    const companies = (d.items || []).map(x => ({
      name: x.title,
      number: x.company_number,
      status: x.company_status,
      type: x.company_type,
      incorporated: x.date_of_creation || '',
      address: (x.address_snippet || ''),
      url: 'https://find-and-update.company-information.service.gov.uk/company/' + x.company_number
    }));
    res.status(200).json({ ok: companies.length > 0, count: companies.length, companies, source: 'Companies House · official UK registry · companies only · governed' });
  } catch (e) { res.status(200).json({ ok: false, error: String(e), companies: [] }); }
}
