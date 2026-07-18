import catalog from './_data/tools.json' with { type: 'json' };

// Sovereign tool router: keyword-search the 377-tool fleet → ranked matches.
// Powers SOV Space search AND the OS dock's "connect me to the right tool" flow.

const CLLABEL = { 'domain-ai':'Domain AI','other':'Tools','framework-regulation':'Regulation','bridges':'Legacy Bridge','a2a-substrate':'A2A Substrate','crypto-attestation':'Attestation','physical-ot':'Physical/OT','safety-assurance':'Safety' };

// light synonym map so natural language hits the right cluster
const HINT = {
  'legacy':'bridges','mainframe':'bridges','cobol':'bridges','sap':'bridges','hl7':'bridges','fhir':'bridges','health':'bridges','patient':'bridges','medical':'bridges','clinical':'bridges','nhs':'bridges','bank':'bridges','payment':'bridges','iso20022':'bridges','scada':'bridges',
  'comply':'framework-regulation','compliance':'framework-regulation','gdpr':'framework-regulation','regulation':'framework-regulation','dora':'framework-regulation','nis2':'framework-regulation','audit':'framework-regulation','eu ai act':'framework-regulation',
  'agent':'a2a-substrate','identity':'a2a-substrate','policy':'a2a-substrate','firewall':'a2a-substrate','router':'a2a-substrate','orchestrat':'a2a-substrate',
  'sign':'crypto-attestation','attest':'crypto-attestation','verify':'crypto-attestation','sigil':'crypto-attestation','ledger':'crypto-attestation',
  'safe':'safety-assurance','guardrail':'safety-assurance','risk':'safety-assurance',
  'robot':'physical-ot','sensor':'physical-ot','factory':'physical-ot'
};

function score(tool, q, clusterHint) {
  const name = String(tool.name||'').toLowerCase().replace(/^\./,'');
  let s = 0;
  for (const w of q) { if (!w) continue; if (name.includes(w)) s += 10; if (name.split(/[-_.]/).some(p=>p===w)) s += 6; }
  if (clusterHint && tool.cluster === clusterHint) s += 9;
  s += Math.min(tool.tools || 0, 8) * 0.2; // gently favour richer servers
  return s;
}

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const raw = ((req.query && (req.query.q || req.query.query)) || '').toString().toLowerCase().slice(0, 120);
  const limit = Math.min(parseInt((req.query && req.query.limit) || '6', 10) || 6, 20);
  if (!raw.trim()) {
    // empty query → feature the richest servers across the fleet so the storefront / dock is never blank
    const featured = catalog.slice().sort((a, b) => (b.tools || 0) - (a.tools || 0)).slice(0, limit).map(t => {
      const slug = String(t.name).replace(/^\./, '');
      return { name: slug, cluster: t.cluster, clusterLabel: CLLABEL[t.cluster] || t.cluster, tools: t.tools, connect: `pip install ${slug}`, sovspace: `/sovspace.html?q=${encodeURIComponent(slug)}` };
    });
    return res.status(200).json({ query: '', featured: true, total: catalog.length, matches: featured });
  }
  const q = raw.split(/\s+/).filter(Boolean);
  let clusterHint = null;
  for (const k in HINT) if (raw.includes(k)) { clusterHint = HINT[k]; break; }
  const ranked = catalog
    .map(t => ({ t, s: score(t, q, clusterHint) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(x => {
      const slug = String(x.t.name).replace(/^\./, '');
      return { name: slug, cluster: x.t.cluster, clusterLabel: CLLABEL[x.t.cluster] || x.t.cluster, tools: x.t.tools, connect: `pip install ${slug}`, sovspace: `/sovspace.html?q=${encodeURIComponent(slug)}` };
    });
  return res.status(200).json({ query: raw, clusterHint, total: catalog.length, matches: ranked });
}
