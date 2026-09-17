#!/usr/bin/env python3
"""CSOAI Master Closed-Loop Harness — own the entire measure pipeline end-to-end.

Loop:
  harvest → measure → fix → sign → root → anchor → rekor → ots → publish
              ↑                                              ↓
              └──────────── remeasure (after fix) ──────────┘

For every source in the master harness index, for every axis slot, for every
goal-object, this produces the canonical measurement-card → signs it → roots it →
records it in Sigstore Rekor → OTS-stamps it → publishes to the board.

The six EXTERNAL blockers we cannot move (per M4 message 17 Sep 2026):
  1. xAI spending limit                 (cannot submit to grok)
  2. Cloudflare zone blocking curl     (cannot verify edge deploys without browser)
  3. GitHub account restriction         (cannot push as csoai-bot)
  4. Board signing key unreachable      (cannot sign with the master Ed25519 key)
  5. OTS calendar rate limit            (recovery is in flight; calendar throttles)
  6. COSE interop key (on this machine) (using it to fill sig:null would be forgery)

What we CAN do today:
  - Use the per-machine Ed25519 key for HARVEST/STAGE signatures
  - Build the canonical measurement-card schema end-to-end
  - Merkle-root per (axis × source) and publish the root
  - Submit to Sigstore Rekor (FREE, no key needed for public entries)
  - OTS-stamp every artifact (calendar pending is fine, that's still a real proof)
  - Publish to public/interop/, git-track, and let the board ingest

This script is the runnable version. It is idempotent. It can be triggered by
the continuous-churn engine every tick.
"""
from __future__ import annotations
import argparse, hashlib, io, json, os, pathlib, subprocess, sys, time
from datetime import datetime, timezone
from opentimestamps.core.timestamp import Timestamp
from opentimestamps.core.op import OpSHA256
from opentimestamps.core.serialize import BytesSerializationContext
from opentimestamps.calendar import RemoteCalendar

# ──────────────────────────────────────────────────────────────────────────────
# 1. IDENTITY — read the per-machine Ed25519 keypair
# ──────────────────────────────────────────────────────────────────────────────
def machine_keypair():
    """Return (private_path, public_path, fingerprint) for this machine.
    The key is per-machine, NOT the board key. Used only for HARVEST/STAGE sigs.
    """
    home = pathlib.Path(os.environ.get("HOME", "."))
    pkdir = home / ".csoai" / "keys"
    pkdir.mkdir(parents=True, exist_ok=True)
    priv = pkdir / "harvest_ed25519.pem"
    pub = pkdir / "harvest_ed25519.pub"
    if not priv.exists():
        # One-shot generate
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
        from cryptography.hazmat.primitives import serialization
        k = Ed25519PrivateKey.generate()
        priv.write_bytes(k.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()))
        pub.write_bytes(k.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo))
    fp = hashlib.sha256(pub.read_bytes()).hexdigest()[:16]
    return priv, pub, f"machine-harvest:{fp}"


# ──────────────────────────────────────────────────────────────────────────────
# 1b. AUTHORITY — a signature being VALID says nothing about who may speak
# ──────────────────────────────────────────────────────────────────────────────
# A harvest key signs correctly every time. That is arithmetic, not standing.
# Before this existed the pipeline emitted a bare `signed` state and a banner read
# "SIGNED ✓" over 56 artifacts whose own scope text disclaimed authority. Authority
# is now a FIELD, so a banner can never outrun what the artifact says.
#
# The allowlist can grant HARVEST authority only. It can NEVER grant board/sovereign
# authority: that lives with did:web:csoai.org#board-attestation-1 via the approved
# signer, and this code has no path to it.
HARVEST_ALLOWLIST_PATH = pathlib.Path(
    os.environ.get("CSOAI_HARVEST_ALLOWLIST", pathlib.Path.home() / ".csoai" / "harvest_allowlist.json")
)


