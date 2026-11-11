#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Replay one immutable public pulse snapshot; never collect or sign a new pulse.

The lane's published JSON canonicalisation and Merkle rule are preserved.
A pinned key is a source-history anchor, not an independently proved identity.
"""
import hashlib
import hmac
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

VERSION = "1.0.0"
REPO = "csoai/evidence-index"
REVISION = "60342db01ef9d65243ff4177b872382d4f12b87b"
PREFIX = "gspc-pulse/2026-11-04"
BASE = f"https://huggingface.co/datasets/{REPO}/resolve/{REVISION}/{PREFIX}/"
PINNED_KEY = "4a50f0d758fbd7c7770fea7fd3fd69b14f94ee0b4b6a2833a15f008b0185f54a"
GENESIS = b"pulse-series-genesis-2026-11-04"
PINS = {
    "feed.json": ("9598d5c78f43301a01b5da31e6014d5e95aaa708900d594dc185ef0bd3896f8c", 262144),
    "pulse-freeze-manifest.json": ("0354e0b00c22aa765f6509f80888332a901198b28584df15a22b10038c19f643", 8192),
    "pulse-freeze-manifest.sig": ("b7a964ac688cbb4b73a52e41ab0fbebcb72894286a80c90c95fe5289ff0f2fb8", 256),
    "pulse-leaves.json": ("fa4fe0c25784511e67fb6cc049403d865f167d0c0c93acda05f77040b4f830b1", 65536),
}
HEX = re.compile(r"[0-9a-f]{64}\Z")
UTC = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\Z")

class VerificationError(ValueError):
    """A checked invariant failed; callers must not analyse the unverified feed."""

class Uncheckable(RuntimeError):
    """A required dependency or source is unavailable; never a successful check."""

def require(condition, reason):
    if not condition:
        raise VerificationError(reason)

def sha(data):
    return hashlib.sha256(data).hexdigest()

def canonical(value):
    # Exact published pulse rule, not JCS and not the GSPC card canonicalisation.
    return json.dumps(value, sort_keys=True, separators=(",", ":"),
                      ensure_ascii=True, allow_nan=False).encode("utf-8")

def strict_json(raw):
    def pairs(items):
        value = {}
        for key, item in items:
            require(key not in value, "DUPLICATE_JSON_KEY")
            value[key] = item
        return value
    def reject(_):
        raise VerificationError("NONFINITE_JSON_NUMBER")
    try:
        return json.loads(raw.decode("utf-8"), object_pairs_hook=pairs, parse_constant=reject)
    except VerificationError:
        raise
    except (ValueError, UnicodeError, RecursionError):
        raise VerificationError("INVALID_JSON") from None

def timestamp(value):
    require(isinstance(value, str) and UTC.fullmatch(value) is not None, "INVALID_TIMESTAMP")
    try:
        return datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except ValueError:
        raise VerificationError("INVALID_TIMESTAMP") from None

def chain_head(hashes):
    result = sha(GENESIS)
    for item in hashes:
        result = sha((result + item).encode("ascii"))
    return result

def merkle_root(hashes):
    # The existing pulse format duplicates an odd leaf even for a one-row tree.
    if not hashes:
        return sha(b"empty")
    level = [bytes.fromhex(item) for item in sorted(hashes)]
    if len(level) % 2:
        level.append(level[-1])
    while len(level) > 1:
        level = [hashlib.sha256(level[i] + level[i + 1]).digest()
                 for i in range(0, len(level), 2)]
        if len(level) > 1 and len(level) % 2:
            level.append(level[-1])
    return level[0].hex()

def verify_signature(key, signature, payload):
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        from cryptography.exceptions import InvalidSignature
    except ImportError:
        raise Uncheckable("CRYPTOGRAPHY_REQUIRED; signature was not checked") from None
    try:
        Ed25519PublicKey.from_public_bytes(key).verify(signature, payload)
    except (InvalidSignature, ValueError, TypeError):
        raise VerificationError("INVALID_ED25519_SIGNATURE") from None

def verify_bundle(blobs, *, expected_key):
    """Pure verification. The caller supplies its separately pinned trust anchor.

    No key is accepted merely because it accompanies a signature. The network
    entry point additionally enforces every exact source-byte digest below.
    """
    require(isinstance(blobs, dict) and set(blobs) == set(PINS), "WRONG_FILE_SET")
    for name, raw in blobs.items():
        require(type(raw) is bytes and len(raw) <= PINS[name][1], "INPUT_BYTE_LIMIT")
    feed = strict_json(blobs["feed.json"])
    manifest = strict_json(blobs["pulse-freeze-manifest.json"])
    leaves = strict_json(blobs["pulse-leaves.json"])
    require(isinstance(feed, dict) and feed.get("schema") == "csoai.gspc-pulse-feed/0.1", "FEED_SCHEMA")
    require(isinstance(manifest, dict) and manifest.get("schema") == "csoai.pulse-freeze-manifest/0.1", "MANIFEST_SCHEMA")
    rows = feed.get("rows")
    require(isinstance(rows, list) and 0 < len(rows) <= 10000, "NONEMPTY_BOUNDED_ROWS_REQUIRED")
    require(isinstance(leaves, list) and len(leaves) == len(rows), "LEAF_COUNT")
    for count in (feed.get("row_count"), manifest.get("n_rows"), manifest.get("leaf_count")):
        require(type(count) is int and count == len(rows), "DECLARED_COUNT")
    times, actual = [], []
    for row, leaf in zip(rows, leaves):
        require(isinstance(row, dict) and isinstance(leaf, dict), "ROW_OR_LEAF_TYPE")
        ts = row.get("ts")
        times.append(timestamp(ts))
        require(leaf.get("ts") == ts, "LEAF_TIMESTAMP")
        require(isinstance(leaf.get("sha"), str) and HEX.fullmatch(leaf["sha"]) is not None, "LEAF_DIGEST")
        try:
            digest = sha(canonical(row))
        except (ValueError, UnicodeError, TypeError, RecursionError):
            raise VerificationError("ROW_CANONICALISATION") from None
        require(hmac.compare_digest(digest, leaf["sha"]), "FEED_ROW_DIGEST")
        actual.append(digest)
    require(all(a < b for a, b in zip(times, times[1:])), "TIMESTAMPS_NOT_STRICTLY_ORDERED")
    require(manifest.get("first_ts") == rows[0]["ts"], "FIRST_TIMESTAMP")
    require(manifest.get("last_ts") == rows[-1]["ts"], "LAST_TIMESTAMP")
    require(timestamp(manifest.get("produced_at")) >= times[-1], "FREEZE_PRECEDES_DATA")
    require(manifest.get("chain_head") == chain_head(actual), "CHAIN_HEAD")
    require(manifest.get("merkle_root") == merkle_root(actual), "MERKLE_ROOT")
    require(isinstance(expected_key, str) and HEX.fullmatch(expected_key) is not None, "EXPECTED_KEY_FORMAT")
    require(manifest.get("pubkey") == expected_key, "PINNED_KEY_MISMATCH")
    key = bytes.fromhex(expected_key)
    require(manifest.get("pubkey_fp") == sha(key), "KEY_FINGERPRINT")
    try:
        sig_text = blobs["pulse-freeze-manifest.sig"].decode("ascii").strip()
        require(re.fullmatch(r"[0-9a-f]{128}", sig_text) is not None, "SIGNATURE_FORMAT")
        signature = bytes.fromhex(sig_text)
    except UnicodeError:
        raise VerificationError("SIGNATURE_FORMAT") from None
    verify_signature(key, signature, canonical(manifest))
    return {"rows_verified": len(rows), "first_ts": rows[0]["ts"], "last_ts": rows[-1]["ts"],
            "manifest_produced_at": manifest["produced_at"], "chain_head": manifest["chain_head"],
            "merkle_root": manifest["merkle_root"], "key_fingerprint": manifest["pubkey_fp"],
            "feed_rows_bound": True, "signature_checked": True, "source_bytes": {
                name: {"sha256": sha(raw), "bytes": len(raw)} for name, raw in blobs.items()}}

def check_pins(blobs):
    require(set(blobs) == set(PINS), "WRONG_FILE_SET")
    for name, (digest, bound) in PINS.items():
        require(type(blobs[name]) is bytes and len(blobs[name]) <= bound, "INPUT_BYTE_LIMIT")
        require(hmac.compare_digest(sha(blobs[name]), digest), "SOURCE_PIN_MISMATCH: " + name)

class HubRedirect(urllib.request.HTTPRedirectHandler):
    max_redirections = 3
    max_repeats = 1
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        parsed = urllib.parse.urlsplit(newurl)
        require(parsed.scheme == "https" and parsed.hostname == "huggingface.co"
                and parsed.port in (None, 443) and not parsed.username and not parsed.password,
                "OFF_ORIGIN_REDIRECT")
        return super().redirect_request(req, fp, code, msg, headers, newurl)

def fetch_pinned():
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), HubRedirect())
    blobs = {}
    deadline = time.monotonic() + 60
    for name, (_, bound) in PINS.items():
        require(time.monotonic() < deadline, "READ_DEADLINE")
        request = urllib.request.Request(BASE + name, headers={
            "User-Agent": "Council-Pulse-Replay/1.0", "Accept": "application/octet-stream",
            "Accept-Encoding": "identity"})
        try:
            with opener.open(request, timeout=15) as response:
                require(response.status == 200, "HTTP_NOT_200")
                require(response.headers.get("Content-Encoding", "identity") == "identity", "ENCODED_BODY")
                chunks, length = [], 0
                while True:
                    require(time.monotonic() < deadline, "READ_DEADLINE")
                    block = response.read1(min(65536, bound - length + 1))
                    if not block:
                        break
                    length += len(block)
                    require(length <= bound, "INPUT_BYTE_LIMIT")
                    chunks.append(block)
                blobs[name] = b"".join(chunks)
        except (urllib.error.URLError, TimeoutError, OSError):
            raise Uncheckable("PUBLIC_SOURCE_UNAVAILABLE: " + name) from None
    check_pins(blobs)
    return blobs

def negative_control(blobs, expected_key):
    altered = dict(blobs)
    feed = strict_json(blobs["feed.json"])
    feed["rows"][0]["replay_negative_control"] = "deliberate synthetic alteration"
    altered["feed.json"] = canonical(feed)
    try:
        verify_bundle(altered, expected_key=expected_key)
    except VerificationError as error:
        require(str(error) == "FEED_ROW_DIGEST", "NEGATIVE_CONTROL_WRONG_FAILURE")
        return {"id": "pulse-feed-row-alteration", "expected": "FEED_ROW_DIGEST", "got": str(error)}
    raise VerificationError("NEGATIVE_CONTROL_NOT_DETECTED")

def summary(blobs):
    """Descriptive archive counters only; call after verify_bundle succeeds."""
    rows = strict_json(blobs["feed.json"])["rows"]
    valid, missing = [], 0
    for row in rows:
        kev = row.get("kev")
        count = kev.get("count") if isinstance(kev, dict) else None
        if type(count) is int and count >= 0:
            valid.append((timestamp(row["ts"]), count))
        else:
            missing += 1
    rate = None
    seconds = (valid[-1][0] - valid[0][0]).total_seconds() if len(valid) >= 2 else 0
    if seconds > 0:
        rate = (valid[-1][1] - valid[0][1]) * 86400 / seconds
    return {"scope": "descriptive replay of the pinned archive; not a current threat assessment",
            "kev_observations": len(valid), "kev_missing_or_invalid": missing,
            "kev_net_count_change_per_elapsed_day": rate,
            "rate_first_ts": valid[0][0].isoformat() if valid else None,
            "rate_last_ts": valid[-1][0].isoformat() if valid else None}

def run():
    blobs = fetch_pinned()
    result = verify_bundle(blobs, expected_key=PINNED_KEY)
    result["negative_control"] = negative_control(blobs, PINNED_KEY)
    result["archive_summary"] = summary(blobs)
    result["checked_at"] = datetime.now(timezone.utc).isoformat()
    result["source_repository"] = REPO
    result["source_revision"] = REVISION
    result["method_version"] = VERSION
    result["model_inference_performed"] = False
    result["training_performed"] = False
    return result
