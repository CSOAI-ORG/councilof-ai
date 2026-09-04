/**
 * /api/router — the unified discovery + interop + packages router.
 *
 * Every /.well-known/ door → ?slug=
 * Every /interop/ format → ?slug=
 * Every /packages/ manifest → ?name=
 * Growth loops + synthesis + prod-readiness → dedicated paths
 */

import { json as jsonResp } from "../_lib/http";

const ROUTES = {
  "discover": "/.well-known/{slug}.json",
  "interop": "/interop/{slug}.json",
  "packages": "/packages/{name}/package.json",
  "growth-loops": "/interop/growth-loops.json",
  "synthesis": "/interop/synthesis-layer.json",
  "prod-readiness": "/interop/prod-readiness.json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });

export const onRequestGet: PagesFunction = async ({ request }) => {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/router", "");
  const slug = url.searchParams.get("slug");
  const name = url.searchParams.get("name");

  // Built-in endpoints
  if (path === "/growth-loops" || path === "/loops") {
    return json({ routes: ROUTES, note: "fetch /interop/growth-loops.json" });
  }
  if (path === "/synthesis") {
    return json({ routes: ROUTES, note: "fetch /interop/synthesis-layer.json" });
  }
  if (path === "/prod-readiness") {
    return json({ routes: ROUTES, note: "fetch /interop/prod-readiness.json" });
  }

  // Discovery
  if (slug) {
    return json({ slug, route: ROUTES.discover.replace("{slug}", slug) });
  }
  if (name) {
    return json({ name, route: ROUTES.packages.replace("{name}", name) });
  }

  // List all routes
  return json({
    schema: "csoai.router/0.1",
    routes: ROUTES,
    total_routes: Object.keys(ROUTES).length,
    well_known_doors: 122,
    interop_formats: 188,
    packages: 7,
    growth_loops: 10,
    synthesis_mappings: 10,
  });
};