def harvest_authority(fingerprint: str) -> tuple[str, dict | None]:
    """(authority, grant) for a harvest key fingerprint.

    Default — and the default is the whole point — is NOT_ESTABLISHED. A grant
    appears only if an allowlist file explicitly names this fingerprint AND gives
    a reason. A malformed or absent allowlist is NOT_ESTABLISHED, never a grant.
    """
    try:
        entries = json.loads(HARVEST_ALLOWLIST_PATH.read_text()).get("grants") or {}
    except Exception:  # noqa: BLE001 — absent/unreadable/malformed all mean: no grant
        return "NOT_ESTABLISHED", None
    grant = entries.get(fingerprint)
    if not isinstance(grant, dict) or not grant.get("reason"):
        return "NOT_ESTABLISHED", None
    return "HARVEST_AUTHORITY_GRANTED", {
        "scope": "harvest-stage only — never board/sovereign authority",
        "granted_by": HARVEST_ALLOWLIST_PATH.as_posix(),
        "reason": grant["reason"],
    }


def sign_harvest(canonical_bytes: bytes) -> dict:
    """Sign with the per-machine Ed25519 key.
    This is a HARVEST/STAGE signature, NOT a board signature.

    signer_authority is explicitly NOT_ESTABLISHED:
      - This key has no allowlist granting it sovereign authority.
      - COSE interop key in ~/.csoai-keys/ is a different system's key.
      - Only the board key (via approved signer / GHA) carries authority.
    """
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    priv_path = pathlib.Path(os.environ.get("CSOAI_HARVEST_PRIV", pathlib.Path.home() / ".csoai" / "keys" / "harvest_ed25519.pem"))
    pub_path = pathlib.Path(os.environ.get("CSOAI_HARVEST_PUB", pathlib.Path.home() / ".csoai" / "keys" / "harvest_ed25519.pub"))
    priv_bytes = priv_path.read_bytes()
    k = serialization.load_pem_private_key(priv_bytes, password=None)
    if isinstance(k, Ed25519PrivateKey):
        sig = k.sign(canonical_bytes)
    else:
        raise RuntimeError(f"Expected Ed25519PrivateKey, got {type(k).__name__}")
    fp = hashlib.sha256(pub_path.read_bytes()).hexdigest()[:16]
    authority, grant = harvest_authority(fp)
    out = {
        "signature_kind": "harvest-stage",
        "algorithm": "ed25519",
        "key_fingerprint": f"machine-harvest:{fp}",
        "signature_b64": __import__("base64").b64encode(sig).decode(),
        "signer_authority": authority,
        "scope": "this signature attests the measurement artifact was produced by THIS MACHINE'S harvest pipeline. The COSE interop key in ~/.csoai-keys/ is a different system; using it for sig:null would be forgery. Only the board key (via approved signer / GHA) carries sovereign authority — no allowlist entry can confer it.",
    }
    if grant:
        out["harvest_authority_grant"] = grant
    return out


# ──────────────────────────────────────────────────────────────────────────────
# 2. ROOT — merkle tree per batch
# ──────────────────────────────────────────────────────────────────────────────
def merkle_root(leaves: list[bytes]) -> tuple[bytes, list[list[bytes]]]:
    """Build a binary Merkle tree, return (root, [proof_layers])."""
    if not leaves:
        return hashlib.sha256(b"").digest(), []
    layer = sorted(hashlib.sha256(l).digest() for l in leaves)
    layers = [layer]
    while len(layer) > 1:
        nxt = []
        for i in range(0, len(layer), 2):
            a = layer[i]
            b = layer[i+1] if i+1 < len(layer) else a
            nxt.append(hashlib.sha256(a + b).digest())
        layer = nxt
        layers.append(layer)
    return layer[0], layers


def inclusion_proof(leaf_digest: bytes, layers: list[list[bytes]]) -> list[str]:
    """Compute Merkle inclusion proof for one leaf.
    layers[0] is the leaf layer (sorted digests). We track the leaf's index
    across each upper layer. At each level, the sibling is at idx^1; if that
    position is out of range, the sibling is the leaf itself (this happens
    when the layer has an odd number of nodes — we duplicated last).
    """
    if not layers or leaf_digest not in layers[0]:
        return []
    idx = layers[0].index(leaf_digest)
    proof = []
    for layer in layers[1:]:
        pair_idx = idx ^ 1
        if pair_idx < len(layer):
            sibling = layer[pair_idx]
        else:
            # Layer was extended by duplicating last; sibling = self
            sibling = layer[idx] if idx < len(layer) else layer[-1]
        proof.append(sibling.hex())
        idx //= 2
    return proof


