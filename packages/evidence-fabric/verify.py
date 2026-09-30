#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Offline verifier for a signed evidence batch (csoai.signed-run/0.1 over a csoai.evidence-batch/0.1 record).

    python3 verify.py BATCH.json BATCH.signed.json EVENTS.jsonl --did did.json      -> VALID | INVALID | UNVERIFIABLE_KEY
    python3 verify.py ... --tamper-control      also flips one byte of each input and requires INVALID for every one

Checks, in order (any failure stops with the reason):
 1. sha256(canonical payload) == signature.payload_sha256   (canonical: JSON, keys sorted, no whitespace, UTF-8)
 2. payload.artifact.sha256 == sha256(BATCH.json bytes)
 3. the key named by signature.did is in the DID document; else UNVERIFIABLE_KEY (never VALID)
 4. Ed25519 signature over the canonical payload verifies with that key
 5. BATCH.events_file.sha256 == sha256(EVENTS.jsonl bytes), and every event_id recomputes and matches the list
Exit 0 VALID, 1 INVALID, 3 UNVERIFIABLE_KEY, 2 input error. A VALID result shows who signed these bytes and
that they are unchanged. It does not show that any claim inside is true.

    python3 verify.py --structure RECORD.json|EVENTS.jsonl   -> STRUCTURE_VALID | INVALID  (no signature check)
