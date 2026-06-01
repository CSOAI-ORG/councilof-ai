// MEOK OS — End-to-end tests. Catches the bugs Nick hit ("squashed", "connection lost",
// "all buggy") automatically, so they can't regress. Run: npx playwright test (server on :4173).
const { test, expect } = require('@playwright/test');

test.describe('MEOK OS — 3-window operating system', () => {

  test('loads with title, status bar shows live tool count', async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/os');
    await expect(page).toHaveTitle(/MEOK OS/);
    // status bar should report the live gateway tool count (459), proving SOV3 wired
    await expect(page.locator('#stxt')).toContainText(/tools/, { timeout: 20_000 });
    const status = await page.locator('#stxt').textContent();
    expect(status).toMatch(/\d+ tools/);
    // no uncaught console errors on load
    expect(errors, 'console errors on load: ' + errors.join(' | ')).toHaveLength(0);
  });

  test('all three windows + their model selectors exist', async ({ page }) => {
    await page.goto('/os');
    await expect(page.locator('.win.character')).toBeVisible();
    // chat + tui exist in DOM (hidden in Simple mode); switch to Pro to see them
    await page.click('button[data-mode="pro"]');
    await expect(page.locator('.win.chat')).toBeVisible();
    await expect(page.locator('.win.tui')).toBeVisible();
    await expect(page.locator('#charSel')).toBeVisible();   // character selector
    await expect(page.locator('#brainSel')).toBeVisible();  // brain selector
    await expect(page.locator('#codeSel')).toBeVisible();   // coding-model selector
  });

  test('mode switching works (Simple/Pro/Council/Orb)', async ({ page }) => {
    await page.goto('/os');
    for (const m of ['pro', 'council', 'orb', 'simple']) {
      await page.click(`button[data-mode="${m}"]`);
      await expect(page.locator('body')).toHaveClass(new RegExp(m));
    }
  });

  test('mode bar does NOT overlap the character selector (the bug Nick saw)', async ({ page }) => {
    await page.goto('/os');
    const bar = await page.locator('.modebar').boundingBox();
    const sel = await page.locator('#charSel').boundingBox();
    // modebar is in the left column; charSel is in the right dock — they must not overlap horizontally
    expect(bar.x + bar.width, 'modebar right edge past charSel left edge = overlap').toBeLessThan(sel.x + 5);
  });

  test('CHAT WORKS — fast brain replies, no "connection lost"', async ({ page }) => {
    test.setTimeout(70_000);
    await page.goto('/os');
    await page.click('button[data-mode="pro"]');
    // default brain is Fast (cloud) — should reply quickly
    await page.fill('#chatIn', 'hi there, one word reply please');
    await page.click('#send');
    // user bubble appears immediately
    await expect(page.locator('.msg.user').last()).toBeVisible({ timeout: 5_000 });
    // wait for the char reply to stop saying "…"/"thinking" and have real content
    const reply = page.locator('.msg.char').last();
    await expect(reply).toBeVisible({ timeout: 10_000 });
    await expect(async () => {
      const t = await reply.textContent();
      expect(t.replace(/\s/g, '').length).toBeGreaterThan(15);
      expect(t).not.toMatch(/^.{0,30}(…|thinking)/);
    }).toPass({ timeout: 50_000 });
    await expect(reply).not.toContainText(/connection lost|couldn't reach this brain/i);
  });

  test('windows are resizable (drag handle moves the boundary)', async ({ page }) => {
    await page.goto('/os');
    await page.click('button[data-mode="pro"]');
    const charWin = page.locator('.win.character');
    const before = (await charWin.boundingBox()).height;
    const handle = page.locator('.resizer').first();
    const hb = await handle.boundingBox();
    // drag the first resizer down by 120px (slow steps so the mousemove handler tracks it)
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2);
    await page.mouse.down();
    await page.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2 + 120, { steps: 12 });
    await page.waitForTimeout(100);
    await page.mouse.up();
    const after = (await charWin.boundingBox()).height;
    // any real resize (>10px) proves the drag handler works; we dragged 120
    expect(Math.abs(after - before), 'character window did not resize').toBeGreaterThan(10);
  });

  test('TUI runs real commands through the gateway', async ({ page }) => {
    await page.goto('/os');
    await page.click('button[data-mode="pro"]');
    await page.fill('#tuiIn', 'tools');
    await page.press('#tuiIn', 'Enter');
    // the TUI should print the real tool count
    await expect(page.locator('#tui')).toContainText(/\d+ tools/, { timeout: 10_000 });
  });
});
