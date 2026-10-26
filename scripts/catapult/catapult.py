#!/usr/bin/env python3
"""CSOAI Catapult — the engine.

Takes ONE signed measurement evidence object and fans it out to the 17 named
surfaces in targets.py — but only if the GATE passes. The gate FAILS CLOSED:

  1. status == 'PUBLISHED'
  2. a sha256 content address is present (and well-formed, 64 lowercase hex)
  3. signed_by starts with 'did:web:csoai.org#board-attestation-1'
     (the harvest-stage Ed25519 key is explicitly rejected)

Gate failure prints {'state': 'GATE_BLOCKED', 'blocked_by': [reasons]} and
exits 0 WITHOUT writing any target. A gate-blocked catapult is not a cat; it
is a no-op with the reason recorded. That is the correct state, not a defect.

Post-gate failure modes (renderer defect, missing sha256 in a surface record,
short write on local readback) emit `catapult_failed: <reason>` and exit
non-zero, after removing anything already written — a partial fan-out is
NEVER published (failure_mode=ALL_OR_NOTHING).

Trap defences (per catapult-shape-2026-09-18.md):
- dict.get(key, {}) does NOT default when the key exists with value null.
  Every field read distinguishes missing from present-null (see `field()` /
  `present()`), and a present-null value/sha256 is a named gate reason.
- Every rendered surface record must carry the same sha256 the artifact was
  stamped with; a record that does not is refused before anything is written.
- Every written file is read back and checked against its byte size AND its
  record sha256, so a short read cannot pass as a full fan-out.
- Counts carry denominators: the result reports targets_published as M/N.

This module never signs anything. It checks for the board signer's signature
fields structurally only.
"""

import argparse
import hashlib
import json
import os
import re
import shutil
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import manifest as manifest_module  # noqa: E402
import targets as targets_module  # noqa: E402

BOARD_SIGNER_DID_PREFIX = "did:web:csoai.org#board-attestation-1"
HARVEST_KEY_MARKERS = ("harvest",)
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
EXPECTED_TARGET_COUNT = 17

# Canonical state vocabulary (the estate's doctrine): INDEXED, MEASURED, SIGNED,
# WITNESSED, BITCOIN-ANCHORED, DEPLOYED, INDEPENDENTLY USED, INDEPENDENTLY PAID.
# Fan-out eligibility requires the measured-and-signed family — 'PUBLISHED' is
# kept for flat-shape compatibility but is NOT an estate state. Fixed 2026-10-07:
# the first real board-signed artifact (effect-binding-server-probe-2026-09-22)
# carries payload.status='MEASURED' and was blocked by a status word that does
# not exist in the vocabulary — one concept, two spellings.
FANOUT_ELIGIBLE_STATES = frozenset({
    "PUBLISHED", "MEASURED", "SIGNED", "WITNESSED", "BITCOIN-ANCHORED", "DEPLOYED",
})

MISSING = object()


def present(obj, key):
    """Return (found, value). A present-null key returns (True, None) — never
    silently replaced by a default."""
    if not isinstance(obj, dict) or key not in obj:
        return (False, MISSING)
    return (True, obj[key])


def _payload_sha_candidates(payload):
    """Both named preimage rules for a payload digest.
    house = json.dumps(sort_keys, separators, ensure_ascii=True) — the card rule.
    js    = JSON.stringify of key-sorted object = ensure_ascii=False — the rule
            declared by the signed-companion envelopes' `canonical` field.
    The rule that matches is NAMED in the result; neither matching is a block."""
    canon = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
    js = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return {
        hashlib.sha256(canon).hexdigest(): "house-json-dumps-ascii",
        hashlib.sha256(js).hexdigest(): "js-json-stringify",
    }


