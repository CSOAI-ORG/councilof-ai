import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const matrix = JSON.parse(readFileSync(path.join(ROOT, "public/interop/gpai-matrix.json"), "utf8"));
const archive = JSON.parse(readFileSync(path.join(ROOT, "public/reports/daily-signal/index.json"), "utf8"));
const latest = archive.reports.find((report: { report_id: string }) => report.report_id === archive.latest_report_id);
const archivePath = "/reports/daily-signal/index.html";

// Isolate the built public journeys from analytics, model APIs and payment services.
// The happy path matrix and archive still come from the real built static assets.
test.beforeEach(async ({ context, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    if (url.origin !== origin || !["GET", "HEAD"].includes(request.method())) {
      await route.abort("blockedbyclient");
    } else if (url.pathname.startsWith("/api/")) {
      await route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"not available in static acceptance"}' });
    } else {
      await route.continue();
    }
  });
});

async function openMatrix(page: Page) {
  await page.goto("/gpai");
  await expect(page.getByRole("heading", { level: 1, name: "GPAI evidence matrix" })).toBeVisible();
  await expect(page.locator("table tbody tr")).toHaveCount(matrix.counts.total);
}

test("matrix renders every source identifier and its exact published state", async ({ page }) => {
  await openMatrix(page);
  await expect(page.getByText(`source date ${matrix.as_of}`, { exact: false })).toBeVisible();
  for (const status of ["WIRED", "PARTIAL", "UNMEASURED"]) {
    await expect(page.locator(`table tbody tr[data-status="${status}"]`)).toHaveCount(matrix.counts[status]);
  }
  const ids = await page.locator("table tbody tr td:first-child").allTextContents();
  expect(ids).toEqual(matrix.provisions.map((row: { provision_id: string }) => row.provision_id));
  const states = await page.locator("table tbody tr").evaluateAll(rows => rows.map(row => row.getAttribute("data-status")));
  expect(states).toEqual(matrix.provisions.map((row: { status: string }) => row.status));
  const toolLinks = await page.locator("table tbody tr td:last-child a").evaluateAll(links => links.map(link => link.getAttribute("href")));
  expect(toolLinks).toEqual(matrix.provisions.flatMap((row: { tooling_wired: { href: string }[] }) => row.tooling_wired.map(tool => tool.href)));
  await expect(page.getByText("WIRED means a tool is referenced; it does not establish that a legal duty is satisfied.")).toBeVisible();
});

