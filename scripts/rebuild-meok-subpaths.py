#!/usr/bin/env python3
"""Rebuild meok.ai subpath rewrites in ui/vercel.json from actual Vercel aliases.

For every *-deploy/ directory whose canonical is a meok.ai subpath (not the root),
run `vercel --prod --yes`, capture the aliased production URL, and regenerate the
external-destination rewrites in meok/ui/vercel.json. Then redeploy the ui project.
"""
import json
import re
import subprocess
import time
from pathlib import Path

BASE = Path("/Users/nicholas/clawd")
UI_DIR = BASE / "meok" / "ui"
VERCEL_JSON = UI_DIR / "vercel.json"
LOG = BASE / "_findings" / "REBUILD_MEOK_SUBPATHS_2026-06-15.md"
TIMEOUT = 120


def canonical(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', text, re.I)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', text, re.I)
    return m.group(1).strip() if m else ""


def deploy_and_alias(deploy_dir: Path) -> tuple[str, str]:
    """Run vercel --prod and return (alias_url, raw_tail)."""
    try:
        result = subprocess.run(
            ["vercel", "--prod", "--yes"],
            cwd=str(deploy_dir),
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
        )
        output = result.stdout + "\n" + result.stderr
        # Find Aliased line; e.g. ▲ Aliased https://foo-deploy.vercel.app
        m = re.search(r'▲\s+Aliased\s+(https?://\S+)', output)
        if m:
            return m.group(1).rstrip("/"), ""
        # Fallback to Production line if no alias (rare).
        m = re.search(r'▲\s+Production\s+(https?://\S+)', output)
        if m:
            return m.group(1).rstrip("/"), "(used production URL, no alias)"
        return "", f"no alias found; exit={result.returncode}"
    except subprocess.TimeoutExpired:
        return "", "timeout"
    except Exception as e:
        return "", str(e)


def main():
    config = json.loads(VERCEL_JSON.read_text(encoding="utf-8"))
    # Keep static/internal rewrites; drop all external https rewrites.
    static_rewrites = [r for r in config.get("rewrites", []) if not r.get("destination", "").startswith("https://")]

    targets = []
    for deploy_dir in sorted(BASE.glob("*-deploy")):
        if not deploy_dir.is_dir() or not (deploy_dir / "index.html").exists():
            continue
        can = canonical(deploy_dir / "index.html")
        if not can.startswith("https://meok.ai/") or can == "https://meok.ai/":
            continue
        path = can[len("https://meok.ai"):].rstrip("/") or "/"
        targets.append((deploy_dir.name, path, deploy_dir))

    log_lines = ["# Rebuild meok.ai subpath rewrites", f"**Targets:** {len(targets)}", "", "| Directory | Path | Alias | Note |", "|---|---|---|---|"]
    new_external = []
    seen_sources = set()
    conflicts = []

    for name, path, deploy_dir in targets:
        print(f"Deploying {name} ...")
        alias, note = deploy_and_alias(deploy_dir)
        if not alias:
            log_lines.append(f"| {name} | {path} | 🔴 | {note} |")
            continue
        # Verify alias is reachable
        try:
            req_code = subprocess.run(
                ["curl", "-sL", "-o", "/dev/null", "-w", "%{http_code}", alias + "/"],
                capture_output=True, text=True, timeout=20,
            ).stdout.strip()
        except Exception as e:
            req_code = f"err:{e}"
        if req_code != "200":
            note += f" [alias probe {req_code}]"
        if path in seen_sources:
            conflicts.append((name, path, alias))
            log_lines.append(f"| {name} | {path} | {alias} | ⚠️ duplicate skipped |")
            continue
        seen_sources.add(path)
        new_external.append({"source": path, "destination": alias + "/"})
        new_external.append({"source": path + "/:path*", "destination": alias + "/:path*"})
        log_lines.append(f"| {name} | {path} | {alias} | {note or '✅'} |")
        time.sleep(1)

    config["rewrites"] = static_rewrites + new_external
    VERCEL_JSON.write_text(json.dumps(config, indent=2), encoding="utf-8")

    # Deploy ui project
    print("Deploying ui project ...")
    ui_result = subprocess.run(
        ["vercel", "--prod", "--yes"],
        cwd=str(UI_DIR),
        capture_output=True,
        text=True,
        timeout=300,
    )
    ui_tail = (ui_result.stdout or "").strip().splitlines()[-5:] + (ui_result.stderr or "").strip().splitlines()[-3:]
    log_lines.extend(["", "## ui deployment", ""])
    log_lines.append(f"```\n{'\\n'.join(ui_tail)}\\n```")
    if conflicts:
        log_lines.extend(["", "## Conflicts (same source path)", ""])
        for name, path, alias in conflicts:
            log_lines.append(f"- {name} -> {path} ({alias})")

    LOG.parent.mkdir(parents=True, exist_ok=True)
    LOG.write_text("\n".join(log_lines), encoding="utf-8")
    print(f"Log: {LOG}")
    print(f"External rewrites: {len(new_external)//2}")


if __name__ == "__main__":
    main()
