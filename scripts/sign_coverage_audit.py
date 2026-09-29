#!/usr/bin/env python3
"""sign_coverage_audit.py — "ALL SIGNED": does every public record family that claims a
signature actually verify, LIVE, under did:web:csoai.org?

For each family it fetches the served bytes (never the repo copy), pins the keys from
https://csoai.org/.well-known/did.json (fetched once, then used as a pinned document), runs the
estate's own verifier where one exists, and records one of four states per artifact:

    VALID        the signature verifies over the served bytes under a key the DID publishes
    INVALID      a signature is present and does not verify (or its digest does not recompute)
    UNSIGNED     no signature is carried (hash-only or plain records)
    UNCHECKABLE  cannot be decided against the DID: fetch failed, the artifact declares itself
                 unverifiable, the key is not in the DID document, or the shape is unknown

Every family that yields a VALID also runs a FAILING CONTROL: one byte of a signed field is
changed and the same verifier must answer INVALID. A family whose control does not fail is
reported as CONTROL-FAILED and its VALIDs are not trusted.

Nothing is signed, stamped or written to the site. Output: a JSON result and a Markdown table.

    uv run --python 3.12 --with cryptography --with opentimestamps \
        python scripts/sign_coverage_audit.py --out-json out.json --out-md COVERAGE.md

Scope notes printed with the table:
  * a VALID proves who signed the bytes and that they have not changed, not that a number is right;
  * "claims to be signed" is read from the served artifact (a signature block, a *.signed.json
    name, or a verify instruction), never assumed;
  * OTS proofs are read from the git tree at HEAD (the canon), because served .ots bytes are the
    same files; a proof is "pending" when it carries no Bitcoin block-header attestation.
"""
from __future__ import annotations

import argparse
import base64
import concurrent.futures as cf
import copy
import datetime as dt
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import urllib.error
import urllib.request
from decimal import Decimal
from pathlib import Path

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

HERE = Path(__file__).resolve().parent
REPO = HERE.parent
sys.path.insert(0, str(HERE))
import verify_signed as vs  # noqa: E402  (the estate's own multi-style verifier)

SITE = "https://councilof.ai"
DID_URL = "https://csoai.org/.well-known/did.json"
UA = {"user-agent": "csoai-sign-coverage-audit/0.1"}

VALID, INVALID, UNSIGNED, UNCHECKABLE = "VALID", "INVALID", "UNSIGNED", "UNCHECKABLE"


# ----------------------------------------------------------------------------------- fetching
def fetch(url: str, timeout: int = 40, tries: int = 3) -> tuple[int, bytes]:
    last = None
    for _ in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, b""
        except Exception as e:  # network blip: retry
            last = e
    raise RuntimeError(f"fetch failed {url}: {last}")


def site_url(path: str) -> str:
    return SITE + "/" + path.removeprefix("public/").lstrip("/")


# ------------------------------------------------------------------------------ canonicalisers
def js_number(x) -> str:
    """ECMAScript Number::toString for a finite binary64 (what JSON.stringify emits)."""
    if isinstance(x, bool):
        return "true" if x else "false"
    if isinstance(x, int):
        return str(x)
    if x != x or x in (float("inf"), float("-inf")):
        return "null"
    if x == 0:
        return "0"
    sign = "-" if x < 0 else ""
    d = Decimal(repr(abs(x)))  # shortest round-trip digits, as ES requires
    _, digits, e = d.as_tuple()
    ds = "".join(map(str, digits)).rstrip("0") or "0"
    e += len(digits) - len(ds)
    k, n = len(ds), e + len(ds)
    if k <= n <= 21:
        out = ds + "0" * (n - k)
    elif 0 < n <= 21:
        out = ds[:n] + "." + ds[n:]
    elif -6 < n <= 0:
        out = "0." + "0" * (-n) + ds
    else:
        e1 = n - 1
        es = ("+" if e1 >= 0 else "-") + str(abs(e1))
        out = (ds if k == 1 else ds[0] + "." + ds[1:]) + "e" + es
    return sign + out


_INDEX_KEY = re.compile(r"^(0|[1-9][0-9]*)$")


def canon_js(obj) -> bytes:
    """functions/_lib/cardSign.ts canonicalBytes: JSON.stringify over a key-sorted copy.
    Faithful to two engine behaviours a Python port usually misses: integral floats print as
    integers, and array-index keys ("7", "30") are emitted first in numeric order because
    that is the property order of a JS object, whatever order they were inserted in."""
    def enc(v) -> str:
        if v is None:
            return "null"
        if isinstance(v, (bool, int, float)):
            return js_number(v)
        if isinstance(v, str):
            return json.dumps(v, ensure_ascii=False)
        if isinstance(v, list):
            return "[" + ",".join(enc(i) for i in v) + "]"
        if isinstance(v, dict):
            keys = sorted(v)
            idx = sorted((k for k in keys if _INDEX_KEY.match(k) and int(k) < 2**32 - 1), key=int)
            rest = [k for k in keys if k not in set(idx)]
            return "{" + ",".join(json.dumps(k, ensure_ascii=False) + ":" + enc(v[k]) for k in idx + rest) + "}"
        raise TypeError(type(v).__name__)
    return enc(obj).encode("utf-8")


