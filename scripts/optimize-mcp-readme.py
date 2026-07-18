#!/usr/bin/env python3
"""Standardize and optimize MCP package README.md files.

Usage:
    python3 scripts/optimize-mcp-readme.py --dir meok-ai-psych-vuln-audit-mcp
    python3 scripts/optimize-mcp-readme.py --all
"""
from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")

COMPLIANCE_LINKS = {
    "eu-ai-act": "https://csoai.org/article-50-kit",
    "dora": "https://meok.ai/dora",
    "nis2": "https://meok.ai/nis2",
    "gdpr": "https://meok.ai/gdpr",
    "iso-42001": "https://meok.ai/iso-42001",
    "cra": "https://meok.ai/cra",
}


def find_package_json(dir_path: Path) -> dict:
    for fname in ("package.json", "pyproject.toml"):
        fpath = dir_path / fname
        if fpath.exists():
            return {"type": "npm" if fname == "package.json" else "pypi", "file": fname}
    return {}


def extract_title(text: str) -> str:
    m = re.search(r"^#\s+(.+)$", text, re.MULTILINE)
    return m.group(1).strip() if m else "MEOK MCP Server"


def extract_first_paragraph(text: str) -> str:
    lines = text.splitlines()
    paras = []
    in_para = False
    for line in lines:
        s = line.strip()
        if not s:
            if in_para:
                break
            continue
        if s.startswith("#") or s.startswith("|") or s.startswith("```"):
            if in_para:
                break
            continue
        paras.append(s)
        in_para = True
    return " ".join(paras)


def extract_tools_table(text: str) -> str:
    m = re.search(r"##\s+Tools.*?(?=\n##|\Z)", text, re.DOTALL | re.IGNORECASE)
    return m.group(0).strip() if m else ""


def detect_keywords(text: str) -> list[str]:
    kw = []
    lowers = text.lower()
    if "eu ai act" in lowers or "article 50" in lowers:
        kw.append("EU AI Act")
    if "dora" in lowers:
        kw.append("DORA")
    if "nis2" in lowers:
        kw.append("NIS2")
    if "gdpr" in lowers:
        kw.append("GDPR")
    if "iso 42001" in lowers or "iso42001" in lowers:
        kw.append("ISO 42001")
    if "cra" in lowers and "cyber" in lowers:
        kw.append("CRA")
    return kw or ["AI Compliance"]


def build_readme(title: str, description: str, tools: str, pkg: dict, keywords: list[str], existing: str) -> str:
    pkg_name = title.lower().replace(" ", "-")
    install_block = ""
    if pkg.get("type") == "npm":
        install_block = f"""## Installation

```bash
npm install {pkg_name}
# or
npx {pkg_name}
```"""
    elif pkg.get("type") == "pypi":
        install_block = f"""## Installation

```bash
pip install {pkg_name}
```"""
    else:
        install_block = """## Installation

Add this MCP server to your Claude / Cursor / Kimi MCP config."""

    tools_section = tools or "## Tools\n\nSee source code for available tools and parameters."

    links = []
    for k in keywords:
        key = k.lower().replace(" ", "-")
        if key in COMPLIANCE_LINKS:
            links.append(f"- [{k}]({COMPLIANCE_LINKS[key]})")
    compliance_section = "\n".join(links) if links else "- [CSOAI Compliance Hub](https://csoai.org)"

    tags = ", ".join(f"#{k.replace(' ', '')}" for k in keywords)

    return f"""# {title}

{description}

[![CSOAI](https://img.shields.io/badge/Built%20by-CSOAI%20%7C%20MEOK%20AI%20Labs-blue)](https://meok.ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why this matters

{description}

{install_block}

{tools_section}

## Compliance mapping

{compliance_section}

## Verify attestations

When this MCP generates signed reports, they can be verified publicly at:
https://meok-attestation-api.vercel.app/verify

No login required.

## Learn more

- CSOAI: https://csoai.org
- MEOK AI Labs: https://meok.ai
- Layer 0 architecture: https://meok.ai/layer0

## License

MIT — Copyright (c) 2026 MEOK AI Labs / CSOAI Ltd.

---

*Keywords: {tags}*
"""


def optimize_dir(dir_path: Path, dry_run: bool = False) -> dict:
    readme = dir_path / "README.md"
    if not readme.exists():
        return {"dir": dir_path.name, "ok": False, "error": "no README.md"}

    text = readme.read_text(encoding="utf-8", errors="ignore")
    title = extract_title(text)
    description = extract_first_paragraph(text)
    tools = extract_tools_table(text)
    pkg = find_package_json(dir_path)
    keywords = detect_keywords(text)

    new_readme = build_readme(title, description, tools, pkg, keywords, text)

    if dry_run:
        return {"dir": dir_path.name, "ok": True, "action": "dry_run", "title": title, "keywords": keywords}

    backup = dir_path / "README.md.bak"
    shutil.copy2(readme, backup)
    readme.write_text(new_readme, encoding="utf-8")
    return {"dir": dir_path.name, "ok": True, "action": "optimized", "title": title, "keywords": keywords}


def discover_mcp_dirs() -> list[Path]:
    dirs = []
    for d in ROOT.iterdir():
        if d.is_dir() and "mcp" in d.name.lower():
            if (d / "README.md").exists() and not d.name.startswith("."):
                dirs.append(d)
    # Also check apify_actors subdirs
    apify = ROOT / "apify_actors"
    if apify.exists():
        for d in apify.iterdir():
            if d.is_dir() and "mcp" in d.name.lower() and (d / "README.md").exists():
                dirs.append(d)
    return sorted(dirs, key=lambda p: p.name)


def main():
    parser = argparse.ArgumentParser(description="Optimize MCP READMEs")
    parser.add_argument("--dir", type=str, help="Single directory name under clawd/")
    parser.add_argument("--all", action="store_true", help="Optimize all discovered MCP dirs")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change")
    parser.add_argument("--limit", type=int, default=0, help="Max dirs to process")
    args = parser.parse_args()

    if args.dir:
        dirs = [ROOT / args.dir]
    elif args.all:
        dirs = discover_mcp_dirs()
    else:
        print("Use --dir <name> or --all")
        sys.exit(1)

    if args.limit:
        dirs = dirs[: args.limit]

    results = []
    for d in dirs:
        res = optimize_dir(d, dry_run=args.dry_run)
        results.append(res)
        status = "✅" if res["ok"] else "❌"
        print(f"{status} {res['dir']}: {res.get('title', '')} {res.get('keywords', [])}")

    ok = sum(1 for r in results if r["ok"])
    print(f"\nDone — {ok}/{len(results)} directories processed")


if __name__ == "__main__":
    main()
