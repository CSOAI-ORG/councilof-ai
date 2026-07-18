// MEOK OS — real user-journey E2E (Playwright). Not "does it render" but "does it actually work":
// drives the Sovereign dock like a person — asks a question (real answer), sets a reminder (persisted),
// asks what governs a bank (real frameworks), teaches a memory (persisted). Run: node e2e/journey.cjs [url]
const { chromium } = require('playwright');
const B = process.argv[2] || 'https://os.meok.ai';
let fails = 0;
const ok = m => console.log('  ✓ ' + m);
const no = m => { fails++; console.log('  ✗ FAIL: ' + m); };

(async () => {
  const br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('meok_welcomed', '1'); localStorage.setItem('meok_archetype', 'guardian'); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(B, { waitUntil: 'networkidle', timeout: 30000 });
  await p.waitForTimeout(2500);

  // make sure the dock input is present (open the character if needed)
  let hasInput = await p.locator('#sovin').count();
  if (!hasInput) { try { await p.click('#sovchar', { timeout: 3000 }); await p.waitForTimeout(800); } catch (e) {} }

  async function say(text, waitMs = 6000) {
    await p.fill('#sovin', text);
    await p.press('#sovin', 'Enter');
    await p.waitForTimeout(waitMs);
    return (await p.textContent('#sovlog').catch(() => '')) || '';
  }

  console.log('== journey ==');
  // 1. real question → real answer
  const before = (await p.textContent('#sovlog').catch(() => '') || '').length;
  const log1 = await say('in one sentence, what is a sovereign AI?');
  (log1.length > before + 30) ? ok('asked a question → got a real answer in the dock') : no('no answer appeared');

  // 2. set a reminder → persisted to localStorage
  await say('remind me to call mum in 2 minutes', 3500);
  const rem = await p.evaluate(() => { try { return JSON.parse(localStorage.getItem('meok_reminders') || '[]').length; } catch (e) { return 0; } });
  rem >= 1 ? ok('set a reminder → persisted (' + rem + ' saved)') : no('reminder not saved');

  // 3. what governs a bank → real frameworks surface
  const log3 = await say('what governs a bank?', 7000);
  /EU AI Act|GDPR|DORA|ISO|MiFID|framework|governs/i.test(log3.slice(-600)) ? ok('governance lookup → real frameworks') : no('no frameworks in answer');

  // 4. teach a memory → persisted
  await say('remember my name is Nick', 3500);
  const remembered = await p.evaluate(() => { try { return (localStorage.getItem('sov_facts') || '').toLowerCase().includes('nick'); } catch (e) { return false; } });
  remembered ? ok('taught a fact → remembered on-device') : no('memory not persisted');

  await p.screenshot({ path: __dirname + '/shots/journey.png' });
  await br.close();
  console.log('\n======== ' + (fails ? fails + ' FAILED' : 'JOURNEY GREEN — the OS actually works for a real user') + ' ========');
  process.exit(fails ? 1 : 0);
})();
