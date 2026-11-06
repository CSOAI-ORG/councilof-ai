import { test, expect } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  surfaceInventory,
  rejectGenericNotFound,
} from "../support/surfaceInventory.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const inventory = surfaceInventory(root);
const canonical = new Set([
  "https://councilof.ai",
  "https://www.councilof.ai",
  "https://csoai.org",
  "https://www.csoai.org",
]);

/** Built-byte/offline acceptance. No credentials, payment, form submission or external execution. */
for (const surface of inventory.cases) {
  test(`${surface.id} ${surface.state ?? "surface"}`, async ({
    page,
    baseURL,
  }, testInfo) => {
    const origin = new URL(baseURL!).origin;
    const errors: string[] = [];
    const proxyErrors: string[] = [];
    let blockedExternal = 0;
    page.on("pageerror", (error) => errors.push(error.message));
    await page.routeWebSocket(/.*/, (socket) => {
      blockedExternal++;
      socket.close();
    });
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (!["http:", "https:"].includes(url.protocol)) return route.continue();
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method()))
        return route.fulfill({
          status: 503,
          json: { error: "offline_surface_check", state: "UNREACHABLE" },
        });
      if (
        (canonical.has(url.origin) || url.origin === origin) &&
        (url.pathname.startsWith("/api/") ||
          /^\/mcp(?:\/|$)/.test(url.pathname))
      )
        return route.fulfill({
          status: 503,
          json: { error: "offline_surface_check", state: "UNREACHABLE" },
        });
      if (canonical.has(url.origin) && url.origin !== origin) {
        const local = origin + url.pathname + url.search;
        if (request.isNavigationRequest())
          return route.fulfill({ status: 302, headers: { location: local } });
        // Browser route.continue cannot rewrite HTTPS to local HTTP. Fetch only the
        // selected local origin in Node, never follow a redirect, and copy response bytes.
        try {
          const response = await fetch(local, {
            method: request.method(),
            redirect: "manual",
            signal: AbortSignal.timeout(5_000),
          });
          const body = Buffer.from(await response.arrayBuffer());
          await route.fulfill({
            status: response.status,
            headers: {
              ...Object.fromEntries(response.headers),
              "access-control-allow-origin": "*",
            },
            body,
          });
        } catch (error) {
          if (!page.isClosed()) {
            proxyErrors.push(`${url.pathname}: ${String(error).slice(0, 160)}`);
            await route.abort().catch(() => {});
          }
        }
        return;
      }
      if (url.origin !== origin) {
        blockedExternal++;
        return route.abort("blockedbyclient");
      }
      return route.continue();
    });
    const response = await page.goto(surface.url, {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    expect(response?.status(), "document must answer below400").toBeLessThan(
      400,
    );
    await expect(page.locator("body")).not.toHaveText(/^\s*$/);
    await expect(
      page.locator("h1,h2,[role=heading]").first(),
      "page must expose a heading",
    ).toBeVisible();
    await expect(page).toHaveTitle(/\S/);
    const assertRouteContract = async () => {
      if (surface.kind === "unknown") {
        await expect(page).toHaveTitle(/Page not found/i);
        await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
          "content",
          /noindex/i,
        );
      }
      if (surface.template === "/courses/:id") {
        await expect
          .poll(() => new URL(page.url()).searchParams.get("tab"))
          .toBe("learn");
        expect(new URL(page.url()).pathname.replace(/\/$/, "")).toBe(
          "/dashboard",
        );
        await expect(
          page.getByRole("button", {
            name: /enroll|buy course|pay with stripe/i,
          }),
        ).toHaveCount(0);
      }
    };
    await assertRouteContract();
    await page.waitForTimeout(350);
    const inspect = async () =>
      page.evaluate(() => {
        const visible = (node: Element) =>
          Boolean(node.getClientRects().length);
        const body = document.body.innerText.trim();
        const scopes = [
          ...document.querySelectorAll("main,[role=main]"),
        ].filter(visible);
        const controls = [
          ...document.querySelectorAll(
            "button button, button a[href], a[href] button, a[href] a[href], button input, button select, button textarea",
          ),
        ]
          .filter(visible)
          .map((node) => ({
            tag: node.tagName,
            text: node.textContent?.trim().slice(0, 160),
            parent: node.parentElement?.tagName,
            href: node.closest("a")?.getAttribute("href"),
          }));
        const unavailableImages: (string | null)[] = [];
        const broken = [...document.images]
          .filter((img) => {
            try {
              const url = new URL(img.currentSrc || img.src, location.href);
              if (
                url.origin !== location.origin ||
                !img.complete ||
                img.naturalWidth !== 0 ||
                !visible(img)
              )
                return false;
              if (url.pathname.startsWith("/api/")) {
                unavailableImages.push(img.getAttribute("src"));
                return false;
              }
              return true;
            } catch {
              return false;
            }
          })
          .map((img) => img.getAttribute("src"));
        return {
          bodyLength: body.length,
          contentLength: scopes.length
            ? Math.max(
                ...scopes.map((node) => node.textContent?.trim().length ?? 0),
              )
            : body.length,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          controls,
          broken,
          unavailableImages,
          boundary: Boolean(
            document.querySelector(
              '[data-testid="root-error-boundary"], [data-testid="app-error-boundary"], [data-testid="error-boundary"], [data-testid="page-recovery"]',
            ),
          ),
          fallback: [...document.querySelectorAll("h1,h2,[role=heading]")].some(
            (node) =>
              /^(Something went wrong|An unexpected error occurred)[.!]?$/.test(
                node.textContent?.trim() ?? "",
              ),
          ),
        };
      });
    await expect
      .poll(async () => (await inspect()).contentLength, {
        message: "main content must settle beyond a loading label",
      })
      .toBeGreaterThan(30);
    await expect
      .poll(async () => (await inspect()).bodyLength, {
        message: "rendered body must settle beyond its loading announcement",
      })
      .toBeGreaterThan(60);
    const before = await inspect();
    if (rejectGenericNotFound(surface)) {
      await expect(
        page
          .locator('h1:visible,[role="heading"][aria-level="1"]:visible')
          .filter({
            hasText:
              /^(?:404(?:\b.*)?|(?:page|route|mcp|model|answer|note|course|system|record)?\s*not found[.!]?)$/i,
          }),
        "known published page must not fall through to a not-found screen",
      ).toHaveCount(0);
    }
    await testInfo.attach("surface-initial-context", {
      body: JSON.stringify(
        {
          surface,
          before,
          errors,
          proxyErrors,
          landed: page.url(),
          context:
            "offline built checkout; API images explicitly unavailable, externals and non-read requests blocked",
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
    expect(before.bodyLength, "substantive rendered text").toBeGreaterThan(60);
    expect(
      before.contentLength,
      "main content must not be blank",
    ).toBeGreaterThan(30);
    expect(
      before.boundary || before.fallback,
      "no application error boundary",
    ).toBe(false);
    expect(before.overflow, "no horizontal overflow").toBeLessThanOrEqual(1);
    expect(before.controls, "no nested interactive controls").toEqual([]);
    expect(before.broken, "no broken same-origin visible images").toEqual([]);
    expect(errors, "no uncaught JavaScript errors").toEqual([]);
    expect(proxyErrors, "local canonical-resource proxy must succeed").toEqual(
      [],
    );
    expect(
      new URL(page.url()).origin,
      "navigation remains on selected test origin",
    ).toBe(origin);
    const landed = page.url();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(200);
    const bottom = await inspect();
    expect(bottom.overflow, "no overflow after scrolling").toBeLessThanOrEqual(
      1,
    );
    expect(bottom.broken, "lazy images load without breaking").toEqual([]);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 15_000 });
    await expect(page).toHaveURL(landed);
    await assertRouteContract();
    await expect(page.locator("h1,h2,[role=heading]").first()).toBeVisible();
    expect(errors, "no uncaught errors after reload").toEqual([]);
    await testInfo.attach("surface-context", {
      body: JSON.stringify(
        {
          surface,
          inventory: { ...inventory, cases: undefined },
          context:
            "offline built checkout; API unavailable, externals and non-read requests blocked",
          blockedExternal,
          landed,
          before,
          bottom,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  });
}
