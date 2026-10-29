/**
 * RATCHET — every PUBLISHED endpoint must have a Pages route file behind it.
 *
 * WHY THIS TEST EXISTS. On 2026-10-27 the Council's human-in-the-loop path and its staff
 * registry both published an endpoint map, and every path in those maps except the first
 * answered 404 from the platform. The logic was written, correct, and complete in
 * `functions/api/hitl.ts` and `functions/api/pals.ts` — both dispatch on the sub-path — but a
 * Cloudflare Pages Function is reached by its own FILE, so `functions/api/hitl.ts` answered
 * `/api/hitl` and nothing else. The dispatch never ran for a single sub-path.
 *
 * That is the defect this test is built to prevent, and it is a defect of a kind this estate
 * cares about: the registry published a map of doors it did not have. A reader who believed the
 * map — or a client that read it, which is exactly what the MCP server did — got a 404 for a
 * capability the publication insisted existed. The staff list worked, which made the broken
 * desks look talkable.
 *
 * WHAT IT CHECKS. For every entry of every published endpoint map: a route FILE exists that
 * Pages will actually route to it, and that file exports the handler for the published METHOD.
 * Publishing a path with no route behind it fails here.
 *
 * HOW A PATH MAPS TO A FILE. Cloudflare Pages maps `functions/api/x/y.ts` to `/api/x/y`,
 * `functions/api/x/y/index.ts` to `/api/x/y`, and `functions/api/x/[id].ts` to `/api/x/:id`. A
 * published `<id>` is a dynamic segment, so it becomes `[id]`.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { HITL_ENDPOINTS } from "./hitl";
import { PAL_ENDPOINTS } from "./pals";

const here = path.dirname(fileURLToPath(import.meta.url));

/** The Pages route file candidates that could serve a published path, most specific first. */
function routeCandidates(publishedPath: string): string[] {
  const rel = publishedPath.replace(/^\/api\/?/, "");
  const segs = rel.split("/").filter(Boolean).map((s) => s.replace(/^<(.+)>$/, "[$1]"));
  const last = segs.pop() ?? "";
  const dir = segs.join("/");
  const out: string[] = [];
  if (dir) {
    out.push(path.join(here, dir, `${last}.ts`));
    out.push(path.join(here, dir, last, "index.ts"));
  } else {
    out.push(path.join(here, `${last}.ts`));
    out.push(path.join(here, last, "index.ts"));
  }
  return out;
}

/** The handler name a published METHOD needs on its route file. */
function handlerFor(method: string): string {
  if (method === "GET") return "onRequestGet";
  if (method === "POST") return "onRequestPost";
  if (method === "HEAD") return "onRequestHead";
  if (method === "OPTIONS") return "onRequestOptions";
  return "onRequest" + method.charAt(0) + method.slice(1).toLowerCase();
}

/** True when the file EXPORTS the handler (an import alone is not an export). */
function exportsHandler(src: string, name: string): boolean {
  if (new RegExp(`export\\s+(const|async\\s+function|function)\\s+${name}\\b`).test(src)) return true;
  const braces = src.match(/export\s*\{([^}]*)\}/g) ?? [];
  return braces.some((b) =>
    new RegExp(`\\b${name}\\b`).test(b.replace(/^export\s*\{/, "").replace(/\}$/, "")),
  );
}

const MAPS: Array<[string, Record<string, string>]> = [
  ["GET /api/hitl", HITL_ENDPOINTS as unknown as Record<string, string>],
  ["GET /api/pals", PAL_ENDPOINTS as unknown as Record<string, string>],
];

describe("every published endpoint has a Pages route behind it", () => {
  for (const [label, map] of MAPS) {
    it(`${label} publishes only routable paths`, () => {
      const entries = Object.entries(map);
      expect(entries.length).toBeGreaterThan(0);

      const missing: string[] = [];
      const missingHandler: string[] = [];

      for (const [name, spec] of entries) {
        const [method, publishedPath] = String(spec).split(/\s+/);
        const candidates = routeCandidates(publishedPath);
        const file = candidates.find((c) => existsSync(c));
        if (!file) {
          missing.push(
            `${name}: "${spec}" has no route file (looked for ${candidates
              .map((c) => path.relative(here, c))
              .join(", ")})`,
          );
          continue;
        }
        const handler = handlerFor(method);
        if (!exportsHandler(readFileSync(file, "utf8"), handler)) {
          missingHandler.push(
            `${name}: "${spec}" is served by ${path.relative(here, file)}, which does not export ${handler}`,
          );
        }
      }

      expect(missing, `published endpoints with no route:\n${missing.join("\n")}`).toEqual([]);
      expect(missingHandler, `route files missing their handler:\n${missingHandler.join("\n")}`).toEqual([]);
    });
  }

  it("the human-in-the-loop path names a challenge, a decision and a record door", () => {
    // These three are the path the whole human-in-the-loop exists for. If the map stops naming
    // them, the capability was withdrawn and that must be a deliberate edit, not a drift.
    const paths = Object.values(HITL_ENDPOINTS as unknown as Record<string, string>);
    expect(paths).toContain("POST /api/hitl/challenge");
    expect(paths).toContain("POST /api/hitl/decision");
    expect(paths).toContain("GET /api/hitl/record");
  });

  it("the staff registry names a door to talk to a staff member", () => {
    const paths = Object.values(PAL_ENDPOINTS as unknown as Record<string, string>);
    expect(paths).toContain("POST /api/pals/<id>/chat");
  });
});
