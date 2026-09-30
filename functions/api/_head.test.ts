/**
 * HEAD on an x402 door answers what its GET answers, with no body, and never reaches payment
 * (functions/api/_head.ts, 2026-09-28). Before this, HEAD fell through to the static 404 on every
 * door except /api/proof. The door list is read from the manifest function, like
 * _manifest_doors.test.ts, so a door added there is covered here the moment it exists.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { onRequestGet as manifest } from "../.well-known/x402.json";
import { headFromGet, PAYMENT_REQUEST_HEADERS } from "./_head";

const moduleFor = (pathname: string) => `.${pathname.replace(/^\/api/, "")}`;

async function resources(): Promise<{ url: string }[]> {
  const r = await (manifest as unknown as (c: unknown) => Promise<Response>)({
    request: new Request("https://councilof.ai/.well-known/x402.json"),
    env: {},
  });
  return ((await r.json()) as { resources: { url: string }[] }).resources;
}

beforeEach(() => {
  vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
    new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }),
  );
});
afterEach(() => vi.restoreAllMocks());

describe("headFromGet", () => {
  it("strips every payment header before the GET handler sees the request, and returns no body", async () => {
    const seen: Request[] = [];
    const head = headFromGet(async ({ request }: { request: Request }) => {
      seen.push(request);
      return new Response("body", { status: 402, headers: { "payment-required": "abc", "x-door": "1" } });
    });
    const res = await head({
      request: new Request("https://councilof.ai/api/wrapper?id=x", {
        method: "HEAD",
        headers: { "X-PAYMENT": "signed-authorization", "PAYMENT-SIGNATURE": "sig", accept: "application/json" },
      }),
    });
    expect(seen).toHaveLength(1);
    expect(seen[0].method).toBe("GET");
    for (const h of PAYMENT_REQUEST_HEADERS) expect(seen[0].headers.get(h), h).toBeNull();
    expect(seen[0].headers.get("accept")).toBe("application/json");
    expect(res.status).toBe(402);
    expect(res.headers.get("payment-required")).toBe("abc");
    expect(res.body).toBeNull();
  });
});

describe("every manifest door answers HEAD as its GET would", () => {
  it("same status, PAYMENT-REQUIRED header on the 402, no body — even when HEAD carries X-PAYMENT", async () => {
    const failures: string[] = [];
    for (const r of await resources()) {
      const url = new URL(r.url);
      const mod = (await import(/* @vite-ignore */ moduleFor(url.pathname))) as {
        onRequestGet?: (c: unknown) => Promise<Response>;
        onRequestHead?: (c: unknown) => Promise<Response>;
      };
      if (typeof mod.onRequestHead !== "function") {
        failures.push(`${url.pathname}: exports no onRequestHead — Pages answers HEAD with 404`);
        continue;
      }
      const get = await mod.onRequestGet!({ request: new Request(url.toString()), env: {}, params: {} });
      const head = await mod.onRequestHead({
        request: new Request(url.toString(), { method: "HEAD", headers: { "x-payment": "not-a-real-payment" } }),
        env: {},
        params: {},
      });
      if (head.status !== get.status) failures.push(`${url.pathname}: HEAD ${head.status} vs GET ${get.status}`);
      if (head.status === 402 && !head.headers.get("payment-required")) failures.push(`${url.pathname}: HEAD 402 without PAYMENT-REQUIRED`);
      if (head.body !== null) failures.push(`${url.pathname}: HEAD carried a body`);
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
  });
});
