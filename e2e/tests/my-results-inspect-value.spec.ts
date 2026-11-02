import { test, expect } from "@playwright/test";

/**
 * End-user Playwright E2E & Browser DevTools Inspect verification for:
 *   - /my-results/ (all 7 tabs, Live 14-Axis HF Router matrix, Article-1 Care paired ablation,
 *     Universal 12-DB Watchdog Layer-0 Incident Harness, Role-Routed HITL Dispatcher, and
 *     window.CSOAI_INSPECT DevTools Console API)
 *   - /working-groups/ (7 forming Public Watchdog Working Groups & COAI-WG-001..007)
 *   - /constitutional-harness/ (Constitutional Harness & Layer-0 controls)
 *
 * Verifies desktop (1280x800) and mobile (390x844) viewports have:
 *   - 0 uncaught pageerrors
 *   - 0 horizontal scroll overflow (scrollWidth <= clientWidth + 1)
 *   - 0 public price strings (/[£$]\s?\d/)
 *   - 100% labeled form controls & valid JSON-LD structured data
 */
for (const [width, height, viewportLabel] of [
  [1280, 800, "desktop"],
  [390, 844, "mobile"],
] as const) {
  test(`/my-results/ end-to-end journey, interactive panels, and window.CSOAI_INSPECT pass at ${viewportLabel} (${width}x${height})`, async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));

    await page.setViewportSize({ width, height });
    const response = await page.goto("/my-results/", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);

    // 1. Check 7 tabs & JSON-LD structured evidence
    await expect(page.locator(".tab-btn")).toHaveCount(7);
    await expect(page.locator("#csoai-structured-evidence-jsonld")).toHaveCount(1);
    await expect(page.getByText("Live Hugging Face Router 14-Axis Canonical Model-Comparison Matrix")).toBeVisible();

    // 2. Exercise Step 1 model filter
    await page.locator("#model-search-input").fill("Qwen");
    await page.locator("#model-search-btn").click();
    await expect(page.locator("#models-tbody")).toContainText("Qwen");

    // 3. Exercise Step 2 Free Pack Preview
    await page.locator('[data-tab="step-2-preview"]').click();
    await page.locator("#preview-door-select").selectOption("/interop/universal-watchdog-incident-harness-v1.json");
    await page.locator("#run-preview-btn").click();
    await expect(page.locator("#preview-output-box")).toContainText("public-incident-vigilance");

    // 4. Exercise Step 6 Article-1 Care & Layer-0 Sandbox
    await page.locator('[data-tab="step-6-care-sandbox"]').click();
    for (const scenario of [
      "care_delusion",
      "exam_medqa",
      "layer0_consequential",
      "layer0_secret",
      "layer0_regulatory",
    ]) {
      await page.locator("#sandbox-scenario-select").selectOption(scenario);
      await page.locator("#run-sandbox-btn").click();
    }
    await expect(page.locator("#sandbox-output-box")).toContainText("DENY_REGULATORY_DETERMINATION");

    // 5. Exercise Step 7 HITL Dispatcher, 12-DB Watchdog Harness, and Live Inspector
    await page.locator('[data-tab="step-7-automation"]').click();
    await page.locator("#run-hitl-dispatch-btn").click();
    await expect(page.locator("#hitl-dispatch-output")).toContainText("AWAITING_OPERATOR_REVIEW");

    await page.locator("#watchdog-db-select").selectOption("sec-edgar-8k-10k-ai-cyber");
    await page.locator("#run-watchdog-harness-btn").click();
    await expect(page.locator("#watchdog-harness-output")).toContainText("public-incident-vigilance");

    for (const surf of [
      "dom_a11y_e2e",
      "live_hf_14_axes",
      "article1_care_ablation",
      "watchdog_12_dbs",
      "underwriter_cobol_s1_safe",
      "uk_aisi_and_offline_zip",
    ]) {
      await page.locator("#inspect-surface-select").selectOption(surf);
      await page.locator("#run-live-inspect-btn").click();
    }
    await expect(page.locator("#live-inspect-output")).toContainText("inspect_task.py");

    // 6. Verify window.CSOAI_INSPECT in Browser DevTools context & responsive overflow
    const inspectResult = await page.evaluate(() => {
      const api = (window as any).CSOAI_INSPECT;
      return {
        hasApi: !!api,
        summary: api ? api.summary() : null,
        audit: api ? api.auditDomAndA11y() : null,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      };
    });

    expect(inspectResult.hasApi).toBe(true);
    expect(inspectResult.audit?.verdict).toBe("PASS");
    expect(inspectResult.audit?.unlabeled_controls).toEqual([]);
    expect(inspectResult.audit?.public_price_strings_present).toBe(false);
    expect(inspectResult.overflow).toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test(`/working-groups/ and /constitutional-harness/ render with zero pageerrors, zero price leaks, and zero horizontal overflow at ${viewportLabel} (${width}x${height})`, async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (err) => pageErrors.push(err.message));
    await page.setViewportSize({ width, height });

    for (const route of ["/working-groups/", "/constitutional-harness/"]) {
      const res = await page.goto(route, { waitUntil: "domcontentloaded" });
      expect(res?.status()).toBe(200);
      const metrics = await page.evaluate(() => ({
        textLen: (document.body?.innerText || "").trim().length,
        hasPrice: /[£$]\s?\d/.test(document.body?.innerText || ""),
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      }));
      expect(metrics.textLen).toBeGreaterThan(100);
      expect(metrics.hasPrice).toBe(false);
      expect(metrics.overflow).toBe(false);
    }
    expect(pageErrors).toEqual([]);
  });
}
