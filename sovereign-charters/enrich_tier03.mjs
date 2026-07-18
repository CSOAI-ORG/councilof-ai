#!/usr/bin/env node
/**
 * (A)+(C) — Build the tier 0-3 enrichment worksheet AND attempt contact-finding
 * from PUBLIC pages only (no paid API, no login, no ToS violation — just reading
 * the contact/about pages orgs publish). Fills what it can; leaves the rest for
 * a human or an enrichment tool. DRAFTS ONLY — nothing is sent.
 *
 * Usage:  node sovereign-charters/enrich_tier03.mjs
 * In:     sovereign-charters/csoai-outreach/drafts.jsonl
 * Out:    csoai-outreach/tier0-3-worksheet.csv  +  tier0-3-worksheet.md
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(__dirname, 'csoai-outreach');
const PATHS = ['', '/contact', '/contact-us', '/about', '/about-us', '/contact.html'];
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const JUNK = /(example|sentry|wixpress|\.png|\.jpg|\.gif|\.webp|\.svg|@sentry|@2x|u003e|placeholder|your-?email|name@)/i;

async function fetchText(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 CSOAI-research' } });
    clearTimeout(t);
    if (!r.ok) return '';
    return (await r.text()).slice(0, 400000);
  } catch { return ''; }
}

async function enrich(domain) {
  if (!domain || domain === 'unknown') return { emails: [], contactPage: '' };
  const base = `https://${domain.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;
  const found = new Set(); let contactPage = '';
  for (const p of PATHS) {
    const html = await fetchText(base + p);
    if (!html) continue;
    if (p && /contact/i.test(p) && html.length > 500 && !contactPage) contactPage = base + p;
    for (const m of html.match(EMAIL_RE) || []) {
      const e = m.toLowerCase();
      if (!JUNK.test(e) && e.split('@')[1] && e.length < 60) found.add(e);
    }
    if (found.size >= 4) break; // enough
  }
  // prefer role addresses on the org's own domain
  const own = [...found].filter((e) => e.endsWith('@' + domain) || e.includes(domain.split('.')[0]));
  const ranked = [...new Set([...own, ...found])];
  return { emails: ranked.slice(0, 4), contactPage };
}

async function pool(items, n, fn) {
  const out = []; let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const ti = args.indexOf('--tier');
  const [tMin, tMax] = (ti >= 0 ? args[ti + 1] : '0-3').split('-').map(Number);
  const TAG = `tier${tMin}-${tMax}`;
  const lines = (await readFile(resolve(DIR, 'drafts.jsonl'), 'utf8')).trim().split('\n');
  const all = lines.map((l) => JSON.parse(l));
  const t03 = all.filter((d) => Number(d.tier) >= tMin && Number(d.tier) <= tMax);
  console.log(`${TAG} accounts: ${t03.length}. Enriching from public pages (this makes ~${t03.length} polite fetches)...`);

  const results = await pool(t03, 6, async (d, k) => {
    const { emails, contactPage } = await enrich(d.domain);
    if ((k + 1) % 20 === 0) console.log(`  ...${k + 1}/${t03.length}`);
    return { ...d, found_emails: emails, contact_page: contactPage, guess: d.domain && d.domain !== 'unknown' ? `info@${d.domain}` : '', linkedin: d.company ? `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(d.company)}` : '' };
  });

  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const header = 'tier,company,domain,jurisdiction,found_email_1,found_email_2,guessed_email,contact_page,linkedin,subject,lead_id';
  const rows = results.sort((a, b) => a.tier - b.tier).map((r) =>
    [r.tier, esc(r.company), r.domain || '', r.jurisdiction || '', r.found_emails[0] || '', r.found_emails[1] || '', r.guess, r.contact_page || '', r.linkedin, esc(r.subject), r.lead_id].join(','));
  await writeFile(resolve(DIR, `${TAG}-worksheet.csv`), header + '\n' + rows.join('\n') + '\n');

  const withEmail = results.filter((r) => r.found_emails.length).length;
  const md = `# Tier 0-3 Enrichment Worksheet (${results.length} high-value accounts)\n\n` +
    `Public-page enrichment run. **${withEmail}/${results.length} have a public email found**; the rest need a tool or manual lookup (guessed \`info@domain\` + contact page + LinkedIn provided). DRAFTS ONLY — nothing sent.\n\n` +
    `| Tier | Company | Domain | Found email | Guess | Contact page |\n|---|---|---|---|---|---|\n` +
    results.sort((a, b) => a.tier - b.tier).map((r) => `| ${r.tier} | ${r.company} | ${r.domain || '—'} | ${r.found_emails[0] || '—'} | ${r.guess || '—'} | ${r.contact_page ? '✓' : '—'} |`).join('\n') +
    `\n\nFull drafts: \`drafts.jsonl\` (match by lead_id). CSV: \`tier0-3-worksheet.csv\`.\n`;
  await writeFile(resolve(DIR, `${TAG}-worksheet.md`), md);
  console.log(`\nWrote tier0-3-worksheet.csv + .md — ${withEmail}/${results.length} with a public email found.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
