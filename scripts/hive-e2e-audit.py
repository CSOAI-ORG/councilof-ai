#!/usr/bin/env python3
"""
Cross-hive E2E audit — partner, enterprise, end-user, industry personas.
Checks HTTP status, SaaS conversion paths, MCP endpoints, and key pages.
Author: JEEVES | Date: 2026-06-15
"""

import json
import re
import ssl
import urllib.request
from urllib.error import HTTPError, URLError
from datetime import datetime
from pathlib import Path

# Trust all certs for audit (some domains may have mixed/self-signed)
ssl_ctx = ssl.create_default_context()
ssl_ctx.check_hostname = False
ssl_ctx.verify_mode = ssl.CERT_NONE

HOME = Path.home()
CLAWD = HOME / "clawd"
OUT_DIR = CLAWD / "_findings"
OUT_DIR.mkdir(exist_ok=True)
OUT_JSON = OUT_DIR / f"HIVE_E2E_AUDIT_{datetime.now().strftime('%Y-%m-%d')}.json"
OUT_MD = OUT_DIR / f"HIVE_E2E_AUDIT_{datetime.now().strftime('%Y-%m-%d')}.md"

HIVES = {
    "Governance": [
        {"id": "meok", "domain": "meok.ai", "type": "consumer/sovereign OS"},
        {"id": "councilof", "domain": "councilof.ai", "type": "governance/BFT council"},
        {"id": "proofof", "domain": "proofof.ai", "type": "verification"},
        {"id": "csoai", "domain": "csoai.org", "type": "protocol institution"},
        {"id": "agisafe", "domain": "agisafe.ai", "type": "AGI safety/insurance"},
        {"id": "asisecurity", "domain": "asisecurity.ai", "type": "AI security/CISO"},
    ],
    "Construction": [
        {"id": "grabhire", "domain": "grabhire.ai", "type": "equipment rental"},
        {"id": "muckaway", "domain": "muckaway.ai", "type": "waste logistics"},
        {"id": "planthire", "domain": "planthire.ai", "type": "plant hire"},
    ],
    "Agriculture": [
        {"id": "fishkeeper", "domain": "fishkeeper.ai", "type": "aquaculture"},
        {"id": "koikeeper", "domain": "koikeeper.ai", "type": "koi pond"},
    ],
    "Compliance": [
        {"id": "safetyof", "domain": "safetyof.ai", "type": "AI safety"},
        {"id": "transparencyof", "domain": "transparencyof.ai", "type": "AI transparency"},
        {"id": "accountabilityof", "domain": "accountabilityof.ai", "type": "AI accountability"},
        {"id": "biasdetectionof", "domain": "biasdetectionof.ai", "type": "AI bias"},
        {"id": "dataprivacyof", "domain": "dataprivacyof.ai", "type": "data privacy"},
        {"id": "ethicalgovernanceof", "domain": "ethicalgovernanceof.ai", "type": "AI ethics"},
    ],
    "Productivity": [
        {"id": "loopfactory", "domain": "loopfactory.ai", "type": "automation marketplace"},
        {"id": "socialmediamanager", "domain": "socialmediamanager.ai", "type": "social media SaaS"},
        {"id": "optimobile", "domain": "optimobile.ai", "type": "fleet optimization"},
    ],
    "Verticals / Other": [
        {"id": "landlaw", "domain": "landlaw.ai", "type": "legal tech"},
        {"id": "diyhelp", "domain": "diyhelp.ai", "type": "DIY/home"},
        {"id": "pokerhud", "domain": "pokerhud.ai", "type": "poker analytics"},
        {"id": "cobolbridge", "domain": "cobolbridge.ai", "type": "COBOL modernization"},
        {"id": "suicidestop", "domain": "suicidestop.ai", "type": "mental health"},
        {"id": "commercialvehicle", "domain": "commercialvehicle.ai", "type": "fleet mgmt"},
        {"id": "openmoe", "domain": "openmoe.ai", "type": "open-source MoE"},
    ],
}

KEY_PATHS = ["/", "/pricing", "/signup", "/contact", "/demo", "/checkout", "/api/health", "/llms.txt"]
PERSONA_JOURNEYS = {
    "end_user": ["/", "/pricing", "/signup"],
    "enterprise": ["/", "/enterprise", "/contact", "/demo"],
    "partner": ["/partner", "/partners", "/contact"],
    "industry": ["/", "/industry", "/solutions"],
}


