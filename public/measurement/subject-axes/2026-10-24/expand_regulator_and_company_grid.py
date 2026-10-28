#!/usr/bin/env python3
"""Expanded discovery grids for regulator-transparency (with n>=30 safety margin)
and company-practice (open GSPC slot #4 in csoai_console.py).

Preserves the original discovery_grid.py (sha256 6baad383eb97b098...) untouched.
"""
import concurrent.futures as cf
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.request

from discovery_grid import REGS, TERMS, probe

EXTRA_REGS = [
    ("CNIL (France)", "https://www.cnil.fr/en/artificial-intelligence"),
    ("BfDI (Germany)", "https://www.bfdi.bund.de/EN/Home/home_node.html"),
    ("AEPD (Spain)", "https://www.aepd.es/en"),
    ("Garante Privacy (Italy)", "https://www.garanteprivacy.it/home_en"),
    ("IMDA (Singapore)", "https://www.imda.gov.sg/"),
    ("PDPC (Singapore)", "https://www.pdpc.gov.sg/"),
    ("OPC (Canada)", "https://www.priv.gc.ca/en/"),
    ("OAIC (Australia)", "https://www.oaic.gov.au/"),
    ("PPC (Japan)", "https://www.ppc.go.jp/en/"),
    ("AISI Japan", "https://aisi.go.jp/"),
]

COMPANIES = [
    ("Microsoft", "https://www.microsoft.com/en-us/ai/responsible-ai"),
    ("Alphabet / Google", "https://ai.google/responsibility/"),
    ("Amazon / AWS", "https://aws.amazon.com/ai/responsible-ai/"),
    ("Apple", "https://www.apple.com/privacy/"),
    ("Meta", "https://about.fb.com/regulations/"),
    ("NVIDIA", "https://www.nvidia.com/en-us/trustworthy-ai/"),
    ("IBM", "https://www.ibm.com/impact/ai-ethics"),
    ("Salesforce", "https://www.salesforce.com/artificial-intelligence/trusted-ai/"),
    ("SAP", "https://www.sap.com/products/artificial-intelligence/ai-ethics.html"),
    ("Oracle", "https://www.oracle.com/artificial-intelligence/"),
    ("ServiceNow", "https://www.servicenow.com/ai/"),
    ("Workday", "https://www.workday.com/en-us/artificial-intelligence/responsible-ai.html"),
    ("Adobe", "https://www.adobe.com/ai/overview/ethics.html"),
    ("Cisco", "https://www.cisco.com/site/us/en/solutions/artificial-intelligence/responsible-ai/index.html"),
    ("Intel", "https://www.intel.com/content/www/us/en/artificial-intelligence/responsible-ai.html"),
    ("AMD", "https://www.amd.com/en/solutions/ai.html"),
    ("Qualcomm", "https://www.qualcomm.com/artificial-intelligence"),
    ("Palantir", "https://www.palantir.com/pcl/"),
    ("Snowflake", "https://www.snowflake.com/en/data-cloud/cortex/"),
    ("Databricks", "https://www.databricks.com/trust"),
    ("Cloudflare", "https://www.cloudflare.com/trust-hub/"),
    ("Stripe", "https://stripe.com/privacy-center/legal"),
    ("Atlassian", "https://www.atlassian.com/trust/responsible-tech-principles"),
    ("HubSpot", "https://www.hubspot.com/artificial-intelligence"),
    ("Zoom", "https://www.zoom.com/en/trust/"),
    ("Twilio", "https://www.twilio.com/en-us/trust-center"),
    ("Okta", "https://www.okta.com/trustandsecurity/"),
    ("Box", "https://www.box.com/ai"),
    ("Dropbox", "https://www.dropbox.com/ai-principles"),
    ("DocuSign", "https://www.docusign.com/trust"),
    ("Notion", "https://www.notion.so/security"),
    ("Figma", "https://www.figma.com/security/"),
    ("Canva", "https://www.canva.com/trust/"),
    ("Shopify", "https://www.shopify.com/security"),
    ("Grammarly", "https://www.grammarly.com/trust"),
    ("GitLab", "https://about.gitlab.com/security/"),
    ("Elastic", "https://www.elastic.co/trust"),
    ("MongoDB", "https://www.mongodb.com/cloud/trust"),
    ("Datadog", "https://www.datadoghq.com/security/"),
    ("Confluent", "https://www.confluent.io/trust-and-security/"),
    ("Linear", "https://linear.app/security"),
    ("Vercel", "https://vercel.com/security"),
    ("Supabase", "https://supabase.com/security"),
    ("PagerDuty", "https://www.pagerduty.com/trust/"),
    ("HashiCorp", "https://www.hashicorp.com/trust/security"),
    ("Snyk", "https://snyk.io/trust/"),
    ("1Password", "https://1password.com/security"),
    ("PostHog", "https://posthog.com/handbook/company/security"),
    ("Retool", "https://retool.com/security"),
    ("Airtable", "https://www.airtable.com/company/trust-and-security"),
]


def run_grid(axis, items, out_path):
    t0 = time.time()
    with cf.ThreadPoolExecutor(max_workers=8) as ex:
        rows = list(ex.map(probe, items))
    reader_sha = hashlib.sha256(open(__file__, "rb").read()).hexdigest()
    doc = {
        "axis": axis,
        "kind": "discovery-grid-v1",
        "method": "link-presence v1 (sha-pinned reader; not a certification)",
        "reader_sha256": reader_sha,
        "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "n_subjects": len(rows),
        "n_reachable": sum(1 for r in rows if r["status"] == 200),
        "n_http_error": sum(1 for r in rows if r["error"] == "http_error"),
        "n_valid_min": 30,
        "margin_above_min": sum(1 for r in rows if r["status"] == 200) - 30,
        "terms": list(TERMS),
        "rows": rows,
        "note": (
            "Presence of a link class is not a finding about quality, truth or compliance. "
            "No score, rank or grade is computed. Naming for publication is held for the owner."
        ),
    }
    with open(out_path, "w") as f:
        json.dump(doc, f, indent=1)
    print(
        f"{axis}: n={doc['n_subjects']} reachable={doc['n_reachable']} "
        f"(margin={doc['margin_above_min']:+d} above 30) http_error={doc['n_http_error']} "
        f"elapsed={time.time()-t0:.1f}s -> {out_path}"
    )


if __name__ == "__main__":
    d = os.path.expanduser("~/_alignment/axis-runs-20261024")
    os.makedirs(d, exist_ok=True)
    run_grid("regulator-transparency", REGS + EXTRA_REGS, d + "/regulator-transparency.expanded-v1.json")
    run_grid("company-practice", COMPANIES, d + "/company-practice.discovery-v1.json")
