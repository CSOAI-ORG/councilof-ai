#!/usr/bin/env python3
"""Enhance pyproject.toml across all MCP repos with entry points and modern standards."""

import json
import os
import re
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")

ENTRY_POINT_TEMPLATE = """[project.scripts]
{repo_name} = "server:main"
"""


def ensure_entry_point(content: str, repo_name: str) -> str:
    if "[project.scripts]" in content:
        return content
    # Add after [project.urls] or [project] section
    lines = content.splitlines()
    insert_idx = len(lines)
    for i, line in enumerate(lines):
        if line.strip().startswith("[") and i > 0:
            if lines[i - 1].strip().startswith("[project") or lines[i - 1].strip().startswith("[project.urls]"):
                insert_idx = i
                break
    script_section = f"\n[project.scripts]\n{repo_name.replace('-', '_')} = \"server:main\"\n"
    lines.insert(insert_idx, script_section)
    return "\n".join(lines)


def ensure_requires_python(content: str) -> str:
    if "requires-python" in content:
        return content
    # Add requires-python after the first [project] line
    lines = content.splitlines()
    for i, line in enumerate(lines):
        if line.strip() == "[project]":
            # Insert after the first key in [project] or right after [project]
            lines.insert(i + 1, 'requires-python = ">=3.10"')
            break
    return "\n".join(lines)


def ensure_classifiers(content: str) -> str:
    if "classifiers" in content:
        return content
    classifiers = '''classifiers = [
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Topic :: Software Development :: Libraries",
]
'''
    lines = content.splitlines()
    insert_idx = len(lines)
    for i, line in enumerate(lines):
        if line.strip().startswith("[") and i > 0 and lines[i-1].strip().startswith("keywords"):
            insert_idx = i
            break
    lines.insert(insert_idx, classifiers)
    return "\n".join(lines)


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Enhancing pyproject.toml for {len(servers)} deployable servers...")

    updated = 0
    skipped = 0

    for server in servers:
        name = server["name"]
        repo_dir = os.path.join(BASE_DIR, "mcp-marketplace", name)
        pyproject_path = os.path.join(repo_dir, "pyproject.toml")

        if not os.path.exists(pyproject_path):
            skipped += 1
            continue

        with open(pyproject_path, "r", encoding="utf-8") as f:
            content = f.read()

        original = content
        content = ensure_requires_python(content)
        content = ensure_classifiers(content)
        content = ensure_entry_point(content, name)

        if content != original:
            with open(pyproject_path, "w", encoding="utf-8") as f:
                f.write(content)
            updated += 1
        else:
            skipped += 1

    print(f"Done. Updated: {updated}, Skipped: {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
