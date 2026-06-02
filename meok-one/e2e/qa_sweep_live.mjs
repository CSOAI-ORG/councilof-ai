// Live QA sweep of the DEPLOYED meok-one OS — click every tab, open every modal, watch the
// console, hit every API. Catches real faults on the real VM. Run: node qa_sweep_live.mjs
// Override target with QA_BASE=... (defaults to the live VM).
import { chromium } from '@playwright/test';

const BASE = process.env.QA_BASE || 'https://meok-one.35.242.143.249.sslip.io';
const faults = [];
const ok = (c, m) => { console.log(`${c ? '✅' : '❌'} ${m}`); if (!c) faults.push(m); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const consoleErrs = [];
page.on('console', m => { if (m.type() === 'error') consoleErrs.push(m.text()); });
page.on('pageerror', e => consoleErrs.push('pageerror: ' + e.message));

console.log(`\n🔎 QA sweep → ${BASE}\n`);

// 0) load the OS FIRST so relative fetches resolve against the live origin
await page.goto(`${BASE}/os.html`, { waitUntil: 'networkidle' }).catch(e => ok(false, `os.html load — ${e.message}`));
await page.waitForTimeout(1500);
ok(await page.locator('#charSel').count() > 0, 'OS loads (character window present)');

// 1) APIs — every endpoint returns sane data
const apis = [
  ['/api/health', d => d.ok === true],
  ['/api/characters', d => (d.characters || []).length >= 27],
  ['/api/character?id=aria', d => d.character?.emoji && d.character?.personality_traits?.length],
  ['/api/governance', d => d.council?.byzantine_f === 3 && d.council?.safety_lenses?.length === 5],
  ['/api/marketplace', d => d.split?.creator === 70],
  ['/api/sbt/status', d => d.program_id && d.live === false],
  ['/api/sbt/mint-intent?id=aria', d => d.sbt_type === 'CharacterGenesis' && d.minted === false],
  ['/api/vitals?character=aria', d => typeof d.bond === 'number'],
  ['/api/archetypes', d => (d.archetypes || []).length >= 8],
  ['/api/tools', d => d.total_tools > 0],
];
for (const [path, check] of apis) {
  try {
    const d = await page.evaluate(async (p) => (await fetch(p)).json(), path);
    ok(check(d), `API ${path}`);
  } catch (e) { ok(false, `API ${path} — ${e.message}`); }
}

// 3) every product tab opens without error (tabs are unlabeled buttons in #prodtabs)
const btns = page.locator('#prodtabs button');
const n = await btns.count();
ok(n >= 5, `product tabs present (${n})`);
for (let i = 0; i < n; i++) {
  try {
    const label = (await btns.nth(i).innerText()).replace(/\s+/g, ' ').trim();
    await btns.nth(i).click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    ok(true, `tab "${label}" opened`);
  } catch (e) { ok(false, `tab #${i + 1} — ${e.message}`); }
}

// 4) key modals open (close each by its OWN close button before the next)
for (const [btn, modalId, closeId, name] of [
  ['#facBtn', '#facModal', '#facX', 'Factory'],
  ['#detBtn', '#detModal', '#detX', 'Detail card'],
]) {
  try {
    await page.locator(btn).first().click({ timeout: 4000 });
    await page.waitForSelector(`${modalId}.on`, { timeout: 3000 });
    ok(true, `${name} modal opens`);
    await page.locator(closeId).click({ timeout: 2000 }).catch(() => {});
    await page.waitForSelector(`${modalId}:not(.on)`, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(200);
  } catch (e) { ok(false, `${name} modal — ${e.message}`); }
}

// 5) console hygiene
ok(consoleErrs.length === 0, `console clean (${consoleErrs.length} errors${consoleErrs.length ? ': ' + consoleErrs.slice(0, 4).join(' | ') : ''})`);

await browser.close();
console.log(faults.length ? `\n❌ ${faults.length} fault(s):\n - ${faults.join('\n - ')}` : `\n✅ QA SWEEP CLEAN — no faults`);
process.exit(faults.length ? 1 : 0);
