#!/usr/bin/env python3
"""CSOAI-ORG GitHub MCP wire census v2 (read-only, rate-limited, no clone).

Phases:
  1. tree listing per deep repo  -> gh api (API quota, cached on disk)
  2. file fetch                   -> raw.githubusercontent via curl (no API quota, cached)
  3. classify                     -> mcp_wire_audit signal/era/migration functions

Emits one JSONL record per MCP candidate repo.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

sys.path.insert(0, "/Users/nicholas/clawd")
import mcp_wire_audit as mwa  # noqa: E402

ORG = "CSOAI-ORG"
SCRATCH = "/Users/nicholas/.hermes/cache/scratch"
CACHE = f"{SCRATCH}/fetched"
OUT = "/Users/nicholas/clawd/MCP_WIRE_CENSUS_GITHUB_2026-10-07.jsonl"
API_BUDGET = 400
SLEEP = 0.2
NOW = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
CALLS = {"n": 0}

HTML_COMMENT = re.compile(r"<!--.*?-->", re.S)
# proofof.ai ownership annotation `mcp-name: io.github.CSOAI-ORG/<repo>` (also emitted
# outside HTML comments).  registry/internal/validators/registries/mcpname.go documents
# it as "the ownership token" - it is a registry line, NOT the 2026-07 Mcp-Name header.
OWNERSHIP_TOKEN = re.compile(
    r"mcp[-_]name\s*:\s*(?:<[^>]+>|(?:io\.github\.)?[A-Za-z0-9._-]+/[A-Za-z0-9._-]+)",
    re.I,
)
SOURCE_EXT = (".py", ".ts", ".js", ".mjs", ".go", ".rs", ".rb", ".php", ".java")
MANIFESTS = ("pyproject.toml", "package.json", "setup.py", "setup.cfg", "cargo.toml", "go.mod")


def gh_api(path: str, jq: str | None = None, retries: int = 2):
    if CALLS["n"] >= API_BUDGET:
        raise RuntimeError(f"API budget exhausted ({CALLS['n']})")
    cmd = ["gh", "api", path]
    if jq:
        cmd += ["--jq", jq]
    for attempt in range(retries + 1):
        CALLS["n"] += 1
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        out = (p.stdout or "").strip()
        err = (p.stderr or "").strip()
        if p.returncode == 0:
            time.sleep(SLEEP)
            return True, out
        low = (out + " " + err).lower()
        if "secondary rate limit" in low or "abuse-detection" in low or "429" in low:
            wait = 30 if attempt < retries else 60
            print(f"    [backoff {wait}s] {path[:70]}", flush=True)
            time.sleep(wait)
            continue
        time.sleep(SLEEP)
        if attempt == retries:
            return False, (err or out)[:300]
    return False, "retries exhausted"


STATUS = {"200": 0, "404": 0, "429": 0, "403": 0, "other": 0, "net": 0}


def curl(job: tuple) -> tuple:
    """Fetch one file from raw.githubusercontent (no API quota).

    -> (repo, path, text|None, http_status)
    """
    repo, branch, path = job
    url = f"https://raw.githubusercontent.com/{ORG}/{repo}/{branch}/{path}"
    try:
        p = subprocess.run(["curl", "-sS", "-f", "--max-time", "15", "-w", "\n%{http_code}", url],
                           capture_output=True, timeout=30)
        raw = p.stdout
        code = "net"
        if raw.rsplit(b"\n", 1)[-1].strip() in (b"200", b"404", b"429", b"403", b"000"):
            raw, code_b = raw.rsplit(b"\n", 1)
            code = code_b.decode()
        if code == "000":
            code = "net"
        data = raw[:1_048_576]
        if code != "200" or b"\x00" in data[:4096]:
            return repo, path, None, code
        return repo, path, data.decode("utf-8", errors="replace"), code
    except Exception:
        return repo, path, None, "net"


def pick_deep_files(paths: list[str]) -> list[str]:
    """Choose up to 4 era-informative files from a deep repo's tree."""
    scored: list[tuple[int, str]] = []
    for p in paths:
        base = os.path.basename(p).lower()
        depth = p.count("/")
        if base in MANIFESTS:
            scored.append((0 if depth == 0 else -2, p))
        elif re.fullmatch(
            r"(server|mcp_server|mcpserver|app|main|cli|__main__|index|sse|stdio|"
            r"http_server|fastmcp_server|tool|tools|core)\.(py|ts|js|mjs|go|rs|rb)", base):
            s = 10 - depth * 2
            if "mcp" in p.lower():
                s += 3
            if base in ("server.py", "server.ts", "server.js", "mcp_server.py"):
                s += 4
            elif base in ("index.ts", "index.js", "main.py", "app.py", "cli.py"):
                s += 1
            if "test" in p.lower() or "example" in p.lower() or "docs/" in p.lower():
                s -= 6
            scored.append((s, p))
    scored.sort(key=lambda t: (-t[0], t[1].count("/"), t[1]))
    manifests = [p for _, p in scored if os.path.basename(p).lower() in MANIFESTS]
    sources = [p for _, p in scored if p not in manifests]
    chosen: list[str] = []
    if manifests:
        chosen.append(manifests[0])
    chosen += sources[:2]
    for readme in ("README.md", "readme.md", "README.rst", "README"):
        if readme in paths:
            chosen.append(readme)
            break
    return chosen[:4]


