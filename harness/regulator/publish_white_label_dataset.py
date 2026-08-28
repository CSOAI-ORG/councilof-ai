#!/usr/bin/env python3
"""publish_white_label_dataset.py — package + push the signed white-label
regulator-findings dataset to the csoai HF org (`csoai/white-label-eu-ai-act-regulator-findings`).

Doctrine: measurement-not-certification, corrections-appended-not-edited, free-for-regulators.
This is reproducible from source: it pulls the LIVE signed endpoints via the three regulator
findings tools (eu_ai_act_findings / article_findings / sector_findings), aggregates by axis,
and uploads the raw reports + the signed reference boards to HuggingFace.

Usage:
  HF_TOKEN=<token> API_HOST=https://councilof.ai python3 publish_white_label_dataset.py [--push]
  (omit --push to stage locally under /tmp without uploading)

Requires: `huggingface_hub`, the tools under harness/regulator/ in the same repo.
"""
import argparse, json, os, subprocess, sys, tempfile
from datetime import datetime, timezone

THIS = os.path.dirname(os.path.abspath(__file__))           # .../harness/regulator
MONO = os.path.dirname(os.path.dirname(THIS))                # repo root
REG = THIS
API_HOST = os.environ.get("API_HOST", "https://councilof.ai")
REPO = "csoai/white-label-eu-ai-act-regulator-findings"
DOCS = {
    "resume": ["eu_ai_act_findings.py", "--deployment", "high-risk resume-screening", "--json"],
    "insurance": ["sector_findings.py", "--sector", "insurance", "--deployment",
                  "AI underwriting / claim triage", "--json"],
    "article": ["article_findings.py", "--json"],
}

def run(name, args):
    env = dict(os.environ, API_HOST=API_HOST)
    p = subprocess.run([sys.executable, *args], cwd=MONO, env=env,
                       capture_output=True, text=True)
    if p.returncode != 0:
        print(f"[warn] {name}: failed ({p.stderr[:200]})", file=sys.stderr)
        return None
    return json.loads(p.stdout)

def stage():
    base = tempfile.mkdtemp(prefix="wl-regulator-findings-ds-")
    out = os.path.join(base, "regulator-findings")
    raw = os.path.join(out, "raw")
    os.makedirs(raw, exist_ok=True)

    # 1. Run the three live findings tools.
    raw_map = {"resume": "wl_findings_resume_screening.json",
               "insurance": "wl_findings_insurance.json",
               "article": "wl_findings_article_flatten.json"}
    reports = {}
    for name, (script, *args) in DOCS.items():
        d = run(name, [os.path.join(REG, script), *args])
        if d:
            p = os.path.join(raw, raw_map[name])
            with open(p, "w") as f:
                json.dump(d, f, indent=2, ensure_ascii=False)
            reports[name] = d

    # 2. Aggregate axis findings into findings.jsonl.
    rows, seen = [], {}
    for name, d in reports.items():
        for f in d.get("findings", []):
            key = (f.get("axis"), d.get("sector") or d.get("deployment"))
            if key in seen:
                continue
            seen[key] = True
            rows.append({
                "sector_or_deployment": (d.get("deployment", "") + " / " + d.get("sector", "")
                                         if d.get("sector") else d.get("deployment")),
                "axis": f.get("axis"),
                "obligation": f.get("obligation"),
                "measured": f.get("measured"),
                "fleet_mean": f.get("fleet_mean"),
                "n": f.get("n"),
                "grade": f.get("grade"),
                "penalty_exposure": f.get("penalty_exposure"),
            })
    with open(os.path.join(out, "findings.jsonl"), "w") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

    # 3. Copy signed reference boards.
    signed = os.path.join(MONO, "public", "signed")
    for fn in ["gspc-board.signed.json", "eat_compliance_board.json"]:
        sp = os.path.join(signed, fn)
        if os.path.exists(sp):
            import shutil; shutil.copy(sp, os.path.join(out, fn))
    print(f"staged: {base} ({len(rows)} findings rows)")
    return base, len(rows)

def push(base):
    from huggingface_hub import HfApi
    api = HfApi()
    api.create_repo(repo_id=REPO, repo_type="dataset", exist_ok=True, private=False)
    count = 0
    for root, _, files in os.walk(base):
        for fn in files:
            fp = os.path.join(root, fn)
            rp = os.path.relpath(fp, base)
            api.upload_file(path_or_fileobj=fp, path_in_repo=rp, repo_id=REPO, repo_type="dataset")
            print(f"push {rp} ({os.path.getsize(fp)}b)")
            count += 1
    return count

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true")
    a = ap.parse_args()
    base, n = stage()
    if a.push:
        c = push(base)
        print(f"pushed {c} files to {REPO}")
    else:
        print("staged only (use --push to upload). note: README.md lives at repo root.")

if __name__ == "__main__":
    main()
