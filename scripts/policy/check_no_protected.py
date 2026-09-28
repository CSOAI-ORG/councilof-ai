#!/usr/bin/env python3
"""Fail if anything the protected manifest names appears in a public tree.

A protected item (reach calibration, private negative-control generators, priority heuristics,
customer data/configs, witness keys) lives only in the private store. This check is the
mechanical half of that rule: it runs over a directory, or over a git commit's tree (which also
covers files a sparse checkout does not materialise), and exits 1 on any hit.

Two kinds of hit:
  path     a path matching a class's glob ("**/npm-weekly-downloads.json")
  content  a text blob matching a class's content pattern (a PEM private-key header, a token
           shape). Blobs over content_scan_max_bytes and binary blobs are path-checked only.

The manifest's `allow` map exempts exact paths, each with a written reason. It starts empty.

Usage:
  check_no_protected.py --tree DIR           [--manifest docs/policy/protected-manifest.json]
  check_no_protected.py --git-ref HEAD       [--repo .]
  check_no_protected.py --tree DIR --json    machine-readable result
Exit: 0 clean, 1 hits, 2 usage/manifest error.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import threading

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_MANIFEST = os.path.normpath(os.path.join(HERE, "..", "..", "docs", "policy", "protected-manifest.json"))
SKIP_DIRS = {".git", "node_modules", "__pycache__"}


def glob_to_regex(g):
    """'**/' = any number of directories (including none); '*' and '?' never cross '/'."""
    i, out = 0, []
    while i < len(g):
        if g.startswith("**/", i):
            out.append("(?:.*/)?")
            i += 3
        elif g.startswith("**", i):
            out.append(".*")
            i += 2
        elif g[i] == "*":
            out.append("[^/]*")
            i += 1
        elif g[i] == "?":
            out.append("[^/]")
            i += 1
        else:
            out.append(re.escape(g[i]))
            i += 1
    return re.compile("^" + "".join(out) + "$")


class Manifest:
    def __init__(self, path):
        with open(path) as fh:
            m = json.load(fh)
        self.path = path
        self.globs, self.patterns = [], []
        for cls, spec in (m.get("classes") or {}).items():
            for g in spec.get("globs") or []:
                self.globs.append((cls, g, glob_to_regex(g)))
            for p in spec.get("content_patterns") or []:
                self.patterns.append((cls, p, re.compile(p.encode())))
        if not self.globs:
            raise ValueError("manifest names no protected paths: refusing to pass vacuously")
        self.allow = dict(m.get("allow") or {})
        self.max_bytes = int(m.get("content_scan_max_bytes") or 2_000_000)

    def path_hits(self, rel):
        return [{"kind": "path", "class": c, "rule": g, "path": rel}
                for c, g, rx in self.globs if rx.match(rel)]

    def content_hits(self, rel, data):
        if b"\0" in data[:8192]:
            return []
        return [{"kind": "content", "class": c, "rule": p, "path": rel}
                for c, p, rx in self.patterns if rx.search(data)]


def scan_tree(root, man):
    hits, n_files, n_scanned = [], 0, 0
    for d, dirs, files in os.walk(root):
        dirs[:] = sorted(x for x in dirs if x not in SKIP_DIRS)
        for f in sorted(files):
            full = os.path.join(d, f)
            rel = os.path.relpath(full, root).replace(os.sep, "/")
            n_files += 1
            if rel in man.allow:
                continue
            hits += man.path_hits(rel)
            try:
                if os.path.islink(full) or os.path.getsize(full) > man.max_bytes:
                    continue
                with open(full, "rb") as fh:
                    data = fh.read()
            except OSError:
                continue
            n_scanned += 1
            hits += man.content_hits(rel, data)
    return hits, n_files, n_scanned


def scan_git(repo, ref, man):
    """Every blob in `ref`'s tree, streamed through one `git cat-file --batch` (bounded memory)."""
    ls = subprocess.run(["git", "-C", repo, "ls-tree", "-r", "-z", "--full-tree", ref],
                        check=True, capture_output=True).stdout
    entries = []
    for rec in ls.split(b"\0"):
        if not rec:
            continue
        meta, path = rec.split(b"\t", 1)
        mode, typ, sha = meta.split()
        if typ == b"blob":
            entries.append((path.decode("utf-8", "surrogateescape"), sha.decode(), mode.decode()))
    hits, n_scanned = [], 0
    todo = []
    for rel, sha, mode in entries:
        if rel in man.allow:
            continue
        hits += man.path_hits(rel)
        if mode != "120000":
            todo.append((rel, sha))
    if man.patterns and todo:
        p = subprocess.Popen(["git", "-C", repo, "cat-file", "--batch"], stdin=subprocess.PIPE,
                             stdout=subprocess.PIPE)

        def feed():  # a writer thread keeps the pipe full; the reader holds one blob at a time
            try:
                for _rel, sha in todo:
                    p.stdin.write(sha.encode() + b"\n")
            finally:
                p.stdin.close()

        t = threading.Thread(target=feed, daemon=True)
        t.start()
        for rel, _sha in todo:
            header = p.stdout.readline().split()
            if len(header) < 3 or header[-1] == b"missing":
                continue
            size = int(header[2])
            if size > man.max_bytes:
                remaining = size + 1
                while remaining:
                    remaining -= len(p.stdout.read(min(remaining, 1 << 20)))
                continue
            data = p.stdout.read(size)
            p.stdout.read(1)
            n_scanned += 1
            hits += man.content_hits(rel, data)
        t.join()
        p.wait()
    return hits, len(entries), n_scanned


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--manifest", default=DEFAULT_MANIFEST)
    ap.add_argument("--tree")
    ap.add_argument("--git-ref")
    ap.add_argument("--repo", default=".")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args(argv)
    if bool(a.tree) == bool(a.git_ref):
        ap.error("exactly one of --tree DIR or --git-ref REF")
    try:
        man = Manifest(a.manifest)
    except (OSError, ValueError) as e:
        print(f"check_no_protected: manifest error: {e}", file=sys.stderr)
        return 2
    if a.tree:
        hits, n, scanned = scan_tree(a.tree, man)
        target = os.path.abspath(a.tree)
    else:
        hits, n, scanned = scan_git(a.repo, a.git_ref, man)
        rev = subprocess.run(["git", "-C", a.repo, "rev-parse", a.git_ref], capture_output=True, text=True)
        target = f"{a.git_ref} ({rev.stdout.strip()})"
    result = {"target": target, "manifest": os.path.relpath(man.path), "files": n,
              "content_scanned": scanned, "path_rules": len(man.globs), "content_rules": len(man.patterns),
              "allowlisted": len(man.allow), "hits": hits, "verdict": "FAIL" if hits else "PASS"}
    if a.json:
        print(json.dumps(result, indent=1))
    else:
        for h in hits:
            print(f"PROTECTED {h['kind']} [{h['class']}] {h['path']}  (rule: {h['rule']})")
        print(f"check_no_protected: {result['verdict']} - {n} files, {scanned} content-scanned, "
              f"{len(hits)} hit(s) in {target}")
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())
