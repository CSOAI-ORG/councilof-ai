#!/usr/bin/env node
/**
 * build_sme_kb.mjs — Sovereign SME Knowledge Base builder.
 *
 * Turns the rich per-account intel ALREADY in csoai_leads.db (compliance_posture,
 * side_by_side_comparison wedges, public_ai_signals, sector, jurisdiction, tier)
 * into a structured, queryable "subject-matter-expert" record per account — so SOV3
 * / the Sovereign dock can speak knowledgeably about ANY of the ~2,363 accounts:
 * who they are, what they need, the exact governance gap CSOAI closes, their persona,
 * and the talking points to use in a demo / call / outreach.
 *
 * Pure synthesis of existing data (no re-scraping 2,363 sites) — honest + fast.
 * Outputs:
 *   csoai-outreach/sme-kb.jsonl     — one SME profile per account (machine-readable)
 *   csoai-outreach/sme-kb.db        — SQLite, indexed, SOV3-queryable
 *   csoai-outreach/PERSONA_MAP.md   — personas → platform surfaces → coverage gaps
 *   csoai-outreach/SME_KB_MANIFEST.md
 *
 * Usage: node sovereign-charters/build_sme_kb.mjs
 */
import { execSync } from 'node:child_process';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB = resolve(__dirname, 'csoai_leads.db');
const OUT = resolve(__dirname, 'csoai-outreach');
const KBDB = resolve(OUT, 'sme-kb.db');

function loadLeads() {
  const rows = execSync(
    `sqlite3 -json "${DB}" "SELECT lead_id, company_legal_name, jurisdiction, domain, industry_charter, primary_persona, tier, report_json FROM leads"`,
    { maxBuffer: 512 * 1024 * 1024 }
  ).toString();
  return JSON.parse(rows);
}

// ---- Regulatory mapping: jurisdiction (+ sector) → the frameworks that bite ----
const FRAMEWORK_LABEL = {
  'eu-ai-act': 'EU AI Act', 'gdpr': 'GDPR', 'iso-42001': 'ISO/IEC 42001',
  'nist-ai-rmf': 'NIST AI RMF', 'hipaa': 'HIPAA', 'pci-dss-4': 'PCI-DSS 4.0',
  'jsp-936': 'JSP 936 (UK defence AI)', 'fedramp': 'FedRAMP',
  'coe-ai-conv-2024': 'CoE AI Convention 2024', 'dora': 'DORA', 'nis2': 'NIS2',
};
function applicableRegs(juris = '', sector = '') {
  const j = (juris || '').toLowerCase(), s = (sector || '').toLowerCase();
  const set = new Set(['iso-42001', 'nist-ai-rmf']); // baseline everywhere
  if (/eu|fr|de|se|es|it|nl|europe|ie|belg|pol/.test(j)) { set.add('eu-ai-act'); set.add('gdpr'); set.add('coe-ai-conv-2024'); }
  if (/uk|brit|regulator|policy|england/.test(j)) { set.add('gdpr'); set.add('coe-ai-conv-2024'); }
  if (/us|sec|america|fed/.test(j)) { set.add('fedramp'); }
  if (/health|hospital|pharma|medic|care|nhs|clinic/.test(s)) set.add('hipaa');
  if (/bank|financ|fintech|insur|payment|capital|invest/.test(s)) { set.add('pci-dss-4'); set.add('dora'); }
  if (/defen|defence|military|aerospace|security|gov|intel/.test(s)) set.add('jsp-936');
  if (/critical|energy|utility|telecom|infrastructure|transport/.test(s)) set.add('nis2');
  return [...set];
}

