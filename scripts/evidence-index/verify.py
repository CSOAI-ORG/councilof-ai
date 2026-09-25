#!/usr/bin/env python3
"""verify.py - re-check every item in the CSOAI evidence index (csoai.evidence-index/0.1) from the bytes.

    python3 verify.py                  # index.json + index.signed.json in the current directory
    python3 verify.py --index URL      # or read them from a URL prefix (the HF dataset / councilof.ai/evidence/)
    python3 verify.py --deep           # also re-fetch every byte-checked file and every checked signature file
                                       # (lists in checks/*.json, each bound to index.json by sha256)
    python3 verify.py --only KIND      # restrict to one kind (signed-record, dataset, space, model, package, board, surface, trust-anchor)

Needs Python >= 3.8 and `cryptography` (Ed25519, ECDSA). `opentimestamps` is optional (OTS proofs are
reported NOT_CHECKED without it). Nothing here needs CSOAI code, credentials, or permission.

What it does, per item:
  * dataset / space / model  re-lists the Hugging Face repo AT THE PINNED COMMIT, rebuilds the manifest
                             (path, size, git blob oid, LFS sha256) and recomputes its sha256.
                             --deep re-downloads the byte-checked files and recomputes git-blob-SHA-1 / sha256.
  * signed-record            re-downloads the signed document at the pinned commit, recomputes sha256,
                             re-verifies the Ed25519 signature against the key pinned from
                             https://csoai.org/.well-known/did.json, and re-checks the artifact binding.
  * package                  re-downloads each distribution file, recomputes sha256 and compares with the
                             registry's declared digest (and, for npm, verifies the registry ECDSA signature).
  * board / surface / trust-anchor
                             re-downloads a LIVE url. Different bytes are reported DRIFTED (expected for a
                             live surface), never PASS; any signature the surface carries is re-verified on
                             the bytes served now.
First it verifies the index itself: sha256(index.json) must equal the signed payload, and the signature
must verify under did:web:csoai.org#board-attestation-1.

Exit status: 0 when no item FAILs (DRIFTED and NOT_CHECKED are reported, not failures), 1 otherwise.
"""
import argparse, base64, hashlib, json, os, sys, time, urllib.error, urllib.request

DID_URL = "https://csoai.org/.well-known/did.json"
BOARD_KEY = "board-attestation-1"
UA = "csoai-evidence-index-verify/0.1 (+https://huggingface.co/datasets/csoai/evidence-index)"
HF = "https://huggingface.co"


# ---------------------------------------------------------------- fetching
def fetch(url, token=None, tries=4, timeout=60, accept=None):
    h = {"user-agent": UA}
    if token and url.startswith(HF):
        h["authorization"] = "Bearer " + token
    if accept:
        h["accept"] = accept
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=h), timeout=timeout) as r:
                return r.read(), dict(r.headers)
        except urllib.error.HTTPError as e:
            last = e
            if e.code in (404, 401, 403, 410):
                raise
            time.sleep(2 + 4 * i + (10 if e.code == 429 else 0))
        except Exception as e:
            last = e
            time.sleep(2 + 3 * i)
    raise last


def fetch_json(url, token=None):
    b, h = fetch(url, token)
    return json.loads(b), h


def sha256(b):
    return hashlib.sha256(b).hexdigest()


def git_blob_oid(b):
    return hashlib.sha1(b"blob %d\0" % len(b) + b).hexdigest()


def canon(o, ascii_=False):
    return json.dumps(o, sort_keys=True, separators=(",", ":"), ensure_ascii=ascii_).encode("utf-8")


def b64u(s):
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


# ---------------------------------------------------------------- keys
def did_keys(did_bytes=None):
    """{fragment: raw 32-byte Ed25519 public key} for every OKP/Ed25519 verificationMethod in the DID doc."""
    if did_bytes is None:
        did_bytes, _ = fetch(DID_URL)
    did = json.loads(did_bytes)
    out = {}
    for m in did.get("verificationMethod", []):
        j = m.get("publicKeyJwk") or {}
        if j.get("kty") == "OKP" and j.get("crv") == "Ed25519" and j.get("x"):
            out[m["id"].split("#", 1)[1]] = b64u(j["x"])
    return out


def ed_ok(pub, sig, msg):
    from cryptography.hazmat.primitives.asymmetric import ed25519
    try:
        ed25519.Ed25519PublicKey.from_public_bytes(pub).verify(sig, msg)
        return True
    except Exception:
        return False


