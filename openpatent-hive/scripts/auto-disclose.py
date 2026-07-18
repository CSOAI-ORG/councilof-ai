#!/usr/bin/env python3
"""
auto-disclose.py — OpenPatent.ai defensive-tier auto-disclosure CLI.

Walks --vault-dir, finds .md/.txt/.py/.json/.yaml files NOT yet recorded in
.openpatent/state.json, and batch-submits them to POST /v1/disclosure (or
/v1/disclose/batch when batched) in groups of BATCH_SIZE. Updates state.json
on success. Idempotent — re-running on the same vault skips already-recorded
files.

FLAGS
  --vault-dir PATH     Directory to scan (default: .)
  --tier TIER          starter|defensive|full|premium|enterprise (default: defensive)
  --dry-run            Compute hashes, print plan, do NOT call the API
  --watch              Re-scan every WATCH_INTERVAL seconds (Ctrl-C to stop)
  --batch              Use /v1/disclose/batch instead of per-item /v1/disclosure
  --once               Single pass, then exit (default behavior; explicit flag)
  --config PATH        Path to config.json (default: .openpatent/config.json)
  --api-base URL       Override API_BASE
  --globs "*.md,*.py"  Override FILE_GLOBS (comma-separated)
  --batch-size N       Override BATCH_SIZE
  --quiet              Suppress per-file output, only show the summary table

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import base64
import fnmatch
import hashlib
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request
from typing import Iterable

SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets."

DEFAULT_GLOBS = ["*.md", "*.txt", "*.py", "*.json", "*.yaml", "*.yml"]
DEFAULT_EXCLUDE_DIRS = [".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".openpatent"]
DEFAULT_CLASSIFICATION_BY_EXT = {
    ".py": "G06N20/00", ".js": "G06N20/00", ".ts": "G06N20/00",
    ".rs": "G06N20/00", ".go": "G06N20/00",
    ".md": "G06F40/00", ".txt": "G06F40/00",
    ".json": "G06F16/00", ".yaml": "G06F16/00", ".yml": "G06F16/00",
    ".sh": "G06F9/00", ".toml": "G06F16/00",
}


# ───────────────────────────── config loading ─────────────────────────────
def load_config(path: pathlib.Path) -> dict:
    cfg: dict = {}
    if path.is_file():
        try:
            with path.open("r", encoding="utf-8") as f:
                cfg = json.load(f)
        except (OSError, json.JSONDecodeError):
            cfg = {}
    # Env overrides (highest priority for secrets / runtime).
    for k, envk in [
        ("API_BASE", "OPENPATENT_API_BASE"),
        ("TIER", "OPENPATENT_TIER"),
        ("DID", "OPENPATENT_DID"),
        ("HMAC_SECRET", "OPENPATENT_HMAC_SECRET"),
        ("BATCH_SIZE", "OPENPATENT_BATCH_SIZE"),
        ("DRY_RUN", "OPENPATENT_DRY_RUN"),
        ("WATCH_INTERVAL", "OPENPATENT_WATCH_INTERVAL"),
    ]:
        v = os.environ.get(envk)
        if v is not None:
            cfg[k] = v
    # Coerce BATCH_SIZE
    if isinstance(cfg.get("BATCH_SIZE"), str):
        try:
            cfg["BATCH_SIZE"] = int(cfg["BATCH_SIZE"])
        except ValueError:
            cfg["BATCH_SIZE"] = 10
    cfg.setdefault("API_BASE", "http://127.0.0.1:3211")
    cfg.setdefault("TIER", "defensive")
    cfg.setdefault("BATCH_SIZE", 10)
    cfg.setdefault("DRY_RUN", False)
    cfg.setdefault("WATCH_INTERVAL", "5s")
    cfg.setdefault("FILE_GLOBS", DEFAULT_GLOBS)
    cfg.setdefault("EXCLUDE_DIRS", DEFAULT_EXCLUDE_DIRS)
    cfg.setdefault("MAX_FILE_BYTES", 1_048_576)
    cfg.setdefault("CLASSIFICATION", "G06N99/00")
    cfg.setdefault("REQUEST_BFT_REVIEW", False)
    return cfg


def parse_interval(s: str) -> float:
    s = str(s).strip().lower()
    if s.endswith("ms"):
        return max(0.05, float(s[:-2]) / 1000.0)
    if s.endswith("s"):
        return max(0.05, float(s[:-1]))
    if s.endswith("m"):
        return max(0.05, float(s[:-1]) * 60.0)
    return max(0.05, float(s))


# ───────────────────────────── hashing ─────────────────────────────
def sha3_512(b: bytes) -> str:
    return hashlib.sha3_512(b).hexdigest()


# ───────────────────────────── state ─────────────────────────────
def state_path(vault_dir: pathlib.Path) -> pathlib.Path:
    return vault_dir / ".openpatent" / "state.json"


def load_state(p: pathlib.Path) -> dict:
    if not p.is_file():
        return {"version": 1, "files": {}, "batches": []}
    try:
        with p.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {"version": 1, "files": {}, "batches": []}
        data.setdefault("version", 1)
        data.setdefault("files", {})
        data.setdefault("batches", [])
        return data
    except (OSError, json.JSONDecodeError):
        return {"version": 1, "files": {}, "batches": []}


def save_state(p: pathlib.Path, state: dict) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    tmp = p.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(state, f, indent=2, sort_keys=True)
    os.replace(tmp, p)


# ───────────────────────────── vault walk ─────────────────────────────
def iter_candidates(vault: pathlib.Path, globs: list[str], exclude: list[str], max_bytes: int) -> Iterable[pathlib.Path]:
    excl = set(exclude)
    for root, dirs, files in os.walk(vault):
        # Prune excluded directories in-place so os.walk skips them.
        dirs[:] = [d for d in dirs if d not in excl and not d.startswith(".")]
        for fname in files:
            if any(fnmatch.fnmatch(fname, g) for g in globs):
                p = pathlib.Path(root) / fname
                try:
                    if p.stat().st_size > max_bytes:
                        continue
                except OSError:
                    continue
                yield p


# ───────────────────────────── HTTP ─────────────────────────────
def http_post(url: str, body: dict, timeout: float = 6.0) -> tuple[int, dict]:
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"}, method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        raw = r.read().decode("utf-8") or "{}"
        try:
            return r.status, json.loads(raw)
        except json.JSONDecodeError:
            return r.status, {"_raw": raw}


# ───────────────────────────── classification ─────────────────────────────
def classification_for(path: pathlib.Path, default: str) -> str:
    return DEFAULT_CLASSIFICATION_BY_EXT.get(path.suffix.lower(), default)


def title_for(path: pathlib.Path) -> str:
    rel = path.name
    return f"Auto-disclose: {rel}"


# ───────────────────────────── disclosure (single) ─────────────────────────────
def disclose_one(api_base: str, tier: str, did: str, path: pathlib.Path, content: bytes) -> tuple[str, str]:
    body = {
        "title": title_for(path),
        "description": f"Auto-disclosed by auto-disclose.py ({path}) — {len(content)} bytes.",
        "inventor_did": did,
        "document_base64": base64.b64encode(content).decode("ascii"),
        "document_format": "code" if path.suffix.lower() in (".py", ".js", ".ts", ".rs", ".go", ".sh") else "data",
        "classification": classification_for(path, "G06N99/00"),
        "tier": tier,
        "request_bft_review": False,
    }
    code, resp = http_post(f"{api_base.rstrip('/')}/v1/disclosure", body, timeout=8.0)
    if not (200 <= code < 300):
        raise RuntimeError(f"HTTP {code}: {resp}")
    doc_hash = resp.get("document_hash") if isinstance(resp, dict) else None
    if not doc_hash:
        raise RuntimeError(f"missing document_hash in response: {resp}")
    status = (resp.get("status") if isinstance(resp, dict) else None) or "DISCLOSED"
    return doc_hash, status


# ───────────────────────────── disclosure (batch) ─────────────────────────────
def disclose_batch(api_base: str, tier: str, did: str, items: list[tuple[pathlib.Path, bytes]]) -> list[dict]:
    body = {
        "items": [
            {
                "title": title_for(p),
                "description": f"Auto-disclosed by auto-disclose.py ({p}) — {len(content)} bytes.",
                "inventor_did": did,
                "document_base64": base64.b64encode(content).decode("ascii"),
                "document_format": "code" if p.suffix.lower() in (".py", ".js", ".ts", ".rs", ".go", ".sh") else "data",
                "classification": classification_for(p, "G06N99/00"),
                "tier": tier,
                "request_bft_review": False,
            }
            for p, content in items
        ]
    }
    code, resp = http_post(f"{api_base.rstrip('/')}/v1/disclose/batch", body, timeout=15.0)
    if not (200 <= code < 300):
        raise RuntimeError(f"HTTP {code}: {resp}")
    return resp.get("results", []) if isinstance(resp, dict) else []


# ───────────────────────────── one pass ─────────────────────────────
def one_pass(
    vault: pathlib.Path,
    cfg: dict,
    state: dict,
    args,
) -> dict:
    api_base = cfg["API_BASE"]
    tier = args.tier or cfg["TIER"]
    did = args.did or cfg.get("DID") or "did:key:z6MkAutoDiscloseAnonymous"
    batch_size = max(1, int(args.batch_size or cfg.get("BATCH_SIZE") or 10))
    dry_run = bool(args.dry_run or cfg.get("DRY_RUN"))
    use_batch = bool(args.batch)
    globs = args.globs.split(",") if args.globs else cfg["FILE_GLOBS"]
    exclude = cfg["EXCLUDE_DIRS"]
    max_bytes = int(cfg["MAX_FILE_BYTES"])
    sp = state_path(vault)
    files_record = state.setdefault("files", {})

    candidates = []
    skipped_existing = 0
    skipped_large = 0
    read_errors = 0
    seen_paths: set[str] = set()

    for p in iter_candidates(vault, globs, exclude, max_bytes):
        rel = str(p.relative_to(vault)) if p.is_relative_to(vault) else str(p)
        if rel in seen_paths:
            continue
        seen_paths.add(rel)
        try:
            content = p.read_bytes()
        except OSError:
            read_errors += 1
            continue
        if not content:
            continue
        digest = sha3_512(content)
        existing = files_record.get(rel)
        if existing and existing.get("sha3_512") == digest:
            skipped_existing += 1
            continue
        candidates.append((p, rel, digest, content))

    submitted = 0
    failed = 0
    new_records: list[dict] = []
    batch_records: list[dict] = []

    if not candidates:
        return {
            "scanned": len(seen_paths),
            "submitted": 0,
            "skipped": skipped_existing,
            "failed": 0,
            "read_errors": read_errors,
            "batches": 0,
            "dry_run": dry_run,
        }

    if dry_run:
        # No API calls. Just report what would happen.
        for p, rel, digest, _content in candidates:
            new_records.append({
                "path": rel,
                "sha3_512": digest,
                "document_hash": "DRYRUN_" + digest[:16],
                "status": "DRY_RUN",
                "tier": tier,
                "ts": int(time.time()),
            })
        if not args.quiet:
            for rec in new_records:
                print(f"  [dry-run] would disclose {rec['path']}  →  {rec['document_hash']}")
        return {
            "scanned": len(seen_paths),
            "submitted": 0,           # nothing actually submitted
            "skipped": skipped_existing,
            "failed": 0,
            "read_errors": read_errors,
            "batches": 0,
            "dry_run": True,
            "would_submit": len(new_records),
            "candidates": [r["path"] for r in new_records],
        }

    # Real API path.
    if use_batch:
        # Chunk in groups of batch_size.
        idx = 0
        for start in range(0, len(candidates), batch_size):
            chunk = candidates[start:start + batch_size]
            items = [(p, content) for p, _rel, _d, content in chunk]
            try:
                results = disclose_batch(api_base, tier, did, items)
            except Exception as e:
                failed += len(chunk)
                if not args.quiet:
                    print(f"  ✗ batch failed: {e}", file=sys.stderr)
                continue
            # Map results back by index.
            for i, (p, rel, digest, _c) in enumerate(chunk):
                r = results[i] if i < len(results) else {}
                if r.get("status") in ("DISCLOSED", "DEDUPED", "DUPLICATE") and r.get("document_hash"):
                    rec = {
                        "path": rel,
                        "sha3_512": digest,
                        "document_hash": r["document_hash"],
                        "status": r.get("status", "DISCLOSED"),
                        "tier": tier,
                        "ts": int(time.time()),
                    }
                    new_records.append(rec)
                    submitted += 1
                    if not args.quiet:
                        print(f"  ✓ {rel}  →  {rec['document_hash']}")
                else:
                    failed += 1
                    if not args.quiet:
                        print(f"  ✗ {rel}: {r.get('status', 'UNKNOWN')}")
            batch_records.append({
                "ts": int(time.time()),
                "size": len(chunk),
                "tier": tier,
            })
            idx += 1
    else:
        # Per-item calls, but chunked in groups of batch_size for parallelism of
        # bookkeeping (sequential network is fine — defensive tier is low rate).
        for p, rel, digest, content in candidates:
            try:
                doc_hash, status = disclose_one(api_base, tier, did, p, content)
                rec = {
                    "path": rel,
                    "sha3_512": digest,
                    "document_hash": doc_hash,
                    "status": status,
                    "tier": tier,
                    "ts": int(time.time()),
                }
                new_records.append(rec)
                submitted += 1
                if not args.quiet:
                    print(f"  ✓ {rel}  →  {doc_hash}")
            except Exception as e:
                failed += 1
                if not args.quiet:
                    print(f"  ✗ {rel}: {e}", file=sys.stderr)

    # Persist state.
    for rec in new_records:
        files_record[rec["path"]] = rec
    if batch_records:
        state.setdefault("batches", []).extend(batch_records)
    save_state(sp, state)

    return {
        "scanned": len(seen_paths),
        "submitted": submitted,
        "skipped": skipped_existing,
        "failed": failed,
        "read_errors": read_errors,
        "batches": len(batch_records),
        "dry_run": False,
    }


# ───────────────────────────── summary table ─────────────────────────────
def print_summary(rows: list[dict]) -> None:
    print()
    print("=" * 78)
    print(f"{'pass':>4}  {'scanned':>8}  {'submit':>7}  {'skip':>6}  {'fail':>5}  {'read-err':>8}  {'mode':>10}")
    print("-" * 78)
    for i, r in enumerate(rows, 1):
        mode = "dry-run" if r.get("dry_run") else "live"
        if r.get("dry_run") and "would_submit" in r:
            mode = f"dry({r['would_submit']})"
        print(
            f"{i:>4}  {r.get('scanned', 0):>8}  {r.get('submitted', 0):>7}  "
            f"{r.get('skipped', 0):>6}  {r.get('failed', 0):>5}  "
            f"{r.get('read_errors', 0):>8}  {mode:>10}"
        )
    print("=" * 78)
    total_sub = sum(r.get("submitted", 0) for r in rows)
    total_skip = sum(r.get("skipped", 0) for r in rows)
    total_fail = sum(r.get("failed", 0) for r in rows)
    print(f"  TOTAL: submitted={total_sub}  skipped={total_skip}  failed={total_fail}")
    print(SIG)


# ───────────────────────────── main ─────────────────────────────
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="auto-disclose",
        description="OpenPatent.ai auto-disclosure CLI — walk a vault, batch-submit to /v1/disclosure.",
    )
    ap.add_argument("--vault-dir", default=".", help="Directory to scan (default: .)")
    ap.add_argument("--tier", choices=["starter", "defensive", "full", "premium", "enterprise"], help="Pricing tier")
    ap.add_argument("--dry-run", action="store_true", help="Compute hashes, do NOT call the API")
    ap.add_argument("--watch", action="store_true", help="Re-scan every WATCH_INTERVAL seconds")
    ap.add_argument("--batch", action="store_true", help="Use POST /v1/disclose/batch instead of per-item")
    ap.add_argument("--once", action="store_true", help="Single pass and exit (default behavior)")
    ap.add_argument("--config", default=None, help="Path to config.json")
    ap.add_argument("--api-base", default=None, help="Override API_BASE")
    ap.add_argument("--did", default=None, help="Override inventor_did")
    ap.add_argument("--globs", default=None, help='Comma-separated glob list, e.g. "*.md,*.py"')
    ap.add_argument("--batch-size", type=int, default=None, help="Override BATCH_SIZE")
    ap.add_argument("--quiet", action="store_true", help="Only print the summary table")
    args = ap.parse_args(argv)

    vault = pathlib.Path(args.vault_dir).expanduser().resolve()
    if not vault.is_dir():
        print(f"vault-dir not found: {vault}", file=sys.stderr)
        return 2

    cfg_path = pathlib.Path(args.config) if args.config else (vault / ".openpatent" / "config.json")
    cfg = load_config(cfg_path)
    if args.api_base:
        cfg["API_BASE"] = args.api_base
    if args.batch_size:
        cfg["BATCH_SIZE"] = args.batch_size

    if not args.quiet:
        print(f"OpenPatent auto-disclose")
        print(f"  vault    : {vault}")
        print(f"  api_base : {cfg['API_BASE']}")
        print(f"  tier     : {args.tier or cfg['TIER']}")
        print(f"  batch    : {bool(args.batch)}  size={int(cfg['BATCH_SIZE'])}")
        print(f"  dry_run  : {bool(args.dry_run or cfg['DRY_RUN'])}")
        print(f"  watch    : {bool(args.watch)}")
        print()

    state = load_state(state_path(vault))
    rows: list[dict] = []

    def _run_once() -> dict:
        return one_pass(vault, cfg, state, args)

    if args.watch:
        interval = parse_interval(cfg["WATCH_INTERVAL"])
        if not args.quiet:
            print(f"  watching every {interval:.1f}s — Ctrl-C to stop")
        try:
            while True:
                rows.append(_run_once())
                time.sleep(interval)
        except KeyboardInterrupt:
            pass
    else:
        rows.append(_run_once())

    print_summary(rows)
    # Non-zero exit only if there were real failures (not skipped, not dry-run).
    real_failures = sum(r.get("failed", 0) for r in rows if not r.get("dry_run"))
    return 1 if real_failures > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
