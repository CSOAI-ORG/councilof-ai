#!/usr/bin/env python3
"""Recover an exact prepared output from an already-authorised private KV export.
No network, settlement, signing, provider call or customer-access capability.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import sys
from datetime import datetime

MAX_BODY = 1024 * 1024
MAX_EXPORT = 2 * 1024 * 1024
MAX_HEADERS = 8192
HEADERS = {
    "content-type", "content-disposition", "content-language", "content-encoding",
    "etag", "last-modified", "x-csoai-card-sha256", "x-csoai-feed-sha256",
    "x-csoai-sig-ed25519", "x-csoai-did", "x-csoai-payload-sha256",
    "x-payment-response", "payment-response",
}


class RecoveryRefused(ValueError):
    pass


def require(ok, reason):
    if not ok:
        raise RecoveryRefused(reason)


def exact_int(value):
    return type(value) is int


def recover_export(packet, transaction, resource):
    """Pure verification. Returns original bytes and an unsigned recovery receipt."""
    require(isinstance(transaction, str) and 0 < len(transaction) <= 256
            and not re.search(r"\s", transaction), "invalid expected transaction")
    require(isinstance(resource, str) and resource and resource == resource.strip(),
            "invalid expected resource")
    require(isinstance(packet, dict), "missing private export")
    record, saved = packet.get("delivery_record"), packet.get("retained_output")
    require(isinstance(record, dict), "missing delivery metadata")
    require(isinstance(saved, dict), "missing original retained output; do not regenerate or backfill")
    require(record.get("schema") == "csoai.x402.delivery-record/0.1"
            and record.get("signed") is False, "unsupported delivery metadata")
    require(saved.get("schema") == "csoai.x402.prepared-output/0.1"
            and saved.get("signed") is False, "unsupported retained output")
    for value in (record, saved):
        require(value.get("transaction") == transaction, "transaction mismatch")
        require(value.get("resource") == resource, "resource mismatch")
    require(record.get("settled_tx_key") == "settled:tx:" + transaction
            and record.get("receipt_tx_key") == "receipt:tx:" + transaction,
            "settlement/receipt reference mismatch")
    require(saved.get("delivery_tx_key") == "delivery:tx:" + transaction,
            "delivery reference mismatch")
    digest, size = record.get("response_sha256"), record.get("response_bytes")
    require(isinstance(digest, str) and re.fullmatch(r"[a-f0-9]{64}", digest),
            "invalid recorded digest")
    require(exact_int(size) and 0 <= size <= MAX_BODY, "unsupported recorded body size")
    require(saved.get("response_sha256") == digest
            and exact_int(saved.get("response_bytes")) and saved["response_bytes"] == size,
            "retained digest/size differs from delivery metadata")
    content_type = record.get("content_type")
    require(isinstance(content_type, str) and saved.get("content_type") == content_type,
            "content type mismatch")
    timestamp = record.get("delivered_at")
    require(isinstance(timestamp, str) and saved.get("delivered_at") == timestamp,
            "original timestamp mismatch")
    try:
        require(datetime.fromisoformat(timestamp.replace("Z", "+00:00")).tzinfo is not None,
                "missing timestamp timezone")
    except (TypeError, ValueError):
        raise RecoveryRefused("invalid original timestamp") from None
    require(isinstance(record.get("claim_boundary"), str) and record["claim_boundary"]
            and isinstance(saved.get("claim_boundary"), str) and saved["claim_boundary"],
            "missing unsigned evidence boundary")
    encoded = saved.get("body_base64")
    require(isinstance(encoded, str) and len(encoded) <= ((MAX_BODY + 2) // 3) * 4,
            "missing or oversized retained bytes")
    try:
        body = base64.b64decode(encoded, validate=True)
    except (ValueError, TypeError):
        raise RecoveryRefused("invalid body encoding") from None
    require(base64.b64encode(body).decode("ascii") == encoded, "noncanonical body encoding")
    require(len(body) == size and hashlib.sha256(body).hexdigest() == digest,
            "retained body hash/size mismatch")
    status, text, headers = saved.get("status"), saved.get("status_text"), saved.get("headers")
    require(exact_int(status) and 200 <= status <= 299 and isinstance(text, str)
            and "\r" not in text and "\n" not in text, "invalid original HTTP status")
    require(isinstance(headers, list) and len(headers) <= len(HEADERS), "invalid retained headers")
    seen = {}
    for pair in headers:
        require(isinstance(pair, list) and len(pair) == 2, "invalid retained header pair")
        name, value = pair
        require(isinstance(name, str) and name in HEADERS and name not in seen
                and isinstance(value, str) and not any(c in value for c in ("\r", "\n", "\0")),
                "unsupported, duplicate or unsafe retained header")
        seen[name] = value
    require(len(json.dumps({"status_text": text, "headers": headers}, ensure_ascii=False,
                           separators=(",", ":")).encode("utf-8")) <= MAX_HEADERS,
            "retained headers exceed engineering bound")
    require(seen.get("content-type", "") == content_type, "content type/header mismatch")
    receipt = {
        "schema": "csoai.x402.operator-output-recovery/0.1",
        "transaction": transaction, "resource": resource,
        "delivery_tx_key": "delivery:tx:" + transaction,
        "retained_output_key": "delivery:body:v1:tx:" + transaction,
        "response_sha256": digest, "response_bytes": size,
        "status": status, "status_text": text, "headers": headers,
        "original_delivered_at": timestamp, "signed": False,
        "claim_boundary": "Exact bytes matched the supplied private unsigned delivery metadata and retained envelope. No independent payment, signature, buyer receipt or acceptance verification. No network, settlement, signing or regeneration performed.",
    }
    return body, receipt


def write_recovery(body, receipt, destination):
    """Create private body and receipt files, exclusively; never replace a prior artifact."""
    output = Path(destination)
    require(output.name not in ("", ".", ".."), "invalid destination")
    parent = output.parent
    require(parent.is_dir() and not parent.is_symlink(), "destination directory must exist and be real")
    receipt_name = output.name + ".receipt.json"
    directory = os.open(parent, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    opened = []
    try:
        for name in (output.name, receipt_name):
            try:
                os.stat(name, dir_fd=directory, follow_symlinks=False)
            except FileNotFoundError:
                continue
            raise RecoveryRefused("destination already exists; refusing overwrite")
        # A concurrent creator still cannot be overwritten; O_EXCL is authoritative.
        for name in (output.name, receipt_name):
            fd = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                         0o600, dir_fd=directory)
            opened.append(fd)
            os.fchmod(fd, 0o600)
        for fd, raw in zip(opened, (body, (json.dumps(receipt, sort_keys=True, indent=2)
                                         + "\n").encode("utf-8"))):
            view = memoryview(raw)
            while view:
                written = os.write(fd, view)
                require(written > 0, "short recovery write")
                view = view[written:]
            os.fsync(fd)
        os.fsync(directory)
    finally:
        for fd in opened:
            os.close(fd)
        os.close(directory)
    return {"body_path": str(output), "receipt_path": str(output.with_name(receipt_name)),
            "response_sha256": receipt["response_sha256"], "response_bytes": len(body)}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, help="Private JSON export; not a transaction-only download")
    parser.add_argument("--transaction", required=True)
    parser.add_argument("--resource", required=True, help="Exact original resource including query")
    parser.add_argument("--output", required=True, help="New body file; parent must exist")
    args = parser.parse_args(argv)
    try:
        fd = os.open(args.input, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(fd, "rb") as source:
            require(stat.S_ISREG(os.fstat(source.fileno()).st_mode), "export must be a regular file")
            raw = source.read(MAX_EXPORT + 1)
        require(len(raw) <= MAX_EXPORT, "private export exceeds bound")
        body, receipt = recover_export(json.loads(raw), args.transaction, args.resource)
        result = write_recovery(body, receipt, args.output)
        print(json.dumps(result, sort_keys=True))
        return 0
    except (RecoveryRefused, OSError, ValueError, TypeError) as error:
        print("recovery refused: " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