def key_by_hex(keys, hexpub):
    for k, v in keys.items():
        if v.hex() == (hexpub or "").lower():
            return k
    return None


def frag(did_ref):
    return (did_ref or "").split("#", 1)[1].split()[0] if "#" in (did_ref or "") else None


# ---------------------------------------------------------------- signatures
def _res(state, key=None, rule=None, detail=None, **kw):
    r = {"state": state}
    if key: r["key"] = "did:web:csoai.org#" + key
    if rule: r["rule"] = rule
    if detail: r["detail"] = detail
    r.update(kw)
    return r


def verify_signed_doc(doc, keys):
    """Verify one parsed JSON document carrying a CSOAI signature. Returns a result dict whose state is
    VERIFIED / FAILED / PRESENT_NOT_VERIFIED / PRESENT_KEY_NOT_IN_DID / UNSIGNED."""
    if not isinstance(doc, dict):
        return _res("UNSIGNED")
    # 1. csoai.signed-run/0.1 (POST /api/board-sign)
    if doc.get("schema") == "csoai.signed-run/0.1" and isinstance(doc.get("signature"), dict):
        s = doc["signature"]; k = frag(s.get("did")) or BOARD_KEY
        c = canon(doc["payload"], False)
        rule = "csoai.signed-run/0.1: Ed25519 over canonical(payload) = JSON, keys sorted recursively, no whitespace, UTF-8 literal (ensure_ascii=False)"
        if k not in keys:
            return _res("PRESENT_KEY_NOT_IN_DID", rule=rule, detail="signature.did fragment %r not in DID document" % k)
        if sha256(c) != s.get("payload_sha256"):
            return _res("FAILED", k, rule, "sha256(canonical payload) != signature.payload_sha256")
        ok = ed_ok(keys[k], bytes.fromhex(s["sig_ed25519"]), c)
        ctl = ed_ok(keys[k], bytes.fromhex(s["sig_ed25519"]), c + b" ")
        return _res("VERIFIED" if ok and not ctl else "FAILED", k, rule,
                    None if ok else "Ed25519 verification returned false", tamper_control="rejected" if not ctl else "ACCEPTED (control failed)",
                    signed_at=s.get("signed_at"), payload_sha256=s.get("payload_sha256"))
    # 2. measurement card {body, id, signature}
    if isinstance(doc.get("body"), dict) and doc.get("signature") and doc.get("id"):
        k = key_by_hex(keys, doc.get("pubkey")) if doc.get("pubkey") else frag(doc.get("did"))
        if doc.get("pubkey") and not k:
            return _res("PRESENT_KEY_NOT_IN_DID", detail="card pubkey %s is not a key in the DID document" % doc["pubkey"][:16])
        if k not in keys:
            return _res("PRESENT_KEY_NOT_IN_DID", detail="declared key %r not in DID document" % k)
        sig = bytes.fromhex(doc["signature"])
        for asc in (True, False):
            pre = canon(doc["body"], asc)
            if sha256(pre) != doc["id"]:
                continue
            for what, msg in (("preimage", pre), ("sha256 digest bytes", hashlib.sha256(pre).digest()), ("id hex text", doc["id"].encode())):
                if ed_ok(keys[k], sig, msg):
                    return _res("VERIFIED", k, "card: id == sha256(canonical(body), ensure_ascii=%s); Ed25519 over the %s" % (asc, what),
                                tamper_control="rejected" if not ed_ok(keys[k], sig, msg + b" ") else "ACCEPTED (control failed)")
            stated = "json.dumps(body" in (doc.get("preimage_rule") or "")
            return _res("FAILED" if stated else "PRESENT_NOT_VERIFIED", k, "card preimage rule as stated in the file",
                        "id matches the canonical body but the signature verifies over none of: preimage, digest, id text")
        return _res("FAILED" if "json.dumps(body" in (doc.get("preimage_rule") or "") else "PRESENT_NOT_VERIFIED", k,
                    "card", "id != sha256(canonical(body)) under either ASCII setting")
    # 3. GSPC board snapshot signed by the site (site_attestation) and its living_stamp
    if isinstance(doc.get("site_attestation"), dict):
        sa = doc["site_attestation"]; k = frag(sa.get("signer")) or BOARD_KEY
        body = {kk: vv for kk, vv in doc.items() if kk != "site_attestation"}
        c = canon(body, False)
        rule = "site_attestation: Ed25519 over RAW UTF-8 bytes of canonical(payload minus site_attestation), ensure_ascii=False"
        if k not in keys:
            return _res("PRESENT_KEY_NOT_IN_DID", rule=rule)
        ok = ed_ok(keys[k], bytes.fromhex(sa["sig"]), c)
        r = _res("VERIFIED" if ok else "FAILED", k, rule, None if ok else "Ed25519 verification returned false",
                 tamper_control="rejected" if not ed_ok(keys[k], bytes.fromhex(sa["sig"]), c + b" ") else "ACCEPTED (control failed)")
        ls = (doc.get("measured_on") or {}).get("living_stamp")
        if isinstance(ls, dict) and ls.get("signature") and isinstance(ls.get("preimage"), dict):
            lk = frag(ls.get("signer")) or BOARD_KEY
            lok = any(ed_ok(keys.get(lk, b"\0" * 32), bytes.fromhex(ls["signature"]), canon(ls["preimage"], a)) for a in (False, True))
            r["living_stamp"] = "VERIFIED under did:web:csoai.org#%s" % lk if lok else "PRESENT_NOT_VERIFIED (preimage rule not recovered)"
        return r
    # 4. MPC custody_attestation (gspc-board-22axis key)
    if isinstance(doc.get("custody_attestation"), dict):
        ca = doc["custody_attestation"]; k = frag(ca.get("signer"))
        body = {kk: vv for kk, vv in doc.items() if kk != "custody_attestation"}
        if k not in keys:
            return _res("PRESENT_KEY_NOT_IN_DID", detail="signer %r not in DID document" % ca.get("signer"))
        sig = base64.b64decode(ca.get("sig_b64", ""))
        for asc in (False, True):
            c = canon(body, asc)
            if ed_ok(keys[k], sig, c):
                return _res("VERIFIED", k, "custody_attestation: Ed25519 over canonical(payload minus custody_attestation), ensure_ascii=%s" % asc,
                            content_id_match=(sha256(c) == ca.get("content_id")))
        return _res("PRESENT_NOT_VERIFIED", k, "custody_attestation", "no canonicalisation tried verifies; the file names scripts/gspc-board-verify.mjs as its verifier")
    # 5. public root envelope
    if doc.get("kind") == "csoai.public-root/v1" and doc.get("sig_ed25519"):
        k = frag(doc.get("did_intended")) or BOARD_KEY
        pre = {x: doc[x] for x in ("kind", "schema", "as_of", "merkle_root", "card_count", "did_intended")}
        ok = any(ed_ok(keys[k], bytes.fromhex(doc["sig_ed25519"]), canon(pre, a)) for a in (False, True))
        leaves = doc.get("card_sha256") or []
        mr = merkle_root_dup(leaves)
        return _res("VERIFIED" if ok else "FAILED", k, "public-root/v1: Ed25519 over canonical({kind,schema,as_of,merkle_root,card_count,did_intended})",
                    None if ok else "Ed25519 verification returned false",
                    merkle_root_recomputed=(mr == doc.get("merkle_root")), len_equals_card_count=(len(leaves) == doc.get("card_count")))
    # 6. JWS general serialization (signatures[])
    if isinstance(doc.get("signatures"), list) and doc["signatures"] and isinstance(doc["signatures"][0], dict) and doc["signatures"][0].get("protected"):
        s0 = doc["signatures"][0]
        try:
            hdr = json.loads(b64u(s0["protected"]))
        except Exception:
            return _res("PRESENT_NOT_VERIFIED", detail="JWS protected header does not decode")
        k = frag(hdr.get("kid"))
        if k not in keys:
            return _res("PRESENT_KEY_NOT_IN_DID", detail="JWS kid %r not in DID document" % hdr.get("kid"))
        body = {kk: vv for kk, vv in doc.items() if kk != "signatures"}
        sig = b64u(s0["signature"])
        cands = []
        if isinstance(doc.get("payload"), str):
            cands.append(("JWS payload member", doc["payload"].encode()))
        for asc in (False, True):
            p = canon(body, asc)
            cands.append(("b64url(canonical(doc minus signatures), ensure_ascii=%s)" % asc, base64.urlsafe_b64encode(p).rstrip(b"=")))
        for what, p64 in cands:
            if ed_ok(keys[k], sig, s0["protected"].encode() + b"." + p64):
                return _res("VERIFIED", k, "JWS EdDSA, signing input protected.%s" % what)
        return _res("PRESENT_NOT_VERIFIED", k, "JWS EdDSA", "payload encoding not recovered by the candidates tried (detached payload, canonical JSON)")
    # 7. anything else with an Ed25519 signature and an embedded key
    if doc.get("sig_ed25519") and doc.get("pubkey_ed25519"):
        k = key_by_hex(keys, doc["pubkey_ed25519"])
        if not k:
            return _res("PRESENT_KEY_NOT_IN_DID", detail="embedded pubkey %s... is not a key in the DID document; self-consistency is not authenticity" % doc["pubkey_ed25519"][:16])
        return _res("PRESENT_NOT_VERIFIED", k, detail="preimage rule not stated")
    for f in ("signature", "sig", "sig_ed25519", "signatures"):
        if doc.get(f):
            return _res("PRESENT_NOT_VERIFIED", detail="a %r field is present but its format is not one this verifier knows" % f)
    return _res("UNSIGNED")


