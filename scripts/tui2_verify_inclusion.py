#!/usr/bin/env python3
"""TUI-2 post-merge inclusion verifier for staged stablecoin cohort atoms.

Rebuild per the #2051 audit. Differences from the rejected version:

- The atom -> signed-card transform is NOT duplicated here. It is the
  publisher's own code: scripts/publish_public_root.py (make_card +
  card_sha256) imported and executed. If the publisher changes the transform,
  this verifier's derivation changes with it.
- VALID requires a FULLY FOLDED Merkle path, verified locally: the live root's
  card_count must equal len(card_sha256); the derived leaf digest must sit at
  the proof's index inside that list (exact sha/index binding, bounds checked);
  the sibling list is folded level by level (publisher's pair encoding,
  last-node duplication) and must equal the live merkle_root. A nonempty proof
  array alone is never VALID.
- Absence is UNCHECKABLE (honest pending) unless the publisher itself proves
  the staged source set was consumed: publisher-health.json shows a non-dry-run
  publish at the live root's as_of, after the atoms were merged to master, with
  no halt — and our digest is still not a leaf. Only that is INVALID.
- Nothing is hardcoded: atoms are read from the staging directory at runtime.

Exit codes: 0 = no INVALID (prints PENDING / ALL-VALID); 2 = contradiction.
Stdlib only, keyless, £0.

Usage:
  python3 scripts/tui2_verify_inclusion.py            # live check
  python3 scripts/tui2_verify_inclusion.py --selftest # offline
"""
from __future__ import annotations

import hashlib
import json
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import publish_public_root as publisher  # canonical transform: build_card / card_sha256

STAGED_DIR = Path("public/interop/stablecoin-cohort-2026-09")
LIVE_ROOT_URL = "https://councilof.ai/root.json"
PROOF_URL = "https://councilof.ai/api/proof?sha="
HEALTH_URL = "https://councilof.ai/publisher-health.json"

# The atoms entered master via #2009 at this time; any successful publish with
# as_of later than this ran staged_leaves over a master that contained them.
ATOMS_ON_MASTER_SINCE = "2026-09-12T15:14:02Z"


def load_atoms(repo_root: Path) -> list[dict]:
    atoms = []
    for path in sorted((repo_root / STAGED_DIR).glob("card-*-unsigned.json")):
        atom = json.loads(path.read_text(encoding="utf-8"))
        # Rebuild the leaf exactly as scripts/adapters/staged_leaves.py does,
        # then run the publisher's canonical card transform by import.
        leaf = {
            "surface": atom["surface"],
            "subject": str(atom["subject"]),
            "as_of": str(atom["as_of"]),
            "source_urls": list(atom["source_urls"]),
            "payload": atom["payload"],
            "unmeasured": [str(x) for x in (atom.get("unmeasured") or [])],
            "tags": [str(x) for x in (atom.get("tags") or [])],
        }
        card = publisher.make_card(leaf, sig=None, will_sign=True)
        atoms.append(
            {
                "file": path.name,
                "subject": str(atom["subject"]),
                "payload_sha256": hashlib.sha256(publisher.canonical_bytes(atom["payload"])).hexdigest(),
                "derived_digest": card["sha256"],
            }
        )
    return atoms


def fold_merkle(leaf_hex: str, index: int, proof: list[str], count: int) -> str | None:
    """Fold a publisher-style Merkle proof locally. Returns the computed root
    or None when the inputs are structurally invalid (bounds/shape)."""
    if not isinstance(index, int) or not (0 <= index < count):
        return None
    try:
        cur = bytes.fromhex(leaf_hex)
    except ValueError:
        return None
    idx = index
    level_len = count
    for sib_hex in proof:
        try:
            sib = bytes.fromhex(sib_hex)
        except ValueError:
            return None
        if len(sib) != 32 or len(cur) != 32:
            return None
        if idx % 2 == 0:
            cur = hashlib.sha256(cur + sib).digest()
        else:
            cur = hashlib.sha256(sib + cur).digest()
        idx //= 2
        level_len = (level_len + 1) // 2
    # after consuming all siblings we must have folded to a single root
    if level_len != 1:
        return None
    return cur.hex()


def fetch_json(url: str, timeout: int = 20):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-TUI2-Verifier/2.0"})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            return res.status, json.loads(res.read())
    except Exception:
        return None, None


def verdict_for(atom: dict, live_root: dict | None, proof: dict | None, health: dict | None) -> tuple[str, str]:
    """Returns (verdict, detail). VALID only on a locally folded path."""
    if live_root is None:
        return "UNCHECKABLE", "live root unreachable"
    leaves = live_root.get("card_sha256") or []
    count = live_root.get("card_count")
    root_hex = live_root.get("merkle_root")
    digest = atom["derived_digest"]
    if count != len(leaves):
        return "UNCHECKABLE", f"root count/bind mismatch (card_count={count}, leaves={len(leaves)})"
    if digest not in leaves:
        # Absence. Contradiction only if the publisher provably consumed the
        # staged source set: a successful non-dry-run publish at this root's
        # as_of, after the atoms were on master, with no halt.
        if (
            health
            and health.get("dry_run") is False
            and not (health.get("halt") or {}).get("unsigned_new_leaves")
            and str(health.get("as_of")) == str(live_root.get("as_of"))
            and str(live_root.get("as_of")) > ATOMS_ON_MASTER_SINCE
        ):
            return "INVALID", "publisher consumed staged inputs post-merge and this digest is not a leaf"
        return "UNCHECKABLE", "not a leaf of the live root (pending publish or publisher transform drift)"
    if not proof or proof.get("kind") != "inclusion":
        return "UNCHECKABLE", "leaf present but no inclusion proof served yet"
    idx = proof.get("index")
    siblings = proof.get("proof")
    if not isinstance(siblings, list) or not all(isinstance(s, str) for s in siblings):
        return "UNCHECKABLE", "proof shape invalid"
    if not (0 <= (idx if isinstance(idx, int) else -1) < count):
        return "UNCHECKABLE", f"proof index {idx} out of bounds for {count} leaves"
    if leaves[idx] != digest:
        return "INVALID", f"proof index {idx} binds a different leaf ({leaves[idx][:16]}…)"
    folded = fold_merkle(digest, idx, siblings, count)
    if folded is None:
        return "UNCHECKABLE", "proof could not be folded (shape)"
    if folded != root_hex:
        return "INVALID", f"folded root {folded[:16]}… != live merkle_root {str(root_hex)[:16]}…"
    return "VALID", f"leaf #{idx}/{count}, merkle path folds to live root {str(root_hex)[:16]}…"


