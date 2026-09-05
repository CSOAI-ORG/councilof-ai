"""Staged UNSIGNED card-v0 atoms -> public-root leaves (file reader, no network).

Reads public/interop/xrpl-swift-eater-2026-09/card-*-unsigned.json — the
directory the XRPL/SWIFT eater (harness/rwa-attest/xrpl_swift_eater.py) stages
into — and hands each valid atom to publish_public_root.py as a public.notice
leaf. The writer signs it (GHA public-root.yml, BOARD_SIGN_KEY_PKCS8_B64 under
did:web:csoai.org#board-attestation-1), folds it into public/root.json, and
witness_public_root.py anchors the ONE root. That is the only path from
"staged unsigned" to "signed": nothing here signs, and nothing here can.

Fail-safe by construction: this adapter never raises. An atom that is not
card-v0, not public.notice, over the 3072-byte canonical cap, whose sha256 does
not match its payload, that already carries a signature, or that carries a
verdict word is SKIPPED with a reason in the sidecar — the hourly root is never
halted by a bad staged file. MEASURED is never written; the atoms carry
PROBED / DISCOVERED / UNMEASURED and keep them under the signature.
"""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from typing import Any

STAGED_DIRS = ("xrpl-swift-eater-2026-09",)
SURFACE = "public.notice"
CARD_SCHEMA = "https://councilof.ai/schema/card-v0.json"
CAP = 3072
STATES = {"PROBED", "DISCOVERED", "UNMEASURED"}
VERDICT_RE = re.compile(
    r"\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b"
    r"|(?<!UN)MEASURED",
    re.I,
)


def canonical_bytes(obj: Any) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _check(card: dict) -> str | None:
    """Return a skip reason, or None when the atom is a valid unsigned leaf."""
    if card.get("schema") != CARD_SCHEMA:
        return "schema is not card-v0"
    if card.get("surface") != SURFACE:
        return f"surface {card.get('surface')!r} is not {SURFACE}"
    payload = card.get("payload")
    if not isinstance(payload, dict):
        return "payload missing"
    if card.get("sig_ed25519") not in (None, ""):
        return "atom already carries a signature; staged atoms must be unsigned"
    if payload.get("state") not in STATES:
        return f"state {payload.get('state')!r} not in {sorted(STATES)}"
    raw = canonical_bytes(payload)
    if len(raw) > CAP:
        return f"payload {len(raw)}B > {CAP}B"
    if len(canonical_bytes(card)) > CAP:
        return f"card > {CAP}B"
    if hashlib.sha256(raw).hexdigest() != card.get("sha256"):
        return "sha256 != sha256(canonical payload)"
    m = VERDICT_RE.search(canonical_bytes(card).decode("utf-8"))
    if m:
        return f"verdict word {m.group(0)!r}"
    if not card.get("subject") or not card.get("as_of"):
        return "subject/as_of missing"
    urls = card.get("source_urls")
    if not isinstance(urls, list) or not urls or not all(isinstance(u, str) and u.startswith("https://") for u in urls):
        return "source_urls must be a non-empty list of https URLs"
    return None


def collect(repo_root: Path | None = None) -> dict[str, Any]:
    root = repo_root or Path(__file__).resolve().parents[2]
    leaves: list[dict[str, Any]] = []
    skipped: list[dict[str, str]] = []
    seen: set[str] = set()
    for d in STAGED_DIRS:
        base = root / "public" / "interop" / d
        if not base.is_dir():
            continue
        for path in sorted(base.glob("card-*-unsigned.json")):
            rel = f"{d}/{path.name}"
            try:
                card = json.loads(path.read_text(encoding="utf-8"))
            except Exception as e:  # never halt the root on a bad staged file
                skipped.append({"file": rel, "reason": f"json {type(e).__name__}"})
                continue
            reason = _check(card) if isinstance(card, dict) else "not an object"
            if reason:
                skipped.append({"file": rel, "reason": reason})
                continue
            if card["sha256"] in seen:
                skipped.append({"file": rel, "reason": "duplicate payload sha256"})
                continue
            seen.add(card["sha256"])
            leaves.append(
                {
                    "surface": SURFACE,
                    "subject": str(card["subject"]),
                    "as_of": str(card["as_of"]),
                    "source_urls": list(card["source_urls"]),
                    "payload": card["payload"],
                    "unmeasured": [str(x) for x in (card.get("unmeasured") or [])],
                    "tags": [str(x) for x in (card.get("tags") or [])],
                }
            )
    return {
        "leaves": leaves,
        "sidecar": {
            "dirs": list(STAGED_DIRS),
            "n_leaves": len(leaves),
            "n_skipped": len(skipped),
            "skipped": skipped[:20],
            "note": (
                "Staged unsigned atoms read from disk; no network. Signed only by the "
                "public-root writer in GHA. PROBED/DISCOVERED/UNMEASURED stay on the "
                "payload under the signature. Never MEASURED. Not a grade."
            ),
        },
    }


if __name__ == "__main__":
    out = collect()
    print(json.dumps({"n_leaves": len(out["leaves"]), "sidecar": out["sidecar"]}, indent=1, ensure_ascii=False))
    raise SystemExit(1 if out["sidecar"]["n_skipped"] else 0)
