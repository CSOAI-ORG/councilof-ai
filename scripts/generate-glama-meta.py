#!/usr/bin/env python3
"""Generate Glama metadata (glama.json + Dockerfile.glama) for all MCP repos."""

import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")

DOCKERFILE_GLAMA = """FROM python:3.14-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends git build-essential && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir uv

RUN useradd -m -s /bin/bash nicholas && \
    mkdir -p /home/nicholas/clawd/meok-labs-engine/shared && \
    chown -R nicholas:nicholas /home/nicholas

WORKDIR /app
USER nicholas

RUN uv venv /home/nicholas/.venv
ENV PATH="/home/nicholas/.venv/bin:$PATH"

COPY --chown=nicholas:nicholas . /app
RUN uv pip install -e .

CMD ["python", "mcp-wrapper.py"]
"""


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Generating Glama metadata for {len(servers)} deployable servers...")

    for server in servers:
        name = server["name"]
        repo_dir = os.path.join(BASE_DIR, "mcp-marketplace", name)

        glama_json = {
            "name": name,
            "description": f"MEOK AI Labs — {name}",
            "vendor": "MEOK AI Labs",
            "homepage": "https://meok.ai",
            "repository": f"https://github.com/CSOAI-ORG/{name}",
            "license": "MIT",
            "runtime": "python",
            "entryPoint": "mcp-wrapper.py",
        }

        with open(os.path.join(repo_dir, "glama.json"), "w") as f:
            json.dump(glama_json, f, indent=2)

        with open(os.path.join(repo_dir, "Dockerfile.glama"), "w") as f:
            f.write(DOCKERFILE_GLAMA)

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
