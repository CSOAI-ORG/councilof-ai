#!/usr/bin/env python3
"""
Alias all economy-wave .ai domains to their new Vercel conversion deploys.
Uses `vercel alias set <deployment-url> <domain>` which bypasses project-assignment conflicts.
Author: JEEVES | Date: 2026-06-15
"""

import json
import subprocess
from pathlib import Path

# domain -> Vercel deployment URL
DOMAIN_DEPLOY_MAP = {
    # Construction + Agriculture
    "grabhire.ai": "https://grabhire-ai-conversion.vercel.app",
    "muckaway.ai": "https://muckaway-ai-conversion.vercel.app",
    "planthire.ai": "https://planthire-ai-conversion.vercel.app",
    "fishkeeper.ai": "https://fishkeeper-ai-conversion.vercel.app",
    "koikeeper.ai": "https://koikeeper-ai-conversion.vercel.app",
    # Governance
    "councilof.ai": "https://councilof-conversion-deploy.vercel.app",
    "proofof.ai": "https://proofof-conversion-deploy.vercel.app",
    "agisafe.ai": "https://agisafe-conversion-deploy.vercel.app",
    "asisecurity.ai": "https://asisecurity-conversion-deploy.vercel.app",
    # csoai.org and meok.ai are intentionally excluded — they already have live projects
    # Compliance
    "safetyof.ai": "https://safetyof-deploy.vercel.app",
    "transparencyof.ai": "https://transparencyof-deploy.vercel.app",
    "accountabilityof.ai": "https://accountabilityof-deploy.vercel.app",
    "biasdetectionof.ai": "https://biasdetectionof-deploy.vercel.app",
    "dataprivacyof.ai": "https://dataprivacyof-deploy.vercel.app",
    "ethicalgovernanceof.ai": "https://ethicalgovernanceof-deploy.vercel.app",
    # Productivity + Verticals + Gaming
    "diyhelp.ai": "https://diyhelp-deploy.vercel.app",
    "pokerhud.ai": "https://pokerhud-deploy.vercel.app",
    "loopfactory.ai": "https://loopfactory-deploy.vercel.app",
    "socialmediamanager.ai": "https://socialmediamanager-deploy.vercel.app",
    "optimobile.ai": "https://optimobile-deploy.vercel.app",
    "cobolbridge.ai": "https://cobolbridge-deploy.vercel.app",
    "openmoe.ai": "https://openmoe-deploy.vercel.app",
    "landlaw.ai": "https://landlaw-deploy.vercel.app",
    "commercialvehicle.ai": "https://commercialvehicle-deploy.vercel.app",
    "suicidestop.ai": "https://suicidestop-deploy.vercel.app",
    "wowmcp.ai": "https://wowmcp-deploy.vercel.app",
}

SCOPE = "niks-projects-0a2ef942"


def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def main():
    results = []
    for domain, deploy_url in DOMAIN_DEPLOY_MAP.items():
        print(f"Aliasing {domain} → {deploy_url} ...")
        cmd = f'vercel alias set {deploy_url} {domain} --scope {SCOPE}'
        rc, out, err = run(cmd)
        results.append({"domain": domain, "deploy_url": deploy_url, "rc": rc, "stdout": out, "stderr": err})
        if rc == 0:
            print(f"  ✅ aliased")
        else:
            print(f"  ⚠️  rc={rc}")
            if err:
                print(f"     {err[:250]}")

    out_path = Path.home() / "clawd" / "_findings" / "VERCEL_ALIAS_ALL_RESULTS_2026-06-15.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\n✅ Results saved: {out_path}")

    # Generate verification command
    print("\nVerify with:")
    print("for d in " + " ".join(sorted(DOMAIN_DEPLOY_MAP.keys())) + "; do")
    print("  echo -n \"$d: \"; curl -s -o /dev/null -w \"%{http_code} -> %{redirect_url}\\n\" https://$d")
    print("done")


if __name__ == "__main__":
    main()
