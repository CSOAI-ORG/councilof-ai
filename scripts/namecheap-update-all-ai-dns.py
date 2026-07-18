#!/usr/bin/env python3
"""
Update DNS for ALL .ai domains in Namecheap account to point to Vercel.
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


def get_all_domains():
    """Fetch all domains using pagination."""
    all_domains = {}
    page = 1
    while True:
        xml = api_call("namecheap.domains.getList", {"PageSize": 100, "Page": page})
        root = ET.fromstring(xml)
        domains = root.findall(".//{http://api.namecheap.com/xml.response}Domain")
        if not domains:
            break
        for domain in domains:
            name = domain.get("Name")
            all_domains[name.lower()] = {
                "id": domain.get("ID"),
                "is_our_dns": domain.get("IsOurDNS") == "true",
                "expires": domain.get("Expires"),
            }
        # Check if there's a next page
        paging = root.find(".//{http://api.namecheap.com/xml.response}Paging")
        if paging is None:
            break
        total = int(paging.get("TotalItems", 0))
        if len(all_domains) >= total:
            break
        page += 1
    return all_domains


def set_hosts(sld, tld):
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


def main():
    print("Fetching all Namecheap domains...")
    owned = get_all_domains()
    print(f"Found {len(owned)} total domains")

    ai_domains = {k: v for k, v in owned.items() if k.endswith(".ai")}
    print(f"Found {len(ai_domains)} .ai domains")

    results = {
        "updated": [],
        "failed": [],
        "not_namecheap_dns": [],
    }

    for domain in sorted(ai_domains.keys()):
        info = ai_domains[domain]
        print(f"\nProcessing {domain}...")

        if not info["is_our_dns"]:
            print(f"  ⚠️ not using Namecheap DNS")
            results["not_namecheap_dns"].append(domain)
            continue

        parts = domain.split(".")
        sld = parts[0]
        tld = ".".join(parts[1:])
        resp = set_hosts(sld, tld)
        if "<ApiResponse Status=\"OK\"" in resp:
            print(f"  ✅ DNS updated")
            results["updated"].append(domain)
        else:
            print(f"  ❌ failed: {resp[:200]}")
            results["failed"].append({"domain": domain, "response": resp[:500]})

    out_path = Path.home() / "clawd" / "_findings" / "NAMECHEAP_ALL_AI_DNS_2026-06-15.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\n✅ Results: {len(results['updated'])} updated, {len(results['failed'])} failed, {len(results['not_namecheap_dns'])} not Namecheap DNS")
    print(f"Saved: {out_path}")


if __name__ == "__main__":
    main()
