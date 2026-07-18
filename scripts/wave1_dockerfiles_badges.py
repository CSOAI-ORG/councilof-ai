#!/usr/bin/env python3
"""Wave 1: Create Dockerfiles + install badges for top 20 MCPs."""
import os

BASE = os.path.expanduser("~/clawd/mcp-marketplace")
TOP20 = [
    "eu-ai-act-compliance-mcp", "dora-compliance-mcp", "nis2-compliance-mcp",
    "cra-compliance-mcp", "iso-42001-ai-mcp", "iso-27001-ai-mcp",
    "soc2-compliance-ai-mcp", "bias-detection-mcp", "ai-bom-mcp",
    "agent-prompt-injection-firewall-mcp", "healthcare-ai-governance-mcp",
    "meok-watermark-attest-mcp", "meok-omnibus-tracker-mcp",
    "meok-dpia-edpb-template-mcp", "trust-chain-mcp",
    "care-membrane-mcp", "memory-search-mcp", "web-research-mcp",
    "proofof-ai-mcp", "code-executor-mcp",
]

DOCKERFILE = """FROM python:3.12-slim

LABEL org.opencontainers.image.source="https://github.com/CSOAI-ORG/{name}"
LABEL org.opencontainers.image.vendor="MEOK AI Labs"
LABEL org.opencontainers.image.licenses="MIT"

WORKDIR /app

RUN pip install --no-cache-dir uv

COPY pyproject.toml .
COPY server.py .

RUN uv pip install --system --no-cache mcp>=1.0.0

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
    CMD python -c "import server; print('OK')" || exit 1

CMD ["python", "server.py"]
"""

BADGE_TEMPLATE = """
## Quick Install

| Client | Install |
|--------|---------|
| **Claude Desktop** | [![Install in Claude](https://img.shields.io/badge/Install-Claude-blue)](https://claude.ai) |
| **Cursor** | [![Install in Cursor](https://img.shields.io/badge/Install-Cursor-black)](https://cursor.com) |
| **VS Code** | [![Install in VS Code](https://img.shields.io/badge/Install-VS_Code-blue)](https://code.visualstudio.com) |
| **Windsurf** | [![Install in Windsurf](https://img.shields.io/badge/Install-Windsurf-purple)](https://codeium.com/windsurf) |
| **Docker** | `docker run -p 8000:8000 {name}` |
| **pip** | `pip install {name}` |
"""

docker_count = 0
badge_count = 0

for entry in TOP20:
    server_dir = os.path.join(BASE, entry)
    if not os.path.isdir(server_dir):
        print(f"  ⚠️  {entry}: directory not found")
        continue

    # Create Dockerfile
    docker_path = os.path.join(server_dir, "Dockerfile")
    if not os.path.exists(docker_path):
        with open(docker_path, "w") as f:
            f.write(DOCKERFILE.format(name=entry))
        docker_count += 1

    # Add install badges to README
    readme_path = os.path.join(server_dir, "README.md")
    if os.path.exists(readme_path):
        with open(readme_path, "r") as f:
            content = f.read()

        if "Quick Install" not in content:
            # Insert after the first heading + description paragraph
            lines = content.split("\n")
            insert_at = 0
            found_first_heading = False
            for i, line in enumerate(lines):
                if line.startswith("# ") and not found_first_heading:
                    found_first_heading = True
                    continue
                if found_first_heading and line.strip() and not line.startswith("#"):
                    insert_at = i + 1
                    continue
                if found_first_heading and (line.startswith("##") or line.startswith("---")):
                    insert_at = i
                    break

            if insert_at > 0:
                badge_text = BADGE_TEMPLATE.format(name=entry)
                new_lines = lines[:insert_at] + [badge_text] + lines[insert_at:]
                with open(readme_path, "w") as f:
                    f.write("\n".join(new_lines))
                badge_count += 1

print(f"✅ Dockerfiles created: {docker_count}")
print(f"✅ Install badges added: {badge_count}")