def fetch(url, timeout=15):
    try:
        req = urllib.request.Request(url, method="GET", headers={
            "User-Agent": "MEOK-HiveAudit/1.0 (e2e-check)"
        })
        with urllib.request.urlopen(req, timeout=timeout, context=ssl_ctx) as r:
            body = r.read(4096).decode("utf-8", errors="ignore")
            return r.status, r.geturl(), body
    except HTTPError as e:
        return e.code, url, ""
    except URLError as e:
        return 0, url, str(e)
    except Exception as e:
        return -1, url, str(e)


def extract_signals(body):
    signals = {
        "has_pricing": bool(re.search(r"pricing|price|plans|subscribe|buy", body, re.I)),
        "has_signup": bool(re.search(r"signup|sign up|get started|create account|register", body, re.I)),
        "has_contact": bool(re.search(r"contact|email us|hello@|sales@", body, re.I)),
        "has_demo": bool(re.search(r"demo|book a demo|request demo|see it live", body, re.I)),
        "has_stripe": bool(re.search(r"stripe|buy\.stripe\.com", body, re.I)),
        "has_clerk": bool(re.search(r"clerk|clerk\.", body, re.I)),
        "has_mcp": bool(re.search(r"mcp|model context protocol", body, re.I)),
        "has_llms_txt_link": bool(re.search(r'llms\.txt', body, re.I)),
        "has_blog": bool(re.search(r"blog|articles|news", body, re.I)),
        "title": "",
    }
    m = re.search(r"<title[^>]*>(.*?)</title>", body, re.I | re.S)
    if m:
        signals["title"] = m.group(1).strip()[:100]
    return signals


def audit_domain(domain):
    base = f"https://{domain}"
    result = {
        "domain": domain,
        "base_url": base,
        "paths": {},
        "signals": {},
        "persona_journeys": {},
        "mcp_endpoint": None,
    }

    # Base path
    status, final_url, body = fetch(base)
    result["status"] = status
    result["final_url"] = final_url
    result["signals"] = extract_signals(body)
    result["paths"]["/"] = {"status": status, "final_url": final_url}

    # Key paths
    for path in KEY_PATHS:
        if path == "/":
            continue
        url = f"{base}{path}"
        s, f, b = fetch(url)
        result["paths"][path] = {"status": s, "final_url": f}

    # Persona journeys
    for persona, paths in PERSONA_JOURNEYS.items():
        journey = []
        for path in paths:
            url = f"{base}{path}"
            s, f, b = fetch(url)
            journey.append({"path": path, "status": s, "final_url": f})
        result["persona_journeys"][persona] = journey

    # MCP endpoint probe
    mcp_url = f"{base}/mcp"
    s, f, b = fetch(mcp_url, timeout=10)
    result["mcp_endpoint"] = {"url": mcp_url, "status": s, "final_url": f}

    return result


def score_hive(results):
    """Score a hive based on its domain results."""
    if not results:
        return 0
    total = 0
    live = sum(1 for r in results if r["status"] in (200, 307, 308))
    with_pricing = sum(1 for r in results if r["signals"]["has_pricing"])
    with_signup = sum(1 for r in results if r["signals"]["has_signup"])
    with_contact = sum(1 for r in results if r["signals"]["has_contact"])
    with_stripe = sum(1 for r in results if r["signals"]["has_stripe"])
    n = len(results)
    total += (live / n) * 40
    total += (with_pricing / n) * 15
    total += (with_signup / n) * 15
    total += (with_contact / n) * 10
    total += (with_stripe / n) * 10
    # bonus for mcp endpoint 200
    mcp_live = sum(1 for r in results if r["mcp_endpoint"]["status"] in (200, 405))
    total += (mcp_live / n) * 10
    return round(total, 1)


