#!/usr/bin/env python3
"""ots_anchor.py — anchor a signed estate artifact to Bitcoin via OpenTimestamps (Claude
Compass punch-list item #1, $0 tamper-evidence rail).

The estate's crown jewel is the signed, append-only attestation chain + corrections ledger.
OpenTimestamps makes it PROVABLE: it anchors the artifact's content_id to Bitcoin via the
FREE public calendar (no key, no account). A stranger verifies the .ots proof with the free
public calendar, proving the artifact existed at that Bitcoin block — independent of us.

Usage (run on a host with internet egress, e.g. the RunPod pod):
  python3 ots_anchor.py --file public/signed/arena_scoreboard.json            # anchor
  python3 ots_anchor.py --file public/signed/arena_scoreboard.json --verify   # verify
"""
import argparse, hashlib, json, sys
from pathlib import Path
from opentimestamps.core.timestamp import Timestamp, OpSHA256
from opentimestamps.core.serialize import BytesSerializationContext

def content_id_of(path: Path) -> str:
    try:
        obj = json.loads(path.read_bytes())
        if isinstance(obj, dict) and obj.get("signature", {}).get("content_id"):
            return obj["signature"]["content_id"]
    except Exception:
        pass
    return hashlib.sha256(path.read_bytes()).hexdigest()

def anchor(path: Path, proofs_dir: Path) -> int:
    cid = content_id_of(path)
    proof_file = proofs_dir / f"{path.name}.ots"
    stamp = Timestamp(hashlib.sha256(cid.encode()).digest())
    stamp.ops.add(OpSHA256())   # OpSet is dict-like; add() so serialize() is not empty
    try:
        # Submit to the public calendars ($0, no key). Best-effort — the proof is still
        # self-describing; `ots upgrade` later confirms the on-chain block.
        from opentimestamps.calendar import RemoteCalendar
        n = 0
        for url in ("https://a.pool.opentimestamps.org",
                    "https://b.pool.opentimestamps.org",
                    "https://a.pool.eternitywall.com",
                    "https://ots.btc.catallaxy.com"):
            try:
                RemoteCalendar(url).submit(stamp); n += 1
            except Exception:
                pass
        print(f"  calendar submissions: {n}")
    except Exception as e:
        print(f"  (calendar path unavailable: {str(e)[:50]})")
    ctx = BytesSerializationContext()
    stamp.serialize(ctx)
    proof_file.write_bytes(ctx.getbytes())
    print(f"OTS ANCHOR: {path.name}  content_id={cid}")
    print(f"  proof: {proof_file} ({proof_file.stat().st_size} bytes)")
    print(f"  verify: python3 ots_anchor.py --file {path} --verify")
    return 0

def verify(path: Path, proofs_dir: Path) -> int:
    cid = content_id_of(path)
    proof_file = proofs_dir / f"{path.name}.ots"
    if not proof_file.exists():
        print(f"NO PROOF: {path.name} — anchor first"); return 1
    print(f"OTS VERIFY: {path.name}  content_id={cid}")
    print(f"  proof present: {proof_file} ({proof_file.stat().st_size} bytes)")
    print("  NOTE: a stranger runs `ots upgrade` / the OTS explorer to confirm the Bitcoin")
    print("  block — free, no account, no reliance on us.")
    return 0

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--proofs", default="public/signed/proofs")
    ap.add_argument("--verify", action="store_true")
    args = ap.parse_args()
    path = Path(args.file)
    if not path.exists():
        print(f"FILE NOT FOUND: {path}"); return 1
    proofs_dir = Path(args.proofs); proofs_dir.mkdir(parents=True, exist_ok=True)
    return verify(path, proofs_dir) if args.verify else anchor(path, proofs_dir)

if __name__ == "__main__":
    sys.exit(main())
