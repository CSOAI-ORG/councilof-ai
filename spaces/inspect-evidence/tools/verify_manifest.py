"""Stdlib-only check of evidence/ against evidence_manifest.json (same Merkle rule as index.html).

Exit 0 only if every listed log hashes to its manifest sha256 and the Merkle root matches.
Usage: python tools/verify_manifest.py [bundle_dir]
"""
import hashlib, json, sys
from pathlib import Path


def merkle_root(hex_leaves):
    level = [hashlib.sha256(b"\x00" + bytes.fromhex(x)).digest() for x in hex_leaves]
    if not level:
        return ""
    while len(level) > 1:
        level = [hashlib.sha256(b"\x01" + level[i] + level[i + 1]).digest() if i + 1 < len(level) else level[i]
                 for i in range(0, len(level), 2)]
    return level[0].hex()


def main(root_dir="."):
    ev = Path(root_dir) / "evidence"
    man = json.loads((ev / "evidence_manifest.json").read_text())
    ok, got = True, []
    for r in sorted(man["logs"], key=lambda r: r["file"]):
        p = ev / "logs" / r["file"]
        h = hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else "00" * 32
        got.append(h)
        state = "VALID" if h == r["sha256"] else "INVALID"
        ok &= state == "VALID"
        print(f"{state:8} {r['file']}")
    root = merkle_root(got)
    state = "VALID" if root == man["merkle_root"] else "INVALID"
    ok &= state == "VALID"
    print(f"{state:8} merkle_root {root}")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "."))