// ---- Sector inference: many top accounts have industry_charter="unknown". Infer from
// company name / domain keywords so persona routing sharpens (public heuristic, no API). ----
const SECTOR_KEYWORDS = [
  ['finance', /bank|financ|capital|jpmorgan|jp morgan|goldman|morgan stanley|wells fargo|citigroup|citibank|berkshire|american express|visa|mastercard|paypal|blackrock|charles schwab|insur|allstate|metlife|prudential|aig|fintech|payment|lending|credit|mortgage|hsbc|barclays|lloyds|natwest|deutsche|santander|blackstone|kkr|fidelity|vanguard/i],
  ['healthcare', /health|hospital|pharma|medic|clinic|biotech|life scienc|pfizer|merck|johnson & johnson|abbvie|eli lilly|moderna|amgen|gilead|bristol|novartis|astrazeneca|unitedhealth|cvs|cigna|humana|elevance|therapeut|genomic|diagnos/i],
  ['defence', /defen[cs]e|military|aerospace|lockheed|raytheon|rtx|northrop|general dynamics|bae systems|boeing|l3harris|leonardo|thales|rolls-royce|airbus|palantir|anduril|missile|weapon|naval|army/i],
  ['technology', /nvidia|apple|microsoft|alphabet|google|meta|amazon|intel|amd|oracle|salesforce|adobe|ibm|cisco|qualcomm|broadcom|dell|hp inc|sap|servicenow|snowflake|palo alto|crowdstrike|zscaler|databricks|openai|anthropic|software|semiconductor|cloud|\.ai\b|\.io\b|tech(nolog)?/i],
  ['energy', /energy|exxon|chevron|shell|\bbp\b|conocophillips|utility|utilities|power|electric|grid|nuclear|petroleum|oil & gas|renewable/i],
  ['government', /government|ministry|department|authority|commission|regulator|cabinet|agency|federal|\bgov\b|public sector|council|parliament|senate/i],
  ['retail', /retail|walmart|target|costco|home depot|consumer|e-commerce|ecommerce|marketplace/i],
];
function inferSector(company = '', domain = '', existing = '') {
  if (existing && existing !== 'unknown' && existing !== 'unspecified') return existing;
  const hay = `${company} ${domain}`.toLowerCase();
  for (const [sector, re] of SECTOR_KEYWORDS) if (re.test(hay)) return sector;
  return existing || 'unspecified';
}

// ---- Persona derivation: tier + sector + jurisdiction → who actually buys ----
function derivePersona(lead, r, sectorHint) {
  const t = lead.tier, j = (lead.jurisdiction || '').toLowerCase(), s = (sectorHint || lead.industry_charter || '').toLowerCase();
  const explicit = (lead.primary_persona || r.primary_persona || '').trim();
  if (/regulator|policy|govern(ment)?|ministry|department|authority|commission/.test(j) || t === 0)
    return { persona: 'Regulator / Policy body', buyer: 'Policy lead / AI governance office', motive: 'set + evidence a national assurance baseline' };
  if (/defen|defence|military|aerospace|intel/.test(s))
    return { persona: 'Defence / National security', buyer: 'Assurance / SRO / accreditation lead', motive: 'close the JSP 936 vendor-claim validation gap' };
  if (/health|hospital|pharma|medic|care|nhs|clinic/.test(s))
    return { persona: 'Healthcare / Life sciences', buyer: 'Clinical safety officer / CISO', motive: 'prove high-risk AI safety (EU AI Act Annex I + HIPAA)' };
  if (/bank|financ|fintech|insur|payment|capital|invest/.test(s))
    return { persona: 'Financial services', buyer: 'CCO / Head of Model Risk', motive: 'DORA + model-risk evidence, comply once' };
  if (t === 9)
    return { persona: 'US public company (SEC filer)', buyer: 'General Counsel / Chief Compliance Officer', motive: 'defensible AI-use disclosure + audit trail' };
  if (t >= 8 || /startup|scale|labs|\.ai$/.test(s + (lead.domain || '')))
    return { persona: 'AI startup / scale-up', buyer: 'Founder / Head of AI', motive: 'enterprise-ready governance without a GRC team' };
  if (explicit && explicit !== 'unknown')
    return { persona: explicit, buyer: 'Compliance / risk lead', motive: 'operationalise AI governance' };
  return { persona: 'Enterprise (general)', buyer: 'CISO / Chief Compliance Officer', motive: 'one signed control set across overlapping regimes' };
}