def load_cached(repo: str) -> dict[str, str]:
    try:
        return json.load(open(f"{CACHE}/{repo}.json"))
    except Exception:
        return {}


def save_cached(repo: str, files: dict[str, str]) -> None:
    json.dump(files, open(f"{CACHE}/{repo}.json", "w"))


def fetch_jobs(jobs: list[tuple[str, str, str]], label: str) -> int:
    """Run raw fetches, merging hits into the per-repo cache."""
    hits = 0
    results = list(ThreadPoolExecutor(max_workers=10).map(curl, jobs))
    per_repo: dict[str, dict[str, str]] = {}
    codes: dict[str, int] = {}
    for repo, path, text, code in results:
        codes[code] = codes.get(code, 0) + 1
        if text is not None:
            per_repo.setdefault(repo, {})[path] = text
            hits += 1
    for repo, files in per_repo.items():
        merged = load_cached(repo)
        merged.update(files)
        save_cached(repo, merged)
    print(f"  {label}: {hits}/{len(jobs)} fetched  status={codes}", flush=True)
    if codes.get("429", 0) > 20 or codes.get("403", 0) > 20:
        print("  WARNING: raw fetch throttling detected", flush=True)
    return hits


def clean(text: str) -> str:
    """Drop evidence-poisoning noise before signal extraction.

    1. HTML comments: proofof.ai emits `<!-- mcp-name: OWNER/REPO -->` in every README.
    2. The bare `mcp-name: <canonical-id>` ownership token (same registry annotation,
       sometimes plain text).  Neither is the 2026-07 wire header.
    """
    return OWNERSHIP_TOKEN.sub(" ", HTML_COMMENT.sub(" ", text))


def classify_repo(repo_files: dict[str, str]) -> tuple[list[str], list[str], list[str]]:
    """-> (signals, evidence, files_read)"""
    sig: set[str] = set()
    evidence: list[str] = []
    read: list[str] = []
    for name in sorted(repo_files):
        read.append(name)
        found = mwa.file_signals(clean(repo_files[name]))
        if found:
            sig |= found
            evidence.append(name)
    return sorted(sig), evidence, read


