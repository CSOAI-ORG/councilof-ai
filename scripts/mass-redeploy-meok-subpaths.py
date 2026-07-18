#!/usr/bin/env python3
"""Redeploy all meok.ai subpath deploy directories and rebuild ui rewrites.

Reads each *-deploy/ directory under clawd/, runs `vercel --prod --yes`,
captures the actual Vercel alias, then regenerates the external-destination
rewrite rules in meok/ui/vercel.json. Finally redeploys the main ui project
from its linked project directory (clawd/meok), because the Vercel project
root is set to the `ui/` subdirectory.
"""
import json
import re
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

BASE = Path("/Users/nicholas/clawd")
UI_JSON = BASE / "meok" / "ui" / "vercel.json"
UI_DEPLOY_DIR = BASE / "meok"
LOG = BASE / "_findings" / "MASS_REDEPLOY_MEOK_2026-06-15.md"
TIMEOUT = 120


def canonical(path: Path) -> str:
    text = path.read_text(encoding="utf-8", errors="ignore")
    m = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', text, re.I)
    if not m:
        m = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', text, re.I)
    return m.group(1).strip() if m else ""


def deploy_and_alias(deploy_dir: Path) -> tuple[str, str]:
    try:
        result = subprocess.run(
            ["vercel", "--prod", "--yes"],
            cwd=str(deploy_dir),
            capture_output=True,
            text=True,
            timeout=TIMEOUT,
        )
        output = result.stdout + "\n" + result.stderr
        m = re.search(r'▲\s+Aliased\s+(https?://\S+)', output)
        if m:
            return m.group(1).rstrip("/"), ""
        m = re.search(r'▲\s+Production\s+(https?://\S+)', output)
        if m:
            return m.group(1).rstrip("/"), "(used production URL, no alias)"
        return "", f"no alias found; exit={result.returncode}"
    except subprocess.TimeoutExpired:
        return "", "timeout"
    except Exception as e:
        return "", str(e)


def main():
    config = json.loads(UI_JSON.read_text(encoding="utf-8"))
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

    lines = [
        "# Mass Redeploy — meok.ai subpath sites",
        f"**Generated:** {datetime.now(timezone.utc).isoformat().replace('+00:00', '')}Z",
        f"**Targets:** {len(targets)}",
        "",
        "| Directory | Path | Alias | Result |",
        "|---|---|---|---|",
    ]
    external = []
    seen = set()
    conflicts = []

    for name, path, deploy_dir in targets:
        print(f"Deploying {name} ...")
        alias, note = deploy_and_alias(deploy_dir)
        if not alias:
            lines.append(f"| {name} | {path} | 🔴 | {note} |")
            continue
        # Verify alias returns 200
        try:
            probe = subprocess.run(
                ["curl", "-sL", "-o", "/dev/null", "-w", "%{http_code}", alias + "/"],
                capture_output=True, text=True, timeout=20,
            ).stdout.strip()
        except Exception as e:
            probe = f"err:{e}"
        if probe != "200":
            note += f" [probe {probe}]"
        if path in seen:
            conflicts.append((name, path, alias))
            lines.append(f"| {name} | {path} | {alias} | ⚠️ duplicate skipped |")
            continue
        seen.add(path)
        external.append({"source": path, "destination": alias + "/"})
        external.append({"source": path + "/:path*", "destination": alias + "/:path*"})
        lines.append(f"| {name} | {path} | {alias} | {note or '✅'} |")
        time.sleep(1)

    config["rewrites"] = static_rewrites + external
    UI_JSON.write_text(json.dumps(config, indent=2), encoding="utf-8")

    print("Deploying ui project ...")
    ui = subprocess.run(
        ["vercel", "--prod", "--yes"],
        cwd=str(UI_DEPLOY_DIR),
        capture_output=True,
        text=True,
        timeout=300,
    )
    ui_tail = (ui.stdout or "").strip().splitlines()[-8:] + (ui.stderr or "").strip().splitlines()[-3:]
    lines.extend(["", "## ui deployment", "", "```"])
    lines.extend(ui_tail)
    lines.append("```")
    if conflicts:
        lines.extend(["", "## Conflicts (same source path)", ""])
        for name, path, alias in conflicts:
            lines.append(f"- {name} -> {path} ({alias})")

    LOG.parent.mkdir(parents=True, exist_ok=True)
    LOG.write_text("\n".join(lines), encoding="utf-8")
    print(f"Log: {LOG}")
    print(f"External subpath rewrites: {len(external)//2}")


if __name__ == "__main__":
    main()
