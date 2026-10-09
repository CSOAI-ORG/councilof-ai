import { describe, expect, it, vi } from "vitest";
import {
  declareDiscoveryExtension,
  onBeforeSettle,
  isEmptyProbeBody,
  descriptionForPath,
} from "./_x402_discovery";

/** x402#2156 / x402-solana#36: the emission, the resource backfill and the probe gate. */

describe("declareDiscoveryExtension — the discovery emission every route config must carry", () => {
  it("body variant declares input at schema.properties.input.properties.body (the path extractSchemas2 reads)", () => {
    const ext = declareDiscoveryExtension({
      method: "POST",
      bodyType: "json",
      input: {},
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      outputSchema: { required: ["schema"], properties: { schema: { type: "string" } } },
      outputExample: { schema: "csoai.example/0.1" },
    }) as { info: any; schema: any };
    const input = ext.schema.properties.input as Record<string, any>;
    expect(input.properties.body).toMatchObject({ type: "object", additionalProperties: false });
    expect(input.properties.method).toMatchObject({ enum: ["POST", "PUT", "PATCH"] });
    expect(input.required).toEqual(["type", "method", "bodyType", "body"]);
    const info = ext.info.input as Record<string, unknown>;
    expect(info.type).toBe("http");
    expect(info.method).toBe("POST");
    // every key info.input carries is declared in the schema (free-door's 2026-09-05 rejection)
    for (const k of Object.keys(info)) expect(Object.keys(input.properties)).toContain(k);
  });

  it("query variant emits outputSchema at the extractor's fixed output path and validates its example", () => {
    const ext = declareDiscoveryExtension({
      method: "GET",
      input: {},
      inputSchema: { properties: {}, additionalProperties: false },
      outputSchema: {
        required: ["schema", "note"],
        properties: { schema: { type: "string" }, note: { type: "string" } },
      },
      outputExample: { schema: "csoai.example/0.1", note: "measurement, never a grade" },
    }) as { info: any; schema: any };
    const out = (ext.schema.properties.output as Record<string, any>).properties.example;
    expect(out.type).toBe("object");
    expect(out.required).toEqual(["schema", "note"]);
    const example = (ext.info.output as Record<string, any>).example;
    for (const k of out.required as string[]) expect(example).toHaveProperty(k);
    // free-door parity: no queryParams in info when there is no input, schema still declares it
    const infoInput = ext.info.input as Record<string, unknown>;
    expect(Object.keys(infoInput).sort()).toEqual(["method", "type"]);
    const qp = (ext.schema.properties.input as Record<string, any>).properties.queryParams;
    expect(qp).toMatchObject({ type: "object", properties: {}, additionalProperties: false });
  });
});

describe("onBeforeSettle — PaymentPayload.resource is non-null at /settle", () => {
  it("backfills the v1 string resource when the buyer's payload left it absent", () => {
    const out = onBeforeSettle(
      { x402Version: 1, paymentPayload: { x402Version: 1, payload: { signature: "s" } } } as Record<string, unknown>,
      "https://councilof.ai/api/request-attestation?subject=qwen3",
    );
    const pp = out.paymentPayload as Record<string, unknown>;
    expect(pp.resource).toBe("https://councilof.ai/api/request-attestation?subject=qwen3");
  });

  it("backfills a v2 object resource and never overwrites the buyer's own value", () => {
    const backfilled = onBeforeSettle(
      { paymentPayload: { x402Version: 2, resource: null, payload: {} } } as Record<string, unknown>,
      "https://councilof.ai/api/proof?bundle=1",
    );
    expect((backfilled.paymentPayload as Record<string, unknown>).resource).toEqual({
      url: "https://councilof.ai/api/proof?bundle=1",
    });
    const buyers = { paymentPayload: { x402Version: 1, resource: "https://buyer.example/r" } };
    expect(onBeforeSettle(buyers as Record<string, unknown>, "https://councilof.ai/api/x")).toBe(buyers);
  });
});

describe("isEmptyProbeBody — only true indexer probes take the gate", () => {
  it("empty, {} and [] are probes; anything else is a real request", () => {
    for (const t of ["", "   ", "{}", " { } ", "[]"]) expect(isEmptyProbeBody(t), t).toBe(true);
    for (const t of ['{"a":1}', "null", "bytes", '{"manifest_b64":"AA=="}'])
      expect(isEmptyProbeBody(t), t).toBe(false);
  });
});

describe("descriptionForPath — canonical descriptions, generic fallback", () => {
  const deps = {
    byPath: { "/api/request-attestation": "commission one signed card" },
    pop: { "x402-bazaar": "x402 bazaar listings slice" },
    wrapperAsset: (s: string) => `parity pack for ${s}`,
    assetSymbols: { usdc: "USDC" },
  };
  it("maps direct, population and wrapper-asset doors and falls back generically", () => {
    expect(descriptionForPath("/api/request-attestation", deps)).toBe("commission one signed card");
    expect(descriptionForPath("/api/pop/x402-bazaar", deps)).toBe("x402 bazaar listings slice");
    expect(descriptionForPath("/api/wrapper/asset/usdc", deps)).toBe("parity pack for USDC");
    const fallback = descriptionForPath("/api/discover/chainlink", deps);
    expect(fallback).toMatch(/never/);
    expect(fallback.length).toBeGreaterThan(20);
  });
});

describe("the middleware mounts the payment gate above input validation", () => {
  it("paymentless empty-body POST to an x402 door gets the 402 envelope first (x402#2156)", async () => {
    const { onRequest } = await import("../_middleware");
    let nextCalled = false;
    const res = await onRequest({
      request: new Request("https://councilof.ai/api/request-attestation?subject=qwen3", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "",
      }),
      next: async () => {
        nextCalled = true;
        return new Response("handler", { status: 400 });
      },
    } as never);
    expect(nextCalled).toBe(false);
    expect(res.status).toBe(402);
    expect(res.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
    const body = (await res.json()) as any;
    expect(body.x402Version).toBe(2);
    expect(body.resource.url).toContain("/api/request-attestation");
    expect(body.accepts[0].scheme).toBe("exact");
    expect(body.accepts[0].network).toBe("eip155:8453");
    expect(body.extensions.bazaar.info.input.method).toBe("POST");
    const inputSchema = body.extensions.bazaar.schema.properties.input.properties;
    expect(inputSchema.body).toMatchObject({ type: "object" });
    // the envelope stays inside the header budget the reverse proxies impose
    expect(res.headers.get("PAYMENT-REQUIRED")!.length).toBeLessThan(4096);
  });

  it("a POST with a real body, a payment header, or a non-door path falls through", async () => {
    const { onRequest } = await import("../_middleware");
    for (const [url, headers, body] of [
      ["https://councilof.ai/api/art50/marking-evidence", {}, '{"manifest_b64":"AA=="}'],
      ["https://councilof.ai/api/request-attestation", { "x-payment": "e30=" }, ""],
      ["https://councilof.ai/api/gspc", {}, ""],
      ["https://councilof.ai/mcp", {}, "{}"],
    ] as [string, Record<string, string>, string][]) {
      let nextCalled = false;
      const res = await onRequest({
        request: new Request(url, { method: "POST", headers, body }),
        next: async () => {
          nextCalled = true;
          return new Response("handler", { status: 200 });
        },
      } as never);
      expect(nextCalled, url).toBe(true);
      expect(res.status, url).toBe(200);
    }
    vi.unstubAllGlobals();
  });
});