def merkle_root_dup(hexleaves):
    """public-root/v1 tree: sha256(left||right) over raw digests, odd node paired with itself, no prefix."""
    lvl = [bytes.fromhex(h) for h in hexleaves]
    if not lvl:
        return None
    while len(lvl) > 1:
        if len(lvl) % 2:
            lvl.append(lvl[-1])
        lvl = [hashlib.sha256(lvl[i] + lvl[i + 1]).digest() for i in range(0, len(lvl), 2)]
    return lvl[0].hex()


# ---------------------------------------------------------------- OpenTimestamps
_BLOCKS = {}


def btc_merkle(height):
    if height not in _BLOCKS:
        for base in ("https://blockstream.info/api", "https://mempool.space/api"):
            try:
                h, _ = fetch("%s/block-height/%d" % (base, height))
                info, _ = fetch_json("%s/block/%s" % (base, h.decode().strip()))
                _BLOCKS[height] = (info["merkle_root"], base)
                break
            except Exception:
                continue
        else:
            _BLOCKS[height] = (None, None)
    return _BLOCKS[height]


def ots_inspect(proof, target_sha256=None):
    try:
        from opentimestamps.core.timestamp import DetachedTimestampFile
        from opentimestamps.core.serialize import BytesDeserializationContext
        from opentimestamps.core.notary import PendingAttestation, BitcoinBlockHeaderAttestation
    except Exception:
        return {"state": "NOT_CHECKED", "detail": "python package opentimestamps not installed"}
    try:
        d = DetachedTimestampFile.deserialize(BytesDeserializationContext(proof))
    except Exception as e:
        return {"state": "UNPARSEABLE", "detail": "%s: %s" % (type(e).__name__, str(e)[:80])}
    r = {"file_digest": d.file_digest.hex(), "pending_calendars": [], "bitcoin": []}
    if target_sha256:
        r["binds_to_target"] = (d.file_digest.hex() == target_sha256)
    for msg, att in d.timestamp.all_attestations():
        if isinstance(att, PendingAttestation):
            r["pending_calendars"].append(att.uri)
        elif isinstance(att, BitcoinBlockHeaderAttestation):
            mr, src = btc_merkle(att.height)
            r["bitcoin"].append({"height": att.height, "header_merkle_root_matches": (mr == msg[::-1].hex()) if mr else None,
                                 "checked_against": src or "UNREACHABLE"})
    if any(b["header_merkle_root_matches"] for b in r["bitcoin"]):
        r["state"] = "bitcoin-attested"
    elif r["bitcoin"]:
        r["state"] = "bitcoin-attestation-present-not-confirmed"
    elif r["pending_calendars"]:
        r["state"] = "pending"
    else:
        r["state"] = "none"
    return r