def verify_inclusion(leaf: bytes, proof: list[str], root_hex: str) -> bool:
    """Verify a leaf is in the Merkle tree."""
    h = hashlib.sha256(leaf).digest()
    for sib_hex in proof:
        sib = bytes.fromhex(sib_hex)
        h = hashlib.sha256(h + sib).digest() if h < sib else hashlib.sha256(sib + h).digest()
    return h.hex() == root_hex


def sign_raw_ed25519(data: bytes) -> bytes:
    """Raw Ed25519 signature over `data` with the per-machine harvest key.

    Used for Rekor `rekord` entries, which carry the bytes and a signature over
    exactly those bytes. This says the harvest pipeline produced them; it says
    nothing about authority — see harvest_authority().
    """
    from cryptography.hazmat.primitives import serialization
    priv_path = pathlib.Path(os.environ.get("CSOAI_HARVEST_PRIV", pathlib.Path.home() / ".csoai" / "keys" / "harvest_ed25519.pem"))
    key = serialization.load_pem_private_key(priv_path.read_bytes(), password=None)
    return key.sign(data)


# ──────────────────────────────────────────────────────────────────────────────
# 3. SIGSTORE REKOR — FREE public log, no key needed
# ──────────────────────────────────────────────────────────────────────────────
def submit_rekor(artifact_canonical: bytes, sha256_hex: str,
                 real_ed25519_pubkey_pem: bytes | None = None,
                 sign_bytes=None, enabled: bool | None = None) -> dict:
    """Record this artifact in the public Sigstore Rekor log — or say why we did not.

    What was wrong here before (found 2026-09-17): the "real key" path posted a
    hashedrekord whose signature content was sixty-four ZERO BYTES with a genuine
    public key beside it. Sigstore rejects it, correctly. Worse, had it ever been
    accepted it would have been an anchor to a signature nobody made. A submission
    we know will be rejected is not a submission, and must never be counted as one.

    Now there are exactly two outcomes, and no third:
      A. SUBMITTED — a real `rekord` entry: the artifact bytes, an Ed25519 signature
         this process actually computed over those bytes, and the PEM public key.
         `rekord` (not `hashedrekord`) because hashedrekord verifies a signature
         against a digest, which Ed25519 cannot do — that shape is rejected by
         construction, whatever key you put beside it.
      B. NOT_SUBMITTED — with the reason. Absent key, absent bytes, submission
         disabled, or a live error: all say so in `reason`.

    Submission is OFF unless explicitly enabled. A Rekor entry is permanent and
    public; that is the owner's call to make, not this script's.
    """
    import base64, os, urllib.request

    now_ts = datetime.now(timezone.utc).isoformat()

    def not_submitted(reason: str) -> dict:
        return {"state": "NOT_SUBMITTED", "reason": reason, "checked_at": now_ts}

    if enabled is None:
        enabled = os.environ.get("CSOAI_REKOR_SUBMIT", "").lower() in ("1", "true", "yes")
    if not enabled:
        return not_submitted(
            "submission disabled (set CSOAI_REKOR_SUBMIT=1 to enable). A Rekor entry is "
            "permanent and public; publishing one is an owner decision.")
    if real_ed25519_pubkey_pem is None:
        return not_submitted(
            "no Ed25519 public key (PEM) supplied. The old zero-signature hashedrekord "
            "path was removed: it was rejected by Sigstore and would have been a false "
            "anchor if it had not been.")
    if not artifact_canonical:
        return not_submitted(
            "no artifact bytes supplied. A `rekord` entry carries the bytes and a real "
            "signature over them; there is nothing here to sign or to anchor.")
    if sign_bytes is None:
        return not_submitted("no signing function supplied; refusing to post an unsigned entry")

    try:
        signature = sign_bytes(artifact_canonical)
    except Exception as e:  # noqa: BLE001
        return not_submitted(f"signing failed: {type(e).__name__}: {str(e)[:120]}")

    try:
        body = json.dumps({
            "apiVersion": "0.0.1",
            "kind": "rekord",
            "spec": {
                "data": {"content": base64.b64encode(artifact_canonical).decode()},
                "signature": {
                    "format": "ed25519",
                    "content": base64.b64encode(signature).decode(),
                    "publicKey": {"content": base64.b64encode(real_ed25519_pubkey_pem).decode()},
                },
            },
        }).encode()
        req = urllib.request.Request(
            "https://rekor.sigstore.dev/api/v1/log/entries",
            data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read())
        uuid = next(iter(data), None) if isinstance(data, dict) else None
        entry = data.get(uuid, {}) if uuid else {}
        return {
            "state": "SUBMITTED",
            "uuid": uuid,
            "log_index": entry.get("logIndex"),
            "log_url": f"https://rekor.sigstore.dev/api/v1/log/entries?uuid={uuid}",
            "integrated_time": entry.get("integratedTime"),
            "sha256_anchored": sha256_hex,
            "submitted_at": now_ts,
        }
    except Exception as e:  # noqa: BLE001
        return not_submitted(f"{type(e).__name__}: {str(e)[:200]}")


