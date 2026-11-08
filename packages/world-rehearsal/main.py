#!/usr/bin/env python3
"""Run from the monorepo or the self-contained candidate archive."""
import argparse
import json
from pathlib import Path
import sys
sys.dont_write_bytecode = True
from rehearsal.engine import simulate
from rehearsal.evidence import bundle_for, strict_json, verify


def main():
    parser = argparse.ArgumentParser(description="Council of AI synthetic rehearsal candidate")
    sub = parser.add_subparsers(dest="command", required=True)
    serve = sub.add_parser("serve")
    serve.add_argument("--port", type=int, default=8765)
    run = sub.add_parser("run")
    run.add_argument("--population", type=int, default=1000)
    run.add_argument("--seed", type=int, default=42)
    run.add_argument("--intervention", choices=["baseline", "evidence-aware"], default="evidence-aware")
    check = sub.add_parser("verify")
    check.add_argument("file")
    runtime = sub.add_parser("runtime-status")
    runtime.add_argument("--socket", required=True)
    args = parser.parse_args()
    if args.command == "serve":
        from rehearsal.server import serve as start
        start(args.port)
    elif args.command == "run":
        print(json.dumps(bundle_for(simulate({"population": args.population,
                         "seed": args.seed, "intervention": args.intervention})), indent=2))
    elif args.command == "runtime-status":
        from rehearsal.runtime import probe_unix
        print(json.dumps(probe_unix(args.socket), indent=2))
    else:
        path = Path(args.file)
        if path.stat().st_size > 2 * 1024 * 1024:
            raise ValueError("Bundle exceeds 2 MiB")
        print(json.dumps(verify(strict_json(path.read_bytes())), indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, KeyError) as error:
        print(f"Refused: {error}", file=sys.stderr)
        sys.exit(2)
