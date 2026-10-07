#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Read a SAFE evidence pack offline without editing its frozen bytes.

    python3 safe_pack_verify.py --offline --pack PATH

Checks sums, schema/negative controls, derived events/renders, and the freeze
signature. Missing inputs or dependencies are UNCHECKABLE (exit 2); a confirmed
failed check is INVALID (exit 1). A valid supplied-DID signature is reported as
SELF_CONSISTENT_UNAUTHENTICATED_KEY (exit 2), never issuer authentication.
Needs Python 3.9+, jsonschema (validation), cryptography (signature). Network: none.
"""
import argparse, hashlib, io, json, os, subprocess, sys, contextlib

SOURCE_DIR = os.path.dirname(os.path.abspath(__file__))
HERE = SOURCE_DIR
sys.path.insert(0, SOURCE_DIR)
sys.path.insert(0, os.path.join(SOURCE_DIR, "lib"))
UNKNOWN_ERRORS = (OSError, ImportError, ValueError, TypeError, KeyError, RecursionError)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def rd(rel):
    return open(os.path.join(HERE, rel), "rb").read()


def check_sums():
    sums = rd("SHA256SUMS")
    fr = json.loads(rd("FREEZE.json"))
    if fr["sha256sums_sha256"] != sha(sums):
        return False, "SHA256SUMS differs from FREEZE.json"
    listed = {}
    for line in sums.decode().splitlines():
        h, rel = line.split("  ", 1)
        listed[rel] = h
    missing = []
    for rel, h in listed.items():
        p = os.path.join(HERE, rel)
        if not os.path.exists(p):
            missing.append(rel)
            continue
        if sha(open(p, "rb").read()) != h:
            return False, f"{rel}: sha256 differs from SHA256SUMS"
    for root, _, files in os.walk(HERE):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), HERE)
            if rel in ("SHA256SUMS", "FREEZE.json") or rel.startswith("FREEZE.") or rel == "did.json" or "__pycache__" in rel:
                continue
            if rel not in listed:
                return False, f"{rel}: in the pack but not in SHA256SUMS"
    if missing:
        return None, f"{', '.join(missing)}: NOT_PRESENT (listed files unavailable)"
    return True, f"{len(listed)} files match"


def check_validate():
    script = os.path.join(HERE, "validate.py")
    if not os.path.isfile(script):
        return None, "NOT_PRESENT (validate.py not supplied)"
    r = subprocess.run([sys.executable, "-B", script], capture_output=True, text=True,
                       env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"))
    if r.returncode != 0 and any(name in r.stderr for name in ("ModuleNotFoundError:", "ImportError:")):
        return None, "validation dependency unavailable: " + r.stderr.strip()[-200:]
    ok = r.returncode == 0 and r.stdout.strip().endswith("OK") and "ACCEPTED" not in r.stdout
    return ok, r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr.strip()[-200:]


def _check_derived_here():
    sys.dont_write_bytecode = True
    import safe_pack as SP
    import event as E
    evs, idx = SP.derive(os.path.join(HERE, "records"))
    buf = "".join(json.dumps(e, ensure_ascii=False, sort_keys=True) + "\n" for e in evs).encode()
    if buf != rd("events/events.jsonl"):
        return False, "events.jsonl does not re-derive from records/"
    ids = json.loads(rd("events/event-ids.json"))
    if ids["records"] != json.loads(json.dumps(idx)):
        return False, "event-ids.json does not re-derive"
    for e in evs:
        if E.validate(e):
            return False, f"event {e['event_id']} invalid"
    for name, body in SP.renders(evs).items():
        if body.encode() != rd(os.path.join("render", name)):
            return False, f"render/{name} does not re-render"
    return True, f"{len(evs)} events and {len(SP.renders(evs))} renders re-derived byte-identical"


def check_derived():
    # Each selected pack gets fresh imports, including its ingest/render submodules.
    worker = """
import importlib.util, json, os, sys
spec = importlib.util.spec_from_file_location("_safe_pack_verifier", sys.argv[1])
verifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verifier)
verifier.HERE = sys.argv[2]
sys.path[:] = [p for p in sys.path if p not in (verifier.SOURCE_DIR, os.path.join(verifier.SOURCE_DIR, "lib"))]
sys.path.insert(0, os.path.join(verifier.HERE, "lib"))
try:
    result = verifier._check_derived_here()
except verifier.UNKNOWN_ERRORS as exc:
    result = (None, type(exc).__name__ + ": " + str(exc))
print(json.dumps(result))
"""
    r = subprocess.run([sys.executable, "-I", "-B", "-c", worker, os.path.abspath(__file__), HERE],
                       capture_output=True, text=True)
    if r.returncode != 0:
        return None, "derivation could not complete: " + r.stderr.strip()[-200:]
    return tuple(json.loads(r.stdout))


def check_signature():
    # Reuse the reviewed external signature consumer, also copied into future pack/lib.
    from safe_freeze_v2 import check_signature as check
    def optional(rel):
        try:
            return rd(rel)
        except FileNotFoundError:
            return None
    return check(rd("FREEZE.json"), optional("FREEZE.signed.json"), optional("did.json"))


def main(argv=None):
    global HERE
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--offline", action="store_true", help="required; no network is used")
    parser.add_argument("--pack", default=SOURCE_DIR, help="pack directory (default: beside this verifier)")
    args = parser.parse_args(argv)
    if not args.offline:
        parser.print_usage()
        return 2
    HERE = os.path.abspath(args.pack)
    results = {}
    for name, fn in (("sums", check_sums), ("validate", check_validate),
                     ("derived", check_derived), ("signature", check_signature)):
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                ok, why = fn()
        except UNKNOWN_ERRORS as ex:
            ok, why = None, f"{type(ex).__name__}: {ex}"
        results[name] = {"holds": ok, "reason": why}
    for name, result in results.items():
        ok = result["holds"]
        print(f"{'OK  ' if ok else ('FAIL' if ok is False else 'N/A ')} {name}: {result['reason']}")
    if any(result["holds"] is False for result in results.values()):
        state, rc = "INVALID", 1
    elif any(result["holds"] is not True for result in results.values()):
        state, rc = "UNCHECKABLE", 2
    else:
        state, rc = "SELF_CONSISTENT_UNAUTHENTICATED_KEY", 2
    print(json.dumps({"verifier_profile": "csoai.safe-pack-readback/2", "state": state,
                      "pack": HERE, "signature_valid": results["signature"]["holds"],
                      "issuer_authenticated": None, "checks": results,
                      "scope": "offline pack integrity and supplied-DID-key consistency; no issuer authentication"}))
    return rc

if __name__ == "__main__":
    sys.exit(main())
