#!/usr/bin/env python3
"""Run from the monorepo or the self-contained candidate archive."""
import argparse
import json
import os
import stat
import sys
sys.dont_write_bytecode = True
from rehearsal.engine import simulate
from rehearsal.evidence import bundle_for, strict_json, verify, compare, events_jsonl


def read_bundle(filename):
    """Bound the read on one open regular file, including after a path replacement."""
    flags = os.O_RDONLY | getattr(os, "O_NONBLOCK", 0) | getattr(os, "O_NOFOLLOW", 0)
    with os.fdopen(os.open(filename, flags), "rb") as stream:
        if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
            raise ValueError("Select a regular bundle file")
        raw = stream.read(2 * 1024 * 1024 + 1)
    if len(raw) > 2 * 1024 * 1024:
        raise ValueError("Bundle exceeds 2 MiB")
    return strict_json(raw)


def main():
    parser = argparse.ArgumentParser(description="Council of AI synthetic rehearsal candidate")
    sub = parser.add_subparsers(dest="command", required=True)
    serve = sub.add_parser("serve")
    serve.add_argument("--port", type=int, default=8765)
    run = sub.add_parser("run")
    run.add_argument("--population", type=int, default=1000)
    run.add_argument("--seed", type=int, default=42)
    run.add_argument("--rounds", type=int, default=10)
    run.add_argument("--revocation-tick", type=int, default=3)
    run.add_argument("--permit-expires-tick", type=int, default=50)
    run.add_argument("--intervention", choices=["baseline", "evidence-aware"], default="evidence-aware")
    check = sub.add_parser("verify")
    check.add_argument("file")
    comparison = sub.add_parser("compare")
    comparison.add_argument("first")
    comparison.add_argument("second")
    events = sub.add_parser("events")
    events.add_argument("file")
    runtime = sub.add_parser("runtime-status")
    runtime.add_argument("--socket", required=True)
    args = parser.parse_args()
    if args.command == "serve":
        from rehearsal.server import serve as start
        start(args.port)
    elif args.command == "run":
        print(json.dumps(bundle_for(simulate({"population": args.population,
                         "seed": args.seed, "rounds": args.rounds,
                         "revocation_tick": args.revocation_tick,
                         "permit_expires_tick": args.permit_expires_tick,
                         "intervention": args.intervention})), indent=2))
    elif args.command == "runtime-status":
        from rehearsal.runtime import probe_unix
        print(json.dumps(probe_unix(args.socket), indent=2))
    elif args.command == "compare":
        print(json.dumps(compare(read_bundle(args.first), read_bundle(args.second)), indent=2))
    elif args.command == "events":
        print(events_jsonl(read_bundle(args.file)), end="")
    else:
        print(json.dumps(verify(read_bundle(args.file)), indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError, TypeError, RecursionError) as error:
        print(f"Refused: {error}", file=sys.stderr)
        sys.exit(2)
