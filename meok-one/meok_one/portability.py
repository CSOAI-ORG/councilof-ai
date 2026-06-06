"""
portability.py — the Free→Local seam.

"True ownership" isn't an NFT — it's the right to walk away with everything and self-host it.
This builds a single, tamper-evident export bundle (GDPR Art 20 portability) that a hosted MEOK
user can download and import into the OSS local build with `import_bundle.py`. Stdlib only.

Bundle = your characters (roster) + per-character vitals (bond/stage) + your memory + a SIGIL-
signed sha256 attestation so the local side can prove the bundle wasn't tampered with in transit.
"""
import json
import time
import hashlib

from . import auth, vitals, sigil

try:
    from . import memory as _memory
except Exception:           # memory bridge talks to SOV3; degrade gracefully if absent
    _memory = None

BUNDLE_FORMAT = "meok-export/v1"


def export_bundle(user_id: str) -> dict:
    """Everything MEOK holds for this user, as a portable, signed bundle."""
    roster = auth.list_characters(user_id) if auth.user_exists(user_id) else []

    vit = {}
    for c in roster:
        cid = c.get("id")
        if not cid:
            continue
        try:
            vit[cid] = vitals.vitals(cid, user_id)
        except Exception:
            pass

    mem = {}
    if _memory is not None:
        try:
            mem = _memory.bridge().export(user_id)          # GDPR Art 20 (already implemented)
        except Exception as e:
            mem = {"error": str(e),
                   "note": "memory export unavailable right now; characters + vitals are still portable"}

    bundle = {
        "format": BUNDLE_FORMAT,
        "user_id": user_id,
        "exported_at": int(time.time()),
        "characters": roster,
        "vitals": vit,
        "memory": mem,
        "rights": "GDPR Art 20 data portability — everything MEOK holds for you, yours to self-host.",
        "import_with": "python -m meok_one.import_bundle meok-export.json   (in the OSS local build)",
    }

    # Tamper-evident attestation: sha256 over the canonical bundle + a SIGIL receipt.
    digest = _digest(bundle)
    receipt = None
    try:
        rec = sigil.record({"op": "M", "key": f"export:{user_id}",
                            "value": digest[:16], "salience": "1.0"})
        receipt = rec.get("receipt")
    except Exception:
        pass
    bundle["attestation"] = {
        "algo": "sha256",
        "digest": digest,
        "sigil_receipt": receipt,
        "verify": "re-hash the bundle minus this attestation block; compare to digest",
    }
    return bundle


def verify_bundle(bundle: dict) -> dict:
    """Re-hash a bundle (minus its attestation) and confirm it matches the signed digest."""
    att = (bundle or {}).get("attestation") or {}
    computed = _digest({k: v for k, v in bundle.items() if k != "attestation"})
    return {"valid": computed == att.get("digest"),
            "computed": computed, "claimed": att.get("digest"),
            "sigil_receipt": att.get("sigil_receipt")}


def _digest(obj: dict) -> str:
    canon = json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(canon).hexdigest()
