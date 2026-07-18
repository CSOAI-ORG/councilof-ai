#!/usr/bin/env python3
"""Generate docker-compose.mcp-ensemble.yml from MCP_DEPLOYMENT_MANIFEST.json."""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")
OUTPUT_PATH = os.path.join(BASE_DIR, "docker-compose.mcp-ensemble.yml")


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Generating compose file for {len(servers)} deployable servers...")

    lines = [
        "# Auto-generated MCP Ensemble Docker Compose",
        f"# Generated from: {os.path.basename(MANIFEST_PATH)}",
        f"# Total servers: {len(servers)}",
        "",
        "name: mcp-ensemble",
        "",
        "networks:",
        "  mcp-ensemble:",
        "    driver: bridge",
        "",
        "services:",
    ]

    base_port = 8000
    for idx, server in enumerate(servers):
        name = server["name"]
        repo_dir = f"./mcp-marketplace/{name}"
        external_port = base_port + idx

        lines.extend([
            f"  {name}:",
            f"    container_name: {name}",
            f"    build:",
            f"      context: {repo_dir}",
            f"      dockerfile: ../../Dockerfile.mcp-base",
            f"      args:",
            f"        BUILDKIT_INLINE_CACHE: \"1\"",
            f"      cache_from:",
            f"        - mcp-base:latest",
            f"    working_dir: /app",
            f"    command: python mcp-wrapper.py",
            f"    ports:",
            f"      - \"{external_port}:8000\"",
            f"    volumes:",
            f"      - {repo_dir}:/app",
            f"      - ./meok-labs-engine/shared:/home/nicholas/clawd/meok-labs-engine/shared:ro",
            f"    networks:",
            f"      - mcp-ensemble",
            f"    restart: unless-stopped",
            f"    profiles:",
            f"      - mcp",
            f"    deploy:",
            f"      resources:",
            f"        limits:",
            f"          cpus: \"0.5\"",
            f"          memory: 512M",
            f"        reservations:",
            f"          cpus: \"0.1\"",
            f"          memory: 128M",
            f"    healthcheck:",
            f"      test: [\"CMD-SHELL\", \"python -c \\\"import urllib.request; urllib.request.urlopen('http://localhost:8000/health', timeout=4)\\\" || exit 1\"]",
            f"      interval: 15s",
            f"      timeout: 5s",
            f"      retries: 3",
            f"      start_period: 30s",
            f"    logging:",
            f"      driver: json-file",
            f"      options:",
            f"        max-size: \"50m\"",
            f"        max-file: \"3\"",
            "",
        ])

    with open(OUTPUT_PATH, "w") as f:
        f.write("\n".join(lines))

    print(f"Wrote {len(lines)} lines to {OUTPUT_PATH}")
    print(f"Port range: {base_port} -> {base_port + len(servers) - 1}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
