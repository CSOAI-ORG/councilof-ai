#!/usr/bin/env python3
"""Sign separately admitted mill measurement cards via GHA OIDC.

The board signer seals bytes; it does not decide that a run is MEASURED.  A
source wrapper is eligible only when:

* ``body.status`` is already exactly ``MEASURED``;
* the canonical body is at most 3 KiB and is never mutated here; and
* sibling ``wrap.admission`` is a valid ``csoai.measurement-admission/0.1``
  envelope signed by a separately pinned Ed25519 adjudicator.

The workflow must configure ``MILL_ADJUDICATOR_KID`` and
``MILL_ADJUDICATOR_PUBLIC_KEY_HEX`` (a raw 32-byte Ed25519 public key).  The
adjudicator key is deliberately different from #board-attestation-1.  This
script never loads either private key: the admission arrives pre-signed and
the board seal is obtained through GHA OIDC → /api/board-sign.

UNMEASURED bodies remain unsigned and never enter mill-cards-signed because
current downstream readers conflate a board signature with admission.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sign_financial_runs import DID, canonical_bytes, sign_via_oidc  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


SRC = ROOT / "public" / "interop" / "mill-cards-unsigned"
DST = ROOT / "public" / "interop" / "mill-cards-signed"
LEDGER = DST / "SUPERSEDED.jsonl"
MAX_PAYLOAD_BYTES = 3072
ADMISSION_SCHEMA = "csoai.measurement-admission/0.1"
ADJUDICATOR_KID_ENV = "MILL_ADJUDICATOR_KID"
ADJUDICATOR_KEY_ENV = "MILL_ADJUDICATOR_PUBLIC_KEY_HEX"

# did:web:csoai.org#board-attestation-1, pinned here rather than accepted from
# an input wrapper.  Admission must be an independent act, not a second label
# over the same signing key.
BOARD_SIGNER_KIDS = {
    "csoai-board-attestation-1",
    "did:web:csoai.org#board-attestation-1",
}
BOARD_SIGNER_PUBLIC_KEY = bytes.fromhex(
    "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170"
)
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
SIG_RE = re.compile(r"^[0-9a-fA-F]{128}$")
RFC3339_RE = re.compile(
    r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$"
)
ADMISSION_FIELDS = {
    "schema",
    "body_sha256",
    "evidence_bundle_sha256",
    "reproduction_receipt_sha256",
    "method_sha256",
    "reviewer",
    "admitted_at",
    "adjudicator",
}
ADJUDICATOR_FIELDS = {"kid", "alg", "signature"}


class AdmissionError(ValueError):
    """A measurement admission is absent, malformed, unpinned, or invalid."""


def load_adjudicator_config() -> tuple[str, bytes]:
    """Load the independent adjudicator identity from workflow configuration."""
    kid = (os.environ.get(ADJUDICATOR_KID_ENV) or "").strip()
    key_hex = (os.environ.get(ADJUDICATOR_KEY_ENV) or "").strip()
    if not kid or not key_hex:
        raise AdmissionError(
            f"set {ADJUDICATOR_KID_ENV} and {ADJUDICATOR_KEY_ENV}; refuse unadjudicated sign"
        )
    if not re.fullmatch(r"[0-9a-fA-F]{64}", key_hex):
        raise AdmissionError(f"{ADJUDICATOR_KEY_ENV} must be a raw 32-byte Ed25519 key in hex")
    public_key = bytes.fromhex(key_hex)
    if kid in BOARD_SIGNER_KIDS or public_key == BOARD_SIGNER_PUBLIC_KEY:
        raise AdmissionError("adjudicator must not reuse the board signer identity or public key")
    return kid, public_key


def admission_preimage(admission: dict[str, Any]) -> bytes:
    """Canonical signed admission, excluding only its signature bytes.

    The nested kid and algorithm remain covered by the signature.  The schema
    string provides domain separation from other Ed25519 receipts.
    """
    preimage = copy.deepcopy(admission)
    adjudicator = preimage.get("adjudicator")
    if isinstance(adjudicator, dict):
        adjudicator.pop("signature", None)
    return canonical_bytes(preimage)


def valid_rfc3339(value: Any) -> bool:
    if not isinstance(value, str) or not RFC3339_RE.fullmatch(value):
        return False
    try:
        parsed = datetime.fromisoformat(value[:-1] + "+00:00" if value.endswith("Z") else value)
    except ValueError:
        return False
    return parsed.tzinfo is not None


def validate_admission(
    admission: Any,
    body_sha256: str,
    configured_kid: str,
    configured_public_key: bytes,
) -> dict[str, Any]:
    """Verify a complete, byte-binding admission against the pinned key."""
    if not isinstance(admission, dict):
        raise AdmissionError("missing sibling wrap.admission")
    if set(admission) != ADMISSION_FIELDS:
        missing = sorted(ADMISSION_FIELDS - set(admission))
        extra = sorted(set(admission) - ADMISSION_FIELDS)
        raise AdmissionError(f"admission fields mismatch missing={missing} extra={extra}")
    if admission.get("schema") != ADMISSION_SCHEMA:
        raise AdmissionError(f"admission schema must be {ADMISSION_SCHEMA}")
    if admission.get("body_sha256") != body_sha256:
        raise AdmissionError("admission body_sha256 does not bind the canonical body")
    for field in (
        "body_sha256",
        "evidence_bundle_sha256",
        "reproduction_receipt_sha256",
        "method_sha256",
    ):
        value = admission.get(field)
        if not isinstance(value, str) or not SHA256_RE.fullmatch(value):
            raise AdmissionError(f"admission {field} must be lowercase sha256 hex")
    reviewer = admission.get("reviewer")
    if not isinstance(reviewer, str) or not reviewer.strip() or len(reviewer) > 256:
        raise AdmissionError("admission reviewer must be a non-empty string of at most 256 characters")
    if not valid_rfc3339(admission.get("admitted_at")):
        raise AdmissionError("admission admitted_at must be RFC3339 with an explicit timezone")

    adjudicator = admission.get("adjudicator")
    if not isinstance(adjudicator, dict) or set(adjudicator) != ADJUDICATOR_FIELDS:
        raise AdmissionError("admission adjudicator must contain exactly kid, alg, signature")
    if adjudicator.get("kid") != configured_kid:
        raise AdmissionError("admission adjudicator kid does not match the pinned kid")
    if adjudicator.get("kid") in BOARD_SIGNER_KIDS:
        raise AdmissionError("admission adjudicator kid reuses the board signer")
    if adjudicator.get("alg") != "Ed25519":
        raise AdmissionError("admission adjudicator alg must be Ed25519")
    signature = adjudicator.get("signature")
    if not isinstance(signature, str) or not SIG_RE.fullmatch(signature):
        raise AdmissionError("admission adjudicator signature must be 64-byte hex")
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

        Ed25519PublicKey.from_public_bytes(configured_public_key).verify(
            bytes.fromhex(signature), admission_preimage(admission)
        )
    except ImportError as exc:
        raise AdmissionError("cryptography unavailable; cannot verify adjudicator") from exc
    except Exception as exc:
        raise AdmissionError("admission adjudicator signature is invalid") from exc
    return admission


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


def main() -> int:
    if not SRC.is_dir():
        print("UNSIGNED — no mill-cards-unsigned dir", file=sys.stderr)
        return 0
    files = sorted(SRC.glob("unsigned-*.json"))
    if not files:
        print("UNSIGNED — no unsigned mill cards")
        return 0
    failures = 0
    skipped = 0
    candidates: list[dict[str, Any]] = []

    # Preflight every source before asking either signer for work or creating a
    # destination.  One malformed/admission-invalid measured card aborts the
    # whole batch with zero local writes.
    superseding = 0
    for fp in files:
        try:
            wrap = json.loads(fp.read_text(encoding="utf-8"))
        except Exception as exc:
            print(f"UNSIGNED {fp.name} — invalid JSON: {exc}", file=sys.stderr)
            failures += 1
            continue
        body = wrap.get("body")
        if not isinstance(body, dict):
            print(f"UNSIGNED {fp.name} — no body", file=sys.stderr)
            failures += 1
            continue
        status = body.get("status")
        if status == "UNMEASURED":
            print(f"SKIP {fp.name} — UNMEASURED bodies are not board-signed")
            skipped += 1
            continue
        if status != "MEASURED":
            print(
                f"UNSIGNED {fp.name} — body.status must already be MEASURED or UNMEASURED",
                file=sys.stderr,
            )
            failures += 1
            continue
        raw = canonical_bytes(body)
        if len(raw) > MAX_PAYLOAD_BYTES:
            print(f"HALT {fp.name} {len(raw)}B", file=sys.stderr)
            failures += 1
            continue
        digest = hashlib.sha256(raw).hexdigest()
        candidates.append({"fp": fp, "body": body, "raw": raw, "digest": digest, "admission": wrap.get("admission")})

    if failures:
        print(f"mill-sign signed=0 failures={failures} skipped={skipped} superseded=0")
        return 1
    if not candidates:
        print(f"mill-sign signed=0 failures=0 skipped={skipped} superseded=0")
        return 0

    try:
        configured_kid, configured_public_key = load_adjudicator_config()
    except AdmissionError as exc:
        print(f"UNSIGNED — {exc}", file=sys.stderr)
        print(f"mill-sign signed=0 failures=1 skipped={skipped} superseded=0")
        return 1

    for candidate in candidates:
        try:
            validate_admission(
                candidate["admission"],
                candidate["digest"],
                configured_kid,
                configured_public_key,
            )
        except AdmissionError as exc:
            print(f"UNSIGNED {candidate['fp'].name} — {exc}", file=sys.stderr)
            failures += 1

    if failures:
        print(f"mill-sign signed=0 failures={failures} skipped={skipped} superseded=0")
        return 1

    prepared: list[dict[str, Any]] = []
    already_signed = 0
    for candidate in candidates:
        fp = candidate["fp"]
        body = candidate["body"]
        raw = candidate["raw"]
        digest = candidate["digest"]
        admission = candidate["admission"]
        dest = card_path(body.get("axis") or "", digest)
        if dest.is_file():
            try:
                prev = json.loads(dest.read_text(encoding="utf-8"))
            except Exception:
                prev = {}
            if prev.get("id") == digest and prev.get("signature"):
                try:
                    previous_raw = canonical_bytes(prev.get("body"))
                    validate_admission(
                        prev.get("admission"), digest, configured_kid, configured_public_key
                    )
                except Exception as exc:
                    print(
                        f"HALT {dest.name} existing signature lacks valid admission: {exc}",
                        file=sys.stderr,
                    )
                    failures += 1
                    continue
                if previous_raw != raw or prev.get("admission") != admission:
                    print(
                        f"HALT {dest.name} existing signed envelope differs from admitted input",
                        file=sys.stderr,
                    )
                    failures += 1
                    continue
                print("SKIP already-admitted-and-signed", dest.name, digest[:16])
                already_signed += 1
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
        prepared.append(
            {
                **candidate,
                "dest": dest,
                "replaces": replaces,
            }
        )

    if failures:
        print(f"mill-sign signed=0 failures={failures} skipped={skipped} superseded=0")
        return 1

    # Board-sign all admitted bodies before writing any result.  A remote signer
    # failure therefore cannot leave a half-published local batch.
    outputs: list[dict[str, Any]] = []
    for candidate in prepared:
        fp = candidate["fp"]
        body = candidate["body"]
        try:
            sig = sign_via_oidc(body)
        except Exception as e:
            print(f"UNSIGNED {fp.name} — {e}", file=sys.stderr)
            failures += 1
            continue
        out = {
            "alg": "Ed25519",
            "body": body,
            "admission": candidate["admission"],
            "id": candidate["digest"],
            "preimage_rule": "sha256(canonical body)",
            "signature": sig,
            "did": DID,
            "n": body.get("n"),
            "quotable": True,
            "not_a_certificate": True,
        }
        if canonical_bytes(out["body"]) != candidate["raw"]:
            print(f"HALT {fp.name} body changed during signing", file=sys.stderr)
            failures += 1
            continue
        outputs.append({**candidate, "out": out})

    if failures:
        print(f"mill-sign signed=0 failures={failures} skipped={skipped} superseded=0")
        return 1

    if outputs:
        DST.mkdir(parents=True, exist_ok=True)
    for candidate in outputs:
        body = candidate["body"]
        digest = candidate["digest"]
        dest = candidate["dest"]
        replaces = candidate["replaces"]
        dest.write_text(json.dumps(candidate["out"], indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("SIGNED", dest.name, digest[:16], "n", body.get("n"))
        if replaces:
            already = superseded_ids()
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
                                "reason": "superseded by a separately admitted, byte-exact measurement body",
                                "at": now_iso(),
                            }
                        )
                        + "\n"
                    )
                    print("SUPERSEDES", prev["file"], prev["id"][:16], "->", dest.name)
                    superseding += 1
    signed = len(outputs) + already_signed
    print(
        f"mill-sign signed={signed} failures={failures} skipped={skipped} "
        f"superseded={superseding}"
    )
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
