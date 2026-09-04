#!/usr/bin/env python3
"""ots-stamp.py — REAL OTS stamp using a.pool.opentimestamps.org.

Fixes the typo bug (openteimestamps.org → a.pool.opentimestamps.org).

The OTS POST endpoint is:
  POST https://<pool>.opentimestamps.org/digest
  body: <32-byte hex sha256 digest>
  returns: pending .ots file bytes

Multiple pools for redundancy:
  - a.pool.opentimestamps.org
  - b.pool.opentimestamps.org
  - alice.btc.calendar.opentimestamps.org
  - bob.btc.calendar.opentimestamps.org

Usage:
  ./ots-stamp.py <digest-hex>              # stamp one digest
  ./ots-stamp.py --file <file>            # stamp one file's hash
  ./ots-stamp.py --merkle-root            # stamp the live merkle_root
"""
import argparse, hashlib, urllib.request, urllib.error, json, sys
from pathlib import Path

OTS_POOLS = [
    "https://a.pool.opentimestamps.org",
    "https://b.pool.opentimestamps.org",
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org",
]

def stamp(digest_hex: str) -> dict:
    """Submit digest to all OTS pools in parallel, get pending stamps."""
    if len(digest_hex) != 64:
        return {"error": f"digest must be 64 hex chars, got {len(digest_hex)}"}
    results = []
    for pool in OTS_POOLS:
        url = f"{pool}/digest"
        try:
            req = urllib.request.Request(url, data=digest_hex.encode(),
                headers={"Content-Type": "application/x-www-form-urlencoded", "User-Agent": "CSOAI-OTS/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
                results.append({
                    "pool": pool,
                    "status": "PENDING",
                    "size": len(data),
                    "hex": data.hex(),
                })
        except urllib.error.HTTPError as e:
            results.append({"pool": pool, "error": f"HTTP {e.code}: {e.reason}"})
        except Exception as e:
            results.append({"pool": pool, "error": str(e)[:80]})
    return {"digest": digest_hex, "results": results}


def fetch_live_merkle_root() -> str:
    """Fetch the live merkle_root from card_index.json."""
    try:
        req = urllib.request.Request("https://councilof.ai/signed/card_index.json", headers={"User-Agent": "CSOAI/1.0"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            d = json.loads(resp.read().decode())
        cards = d.get("cards", [])
        sha256s = [c.get("card") for c in cards if isinstance(c, dict) and c.get("card")]
        if not sha256s:
            return ""
        layer = list(sha256s)
        while len(layer) > 1:
            next_layer = []
            for i in range(0, len(layer), 2):
                if i + 1 < len(layer):
                    h = hashlib.sha256((layer[i] + layer[i + 1]).encode()).hexdigest()
                else:
                    h = hashlib.sha256((layer[i] + layer[i]).encode()).hexdigest()
                next_layer.append(h)
            layer = next_layer
        return layer[0]
    except Exception as e:
        print(f"  error fetching live merkle_root: {e}", file=sys.stderr)
        return ""


def main():
    p = argparse.ArgumentParser(description="Real OTS stamp via a.pool.opentimestamps.org")
    p.add_argument("digest", nargs="?", help="Digest to stamp (64 hex chars)")
    p.add_argument("--file", help="File to hash + stamp")
    p.add_argument("--merkle-root", action="store_true", help="Stamp the live merkle_root from card_index.json")
    args = p.parse_args()

    if args.merkle_root:
        digest = fetch_live_merkle_root()
        if not digest:
            print("ERROR: live merkle_root is empty", file=sys.stderr)
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

    # Save the .ots files (one per pool)
    saved = []
    for r in result.get("results", []):
        if r.get("hex"):
            pool_name = r["pool"].split("//")[1].split(".")[0]
            ots_file = Path("scripts/ots") / f"{digest[:16]}-{pool_name}.ots"
            ots_file.parent.mkdir(parents=True, exist_ok=True)
            ots_file.write_bytes(bytes.fromhex(r["hex"]))
            saved.append(str(ots_file))
            print(f"Saved: {ots_file} ({r['size']} bytes)")

    return result


if __name__ == "__main__":
    main()
