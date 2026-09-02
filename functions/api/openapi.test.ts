/**
 * openapi.test.ts — every path /api/openapi.json describes must EXIST as bytes: a Pages
 * Function file or a static file under public/. A spec that names an endpoint nobody
 * serves is a promise the estate cannot keep.
 */
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { OPENAPI_SPEC, onRequestGet } from "./openapi.json";

const ROOT = resolve(__dirname, "../..");

function resolvesToBytes(p: string): boolean {
  if (p === "/api/gspc") return existsSync(resolve(ROOT, "functions/api/gspc.ts"));
  if (p === "/api/proof") return existsSync(resolve(ROOT, "functions/api/proof.ts"));
  if (p === "/signed/cards/{id}.json") return existsSync(resolve(ROOT, "public/signed/cards"));
  return existsSync(resolve(ROOT, "public" + p));
}

describe("/api/openapi.json describes only what exists", () => {
  const paths = Object.keys(OPENAPI_SPEC.paths);
  it("has paths", () => expect(paths.length).toBeGreaterThan(3));
  it.each(paths)("%s resolves to a Function or a static file", (p) => {
    expect(resolvesToBytes(p)).toBe(true);
  });
  it("every operation has an operationId (Actions require one)", () => {
    for (const [p, ops] of Object.entries(OPENAPI_SPEC.paths)) {
      for (const op of Object.values(ops as Record<string, { operationId?: string }>)) {
        expect(op.operationId, p).toBeTruthy();
      }
    }
  });
  it("types no board count and no certification language", () => {
    const text = JSON.stringify(OPENAPI_SPEC);
    expect(text).not.toMatch(/\b22 (?:axes|axis)\b/);
    expect(text).not.toMatch(/\bcertified\b|\bcompliant\b|\b33[\s-]?agent|\bBFT\b/i);
    expect(text).toMatch(/Measurement, not certification/);
  });
  it("serves JSON with the requesting origin as the server", async () => {
    const res = await (onRequestGet as any)({ request: new Request("https://example.test/api/openapi.json") });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.servers[0].url).toBe("https://example.test");
    expect(body.openapi).toBe("3.1.0");
  });
});