Structure mode checks one record (or every line of a JSONL file) against event.py validate(), the base JSON
Schema and, when the record names a profile this package ships (csoai.route-evidence/0.1), that profile's
schema and doctrine rules. It never says VALID: an unsigned record has no signer to verify, and the result
reports "signed": false for it. Exit 0 STRUCTURE_VALID, 1 INVALID, 2 input error.
"""
import argparse, base64, hashlib, json, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import event as E  # noqa: E402


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def key_from_did(did_doc, kid):
    frag = kid.split("#", 1)[-1] if "#" in kid else None
    for m in did_doc.get("verificationMethod", []):
        if frag and m.get("id", "").endswith("#" + frag):
            jwk = m.get("publicKeyJwk") or {}
            if jwk.get("crv") == "Ed25519" and jwk.get("x"):
                return base64.urlsafe_b64decode(jwk["x"] + "=" * (-len(jwk["x"]) % 4))
    return None


def verify_bytes(batch_raw, signed_raw, events_raw, did_doc):
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        from cryptography.exceptions import InvalidSignature
    except ImportError:
        return "UNCHECKABLE", "python cryptography not installed"
    try:
        signed = json.loads(signed_raw)
        batch = json.loads(batch_raw)
        pay, sg = signed["payload"], signed["signature"]
    except Exception as ex:  # malformed input is INVALID, not an error to hide
        return "INVALID", f"unparseable input: {type(ex).__name__}"
    if hashlib.sha256(canon(pay)).hexdigest() != sg.get("payload_sha256"):
        return "INVALID", "payload digest differs from signature.payload_sha256"
    if pay.get("artifact", {}).get("sha256") != hashlib.sha256(batch_raw).hexdigest():
        return "INVALID", "batch bytes differ from payload.artifact.sha256"
    kid = sg.get("did") or ""
    raw_key = key_from_did(did_doc, kid)
    if raw_key is None:
        return "UNVERIFIABLE_KEY", f"key {kid!r} not in the DID document"
    try:
        Ed25519PublicKey.from_public_bytes(raw_key).verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay))
    except (InvalidSignature, ValueError):
        return "INVALID", "Ed25519 signature does not verify"
    ef = batch.get("events_file", {})
    if ef.get("sha256") != hashlib.sha256(events_raw).hexdigest():
        return "INVALID", "events file bytes differ from the signed batch"
    try:
        evs = [json.loads(l) for l in events_raw.decode("utf-8").splitlines() if l.strip()]
    except Exception:
        return "INVALID", "events file unparseable"
    ids = [E.compute_event_id(ev) for ev in evs]
    if ids != [ev.get("event_id") for ev in evs] or ids != batch.get("event_ids"):
        return "INVALID", "an event_id does not recompute or the list differs"
    return "VALID", f"{len(evs)} events; signed by {kid} at {sg.get('signed_at')}"


EXIT = {"VALID": 0, "INVALID": 1, "UNVERIFIABLE_KEY": 3, "UNCHECKABLE": 3}

SCHEMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "schema")
PROFILE_SCHEMAS = {"csoai.route-evidence/0.1": "route-evidence-0.1.schema.json"}
# Words a router may never write about an unseparated choice (spec: routing is not ranking).
ROUTE_BANNED = ("best", "safest", "recommended", "compliant", "certified")


def _schema_errors(obj, name):
    try:
        import jsonschema
    except ImportError:
        return None  # reported as a limit, never as a pass
    schema = json.load(open(os.path.join(SCHEMA_DIR, name), encoding="utf-8"))
    return [f"{name}: {'/'.join(map(str, e.absolute_path)) or '<root>'}: {e.message}"
            for e in jsonschema.Draft7Validator(schema).iter_errors(obj)]


def _route_doctrine(ev):
    """Rules of csoai.route-evidence/0.1 that a schema cannot say."""
    e = []
    obs = ev.get("observed") or {}
    separated = obs.get("separation") == "SEPARATED"
    router_text = json.dumps({"chosen": obs.get("chosen"), "label": obs.get("label"), "separation": obs.get("separation"),
                              "limits": ev.get("limits"), "claim": ev.get("claim"),
                              "labels": [m.get("label") for c in obs.get("considered") or [] for m in c.get("measurements") or []]},
                             ensure_ascii=False).lower()
    import re as _re
    for w in ROUTE_BANNED:
        if _re.search(r"\b" + w + r"\b", router_text):
            e.append(f"route record uses the word {w!r}")
    if not separated and "leader" in router_text:
        e.append("route record says 'leader' about a comparison that was not SEPARATED")
    for c in obs.get("considered") or []:
        for m in c.get("measurements") or []:
            if m.get("state") == "UNTESTED" and m.get("value") is not None:
                e.append(f"candidate {c.get('id')!r}: UNTESTED measurement carries a number")
        if c.get("permit") and (c.get("uncheckable") or c.get("forbid_policy")):
            e.append(f"candidate {c.get('id')!r} is permitted although it is uncheckable or forbidden")
    ch = obs.get("chosen")
    if ch and ch.get("id") not in {c.get("id") for c in obs.get("considered") or [] if c.get("permit")}:
        e.append("chosen candidate is not among the permitted ones")
    return e


def verify_structure(ev):
    """(result, reasons, info) for one record. Never VALID: structure is not a signature."""
    errs = list(E.validate(ev)) if isinstance(ev, dict) else ["record is not an object"]
    if isinstance(ev, dict) and "event_id" not in ev:
        errs.append("record has no event_id")
    limits = []
    if isinstance(ev, dict):
        base = _schema_errors(ev, "evidence-event-0.1.schema.json")
        if base is None:
            limits.append("jsonschema not installed: JSON Schema not applied")
        else:
            errs += base
        prof = ev.get("profile")
        if prof in PROFILE_SCHEMAS:
            pe = _schema_errors(ev, PROFILE_SCHEMAS[prof])
            if pe is not None:
                errs += pe
            if prof == "csoai.route-evidence/0.1":
                errs += _route_doctrine(ev)
        elif prof is not None:
            limits.append(f"profile {prof!r} is not shipped here: base rules only")
    info = {"event_id": ev.get("event_id") if isinstance(ev, dict) else None,
            "profile": ev.get("profile") if isinstance(ev, dict) else None,
            "signed": bool(isinstance(ev, dict) and ev.get("signature")), "limits": limits}
    return ("INVALID" if errs else "STRUCTURE_VALID"), errs, info


def structure_main(path):
    try:
        raw = open(path, encoding="utf-8").read()
    except OSError as ex:
        print(f"ERROR {ex}"); return 2
    try:
        recs = [json.loads(raw)] if raw.lstrip().startswith("{") and not path.endswith(".jsonl") else \
            [json.loads(l) for l in raw.splitlines() if l.strip()]
    except ValueError as ex:
        print(json.dumps({"result": "INVALID", "reason": f"unparseable: {ex}"})); return 1
    out = []
    for r in recs:
        res, why, info = verify_structure(r)
        out.append({"result": res, "reasons": why, **info})
    overall = "STRUCTURE_VALID" if out and all(o["result"] == "STRUCTURE_VALID" for o in out) else "INVALID"
    print(json.dumps({"result": overall, "n_records": len(out), "records": out}, indent=1))
    return 0 if overall == "STRUCTURE_VALID" else 1


def flip(b, i=None):
    b = bytearray(b)
    i = len(b) // 2 if i is None else i
    b[i] ^= 0x01
    return bytes(b)


def main(argv=None):
    argv = sys.argv[1:] if argv is None else argv
    if argv and argv[0] == "--structure":
        if len(argv) != 2:
            print("usage: verify.py --structure RECORD.json|EVENTS.jsonl"); return 2
        return structure_main(argv[1])
    ap = argparse.ArgumentParser()
    ap.add_argument("batch"); ap.add_argument("signed"); ap.add_argument("events")
    ap.add_argument("--did", required=True, help="a saved copy of https://csoai.org/.well-known/did.json")
    ap.add_argument("--tamper-control", action="store_true")
    a = ap.parse_args(argv)
    try:
        b, s, e = (open(p, "rb").read() for p in (a.batch, a.signed, a.events))
        did = json.load(open(a.did))
    except OSError as ex:
        print(f"ERROR {ex}"); return 2
    state, why = verify_bytes(b, s, e, did)
    out = {"result": state, "reason": why}
    if a.tamper_control:
        sj = json.loads(s); h = sj["signature"]["sig_ed25519"]
        sj["signature"]["sig_ed25519"] = ("0" if h[0] != "0" else "1") + h[1:]
        c = {"batch byte flipped": verify_bytes(flip(b), s, e, did)[0],
             "signature first nibble changed": verify_bytes(b, json.dumps(sj).encode(), e, did)[0],
             "events byte flipped": verify_bytes(b, s, flip(e), did)[0]}
        out["tamper_controls"] = c
        if any(v == "VALID" for v in c.values()):
            out["result"] = "INVALID"; out["reason"] = "a tamper control was accepted: the verifier does not discriminate"
    print(json.dumps(out, indent=1))
    return EXIT[out["result"]]


if __name__ == "__main__":
    sys.exit(main())
