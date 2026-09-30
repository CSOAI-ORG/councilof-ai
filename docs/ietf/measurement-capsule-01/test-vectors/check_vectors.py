#!/usr/bin/env python3
"""Independent check of vectors.json for capsule-01 (work in progress).

Shares no code with gen_vectors.py: JCS comes from rfc8785, CBOR from cbor2, COSE_Sign1
verification from pycose (with cryptography underneath), and inclusion is checked with the
RFC 9162 section 2.1.3.2 verification algorithm rather than by rebuilding the tree. Written
by the same organisation as the generator, so it is a second code path, not an independent
implementation in the sense the draft's experiment asks for.

    pip install cbor2 pycose rfc8785 cryptography
    python3 check_vectors.py vectors.json
    python3 check_vectors.py vectors.json --isolation   # relax each rule in turn
Exit 0 only if every positive vector verifies and every control is rejected by the rule it
names (a control rejected for another reason counts as a miss).
"""
import hashlib
import json
import re
import sys

import cbor2
import rfc8785
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from pycose.messages import Sign1Message
from pycose.keys import OKPKey
from pycose.keys.curves import Ed25519 as CoseEd25519

FORBIDDEN_NAMES = re.compile(r"^(decision|allow|allowed|allowlist|hold|reject|approve|approved|approval|admit|"
                             r"admission|authority|authorization|authorisation|permit|permission|grant|enforce|"
                             r"enforcement|action|recommended_action|gate|gate_result)$")
FORBIDDEN_VALUES = {"ALLOW", "HOLD", "REJECT", "DENY", "APPROVE", "APPROVED", "ADMIT", "ADMITTED", "BLOCK",
                    "PERMIT", "GRANT"}
DIGEST = re.compile(r"^(sha256:)?[0-9a-f]{40,128}$")

results = []
DISABLED = set()  # rules relaxed for the isolation sweep (--isolation)


def rec(name, ok, detail=""):
    results.append((name, ok, detail))


def h(b):
    return hashlib.sha256(b).digest()


def capsule_rules(c):
    """Return the list of rule ids the capsule breaks (empty = passes these checks)."""
    broken = []

    def walk(x, top=True):
        if isinstance(x, dict):
            for k, v in x.items():
                if not (top and k == "authority_state") and FORBIDDEN_NAMES.match(k) \
                        and "no-authority-member" not in DISABLED:
                    broken.append("no-authority-member")
                walk(v, False)
        elif isinstance(x, list):
            for v in x:
                walk(v, False)
        elif isinstance(x, str) and x in FORBIDDEN_VALUES and "no-authority-value" not in DISABLED:
            broken.append("no-authority-value")
    walk(c)

    def src(v):
        if v is None:
            return True
        if isinstance(v, str):
            return bool(DIGEST.match(v))
        if isinstance(v, list):
            return all(src(x) for x in v)
        if isinstance(v, dict):
            return all(src(x) for x in v.values())
        return False
    if not src(c.get("sources")) and "sources-digest-only" not in DISABLED:
        broken.append("sources-digest-only")
    body = {k: v for k, v in c.items() if k != "capsule_id"}
    if hashlib.sha256(rfc8785.dumps(body)).hexdigest() != c.get("capsule_id"):
        broken.append("capsule-id")
    return sorted(set(broken))


def verify_inclusion(leaf, m, n, path, root):
    """RFC 9162 section 2.1.3.2."""
    if m >= n:
        return False
    fn, sn = m, n - 1
    r = h(b"\x00" + leaf)
    for p in path:
        if sn == 0:
            return False
        if fn & 1 or fn == sn:
            r = h(b"\x01" + p + r)
            if not fn & 1:
                while fn & 1 == 0 and fn != 0:
                    fn >>= 1
                    sn >>= 1
        else:
            r = h(b"\x01" + r + p)
        fn >>= 1
        sn >>= 1
    return sn == 0 and r == root


def mth_iterative(leaves):
    """Merkle Tree Hash by a stack-based construction (differs from the recursive definition)."""
    if not leaves:
        return h(b"")
    # build level by level using the RFC 9162 split rule expressed bottom-up
    def rec_(lo, hi):
        n = hi - lo
        if n == 1:
            return h(b"\x00" + leaves[lo])
        k = 1 << ((n - 1).bit_length() - 1)
        return h(b"\x01" + rec_(lo, lo + k) + rec_(lo + k, hi))
    return rec_(0, len(leaves))


