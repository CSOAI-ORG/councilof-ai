/**
 * openapi-artifact.test.ts — public/openapi.json (served at /openapi.json, what x402scan crawls)
 * is a producer artefact and must say exactly what the x402 catalog says.
 *
 *   - it parses as OpenAPI 3.1 with the top-level fields x402scan requires;
 *   - its paid operations (the ones carrying x-payment-info) are EXACTLY the doors in
 *     /.well-known/x402.json (fixture) — never one more, never one fewer;
 *   - every paid op documents its 402 with the challenge shape and its 200 with the deliverable;
 *   - the lid is read from /api/gspc totals.lid (fixture), never typed;
 *   - no money is typed as a number anywhere (price-gate's JSON rule), and the only amounts are
 *     inside a 402 example;
 *   - the producer's --check agrees with the committed bytes, and the x402scan pre-check passes
 *     on the local artefact.
 *
 * Lives under functions/ so `npx vitest run client/src functions` (pr-gates) collects it.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const read = (p: string) => JSON.parse(readFileSync(resolve(ROOT, p), "utf8"));
const spec = read("public/openapi.json");
const wellKnown = read("scripts/fixtures/x402scan/well_known_x402.json");
const totals = read("scripts/fixtures/x402scan/api_gspc_totals.json").totals;
const METHODS = ["get", "post", "put", "patch", "delete"];

const ops = () =>
  Object.entries(spec.paths as Record<string, Record<string, any>>).flatMap(([p, item]) =>
    METHODS.filter((m) => item[m]).map((m) => ({ path: p, method: m, op: item[m] })),
  );
const paid = () => ops().filter(({ op }) => op["x-payment-info"]);
const pathOf = (u: string) => new URL(u).pathname;

describe("public/openapi.json is OpenAPI 3.1 with what x402scan reads", () => {
  it("declares 3.1.0, a title, a version, paths, guidance, a contact email and one server", () => {
    expect(spec.openapi).toBe("3.1.0");
    expect(typeof spec.info.title).toBe("string");
    expect(spec.info.version).toMatch(/^0\.\d+\+[0-9a-f]{12}$/);
    expect(Object.keys(spec.paths).length).toBeGreaterThan(9);
    expect(typeof spec.info["x-guidance"]).toBe("string");
    expect(spec.info.contact.email).toBe("nicholas@csoai.org");
    expect(spec.servers).toEqual([{ url: "https://councilof.ai" }]);
  });

  it("carries the lid verbatim from /api/gspc totals.lid in info.description", () => {
    expect(typeof totals.lid).toBe("string");
    expect(spec.info.description).toContain(totals.lid);
  });

  it("no path key carries a query string", () => {
    for (const p of Object.keys(spec.paths)) expect(p, p).not.toContain("?");
  });
});

describe("the paid operations are exactly the doors in /.well-known/x402.json", () => {
  const doors = new Set<string>(wellKnown.resources.map((r: { url: string }) => pathOf(r.url)));

  it("same set, same size", () => {
    const have = new Set(paid().map(({ path }) => path));
    expect([...have].sort()).toEqual([...doors].sort());
    expect(spec["x-x402"].doors.slice().sort()).toEqual([...doors].sort());
  });

  it("uses the method the manifest names for each door", () => {
    for (const r of wellKnown.resources) {
      const item = spec.paths[pathOf(r.url)];
      expect(item, r.url).toBeTruthy();
      expect(Object.keys(item)).toEqual([(r.method ?? "GET").toLowerCase()]);
    }
  });

  it.each(paid().map(({ path, method, op }) => [`${method.toUpperCase()} ${path}`, op]))("%s documents the 402 challenge shape and the 200 deliverable", (_label, op) => {
    expect(op["x-payment-info"].protocols).toEqual([{ x402: {} }]);
    expect(op["x-payment-info"].price, "no price in the document — amounts live only in the 402").toBeUndefined();
    expect(op.security, "a paid op must not opt out of security").toBeUndefined();
    const r402 = op.responses["402"];
    expect(r402).toBeTruthy();
    const ex = r402.content["application/json"].example;
    expect(ex.x402Version).toBe(2);
    expect(Array.isArray(ex.accepts) && ex.accepts.length).toBeTruthy();
    const a = ex.accepts[0];
    expect(a.scheme).toBe("exact");
    expect(a.network).toBe(wellKnown.network);
    expect(a.asset).toBe(wellKnown.asset);
    expect(a.payTo).toBe(wellKnown.payTo);
    expect(String(a.amount)).toMatch(/^[0-9]+$/);
    expect(typeof op.responses["200"].description).toBe("string");
    expect(op.responses["200"].description.length).toBeGreaterThan(20);
    expect(op.responses["200"].content["application/json"].schema).toBeTruthy();
    expect(Array.isArray(op.parameters)).toBe(true);
    for (const p of op.parameters.filter((x: any) => x.required)) {
      const s = p.schema ?? {};
      expect("example" in p || "const" in s || "enum" in s || "example" in s, `${p.name} must be samplable`).toBe(true);
    }
  });

  it("free-door is the only zero-amount door", () => {
    const zero = paid().filter(({ op }) => op.responses["402"].content["application/json"].example.accepts[0].amount === "0");
    expect(zero.map(({ path }) => path)).toEqual(["/api/free-door"]);
  });
});

describe("the free surface is declared, not probed", () => {
  it("every operation whose only response is 200 declares security: []", () => {
    for (const { path, method, op } of ops()) {
      if (op["x-payment-info"]) continue;
      const codes = Object.keys(op.responses);
      if (codes.length === 1 && codes[0] === "200") expect(op.security, `${method} ${path}`).toEqual([]);
      else expect(op.security, `${method} ${path} (${codes.join("/")}) must stay unclassified`).toBeUndefined();
    }
  });

  it("keeps the quarantined and not-implemented markers the other tests read", () => {
    expect(spec.paths["/api/learn-loop"].get["x-csoai-lifecycle"]).toBe("QUARANTINED_PRE_RELEASE");
  });
});

describe("no money is typed as a number, and no prose carries a price", () => {
  const MONEY_KEY = /price|amount|usd|cost|fee/i;
  const walk = (v: unknown, at: string, out: string[]) => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${at}[${i}]`, out));
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
        if (typeof x === "number" && x > 0 && MONEY_KEY.test(k)) out.push(`${at}.${k}=${x}`);
        else walk(x, `${at}.${k}`, out);
      }
    }
  };
  it("price-gate's JSON rule finds nothing", () => {
    const found: string[] = [];
    walk(spec, "$", found);
    expect(found).toEqual([]);
  });
  it("info and x-guidance name no currency figure", () => {
    expect(spec.info.description).not.toMatch(/[$£€]\s?\d/);
    expect(spec.info["x-guidance"]).not.toMatch(/[$£€]\s?\d/);
  });
});

describe("producer and pre-check agree with the committed bytes", () => {
  it("python3 scripts/build_openapi.py --check exits 0", () => {
    const out = execFileSync("python3", [resolve(ROOT, "scripts/build_openapi.py"), "--check"], { cwd: ROOT, stdio: "pipe" }).toString();
    expect(out).toMatch(/matches its producer/);
  });
  it("python3 scripts/build_openapi.py --selftest proves --check can go red", () => {
    const out = execFileSync("python3", [resolve(ROOT, "scripts/build_openapi.py"), "--selftest"], { cwd: ROOT, stdio: "pipe" }).toString();
    expect(out).toMatch(/can go red/);
  });
  it("x402scan_precheck.py --file public/openapi.json exits 0", () => {
    const out = execFileSync("python3", [resolve(ROOT, "scripts/grants/x402scan_precheck.py"), "--file", "public/openapi.json"], { cwd: ROOT, stdio: "pipe" }).toString();
    expect(out).toMatch(/every required condition holds/);
  });
});
