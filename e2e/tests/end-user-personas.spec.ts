import { test, expect, type Page } from "@playwright/test";

/**
 * End-user persona walk — every audience type the site serves.
 *
 * Audiences mirror client/src/components/lobby/asks.ts (9 segments).
 * Each persona: lands on their primary surface, sees honest copy, no crash,
 * and can reach Council OS / verify / agent runbook.
 *
 * Run locally:
 *   npm run build:client
 *   npx vite preview --config client/vite.config.ts --port 4173 --strictPort &
 *   BASE_URL=http://localhost:4173 npx playwright test end-user-personas --project=chromium
 */

type Persona = {
  id: string;
  label: string;
  routes: string[];
  mustSee: RegExp;
  /** Optional CTA text to click */
  cta?: string;
};

const PERSONAS: Persona[] = [
  {
    id: "public",
    label: "Curious public",
    routes: ["/", "/honesty", "/methodology"],
    mustSee: /measure|not certif|Council of AI/i,
  },
  {
    id: "builder",
    label: "Builder",
    routes: ["/agent-runbook", "/instruments", "/gspc-verify", "/api-docs"],
    mustSee: /verify|gspc|instrument|curl|api/i,
  },
  {
    id: "insurer",
    label: "Insurer",
    routes: ["/insurers", "/gspc-scoreboard", "/dashboard"],
    mustSee: /insur|underwrit|evidence|measure/i,
  },
  {
    id: "regulator",
    label: "Regulator",
    routes: ["/for/regulator", "/regulators", "/article-50"],
    mustSee: /regulat|Article|supervis|measure/i,
  },
  {
    id: "compliance",
    label: "Compliance & legal",
    routes: ["/eu-ai-act", "/checklist", "/crosswalk"],
    mustSee: /AI Act|compliance|requirement|framework/i,
  },
  {
    id: "procurement",
    label: "Procurement",
    routes: ["/compare", "/pricing", "/enterprise"],
    mustSee: /measure|vendor|pricing|enterprise/i,
  },
  {
    id: "board",
    label: "Board & exec",
    routes: ["/dashboard", "/methodology", "/ownership"],
    mustSee: /measure|dashboard|Council|ownership/i,
  },
  {
    id: "researcher",
    label: "Researcher",
    routes: ["/receipt-spec", "/methodology", "/refutation-ledger"],
    mustSee: /method|receipt|spec|n≥|reproduc/i,
  },
  {
    id: "press",
    label: "Press",
    routes: ["/pressroom", "/honesty", "/blog/receipt-spec-0-1"],
    mustSee: /Council|measure|honest|receipt/i,
  },
];

const LAYER0_ROUTES = [
  "/engine-axis",
  "/instruments",
  "/venturi",
  "/legacy",
  "/agent-runbook",
  "/receipt-spec",
  "/ownership",
];

async function dismissCookieBanner(page: Page) {
  const essential = page.getByRole("button", { name: "Essential only" });
  if (await essential.isVisible().catch(() => false)) {
    await essential.click();
  }
}

async function assertHealthy(page: Page, route: string, mustSee: RegExp) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));

  const response = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 45_000 });
  await dismissCookieBanner(page);
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

  const status = response?.status();
  if (status != null) {
    expect(status, `${route} status`).toBeLessThan(400);
  } else {
    // SPA fallback when navigation response is missing (preview race / HMR)
    await expect(page.locator("#root, body")).toBeVisible({ timeout: 10_000 });
  }

  await page.waitForTimeout(800);

  const body = (await page.textContent("body")) || "";
  expect(body.length, `${route} content length`).toBeGreaterThan(200);
  expect(body, `${route} must-see`).toMatch(mustSee);
  expect(body, `${route} no error UI`).not.toMatch(/Something went wrong/);
  expect(body, `${route} no 404 title`).not.toMatch(/404 — Not found/i);

  const critical = errors.filter(
    (e) =>
      e.includes("is not defined") ||
      e.includes("Failed to fetch dynamically imported module") ||
      e.includes("Cannot read properties of"),
  );
  expect(critical, `${route} JS errors`).toEqual([]);
}

