"""
Bulk Docker non-root fix for CSOAI-ORG MCP servers.

Scans a list of repos, reads each Dockerfile, and if it lacks a non-root
USER directive, creates a branch with the fix and opens a PR.

Pattern added (just before CMD/ENTRYPOINT):
    RUN useradd --create-home --shell /bin/bash --uid 10001 app && \
        chown -R app:app /app
    USER app

Idempotent: skips Dockerfiles that already have a non-root USER.

Usage:
    python3 fix_docker_root.py --apply
    python3 fix_docker_root.py --dry-run
    python3 fix_docker_root.py --apply --repos ai-bom-mcp c2pa-watermark-mcp
"""
import argparse
import base64
import json
import subprocess
import sys
import urllib.request

# All 7 flagships with Dockerfiles, identified 2026-06-12 03:50 UTC.
# meok-compliance-gateway excluded — already hardened.
DEFAULT_REPOS = [
    "ai-bom-mcp",
    "agent-audit-logger-mcp",
    "c2pa-watermark-mcp",
    "gods-eye-geospatial-mcp",
    "care-membrane-mcp",
    "meok-watermark-attest-mcp",
    "a2a-governance-bridge-mcp",
]

# This block is appended just before the last CMD/ENTRYPOINT line.
USER_BLOCK = """
# Run as non-root (CSOAI security baseline, added by Mavis).
RUN useradd --create-home --shell /bin/bash --uid 10001 app \\
    && chown -R app:app /app
USER app
"""


def gh_api(path: str) -> tuple[int, str]:
    out = subprocess.run(
        ["gh", "api", path, "-H", "Accept: application/vnd.github.v3+json"],
        capture_output=True, text=True
    )
    return out.returncode, out.stdout


def get_dockerfile(owner_repo: str) -> str | None:
    code, body = gh_api(f"repos/{owner_repo}/contents/Dockerfile")
    if code != 0:
        return None
    try:
        d = json.loads(body)
        return base64.b64decode(d["content"]).decode("utf-8", "ignore")
    except Exception:
        return None


def is_root(dockerfile: str) -> bool:
    """True if Dockerfile runs as root (no USER, or USER root)."""
    user_lines = [
        l.strip() for l in dockerfile.splitlines()
        if l.strip().startswith("USER ")
    ]
    if not user_lines:
        return True
    return any("USER root" in l for l in user_lines)


def add_user(dockerfile: str) -> str:
    """Insert the USER block before the LAST CMD/ENTRYPOINT line."""
    lines = dockerfile.splitlines()
    last_cmd_idx = -1
    for i, l in enumerate(lines):
        s = l.strip().upper()
        if s.startswith("CMD ") or s.startswith("CMD[") or s.startswith("ENTRYPOINT "):
            last_cmd_idx = i
    if last_cmd_idx < 0:
        # No CMD/ENTRYPOINT — append at end
        return dockerfile.rstrip() + "\n" + USER_BLOCK
    head = "\n".join(lines[:last_cmd_idx]).rstrip()
    tail = "\n".join(lines[last_cmd_idx:])
    return head + "\n" + USER_BLOCK + tail + "\n"


def branch_exists(owner_repo: str, branch: str) -> bool:
    code, _ = gh_api(f"repos/{owner_repo}/branches/{branch}")
    return code == 0


def create_pr(owner_repo: str, branch: str, title: str, body: str) -> str | None:
    code, resp = gh_api(f"repos/{owner_repo}/pulls")
    if code == 0:
        for pr in json.loads(resp):
            if pr.get("head", {}).get("ref") == branch and pr.get("state") == "open":
                return f"already-open: PR #{pr['number']}"
    code, resp = subprocess.run(
        ["gh", "pr", "create",
         "--repo", owner_repo,
         "--base", "main",
         "--head", branch,
         "--title", title,
         "--body", body],
        capture_output=True, text=True
    ).returncode, subprocess.run(
        ["gh", "pr", "create",
         "--repo", owner_repo,
         "--base", "main",
         "--head", branch,
         "--title", title,
         "--body", body],
        capture_output=True, text=True
    ).stdout
    return resp.strip() if code == 0 else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true",
                    help="Actually create branches + PRs (default: dry-run)")
    ap.add_argument("--repos", nargs="*", default=DEFAULT_REPOS,
                    help="Specific repos to fix (default: all 7 root flagships)")
    args = ap.parse_args()

    print(f"{'REPO':30} {'STATE':25} {'ACTION'}")
    print("=" * 90)
    for repo in args.repos:
        owner_repo = f"CSOAI-ORG/{repo}"
        df = get_dockerfile(owner_repo)
        if df is None:
            print(f"{repo:30} {'no Dockerfile':25} skip")
            continue
        if not is_root(df):
            print(f"{repo:30} {'already hardened':25} skip")
            continue
        fixed = add_user(df)
        if fixed == df:
            print(f"{repo:30} {'no CMD to anchor to':25} manual")
            continue
        if not args.apply:
            print(f"{repo:30} {'root':25} (dry-run) would add USER app")
            continue

        # Apply: create branch, commit, push, PR
        branch = f"security/non-root-user-{repo}"
        if branch_exists(owner_repo, branch):
            print(f"{repo:30} {'root':25} branch exists, skipping")
            continue

        # Use git via local clone if available, else gh api
        title = f"security(docker): run as non-root user (uid 10001)"
        body = (
            "## What\n\n"
            "Adds a non-root `USER app` directive (uid 10001) before the "
            "container's CMD/ENTRYPOINT. This is the CSOAI security baseline.\n\n"
            "## Why\n\n"
            "Container running as root means a single RCE = full host compromise. "
            "EU AI Act Article 15 (accuracy, robustness, cybersecurity) and ISO 42001 "
            "A.8.31 (separation of dev/test/prod) both expect least-privilege execution. "
            "This pattern matches the existing meok-compliance-gateway Dockerfile.\n\n"
            "## Verification\n\n"
            "```\n"
            f"docker run --rm {repo}:non-root whoami  # should print 'app'\n"
            "```\n\n"
            "Generated by Mavis — `scripts/fix_docker_root.py`"
        )
        # Write to temp, commit via gh api (we can't clone all 7)
        result = subprocess.run(
            ["gh", "api",
             f"repos/{owner_repo}/contents/Dockerfile",
             "-X", "PUT",
             "-f", f"message={title}",
             "-f", f"branch={branch}",
             "-f", f"content={base64.b64encode(fixed.encode()).decode()}",
             "-f", f"sha={get_dockerfile_sha(owner_repo)}"],
            capture_output=True, text=True
        )
        if result.returncode != 0:
            print(f"{repo:30} {'root':25} commit failed: {result.stderr[:60]}")
            continue
        pr_url = create_pr(owner_repo, branch, title, body)
        print(f"{repo:30} {'root':25} PR: {pr_url or 'create failed'}")


def get_dockerfile_sha(owner_repo: str) -> str:
    code, body = gh_api(f"repos/{owner_repo}/contents/Dockerfile")
    if code == 0:
        try:
            return json.loads(body)["sha"]
        except Exception:
            pass
    return ""


if __name__ == "__main__":
    main()
