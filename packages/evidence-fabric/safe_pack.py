#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Build the SAFE evidence pack from a directory of safe-reverification records.

    python3 safe_pack.py --records DIR --producer DIR --out PACKDIR --as-of 2026-09-30T12:00:00Z [--rfc34-schema FILE]

Writes PACKDIR/{records/, events/, render/, lib/, schema/, rfc34/, producer/, validate.py, verify.py, SHA256SUMS,
FREEZE.json}. Every derived file is recomputed from records/ by code shipped inside the pack, so
`python3 verify.py --offline` re-derives and compares instead of trusting. The pack does not embed the RFC #34
straw-man schema (its licence is not stated); rfc34/results.json cites it by URL + sha256.
"""
import argparse, glob, hashlib, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import event as E  # noqa: E402
from ingest import safe_in  # noqa: E402
from render import ocsf, otel, sarif, intoto, ecs_hec  # noqa: E402

RFC34_URL = "https://github.com/user-attachments/files/32363522/safe-day4.schema.json"
RFC34_ISSUE = "https://github.com/OpenSecureAIAlliance/RFCs/issues/34"

# Our field -> the RFC #34 day-4 field it could fill, and how well. Written by hand, checked against both schemas.
RFC34_MAP = [
    ("schema_version", None, "NO_EQUIVALENT", "ours is profile safe-reverification/0.1-draft; theirs is a day-4 incident filing, a different document"),
    ("report_id", "record_id / event_id", "PARTIAL", "theirs must match ^SAFE-[A-Z0-9-]{6,64}$; ours are csoai:safe-rv:* and sha256:* (stable, content-derived)"),
    ("supersedes", "supersedes[]", "MAPS", "ours names the prior record by id AND sha256, theirs by report_id only"),
    ("filed_at", "issued_at", "MAPS", ""),
    ("confidentiality", "finding.disclosure_tier", "PARTIAL", "ours: public only so far"),
    ("near_miss", None, "NO_EQUIVALENT", "we re-verify published findings; we do not classify incidents"),
    ("filer", "issuer (did:web)", "PARTIAL", "theirs wants organization + role enum; ours is a DID"),
    ("incident_classes", None, "NO_EQUIVALENT", "not our role: we measure, we do not classify an incident"),
    ("when", "result.measured_at / dependencies[].observed_at", "PARTIAL", "ours times the re-verification, not the incident; disclosure-lag records carry quoted incident dates"),
    ("affected_parties_notified", None, "NO_EQUIVALENT", ""),
    ("systems", "claim.subject", "PARTIAL", "ours identifies the artifact checked, not model/safeguard versions"),
    ("control_layers", None, "NO_EQUIVALENT", "field map (records/safe-rfc-fieldmap.json) lists control-layer tags as missing on our side"),
    ("preservation", "dependencies[] (digest + uri + state PINNED/UNPINNED)", "PARTIAL", "ours says exactly which bytes are pinned by digest"),
    ("coverage", "limits[] + result.read_state + negative_control", "MAPS", "ours adds UNMEASURED/PARTIAL with value null and a designed-to-fail control"),
    ("narrative", "finding.summary", "MAPS", ""),
    ("srel", None, "NOT_USED", "an optional score attachment; we attach no score"),
]
OURS_NOT_THEIRS = ["negative_control (designed-to-fail, observed)", "result.state incl. UNMEASURED / PARTIAL / NOT_DISCRIMINATING",
                   "signature (Ed25519, did:web) + timestamp state stated honestly", "supersedes by sha256",
                   "dependencies pinned by digest", "event_id (sha256 of JCS bytes)", "test.declared_failure_modes / noise_floor"]


def sha(b):
    return hashlib.sha256(b).hexdigest()


def dump(o):
    return json.dumps(o, ensure_ascii=False, sort_keys=True, indent=1) + "\n"


def derive(records_dir):
    """records -> (events, event-ids index). Deterministic: sorted by file name."""
    evs, idx = [], []
    for p in sorted(glob.glob(os.path.join(records_dir, "*.safe-rv.json"))):
        rec = json.load(open(p, encoding="utf-8"))
        ev = safe_in.to_event(rec, os.path.basename(p))
        evs.append(ev)
        idx.append({"record_file": os.path.basename(p), "record_id": rec["record_id"],
                    "record_sha256_canonical": safe_in.record_sha256(rec), "record_file_sha256": sha(open(p, "rb").read()),
                    "event_id": ev["event_id"], "state": ev["state"]})
    return evs, idx


def renders(evs):
    return {"ocsf.jsonl": "".join(json.dumps(ocsf.render(e), ensure_ascii=False, sort_keys=True) + "\n" for e in evs),
            "otel.json": dump(otel.render_batch(evs)),
            "evidence.sarif": dump(sarif.render_batch(evs)),
            "intoto.jsonl": "".join(json.dumps(intoto.statement(e), ensure_ascii=False, sort_keys=True) + "\n" for e in evs),
            "hec.ndjson": "".join(json.dumps(ecs_hec.hec(e), ensure_ascii=False, sort_keys=True) + "\n" for e in evs)}


def rfc34(records_dir, evs, schema_path):
    out = {"issue": RFC34_ISSUE, "schema_url": RFC34_URL, "schema_sha256": None, "validator": None,
           "control_their_example": None, "records": [], "events": [], "field_map_ours_to_theirs": [
               {"theirs": t, "ours": o, "fit": f, "note": n} for t, o, f, n in RFC34_MAP],
           "carried_by_ours_not_by_theirs": OURS_NOT_THEIRS,
           "reading": ("The #34 straw man is a day-4 incident filing; our records re-verify published findings. They are different "
                       "documents, so every one of our records fails its schema, and that is expected. The useful output is the field "
                       "map: which of their fields our records can fill, and what ours carry that theirs does not.")}
    if not schema_path:
        out["validator"] = "NOT_RUN: schema file not supplied"; return out
    raw = open(schema_path, "rb").read()
    out["schema_sha256"] = sha(raw)
    try:
        import jsonschema
    except ImportError:
        out["validator"] = "NOT_RUN: jsonschema not installed"; return out
    S = json.loads(raw)
    V = jsonschema.Draft202012Validator(S, format_checker=jsonschema.FormatChecker())
    import importlib.metadata as _im
    out["validator"] = f"jsonschema {_im.version('jsonschema')} Draft202012Validator"
    ex = os.path.join(os.path.dirname(schema_path), "safe-day4.example.json")
    if os.path.exists(ex):
        errs = list(V.iter_errors(json.load(open(ex))))
        out["control_their_example"] = {"file_sha256": sha(open(ex, "rb").read()), "errors": len(errs),
                                        "result": "VALID (validator accepts their own example)" if not errs else "INVALID"}
    for p in sorted(glob.glob(os.path.join(records_dir, "*.safe-rv.json"))):
        errs = sorted(V.iter_errors(json.load(open(p))), key=lambda e: list(e.path))
        missing = sorted({m.split("'")[1] for m in (e.message for e in errs) if "is a required property" in m})
        out["records"].append({"file": os.path.basename(p), "valid": not errs, "errors": len(errs), "missing_required": missing})
    for ev in evs:
        errs = list(V.iter_errors(ev))
        out["events"].append({"event_id": ev["event_id"], "valid": not errs, "errors": len(errs)})
    return out


def copy_lib(pack):
    lib = os.path.join(pack, "lib")
    for sub in ("render", "ingest"):
        os.makedirs(os.path.join(lib, sub), exist_ok=True)
    shutil.copy(os.path.join(HERE, "event.py"), lib)
    shutil.copy(os.path.join(HERE, "safe_freeze_v2.py"), lib)
    for f in ("__init__.py", "ocsf.py", "otel.py", "sarif.py", "intoto.py", "ecs_hec.py"):
        shutil.copy(os.path.join(HERE, "render", f), os.path.join(lib, "render", f))
    for f in ("__init__.py", "safe_in.py"):
        shutil.copy(os.path.join(HERE, "ingest", f), os.path.join(lib, "ingest", f))
    shutil.copy(__file__, os.path.join(lib, "safe_pack.py"))


def write_sums(pack):
    lines = []
    for root, _, files in os.walk(pack):
        for f in files:
            p = os.path.join(root, f)
            rel = os.path.relpath(p, pack)
            if rel in ("SHA256SUMS", "FREEZE.json") or rel.startswith("FREEZE.") or "__pycache__" in rel:
                continue
            lines.append(f"{sha(open(p, 'rb').read())}  {rel}")
    body = "\n".join(sorted(lines, key=lambda l: l.split("  ", 1)[1])) + "\n"
    open(os.path.join(pack, "SHA256SUMS"), "w").write(body)
    return body


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--records", required=True); ap.add_argument("--producer", required=True)
    ap.add_argument("--out", required=True); ap.add_argument("--as-of", required=True)
    ap.add_argument("--rfc34-schema"); ap.add_argument("--docs", help="dir whose *.md files go into the pack root")
    a = ap.parse_args(argv)
    P = a.out
    for d in ("records", "events", "render", "schema", "rfc34", "producer"):
        os.makedirs(os.path.join(P, d), exist_ok=True)
    for f in glob.glob(os.path.join(a.records, "*.json")):
        shutil.copy(f, os.path.join(P, "records"))
    shutil.copy(os.path.join(a.producer, "safe_export.py"), os.path.join(P, "producer"))
    shutil.copy(os.path.join(a.producer, "schema", "safe-reverification-record-v0.1.schema.json"), os.path.join(P, "schema"))
    shutil.copy(os.path.join(HERE, "schema", "evidence-event-0.1.schema.json"), os.path.join(P, "schema"))
    v = open(os.path.join(a.producer, "validate.py")).read().replace('(HERE / "out")', '(HERE / "records")')
    open(os.path.join(P, "validate.py"), "w").write(v)
    copy_lib(P)
    shutil.copy(os.path.join(HERE, "safe_pack_verify.py"), os.path.join(P, "verify.py"))
    for f in glob.glob(os.path.join(a.docs, "*.md")) if a.docs else []:
        shutil.copy(f, P)
    evs, idx = derive(os.path.join(P, "records"))
    E.write_jsonl(os.path.join(P, "events", "events.jsonl"), evs)
    open(os.path.join(P, "events", "event-ids.json"), "w").write(dump({"as_of": a.as_of, "rule": "event_id = sha256 of the RFC 8785 bytes of the event without event_id/signature/anchors", "records": idx}))
    for name, body in renders(evs).items():
        open(os.path.join(P, "render", name), "w").write(body)
    open(os.path.join(P, "rfc34", "results.json"), "w").write(dump(rfc34(os.path.join(P, "records"), evs, a.rfc34_schema)))
    body = write_sums(P)
    freeze = {"schema": "csoai.safe-evidence-pack/0.1", "as_of": a.as_of, "sha256sums_sha256": sha(body.encode()),
              "files": body.count("\n"), "events": len(evs), "state_counts": {s: sum(e["state"] == s for e in evs) for s in sorted({e["state"] for e in evs})},
              "note": "Frozen: any change to any listed file changes SHA256SUMS and so this digest. A new pack is a new FREEZE, never an edit."}
    open(os.path.join(P, "FREEZE.json"), "w").write(dump(freeze))
    print(json.dumps(freeze, indent=1))


if __name__ == "__main__":
    main()