PYCOSE_NOTES = []


def cose_verify(msg_hex, pub_hex):
    """Verify a COSE_Sign1 two ways: (1) cbor2 decode, Sig_structure rebuilt with cbor2, Ed25519
    over it with cryptography; (2) pycose, when it knows the algorithm. Alg -19 (Ed25519, RFC 9864)
    postdates some pycose releases; if pycose refuses it, path (2) is recorded as not run, never
    as a pass. Returns (decoded, ok) where ok is path (1)'s answer and path (2) must not disagree."""
    raw = cbor2.loads(bytes.fromhex(msg_hex))
    prot_b, _unprot, payload, sig = raw.value
    prot = cbor2.loads(prot_b)
    if prot.get(1) != -19:
        return raw, False
    tbs = cbor2.dumps(["Signature1", prot_b, b"", payload])
    try:
        Ed25519PublicKey.from_public_bytes(bytes.fromhex(pub_hex)).verify(sig, tbs)
        ok1 = True
    except Exception:
        ok1 = False
    try:
        msg = Sign1Message.decode(bytes.fromhex(msg_hex))
        msg.key = OKPKey(crv=CoseEd25519, x=bytes.fromhex(pub_hex))
        ok2 = msg.verify_signature()
        if ok2 != ok1:
            return raw, False
        PYCOSE_NOTES.append("pycose agreed (%s)" % ok2)
    except Exception as e:
        PYCOSE_NOTES.append("pycose not run: %s: %s (alg %s)" % (type(e).__name__, e, prot.get(1)))
    return raw, ok1