test("matrix next steps lead to evidence products, verification and the real archive", async ({ page }) => {
  await openMatrix(page);
  const navigation = page.getByRole("navigation", { name: "Evidence next steps" });
  for (const [name, href] of [
    ["Daily evidence reports", archivePath],
    ["Explore GPAI evidence packs", "/gpai-evidence"],
    ["Services and free previews", "/services/"],
    ["Verify a record", "/gspc-verify"],
  ]) {
    await expect(navigation.getByRole("link", { name, exact: true })).toHaveAttribute("href", href);
  }
  await navigation.getByRole("link", { name: "Daily evidence reports", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${archivePath.replaceAll(".", "\\.")}$`));
  await expect(page.getByRole("heading", { name: "Daily evidence reports", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Maintain a claim", exact: true })).toHaveAttribute("href", "/claim-maintenance");
  await expect(page.getByRole("link", { name: "Corrections and review", exact: true })).toHaveAttribute("href", "/corrections");
});

test("an unavailable matrix shows no invented coverage and can be retried", async ({ page }) => {
  let unavailable = true;
  await page.route("**/interop/gpai-matrix.json", route => unavailable
    ? route.fulfill({ status: 503, body: "Unavailable" })
    : route.continue());
  await page.goto("/gpai");
  await expect(page.getByRole("alert")).toContainText("No coverage figures can be shown from this response.");
  await expect(page.locator("table tbody tr")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: /^WIRED —/ })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Evidence next steps" })).toBeVisible();
  unavailable = false;
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.locator("table tbody tr")).toHaveCount(matrix.counts.total);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("incomplete, inconsistent and unsafe matrix payloads fail closed", async ({ page }) => {
  const missingArray = structuredClone(matrix);
  delete missingArray.provisions;
  const countMismatch = structuredClone(matrix);
  countMismatch.counts.total += 1;
  const unsafeLink = structuredClone(matrix);
  unsafeLink.discovery_doors[0].href = "javascript:alert('unsafe')";
  let payload = missingArray;
  await page.route("**/interop/gpai-matrix.json", route => route.fulfill({ json: payload }));
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (payload of [missingArray, countMismatch, unsafeLink]) {
    await page.goto("/gpai");
    await expect(page.getByRole("alert")).toContainText("The evidence matrix is currently unavailable.");
    await expect(page.locator("table tbody tr")).toHaveCount(0);
    await expect(page.locator('a[href^="javascript:"],a[href^="data:"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Try again", exact: true })).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test("unmeasured identifiers are accessible by keyboard and remain separate", async ({ page }) => {
  await openMatrix(page);
  const toggle = page.getByRole("button", { name: `List the ${matrix.counts.UNMEASURED} UNMEASURED identifiers`, exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  const expanded = page.getByRole("button", { name: `Hide the ${matrix.counts.UNMEASURED} UNMEASURED identifiers`, exact: true });
  await expect(expanded).toHaveAttribute("aria-expanded", "true");
  const listedIds = await expanded.locator("xpath=following-sibling::div[1]").locator("span").allTextContents();
  expect(listedIds).toEqual(matrix.provisions.filter((row: { status: string }) => row.status === "UNMEASURED").map((row: { provision_id: string }) => row.provision_id));
  await expanded.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("table tbody tr")).toHaveCount(matrix.counts.total);
});

test("archive retains dated source links, exact report bytes and honest scope", async ({ page, request }) => {
  await page.goto(archivePath);
  await expect(page.getByRole("heading", { level: 1, name: "Daily evidence reports" })).toBeVisible();
  await expect(page.getByText("Unsigned derived report", { exact: true })).toBeVisible();
  await expect(page.locator(`main > p time[datetime="${archive.latest_report_day}"]`)).toBeVisible();
  const rows = page.getByRole("region", { name: "Report archive", exact: true }).locator("tbody tr");
  await expect(rows).toHaveCount(archive.report_count);
  for (const report of archive.reports) {
    const row = rows.filter({ has: page.getByRole("link", { name: "JSON", exact: true }).and(page.locator(`a[href="${report.json_path}"]`)) });
    await expect(row).toContainText(report.report_day);
    await expect(row).toContainText(report.report_id);
    await expect(row.getByRole("link", { name: "Markdown", exact: true })).toHaveAttribute("href", report.markdown_path);
    const response = await request.get(report.json_path);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("application/json");
    const bytes = await response.body();
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(report.report_id);
    expect(JSON.parse(bytes.toString()).as_of).toBe(report.report_day);
  }
  const indexResponse = await request.get("/reports/daily-signal/index.json");
  expect(await indexResponse.json()).toEqual(archive);
  expect(archive.signed).toBe(false);
  expect(archive.measurement_count).toBeNull();
  await expect(page.getByText("A report refresh is not a new measurement or a legal assessment.", { exact: false })).toBeVisible();
});

test("downloaded report and findings resolve to the same dated source", async ({ page, request }) => {
  await page.goto(archivePath);
  const downloadLink = page.getByRole("link", { name: "Download report", exact: true });
  await expect(downloadLink).toHaveAttribute("href", latest.markdown_path);
  const downloadEvent = page.waitForEvent("download");
  await downloadLink.click();
  const download = await downloadEvent;
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe(path.basename(latest.markdown_path));
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  expect(readFileSync(downloadPath!)).toEqual(readFileSync(path.join(ROOT, "public", latest.markdown_path)));
  const findingsLink = page.getByRole("link", { name: "Findings JSON", exact: true });
  await expect(findingsLink).toHaveAttribute("href", "/reports/daily-signal/findings.json");
  const response = await request.get((await findingsLink.getAttribute("href"))!);
  expect(response.ok()).toBe(true);
  const findings = await response.json();
  expect(findings.report_id).toBe(latest.report_id);
  expect(findings.report_day).toBe(latest.report_day);
  expect(findings.signed).toBe(false);
  await expect(page.locator("article.finding")).toHaveCount(findings.findings.length);
  for (const finding of findings.findings) {
    expect(finding.source.path).toBe(latest.json_path);
    expect(finding.source.report_sha256).toBe(latest.report_id);
    expect(finding.source.json_pointer).toMatch(/^\//);
  }
  const latestResponse = await request.get("/reports/daily-signal/latest.json");
  expect(createHash("sha256").update(await latestResponse.body()).digest("hex")).toBe(latest.report_id);
});

test("matrix and archive fit the viewport while their tables remain scrollable", async ({ page }) => {
  await openMatrix(page);
  for (const url of ["/gpai", archivePath]) {
    if (!page.url().endsWith(url)) await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll, `document overflow on ${url}`).toBeLessThanOrEqual(dimensions.width + 1);
    const mainLinks = page.locator(url === archivePath ? "main .actions a" : 'nav[aria-label="Evidence next steps"] a');
    for (const link of await mainLinks.all()) {
      const bounds = await link.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(dimensions.width + 1);
    }
  }
});
