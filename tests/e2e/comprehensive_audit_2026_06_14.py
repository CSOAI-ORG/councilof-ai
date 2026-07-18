#!/usr/bin/env python3
"""
Comprehensive MEOK/CSOAI Ecosystem Audit — 2026-06-14
Checks: domains, security headers, SEO, AEO/GEO, content, Stripe, local services.
"""
import asyncio
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx

DOMAINS = [
    # Core
    "meok.ai", "www.meok.ai",
    "csoai.org", "www.csoai.org",
    "councilof.ai", "www.councilof.ai",
    "cobolbridge.ai", "www.cobolbridge.ai",
    "proofof.ai", "www.proofof.ai",
    # Governance verticals
    "dataprivacyof.ai", "www.dataprivacyof.ai",
    "accountabilityof.ai", "www.accountabilityof.ai",
    "ethicalgovernanceof.ai", "www.ethicalgovernanceof.ai",
    "safetyof.ai", "www.safetyof.ai",
    # Satellite
    "eu-ai-act.com", "www.eu-ai-act.com",
    "openmoe.ai", "www.openmoe.ai",
    "optimobile.ai", "www.optimobile.ai",
    "fishkeeper.ai", "www.fishkeeper.ai",
    "koikeeper.ai", "www.koikeeper.ai",
    "diyhelp.ai", "www.diyhelp.ai",
    "pokerhud.ai", "www.pokerhud.ai",
    "sov3.ai", "www.sov3.ai",
    "industrial-hire.ai", "www.industrial-hire.ai",
    "wowmcp.ai", "www.wowmcp.ai",
    # Other
    "templeman-opticians.com", "www.templeman-opticians.com",
]

KEY_ROUTES = [
    "/",
    "/pricing",
    "/fine-calculator",
    "/scorecard",
    "/eu-ai-act",
    "/labs/mcp",
    "/checkout",
    "/thanks",
]

STRIPE_LINKS = [
    "https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K",
    "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t",
    "https://buy.stripe.com/14AfZjfsM6oq7oh2Yg8k90P",
    "https://buy.stripe.com/28E8wR2G0dQS5g92Yg8k91n",
    "https://buy.stripe.com/4gM9AV80kcMO23X0Q88k91o",
]


class Auditor:
    def __init__(self):
        self.results: List[Dict[str, Any]] = []

    def log(self, category: str, item: str, status: str, detail: str = ""):
        self.results.append({
            "category": category,
            "item": item,
            "status": status,
            "detail": detail,
            "time": datetime.now(timezone.utc).isoformat(),
        })


async def check_domain(client: httpx.AsyncClient, domain: str) -> Dict[str, Any]:
    url = f"https://{domain}"
    try:
        resp = await client.get(url, follow_redirects=True, timeout=15.0)
        return {
            "domain": domain,
            "url": url,
            "status": resp.status_code,
            "final_url": str(resp.url),
            "server": resp.headers.get("server", ""),
            "content_type": resp.headers.get("content-type", ""),
            "ok": resp.status_code < 400,
        }
    except httpx.ConnectTimeout:
        return {"domain": domain, "url": url, "status": 0, "error": "timeout", "ok": False}
    except Exception as e:
        return {"domain": domain, "url": url, "status": 0, "error": type(e).__name__, "ok": False}


async def check_security_headers(client: httpx.AsyncClient, domain: str) -> Dict[str, Any]:
    url = f"https://{domain}"
    try:
        resp = await client.get(url, follow_redirects=True, timeout=15.0)
        h = resp.headers
        return {
            "domain": domain,
            "status": resp.status_code,
            "strict_transport_security": "strict-transport-security" in h,
            "content_security_policy": "content-security-policy" in h,
            "x_frame_options": "x-frame-options" in h,
            "x_content_type_options": "x-content-type-options" in h,
            "referrer_policy": "referrer-policy" in h,
            "permissions_policy": "permissions-policy" in h,
        }
    except Exception as e:
        return {"domain": domain, "error": type(e).__name__}


