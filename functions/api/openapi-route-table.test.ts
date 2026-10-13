import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import registry from "../../evidence/mcp-registry.json";
import { onRequestPost as checkout } from "./checkout";
import { onRequestGet as fulfill } from "./fulfill";

/**
 * G-2 (2026-09-22), second half. public/openapi.json documents 113 paths and the MCP
 * catalogue at GET /api/mcp lists servers; neither may name a route this repo does not
 * serve. Doctrine is to kill a dead surface, never to add a stub so a documented path
 * exists — so this test only ever fails, and the fix is always a deletion from the
 * producer (scripts/build_openapi.py, scripts/mcp-targets.json), never a new handler.
 *
 * NOTE ON WHAT "DEAD" MEANS HERE. A census that reads HTTP status alone mis-reads this
 * estate: /api/verify-card answers 501 with schema csoai.capability-state/0.1 and
 * state NOT_IMPLEMENTED, /api/atlas answers 503 with csoai.retired-endpoint/0.1 and
 * code RETIRED, /api/checkout and /api/fulfill answer 404 because the public door is
 * deliberately closed, and /api/contact answers 404 to GET because it is POST-only.
 * All five have handlers. A route that states its own absence is not a dead surface; a
 * route that is documented as working and has no code behind it is. That second class is
 * what this guards.
 *
 * WHAT IS LISTED (13 Oct 2026). A route that is not released yet (NOT_IMPLEMENTED,
 * QUARANTINED_PRE_RELEASE) is listed with its real status code and its x-csoai-lifecycle
 * marker, and this test holds those markers in place. A route that has been WITHDRAWN
 * (RETIRED, DOOR_CLOSED) is not listed at all: the marker is ours, and every other reader
 * of the document lists a path as an API. This header said openapi "already documents"
 * /api/checkout's real status code. It did not: checkout.ts carried no marker, so the
 * document published POST /api/checkout as a plain 200 while the handler answered 404 —
 * and the marker test below, which only reads operations whose documented codes are all
 * absence codes, could not see it. The handler is now called, below.
 */

const REPO = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");
const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"];

/** Cloudflare Pages Functions: functions/<p>.ts serves /<p>; [[x]] is a catch-all. */
function routeTable(): Map<string, Set<string>> {
  const table = new Map<string, Set<string>>();
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (name === "node_modules" || name === "__fixtures__") continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!name.endsWith(".ts") || name.endsWith(".test.ts") || name.startsWith("_")) continue;
      let route = "/" + relative(join(REPO, "functions"), full).replace(/\\/g, "/").replace(/\.ts$/, "");
      if (route.endsWith("/index")) route = route.slice(0, -"/index".length) || "/";
      const src = readFileSync(full, "utf8");
      const methods = new Set<string>();
      // Matches `export const onRequestGet`, `export async function onRequestGet` and
      // `export { onRequestPost } from "./_shared"` alike. Bare `onRequest` handles all.
      for (const m of src.matchAll(/\bonRequest(Get|Post|Put|Patch|Delete|Options|Head)?\b/g)) {
        methods.add(m[1] ? m[1].toLowerCase() : "*");
      }
      if (methods.size) table.set(route, methods);
    }
  };
  walk(join(REPO, "functions"));
  return table;
}

/** Resolve a documented path to the handler Pages would run, catch-alls included. */
function handlerFor(path: string, table: Map<string, Set<string>>): [string, Set<string>] | null {
  const direct = table.get(path);
  if (direct) return [path, direct];
  let best: [string, Set<string>] | null = null;
  for (const [route, methods] of table) {
    if (route.endsWith("/[[path]]")) {
      const base = route.slice(0, -"/[[path]]".length);
      if (path === base || path.startsWith(base + "/")) {
        if (!best || base.length > best[0].length) best = [route, methods];
      }
    } else if (route.includes("[")) {
      const re = new RegExp("^" + route.replace(/\[+[^\]]+\]+/g, "[^/]+") + "$");
      if (re.test(path) && !best) best = [route, methods];
    }
  }
  return best;
}

const TABLE = routeTable();
const SPEC = JSON.parse(readFileSync(join(REPO, "public", "openapi.json"), "utf8")) as {
  paths: Record<string, Record<string, { "x-csoai-lifecycle"?: string; responses?: Record<string, unknown> }>>;
};

