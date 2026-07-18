#!/usr/bin/env python3
"""
Apply MCP Registry discovery files to all 14 flagship repos and open PRs.
Requires GitHub CLI auth (gh auth status) and write access to CSOAI-ORG.
"""
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

FLAGSHIPS = [
    "eu-ai-act-compliance-mcp",
    "dora-compliance-mcp",
    "nis2-compliance-mcp",
    "cra-compliance-mcp",
    "soc2-compliance-ai-mcp",
    "hipaa-compliance-mcp",
    "gdpr-compliance-ai-mcp",
    "iso-42001-ai-mcp",
    "csrd-compliance-mcp",
    "bias-detection-mcp",
    "meok-governance-engine-mcp",
    "meok-mcp-injection-scan-mcp",
    "agent-audit-logger-mcp",
    "agent-policy-enforcement-mcp",
]

TEMPLATES_DIR = Path("/Users/nicholas/clawd/meok-compliance-gateway/mcp-registry-templates")
BRANCH_NAME = "feat/mcp-registry-discovery-files"
COMMIT_MSG = "feat: Add MCP Registry discovery files (llms.txt, server.json, .well-known/mcp-server, assets/icon.svg)"
PR_TITLE = "feat: MCP Registry discovery files"
PR_BODY = """Adds standardized MCP Registry discovery artifacts:

- `server.json` — full MCP Registry format
- `llms.txt` — model-readable server description
- `.well-known/mcp-server` — well-known endpoint payload
- `assets/icon.svg` — registry icon

These files improve discoverability across Smithery, Glama, MCP.so, and other MCP marketplaces.
"""


def run(cmd, cwd=None, check=True):
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"  ❌ Command failed: {cmd}\n{result.stderr}")
        return None
    return result.stdout.strip()


def process_flagship(name: str, work_dir: Path) -> dict:
    print(f"\n📦 {name}")
    repo_dir = work_dir / name
    repo_url = f"https://github.com/CSOAI-ORG/{name}.git"

    # Clone
    clone = run(f"git clone {repo_url} {repo_dir}", cwd=work_dir, check=False)
    if clone is None:
        return {"name": name, "status": "clone_failed"}

    # Apply templates
    src = TEMPLATES_DIR / name
    applied = []
    for rel in ["server.json", "llms.txt", ".well-known/mcp-server", "assets/icon.svg"]:
        s = src / rel
        d = repo_dir / rel
        if s.exists():
            d.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(s, d)
            applied.append(rel)
        else:
            print(f"  ⚠️  missing template: {rel}")

    if not applied:
        return {"name": name, "status": "no_templates"}

    # Git commit + push
    run(f"git checkout -b {BRANCH_NAME}", cwd=repo_dir)
    run("git add -A", cwd=repo_dir)
    commit = run(f'git commit -m "{COMMIT_MSG}"', cwd=repo_dir, check=False)
    if commit is None:
        return {"name": name, "status": "nothing_to_commit"}

    push = run(f"git push -u origin {BRANCH_NAME}", cwd=repo_dir, check=False)
    if push is None:
        return {"name": name, "status": "push_failed"}

    # Create PR
    pr = run(
        f'gh pr create --title "{PR_TITLE}" --body "{PR_BODY}" --base main --head {BRANCH_NAME}',
        cwd=repo_dir, check=False
    )
    if pr is None:
        return {"name": name, "status": "pr_failed"}

    print(f"  ✅ PR created: {pr}")
    return {"name": name, "status": "ok", "pr_url": pr}


def main():
    # Verify gh auth
    if run("gh auth status", check=False) is None:
        print("❌ GitHub CLI not authenticated. Run: gh auth login")
        sys.exit(1)

    work_dir = Path(tempfile.mkdtemp(prefix="meok-flagship-"))
    print(f"Work dir: {work_dir}")

    results = []
    for name in FLAGSHIPS:
        results.append(process_flagship(name, work_dir))

    ok = sum(1 for r in results if r["status"] == "ok")
    print(f"\n🏁 Done: {ok}/{len(FLAGSHIPS)} PRs created")
    for r in results:
        icon = "✅" if r["status"] == "ok" else "❌"
        print(f"  {icon} {r['name']}: {r['status']}")


if __name__ == "__main__":
    main()