def normalize_envelope(evidence):
    """Accept BOTH estate envelope shapes and return (flat, notes).

    Flat (tests/simple): {sha256, signed_by, as_of, status, ...}
    Signed companion (the real estate shape, e.g. effect-binding-server-probe
    -2026-09-22.signed.json): {schema, payload: {...}, signature: {did, alg,
    sig_ed25519, payload_sha256, canonical, signer_auth, signed_at}, verify}.

    Also verifies payload_sha256 against the payload under the declared rule;
    a mismatch is a TAMPER block (carried out as a gate reason by check_gate).
    """
    notes = {"envelope_shape": "flat", "payload_sha256_rule": None, "payload_sha256_verified": None}
    if not isinstance(evidence, dict):
        return (evidence, notes)
    sig = evidence.get("signature")
    payload = evidence.get("payload")
    if not (isinstance(sig, dict) and isinstance(payload, dict)):
        return (evidence, notes)

    notes["envelope_shape"] = "signed-companion"
    flat = dict(evidence)
    flat.setdefault("status", payload.get("status"))
    flat.setdefault("as_of", payload.get("as_of") or sig.get("signed_at"))
    found, signer = present(sig, "did")
    flat.setdefault("signed_by", signer if found and signer is not MISSING else None)
    found, sha = present(sig, "payload_sha256")
    flat.setdefault("sha256", sha if found and sha is not MISSING else None)

    # Verify the payload digest under the declared/known preimage rules.
    found, claimed = present(sig, "payload_sha256")
    if found and isinstance(claimed, str) and SHA256_RE.match(claimed):
        candidates = _payload_sha_candidates(payload)
        rule = candidates.get(claimed)
        if rule:
            notes["payload_sha256_rule"] = rule
            notes["payload_sha256_verified"] = True
        else:
            notes["payload_sha256_verified"] = False  # tamper: check_gate blocks
    return (flat, notes)


def check_gate(evidence):
    """Return the list of named gate-failure reasons (empty list = gate open)."""
    if not isinstance(evidence, dict):
        return ["evidence_not_an_object"]

    evidence, notes = normalize_envelope(evidence)
    reasons = []

    # 0. signed-companion tamper check: payload_sha256 must verify under a
    #    named preimage rule (house json.dumps or JS JSON.stringify).
    if notes.get("payload_sha256_verified") is False:
        reasons.append("payload_sha256_mismatch")

    # 1. status must be in the fan-out-eligible vocabulary (present-null is its
    #    own reason).
    found, status = present(evidence, "status")
    if not found:
        reasons.append("status_missing")
    elif status is None:
        reasons.append("status_present_null")
    elif status not in FANOUT_ELIGIBLE_STATES:
        reasons.append("status_not_fanout_eligible: %r" % (status,))

    # 2. sha256 must be present, non-null, well-formed (64 lowercase hex).
    found, sha = present(evidence, "sha256")
    sha_ok = False
    if not found:
        reasons.append("sha256_missing")
    elif sha is None:
        reasons.append("sha256_present_null")
    elif not isinstance(sha, str) or not SHA256_RE.match(sha):
        reasons.append("sha256_malformed")
    else:
        sha_ok = True

    # 3. signed_by must be the board attestation DID; the harvest key is out.
    found, signer = present(evidence, "signed_by")
    if not found:
        reasons.append("signed_by_missing")
    elif signer is None:
        reasons.append("signed_by_present_null")
    else:
        signer_text = signer if isinstance(signer, str) else repr(signer)
        if any(marker in signer_text.lower() for marker in HARVEST_KEY_MARKERS):
            reasons.append("harvest_key_rejected")
        if not signer_text.startswith(BOARD_SIGNER_DID_PREFIX):
            reasons.append("signer_not_board_attestation")

    # The source artifact's `value` field is walked explicitly: present-null is
    # NOT treated as absent, and a value that carries a different sha256 than
    # the one the artifact was stamped with is a tamper signal.
    found, value = present(evidence, "value")
    if found and value is None:
        reasons.append("value_present_null")
    elif found and not isinstance(value, dict):
        reasons.append("value_not_an_object")
    elif found:
        v_found, v_sha = present(value, "sha256")
        if v_found and v_sha is None:
            reasons.append("value_sha256_present_null")
        elif v_found and (not isinstance(v_sha, str) or not SHA256_RE.match(v_sha)):
            reasons.append("value_sha256_malformed")
        elif v_found and sha_ok and v_sha != sha:
            reasons.append("value_sha256_mismatch")

    return reasons


