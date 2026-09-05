#!/usr/bin/env python3
"""Generate the bounded API router and fail-closed retired endpoints.

The former runtime manifests were not derived from current public evidence.
This generator therefore preserves their deployed doors only as explicit 503
responses and cannot recreate links to the quarantined static JSON files.
"""

from __future__ import annotations

from pathlib import Path
from textwrap import dedent

ROOT = Path(".")
ROUTER_DIR = ROOT / "functions" / "api"


def build_router() -> str:
    return dedent(
        '''\
        /**
         * /api/router — the bounded discovery + interop + packages router.
         */

        const ROUTES = {
          "discover": "/.well-known/{slug}.json",
          "interop": "/interop/{slug}.json",
          "packages": "/packages/{name}/package.json",
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
            return json({
              schema: "csoai.retired-endpoint/0.1",
              status: "UNAVAILABLE",
              code: "RETIRED",
              endpoint: RETIRED_PATHS[path],
              message: "This route is retired until its response can be derived from current evidence.",
            }, 503);
          }

          if (slug) {
            return json({ slug, route: ROUTES.discover.replace("{slug}", slug) });
          }
          if (name) {
            return json({ name, route: ROUTES.packages.replace("{name}", name) });
          }

          return json({
            schema: "csoai.router/0.1",
            routes: ROUTES,
            total_routes: Object.keys(ROUTES).length,
          });
        };
        '''
    )


def build_retired_endpoint(endpoint: str, subject: str, message: str) -> str:
    return dedent(
        f'''\
        /**
         * {endpoint} — retired until {subject} is derived from current evidence.
         * @openapi-unavailable
         */

        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body, null, 2), {{
            status,
            headers: {{
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
              "access-control-allow-origin": "*",
            }},
          }});

        export const onRequestGet: PagesFunction = async () => {{
          return json({{
            schema: "csoai.retired-endpoint/0.1",
            status: "UNAVAILABLE",
            code: "RETIRED",
            endpoint: "{endpoint}",
            message: "{message}",
          }}, 503);
        }};
        '''
    )


def main() -> None:
    print("=== WIRE ROUTES — evidence-bounded ===")

    files = {
        "router.ts": build_router(),
        "growth-loops.ts": build_retired_endpoint(
            "/api/growth-loops",
            "loop status",
            "Growth-loop status is not published without current runtime evidence.",
        ),
        "synthesis.ts": build_retired_endpoint(
            "/api/synthesis",
            "mappings",
            "Synthesis mappings are not published without verified source records.",
        ),
        "prod-readiness.ts": build_retired_endpoint(
            "/api/prod-readiness",
            "readiness",
            "Production readiness is not published without a current evidence-derived report.",
        ),
    }
    for name, content in files.items():
        (ROUTER_DIR / name).write_text(content)
        print(f"  ✓ {name}")

    package_descriptions = {
        "gspc-cli": "gspc-card-verifier CLI — verify any signed card offline",
        "gspc-evm-bridge": "Bridge to EVM chains for evidence — supports USDC, USDT, DAI on Base, Polygon, Optimism, Arbitrum, Avalanche",
        "gspc-arith": "Arithmetically verified proofs — every card has a numeric proof",
        "gspc-svg": "SVG card format — render any signed card as an SVG",
        "gspc-pdf": "PDF evidence format — render any signed card as a PDF",
    }
    for name, description in package_descriptions.items():
        path = ROOT / "packages" / name / "README.md"
        if path.exists() and description not in path.read_text():
            path.write_text(path.read_text() + f"\n\n## Description\n\n{description}\n")
            print(f"  ✓ {name}/README.md updated")


if __name__ == "__main__":
    main()
