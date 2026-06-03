#!/usr/bin/env python3
"""
Repair the catalogue-wide "Buy Pro" docstring injection that broke ~272 MCP
server.py files (SyntaxError on import → every pip install crashes).

A prior session prepended:
    \"\"\"
    Buy Pro: https://www.csoai.org/checkout
    \"\"\"
to the top of each file. The injected closing \"\"\" collided with each file's
original module docstring, closing it early and turning the header into code.

Strategy per broken file (only ever WRITES a file that parses afterwards):
  1) SURGICAL: delete the injected stray closing \"\"\" (keeps Buy Pro line +
     preserves all uncommitted features). Preferred.
  2) GIT-RESTORE: `git checkout HEAD -- server.py` (fallback; loses uncommitted
     changes but unbreaks).
  3) leave untouched + report for manual fix.

Usage:  python3 tools/fix_buypro_injection.py [--apply]   (default: dry-run)
"""
import os, ast, re, subprocess, sys

ROOT = os.path.expanduser("~/clawd/mcp-marketplace")
APPLY = "--apply" in sys.argv
INJ = re.compile(r'"""\nBuy Pro:([^\n]*)\n"""')

def parses(src):
    try:
        ast.parse(src); return True
    except SyntaxError:
        return False

def main():
    os.chdir(ROOT)
    dirs = sorted(d for d in os.listdir(".")
                  if os.path.isdir(d) and os.path.exists(f"{d}/server.py"))
    surgical, gitrest, manual, already = [], [], [], 0
    for d in dirs:
        fn = f"{d}/server.py"
        src = open(fn, encoding="utf-8").read()
        if parses(src):
            already += 1
            continue
        # 1) surgical
        fixed = INJ.sub(r'"""\nBuy Pro:\1\n', src, count=1)
        if fixed != src and parses(fixed):
            if APPLY:
                open(fn, "w", encoding="utf-8").write(fixed)
            surgical.append(d); continue
        # 2) git restore HEAD
        r = subprocess.run(["git", "-C", d, "show", "HEAD:server.py"],
                           capture_output=True, text=True)
        if r.returncode == 0 and parses(r.stdout):
            if APPLY:
                subprocess.run(["git", "-C", d, "checkout", "HEAD", "--", "server.py"],
                               capture_output=True)
            gitrest.append(d); continue
        manual.append(d)

    print(f"{'APPLIED' if APPLY else 'DRY-RUN'} | packages: {len(dirs)} | already-OK: {already}")
    print(f"  surgical fix : {len(surgical)}")
    print(f"  git-restore  : {len(gitrest)}")
    print(f"  MANUAL needed: {len(manual)} -> {manual}")

if __name__ == "__main__":
    main()
