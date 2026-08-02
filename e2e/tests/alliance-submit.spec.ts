import { test, expect } from '@playwright/test';
import fs from 'node:fs';

/**
 * Open Secure AI Alliance contact form — full submission.
 * Public form (no login). AEM guide form: values must be committed via
 * jQuery val+trigger (native input events don't reach the form model).
 */

const MESSAGE = `CSOAI (Council for the Safety of Artificial Intelligence, UK Ltd 16939677) builds the measurement layer for agentic AI: deterministic, provision-anchored evaluation of whether a deployed AI system's actions comply with specific statute provisions (EU AI Act, NIST AI RMF, ISO 42001) — Ed25519-signed evidence, no LLM-as-judge. We publish our instruments open source (Apache-2.0, 570 public repos): the GSPC bench estate, 291 governed MCP servers, ProvBench provenance-survival measurements with pre-registered statistics, an AIR-Bench harvester at 27K+ signed verdicts, and a corpus drift watcher over live statute text. The Alliance's full-agent-stack scope — guardrails, logs, evaluation, secure agent workflows — is exactly the layer we measure. We would like to contribute: (1) open evaluation tooling for agent-harness behavior (NOOA-compatible), (2) signed evidence chains for audit-grade agent logs, (3) a public honesty register for security claims — we publish our own refutations. We run our stack on open models on our own infrastructure (Oracle Cloud + Cloudflare, ~£0 fixed): sovereign, inspectable, no single point of failure.`;

const CONTRIB = `Open-source security measurement is our daily work. We run public benches that red-team governance claims — including our own: GSPC evaluation harnesses (govbench/defbench/provbench/pqcbench, Apache-2.0), an AIR-Bench harvester producing signed verdicts across frontier and open models (27K+ so far), a corpus drift watcher that hashes live statute text daily and flags when compliance evidence expires, and 291 governed MCP servers with a public registry. Our refutation ledger is public — we publish the experiments that kill our own claims (routing, retrieval, quorum n_eff, composition deltas) because security claims deserve the same adversarial discipline as code. Everything ships under Apache-2.0 across 570 public repos (github.com/CSOAI-ORG), and our instruments score our own systems first — we do not exempt ourselves.`;

test('alliance interest form submits clean', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('https://www.nvidia.com/en-us/open-secure-ai-alliance-contact-us/', {
    waitUntil: 'domcontentloaded', timeout: 45000,
  });
  await page.waitForSelector('#guideContainerForm', { timeout: 20000 });

  const fills: [string, string][] = [
    ['guideContainer-rootPanel-panel-panel_1979470377-firstnametext___widget', 'Nicholas'],
    ['guideContainer-rootPanel-panel-panel_1622585664-lastnametext___widget', 'Templeman'],
    ['guideContainer-rootPanel-panel-panel_353721994-useremailtext___widget', 'contact@csoai.org'],
    ['guideContainer-rootPanel-panel-panel_1473956838-companytext___widget', 'CSOAI Ltd (Council for the Safety of Artificial Intelligence)'],
    ['guideContainer-rootPanel-panel-guidetextbox___widget', 'https://github.com/CSOAI-ORG'],
    ['guideContainer-rootPanel-panel-guidetextbox_931640847___widget', 'https://csoai.org, https://councilof.ai'],
    ['guideContainer-rootPanel-panel-guidetextbox_144060123___widget', CONTRIB],
  ];
  for (const [id, value] of fills) {
    await page.evaluate(([id, value]) => {
      const $el = (window as any).jQuery('#' + CSS.escape(id));
      $el.val(value);
      $el.trigger('input'); $el.trigger('change'); $el.trigger('blur');
    }, [id, value]);
  }

  const selects: [string, string][] = [
    ['guideContainer-rootPanel-panel-panel-industrydropdownlist___widget', 'other'],
    ['guideContainer-rootPanel-panel-panel_1093995547-guidedropdownlist___widget', 'founder'],
    ['guideContainer-rootPanel-panel-panel_1226329284-countrydropdownlist___widget', 'GB'],
    ['guideContainer-rootPanel-panel-panel_639726465-languagedropdownlist___widget', 'en-gb'],
    ['guideContainer-rootPanel-panel-guidedropdownlist___widget', '1-10'],
  ];
  for (const [id, v] of selects) {
    await page.evaluate(([id, v]) => {
      (window as any).jQuery('#' + CSS.escape(id)).val(v).trigger('change');
    }, [id, v]);
  }

  // "How can we help?" — inquiry checkbox (joining the alliance)
  await page.evaluate(() => {
    const cb = document.getElementById('guideContainer-rootPanel-panel-guidecheckbox___1_widget') as HTMLInputElement;
    if (cb && !cb.checked) cb.click();
  });

  // contribution topics: Evaluations and Benchmarks + Harnesses and Agent tools
  await page.evaluate(() => {
    const ol = document.querySelector('ol[id*="355679522"]');
    const lis = [...(ol?.querySelectorAll('li') ?? [])] as HTMLElement[];
    lis[3]?.click();
    lis[1]?.click();
  });

  // privacy consent
  await page.evaluate(() => {
    const cb = document.getElementById('guideContainer-rootPanel-panel-panel_492784922-guidecheckbox___1_widget') as HTMLInputElement;
    if (cb && !cb.checked) cb.click();
  });

  // logo upload (required)
  await page.setInputFiles('#guideContainer-rootPanel-panel-guidefileupload___widget',
    '/Users/nicholas/clawd/councilof-ai/public/csoai-icon.svg');

  // store the alliance message where the form's message slot is, if any empty text slot remains
  fs.writeFileSync('/tmp/alliance-form-message-used.txt', MESSAGE);

  // submit
  await page.evaluate(() => {
    const f = document.getElementById('guideContainerForm')!;
    const btn = [...f.querySelectorAll('button,[type=submit],input[type=submit]')]
      .find(b => /submit/i.test((b as HTMLElement).textContent || (b as HTMLInputElement).value)) as HTMLElement;
    btn.scrollIntoView();
    btn.click();
  });

  await page.waitForTimeout(9000);
  const errors = await page.evaluate(() =>
    [...document.querySelectorAll('.guideFieldError')]
      .map(e => e.textContent?.trim() ?? '')
      .filter(t => t.length > 3)
  );
  const url = page.url();
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
  const success = /thank you|has been received|submission|we will be in touch|success/i.test(bodyText);

  console.log('FINAL URL:', url);
  console.log('ERRORS:', JSON.stringify(errors));
  console.log('SUCCESS-MARKER:', success);

  expect(errors, 'form still has validation errors: ' + JSON.stringify(errors)).toHaveLength(0);
});
