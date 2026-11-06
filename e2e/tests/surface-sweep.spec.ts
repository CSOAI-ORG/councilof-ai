import { test, expect, type Frame, type Page } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  surfaceInventory,
  rejectGenericNotFound,
} from "../support/surfaceInventory.mjs";
import { frozenBuildBoard } from "../support/boardFixture.mjs";
import {
  nextViewportStop,
  primaryScrollMetrics,
} from "../support/scrollCoverage.mjs";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const inventory = surfaceInventory(root);
const board = frozenBuildBoard(root);
const canonical = new Set([
  "https://councilof.ai",
  "https://www.councilof.ai",
  "https://csoai.org",
  "https://www.csoai.org",
]);
const cases: any[] = [
  ...inventory.cases,
  { id: "degraded:models:503", kind: "degraded", mode: "503", url: "/models" },
  {
    id: "degraded:models:malformed",
    kind: "degraded",
    mode: "malformed",
    url: "/models",
  },
];

/** Frozen-board UI acceptance, separate unavailable cases and exact artifact reads. No paid/auth actions. */
for (const surface of cases) {
  test(`${surface.id} ${surface.execution ?? surface.state ?? "surface"}`, async ({
    page,
    request: api,
    baseURL,
  }, testInfo) => {
    if (surface.execution === "artifact-read") {
      const response = await api.get(surface.url, { maxRedirects: 0 });
      expect(response.status(), "published artifact must be readable").toBe(
        200,
      );
      expect(response.headers()["content-type"]).toMatch(/text\/html/i);
      const bytes = await response.body();
      expect(bytes.length).toBeGreaterThan(0);
      const digest = createHash("sha256").update(bytes).digest("hex");
      expect(digest, "frozen artifact must retain exact source bytes").toBe(
        surface.artifact.sha256,
      );
      await testInfo.attach("artifact-read", {
        body: JSON.stringify({
          surface,
          servedSHA256: digest,
          scope:
            "HTTP readability and immutable-byte identity; not a healthy UI page",
        }),
        contentType: "application/json",
      });
      return;
    }
    const origin = new URL(baseURL!).origin;
    const errors: string[] = [],
      proxyErrors: string[] = [];
    let blockedExternal = 0;
    const documents: Array<{ url: string; status: number }> = [];
    page.on("response", (response) => {
      if (response.request().isNavigationRequest())
        documents.push({ url: response.url(), status: response.status() });
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.routeWebSocket(/.*/, (socket) => {
      blockedExternal++;
      socket.close();
    });
    await page.route("**/*", async (route) => {
      const request = route.request(),
        url = new URL(request.url());
      if (!["http:", "https:"].includes(url.protocol)) return route.continue();
      if (!["GET", "HEAD", "OPTIONS"].includes(request.method()))
        return route.fulfill({
          status: 503,
          json: { error: "offline_surface_check", state: "UNREACHABLE" },
        });
      const owned = canonical.has(url.origin) || url.origin === origin;
      if (owned && url.pathname === "/api/gspc") {
        if (surface.mode === "503")
          return route.fulfill({
            status: 503,
            json: { error: "fixture_service_unavailable" },
          });
        if (surface.mode === "malformed")
          return route.fulfill({
            status: 200,
            json: { schema: "fixture-malformed", axes: null },
          });
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: {
            "access-control-allow-origin": "*",
            "x-csoai-e2e-source": "frozen-build-reference",
          },
          body: board.body,
        });
      }
      if (
        owned &&
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
        try {
          const response = await fetch(local, {
            method: request.method(),
            redirect: "manual",
            signal: AbortSignal.timeout(5_000),
          });
          await route.fulfill({
            status: response.status,
            headers: {
              ...Object.fromEntries(response.headers),
              "access-control-allow-origin": "*",
            },
            body: Buffer.from(await response.arrayBuffer()),
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

    const inspect = (context: Page | Frame = page) =>
      context.evaluate(() => {
        const visible = (node: Element) =>
          Boolean(node.getClientRects().length);
        const body = document.body.innerText.trim();
        const scopes = [
          ...document.querySelectorAll("main,[role=main]"),
        ].filter(visible);
        const controls = [
          ...document.querySelectorAll(
            "button button,button a[href],a[href] button,a[href] a[href],button input,button select,button textarea",
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
            const url = new URL(img.currentSrc || img.src, location.href);
            if (
              url.origin !== location.origin ||
              !visible(img) ||
              !img.complete ||
              img.naturalWidth !== 0
            )
              return false;
            if (url.pathname.startsWith("/api/")) {
              unavailableImages.push(img.getAttribute("src"));
              return false;
            }
            return true;
          })
          .map((img) => img.getAttribute("src"));
        return {
          bodyLength: body.length,
          contentLength: scopes.length
            ? Math.max(
                ...scopes.map((node) => node.textContent?.trim().length ?? 0),
              )
            : body.length,
          overflow: document.documentElement.scrollWidth - innerWidth,
          controls,
          broken,
          unavailableImages,
          boundary: Boolean(
            document.querySelector(
              '[data-testid="root-error-boundary"],[data-testid="app-error-boundary"],[data-testid="error-boundary"],[data-testid="page-recovery"]',
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

    const assertIdentity = async () => {
      if (surface.kind === "company-signed-out") {
        const company = page.getByTestId("company-case-panel");
        await expect(company).toBeVisible();
        await expect(
          company.getByText(
            "Sign in to open your authorized company workspace.",
            { exact: true },
          ),
        ).toBeVisible();
        const login = new URL(
          (await company
            .getByRole("link", { name: "Sign in to Council", exact: true })
            .getAttribute("href"))!,
          origin,
        );
        expect(login.pathname.replace(/\/$/, "")).toBe("/login");
        expect(login.searchParams.get("next")).toBe(
          "/dashboard/?workspace=company",
        );
      }
      if (surface.kind === "unknown") {
        await expect(page).toHaveTitle(/Page not found/i);
        await expect(page.locator('head meta[name="robots"]')).toHaveAttribute(
          "content",
          /noindex/i,
        );
      }
      if (
        surface.expectedTerminal === "declared-not-found" ||
        surface.url === "/404.html"
      ) {
        await expect(page).toHaveTitle(/Page not found|404/i);
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
      if (surface.expected?.heading)
        await expect(
          page.getByRole("heading", {
            level: surface.expected.headingLevel ?? 1,
            name: surface.expected.heading,
            exact: true,
          }),
        ).toBeVisible();
      if (surface.expected?.model) {
        const links = page.getByRole("link", {
          name: "signed card ↗",
          exact: true,
        });
        await expect(
          links,
          "known model must render actual findings",
        ).toHaveCount(surface.expected.findingLinks.length);
        expect(
          await links.evaluateAll((nodes) =>
            nodes.map((node) => node.getAttribute("href")).sort(),
          ),
        ).toEqual([...surface.expected.findingLinks].sort());
        await expect(
          page.getByText(
            /No signed findings for|Could not load the findings index/,
          ),
        ).toHaveCount(0);
      }
      if (surface.expected?.axis) {
        await expect(page.locator("#axis-deep-dive")).toBeVisible();
        await expect(page.locator("#axis-deep-dive")).toContainText(
          surface.expected.axis,
        );
        await expect(page.getByText(/No axis named/)).toHaveCount(0);
      }
      if (surface.expected?.jailFolder)
        await expect(page.getByTestId("jail-folder")).toBeVisible();
      if (surface.kind === "degraded") {
        await expect(page.getByText(/UNREACHABLE/).first()).toBeVisible();
        await expect(
          page.getByRole("button", { name: /retry/i }),
        ).toBeVisible();
      }
      if (rejectGenericNotFound(surface))
        await expect(
          page
            .locator('h1:visible,[role="heading"][aria-level="1"]:visible')
            .filter({
              hasText:
                /^(?:404(?:\b.*)?|(?:page|route|mcp|model|answer|note|course|system|record)?\s*not found[.!]?)$/i,
            }),
          "known page must not silently fall through to not-found",
        ).toHaveCount(0);
    };

    const settleVisibleImages = (context: Page | Frame = page) =>
      context.waitForFunction(
        () =>
          [...document.images].every((img) => {
            const box = img.getBoundingClientRect(),
              url = new URL(img.currentSrc || img.src, location.href);
            const canvas = img
              .closest(
                '[data-testid="gspc-workspace-home"],[data-testid="dashboard-tool-canvas"]',
              )
              ?.getBoundingClientRect();
            return (
              !box.width ||
              !box.height ||
              box.bottom <= 0 ||
              box.top >= innerHeight ||
              (canvas &&
                (box.bottom <= canvas.top || box.top >= canvas.bottom)) ||
              url.origin !== location.origin ||
              url.pathname.startsWith("/api/") ||
              img.complete
            );
          }),
        null,
        { timeout: 5_000 },
      );
    const genericNotFound =
      /^(?:404(?:\b.*)?|(?:page|route|mcp|model|answer|note|course|system|record)?\s*not found[.!]?)$/i;
    const documentHealth = async (
      context: Page | Frame,
      phase: string,
      headingRequired = true,
    ) => {
      await expect(context.locator("body")).not.toHaveText(/^\s*$/);
      if (headingRequired)
        await expect(
          context
            .locator("h1:visible,h2:visible,[role=heading]:visible")
            .first(),
        ).toBeVisible();
      await expect.poll(() => context.title()).toMatch(/\S/);
      await expect
        .poll(async () => (await inspect(context)).contentLength, {
          message: "substantive main content must settle",
        })
        .toBeGreaterThan(30);
      await expect
        .poll(async () => (await inspect(context)).bodyLength)
        .toBeGreaterThan(60);
      await settleVisibleImages(context);
      const state = await inspect(context);
      await testInfo.attach(`health-${phase}`, {
        body: JSON.stringify({
          surface,
          state,
          errors,
          proxyErrors,
          landed: context.url(),
          context:
            "Exact frozen build board; other APIs unavailable, external and non-read execution blocked",
          boardFixture: board.metadata,
        }),
        contentType: "application/json",
      });
      expect(
        state.boundary || state.fallback,
        "no application recovery boundary",
      ).toBe(false);
      expect(state.overflow, "no horizontal overflow").toBeLessThanOrEqual(1);
      expect(state.controls, "no nested interactive controls").toEqual([]);
      expect(
        state.broken,
        "loaded same-origin images must not be broken",
      ).toEqual([]);
      expect(errors, "no uncaught JavaScript errors").toEqual([]);
      expect(proxyErrors, "canonical resource proxy must succeed").toEqual([]);
      expect(new URL(context.url()).origin).toBe(origin);
      if (context !== page)
        await expect(
          context
            .locator('h1:visible,[role="heading"][aria-level="1"]:visible')
            .filter({ hasText: genericNotFound }),
          "published child must not be a generic not-found shell",
        ).toHaveCount(0);
      return state;
    };

    // Await the requested pane, not a valid-looking server-rendered Home fallback.
    const settleWorkspace = async () => {
      const contract = surface.workspace;
      if (!contract) return;
      if (contract.canonicalRetirement) {
        await expect
          .poll(() => new URL(page.url()).pathname.replace(/\/$/, ""))
          .toBe("/dashboard");
        await expect
          .poll(() => new URL(page.url()).searchParams.get("tab"))
          .toBe("home");
      }
      await expect(
        page.getByTestId(
          contract.pane === "home"
            ? "gspc-workspace-home"
            : `dashboard-pane-${contract.pane}`,
        ),
      ).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId("dashboard-pane-loading")).toHaveCount(0);
      if (contract.pane !== "home")
        await expect(page.getByTestId("dashboard-tool-canvas")).toBeVisible();
    };
    const paneFrame = async (): Promise<Frame | null> => {
      const contract = surface.workspace;
      if (!contract?.framePath) return null;
      const pane = page.getByTestId(`dashboard-pane-${contract.pane}`);
      // Known local pages must actually load. A readable parent placeholder proves no child health.
      const element = pane.locator("iframe");
      await expect(element).toHaveCount(1);
      await expect(element).toBeVisible();
      await expect(page.getByTestId("dashboard-embedded-loading")).toHaveCount(
        0,
        { timeout: 15_000 },
      );
      await expect(page.getByTestId("dashboard-embedded-error")).toHaveCount(0);
      const requestedDocument = new URL(
        (await element.getAttribute("src"))!,
        origin,
      ).href;
      const frame = await (await element.elementHandle())!.contentFrame();
      expect(
        frame,
        "owned pane iframe must have a document context",
      ).not.toBeNull();
      await expect
        .poll(() => {
          const url = new URL(frame!.url());
          return {
            origin: url.origin,
            path: url.pathname.replace(/\/$/, ""),
            embed: url.searchParams.get("embed"),
          };
        })
        .toEqual({
          origin,
          path: contract.authReturn
            ? "/login"
            : contract.framePath.replace(/\/$/, ""),
          embed: "1",
        });
      if (contract.authReturn) {
        await expect(
          frame!.getByRole("heading", {
            level: 1,
            name: "Sign in to Council OS",
            exact: true,
          }),
        ).toBeVisible();
        await expect
          .poll(() => new URL(frame!.url()).searchParams.get("next"), {
            message:
              "signed-out embedded account page must retain its safe return context",
          })
          .toBe(contract.authReturn);
      }
      await expect
        .poll(
          () =>
            [...documents]
              .reverse()
              .find((document) => document.url === requestedDocument)?.status,
          {
            message:
              "published same-origin child document must have a successful HTTP response",
          },
        )
        .toBeLessThan(400);
      if (contract.frameHeading)
        await expect(
          frame!.getByRole("heading", {
            level: 1,
            name: contract.frameHeading,
            exact: true,
          }),
        ).toBeVisible();
      return frame;
    };
    const assertHealth = async (phase: string) => {
      await settleWorkspace();
      await assertIdentity();
      const frame = await paneFrame();
      if (frame) await documentHealth(frame, `${phase}-child`);
      return documentHealth(page, phase, surface.workspace?.pane !== "console");
    };
    const scrollTo = (context: Page | Frame, target: string, top: number) =>
      context.evaluate(
        ({ top, target }) => {
          const element =
            target === "window" ? window : document.querySelector(target);
          if (!element)
            throw new Error(
              "Primary scroll canvas disappeared; coverage incomplete",
            );
          element.scrollTo({ top, behavior: "instant" });
        },
        { top, target },
      );
    const coverScroll = async (context: Page | Frame, label: string) => {
      const coverage = {
        complete: false,
        maxSteps: 300,
        maxMs: 20_000,
        context: context.url(),
        target: (await context.evaluate(primaryScrollMetrics)).target,
        stops: [] as Array<{
          position: number;
          height: number;
          viewport: number;
          overflow: number;
        }>,
      };
      const started = Date.now();
      let bottomSeen = false;
      try {
        await scrollTo(context, coverage.target, 0);
        while (true) {
          await settleVisibleImages(context);
          const metrics = await context.evaluate(primaryScrollMetrics);
          expect(
            metrics.target,
            "primary canvas must remain stable during coverage",
          ).toBe(coverage.target);
          coverage.stops.push(metrics);
          expect(
            metrics.overflow,
            `no horizontal overflow at viewport stop ${coverage.stops.length}`,
          ).toBeLessThanOrEqual(1);
          expect(
            (await inspect(context)).broken,
            `no broken image at viewport stop ${coverage.stops.length}`,
          ).toEqual([]);
          const next = nextViewportStop(metrics, {
            steps: coverage.stops.length,
            elapsedMs: Date.now() - started,
            maxSteps: coverage.maxSteps,
            maxMs: coverage.maxMs,
          });
          if (next.done && bottomSeen) {
            coverage.complete = true;
            break;
          }
          bottomSeen = next.done;
          if (!next.done) await scrollTo(context, coverage.target, next.target);
          await page.waitForTimeout(next.done ? 100 : 40);
        }
      } finally {
        await testInfo.attach(`scroll-coverage${label}`, {
          body: JSON.stringify({
            ...coverage,
            elapsedMs: Date.now() - started,
          }),
          contentType: "application/json",
        });
      }
      return coverage;
    };

    const response = await page.goto(surface.url, {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    expect(response?.status()).toBeLessThan(400);
    await page.waitForTimeout(350);
    const initial = await assertHealth("initial"),
      landed = page.url();
    const scrollCoverage = await coverScroll(page, "");
    const child = await paneFrame();
    const childScrollCoverage = child
      ? await coverScroll(child, "-child")
      : null;
    const bottom = await assertHealth("bottom");
    await expect(page).toHaveURL(landed);
    const reloadedResponse = await page.reload({
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    expect(reloadedResponse?.status()).toBeLessThan(400);
    const reloaded = await assertHealth("reload");
    await expect(page).toHaveURL(landed);
    // Repeat full health after reload at both ends, retaining the same pane/child identity.
    // Mid-page images were visited above; the full long-page traversal is not repeated.
    const reloadedChild = await paneFrame();
    if (reloadedChild) {
      const metrics = await reloadedChild.evaluate(primaryScrollMetrics);
      await scrollTo(reloadedChild, metrics.target, metrics.height);
    }
    const reloadedMetrics = await page.evaluate(primaryScrollMetrics);
    await scrollTo(page, reloadedMetrics.target, reloadedMetrics.height);
    const reloadedBottom = await assertHealth("reload-bottom");
    await expect(page).toHaveURL(landed);
    await testInfo.attach("surface-context", {
      body: JSON.stringify({
        surface,
        inventory: { ...inventory, cases: undefined },
        boardFixture: board.metadata,
        blockedExternal,
        landed,
        initial,
        bottom,
        reloaded,
        scrollCoverage,
        childScrollCoverage,
        reloadedBottom,
      }),
      contentType: "application/json",
    });
  });
}
