import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestGet } from "../functions/api/evidence-bundle";

type QueryParameter = {
  name: string;
  in: string;
  required?: boolean;
  schema?: { const?: unknown; enum?: unknown[] };
};
type Contract = {
  parameters: QueryParameter[];
  responses: Record<string, unknown>;
  "x-csoai": { door: string; free_preview: string; free_procurement: string };
};
const root = resolve(__dirname, "..");
const document = JSON.parse(readFileSync(resolve(root, "public/openapi.json"), "utf8"));
const operation = document.paths["/api/evidence-bundle"].get as Contract;

// Check the actual published query contract as a consumer would. This small
// checker covers only the required/const/enum constraints used by this operation;
// cross-parameter mode rules are separately exercised against the real handler.
function queryErrors(url: URL, contract = operation): string[] {
  const errors: string[] = [];
  const query = contract.parameters.filter((p) => p.in === "query");
  const byName = new Map(query.map((p) => [p.name, p]));
  for (const p of query) {
    const value = url.searchParams.get(p.name);
    if (value === null) {
      if (p.required) errors.push("missing " + p.name);
      continue;
    }
    if (p.schema && Object.prototype.hasOwnProperty.call(p.schema, "const") && value !== p.schema.const) {
      errors.push("const " + p.name);
    }
    if (p.schema?.enum && !p.schema.enum.includes(value)) errors.push("enum " + p.name);
  }
  for (const key of url.searchParams.keys()) {
    if (!byName.has(key)) errors.push("undocumented " + key);
  }
  return errors;
}
function withQuery(url: string, name: string, value: string) {
  const result = new URL(url);
  result.searchParams.set(name, value);
  return result;
}
function fixtureCorpus() {
  const reads = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.origin !== "https://councilof.ai" || url.pathname !== "/cards-bundle.json") {
      throw new Error("Unexpected network request in offline contract regression");
    }
    return Response.json({ as_of: "2026-10-13T00:00:00Z", merkle_root: "f".repeat(64), cards: {} });
  });
  vi.stubGlobal("fetch", reads);
  return reads;
}
const call = (url: URL) => onRequestGet({ request: new Request(url), env: {} } as never);
afterEach(() => vi.unstubAllGlobals());

describe("published evidence-bundle query modes agree with the handler", () => {
  it.each(["article-53", "article-50"])("expresses the advertised free %s procurement request", async (id) => {
    const reads = fixtureCorpus();
    const url = withQuery(operation["x-csoai"].free_procurement, "obligation", id);
    expect(queryErrors(url)).toEqual([]);
    const response = await call(url);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.kind).toBe("procurement");
    expect(body.price).toBeNull();
    expect(body.rows.map((row: { obligation_id: string }) => row.obligation_id)).toEqual(["article-53", "article-50"]);
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it("expresses the existing free preview without forcing paid assembly", async () => {
    const reads = fixtureCorpus();
    const url = new URL(operation["x-csoai"].free_preview);
    expect(queryErrors(url)).toEqual([]);
    const response = await call(url);
    expect(response.status).toBe(200);
    expect((await response.json()).kind).toBe("preview");
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it.each(["article-50", "article-53", "dora", "cra"])("expresses the unpaid %s assembly challenge", async (id) => {
    const reads = fixtureCorpus();
    const url = withQuery(operation["x-csoai"].door, "obligation", id);
    expect(queryErrors(url)).toEqual([]);
    // No payment header or settlement: this is an offline fixture request.
    const response = await call(url);
    expect(response.status).toBe(402);
    expect((await response.json()).x402Version).toBe(2);
    expect(reads).toHaveBeenCalledTimes(1);
  });

  it.each(["paid-selector", "non-EU-obligation"])("documents and enforces the invalid procurement %s combination", async (invalid) => {
    fixtureCorpus();
    const url = invalid === "paid-selector"
      ? withQuery(operation["x-csoai"].free_procurement, "bundle", "1")
      : withQuery(operation["x-csoai"].free_procurement, "obligation", "dora");
    // Individual parameter schemas admit these values; the documented route
    // policy decides their incompatible combination.
    expect(queryErrors(url)).toEqual([]);
    expect(operation.responses).toHaveProperty("400");
    const response = await call(url);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe(
      invalid === "paid-selector" ? "procurement_view_is_free" : "procurement_view_scope",
    );
  });

  it.each(["obligation-const", "mandatory-bundle", "missing-format"])("detects the former %s documentation defect", (defect) => {
    const broken = JSON.parse(JSON.stringify(operation)) as Contract;
    if (defect === "obligation-const") {
      broken.parameters.find((p) => p.name === "obligation")!.schema!.const = "article-50";
    } else if (defect === "mandatory-bundle") {
      broken.parameters.find((p) => p.name === "bundle")!.required = true;
    } else {
      broken.parameters = broken.parameters.filter((p) => p.name !== "format");
    }
    expect(queryErrors(new URL(operation["x-csoai"].free_procurement), broken).length).toBeGreaterThan(0);
  });

  it("retains full offline parity between the published document and its actual producer", () => {
    const run = spawnSync("python3", ["-B", "scripts/build_openapi.py", "--check"], {
      cwd: root, encoding: "utf8", timeout: 30_000, maxBuffer: 1024 * 1024,
    });
    expect(run.error, run.error?.message).toBeUndefined();
    expect(run.status, run.stdout + run.stderr).toBe(0);
  }, 35_000);
});
