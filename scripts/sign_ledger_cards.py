#!/usr/bin/env python3
"""Sign compact ledger-card payloads via GHA OIDC → /api/board-sign.

The board endpoint parses JSON in JavaScript and signs its sorted, compact
JSON.stringify(payload) bytes. Store the digest returned by that same signer,
and independently reproduce those JS bytes before accepting the response.
This prevents Python's 1.0 vs JavaScript's 1 numeric rendering from creating
a signature whose stored sha256 cannot be reproduced by the public verifier.

OIDC-only: this script never loads PKCS8 and cannot laptop-sign. The server's
attested digest must equal the local JS-canonical payload digest; otherwise
the result is refused and no card is written.

Differences from the financial path: iterates ledger-cards-compact.json,
and each card keeps its OWN surface / subject / source_urls / unmeasured
(taken from the matching ledger-card-<slug>-unsigned.json atom).

Three-state logging per surface: SIGNED / HALT (3KB/canonical gate) / UNSIGNED
(with the honest reason). Exit 0 only when every card signed.

NOTE on kid: /api/board-sign signs under did:web:csoai.org#board-attestation-1.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
from sign_financial_runs import DID, SCHEMA, sign_via_oidc_attested  # noqa: E402
from verify_card import canonical_js_body_bytes  # noqa: E402

INTEROP = ROOT / "public" / "interop"
COMPACT = INTEROP / "ledger-cards-compact.json"
MAX_PAYLOAD_BYTES = 3072
SIGNATURE_HEX = re.compile(r"^[0-9a-f]{128}$")


def slug(surface: str) -> str:
    return surface.replace(".", "-")


MAX_IDS = 25


def explicit_ids(argv: list[str]) -> list[str] | None:
    """--ids-file PATH: sign ONLY these exact surface ids (one per line, capped, no globs).

    Measure's G2 ruling (2026-10-16): the signer is handed an explicit capped
    list produced by scripts/auto-eat/g2_gate.py, never a glob. Without the
    flag behaviour is unchanged.
    """
    if "--ids-file" not in argv:
        return None
    path = Path(argv[argv.index("--ids-file") + 1])
    ids = [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    if any(ch in i for i in ids for ch in "*?[]"):
        raise SystemExit("REFUSE: glob character in --ids-file; explicit ids only")
    if len(ids) > MAX_IDS:
        raise SystemExit(f"REFUSE: {len(ids)} ids > cap {MAX_IDS}")
    return ids


def main() -> int:
    compact = json.loads(COMPACT.read_text(encoding="utf-8"))
    ids = explicit_ids(sys.argv[1:])
    if ids is not None:
        missing = [i for i in ids if i not in compact]
        if missing:
            raise SystemExit(f"REFUSE: ids not in compact: {missing[:5]}")
        compact = {i: compact[i] for i in ids}
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
        try:
            raw = canonical_js_body_bytes(payload)
        except (TypeError, ValueError) as e:
            print(f"HALT {surface} — payload has no supported JS canonical form: {e}", file=sys.stderr)
            failures += 1
            continue
        if len(raw) > MAX_PAYLOAD_BYTES:
            print(f"HALT {surface} {len(raw)}B > {MAX_PAYLOAD_BYTES}B", file=sys.stderr)
            failures += 1
            continue
        local_digest = hashlib.sha256(raw).hexdigest()
        try:
            sig, attested_digest = sign_via_oidc_attested(payload)
        except Exception as e:  # OIDC missing or endpoint refusal — never sign another way
            print(f"UNSIGNED {surface} — {e}", file=sys.stderr)
            failures += 1
            continue
        if attested_digest != local_digest:
            print(
                f"UNSIGNED {surface} — board signer digest {attested_digest} "
                f"does not match locally reproduced JS payload digest {local_digest}",
                file=sys.stderr,
            )
            failures += 1
            continue
        if not isinstance(sig, str) or not SIGNATURE_HEX.fullmatch(sig):
            print(f"UNSIGNED {surface} — board signer returned a malformed Ed25519 signature", file=sys.stderr)
            failures += 1
            continue
        card = {
            "as_of": atom.get("as_of") or payload.get("as_of"),
            "did": DID,
            "payload": payload,
            "schema": SCHEMA,
            "sha256": attested_digest,
            "sig_ed25519": sig,
            "surface": surface,
            "subject": atom.get("subject"),
            "source_urls": atom.get("source_urls"),
            "unmeasured": atom.get("unmeasured", []),
        }
        out = INTEROP / f"ledger-card-{slug(surface)}.json"
        out.write_text(json.dumps(card, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        print("SIGNED", surface, attested_digest[:16])
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
