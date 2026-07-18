#!/usr/bin/env python3
"""SHA-pin and permission-harden compliance-pdca.yml workflows."""

import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKETPLACE = os.path.join(BASE_DIR, "mcp-marketplace")

# Resolved SHAs
SHA_CHECKOUT = "11bd71901bbe5b1630ceea73d27597364c9af683"  # v4.2.2
SHA_SETUP_PYTHON = "a26af69be951a213d495a4c3e4e4022e16d87065"  # v5
SHA_GITHUB_SCRIPT = "f28e40c7f34bde8b3046d885e986cb6290c5673b"  # v7

REPLACEMENTS = {
    "actions/checkout@v4": f"actions/checkout@{SHA_CHECKOUT} # v4",
    "actions/setup-python@v5": f"actions/setup-python@{SHA_SETUP_PYTHON} # v5",
    "actions/github-script@v7": f"actions/github-script@{SHA_GITHUB_SCRIPT} # v7",
}

TARGET_REPOS = [
    "ai-self-audit-mcp",
    "canada-aida-ai-mcp",
    "csoai-governance-crosswalk-mcp",
    "eu-ai-act-compliance-mcp",
    "gdpr-compliance-ai-mcp",
    "iso-27001-ai-mcp",
    "iso-42001-ai-mcp",
    "llm-compliance-comparison-mcp",
    "meok-governance-engine-mcp",
    "nist-rmf-ai-mcp",
    "soc2-compliance-ai-mcp",
]


def run(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)


def main() -> int:
    for repo in TARGET_REPOS:
        repo_dir = os.path.join(MARKETPLACE, repo)
        wf_path = os.path.join(repo_dir, ".github", "workflows", "compliance-pdca.yml")
        if not os.path.exists(wf_path):
            print(f"[SKIP] {repo}: workflow not found")
            continue

        with open(wf_path, "r", encoding="utf-8") as f:
            content = f.read()

        original = content

        # Replace floating tags with SHA pins
        for old, new in REPLACEMENTS.items():
            content = content.replace(old, new)

        # Inject minimal permissions if missing
        if "permissions:" not in content:
            # Add workflow-level permissions after 'name:' block near top
            lines = content.splitlines()
            new_lines = []
            injected = False
            for line in lines:
                new_lines.append(line)
                if not injected and line.strip().startswith("on:"):
                    new_lines.append("")
                    new_lines.append("permissions: {}")
                    injected = True
            content = "\n".join(new_lines)

        if content == original:
            print(f"[SKIP] {repo}: no changes needed")
            continue

        with open(wf_path, "w", encoding="utf-8") as f:
            f.write(content)

        run(["git", "add", ".github/workflows/compliance-pdca.yml"], cwd=repo_dir)
        commit = run(
            ["git", "commit", "-m", "ci: harden compliance-pdca.yml with SHA-pinned actions and minimal permissions"],
            cwd=repo_dir,
        )
        if commit.returncode == 0 or "nothing to commit" in commit.stderr.lower():
            push = run(["git", "push"], cwd=repo_dir)
            if push.returncode == 0:
                print(f"[OK] {repo}")
            else:
                print(f"[WARN] {repo}: push failed")
        else:
            print(f"[WARN] {repo}: commit failed: {commit.stderr.strip()}")

    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
