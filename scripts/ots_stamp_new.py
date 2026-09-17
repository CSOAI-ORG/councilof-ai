#!/usr/bin/env python3
"""Create fresh detached OpenTimestamps proofs for artifacts, honestly labelled.

WHY THIS EXISTS. Our board signer is OIDC inside GitHub Actions and Actions are
disabled account-wide, so nothing can be SIGNED today. Anchoring is a different
mechanism: OpenTimestamps calendars are public HTTP servers and need no GitHub,
no key and no wallet. An artifact can therefore be anchored today even though it
cannot be signed today.

WHAT A FRESH STAMP IS, AND IS NOT. A stamp returned by a calendar right now is a
PENDING CALENDAR COMMITMENT. It is a promise by that calendar to include your
digest in a Bitcoin transaction, not evidence that it did. It becomes a Bitcoin
attestation only after the calendar aggregates and the transaction confirms,
which takes hours, and only after the proof is UPGRADED (see ots-upgrade.py) and
then verified against the chain.

This estate has already published fifteen files named `.ots` that were pending
calendar fragments presented as proofs. So this script writes a sidecar JSON
stating the real state, and never labels a fresh stamp as Bitcoin-attested.
"""
import argparse, hashlib, json, pathlib, sys, datetime

CALENDARS = [
    "https://alice.btc.calendar.opentimestamps.org",
    "https://bob.btc.calendar.opentimestamps.org",
    "https://finney.calendar.eternitywall.com",
]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--out-dir", default=None)
    a = ap.parse_args()

    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext

    rows = []
    for sp in a.paths:
        p = pathlib.Path(sp)
        if not p.is_file():
            print(f"  SKIP  {sp}: not a file"); continue
        raw = p.read_bytes()
        digest = hashlib.sha256(raw).digest()
        ts = Timestamp(digest)

        got = []
        for url in CALENDARS:
            try:
                cal = RemoteCalendar(url)
                res = cal.submit(digest, timeout=30)
                ts.merge(res)
                got.append(url)
            except Exception as e:
                print(f"      calendar {url} -> {type(e).__name__}: {str(e)[:80]}")
        if not got:
            print(f"  FAIL  {p.name}: no calendar accepted the digest; NOT writing a .ots")
            rows.append({"path": sp, "state": "NOT_STAMPED",
                         "reason": "no calendar accepted the submission"})
            continue

        dtf = DetachedTimestampFile(OpSHA256(), ts)
        ctx = BytesSerializationContext()
        dtf.serialize(ctx)
        proof = ctx.getbytes()

        out = pathlib.Path(a.out_dir or p.parent) / (p.name + ".ots")
        out.write_bytes(proof)

        # READ IT BACK AND PARSE IT. A file with a .ots extension is not a proof.
        from opentimestamps.core.serialize import BytesDeserializationContext
        back = DetachedTimestampFile.deserialize(BytesDeserializationContext(out.read_bytes()))
        binds = back.file_digest == digest
        n_attest = len(list(back.timestamp.all_attestations()))

        print(f"  OK    {p.name}  sha256={hashlib.sha256(raw).hexdigest()[:16]}  "
              f"calendars={len(got)}  proof={len(proof)}B  binds={binds}  attestations={n_attest}")
        rows.append({
            "path": sp, "sha256": hashlib.sha256(raw).hexdigest(), "bytes": len(raw),
            "ots_file": str(out), "ots_bytes": len(proof),
            "calendars_accepted": got,
            "proof_parses": True,
            "proof_binds_to_file_digest": binds,
            "attestation_count": n_attest,
            "state": "PENDING_CALENDAR_COMMITMENT",
            "state_meaning": ("A calendar has accepted this digest and promised future Bitcoin "
                             "inclusion. This is NOT a Bitcoin attestation and must never be "
                             "described as one. Run scripts/ots-upgrade.py in a few hours, then "
                             "verify against the chain, before any file is called anchored."),
        })

    manifest = {
        "schema": "csoai.ots-stamp-batch/0.1",
        "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "signed": False,
        "unsigned_reason": "The board signer runs as OIDC inside GitHub Actions, disabled account-wide.",
        "anchoring_is_not_signing": ("Anchoring proves WHEN bytes existed. Signing proves WHO "
                                     "attests to them. These artifacts are being anchored and are "
                                     "NOT signed; neither substitutes for the other."),
        "calendars": CALENDARS,
        "stamps": rows,
    }
    mp = pathlib.Path(a.out_dir or ".") / "ots-stamp-batch-2026-09-17.json"
    mp.write_text(json.dumps(manifest, indent=1))
    print(f"\nwrote {mp}")
    return 0 if any(r.get("state") == "PENDING_CALENDAR_COMMITMENT" for r in rows) else 1

if __name__ == "__main__":
    sys.exit(main())
