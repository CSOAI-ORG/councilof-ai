#!/usr/bin/env python3
"""agent_directory_census.py - read an AGNTCY Agent Directory catalogue to exhaustion and check, from
bytes, what each record's own trust material shows.

A catalogue built on the Agent Directory Service serves GET /v1/agents?page_size=&page_token= with
{results, nextPageToken, totalCount}. Each record carries a trustManifest whose attestations are
Sigstore bundles (data: URIs), and metadata labels such as agntcy.dir.trust.v1.Status {trusted,
verified}. This reads every page, then for every attestation checks what can be checked offline:

  digest_ok             sha256(decoded bundle) == the attestation's declared digest (and size)
  signs_the_cid         the bundle's messageDigest == sha256(record CID string), i.e. the signature
                        is over this record's content address
  rekor_body_consistent the Rekor hashedrekord body names the same digest and the same signature
  signature_ok          ECDSA verify of the bundle signature over that digest with the leaf cert key
  cert_window_ok        the Rekor integratedTime falls inside the leaf certificate's validity
  inclusion_ok          the RFC 6962 inclusion proof recomputes the stated root, and the checkpoint
                        body names that root and tree size
  signer                the leaf certificate SAN (the workflow or identity that signed), and whether
                        it is the directory's own import workflow rather than the record's author

NOT CHECKED here, and reported as UNCHECKED, never as passed: the Fulcio chain to the Sigstore root,
the Rekor checkpoint and SET signatures, the RFC 3161 timestamp. Those need the Sigstore trusted root;
a later job adds them.

--bind-sample N additionally fetches N records' OASF export (GET /v1/agents/<cid>/export?format=oasf)
and checks sha256(compact JSON) == the CID's multihash digest - the step that ties the signed CID to
the bytes a reader downloads. It is a sample, labelled as one; the full population is a separate job.

Read-only. One request at a time, paced (--pace, default 1.5 s). Identifies itself in User-Agent.
The output is a census record for the lane directory. It names a third-party catalogue, so it is not
published until the owner OKs that company by name.

    python3 scripts/census/agent_directory_census.py --base https://ai-catalog.outshift.io \
        --out-dir /workspace/lanes/layer0-20260928/aicatalog/census --bind-sample 20
"""
from __future__ import annotations

import argparse
import base64
import collections
import datetime
import gzip
import hashlib
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "csoai-census/0.1 (+https://councilof.ai; read-only; one request at a time)"
IMPORTER_PREFIX = "https://github.com/agntcy/dir/.github/workflows/"
OID_ISSUER_V1 = "1.3.6.1.4.1.57264.1.1"
OID_ISSUER_V2 = "1.3.6.1.4.1.57264.1.8"


def now() -> str:
    return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get(url: str, timeout: int = 60) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"user-agent": UA, "accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()[:500]
    except OSError as e:
        return 0, str(e).encode()[:500]


def b64(s: str) -> bytes:
    return base64.b64decode(s + "=" * (-len(s) % 4))


def cid_digest(cid: str) -> bytes | None:
    """CIDv1, multibase 'b' (base32 lower) -> the sha2-256 multihash digest, else None."""
    if not cid.startswith("b"):
        return None
    s = cid[1:].upper()
    raw = base64.b32decode(s + "=" * (-len(s) % 8))
    i = raw.find(b"\x12\x20")
    if raw[:1] != b"\x01" or i < 0 or len(raw) - (i + 2) != 32:
        return None
    return raw[i + 2:]


def rfc6962_inclusion_ok(leaf_index: int, tree_size: int, leaf_hash: bytes, proof: list[bytes], root: bytes) -> bool:
    if leaf_index >= tree_size or leaf_index < 0:
        return False
    fn, sn, r = leaf_index, tree_size - 1, leaf_hash
    for p in proof:
        if sn == 0:
            return False
        if fn & 1 or fn == sn:
            r = hashlib.sha256(b"\x01" + p + r).digest()
            if not fn & 1:
                while not fn & 1 and fn != 0:
                    fn >>= 1
                    sn >>= 1
        else:
            r = hashlib.sha256(b"\x01" + r + p).digest()
        fn >>= 1
        sn >>= 1
    return sn == 0 and r == root


