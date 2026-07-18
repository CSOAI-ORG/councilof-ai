// /api/sim — run a REAL governance simulation for an AI system scenario.
// PDCA (Plan-Do-Check-Act) phases grounded in actual regulation, + a risk tier.
// Powers councilof-ai/SovSpace.tsx + PDCASimulator.tsx ("run real sims"), the OS dock, the globe.
// Rule-grounded core ALWAYS works (no key needed); optional brain layer enriches the prose.
// No key required for the grounded path. CORS-open — any sovereign surface calls it.

// --- EU AI Act risk tiering (grounded, deterministic) ---
const PROHIBITED = /\b(social scoring|subliminal|manipulat\w+ behaviour|real-time remote biometric|emotion recognition (at work|in school)|predictive policing)\b/i;
const HIGH = /\b(cv|resume|recruit|hir(e|ing)|applicant|credit scor|loan|creditworth|biometric|medical|diagnos|triage|patient|critical infrastructure|education|exam|grading|law enforcement|migration|border|justice|welfare|benefit eligib)\b/i;
const LIMITED = /\b(chatbot|assistant|generat\w+ (text|image|content)|deepfake|synthetic|recommend|content moderation)\b/i;

function riskTier(s) {
  if (PROHIBITED.test(s)) return { tier: 'prohibited', art: 'Art. 5', why: 'Falls in an EU AI Act Article 5 prohibited practice — cannot be placed on the EU market.' };
  if (HIGH.test(s))       return { tier: 'high',       art: 'Annex III', why: 'Matches an Annex III high-risk use case — full Chapter III obligations from 2 Aug 2026.' };
  if (LIMITED.test(s))    return { tier: 'limited',    art: 'Art. 50',  why: 'Transparency-tier — users must be told they are interacting with / seeing AI (Art. 50).' };
  return { tier: 'minimal', art: '—', why: 'Outside the prohibited, high-risk and transparency tiers — voluntary best practice applies.' };
}

// industry → the frameworks that actually govern it (mirrors /api/govern)
const IND = [
  { kw: /\b(bank|financ|fintech|payment|trading|credit|loan|invest)/, fw: ['EU AI Act','DORA','MiFID II','Basel III','GDPR','ISO 42001'] },
  { kw: /\b(health|medical|hospital|nhs|clinic|patient|pharma|triage|diagnos)/, fw: ['EU AI Act','EU MDR','FDA SaMD','HIPAA','GDPR','ISO 42001'] },
  { kw: /\b(insur|underwrit|actuar|claims)/, fw: ['EU AI Act','Solvency II','GDPR','ISO 42001'] },
  { kw: /\b(cv|resume|recruit|hir|applicant|employ|worker|hr)/, fw: ['EU AI Act','GDPR','ISO 42001','Equality Act / EEOC'] },
  { kw: /\b(gov|public sector|welfare|benefit|migration|border|justice|police|law enforcement)/, fw: ['EU AI Act','GDPR','ISO 42001','Fundamental Rights (FRIA)'] },
];
function frameworks(s) {
  const base = ['EU AI Act', 'GDPR', 'ISO 42001'];
  for (const i of IND) if (i.kw.test(s)) return Array.from(new Set(i.fw.concat(base)));
  return base;
}

// PDCA phases, grounded to the tier
function pdca(scenario, tier, fws) {
  const high = tier.tier === 'high' || tier.tier === 'prohibited';
  return [
    { phase: 'Plan', title: 'Risk management & data governance',
      guidance: `Stand up a continuous risk-management system (EU AI Act Art. 9) and data-governance controls (Art. 10): document the intended purpose, foreseeable misuse, and the data used to train/validate. ${high ? 'Required before market placement.' : 'Proportionate to a ' + tier.tier + '-risk system.'}` },
    { phase: 'Do', title: 'Build with controls',
      guidance: `Implement technical documentation (Art. 11), automatic logging/traceability (Art. 12), accuracy, robustness & cybersecurity (Art. 15). Map each control to ${fws.slice(0,3).join(', ')} so one evidence set answers several frameworks (use the CSOAI crosswalk).` },
    { phase: 'Check', title: 'Human oversight & conformity',
      guidance: `${high ? 'Conduct a conformity assessment + register in the EU high-risk database (Art. 43, 71); ' : ''}ensure effective human oversight (Art. 14) with a real stop/override. ${tier.tier === 'limited' ? 'Meet Art. 50 transparency: disclose AI use and mark synthetic content.' : ''}` },
    { phase: 'Act', title: 'Monitor, report, improve',
      guidance: `Run post-market monitoring (Art. 72), report serious incidents (Art. 73), and feed findings back into the risk system. Every governed decision Ed25519-signed to an offline-verifiable ledger (CSOAI Layer-0) so the audit trail is provable, not asserted.` },
  ];
}

async function enrich(scenario, tier, fws) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith('REPLACE')) return null;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 320,
        system: 'You are the CSOAI 33-agent governance council. Given an AI system and its risk tier, write ONE tight paragraph (<80 words): the single biggest compliance risk and the first concrete step. Plain, practical, no lists.',
        messages: [{ role: 'user', content: `System: ${scenario}\nTier: ${tier.tier} (${tier.art})\nFrameworks: ${fws.join(', ')}` }] })
    });
    const d = await r.json();
    return (d && d.content && d.content[0] && d.content[0].text) || null;
  } catch (e) { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const scenario = ((body && (body.scenario || body.message || body.system)) ||
    (req.query && (req.query.scenario || req.query.q)) || '').toString().slice(0, 1000);
  if (!scenario.trim()) {
    return res.status(200).json({ ok: true, hint: 'POST {scenario} or GET ?scenario= — an AI system to simulate governance for.',
      example: 'a CV-screening AI that ranks job applicants' });
  }

  const tier = riskTier(scenario);
  const fws = frameworks(scenario);
  const phases = pdca(scenario, tier, fws);
  const council = await enrich(scenario, tier, fws);

  return res.status(200).json({
    ok: true,
    scenario,
    risk_tier: tier.tier,
    tier_basis: tier.art,
    verdict: tier.why,
    frameworks: fws,
    phases,
    council_note: council,   // null when brain key absent — grounded phases still returned
    signed_hint: 'Every phase decision can be Ed25519-signed via /api/sign for an offline-verifiable audit trail.',
    source: 'os.meok.ai/api/sim — grounded PDCA governance simulation',
  });
}
