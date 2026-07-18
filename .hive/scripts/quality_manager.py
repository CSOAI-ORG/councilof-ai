#!/usr/bin/env python3
"""quality_manager.py — grade repo health and emit a JSON quality report.

Reads quality configuration from .hive/config.yaml, checks git dirty state, runs
test suites, scans for placeholder/secrets patterns, and writes
.hive/logs/quality_report.json.
"""
from __future__ import annotations

import fnmatch
import json
import os
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from hive_notify import notify

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
CONFIG = ROOT / ".hive" / "config.yaml"
LOG_DIR = ROOT / ".hive" / "logs"
REPORT = LOG_DIR / "quality_report.json"


def load_config() -> dict[str, Any]:
    try:
        import yaml

        return yaml.safe_load(CONFIG.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}


def run(cmd: str, cwd: Path, timeout: int = 120) -> subprocess.CompletedProcess[str]:
    try:
        return subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True, timeout=timeout)
    except Exception as e:
        return subprocess.CompletedProcess(args=cmd, returncode=-1, stdout="", stderr=str(e))


def git_dirty(path: Path) -> int:
    """Count dirty files under the given path (repo-relative)."""
    if not (path / "..").exists():
        return 0
    r = run("git status --short .", path)
    return len([l for l in r.stdout.splitlines() if l.strip()])


def run_tests(path: Path, tests: list[str]) -> str:
    if not tests:
        return "SKIP"
    cmd = " ".join(str(t) for t in tests)
    r = run(cmd, path, timeout=180)
    return "PASS" if r.returncode == 0 else "FAIL"


def find_placeholders(root: Path, patterns: list[str], ignore_dirs: set[str] | None = None, ignore_files: list[str] | None = None) -> list[dict[str, Any]]:
    hits = []
    ignore = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", ".next"}
    if ignore_dirs:
        ignore.update(ignore_dirs)
    binary_exts = {
        ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".pdf", ".zip", ".tar", ".gz",
        ".mp3", ".mp4", ".mov", ".avi", ".webm", ".woff", ".woff2", ".ttf", ".otf",
        ".eot", ".db", ".sqlite", ".sqlite3", ".pyc", ".pyo", ".so", ".dylib", ".dll",
        ".exe", ".bin", ".dat", ".pickle", ".pkl", ".npy", ".npz", ".onnx", ".pt",
    }
    max_size = 5 * 1024 * 1024  # 5 MB
    ignore_file_patterns = ignore_files or []

    def _ignored_file(rel: str) -> bool:
        for pat in ignore_file_patterns:
            if fnmatch.fnmatch(rel, pat) or fnmatch.fnmatch(Path(rel).name, pat):
                return True
        return False

    # Prefer tracked files for speed; fall back to filesystem walk.
    files: list[Path] = []
    git_ls = run("git ls-files", root)
    if git_ls.returncode == 0 and git_ls.stdout.strip():
        files = [root / line.strip() for line in git_ls.stdout.splitlines() if line.strip()]
    else:
        files = [p for p in root.rglob("*") if p.is_file()]

    for p in files:
        if any(part in ignore for part in p.parts):
            continue
        rel = str(p.relative_to(root))
        if _ignored_file(rel):
            continue
        if p.suffix.lower() in binary_exts:
            continue
        try:
            size = p.stat().st_size
            if size > max_size:
                continue
            text = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        # Skip files that are mostly binary garbage
        if "\x00" in text[:8192]:
            continue
        for pat in patterns:
            try:
                for m in re.finditer(pat, text):
                    hits.append({
                        "file": str(p.relative_to(root)),
                        "line": text[: m.start()].count("\n") + 1,
                        "pattern": pat,
                    })
            except re.error:
                continue
    return hits


def grade_repo(dirty: int, tests: str, placeholders: int, max_dirty: int, e2e_pass_rate: float = 1.0) -> str:
    score = 100
    if dirty > max_dirty * 5:
        score -= 30
    elif dirty > max_dirty * 2:
        score -= 15
    elif dirty > 0:
        score -= 5
    if tests == "FAIL":
        score -= 25
    elif tests == "SKIP":
        score -= 0
    score -= min(30, 10 * placeholders)
    if e2e_pass_rate < 0.5:
        score -= 30
    elif e2e_pass_rate < 0.8:
        score -= 15
    elif e2e_pass_rate < 1.0:
        score -= 5
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def load_e2e_report() -> dict[str, Any]:
    path = ROOT / "tests" / "e2e" / "e2e_report.json"
    if not path.exists():
        return {"total": 0, "passed": 0, "failed": 0, "skipped": 0, "pass_rate": 0.0}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        total = data.get("total", 0)
        passed = data.get("passed", 0)
        data["pass_rate"] = passed / total if total else 0.0
        return data
    except Exception:
        return {"total": 0, "passed": 0, "failed": 0, "skipped": 0, "pass_rate": 0.0}


