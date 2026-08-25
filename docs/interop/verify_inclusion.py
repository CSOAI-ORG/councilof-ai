#!/usr/bin/env python3
"""Stranger-verifier for csoai.card-merkle-log/0.1 — stdlib only, no CSOAI code.
Usage: python3 verify_inclusion.py [merkle_log.json] [card_hash_hex]  (defaults to merkle_log.json)
Verifies one card's inclusion proof (or every proof when no card given)
against the published root. RFC 6962 hashing.
"""
import hashlib, json, sys
H=lambda b: hashlib.sha256(b).digest()
def check(entry, root):
    h=H(b"\x00"+bytes.fromhex(entry["card"]))
    for side,sib in entry["proof"]:
        s=bytes.fromhex(sib)
        h = H(b"\x01"+s+h) if side=="L" else H(b"\x01"+h+s)
    return h.hex()==root
# A WG member in this dir can run `python3 verify_inclusion.py` with no args and
# it self-verifies the whole published tree; pass a card hash to check just one.
log_path = sys.argv[1] if len(sys.argv)>1 else "merkle_log.json"
log=json.load(open(log_path)); root=log["root"]; target=sys.argv[2] if len(sys.argv)>2 else None
ok=bad=0
for e in log["entries"]:
    if target and e["card"]!=target: continue
    if check(e,root): ok+=1
    else: bad+=1; print(f"INVALID: index {e['index']} card {e['card'][:16]}...")
print(f"root {root[:16]}...  VALID {ok}  INVALID {bad}")
sys.exit(1 if bad or ok==0 else 0)