async def check_page_meta(client: httpx.AsyncClient, url: str) -> Dict[str, Any]:
    try:
        resp = await client.get(url, follow_redirects=True, timeout=15.0)
        text = resp.text
        title_match = re.search(r"<title>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
        desc_match = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)', text, re.IGNORECASE)
        og_title = re.search(r'<meta[^>]+property=["\']og:title["\'][^>]+content=["\']([^"\']+)', text, re.IGNORECASE)
        og_desc = re.search(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\']([^"\']+)', text, re.IGNORECASE)
        canonical = re.search(r'<link[^>]+rel=["\']canonical["\'][^>]+href=["\']([^"\']+)', text, re.IGNORECASE)
        json_ld = re.search(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', text, re.IGNORECASE | re.DOTALL)
        return {
            "url": url,
            "status": resp.status_code,
            "title": title_match.group(1).strip() if title_match else None,
            "description": desc_match.group(1).strip() if desc_match else None,
            "og_title": og_title.group(1).strip() if og_title else None,
            "og_description": og_desc.group(1).strip() if og_desc else None,
            "canonical": canonical.group(1).strip() if canonical else None,
            "json_ld": bool(json_ld),
        }
    except Exception as e:
        return {"url": url, "error": type(e).__name__}


async def check_aeo_geo(client: httpx.AsyncClient, domain: str) -> Dict[str, Any]:
    base = f"https://{domain}"
    checks = {}
    for path in ["/llms.txt", "/.well-known/mcp-server", "/robots.txt", "/sitemap.xml"]:
        try:
            resp = await client.get(base + path, follow_redirects=True, timeout=10.0)
            checks[path] = {"status": resp.status_code, "ok": resp.status_code < 400, "size": len(resp.text)}
        except Exception as e:
            checks[path] = {"status": 0, "ok": False, "error": type(e).__name__}
    return {"domain": domain, **checks}


async def check_stripe(client: httpx.AsyncClient, url: str) -> Dict[str, Any]:
    try:
        resp = await client.get(url, follow_redirects=True, timeout=10.0)
        return {"url": url, "status": resp.status_code, "ok": resp.status_code < 400}
    except Exception as e:
        return {"url": url, "status": 0, "ok": False, "error": type(e).__name__}


async def check_local_service(port: int, path: str = "/") -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"http://localhost:{port}{path}", timeout=5.0)
            return {"port": port, "path": path, "status": resp.status_code, "ok": resp.status_code < 500}
    except Exception as e:
        return {"port": port, "path": path, "status": 0, "ok": False, "error": type(e).__name__}


