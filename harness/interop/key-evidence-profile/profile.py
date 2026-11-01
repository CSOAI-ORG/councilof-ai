"""Council of AI evidence-only profile over a pinned upstream reference checker.

No network calls, authority issuance, dynamic plugin loading or action dispatch.
This is a discussion profile; the upstream PR remains a separate proposal.
"""
from __future__ import annotations
import argparse
import copy
import hashlib
import importlib.util
import json
import re
import sys
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
UP = HERE / "upstream/trust/key-evidence-states-v0"
PIN = "a42fb08becca8e7b90b521b6012ca9ca7f3f1bdf"
MAX_BYTES = 1_048_576
MAX_DEPTH = 32
TIME = re.compile(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})\Z")

class InvalidInput(ValueError):
    pass

def verify_upstream():
    manifest = json.loads((HERE / "upstream_manifest.json").read_text())
    if manifest["commit"] != PIN or manifest["repository"] != "w3c-cg/aikr":
        raise RuntimeError("Unexpected upstream revision")
    base = (HERE / "upstream").resolve()
    for row in manifest["files"]:
        path = (base / row["path"]).resolve()
        if not path.is_relative_to(base) or not path.is_file():
            raise RuntimeError("Invalid upstream manifest path")
        data = path.read_bytes()
        if len(data) != row["bytes"] or hashlib.sha256(data).hexdigest() != row["sha256"]:
            raise RuntimeError("Upstream byte mismatch: " + row["path"])
    return len(manifest["files"])

def load_module(name):
    verify_upstream()
    if name not in {"check", "generate"}:
        raise RuntimeError("Unsupported fixture module")
    spec = importlib.util.spec_from_file_location("pinned_aikr_" + name, UP / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def pairs(items):
    result = {}
    for key, value in items:
        if key in result:
            raise InvalidInput("Duplicate JSON property")
        result[key] = value
    return result

def reject_constant(value):
    raise InvalidInput("Non-finite JSON number")

def walk(value, depth=0):
    if depth > MAX_DEPTH:
        raise InvalidInput("Nesting limit exceeded")
    if isinstance(value, dict):
        if not all(isinstance(k, str) for k in value):
            raise InvalidInput("Object keys must be strings")
        for item in value.values():
            walk(item, depth + 1)
    elif isinstance(value, list):
        for item in value:
            walk(item, depth + 1)
    elif value is not None and not isinstance(value, (str, bool, int, float)):
        raise InvalidInput("Not a JSON value")

def parse(raw):
    if len(raw) > MAX_BYTES:
        raise InvalidInput("Input byte limit exceeded")
    try:
        value = json.loads(raw, object_pairs_hook=pairs, parse_constant=reject_constant)
        walk(value)
        if not isinstance(value, dict):
            raise InvalidInput("Input must be an object")
        return value
    except (UnicodeError, ValueError, RecursionError) as error:
        raise InvalidInput("Malformed or unsupported JSON") from error

def instant(value):
    if not isinstance(value, str) or not TIME.fullmatch(value) or value.endswith("-00:00"):
        raise InvalidInput("A known timezone-aware timestamp is required")
    return datetime.fromisoformat(value.replace("Z", "+00:00"))

def validate(value):
    # Only the supported synthetic-reference envelope is accepted. This does not
    # add general credential formats or make the relying party's policy trusted.
    for name in ("policy", "statement", "lookup"):
        if not isinstance(value.get(name), dict):
            raise InvalidInput("Missing object")
    policy, statement, lookup = value["policy"], value["statement"], value["lookup"]
    now = instant(value["evaluationInstant"])
    if not isinstance(policy["identifier"], str) or not policy["identifier"]:
        raise InvalidInput("Missing relying-party identifier")
    if not isinstance(statement["payload"]["identifier"], str) or not statement["payload"]["identifier"]:
        raise InvalidInput("Missing statement identifier")
    if lookup["status"] not in {"ok", "unavailable"}:
        raise InvalidInput("Unsupported lookup state")
    if lookup["status"] == "ok":
        instant(lookup["fetchedAt"])
        if not isinstance(value["history"], dict):
            raise InvalidInput("History must be an object")
    # Validate actual time-bearing fields before the reference checker parses them.
    def scan(obj):
        if isinstance(obj, dict):
            for key, item in obj.items():
                if key in {"validFrom", "validUntil", "successorValidFrom", "successorValidUntil", "effectiveFrom", "time"} and item is not None:
                    instant(item)
                elif key == "alg" and item != "Ed25519":
                    raise InvalidInput("Unsupported signature algorithm")
                scan(item)
        elif isinstance(obj, list):
            for item in obj:
                scan(item)
    scan(value)
    return now

def receipt(result, reason, digest, upstream=None):
    return {"schema": "council.key-evidence-profile/1", "profile_status": "discussion-candidate",
            "result": result, "reason": reason, "input_sha256": digest,
            "upstream_commit": PIN, "upstream_result": upstream,
            "execution_authority": False, "scope": "cryptographic-evidence-only"}

def evaluate(value, checker=None):
    digest = None
    try:
        walk(value)
        raw = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False).encode()
        value = parse(raw)
        digest = hashlib.sha256(raw).hexdigest()
        now = validate(value)
        checker = checker or load_module("check")
        result, reason, _ = checker.evaluate(copy.deepcopy(value))
        upstream = {"result": result, "reason": reason}
        # Preserve every upstream negative/unknown outcome. The additional profile
        # narrows passing evidence; it can never upgrade a failure to a pass.
        if result != "pass":
            return receipt(result, reason, digest, upstream)
        if value["statement"]["payload"]["identifier"] != value["policy"]["identifier"]:
            return receipt("fail", "SUBJECT_MISMATCH", digest, upstream)
        if instant(value["lookup"]["fetchedAt"]) > now:
            return receipt("could-not-determine", "LOOKUP_TIME_AFTER_EVALUATION", digest, upstream)
        state, signed = checker.attested_time(value["statement"], value["policy"])
        if state == "ok" and signed > now:
            return receipt("could-not-determine", "ATTESTED_TIME_AFTER_EVALUATION", digest, upstream)
        return receipt(result, reason, digest, upstream)
    except (InvalidInput, KeyError, TypeError, ValueError, IndexError, OverflowError, RecursionError, AttributeError):
        return receipt("could-not-determine", "MALFORMED_INPUT", digest)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", help="Expanded evidence JSON file, or - for stdin")
    args = parser.parse_args()
    try:
        verify_upstream()
    except (OSError, ValueError, KeyError, TypeError, RuntimeError):
        print(json.dumps({"error": "Pinned upstream integrity could not be established", "execution_authority": False}), file=sys.stderr)
        return 3
    try:
        if args.input == "-":
            raw = sys.stdin.buffer.read(MAX_BYTES + 1)
        else:
            with open(args.input, "rb") as stream:
                raw = stream.read(MAX_BYTES + 1)
        result = evaluate(parse(raw))
    except (InvalidInput, OSError):
        result = receipt("could-not-determine", "UNREADABLE_INPUT", None)
    except RuntimeError as error:
        print(json.dumps({"error": str(error), "execution_authority": False}), file=sys.stderr)
        return 3
    print(json.dumps(result, indent=2))
    return {"pass": 0, "fail": 1, "could-not-determine": 2}[result["result"]]

if __name__ == "__main__":
    raise SystemExit(main())