describe("public/openapi.json documents no path this repo does not serve", () => {
  it("builds a route table and reads a spec (not a vacuous pass)", () => {
    expect(TABLE.size).toBeGreaterThan(100);
    expect(Object.keys(SPEC.paths).length).toBeGreaterThan(100);
    expect(TABLE.has("/api/gspc")).toBe(true);
    expect(handlerFor("/api/gspc", TABLE)?.[1].has("get")).toBe(true);
  });

  it("the resolver reports a path with no handler as having none", () => {
    // /api/anchors, /api/watchdog, /api/spectrum and /api/drift answer 404 live and have
    // no file in functions/. If any is ever documented, this test must fail — so first
    // prove the resolver actually says "no handler" for them.
    for (const invented of ["/api/anchors", "/api/watchdog", "/api/spectrum", "/api/drift"]) {
      expect(handlerFor(invented, TABLE), invented).toBeNull();
    }
  });

  it("every documented operation has a handler for its method", () => {
    const orphans: string[] = [];
    for (const [path, item] of Object.entries(SPEC.paths)) {
      const found = handlerFor(path, TABLE);
      for (const method of Object.keys(item)) {
        if (!HTTP_METHODS.includes(method.toLowerCase())) continue;
        if (!found) {
          orphans.push(`${method.toUpperCase()} ${path} — no handler in functions/`);
        } else if (!found[1].has("*") && !found[1].has(method.toLowerCase())) {
          orphans.push(
            `${method.toUpperCase()} ${path} — ${relative(REPO, found[0])} serves only ${[...found[1]].sort().join(", ")}`,
          );
        }
      }
    }
    // Kill the documentation, never add a stub. See the header comment.
    expect(orphans).toEqual([]);
  });

  it("a route that answers 404/501/503 stays marked with its lifecycle", () => {
    const unmarked: string[] = [];
    for (const [path, item] of Object.entries(SPEC.paths)) {
      for (const [method, op] of Object.entries(item)) {
        if (!HTTP_METHODS.includes(method.toLowerCase())) continue;
        const codes = Object.keys(op.responses ?? {});
        const absent = codes.length > 0 && codes.every((c) => ["404", "410", "501", "503"].includes(c));
        if (absent && !op["x-csoai-lifecycle"]) unmarked.push(`${method.toUpperCase()} ${path}`);
      }
    }
    expect(unmarked).toEqual([]);
  });

  it("no withdrawn route is listed: nothing marked RETIRED or DOOR_CLOSED, nothing documented as only 404/410", () => {
    const listed: string[] = [];
    for (const [path, item] of Object.entries(SPEC.paths)) {
      for (const [method, op] of Object.entries(item)) {
        if (!HTTP_METHODS.includes(method.toLowerCase())) continue;
        const codes = Object.keys(op.responses ?? {});
        const gone = codes.length > 0 && codes.every((c) => c === "404" || c === "410");
        if (gone || ["RETIRED", "DOOR_CLOSED"].includes(op["x-csoai-lifecycle"] ?? "")) {
          listed.push(`${method.toUpperCase()} ${path}`);
        }
      }
    }
    // The fix is a deletion at the producer (scripts/build_openapi.py drops them), never a relabel.
    expect(listed).toEqual([]);
  });
});

describe("a closed door says so in its own source, and is not listed", () => {
  // The handler is CALLED: a marker that the handler's own answer contradicts is the defect
  // this was written for (POST /api/checkout: 404 on the wire, 200 in the document).
  it.each([
    ["/api/checkout", "post", checkout],
    ["/api/fulfill", "get", fulfill],
  ] as const)("%s (%s) answers 404, carries @openapi-closed, and has no operation in the document", async (path, _method, handler) => {
    const res = await (handler as unknown as (c: unknown) => Promise<Response>)({});
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ configured: false, public_prices: false });
    const src = readFileSync(join(REPO, "functions", `${path}.ts`), "utf8");
    expect(src).toContain("@openapi-closed");
    expect(SPEC.paths[path]).toBeUndefined();
  });
});

describe("GET /api/mcp: no catalogued endpoint names a route this repo does not serve", () => {
  it("reads the registry servers (not a vacuous pass)", () => {
    expect((registry as { servers: unknown[] }).servers.length).toBeGreaterThan(5);
  });

  it("every first-party HTTP endpoint in the catalogue resolves to a handler", () => {
    const orphans: string[] = [];
    for (const s of (registry as { servers: Array<{ id: string; endpoint: string | null }> }).servers) {
      if (!s.endpoint || !/^https?:\/\//.test(s.endpoint)) continue;
      const url = new URL(s.endpoint);
      if (!/(^|\.)councilof\.ai$/.test(url.hostname)) continue; // csoai.org is a separate Pages project
      if (!handlerFor(url.pathname.replace(/\/$/, "") || "/", TABLE)) {
        orphans.push(`${s.id} -> ${s.endpoint}`);
      }
    }
    expect(orphans).toEqual([]);
  });
});