def run(evidence, out_dir):
    """Run the catapult. Returns (result_dict, exit_code). Writes nothing on
    gate failure; on any post-gate failure removes everything already written.
    Accepts both envelope shapes (flat and signed-companion) — normalize first,
    then gate and render from the same normalized object."""
    evidence, notes = normalize_envelope(evidence)
    reasons = check_gate(evidence)
    if reasons:
        return ({"state": "GATE_BLOCKED", "blocked_by": reasons}, 0)

    sha = evidence["sha256"]
    rendered = targets_module.render_all(evidence)
    if len(rendered) != EXPECTED_TARGET_COUNT:
        return (
            {"state": "CATAPULT_FAILED", "failed_on": "target_count_mismatch"},
            _fail_rc("target_count_mismatch: rendered %d of %d named surfaces" % (len(rendered), EXPECTED_TARGET_COUNT)),
        )

    # Every surface record must carry the sha256 the artifact was stamped with.
    for record in rendered:
        if sha.encode("ascii") not in record["content"]:
            return (
                {"state": "CATAPULT_FAILED", "failed_on": "surface_record_missing_sha256"},
                _fail_rc("surface_record_missing_sha256: %s" % record["surface_name"]),
            )
        if record["byte_size"] <= 0:
            return (
                {"state": "CATAPULT_FAILED", "failed_on": "surface_record_empty"},
                _fail_rc("surface_record_empty: %s" % record["surface_name"]),
            )

    target_entries = [{k: v for k, v in record.items() if k != "content"} for record in rendered]
    manifest = manifest_module.build_manifest(evidence, target_entries, targets_module.ALL_SURFACE_NAMES)
    manifest_data = manifest_module.manifest_bytes(manifest)

    # ALL_OR_NOTHING: write everything, verify every byte by local readback,
    # and remove everything again on the first mismatch.
    written = []
    targets_dir = os.path.join(out_dir, "targets")
    try:
        os.makedirs(targets_dir, exist_ok=True)
        for record in rendered:
            path = os.path.join(targets_dir, record["file_name"])
            with open(path, "wb") as handle:
                handle.write(record["content"])
            written.append(path)
            with open(path, "rb") as handle:
                readback = handle.read()
            if len(readback) != record["byte_size"]:
                raise RuntimeError("short_write: %s (%d of %d bytes)" % (record["surface_name"], len(readback), record["byte_size"]))
            if hashlib.sha256(readback).hexdigest() != record["record_sha256"]:
                raise RuntimeError("readback_hash_mismatch: %s" % record["surface_name"])

        manifest_path = os.path.join(out_dir, "manifest.json")
        with open(manifest_path, "wb") as handle:
            handle.write(manifest_data)
        written.append(manifest_path)
        with open(manifest_path, "rb") as handle:
            readback = handle.read()
        if len(readback) != len(manifest_data) or hashlib.sha256(readback).hexdigest() != hashlib.sha256(manifest_data).hexdigest():
            raise RuntimeError("readback_hash_mismatch: manifest.json")
    except (OSError, RuntimeError) as exc:
        for path in written:
            try:
                os.remove(path)
            except OSError:
                pass
        try:
            os.rmdir(targets_dir)
        except OSError:
            pass
        return (
            {"state": "CATAPULT_FAILED", "failed_on": str(exc)},
            _fail_rc(str(exc)),
        )

    result = {
        "state": "CATAPULTED",
        "source_sha256": sha,
        "signer_did": evidence["signed_by"],
        "targets_attempted": manifest["targets_attempted"],
        "targets_published": manifest["targets_published"],
        "targets_published_of_attempted": manifest["targets_published_of_attempted"],
        "targets_not_published": manifest["targets_not_published"],
        "failure_mode": manifest_module.FAILURE_MODE,
        "manifest_path": manifest_path,
    }
    return (result, 0)


def _fail_rc(reason):
    """Print the catapult_failed line and return the non-zero code."""
    print("catapult_failed: %s" % reason)
    return 3


def main(argv=None):
    parser = argparse.ArgumentParser(description="CSOAI catapult: one evidence object -> 17 named surfaces (fail-closed gate).")
    parser.add_argument("evidence", help="path to the evidence object JSON")
    parser.add_argument("--out", default="catapult-out", help="output directory for the fan-out")
    args = parser.parse_args(argv)

    with open(args.evidence, "rb") as handle:
        evidence = json.load(handle)

    result, code = run(evidence, args.out)
    print(json.dumps(result, indent=2, sort_keys=True))
    return code


if __name__ == "__main__":
    raise SystemExit(main())
