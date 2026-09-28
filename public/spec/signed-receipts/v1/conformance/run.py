#!/usr/bin/env python3
"""signed-receipts/v1 conformance runner. Python 3.9+, one dependency: `cryptography`.
Apache-2.0. https://councilof.ai/spec/signed-receipts/v1/conformance/

  python3 run.py <candidate-results.json | URL>   compare a candidate's results with vectors.json
  python3 run.py --self                           verify the Ed25519 vectors with this script's own verifier
  python3 run.py --emit                           print this script's own results in candidate format
  --vectors <path | URL>                          default: the published vectors.json

A candidate results file is {"results": {"<case id>": "VALID" | "INVALID" | "UNVERIFIABLE_KEY"}}.
PASS means the candidate's result matches the expected result in vectors.json. It is not a
certification, an endorsement or a conformity mark. Exit 0 only when every core case passes and
no interop case fails (interop cases a candidate leaves out are reported SKIP).
"""

from __future__ import annotations

import base64
import hashlib
import json
import sys
import urllib.request

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

DEFAULT_VECTORS = "https://councilof.ai/spec/signed-receipts/v1/conformance/vectors.json"
RESULTS = ("VALID", "INVALID", "UNVERIFIABLE_KEY")


def load(src: str):
    if src.startswith(("http://", "https://")):
        req = urllib.request.Request(src, headers={"User-Agent": "signed-receipts-conformance/1"})
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    with open(src, encoding="utf-8") as f:
        return json.load(f)


# RFC 8785 (JCS), ECMAScript JSON.stringify semantics.
_SHORT = {'"': '\\"', "\\": "\\\\", "\b": "\\b", "\t": "\\t", "\n": "\\n", "\f": "\\f", "\r": "\\r"}


def _str(s: str) -> str:
    out = []
    for ch in s:
        cp = ord(ch)
        if ch in _SHORT:
            out.append(_SHORT[ch])
        elif cp < 0x20 or 0xD800 <= cp <= 0xDFFF:
            out.append("\\u%04x" % cp)
        else:
            out.append(ch)
    return '"' + "".join(out) + '"'


def _num(n) -> str:
    if isinstance(n, int):
        if abs(n) > 2**53:
            raise ValueError("integer outside the JCS safe range")
        return str(n)
    if n != n or n in (float("inf"), float("-inf")):
        raise ValueError("non-finite number")
    if n == 0:
        return "0"
    return _es_float(n)


def _es_float(n: float) -> str:
    """ECMAScript Number::toString for a finite, non-zero float (RFC 8785 section 3.2.2.3)."""
    from decimal import Decimal

    sign, digs, exp = Decimal(repr(abs(n))).as_tuple()
    d = "".join(map(str, digs)).rstrip("0") or "0"
    exp += len(digs) - len(d) if len(d) < len(digs) else 0
    k = len(d)
    e = k + exp  # value = 0.d * 10^e
    out: str
    if k <= e <= 21:
        out = d + "0" * (e - k)
    elif 0 < e <= 21:
        out = d[:e] + "." + d[e:]
    elif -6 < e <= 0:
        out = "0." + "0" * (-e) + d
    else:
        x = e - 1
        out = (d if k == 1 else d[0] + "." + d[1:]) + "e" + ("+" if x > 0 else "-") + str(abs(x))
    return ("-" if n < 0 else "") + out


def _utf16(k: str):
    return k.encode("utf-16-be", "surrogatepass")


def jcs(v) -> str:
    if v is None:
        return "null"
    if v is True:
        return "true"
    if v is False:
        return "false"
    if isinstance(v, str):
        return _str(v)
    if isinstance(v, (int, float)):
        return _num(v)
    if isinstance(v, list):
        return "[" + ",".join(jcs(x) for x in v) + "]"
    if isinstance(v, dict):
        return "{" + ",".join(_str(k) + ":" + jcs(v[k]) for k in sorted(v, key=_utf16)) + "}"
    raise TypeError(type(v).__name__)


