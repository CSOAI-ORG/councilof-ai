#!/usr/bin/env python3
"""Exchange our councilof.ai domain proof for a registry publishing token — or say why not.

WHY THIS FILE EXISTS. The owner's instruction for publishing under ai.councilof/* has to be a
command that works the first time. A previously published instruction in this estate carried a
wrong field name and failed with a 422 that said so. Every field name, header and encoding
below was read out of the registry's live OpenAPI document and its handler source, not out of
prose, and --dry-run exercises the whole path up to (but never through) the network call so the
payload shape can be checked without holding a key.

WHAT THE REGISTRY ACTUALLY DOES (internal/api/handlers/v0/auth/http.go and .../common.go):

  1. It GETs https://<domain>/.well-known/mcp-registry-auth as text/plain.
     Redirects are NOT followed. The body is capped at 4096 bytes. The first substring
     matching   v=MCPv1;\\s*k=([^;]+);\\s*p=([A-Za-z0-9+/=]+)   is the key.
  2. It verifies an Ed25519 signature over the RAW BYTES OF THE TIMESTAMP STRING —
     not over a digest of it, and not over any envelope.
  3. The timestamp is RFC3339 and must be within ±15 SECONDS of the registry's clock.
     This is the single most common cause of a failure that looks like a bad key.
  4. On success it returns {"registry_token": ..., "expires_at": ...} and the token's
     permission is exactly   ai.councilof/*   for councilof.ai. It is NEVER
     io.github.CSOAI-ORG/*: BuildPermissions() derives the pattern from the reversed domain
     alone, and HTTP auth is called with includeSubdomains = false.

THE REQUEST BODY IS snake_case. The server.json schema is camelCase. Mixing them is the 422.

    POST https://registry.modelcontextprotocol.io/v0/auth/http
    {"domain": "...", "timestamp": "...", "signed_timestamp": "<hex>"}

The private key is read from a file, never from the command line, and is never printed.

Usage:
    registry-http-login.py --dry-run                       # no key needed; prints the shape
    registry-http-login.py --key-file /path/to/key.pem     # openssl Ed25519 private key
    registry-http-login.py --key-file <file-with-64-hex>   # raw Ed25519 seed as hex

To check which public key the registry will actually see:
    registry-http-login.py --show-published-key
"""
from __future__ import annotations

import argparse
import base64
import binascii
import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REGISTRY = "https://registry.modelcontextprotocol.io"
DOMAIN = "councilof.ai"
WELL_KNOWN = f"https://{DOMAIN}/.well-known/mcp-registry-auth"
# The exact pattern the registry compiles. Kept here verbatim so a drift in either is visible.
RECORD_RE = re.compile(r"v=MCPv1;\s*k=([^;]+);\s*p=([A-Za-z0-9+/=]+)")
UA = "csoai-registry-login/1.0 (+https://councilof.ai)"


