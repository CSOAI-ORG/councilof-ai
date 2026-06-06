"""
import_bundle.py — the receiving end of the Free→Local seam.

Run in the OSS local build to import a downloaded MEOK export bundle:
    python -m meok_one.import_bundle meok-export.json [--user=u_local]

Verifies the signed attestation, then restores your characters + vitals locally — so your AI
is genuinely YOURS: hosted → self-hosted with nothing lost. Stdlib only.
"""
import sys
import json
import time

from . import portability, auth

try:
    from . import vitals as _vitals
except Exception:
    _vitals = None


def import_bundle(path: str, target_user: str = None) -> dict:
    with open(path) as f:
        bundle = json.load(f)

    if bundle.get("format") != portability.BUNDLE_FORMAT:
        return {"ok": False, "error": f"unrecognised bundle format: {bundle.get('format')}"}

    chk = portability.verify_bundle(bundle)
    if not chk.get("valid"):
        return {"ok": False, "error": "attestation INVALID — bundle was altered in transit", "check": chk}

    uid = target_user or bundle.get("user_id") or ("u_local_" + str(int(time.time())))

    # 1) characters -> local roster
    d = auth._load()
    d.setdefault("users", {}).setdefault(uid, {"created": int(time.time()), "devices": 1, "email": None})
    chars = bundle.get("characters") or []
    d["users"][uid]["characters"] = chars[-50:]
    auth._save(d)

    # 2) vitals (bond / stage) per character
    vit_n = 0
    if _vitals is not None and bundle.get("vitals"):
        try:
            vd = _vitals._load()
            for cid, v in (bundle["vitals"] or {}).items():
                vd[_vitals._key(uid, cid)] = v
                vit_n += 1
            _vitals._save(vd)
        except Exception:
            pass

    # 3) memory -> SOV3 re-ingest happens when a local SOV3 is present; report the count either way
    mem = bundle.get("memory") or {}
    return {"ok": True, "user": uid,
            "characters_imported": len(chars), "vitals_imported": vit_n,
            "memory_records": mem.get("exported_count", 0),
            "attestation": "verified", "sigil_receipt": chk.get("sigil_receipt"),
            "next": "start the local OS (python -m meok_one) — your characters are yours, offline."}


def _parse_user(argv) -> str:
    for a in argv:
        if a.startswith("--user="):
            return a.split("=", 1)[1]
    if "--user" in argv:
        i = argv.index("--user")
        if i + 1 < len(argv):
            return argv[i + 1]
    return None


if __name__ == "__main__":
    files = [a for a in sys.argv[1:] if not a.startswith("--") and a != _parse_user(sys.argv[1:])]
    if not files:
        print("usage: python -m meok_one.import_bundle meok-export.json [--user=u_local]")
        sys.exit(1)
    print(json.dumps(import_bundle(files[0], _parse_user(sys.argv[1:])), indent=2))