def _b58(s: str) -> bytes:
    a = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
    n = 0
    for c in s:
        n = n * 58 + a.index(c)
    body = n.to_bytes((n.bit_length() + 7) // 8, "big") if n else b""
    return b"\x00" * (len(s) - len(s.lstrip("1"))) + body


def _b64url(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _vm_key(vm: dict):
    if vm.get("publicKeyHex"):
        return bytes.fromhex(vm["publicKeyHex"])
    m = vm.get("publicKeyMultibase")
    if m:
        if m[0] == "z":
            return _b58(m[1:])
        if m[0] in "fF":
            return bytes.fromhex(m[1:])
        if m[0] == "u":
            return _b64url(m[1:])
        raise ValueError("unsupported multibase prefix")
    j = vm.get("publicKeyJwk") or {}
    if j.get("kty") == "OKP" and j.get("crv") == "Ed25519" and j.get("x"):
        return _b64url(j["x"])
    return None


def verify(receipt, resolve):
    """(result, reason); result is VALID | INVALID | UNVERIFIABLE_KEY. resolve(did) -> doc or None."""
    try:
        env = receipt.get("signature") if isinstance(receipt, dict) else None
        if not isinstance(env, dict):
            return "INVALID", "malformed: no signature object"
        if env.get("alg") != "Ed25519":
            return "INVALID", f"unsupported alg {env.get('alg')}"
        kid = env.get("kid")
        if not isinstance(kid, str) or not kid.startswith("did:") or "#" not in kid:
            return "INVALID", "malformed kid"
        body = {k: v for k, v in receipt.items() if k != "signature"}
        unsigned = {k: v for k, v in body.items() if k != "content_id"}
        if body.get("content_id") != hashlib.sha256(jcs(unsigned).encode("utf-8")).hexdigest():
            return "INVALID", "content_id mismatch"
        pub = bytes.fromhex(env["signer_public_key"])
        Ed25519PublicKey.from_public_bytes(pub).verify(bytes.fromhex(env["sig"]), jcs(body).encode("utf-8"))
    except Exception as e:  # noqa: BLE001
        return "INVALID", f"{type(e).__name__}: {e}"
    did = kid.split("#")[0]
    try:
        doc = resolve(did)
    except Exception:  # noqa: BLE001
        doc = None
    if not isinstance(doc, dict):
        return "UNVERIFIABLE_KEY", f"DID document for {did} not resolvable"
    for vm in doc.get("verificationMethod", []):
        try:
            k = _vm_key(vm)
        except Exception:  # noqa: BLE001
            continue
        if k == pub:
            return ("INVALID", f"key revoked ({vm.get('id')})") if vm.get("revoked") else ("VALID", f"key listed ({vm.get('id')})")
    return "INVALID", f"key not in DID document for {did}"


def self_results(v) -> dict:
    out = {}
    for c in v["cases"]:
        docs = c.get("did_documents", {})
        out[c["id"]] = verify(c["receipt"], lambda d, docs=docs: docs.get(d))[0]
    return out


def report(title, cases, got, optional):
    p = f = s = 0
    print(f"\n{title}")
    for c in cases:
        g = got.get(c["id"])
        if g is None:
            tag = "SKIP" if optional else "FAIL"
        elif g not in RESULTS:
            tag = "FAIL"
        else:
            tag = "PASS" if g == c["expected"] else "FAIL"
        if tag == "PASS":
            p += 1
        elif tag == "SKIP":
            s += 1
        else:
            f += 1
        detail = "(no result)" if g is None else ("" if g == c["expected"] else f"got {g}")
        print(f"  {tag:<4}  {c['id']:<40} expected {c['expected']:<16} {detail}")
    return p, f, s


def main() -> int:
    args = sys.argv[1:]
    vectors_src = DEFAULT_VECTORS
    if "--vectors" in args:
        i = args.index("--vectors")
        vectors_src = args[i + 1]
        del args[i : i + 2]
    if not args:
        print("usage: python3 run.py <candidate-results.json | URL> | --self | --emit  [--vectors <path | URL>]")
        return 2
    v = load(vectors_src)
    interop = (v.get("interop") or {}).get("cases", [])
    if args[0] == "--emit":
        print(json.dumps({"implementation": "run.py reference verifier (cryptography Ed25519)", "results": self_results(v)}, indent=2))
        return 0
    if args[0] == "--self":
        got, label = self_results(v), "run.py reference verifier (cryptography Ed25519)"
    else:
        cand = load(args[0])
        if not isinstance(cand, dict) or not isinstance(cand.get("results"), dict):
            print('error: candidate file needs {"results": {"<case id>": "<RESULT>"}}')
            return 2
        got, label = cand["results"], cand.get("implementation", args[0])
    print(f"signed-receipts/v1 conformance: {label}")
    print(f"vectors: {vectors_src} ({len(v['cases'])} core, {len(interop)} interop)")
    cp, cf, _ = report("Core (Ed25519)", v["cases"], got, False)
    ip = ifl = isk = 0
    if interop:
        src = v["interop"].get("source", {})
        ip, ifl, isk = report(f"Interop ({v['interop'].get('alg')}; vectors from {src.get('package')}@{src.get('version')})", interop, got, True)
        if args[0] == "--self":
            print("  (this runner has no ML-DSA-65; run the interop cases with that package's own check)")
    ok = cf == 0 and ifl == 0
    tail = f", interop {ip} PASS / {ifl} FAIL / {isk} SKIP" if interop else ""
    print(f"\n{'ALL MATCH' if ok else 'MISMATCH'}: core {cp}/{len(v['cases'])} PASS{tail}. PASS means the result matches the vectors; it is not a certification.")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
