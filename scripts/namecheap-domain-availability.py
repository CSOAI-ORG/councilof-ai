#!/usr/bin/env python3
"""
Check availability of all economy-wave domains not currently owned.
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

DOMAINS = [
    "grabhire.ai", "muckaway.ai", "planthire.ai", "fishkeeper.ai", "koikeeper.ai",
    "proofof.ai", "safetyof.ai", "transparencyof.ai", "dataprivacyof.ai", "ethicalgovernanceof.ai",
    "diyhelp.ai", "pokerhud.ai", "loopfactory.ai", "socialmediamanager.ai",
    "optimobile.ai", "openmoe.ai", "landlaw.ai", "suicidestop.ai", "wowmcp.ai",
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


def check_domain(domain):
    xml = api_call("namecheap.domains.check", {"DomainList": domain})
    try:
        root = ET.fromstring(xml)
        avail = root.find(".//{http://api.namecheap.com/xml.response}DomainCheckResult")
        if avail is not None:
            return {
                "available": avail.get("Available") == "true",
                "description": avail.get("Description"),
                "price": avail.get("Price"),
                "currency": avail.get("Currency"),
                "is_premium": avail.get("IsPremiumName") == "true",
            }
    except Exception as e:
        return {"error": str(e), "raw": xml[:200]}
    return {"error": "parse error"}


def main():
    results = []
    for domain in DOMAINS:
        print(f"Checking {domain}...")
        info = check_domain(domain)
        info["domain"] = domain
        results.append(info)
        print(f"  {info}")

    out_path = Path.home() / "clawd" / "_findings" / "NAMECHEAP_AVAILABILITY_2026-06-15.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\n✅ Results saved: {out_path}")


if __name__ == "__main__":
    main()
