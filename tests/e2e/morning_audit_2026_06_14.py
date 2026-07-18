#!/usr/bin/env python3
"""
Morning E2E Audit — 2026-06-14
Checks live domain statuses and Stripe payment link health.
"""
import asyncio
import json
import re
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlparse
import httpx

DOMAINS = [
    # Core properties
    "meok.ai",
    "www.meok.ai",
    "csoai.org",
    "www.csoai.org",
    "councilof.ai",
    "www.councilof.ai",
    "cobolbridge.ai",
    "www.cobolbridge.ai",
    "proofof.ai",
    "www.proofof.ai",
    "dataprivacyof.ai",
    "www.dataprivacyof.ai",
    "accountabilityof.ai",
    "www.accountabilityof.ai",
    "ethicalgovernanceof.ai",
    "www.ethicalgovernanceof.ai",
    "safetyof.ai",
    "www.safetyof.ai",
    "eu-ai-act.com",
    "www.eu-ai-act.com",
    # Vertical / satellite
    "templeman-opticians.com",
    "www.templeman-opticians.com",
    "diyhelp.ai",
    "www.diyhelp.ai",
    "pokerhud.ai",
    "www.pokerhud.ai",
    "sov3.ai",
    "www.sov3.ai",
    "industrial-hire.ai",
    "www.industrial-hire.ai",
    "openmoe.ai",
    "www.openmoe.ai",
    "optimobile.ai",
    "www.optimobile.ai",
    "fishkeeper.ai",
    "www.fishkeeper.ai",
    "koikeeper.ai",
    "www.koikeeper.ai",
    "wowmcp.ai",
    "www.wowmcp.ai",
]

STRIPE_LINKS = [
    # Governance tiers (live from E2E audit 2026-05-21)
    "https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K",  # Starter £49
    "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t",  # Pro £79
    "https://buy.stripe.com/14AfZjfsM6oq7oh2Yg8k90P",  # Enterprise £1499
    # Consumer tiers
    "https://buy.stripe.com/28E8wR2G0dQS5g92Yg8k91n",  # Pro £9
    "https://buy.stripe.com/4gM9AV80kcMO23X0Q88k91o",  # Team £99
    # Product pages
    "https://buy.stripe.com/6oU8wR0xS6oq7oh42k8k82M",
    "https://buy.stripe.com/14AeVf3K46oq4c5aqI8k82L",
    "https://buy.stripe.com/eVq28t4O8dQS5g9fL28k82K",
    "https://buy.stripe.com/14A4gB3K4eUWgYR56o8k836",
    "https://buy.stripe.com/4gM9AV80kaEG0ZT42k8k837",
    "https://buy.stripe.com/8x2dRb94obIK8sl1Uc8k916",
    "https://buy.stripe.com/7sY5kF3K4cMObEx2Yg8k917",
    "https://buy.stripe.com/bJe4gB3K4002aAtgP68k91r",
    "https://buy.stripe.com/5kQ6nK0xS3ce8sl7ew8k91H",
    "https://buy.stripe.com/5kQ6nK0xS3ce8sl7ew8k91F",
    "https://buy.stripe.com/5kQ6nK0xS3ce8sl7ew8k91G",
    # One-time / lead magnets
    "https://buy.stripe.com/dRmcN75ScdQS7oh1Uc8k90U",
    "https://buy.stripe.com/00w28ta8saEGdMF7ew8k90Z",
    "https://buy.stripe.com/cNi00la8s1460ZT0Q88k90V",
    "https://buy.stripe.com/8x228ta8s6oqbExaqI8k90W",
    "https://buy.stripe.com/3cIfZj0xS4gicIB8iA8k912",
    "https://buy.stripe.com/6oUcN73K45kmfUNcyQ8k83Y",
    "https://buy.stripe.com/fZu14p4O8fZ06kd6as8k83V",
    "https://buy.stripe.com/8x2eVf1BW9ACaAt1Uc8k83T",
    "https://buy.stripe.com/3cI7sNfsMaEG5g9dCU8k83T",
    "https://buy.stripe.com/eVqfZj9P98mTcHXcw0eZ20A",
]


def report_path() -> Path:
    p = Path("/Users/nicholas/clawd/tests/e2e/morning_audit_report_2026_06_14.json")
    return p


async def check_domain(client: httpx.AsyncClient, domain: str) -> dict:
    url = f"https://{domain}"
    try:
        resp = await client.get(url, follow_redirects=True, timeout=15.0)
        return {
            "domain": domain,
            "url": url,
            "status": resp.status_code,
            "final_url": str(resp.url),
            "ok": resp.status_code < 400,
        }
    except httpx.ConnectTimeout:
        return {"domain": domain, "url": url, "status": 0, "error": "timeout", "ok": False}
    except Exception as e:
        return {"domain": domain, "url": url, "status": 0, "error": type(e).__name__, "ok": False}


async def check_stripe(client: httpx.AsyncClient, url: str) -> dict:
    try:
        resp = await client.get(url, follow_redirects=True, timeout=10.0)
        return {
            "url": url,
            "status": resp.status_code,
            "ok": resp.status_code < 400,
        }
    except Exception as e:
        return {"url": url, "status": 0, "error": type(e).__name__, "ok": False}


async def main():
    print("🔍 Morning E2E Audit — Domains + Stripe")
    print("=" * 60)
    async with httpx.AsyncClient() as client:
        domain_results = await asyncio.gather(*[check_domain(client, d) for d in DOMAINS])
        stripe_results = await asyncio.gather(*[check_stripe(client, u) for u in set(STRIPE_LINKS)])

    domain_ok = sum(1 for r in domain_results if r["ok"])
    stripe_ok = sum(1 for r in stripe_results if r["ok"])

    print(f"\n📡 Domains: {domain_ok}/{len(domain_results)} OK")
    for r in domain_results:
        icon = "✅" if r["ok"] else "❌"
        extra = f" -> {r.get('final_url', '')}" if r.get("final_url") and r["final_url"] != r["url"] else ""
        err = f" ({r.get('error', '')})" if "error" in r else ""
        print(f"  {icon} {r['domain']:35s} HTTP {r['status']}{extra}{err}")

    print(f"\n💳 Stripe links: {stripe_ok}/{len(stripe_results)} OK")
    for r in stripe_results:
        icon = "✅" if r["ok"] else "❌"
        err = f" ({r.get('error', '')})" if "error" in r else ""
        print(f"  {icon} {r['status']} {r['url']}{err}")

    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "domains": {"total": len(domain_results), "ok": domain_ok, "results": domain_results},
        "stripe": {"total": len(stripe_results), "ok": stripe_ok, "results": stripe_results},
    }
    report_path().write_text(json.dumps(report, indent=2, default=str))
    print(f"\n📄 Report saved: {report_path()}")


if __name__ == "__main__":
    asyncio.run(main())
