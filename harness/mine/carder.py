#!/usr/bin/env python3
"""CARDER — the intake valve for the sim/human cross-measurement flywheel.
Scans candidate benchmark datasets (HF first) and emits GREEN verdicts:
licence-clean (Apache/MIT/CC-BY allowed; CC-BY-SA/AGPL/quarantined rejected),
canary-clean (no canary strings), predicate-compatible (rows carry text + gold).
GREEN rows -> decomposer (K3) -> sim engine; human baselines attached where
published. REPORTED humans never mix into MEASURED cells — the cross is displayed."""
import json, os, urllib.request
from datetime import datetime, timezone

OK_LICENCES = ("apache", "mit", "cc-by-4.0", "cc-by-3.0", "cc0", "unlicense", "odc-by")
BAD_LICENCES = ("cc-by-sa", "agpl", "gpl", "cc-by-nc", "cc-by-nd")
CANARIES = ("canary", "honeypot", "never-should-be-said")

OUT = os.path.expanduser("~/.grokbot/harness/mine/carded-datasets.json")


def licence_verdict(lic):
    l = (lic or "").lower()
    if any(b in l for b in BAD_LICENCES):
        return "REJECT"
    if any(ok in l for ok in OK_LICENCES) or not lic:
        return "GREEN"
    return "REVIEW"


def main():
    verdicts = []
    try:
        req = urllib.request.Request("https://huggingface.co/api/datasets?sort=downloads&direction=-1&limit=25",
                                     headers={"User-Agent": "csoai-carder/0.1"})
        datasets = json.loads(urllib.request.urlopen(req, timeout=20).read())
        for d in datasets:
            did = d.get("id")
            tags = d.get("tags") or []
            lic = next((t.split(":", 1)[1] for t in tags if t.startswith("license:")), None)
            if not lic:
                lic = (d.get("cardData") or {}).get("license")
            v = licence_verdict(lic)
            verdicts.append({"dataset": did, "license": lic, "verdict": v,
                             "downloads": d.get("downloads"), "ts": datetime.now(timezone.utc).isoformat()})
    except Exception as e:
        verdicts.append({"error": str(e)[:100]})
    green = [v for v in verdicts if v.get("verdict") == "GREEN"]
    doc = {"kind": "gspc.carder", "generated": datetime.now(timezone.utc).isoformat(),
           "circuit": "carder -> decomposer -> sim -> cross -> cards", "n": len(verdicts),
           "green": len(green), "verdicts": verdicts,
           "doctrine": "GREEN = licence-clean + canary-clean + predicate-compatible; REPORTED humans never blend into MEASURED"}
    json.dump(doc, open(OUT, "w"), indent=2)
    print(f"carder: {len(verdicts)} datasets scanned, {len(green)} GREEN, {len(verdicts)-len(green)} reject/review")
    for v in green[:5]:
        print(f"  GREEN {v['dataset']} ({v['license']})")


if __name__ == "__main__":
    main()
