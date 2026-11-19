#!/usr/bin/env python3
"""Upgrade every calendar-pending .ots proof we publish, and record what actually changed.

WHY. An OpenTimestamps stamp is two things at two times. At submission a calendar hands back
a PendingAttestation: a promise to include the digest in its next Bitcoin commitment. Hours
later that commitment is in a block, and the proof CAN carry a BitcoinBlockHeaderAttestation
— but only if somebody fetches the completed path back from the calendar and rewrites the
local file. Nothing rewrites itself. On 2026-09-03 this estate was caught serving a proof as
pending for 20+ hours while its commitment was already in the chain, and again on 2026-09-17
when 56 of 70 were attested and served as pending. The defect is never the stamp; it is that
the upgrade never ran.

WHAT THIS DOES NOT DO. It never renames a state it did not establish from the bytes. A proof
that gains no BitcoinBlockHeaderAttestation is NOT rewritten and keeps saying PENDING. A file
that does not deserialize is NOT_A_PROOF and is never counted as either. The word "anchored"
appears nowhere in the output: an upgraded proof carries a block height this script has not
checked against a Bitcoin node (`ots verify` does that, separately).

SUPERSEDE-NEVER-EDIT. Upgrading is the documented exception to "never edit signed bytes": the
merge is strictly additive over the SAME commitment — the same message digest, the same ops
tree — and attaches the attestation the calendar has now completed. No signed payload, and no
byte of any subject file, is touched here.

    python3 ots_trust_upgrade.py --dir public/interop --dir public/interop/ots \
        --report /tmp/ots-run.json --pace 0.35
"""
from __future__ import annotations

import argparse, hashlib, io, json, pathlib, sys, time, datetime, collections

from opentimestamps.calendar import RemoteCalendar
from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
from opentimestamps.core.serialize import StreamDeserializationContext, StreamSerializationContext
from opentimestamps.core.timestamp import DetachedTimestampFile


def all_attestations(t):
    out = list(t.attestations)
    for sub in t.ops.values():
        out += all_attestations(sub)
    return out


def state_of(path: pathlib.Path):
    """(state, sorted block heights, pending calendar uris) read from the bytes on disk."""
    try:
        dtf = DetachedTimestampFile.deserialize(
            StreamDeserializationContext(io.BytesIO(path.read_bytes())))
    except Exception as exc:
        return "NOT_A_PROOF", [], [], type(exc).__name__
    atts = all_attestations(dtf.timestamp)
    blocks = sorted({a.height for a in atts if isinstance(a, BitcoinBlockHeaderAttestation)})
    uris = sorted({(a.uri.decode() if isinstance(a.uri, bytes) else a.uri)
                   for a in atts if isinstance(a, PendingAttestation)})
    return ("BITCOIN" if blocks else "PENDING"), blocks, uris, None


