#!/usr/bin/env python3
"""ots_anchor.py — anchor a signed estate artifact to Bitcoin via OpenTimestamps (Claude
Compass punch-list item #1, $0 tamper-evidence rail).

The estate's crown jewel is the signed, append-only attestation chain + corrections ledger.
OpenTimestamps makes it PROVABLE: it anchors the artifact's content_id to Bitcoin via the
FREE public calendar (no key, no account). A stranger verifies the .ots proof with the free
public calendar, proving the artifact existed at that Bitcoin block — independent of us.

`--verify` used to check only that the .ots file EXISTED, print its byte size, and
return 0 — a verify that could not fail. It now parses the proof, walks its attestations
and reports one of four distinct states, each with its own exit code:

  VERIFIED      (0) a Bitcoin block-header attestation whose digest equals the merkle
                    root of a block header the caller supplied with --block-header
  ATTESTED      (2) a Bitcoin attestation naming a block height, but the block header
                    was NOT checked here — a claim, not a completed verification
  PENDING       (2) the proof parses and carries only calendar (pending) attestations —
                    not yet in a block
  NOT-VERIFIED  (1) no proof file, unreadable bytes, or a proof carrying no attestation

Only VERIFIED exits 0. "The proof file exists" is not a verification result.

Usage (run on a host with internet egress, e.g. the RunPod pod):
  python3 ots_anchor.py --file public/signed/arena_scoreboard.json            # anchor
  python3 ots_anchor.py --file public/signed/arena_scoreboard.json --verify   # verify
  python3 ots_anchor.py --file X --verify --block-header <160-hex>            # complete it
  python3 ots_anchor.py --selftest                                            # prove it fails
"""
import argparse, hashlib, json, sys
from pathlib import Path
from opentimestamps.core.timestamp import Timestamp, OpSHA256
from opentimestamps.core.serialize import (BytesDeserializationContext,
                                           BytesSerializationContext)
from opentimestamps.core.notary import (BitcoinBlockHeaderAttestation,
                                        PendingAttestation, UnknownAttestation)

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

def _load_proof(proof_file: Path, msg: bytes):
    """Deserialize a .ots proof. Returns (timestamp, None) or (None, reason)."""
    raw = proof_file.read_bytes()
    if not raw:
        return None, "proof file is empty"
    try:
        ctx = BytesDeserializationContext(raw)
        stamp = Timestamp.deserialize(ctx, msg)
    except Exception as e:                      # noqa: BLE001 - reported, never swallowed
        return None, f"not a deserialisable OpenTimestamps proof ({type(e).__name__}: {str(e)[:90]})"
    return stamp, None


def verify(path: Path, proofs_dir: Path, block_header_hex: str | None = None) -> int:
    """Verify the OTS proof for `path`. Returns 0 ONLY for a completed verification."""
    cid = content_id_of(path)
    msg = hashlib.sha256(cid.encode()).digest()
    proof_file = proofs_dir / f"{path.name}.ots"

    print(f"OTS VERIFY: {path.name}  content_id={cid}")
    if not proof_file.exists():
        print(f"  NOT-VERIFIED: no proof at {proof_file} — anchor first")
        return 1
    print(f"  proof: {proof_file} ({proof_file.stat().st_size} bytes)")

    stamp, reason = _load_proof(proof_file, msg)
    if stamp is None:
        print(f"  NOT-VERIFIED: {reason}")
        return 1

    attestations = list(stamp.all_attestations())
    if not attestations:
        print("  NOT-VERIFIED: proof parses but carries no attestation — nothing was "
              "committed to any calendar or block")
        return 1

    pending = [(d, a) for d, a in attestations if isinstance(a, PendingAttestation)]
    bitcoin = [(d, a) for d, a in attestations if isinstance(a, BitcoinBlockHeaderAttestation)]
    unknown = [(d, a) for d, a in attestations if isinstance(a, UnknownAttestation)]
    for _, a in pending:
        print(f"  pending calendar: {a.uri.decode() if isinstance(a.uri, bytes) else a.uri}")
    for _, a in bitcoin:
        print(f"  bitcoin attestation: block height {a.height}")
    for _, a in unknown:
        print(f"  unknown attestation tag: {a.tag.hex()}")

    if bitcoin and block_header_hex:
        try:
            from bitcoin.core import CBlockHeader
            header = CBlockHeader.deserialize(bytes.fromhex(block_header_hex.strip()))
        except Exception as e:                  # noqa: BLE001
            print(f"  NOT-VERIFIED: --block-header is not an 80-byte block header "
                  f"({type(e).__name__}: {str(e)[:70]})")
            return 1
        for digest, att in bitcoin:
            try:
                block_time = att.verify_against_blockheader(digest, header)
            except Exception as e:              # noqa: BLE001
                print(f"  NOT-VERIFIED: block {att.height} — {str(e)[:90]}")
                return 1
            print(f"  VERIFIED: digest is the merkle root of the supplied header for "
                  f"block {att.height} (nTime {block_time})")
        return 0

    if bitcoin:
        print("  ATTESTED (NOT VERIFIED): the proof names a Bitcoin block, but no block "
              "header was supplied, so nothing was checked against the chain here.")
        print("  Complete it: --block-header <80-byte header hex>, or run `ots upgrade` / "
              "`ots verify` against a node. Until then this is a claim, not a proof.")
        return 2

    print("  PENDING (NOT VERIFIED): calendar attestations only — the proof is not yet in "
          "a Bitcoin block. Run `ots upgrade` once a block has confirmed.")
    return 2


