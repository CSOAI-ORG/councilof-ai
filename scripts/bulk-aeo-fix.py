#!/usr/bin/env python3
"""Bulk AEO/GEO/SEO discovery-file generator for all *-deploy/ directories.

Reads each index.html, extracts title/description/canonical/internal links, then
writes missing llms.txt, robots.txt and sitemap.xml files. Safe and idempotent:
never overwrites existing files.
"""
import os
import re
import html
import json
from pathlib import Path
from xml.sax.saxutils import escape

BASE = Path("/Users/nicholas/clawd")
REPORT = BASE / "_findings" / "BULK_AEO_FIX_2026-06-15.md"
DEFAULT_DOMAIN = "meok.ai"
CONTACT = """## Contact
- https://meok.ai
- https://csoai.org
- CSOAI Ltd, UK company 16939677
"""


def extract_meta(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="ignore")
    out = {"text": text}
    title = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
    out["title"] = html.unescape(title.group(1).strip()) if title else path.parent.name.replace("-deploy", "").replace("-", " ").title()
    desc = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', text, re.I)
    if not desc:
        desc = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']', text, re.I)
    out["description"] = html.unescape(desc.group(1).strip()) if desc else f"{out['title']} — MEOK AI Labs"
    canonical = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)["\']', text, re.I)
    if not canonical:
        canonical = re.search(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']canonical["\']', text, re.I)
    out["canonical"] = canonical.group(1).strip() if canonical else ""
    # Internal links (href starting with / or same domain)
    links = set()
    for m in re.finditer(r'href=["\']([^"\']+)["\']', text, re.I):
        href = m.group(1).strip()
        if href.startswith("http://www.w3.org") or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        if href.startswith("/"):
            links.add(href)
        elif href.startswith("https://meok.ai") or href.startswith("https://proofof.ai") or href.startswith("https://csoai.org"):
            links.add(href)
    out["links"] = sorted(links)
    return out


def derive_base_url(dir_name: str, canonical: str) -> tuple[str, str]:
    """Return (base_url, path_prefix)."""
    if canonical:
        if canonical.startswith("http://"):
            canonical = canonical.replace("http://", "https://", 1)
        if "/" in canonical[8:]:
            base = canonical
        else:
            base = canonical.rstrip("/") + "/"
        return base, ""
    # Fallback: derive from deploy directory name.
    slug = dir_name.replace("-deploy", "")
    # Common subpath mapping for meok.ai verticals
    subpath_map = {
        "about": "https://meok.ai/about",
        "careers": "https://meok.ai/careers",
        "case-studies": "https://meok.ai/case-studies",
        "compare": "https://meok.ai/compare",
        "customers": "https://meok.ai/customers",
        "free-trial": "https://meok.ai/free-trial",
        "help": "https://meok.ai/help",
        "meme": "https://meok.ai/memes",
        "partners-page": "https://meok.ai/partners",
        "pricing": "https://meok.ai/pricing",
        "privacy": "https://meok.ai/privacy",
        "roadmap": "https://meok.ai/roadmap",
        "security": "https://meok.ai/security",
        "terms": "https://meok.ai/terms",
    }
    if slug in subpath_map:
        return subpath_map[slug], ""
    return f"https://{slug}-deploy.vercel.app", ""


def write_llms(path: Path, meta: dict, base: str) -> bool:
    if path.exists():
        return False
    pages = "\n".join(f"- {l}" for l in meta["links"] if l != "/") or "- /"
    content = f"""# {meta['title']}

> {meta['description']}

## Overview
{meta['title']} is part of the MEOK AI Labs sovereign compliance and attestation platform.

## Pages
{pages}

{CONTACT}
"""
    path.write_text(content, encoding="utf-8")
    return True


def write_robots(path: Path, base: str) -> bool:
    if path.exists():
        return False
    sitemap_url = base.rstrip("/") + "/sitemap.xml"
    path.write_text(f"User-agent: *\nDisallow:\nSitemap: {sitemap_url}\n", encoding="utf-8")
    return True


def write_sitemap(path: Path, meta: dict, base: str) -> bool:
    if path.exists():
        return False
    urls = [base.rstrip("/") + "/"]
    for link in meta["links"]:
        if link.startswith("/"):
            urls.append(base.rstrip("/") + link)
    entries = []
    for url in urls:
        entries.append(f"  <url>\n    <loc>{escape(url)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>")
    xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{chr(10).join(entries)}
</urlset>
"""
    path.write_text(xml, encoding="utf-8")
    return True


def write_openapi(path: Path, meta: dict, base: str) -> bool:
    if path.exists():
        return False
    api = {
        "openapi": "3.0.0",
        "info": {
            "title": meta["title"],
            "version": "1.0.0",
            "description": meta["description"],
            "contact": {"url": "https://meok.ai"},
        },
        "servers": [{"url": base.rstrip("/")}],
        "paths": {
            "/": {
                "get": {
                    "summary": "Landing page",
                    "responses": {"200": {"description": "HTML landing page"}}
                }
            },
            "/llms.txt": {
                "get": {
                    "summary": "LLM discovery file",
                    "responses": {"200": {"description": "text/plain LLM context"}}
                }
            },
            "/robots.txt": {
                "get": {
                    "summary": "Robots discovery file",
                    "responses": {"200": {"description": "text/plain robots rules"}}
                }
            },
            "/sitemap.xml": {
                "get": {
                    "summary": "Sitemap",
                    "responses": {"200": {"description": "application/xml sitemap"}}
                }
            },
        },
    }
    path.write_text(json.dumps(api, indent=2), encoding="utf-8")
    return True

def ensure_meta(index: Path, meta: dict) -> bool:
    text = index.read_text(encoding="utf-8", errors="ignore")
    if re.search(r'<meta[^>]+name=["\']description["\']', text, re.I):
        return False
    desc = html.escape(meta.get("description", meta["title"]))[:160]
    tag = f'<meta name="description" content="{desc}">\n'
    # Insert after </title> if present, else after <head>
    m = re.search(r'(</title>)', text, re.I)
    if m:
        pos = m.end()
    else:
        m = re.search(r'(<head[^>]*>)', text, re.I)
        pos = m.end() if m else 0
    new_text = text[:pos] + "\n" + tag + text[pos:]
    index.write_text(new_text, encoding="utf-8")
    return True


def main():
    findings = []
    total_dirs = 0
    generated = {"llms.txt": 0, "robots.txt": 0, "sitemap.xml": 0, "openapi.json": 0}
    for deploy_dir in sorted(BASE.glob("*-deploy")):
        if not deploy_dir.is_dir():
            continue
        total_dirs += 1
        index = deploy_dir / "index.html"
        if not index.exists():
            findings.append((deploy_dir.name, "skipped", "no index.html"))
            continue
        meta = extract_meta(index)
        base, _ = derive_base_url(deploy_dir.name, meta.get("canonical", ""))
        changes = []
        if write_llms(deploy_dir / "llms.txt", meta, base):
            generated["llms.txt"] += 1
            changes.append("llms.txt")
        if write_robots(deploy_dir / "robots.txt", base):
            generated["robots.txt"] += 1
            changes.append("robots.txt")
        if write_sitemap(deploy_dir / "sitemap.xml", meta, base):
            generated["sitemap.xml"] += 1
            changes.append("sitemap.xml")
        if write_openapi(deploy_dir / "openapi.json", meta, base):
            generated["openapi.json"] += 1
            changes.append("openapi.json")
        if ensure_meta(index, meta):
            changes.append("meta-description")
        if changes:
            findings.append((deploy_dir.name, "generated", ", ".join(changes) + f" (base={base})"))
        else:
            findings.append((deploy_dir.name, "ok", "all AEO files present"))

    report = f"""# Bulk AEO/GEO/SEO Fix Report — 2026-06-15

- Deploy directories scanned: {total_dirs}
- `llms.txt` generated: {generated['llms.txt']}
- `robots.txt` generated: {generated['robots.txt']}
- `sitemap.xml` generated: {generated['sitemap.xml']}
- `openapi.json` generated: {generated['openapi.json']}

## Per-directory actions

| Directory | Status | Detail |
|---|---|---|
"""
    for name, status, detail in findings:
        report += f"| {name} | {status} | {detail} |\n"
    report += "\n---\n*Generated by clawd/scripts/bulk-aeo-fix.py*\n"
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(report, encoding="utf-8")
    print(f"Scanned {total_dirs} deploy directories.")
    print(f"Generated: {generated}")
    print(f"Report: {REPORT}")


if __name__ == "__main__":
    main()
