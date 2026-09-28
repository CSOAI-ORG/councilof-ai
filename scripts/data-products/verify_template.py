#!/usr/bin/env python3
"""Offline verifier for this CSOAI dataset. Run from the dataset root:

    python3 verify.py                     # fetches the board key from https://csoai.org/.well-known/did.json
    python3 verify.py --pubkey-x <x>      # fully offline: base64url x of the Ed25519 JWK

Checks every *.signed.json listed below: sha256 of the canonical payload (keys sorted, no whitespace,
UTF-8) equals signature.payload_sha256; the Ed25519 signature verifies under the DID key it names; the
artifact the payload pins hashes to the pinned sha256; and two tampered copies are rejected. Then the
dataset-specific checks (row-file pins, capsule ids and RFC 6962 roots, derived tables) and every file
in manifest.jsonl. Prints one line per check; exits 0 only if every check holds.
Needs `cryptography`; the derived-table checks also need `pyarrow`.
"""
import argparse
import base64
import gzip
import hashlib
import json
import os
import sys
import urllib.request

CHECKS = json.loads(r'''__CHECKS__''')
UA = "csoai-dataset-verify/1.0 (+https://huggingface.co/datasets/csoai)"
BAD = []


def ok(cond, what):
    print(("OK       " if cond else "MISMATCH ") + what)
    if not cond:
        BAD.append(what)


def sha(b):
    return hashlib.sha256(b).hexdigest()


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def read(p):
    with open(p, "rb") as f:
        return f.read()


def keys(x):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    out = {}
    if x:
        out["#board-attestation-1"] = x
    else:
        req = urllib.request.Request("https://csoai.org/.well-known/did.json", headers={"User-Agent": UA})
        did = json.load(urllib.request.urlopen(req, timeout=30))
        for m in did.get("verificationMethod", []):
            j = m.get("publicKeyJwk") or {}
            if j.get("crv") == "Ed25519":
                out["#" + m["id"].split("#")[-1]] = j["x"]
    return {k: Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(v + "=" * (-len(v) % 4))) for k, v in out.items()}