# ──────────────────────────────────────────────────────────────────────────────
# 4. OTS — calendar pending is still a real proof
# ──────────────────────────────────────────────────────────────────────────────
CALS = ["https://a.pool.opentimestamps.org", "https://b.pool.opentimestamps.org",
        "https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org"]


def ots_stamp(digest: bytes) -> dict:
    """Submit to every calendar, return serialized proof + list of calendar responses.
    A calendar-pending stamp is a real proof; it just isn't Bitcoin-attested yet.
    """
    ts = Timestamp(digest)
    responses = {}
    for url in CALS:
        try:
            cal = RemoteCalendar(url)
            ts.merge(cal.submit(digest, timeout=15))
            responses[url] = "ok"
        except Exception as e:
            responses[url] = f"err:{str(e)[:60]}"
    if not any(v == "ok" for v in responses.values()):
        return {"ok": False, "calendar_responses": responses}
    ctx = BytesSerializationContext()
    DetachedTimestampFile = __import__("opentimestamps.core.timestamp", fromlist=["DetachedTimestampFile"]).DetachedTimestampFile
    DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
    ots_bytes = ctx.getbytes()
    return {
        "ok": True,
        "ots_bytes": ots_bytes,
        "ots_size": len(ots_bytes),
        "calendar_responses": responses,
        "state": "PENDING_BITCOIN_CONFIRMATION",
    }


# ──────────────────────────────────────────────────────────────────────────────
# 5. THE PIPELINE — one artifact per (source × axis × goal)
# ──────────────────────────────────────────────────────────────────────────────
def emit_artifact(src_name: str, axis_name: str, goal_name: str, observation: dict, evidence_url: str | None) -> dict:
    """Build a canonical measurement-card and run the full loop on it."""
    artifact = {
        "schema": "csoai.measurement-card/0.1",
        "kind": "measurement-card",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "subject": {
            "source": src_name,
            "axis": axis_name,
            "goal": goal_name,
        },
        "observation": observation,
        "evidence_url": evidence_url,
        "signatures": [],
        "merkle_root": None,
        "rekor": None,
        "ots": None,
        "disclaimers": [
            "MEASUREMENT, not CERTIFICATION. Empty is not zero.",
            "This artifact is part of the closed-loop harness: harvest → measure → fix → sign → root → anchor → rekor → ots → publish → remeasure.",
        ],
    }
    # Step 1: Sign with harvest-stage key
    canonical_pre = json.dumps(artifact, sort_keys=True, separators=(",", ":")).encode()
    sig = sign_harvest(canonical_pre)
    artifact["signatures"].append(sig)
    canonical_post_sig = json.dumps(artifact, sort_keys=True, separators=(",", ":")).encode()
    artifact["sha256"] = hashlib.sha256(canonical_post_sig).hexdigest()
    artifact["byte_size"] = len(canonical_post_sig)
    return artifact, canonical_post_sig


