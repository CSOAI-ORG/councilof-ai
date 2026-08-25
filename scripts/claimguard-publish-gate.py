#!/usr/bin/env python3
"""claimguard-publish-gate.py — the ops publish gate (AXIS-BOOTSTRAP-EAT station 3 + doctrine 5).

Before any board row / page / feed renders publicly, a claim-vs-signed-artifact pass is required:
the claim (the statement the surface will make) must be supported by the signed artifact it cites.
Fail-closed: if the claim is NOT supported (or the artifact doesn't verify), the gate exits non-zero
and the surface does not publish.

    python3 claimguard-publish-gate.py --artifact public/signals/gov.signed.json \\
        --claim "13 measured of 14"          # expected: pass (claim supported by the signed row)

This is the same discipline as ClaimGuard (claim vs signed artifact) applied at the publish edge.
"""
from __future__ import annotations
import argparse, hashlib, base64, json


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def verify_artifact(path: str) -> dict:
    """Recompute canonical -> content_id -> Ed25519 verify. Returns the artifact body."""
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
    d = json.load(open(path))
    sig = d.get("signature") or {}
    if isinstance(sig, str):
        # style-A (living board): sign_board canonical — default separators + ensure_ascii
        body = {k: v for k, v in d.items() if k not in ("signature", "signer", "signed", "sig_input")}
        canon_body = json.dumps(body, sort_keys=True).encode()
        digest = hashlib.sha256(canon_body).digest()
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(d.get("signer", "")))
        pub.verify(bytes.fromhex(sig), digest)
        return body
    body = {k: v for k, v in d.items() if k not in ("content_id", "signature", "sha256", "sig")}
    want = hashlib.sha256(canonical(body)).hexdigest()
    if not sig.get("pubkey") or not sig.get("sig"):
        raise SystemExit(f"GATE FAIL: {path} has no signature")
    pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(sig["pubkey"]))
    pub.verify(base64.b64decode(sig["sig"]), want.encode())
    if want != d.get("content_id"):
        raise SystemExit(f"GATE FAIL: {path} content_id mismatch (recomputed {want[:16]} vs stated {str(d.get('content_id'))[:16]})")
    return body


def claim_supported(claim: str, body: dict) -> tuple[bool, str]:
    """Does the signed artifact support the claim? Grammar-aware, never a numeric-opinion gate."""
    cl = claim.lower()
    # the board grammar: "N measured of M" must be supported by the artifact's own numbers
    if "measured of" in cl:
        try:
            n, m = cl.split("measured of")
            want_n = int(n.split()[-1])
            m_val = int(m.split()[0]) if m.strip() else None
            # trust the artifact's own totals (never a hardcoded number)
            totals = (body.get("totals") or {}).get("public_count")
            if totals is None and body.get("note"):
                # some cards carry the count in a note/measurement field
                note = str(body.get("note", "")) + str(body.get("measurement", ""))
                if f"{want_n} measured" in note:
                    return True, "claim supported by the artifact's note"
            if totals is not None and str(totals).startswith(f"{want_n} "):
                return True, f"claim supported (public_count {totals})"
            # board-style artifacts: derive the grammar from the axes themselves
            axes = body.get("axes")
            if isinstance(axes, dict):
                axes = list(axes.values())
            if isinstance(axes, list) and axes:
                measured = sum(1 for a in axes
                               if isinstance(a, dict)
                               and a.get("status") == "MEASURED"
                               and a.get("separation") not in ("UNTESTED", None))
                quotable = sum(1 for a in axes if isinstance(a, dict)
                               and a.get("status") == "MEASURED")
                if measured == want_n and quotable == m_val:
                    return True, (f"claim supported (board-derived: "
                                  f"{measured} measured of {quotable})")
        except Exception:
            return False, "grammar parse failed — cannot verify"
        return False, "claim number not supported by the artifact"
    # generic: any claim text is "supported" only if the artifact explicitly carries it
    if cl in str(body).lower():
        return True, "claim text appears in the signed body"
    return False, "claim text not found in the signed body"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--artifact", required=True, help="path to the signed JSON artifact")
    ap.add_argument("--claim", required=True, help="the claim the surface will render")
    args = ap.parse_args()
    body = verify_artifact(args.artifact)
    ok, why = claim_supported(args.claim, body)
    print(f"GATE: artifact verified (content_id OK) | claim: {args.claim!r}")
    print(f"GATE: {'PASS' if ok else 'FAIL'} — {why}")
    print(f"GATE: register={body.get('register')} not_a_certification={body.get('not_a_certification')}")
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
