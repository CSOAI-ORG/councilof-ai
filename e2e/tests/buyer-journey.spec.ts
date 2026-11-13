import { test, expect, request, type APIResponse } from '@playwright/test';

/**
 * Walk the published x402 catalog like an unauthenticated buyer. These checks only issue GETs:
 * they inspect challenges and free previews and never sign, submit, or settle a payment.
 */
const FILL: Record<string, string> = {
  'chainlink|ondo|ondo-ousg': 'chainlink',
  'id': 'gpt-4o', 'slug': 'governance', 'model-id': 'gpt-4o',
  'dora|cra|article-50|article-53': 'dora',
  'symbol|issuer_address': 'RLUSD', 'symbol': 'RLUSD',
  'wrapped-symbol:chain': 'usdc.e:arbitrum',
  'https-mcp-url': encodeURIComponent('https://councilof.ai/mcp'),
  'TOOLS|VERSION|PROTOCOL': 'TOOLS',
  'https-output-url': encodeURIComponent('https://councilof.ai/og-image.png'),
  'https-mcp-endpoint': encodeURIComponent('https://councilof.ai/mcp'),
  'https-x402-resource': encodeURIComponent('https://councilof.ai/api/free-door'),
  'USDC': 'USDC', 'evm-ledger-on-issuer-list': 'ethereum',
  'https://…': encodeURIComponent('https://councilof.ai/og-image.png'),
};

function fill(raw: string, leafSha: string): string {
  let isoIndex = 0;
  return raw.replace(/<([^>]+)>/g, (token, hint: string) => {
    if (hint === '64-hex') return leafSha;
    if (hint === 'iso') return ['2026-11-01', '2026-11-03'][Math.min(isoIndex++, 1)];
    return FILL[hint] ?? token;
  });
}

type NoSaleContract = {
  status?: number;
  body?: {
    preview_only?: boolean;
    state?: string;
    payment?: {
      requested?: boolean;
      sent_to_facilitator?: boolean;
      settled?: boolean;
    };
  };
};

async function matchesNoSaleContract(response: APIResponse, contract?: NoSaleContract): Promise<boolean> {
  if (
    response.status() !== 200 ||
    contract?.status !== 200 ||
    contract.body?.preview_only !== true ||
    contract.body.state !== 'UNMEASURED'
  ) return false;
  const body = await response.json().catch(() => null) as NoSaleContract['body'] | null;
  return body?.preview_only === true &&
    body.state === 'UNMEASURED' &&
    body.payment?.requested === false &&
    body.payment?.sent_to_facilitator === false &&
    body.payment?.settled === false;
}

