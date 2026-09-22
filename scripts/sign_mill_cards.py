#!/usr/bin/env python3
"""Sign mill unsigned cards — GHA OIDC → /api/board-sign by default, or a pod-resident key.

Two signers, ONE preimage rule (sha256 over the canonical body; the signature is over
those canonical body bytes, not the digest):

  default        sign_via_oidc_attested → Pages /api/board-sign. The key stays on Pages;
                 the workflow filename must be on the OIDC allowlist. Unchanged.
  --key-env NAME base64(PKCS8) Ed25519 read from the environment variable NAME and used
                 locally, through lib/estate_sign.py — the same loader, canonical form
                 and Ed25519 primitive scripts/publish_public_root.py signs the public
                 root with. Added 2026-09-16 because GitHub Actions stopped running on
                 2026-09-15 and the pod chain (scripts/pod-loops/sign.sh) is the only
                 other road to a signed card. Never a laptop key: the pod holds the key
                 in $LANES/.secrets and hands it to this process as an env var only.
                 The key value is never printed, never written, never logged.

  --pod-token-file PATH
                 Pages /api/board-sign again, but with the pod caller token (owner ruling
                 2026-09-22; the same request shape scripts/publish_public_root.py's
                 sign_via_pod_token uses). Added 2026-09-22 because GitHub Actions is dead
                 and the pod-resident PKCS8 was never placed: the key stays on Pages, the
                 token stays in a 0600 file. Fail closed: no readable non-empty token file
                 means no request and exit 3; a reply whose payload_sha256 is not the digest
                 of the bytes this process would verify is refused, because a signature
                 over other bytes is not a signature over this card. The token is never
                 printed, logged or written.

All paths record the DID that actually signed (--did; default #board-attestation-1).
n<30 cards stay UNMEASURED ("n<30 unquotable") even if signed. Empty is never 0.
Signed bytes are content-addressed and never overwritten: a changed body lands on a
new path and the old card is recorded in SUPERSEDED.jsonl, not edited.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / "harness" / "gspc-top100"))
from lib.estate_sign import canonical_bytes, load_key, sign_bytes  # noqa: E402
from sign_financial_runs import DID, sign_label_violation, sign_via_oidc_attested  # noqa: E402
from verify_card import canonical_js_body_bytes  # noqa: E402
from verify_hub_mill_evidence import EvidenceError, validate_admission  # noqa: E402

ROOT = HERE.parent


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


SRC = ROOT / "public" / "interop" / "mill-cards-unsigned"
DST = ROOT / "public" / "interop" / "mill-cards-signed"
LEDGER = DST / "SUPERSEDED.jsonl"
MAX_PAYLOAD_BYTES = 3072


def card_path(axis: str, digest: str) -> Path:
    """Signed cards are CONTENT-ADDRESSED: the name is a function of the body.

    Every card on disk already satisfies name-hex == id == sha256(canonical body);
    naming from the digest rather than from the source filename makes that an
    invariant instead of a coincidence. It is also what makes supersession safe —
    a changed body lands on a different path, so an existing signed card can never
    be overwritten by construction."""
    return DST / f"signed-{str(axis or '')[:8]}-{digest[:12]}.json"


def prior_cards(model: str, axis: str, digest: str) -> list[dict]:
    """Signed cards for the same (model, axis) that this one replaces. Superseded
    cards stay on disk and keep resolving — a card_id already published must not
    404 — but the ledger records that they are no longer the live card."""
    out = []
    for f in sorted(DST.glob("signed-*.json")):
        try:
            w = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue
        b = w.get("body") if isinstance(w.get("body"), dict) else {}
        if b.get("model") == model and b.get("axis") == axis and w.get("id") != digest and w.get("signature"):
            out.append({"file": f.name, "id": w.get("id")})
    return out


def ledger_rows() -> list[dict]:
    if not LEDGER.is_file():
        return []
    rows = []
    for line in LEDGER.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    return rows


def superseded_ids() -> set[str]:
    """Card ids the ledger says are no longer live. Readers of the census use this
    to count one card per (model, axis) without deleting anything."""
    return {str(r.get("superseded_id") or "") for r in ledger_rows() if r.get("superseded_id")}


def sign_locally(body: dict, key) -> tuple[str, str]:
    """(signature hex, digest hex) over the canonical body, with the pod-resident key.

    The preimage is the JS edge signer's canonical form (harness/gspc-top100/verify_card
    .canonical_js_body_bytes) — the bytes every verifier of a style-C card recomputes —
    and it must ALSO equal the estate's Python canonical form (lib.estate_sign
    .canonical_bytes, what publish_public_root.py signs). The two differ only for an
    integral float (1.0 → "1" vs "1.0"); the mill never emits one, and if it ever does
    this refuses rather than sign a preimage two verifiers would disagree about.
    The G1.3 never-sign labels are refused here exactly as the Pages signer refuses them.
    """
    violation = sign_label_violation(body)
    if violation:
        raise RuntimeError(
            f"refused: never-sign label {violation!r} in payload — THIN/TEMPLATE/specimen is never signed (G1.3)"
        )
    pre = canonical_js_body_bytes(body)
    if pre != canonical_bytes(body):
        raise RuntimeError(
            "canonical divergence: the body renders differently under the Python and JS "
            "canonical forms (an integral float?) — refusing to sign an ambiguous preimage"
        )
    return sign_bytes(key, pre), hashlib.sha256(pre).hexdigest()


POD_SIGN_URL_DEFAULT = "https://councilof.ai/api/board-sign"
POD_SIGN_UA = "Mozilla/5.0 csoai-pod-mill-signer/0.1"


def read_pod_token(token_file: Path) -> str:
    """The pod caller token, or RuntimeError. Never printed, never logged."""
    if token_file.is_symlink() or not token_file.is_file():
        raise RuntimeError(f"pod token file absent: {token_file}")
    tok = token_file.read_text(encoding="utf-8").strip()
    if not tok:
        raise RuntimeError(f"pod token file is empty: {token_file}")
    return tok


def sign_via_pod_token_attested(body: dict, token_file: Path, sign_url: str | None = None,
                                opener=None) -> tuple[str, str]:
    """(signature hex, digest hex) from Pages /api/board-sign with the pod caller token.

    Same request as sign_via_oidc_attested; only the bearer differs. The signer answers
    with payload_sha256 over the bytes IT canonicalised (JSON.stringify of the key-sorted
    object). That digest must equal sha256(canonical_js_body_bytes(body)) here — and that
    preimage must equal the estate's Python canonical form — or the signature covers other
    bytes than the ones every verifier recomputes, and it is refused. No token → no request.
    The G1.3 never-sign labels are refused before the request exactly as the Pages signer
    refuses them.
    """
    violation = sign_label_violation(body)
    if violation:
        raise RuntimeError(
            f"refused: never-sign label {violation!r} in payload — THIN/TEMPLATE/specimen is never signed (G1.3)"
        )
    tok = read_pod_token(token_file)
    pre = canonical_js_body_bytes(body)
    if pre != canonical_bytes(body):
        raise RuntimeError(
            "canonical divergence: the body renders differently under the Python and JS "
            "canonical forms (an integral float?) — refusing to sign an ambiguous preimage"
        )
    local_digest = hashlib.sha256(pre).hexdigest()
    url = sign_url or os.environ.get("BOARD_SIGN_URL") or POD_SIGN_URL_DEFAULT
    request = urllib.request.Request(
        url,
        data=json.dumps({"payload": body}, separators=(",", ":"), ensure_ascii=False).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Bearer {tok}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": POD_SIGN_UA,
        },
    )
    open_fn = opener or urllib.request.urlopen
    try:
        with open_fn(request, timeout=40) as resp:
            out = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        detail = e.read()[:200].decode("utf-8", "replace") if e.fp else ""
        raise RuntimeError(f"board-sign (pod-token) HTTP {e.code} {detail!r}") from e
    if not isinstance(out, dict):
        raise RuntimeError("board-sign (pod-token): reply is not an object")
    if out.get("payload_sha256") != local_digest:
        raise RuntimeError(
            "board-sign (pod-token): returned payload_sha256 != local canonical digest; "
            "refusing a signature over other bytes"
        )
    sig = out.get("sig_ed25519")
    if not isinstance(sig, str) or len(sig) != 128 or any(c not in "0123456789abcdef" for c in sig.lower()):
        raise RuntimeError("board-sign (pod-token): reply carries no Ed25519 signature (128 hex)")
    return sig.lower(), local_digest


def main(argv: list[str] | None = None) -> int:
    global DST, LEDGER
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source-dir", type=Path, help="sign only this isolated unsigned-card directory")
    parser.add_argument("--dest-dir", type=Path,
                        help="write signed cards (and SUPERSEDED.jsonl) here instead of public/interop/mill-cards-signed")
    parser.add_argument("--evidence-dir", type=Path, help="directory holding admitted evidence and receipts")
    parser.add_argument("--require-hub-admission", action="store_true",
                        help="refuse non-RunPod cards without a current verified evidence receipt")
    parser.add_argument("--key-env", metavar="NAME",
                        help="sign locally with the base64(PKCS8) Ed25519 key in environment variable NAME "
                             "(pod chain); default is the GHA OIDC relay to /api/board-sign")
    parser.add_argument("--pod-token-file", type=Path, metavar="PATH",
                        help="sign through Pages /api/board-sign with the pod caller token read from PATH "
                             "(0600; never printed). Fails closed when absent or empty. --key-env wins if both are given.")
    parser.add_argument("--did", default=DID,
                        help=f"DID verification method recorded on each signed card (default {DID})")
    args = parser.parse_args(argv)
    if args.dest_dir is not None:
        DST = args.dest_dir
        LEDGER = DST / "SUPERSEDED.jsonl"
    key = None
    if args.key_env:
        try:
            key = load_key(args.key_env)
        except Exception as error:  # noqa: BLE001 — the message never carries the value
            print(f"UNSIGNED — --key-env {args.key_env}: {error}", file=sys.stderr)
            return 3
        if key is None:
            print(f"UNSIGNED — --key-env {args.key_env} is empty or unset", file=sys.stderr)
            return 3
    if key is None and args.pod_token_file is not None:
        try:
            read_pod_token(args.pod_token_file)
        except Exception as error:  # noqa: BLE001 — the message never carries the value
            print(f"UNSIGNED — --pod-token-file: {error}", file=sys.stderr)
            return 3
    source = args.source_dir if args.source_dir is not None else SRC
    if not source.is_dir():
        print("UNSIGNED — no mill-cards-unsigned dir", file=sys.stderr)
        return 2 if args.source_dir is not None else 0
    try:
        files = sorted(source.glob("unsigned-*.json"))
        for fp in files:
            if fp.is_symlink() or not fp.is_file():
                raise OSError("unsigned source is not a regular file")
            with fp.open("rb") as stream:
                stream.read(1)
    except OSError:
        print("UNSIGNED — source directory must contain readable regular files", file=sys.stderr)
        return 2
    if not files:
        print("UNSIGNED — no unsigned mill cards")
        return 2 if args.source_dir is not None else 0
    DST.mkdir(parents=True, exist_ok=True)
    failures = 0
    signed = 0
    superseding = 0
    for fp in files:
        wrap = json.loads(fp.read_text(encoding="utf-8"))
        body = wrap.get("body")
        if not isinstance(body, dict):
            print(f"UNSIGNED {fp.name} — no body", file=sys.stderr)
            failures += 1
            continue
        is_runpod = isinstance(body.get("compute_evidence"), dict)
        if args.require_hub_admission and not is_runpod:
            try:
                if args.evidence_dir is None:
                    raise EvidenceError("evidence directory required")
                validate_admission(wrap, args.evidence_dir)
            except (EvidenceError, OSError, ValueError) as error:
                print(f"UNSIGNED {fp.name} — evidence {error}", file=sys.stderr)
                failures += 1
                continue
        n = int(body.get("n") or 0)
        # A signature freezes the body, so the body must be true AFTER it is signed,
        # not only before. "signed-pending-verify" was a state that expired the moment
        # the card verified, and it was interned into the bytes anyway — which is how
        # the Hub ended up with cells saying MEASURED over bodies saying UNMEASURED
        # (#1155). The state written here is the one that survives: a run of n>=30 that
        # is about to be signed by the board key IS the measurement; n<30 is not
        # quotable and says so.
        if n >= 30:
            body["status"] = "MEASURED"
            body["unmeasured"] = []
        else:
            body["status"] = "UNMEASURED"
            body["unmeasured"] = ["n<30 unquotable"]
        # This value is part of the signed body, so it must describe the state
        # that survives the signer call. Leaving STAGED_UNSIGNED here creates a
        # cryptographically valid wrapper around a lifecycle contradiction.
        body["signature_state"] = "SIGNED"
        if args.require_hub_admission and not is_runpod:
            body["admission"] = wrap["admission"]
        wrap["body"] = body
        raw = canonical_bytes(body)
        if len(raw) > MAX_PAYLOAD_BYTES:
            print(f"HALT {fp.name} {len(raw)}B", file=sys.stderr)
            failures += 1
            continue
        # OIDC: the trusted signer parses the payload in JavaScript and returns the
        # digest of the exact bytes it signed. Numeric JSON values do not retain
        # Python's int/float distinction across that boundary, so its attested
        # digest is the only safe content address. Local: the same JS canonical
        # form is computed here and cross-checked against the Python form.
        try:
            if key is not None:
                sig, digest = sign_locally(body, key)
            elif args.pod_token_file is not None:
                sig, digest = sign_via_pod_token_attested(body, args.pod_token_file)
            else:
                sig, digest = sign_via_oidc_attested(body)
        except Exception as e:
            print(f"UNSIGNED {fp.name} — {e}", file=sys.stderr)
            failures += 1
            continue
        dest = card_path(body.get("axis") or "", digest)
        if dest.is_file():
            try:
                prev = json.loads(dest.read_text(encoding="utf-8"))
            except Exception:
                prev = {}
            if prev.get("id") == digest and prev.get("signature"):
                print("SKIP already-signed", dest.name, digest[:16])
                signed += 1
                continue
            if prev.get("signature"):
                # Unreachable while the path is a function of the body — a different
                # digest is a different path. Kept because the day it fires, the
                # alternative is silently replacing signed bytes.
                print(
                    f"HALT {dest.name} would overwrite signed bytes"
                    f" {str(prev.get('id') or '')[:16]} != {digest[:16]}",
                    file=sys.stderr,
                )
                failures += 1
                continue
        replaces = prior_cards(str(body.get("model") or ""), str(body.get("axis") or ""), digest)
        out = {
            "alg": "Ed25519",
            "body": body,
            "id": digest,
            "preimage_rule": "sha256(canonical body)",
            "signature": sig,
            "did": args.did,
            "n": n,
            "quotable": body.get("status") == "MEASURED",
            "not_a_certificate": True,
        }
        dest.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
        print("SIGNED", dest.name, digest[:16], "n", n)
        signed += 1
        if replaces:
            already = superseded_ids()
            admission = body.get("admission") if isinstance(body.get("admission"), dict) else {}
            supersede_reason = (
                "#2075: replaced by a current reproducibly admitted v0.2 item-evidence card"
                if admission.get("schema") == "csoai.mill-evidence-admission/0.2"
                else "#1155: body state corrected — the signed body must be true after signing"
            )
            with LEDGER.open("a", encoding="utf-8") as fh:
                for prev in replaces:
                    if prev["id"] in already:
                        continue
                    fh.write(
                        json.dumps(
                            {
                                "superseded_id": prev["id"],
                                "superseded_file": prev["file"],
                                "by_id": digest,
                                "by_file": dest.name,
                                "model": body.get("model"),
                                "axis": body.get("axis"),
                                "reason": supersede_reason,
                                "at": now_iso(),
                            }
                        )
                        + "\n"
                    )
                    print("SUPERSEDES", prev["file"], prev["id"][:16], "->", dest.name)
                    superseding += 1
    print(f"mill-sign signed={signed} failures={failures} superseded={superseding}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
