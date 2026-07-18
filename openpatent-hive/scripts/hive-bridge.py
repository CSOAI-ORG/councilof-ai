#!/usr/bin/env python3
"""
openpatent.ai multi-hive federation bridge.

Registers openpatent.ai with three external hives that make up the
sovereign companion's federation mesh:

  1. meok-keystone       POST /v1/attest         (cross-hive attestation)
  2. meok-active-systems POST /v1/marketplace/list (50+ MCP marketplace)
  3. mcp-monopoly        POST /v1/directory/submit (directory submission)

All requests are HMAC-SHA256 signed with the shared hive key
($HIVE_SHARED_KEY or $OPENPATENT_HIVE_KEY). Responses are persisted in
.openpatent/hive-registry.json so we can audit what was registered
where and when.

Idempotency: every target is recorded by URL + content hash. Re-running
will skip already-registered targets and surface updated responses for
the rest. Use --force to bypass.

Usage:
  python3 scripts/hive-bridge.py                  # full federation sweep
  python3 scripts/hive-bridge.py --target keystone   # single target
  python3 scripts/hive-bridge.py --dry-run
  python3 scripts/hive-bridge.py --list            # show registry and exit

Environment:
  HIVE_SHARED_KEY / OPENPATENT_HIVE_KEY  shared HMAC key
  HIVE_API_URL_keystone                  override keystone URL
  HIVE_API_URL_active_systems            override active-systems URL
  HIVE_API_URL_mcp_monopoly              override mcp-monopoly URL

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ─── Configuration ──────────────────────────────────────────────────────────

STATE_DIR = Path(".openpatent")
REGISTRY_FILE = STATE_DIR / "hive-registry.json"

DEFAULT_TARGETS: dict[str, dict[str, Any]] = {
    "meok-keystone": {
        "url": os.environ.get(
            "HIVE_API_URL_keystone",
            "https://keystone.meok.ai/v1/attest",
        ),
        "method": "POST",
        "body_template": "attest",
        "description": "Cross-hive attestation — register openpatent.ai as a verified hive",
    },
    "meok-active-systems": {
        "url": os.environ.get(
            "HIVE_API_URL_active_systems",
            "https://active-systems.meok.ai/v1/marketplace/list",
        ),
        "method": "POST",
        "body_template": "marketplace",
        "description": "50+ MCP marketplace — list the openpatent-mcp server for discovery",
    },
    "mcp-monopoly": {
        "url": os.environ.get(
            "HIVE_API_URL_mcp_monopoly",
            "https://mcp-monopoly.ai/v1/directory/submit",
        ),
        "method": "POST",
        "body_template": "directory",
        "description": "MCP directory submission — register our 5-tier disclosure MCP",
    },
}

# The payload that gets sent to each target.
def _build_payload(template: str) -> dict[str, Any]:
    base: dict[str, Any] = {
        "hive": "openpatent.ai",
        "did": "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
        "operator": "CSOAI Ltd (UK)",
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    if template == "attest":
        base.update({
            "action": "attest",
            "manifest": {
                "name": "openpatent.ai",
                "type": "disclosure-hive",
                "tiers": ["starter", "defensive", "full", "premium", "enterprise"],
                "fees_usd": [29, 99, 299, 999, 2999],
                "proof_layers": 6,
                "btc_anchored": True,
                "bft_threshold": "22/33",
                "agents": 33,
                "domains": 11,
                "bridge_pairs": 55,
                "compliance": ["US-FRE-902", "EU-eIDAS", "UK-PA-1977", "CN-HZ-2018", "FR-MRS-2025"],
            },
        })
    elif template == "marketplace":
        base.update({
            "action": "list",
            "server": {
                "name": "openpatent-mcp",
                "version": "1.0.0",
                "endpoint": "https://mcp.openpatent.ai",
                "tools": [
                    {"name": "disclose_invention", "tier": "starter", "fee_usd": 29},
                    {"name": "verify_disclosure", "tier": "starter", "fee_usd": 0},
                    {"name": "upgrade_to_premium", "tier": "premium", "fee_usd": 999},
                    {"name": "request_bft_review", "tier": "premium", "fee_usd": 999},
                    {"name": "cross_hive_attest", "tier": "defensive", "fee_usd": 99},
                ],
                "categories": ["legal-tech", "ai-safety", "patent", "ip-protection", "blockchain"],
            },
        })
    elif template == "directory":
        base.update({
            "action": "submit",
            "directory_entry": {
                "name": "OpenPatent.ai — Cryptographic Invention Disclosure",
                "tagline": "Disclose First. AI Second. $10 court-admissible proof in 10+ jurisdictions.",
                "url": "https://openpatent.ai",
                "api": "https://api.openpatent.ai",
                "verify": "https://verify.openpatent.ai",
                "manifest": "https://mcp.openpatent.ai/manifest.json",
                "pricing": "starter $29 → enterprise $2,999",
                "license": "AGPL-3.0 (server) / MIT (SDK)",
                "tags": ["patent", "legal", "ai-safety", "blockchain", "bft", "ipfs", "bitcoin"],
            },
        })
    else:
        raise ValueError(f"Unknown body template: {template}")
    return base


# ─── HMAC signing ──────────────────────────────────────────────────────────


def sign_payload(secret: str, body: dict[str, Any]) -> dict[str, str]:
    """Return headers carrying HMAC-SHA256 over the canonical body.

    Convention:  X-Hive-Timestamp  = unix seconds
                 X-Hive-Signature  = hex(hmac_sha256(secret, f"{ts}.{body_json}"))
                 X-Hive-Key-Id     = first 12 hex of sha256(secret)  (hive id)
    """
    ts = str(int(time.time()))
    body_json = json.dumps(body, sort_keys=True, separators=(",", ":"))
    mac = hmac.new(
        secret.encode("utf-8"),
        f"{ts}.{body_json}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    key_id = hashlib.sha256(secret.encode("utf-8")).hexdigest()[:12]
    return {
        "X-Hive-Timestamp": ts,
        "X-Hive-Signature": mac,
        "X-Hive-Key-Id": key_id,
        "Content-Type": "application/json",
    }


# ─── HTTP transport ────────────────────────────────────────────────────────


def http_signed(
    method: str,
    url: str,
    body: dict[str, Any],
    secret: str,
    timeout: float = 30.0,
) -> tuple[int, str, dict[str, str]]:
    """POST/PUT with HMAC headers. Returns (status, body_text, resp_headers)."""
    payload = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    headers = sign_payload(secret, body)
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", errors="replace"), dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace"), dict(e.headers or {})
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return 0, f"transport-error: {e}", {}


# ─── Registry persistence ─────────────────────────────────────────────────


def _read_registry(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "targets": {},
        }
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {
            "version": 1,
            "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "targets": {},
        }


def _write_registry(path: Path, registry: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(registry, indent=2, sort_keys=True), encoding="utf-8")
    tmp.replace(path)


def _content_hash(body: dict[str, Any]) -> str:
    return hashlib.sha256(
        json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()


# ─── Per-target registration ─────────────────────────────────────────────


def register_target(
    name: str,
    spec: dict[str, Any],
    secret: str,
    *,
    force: bool = False,
    timeout: float = 30.0,
) -> dict[str, Any]:
    """Submit openpatent.ai to one external hive. Returns the registry record."""
    body = _build_payload(spec["body_template"])
    body_hash = _content_hash(body)

    record = {
        "name": name,
        "url": spec["url"],
        "method": spec["method"],
        "description": spec["description"],
        "payload_sha256": body_hash,
        "last_attempt_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "attempts": 0,
        "last_status": None,
        "last_http_status": None,
        "last_response_sha256": None,
        "last_response_excerpt": None,
    }

    status, body_text, _ = http_signed(spec["method"], spec["url"], body, secret, timeout=timeout)
    record["attempts"] = 1
    record["last_http_status"] = status
    record["last_response_sha256"] = hashlib.sha256(body_text.encode("utf-8", errors="replace")).hexdigest()
    record["last_response_excerpt"] = body_text[:500]
    try:
        parsed = json.loads(body_text)
        record["last_status"] = parsed.get("status") or parsed.get("ok") or parsed.get("result")
    except json.JSONDecodeError:
        record["last_status"] = None

    if 200 <= status < 300:
        record["registered_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return record


# ─── CLI ────────────────────────────────────────────────────────────────────


def cmd_list(registry: dict[str, Any]) -> int:
    print(json.dumps(registry, indent=2, sort_keys=True))
    return 0


def main() -> int:
    p = argparse.ArgumentParser(
        description="openpatent.ai multi-hive federation bridge (HMAC-signed)",
    )
    p.add_argument(
        "--target",
        choices=list(DEFAULT_TARGETS.keys()) + ["all"],
        default="all",
        help="Which external hive to register with (default: all)",
    )
    p.add_argument(
        "--registry",
        default=os.environ.get("HIVE_REGISTRY", str(Path.cwd() / STATE_DIR / "hive-registry.json")),
        help="Path to the hive-registry.json file",
    )
    p.add_argument(
        "--secret",
        default=os.environ.get("HIVE_SHARED_KEY") or os.environ.get("OPENPATENT_HIVE_KEY"),
        help="Shared HMAC key (or set $HIVE_SHARED_KEY)",
    )
    p.add_argument("--dry-run", action="store_true", help="Show targets but do not POST")
    p.add_argument("--list", action="store_true", help="Show the registry and exit")
    p.add_argument("--force", action="store_true", help="Re-register even if already present")
    p.add_argument("--timeout", type=float, default=30.0, help="HTTP timeout seconds")
    args = p.parse_args()

    registry_path = Path(args.registry).expanduser().resolve()
    registry = _read_registry(registry_path)
    targets = registry.get("targets", {})

    if args.list:
        return cmd_list(registry)

    if not args.secret:
        print(
            "✗ ERROR: no shared hive key — set $HIVE_SHARED_KEY or $OPENPATENT_HIVE_KEY, "
            "or pass --secret",
            file=sys.stderr,
        )
        return 2

    selected_targets = (
        list(DEFAULT_TARGETS.items())
        if args.target == "all"
        else [(args.target, DEFAULT_TARGETS[args.target])]
    )

    success = 0
    fail = 0
    for name, spec in selected_targets:
        print(f"  → {name}  {spec['url']}")
        if args.dry_run:
            body = _build_payload(spec["body_template"])
            print(f"    [dry-run] would POST payload ({len(json.dumps(body))} bytes)")
            print(f"    [dry-run] HMAC headers: X-Hive-Timestamp / X-Hive-Signature / X-Hive-Key-Id")
            continue

        # Idempotency: skip if already registered with same payload hash.
        prev = targets.get(name)
        new_body = _build_payload(spec["body_template"])
        new_hash = _content_hash(new_body)
        if (
            prev
            and not args.force
            and prev.get("payload_sha256") == new_hash
            and prev.get("registered_at")
            and 200 <= (prev.get("last_http_status") or 0) < 300
        ):
            print(f"    ✓ already registered at {prev.get('registered_at')} — skipping (use --force to override)")
            continue

        record = register_target(name, spec, args.secret, force=args.force, timeout=args.timeout)
        targets[name] = record
        if record.get("registered_at"):
            print(f"    ✓ REGISTERED  http={record['last_http_status']}  ts={record['registered_at']}")
            success += 1
        else:
            print(f"    ✗ FAILED      http={record['last_http_status']}  body={(record['last_response_excerpt'] or '')[:200]}")
            fail += 1

    if not args.dry_run:
        registry["targets"] = targets
        registry["updated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
        _write_registry(registry_path, registry)
        print(f"\n✓ Registry written to {registry_path}  success={success}  fail={fail}")
    else:
        print("\n[dry-run] no registry writes performed")

    return 0 if fail == 0 else 2


if __name__ == "__main__":
    sys.exit(main())
