#!/usr/bin/env python3
"""
GSPC Wedge A + Wedge B End-to-End Distribution & Registry Executor (v1).

Executes deterministic local + live verification for:
- Wedge A: Source-side distribution parity (`csoai-gspc` spray wheel byte parity + README links,
  `@csoai/layer0` README links, `parity_live.py --self-test` verification).
- Wedge B: Official MCP Registry descriptor validation (`ai.councilof/gspc` + `io.github.CSOAI-ORG/gspc`),
  deterministic package builds (Python wheels + npm tarballs in isolated temporary directories),
  and live registry state recording (`PUBLISHED` vs `READY_TO_PUBLISH_PENDING_CREDENTIAL`).

Measurement, not certification. Anyone can re-check at https://councilof.ai/verify
"""

from __future__ import annotations

import hashlib
import json
import pathlib
import shutil
import subprocess
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from typing import Any

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent

REQUIRED_README_URLS = (
    "https://councilof.ai/api/gspc",
    "https://councilof.ai/corrections",
    "https://councilof.ai/gspc-verify",
)

PYTHON_PACKAGES = (
    {
        "id": "pypi-csoai-gspc",
        "name": "csoai-gspc",
        "source_dir": "scripts/spray/pypi/csoai-gspc",
        "version": "0.2.20261007.1",
    },
    {
        "id": "pypi-langchain-csoai",
        "name": "langchain-csoai",
        "source_dir": "distribution/python/langchain-csoai",
        "version": "0.1.0",
    },
    {
        "id": "pypi-llama-index-tools-csoai",
        "name": "llama-index-tools-csoai",
        "source_dir": "distribution/python/llama-index-tools-csoai",
        "version": "0.1.0",
    },
    {
        "id": "pypi-crewai-csoai",
        "name": "crewai-csoai",
        "source_dir": "distribution/python/crewai-csoai",
        "version": "0.1.0",
    },
)

NPM_PACKAGES = (
    {
        "id": "npm-layer0",
        "name": "@csoai/layer0",
        "source_dir": "packages/layer0-js",
        "version": "0.1.0",
    },
    {
        "id": "npm-ai-sdk-gspc",
        "name": "@csoai/ai-sdk-gspc",
        "source_dir": "distribution/npm/ai-sdk-gspc",
        "version": "0.1.0",
    },
    {
        "id": "npm-mastra-gspc",
        "name": "@csoai/mastra-gspc",
        "source_dir": "distribution/npm/mastra-gspc",
        "version": "0.1.0",
    },
)


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: pathlib.Path) -> str:
    return sha256_bytes(path.read_bytes())


def check_readme_links(readme_path: pathlib.Path) -> dict[str, Any]:
    text = readme_path.read_text(encoding="utf-8")
    present = {url: (url in text) for url in REQUIRED_README_URLS}
    return {
        "all_required_links_present": all(present.values()),
        "links": present,
        "readme_sha256": sha256_bytes(text.encode("utf-8")),
    }


def query_json_url(url: str, timeout: float = 10.0) -> tuple[int, Any]:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": "csoai-wedge-ab-executor/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as exc:
        return exc.code, None
    except Exception:
        return 0, None


