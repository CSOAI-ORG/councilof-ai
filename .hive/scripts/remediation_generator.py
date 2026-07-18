#!/usr/bin/env python3
"""remediation_generator.py — turn audit/quality findings into actionable TODOs.

Reads quality_report.json, e2e_report.json, and comprehensive_audit_report.json,
then writes .hive/tasks/TODO_remediation.md so the Sensor picks them up.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
OUT = ROOT / ".hive" / "tasks" / "TODO_remediation.md"


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def quality_tasks(report: dict[str, Any]) -> list[str]:
    tasks = []
    for repo in report.get("repos", []):
        if repo["grade"] in ("F", "D"):
            tasks.append(f"[{repo['grade']}] Improve {repo['name']} quality (dirty={repo['dirty']}, placeholders={repo['placeholders']})")
        if repo.get("tests") == "FAIL":
            tasks.append(f"[P0] Fix failing tests in {repo['name']}")
    placeholders = report.get("placeholders", [])
    seen = set()
    for h in placeholders[:20]:
        key = (h["file"], h["pattern"])
        if key in seen:
            continue
        seen.add(key)
        tasks.append(f"Replace placeholder in {h['file']}:{h['line']} ({h['pattern']})")
    return tasks


def e2e_tasks(report: dict[str, Any]) -> list[str]:
    tasks = []
    failed = [r for r in report.get("results", []) if r.get("status") == "FAIL"]
    for r in failed[:20]:
        tasks.append(f"[P0] Fix E2E failure: {r['group']} / {r['name']} — {r.get('detail', '')}")
    return tasks


def audit_tasks(report: dict[str, Any]) -> list[str]:
    tasks = []
    required_headers = [
        "content_security_policy",
        "x_frame_options",
        "x_content_type_options",
        "referrer_policy",
        "permissions_policy",
    ]
    for entry in report.get("security_results", []):
        missing = [h for h in required_headers if not entry.get(h)]
        if missing:
            tasks.append(f"Add security headers to {entry['domain']}: {', '.join(missing)}")
    required_files = ["/llms.txt", "/.well-known/mcp-server", "/robots.txt", "/sitemap.xml"]
    for entry in report.get("aeo_geo_results", []):
        missing = [f for f in required_files if not entry.get(f, {}).get("ok")]
        if missing:
            tasks.append(f"Add AEO/GEO files to {entry['domain']}: {', '.join(missing)}")
    return tasks


def main() -> None:
    quality = load_json(ROOT / ".hive" / "logs" / "quality_report.json")
    e2e = load_json(ROOT / "tests" / "e2e" / "e2e_report.json")
    audit = load_json(ROOT / "tests" / "e2e" / "comprehensive_audit_report_2026_06_14.json")

    lines = [
        "# Auto-generated Remediation TODO",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Quality",
    ]
    for t in quality_tasks(quality):
        lines.append(f"- [ ] {t}")

    lines.extend(["", "## E2E"])
    e2e_todos = e2e_tasks(e2e)
    if e2e_todos:
        for t in e2e_todos:
            lines.append(f"- [ ] {t}")
    else:
        lines.append("- [x] All E2E tests passing")

    lines.extend(["", "## Domain/Audit"])
    for t in audit_tasks(audit):
        lines.append(f"- [ ] {t}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {len(lines)} lines to {OUT}")


if __name__ == "__main__":
    main()
