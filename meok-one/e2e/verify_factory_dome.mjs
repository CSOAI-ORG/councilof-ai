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

// "describe your AI" → conjure (may hit the cloud LLM, a few seconds — poll until resolved)
await page.fill('#facDesc', 'a tough fitness coach who pushes me to hit my goals');
await page.click('#facConjure');
await page.waitForFunction(
  () => /conjured|shaped/.test(document.querySelector('#facMsg')?.textContent || ''),
  { timeout: 20000 });
const arch = await page.inputValue('#facArch');
must(['challenger', 'strategist'].includes(arch), `Conjure maps "fitness coach" → coach-like archetype (got ${arch})`);
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
// minted character must carry its real archetype emoji (not the 🧬 fallback)
const selText = await page.$eval('#charSel', s => s.options[s.selectedIndex].textContent);
must(!selText.includes('🧬'), `New AI shows its archetype emoji, not 🧬 fallback (${selText})`);
const previewEmoji = await page.evaluate(async () => {
  const d = await (await fetch('/api/factory/preview?archetype=guardian&care_style=gentle')).json();
  return d.character.emoji;   // top-level emoji must now exist
});
must(previewEmoji === '🛡️', `mint() exposes top-level emoji (${previewEmoji})`);

// confirm it persisted to the user's roster via the API (token-scoped)
const apiCount = await page.evaluate(async () => {
  const t = localStorage.getItem('meok_token');
  const d = await (await fetch('/api/characters', { headers: t ? { Authorization: 'Bearer ' + t } : {} })).json();
  return (d.characters || []).filter(c => String(c.id || '').startsWith('gen_')).length;
});
must(apiCount >= 1, `Creation persisted to roster (${apiCount} gen_ character(s))`);

// ---------- per-character detail card ----------
await page.click('#detBtn');
await page.waitForSelector('#detModal.on', { timeout: 3000 });
await page.waitForFunction(() => document.querySelector('#detJourney')?.children.length > 0, { timeout: 3000 }).catch(() => {});
const detName = (await page.textContent('#detName'))?.trim();
must(detName && detName !== '…' && detName !== "couldn't load", `Detail card loads a name (${detName})`);
const detTraits = await page.$$eval('#detTraits span', e => e.length);
must(detTraits >= 1, `Detail card shows trait chips (${detTraits})`);
const detStory = (await page.textContent('#detStory'))?.trim();
must(!!detStory, 'Detail card shows a backstory/tagline');
// gamification: ownership badge + the egg→sovereign emergence journey
const ownedBadge = (await page.textContent('#detBadge'))?.trim();
must(/Yours forever/.test(ownedBadge || ''), `Detail card shows ownership badge (${ownedBadge})`);
const journeyStages = await page.$$eval('#detJourney span', e => e.filter(x => x.textContent !== '›').length);
must(journeyStages >= 6, `Detail card shows the egg→sovereign journey (${journeyStages} stages)`);
await page.click('#detX');
await page.waitForTimeout(200);
const ariaOk = await page.evaluate(async () => {
  const d = await (await fetch('/api/character?id=aria')).json();
  const c = d.character || {};
  return !!(c.personality_traits && c.personality_traits.length && c.backstory);
});
must(ariaOk, 'API /api/character returns full seed record (traits + backstory)');

// ---------- distinct per-character voices ----------
// switch across several seeds and confirm the loaded VOICE_SPEC actually varies
const specs = [];
for (const id of ['aria', 'sage', 'atlas', 'nova']) {
  const got = await page.evaluate(async (cid) => {
    const s = document.querySelector('#charSel');
    if (![...s.options].some(o => o.value === cid)) return null;
    s.value = cid; s.dispatchEvent(new Event('change'));
    await new Promise(r => setTimeout(r, 450));
    const V = (typeof VOICE_SPEC !== 'undefined') ? VOICE_SPEC : {};
    return { id: cid, pitch: V.pitch, rate: V.rate, voice: V.voice };
  }, id);
  if (got) specs.push(got);
}
const distinctPitch = new Set(specs.map(s => `${s.pitch}|${s.rate}`)).size;
must(distinctPitch >= 2, `Characters load DISTINCT voice specs (${specs.map(s => s.id + ':' + s.pitch + '/' + s.rate).join(', ')})`);
must(specs.every(s => typeof s.pitch === 'number'), 'VOICE_SPEC.pitch is wired on switch');

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

// seed pins are tinted by archetype (a non-mine dot has an inline border color)
const tinted = await page.$$eval('.pin:not(.mine):not(.you) .dot',
  els => els.some(e => e.style.borderColor && e.style.borderColor !== ''));
must(tinted, 'Seed pins are tinted by archetype color');

// "fly to my region" control exists and fires without error
const flyMe = await page.locator('#flyMe').count();
must(flyMe === 1, '"Fly to my region" control present');
if (flyMe) { await page.click('#flyMe'); await page.waitForTimeout(600); }

// living DOME: agents gently wander + show ambient speech bubbles
const life = await page.evaluate(async () => {
  if (typeof AGENTS === 'undefined' || !AGENTS.length) return { moved: false, sayOn: false };
  const a = AGENTS[0], p0 = a.marker.getLngLat();
  let sayOn = false;
  for (let i = 0; i < 16; i++) {   // poll ~8s — catch a bubble somewhere in the cycle
    await new Promise(r => setTimeout(r, 500));
    if (document.querySelector('.pin .say.on')) sayOn = true;
  }
  const p1 = a.marker.getLngLat();
  return { moved: (p0.lng !== p1.lng || p0.lat !== p1.lat), sayOn };
});
must(life.moved, 'Living DOME: agents gently wander (marker LngLat changes)');
must(life.sayOn, 'Living DOME: agents show ambient speech bubbles');

ok(errs.length === 0, `Console errors: ${errs.length}${errs.length ? ' → ' + errs.slice(0, 3).join(' | ') : ''}`);
if (errs.length) fails++;

await browser.close();
console.log(fails ? `\n❌ ${fails} check(s) failed` : `\n✅ ALL factory+dome checks passed`);
process.exit(fails ? 1 : 0);