def fetch_published_key() -> tuple[str, str]:
    """Return (algorithm, base64 public key) exactly as the registry would parse it."""
    req = urllib.request.Request(WELL_KNOWN, headers={"User-Agent": UA, "Accept": "text/plain"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        if resp.status != 200:
            raise RuntimeError(f"well-known returned HTTP {resp.status}; the registry requires 200")
        body = resp.read(4097)
    if len(body) > 4096:
        raise RuntimeError("well-known body exceeds the registry's 4096-byte cap")
    match = RECORD_RE.search(body.decode("utf-8", "replace"))
    if not match:
        raise RuntimeError("well-known body does not contain a parseable v=MCPv1 record")
    return match.group(1), match.group(2)


def load_private_key(path: Path):
    """Accept either an openssl Ed25519 PEM or a file holding a 64-character hex seed."""
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

    raw = path.read_bytes()
    text = raw.decode("utf-8", "replace").strip()
    if "-----BEGIN" in text:
        return serialization.load_pem_private_key(raw, password=None)
    compact = "".join(text.split())
    try:
        seed = binascii.unhexlify(compact)
    except binascii.Error as exc:
        raise RuntimeError("key file is neither a PEM nor a hex seed") from exc
    if len(seed) != 32:
        raise RuntimeError(f"hex seed must be 32 bytes (64 hex chars), got {len(seed)}")
    return Ed25519PrivateKey.from_private_bytes(seed)


def public_b64(key) -> str:
    from cryptography.hazmat.primitives import serialization

    return base64.b64encode(
        key.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    ).decode()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--domain", default=DOMAIN)
    ap.add_argument("--key-file")
    ap.add_argument("--dry-run", action="store_true", help="print the request shape; send nothing")
    ap.add_argument("--show-published-key", action="store_true")
    args = ap.parse_args()

    if args.show_published_key:
        algorithm, key_b64 = fetch_published_key()
        print(f"{WELL_KNOWN}\n  algorithm : {algorithm}\n  public key: {key_b64}")
        return 0

    # The timestamp must be inside a ±15s window, so it is generated immediately before use.
    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")

    if args.dry_run:
        print(json.dumps({
            "method": "POST",
            "url": f"{REGISTRY}/v0/auth/http",
            "headers": {"Content-Type": "application/json"},
            "body": {
                "domain": args.domain,
                "timestamp": timestamp,
                "signed_timestamp": "<hex(ed25519_sign(private_key, timestamp.encode()))>",
            },
            "grants": f"publish on {'.'.join(reversed(args.domain.split('.')))}/*",
            "note": "body keys are snake_case; the ±15s window means the timestamp is generated at send time",
        }, indent=2))
        return 0

    if not args.key_file:
        print("ABORT: --key-file is required (or use --dry-run). The private key is never "
              "passed as an argument.", file=sys.stderr)
        return 2

    key = load_private_key(Path(args.key_file))

    # Refuse to send a signature the registry cannot possibly verify: check our key against the
    # one actually being served first, so a mismatch is reported as a mismatch rather than as a
    # generic 401 from the far end.
    try:
        algorithm, published = fetch_published_key()
    except Exception as exc:  # noqa: BLE001
        print(f"ABORT: could not read {WELL_KNOWN}: {exc}", file=sys.stderr)
        return 4
    if algorithm.strip() != "ed25519":
        print(f"ABORT: published record declares k={algorithm!r}; this helper signs ed25519 only",
              file=sys.stderr)
        return 4
    ours = public_b64(key)
    if ours != published:
        print("ABORT: the private key supplied does not match the key published at\n"
              f"  {WELL_KNOWN}\n"
              f"  published : {published}\n"
              f"  supplied  : {ours}\n"
              "Either supply the matching private key, or rotate the published record to this "
              "key and deploy before retrying. Sending now would fail with a signature error "
              "that looks like a registry fault and is not one.", file=sys.stderr)
        return 5

    signature = key.sign(timestamp.encode("utf-8")).hex()
    body = json.dumps(
        {"domain": args.domain, "timestamp": timestamp, "signed_timestamp": signature}
    ).encode("utf-8")
    req = urllib.request.Request(
        f"{REGISTRY}/v0/auth/http",
        data=body,
        method="POST",
        headers={"Content-Type": "application/json", "User-Agent": UA},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            out = json.load(resp)
    except urllib.error.HTTPError as exc:
        detail = exc.read()[:600].decode("utf-8", "replace")
        print(f"auth failed: HTTP {exc.code}\n{detail}", file=sys.stderr)
        return 1

    token = out.get("registry_token")
    if not token:
        print(f"auth returned no registry_token: {out}", file=sys.stderr)
        return 1
    # The token is a publishing credential. It is written to stdout only so the caller can
    # capture it deliberately; nothing here logs it.
    print(token)
    print(f"# expires_at={out.get('expires_at')}  grants={'.'.join(reversed(args.domain.split('.')))}/*",
          file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
