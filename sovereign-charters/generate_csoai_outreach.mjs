#!/usr/bin/env node
/**
 * Stage personalized CSOAI outreach for all named accounts in csoai_leads.db.
 * DRAFTS ONLY — writes staged emails for review. Does NOT send.
 * Personalizes on real public data per lead: company, jurisdiction, industry,
 * public_ai_signals, compliance_posture, and the pre-computed outreach_angle.
 *
 * Honest gaps (NOT solved here): no contact emails in the DB (need enrichment),
 * sending is owner-gated, and 2k+ cold sends need domain warmup + GDPR/PECR care.
 *
 * Usage:  node sovereign-charters/generate_csoai_outreach.mjs
 * Output: sovereign-charters/csoai-outreach/  (drafts.jsonl + MANIFEST.md + samples/)
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB = resolve(__dirname, 'csoai_leads.db');
const OUT = resolve(__dirname, 'csoai-outreach');

// Read all leads via the sqlite3 CLI (portable, no native module needed).
function loadLeads() {
  const rows = execSync(
    `sqlite3 -json "${DB}" "SELECT lead_id, company_legal_name, jurisdiction, domain, industry_charter, tier, report_json FROM leads"`,
    { maxBuffer: 256 * 1024 * 1024 }
  ).toString();
  return JSON.parse(rows);
}

// jurisdiction → the regulation that gives CSOAI the sharpest hook
const REG = (j = '') => {
  j = j.toLowerCase();
  if (j.includes('eu') || j.includes('fr') || j.includes('de') || j.includes('se')) return { law: 'the EU AI Act (GPAI + Article 50 transparency enforceable 2 Aug 2026)', body: 'EU AI Act' };
  if (j.includes('uk') || j.includes('regulator')) return { law: 'the UK AI framework and evolving AI Bill', body: 'UK AI governance' };
  if (j.includes('sec') || j.includes('us')) return { law: 'SEC AI-disclosure expectations, NIST AI RMF and ISO 42001', body: 'US AI governance (NIST/SEC)' };
  return { law: 'the EU AI Act, NIST AI RMF and ISO 42001', body: 'AI governance' };
};

function draft(lead) {
  let r = {};
  try { r = JSON.parse(lead.report_json || '{}'); } catch {}
  const co = lead.company_legal_name || r.company || 'your organisation';
  const reg = REG(lead.jurisdiction);
  const angle = (r.outreach_angle && String(r.outreach_angle).trim()) || '';
  const signals = Array.isArray(r.public_ai_signals) ? r.public_ai_signals.filter(Boolean) : [];
  const signalLine = signals.length ? `We saw ${co}'s public AI activity (${signals.slice(0, 2).join('; ')}).` : '';
  let posture = '';
  const cp = r.compliance_posture;
  if (cp && typeof cp === 'object') {
    const vals = Object.entries(cp).filter(([k]) => k !== 'charter_unknown');
    const covered = vals.filter(([, v]) => Number(v) > 0).length;
    posture = covered === 0
      ? ' We found little public evidence of formal AI-governance coverage yet — a gap CSOAI closes quickly.'
      : ` Public signals suggest partial coverage (~${covered}/${vals.length} frameworks) — the crosswalk fills the rest.`;
  } else if (typeof cp === 'string' && cp !== 'unknown') {
    posture = ` Your current posture reads as: ${cp}.`;
  }

  const subject = angle
    ? `${co}: ${String(angle).slice(0, 60)}`
    : `${co} × ${reg.body}: a signed compliance shortcut`;

  const body =
`Hello ${co} governance team,

${signalLine}${posture}

As you prepare for ${reg.law}, most of the obligations overlap. CSOAI is the independent, open-source AI-governance layer that lets you comply once and evidence everywhere:

- One crosswalk maps 1,686 controls across 26 frameworks (EU AI Act, NIST AI RMF, ISO 42001, DORA, NIS2...): https://csoai.org/crosswalk
- Every governed action is Ed25519-signed and offline-verifiable — an auditor checks it in a browser, no vendor account.
- Free open-source core; a signed System Card + risk classification, honest vs Vanta/Drata/Credo AI/OneTrust: https://csoai.org/compare
${angle ? `\nWhy you specifically: ${angle}\n` : ''}
Worth a 15-minute look, or a signed System Card for one of your AI systems?

— Nicholas Templeman, CSOAI (Council for the Safety of AI) · CSOAI Ltd, UK 16939677
csoai.org · this is a one-off note on legitimate B2B interest; reply STOP and you won't hear from me again.`;

  return { lead_id: lead.lead_id, company: co, domain: lead.domain || null, tier: lead.tier, jurisdiction: lead.jurisdiction, subject, body, contact_email: null /* NEEDS ENRICHMENT */ };
}

async function main() {
  const leads = loadLeads();
  await mkdir(resolve(OUT, 'samples'), { recursive: true });
  const drafts = leads.map(draft);
  // JSONL — the machine-readable staged batch
  await writeFile(resolve(OUT, 'drafts.jsonl'), drafts.map((d) => JSON.stringify(d)).join('\n') + '\n');
  // readable samples: 3 per tier
  const byTier = {};
  for (const d of drafts) (byTier[d.tier] ||= []).push(d);
  for (const t of Object.keys(byTier).sort((a, b) => a - b)) {
    const s = byTier[t].slice(0, 3).map((d) => `TO: ${d.company} (${d.domain || 'domain unknown'})\nSUBJECT: ${d.subject}\n\n${d.body}\n${'—'.repeat(40)}`).join('\n\n');
    await writeFile(resolve(OUT, 'samples', `tier-${t}.txt`), s);
  }
  const counts = Object.entries(byTier).map(([t, a]) => `- tier ${t}: ${a.length}`).sort().join('\n');
  const withDomain = drafts.filter((d) => d.domain && d.domain !== 'unknown').length;
  await writeFile(resolve(OUT, 'MANIFEST.md'),
`# CSOAI Outreach — staged drafts (${drafts.length})

Generated ${new Date ? '' : ''}from sovereign-charters/csoai_leads.db. DRAFTS ONLY — not sent.

## Counts by tier
${counts}

## Contactability (honest)
- ${withDomain}/${drafts.length} have a domain; **0 have a verified contact email** (public intel only).
- To send you must first: (1) enrich contact emails (owner-gated tool), (2) warm a sending domain
  (Postal/Mailcow — can't blast 2k cold), (3) approve per batch (GDPR/PECR legitimate-interest, opt-out honored).

## Recommended send order
tier 0-3 first (regulators, Fortune, EU — highest value, ~110 accounts), hand-check each; then tier 5-8;
tier 9 (SEC bulk, 2023) last and in warmed batches of ~30/day.

## Files
- drafts.jsonl — all ${drafts.length}, machine-readable {lead_id, company, domain, tier, subject, body, contact_email:null}
- samples/tier-*.txt — 3 readable examples per tier
`);
  console.log(`Staged ${drafts.length} drafts → ${OUT}`);
  console.log(`  with domain: ${withDomain} · with contact email: 0 (need enrichment)`);
}
main().catch((e) => { console.error(e); process.exit(1); });