def load_test_fleet_report() -> dict[str, Any]:
    path = ROOT / ".hive" / "logs" / "test_fleet_report.json"
    if not path.exists():
        return {"summary": {"suites_total": 0, "suites_passed": 0, "pass_rate": 0.0}}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {"summary": {"suites_total": 0, "suites_passed": 0, "pass_rate": 0.0}}


def main() -> None:
    config = load_config()
    quality = config.get("quality", {})
    sensors = config.get("sensors", {})
    repos = quality.get("repos", [])
    placeholder_patterns = quality.get("secret_patterns", [r"REPLACE_WITH_"])
    ignore_dirs = set(sensors.get("ignore_dirs", []))
    ignore_files = quality.get("placeholder_ignore_files", [])
    e2e = load_e2e_report()
    fleet = load_test_fleet_report()

    LOG_DIR.mkdir(parents=True, exist_ok=True)
    report: dict[str, Any] = {"ts": datetime.now(timezone.utc).isoformat(), "repos": [], "placeholders": []}

    for repo in repos:
        path = Path(repo["path"])
        name = repo.get("name", path.name)
        if not path.exists():
            continue
        dirty = git_dirty(path)
        tests = run_tests(path, repo.get("tests", []))
        repo_placeholders = find_placeholders(path, placeholder_patterns, ignore_dirs, ignore_files)
        grade = grade_repo(dirty, tests, len(repo_placeholders), repo.get("max_dirty_files", 10), e2e["pass_rate"])
        report["repos"].append({
            "name": name,
            "path": str(path),
            "dirty": dirty,
            "tests": tests,
            "placeholders": len(repo_placeholders),
            "grade": grade,
        })
        print(f"  {name}: grade={grade} dirty={dirty} tests={tests} placeholders={len(repo_placeholders)}")

    report["placeholders"] = find_placeholders(ROOT, placeholder_patterns, ignore_dirs, ignore_files)
    if report["placeholders"]:
        print(f"  Total placeholders found: {len(report['placeholders'])}")
        for h in report["placeholders"][:5]:
            print(f"    {h['file']}:{h['line']} pattern={h['pattern']}")

    overall_dirty = sum(r["dirty"] for r in report["repos"])
    any_fail = any(r["tests"] == "FAIL" for r in report["repos"])
    total_placeholders = len(report["placeholders"])
    fleet_summary = fleet.get("summary", {})
    combined_pass_rate = (
        (e2e["pass_rate"] + fleet_summary.get("pass_rate", 0.0)) / 2
        if e2e["pass_rate"] and fleet_summary.get("pass_rate")
        else max(e2e["pass_rate"], fleet_summary.get("pass_rate", 0.0))
    )
    overall_grade = grade_repo(overall_dirty, "FAIL" if any_fail else "PASS", total_placeholders, 25, combined_pass_rate)
    report["e2e"] = e2e
    report["test_fleet"] = fleet
    report["overall"] = {
        "grade": overall_grade,
        "dirty": overall_dirty,
        "placeholders": total_placeholders,
        "e2e_pass_rate": e2e["pass_rate"],
        "fleet_pass_rate": fleet_summary.get("pass_rate", 0.0),
        "fleet_suites": f"{fleet_summary.get('suites_passed', 0)}/{fleet_summary.get('suites_total', 0)}",
    }

    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Overall grade: {overall_grade}")

    if overall_grade not in ("A", "B"):
        notify(
            f"Quality grade dropped to {overall_grade}",
            f"Overall empire quality is {overall_grade}.\nDirty files: {overall_dirty}\nPlaceholders: {total_placeholders}\nSee {REPORT}",
            level="warning",
        )
    for r in report["repos"]:
        if r["tests"] == "FAIL":
            notify(
                f"Test failure in {r['name']}",
                f"Test suite failed for {r['name']} ({r['path']}).",
                level="error",
            )


if __name__ == "__main__":
    main()
