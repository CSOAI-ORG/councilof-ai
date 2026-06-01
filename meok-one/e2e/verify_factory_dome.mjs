// Eyes-on verification of the new Character Factory (describe→conjure→live-preview)
// + DOME-world integration (your creation shows as a gold pin with a "Make this my AI" CTA).
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:4173';
const ok = (c, m) => console.log(`${c ? '✅' : '❌'} ${m}`);
let fails = 0;
const must = (c, m) => { ok(c, m); if (!c) fails++; };

const browser = await chromium.launch();
const ctx = await browser.newContext();   // one context → localStorage (token) shared os↔dome
const page = await ctx.newPage();
const errs = [];
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

// ---------- OS / Character Factory ----------
await page.goto(`${BASE}/os.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);   // let anon token bootstrap

await page.click('#facBtn');
await page.waitForSelector('#facModal.on', { timeout: 3000 });
await page.waitForTimeout(600);   // archetypes fill + first preview
const prevVisible = await page.isVisible('#facPrev');
must(prevVisible, 'Factory live preview renders on open');
const prevName0 = (await page.textContent('#facPrevName'))?.trim();
must(!!prevName0, `Preview shows a name (${prevName0})`);

// change archetype → preview should update the egg emoji
await page.selectOption('#facArch', 'guardian');
await page.waitForTimeout(450);
const egg = (await page.textContent('#facEgg'))?.trim();
must(egg === '🛡️', `Preview egg updates with archetype (got ${egg})`);

// "describe your AI" → conjure
await page.fill('#facDesc', 'a tough fitness coach who pushes me to hit my goals');
await page.click('#facConjure');
await page.waitForTimeout(700);
const arch = await page.inputValue('#facArch');
must(arch === 'challenger', `Conjure maps "fitness coach/push/goals" → challenger (got ${arch})`);
const facMsg = (await page.textContent('#facMsg'))?.trim();
must(/conjured|shaped/.test(facMsg || ''), `Conjure status shown (${facMsg})`);

// count options before create, then create
const before = await page.$$eval('#charSel option', o => o.length);
await page.click('#facCreate');
await page.waitForTimeout(900);
const after = await page.$$eval('#charSel option', o => o.length);
must(after === before + 1, `Create adds the new AI to charSel (${before}→${after})`);
const sel = await page.inputValue('#charSel');
must(/^gen_/.test(sel), `New AI becomes the active character (${sel})`);

// confirm it persisted to the user's roster via the API (token-scoped)
const apiCount = await page.evaluate(async () => {
  const t = localStorage.getItem('meok_token');
  const d = await (await fetch('/api/characters', { headers: t ? { Authorization: 'Bearer ' + t } : {} })).json();
  return (d.characters || []).filter(c => String(c.id || '').startsWith('gen_')).length;
});
must(apiCount >= 1, `Creation persisted to roster (${apiCount} gen_ character(s))`);

// ---------- DOME world: the creation lives there as a gold pin ----------
await page.goto(`${BASE}/dome.html`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);   // boot gate (load/idle/timeout) + markers
const minePins = await page.$$eval('.pin.mine', els => els.length);
must(minePins >= 1, `DOME shows your creation with a gold "mine" ring (${minePins})`);
const yoursLegend = await page.locator('text=/yours/').count();
must(yoursLegend >= 1, 'DOME legend shows "· N yours ✨"');

// open a mine-pin popup → the "Make this my AI" CTA exists
await page.click('.pin.mine');
await page.waitForTimeout(500);
const adopt = await page.locator('.dome-adopt').count();
must(adopt >= 1, 'Pin popup has a "✨ Make this my AI" button');

ok(errs.length === 0, `Console errors: ${errs.length}${errs.length ? ' → ' + errs.slice(0, 3).join(' | ') : ''}`);
if (errs.length) fails++;

await browser.close();
console.log(fails ? `\n❌ ${fails} check(s) failed` : `\n✅ ALL factory+dome checks passed`);
process.exit(fails ? 1 : 0);
