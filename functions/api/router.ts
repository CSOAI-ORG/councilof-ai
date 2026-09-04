/**
 * /api/router — the bounded discovery + interop + packages router.
 */

const ROUTES = {
  discover: "/.well-known/{slug}.json",
  interop: "/interop/{slug}.json",
  packages: "/packages/{name}/package.json",
};

const RETIRED_PATHS: Record<string, string> = {
  "/growth-loops": "/api/growth-loops",
  "/loops": "/api/growth-loops",
  "/synthesis": "/api/synthesis",
  "/prod-readiness": "/api/prod-readiness",
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

  if (path in RETIRED_PATHS) {
    return json(
      {
        schema: "csoai.retired-endpoint/0.1",
        status: "UNAVAILABLE",
        code: "RETIRED",
        endpoint: RETIRED_PATHS[path],
        message:
          "This route is retired until its response can be derived from current evidence.",
      },
      503,
    );
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
  });
};
