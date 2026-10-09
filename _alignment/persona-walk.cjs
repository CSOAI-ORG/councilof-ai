// persona-walk.cjs — end-user inspection as 3 personas on the live estate (pod-side Playwright)
const { chromium } = require('/workspace/ux-gauntlet/node_modules/playwright');
const OUT = '/workspace/audit-20261006/persona-walk-20261007';
require('fs').mkdirSync(OUT, { recursive: true });
const out = {};
const reHas = (t, re) => re.test(t);

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();

  async function visit(name, url) {
    try {
      await pg.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await pg.waitForTimeout(1500);
      const t = await pg.evaluate(() => document.body ? document.body.innerText : '');
      await pg.screenshot({ path: `${OUT}/${name}-1440.jpg`, quality: 70, type: 'jpeg' });
      return t;
    } catch (e) { return 'ERR:' + e.message.slice(0, 80); }
  }

  // PERSONA A — BUYER
  let t = await visit('A1-home', 'https://councilof.ai/');
  out['A1_home'] = {
    title: await pg.title(),
    promoUrgency: reHas(t, /0\.01|until 11|11 Oct/i),
    priceMentions: (t.match(/[£$]\d+[\d.,]*|\d+\s*(?:USDC|GBP|USD)/g) || []).slice(0, 6),
    ctaCount: (t.match(/get your first|start free|measure|verify a card/gi) || []).length,
    mentionsInvoice: /invoice/i.test(t),
    head: t.slice(0, 220).replace(/\n/g, ' | ')
  };
  t = await visit('A2-pay', 'https://councilof.ai/pay');
  out['A2_pay'] = {
    title: await pg.title(),
    promoUrgency: reHas(t, /0\.01|until 11|11 Oct/i),
    priceMentions: (t.match(/[£$]\d+[\d.,]*|\d+\s*(?:USDC|GBP|USD)/g) || []).slice(0, 8),
    hasX402: /x402/i.test(t), hasInvoice: /invoice/i.test(t),
    skus: (t.match(/evidence pack|attestation|proof bundle|receipts batch|licen\w+|verify/gi) || []).slice(0, 8),
    deadEnd: t.length < 400,
    head: t.slice(0, 220).replace(/\n/g, ' | ')
  };

  // PERSONA B — AGENT/DEVELOPER
  t = await visit('B1-llms', 'https://councilof.ai/llms.txt');
  out['B1_llms'] = { len: t.length, hasMcp: t.includes('/mcp'), hasVerify: /verify/i.test(t), head: t.slice(0, 180).replace(/\n/g, ' | ') };
  t = await visit('B2-agent-card', 'https://councilof.ai/.well-known/agent-card.json');
  out['B2_agent_card'] = { isJson: t.trim().startsWith('{'), hasSkills: /skills|tools/i.test(t), head: t.slice(0, 180).replace(/\n/g, ' | ') };
  t = await visit('B3-x402', 'https://councilof.ai/.well-known/x402.json');
  out['B3_x402'] = { isJson: t.trim().startsWith('{'), hasPayTo: /payto/i.test(t), hasPrice: /price|0\.0/i.test(t), head: t.slice(0, 220).replace(/\n/g, ' | ') };
  t = await visit('B4-mcp', 'https://councilof.ai/mcp');
  out['B4_mcp'] = { len: t.length, head: t.slice(0, 180).replace(/\n/g, ' | ') };

  // PERSONA C — REGULATOR
  t = await visit('C1-how-we-work', 'https://councilof.ai/how-we-work');
  out['C1_howwework'] = { notCert: /not certification|measurement, not certification/i.test(t), methodology: /method/i.test(t), unmeasured: /unmeasured/i.test(t), head: t.slice(0, 200).replace(/\n/g, ' | ') };
  t = await visit('C2-verify', 'https://councilof.ai/verify');
  out['C2_verify'] = { len: t.length, hasInput: await pg.evaluate(() => !!document.querySelector('input')), head: t.slice(0, 200).replace(/\n/g, ' | ') };
  t = await visit('C3-boards', 'https://councilof.ai/boards');
  out['C3_boards'] = { len: t.length, hasCI: /CI|confidence|n=/.test(t), head: t.slice(0, 200).replace(/\n/g, ' | ') };

  await b.close();
  require('fs').writeFileSync(`${OUT}/findings.json`, JSON.stringify(out, null, 1));
  console.log(JSON.stringify(out, null, 1).slice(0, 3600));
})();