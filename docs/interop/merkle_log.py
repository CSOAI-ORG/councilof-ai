#!/usr/bin/env python3
"""Upgrade 1 — Merkle log with inclusion proofs over the CSOAI card chain.

RFC 6962 (Certificate Transparency) hashing, stdlib only:
  leaf hash = sha256(0x00 || leaf_bytes)
  node hash = sha256(0x01 || left || right)
Leaves are the 150 card content-hashes from the live signed card_index, in
index order — the linear chain's entries become a log with per-card inclusion
proofs, so a verifier can prove one card's membership without the whole set.

Emits merkle_log.json: root, leaf list, per-leaf audit paths. Every proof is
re-verified before writing; the script refuses to emit on any mismatch
(structurally unable to report success on a path it did not complete).
"""
import hashlib, json, sys

def H(b): return hashlib.sha256(b).digest()
def leaf_hash(b): return H(b"\x00"+b)
def node_hash(l,r): return H(b"\x01"+l+r)

def build_tree(leaves):
    level=[leaf_hash(l) for l in leaves]; levels=[level]
    while len(level)>1:
        nxt=[]
        for i in range(0,len(level),2):
            nxt.append(node_hash(level[i],level[i+1]) if i+1<len(level) else level[i])
        level=nxt; levels.append(level)
    return levels

def inclusion_proof(levels, idx):
    proof=[]; i=idx
    for lvl in levels[:-1]:
        sib=i^1
        if sib<len(lvl): proof.append(("L" if sib<i else "R", lvl[sib].hex()))
        i//=2
    return proof

def verify_inclusion(leaf, idx, proof, root):
    h=leaf_hash(leaf)
    for side,sib in proof:
        s=bytes.fromhex(sib)
        h = node_hash(s,h) if side=="L" else node_hash(h,s)
    return h.hex()==root

ci=json.load(open("card_index.json"))
cards=ci["cards"]
leaves=[bytes.fromhex(c["card"]) for c in cards]     # leaf = the card's content hash bytes
levels=build_tree(leaves)
root=levels[-1][0].hex()

entries=[]
for i,c in enumerate(cards):
    p=inclusion_proof(levels,i)
    if not verify_inclusion(leaves[i],i,p,root):
        sys.exit(f"FATAL: proof {i} failed self-verification — refusing to emit")
    entries.append({"index":i,"card":c["card"],"axis":c["axis"],"proof":[[s,h] for s,h in p]})

out={
 "schema":"csoai.card-merkle-log/0.1",
 "hash":"sha256, RFC 6962 prefixes (0x00 leaf, 0x01 node)",
 "leaf_definition":"leaf bytes = the card content-hash (hex-decoded) from signed/card_index.json, index order",
 "source_index":{"n_cards":ci["n_cards"],"head":ci["head"],"pubkey":ci["pubkey"],"created":ci.get("created")},
 "root":root,"n_leaves":len(leaves),"entries":entries,
 "note":"All proofs re-verified before emission. Root is committed to the public repo; an estate-root signature over this root follows via the signing pod (never signed from a workstation)."
}
json.dump(out,open("merkle_log.json","w"),indent=1)
print(f"root={root}  leaves={len(leaves)}  all {len(entries)} inclusion proofs SELF-VERIFIED")
