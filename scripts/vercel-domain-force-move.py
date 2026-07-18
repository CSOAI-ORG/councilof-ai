#!/usr/bin/env python3
"""
Force-move already-registered .ai domains to the new conversion projects.
This detaches them from old placeholder projects and attaches them to the economy-wave deploys.
Author: JEEVES | Date: 2026-06-15
"""

import json
import subprocess
from pathlib import Path

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
    # Compliance
    "safetyof.ai": "safetyof-deploy",
    "transparencyof.ai": "transparencyof-deploy",
    "accountabilityof.ai": "accountabilityof-deploy",
    "biasdetectionof.ai": "biasdetectionof-deploy",
    "dataprivacyof.ai": "dataprivacyof-deploy",
    "ethicalgovernanceof.ai": "ethicalgovernance-deploy",
    # Productivity + Verticals + Gaming
    "cobolbridge.ai": "cobolbridge-deploy",
    "commercialvehicle.ai": "commercialvehicle-deploy",
    "suicidestop.ai": "suicidestop-deploy",
}

SCOPE = "niks-projects-0a2ef942"


def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.returncode, result.stdout, result.stderr


def main():
    results = []
    for domain, project in DOMAIN_PROJECT_MAP.items():
        print(f"Force-moving {domain} → {project} ...")
        cmd = f'vercel domains add {domain} {project} --scope {SCOPE} --non-interactive --force'
        rc, out, err = run(cmd)
        results.append({"domain": domain, "project": project, "rc": rc, "stdout": out, "stderr": err})
        if rc == 0:
            print(f"  ✅ moved")
        else:
            print(f"  ⚠️  rc={rc}")
            if err:
                print(f"     {err[:250]}")

    out_path = Path.home() / "clawd" / "_findings" / "VERCEL_DOMAIN_FORCE_MOVE_RESULTS_2026-06-15.json"
    out_path.write_text(json.dumps(results, indent=2))
    print(f"\n✅ Results saved: {out_path}")


if __name__ == "__main__":
    main()
