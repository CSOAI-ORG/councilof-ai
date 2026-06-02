// Eyes-on verification of the /hud gaming overlay skin.
import { chromium } from '@playwright/test';
const BASE = process.env.QA_BASE || 'http://localhost:4173';
let fails = 0; const ok = (c, m) => { console.log(`${c ? '✅' : '❌'} ${m}`); if (!c) fails++; };
const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
const errs = []; p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));

await p.goto(`${BASE}/hud`, { waitUntil: 'networkidle' });
await p.waitForTimeout(1800);   // anon token + characters + first render

// minimap
await p.waitForFunction(() => document.querySelectorAll('.blip:not(.you)').length > 0, { timeout: 6000 }).catch(() => {});
const blips = await p.$$eval('.blip:not(.you)', e => e.length);
ok(blips >= 5, `minimap shows character blips (${blips})`);
ok(await p.locator('#youBlip').count() === 1, 'minimap has the "you" marker (top-left)');

// right rail — character card
const nm = (await p.textContent('#cName'))?.trim();
ok(nm && nm !== '…', `character card shows a name (${nm})`);
const vit = (await p.textContent('#cVit'))?.trim();
ok(/L\d|💜/.test(vit || ''), `character card shows vitals (${vit})`);

// action bar (bottom-center)
const slots = await p.$$eval('.slot', e => e.length);
ok(slots === 7, `action bar has 7 WoW slots incl. 👁 perceive (${slots})`);
// 👁 perceive slot present + clicking it is wired (gracefully handles no screen-capture in headless)
const seeSlot = await p.$$eval('.slot', e => e.some(s => s.dataset.act === 'see'));
ok(seeSlot, '👁 "see my screen" slot present');

// chat — gated reply lands in the HUD
await p.fill('#in', 'hello there');
await p.click('#sendB');
await p.waitForFunction(() => {
  const ms = document.querySelectorAll('#msgs .m.ai');
  return ms.length && ms[ms.length - 1].textContent && ms[ms.length - 1].textContent !== '…';
}, { timeout: 30000 }).catch(() => {});
const reply = await p.$$eval('#msgs .m.ai', e => e.length ? e[e.length - 1].textContent : '');
ok(reply && reply !== '…', `AI replies in the HUD chat ("${(reply || '').slice(0, 44)}")`);

// minimap → select a character
const got = await p.evaluate(async () => {
  const blip = document.querySelector('.blip:not(.you):not(.on)');
  if (!blip) return false; blip.click();
  await new Promise(r => setTimeout(r, 900));
  return !!document.querySelector('.blip.on');
});
ok(got, 'clicking a minimap blip focuses that character');

ok(errs.length === 0, `console clean (${errs.length}${errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''})`);
await b.close();
console.log(fails ? `\n❌ ${fails} HUD check(s) failed` : `\n✅ HUD overlay skin OK`);
process.exit(fails ? 1 : 0);
