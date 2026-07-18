// "What governs my industry?" — type an industry, get the real frameworks that govern
// it + the MEOK legacy bridges that connect its systems. Grounded in actual regulation
// (EU AI Act, DORA, NIS2, GDPR, HIPAA, Basel III, MiFID II, Solvency II, MDR, etc.).
// No key, CORS-open — the dock + globe + extension all call it.

const F = {
  euaiact:  { name: 'EU AI Act', why: 'AI systems — risk tiers, transparency, human oversight (Art. 9–15, 50).' },
  gdpr:     { name: 'GDPR', why: 'Personal data — lawful basis, minimisation, rights.' },
  dora:     { name: 'DORA', why: 'Digital operational resilience for finance (ICT risk, incident reporting).' },
  nis2:     { name: 'NIS2', why: 'Cyber resilience for essential & important entities.' },
  hipaa:    { name: 'HIPAA', why: 'US protected health information — privacy & security rules.' },
  basel:    { name: 'Basel III', why: 'Bank capital, liquidity & risk.' },
  mifid:    { name: 'MiFID II', why: 'Investment services, best execution, reporting.' },
  psd2:     { name: 'PSD2', why: 'Payment services & strong customer authentication.' },
  solvency: { name: 'Solvency II', why: 'Insurer capital adequacy & governance.' },
  mdr:      { name: 'EU MDR', why: 'Medical devices — safety & performance.' },
  fdasamd:  { name: 'FDA SaMD', why: 'Software as a medical device — clinical validation.' },
  iec62443: { name: 'IEC 62443', why: 'Industrial automation & control system security.' },
  iso27001: { name: 'ISO 27001', why: 'Information security management.' },
  iso42001: { name: 'ISO 42001', why: 'AI management system.' },
  soc2:     { name: 'SOC 2', why: 'Trust services — security, availability, confidentiality.' },
  eidas:    { name: 'eIDAS', why: 'Electronic identity & trust services.' },
};
const ALWAYS = ['euaiact', 'gdpr', 'iso42001'];   // any AI-using business in the EU/UK

// industry → { match keywords, frameworks (beyond ALWAYS), bridges }
const IND = [
  { key: 'finance', kw: /\b(bank|financ|fintech|payment|trading|capital|invest|lending|broker|wealth)/, fw: ['dora','mifid','basel','psd2'], bridges: ['ISO 20022','FIX','NACHA','ISO 8583','CICS','COBOL'] },
  { key: 'healthcare', kw: /\b(health|medical|hospital|nhs|clinic|patient|pharma|doctor)/, fw: ['hipaa','mdr','fdasamd'], bridges: ['HL7/FHIR'] },
  { key: 'insurance', kw: /\b(insur|underwrit|actuar|reinsur|claims)/, fw: ['solvency'], bridges: ['ACORD','MISMO'] },
  { key: 'energy', kw: /\b(energy|utilit|power|grid|oil|gas|nuclear)/, fw: ['nis2','iec62443'], bridges: ['SCADA','DLMS','MQTT'] },
  { key: 'manufacturing', kw: /\b(manufactur|factory|industrial|automotive|aerospace|machin)/, fw: ['nis2','iec62443'], bridges: ['AS/400','MQTT','SCADA'] },
  { key: 'retail', kw: /\b(retail|ecommerce|e-commerce|\bshop|\bstore|commerce|consumer goods)/, fw: ['psd2'], bridges: ['EDI','GS1','ISO 8583'] },
  { key: 'public', kw: /\b(government|public sector|council|municipal|defence|defense|agency)/, fw: ['nis2','eidas'], bridges: ['COBOL','AS/400'] },
  { key: 'telecom', kw: /\b(telecom|telco|network operator|isp|mobile carrier)/, fw: ['nis2'], bridges: ['SIP','MQTT'] },
  { key: 'legal', kw: /\b(legal|law firm|solicitor|attorney|compliance)/, fw: ['soc2'], bridges: [] },
  { key: 'education', kw: /\b(education|school|universit|edtech|student)/, fw: ['soc2'], bridges: [] },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const q = ((req.query && (req.query.q || req.query.industry)) || '').toString().toLowerCase().slice(0, 120);
  if (!q.trim()) return res.status(200).json({ industry: '', frameworks: [], bridges: [], note: 'pass ?q=<your industry>' });

  const hit = IND.find(i => i.kw.test(q));
  const ids = [...ALWAYS, ...(hit ? hit.fw : ['iso27001', 'soc2'])];
  const seen = new Set();
  const frameworks = ids.filter(id => F[id] && !seen.has(id) && seen.add(id)).map(id => F[id]);
  const bridges = hit ? hit.bridges : [];
  return res.status(200).json({
    industry: hit ? hit.key : 'general',
    matched: !!hit,
    frameworks,
    bridges,
    advice: hit
      ? `A ${hit.key} business is governed by ${frameworks.length} core frameworks. MEOK bridges its legacy systems (${bridges.join(', ') || 'standard'}) and signs every governed action.`
      : `Every AI-using business is governed by at least the EU AI Act, GDPR and ISO 42001. Tell me your sector (e.g. "I run a bank") for the specifics.`,
    source: 'os.meok.ai/api/govern',
  });
}