def canon_py(obj, ascii_: bool) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=ascii_).encode("utf-8")


READINGS = [
    ("js-stringify-sorted", canon_js),
    ("py-compact-utf8", lambda o: canon_py(o, False)),
    ("py-compact-ascii", lambda o: canon_py(o, True)),
]


# ----------------------------------------------------------------------------------- the DID
class Did:
    def __init__(self, doc: dict, source: str):
        self.doc, self.source = doc, source
        self.keys: dict[str, bytes] = {}
        for vm in doc.get("verificationMethod", []):
            x = vm.get("publicKeyJwk", {}).get("x")
            if x:
                self.keys[vm["id"].split("#")[-1]] = base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
        self.by_raw = {v: k for k, v in self.keys.items()}

    def kid_of(self, did_or_kid: str) -> str | None:
        k = (did_or_kid or "").split("#")[-1]
        if did_or_kid.startswith("did:") and not did_or_kid.startswith("did:web:csoai.org#"):
            return None
        return k if k in self.keys else None

    def verify(self, kid: str, sig: bytes, msg: bytes) -> bool:
        try:
            Ed25519PublicKey.from_public_bytes(self.keys[kid]).verify(sig, msg)
            return True
        except (InvalidSignature, ValueError):
            return False


def R(state, reason="", **kw):
    return {"state": state, "reason": reason, **kw}


# ------------------------------------------------------------------------------ verifiers
def v_payload_envelope(doc: dict, did: Did) -> dict:
    """{payload, signature:{did, sig_ed25519 (hex), payload_sha256}} — POST /api/board-sign output."""
    sig, payload = doc["signature"], doc["payload"]
    kid = did.kid_of(sig.get("did", ""))
    if not kid:
        return R(UNCHECKABLE, f"signing key {sig.get('did')!r} is not in the DID document")
    want = sig.get("payload_sha256")
    for name, fn in READINGS:
        try:
            b = fn(payload)
        except Exception:
            continue
        if want and hashlib.sha256(b).hexdigest() != want:
            continue
        if did.verify(kid, bytes.fromhex(sig["sig_ed25519"]), b):
            return R(VALID, f"Ed25519 over {name} payload bytes", kid=kid, reading=name)
        if want:
            return R(INVALID, f"payload_sha256 recomputes ({name}) but the signature does not verify", kid=kid)
    return R(INVALID, "no canonical reading of the payload hashes to signature.payload_sha256", kid=kid)


def v_payload_toplevel(doc: dict, did: Did) -> dict:
    """{payload, sig_ed25519 (hex), key: did-url} — scripts/sign_interop_artifact.py output: Ed25519 over the
    canonical payload bytes; no payload_sha256 is published, so each documented reading is tried and the
    one that verifies is named."""
    kid = did.kid_of(str(doc.get("key", "")))
    if not kid:
        return R(UNCHECKABLE, f"key {doc.get('key')!r} is not in the DID document")
    sig = bytes.fromhex(doc["sig_ed25519"])
    for name, fn in READINGS:
        try:
            if did.verify(kid, sig, fn(doc["payload"])):
                return R(VALID, f"Ed25519 over {name} payload bytes", kid=kid, reading=name)
        except Exception:
            continue
    return R(INVALID, "no canonical reading of the payload verifies", kid=kid)


def v_verify_signed(doc: dict, did: Did, did_path: str) -> dict:
    """Signals and other styles A / B / B-DID / C, through scripts/verify_signed.py, plus the DID
    anchoring that styles A and B do not do on their own (they carry their own key)."""
    if doc.get("verifiable") is False or doc.get("verification_state") == "UNVERIFIABLE":
        return R(UNCHECKABLE, "artifact declares itself UNVERIFIABLE", declared=True)
    s = doc.get("signature")
    try:
        if isinstance(s, str) and "did" in doc and "body" in doc:
            note = vs.verify_style_c(doc, did_path); kid = did.kid_of(doc["did"])
        elif isinstance(s, str) and "signer" in doc:
            note = vs.verify_style_a(doc); kid = did.by_raw.get(bytes.fromhex(doc["signer"]))
        elif isinstance(s, dict) and "sig_ed25519" in s and "did" in s:
            note = vs.verify_style_b_did(doc, did_path); kid = did.kid_of(s["did"])
        elif isinstance(s, dict) and "pubkey" in s:
            note = vs.verify_style_b(doc); kid = did.by_raw.get(base64.b64decode(s["pubkey"]))
        else:
            return R(UNCHECKABLE, "unknown signature shape")
    except InvalidSignature:
        return R(INVALID, "signature does not verify over the served bytes")
    except AssertionError as e:
        return R(INVALID, str(e))
    except SystemExit as e:  # the verifier's own GATE/UNCHECKABLE exits
        return R(UNCHECKABLE, str(e))
    if not kid:
        return R(UNCHECKABLE, "self-consistent, but the embedded key is not in the DID document (unanchored)")
    return R(VALID, note.split(":")[0], kid=kid)


