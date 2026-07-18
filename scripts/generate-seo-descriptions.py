#!/usr/bin/env python3
"""Generate unique SEO descriptions for all MCP repos based on their tools."""

import json
import os
import re
import sys
import yaml

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")


def slug_to_keywords(name: str) -> str:
    """Convert repo slug to human-readable topic."""
    parts = name.replace("-mcp", "").split("-")
    return " ".join(parts)


def build_description(name: str, tools: list[dict]) -> str:
    """Build a unique, keyword-rich description from tool names."""
    topic = slug_to_keywords(name)
    tool_names = [t.get("name", "").replace("_", " ") for t in tools[:3] if t.get("name")]
    tool_summary = ", ".join(tool_names) if tool_names else topic

    # Clean up topic for readability
    topic = topic.title()

    # Vary sentence structure for SEO diversity
    templates = [
        f"{topic} MCP server. Tools: {tool_summary}. Built by MEOK AI Labs.",
        f"AI-powered {topic.lower()} MCP server for agents. Supports {tool_summary}. By MEOK AI Labs.",
        f"MCP server for {topic.lower()}. Features {tool_summary}. From MEOK AI Labs.",
        f"{topic} automation via MCP. Includes {tool_summary}. By MEOK AI Labs.",
        f"{topic} tools for AI agents. Capabilities: {tool_summary}. Built by MEOK AI Labs.",
    ]
    # Deterministic selection based on name length
    idx = len(name) % len(templates)
    desc = templates[idx]
    return desc[:250]  # Keep under reasonable limit


def update_file(path: str, key: str, new_value: str) -> bool:
    if not os.path.exists(path):
        return False
    try:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        # Update JSON files
        if path.endswith(".json"):
            data = json.loads(content)
            old = data.get(key, "")
            if old == new_value:
                return False
            data[key] = new_value
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            return True
        # Update YAML files
        elif path.endswith(".yaml") or path.endswith(".yml"):
            data = yaml.safe_load(content)
            old = data.get(key, "")
            if old == new_value:
                return False
            data[key] = new_value
            with open(path, "w", encoding="utf-8") as f:
                yaml.dump(data, f, default_flow_style=False, sort_keys=False, allow_unicode=True)
            return True
        # Update TOML files (simple regex approach)
        elif path.endswith(".toml"):
            pattern = re.compile(rf'(^description\s*=\s*")(.+?)(")', re.MULTILINE)
            if pattern.search(content):
                new_content = pattern.sub(rf'\g<1>{new_value}\g<3>', content)
                if new_content == content:
                    return False
                with open(path, "w", encoding="utf-8") as f:
                    f.write(new_content)
                return True
    except Exception as e:
        print(f"[ERR ] Failed to update {path}: {e}")
    return False


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Generating SEO descriptions for {len(servers)} deployable servers...")

    updated = 0
    skipped = 0

    for server in servers:
        name = server["name"]
        repo_dir = os.path.join(BASE_DIR, "mcp-marketplace", name)
        smithery_path = os.path.join(repo_dir, "smithery.yaml")
        mcp_json_path = os.path.join(repo_dir, ".mcp.json")
        package_json_path = os.path.join(repo_dir, "package.json")
        pyproject_path = os.path.join(repo_dir, "pyproject.toml")
        readme_path = os.path.join(repo_dir, "README.md")

        tools = []
        if os.path.exists(smithery_path):
            try:
                with open(smithery_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                tools = data.get("tools", [])
            except Exception:
                pass

        desc = build_description(name, tools)

        changed = False
        changed |= update_file(smithery_path, "description", desc)
        changed |= update_file(mcp_json_path, "description", desc)
        changed |= update_file(package_json_path, "description", desc)
        changed |= update_file(pyproject_path, "description", desc)

        # Also update README.md first line if generic
        if os.path.exists(readme_path):
            try:
                with open(readme_path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                if lines and ("MEOK AI Labs MCP Server" in lines[0] or lines[0].startswith("# MEOK AI Labs")):
                    lines[0] = f"# {desc.split('.')[0]}\n"
                    with open(readme_path, "w", encoding="utf-8") as f:
                        f.writelines(lines)
                    changed = True
            except Exception:
                pass

        if changed:
            updated += 1
        else:
            skipped += 1

    print(f"Done. Updated: {updated}, Skipped: {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
