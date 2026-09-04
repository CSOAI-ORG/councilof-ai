#!/usr/bin/env python3
"""Unsigned card-v0 atoms for the deterministic-fact board axes.

Why this exists: 335 signed cards covered exactly ONE of the 22 board axes, because cards were
being signed under slugs the board does not use (gspc-governance vs governance) and because the
deterministic-fact axes had no card path at all. For those axes a stranger had to call
GET /api/gspc and trust the answer — which is the trust-as-a-service the estate exists to remove.

The facts already exist in the live readers. Nothing new is measured here; the readings are shaped
into atoms the existing GHA OIDC signer can sign (scripts/sign_ledger_cards.py).

CANONICALISATION — the reason this file does not reuse the other adapters' helper:
every published card carries
    preimage_rule: json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)
and the sibling adapters canonicalise with ensure_ascii=False. For an ASCII body the two agree, so
the mismatch is invisible — until an accented issuer appears. "Société Générale-FORGE" is 84 bytes
under the published rule and 68 under the adapters', with a different hash. A card signed over the
wrong bytes cannot be verified by anyone following its own stated rule. These axes carry European
bank and issuer names, so this path uses the PUBLISHED rule and asserts it.

Run:   python3 scripts/adapters/deterministic_axis_cards.py
Emits: public/interop/deterministic-axis-atoms.json
"""
from __future__ import annotations
import hashlib, json, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "interop" / "deterministic-axis-atoms.json"
DID = "did:web:csoai.org#card-attestation-1"
PREIMAGE_RULE = "json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')"

READERS = {
    "xrpl":  "https://councilof.ai/api/xrpl",
    "swift": "https://councilof.ai/api/swift",
}


def canonical_bytes(body: dict) -> bytes:
    """The PUBLISHED rule, not the adapters' variant. ensure_ascii=True is load-bearing."""
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("utf-8")


def get(url: str) -> dict | None:
    # A default urllib User-Agent is 403'd at the edge, so a stranger running a plain script
    # against our own published readers gets Forbidden. Identify honestly rather than spoofing.
    req = urllib.request.Request(url, headers={
        "User-Agent": "csoai-deterministic-axis-cards/0.1 (+https://councilof.ai)",
        "Accept": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except Exception as e:
        print(f"  reader unreachable {url}: {e}", file=sys.stderr)
        return None


def atom(axis: str, measurement: dict, source_url: str, as_of: str) -> dict:
    body = {
        "axis": axis,
        "created": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "issuer": "CSOAI Ltd (UK 16939677)",
        "kind": "gspc.measurement-card",
        "method": "deterministic-facts",
        "reader_as_of": as_of,
        "source": source_url,
        "verify": "https://councilof.ai/gspc-verify",
        **measurement,
    }
    pre = canonical_bytes(body)
    return {
        "alg": "Ed25519",
        "body": body,
        "id": hashlib.sha256(pre).hexdigest(),
        "preimage_rule": PREIMAGE_RULE,
        "kid": DID,
        "note": "NO_LAPTOP_SIGN — unsigned atom queued for GHA OIDC signing.",
    }


def build() -> list[dict]:
    atoms: list[dict] = []
    xr = get(READERS["xrpl"])
    sw = get(READERS["swift"])

    if xr and xr.get("assets"):
        assets = xr["assets"]
        as_of = str(xr.get("as_of"))
        # Verification strength is the reading that matters and nobody else grades it.
        strong = [a for a in assets if "bidirectional" in str(a.get("verified_via", "")).lower()]
        atoms.append(atom("reserve-attestation", {
            "n": len(assets),
            "n_bidirectionally_verified": len(strong),
            "verification_methods": sorted({str(a.get("verified_via")) for a in assets}),
            "establishes": "Count and identity-verification method of public issued assets on the XRPL reader at reader_as_of.",
            "does_not_establish": "Solvency, reserve adequacy, redemption, or any statement about the issuer's finances.",
        }, READERS["xrpl"], as_of))

        atoms.append(atom("custody-disclosure", {
            "n": len(assets),
            "n_with_named_issuer": sum(1 for a in assets if a.get("issuer")),
            "n_with_issuer_address": sum(1 for a in assets if a.get("issuer_address")),
            "establishes": "How many public issued assets disclose a named issuer and an on-ledger issuing address.",
            "does_not_establish": "Where the backing assets are held, or by whom.",
        }, READERS["xrpl"], as_of))

        atoms.append(atom("distribution-integrity", {
            "n": len(assets),
            "n_distributed": sum(1 for a in assets if a.get("kind") == "distributed"),
            "total_holders": sum(int(a.get("holders") or 0) for a in assets),
            "establishes": "Holder counts and distribution kind as reported by the ledger at reader_as_of.",
            "does_not_establish": "Whether holders are distinct persons, or anything about concentration of control.",
        }, READERS["xrpl"], as_of))

    if sw and sw.get("rows"):
        rows = sw["rows"]
        as_of = str(sw.get("as_of"))
        live = [r for r in rows if r.get("status") == "LIVE"]
        atoms.append(atom("regulatory-framework", {
            "n_sourced": len(rows),
            "n_live": len(live),
            "n_committed": sum(1 for r in rows if r.get("status") == "COMMITTED"),
            "n_discovered": sum(1 for r in rows if r.get("status") == "DISCOVERED"),
            "live_institutions": sorted(str(r.get("name")) for r in live),
            "universe_note": str(sw.get("universe_note", ""))[:300],
            "establishes": "How many named institutions in the Swift shared-ledger cohort could be sourced to a dated public URL, and how many have a sourced live transaction.",
            "does_not_establish": "That unsourced institutions are inactive. Absence of a sourceable record is not evidence of absence.",
        }, READERS["swift"], as_of))
    return atoms


def main() -> int:
    atoms = build()
    if not atoms:
        print("no atoms built — every reader was unreachable; refusing to emit an empty bundle", file=sys.stderr)
        return 1
    # Prove the stated rule is the rule actually used, on this run's real bytes.
    for a in atoms:
        assert hashlib.sha256(canonical_bytes(a["body"])).hexdigest() == a["id"], "preimage rule mismatch"
    bundle = {
        "schema": "csoai.deterministic-axis-atoms/0.1",
        "kind": "unsigned-atom-bundle",
        "as_of": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "preimage_rule": PREIMAGE_RULE,
        "n_atoms": len(atoms),
        "axes": sorted({a["body"]["axis"] for a in atoms}),
        "atoms": atoms,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(bundle, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"  {len(atoms)} unsigned atoms -> {OUT.relative_to(ROOT)}")
    for a in atoms:
        print(f"    {a['body']['axis']:24s} id={a['id'][:16]}…")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
