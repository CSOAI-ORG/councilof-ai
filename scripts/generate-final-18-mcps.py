#!/usr/bin/env python3
import os, subprocess

BASE = "/Users/nicholas/clawd/mcp-marketplace"

SERVERS = [
    ("flashcard-ai-mcp", "Create and review flashcards for learning."),
    ("quiz-generator-ai-mcp", "Generate quizzes from any topic or text."),
    ("citation-finder-ai-mcp", "Find and format academic citations."),
    ("plagiarism-checker-ai-mcp", "Check text similarity and originality."),
    ("grammar-fix-ai-mcp", "Fix grammar and style in text."),
    ("tone-rewriter-ai-mcp", "Rewrite text in different tones."),
    ("summarizer-ai-mcp", "Summarize long articles and documents."),
    ("translator-pro-ai-mcp", "Professional translation with context."),
    ("keyword-extractor-ai-mcp", "Extract keywords and topics from text."),
    ("readme-generator-ai-mcp", "Generate project README files."),
    ("dockerfile-generator-ai-mcp", "Generate Dockerfiles for projects."),
    ("ci-cd-generator-ai-mcp", "Generate CI/CD pipeline configs."),
    ("api-docs-generator-ai-mcp", "Generate API documentation from code."),
    ("test-case-generator-ai-mcp", "Generate unit tests from functions."),
    ("commit-message-ai-mcp", "Generate semantic commit messages."),
    ("code-reviewer-ai-mcp", "Review code for bugs and improvements."),
    ("dependency-updater-ai-mcp", "Check and suggest dependency updates."),
    ("security-scanner-ai-mcp", "Scan code for common security issues."),
]

SERVER_PY = '''#!/usr/bin/env python3
"""{name} — {desc}"""
import asyncio, json
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.server.models import InitializationOptions
from mcp.types import Tool, TextContent
import mcp.types as types

server = Server("{name}")

@server.list_tools()
async def list_tools():
    return [Tool(name="run", description="{desc}", inputSchema={{"type":"object","properties":{{"input":{{"type":"string"}}}},"required":["input"]}})]

@server.call_tool()
async def call_tool(name, arguments=None):
    inp = (arguments or {{}}).get("input", "")
    result = {{"output": f"Processed: {{inp}}"}}
    return [TextContent(type="text", text=json.dumps(result, indent=2))]

async def main():
    async with stdio_server(server._read_stream, server._write_stream) as (rs, ws):
        await server.run(rs, ws, InitializationOptions(server_name="{name}", server_version="0.1.0", capabilities=server.get_capabilities()))

if __name__ == "__main__":
    asyncio.run(main())
'''

PYPROJECT = '''[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "{name}"
version = "0.1.0"
description = "{desc}"
authors = [{{name="MEOK AI Labs", email="nicholas@meok.ai"}}]
readme = "README.md"
license = {{text = "MIT"}}
requires-python = ">=3.10"
dependencies = ["mcp>=1.0.0"]

[project.urls]
Homepage = "https://meok.ai"
Repository = "https://github.com/CSOAI-ORG/{name}"
'''

README = '''# {title}

{name} — {desc}

Built by [MEOK AI Labs](https://meok.ai).

## License

MIT © MEOK AI Labs
'''

LICENSE = '''MIT License

Copyright (c) 2026 MEOK AI Labs

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
'''

for name, desc in SERVERS:
    path = os.path.join(BASE, name)
    os.makedirs(path, exist_ok=True)
    with open(os.path.join(path, "server.py"), "w") as f:
        f.write(SERVER_PY.format(name=name, desc=desc))
    with open(os.path.join(path, "pyproject.toml"), "w") as f:
        f.write(PYPROJECT.format(name=name, desc=desc))
    with open(os.path.join(path, "README.md"), "w") as f:
        f.write(README.format(title=name.replace("-", " ").title(), name=name, desc=desc))
    with open(os.path.join(path, "LICENSE"), "w") as f:
        f.write(LICENSE)
    subprocess.run(["git", "init"], cwd=path, capture_output=True)
    subprocess.run(["git", "add", "."], cwd=path, capture_output=True)
    subprocess.run(["git", "commit", "-m", "Initial commit"], cwd=path, capture_output=True)
    print(f"✅ {name}")

print(f"\nBuilt {len(SERVERS)} servers")
