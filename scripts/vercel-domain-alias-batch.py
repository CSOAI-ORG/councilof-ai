#!/usr/bin/env python3
"""
Batch-add custom domains to Vercel projects for the economy wave.
Generates a Namecheap DNS action sheet for records that still need adding.
Author: JEEVES | Date: 2026-06-15
"""

import json
import subprocess
from pathlib import Path

# Map domain -> Vercel project name
DOMAIN_PROJECT_MAP = {
    # Construction + Agriculture
    "grabhire.ai": "grabhire-ai-conversion",
    "muckaway.ai": "muckaway-ai-conversion",
    "planthire.ai": "planthire-ai-conversion",
    "fishkeeper.ai": "fishkeeper-ai-conversion",
    "koikeeper.ai": "koikeeper-ai-conversion",
    # Governance
    "councilof.ai": "councilof-conversion-deploy",
    "proofof.ai": "proofof-conversion-deploy",
    "agisafe.ai": "agisafe-conversion-deploy",
    "asisecurity.ai": "asisecurity-conversion-deploy",
    # csoai.org already has csoai-org project; skip to avoid conflict
    # meok.ai already has meok / meok-ai project; skip
    # Compliance
    "safetyof.ai": "safetyof-deploy",
    "transparencyof.ai": "transparencyof-deploy",
    "accountabilityof.ai": "accountabilityof-deploy",
    "biasdetectionof.ai": "biasdetectionof-deploy",
    "dataprivacyof.ai": "dataprivacyof-deploy",
    "ethicalgovernanceof.ai": "ethicalgovernanceof-deploy",
    # Productivity + Verticals + Gaming
    "diyhelp.ai": "diyhelp-deploy",
    "pokerhud.ai": "pokerhud-deploy",
    "loopfactory.ai": "loopfactory-deploy",
    "socialmediamanager.ai": "socialmediamanager-deploy",
    "optimobile.ai": "optimobile-deploy",
    "cobolbridge.ai": "cobolbridge-deploy",
    "openmoe.ai": "openmoe-deploy",
    "landlaw.ai": "landlaw-deploy",
    "commercialvehicle.ai": "commercialvehicle-deploy",
    "suicidestop.ai": "suicidestop-deploy",
    "wowmcp.ai": "wowmcp-deploy",
}

VERCEL_IP = "76.76.21.21"
VERCEL_CNAME = "cname.vercel-dns.com"
SCOPE = "niks-projects-0a2ef942"


def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def add_domain(domain, project):
    cmd = f'vercel domains add {domain} {project} --scope {SCOPE} --non-interactive'
    rc, out, err = run(cmd)
    return rc, out, err


def main():
    results = []
    for domain, project in DOMAIN_PROJECT_MAP.items():
        print(f"Adding {domain} → {project} ...")
        rc, out, err = add_domain(domain, project)
        results.append({
            "domain": domain,
            "project": project,
            "rc": rc,
            "stdout": out,
            "stderr": err,
        })
        if rc == 0:
            print(f"  ✅ added")
        else:
            print(f"  ⚠️  rc={rc}")
            if err:
                print(f"     {err[:200]}")

    # Write Namecheap action sheet
    md = """# Namecheap DNS Action Sheet — Economy Wave
**Generated:** 2026-06-15  
**For each domain below, add these records in Namecheap Advanced DNS:**

| Domain | Type | Host | Value |
|---|---|---|---|
"""
    for domain in sorted(DOMAIN_PROJECT_MAP.keys()):
        md += f"| {domain} | A | @ | {VERCEL_IP} |\n"
        md += f"| {domain} | CNAME | www | {VERCEL_CNAME} |\n"

    md += """
## Conflicts / manual decisions

| Domain | Status |
|---|---|
| meok.ai | Already on Vercel project `meok` / `meok-ai`. Decide whether to repoint to `meok-governance-deploy` or merge conversion pages into existing project. |
| csoai.org | Already on Vercel project `csoai-org`. Same decision as above. |

## After adding DNS

Wait 1-60 minutes, then verify:
```bash
for d in """ + " ".join(sorted(DOMAIN_PROJECT_MAP.keys())) + """; do
  echo -n "$d: "
  curl -s -o /dev/null -w "%{http_code}\n" https://$d
done
```
"""

    out_path = Path.home() / "clawd" / "_findings" / "NAMECHEAP_DNS_ACTION_SHEET_2026-06-15.md"
    out_path.write_text(md)

    json_path = Path.home() / "clawd" / "_findings" / "VERCEL_DOMAIN_BATCH_RESULTS_2026-06-15.json"
    json_path.write_text(json.dumps(results, indent=2))

    print(f"\n✅ Namecheap action sheet: {out_path}")
    print(f"✅ Vercel batch results: {json_path}")


if __name__ == "__main__":
    main()
