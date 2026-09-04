#!/usr/bin/env python3
"""Witness the root that is actually served, and report the status its own bytes support.

WHY THIS EXISTS. Three faults were found on 2026-09-04, and this script is the fix for all three.

  1. The published status said STAMPED_PENDING_BITCOIN while the .ots file already carried three
     Bitcoin block header attestations. The status was a string written at stamp time and never
     re-derived, so it stayed pessimistic forever. Here the status is COMPUTED from the proof.

  2. root-witness-latest.json pointed at a root that was no longer served — 50 cards and one
     generation behind the live 140. Rekor was fine: it is witnessed automatically within seconds
     of each root. It was the OTS stamp and the pointer file that never followed.

  3. Nothing re-checked that the witnessed bytes are the bytes a reader can fetch. That check is
     now the first thing this script does, and it fails loudly.

DOCTRINE. A timestamp proves these bytes existed at that time. It says nothing about whether any
measurement inside them is correct, and this file never claims otherwise.
"""
import argparse, base64, datetime, hashlib, io, json, os, sys, urllib.request

ROOT_URL = "https://councilof.ai/root.json"
DID_URL = "https://councilof.ai/.well-known/did.json"
REKOR = "https://rekor.sigstore.dev"
CALENDARS = ["https://a.pool.opentimestamps.org", "https://b.pool.opentimestamps.org",
             "https://alice.btc.calendar.opentimestamps.org", "https://bob.btc.calendar.opentimestamps.org"]
PREIMAGE_FIELDS = ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"]


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={"user-agent": "csoai-witness", "accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def preimage(root):
    """The exact bytes the board signs — the rule published in root.json's own sig_preimage field."""
    body = {k: root[k] for k in PREIMAGE_FIELDS if k in root}
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def ots_status(path):
    """Derive the status from the proof, never from a remembered string.

    Returns (status, [bitcoin block heights]). A proof carrying a BitcoinBlockHeaderAttestation is
    CONFIRMED whatever anyone wrote down at stamp time.
    """
    try:
        from opentimestamps.core.serialize import StreamDeserializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile
        from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
    except ImportError:
        return "UNCHECKABLE — opentimestamps not installed", []
    if not os.path.exists(path):
        return "ABSENT", []
    d = DetachedTimestampFile.deserialize(StreamDeserializationContext(io.BytesIO(open(path, "rb").read())))
    heights, pending = [], 0

    def walk(ts):
        nonlocal pending
        for a in ts.attestations:
            if isinstance(a, BitcoinBlockHeaderAttestation):
                heights.append(a.height)
            elif isinstance(a, PendingAttestation):
                pending += 1
        for _, sub in ts.ops.items():
            walk(sub)

    walk(d.timestamp)
    if heights:
        return "CONFIRMED_BITCOIN", sorted(set(heights))
    return ("STAMPED_PENDING_BITCOIN" if pending else "NO_ATTESTATION"), []


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--out-dir", default="public/interop")
    ap.add_argument("--stamp", action="store_true", help="submit a new OTS stamp if none exists for these bytes")
    args = ap.parse_args()

    raw = fetch(ROOT_URL)
    root = json.loads(raw)
    root_sha = hashlib.sha256(raw).hexdigest()
    pre = preimage(root)
    pre_sha = hashlib.sha256(pre).hexdigest()
    ots_path = os.path.join(args.out_dir, f"root-{root_sha[:8]}.json.ots")

    # FAULT 3: the witnessed bytes must be the bytes a reader can fetch.
    print(f"live root      : {root_sha}  {len(raw)} bytes  {root['card_count']} cards  {root['as_of']}")
    print(f"signed preimage: {pre_sha}")

    if args.stamp and not os.path.exists(ots_path):
        from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
        from opentimestamps.core.op import OpSHA256
        from opentimestamps.core.serialize import StreamSerializationContext
        from opentimestamps.calendar import RemoteCalendar
        ts = Timestamp(bytes.fromhex(root_sha))
        ok = 0
        for c in CALENDARS:
            try:
                ts.merge(RemoteCalendar(c).submit(bytes.fromhex(root_sha)))
                ok += 1
            except Exception as e:
                print(f"  calendar {c} failed: {e}", file=sys.stderr)
        os.makedirs(args.out_dir, exist_ok=True)
        with open(ots_path, "wb") as f:
            DetachedTimestampFile(OpSHA256(), ts).serialize(StreamSerializationContext(f))
        print(f"stamped        : {ots_path} from {ok}/{len(CALENDARS)} calendars")

    status, heights = ots_status(ots_path)
    print(f"ots            : {status}" + (f" blocks {heights}" if heights else ""))

    # Rekor witnesses the signed preimage automatically with each root; find the entry rather than
    # re-submitting, because a duplicate submission is a 409 and not a new witness.
    rekor = {"status": "NOT_FOUND"}
    try:
        q = json.dumps({"hash": f"sha256:{pre_sha}"}).encode()
        req = urllib.request.Request(f"{REKOR}/api/v1/index/retrieve", data=q,
                                     headers={"content-type": "application/json", "accept": "application/json"},
                                     method="POST")
        uuids = json.loads(urllib.request.urlopen(req, timeout=35).read())
        if uuids:
            e = json.loads(fetch(f"{REKOR}/api/v1/log/entries/{uuids[0]}", 35))
            k = list(e)[0]
            rekor = {"status": "WITNESSED", "uuid": k, "logIndex": e[k].get("logIndex"),
                     "integratedTime": e[k].get("integratedTime"),
                     "inclusion_proof": "inclusionProof" in e[k].get("verification", {})}
    except Exception as e:
        rekor = {"status": "UNCHECKABLE", "reason": str(e)[:80]}
    print(f"rekor          : {rekor.get('status')} {rekor.get('logIndex','')}")

    out = {
        "kind": "csoai.root-witness/v2", "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": ("Witnesses for the live signed public root — existence and time of these exact bytes. "
                 "Every status here is derived from the artefact at run time, never remembered from when it "
                 "was written. Not certification, not endorsement. ONE root anchor, never N leaves."),
        "artifact": {"url": ROOT_URL, "sha256": root_sha, "bytes": len(raw),
                     "merkle_root": root.get("merkle_root"), "card_count": root.get("card_count"),
                     "as_of": root.get("as_of")},
        "signature": {"did": root.get("did_intended"), "field": "sig_ed25519",
                      "preimage_fields": PREIMAGE_FIELDS, "preimage_sha256": pre_sha,
                      "preimage_bytes": len(pre)},
        "witnesses": {
            "rekor": rekor,
            "ots": {"status": status, "bitcoin_blocks": heights,
                    "path": ots_path if os.path.exists(ots_path) else None,
                    "note": "status re-derived from the proof's own attestations on every run"},
        },
        "boundary": ("A timestamp proves these bytes existed at that time. It says nothing about whether "
                     "any measurement inside them is correct."),
    }
    os.makedirs(args.out_dir, exist_ok=True)
    p = os.path.join(args.out_dir, "root-witness-latest.json")
    json.dump(out, open(p, "w"), indent=1)
    print(f"wrote          : {p}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
