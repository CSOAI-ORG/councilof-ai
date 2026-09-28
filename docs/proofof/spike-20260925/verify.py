#!/usr/bin/env python3
"""Verify the proofof.ai twin spike fixture (docs/proofof/spike-20260925/run1).

Checks: (1) every file matches SHA256SUMS; (2) record.json pins events.jsonl by sha256;
(3) the Ed25519 signature over record.json verifies against record.pub;
(4) the replay run reproduces the (action, target, decision, enforced, result_sha256)
sequence; (5) every deny the policy predicts was enforced, and no event is inconsistent.
Needs: python3 + `cryptography` (for step 3 only; skipped with a notice if absent).
Usage: python3 verify.py [run1-dir]
"""
import base64, hashlib, json, os, sys

d = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "run1")
H = lambda p: hashlib.sha256(open(os.path.join(d, p), "rb").read()).hexdigest()
ok = True

for line in open(os.path.join(d, "SHA256SUMS")):
    want, name = line.split()
    good = H(name) == want
    ok &= good
    print(("OK   " if good else "FAIL ") + "sha256 " + name)

rec = json.load(open(os.path.join(d, "record.json")))
good = rec["events_sha256"] == H("events.jsonl")
ok &= good
print(("OK   " if good else "FAIL ") + "record.json pins events.jsonl " + rec["events_sha256"][:16])

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(open(os.path.join(d, "record.pub")).read()))
    pub.verify(base64.b64decode(open(os.path.join(d, "record.json.sig")).read()),
               open(os.path.join(d, "record.json"), "rb").read())
    print("OK   Ed25519 signature over record.json (ephemeral key: integrity, not identity)")
except ImportError:
    print("SKIP signature (pip install cryptography)")
except Exception as e:
    ok = False
    print("FAIL signature " + repr(e))


def seq(p):
    return [(e["action"], e["target"], e["policy_decision"], e["enforced"], e["result_sha256"])
            for e in map(json.loads, open(os.path.join(d, p))) if e["action"] not in ("run.start", "run.end")]


good = seq("events.jsonl") == seq("replay-run2.events.jsonl")
ok &= good
print(("OK   " if good else "FAIL ") + "replay reproduces %d action events" % len(seq("events.jsonl")))

evs = [json.loads(l) for l in open(os.path.join(d, "events.jsonl"))]
denies = [e for e in evs if e["policy_decision"] == "deny"]
good = all(e["enforced"] == "deny" for e in denies) and not any(e["consistent"] is False for e in evs)
ok &= good
print(("OK   " if good else "FAIL ") + "%d predicted denies all enforced; 0 inconsistent events" % len(denies))
sys.exit(0 if ok else 1)
