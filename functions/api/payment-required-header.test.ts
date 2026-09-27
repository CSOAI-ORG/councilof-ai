import { describe, expect, it, vi } from "vitest";
import { onRequestGet as manifest } from "../.well-known/x402.json";
import {
  PAYMENT_REQUIRED_HEADER_BUDGET,
  V2_REQUIREMENT_FIELDS,
  encodePaymentRequiredHeader,
  headerPaymentRequired,
} from "./_x402";
// The PAYMENT-REQUIRED header /api/pop/mcp-registry actually sent on 2026-09-26 (decoded): 8,943 B
// on the wire, carrying extensions.bazaar, extensions["offer-receipt"] with a signed offer, and the
// whole csoai sidecar — above the 4–8 KiB single-header limit of common reverse proxies.
import SHIPPED from "./_fixture_payment_required_header_2026-09-26.json";

/**
 * The PAYMENT-REQUIRED header carries the same x402 v2 payment requirements as the body, INCLUDING
 * extensions.bazaar (x402 transports-v2/http.md: all protocol information travels in headers;
 * specs/extensions/bazaar.md: clients echo the bazaar extension from PaymentRequired, and without
 * it "discovery cataloging will not occur"), and stays under 4 KiB on every door. Body-only:
 * offer-receipt offers, the csoai sidecar, and the v1 duplicates on each accept.
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

/** What a door's header must equal, computed from its BODY here, independently of _x402.ts. */
const expectedHeaderFromBody = (b: Record<string, any>) => ({
  x402Version: b.x402Version,
  ...(b.error !== undefined ? { error: b.error } : {}),
  resource: { ...b.resource, mimeType: b.resource?.mimeType ?? "application/json" },
  accepts: (b.accepts as Record<string, unknown>[]).map((a) => {
    const o: Record<string, unknown> = {};
    for (const k of ["scheme", "network", "amount", "asset", "payTo", "maxTimeoutSeconds", "extra"]) if (a[k] !== undefined) o[k] = a[k];
    return o;
  }),
  extensions: { bazaar: b.extensions?.bazaar },
});

describe("PAYMENT-REQUIRED header — the body's v2 requirements and extensions.bazaar, under 4 KiB", () => {
  it("the v2 field list is the spec's (x402-specification-v2 §5.1.2)", () => {
    expect([...V2_REQUIREMENT_FIELDS]).toEqual(["scheme", "network", "amount", "asset", "payTo", "maxTimeoutSeconds", "extra"]);
  });

  it("must-fail control: the header that shipped is over budget; re-encoding it brings it under and keeps the bazaar block", () => {
    const shipped = b64(JSON.stringify(SHIPPED));
    expect(shipped.length).toBeGreaterThan(PAYMENT_REQUIRED_HEADER_BUDGET); // the 2026-09-26 size defect, reproduced
    const fixed = encodePaymentRequiredHeader(SHIPPED);
    expect(fixed.length).toBeLessThan(PAYMENT_REQUIRED_HEADER_BUDGET);
    const h = decode(fixed);
    expect(Object.keys(h).sort()).toEqual(["accepts", "error", "extensions", "resource", "x402Version"]);
    expect(Object.keys(h.extensions as object)).toEqual(["bazaar"]); // offer-receipt stays on the body
    expect((h.extensions as Record<string, unknown>).bazaar).toEqual((SHIPPED as any).extensions.bazaar);
    expect(h).toEqual(expectedHeaderFromBody(SHIPPED as Record<string, any>));
  });

  it("must-fail control: the header that went out 2026-09-26..27 (no extensions) does NOT equal its body's requirements", () => {
    const { extensions: _dropped, ...withoutExt } = headerPaymentRequired(SHIPPED as Record<string, unknown>);
    expect(withoutExt).not.toEqual(expectedHeaderFromBody(SHIPPED as Record<string, any>));
  });

  it("keeps every field a payer signs with, whole, and nothing body-only", () => {
    const h = headerPaymentRequired(SHIPPED as Record<string, unknown>);
    const s = SHIPPED as { x402Version: number; resource: { url: string }; accepts: Record<string, unknown>[] };
    expect(h.x402Version).toBe(s.x402Version);
    expect((h.resource as { url: string }).url).toBe(s.resource.url);
    const a = (h.accepts as Record<string, unknown>[])[0];
    const live = s.accepts[0];
    for (const k of ["scheme", "network", "amount", "asset", "payTo", "maxTimeoutSeconds", "extra"]) expect(a[k], k).toEqual(live[k]);
    expect(Object.keys(a).sort()).toEqual(["amount", "asset", "extra", "maxTimeoutSeconds", "network", "payTo", "scheme"]);
    expect(h).not.toHaveProperty("csoai");
    expect(h.extensions).not.toHaveProperty("offer-receipt");
  });

  it("every door in /.well-known/x402.json: header, decoded, deep-equals its body's requirements (bazaar included), < 4 KiB", async () => {
    const r = (await (manifest as unknown as (c: unknown) => Promise<Response>)({
      request: new Request("https://councilof.ai/.well-known/x402.json"),
      env: {},
    })) as Response;
    const { resources } = (await r.json()) as { resources: { url: string }[] };
    expect(resources.length).toBeGreaterThanOrEqual(25);
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } }),
    );
    const failures: string[] = [];
    let checked = 0;
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
        const body = (await resp.json()) as Record<string, any>;
        if (!body.extensions?.bazaar) failures.push(`${url.pathname}: body lost extensions.bazaar`);
        if ("csoai" in h) failures.push(`${url.pathname}: header carries the csoai sidecar`);
        try {
          expect(h).toEqual(expectedHeaderFromBody(body));
        } catch {
          failures.push(`${url.pathname}: header ≠ body requirements`);
        }
        checked++;
      }
    } finally {
      fetchSpy.mockRestore();
    }
    expect(failures, `\n  ${failures.join("\n  ")}\n`).toEqual([]);
    expect(checked).toBe(resources.length);
  });
});
