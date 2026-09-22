import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SCITT_CONFIGURATION, SCITT_CONFIGURATION_URL, onRequest } from "./scitt-configuration";

const ROOT = resolve(__dirname, "../..");
const request = (method = "GET") => new Request(SCITT_CONFIGURATION_URL, { method });

describe("/.well-known/scitt-configuration answers, and says no transparency service is operated", () => {
  it("answers 200 JSON with issuer, the none policy and the root/witness links (B-08, row 23)", async () => {
    const res = onRequest({ request: request() });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    const doc = await res.json();
    expect(doc).toEqual(SCITT_CONFIGURATION);
    expect(doc.issuer).toBe("did:web:csoai.org");
    expect(doc.registration_policy).toBe("none — no transparency service operated");
    expect(doc.transparency_service.operated).toBe(false);
    expect(doc.registration_endpoint).toBeNull();
    expect(doc.receipts_issued).toBe(false);
    expect(doc.what_exists_instead.public_root).toBe("https://councilof.ai/root.json");
    expect(doc.what_exists_instead.witnesses.rekor).toMatch(/root-witness-latest\.json$/);
    expect(doc.what_exists_instead.witnesses.opentimestamps).toMatch(/ots\/manifest\.json$/);
  });

  it("never claims a registration, a receipt or a certification", () => {
    const text = JSON.stringify(SCITT_CONFIGURATION).toLowerCase();
    for (const banned of ["registered statement", "receipt issued", "certif", "conformant", "compliant"]) {
      expect(text, banned).not.toContain(banned);
    }
    expect(SCITT_CONFIGURATION.signed_statements_registered).toBe("NONE");
  });

  it("every councilof.ai link it publishes has a source in this repository", () => {
    const sources: Record<string, string> = {
      "/root.json": "public/root.json",
      "/api/root": "functions/api/root.ts",
      "/interop/root-witness-latest.json": "public/interop/root-witness-latest.json",
      "/interop/ots/manifest.json": "public/interop/ots/manifest.json",
      "/signed/HOW-TO-VERIFY-ROOT.md": "public/signed/HOW-TO-VERIFY-ROOT.md",
      "/.well-known/scitt-keys": "public/.well-known/scitt-keys",
      "/.well-known/scitt.json": "public/.well-known/scitt.json",
    };
    const urls = [...JSON.stringify(SCITT_CONFIGURATION).matchAll(/https:\/\/councilof\.ai[^"\s]*/g)].map(([u]) => u);
    expect(urls.length).toBeGreaterThan(5);
    for (const url of urls) {
      const path = new URL(url).pathname;
      if (path === "/gspc-verify") {
        expect(readFileSync(resolve(ROOT, "client/src/App.tsx"), "utf8")).toContain('path="/gspc-verify"');
        continue;
      }
      expect(sources, path).toHaveProperty(path);
      expect(existsSync(resolve(ROOT, sources[path])), path).toBe(true);
    }
  });

  it("the profile at scitt.json points here, so the two documents find each other", () => {
    const profile = JSON.parse(readFileSync(resolve(ROOT, "public/.well-known/scitt.json"), "utf8"));
    expect(profile.door.endpoints.configuration).toBe(SCITT_CONFIGURATION_URL);
  });

  it("HEAD and OPTIONS answer without a body; other verbs are 405, never the SPA shell", async () => {
    const head = onRequest({ request: request("HEAD") });
    expect(head.status).toBe(200);
    expect(head.headers.get("Content-Length")).toMatch(/^\d+$/);
    expect(onRequest({ request: request("OPTIONS") }).status).toBe(204);
    expect(onRequest({ request: request("POST") }).status).toBe(405);
  });
});