# ---------------------------------------------------------------- Hugging Face manifests
def hf_prefix(kind):
    return {"datasets": "datasets/", "spaces": "spaces/", "models": ""}[kind]


def hf_resolve(kind, repo, rev, path):
    return "%s/%s%s/resolve/%s/%s" % (HF, hf_prefix(kind), repo, rev, urllib.request.quote(path))


def hf_tree(kind, repo, rev, token=None):
    files = []
    url = "%s/api/%s/%s/tree/%s?recursive=true&expand=false" % (HF, kind, repo, rev)
    while url:
        b, h = fetch(url, token)
        files += [f for f in json.loads(b) if f.get("type") == "file"]
        url = None
        for part in (h.get("Link") or h.get("link") or "").split(","):
            if 'rel="next"' in part:
                url = part.split(";")[0].strip().strip("<>")
    return files


def hf_manifest(kind, repo, rev, files):
    m = {"schema": "csoai.evidence-index.hf-manifest/0.1", "repo": "%s/%s" % (kind, repo), "revision": rev,
         "files": sorted(({"path": f["path"], "size": f["size"], "git_oid": f.get("oid"),
                           "lfs_sha256": (f.get("lfs") or {}).get("oid")} for f in files), key=lambda x: x["path"])}
    b = canon(m, False)
    return m, b, sha256(b)


