#!/usr/bin/env node
/**
 * sme_query.mjs — the query seam between the SME KB and SOV3 / the Sovereign dock.
 *
 * Lets the live dock (SovereignSpot / /api/chat) ground any answer about a real account
 * in the SME KB: "Tell me about JPMorgan" -> persona, buyer, governance gap, wedge,
 * value prop, and talking points — the expert knowledge, per account.
 *
 * Use as CLI:   node sme_query.mjs "JPMorgan"        (company / domain / persona / free text)
 * Use as lib:   import { smeContext } from './sme_query.mjs'; const brief = await smeContext('NVIDIA')
 *
 * SOV3 wire-in (when the server is up on :3101): expose this as an MCP tool `sme_lookup`
 * or call smeContext() inside the /api/chat handler to prepend expert context to the prompt.
 */
import { execFileSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KBDB = resolve(__dirname, 'csoai-outreach', 'sme-kb.db');

function q(sql) {
  try { return JSON.parse(execFileSync('sqlite3', ['-json', KBDB, sql], { maxBuffer: 64 * 1024 * 1024 }).toString() || '[]'); }
  catch { return []; }
}
const esc = (s) => String(s).replace(/'/g, "''");

/** Return an expert brief for a company/domain/persona/free-text query, or null. */
export async function smeContext(query) {
  const term = esc(String(query || '').trim());
  if (!term) return null;
  // 1) exact-ish company or domain match; 2) persona match; 3) fuzzy company LIKE
  let rows = q(`SELECT * FROM sme WHERE company LIKE '%${term}%' OR domain LIKE '%${term}%' ORDER BY tier LIMIT 1`);
  if (!rows.length) rows = q(`SELECT * FROM sme WHERE persona LIKE '%${term}%' ORDER BY tier LIMIT 1`);
  if (!rows.length) return null;
  const r = rows[0];
  return {
    company: r.company, persona: r.persona, buyer: r.buyer,
    jurisdiction: r.jurisdiction, sector: r.sector, coverage_pct: r.coverage_pct,
    applicable_regs: r.applicable_regs, top_wedge: r.top_wedge,
    gap: r.gap_summary, value_prop: r.value_prop,
    talking_points: (r.talking_points || '').split(' | ').filter(Boolean),
    surfaces: (r.surfaces || '').split(',').filter(Boolean),
  };
}

/** Persona-level rollup — e.g. "how do we talk to financial services?" */
export async function personaBrief(persona) {
  const rows = q(`SELECT COUNT(*) n, GROUP_CONCAT(DISTINCT surfaces) surf FROM sme WHERE persona LIKE '%${esc(persona)}%'`);
  return rows[0] || null;
}

// CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = process.argv.slice(2).join(' ');
  if (!arg) { console.log('usage: node sme_query.mjs "<company | domain | persona>"'); process.exit(0); }
  const brief = await smeContext(arg);
  if (!brief) { console.log(`No SME record for "${arg}". Try a company name or persona (e.g. "Financial services").`); process.exit(0); }
  console.log(`\n🧠 SME BRIEF — ${brief.company}`);
  console.log(`   persona:   ${brief.persona}  (buyer: ${brief.buyer})`);
  console.log(`   sector:    ${brief.sector} · ${brief.jurisdiction} · coverage ${brief.coverage_pct}%`);
  console.log(`   regs:      ${brief.applicable_regs}`);
  console.log(`   wedge:     ${brief.top_wedge || '(baseline)'}`);
  console.log(`   gap:       ${brief.gap}`);
  console.log(`   pitch:     ${brief.value_prop}`);
  console.log(`   talking points:`); brief.talking_points.forEach((t) => console.log(`     • ${t}`));
  console.log(`   route them to: ${brief.surfaces.join(', ')}\n`);
}