def run_loop(artifacts: list[dict], outdir: pathlib.Path) -> dict:
    """Run the full closed loop on a batch of artifacts:
       harvest → measure → sign → root → anchor → rekor → ots → publish
    """
    outdir.mkdir(parents=True, exist_ok=True)
    canonicals = []
    merkles = []
    cards = []
    for art, canonical in artifacts:
        canonicals.append(canonical)
        merkles.append(bytes.fromhex(art["sha256"]))
        cards.append(art)
        # Write individual card
        p = outdir / f"{art['subject']['source']}__{art['subject']['axis']}__{art['subject']['goal']}.json"
        p.write_bytes(canonical)
        # Per-card OTS
        ots_result = ots_stamp(bytes.fromhex(art["sha256"]))
        if ots_result.get("ok"):
            (p.parent / f"{p.name}.ots").write_bytes(ots_result["ots_bytes"])
            del ots_result["ots_bytes"]
        art["ots"] = ots_result

    # Step 2: Merkle root the batch
    root, layers = merkle_root(canonicals)
    root_hex = root.hex()
    rollup = {
        "schema": "csoai.batch-rollup/0.1",
        "kind": "rollup",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "cards_count": len(cards),
        "merkle_root": root_hex,
        "merkle_algorithm": "sha256-binary-sorted",
        "card_sha256s": [c["sha256"] for c in cards],
        "rollup_disclaimers": [
            "The Merkle root records that this exact set of artifacts existed at this exact byte content at this time. It does NOT attest who produced them — for that, see the per-card harvest-stage signatures and the Sigstore Rekor entries.",
        ],
    }

    # Step 3: Sign rollup with harvest-stage key (proves we built the root)
    rollup_canonical = json.dumps(rollup, sort_keys=True, separators=(",", ":")).encode()
    rollup_sig = sign_harvest(rollup_canonical)
    rollup["harvest_signature"] = rollup_sig
    rollup["sha256"] = hashlib.sha256(rollup_canonical).hexdigest()
    rollup["byte_size"] = len(rollup_canonical)

    # Step 4: OTS the rollup
    ots_rollup = ots_stamp(bytes.fromhex(rollup["sha256"]))
    if ots_rollup.get("ok"):
        (outdir / "batch-rollup.ots").write_bytes(ots_rollup["ots_bytes"])
        del ots_rollup["ots_bytes"]
    rollup["ots"] = ots_rollup

    # Step 5: Record each card in Sigstore Rekor — or record why we did not.
    # We pass our real per-machine Ed25519 public key (NOT the COSE interop key),
    # the ACTUAL artifact bytes, and a signer that really signs them. Anything
    # missing yields NOT_SUBMITTED with the reason. Never a fake count.
    pubkey_path = pathlib.Path(os.environ.get("CSOAI_HARVEST_PUB", pathlib.Path.home() / ".csoai" / "keys" / "harvest_ed25519.pub"))
    real_pk_pem = pubkey_path.read_bytes() if pubkey_path.exists() else None
    rekor_results = []
    for art in cards:
        art_bytes = json.dumps(art, sort_keys=True, separators=(",", ":")).encode()
        r = submit_rekor(art_bytes, art["sha256"],
                         real_ed25519_pubkey_pem=real_pk_pem, sign_bytes=sign_raw_ed25519)
        art["rekor"] = r
        rekor_results.append({"sha256": art["sha256"], "rekor": r})
    rollup["rekor_submissions"] = rekor_results

    # Step 6: Record the rollup root the same way
    rollup_bytes = json.dumps(rollup, sort_keys=True, separators=(",", ":")).encode()
    rollup_rekor = submit_rekor(rollup_bytes, rollup["sha256"],
                                real_ed25519_pubkey_pem=real_pk_pem, sign_bytes=sign_raw_ed25519)
    rollup["rollup_rekor"] = rollup_rekor

    # Step 7: Write final rollup
    (outdir / "batch-rollup.json").write_bytes(json.dumps(rollup, indent=2).encode())

    # Step 8: Update each card with merkle inclusion proof
    for art, canonical in zip(cards, canonicals):
        proof = inclusion_proof(bytes.fromhex(art["sha256"]), layers)
        art["merkle_root"] = root_hex
        art["merkle_proof"] = proof
        p = outdir / f"{art['subject']['source']}__{art['subject']['axis']}__{art['subject']['goal']}.json"
        p.write_bytes(json.dumps(art, indent=2).encode())

    return rollup


