#!/usr/bin/env python3
"""Stages the signed-record CANDIDATE for this measurement: unsigned, state SIGN_PENDING. Usage: make_candidate.py <lane_dir>

It signs nothing and calls nothing. It writes candidate/cobol-fidelity-v2.record.SIGN_PENDING.json holding
`sign_payload` (ASCII, canonical form <= 3072 bytes, the limit of scripts/arena/board_sign.py) whose sha256 values
commit to results.jsonl, the corpus and the independent check. Per-field detail stays in results.jsonl.
No timestamps: two runs on the same bytes write the same file."""
import hashlib, json, os, sys
from collections import Counter

LANE = sys.argv[1]
P = lambda *a: os.path.join(LANE, *a)
H = lambda p: hashlib.sha256(open(P(p), "rb").read()).hexdigest()
EXP = json.load(open(P("corpus/expected.json")))
DEC = json.load(open(P("decoders.json")))
SUM = json.load(open(P("work/summary.json")))
VV = json.load(open(P("work/verify_vectors.json")))
ROWS = [json.loads(l) for l in open(P("results.jsonl"))]


def tree_sha(root):
    h = hashlib.sha256()
    for dp, _, fs in sorted(os.walk(P(root))):
        for f in sorted(fs):
            rel = os.path.relpath(os.path.join(dp, f), P(root))
            h.update(rel.encode() + b"\0" + hashlib.sha256(open(os.path.join(dp, f), "rb").read()).digest())
    return h.hexdigest()


c = SUM["counts"]
v1_identical = None
if os.path.exists(P("v1-baseline/results.jsonl")):
    v1l = open(P("v1-baseline/results.jsonl")).read().splitlines()
    v1_identical = v1l == [l for l in open(P("results.jsonl")).read().splitlines() if int(json.loads(l)["copybook"][1:3]) <= 41]
verd = Counter(r["verdict"] for r in ROWS)
payload = {
    "kind": "csoai.measurement-record/cobol-decoder-fidelity",
    "corpus_version": 2,
    "lane": "cobol-v2-20260928",
    "measures": "what each decoder emitted for COBOL record bytes whose meaning is known by construction",
    "not": "not a certification, rating, ranking, grade or score of any decoder",
    "counts": {"copybooks": c["copybooks"], "records": c["records"], "compared_fields": c["compared_fields"],
               "rdw_files": c["rdw_files"], "decoder_configurations": c["decoders_measured"], "result_rows": c["rows"]},
    "verdicts": dict(sorted(verd.items())),
    "decoders": sorted(d["id"] + " " + d["version"].split(" (")[0].split(",")[0] for d in DEC["measured"]),
    "unmeasured_rdw": sorted(d["id"] for d in DEC["measured"] if "entry" not in d["rdw"]),
    "self": "cobol-bridge-mcp UNMEASURED (no decode path); sister product, not ranked",
    "corpus_check": {"ok": VV["ok"], "values_equal": VV["stats"]["values_equal"], "mustfail_refused": VV["stats"]["mustfail_refused"],
                     "offset_checks": VV["stats"]["offset_checks"], "published_vector_checks": VV["stats"]["anchors"]},
    "v1_rows_byte_identical": v1_identical,
    "sha256": {"results.jsonl": H("results.jsonl"), "corpus/expected.json": H("corpus/expected.json"),
               "corpus_tree": tree_sha("corpus"), "work/verify_vectors.json": H("work/verify_vectors.json"),
               "decoders.json": H("decoders.json")},
    "licence_corpus": "CC0-1.0",
}
canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
assert all(b < 128 for b in canon), "board signer requires ASCII"
assert len(canon) <= 3072, len(canon)
cand = {
    "schema": "csoai.record-candidate/0",
    "state": "SIGN_PENDING",
    "signature": None,
    "signer_intended": "did:web:csoai.org#board-attestation-1",
    "sign_payload": payload,
    "sign_payload_canonical_bytes": len(canon),
    "sign_payload_sha256": hashlib.sha256(canon).hexdigest(),
    "how_to_sign": "owner-gated: after the integrator lands lane/cobol-v2-20260928, on a host holding the board-sign caller token, "
                   "python3 -c \"import json,sys; sys.path.insert(0,'scripts/arena'); import board_sign as b; "
                   "c=json.load(open('<this file>')); print(json.dumps(b.sign_payload(c['sign_payload'], '<token file>')))\" "
                   "— board_sign verifies the returned signature against the DID document before it is used.",
    "held": "HELD for the owner: signing makes this a record under the board key; where it is published (not on the board: "
            "it has no axis) is an owner decision. Nothing here has been signed, published or sent.",
}
os.makedirs(P("candidate"), exist_ok=True)
with open(P("candidate/cobol-fidelity-v2.record.SIGN_PENDING.json"), "w") as fh:
    json.dump(cand, fh, indent=1, sort_keys=True, ensure_ascii=True); fh.write("\n")
print(json.dumps({"state": cand["state"], "canonical_bytes": len(canon), "sign_payload_sha256": cand["sign_payload_sha256"]}))