test('a discovering agent can read the catalog and use each published door and preview', async () => {
  test.setTimeout(180_000);
  const api = await request.newContext({ baseURL: 'https://councilof.ai', timeout: 12_000 });
  try {
    // 1. Follow the public discovery door and its machine-readable catalog pointer.
    const door = await api.get('/api/free-door');
    expect(door.status(), 'the indexed door must answer 402').toBe(402);
    expect(door.headers()['payment-required'], 'the x402 challenge header must be present').toBeTruthy();
    const doorBody = await door.json();
    expect(doorBody.x402Version).toBe(2);
    expect(doorBody.extensions?.bazaar, 'the challenge must carry the Bazaar discovery block').toBeTruthy();
    expect(doorBody.catalog).toBe('https://councilof.ai/api/x402');

    // 2. Read the current catalog shape, not the retired `tiers` contract.
    const catResponse = await api.get('/api/x402');
    expect(catResponse.status()).toBe(200);
    const catalog = await catResponse.json() as {
      schema: string;
      resources: { id: string; resource: string; free_preview?: string }[];
      tiers?: unknown;
    };
    expect(catalog.schema).toBe('csoai.x402-catalog/0.3');
    expect(catalog.resources.length).toBeGreaterThanOrEqual(25);
    expect(catalog.tiers, 'the catalog no longer publishes pricing tiers').toBeUndefined();

    // The free single-proof example must use a leaf that is actually in the current public root.
    const rootResponse = await api.get('/root.json');
    expect(rootResponse.status()).toBe(200);
    const root = await rootResponse.json() as { card_sha256?: string[] };
    const leafSha = root.card_sha256?.[0] ?? '';
    expect(leafSha).toMatch(/^[0-9a-f]{64}$/);

    const manifestResponse = await api.get('/.well-known/x402.json');
    expect(manifestResponse.status()).toBe(200);
    const manifest = await manifestResponse.json() as {
      resources?: { url: string; no_sale?: NoSaleContract }[];
    };

    const failures: string[] = [];
    for (const row of catalog.resources) {
      for (const [field, raw] of [['resource', row.resource], ['free_preview', row.free_preview]] as const) {
        if (!raw) {
          if (field === 'resource') failures.push(`${row.id}.${field} is missing`);
          continue;
        }
        const url = fill(raw, leafSha);
        if (url.includes('<')) {
          failures.push(`${row.id}.${field} has an unresolved placeholder: ${url}`);
          continue;
        }
        if (!url.startsWith('https://councilof.ai/')) {
          failures.push(`${row.id}.${field} is outside the published origin: ${url}`);
          continue;
        }
        const response = await api.get(url);
        if (field === 'resource') {
          if (response.status() === 200) {
            const manifestRow = manifest.resources?.find((item) => fill(item.url, leafSha) === url);
            if (await matchesNoSaleContract(response, manifestRow?.no_sale)) continue;
          }
          if (response.status() !== 402) {
            failures.push(row.id + '.resource answered ' + response.status() + ' without an explicit no-sale contract: ' + url);
            continue;
          }
          if (!response.headers()['payment-required']) {
            failures.push(`${row.id}.resource has no PAYMENT-REQUIRED header: ${url}`);
            continue;
          }
          const challenge = await response.json();
          if (challenge.x402Version !== 2 || !challenge.extensions?.bazaar) {
            failures.push(`${row.id}.resource lacks the x402 v2/Bazaar challenge: ${url}`);
          }
          continue;
        }

        if (response.status() === 200) continue;
        if (response.status() === 402) {
          const previewChallenge = await response.json();
          const freeChallenge = previewChallenge.accepts?.some((a: { amount?: string }) => a.amount === '0');
          if (!freeChallenge && !previewChallenge.csoai?.preview) {
            failures.push(`${row.id}.free_preview challenged without a free preview in the response: ${url}`);
          }
          continue;
        }
        failures.push(`${row.id}.free_preview answered ${response.status()}: ${url}`);
      }
    }
    expect(failures, `\n  ${failures.join('\n  ')}\n`).toEqual([]);
  } finally {
    await api.dispose();
  }
});

test('every advertised door follows its challenge or explicit no-sale contract', async () => {
  test.setTimeout(180_000);
  const api = await request.newContext({ baseURL: 'https://councilof.ai', timeout: 12_000 });
  try {
    const root = await (await api.get('/root.json')).json() as { card_sha256?: string[] };
    const leafSha = root.card_sha256?.[0] ?? '';
    const m = await (await api.get('/.well-known/x402.json')).json();
    const failures: string[] = [];
    for (const r of m.resources as {
      url: string;
      paid_for: string | null;
      no_sale?: NoSaleContract;
    }[]) {
      const u = fill(r.url, leafSha);
      if (u.includes('<')) { failures.push(`${r.url} has an unfilled placeholder`); continue; }
      const res = await api.get(u);
      if (res.status() === 402) {
        if (!res.headers()['payment-required']) failures.push(`${r.url} has no PAYMENT-REQUIRED header`);
        continue;
      }

      // The published manifest permits a no-sale 200 only when the read is UNMEASURED.
      // Verify it is explicitly preview-only and that no payment was requested or settled.
      if (await matchesNoSaleContract(res, r.no_sale)) continue;
      failures.push(`${r.url} answered ${res.status()} without a matching challenge or no-sale contract`);
    }
    expect(failures, `\n  ${failures.join('\n  ')}\n`).toEqual([]);
  } finally {
    await api.dispose();
  }
});