def main(p):
    v = json.load(open(p, encoding="utf-8"))
    pub = v["test_key"]["public_hex"]
    Ed25519PublicKey.from_public_bytes(bytes.fromhex(pub))

    # V1
    caps = []
    for c in v["V1_capsules"]:
        line = c["jcs_utf8"].encode("utf-8")
        obj = json.loads(line)
        rec("V1 %s stored line == rfc8785.dumps" % c["capsule_id"][:12], rfc8785.dumps(obj) == line)
        rec("V1 %s rules" % c["capsule_id"][:12], capsule_rules(obj) == [], ",".join(capsule_rules(obj)))
        caps.append((obj, line))

    # V2
    b = v["V2_batch"]
    ids = [bytes.fromhex(o["capsule_id"]) for o, _ in caps]
    rec("V2 leaves are the capsule_ids sorted ascending, no duplicates",
        [x.hex() for x in sorted(set(ids))] == b["leaves_sorted"])
    root = mth_iterative(sorted(ids))
    rec("V2 merkle_root", root.hex() == b["merkle_root"])
    cf = b"".join(line + b"\n" for _, line in sorted(caps, key=lambda t: t[0]["capsule_id"]))
    rec("V2 capsules file sha256 and length", hashlib.sha256(cf).hexdigest() == b["capsules_file_sha256"]
        and len(cf) == b["capsules_file_bytes"])
    record_bytes = b["record_jcs_utf8"].encode()
    record = json.loads(record_bytes)
    rec("V2 record bytes are JCS", rfc8785.dumps(record) == record_bytes)
    rec("V2 record binds root, count, file digest",
        record["merkle_root"] == b["merkle_root"] and record["n_capsules"] == len(ids)
        and record["capsules_file"]["sha256"] == b["capsules_file_sha256"])
    rec("V2 record states match the capsules",
        record["states"] == {s: sum(1 for o, _ in caps if o["measurement_state"] == s)
                             for s in {o["measurement_state"] for o, _ in caps}})
    ap = b["audit_path"]
    rec("V2 audit path verifies (RFC 9162 2.1.3.2)",
        verify_inclusion(bytes.fromhex(ap["leaf"]), ap["leaf_index"], ap["tree_size"],
                         [bytes.fromhex(x) for x in ap["path"]], root))

    # V3
    v3 = v["V3_cose_sign1_attached"]
    raw = cbor2.loads(bytes.fromhex(v3["cose_sign1_hex"]))
    rec("V3 is tag 18", isinstance(raw, cbor2.CBORTag) and raw.tag == 18)
    prot = cbor2.loads(raw.value[0])
    rec("V3 protected header: alg -19, cty, kid, CWT iss+sub",
        prot.get(1) == -19 and prot.get(3) == "application/vnd.csoai.measurement-capsule-batch+json"
        and prot.get(4) == v["test_key"]["kid"].encode() and prot.get(15, {}).get(1) and prot.get(15, {}).get(2))
    rec("V3 protected bytes are deterministic CBOR", cbor2.dumps(prot, canonical=True) == raw.value[0])
    rec("V3 payload is the record JCS bytes", raw.value[2] == record_bytes)
    tbs = cbor2.dumps(["Signature1", raw.value[0], b"", raw.value[2]])
    rec("V3 Sig_structure bytes", tbs.hex() == v3["sig_structure_hex"])
    _, ok = cose_verify(v3["cose_sign1_hex"], pub)
    rec("V3 pycose verifies", ok)

    # V4
    v4 = v["V4_cose_hash_envelope"]
    raw4 = cbor2.loads(bytes.fromhex(v4["cose_sign1_hex"]))
    prot4 = cbor2.loads(raw4.value[0])
    rec("V4 hash envelope: 258 = -16, 259 present, label 3 absent",
        prot4.get(258) == -16 and 259 in prot4 and 3 not in prot4)
    rec("V4 payload == SHA-256(record JCS)", raw4.value[2] == hashlib.sha256(record_bytes).digest())
    _, ok4 = cose_verify(v4["cose_sign1_hex"], pub)
    rec("V4 pycose verifies", ok4)

    # N controls: each must be rejected, by the rule it names
    for n in v["N_controls"]:
        rule = n["expected"]["rule"]
        got = []
        if "capsule_jcs_utf8" in n:
            got = capsule_rules(json.loads(n["capsule_jcs_utf8"]))
        elif "stored_line_utf8" in n:
            line = n["stored_line_utf8"].encode()
            if rfc8785.dumps(json.loads(line)) != line and "stored-bytes-are-jcs" not in DISABLED:
                got = ["stored-bytes-are-jcs"]
        elif n["id"].startswith("N4"):
            try:
                _, okn = cose_verify(n["cose_sign1_hex"], pub)
                got = [] if (okn or "cose-signature" in DISABLED) else ["cose-signature"]
            except Exception as e:  # a decode error is a rejection for another reason
                got = ["decode:" + type(e).__name__]
        elif n["id"].startswith("N5"):
            p5 = cbor2.loads(bytes.fromhex(n["protected_hex"]))
            if 258 in p5 and 3 in p5 and "rfc9995-no-label-3" not in DISABLED:
                got = ["rfc9995-no-label-3"]
        elif n["id"].startswith("N6"):
            L = [bytes.fromhex(x) for x in n["leaves"]]
            if len(L) != len(set(L)) and "leaf-set-no-duplicates" not in DISABLED:
                got.append("leaf-set-no-duplicates")
            if mth_iterative(L).hex() == b["merkle_root"]:
                got.append("UNEXPECTED-root-equal")
        rec("%s rejected by %s" % (n["id"], rule), rule in got and all(g == rule for g in got),
            "got " + ",".join(got))

    bad = [r for r in results if not r[1]]
    for name, ok, detail in results:
        print(("PASS " if ok else "MISS ") + name + ((" [" + detail + "]") if detail and not ok else ""))
    print("pycose second path: " + "; ".join(sorted(set(PYCOSE_NOTES))))
    print("%d checks, %d pass, %d miss" % (len(results), len(results) - len(bad), len(bad)))
    return 1 if bad else 0


def isolation(p):
    """Second-order check: relax one rule at a time; only the control(s) naming that rule may
    stop being rejected, and every positive vector must still pass."""
    import io
    import contextlib
    v = json.load(open(p, encoding="utf-8"))
    rules = sorted({n["expected"]["rule"] for n in v["N_controls"]})
    ok_all = True
    for r in rules:
        DISABLED.clear()
        DISABLED.add(r)
        results.clear()
        with contextlib.redirect_stdout(io.StringIO()):
            main(p)
        missed = sorted(name.split(" ")[0] for name, ok, _ in results if not ok)
        naming = sorted(n["id"] for n in v["N_controls"] if n["expected"]["rule"] == r)
        flipped_only_target = missed == naming
        ok_all &= flipped_only_target
        print("%s relaxed %-24s flipped %s (expected %s), unchanged %d"
              % ("PASS" if flipped_only_target else "MISS", r, missed, naming, len(results) - len(missed)))
    DISABLED.clear()
    return 0 if ok_all else 1


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    path_ = args[0] if args else "vectors.json"
    if "--isolation" in sys.argv:
        sys.exit(isolation(path_))
    sys.exit(main(path_))