def check_bundle(att: dict, cid: str) -> dict:
    from cryptography import x509
    from cryptography.exceptions import InvalidSignature
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.asymmetric import ec, utils

    out: dict = {"type": att.get("type"), "mediaType": att.get("mediaType")}
    uri = att.get("uri") or ""
    if not uri.startswith("data:") or "," not in uri:
        out["state"] = "NOT_INLINE"
        return out
    raw = b64(uri.split(",", 1)[1])
    out["digest_ok"] = ("sha256:" + hashlib.sha256(raw).hexdigest()) == att.get("digest") and \
        str(len(raw)) == str(att.get("size"))
    try:
        bundle = json.loads(raw)
        ms = bundle["messageSignature"]
        digest = b64(ms["messageDigest"]["digest"])
        sig = b64(ms["signature"])
        vm = bundle["verificationMaterial"]
        cert = x509.load_der_x509_certificate(b64(vm["certificate"]["rawBytes"]))
    except (KeyError, ValueError, TypeError) as exc:
        out["state"] = "UNPARSEABLE"
        out["reason"] = type(exc).__name__
        return out
    out["signs_the_cid"] = digest == hashlib.sha256(cid.encode()).digest()
    try:
        cert.public_key().verify(sig, digest, ec.ECDSA(utils.Prehashed(hashes.SHA256())))
        out["signature_ok"] = True
    except (InvalidSignature, TypeError, ValueError, AttributeError):
        out["signature_ok"] = False
    try:
        san = cert.extensions.get_extension_for_class(x509.SubjectAlternativeName).value
        uris = san.get_values_for_type(x509.UniformResourceIdentifier)
        emails = san.get_values_for_type(x509.RFC822Name)
        out["signer"] = (uris or emails or [None])[0]
    except x509.ExtensionNotFound:
        out["signer"] = None
    issuer = None
    for ext in cert.extensions:
        if ext.oid.dotted_string == OID_ISSUER_V1:
            issuer = ext.value.value.decode(errors="replace")
        elif ext.oid.dotted_string == OID_ISSUER_V2 and issuer is None:
            v = ext.value.value
            issuer = v[2:].decode(errors="replace") if len(v) > 2 else None
    out["oidc_issuer"] = issuer
    out["signer_is_directory_importer"] = bool(out["signer"] and str(out["signer"]).startswith(IMPORTER_PREFIX))
    desc = att.get("description") or ""
    out["description_names_signer"] = bool(out["signer"]) and str(out["signer"]).replace("https://", "") in desc
    tl = (vm.get("tlogEntries") or [None])[0]
    if not tl:
        out["rekor"] = "NO_TLOG_ENTRY"
    else:
        body_bytes = b64(tl["canonicalizedBody"])
        body = json.loads(body_bytes)
        spec = body.get("spec", {})
        out["rekor_body_consistent"] = (
            spec.get("data", {}).get("hash", {}).get("value") == digest.hex()
            and spec.get("signature", {}).get("content") == ms["signature"]
        )
        it = int(tl.get("integratedTime", 0))
        nb = cert.not_valid_before_utc.timestamp()
        na = cert.not_valid_after_utc.timestamp()
        out["cert_window_ok"] = nb <= it <= na
        out["integrated_time"] = datetime.datetime.fromtimestamp(it, datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        out["rekor_log_index"] = tl.get("logIndex")
        ip = tl.get("inclusionProof")
        if ip:
            leaf = hashlib.sha256(b"\x00" + body_bytes).digest()
            root = b64(ip["rootHash"])
            ok = rfc6962_inclusion_ok(int(ip["logIndex"]), int(ip["treeSize"]), leaf, [b64(h) for h in ip.get("hashes", [])], root)
            cp = (ip.get("checkpoint") or {}).get("envelope", "")
            lines = cp.split("\n")
            cp_ok = len(lines) >= 3 and lines[1] == str(ip["treeSize"]) and lines[2] == ip["rootHash"]
            out["inclusion_ok"] = ok and cp_ok
        else:
            out["inclusion_ok"] = None
    out["unchecked"] = ["fulcio_chain_to_sigstore_root", "rekor_checkpoint_signature", "rekor_set_signature", "rfc3161_timestamp"]
    checks = [out.get(k) for k in ("digest_ok", "signs_the_cid", "signature_ok", "rekor_body_consistent", "cert_window_ok", "inclusion_ok")]
    out["state"] = "OFFLINE_CHECKS_PASS" if all(c is True for c in checks) else "OFFLINE_CHECK_FAILED"
    return out


def record_row(r: dict) -> dict:
    ident = r.get("identifier") or ""
    cid = ident.rsplit(":", 1)[-1]
    meta = r.get("metadata") or {}
    status = meta.get("agntcy.dir.trust.v1.Status") or {}
    scan = meta.get("agntcy.dir.security.v1.ScanResult")
    data = r.get("data") or {}
    sm = data.get("skill_manifest") or data.get("skillManifest") or {}
    fm = sm.get("frontmatter_metadata") or {}
    tm = r.get("trustManifest") or {}
    atts = tm.get("attestations") or []
    return {
        "cid": cid,
        "name": r.get("displayName"),
        "mediaType": r.get("mediaType"),
        "updatedAt": r.get("updatedAt"),
        "declared_author": fm.get("author"),
        "label_trusted": status.get("trusted"),
        "label_verified": status.get("verified"),
        "scan_present": bool(scan),
        "scan_reports": len(scan.get("reports", [])) if isinstance(scan, dict) else 0,
        "identity_type": tm.get("identityType"),
        "cid_decodes": cid_digest(cid) is not None,
        "attestations": [check_bundle(a, cid) for a in atts],
    }


def read_all(base: str, out_dir: Path, pace: float, page_size: int) -> tuple[list[dict], dict]:
    pages = out_dir / "pages"
    pages.mkdir(parents=True, exist_ok=True)
    token, n, rows, total, seen = "", 0, [], None, set()
    started = now()
    while True:
        q = {"page_size": str(page_size)}
        if token:
            q["page_token"] = token
        status, body = get(f"{base}/v1/agents?{urllib.parse.urlencode(q)}")
        if status != 200:
            return rows, {"state": "PARTIAL", "stopped_at_page": n, "http_status": status, "started": started}
        (pages / f"page-{n:04d}.json.gz").write_bytes(gzip.compress(body))
        d = json.loads(body)
        total = d.get("totalCount") if total is None else total
        for r in d.get("results") or []:
            row = record_row(r)
            if row["cid"] in seen:
                row["duplicate"] = True
            seen.add(row["cid"])
            rows.append(row)
        token = d.get("nextPageToken") or ""
        n += 1
        if not token or not d.get("results"):
            break
        time.sleep(pace)
    unique = len(seen)
    state = "COMPLETE" if total is not None and unique == total else "PARTIAL"
    return rows, {"state": state, "pages": n, "declared_total": total, "records_read": len(rows),
                  "unique_cids": unique, "started": started, "finished": now()}


def bind_sample(base: str, rows: list[dict], n: int, pace: float) -> dict:
    sample = sorted(rows, key=lambda r: r["cid"])[:n]
    res = collections.Counter()
    detail = []
    for r in sample:
        time.sleep(pace)
        status, body = get(f"{base}/v1/agents/{urllib.parse.quote(r['cid'], safe='')}/export?format=oasf", timeout=120)
        if status != 200:
            res["EXPORT_NOT_SERVED"] += 1
            detail.append({"cid": r["cid"], "state": "EXPORT_NOT_SERVED", "status": status})
            continue
        try:
            compact = json.dumps(json.loads(body), sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
        except ValueError:
            res["EXPORT_NOT_JSON"] += 1
            detail.append({"cid": r["cid"], "state": "EXPORT_NOT_JSON"})
            continue
        ok = hashlib.sha256(compact).digest() == cid_digest(r["cid"])
        state = "CONTENT_MATCHES_CID" if ok else "CONTENT_DIFFERS_FROM_CID"
        res[state] += 1
        detail.append({"cid": r["cid"], "state": state, "export_bytes": len(body)})
    return {"kind": "SAMPLE", "n": len(sample), "selection": "first n by CID sort order (deterministic, not random)",
            "rule": "sha256(compact key-sorted JSON of the OASF export) == CID sha2-256 multihash digest",
            "tally": dict(res), "rows": detail}


def public_signer(signer) -> str:
    """A workflow identity is an organisation's automation and is kept. A personal identity (an email
    in the certificate SAN) is never carried into a summary: it is counted, not named."""
    if not signer:
        return "none"
    s = str(signer)
    return s if s.startswith("https://") else "individual identity (redacted)"


def summarise(rows: list[dict]) -> dict:
    t: dict[str, collections.Counter] = collections.defaultdict(collections.Counter)
    for r in rows:
        t["mediaType"][r["mediaType"]] += 1
        t["label_trusted/verified"][f"{r['label_trusted']}/{r['label_verified']}"] += 1
        t["scan_present"][str(r["scan_present"])] += 1
        t["attestations_per_record"][str(len(r["attestations"]))] += 1
        t["cid_decodes"][str(r["cid_decodes"])] += 1
        for a in r["attestations"]:
            t["attestation_state"][a.get("state")] += 1
            for k in ("digest_ok", "signs_the_cid", "signature_ok", "rekor_body_consistent", "cert_window_ok",
                      "inclusion_ok", "signer_is_directory_importer", "description_names_signer"):
                t[k][str(a.get(k))] += 1
            t["signer"][public_signer(a.get("signer"))] += 1
            t["oidc_issuer"][str(a.get("oidc_issuer"))] += 1
        if r["attestations"] and all(a.get("signer_is_directory_importer") for a in r["attestations"]) and r["declared_author"]:
            t["declared_author_but_signed_by_importer"]["True"] += 1
    return {k: dict(v.most_common(25)) for k, v in t.items()}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--base", required=True)
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--pace", type=float, default=1.5)
    ap.add_argument("--page-size", type=int, default=100)
    ap.add_argument("--bind-sample", type=int, default=0)
    a = ap.parse_args(argv)
    out = Path(a.out_dir)
    out.mkdir(parents=True, exist_ok=True)
    rows, pop = read_all(a.base.rstrip("/"), out, a.pace, a.page_size)
    with gzip.open(out / "records.jsonl.gz", "wt") as f:
        for r in rows:
            f.write(json.dumps(r, sort_keys=True) + "\n")
    rec = {
        "schema": "csoai.agent-directory-census/0.1",
        "source": a.base.rstrip("/") + "/v1/agents",
        "population": pop,
        "tally": summarise(rows),
        "what_was_checked": __doc__.split("\n\n")[1].strip(),
        "not_checked": ["fulcio_chain_to_sigstore_root", "rekor_checkpoint_signature", "rekor_set_signature",
                        "rfc3161_timestamp", "content binding beyond the --bind-sample records"],
        "not_a_grade": True,
        "publication": "HELD - names a third-party catalogue; needs the owner's per-company OK",
    }
    if a.bind_sample:
        rec["content_binding"] = bind_sample(a.base.rstrip("/"), rows, a.bind_sample, a.pace)
    rec["records_sha256"] = hashlib.sha256((out / "records.jsonl.gz").read_bytes()).hexdigest()
    (out / "census.json").write_text(json.dumps(rec, indent=1) + "\n")
    print(json.dumps({"population": pop, "attestation_state": rec["tally"].get("attestation_state"),
                      "binding": rec.get("content_binding", {}).get("tally")}))
    return 0 if pop["state"] == "COMPLETE" else 3


if __name__ == "__main__":
    sys.exit(main())