for (const [w, h, label] of [[1280, 800, 'desktop'], [390, 844, 'mobile']] as const) {
  test(`a human buyer sees /products at ${label} with no price and no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const r = await page.goto('/products/', { waitUntil: 'networkidle' });
    expect(r?.status()).toBe(200);
    // Verification-by-window-resize does not reflow the page; the viewport is set above so this
    // measures what a phone actually renders.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(overflow, 'the page must not scroll sideways').toBe(false);
    const text = await page.evaluate(() => document.body.innerText);
    expect(text, 'public prices are forbidden on every surface').not.toMatch(/[£$]\s?\d/);
    expect(text).toMatch(/SKU/i);
  });
}

test('the public MCP address supports browser discovery and both JSON-RPC doors', async () => {
  test.setTimeout(60_000);
  const api = await request.newContext({
    baseURL: process.env.BASE_URL || 'https://councilof.ai',
    timeout: 12_000,
  });
  const parseRpc = async (response: Awaited<ReturnType<typeof api.post>>) => {
    const type = response.headers()['content-type'] ?? '';
    if (type.includes('application/json')) return response.json();
    const lines = (await response.text()).split(/\r?\n/).filter((line) => line.startsWith('data:'));
    return JSON.parse(lines.map((line) => line.slice(5).trim()).join('\n'));
  };
  try {
    const browserDoc = await api.get('/mcp/', { headers: { accept: 'text/html' } });
    expect(browserDoc.status()).toBe(200);
    expect(browserDoc.headers()['content-type']).toMatch(/text\/html/);
    expect(await browserDoc.text()).toContain('<h1>MCP server endpoint</h1>');

    const fullDocResponse = await api.get('/mcp/', { headers: { accept: 'application/json' } });
    expect(fullDocResponse.status()).toBe(200);
    const fullDoc = await fullDocResponse.json();
    expect(fullDoc.server_info?.name).toBe('csoai-gspc-mcp');
    expect(fullDoc.paid_tools?.names?.length).toBeGreaterThan(0);

    const freeDocResponse = await api.get('/mcp/free', { headers: { accept: 'application/json' } });
    expect(freeDocResponse.status()).toBe(200);
    const freeDoc = await freeDocResponse.json();
    expect(freeDoc.door).toBe('free');
    expect(freeDoc).not.toHaveProperty('paid_tools');

    const call = (path: string) => api.post(path, {
      headers: {
        'content-type': 'application/json',
        accept: 'application/json, text/event-stream',
      },
      data: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} },
    });
    const fullResponse = await call('/mcp');
    expect(fullResponse.status(), 'the advertised full MCP route must answer tools/list').toBe(200);
    const full = await parseRpc(fullResponse);
    expect(Array.isArray(full?.result?.tools)).toBe(true);

    const freeResponse = await call('/mcp/free');
    expect(freeResponse.status(), 'the published free MCP route must answer tools/list').toBe(200);
    const free = await parseRpc(freeResponse);
    expect(Array.isArray(free?.result?.tools)).toBe(true);
    expect(full.result.tools.length).toBeGreaterThan(free.result.tools.length);
  } finally {
    await api.dispose();
  }
});

test('a human can browse the MCP catalogue into a detail page and reach its endpoint', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const index = await page.goto('/mcps/', { waitUntil: 'networkidle' });
  expect(index?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'MCP server catalogue' })).toBeVisible();

  const detailLink = page.locator('a[href^="/mcps/"]').first();
  await expect(detailLink).toBeVisible();
  const href = await detailLink.getAttribute('href');
  const name = (await detailLink.innerText()).trim();
  expect(href).toMatch(/^\/mcps\/[a-z0-9-]+$/);
  await detailLink.click();
  await expect(page).toHaveURL(new RegExp(`${href}$`));
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow, 'the MCP detail page must fit a phone viewport').toBe(false);

  await page.getByRole('link', { name: /All \d+ MCPs/ }).click();
  const setupLink = page.getByRole('link', { name: 'Open the CSOAI MCP setup guide' });
  await expect(setupLink).toBeVisible();
  await setupLink.click();
  await expect(page).toHaveURL(/\/mcp\/?$/);
  await expect(page.getByRole('heading', { name: 'MCP server endpoint' })).toBeVisible();
});