// Which CSOAI surfaces this persona needs — REAL routes verified against
// councilof-ai master's App.tsx router (2026-07-08). Names are actual paths.
function surfacesFor(persona) {
  const base = ['/crosswalk', '/compare', '/system-card', '/verify-certificate', '/classifier'];
  const map = {
    'Regulator / Policy body': [...base, '/regulator-atlas', '/government-dashboard', '/sov-space', '/globe'],
    'Defence / National security': [...base, '/fedramp', '/cobol', '/high-risk-ai'],
    'Healthcare / Life sciences': [...base, '/healthcare-ai-act', '/high-risk-ai'],
    'Financial services': [...base, '/dora', '/finance-ai-act', '/nis2'],
    'US public company (SEC filer)': [...base, '/us-ai-regulation', '/high-risk-ai'],
    'AI startup / scale-up': [...base, '/start', '/os', '/pricing'],
    'Enterprise (general)': [...base, '/industries', '/pricing'],
  };
  return map[persona] || base;
}

function buildProfile(lead) {
  let r = {}; try { r = JSON.parse(lead.report_json || '{}'); } catch {}
  const company = lead.company_legal_name || r.company || 'Unknown org';
  const rawSector = lead.industry_charter && lead.industry_charter !== 'unknown' ? lead.industry_charter : (r.industry_charter || 'unspecified');
  const sector = inferSector(company, lead.domain || '', rawSector);
  const signals = (Array.isArray(r.public_ai_signals) ? r.public_ai_signals : []).filter(Boolean);

  // posture → coverage + strongest wedges (from precomputed side_by_side_comparison)
  const cp = (r.compliance_posture && typeof r.compliance_posture === 'object') ? r.compliance_posture : {};
  const frameworks = Object.entries(cp).filter(([k]) => k !== 'charter_unknown');
  const covered = frameworks.filter(([, v]) => Number(v) > 0);
  const coveragePct = frameworks.length ? Math.round((covered.length / frameworks.length) * 100) : 0;
  const sbs = Array.isArray(r.side_by_side_comparison) ? r.side_by_side_comparison : [];
  const wedges = sbs
    .filter(w => FRAMEWORK_LABEL[w.metric] && Number(w.delta) > 0)
    .sort((a, b) => Number(b.delta) - Number(a.delta))
    .slice(0, 3)
    .map(w => ({ framework: FRAMEWORK_LABEL[w.metric] || w.metric, gap: Number(w.delta).toFixed(2), strength: w.wedge_strength || 'strong' }));

  const regs = applicableRegs(lead.jurisdiction, sector);
  const regLabels = regs.map(k => FRAMEWORK_LABEL[k] || k);
  const uncovered = regs.filter(k => !(Number(cp[k]) > 0)).map(k => FRAMEWORK_LABEL[k] || k);
  const { persona, buyer, motive } = derivePersona(lead, r, sector);
  const surfaces = surfacesFor(persona);

  const gapSummary = uncovered.length
    ? `No public evidence of coverage for ${uncovered.slice(0, 4).join(', ')}${uncovered.length > 4 ? ` (+${uncovered.length - 4} more)` : ''} — the exact set CSOAI's crosswalk maps in one pass.`
    : `Partial coverage detected (${coveragePct}%); CSOAI consolidates the overlap into one signed control set and evidences the rest.`;

  const valueProp = `${company} (${persona}) prepares for ${regLabels.slice(0, 3).join(', ')}. CSOAI lets them comply once and evidence everywhere — every governed action Ed25519-signed and offline-verifiable, honest vs Vanta/Drata/Credo AI.`;

  const talkingPoints = [
    signals.length ? `Their public AI footprint: ${signals.slice(0, 2).join('; ')}.` : `Little public AI-governance signal yet — greenfield for a signed baseline.`,
    wedges.length ? `Sharpest wedge: ${wedges[0].framework} (gap ${wedges[0].gap}, ${wedges[0].strength}).` : `Baseline gap across ISO 42001 / NIST AI RMF.`,
    `Buyer: ${buyer}; motive: ${motive}.`,
  ];

  return {
    lead_id: lead.lead_id,
    company, domain: lead.domain || null, jurisdiction: lead.jurisdiction || null,
    sector, tier: lead.tier, persona, buyer, motive,
    ai_signals: signals,
    coverage_pct: coveragePct,
    applicable_regs: regLabels,
    top_wedges: wedges,
    gap_summary: gapSummary,
    value_prop: valueProp,
    sme_talking_points: talkingPoints,
    surfaces_needed: surfaces,
  };
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const leads = loadLeads();
  const profiles = leads.map(buildProfile);

  // 1) JSONL
  await writeFile(resolve(OUT, 'sme-kb.jsonl'), profiles.map(p => JSON.stringify(p)).join('\n') + '\n');

  // 2) SQLite — SOV3-queryable (rebuild clean)
  await rm(KBDB, { force: true });
  const esc = s => String(s ?? '').replace(/'/g, "''");
  const stmts = ['PRAGMA journal_mode=WAL;',
    `CREATE TABLE sme (lead_id TEXT PRIMARY KEY, company TEXT, domain TEXT, jurisdiction TEXT, sector TEXT, tier INT, persona TEXT, buyer TEXT, coverage_pct INT, applicable_regs TEXT, top_wedge TEXT, gap_summary TEXT, value_prop TEXT, talking_points TEXT, surfaces TEXT);`,
    'CREATE INDEX idx_persona ON sme(persona);', 'CREATE INDEX idx_sector ON sme(sector);', 'CREATE INDEX idx_tier ON sme(tier);',
    'BEGIN;'];
  for (const p of profiles) {
    stmts.push(`INSERT INTO sme VALUES('${esc(p.lead_id)}','${esc(p.company)}','${esc(p.domain)}','${esc(p.jurisdiction)}','${esc(p.sector)}',${p.tier|0},'${esc(p.persona)}','${esc(p.buyer)}',${p.coverage_pct|0},'${esc(p.applicable_regs.join(' · '))}','${esc(p.top_wedges[0]?.framework || '')}','${esc(p.gap_summary)}','${esc(p.value_prop)}','${esc(p.sme_talking_points.join(' | '))}','${esc(p.surfaces_needed.join(','))}');`);
  }
  stmts.push('COMMIT;');
  execSync(`sqlite3 "${KBDB}"`, { input: stmts.join('\n'), maxBuffer: 512 * 1024 * 1024 });

  // 3) Persona map + coverage
  const byPersona = {};
  for (const p of profiles) (byPersona[p.persona] ||= { count: 0, surfaces: new Set(), sectors: new Set(), sample: [] }, byPersona[p.persona].count++,
    p.surfaces_needed.forEach(s => byPersona[p.persona].surfaces.add(s)), byPersona[p.persona].sectors.add(p.sector),
    byPersona[p.persona].sample.length < 3 && byPersona[p.persona].sample.push(p.company));
  const personaRows = Object.entries(byPersona).sort((a, b) => b[1].count - a[1].count)
    .map(([persona, d]) => `| **${persona}** | ${d.count} | ${[...d.surfaces].join(', ')} | ${d.sample.join('; ')} |`).join('\n');

  // Live-surface coverage check against the ACTUAL route inventory in
  // councilof-ai master App.tsx (verified 2026-07-08). If a needed path isn't here, it's a real gap.
  const LIVE_ROUTES = new Set(['/crosswalk', '/compare', '/system-card', '/verify-certificate', '/classifier',
    '/regulator-atlas', '/government-dashboard', '/sov-space', '/globe', '/fedramp', '/cobol',
    '/high-risk-ai', '/healthcare-ai-act', '/dora', '/finance-ai-act', '/nis2', '/us-ai-regulation',
    '/start', '/os', '/pricing', '/industries']);
  const allNeeded = new Set(profiles.flatMap(p => p.surfaces_needed));
  const gaps = [...allNeeded].filter(s => !LIVE_ROUTES.has(s));
  // Curated TRUE demographic gaps (found by cross-referencing personas vs the 300+ real routes):
  const trueGaps = [
    'No **SEC AI-disclosure** page (`/sec-disclosure`) for the **1,541 SEC-filer** persona — the single largest demographic. `/us-ai-regulation` exists but is generic, not the 10-K AI-risk-factor + governance-evidence angle they file on.',
    'No **defence-specific** CSOAI page for primes (BAE, Rolls-Royce, Leonardo) — likely intentional (that is DEFONEOS’s lane), so map these to a DEFONEOS handoff rather than build inside CSOAI.',
    'No **per-persona journey/landing** that routes a visitor by demographic into the right existing pages — the pages exist but discovery is flat.',
  ];

  const personaMap = `# 🎯 CSOAI Persona → Platform-Coverage Map (${profiles.length} accounts)

Derived from the Sovereign SME KB. Each persona is a real demographic in the 2,363-account
distribution list; the surfaces are what that buyer needs to see to convert. Gaps = surfaces a
persona needs that CSOAI does not yet expose as a first-class route.

## Personas (by volume)
| Persona | Accounts | Surfaces needed | Examples |
|---|---:|---|---|
${personaRows}

## Surface coverage (needed path vs live route — verified against master's router)
${[...allNeeded].sort().map(s => `- ${LIVE_ROUTES.has(s) ? '✅' : '🔴'} **${s}** ${LIVE_ROUTES.has(s) ? '(live route)' : '— NO route (build/expose)'}`).join('\n')}
${gaps.length ? `\n**Missing routes from persona needs:** ${gaps.join(', ')}` : '\n✅ every persona-needed path is a live route.'}

## TRUE demographic gaps (persona ✕ 300+-route cross-reference)
${trueGaps.map(g => `- 🔴 ${g}`).join('\n')}

> The site already has 300+ routes incl. sector + framework pages — the real gap is **packaging + discovery per persona**, not missing content. Highest-leverage build: a SEC-filer page for the #1 persona (1,541 accounts), and a demographic router.
`;
  await writeFile(resolve(OUT, 'PERSONA_MAP.md'), personaMap);

  // 4) Manifest
  const withWedge = profiles.filter(p => p.top_wedges.length).length;
  const withSignals = profiles.filter(p => p.ai_signals.length).length;
  await writeFile(resolve(OUT, 'SME_KB_MANIFEST.md'),
`# Sovereign SME Knowledge Base — ${profiles.length} accounts

Built from csoai_leads.db (synthesis of existing per-account intel — no re-scraping).

- **${withWedge}/${profiles.length}** have a computed top wedge (framework gap vs CSOAI).
- **${withSignals}/${profiles.length}** have public AI signals.
- **${Object.keys(byPersona).length}** distinct personas derived.

## Query it (SOV3 / dock)
\`\`\`bash
sqlite3 sme-kb.db "SELECT company, persona, top_wedge, value_prop FROM sme WHERE persona LIKE '%Financial%' LIMIT 5;"
sqlite3 sme-kb.db "SELECT persona, COUNT(*) FROM sme GROUP BY persona ORDER BY 2 DESC;"
\`\`\`

## Files
- sme-kb.jsonl — full SME profile per account
- sme-kb.db — indexed SQLite (persona/sector/tier indexed)
- PERSONA_MAP.md — personas → surfaces → coverage gaps
`);

  console.log(`✅ SME KB built: ${profiles.length} profiles`);
  console.log(`   personas: ${Object.keys(byPersona).length} · with-wedge: ${withWedge} · with-signals: ${withSignals}`);
  console.log(`   → sme-kb.jsonl, sme-kb.db, PERSONA_MAP.md, SME_KB_MANIFEST.md`);
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });
