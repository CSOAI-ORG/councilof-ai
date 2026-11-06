import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  buyerRequestPath,
  buyerTestOrigin,
} from "../../e2e/support/buyerOrigin";

describe("buyer checks stay on their selected test origin", () => {
  it.each(["http://127.0.0.1:4180", "https://council-preview.pages.dev"])(
    "routes published resources to %s without changing canonical metadata",
    (origin) => {
      const published =
        "https://councilof.ai/api/evidence-bundle?obligation=article-50&subject=model%3Aexample";
      const path = buyerRequestPath(published);
      expect(new URL(path, buyerTestOrigin(origin)).href).toBe(
        origin +
          "/api/evidence-bundle?obligation=article-50&subject=model%3Aexample",
      );
      expect(published).toBe(
        "https://councilof.ai/api/evidence-bundle?obligation=article-50&subject=model%3Aexample",
      );
    },
  );

  it.each([
    "https://external.example/api",
    "https://councilof.ai.evil.example/api",
    "http://councilof.ai/api",
    "https://user@councilof.ai/api",
    "https://councilof.ai//external.example/path",
    "https://councilof.ai/api#fragment",
    "/api/free-door",
  ])(
    "refuses a resource that cannot safely become a local request: %s",
    (url) => {
      expect(() => buyerRequestPath(url)).toThrow();
    },
  );

  it("uses canonical production only as the default selected origin", () => {
    expect(buyerTestOrigin(undefined)).toBe("https://councilof.ai");
    expect(buyerTestOrigin("http://localhost:4180/")).toBe(
      "http://localhost:4180",
    );
    expect(() => buyerTestOrigin("file:///tmp/site")).toThrow();
    expect(() =>
      buyerTestOrigin("https://user:secret@preview.example"),
    ).toThrow();
  });

  it("all explicit buyer contexts use the configured origin and refuse redirects, including the catalog resources", () => {
    const source = readFileSync(
      new URL("../../e2e/tests/buyer-journey.spec.ts", import.meta.url),
      "utf8",
    );
    expect(source.match(/baseURL: buyerTestOrigin\(baseURL\)/g)).toHaveLength(
      3,
    );
    expect(source.match(/maxRedirects: 0/g)).toHaveLength(3);
    expect(source).toContain("api.get(buyerRequestPath(url))");
    expect(source).toContain("api.get(buyerRequestPath(u))");
    expect(source).not.toMatch(/baseURL:\s*['"]https:\/\/councilof\.ai/);
  });
});

it("npm browser commands select the intended Playwright config", () => {
  const pkg = JSON.parse(
    readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
  );
  expect(pkg.scripts["test:e2e"]).toBe(
    "playwright test --config e2e/playwright.config.ts",
  );
  expect(pkg.scripts["test:e2e:ui"]).toBe(
    "playwright test --config e2e/playwright.config.ts --ui",
  );
});
