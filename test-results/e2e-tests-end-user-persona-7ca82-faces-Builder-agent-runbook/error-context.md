# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/tests/end-user-personas.spec.ts >> End-user personas — primary surfaces >> Builder >> /agent-runbook
- Location: e2e/tests/end-user-personas.spec.ts:129:9

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/agent-runbook", waiting until "networkidle"

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | 
  3   | /**
  4   |  * End-user persona walk — every audience type the site serves.
  5   |  *
  6   |  * Audiences mirror client/src/components/lobby/asks.ts (9 segments).
  7   |  * Each persona: lands on their primary surface, sees honest copy, no crash,
  8   |  * and can reach Council OS / verify / agent runbook.
  9   |  *
  10  |  * Run locally:
  11  |  *   npm run build:client
  12  |  *   npx vite preview --config client/vite.config.ts --port 4173 --strictPort &
  13  |  *   BASE_URL=http://localhost:4173 npx playwright test end-user-personas --project=chromium
  14  |  */
  15  | 
  16  | type Persona = {
  17  |   id: string;
  18  |   label: string;
  19  |   routes: string[];
  20  |   mustSee: RegExp;
  21  |   /** Optional CTA text to click */
  22  |   cta?: string;
  23  | };
  24  | 
  25  | const PERSONAS: Persona[] = [
  26  |   {
  27  |     id: "public",
  28  |     label: "Curious public",
  29  |     routes: ["/", "/honesty", "/methodology"],
  30  |     mustSee: /measure|not certif|Council of AI/i,
  31  |   },
  32  |   {
  33  |     id: "builder",
  34  |     label: "Builder",
  35  |     routes: ["/agent-runbook", "/instruments", "/gspc-verify", "/api-docs"],
  36  |     mustSee: /verify|gspc|instrument|curl|api/i,
  37  |   },
  38  |   {
  39  |     id: "insurer",
  40  |     label: "Insurer",
  41  |     routes: ["/insurers", "/gspc-scoreboard", "/dashboard"],
  42  |     mustSee: /insur|underwrit|evidence|measure/i,
  43  |   },
  44  |   {
  45  |     id: "regulator",
  46  |     label: "Regulator",
  47  |     routes: ["/for/regulator", "/regulators", "/article-50"],
  48  |     mustSee: /regulat|Article|supervis|measure/i,
  49  |   },
  50  |   {
  51  |     id: "compliance",
  52  |     label: "Compliance & legal",
  53  |     routes: ["/eu-ai-act", "/checklist", "/crosswalk"],
  54  |     mustSee: /AI Act|compliance|requirement|framework/i,
  55  |   },
  56  |   {
  57  |     id: "procurement",
  58  |     label: "Procurement",
  59  |     routes: ["/compare", "/pricing", "/enterprise"],
  60  |     mustSee: /measure|vendor|pricing|enterprise/i,
  61  |   },
  62  |   {
  63  |     id: "board",
  64  |     label: "Board & exec",
  65  |     routes: ["/dashboard", "/methodology", "/ownership"],
  66  |     mustSee: /measure|dashboard|Council|ownership/i,
  67  |   },
  68  |   {
  69  |     id: "researcher",
  70  |     label: "Researcher",
  71  |     routes: ["/receipt-spec", "/methodology", "/refutation-ledger"],
  72  |     mustSee: /method|receipt|spec|n≥|reproduc/i,
  73  |   },
  74  |   {
  75  |     id: "press",
  76  |     label: "Press",
  77  |     routes: ["/pressroom", "/honesty", "/blog/receipt-spec-0-1"],
  78  |     mustSee: /Council|measure|honest|receipt/i,
  79  |   },
  80  | ];
  81  | 
  82  | const LAYER0_ROUTES = [
  83  |   "/engine-axis",
  84  |   "/instruments",
  85  |   "/venturi",
  86  |   "/legacy",
  87  |   "/agent-runbook",
  88  |   "/receipt-spec",
  89  |   "/ownership",
  90  | ];
  91  | 
  92  | async function assertHealthy(page: Page, route: string, mustSee: RegExp) {
  93  |   const errors: string[] = [];
  94  |   page.on("pageerror", (e) => errors.push(e.message));
  95  | 
> 96  |   const response = await page.goto(route, { waitUntil: "networkidle", timeout: 45000 });
      |                               ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  97  |   expect(response?.status(), `${route} status`).toBeLessThan(400);
  98  | 
  99  |   // SPA: wait for React hydration
  100 |   await page.waitForTimeout(2000);
  101 | 
  102 |   const body = (await page.textContent("body")) || "";
  103 |   expect(body.length, `${route} content length`).toBeGreaterThan(200);
  104 |   expect(body, `${route} must-see`).toMatch(mustSee);
  105 |   expect(body, `${route} no error UI`).not.toMatch(/Something went wrong/);
  106 |   expect(body, `${route} no 404 title`).not.toMatch(/404 — Not found/i);
  107 | 
  108 |   const critical = errors.filter(
  109 |     (e) =>
  110 |       e.includes("is not defined") ||
  111 |       e.includes("Failed to fetch dynamically imported module") ||
  112 |       e.includes("Cannot read properties of"),
  113 |   );
  114 |   expect(critical, `${route} JS errors`).toEqual([]);
  115 | }
  116 | 
  117 | test.describe("Layer 0 + standards surfaces", () => {
  118 |   for (const route of LAYER0_ROUTES) {
  119 |     test(`${route} loads without crash`, async ({ page }) => {
  120 |       await assertHealthy(page, route, /Council|measure|Eunomia|receipt|ownership|engine|venturi|agent/i);
  121 |     });
  122 |   }
  123 | });
  124 | 
  125 | test.describe("End-user personas — primary surfaces", () => {
  126 |   for (const persona of PERSONAS) {
  127 |     test.describe(persona.label, () => {
  128 |       for (const route of persona.routes) {
  129 |         test(`${route}`, async ({ page }) => {
  130 |           await assertHealthy(page, route, persona.mustSee);
  131 |         });
  132 |       }
  133 |     });
  134 |   }
  135 | });
  136 | 
  137 | test.describe("Council OS — lobby opens for all entry points", () => {
  138 |   const entryPoints = ["/", "/instruments", "/dashboard", "/engine-axis"];
  139 | 
  140 |   for (const route of entryPoints) {
  141 |     test(`lobby CTA from ${route}`, async ({ page }) => {
  142 |       await page.goto(route, { waitUntil: "domcontentloaded" });
  143 |       await page.waitForTimeout(1000);
  144 | 
  145 |       const councilBtn = page
  146 |         .locator(
  147 |           'button:has-text("Council"), a:has-text("Council OS"), button:has-text("Open Council"), [aria-label*="Council"]',
  148 |         )
  149 |         .first();
  150 | 
  151 |       if (await councilBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
  152 |         await councilBtn.click();
  153 |         await page.waitForTimeout(1500);
  154 |         const body = (await page.textContent("body")) || "";
  155 |         expect(body).toMatch(/Council OS|Ask the Council|Measure/i);
  156 |       }
  157 |     });
  158 |   }
  159 | });
  160 | 
  161 | test.describe("DSH — dashboard parity", () => {
  162 |   test("dashboard shows Layer 0 Eunomia cards", async ({ page }) => {
  163 |     await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  164 |     await page.waitForTimeout(1500);
  165 |     const body = (await page.textContent("body")) || "";
  166 |     expect(body).toMatch(/Engine Axis|Eunomia|Bond Venturi/i);
  167 |     expect(body).toMatch(/Ask in Lobby|Open/i);
  168 |   });
  169 | 
  170 |   test("dashboard sidebar has agent runbook + receipt spec", async ({ page }) => {
  171 |     await page.setViewportSize({ width: 1280, height: 800 });
  172 |     await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  173 |     await page.waitForTimeout(1000);
  174 |     const body = (await page.textContent("body")) || "";
  175 |     expect(body).toMatch(/Agent runbook|RECEIPT-SPEC|Trust floor/i);
  176 |   });
  177 | });
  178 | 
  179 | test.describe("Mobile — key personas", () => {
  180 |   test.use({ viewport: { width: 390, height: 844 } });
  181 | 
  182 |   const mobileRoutes = ["/", "/agent-runbook", "/receipt-spec", "/insurers", "/dashboard"];
  183 | 
  184 |   for (const route of mobileRoutes) {
  185 |     test(`${route} on mobile`, async ({ page }) => {
  186 |       await assertHealthy(page, route, /Council|measure|agent|receipt|insur|dashboard/i);
  187 |     });
  188 |   }
  189 | });
  190 | 
  191 | test.describe("API smoke — persona ask questions", () => {
  192 |   const asks: Record<string, string> = {
  193 |     public: "In plain words, what does the Council of AI actually measure?",
  194 |     builder: "How is a measurement card signed, and how do I verify one without trusting you?",
  195 |     insurer: "What can an underwriter rely on in a signed measurement card?",
  196 |     regulator: "Which figures on the board are safe to quote today, and which are not?",
```