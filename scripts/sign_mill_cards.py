#!/usr/bin/env python3
"""Sign mill unsigned cards via GHA OIDC → /api/board-sign.

Never loads PKCS8. Workflow filename must contain hf-fin-shells (OIDC allowlist).
Records the DID that actually signed (#board-attestation-1). No laptop-sign.
n<30 cards stay UNMEASURED even if signed. Empty is never 0.
"""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sign_financial_runs import DID, canonical_bytes, sign_via_oidc  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]


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


def main() -> int:
    if not SRC.is_dir():
        print("UNSIGNED — no mill-cards-unsigned dir", file=sys.stderr)
        return 0
    files = sorted(SRC.glob("unsigned-*.json"))
    if not files:
        print("UNSIGNED — no unsigned mill cards")
        return 0
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
        wrap["body"] = body
        raw = canonical_bytes(body)
        if len(raw) > MAX_PAYLOAD_BYTES:
            print(f"HALT {fp.name} {len(raw)}B", file=sys.stderr)
            failures += 1
            continue
        digest = hashlib.sha256(raw).hexdigest()
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
        try:
            sig = sign_via_oidc(body)
        except Exception as e:
            print(f"UNSIGNED {fp.name} — {e}", file=sys.stderr)
            failures += 1
            continue
        out = {
            "alg": "Ed25519",
            "body": body,
            "id": digest,
            "preimage_rule": "sha256(canonical body)",
            "signature": sig,
            "did": DID,
            "n": n,
            "quotable": n >= 30,
            "not_a_certificate": True,
        }
        dest.write_text(json.dumps(out, indent=2) + "\n", encoding="utf-8")
        print("SIGNED", dest.name, digest[:16], "n", n)
        signed += 1
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
                                "reason": "#1155: body state corrected — the signed body must be true after signing",
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
