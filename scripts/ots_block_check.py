#!/usr/bin/env python3
"""Check every Bitcoin attestation in our proofs against the real block header at that height.

WHY THIS IS A SEPARATE STEP. Reading a BitcoinBlockHeaderAttestation out of an .ots file tells you
the proof CLAIMS a block. It does not tell you the block agrees. `ots verify` closes that gap by
asking a Bitcoin node — and on a host with no node it prints "Could not connect to Bitcoin node"
and EXITS 0, which looks exactly like a pass. That is the same shape as every other defect in this
estate's history: a check that cannot fail is not a check.

So this asks block explorers instead, and says so. For each attestation it takes the digest the
timestamp arrives at, and compares it to the merkle root of the block at the claimed height as two
independent public explorers report it. The comparison is the real one — OpenTimestamps commits a
digest into a block's merkle root, so digest == hashMerkleRoot is what a node checks too.

WHAT THIS IS NOT. It is not a Bitcoin node. It inherits the explorers' honesty about which chain
they are on. Two independent explorers agreeing is meaningfully better than one, and both are
named in the output; neither is called proof of work this script did. A height that no explorer
answers for is UNCHECKABLE and is never counted as a pass.

    python3 scripts/ots_block_check.py --dir public/interop --dir public/interop/ots --out check.json
"""
from __future__ import annotations

import argparse, collections, io, json, pathlib, sys, time, urllib.request, datetime

from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
from opentimestamps.core.serialize import StreamDeserializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile

UA = "csoai-trust-chain/0.1 (+https://councilof.ai)"
SOURCES = {
    "blockstream.info": ("https://blockstream.info/api/block-height/{h}", "https://blockstream.info/api/block/{hash}"),
    "mempool.space": ("https://mempool.space/api/block-height/{h}", "https://mempool.space/api/block/{hash}"),
}


def get(url: str, timeout: int = 30) -> str:
    req = urllib.request.Request(url, headers={"user-agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode().strip()


def merkle_root(height: int, pace: float) -> dict:
    """{source: merkle_root_hex_display} for every explorer that answered."""
    out: dict[str, str] = {}
    for name, (h_url, b_url) in SOURCES.items():
        try:
            bh = get(h_url.format(h=height))
            blk = json.loads(get(b_url.format(hash=bh)))
            out[name] = blk["merkle_root"]
            time.sleep(pace)
        except Exception as exc:
            out[name] = f"ERROR {type(exc).__name__}"
    return out


def attestations_with_msg(t, acc=None):
    """[(msg_bytes, attestation)] for every attestation anywhere in the tree."""
    acc = [] if acc is None else acc
    for a in t.attestations:
        acc.append((t.msg, a))
    for sub in t.ops.values():
        attestations_with_msg(sub, acc)
    return acc


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", action="append", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pace", type=float, default=0.25)
    a = ap.parse_args(argv)

    paths = []
    for d in a.dir:
        paths += sorted(pathlib.Path(d).glob("*.ots"))

    claims = []  # (file, height, digest_hex_internal)
    for p in paths:
        try:
            dtf = DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(p.read_bytes())))
        except Exception:
            continue
        for msg, att in attestations_with_msg(dtf.timestamp):
            if isinstance(att, BitcoinBlockHeaderAttestation):
                # Keyed by PATH, not basename: ten proofs are published under the same file name
                # in both scanned directories, and collapsing them would silently under-report.
                claims.append((str(p), att.height, msg.hex()))

    heights = sorted({h for _, h, _ in claims})
    print(f"{len(paths)} proof file(s); {len(claims)} Bitcoin attestation(s) over {len(heights)} distinct height(s)",
          flush=True)

    headers = {}
    for h in heights:
        headers[h] = merkle_root(h, a.pace)
        print(f"  block {h}: " + ", ".join(f"{k}={v[:16]}" for k, v in headers[h].items()), flush=True)

    rows, by_file = [], collections.defaultdict(list)
    for fname, h, digest_hex in claims:
        # A block's merkle root is stored little-endian in the header and displayed big-endian.
        # OpenTimestamps commits the header's internal bytes, so the display hex is reversed here.
        internal = {src: (bytes.fromhex(v)[::-1].hex() if not v.startswith("ERROR") else v)
                    for src, v in headers[h].items()}
        agree = {src: (v == digest_hex) for src, v in internal.items() if not v.startswith("ERROR")}
        state = ("MATCHES_BLOCK_HEADER" if agree and all(agree.values())
                 else "UNCHECKABLE" if not agree
                 else "DISAGREES")
        # The explorer answers live once, in distinct_blocks. Repeating them on all 1882 rows
        # made the published report a megabyte of the same 126 strings.
        row = {"path": fname, "block_height": h, "digest": digest_hex, "agrees": agree, "state": state}
        rows.append(row)
        by_file[fname].append(state)

    per_file = {f: ("MATCHES_BLOCK_HEADER" if all(s == "MATCHES_BLOCK_HEADER" for s in v)
                    else "DISAGREES" if any(s == "DISAGREES" for s in v) else "UNCHECKABLE")
                for f, v in by_file.items()}
    summary = collections.Counter(per_file.values())

    report = {
        "schema": "csoai.ots-block-check/0.1",
        "ran_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dirs": a.dir,
        "what_was_checked": ("For every BitcoinBlockHeaderAttestation in every proof: the digest the timestamp "
                             "arrives at, compared to the merkle root of the block at the claimed height as "
                             "reported by two independent public explorers."),
        "what_was_not_checked": ("This is not a Bitcoin node and did no proof-of-work validation. It inherits the "
                                 "explorers' honesty about which chain they are on. `ots verify` on this host "
                                 "cannot do the node check at all - with no node it prints 'Could not connect' and "
                                 "exits 0, so its silence is not a pass."),
        "sources": list(SOURCES),
        "attestations": len(claims),
        "files_with_a_bitcoin_attestation": len(per_file),
        "files": dict(summary),
        "distinct_blocks": {str(h): headers[h] for h in heights},
        "rows": rows,
        "per_file": per_file,
    }
    pathlib.Path(a.out).write_text(json.dumps(report, indent=2) + "\n")
    print(f"\nfiles: {dict(summary)}")
    print(f"report: {a.out}")
    return 0 if summary.get("DISAGREES", 0) == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
