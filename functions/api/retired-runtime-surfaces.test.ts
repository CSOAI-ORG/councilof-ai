import { describe, expect, it } from "vitest";
import { onRequestGet as growthLoops } from "./growth-loops";
import { onRequestGet as prodReadiness } from "./prod-readiness";
import { onRequestGet as router } from "./router";
import { onRequestGet as synthesis } from "./synthesis";

const ORIGIN = "https://councilof.ai";

const context = (path: string) =>
  ({ request: new Request(`${ORIGIN}${path}`), env: {}, params: {} }) as never;

async function expectRetired(response: Response, endpoint: string) {
  expect(response.status).toBe(503);
  expect(response.headers.get("cache-control")).toBe("no-store");
  await expect(response.json()).resolves.toMatchObject({
    schema: "csoai.retired-endpoint/0.1",
    status: "UNAVAILABLE",
    code: "RETIRED",
    endpoint,
  });
}

describe("retired runtime claim surfaces", () => {
  it.each([
    ["/api/growth-loops", growthLoops],
    ["/api/prod-readiness", prodReadiness],
    ["/api/synthesis", synthesis],
  ] as const)("returns an explicit 503 from %s", async (path, handler) => {
    await expectRetired(await handler(context(path)), path);
  });

  it.each([
    ["/api/router/growth-loops", "/api/growth-loops"],
    ["/api/router/loops", "/api/growth-loops"],
    ["/api/router/prod-readiness", "/api/prod-readiness"],
    ["/api/router/synthesis", "/api/synthesis"],
  ] as const)(
    "does not redirect retired router alias %s to a static manifest",
    async (path, endpoint) => {
      await expectRetired(await router(context(path)), endpoint);
    },
  );

  it("lists only evidence-neutral route templates", async () => {
    const response = await router(context("/api/router"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      schema: "csoai.router/0.1",
      routes: {
        discover: "/.well-known/{slug}.json",
        interop: "/interop/{slug}.json",
        packages: "/packages/{name}/package.json",
      },
      total_routes: 3,
    });
  });
});
