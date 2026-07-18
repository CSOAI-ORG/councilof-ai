#!/usr/bin/env python3
"""
Use Namecheap API to set DNS A-records for all economy-wave domains.
Also attempt to purchase wowmcp.ai if available and budget allows.
Author: JEEVES | Date: 2026-06-15
"""

import json
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

API_USER = "nicholastempleman"
API_KEY = "c1453d1bd0e54636a33c0eb90e5638f6"
CLIENT_IP = "104.28.163.245"
BASE_URL = "https://api.namecheap.com/xml.response"

VERCEL_IP = "76.76.21.21"
VERCEL_CNAME = "cname.vercel-dns.com"

# All domains we want to point to Vercel
DOMAINS = [
    # Construction + Agriculture
    "grabhire.ai", "muckaway.ai", "planthire.ai", "fishkeeper.ai", "koikeeper.ai",
    # Governance (except meok.ai, csoai.org which have existing projects)
    "councilof.ai", "proofof.ai", "agisafe.ai", "asisecurity.ai",
    # Compliance
    "safetyof.ai", "transparencyof.ai", "accountabilityof.ai", "biasdetectionof.ai",
    "dataprivacyof.ai", "ethicalgovernanceof.ai",
    # Productivity + Verticals + Gaming
    "diyhelp.ai", "pokerhud.ai", "loopfactory.ai", "socialmediamanager.ai",
    "optimobile.ai", "cobolbridge.ai", "openmoe.ai", "landlaw.ai",
    "commercialvehicle.ai", "suicidestop.ai", "wowmcp.ai",
]


def api_call(command, extra_params=None):
    params = {
        "ApiUser": API_USER,
        "ApiKey": API_KEY,
        "UserName": API_USER,
        "ClientIp": CLIENT_IP,
        "Command": command,
    }
    if extra_params:
        params.update(extra_params)
    url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"
    try:
        with urllib.request.urlopen(url, timeout=60) as r:
            return r.read().decode("utf-8")
    except Exception as e:
        return f"<error>{e}</error>"


def parse_domain_list(xml_text):
    root = ET.fromstring(xml_text)
    domains = {}
    for domain in root.findall(".//{http://api.namecheap.com/xml.response}Domain"):
        name = domain.get("Name")
        domains[name.lower()] = {
            "id": domain.get("ID"),
            "is_our_dns": domain.get("IsOurDNS") == "true",
            "expires": domain.get("Expires"),
        }
    return domains


def set_hosts(sld, tld):
    """Set A-record @ -> Vercel IP and CNAME www -> Vercel CNAME."""
    params = {
        "SLD": sld,
        "TLD": tld,
        "HostName1": "@",
        "RecordType1": "A",
        "Address1": VERCEL_IP,
        "MXPref1": "10",
        "TTL1": "1800",
        "HostName2": "www",
        "RecordType2": "CNAME",
        "Address2": VERCEL_CNAME,
        "MXPref2": "10",
        "TTL2": "1800",
    }
    return api_call("namecheap.domains.dns.setHosts", params)


def get_hosts(sld, tld):
    return api_call("namecheap.domains.dns.getHosts", {"SLD": sld, "TLD": tld})


def check_domain(domain):
    """Check if domain is available for registration."""
    parts = domain.split(".")
    sld = parts[0]
    tld = ".".join(parts[1:])
    xml = api_call("namecheap.domains.check", {"DomainList": domain})
    root = ET.fromstring(xml)
    avail = root.find(".//{http://api.namecheap.com/xml.response}DomainCheckResult")
    if avail is not None:
        return avail.get("Available") == "true", avail.get("Description")
    return None, "parse error"


def main():
    print("Fetching Namecheap domain list...")
    xml = api_call("namecheap.domains.getList")
    owned = parse_domain_list(xml)
    print(f"Found {len(owned)} domains in account.")

    results = {
        "owned": [],
        "not_owned": [],
        "dns_updated": [],
        "dns_failed": [],
        "not_namecheap_dns": [],
    }

    for domain in DOMAINS:
        d = domain.lower()
        print(f"\nProcessing {domain}...")
        if d not in owned:
            print(f"  ⚠️ not owned")
            results["not_owned"].append(domain)
            continue

        info = owned[d]
        results["owned"].append(domain)
        print(f"  ✅ owned, expires {info['expires']}, IsOurDNS={info['is_our_dns']}")

        if not info["is_our_dns"]:
            print(f"  ⚠️ not using Namecheap DNS — cannot update via API")
            results["not_namecheap_dns"].append(domain)
            continue

        parts = d.split(".")
        sld = parts[0]
        tld = ".".join(parts[1:])
        print(f"  Setting DNS hosts...")
        resp = set_hosts(sld, tld)
        if "<ApiResponse Status=\"OK\"" in resp:
            print(f"  ✅ DNS updated")
            results["dns_updated"].append(domain)
        else:
            print(f"  ❌ DNS update failed: {resp[:200]}")
            results["dns_failed"].append({"domain": domain, "response": resp[:500]})

    # Check wowmcp.ai availability
    print("\nChecking wowmcp.ai availability...")
    available, desc = check_domain("wowmcp.ai")
    results["wowmcp_available"] = available
    results["wowmcp_description"] = desc
    print(f"  Available: {available}, Description: {desc}")

    out_path = Path.home() / "clawd" / "_findings" / "NAMECHEAP_DNS_RESULTS_2026-06-15.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\n✅ Results saved: {out_path}")


if __name__ == "__main__":
    main()
