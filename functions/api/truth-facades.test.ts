import { afterAll, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { onRequestGet as decide } from "./decide";
import { onRequestGet as include } from "./include";
import { onRequestGet as registers } from "./registers";
import { onRequestGet as verifyBatch } from "./verify-batch";
import { onRequestGet as verifyCard } from "./verify-card";

const ROOT = resolve(__dirname, "../..");
const generatedDirectory = mkdtempSync(join(tmpdir(), "csoai-openapi-truth-"));
const generatedPath = join(generatedDirectory, "openapi.json");

afterAll(() => rmSync(generatedDirectory, { recursive: true, force: true }));

const notImplemented = [
  ["/api/include", include],
  ["/api/verify-batch", verifyBatch],
  ["/api/verify-card", verifyCard],
  ["/api/decide", decide],
] as const;

interface OpenApiOperation {
  responses: Record<string, {
    content: Record<string, { example?: Record<string, unknown> }>;
    description: string;
  }>;
  "x-csoai-evidence-state"?: string;
  "x-csoai-lifecycle"?: string;
}

interface OpenApiSpec {
  paths: Record<string, { get?: OpenApiOperation }>;
}

const readSpec = (path: string) =>
  JSON.parse(readFileSync(path, "utf8")) as OpenApiSpec;

describe("public API truth facades", () => {
  it.each(notImplemented)("%s fails closed without accepting or manufacturing evidence", async (endpoint, handler) => {
    const response = await handler({} as never);
    expect(response.status).toBe(501);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      endpoint,
      state: "NOT_IMPLEMENTED",
      accepted: false,
      persisted: false,
      signed: false,
    });
  });

  it("serves registers only as an explicitly unsigned static summary", async () => {
    const response = await registers({} as never);
    expect(response.status).toBe(200);
    const body = await response.json() as Record<string, unknown>;
    expect(body).toMatchObject({
      state: "UNSIGNED_STATIC_SUMMARY",
      signed: false,
      signer: null,
      signature: null,
      verification_material: null,
      measurement_not_certification: true,
    });
    expect(body.axes).toBeInstanceOf(Array);
    expect((body.axes as unknown[]).length).toBeGreaterThan(0);
  });

  it("keeps checked-in OpenAPI entries equal to generator output", () => {
    execFileSync(
      "python3",
      [resolve(ROOT, "scripts/badger/csoai-openapi-gen.py"), "--out", generatedPath],
      { cwd: ROOT, stdio: "pipe" },
    );

    const checkedIn = readSpec(resolve(ROOT, "public/openapi.json"));
    const generated = readSpec(generatedPath);
    const paths = [...notImplemented.map(([endpoint]) => endpoint), "/api/registers"];
    for (const path of paths) {
      expect(checkedIn.paths[path], path).toEqual(generated.paths[path]);
    }

    for (const [path] of notImplemented) {
      const operation = checkedIn.paths[path]?.get;
      expect(operation?.["x-csoai-lifecycle"], path).toBe("NOT_IMPLEMENTED");
      expect(Object.keys(operation?.responses ?? {}), path).toEqual(["501"]);
      expect(operation?.responses["501"].content["application/json"].example, path).toMatchObject({
        endpoint: path,
        state: "NOT_IMPLEMENTED",
        accepted: false,
        persisted: false,
        signed: false,
      });
    }

    const registerOperation = checkedIn.paths["/api/registers"]?.get;
    expect(registerOperation?.["x-csoai-evidence-state"]).toBe("UNSIGNED_STATIC_SUMMARY");
    expect(Object.keys(registerOperation?.responses ?? {})).toEqual(["200"]);
    expect(registerOperation?.responses["200"].content["application/json"].example).toMatchObject({
      state: "UNSIGNED_STATIC_SUMMARY",
      signed: false,
      measurement_not_certification: true,
    });
  });
});
