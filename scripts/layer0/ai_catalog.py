#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Layer 0 AI Catalog checker: the conformance level we actually meet, and the listing-vs-measurement rule.

    python3 scripts/layer0/ai_catalog.py --check [public/.well-known/ai-catalog.json]     exit 1 on any problem

Spec: AI Catalog 1.0 (Agent-Card/ai-catalog, specification/ai-catalog.md, read 30 Sep 2026, sha256 in
scripts/layer0/vendor/SOURCES.json). Conformance levels (spec "Conformance Levels"):
  1 Minimal       specVersion + entries; each entry identifier, type, exactly one of url / data
  2 Discoverable  + host with displayName
  3 Trusted       + every trustManifest carries signature (detached JWS over JCS, alg in the allowlist),
                    subject (with digest) and issuedAt, and the signature VERIFIES
The level we claim (extensions["ai.councilof.catalog-note"].conformance_level) must equal the level computed here.

Binding rule (lead, 30 Sep 2026): DISCOVERY LISTING state is kept apart from MEASUREMENT state. Every entry states
extensions["ai.councilof.measurement"].state as MEASURED or UNMEASURED.
  * An UNMEASURED entry carries no trustManifest, no attestation, no signature and no score/rating/grade/quality field.
  * A MEASURED entry carries a trustManifest with at least one attestation of type "signed-measurement" whose digest,
    when it names a file this site serves from public/, equals that file's sha256.
  * A trustManifest is substantive (spec "Manifest Validity") and its identity aligns with the publisher domain of
    the entry identifier (spec "Identity").
"""
import hashlib, json, os, re, sys
from urllib.parse import urlparse

SITE = "https://councilof.ai"
CLAIM_EXT = "ai.councilof.catalog-note"
MEAS_EXT = "ai.councilof.measurement"
STATES = ("MEASURED", "UNMEASURED")
QUALITY_KEYS = ("score", "rating", "grade", "quality", "signature", "attestations", "trust", "verified", "certified")
JWS_ALGS = ("ES256", "ES384", "EdDSA", "PS256", "PS384", "RS256")


def publisher(identifier):
    m = re.match(r"^urn:air:([a-zA-Z0-9.-]+):", identifier or "")
    return m.group(1).lower() if m else None


def identity_domain(identity):
    if identity.startswith("did:web:"):
        return identity[len("did:web:"):].split(":")[0].split("#")[0].lower()
    if identity.startswith("https://") or identity.startswith("http://"):
        return urlparse(identity).hostname
    if identity.startswith("spiffe://"):
        return urlparse(identity).hostname
    return None


def measurement(e):
    return ((e.get("extensions") or {}).get(MEAS_EXT) or {}).get("state")


def claimed_level(doc):
    return ((doc.get("extensions") or {}).get(CLAIM_EXT) or {}).get("conformance_level")


def set_claim(doc, n):
    doc.setdefault("extensions", {}).setdefault(CLAIM_EXT, {})["conformance_level"] = n


def substantive(tm):
    return bool(tm.get("signature") or tm.get("attestations") or tm.get("provenance") or tm.get("trustSchema"))


def verify_jws(tm, root):
    """True only for a detached compact JWS (alg in the allowlist) over JCS(manifest without signature) that verifies
    under a key published in the site's DID document. We hold no JWS-capable signer yet, so this is never True today."""
    sig = tm.get("signature")
    if not isinstance(sig, str) or sig.count(".") != 2:
        return False
    try:
        import base64
        hdr = json.loads(base64.urlsafe_b64decode(sig.split(".")[0] + "=="))
    except Exception:
        return False
    if hdr.get("alg") not in JWS_ALGS or sig.split(".")[1] != "":
        return False
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    except Exception:
        return False
    body = {k: v for k, v in tm.items() if k != "signature"}
    payload = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    b64 = lambda b: base64.urlsafe_b64encode(b).rstrip(b"=")
    signing_input = sig.split(".")[0].encode() + b"." + b64(payload)
    try:
        raw = base64.urlsafe_b64decode(sig.split(".")[2] + "==")
    except Exception:
        return False
    did = json.load(open(os.path.join(root, "public", ".well-known", "did.json")))
    for vm in did.get("verificationMethod", []):
        jwk = vm.get("publicKeyJwk") or {}
        if jwk.get("kty") == "OKP" and jwk.get("crv") == "Ed25519" and hdr.get("alg") == "EdDSA":
            try:
                Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(jwk["x"] + "==")).verify(raw, signing_input)
                return True
            except Exception:
                continue
    return False