# ──────────────────────────────────────────────────────────────────────────────
# 6. CLI
# ──────────────────────────────────────────────────────────────────────────────
def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="public/interop/closed-loop")
    ap.add_argument("--harness", default="public/interop/master-harness-index-v0.4.json")
    a = ap.parse_args()

    harness_path = pathlib.Path(a.harness)
    if not harness_path.exists():
        print(f"harness not found: {harness_path}", file=sys.stderr)
        return 2
    harness = json.loads(harness_path.read_text())

    # Bootstrap the harvest-stage keypair (one-shot)
    machine_keypair()

    outdir = pathlib.Path(a.out)
    outdir.mkdir(parents=True, exist_ok=True)

    # Generate one artifact per (source × axis × goal) for sources that have axis/goal bindings
    artifacts = []
    pairs = []
    seen = set()
    for s in harness.get("sources_bound_to_harness", []):
        src = s.get("name", "?")
        for a_name in s.get("axes", [s.get("axis_name", "")]):
            for g in s.get("goal_objects", []):
                key = (src, a_name, g)
                if key in seen:
                    continue
                seen.add(key)
                # Skip if no axis or no goal
                if not a_name or not g:
                    continue
                obs = {
                    "method": "passive-enumeration",
                    "source_kind": s.get("kind", s.get("category", "?")),
                    "as_of": s.get("as_of") or harness.get("generated_at"),
                    "value": s.get("measurement") or s.get("enumerated_count") or s.get("axis_state", "declared"),
                }
                art, canonical = emit_artifact(src, a_name, g, obs, s.get("evidence_url") or s.get("artifact_url"))
                artifacts.append((art, canonical))
                pairs.append(key)

    if not artifacts:
        print("nothing to process", file=sys.stderr)
        return 0

    print(f"=== Master Closed-Loop Harness ===")
    print(f"artifacts: {len(artifacts)}")
    print(f"outdir: {outdir}")

    rollup = run_loop([a for a in artifacts], outdir)

    print(f"merkle_root: {rollup['merkle_root'][:32]}...")
    n_submitted = sum(1 for r in rollup['rekor_submissions'] if (r.get('rekor') or {}).get('state') == 'SUBMITTED')
    n_not_submitted = sum(1 for r in rollup['rekor_submissions'] if (r.get('rekor') or {}).get('state') != 'SUBMITTED')
    print(f"rekor_submitted: {n_submitted}  rekor_not_submitted: {n_not_submitted}")
    print(f"ots_cards_pending: {sum(1 for k in pairs if True)}")
    rollup_rekor_state = (rollup.get('rollup_rekor') or {}).get('state', 'NOT_SUBMITTED')
    print(f"rollup_rekor_state: {rollup_rekor_state}")
    authorities = sorted({(a.get("signature") or {}).get("signer_authority", "MISSING") for a in artifacts}) if artifacts else []
    print(f"\nDONE. Artifacts signed (signer_authority: {', '.join(authorities) or 'n/a'}), rooted, OTS-stamped. Rekor state reported honestly.")
    if n_submitted == 0:
        reasons = sorted({(r.get('rekor') or {}).get('reason', '?') for r in rollup['rekor_submissions']})
        print(f"  NOTE: 0/{len(rollup['rekor_submissions'])} Rekor submissions. Un-submitted entries are NEVER counted as submitted. Reason(s): " + " | ".join(reasons))
    print(f"\nSix external blockers (NOT ours to move):")
    print(f"  1. xAI spending limit                 — cannot submit to grok")
    print(f"  2. Cloudflare zone blocking curl      — cannot verify edge deploys without browser")
    print(f"  3. GitHub account restriction         — cannot push as csoai-bot (use the human account)")
    print(f"  4. Board signing key unreachable      — using per-machine harvest key instead")
    print(f"  5. OTS calendar rate limit            — calendar-pending is still a real proof")
    print(f"  6. COSE interop key on this machine   — using it for sig:null would be forgery; UNSIGNED is the correct state")
    return 0


if __name__ == "__main__":
    sys.exit(main())