def v_card_pubkey(doc: dict, did: Did) -> dict:
    """card-v0 shape {alg, body, id, preimage_rule, pubkey(hex), signature(hex)}: HOW-TO-VERIFY.md rule."""
    kid = did.by_raw.get(bytes.fromhex(doc.get("pubkey", "")))
    if not kid:
        return R(UNCHECKABLE, "pubkey is not a key in the DID document")
    pre = canon_py(doc["body"], True)
    if hashlib.sha256(pre).hexdigest() != doc["id"]:
        return R(INVALID, "id != sha256(canonical body)", kid=kid)
    ok = did.verify(kid, bytes.fromhex(doc["signature"]), pre)
    return R(VALID if ok else INVALID, "Ed25519 over canonical body (CPython ensure_ascii rule)", kid=kid)


def v_rule_b_cid(doc: dict, did: Did) -> dict:
    """arena_scoreboard / eat_compliance_board: Ed25519 over content_id as ASCII hex (verify-estate rule B)."""
    s = doc["signature"]
    body = {k: v for k, v in doc.items() if k != "signature"}
    cid = hashlib.sha256(canon_js(body)).hexdigest()
    if cid != s.get("content_id"):
        return R(INVALID, "content_id does not recompute")
    kid = did.kid_of(s.get("kid", ""))
    if not kid:
        return R(UNCHECKABLE, "kid not in DID document")
    ok = did.verify(kid, bytes.fromhex(s["sig"]), cid.encode())
    return R(VALID if ok else INVALID, "Ed25519 over content_id (rule B)", kid=kid)


def v_root(doc: dict, did: Did) -> dict:
    fields = ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"]
    pre = canon_js({k: doc[k] for k in fields if k in doc})
    kid = did.kid_of(doc.get("did_intended", ""))
    if not kid:
        return R(UNCHECKABLE, "did_intended not in DID")
    ok = did.verify(kid, bytes.fromhex(doc["sig_ed25519"]), pre)
    return R(VALID if ok else INVALID, "Ed25519 over the six-field root statement", kid=kid)


def v_site_attestation(doc: dict, did: Did) -> dict:
    sa = doc["site_attestation"]
    kid = did.kid_of(sa.get("signer", ""))
    if not kid:
        return R(UNCHECKABLE, "signer not in DID")
    if base64.urlsafe_b64decode(sa["public_key_x"] + "=" * (-len(sa["public_key_x"]) % 4)) != did.keys[kid]:
        return R(INVALID, "public_key_x differs from the DID key", kid=kid)
    body = {k: v for k, v in doc.items() if k != "site_attestation"}
    ok = did.verify(kid, bytes.fromhex(sa["sig"]), canon_js(body))
    return R(VALID if ok else INVALID, "Ed25519 over canonical body minus site_attestation (sig_input rule)", kid=kid)


def run_cmd(cmd: list[str], timeout=900) -> tuple[int, str]:
    p = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, timeout=timeout)
    return p.returncode, p.stdout + p.stderr


# ------------------------------------------------------------------------------ controls
def first_string_path(o, path=()):
    if isinstance(o, dict):
        for k in sorted(o):
            r = first_string_path(o[k], path + (k,))
            if r:
                return r
    elif isinstance(o, list):
        for i, v in enumerate(o):
            r = first_string_path(v, path + (i,))
            if r:
                return r
    elif isinstance(o, str) and o:
        return path
    return None


_NOT_BODY = ("signature", "content_id", "id", "signer", "signed", "sig_input", "pubkey", "did", "sig_ed25519",
             "site_attestation", "board_attestation", "custody_attestation", "verify", "local_verification")


def tamper(doc: dict, under: str | None) -> dict:
    d = copy.deepcopy(doc)
    root = d[under] if under else {k: v for k, v in d.items() if k not in _NOT_BODY}
    p = first_string_path(root)
    tgt = d[under] if under else d
    for k in p[:-1]:
        tgt = tgt[k]
    tgt[p[-1]] = tgt[p[-1]][:-1] + ("X" if tgt[p[-1]][-1:] != "X" else "Y")
    return d


# ------------------------------------------------------------------------------ families
def tree(prefix="public") -> list[str]:
    out = subprocess.run(["git", "ls-tree", "-r", "--name-only", "HEAD", prefix], cwd=REPO,
                         capture_output=True, text=True, check=True).stdout.split("\n")
    return [p for p in out if p]


def get_json(url):
    code, b = fetch(url)
    if code != 200:
        return code, None, b
    try:
        return code, json.loads(b), b
    except Exception:
        return code, None, b


def run_family(fid, label, urls, verify_fn, did, *, under=None, bind=False, workers=8, claim=""):
    rows, first_valid = [], None

    def one(u):
        code, doc, raw = get_json(u)
        if doc is None:
            return u, R(UNCHECKABLE, f"HTTP {code}" if code != 200 else "not JSON"), None, raw
        try:
            r = verify_fn(doc)
        except Exception as e:
            r = R(UNCHECKABLE, f"verifier error {type(e).__name__}: {e}")
        if bind and r["state"] == VALID:
            r["binding"] = check_binding(doc, u)
        return u, r, doc, raw

    with cf.ThreadPoolExecutor(workers) as ex:
        for u, r, doc, raw in ex.map(one, urls):
            rows.append({"url": u, **r})
            if r["state"] == VALID and first_valid is None:
                first_valid = (u, doc)
    control = None
    if first_valid:
        try:
            cr = verify_fn(tamper(first_valid[1], under))
            control = {"url": first_valid[0], "state": cr["state"], "held": cr["state"] == INVALID}
        except Exception as e:
            control = {"url": first_valid[0], "state": f"error {e}", "held": False}
    return summarise(fid, label, rows, control, claim)


