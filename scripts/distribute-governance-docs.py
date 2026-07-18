#!/usr/bin/env python3
"""Distribute SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md to all MCP repos."""

import json
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")

SECURITY_MD = """# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately to:

- **Email:** nicholas@meok.ai
- **Organization:** MEOK AI Labs

We aim to respond within 48 hours and will coordinate disclosure responsibly.
"""

CODE_OF_CONDUCT_MD = """# Contributor Covenant Code of Conduct

## Our Pledge

We as members, contributors, and leaders pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, visible or invisible disability, ethnicity, sex characteristics, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, caste, color, religion, or sexual identity and orientation.

## Our Standards

Examples of behavior that contributes to a positive environment:
- Demonstrating empathy and kindness toward other people
- Being respectful of differing opinions, viewpoints, and experiences
- Giving and gracefully accepting constructive feedback

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported to the community leaders responsible for enforcement at nicholas@meok.ai.

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.1.
"""

CONTRIBUTING_MD = """# Contributing to MEOK AI Labs MCP Servers

Thank you for your interest in contributing!

## How to Contribute

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## Code Style

- Follow PEP 8 for Python code.
- Keep tool interfaces backward-compatible when possible.
- Add tests for new functionality.

## Questions?

Reach out at nicholas@meok.ai.
"""


def run(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Distributing governance docs to {len(servers)} deployable servers...")

    committed = 0
    for server in servers:
        name = server["name"]
        repo_dir = os.path.join(BASE_DIR, "mcp-marketplace", name)

        for fname, content in [
            ("SECURITY.md", SECURITY_MD),
            ("CODE_OF_CONDUCT.md", CODE_OF_CONDUCT_MD),
            ("CONTRIBUTING.md", CONTRIBUTING_MD),
        ]:
            path = os.path.join(repo_dir, fname)
            with open(path, "w", encoding="utf-8") as f:
                f.write(content)

        run(["git", "add", "-A"], cwd=repo_dir)
        commit = run(
            ["git", "commit", "-m", "docs: add SECURITY.md, CODE_OF_CONDUCT.md, CONTRIBUTING.md"],
            cwd=repo_dir,
        )
        if commit.returncode == 0:
            push = run(["git", "push"], cwd=repo_dir)
            if push.returncode == 0:
                committed += 1
            else:
                print(f"[WARN] {name}: push failed")
        else:
            if "nothing to commit" in commit.stderr.lower():
                continue
            print(f"[WARN] {name}: commit failed: {commit.stderr.strip()}")

    print(f"Done. Committed/pushed governance docs to {committed} repos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