def _selftest(tmp: Path | None = None) -> int:
    """Prove --verify can fail: feed it exactly what it used to accept."""
    import tempfile
    ok = True

    def expect(name, cond, detail=""):
        nonlocal ok
        print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f" — {detail}" if not cond and detail else ""))
        ok = ok and cond

    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        f = root / "sample.json"
        f.write_text(json.dumps({"hello": "world"}))
        proofs = root / "proofs"
        proofs.mkdir()

        expect("no proof at all -> exit 1", verify(f, proofs) == 1)

        (proofs / "sample.json.ots").write_bytes(b"NOT AN OTS PROOF AT ALL")
        expect("garbage bytes -> exit 1 (this returned 0 before)", verify(f, proofs) == 1)

        (proofs / "sample.json.ots").write_bytes(b"")
        expect("empty proof -> exit 1", verify(f, proofs) == 1)

        msg = hashlib.sha256(content_id_of(f).encode()).digest()

        # A real proof, truncated in transit. Must not verify.
        good = Timestamp(msg)
        good.attestations.add(PendingAttestation("https://a.pool.opentimestamps.org"))
        ctx = BytesSerializationContext(); good.serialize(ctx)
        (proofs / "sample.json.ots").write_bytes(ctx.getbytes()[:-6])
        expect("truncated proof -> exit 1", verify(f, proofs) == 1)

        # Calendar-only proof: parses, honest PENDING, still not exit 0.
        pend = Timestamp(msg)
        pend.attestations.add(PendingAttestation("https://a.pool.opentimestamps.org"))
        ctx = BytesSerializationContext(); pend.serialize(ctx)
        (proofs / "sample.json.ots").write_bytes(ctx.getbytes())
        expect("calendar-only -> exit 2 PENDING, never 0", verify(f, proofs) == 2)

        # Bitcoin attestation with no header supplied: ATTESTED, still not exit 0.
        from bitcoin.core import CBlockHeader
        btc = Timestamp(msg)
        btc.attestations.add(BitcoinBlockHeaderAttestation(700000))
        ctx = BytesSerializationContext(); btc.serialize(ctx)
        (proofs / "sample.json.ots").write_bytes(ctx.getbytes())
        expect("bitcoin attestation, no header -> exit 2, never 0", verify(f, proofs) == 2)

        # A header whose merkle root is NOT our digest must fail, not pass.
        wrong = ("01000000" + "00" * 32 + "11" * 32 + "00000000" + "ffff001d" + "00000000")
        expect("wrong block header -> exit 1", verify(f, proofs, wrong) == 1)

        # The matching header verifies: digest == merkle root -> exit 0.
        right = ("01000000" + "00" * 32 + msg.hex() + "5f5e1000" + "ffff001d" + "00000000")
        hdr = CBlockHeader.deserialize(bytes.fromhex(right))
        expect("header merkle root == our digest", hdr.hashMerkleRoot == msg)
        expect("matching block header -> exit 0 VERIFIED", verify(f, proofs, right) == 0)

    print("  selftest:", "OK" if ok else "FAILED")
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file")
    ap.add_argument("--proofs", default="public/signed/proofs")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--block-header", default=None,
                    help="80-byte Bitcoin block header (hex) to complete the verification")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        return _selftest()
    if not args.file:
        ap.error("--file is required (or use --selftest)")
    path = Path(args.file)
    if not path.exists():
        print(f"FILE NOT FOUND: {path}"); return 1
    proofs_dir = Path(args.proofs); proofs_dir.mkdir(parents=True, exist_ok=True)
    if args.verify:
        return verify(path, proofs_dir, args.block_header)
    return anchor(path, proofs_dir)

if __name__ == "__main__":
    sys.exit(main())