def check_signed(rel, ks):
    s = json.loads(read(rel))
    p, sig = s["payload"], s["signature"]
    c = canon(p)
    ok(sha(c) == sig["payload_sha256"], f"{rel}: sha256(canonical payload) = payload_sha256")
    k = ks.get("#" + sig["did"].split("#")[-1])
    if k is None:
        ok(False, f"{rel}: key {sig['did']} present")
        return p
    try:
        k.verify(bytes.fromhex(sig["sig_ed25519"]), c)
        ok(True, f"{rel}: Ed25519 signature verifies under {sig['did']}")
    except Exception:
        ok(False, f"{rel}: Ed25519 signature verifies under {sig['did']}")
    t = dict(p)
    t["__tamper__"] = 1
    flipped = bytearray(c)
    flipped[len(flipped) // 2] ^= 1
    rejected = 0
    for bad in (canon(t), bytes(flipped)):
        try:
            k.verify(bytes.fromhex(sig["sig_ed25519"]), bad)
        except Exception:
            rejected += 1
    ok(rejected == 2, f"{rel}: tamper controls rejected ({rejected}/2)")
    art = p.get("artifact") if isinstance(p, dict) else None
    if isinstance(art, dict) and art.get("sha256"):
        local = rel[: -len(".signed.json")] + ".json"
        ok(os.path.exists(local) and sha(read(local)) == art["sha256"], f"{rel}: {local} hashes to payload.artifact.sha256")
    return p


# ------------------------------------------------------------------ derived tables
def g(d, *ks):
    for k in ks:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d


def strl(v):
    return [x if isinstance(x, str) else json.dumps(x, sort_keys=True) for x in v] if isinstance(v, list) else None


def to_int(v):
    return v if isinstance(v, int) and not isinstance(v, bool) else (len(v) if isinstance(v, list) else None)


def eb_row(s):
    dd = s.get("drop_detail")
    return {"name": s.get("name"), "title": s.get("title"), "url": s.get("url"),
            "declared_transport": s.get("declared_transport"), "outcome": s.get("outcome"),
            "drop_reason": s.get("drop_reason"), "drop_detail": dd if isinstance(dd, (str, type(None))) else json.dumps(dd, sort_keys=True),
            "protocol_version": s.get("protocol_version"), "server_name": g(s, "server_info", "name"),
            "server_version": g(s, "server_info", "version"), "n_tools": to_int(s.get("n_tools")),
            "read_only_tools": strl(s.get("read_only_tools")), "p1_declared": g(s, "P1", "declared"),
            "p1_fields": strl(g(s, "P1", "fields")), "p2_status": g(s, "P2", "status"), "p3_status": g(s, "P3", "status"),
            "p4_present": g(s, "P4", "present"), "p4_fields": strl(g(s, "P4", "fields")),
            "http_requests": to_int(s.get("http_requests")), "calls_used": to_int(s.get("calls_used")),
            "started_at": s.get("started_at"), "finished_at": s.get("finished_at"), "row_sha256": sha(canon(s))}


def parquet_rows(p):
    import pyarrow.parquet as pq
    return pq.read_table(p).to_pylist()


def same_rows(path, want, key=None):
    got = parquet_rows(path)
    if key:
        got, want = sorted(got, key=key), sorted(want, key=key)
    ok(got == want, f"{path}: {len(got)} rows equal the re-derivation from the verbatim files")


def rfc6962_root(leaves):
    if not leaves:
        return hashlib.sha256(b"").digest()
    if len(leaves) == 1:
        return hashlib.sha256(b"\x00" + leaves[0]).digest()
    k = 1
    while k * 2 < len(leaves):
        k *= 2
    return hashlib.sha256(b"\x01" + rfc6962_root(leaves[:k]) + rfc6962_root(leaves[k:])).digest()


def check_capsules(c):
    rows, by_batch = [], {}
    for b in c["batches"]:
        rb = read(f"{b}/record.json")
        rec = json.loads(rb)
        p = json.loads(read(f"{b}/record.signed.json"))["payload"]
        gz = read(f"{b}/capsules.jsonl.gz")
        raw = gzip.decompress(gz)
        ok(sha(gz) == rec["capsules_file"]["sha256"], f"{b}: capsules.jsonl.gz sha256 = record.json")
        ok(sha(raw) == rec["capsules_file"]["uncompressed_sha256"], f"{b}: decompressed capsules sha256 = record.json")
        if "capsules_sha256" in p:
            ok(p["capsules_sha256"] == rec["capsules_file"]["sha256"], f"{b}: signed payload pins the capsule file")
        ids, good = [], True
        for line in raw.decode("utf-8").splitlines():
            cap = json.loads(line)
            good &= canon(cap) == line.encode("utf-8")
            good &= sha(canon({k: v for k, v in cap.items() if k != "capsule_id"})) == cap["capsule_id"]
            ids.append(cap["capsule_id"])
            rows.append({"adapter": rec["adapter"], "batch": b.split("/")[-1], "batch_merkle_root": rec["merkle_root"],
                         "batch_record_sha256": sha(rb), "capsule_id": cap["capsule_id"], "kind": cap.get("kind"),
                         "measurement_state": cap.get("measurement_state"), "subject_id": cap.get("subject_id"),
                         "observed_at": cap.get("observed_at"), "statement": (cap.get("claim") or {}).get("statement"),
                         "has_correction_pointer": cap.get("correction_pointer") is not None, "capsule_json": line})
        ok(good, f"{b}: {len(ids)} capsules canonical, capsule_id = sha256(capsule without capsule_id)")
        root = rfc6962_root([bytes.fromhex(i) for i in sorted(ids)]).hex()
        ok(root == rec["merkle_root"] and p.get("merkle_root", root) == root, f"{b}: RFC 6962 root {root[:16]}... = record and payload")
        ok(len(ids) == rec["n_capsules"], f"{b}: n_capsules {len(ids)}")
        by_batch[rec["merkle_root"]] = (rec, sha(rb))
    idx = json.loads(read(c["index"]))
    ip = json.loads(read(c["index"][:-5] + ".signed.json"))["payload"]
    listed = {bb[2]: bb for bb in ip["batches"]}
    ok(set(listed) == set(by_batch), f"{c['index']}: signed index lists exactly the {len(by_batch)} batch roots present")
    ok(all(listed[r][1] == by_batch[r][0]["n_capsules"] and listed[r][3] == by_batch[r][1] for r in listed if r in by_batch),
       "signed index: each batch's count and record sha256 match")
    ok(ip["n_capsules_total"] == len(rows) == idx["n_capsules_total"], f"index: n_capsules_total {len(rows)}")
    rows.sort(key=lambda r: (r["adapter"], r["batch"], r["capsule_id"]))
    same_rows("data/capsules.parquet", rows)


def check_state(c):
    m = c["month"]
    d = json.loads(read(f"{m}/numbers.json"))
    src = d["sources"]
    nums = []
    for k, v in sorted(d["numbers"].items()):
        s = src.get(v["source"], {})
        val = v["value"]
        nums.append({"key": k, "what": v["what"], "value_int": val if isinstance(val, int) and not isinstance(val, bool) else None,
                     "value_text": val if isinstance(val, str) else None, "source": v["source"], "recompute": v["recompute"],
                     "source_path": s.get("path"), "source_sha256": s.get("sha256"), "source_public_copy": s.get("public_copy"),
                     "source_board_signature": s.get("board_signature")})
    same_rows(f"data/numbers-{m}.parquet", nums)
    cols = ["what", "path", "sha256", "public_copy", "board_signature", "signature_pins_this_sha256", "signed_at"]
    same_rows(f"data/sources-{m}.parquet", [{"source": k, **{x: v.get(x) for x in cols}} for k, v in sorted(src.items())])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pubkey-x", default=None)
    ap.add_argument("--skip-derived", action="store_true", help="skip the checks that need pyarrow")
    a = ap.parse_args()
    ks = keys(a.pubkey_x)
    for rel in CHECKS["signed"]:
        check_signed(rel, ks)
    for pin in CHECKS.get("row_pins", []):
        p = json.loads(read(pin["signed"]))["payload"]
        b = read(pin["file"])
        got = sha(b) if pin["pin"] == "file bytes" else sha(gzip.decompress(b))
        ok(got == p[pin["field"]], f"{pin['file']}: {pin['pin']} hash to payload.{pin['field']}")
    if not a.skip_derived:
        if CHECKS.get("derive") == "effect_binding":
            art = json.loads(read(CHECKS["artifact"]))
            same_rows("data/third_party_servers.parquet", [eb_row(s) for s in art["third_party"]["servers"]])
            same_rows("data/self_servers.parquet", [eb_row(s) for s in art["self"]["servers"]])
        elif CHECKS.get("derive") == "capsules":
            check_capsules(CHECKS)
        elif CHECKS.get("derive") == "state":
            check_state(CHECKS)
    elif CHECKS.get("derive") == "capsules":
        print("note: --skip-derived also skips the capsule id and Merkle checks")
    n = 0
    for line in open("manifest.jsonl", encoding="utf-8"):
        r = json.loads(line)
        b = read(r["path"]) if os.path.exists(r["path"]) else None
        good = b is not None and len(b) == r["bytes"] and sha(b) == r["sha256"]
        n += 1
        if not good:
            ok(False, f"manifest: {r['path']}")
    ok(True, f"manifest: {n} files checked")
    print("ALL CHECKS HOLD" if not BAD else f"{len(BAD)} CHECK(S) DID NOT HOLD")
    sys.exit(0 if not BAD else 1)


if __name__ == "__main__":
    main()