def main():
    report = {
        "generated_at": datetime.now().isoformat(),
        "hives": {},
        "summary": {
            "total_domains": 0,
            "live_domains": 0,
            "dead_domains": 0,
            "avg_score": 0,
        },
    }

    all_scores = []
    all_domains = []

    for hive_name, domains in HIVES.items():
        print(f"\n🐝 Auditing {hive_name}...")
        hive_results = []
        for d in domains:
            print(f"  → {d['domain']}")
            res = audit_domain(d["domain"])
            res["type"] = d["type"]
            res["id"] = d["id"]
            hive_results.append(res)
            all_domains.append(res)
        report["hives"][hive_name] = {
            "domains": hive_results,
            "score": score_hive(hive_results),
        }
        all_scores.append(report["hives"][hive_name]["score"])

    live = sum(1 for r in all_domains if r["status"] in (200, 307, 308))
    dead = len(all_domains) - live
    report["summary"]["total_domains"] = len(all_domains)
    report["summary"]["live_domains"] = live
    report["summary"]["dead_domains"] = dead
    report["summary"]["avg_score"] = round(sum(all_scores) / len(all_scores), 1) if all_scores else 0

    # JSON output
    with open(OUT_JSON, "w") as f:
        json.dump(report, f, indent=2)

    # Markdown output
    md = f"""# 🐝 Cross-Hive E2E Audit Report
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S %Z')}  
**By:** `hive-e2e-audit.py`  
**Scope:** All .ai hives — partner, enterprise, end-user, and industry personas.

---

## 📊 Executive Summary

| Metric | Value |
|---|---|
| Total domains audited | {report['summary']['total_domains']} |
| Live (200/307/308) | {report['summary']['live_domains']} |
| Dead | {report['summary']['dead_domains']} |
| Average hive score | {report['summary']['avg_score']}/100 |

---

## 🏆 Hive Scoreboard

| Hive | Score | Live/Total |
|---|---|---|
"""
    for hive_name, data in sorted(report["hives"].items(), key=lambda x: -x[1]["score"]):
        live_count = sum(1 for r in data["domains"] if r["status"] in (200, 307, 308))
        md += f"| {hive_name} | {data['score']}/100 | {live_count}/{len(data['domains'])} |\n"

    md += "\n---\n\n## 🔍 Per-Hive Findings\n\n"
    for hive_name, data in report["hives"].items():
        md += f"### {hive_name} (score: {data['score']}/100)\n\n"
        md += "| Domain | Status | Title | Pricing | Signup | Contact | Demo | Stripe | MCP | Notes |\n"
        md += "|---|---|---|---|---|---|---|---|---|---|\n"
        for r in data["domains"]:
            sig = r["signals"]
            status_emoji = "✅" if r["status"] in (200, 307, 308) else "❌"
            notes = []
            if r["status"] == 0:
                notes.append("DNS/connection failure")
            elif r["status"] >= 500:
                notes.append(f"Server error {r['status']}")
            # persona gaps
            end_user_ok = all(p["status"] in (200, 307, 308) for p in r["persona_journeys"].get("end_user", []))
            enterprise_ok = any(p["status"] in (200, 307, 308) for p in r["persona_journeys"].get("enterprise", []))
            partner_ok = any(p["status"] in (200, 307, 308) for p in r["persona_journeys"].get("partner", []))
            if not end_user_ok:
                notes.append("end-user journey broken")
            if not enterprise_ok:
                notes.append("no enterprise page")
            if not partner_ok:
                notes.append("no partner page")
            note_str = "; ".join(notes) if notes else "—"
            md += f"| {r['domain']} | {status_emoji} {r['status']} | {sig['title']} | {'✅' if sig['has_pricing'] else '❌'} | {'✅' if sig['has_signup'] else '❌'} | {'✅' if sig['has_contact'] else '❌'} | {'✅' if sig['has_demo'] else '❌'} | {'✅' if sig['has_stripe'] else '❌'} | {'✅' if r['mcp_endpoint']['status'] in (200, 405) else '❌'} | {note_str} |\n"
        md += "\n"

    md += """---

## 🚀 Cross-Cutting Enhancement Recommendations

### For every live domain
1. Add `/partner` and `/enterprise` pages if missing — these are high-intent conversion paths.
2. Ensure `/pricing` exists and links to a Stripe checkout or signup flow.
3. Add `<link rel="llms-txt" href="/llms.txt">` in `<head>` for LLM discoverability.
4. Surface MCP endpoint in footer/header with a "Connect via MCP" CTA.
5. Add industry-specific landing pages (`/industry/finance`, `/industry/legal`, etc.).

### For dead domains
1. Either deploy a static landing page or redirect to the main meok.ai hub.
2. If the domain is unpurchased, add to Namecheap buy-list or drop from portfolio.

### For SaaS conversion
1. Unify signup flow through Clerk/meok.ai central auth.
2. Add a common `/checkout` path across all products.
3. Add UTM parameters and conversion tracking on all outbound links.

---

*Raw JSON: """ + str(OUT_JSON) + """*
"""

    with open(OUT_MD, "w") as f:
        f.write(md)

    print(f"\n✅ Audit complete.")
    print(f"JSON: {OUT_JSON}")
    print(f"Markdown: {OUT_MD}")
    print(f"Avg score: {report['summary']['avg_score']}/100")


if __name__ == "__main__":
    main()