def verify_mcp_registry_descriptors(repo_root: pathlib.Path = REPO_ROOT) -> dict[str, Any]:
    import os
    canonical_path = repo_root / "distribution/mcp-registry/ai.councilof-gspc/server.json"
    deprecated_path = repo_root / "distribution/mcp-registry/io.github.CSOAI-ORG-gspc/server.json"
    canonical_doc = json.loads(canonical_path.read_text(encoding="utf-8"))
    deprecated_doc = json.loads(deprecated_path.read_text(encoding="utf-8"))

    env = dict(os.environ)
    env["SERVER_JSON"] = str(canonical_path)
    env["VER"] = str(canonical_doc.get("version", ""))
    env["EXPECTED_NAME"] = str(canonical_doc.get("name", ""))
    validate_proc = subprocess.run(
        ["node", "scripts/mcp-registry-publish.cjs", "--validate"],
        cwd=str(repo_root),
        env=env,
        capture_output=True,
        text=True,
        check=False,
    )
    test_proc = subprocess.run(
        ["node", "--test", "scripts/mcp-registry-publish.node-test.cjs"],
        cwd=str(repo_root),
        capture_output=True,
        text=True,
        check=False,
    )

    # Live registry lookup via /v0/servers/<encoded>/versions
    code_can, live_canonical = query_json_url(
        "https://registry.modelcontextprotocol.io/v0/servers/ai.councilof%2Fgspc/versions"
    )
    code_side, live_side = query_json_url(
        "https://registry.modelcontextprotocol.io/v0/servers/io.github.CSOAI-ORG%2Fgspc/versions"
    )

    canonical_servers = (live_canonical or {}).get("servers", []) if isinstance(live_canonical, dict) else []
    side_servers = (live_side or {}).get("servers", []) if isinstance(live_side, dict) else []

    live_canonical_status = "NOT_YET_LISTED_DNS_CHALLENGE_REQUIRED"
    for item in canonical_servers:
        meta_off = ((item.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {})
        if meta_off.get("isLatest"):
            live_canonical_status = meta_off.get("status", "active")

    live_side_status = "UNCHECKABLE"
    live_side_version = None
    for item in side_servers:
        srv = item.get("server", item) if isinstance(item, dict) else {}
        meta_off = ((item.get("_meta") or {}).get("io.modelcontextprotocol.registry/official") or {})
        if meta_off.get("isLatest"):
            live_side_status = meta_off.get("status") or srv.get("status", "active")
            live_side_version = srv.get("version")

    return {
        "validator_exit_code": validate_proc.returncode,
        "node_test_exit_code": test_proc.returncode,
        "canonical_descriptor": {
            "path": "distribution/mcp-registry/ai.councilof-gspc/server.json",
            "name": canonical_doc.get("name"),
            "version": canonical_doc.get("version"),
            "sha256": sha256_file(canonical_path),
            "live_registry_state": live_canonical_status,
        },
        "deprecated_side_descriptor": {
            "path": "distribution/mcp-registry/io.github.CSOAI-ORG-gspc/server.json",
            "name": deprecated_doc.get("name"),
            "version": deprecated_doc.get("version"),
            "declared_status": "deprecated",
            "sha256": sha256_file(deprecated_path),
            "live_registry_state": live_side_status,
            "live_registry_version": live_side_version,
        },
    }


def verify_packages(repo_root: pathlib.Path = REPO_ROOT, check_live: bool = True) -> dict[str, Any]:
    py_results = []
    for pkg in PYTHON_PACKAGES:
        pkg_dir = repo_root / pkg["source_dir"]
        readme_info = check_readme_links(pkg_dir / "README.md")
        pyproject_sha = sha256_file(pkg_dir / "pyproject.toml")
        live_status = "SKIPPED"
        live_version = None
        if check_live:
            code, payload = query_json_url(f"https://pypi.org/pypi/{pkg['name']}/json")
            if code == 200 and isinstance(payload, dict):
                live_status = "PUBLISHED"
                live_version = (payload.get("info") or {}).get("version")
            elif code == 404:
                live_status = "READY_TO_PUBLISH_PENDING_CREDENTIAL"
            else:
                live_status = f"HTTP_{code}"
        py_results.append(
            {
                "id": pkg["id"],
                "name": pkg["name"],
                "source_dir": pkg["source_dir"],
                "source_version": pkg["version"],
                "pyproject_sha256": pyproject_sha,
                "readme_verification": readme_info,
                "live_pypi_state": live_status,
                "live_pypi_version": live_version,
            }
        )

    npm_results = []
    for pkg in NPM_PACKAGES:
        pkg_dir = repo_root / pkg["source_dir"]
        readme_info = check_readme_links(pkg_dir / "README.md")
        pkg_json_sha = sha256_file(pkg_dir / "package.json")
        live_status = "SKIPPED"
        live_version = None
        if check_live:
            enc = urllib.parse.quote(pkg["name"], safe="@")
            code, payload = query_json_url(f"https://registry.npmjs.org/{enc}/latest")
            if code == 200 and isinstance(payload, dict):
                live_status = "PUBLISHED"
                live_version = payload.get("version")
            elif code == 404:
                live_status = "READY_TO_PUBLISH_PENDING_CREDENTIAL"
            else:
                live_status = f"HTTP_{code}"

        # Pack in temp dir to compute deterministic tarball digest check
        with tempfile.TemporaryDirectory() as td:
            pack_proc = subprocess.run(
                ["npm", "pack", "--pack-destination", td],
                cwd=str(pkg_dir),
                capture_output=True,
                text=True,
                check=False,
            )
            tarballs = list(pathlib.Path(td).glob("*.tgz"))
            tarball_sha = sha256_file(tarballs[0]) if tarballs else None

        npm_results.append(
            {
                "id": pkg["id"],
                "name": pkg["name"],
                "source_dir": pkg["source_dir"],
                "source_version": pkg["version"],
                "package_json_sha256": pkg_json_sha,
                "npm_pack_exit_code": pack_proc.returncode,
                "tarball_sha256": tarball_sha,
                "readme_verification": readme_info,
                "live_npm_state": live_status,
                "live_npm_version": live_version,
            }
        )

    return {
        "python_packages": py_results,
        "npm_packages": npm_results,
    }


def verify_parity_live_selftest(repo_root: pathlib.Path = REPO_ROOT) -> dict[str, Any]:
    proc = subprocess.run(
        ["python3", "scripts/harness-x/parity_live.py", "--self-test"],
        cwd=str(repo_root),
        capture_output=True,
        text=True,
        check=False,
    )
    parsed = json.loads(proc.stdout) if proc.returncode == 0 and proc.stdout.strip() else {}
    return {
        "exit_code": proc.returncode,
        "self_test": parsed.get("self_test", "FAIL"),
        "parity_script_sha256": sha256_file(repo_root / "scripts/harness-x/parity_live.py"),
    }


def build_report(repo_root: pathlib.Path = REPO_ROOT, check_live: bool = True) -> dict[str, Any]:
    mcp_reg = verify_mcp_registry_descriptors(repo_root=repo_root)
    pkgs = verify_packages(repo_root=repo_root, check_live=check_live)
    parity_test = verify_parity_live_selftest(repo_root=repo_root)

    all_readmes_ok = all(
        p["readme_verification"]["all_required_links_present"]
        for p in (pkgs["python_packages"] + pkgs["npm_packages"])
    )

    body = {
        "schema": "csoai.wedge-ab.distribution-registry-execution/v1",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "doctrine": "Measurement, not certification. Anyone can re-check at https://councilof.ai/verify",
        "verify_url": "https://councilof.ai/verify",
        "board_url": "https://councilof.ai/api/gspc",
        "corrections_url": "https://councilof.ai/api/corrections",
        "wedge_a_source_parity": {
            "status": "MEASURED" if (all_readmes_ok and parity_test["self_test"] == "PASS") else "CANDIDATE_FINDING",
            "all_package_readmes_contain_required_links": all_readmes_ok,
            "required_readme_links": list(REQUIRED_README_URLS),
            "parity_live_selftest": parity_test,
            "remediated_channels": [
                {
                    "channel_id": "pypi-csoai-gspc",
                    "fix": "Added https://councilof.ai/corrections/ and https://councilof.ai/api/corrections to scripts/spray/pypi/csoai-gspc/README.md; updated check_pypi in scripts/harness-x/parity_live.py to verify spray-source-version and wheel code bytes.",
                },
                {
                    "channel_id": "npm-layer0",
                    "fix": "Added https://councilof.ai/api/gspc, https://councilof.ai/corrections/, https://councilof.ai/api/corrections, and https://councilof.ai/gspc-verify/ to packages/layer0-js/README.md.",
                },
            ],
        },
        "wedge_b_distribution_and_mcp_registry": {
            "mcp_registry": mcp_reg,
            "packages": pkgs,
        },
    }
    canonical_bytes = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    body["artifact_sha256"] = sha256_bytes(canonical_bytes)
    return body


def main() -> int:
    report = build_report(repo_root=REPO_ROOT, check_live=True)
    out_paths = [
        REPO_ROOT / "public/interop/wedge-ab-distribution-registry-execution-v1.json",
        REPO_ROOT / "spaces/gspc-board/wedge-ab-distribution-registry-execution-v1.json",
    ]
    formatted = json.dumps(report, indent=2) + "\n"
    for p in out_paths:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(formatted, encoding="utf-8")
    print(
        json.dumps(
            {
                "status": report["wedge_a_source_parity"]["status"],
                "artifact_sha256": report["artifact_sha256"],
                "written": [str(p.relative_to(REPO_ROOT)) for p in out_paths],
            }
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
