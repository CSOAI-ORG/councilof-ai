#!/usr/bin/env python3
"""ots-stamp.py — REAL OTS stamp using a.pool.opentimestamps.org.

Fixes the typo bug (openteimestamps.org → a.pool.opentimestamps.org).

Usage:
  ./ots-stamp.py <digest-hex>              # stamp one digest
  ./ots-stamp.py <file>                     # stamp one file
  ./ots-stamp.py --merkle-root <root.json> # stamp the merkle_root
"""
import argparse, hashlib, urllib.request, sys, time
from pathlib import Path

OTS_POOLS = [
    "https://a.pool.opentimestamps.org",
    "https://b.pool.opentimestamps.org",
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org",
]

def stamp(digest_hex: str) -> dict:
    """Submit digest to OTS pool, get a pending stamp."""
    results = []
    for pool in OTS_POOLS:
        url = f"{pool}/digest/{digest_hex}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-OTS/1.0", "Accept": "application/vnd.opentimestamps.v1"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                results.append({"pool": pool, "status": "PENDING", "size": len(data), "hex": data.hex()})
        except Exception as e:
            results.append({"pool": pool, "error": str(e)[:80]})
    return {"digest": digest_hex, "results": results}

def main():
    p = argparse.ArgumentParser()
    p.add_argument("digest", nargs="?", help="Digest to stamp (hex)")
    p.add_argument("--file", help="File to hash + stamp")
    p.add_argument("--merkle-root", action="store_true", help="Stamp the live merkle_root from /signed/chain.json")
    args = p.parse_args()

    if args.merkle_root:
        # Read the published root
        req = urllib.request.Request("https://councilof.ai/signed/chain.json", headers={"User-Agent": "CSOAI/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            chain = json.loads(resp.read().decode())
        digest = chain.get("merkle_root", "")
        if not digest:
            print("ERROR: merkle_root is empty")
            sys.exit(1)
    elif args.file:
        digest = hashlib.sha256(Path(args.file).read_bytes()).hexdigest()
    elif args.digest:
        digest = args.digest
    else:
        p.print_help()
        sys.exit(1)

    print(f"Stamping digest: {digest}")
    result = stamp(digest)
    print(json.dumps(result, indent=2))

    # Save the .ots file
    for r in result.get("results", []):
        if r.get("hex"):
            ots_file = Path("scripts/ots") / f"{digest}.ots"
            ots_file.parent.mkdir(parents=True, exist_ok=True)
            ots_file.write_bytes(bytes.fromhex(r["hex"]))
            print(f"Saved: {ots_file} ({r['size']} bytes)")
            return

if __name__ == "__main__":
    main()