def check_file_bytes(b, entry):
    """True when the downloaded bytes match the manifest entry (LFS sha256, else git blob oid)."""
    if entry.get("lfs_sha256"):
        return sha256(b) == entry["lfs_sha256"]
    return git_blob_oid(b) == entry.get("git_oid")


# ---------------------------------------------------------------- packages
def npm_sig_ok(name, version, integrity, sigs, npm_keys):
    from cryptography.hazmat.primitives.asymmetric import ec
    from cryptography.hazmat.primitives import hashes, serialization
    msg = ("%s@%s:%s" % (name, version, integrity)).encode()
    for s in sigs or []:
        k = [x for x in npm_keys if x["keyid"] == s.get("keyid")]
        if not k:
            continue
        pk = serialization.load_der_public_key(base64.b64decode(k[0]["key"]))
        try:
            pk.verify(base64.b64decode(s["sig"]), msg, ec.ECDSA(hashes.SHA256()))
            return True
        except Exception:
            return False
    return None


# ---------------------------------------------------------------- per-item verification
def verify_item(it, keys, deep=False, token=None, load=None):
    c = it["check"]; t = c["type"]
    try:
        if t == "hf_repo":
            files = hf_tree(c["hf_kind"], c["repo"], c["revision"], token)
            _, _, h = hf_manifest(c["hf_kind"], c["repo"], c["revision"], files)
            if h != it["content_sha256"]:
                return "FAIL", "manifest sha256 %s != indexed %s" % (h[:12], it["content_sha256"][:12])
            note = "manifest sha256 matches (%d files)" % len(files)
            if deep:
                ent = {f["path"]: {"git_oid": f.get("oid"), "lfs_sha256": (f.get("lfs") or {}).get("oid")} for f in files}
                bad = 0
                if c.get("checks_file"):
                    cb = load(c["checks_file"])
                    if sha256(cb) != c["checks_sha256"]:
                        return "FAIL", "%s sha256 does not match the index" % c["checks_file"]
                    c = dict(c, **json.loads(cb))
                for p in c.get("byte_checked_paths", []):
                    b, _ = fetch(hf_resolve(c["hf_kind"], c["repo"], c["revision"], p), token)
                    bad += not check_file_bytes(b, ent[p])
                for p, exp in (c.get("signature_checks") or {}).items():
                    b, _ = fetch(hf_resolve(c["hf_kind"], c["repo"], c["revision"], p), token)
                    got = verify_signed_doc(json.loads(b), keys)["state"]
                    bad += (got != exp)
                if bad:
                    return "FAIL", "%d byte/signature re-checks differ" % bad
                note += "; deep: %d files re-hashed, %d signatures re-verified" % (len(c.get("byte_checked_paths", [])), len(c.get("signature_checks") or {}))
            return "PASS", note
        if t == "signed_record":
            b, _ = fetch(c["url"], token)
            if sha256(b) != it["content_sha256"]:
                return "FAIL", "signed document sha256 changed"
            r = verify_signed_doc(json.loads(b), keys)
            if r["state"] != it["signature"]["state"]:
                return "FAIL", "signature state %s != indexed %s" % (r["state"], it["signature"]["state"])
            if c.get("artifact_url"):
                a, _ = fetch(c["artifact_url"], token)
                if sha256(a) != c["artifact_sha256"]:
                    return "FAIL", "artifact sha256 changed"
            return "PASS", "bytes identical; signature %s" % r["state"]
        if t == "url_bytes":
            b, _ = fetch(c["url"])
            same = sha256(b) == it["content_sha256"]
            sig = ""
            if c.get("signature_rule"):
                if c["signature_rule"] == "card_index_rows":
                    sig = "; rows: use --deep" if not deep else "; rows: %s" % card_index_rows(json.loads(b), keys)["summary"]
                else:
                    r = verify_signed_doc(json.loads(b), keys)
                    sig = "; signature on the bytes served now: %s" % r["state"]
                    if r["state"] == "FAILED":
                        return "FAIL", "signature on current bytes FAILED" + ("" if same else " (bytes drifted)")
            if same:
                return "PASS", "bytes identical" + sig
            return ("DRIFTED" if c.get("live") else "FAIL"), "live surface bytes differ from the indexed sha256" + sig
        if t == "package":
            out = []
            npm_keys = None
            for f in c["files"]:
                b, _ = fetch(f["url"])
                if sha256(b) != f["sha256"]:
                    return "FAIL", "%s sha256 changed" % f["filename"]
                if f.get("registry_sha256") and f["registry_sha256"] != f["sha256"]:
                    return "FAIL", "%s registry digest mismatch" % f["filename"]
                if f.get("npm_integrity"):
                    alg, dg = f["npm_integrity"].split("-", 1)
                    if base64.b64encode(hashlib.new(alg, b).digest()).decode() != dg:
                        return "FAIL", "npm integrity mismatch"
                out.append(f["filename"])
            return "PASS", "%d distribution file(s) re-hashed" % len(out)
    except Exception as e:
        return "FAIL", "%s: %s" % (type(e).__name__, str(e)[:120])
    return "NOT_CHECKED", "unknown check type %r" % t


