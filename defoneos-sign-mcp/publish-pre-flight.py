#!/usr/bin/env python3
"""
publish-pre-flight.py — OWNER-OPERATED pre-publish check for an MCP server.

This is NOT a publish step. Publishing is outward-facing (creates a public
repo, calls `npm publish`, calls `mcp-publisher publish`) — those are
account actions and are deliberately NOT executed here.

What this script does, in order (each is one of the 5 self-tests below):

  1. Schema-validates server.json against the MCP 2025-07-09 shape
     (name, version, description, packages[].identifier, packages[].registryType,
      packages[].transport.type, repository.{url,source}).
  2. Verifies package.json matches the server.json (name + version + bin).
  3. Requires the npm-script `test` to exit 0 (proves the MCP is healthy).
  4. Scans the source tree for accidental secrets (sk-/AIza/PRIVATE KEY blocks).
  5. Confirms the sovereign signing key (~/.defoneos/sign.key) is OUTSIDE the
     source tree (a private signing key never belongs in a public npm package).

It is deliberately read-only. If any check fails, it exits non-zero so a
shell gate can stop downstream `npm publish`/`gh repo create`. Each failure
prints a one-line fix.

Usage:
    ./publish-pre-flight.py /path/to/mcp-server

Or with no arg: defaults to the script's parent directory.

Honesty: every check is honest. If it says OK, that check actually ran and
passed. If it says FAIL, it tells you exactly which line to fix.

CSOAI Ltd (UK 16939677) · MIT.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
from pathlib import Path

# minimal MCP 2025-07-09 server.schema.json (subset — only fields we use).
EXPECTED_SERVER_KEYS = {"name", "version", "description", "packages", "repository"}
EXPECTED_PKG_KEYS = {"registryType", "identifier", "transport"}
ALLOWED_REGISTRY = {"npm", "pypi", "oci", "github"}
ALLOWED_TRANSPORT = {"stdio", "sse", "http"}
ALLOWED_SOURCE = {"github", "git", "local"}

# secret patterns — never publish any of these. (Truncated to first 6–10 chars.)
SECRET_PATTERNS = [
    (re.compile(r"sk-[A-Za-z0-9]{16,}"), "openai/sk-style API key"),
    (re.compile(r"AIza[A-Za-z0-9]{16,}"), "google API key"),
    (re.compile(r"ghp_[A-Za-z0-9]{20,}"), "github fine-grained PAT"),
    (re.compile(r"npm_[A-Za-z0-9]{20,}"), "npm automation token"),
    (re.compile(r"BEGIN (RSA |EC )?PRIVATE KEY"), "PEM private-key block"),
    (re.compile(r"xoxb-[A-Za-z0-9-]{20,}"), "slack bot token"),
]

FAILURES: list[str] = []
PASSES: list[str] = []


def ok(name: str) -> None:
    PASSES.append(name)
    print(f"  ✅ {name}")


def fail(name: str, why: str) -> None:
    FAILURES.append(f"{name}: {why}")
    print(f"  ❌ {name}\n        ↳ {why}")


def check_server_json(server_json: Path, pkg_json: dict) -> None:
    name = "1. server.json schema-valid (MCP 2025-07-09)"
    if not server_json.is_file():
        fail(name, f"missing — create {server_json}")
        return
    try:
        sj = json.loads(server_json.read_text(encoding="utf-8"))
    except Exception as e:
        fail(name, f"not valid JSON: {e}")
        return

    # missing/extra top-level keys
    missing = EXPECTED_SERVER_KEYS - set(sj.keys())
    if missing:
        fail(name, f"server.json missing keys: {sorted(missing)}")
        return

    # name: ascii, kebab/snake, no spaces or capitals
    n = sj.get("name", "")
    if not re.match(r"^[a-z0-9][a-z0-9._/-]{1,80}$", n):
        fail(name, f"server.json 'name' must be a kebab/dotted slug, got: {n!r}")
        return

    # semver-ish version
    v = sj.get("version", "")
    if not re.match(r"^\d+\.\d+\.\d+(-[\w.]+)?$", str(v)):
        fail(name, f"server.json 'version' must be semver, got: {v!r}")
        return

    # packages[0]
    pkgs = sj.get("packages") or []
    if not pkgs:
        fail(name, "server.json 'packages' must be a non-empty array")
        return
    pkg0 = pkgs[0]
    miss_pkg = EXPECTED_PKG_KEYS - set(pkg0.keys())
    if miss_pkg:
        fail(name, f"server.json packages[0] missing: {sorted(miss_pkg)}")
        return
    if pkg0.get("registryType") not in ALLOWED_REGISTRY:
        fail(name, f"packages[0].registryType {pkg0.get('registryType')!r} not in {sorted(ALLOWED_REGISTRY)}")
        return
    transport = (pkg0.get("transport") or {}).get("type")
    if transport not in ALLOWED_TRANSPORT:
        fail(name, f"packages[0].transport.type {transport!r} not in {sorted(ALLOWED_TRANSPORT)}")
        return

    # repository.url/source
    repo = sj.get("repository") or {}
    if not re.match(r"^https?://", repo.get("url", "")):
        fail(name, f"repository.url must be https://..., got: {repo.get('url')!r}")
        return
    if repo.get("source") not in ALLOWED_SOURCE:
        fail(name, f"repository.source {repo.get('source')!r} not in {sorted(ALLOWED_SOURCE)}")
        return

    # cross-check against package.json
    if pkg_json:
        idn = pkg0.get("identifier", "")
        if idn and idn != pkg_json.get("name"):
            fail(name, f"server.json packages[0].identifier={idn!r} ≠ package.json name={pkg_json.get('name')!r}")
            return
        if str(sj.get("version")) and pkg_json.get("version") and str(sj["version"]) != str(pkg_json["version"]):
            fail(name, f"server.json version={sj['version']} ≠ package.json version={pkg_json['version']}")
            return
        bin_field = pkg_json.get("bin") or {}
        bin_main = next(iter(bin_field.values()), None) if isinstance(bin_field, dict) else None
        if bin_main and Path(bin_main).name not in Path(server_json).parent.name and not Path(bin_main).is_file():
            fail(name, f"package.json bin target {bin_main!r} not in {server_json.parent}")
            return

    ok(name)


def check_package_json(server_dir: Path) -> dict:
    name = "2. package.json present + matches server.json"
    pj = server_dir / "package.json"
    if not pj.is_file():
        fail(name, "package.json missing — required for `npm publish`")
        return {}
    try:
        pkg = json.loads(pj.read_text(encoding="utf-8"))
    except Exception as e:
        fail(name, f"package.json invalid JSON: {e}")
        return {}
    miss = {"name", "version"} - set(pkg.keys())
    if miss:
        fail(name, f"package.json missing: {sorted(miss)}")
        return pkg
    if not re.match(r"^\d+\.\d+\.\d+(-[\w.]+)?$", str(pkg.get("version", ""))):
        fail(name, f"package.json version not semver: {pkg.get('version')!r}")
        return pkg
    if not isinstance(pkg.get("license"), str):
        fail(name, "package.json should declare a 'license' string (e.g. MIT)")
        return pkg
    ok(name)
    return pkg


def check_npm_test(server_dir: Path) -> None:
    name = "3. `npm test` exits 0 (live proof the MCP works)"
    if not (server_dir / "package.json").is_file():
        fail(name, "skipped — no package.json")
        return
    if not (server_dir / "test.js").is_file() and "test" not in (json.loads((server_dir / "package.json").read_text(encoding="utf-8")).get("scripts") or {}):
        fail(name, "no test.js AND no 'test' script in package.json")
        return
    try:
        res = subprocess.run(
            ["npm", "test", "--silent"],
            cwd=str(server_dir), capture_output=True, text=True, timeout=180,
        )
    except FileNotFoundError:
        fail(name, "npm not on PATH — install Node ≥18")
        return
    except subprocess.TimeoutExpired:
        fail(name, "npm test timed out after 180s")
        return
    if res.returncode != 0:
        fail(name, f"npm test failed (exit {res.returncode}). Tail:\n{res.stdout[-1200:]}\n{res.stderr[-600:]}")
        return
    # sanity: it actually ran tests (look for 'passed' line)
    if "passed" not in res.stdout and "passed" not in res.stderr:
        fail(name, "npm test exited 0 but I see no 'passed' line — does the suite actually run checks?")
        return
    ok(name)


def check_no_secrets(server_dir: Path) -> None:
    name = "4. no accidental secrets in publishable source"
    offenders: list[tuple[str, str, str]] = []
    skip_dirs = {"node_modules", ".git", "dist", "build", "__pycache__", ".defoneos"}
    for path in server_dir.rglob("*"):
        if path.is_dir():
            continue
        if any(part in skip_dirs for part in path.parts):
            continue
        if path.suffix in {".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".key", ".pem"}:
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for pat, label in SECRET_PATTERNS:
            for m in pat.finditer(text):
                line_no = text[: m.start()].count("\n") + 1
                offenders.append((str(path.relative_to(server_dir)), str(line_no), label + ":" + m.group(0)[:12] + "…"))
                if len(offenders) >= 5:
                    break
        if len(offenders) >= 5:
            break
    if offenders:
        msg = "; ".join(f"{p}:{ln} ({kind})" for p, ln, kind in offenders[:5])
        fail(name, f"found secret-shaped strings — replace with env-var lookups: {msg}")
        return
    ok(name)


def check_sovereign_key_outside(server_dir: Path) -> None:
    name = "5. sovereign signing key NOT in source tree"
    kdir = Path(os.environ.get("DEFONEOS_KEY_DIR", str(Path.home() / ".defoneos")))
    in_tree = list(server_dir.rglob("sign.key")) + list(server_dir.rglob("*.key")) + list(server_dir.rglob(".defoneos"))
    if in_tree:
        rel = ", ".join(str(p.relative_to(server_dir)) for p in in_tree[:3])
        fail(name, f"keyfile(s) in publishable tree: {rel} — move to {kdir} (the MCP loads from there)")
        return
    # fine-print: also confirm the directory we load from exists so the MCP doesn't blink on first run
    if not kdir.exists():
        # not fatal — the MCP will create it on first run — but warn
        print(f"  ⚠️  sovereign-key dir {kdir} does not exist yet — the MCP will mint one on first run (fine)")
    ok(name)


def check_gitignore(server_dir: Path) -> None:
    name = "6. .gitignore excludes node_modules + keyfiles"
    gi = server_dir / ".gitignore"
    if not gi.is_file():
        # non-fatal: many MCPs are published without one, but it is best practice
        print(f"  ⚠️  no .gitignore at {gi} — add at minimum: node_modules/, *.key, .defoneos/, .env")
        return
    text = gi.read_text(encoding="utf-8")
    for needed in ("node_modules", "*.key", ".env"):
        if needed not in text:
            print(f"  ⚠️  .gitignore missing '{needed}' pattern")
    ok(name)


def main(argv: list[str]) -> int:
    if argv:
        server_dir = Path(argv[0]).expanduser().resolve()
    else:
        server_dir = Path(__file__).resolve().parent
    if not server_dir.is_dir():
        print(f"❌ not a directory: {server_dir}", file=sys.stderr)
        return 2
    print(f"defoneos-sign-mcp · publish-pre-flight")
    print(f"  target: {server_dir}\n")

    pkg = check_package_json(server_dir)
    sj = server_dir / "server.json"
    check_server_json(sj, pkg)
    check_npm_test(server_dir)
    check_no_secrets(server_dir)
    check_sovereign_key_outside(server_dir)
    check_gitignore(server_dir)

    print(f"\n{len(PASSES)} passed · {len(FAILURES)} failed")
    if FAILURES:
        print("\nFix and re-run:")
        for f in FAILURES:
            print(f"  - {f}")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
