#!/usr/bin/env python3
import argparse, hashlib, json, shutil, tempfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "public" / "evidence" / "ras-opportunity-watch"

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def check(pack=PACK):
    errors = []
    need = [
        "index.html", "ledger.json", "feed.atom", "manifest.json",
        "ras-c2pa-provenance-conformance-20260929.json",
        "ras-cm-bat-r18-source-audit-20260929.json",
        "ras-cm-bat-r18-current-collector-control-20260929.json",
    ]
    for name in need:
        if not (pack / name).is_file():
            errors.append(f"missing:{name}")
    if errors:
        return errors

    ledger = json.loads((pack / "ledger.json").read_text())
    events = ledger.get("events", [])
    keys = [e.get("event_key") for e in events]
    if len(keys) != len(set(keys)) or any(not k for k in keys):
        errors.append("ledger:event_key_not_unique")
    for event in events:
        for field in ("evidence", "control_evidence"):
            name = event.get(field)
            if name and not (pack / name).is_file():
                errors.append(f"ledger:{field}_missing:{name}")

    audit = json.loads((pack / "ras-cm-bat-r18-source-audit-20260929.json").read_text())
    if audit.get("source_totality_verdict") != "MAPPING_INCOMPLETE":
        errors.append("battery:source_totality_verdict")
    if len(audit.get("unmapped_current_collector_keys", [])) != 5:
        errors.append("battery:unmapped_current_collector_keys")

    control = json.loads((pack / "ras-cm-bat-r18-current-collector-control-20260929.json").read_text())
    if control.get("bounded_causal_verdict") != "NO_NUMERICAL_EFFECT_IN_TESTED_1C_CASE":
        errors.append("battery:causal_verdict")
    for side, vals in control.get("deltas", {}).items():
        for metric, value in vals.items():
            if value != 0 and value != 0.0:
                errors.append(f"battery:nonzero_delta:{side}:{metric}:{value}")

    c2pa = json.loads((pack / "ras-c2pa-provenance-conformance-20260929.json").read_text())
    states = c2pa.get("measurement_states", {})
    for field in ("third_party_service_behavior", "payment", "settlement", "exact_byte_delivery", "buyer_acceptance"):
        if "HOLD" not in str(states.get(field, "")):
            errors.append(f"c2pa:boundary_not_hold:{field}")
    if states.get("discovery") != "SOURCE_OBSERVED":
        errors.append("c2pa:discovery_state")

    html = (pack / "index.html").read_text()
    for token in (
        'rel="canonical" href="https://councilof.ai/evidence/ras-opportunity-watch/"',
        "./ledger.json", "./feed.atom", "./manifest.json",
        "UNMEASURED / HOLD",
    ):
        if token not in html:
            errors.append(f"html:missing:{token}")

    try:
        root = ET.parse(pack / "feed.atom").getroot()
        ns = {"a": "http://www.w3.org/2005/Atom"}
        if len(root.findall("a:entry", ns)) != len(events):
            errors.append("feed:entry_count")
    except Exception as exc:
        errors.append(f"feed:parse:{type(exc).__name__}")

    manifest = json.loads((pack / "manifest.json").read_text())
    for row in manifest.get("files", []):
        p = pack / row["path"]
        if not p.is_file():
            errors.append(f"manifest:missing:{row['path']}")
        elif sha256(p) != row.get("sha256"):
            errors.append(f"manifest:sha256:{row['path']}")
        elif p.stat().st_size != row.get("bytes"):
            errors.append(f"manifest:bytes:{row['path']}")
    return errors

def selftest():
    with tempfile.TemporaryDirectory() as td:
        test = Path(td) / "pack"
        shutil.copytree(PACK, test)
        assert not check(test), "clean fixture must pass"
        p = test / "ras-cm-bat-r18-current-collector-control-20260929.json"
        d = json.loads(p.read_text())
        d["deltas"]["aligned"]["mAh_per_g"] = 1
        p.write_text(json.dumps(d))
        errs = check(test)
        assert any("battery:nonzero_delta" in e for e in errs), errs
    print('{"state":"PASS","selftest":"RAS evidence guard goes red on causal-control drift"}')

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    a=ap.parse_args()
    if a.selftest:
        selftest(); return 0
    errors=check()
    print(json.dumps({"state":"PASS" if not errors else "FAIL","checked":"public/evidence/ras-opportunity-watch","errors":errors},indent=2))
    return 0 if not errors else 1

if __name__ == "__main__":
    raise SystemExit(main())