def run_live(repo_root: Path) -> int:
    atoms = load_atoms(repo_root)
    code, live_root = fetch_json(LIVE_ROOT_URL)
    _, health = fetch_json(HEALTH_URL)
    if code != 200 or not isinstance(live_root, dict):
        print(f"live root UNCHECKABLE (HTTP {code})")
        return 0
    count = live_root.get("card_count")
    as_of = live_root.get("as_of")
    n_invalid = n_valid = 0
    print(f"sha16             subject                                           verdict       detail  (live root {count} cards, as_of {as_of})")
    for a in atoms:
        _, proof = fetch_json(PROOF_URL + a["derived_digest"])
        v, detail = verdict_for(a, live_root, proof, health)
        n_invalid += v == "INVALID"
        n_valid += v == "VALID"
        print(f"{a['derived_digest'][:16]}  {a['subject'][:52]:52}  {v:11}  {detail}")
    if n_invalid:
        print(f"CONTRADICTION — {n_invalid} atom(s) provably absent after the publisher consumed the staged set")
        return 2
    if n_valid == len(atoms):
        print(f"ALL VALID — {n_valid}/{len(atoms)} atoms fold into live root {count} (as_of {as_of})")
    else:
        print(f"PENDING — root {count} (as_of {as_of}); {n_valid}/{len(atoms)} VALID, rest UNCHECKABLE until the publisher root lands")
    return 0


def selftest() -> int:
    # 1) Derivation uses the publisher's own transform by import: a synthetic
    # leaf through build_card must produce the digest this verifier derives.
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
    leaf = {
        "surface": atom["surface"], "subject": atom["subject"], "as_of": atom["as_of"],
        "source_urls": atom["source_urls"], "payload": atom["payload"],
        "unmeasured": atom["unmeasured"], "tags": atom["tags"],
    }
    expect = publisher.make_card(leaf, sig=None, will_sign=True)["sha256"]
    # 2) Merkle fold: build a real tree with the publisher's code, take its
    # proof, and fold it here.
    leaves_hex = [hashlib.sha256(f"leaf-{i}".encode()).hexdigest() for i in range(7)]
    leaves_hex[3] = expect
    root = publisher.merkle_root(leaves_hex)
    proof = publisher.merkle_proof(leaves_hex, expect)
    assert fold_merkle(expect, 3, proof, len(leaves_hex)) == root
    # count binding is enforced in verdict_for by card_count == len(card_sha256)
    # plus index/sha binding; a wrong count is not always detectable by folding
    # alone (a leaf's path can be identical across adjacent tree shapes).
    assert fold_merkle(expect, 9, proof, len(leaves_hex)) is None  # bounds
    assert fold_merkle("00" * 32, 3, proof, len(leaves_hex)) != root  # wrong leaf
    # 3) Verdicts never blend.
    a = {"derived_digest": expect, "subject": "selftest"}
    live = {"card_count": len(leaves_hex), "card_sha256": leaves_hex, "merkle_root": root, "as_of": "2026-09-12T18:00:00Z"}
    good_proof = {"kind": "inclusion", "index": 3, "proof": proof}
    assert verdict_for(a, None, None, None)[0] == "UNCHECKABLE"
    assert verdict_for(a, live, good_proof, None)[0] == "VALID"
    assert verdict_for(a, live, None, None)[0] == "UNCHECKABLE"          # leaf, no proof
    bad_idx = {"kind": "inclusion", "index": 2, "proof": proof}
    assert verdict_for(a, live, bad_idx, None)[0] == "INVALID"           # index binds other leaf
    absent_live = {"card_count": 241, "card_sha256": ["ff" * 32] * 241, "merkle_root": "00" * 32, "as_of": "2026-09-12T13:00:00Z"}
    health_pre = {"dry_run": False, "halt": {"unsigned_new_leaves": 0}, "as_of": "2026-09-12T13:00:00Z"}
    assert verdict_for(a, absent_live, None, health_pre)[0] == "UNCHECKABLE"  # root predates merge: pending
    absent_post = dict(absent_live, as_of="2026-09-12T18:30:00Z")
    health_post = {"dry_run": False, "halt": {"unsigned_new_leaves": 0}, "as_of": "2026-09-12T18:30:00Z"}
    assert verdict_for(a, absent_post, None, health_post)[0] == "INVALID"     # consumed + absent: contradiction
    # 4) On-disk atoms load (count read from the dir, never hardcoded).
    atoms = load_atoms(Path(".").resolve())
    assert len(atoms) == 13, f"expected 13 staged atoms on master, found {len(atoms)}"
    assert all(len(x["derived_digest"]) == 64 for x in atoms)
    print("tui2_verify_inclusion selftest: PASS (publisher-imported transform, full merkle fold, verdict discipline, 13 atoms load)")
    return 0


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        raise SystemExit(selftest())
    raise SystemExit(run_live(Path(".").resolve()))
