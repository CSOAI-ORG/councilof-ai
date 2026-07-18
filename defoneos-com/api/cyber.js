// DEFONEOS — cyber threat feed → dome tool. Keyless: CISA Known Exploited Vulnerabilities
// (KEV) — the US gov catalogue of vulns actively exploited in the wild. Governed under Layer-0.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  try {
    const d = await (await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', { headers: { 'User-Agent': 'Mozilla/5.0 (DEFONEOS/1.0)' } })).json();
    const v = (d.vulnerabilities || []).slice()
      .sort((a, b) => (b.dateAdded || '').localeCompare(a.dateAdded || ''))
      .slice(0, 26)
      .map(x => ({ cve: x.cveID, vendor: x.vendorProject, product: x.product, name: x.vulnerabilityName, added: x.dateAdded, ransomware: x.knownRansomwareCampaignUse === 'Known' }));
    return res.status(200).json({
      ok: true, source: 'CISA Known Exploited Vulnerabilities (KEV)',
      total: (d.vulnerabilities || []).length, catalogVersion: d.catalogVersion || '', count: v.length, vulns: v, ts: new Date().toISOString()
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: String(e), vulns: [] });
  }
}
