#!/usr/bin/env python3
"""Regenerate data-hash-framing-space.json and assert it still says what it says.

Measures the SIZE of the class the tag axis and the outer-array axis belong to. Decodes
A_signed_statement_as_registered once, then re-emits the identical COSE_Sign1 data item under
every combination of six CBOR encoding freedoms. No element VALUE changes anywhere; only the
encoding of the container around it.

The point is not that any one variant is wrong. It is that sixty-four legal encodings of the same
object give sixty-four different data-hash values, a stock parser rejects none, and thirty-one are
silently repaired into the canonical form by being read. Enumerating framings in the specification
cannot close a combinatorial class.

Run: python3 public/interop/scrapi-ccf/mint_framing_space.py
"""
import binascii, hashlib, itertools, json, sys
from pathlib import Path
import cbor2

HERE = Path(__file__).resolve().parent
V1 = HERE / "data-hash-vector.json"
OUT = HERE / "data-hash-framing-space.json"

src = json.loads(V1.read_text())
A = binascii.unhexlify(src["A_signed_statement_as_registered"]["bytes_hex"])
prot, unprot, payload, sig = cbor2.loads(A).value
sha = lambda b: hashlib.sha256(b).hexdigest()

def bd(b): return cbor2.dumps(b)
def bi(b, c=2):
    n = max(1, len(b) // c)
    return b"\x5f" + b"".join(cbor2.dumps(b[i:i + n]) for i in range(0, len(b), n)) + b"\xff"

def build(tag, arr, mp, pr, pa, sg):
    els = (bi(prot) if pr else bd(prot)) + (b"\xbf\xff" if mp else b"\xa0") \
        + (bi(payload) if pa else bd(payload)) + (bi(sig) if sg else bd(sig))
    out = (b"\x9f" + els + b"\xff") if arr else (b"\x84" + els)
    return (b"\xd2" + out) if tag else out

canon = build(1, 0, 0, 0, 0, 0)
if sha(canon) != sha(A):
    print("FAIL: rebuilt canonical form is not byte-identical to A as published", file=sys.stderr)
    raise SystemExit(1)

digests, rejected, silent = set(), 0, 0
for combo in itertools.product([0, 1], repeat=6):
    b = build(*combo)
    digests.add(sha(b))
    try:
        if cbor2.dumps(cbor2.loads(b)) == canon and combo != (1, 0, 0, 0, 0, 0):
            silent += 1
    except Exception:
        rejected += 1

published = json.loads(OUT.read_text())["finding"]
checks = {
    "distinct_data_hash_values": len(digests),
    "digest_collisions": 64 - len(digests),
    "rejected_by_stock_parser": rejected,
    "silently_reserialising_to_A": silent,
}
bad = [k for k, v in checks.items() if published.get(k) != v]
if bad:
    print(f"FAIL: recomputation disagrees with the published finding on {bad}", file=sys.stderr)
    print(f"  recomputed {checks}", file=sys.stderr)
    raise SystemExit(1)

print(f"  A reproduces byte-identically: {sha(A)}")
print(f"  64 encodings -> {len(digests)} distinct data-hash values, {rejected} rejected, {silent} silently normalised")
print("  published finding matches recomputation")
