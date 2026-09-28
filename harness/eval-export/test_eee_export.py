#!/usr/bin/env python3
"""Self-checks for eee_export.py. Run with the EEE venv:  $VENV/bin/python harness/eval-export/test_eee_export.py

1. A tampered card body stops the export (id != sha256(preimage)); nothing is written.
2. On the real corpus: no exported record names a model the own-model register counts as ours or
   leaves unconfirmed, every exported card_sha256 is a card in the index, and no held card is exported.
"""
import glob, json, os, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
EV = os.path.join(HERE, "evidence")
PY = sys.executable


def run(repo, out):
    return subprocess.run([PY, os.path.join(HERE, "eee_export.py"), "--repo", repo, "--did-json", os.path.join(EV, "did.json"),
                           "--ollama-check", os.path.join(EV, "ollama-library-check.json"),
                           "--retrieved-at", "2026-09-28T00:00:00Z", "--out", out], capture_output=True, text=True)


def test_tamper():
    tmp = tempfile.mkdtemp()
    try:
        for d in ("public/signed", "public/independence", "client/src/lib"):
            os.makedirs(os.path.join(tmp, d), exist_ok=True)
        shutil.copy(os.path.join(REPO, "public/signed/card_index.json"), os.path.join(tmp, "public/signed/"))
        shutil.copytree(os.path.join(REPO, "public/signed/cards"), os.path.join(tmp, "public/signed/cards"))
        shutil.copy(os.path.join(REPO, "public/independence/own-model-disclosure.json"), os.path.join(tmp, "public/independence/"))
        shutil.copy(os.path.join(REPO, "client/src/lib/axisRegulation.ts"), os.path.join(tmp, "client/src/lib/"))
        idx = json.load(open(os.path.join(tmp, "public/signed/card_index.json")))
        victim = None
        for row in idx["cards"]:
            p = os.path.join(tmp, "public/signed/cards", row["card"] + ".json")
            c = json.load(open(p))
            if c["body"]["model"] == "qwen2.5:7b":
                c["body"]["accuracy"] = 0.5
                json.dump(c, open(p, "w"))
                victim = row["card"]
                break
        assert victim, "no qwen2.5:7b card to tamper"
        out = os.path.join(tmp, "out")
        r = run(tmp, out)
        assert r.returncode != 0, "tampered card did not stop the export"
        assert "id != sha256(preimage)" in (r.stderr + r.stdout), r.stderr[-400:]
        assert not glob.glob(os.path.join(out, "data", "**", "*.json"), recursive=True), "files written despite the tamper"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print("PASS tamper stops the export")


def test_real_output():
    reg = json.load(open(os.path.join(REPO, "public/independence/own-model-disclosure.json")))
    third = {t["model"] for t in reg["no_rule_matched"]["tags"]}
    idx = {r["card"] for r in json.load(open(os.path.join(REPO, "public/signed/card_index.json")))["cards"]}
    rpt = json.load(open(glob.glob(os.path.join(HERE, "eee/adapter_reports/*_failures.json"))[0]))
    held = {r["source_ref"] for r in rpt["failed_records"]} | {r["source_ref"] for r in rpt["excluded_records"]}
    files = glob.glob(os.path.join(HERE, "eee/data/*/*/*/*.json"))
    assert files, "no staged records"
    for f in files:
        d = json.load(open(f))
        name = d["model_info"]["name"]
        sha = d["source_metadata"]["additional_details"]["card_sha256"]
        assert name in third, f"{f}: {name} is not a register third-party tag"
        assert sha in idx, f"{f}: card {sha} not in the index"
        assert sha not in held, f"{f}: card {sha} is both exported and held/excluded"
    assert len(files) + len(held) == len(idx), (len(files), len(held), len(idx))
    print(f"PASS {len(files)} exported + {len(held)} held/excluded == {len(idx)} cards; all exported tags third-party")


if __name__ == "__main__":
    test_tamper()
    test_real_output()