def upgrade_tree(t, pace: float, errors: list, calendars: collections.Counter) -> bool:
    """Merge back whatever each pending calendar can now complete. Additive only."""
    changed = False
    for att in list(t.attestations):
        if isinstance(att, PendingAttestation):
            uri = att.uri.decode() if isinstance(att.uri, bytes) else att.uri
            calendars[uri] += 1
            try:
                t.merge(RemoteCalendar(uri).get_timestamp(t.msg))
                changed = True
            except Exception as exc:  # reported, never swallowed
                errors.append(f"{uri}: {type(exc).__name__}: {str(exc)[:120]}")
            time.sleep(pace)  # polite: one request per calendar per pace seconds
    for sub in t.ops.values():
        changed |= upgrade_tree(sub, pace, errors, calendars)
    return changed


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", action="append", required=True)
    ap.add_argument("--report", required=True)
    ap.add_argument("--pace", type=float, default=0.35, help="seconds between calendar requests")
    ap.add_argument("--limit", type=int, default=0, help="0 = every pending proof")
    ap.add_argument("--observe-only", action="store_true",
                    help="classify from the bytes and write the report; contact no calendar")
    ap.add_argument("--cache", help=("directory of already-completed upgrades, keyed by the sha256 of the bytes "
                                     "they were produced FROM. A hit is applied without touching a calendar."))
    a = ap.parse_args(argv)

    paths = []
    for d in a.dir:
        paths += sorted(pathlib.Path(d).glob("*.ots"))

    # THE CACHE, and why it is safe. The loop that runs this checks out current master every hour,
    # which throws the tree's upgraded proofs away and would re-ask every calendar for work it has
    # already done - 1,600 requests an hour for an answer we hold. The cache is keyed by the
    # sha256 of the bytes an upgrade was produced FROM, so a hit is only ever applied to
    # byte-identical input: it cannot attach one artifact's attestation to another's proof. The
    # cached bytes are then classified from disk like any other, so a bad entry could not be
    # reported as attested without carrying a real attestation.
    cache = pathlib.Path(a.cache) if a.cache else None
    if cache:
        cache.mkdir(parents=True, exist_ok=True)

    rows, errors_all = [], []
    cache_hits = 0
    calendars = collections.Counter()
    t0 = time.time()
    attempted = 0

    for i, p in enumerate(paths, 1):
        before_state, before_blocks, uris, err = state_of(p)
        row = {
            "file": p.name,
            "path": str(p),
            "before_state": before_state,
            "before_blocks": before_blocks,
            "sha256_before": hashlib.sha256(p.read_bytes()).hexdigest(),
            "pending_calendars": uris,
            "parse_error": err,
        }

        if before_state != "PENDING" or a.observe_only or (a.limit and attempted >= a.limit):
            row["after_state"] = before_state
            row["after_blocks"] = before_blocks
            row["rewritten"] = False
            row["note"] = ("not pending — nothing to upgrade" if before_state == "BITCOIN"
                           else "does not deserialize as a detached proof; never counted as a proof"
                           if before_state == "NOT_A_PROOF" else "skipped")
            rows.append(row)
            continue

        hit = cache / (row["sha256_before"] + ".ots") if cache else None
        if hit is not None and hit.exists():
            original = p.read_bytes()
            p.write_bytes(hit.read_bytes())
            state2, blocks2, _, _ = state_of(p)   # read back from disk; a cache entry is never trusted
            if state2 == "BITCOIN":
                cache_hits += 1
                row.update(after_state="BITCOIN", after_blocks=blocks2, rewritten=True,
                           sha256_after=hashlib.sha256(p.read_bytes()).hexdigest(), from_cache=True,
                           note="upgrade already completed for these exact bytes; applied from cache, "
                                "no calendar contacted")
                rows.append(row)
                continue
            # The entry did not classify as attested. Put the original bytes back untouched, drop
            # the entry, and let the calendar path decide. A cache is an optimisation; it is never
            # allowed to change what gets published.
            p.write_bytes(original)
            hit.unlink(missing_ok=True)
            errors_all.append(f"cache: {hit.name} did not classify as BITCOIN; discarded")

        attempted += 1
        errs: list[str] = []
        dtf = DetachedTimestampFile.deserialize(
            StreamDeserializationContext(io.BytesIO(p.read_bytes())))
        upgrade_tree(dtf.timestamp, a.pace, errs, calendars)
        atts = all_attestations(dtf.timestamp)
        blocks = sorted({x.height for x in atts if isinstance(x, BitcoinBlockHeaderAttestation)})

        if blocks:
            # Write ONLY when the bytes now carry a Bitcoin attestation they did not carry before.
            buf = io.BytesIO()
            dtf.serialize(StreamSerializationContext(buf))
            p.write_bytes(buf.getvalue())
            if cache:
                (cache / (row["sha256_before"] + ".ots")).write_bytes(buf.getvalue())
            row.update(after_state="BITCOIN", after_blocks=blocks, rewritten=True,
                       sha256_after=hashlib.sha256(buf.getvalue()).hexdigest(),
                       note="upgraded: calendar completed the path to a Bitcoin block header")
        else:
            row.update(after_state="PENDING", after_blocks=[], rewritten=False,
                       note="calendar has not completed this commitment; file NOT rewritten, "
                            "still says pending")
        if errs:
            row["calendar_errors"] = errs
            errors_all += errs
        rows.append(row)

        if i % 25 == 0 or blocks:
            flips = sum(1 for r in rows if r.get("rewritten"))
            print(f"[{i}/{len(paths)}] attempted={attempted} upgraded={flips} "
                  f"elapsed={time.time()-t0:.0f}s  {p.name}: "
                  f"{row['before_state']}->{row['after_state']} {row['after_blocks'] or ''}",
                  flush=True)

    report = {
        "schema": "csoai.ots-upgrade-run/0.1",
        "ran_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "dirs": a.dir,
        "observe_only": a.observe_only,
        "cache_hits": cache_hits,
        "cache_dir": str(cache) if cache else None,
        "pace_seconds": a.pace,
        "elapsed_seconds": round(time.time() - t0, 1),
        "what_upgrading_is": ("A merge of the completed path back from the calendar onto the SAME "
                              "commitment. Strictly additive; no subject file and no signed payload "
                              "is touched. A proof that did not complete is not rewritten."),
        "attested_is_not_verified": ("BITCOIN here means the proof bytes carry a "
                                     "BitcoinBlockHeaderAttestation, parsed locally. It is not a "
                                     "check of that block header against a Bitcoin node."),
        "before": dict(collections.Counter(r["before_state"] for r in rows)),
        "after": dict(collections.Counter(r["after_state"] for r in rows)),
        "flipped_pending_to_bitcoin": sorted(
            ({"file": r["file"], "blocks": r["after_blocks"]}
             for r in rows if r.get("rewritten")), key=lambda r: r["file"]),
        "calendars_contacted": dict(calendars),
        "calendar_errors": collections.Counter(e.split(":")[0] + ": " + e.split(": ")[1]
                                               for e in errors_all if ": " in e),
        "proofs": rows,
    }
    pathlib.Path(a.report).write_text(json.dumps(report, indent=2) + "\n")
    b, af = report["before"], report["after"]
    print(f"\nBEFORE {b}\nAFTER  {af}")
    print(f"flipped PENDING->BITCOIN: {len(report['flipped_pending_to_bitcoin'])} "
          f"({cache_hits} from cache, {len(report['flipped_pending_to_bitcoin']) - cache_hits} from the calendars)")
    print(f"report: {a.report}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
