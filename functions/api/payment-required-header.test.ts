import { describe, expect, it, vi } from "vitest";
import { onRequestGet as manifest } from "../.well-known/x402.json";
import {
  PAYMENT_REQUIRED_HEADER_BUDGET,
  encodePaymentRequiredHeader,
  minimalPaymentRequired,
} from "./_x402";
// The PAYMENT-REQUIRED header /api/pop/mcp-registry actually sent on 2026-09-26 (decoded): 8,943 B
// on the wire, carrying extensions.bazaar, extensions["offer-receipt"] with a signed offer, and the
// whole csoai sidecar — above the 4–8 KiB single-header limit of common reverse proxies.
import SHIPPED from "./_fixture_payment_required_header_2026-09-26.json";

/**
 * The PAYMENT-REQUIRED header carries the minimal x402 v2 challenge and stays under 4 KiB on every
 * door. The body keeps everything (bazaar schema, offer-receipt offers, the csoai sidecar).
 */

const b64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
};
const decode = (h: string) =>
  JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(h), (c) => c.charCodeAt(0)))) as Record<string, unknown>;

const moduleFor = (pathname: string) => `.${pathname.replace(/^\/api/, "")}`;

describe("PAYMENT-REQUIRED header — minimal and under 4 KiB", () => {
  it("must-fail control: the header that shipped is over budget, and re-encoding it brings it under", () => {
    const shipped = b64(JSON.stringify(SHIPPED));
    expect(shipped.length).toBeGreaterThan(PAYMENT_REQUIRED_HEADER_BUDGET); // the defect, reproduced
    const fixed = encodePaymentRequiredHeader(SHIPPED);
    expect(fixed.length).toBeLessThan(PAYMENT_REQUIRED_HEADER_BUDGET);
    const h = decode(fixed);
    expect(Object.keys(h).sort()).toEqual(["accepts", "error", "extensions", "resource", "x402Version"]);
  });

  it("keeps every field the v2 spec requires and every field a payer signs with", () => {
    const h = minimalPaymentRequired(SHIPPED as Record<string, unknown>);
    const s = SHIPPED as { x402Version: number; resource: { url: string }; accepts: Record<string, unknown>[] };
    expect(h.x402Version).toBe(s.x402Version);
    expect((h.resource as { url: string }).url).toBe(s.resource.url);
    const a = (h.accepts as Record<string, unknown>[])[0];
    const live = s.accepts[0];
    for (const k of ["scheme", "network", "amount", "asset", "payTo", "maxTimeoutSeconds"]) expect(a[k], k).toEqual(live[k]);
    expect(a.extra).toEqual({ name: (live.extra as { name: string }).name, version: (live.extra as { version: string }).version });
    expect(Object.keys(a).sort()).toEqual(["amount", "asset", "extra", "maxTimeoutSeconds", "network", "payTo", "scheme"]);
    expect(h).toHaveProperty("extensions.bazaar");
    expect(h).not.toHaveProperty("extensions.offer-receipt");
    expect(h).not.toHaveProperty("csoai");
  });

  it("every door in the listing sends a header < 4 KiB that agrees with its body's accepts[0]", async () => {
    const r = (await (manifest as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/.well-known/x402.json"),
      env: {},
    })) as Response;
    const { resources } = (await r.json()) as { resources: { url: string }[] };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const failures: string[] = [];
    try {
      for (const res of resources) {
        const url = new URL(res.url);
        const mod = (await import(/* @vite-ignore */ moduleFor(url.pathname))) as {
          onRequestGet: (c: unknown) => Promise<Response>;
        };
        const resp = await mod.onRequestGet({ request: new Request(url.toString()), env: {}, params: {} });
        const header = resp.headers.get("payment-required");
        if (resp.status !== 402 || !header) {
          failures.push(`${url.pathname}: status ${resp.status}, header ${header ? "present" : "absent"}`);
          continue;
        }
        if (header.length >= PAYMENT_REQUIRED_HEADER_BUDGET) failures.push(`${url.pathname}: header ${header.length} B`);
        const h = decode(header);
        const body = (await resp.json()) as { accepts: Record<string, unknown>[]; extensions?: Record<string, unknown> };
        if ("csoai" in h || (h.extensions as Record<string, unknown> | undefined)?.["offer-receipt"]) failures.push(`${url.pathname}: header carries bulky body-only blocks`);
        if (JSON.stringify((h.extensions as Record<string, unknown> | undefined)?.bazaar) !== JSON.stringify(body.extensions?.bazaar)) failures.push(`${url.pathname}: header/body Bazaar drift`);
        if (!body.extensions?.bazaar) failures.push(`${url.pathname}: body lost extensions.bazaar`);
        const ha = (h.accepts as Record<string, unknown>[])[0];
        for (const k of ["network", "amount", "asset", "payTo"])
          if (ha?.[k] !== body.accepts[0]?.[k]) failures.push(`${url.pathname}: header ${k} ≠ body ${k}`);
      }
    } finally {
      fetchSpy.mockRestore();
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
  });
});