def main() -> int:
    cands = json.load(open(f"{SCRATCH}/cands.json"))
    deep = cands[:150]
    shallow = cands[150:]
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(f"{SCRATCH}/trees", exist_ok=True)
    print(f"candidates={len(cands)} deep={len(deep)} shallow={len(shallow)}", flush=True)

    local_names: set[str] = set()
    try:
        for line in open("/Users/nicholas/clawd/MCP_WIRE_AUDIT_BASELINE_2026-10-07.jsonl"):
            rec = json.loads(line)
            local_names.add(rec["server"].lower())
            local_names.add(os.path.basename(rec["path"]).lower())
    except OSError:
        pass

    # ---- phase 1: trees for the deep set (cached; costs API quota) ----------
    trees: dict[str, list[str]] = {}
    unreadable: set[str] = set()
    pending = []
    for r in deep:
        cache = f"{SCRATCH}/trees/{r['name']}.json"
        if os.path.exists(cache):
            try:
                trees[r["name"]] = json.load(open(cache))
                continue
            except Exception:
                pass
        pending.append(r)
    print(f"trees: cached={len(deep) - len(pending)} fetch={len(pending)}", flush=True)
    for i, r in enumerate(pending):
        ok, out = gh_api(f"repos/{ORG}/{r['name']}/git/trees/HEAD?recursive=1",
                         jq='{t:.truncated, p:[.tree[]|select(.type=="blob")|.path]}')
        if not ok:
            unreadable.add(r["name"])
            print(f"  tree FAILED {r['name']}: {out[:70]}", flush=True)
            continue
        try:
            payload = json.loads(out)
            trees[r["name"]] = payload["p"]
            json.dump(payload["p"], open(f"{SCRATCH}/trees/{r['name']}.json", "w"))
        except Exception:
            unreadable.add(r["name"])
        if (i + 1) % 50 == 0:
            print(f"  trees {i+1}/{len(pending)} api_calls={CALLS['n']}", flush=True)

    # ---- phase 2a: deep-set file fetch (no API quota) ------------------------
    deep_jobs = []
    for r in deep:
        if r["name"] in unreadable:
            continue
        cached = load_cached(r["name"])
        for p in pick_deep_files(trees.get(r["name"], [])):
            if p not in cached:
                deep_jobs.append((r["name"], r["branch"], p))
    if deep_jobs:
        fetch_jobs(deep_jobs, "deep fetch")

    # ---- phase 2b: shallow-set probe (guess common entry paths, no quota) ----
    probe_paths = ["README.md", "pyproject.toml", "package.json", "setup.py",
                   "server.py", "mcp_server.py", "main.py", "app.py",
                   "index.ts", "src/server.py", "src/index.ts"]
    probe_jobs = []
    for r in shallow:
        cached = load_cached(r["name"])
        for p in probe_paths:
            if p not in cached:
                probe_jobs.append((r["name"], r["branch"], p))
    if probe_jobs:
        fetch_jobs(probe_jobs, "shallow probe A")

    # second pass for repos that still hold no manifest and no source file
    need_b = []
    for r in shallow:
        cached = load_cached(r["name"])
        has_src = any(os.path.basename(p) in MANIFESTS or p.endswith(SOURCE_EXT)
                      for p in cached)
        if not has_src:
            need_b.append(r)
    guess = ["src/{n}/{n}.py", "src/{n}.py", "src/{n}/server.py", "{n}/server.py",
             "src/{n}/main.py", "cli.py", "index.js"]
    b_jobs = []
    for r in need_b:
        cached = load_cached(r["name"])
        for tmpl in guess:
            p = tmpl.format(n=r["name"])
            if p not in cached:
                b_jobs.append((r["name"], r["branch"], p))
    if b_jobs:
        fetch_jobs(b_jobs, f"shallow probe B ({len(need_b)} repos)")

    # ---- phase 3: classify --------------------------------------------------
    deep_names = {r["name"] for r in deep}
    records = []
    for r in cands:
        name = r["name"]
        files = load_cached(name)
        sig, evidence, read = classify_repo(files)
        era, migration = mwa.classify(sig)
        depth = "deep" if name in deep_names else "shallow"
        if era is None:
            if name in unreadable:
                era, migration = "unreadable", "n/a"
            elif not read:
                era, migration = "unreadable", "n/a"
            else:
                era, migration = "not-mcp", "n/a"
        source_ev = [e for e in evidence if not e.lower().startswith("readme")]
        records.append({
            "repo": name,
            "era": era,
            "signals": sig,
            "migration": migration,
            "checked_at": NOW,
            "depth": depth,
            "fork": r["fork"],
            "updated": r["updated"],
            "evidence": evidence,
            "files_read": len(read),
            "evidence_kind": "source" if source_ev else ("docs" if evidence else "none"),
            "local_baseline": name.lower() in local_names,
        })

    with open(OUT, "w", encoding="utf-8") as fh:
        for rec in sorted(records, key=lambda x: x["repo"]):
            fh.write(json.dumps(rec, sort_keys=True) + "\n")

    meta = {
        "total_repos": 754, "candidates": len(cands), "deep": len(deep),
        "shallow": len(shallow), "api_calls_this_run": CALLS["n"],
        "trees_unreadable": sorted(unreadable), "checked_at": NOW,
    }
    json.dump(meta, open(f"{SCRATCH}/census_meta.json", "w"), indent=1)
    print(json.dumps(meta, indent=1))
    print("wrote", OUT, len(records), "records")
    return 0


if __name__ == "__main__":
    sys.exit(main())