test.describe("Layer 0 + standards surfaces", () => {
  for (const route of LAYER0_ROUTES) {
    test(`${route} loads without crash`, async ({ page }) => {
      await assertHealthy(page, route, /Council|measure|Eunomia|receipt|ownership|engine|venturi|agent/i);
    });
  }
});

test.describe("End-user personas — primary surfaces", () => {
  for (const persona of PERSONAS) {
    test.describe(persona.label, () => {
      for (const route of persona.routes) {
        test(`${route}`, async ({ page }) => {
          await assertHealthy(page, route, persona.mustSee);
        });
      }
    });
  }
});

test.describe("Council OS — lobby opens for all entry points", () => {
  const entryPoints = ["/", "/instruments", "/dashboard", "/engine-axis"];

  for (const route of entryPoints) {
    test(`lobby CTA from ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await dismissCookieBanner(page);

      const launcher = page.locator('button[aria-label="Open Council OS"]').first();
      await expect(launcher).toBeVisible({ timeout: 10_000 });
      await launcher.click();
      await expect(page.locator('[data-coai="Council Lobby"]')).toBeVisible({ timeout: 15_000 });
    });
  }
});

test.describe("DSH — dashboard parity", () => {
  test("dashboard shows Layer 0 Eunomia cards", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const body = (await page.textContent("body")) || "";
    expect(body).toMatch(/Engine Axis|Eunomia|Bond Venturi/i);
    expect(body).toMatch(/Ask in Lobby|Open/i);
  });

  test("dashboard sidebar has agent runbook + receipt spec", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    const body = (await page.textContent("body")) || "";
    expect(body).toMatch(/Agent runbook|RECEIPT-SPEC|Trust floor/i);
  });
});

test.describe("Mobile — key personas", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  const mobileRoutes = ["/", "/agent-runbook", "/receipt-spec", "/insurers", "/dashboard"];

  for (const route of mobileRoutes) {
    test(`${route} on mobile`, async ({ page }) => {
      await assertHealthy(page, route, /Council|measure|agent|receipt|insur|dashboard/i);
    });
  }
});

test.describe("API smoke — persona ask questions", () => {
  const asks: Record<string, string> = {
    public: "In plain words, what does the Council of AI actually measure?",
    builder: "How is a measurement card signed, and how do I verify one without trusting you?",
    insurer: "What can an underwriter rely on in a signed measurement card?",
    regulator: "Which figures on the board are safe to quote today, and which are not?",
    compliance: "What does the Council refuse to state an opinion on, and why?",
    procurement: "What can I rely on in a published measurement, and what is explicitly out of scope?",
    board: "What is the one-paragraph summary of what is measured and what is not?",
    researcher: "What is the minimum n for a quotable figure, and what happens below it?",
    press: "Who publishes these numbers, and what is the legal entity behind them?",
  };

  const base = process.env.BASE_URL || "https://www.csoai.org";
  const isLocalPreview = /localhost|127\.0\.0\.1|:4173/.test(base);

  test.skip(isLocalPreview, "API routes need Cloudflare functions — run against councilof.ai");

  for (const [id, question] of Object.entries(asks)) {
    test(`POST /api/chat — ${id}`, async ({ request, baseURL }) => {
      const res = await request.post(`${baseURL}/api/chat`, {
        data: { messages: [{ role: "user", content: question }] },
      });
      expect(res.ok()).toBeTruthy();
      const j = await res.json();
      const answer = String(j.answer || j.reply || "");
      expect(answer.length).toBeGreaterThan(40);
      expect(j.state).not.toBe("ungrounded");
      expect(answer).not.toMatch(/I won't answer this one/i);
    });
  }
});
