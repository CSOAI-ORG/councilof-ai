#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Verify a disclosure-completeness record set (Council of AI, councilof.ai).

    python3 verify.py                       # every record: bytes, signed payload, Ed25519 signature
    python3 verify.py --did-doc did.json    # the same, with the key pinned from a local did.json (no network)
    python3 verify.py --recompute BLOBDIR   # also re-run each measurement from its input bytes

Run it inside the set directory (the one holding set.json), after downloading the set's files:
    set.json, verify.py, method/adapters.py, <slug>/record.json and <slug>/record.signed.json for each record.

Signature rule: canonicalise record.signed.json's payload (JSON, keys sorted, no whitespace, UTF-8, non-ASCII kept);
its sha256 must equal signature.payload_sha256; payload.artifact.sha256 must equal the sha256 of record.json's bytes;
sig_ed25519 (hex) must verify under the #board-attestation-1 Ed25519 key in https://csoai.org/.well-known/did.json.

Recompute rule: BLOBDIR holds input bytes named by their sha256 (as pinned in each record's measurement.inputs).
method/adapters.py must hash to the pinned code_sha256; the named measure is re-run and its result compared with the
record field for field. A missing input makes that record UNCHECKABLE, never a pass. Needs `cryptography`; the
LMArena recompute also needs `pyarrow`. Exit 0 only when every check that ran passed and at least one ran.
"""
import argparse, base64, hashlib, importlib.util, json, os, sys, urllib.request

DID_URL = "https://csoai.org/.well-known/did.json"
KEY_ID = "#board-attestation-1"


def canon(o):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def sha(b):
    return hashlib.sha256(b).hexdigest()


def board_key(did_doc):
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    if did_doc:
        doc = json.load(open(did_doc))
    else:
        req = urllib.request.Request(DID_URL, headers={"User-Agent": "csoai-verify/0.1"})
        doc = json.load(urllib.request.urlopen(req, timeout=30))
    for m in doc.get("verificationMethod", []):
        if m.get("id", "").endswith(KEY_ID):
            x = m["publicKeyJwk"]["x"]
            return Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=" * (-len(x) % 4)))
    raise SystemExit("no %s key in the DID document" % KEY_ID)


def check_signature(pub, raw, signed):
    pay, sg = signed["payload"], signed["signature"]
    if sha(canon(pay)) != sg["payload_sha256"]:
        return "payload does not hash to signature.payload_sha256"
    if pay["artifact"]["sha256"] != sha(raw):
        return "record.json bytes do not match payload.artifact.sha256"
    try:
        pub.verify(bytes.fromhex(sg["sig_ed25519"]), canon(pay))
    except Exception:
        return "Ed25519 signature does not verify"
    return None


def load_adapters(path, want):
    code = open(path, "rb").read()
    if sha(code) != want:
        raise SystemExit("method/adapters.py does not hash to the pinned code_sha256")
    spec = importlib.util.spec_from_file_location("csoai_adapters", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def recompute(ad, rec, blobdir):
    """Returns (state, detail): MATCH, DIFFERS or UNCHECKABLE."""
    m = rec["measurement"]
    blobs, missing = {}, []
    for p in m["inputs"]:
        fp = os.path.join(blobdir, p["sha256"])
        if not os.path.exists(fp):
            missing.append(p["source_id"]); continue
        b = open(fp, "rb").read()
        if sha(b) != p["sha256"]:
            return "UNCHECKABLE", "%s: blob does not hash to its pinned sha256" % p["source_id"]
        blobs[p["source_id"]] = b
    if missing:
        return "UNCHECKABLE", "%d pinned inputs not in %s (first: %s)" % (len(missing), blobdir, missing[0])
    name = m["measure"]
    if name == "swebench.logs_pointer_share":
        res = ad.swebench_measure(blobs["swebench-com--benchmark-platform"]); um = res.pop("unmeasured")
    elif name == "epoch.date_and_n_stated":
        res = ad.epoch_measure(blobs["epoch-ai--leaderboard"]); um = []
    elif name == "lmarena.publish_lag_and_n":
        per = {k.split(":", 1)[1]: v for k, v in blobs.items() if k.startswith("lmarena-latest:")}
        trees = {k.split(":", 1)[1]: v for k, v in blobs.items() if k.startswith("lmarena-tree:")}
        res = ad.lmarena_measure(blobs["lmarena-dataset-api"], per, trees); um = res.pop("unmeasured")
        um = um + [u for u in m["unmeasured"] if u not in um]   # configs never fetched are carried from the record
    elif name == "openrouter_hf.declared_field_agreement":
        hf = {}
        for k, v in blobs.items():
            for kind in ("model", "config"):
                if k.startswith("hf-%s:" % kind):
                    hf.setdefault(k.split(":", 1)[1], {})[kind] = (v, "ok")
        # Fetches that failed have no bytes to pin; their HTTP status is carried by the record's own rows.
        for row in m["result"]["per_model"]:
            cl, li = row["context_length"], row["licence"]
            if cl.get("state") == "UNMEASURED" and str(cl.get("reason", "")).startswith("HF config.json: "):
                hf.setdefault(row["hf_id"], {})["config"] = (None, cl["reason"][len("HF config.json: "):])
            if li.get("hf_model_info") not in (None, "ok"):
                hf.setdefault(row["hf_id"], {})["model"] = (None, li["hf_model_info"])
        res = ad.openrouter_hf_measure(blobs["openrouter-ai--compute"], hf); um = []
    else:
        return "UNCHECKABLE", "unknown measure %s" % name
    if res != m["result"]:
        diff = sorted(k for k in set(res) | set(m["result"]) if res.get(k) != m["result"].get(k))
        return "DIFFERS", "result fields differ: %s" % diff
    if um != (m.get("unmeasured") or []):
        return "DIFFERS", "unmeasured list differs"
    return "MATCH", "result and unmeasured recomputed field for field"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=os.path.dirname(os.path.abspath(__file__)))
    ap.add_argument("--did-doc")
    ap.add_argument("--recompute", metavar="BLOBDIR")
    a = ap.parse_args()
    st = json.load(open(os.path.join(a.dir, "set.json")))
    pub = board_key(a.did_doc)
    ad = None
    if a.recompute:
        ad = load_adapters(os.path.join(a.dir, "method", "adapters.py"), st["method_code_sha256"])
    ok, ran, out = True, 0, []
    for r in st["records"]:
        raw = open(os.path.join(a.dir, r["path"]), "rb").read()
        signed = json.load(open(os.path.join(a.dir, r["signed"])))
        line = {"record_id": r["record_id"]}
        if sha(raw) != r["sha256"]:
            line["bytes"] = "DIFFERS from set.json"; ok = False
        err = check_signature(pub, raw, signed)
        line["signature"] = "VERIFIES" if err is None else "FAILS: " + err
        ok &= err is None; ran += 1
        rec = json.loads(raw)
        if rec["recompute"]["code_sha256"] != st["method_code_sha256"]:
            line["method"] = "record pins different code than the set"; ok = False
        if ad is not None:
            state, detail = recompute(ad, rec, a.recompute)
            line["recompute"] = "%s (%s)" % (state, detail)
            if state == "DIFFERS":
                ok = False
        out.append(line)
    print(json.dumps({"set": st["set"], "records": out, "all_pass": ok and ran > 0}, indent=1))
    sys.exit(0 if ok and ran > 0 else 1)


if __name__ == "__main__":
    main()