def check_binding(doc, signed_url: str | None = None) -> dict:
    a = (doc.get("payload") or {}).get("artifact") if isinstance(doc.get("payload"), dict) else None
    if not isinstance(a, dict) or not a.get("sha256"):
        return {"state": "n/a"}
    loc = a.get("url") or a.get("path") or a.get("href")
    if not loc:
        return {"state": "UNRESOLVED", "reason": "artifact has sha256 but no path/url"}
    if loc.startswith("http"):
        url = loc
    elif "/" not in loc and signed_url:  # a bare file name is relative to the signed record
        url = signed_url.rsplit("/", 1)[0] + "/" + loc
    else:
        url = site_url(loc)
    code, b = fetch(url)
    moved = None
    if code != 200 and signed_url and signed_url.endswith(".signed.json"):
        sib = signed_url[: -len(".signed.json")] + ".json"
        c2, b2 = fetch(sib)
        if c2 == 200:
            moved, code, b = url, c2, b2
            url = sib
    if code != 200:
        return {"state": "UNRESOLVED", "reason": f"HTTP {code} {url}"}
    got = hashlib.sha256(b).hexdigest()
    if moved and got == a["sha256"]:
        return {"state": "OK-MOVED", "url": url, "signed_path_404": moved}
    return {"state": "OK" if got == a["sha256"] else "MISMATCH", "url": url,
            **({} if got == a["sha256"] else {"signed": a["sha256"], "served": got})}


def summarise(fid, label, rows, control, claim):
    c = {s: sum(1 for r in rows if r["state"] == s) for s in (VALID, INVALID, UNSIGNED, UNCHECKABLE)}
    binds = [r.get("binding", {}).get("state") for r in rows if r.get("binding")]
    return {"family": fid, "label": label, "claim": claim, "n": len(rows), **c,
            "keys": sorted({r.get("kid") for r in rows if r.get("kid")}),
            "control": control,
            "binding": {s: binds.count(s) for s in sorted(set(binds))} if binds else None,
            "exceptions": [r for r in rows if r["state"] != VALID][:40]
                          + [r for r in rows if r.get("binding", {}).get("state") in ("MISMATCH", "UNRESOLVED", "OK-MOVED")][:20],
            "rows": rows}


# ------------------------------------------------------------------------------ OTS
def ots_scan(now: dt.datetime, hours=72) -> dict:
    from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
    from opentimestamps.core.serialize import BytesDeserializationContext
    from opentimestamps.core.timestamp import DetachedTimestampFile
    files = [p for p in tree() if p.endswith(".ots")]
    btc, pending, broken = [], [], []
    for p in files:
        try:
            raw = subprocess.run(["git", "show", f"HEAD:{p}"], cwd=REPO, capture_output=True, check=True).stdout
            t = DetachedTimestampFile.deserialize(BytesDeserializationContext(raw))
            atts = [a for _, a in t.timestamp.all_attestations()]
            if any(isinstance(a, BitcoinBlockHeaderAttestation) for a in atts):
                btc.append(p)
            elif any(isinstance(a, PendingAttestation) for a in atts):
                pending.append(p)
            else:
                broken.append((p, "no attestation"))
        except Exception as e:
            broken.append((p, type(e).__name__))
    last: dict[str, str] = {}
    log = subprocess.run(["git", "log", "--diff-filter=AM", "--format=%x00%cI", "--name-only", "HEAD", "--", "public"],
                         cwd=REPO, capture_output=True, text=True).stdout
    for chunk in log.split("\x00")[1:]:
        lines = chunk.strip().split("\n")
        for f in lines[1:]:
            if f.endswith(".ots") and f not in last:
                last[f] = lines[0]
    stale = []
    for p in pending:
        added = last.get(p)
        if added:
            age = (now - dt.datetime.fromisoformat(added)).total_seconds() / 3600
            if age > hours:
                stale.append({"path": p, "last_written": added, "age_h": round(age, 1)})
    return {"scope": "git tree HEAD public/**/*.ots", "n": len(files), "bitcoin_attested": len(btc),
            "pending_only": len(pending), "not_a_proof": len(broken), "not_a_proof_list": broken[:40],
            f"pending_over_{hours}h": len(stale), "stale": sorted(stale, key=lambda s: -s["age_h"])}


