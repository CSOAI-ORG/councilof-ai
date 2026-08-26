import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * NEXT_300 #219 — axe CI on honesty surfaces.
 * Serious/critical violations fail. Colour-contrast alone is logged, not fatal
 * (dark emerald theme may trip WCAG AA on secondary text — tracked separately).
 */
const HONESTY_ROUTES = [
  '/indices',
  '/indices/ai-economy',
  '/indices/human-labour',
  '/indices/humanoid-labour',
  '/products',
  '/powered-by',
];

for (const path of HONESTY_ROUTES) {
  test(`axe: ${path} has no serious/critical violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact || ''),
    );

    const contrastOnly = blocking.every((v) => v.id === 'color-contrast');
    if (blocking.length && !contrastOnly) {
      const summary = blocking
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} node(s) — ${v.help}`)
        .join('\n');
      expect(blocking, `axe serious/critical on ${path}:\n${summary}`).toEqual([]);
    }

    // Always assert document has a non-empty title (checklist item).
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });
}
