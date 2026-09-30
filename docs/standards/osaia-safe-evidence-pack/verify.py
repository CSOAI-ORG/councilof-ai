#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Verify this SAFE evidence pack offline. Copied into the pack as verify.py.

    python3 verify.py --offline          exit 0 only if every check below holds; any one-byte edit exits non-zero

 1. FREEZE.json.sha256sums_sha256 == sha256(SHA256SUMS), and every file listed in SHA256SUMS has that sha256;
    no file in the pack is missing from SHA256SUMS.
 2. validate.py: every record validates against the SAFE candidate schema, the cross-record rules hold, and all
    nine rule-breaking controls are REJECTED.
 3. events/events.jsonl and events/event-ids.json are re-derived from records/ by lib/ and must be byte-identical.
 4. every file in render/ is re-rendered from those events by lib/ and must be byte-identical.
 5. if FREEZE.signed.json and did.json are present: the board signature over FREEZE.json verifies (Ed25519,
    did:web:csoai.org#board-attestation-1), else this check is reported as NOT_PRESENT, never as passed.
Needs Python 3.9+, jsonschema (for 2), cryptography (for 5). Network: none.
"""
import hashlib, io, json, os, subprocess, sys, contextlib

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "lib"))


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
    for rel, h in listed.items():
        p = os.path.join(HERE, rel)
        if not os.path.exists(p) or sha(open(p, "rb").read()) != h:
            return False, f"{rel}: sha256 differs from SHA256SUMS"
    for root, _, files in os.walk(HERE):
        for f in files:
            rel = os.path.relpath(os.path.join(root, f), HERE)
            if rel in ("SHA256SUMS", "FREEZE.json") or rel.startswith("FREEZE.") or rel == "did.json" or "__pycache__" in rel:
                continue
            if rel not in listed:
                return False, f"{rel}: in the pack but not in SHA256SUMS"
    return True, f"{len(listed)} files match"


def check_validate():
    r = subprocess.run([sys.executable, os.path.join(HERE, "validate.py")], capture_output=True, text=True,
                       env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"))
    ok = r.returncode == 0 and r.stdout.strip().endswith("OK") and "ACCEPTED" not in r.stdout
    return ok, r.stdout.strip().splitlines()[-1] if r.stdout.strip() else r.stderr.strip()[-200:]


def check_derived():
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


def check_signature():
    if not (os.path.exists(os.path.join(HERE, "FREEZE.signed.json")) and os.path.exists(os.path.join(HERE, "did.json"))):
        return None, "NOT_PRESENT (unsigned pack: signature not checked)"
    import base64
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    s = json.loads(rd("FREEZE.signed.json")); did = json.loads(rd("did.json"))
    canon = lambda o: json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    pay, sg = s["payload"], s["signature"]
    if sha(canon(pay)) != sg["payload_sha256"] or pay["artifact"]["sha256"] != sha(rd("FREEZE.json")):
        return False, "FREEZE.signed.json does not cover FREEZE.json"
    frag = sg["did"].split("#")[-1]
    m = next((m for m in did["verificationMethod"] if m["id"].endswith("#" + frag)), None)
    if not m:
        return False, "UNVERIFIABLE_KEY"
    x = m["publicKeyJwk"]["x"]
    try:
        Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))).verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay))
    except Exception:
        return False, "signature does not verify"
    return True, f"signed by {sg['did']} at {sg.get('signed_at')}"


def main():
    if "--offline" not in sys.argv:
        print("usage: python3 verify.py --offline"); return 2
    results, rc = [], 0
    for name, fn in (("sums", check_sums), ("validate", check_validate), ("derived", check_derived), ("signature", check_signature)):
        try:
            with contextlib.redirect_stdout(io.StringIO()):
                ok, why = fn()
        except Exception as ex:
            ok, why = False, f"{type(ex).__name__}: {ex}"
        results.append((name, ok, why))
        if ok is False:
            rc = 1
    for name, ok, why in results:
        print(f"{'OK  ' if ok else ('FAIL' if ok is False else 'N/A ')} {name}: {why}")
    fr = json.loads(rd("FREEZE.json"))
    print(f"{'VERIFIED' if rc == 0 else 'NOT VERIFIED'} pack frozen at SHA256SUMS sha256 {fr['sha256sums_sha256']}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