async def main():
    print("🔍 Comprehensive MEOK Ecosystem Audit")
    print("=" * 60)
    auditor = Auditor()

    async with httpx.AsyncClient() as client:
        # Domains
        domain_results = await asyncio.gather(*[check_domain(client, d) for d in DOMAINS])
        ok = sum(1 for r in domain_results if r["ok"])
        auditor.log("domains", "all domains", "info", f"{ok}/{len(domain_results)} domains OK")
        print(f"\n📡 Domains: {ok}/{len(domain_results)} OK")
        for r in domain_results:
            icon = "✅" if r["ok"] else "❌"
            extra = f" -> {r.get('final_url', '')}" if r.get("final_url") and r["final_url"] != r["url"] else ""
            err = f" ({r.get('error', '')})" if "error" in r else ""
            print(f"  {icon} {r['domain']:35s} HTTP {r['status']}{extra}{err}")
            if r["ok"]:
                auditor.log("domains", r["domain"], "ok", f"HTTP {r['status']}")
            else:
                auditor.log("domains", r["domain"], "fail", f"HTTP {r['status']}{err}")

        # Security headers on live domains
        live_domains = [r["domain"] for r in domain_results if r["ok"]]
        sec_results = await asyncio.gather(*[check_security_headers(client, d) for d in live_domains])
        print(f"\n🔒 Security Headers ({len(live_domains)} live domains)")
        for r in sec_results:
            if "error" in r:
                print(f"  ❌ {r['domain']}: {r['error']}")
                auditor.log("security", r["domain"], "fail", r["error"])
                continue
            missing = [k for k, v in r.items() if k != "domain" and k != "status" and not v]
            icon = "✅" if not missing else "⚠️"
            print(f"  {icon} {r['domain']:35s} missing: {', '.join(missing) if missing else 'none'}")
            auditor.log("security", r["domain"], "ok" if not missing else "warn", f"missing {missing}")

        # SEO/AEO/GEO on live domains
        print(f"\n🌐 AEO/GEO Discovery ({len(live_domains)} live domains)")
        aeo_results = await asyncio.gather(*[check_aeo_geo(client, d) for d in live_domains])
        for r in aeo_results:
            paths = ["/llms.txt", "/.well-known/mcp-server", "/robots.txt", "/sitemap.xml"]
            ok_paths = [p for p in paths if r[p]["ok"]]
            missing = [p for p in paths if not r[p]["ok"]]
            icon = "✅" if len(ok_paths) == len(paths) else "⚠️" if ok_paths else "❌"
            print(f"  {icon} {r['domain']:35s} ok={ok_paths} missing={missing}")
            auditor.log("aeo_geo", r["domain"], "ok" if not missing else "warn", f"ok={ok_paths}, missing={missing}")

        # SEO meta on meok.ai key routes
        print(f"\n🔍 SEO Meta Tags (meok.ai key routes)")
        meta_urls = [f"https://www.meok.ai{path}" for path in KEY_ROUTES]
        meta_results = await asyncio.gather(*[check_page_meta(client, u) for u in meta_urls])
        for r in meta_results:
            if "error" in r:
                print(f"  ❌ {r['url']}: {r['error']}")
                auditor.log("seo", r["url"], "fail", r["error"])
                continue
            missing = []
            if not r["title"]:
                missing.append("title")
            if not r["description"]:
                missing.append("description")
            if not r["og_title"]:
                missing.append("og:title")
            if not r["og_description"]:
                missing.append("og:description")
            if not r["canonical"]:
                missing.append("canonical")
            icon = "✅" if not missing else "⚠️"
            print(f"  {icon} {r['url']:45s} missing: {', '.join(missing) if missing else 'none'}")
            auditor.log("seo", r["url"], "ok" if not missing else "warn", f"missing {missing}")

        # Stripe links
        print(f"\n💳 Stripe Links ({len(STRIPE_LINKS)} sampled)")
        stripe_results = await asyncio.gather(*[check_stripe(client, u) for u in STRIPE_LINKS])
        stripe_ok = sum(1 for r in stripe_results if r["ok"])
        for r in stripe_results:
            icon = "✅" if r["ok"] else "❌"
            err = f" ({r.get('error', '')})" if "error" in r else ""
            print(f"  {icon} {r['status']} {r['url']}{err}")
            auditor.log("stripe", r["url"], "ok" if r["ok"] else "fail", f"HTTP {r['status']}{err}")

    # Local services
    print(f"\n🖥️ Local Services")
    local_services = [
        (3101, "/mcp"),
        (3102, "/health"),
        (3200, "/"),
        (3000, "/"),
        (8888, "/"),
        (8644, "/health"),
    ]
    local_results = await asyncio.gather(*[check_local_service(port, path) for port, path in local_services])
    for r in local_results:
        icon = "✅" if r["ok"] else "❌"
        err = f" ({r.get('error', '')})" if "error" in r else ""
        print(f"  {icon} localhost:{r['port']}{r['path']} HTTP {r['status']}{err}")
        auditor.log("local", f"localhost:{r['port']}{r['path']}", "ok" if r["ok"] else "fail", f"HTTP {r['status']}{err}")

    # Save report
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "domains_ok": ok,
            "domains_total": len(DOMAINS),
            "stripe_ok": stripe_ok,
            "stripe_total": len(STRIPE_LINKS),
        },
        "domain_results": domain_results,
        "security_results": sec_results,
        "aeo_geo_results": aeo_results,
        "seo_results": meta_results,
        "stripe_results": stripe_results,
        "local_results": local_results,
        "audit_log": auditor.results,
    }
    report_path = Path("/Users/nicholas/clawd/tests/e2e/comprehensive_audit_report_2026_06_14.json")
    report_path.write_text(json.dumps(report, indent=2, default=str))
    print(f"\n📄 Report saved: {report_path}")


if __name__ == "__main__":
    asyncio.run(main())
