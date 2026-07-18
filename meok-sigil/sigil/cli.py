"""
SIGIL CLI — the human translator, on the command line.

  sigil gloss  'V|jarvis|ad6d|+|0.82'      # -> plain English
  sigil parse  'V|jarvis|ad6d|+|0.82'      # -> JSON dict
  sigil digest 'V|jarvis|ad6d|+|0.82'      # -> 16-char audit hash
  sigil manifest                            # -> the current language
  sigil bench                               # -> run the token benchmark
  echo 'V|jarvis|ad6d|+|0.82' | sigil gloss # reads stdin if no arg
"""

import json
import sys

from . import gloss, parse, digest, manifest


def _read(args):
    if args:
        return " ".join(args)
    return sys.stdin.read().strip()


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    if not argv:
        print(__doc__)
        return 0
    cmd, rest = argv[0], argv[1:]
    try:
        if cmd == "gloss":
            print(gloss(_read(rest)))
        elif cmd == "parse":
            print(json.dumps(parse(_read(rest)), indent=2))
        elif cmd == "digest":
            print(digest(_read(rest)))
        elif cmd == "manifest":
            print(manifest())
        elif cmd == "bench":
            from .benchmark import run
            run(verbose=True)
        else:
            print(f"unknown command: {cmd}\n{__doc__}", file=sys.stderr)
            return 2
    except Exception as e:
        print(f"error: {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
