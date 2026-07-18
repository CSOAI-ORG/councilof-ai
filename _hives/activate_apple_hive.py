#!/usr/bin/env python3
"""Activate the Apple/Siri Sovereign hive into the live SOV3 substrate.

What this DOES automatically (safe, idempotent):
  1. Validates _hives/apple-siri.hive.json.
  2. Registers the hive in a SOV3-readable registry  (_hives/registry.json).
  3. If SOV3 is reachable on :3101, logs the hive's creation to the sovereign
     ledger via the intuition-history module (real, SIGIL-signed) — so the
     activation is itself a governed, signed event.

What still needs the OWNER (printed at the end — needs the substrate + Hermes):
  A. Add 'apple-siri' to the King federation hive router
     (sovereign-temple/sov3_king_federation.py hive registry).
  B. Point the Hermes learner's read-only ingest at the hive's sources so it
     learns ongoingly (the "ASI-evolve / learns-from-King" part).

Usage:
  python3 _hives/activate_apple_hive.py            # register + log (safe)
  python3 _hives/activate_apple_hive.py --dry-run  # validate + show steps only
"""
import json, os, sys, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
SEED = os.path.join(ROOT, "apple-siri.hive.json")
REGISTRY = os.path.join(ROOT, "registry.json")
SOV3 = "http://127.0.0.1:3101"
DRY = "--dry-run" in sys.argv


def load_seed():
    with open(SEED) as f:
        h = json.load(f)
    assert h.get("hive") == "apple-siri", "seed hive id mismatch"
    assert h.get("parent") == "king-hive", "hive must descend from king-hive"
    print(f"✓ seed valid: {h['title']}  (parent={h['parent']}, queen={h['queen']})")
    return h


def register(h):
    reg = {}
    if os.path.exists(REGISTRY):
        try: reg = json.load(open(REGISTRY))
        except Exception: reg = {}
    reg[h["hive"]] = {"title": h["title"], "queen": h["queen"], "parent": h["parent"],
                      "sources": h["ingest_sources"], "status": "registered"}
    if DRY:
        print("  (dry-run) would write registry:", REGISTRY); return
    json.dump(reg, open(REGISTRY, "w"), indent=1)
    print(f"✓ registered in {REGISTRY}  ({len(reg)} hive(s))")


def sov3_alive():
    try:
        with urllib.request.urlopen(f"{SOV3}/health", timeout=4) as r:
            return r.status == 200
    except Exception:
        return False


def log_to_ledger(h):
    """Record the hive creation into the SOV3 sovereign ledger (signed)."""
    if not sov3_alive():
        print("• SOV3 not reachable on :3101 — skipping ledger log (start the substrate to sign it).")
        return
    if DRY:
        print("  (dry-run) would log hive_action to SOV3 ledger"); return
    try:
        sys.path.insert(0, os.path.join(ROOT, "..", "sovereign-temple"))
        from sov3_intuition_history import log_hive_action  # type: ignore
        rid = log_hive_action("apple-siri", "hive_created",
                              f"Activated {h['title']} (parent king-hive, queen {h['queen']})",
                              sigil_id="apple-siri-activation")
        print(f"✓ logged to sovereign ledger (id={rid}) — activation is signed.")
    except Exception as e:
        print(f"• Could not log via intuition-history ({e}). Registry write still succeeded.")


def owner_steps(h):
    print("\n── OWNER STEPS (needs the substrate + Hermes) ──")
    print("A. King federation — add to sovereign-temple/sov3_king_federation.py hive registry:")
    print(f'     "apple-siri": {{"queen": "{h["queen"]}", "parent": "king-hive"}},')
    print("B. Hermes ingest — point the read-only learner at these sources:")
    for s in h["ingest_sources"]:
        print(f"     - {s}")
    print("   (Hermes runs on the SOV3 substrate; ingest is read-only + SIGIL-signed.)")


if __name__ == "__main__":
    h = load_seed()
    register(h)
    log_to_ledger(h)
    owner_steps(h)
    print("\n🐉 apple-siri hive " + ("validated (dry-run)." if DRY else "registered + (if substrate up) signed into the ledger."))