def card_index_rows(ci, keys, fetcher=None, base="https://councilof.ai"):
    """Fetch every card listed in /signed/card_index.json and verify it under #card-attestation-1."""
    fetcher = fetcher or (lambda u: fetch(u)[0])
    n = v = f = 0; wrong_key = 0
    for row in ci.get("cards", []):
        n += 1
        if key_by_hex(keys, row.get("pubkey")) != "card-attestation-1":
            wrong_key += 1
        try:
            doc = json.loads(fetcher(base + row["card_url"]))
            r = verify_signed_doc(doc, keys)
            ok = r["state"] == "VERIFIED" and doc.get("id") == row.get("card") and r.get("key", "").endswith("#card-attestation-1")
        except Exception:
            ok = False
        v += ok; f += (not ok)
    return {"rows": n, "verified": v, "not_verified": f, "rows_with_other_key": wrong_key,
            "summary": "%d of %d rows VERIFIED under did:web:csoai.org#card-attestation-1" % (v, n)}


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--index", default=".", help="directory or URL prefix holding index.json + index.signed.json")
    ap.add_argument("--deep", action="store_true")
    ap.add_argument("--only")
    a = ap.parse_args()
    token = os.environ.get("HF_TOKEN")

    def load(name):
        if a.index.startswith("http"):
            return fetch(a.index.rstrip("/") + "/" + name, token)[0]
        return open(os.path.join(a.index, name), "rb").read()
    raw = load("index.json"); signed = json.loads(load("index.signed.json"))
    keys = did_keys()
    s = verify_signed_doc(signed, keys)
    bound = signed["payload"]["artifact"]["sha256"] == sha256(raw)
    print("INDEX index.json sha256=%s signature=%s key=%s bound_to_index=%s" % (sha256(raw), s["state"], s.get("key"), bound))
    if s["state"] != "VERIFIED" or not bound or not s.get("key", "").endswith("#" + BOARD_KEY):
        print("RESULT index signature does not verify; stopping"); sys.exit(1)
    idx = json.loads(raw)
    tally = {}
    for it in idx["items"]:
        if a.only and it["kind"] != a.only:
            continue
        st, note = verify_item(it, keys, a.deep, token, load)
        tally[st] = tally.get(st, 0) + 1
        print("%-11s %-14s %s  %s" % (st, it["kind"], it["id"], note), flush=True)
    tot = sum(tally.values())
    print("RESULT pass=%d drifted=%d fail=%d not_checked=%d of %d items%s" % (
        tally.get("PASS", 0), tally.get("DRIFTED", 0), tally.get("FAIL", 0), tally.get("NOT_CHECKED", 0), tot, " (deep)" if a.deep else ""))
    sys.exit(1 if tally.get("FAIL") else 0)


if __name__ == "__main__":
    main()
