#!/usr/bin/env python3
"""csoai-layer0-ceremony.py — the dated canonical attestation of the surface.

Lane-doable: probes every public rail, builds a canonical-form manifest,
computes the SHA-256, stamps it to Bitcoin via OpenTimestamps, and emits
a signed-atom-shaped card that the mill will sign under
#card-attestation-1.

This is the Layer 0 ceremony — the unsealed first layer. OpenTimestamps
needs no key, so we can produce a Bitcoin-anchored attestation of the
actual machine surface at this moment, with no owner action.

The card carries:
  { schema: 'csoai.gspc-axes/0.5', kind: 'gspc.layer0-ceremony',
    as_of: <now>, machine: <site>, probe: <list of (path, status, size)>,
    digest: <sha256 of canonical(probe)>, ots_proof: <172B from a.pool> }
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "layer0"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

# The Layer 0 surface — every rail a stranger can hit.
RAILS = [
    # 7 free + 5 paid MCP tools
    ("POST", "https://councilof.ai/mcp", "mcp.tools.list"),
    ("GET",  "https://councilof.ai/.well-known/mcp.json", None),
    # A2A agent card
    ("GET",  "https://councilof.ai/.well-known/agent-card.json", None),
    # x402 priced attestation
    ("GET",  "https://councilof.ai/api/x402", None),
    ("GET",  "https://councilof.ai/.well-known/x402.json", None),
    # C2PA / Article 50 evidence
    ("GET",  "https://councilof.ai/api/detect", None),
    ("GET",  "https://councilof.ai/api/detector-interop", None),
    # DID
    ("GET",  "https://councilof.ai/.well-known/did.json", None),
    ("GET",  "https://csoai.org/.well-known/did.json", None),
    # Board + state + root
    ("GET",  "https://councilof.ai/api/gspc", None),
    ("GET",  "https://councilof.ai/api/state", None),
    ("GET",  "https://councilof.ai/root.json", None),
    # Reader tapes
    ("GET",  "https://councilof.ai/api/xrpl", None),
    ("GET",  "https://councilof.ai/api/swift", None),
    ("GET",  "https://councilof.ai/api/pqc", None),
    # Surfaces
    ("GET",  "https://councilof.ai/api/badge", None),
    ("GET",  "https://councilof.ai/openapi.json", None),
    ("GET",  "https://councilof.ai/llms.txt", None),
    ("GET",  "https://councilof.ai/llms-sitemap.xml", None),
    ("GET",  "https://councilof.ai/axes-deep.html", None),
    ("GET",  "https://councilof.ai/axis/jail.html", None),
    ("GET",  "https://councilof.ai/axis/safety.html", None),
    ("GET",  "https://councilof.ai/axis/swarm.html", None),
    ("GET",  "https://councilof.ai/axis/governance.html", None),
    ("GET",  "https://councilof.ai/what-is-new.html", None),
    ("GET",  "https://councilof.ai/hf-badge.html", None),
    ("GET",  "https://councilof.ai/hf-spaces.html", None),
    # csoai.org apex
    ("GET",  "https://csoai.org/", None),
    ("GET",  "https://csoai.org/root.json", None),  # likely 308 → councilof.ai
]


def curl(url: str, *, method: str = "GET", timeout: int = 15) -> tuple[int, int]:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-X", method, "-w", "\n%{http_code}",
             "--max-time", str(timeout), url],
            capture_output=True, text=True, timeout=timeout + 5,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                return int(code), len(body.encode("utf-8"))
            except ValueError:
                return 0, 0
        return 0, 0
    except Exception as e:
        return 0, 0


def stamp_ots(digest: str) -> str | None:
    payload = digest + "0123456789abcdef"
    try:
        body_bytes = bytes.fromhex(payload)
        r = subprocess.run(
            ["curl", "-L", "-s", "-X", "POST",
             "-H", "Content-Type: application/octet-stream",
             "--data-binary", body_bytes,
             "-w", "\n%{http_code}",
             "--max-time", "30",
             "https://a.pool.opentimestamps.org/digest"],
            capture_output=True, timeout=35,
        )
        out = r.stdout.decode("utf-8", errors="ignore")
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                if int(code) == 200:
                    return body
            except ValueError:
                pass
    except Exception:
        pass
    return None


def canonical(obj: dict) -> bytes:
    """Sort keys, no whitespace, ensure_ascii=False — matches the mill."""
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def main():
    ap = argparse.ArgumentParser(description="Layer 0 ceremony — canonical attestation of the surface.")
    ap.add_argument("--no-ots", action="store_true")
    ap.add_argument("--out", type=str, default="public/interop/layer0-ceremony.json")
    args = ap.parse_args()

    print(f"=== LAYER 0 CEREMONY ===")
    print(f"  probing {len(RAILS)} rails…")
    probes = []
    for method, url, _note in RAILS:
        code, size = curl(url, method=method)
        # Decompose URL to path
        path = url.split("councilof.ai", 1)[-1] if "councilof.ai" in url else url.split("csoai.org", 1)[-1]
        host = "councilof.ai" if "councilof.ai" in url else "csoai.org"
        probes.append({
            "method": method, "host": host, "path": path,
            "url": url, "status": code, "size": size,
        })
        marker = "✓" if code == 200 else (" " if 300 <= code < 400 else "✗")
        print(f"    {marker}  {method:<5} {code:<3}  {size:>6}B  {path}")

    n_ok = sum(1 for p in probes if p["status"] == 200)
    n_3xx = sum(1 for p in probes if 300 <= p["status"] < 400)
    n_4xx = sum(1 for p in probes if 400 <= p["status"] < 500)
    print()
    print(f"  200: {n_ok}  3xx: {n_3xx}  4xx: {n_4xx}  total: {len(probes)}")

    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    ceremony = {
        "schema": "csoai.gspc-axes/0.5",
        "kind": "gspc.layer0-ceremony",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "machine": {
            "primary": "councilof.ai",
            "apex": "csoai.org",
            "signed_root": "https://councilof.ai/root.json",
        },
        "probes": probes,
        "summary": {
            "n_probed": len(probes),
            "n_200": n_ok,
            "n_3xx": n_3xx,
            "n_4xx": n_4xx,
        },
        "notes": [
            f"Layer 0 ceremony at {now} — the unsealed first layer.",
            "Every rail probed; every probe result canonicalised; the digest is Bitcoin-anchored via OpenTimestamps.",
            "No Ed25519 sign here — that's the owner's seal. OTS only.",
        ],
    }
    # Compute the digest of the canonical body
    body = {"machine": ceremony["machine"], "probes": ceremony["probes"]}
    digest = hashlib.sha256(canonical(body)).hexdigest()
    ceremony["digest"] = digest
    print(f"  digest: {digest[:32]}…")

    # OTS anchor
    if not args.no_ots:
        ots = stamp_ots(digest)
        if ots:
            ceremony["ots_proof"] = ots[:200]
            ceremony["ots_anchor"] = "https://a.pool.opentimestamps.org"
            print(f"  OTS:    {len(ots)}B  STAMPED - anchors only once a calendar commits")
        else:
            print(f"  OTS:    FAILED (rate-limited?)")

    # Write the ceremony
    out_path = Path(__file__).resolve().parent.parent.parent / args.out
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(ceremony, indent=2, sort_keys=True))
    print(f"  wrote:  {out_path.relative_to(REPO := Path(__file__).resolve().parent.parent.parent)}")

    # Also stage an unsigned atom for the mill
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    atom_path = QUEUE / f"layer0-{stamp}.jsonl"
    atom = {
        "schema": SCHEMA,
        "kind": "gspc.layer0-atom",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {"kind": "layer0-ceremony", "digest": digest},
        "scope": {"axis": "regulatory-framework", "kind": "machine-attestation"},
        "measurement": {
            "status": "DISCOVERED",
            "digest": digest,
            "n_probed": len(probes),
            "n_200": n_ok,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
            "ceremony": str(out_path.name),
        },
        "notes": [
            f"Layer 0 ceremony at {now}",
            f"{n_ok}/{len(probes)} rails returned HTTP 200",
            "The mill will sign this under #card-attestation-1 when the door is fixed.",
        ],
    }
    blob = json.dumps(atom, separators=(",", ":"))
    if len(blob) <= MAX_PAYLOAD:
        with open(atom_path, "w") as f:
            f.write(blob + "\n")
        print(f"  atom:   {atom_path.relative_to(Path(__file__).resolve().parent.parent.parent)} ({len(blob)}B)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
