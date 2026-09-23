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

def receipt_location(out_dir, source_parents):
    """Where the batch receipt lands, and why.

    --out-dir when one is given; otherwise the single directory the stamped
    artifacts live in. Only when the inputs span several directories is there
    no one place that is "alongside" them, and only then does the receipt fall
    back to the working directory -- announced, not silently.
    """
    if out_dir is not None:
        return pathlib.Path(out_dir), "--out-dir"
    parents = {p.resolve() for p in source_parents}
    if len(parents) == 1:
        return parents.pop(), "alongside the stamped artifacts"
    if not parents:
        return pathlib.Path.cwd(), "the working directory: no input path was a readable file"
    return pathlib.Path.cwd(), (
        f"the working directory: the inputs span {len(parents)} directories, so no single "
        "directory is alongside them -- pass --out-dir to place the receipt deliberately")


def receipt_name(now):
    """The receipt is named for the instant it records as `as_of`, never a literal.

    A hardcoded 2026-09-17 sat here; a run on 2026-09-23 wrote a file whose name
    claimed the 17th. The date a generator prints is a claim like any other.
    """
    return f"ots-stamp-batch-{now.strftime('%Y-%m-%d')}.json"


def main(argv=None, now=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--out-dir", default=None)
    a = ap.parse_args(argv)

    from opentimestamps.calendar import RemoteCalendar
    from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
    from opentimestamps.core.op import OpSHA256
    from opentimestamps.core.serialize import BytesSerializationContext

    # --out-dir is a destination, not a precondition: create it before the first
    # proof is written, or a run with a fresh directory loses every .ots it made.
    if a.out_dir is not None:
        pathlib.Path(a.out_dir).mkdir(parents=True, exist_ok=True)

    rows = []
    source_parents = []
    for sp in a.paths:
        p = pathlib.Path(sp)
        if not p.is_file():
            print(f"  SKIP  {sp}: not a file"); continue
        source_parents.append(p.parent)
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

    # One instant serves both the recorded `as_of` and the receipt filename, so
    # the name can never disagree with the bytes it names.
    now = datetime.datetime.now(datetime.timezone.utc) if now is None else now
    manifest = {
        "schema": "csoai.ots-stamp-batch/0.1",
        "as_of": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "signed": False,
        "unsigned_reason": "The board signer runs as OIDC inside GitHub Actions, disabled account-wide.",
        "anchoring_is_not_signing": ("Anchoring proves WHEN bytes existed. Signing proves WHO "
                                     "attests to them. These artifacts are being anchored and are "
                                     "NOT signed; neither substitutes for the other."),
        "calendars": CALENDARS,
        "stamps": rows,
    }
    where, why = receipt_location(a.out_dir, source_parents)
    where.mkdir(parents=True, exist_ok=True)
    mp = where / receipt_name(now)
    mp.write_text(json.dumps(manifest, indent=1))
    print(f"\nwrote {mp}  ({why})")
    return 0 if any(r.get("state") == "PENDING_CALENDAR_COMMITMENT" for r in rows) else 1

if __name__ == "__main__":
    sys.exit(main())
