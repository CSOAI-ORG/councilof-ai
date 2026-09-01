#!/usr/bin/env python3
"""Sign compact ledger-card payloads via GHA OIDC → /api/board-sign.

Close sibling of sign_financial_runs.py — same canonical payload rule
(byte-for-byte: reuses canonical_bytes), same 3KB gate, same OIDC-only
signing path. Never loads PKCS8; sign_via_oidc raises unless the GHA
OIDC env is present, so this script is structurally unable to laptop-sign.

Differences from the financial path: iterates ledger-cards-compact.json,
and each card keeps its OWN surface / subject / source_urls / unmeasured
(taken from the matching ledger-card-<slug>-unsigned.json atom).

Three-state logging per surface: SIGNED / HALT (3KB gate) / UNSIGNED
(with the honest reason). Exit 0 only when every card signed.

NOTE on kid: /api/board-sign signs under did:web:csoai.org#board-attestation-1
(verified against the live DID document 2026-09-01). The signed card records
that kid — never a kid the signature does not verify under.
"""
from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sign_financial_runs import DID, SCHEMA, canonical_bytes, sign_via_oidc  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
INTEROP = ROOT / "public" / "interop"
COMPACT = INTEROP / "ledger-cards-compact.json"
MAX_PAYLOAD_BYTES = 3072


def slug(surface: str) -> str:
    return surface.replace(".", "-")


def main() -> int:
    compact = json.loads(COMPACT.read_text(encoding="utf-8"))
    failures = 0
    for surface, payload in compact.items():
        atom_path = INTEROP / f"ledger-card-{slug(surface)}-unsigned.json"
        if not atom_path.exists():
            print(f"UNSIGNED {surface} — no unsigned atom {atom_path.name}", file=sys.stderr)
            failures += 1
            continue
        atom = json.loads(atom_path.read_text(encoding="utf-8"))
        if atom.get("payload") != payload:
            print(f"UNSIGNED {surface} — atom payload != compact payload", file=sys.stderr)
            failures += 1
            continue
        raw = canonical_bytes(payload)
        if len(raw) > MAX_PAYLOAD_BYTES:
            print(f"HALT {surface} {len(raw)}B > {MAX_PAYLOAD_BYTES}B", file=sys.stderr)
            failures += 1
            continue
        digest = hashlib.sha256(raw).hexdigest()
        try:
            sig = sign_via_oidc(payload)
        except Exception as e:  # OIDC missing or endpoint refusal — never sign another way
            print(f"UNSIGNED {surface} — {e}", file=sys.stderr)
            failures += 1
            continue
        card = {
            "as_of": atom.get("as_of") or payload.get("as_of"),
            "did": DID,
            "payload": payload,
            "schema": SCHEMA,
            "sha256": digest,
            "sig_ed25519": sig,
            "surface": surface,
            "subject": atom.get("subject"),
            "source_urls": atom.get("source_urls"),
            "unmeasured": atom.get("unmeasured", []),
        }
        out = INTEROP / f"ledger-card-{slug(surface)}.json"
        out.write_text(json.dumps(card, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print("SIGNED", surface, digest[:16])
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