# ------------------------------------------------------------------------------ main
def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-json", required=True)
    ap.add_argument("--out-md")
    ap.add_argument("--no-ots", action="store_true")
    ap.add_argument("--families", help="comma list to run (default all)")
    a = ap.parse_args(argv)
    now = dt.datetime.now(dt.timezone.utc)
    want = set(a.families.split(",")) if a.families else None
    run = lambda f: want is None or f in want  # noqa: E731

    code, did_raw = fetch(DID_URL)
    did_doc = json.loads(did_raw)
    did = Did(did_doc, DID_URL)
    did_tmp = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False)
    json.dump(did_doc, did_tmp); did_tmp.close()
    out = {"schema": "csoai.sign-coverage/0.1", "checked_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
           "did": {"url": DID_URL, "sha256": hashlib.sha256(did_raw).hexdigest(), "keys": sorted(did.keys)},
           "site": SITE, "tree_head": subprocess.run(["git", "rev-parse", "HEAD"], cwd=REPO, capture_output=True,
                                                     text=True).stdout.strip(), "families": []}
    fam = out["families"].append
    pub = tree()

    # 0. the trust root itself: do the three DID copies publish the same keys?
    if run("did"):
        c2, alt = fetch(SITE + "/.well-known/did.json")
        repo_copy = json.loads((REPO / "public/.well-known/did.json").read_text()) if (REPO / "public/.well-known/did.json").exists() else {}
        kx = lambda d: sorted((v["id"], v.get("publicKeyJwk", {}).get("x")) for v in d.get("verificationMethod", []))  # noqa: E731
        ad = json.loads(alt) if c2 == 200 else {}
        notes = sorted(k for k in set(did_doc) | set(ad) if k.startswith("_") and did_doc.get(k) != ad.get(k))
        out["did"]["copies"] = {"councilof.ai": {"keys_equal": kx(ad) == kx(did_doc), "sha256": hashlib.sha256(alt).hexdigest(),
                                                 "note_fields_differ": notes},
                                "repo public/.well-known/did.json": {"keys_equal": kx(repo_copy) == kx(did_doc)}}

    if run("root"):
        r = run_family("root", "Public root (/root.json)", [SITE + "/root.json"], lambda d: v_root(d, did), did,
                       claim="sig_ed25519 + did_intended")
        c, w = get_json(SITE + "/interop/root-witness-latest.json")[:2]
        if w:
            _, rb = fetch(SITE + "/root.json")
            ws = w.get("witnesses") or {}
            rk = ws.get("rekor") or {}
            rk_check = None
            if rk.get("logIndex") is not None:
                try:
                    _, ent = get_json(f"https://rekor.sigstore.dev/api/v1/log/entries?logIndex={rk['logIndex']}")[:2]
                    body = json.loads(base64.b64decode(list(ent.values())[0]["body"]))
                    root = json.loads(rb)
                    pre = canon_js({k: root[k] for k in ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"] if k in root})
                    rk_check = body["spec"]["data"]["hash"]["value"] == hashlib.sha256(pre).hexdigest()
                except Exception as e:
                    rk_check = f"error {type(e).__name__}"
            r["witness"] = {"witnessed_sha256_matches_served": (w.get("artifact") or {}).get("sha256") == hashlib.sha256(rb).hexdigest(),
                            "rekor_logIndex": rk.get("logIndex"), "rekor_entry_hash_equals_root_preimage": rk_check,
                            "ots": (ws.get("ots") or {}).get("status"), "ots_path": (ws.get("ots") or {}).get("path"),
                            "witness_as_of": w.get("as_of")}
        fam(r)

    if run("cards"):
        rc, txt = run_cmd(["node", "scripts/verify-estate.mjs"])
        m = re.search(r"Ed25519 signature valid\s*:\s*(\d+)/(\d+)", txt)
        valid, n = (int(m.group(1)), int(m.group(2))) if m else (0, 0)
        _, idx = get_json(SITE + "/signed/card_index.json")[:2]
        ctl = None
        if idx:
            first = idx["cards"][0]
            path = first.get("path") or first.get("url") or f"/signed/cards/{first.get('id') or first.get('card')}.json"
            _, card = get_json(site_url(path))[:2]
            if card:
                ok = v_card_pubkey(card, did)
                bad = v_card_pubkey(tamper(card, "body"), did)
                ctl = {"url": site_url(path), "self_check": ok["state"], "state": bad["state"], "held": bad["state"] == INVALID and ok["state"] == VALID}
        fam({"family": "card_chain", "label": "Signed card index — corpus 3 (/signed/card_index.json + /signed/cards/*)",
             "claim": "Ed25519 per card, #card-attestation-1", "n": n, VALID: valid, INVALID: n - valid if rc == 0 else None,
             UNSIGNED: 0, UNCHECKABLE: 0 if m else 1, "keys": ["card-attestation-1"], "control": ctl,
             "verifier": "scripts/verify-estate.mjs (exit %d)" % rc, "exceptions": [] if rc == 0 else [txt[-800:]]})
        fam(run_family("chain_manifest", "Card chain manifest (/signed/chain.json)", [SITE + "/signed/chain.json"],
                       lambda d: v_card_pubkey(d, did), did, under="body", claim="card-shaped envelope"))
        fam(run_family("rule_b_boards", "Rule-B boards (/signed/arena_scoreboard.json, eat_compliance_board.json)",
                       [SITE + "/signed/arena_scoreboard.json", SITE + "/signed/eat_compliance_board.json"],
                       lambda d: v_rule_b_cid(d, did), did, claim="signature.content_id + kid"))

    if run("corrections"):
        _, raw = fetch(SITE + "/api/corrections")
        p = Path(tempfile.mkstemp(suffix=".json")[1]); p.write_bytes(raw)
        rc, txt = run_cmd([sys.executable, "scripts/verify_corrections_signature.py", "--file", str(p), "--json"])
        res = json.loads(txt[txt.index("{"):]) if "{" in txt else {}
        doc = json.loads(raw)
        doc["corrections"][0]["id"] = str(doc["corrections"][0].get("id", "")) + "X"
        p.write_text(json.dumps(doc))
        rc2, txt2 = run_cmd([sys.executable, "scripts/verify_corrections_signature.py", "--file", str(p), "--json"])
        res2 = json.loads(txt2[txt2.index("{"):]) if "{" in txt2 else {}
        st = res.get("state", UNCHECKABLE)
        fam({"family": "corrections", "label": "Corrections ledger (/api/corrections)", "claim": "detached attestation",
             "n": 1, VALID: int(st == VALID), INVALID: int(st == INVALID), UNSIGNED: 0, UNCHECKABLE: int(st not in (VALID, INVALID)),
             "keys": [res.get("verified_under", "").split("#")[-1]] if st == VALID else [], "entries": res.get("entries"),
             "control": {"state": res2.get("state"), "held": res2.get("state") not in (VALID, None), "edit": "corrections[0].id"},
             "verifier": "scripts/verify_corrections_signature.py", "exceptions": []})

    if run("board"):
        rows = []
        for f in ("gspc-board.signed.json", "gspc-board.2026-09-25.signed.json"):
            _, raw = fetch(SITE + "/signed/" + f)
            p = Path(tempfile.mkstemp(suffix=".json")[1]); p.write_bytes(raw)
            rc, txt = run_cmd(["node", "scripts/gspc-board-verify.mjs", str(p), "--did", did_tmp.name])
            d = json.loads(raw); d["note"] = d.get("note", "") + " "
            p.write_text(json.dumps(d))
            rc2, _ = run_cmd(["node", "scripts/gspc-board-verify.mjs", str(p), "--did", did_tmp.name])
            kid = (re.search(r"signer\s*:\s*did:web:csoai.org#([\w-]+)", txt) or [None, None])[1]
            rows.append({"url": SITE + "/signed/" + f, "state": VALID if rc == 0 else INVALID, "kid": kid,
                         "control_held": rc2 != 0})
        _, g = get_json(SITE + "/api/gspc")[:2]
        sa = v_site_attestation(g, did) if g else R(UNCHECKABLE, "fetch")
        sa_ctl = v_site_attestation(tamper(g, None), did)["state"] if sa["state"] == VALID else None
        rows.append({"url": SITE + "/api/gspc#site_attestation", **sa, "control_held": sa_ctl == INVALID if sa_ctl else None})
        _, lb = get_json(SITE + "/signed/board_living.json")[:2]
        rows.append({"url": SITE + "/signed/board_living.json", **v_verify_signed(lb, did, did_tmp.name)})
        s = summarise("board", "Board attestations (freezes, live stamp, living board)", rows, None,
                      "custody_attestation / board_attestation / site_attestation / living stamp")
        s["control"] = {"held": all(r.get("control_held") is not False for r in rows),
                        "per_row": {r["url"].rsplit("/", 1)[-1]: r.get("control_held") for r in rows}}
        s["verifier"] = "scripts/gspc-board-verify.mjs --did; site_attestation per its sig_input"
        fam(s)

    sig_json = [p for p in pub if p.endswith(".signed.json")]
    groups = [
        ("signals", "Axis signals (/signals/*.signed.json)", lambda p: p.startswith("public/signals/"), "vs", None),
        ("capsules", "Measurement-capsule records (/measurement-capsules/v0.2/**.signed.json)",
         lambda p: p.startswith("public/measurement-capsules/"), "env", "payload"),
        ("disclosure_lag", "Disclosure-lag records (/measurements/disclosure-lag/*/record.signed.json)",
         lambda p: p.startswith("public/measurements/disclosure-lag/"), "env", "payload"),
        ("claims", "Claims registers (/claims/*.signed.json)", lambda p: p.startswith("public/claims/"), "env", "payload"),
        ("interop_records", "Interop records + censuses (/interop/**.signed.json)",
         lambda p: p.startswith("public/interop/"), "auto", None),
        ("other_signed", "Other *.signed.json (evidence index, state numbers, x402 activity)",
         lambda p: not p.startswith(("public/signals/", "public/measurement-capsules/", "public/measurements/disclosure-lag/",
                                     "public/claims/", "public/interop/", "public/signed/")), "auto", None),
    ]

    def auto(d):
        if isinstance(d.get("payload"), dict) and isinstance(d.get("signature"), dict) and "sig_ed25519" in d["signature"]:
            return v_payload_envelope(d, did)
        if isinstance(d.get("payload"), dict) and isinstance(d.get("sig_ed25519"), str) and d.get("key"):
            return v_payload_toplevel(d, did)
        if "board_attestation" in d or "custody_attestation" in d:
            return R(UNCHECKABLE, "board-freeze shape: use gspc-board-verify.mjs")
        if "signature" not in d and "sig_ed25519" not in d:
            return R(UNSIGNED, "named *.signed.json but carries no signature block")
        return v_verify_signed(d, did, did_tmp.name)

    for fid, label, pred, kind, under in groups:
        if not run(fid):
            continue
        urls = [site_url(p) for p in sig_json if pred(p)]
        fn = {"vs": lambda d: v_verify_signed(d, did, did_tmp.name), "env": lambda d: v_payload_envelope(d, did), "auto": auto}[kind]
        fam(run_family(fid, label, urls, fn, did, under=under, bind=True, claim="*.signed.json"))

    if run("mill_cards"):
        urls = [site_url(p) for p in pub if re.match(r"public/interop/mill-cards-signed/signed-.*\.json$", p)]
        fam(run_family("mill_cards", "Signed mill cards (/interop/mill-cards-signed/signed-*.json)", urls,
                       lambda d: v_verify_signed(d, did, did_tmp.name), did, under="body", workers=8, claim="style C"))

    if run("agent_card"):
        _, raw = fetch(SITE + "/.well-known/agent-card.json")
        p = Path(tempfile.mkstemp(suffix=".json")[1]); p.write_bytes(raw)
        rc, txt = run_cmd([sys.executable, "scripts/verify_agent_card_jws.py", "--card", str(p), "--did", did_tmp.name, "--tamper-control"])
        res = json.loads(txt[txt.index("{"):]) if "{" in txt else {}
        st = res.get("state", UNCHECKABLE)
        fam({"family": "agent_card", "label": "A2A agent card JWS (/.well-known/agent-card.json)", "claim": "signatures[] JWS",
             "n": 1, VALID: int(st == VALID), INVALID: int(st == INVALID), UNSIGNED: 0, UNCHECKABLE: int(st not in (VALID, INVALID)),
             "keys": ["card-attestation-2"] if st == VALID else [],
             "control": {"state": (res.get("tamper_control") or {}).get("state"), "held": (res.get("tamper_control") or {}).get("passed")},
             "verifier": "scripts/verify_agent_card_jws.py --tamper-control", "exceptions": []})

    if run("detached_sig"):
        rows = []
        for sigp in [p for p in pub if p.endswith(".sig")]:
            code, sb = fetch(site_url(sigp))
            subj = sigp[:-4]
            if code != 200:
                rows.append({"url": site_url(sigp), **R(UNCHECKABLE, f"HTTP {code}")}); continue
            try:
                j = json.loads(sb)
            except Exception:
                j = None
            if j and "pubkey" in j:
                raw_pk = base64.b64decode(j["pubkey"]); kid = did.by_raw.get(raw_pk)
                rows.append({"url": site_url(sigp), **(R(UNCHECKABLE, "embedded pubkey is not in the DID document (unanchored)")
                                                      if not kid else R(VALID, "key in DID", kid=kid))})
            elif len(sb) == 64:
                c3, subj_b = fetch(site_url(subj)) if not subj.endswith("dataset") else (0, b"")
                hit = [k for k in did.keys for m in (subj_b, hashlib.sha256(subj_b).digest(), hashlib.sha256(subj_b).hexdigest().encode())
                       if subj_b and did.verify(k, sb, m)]
                rows.append({"url": site_url(sigp), **(R(VALID, "raw 64-byte sig over subject", kid=hit[0]) if hit else
                                                      R(UNCHECKABLE, "raw 64-byte signature, names no key; no DID key verifies it over the subject bytes or their digest"))})
            else:
                rows.append({"url": site_url(sigp), **R(UNCHECKABLE, "unknown detached signature format")})
        fam(summarise("detached_sig", "Detached .sig files", rows, None, "*.sig beside a subject"))

    if run("unsigned_claimed"):
        rows = []
        for u in (SITE + "/reports/council-safe-latest/jail.json", SITE + "/reports/council-safe-latest/swarm.json"):
            _, d = get_json(u)[:2]
            if not d:
                rows.append({"url": u, **R(UNCHECKABLE, "fetch")}); continue
            body = {k: v for k, v in d.items() if k not in ("generated_at", "canonical_sha256")}
            h = {n: hashlib.sha256(fn(body)).hexdigest() for n, fn in READINGS}
            match = [n for n, v in h.items() if v == d.get("canonical_sha256")]
            rows.append({"url": u, **R(UNSIGNED, "canonical_sha256 only (%s); root_ref=%s" % (
                ("recomputes via " + match[0]) if match else "DOES NOT recompute", d.get("root_ref")), family_hint="safe_export")})
        _, ch = get_json(SITE + "/.well-known/charter.json")[:2]
        if ch:
            m = ch.get("current", {}); c4, mb = fetch(m.get("machine", ""))
            _, mj = get_json(m.get("machine", ""))[:2]
            signed = bool(mj and any(k in mj for k in ("signature", "sig_ed25519", "signatures")))
            rows.append({"url": SITE + "/.well-known/charter.json", **R(UNSIGNED, "hash pointer; machine charter sha256 %s; charter carries %s" % (
                "matches" if hashlib.sha256(mb).hexdigest() == m.get("sha256") else "DOES NOT match",
                "a signature block" if signed else "no signature"), family_hint="charter")})
        _, st = get_json(SITE + "/api/state")[:2]
        if st:
            rows.append({"url": SITE + "/api/state#estate_index", **R(UNSIGNED, "declares signed=false: " + str(st["estate_index"].get("signing_note", ""))[:160])})
        fam(summarise("unsigned", "Hash-only / declared-unsigned families (SAFE export, charter, estate index)", rows, None, "hash pins"))

    if run("ots") and not a.no_ots:
        out["ots"] = ots_scan(now)

    # key coverage: which DID keys have at least one live VALID in this run
    used = {}
    for f in out["families"]:
        for k in f.get("keys") or []:
            if f.get(VALID):
                used.setdefault(k, []).append(f["family"])
    out["key_coverage"] = {k: used.get(k, []) for k in sorted(did.keys)}
    for f in out["families"]:
        f.pop("rows", None) if f.get("n", 0) > 60 else None
    Path(a.out_json).write_text(json.dumps(out, indent=1, default=str) + "\n")
    if a.out_md:
        Path(a.out_md).write_text(render_md(out))
    bad = [f["family"] for f in out["families"] if f.get(INVALID) or (f.get("control") and f["control"].get("held") is False)]
    print(json.dumps({f["family"]: {s: f.get(s) for s in (VALID, INVALID, UNSIGNED, UNCHECKABLE)} | {"n": f["n"]}
                      for f in out["families"]}, indent=0))
    print("families with INVALID or a failed control:", bad or "none")
    return 1 if bad else 0


def render_md(o: dict) -> str:
    L = [f"# Signature coverage — councilof.ai + csoai.org, checked {o['checked_at']}", "",
         f"Keys pinned from `{o['did']['url']}` (sha256 `{o['did']['sha256'][:16]}…`): " + ", ".join(f"`#{k}`" for k in o["did"]["keys"]) + ".",
         f"Tree for enumeration + OTS: `{o['tree_head'][:9]}`. Producer: `scripts/sign_coverage_audit.py`.", "",
         "| family | claim | n | VALID | INVALID | UNSIGNED | UNCHECKABLE | keys | control | binding |",
         "|---|---|---:|---:|---:|---:|---:|---|---|---|"]
    for f in o["families"]:
        c = f.get("control") or {}
        ctl = "—" if not c else ("held" if c.get("held") else "**FAILED**" if c.get("held") is False else str(c.get("state")))
        b = f.get("binding")
        L.append(f"| {f['label']} | {f.get('claim','')} | {f['n']} | {f.get(VALID)} | {f.get(INVALID)} | {f.get(UNSIGNED)} | "
                 f"{f.get(UNCHECKABLE)} | {', '.join(f.get('keys') or []) or '—'} | {ctl} | "
                 f"{', '.join(f'{k} {v}' for k, v in b.items()) if b else '—'} |")
    for f in o["families"]:
        if f.get("witness"):
            L += ["", f"Root witness (`/interop/root-witness-latest.json`): `{json.dumps(f['witness'])}`"]
    L += ["", "## Exceptions (every non-VALID row, and every artifact-binding miss)", ""]
    for f in o["families"]:
        for e in f.get("exceptions") or []:
            if isinstance(e, dict):
                L.append(f"- **{f['family']}** `{e.get('url','')}` — {e.get('state')}: {e.get('reason','')}"
                         + (f" · binding {e['binding']}" if e.get("binding", {}).get("state") in ("MISMATCH", "UNRESOLVED", "OK-MOVED") else ""))
            else:
                L.append(f"- **{f['family']}** {e}")
    L += ["", "## DID key coverage (live VALID artifacts found per key)", ""]
    for k, v in o["key_coverage"].items():
        L.append(f"- `#{k}`: {', '.join(v) if v else '**no live VALID artifact found by this audit**'}")
    if o["did"].get("copies"):
        L += ["", "## DID document copies", "", "```", json.dumps(o["did"]["copies"], indent=1), "```"]
    if o.get("ots"):
        t = o["ots"]
        L += ["", "## OpenTimestamps", "",
              f"Scope: {t['scope']}. {t['n']} proofs: {t['bitcoin_attested']} Bitcoin-attested, {t['pending_only']} calendar-pending only, "
              f"{t['not_a_proof']} not a readable proof. **Pending for more than 72h: {t['pending_over_72h']}.**", ""]
        for s in t["stale"][:80]:
            L.append(f"- `{s['path']}` — last written {s['last_written']} ({s['age_h']} h)")
        for p, why in t["not_a_proof_list"]:
            L.append(f"- not a proof: `{p}` ({why})")
    L += ["", "A VALID proves who signed the served bytes and that they have not changed since. It does not "
          "prove any number inside is right, and one key per family proves custody, not independence.", ""]
    return "\n".join(L)


if __name__ == "__main__":
    sys.exit(main())
