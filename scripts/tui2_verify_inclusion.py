#!/usr/bin/env python3
"""TUI-2 post-merge inclusion verifier for the staged stablecoin cohort atoms.

Reads the unsigned card-v0 atoms staged in
public/interop/stablecoin-cohort-2026-09/ on master, derives the digest each
atom WILL have once the public-root publisher signs it (the publisher upgrades
schema card-v0 -> card-v1 and adds did/digest_covers/sig_covers; the v1 leaf
digest covers the whole card except sha256 and sig_ed25519 — derivation
verified 13/13 against publisher PR #2042 on 2026-09-12), then checks the LIVE
public root and /api/proof for each derived digest.

Verdicts (never blended):
  VALID       — derived digest is a leaf of the live root and /api/proof returns
                an inclusion proof for it.
  UNCHECKABLE — network/endpoint failure, OR the live root has not yet advanced
                to the post-merge count (honest pending, not an error).
  INVALID     — the live root advanced to/past the expected post-merge count and
                the derived digest is provably NOT a leaf. That is a
                contradiction: the signer ran, the root moved, our atom is absent.

Exit codes: 0 = no INVALID (prints PENDING or ALL-VALID summary); 2 = at least
one INVALID. Stdlib only. Keyless. £0.

Usage:
  python3 scripts/tui2_verify_inclusion.py            # live check
  python3 scripts/tui2_verify_inclusion.py --selftest # offline, no network
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from pathlib import Path

STAGED_DIR = Path("public/interop/stablecoin-cohort-2026-09")
LIVE_ROOT_URL = "https://councilof.ai/root.json"
PROOF_URL = "https://councilof.ai/api/proof?sha="

# The post-merge root that carries these atoms must have at least the pre-merge
# 228 leaves plus our 13 staged atoms (publisher PR #2042 carried exactly 241).
EXPECTED_POST_MERGE_MIN = 241

# Publisher constants (scripts/publish_public_root.py). If the publisher ever
# changes these, derivation breaks and every atom reads UNCHECKABLE — never
# INVALID on derivation doubt.
PUBLISHER_DID = "did:web:csoai.org#board-attestation-1"
PUBLISHER_DIGEST_COVERS = "whole-card-except-sha256-and-sig_ed25519"
PUBLISHER_SIG_COVERS = (
    "compact envelope {did,schema,surface,as_of,sha256}; sha256 is the "
    "whole-card digest, so the signature binds subject, source_urls, tags, "
    "unmeasured and payload through it"
)
PUBLISHER_CARD_SCHEMA = "https://councilof.ai/schema/card-v1.json"


def canonical_bytes(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def derive_signed_card_digest(atom: dict) -> str:
    """Digest this atom will have as a signed card-v1 leaf in the public root."""
    pre = {k: v for k, v in atom.items() if k not in ("sha256", "sig_ed25519")}
    pre.update(
        {
            "did": PUBLISHER_DID,
            "digest_covers": PUBLISHER_DIGEST_COVERS,
            "sig_covers": PUBLISHER_SIG_COVERS,
            "schema": PUBLISHER_CARD_SCHEMA,
        }
    )
    return hashlib.sha256(canonical_bytes(pre)).hexdigest()


def load_atoms(repo_root: Path) -> list[dict]:
    atoms = []
    for path in sorted((repo_root / STAGED_DIR).glob("card-*-unsigned.json")):
        atom = json.loads(path.read_text(encoding="utf-8"))
        atoms.append(
            {
                "file": path.name,
                "subject": atom.get("subject"),
                "payload_sha256": hashlib.sha256(canonical_bytes(atom["payload"])).hexdigest(),
                "derived_digest": derive_signed_card_digest(atom),
            }
        )
    return atoms


def fetch_json(url: str, timeout: int = 20) -> tuple[int | None, dict | None]:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-TUI2-Verifier/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, json.loads(res.read())
    except Exception:
        return None, None


def verdict_for(atom: dict, live_root: dict | None, proof: dict | None) -> str:
    """VALID / UNCHECKABLE / INVALID — see module docstring."""
    if live_root is None:
        return "UNCHECKABLE"
    leaves = set(live_root.get("card_sha256") or [])
    count = live_root.get("card_count") or len(leaves)
    is_leaf = atom["derived_digest"] in leaves
    proof_ok = bool(proof and proof.get("kind") == "inclusion" and proof.get("proof"))
    if is_leaf and proof_ok:
        return "VALID"
    if count >= EXPECTED_POST_MERGE_MIN and not is_leaf:
        # Root advanced past the post-merge floor and our digest is absent.
        return "INVALID"
    return "UNCHECKABLE"


def run_live(repo_root: Path) -> int:
    atoms = load_atoms(repo_root)
    code, live_root = fetch_json(LIVE_ROOT_URL)
    if code != 200 or not isinstance(live_root, dict):
        print(f"live root UNCHECKABLE (HTTP {code}) — cannot prove anything either way")
        for a in atoms:
            print(f"{a['derived_digest'][:16]}  {str(a['subject'])[:48]:48}  UNCHECKABLE")
        print(f"PENDING — live root unreachable; {len(atoms)} atoms unproven")
        return 0
    count = live_root.get("card_count")
    as_of = live_root.get("as_of")
    rows = []
    n_invalid = n_valid = 0
    for a in atoms:
        _, proof = fetch_json(PROOF_URL + a["derived_digest"])
        v = verdict_for(a, live_root, proof)
        n_invalid += v == "INVALID"
        n_valid += v == "VALID"
        rows.append((a["derived_digest"][:16], str(a["subject"]), v))
    print(f"sha16             subject                                           verdict     (live root {count} cards, as_of {as_of})")
    for sha16, subject, v in rows:
        print(f"{sha16}  {subject[:52]:52}  {v}")
    if n_invalid:
        print(f"CONTRADICTION — {n_invalid} atom(s) not leaves of an advanced root ({count} >= {EXPECTED_POST_MERGE_MIN})")
        return 2
    if n_valid == len(atoms):
        print(f"ALL VALID — {n_valid}/{len(atoms)} atoms are signed leaves of live root {count} (as_of {as_of})")
    else:
        print(f"PENDING — root {count} (as_of {as_of}); {n_valid}/{len(atoms)} VALID, rest UNCHECKABLE until the publisher root lands")
    return 0


def selftest() -> int:
    # 1) Derivation reproduces the publisher transform exactly: build a fake
    # atom, emulate the publisher (schema upgrade + boilerplate + digest over
    # the whole card minus sha256/sig_ed25519), assert equality.
    atom = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "public.notice",
        "subject": "selftest atom",
        "as_of": "2026-09-12T00:00:00Z",
        "source_urls": ["https://example.test/src"],
        "payload": {"kind": "selftest", "state": "PROBED"},
        "sha256": "00" * 32,
        "unmeasured": ["nothing"],
        "tags": ["selftest"],
    }
    publisher_card = {
        "as_of": atom["as_of"],
        "did": PUBLISHER_DID,
        "digest_covers": PUBLISHER_DIGEST_COVERS,
        "sig_covers": PUBLISHER_SIG_COVERS,
        "payload": atom["payload"],
        "schema": PUBLISHER_CARD_SCHEMA,
        "sig_ed25519": "ab" * 64,
        "source_urls": atom["source_urls"],
        "subject": atom["subject"],
        "surface": atom["surface"],
        "tags": atom["tags"],
        "unmeasured": atom["unmeasured"],
    }
    publisher_digest = hashlib.sha256(
        canonical_bytes({k: v for k, v in publisher_card.items() if k not in ("sha256", "sig_ed25519")})
    ).hexdigest()
    assert derive_signed_card_digest(atom) == publisher_digest, "derivation != publisher transform"

    # 2) Verdict logic against canned roots/proofs.
    a = {"derived_digest": publisher_digest, "subject": "selftest"}
    live_old = {"card_count": 228, "card_sha256": []}
    live_new_with = {"card_count": 241, "card_sha256": [publisher_digest]}
    live_new_without = {"card_count": 241, "card_sha256": ["ff" * 32]}
    proof_ok = {"kind": "inclusion", "proof": ["x"]}
    assert verdict_for(a, live_old, None) == "UNCHECKABLE"       # pending, not error
    assert verdict_for(a, live_new_with, proof_ok) == "VALID"
    assert verdict_for(a, live_new_with, None) == "UNCHECKABLE"  # leaf but no proof yet
    assert verdict_for(a, live_new_without, None) == "INVALID"   # contradiction
    assert verdict_for(a, None, None) == "UNCHECKABLE"           # network fail

    # 3) On-disk atoms load and derive (13 on master at authoring time).
    atoms = load_atoms(Path(".").resolve())
    assert len(atoms) == 13, f"expected 13 staged atoms, found {len(atoms)}"
    assert all(len(a["derived_digest"]) == 64 for a in atoms)
    print("tui2_verify_inclusion selftest: PASS (derivation, verdicts, 13 atoms load)")
    return 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        raise SystemExit(selftest())
    raise SystemExit(run_live(Path(".").resolve()))