def level(doc, root):
    ents = doc.get("entries")
    if not isinstance(doc.get("specVersion"), str) or not isinstance(ents, list):
        return 0
    for e in ents:
        if not (isinstance(e.get("identifier"), str) and isinstance(e.get("type"), str) and (("url" in e) != ("data" in e))):
            return 0
    if not (isinstance(doc.get("host"), dict) and isinstance(doc["host"].get("displayName"), str)):
        return 1
    tms = [e["trustManifest"] for e in ents if isinstance(e.get("trustManifest"), dict)]
    if tms and all(tm.get("signature") and isinstance(tm.get("subject"), dict) and tm["subject"].get("digest") and tm.get("issuedAt") and verify_jws(tm, root) for tm in tms):
        return 3
    return 2


def local_file(uri):
    if not isinstance(uri, str) or not uri.startswith(SITE + "/"):
        return None
    return os.path.join("public", urlparse(uri).path.lstrip("/"))


def problems(doc, root):
    out = []
    for e in doc.get("entries", []):
        ident = e.get("identifier", "?")
        st = measurement(e)
        if st not in STATES:
            out.append(f"{ident}: extensions.{MEAS_EXT}.state must be MEASURED or UNMEASURED (measurement not stated)")
            continue
        tm = e.get("trustManifest")
        if st == "UNMEASURED":
            if tm is not None:
                out.append(f"{ident}: UNMEASURED entry carries a trustManifest (listing is not measurement)")
            bad = [k for k in e if k.lower() in QUALITY_KEYS]
            if bad:
                out.append(f"{ident}: UNMEASURED entry carries {', '.join(bad)}")
            continue
        # MEASURED
        if not isinstance(tm, dict):
            out.append(f"{ident}: MEASURED entry has no trustManifest with its signed evidence")
            continue
        atts = [a for a in tm.get("attestations") or [] if a.get("type") == "signed-measurement"]
        if not atts:
            out.append(f"{ident}: MEASURED entry has no signed-measurement attestation")
        for a in atts:
            lf = local_file(a.get("uri"))
            if lf and a.get("digest"):
                p = os.path.join(root, lf)
                if not os.path.exists(p):
                    out.append(f"{ident}: attestation {a['uri']} names a file the site does not serve ({lf})")
                elif "sha256:" + hashlib.sha256(open(p, "rb").read()).hexdigest() != a["digest"]:
                    out.append(f"{ident}: attestation digest does not match {lf}")
            elif lf and not a.get("digest"):
                out.append(f"{ident}: attestation {a['uri']} carries no digest")
    for e in doc.get("entries", []):
        tm = e.get("trustManifest")
        if not isinstance(tm, dict):
            continue
        ident = e.get("identifier", "?")
        if not isinstance(tm.get("identity"), str):
            out.append(f"{ident}: trustManifest without identity")
            continue
        if not substantive(tm):
            out.append(f"{ident}: trustManifest is not substantive")
        if identity_domain(tm["identity"]) != publisher(ident):
            out.append(f"{ident}: trustManifest identity {tm['identity']} does not align with publisher {publisher(ident)}")
    lv, cl = level(doc, root), claimed_level(doc)
    if cl != lv:
        out.append(f"catalog claims Level {cl} but meets Level {lv}")
    return out


def main(argv=None):
    a = argv if argv is not None else sys.argv[1:]
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    path = next((x for x in a if not x.startswith("--")), os.path.join(root, "public", ".well-known", "ai-catalog.json"))
    doc = json.load(open(path))
    ps = problems(doc, root)
    for p in ps:
        print("PROBLEM", p)
    ms = sum(1 for e in doc.get("entries", []) if measurement(e) == "MEASURED")
    print(f"ai-catalog: Level {level(doc, root)} (claimed {claimed_level(doc)}), {len(doc.get('entries', []))} entries, "
          f"{ms} MEASURED with signed evidence, {len(ps)} problem(s)")
    return 1 if ps else 0


if __name__ == "__main__":
    sys.exit(main())
