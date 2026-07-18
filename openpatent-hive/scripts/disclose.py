#!/usr/bin/env python3
"""
disclose.py — OpenPatent.ai production disclosure CLI.

Single-entrypoint for the defensive-tier auto-patenting flow. Wraps
auto-disclose.py with a richer UX and explicit per-file / per-batch modes.

MODES
  single       Submit one file (default if a file path is given)
  batch        Walk vault and submit in groups of N
  watch        Continuously watch vault and submit new files

FLAGS
  --vault-dir PATH     Vault to scan (batch/watch modes)
  --file PATH          Single file to disclose (single mode)
  --tier TIER          starter|defensive|full|premium|enterprise
  --dry-run            Plan only, do not call API
  --watch              Watch mode (batch + poll)
  --batch              Use /v1/disclose/batch for batch mode
  --once               Single pass and exit
  --config PATH        Path to config.json
  --api-base URL       Override API_BASE
  --did DID            Override inventor_did
  --globs "*.md,*.py"  Override globs
  --batch-size N       Group size for batch mode
  --quiet              Summary only

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import pathlib
import sys
import time
import urllib.error
import urllib.request

SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets."


# ─────────── config + state (mirror auto-disclose.py for self-containment) ───────────
def load_config(path: pathlib.Path) -> dict:
    cfg: dict = {}
    if path.is_file():
        try:
            with path.open("r", encoding="utf-8") as f:
                cfg = json.load(f)
        except (OSError, json.JSONDecodeError):
            cfg = {}
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
    cfg.setdefault("FILE_GLOBS", ["*.md", "*.txt", "*.py", "*.json", "*.yaml", "*.yml"])
    cfg.setdefault("MAX_FILE_BYTES", 1_048_576)
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


def sha3_512(b: bytes) -> str:
    return hashlib.sha3_512(b).hexdigest()


def http_post(url: str, body: dict, timeout: float = 8.0) -> tuple[int, dict]:
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


def classification_for(path: pathlib.Path) -> str:
    return {
        ".py": "G06N20/00", ".js": "G06N20/00", ".ts": "G06N20/00",
        ".rs": "G06N20/00", ".go": "G06N20/00",
        ".md": "G06F40/00", ".txt": "G06F40/00",
        ".json": "G06F16/00", ".yaml": "G06F16/00", ".yml": "G06F16/00",
        ".sh": "G06F9/00", ".toml": "G06F16/00",
    }.get(path.suffix.lower(), "G06N99/00")


def title_for(path: pathlib.Path) -> str:
    return f"OpenPatent disclose: {path.name}"


# ─────────── single ───────────
def cmd_single(args, cfg) -> int:
    api_base = args.api_base or cfg["API_BASE"]
    tier = args.tier or cfg["TIER"]
    did = args.did or cfg.get("DID") or "did:key:z6MkDiscloseCliAnon"
    dry_run = bool(args.dry_run or cfg.get("DRY_RUN"))

    p = pathlib.Path(args.file).expanduser().resolve()
    if not p.is_file():
        print(f"file not found: {p}", file=sys.stderr)
        return 2
    if p.stat().st_size > int(cfg["MAX_FILE_BYTES"]):
        print(f"file too large ({p.stat().st_size} bytes): {p}", file=sys.stderr)
        return 2

    content = p.read_bytes()
    digest = sha3_512(content)
    if not args.quiet:
        print(f"disclosing: {p}")
        print(f"  size    : {len(content)} bytes")
        print(f"  sha3_512: {digest}")
        print(f"  tier    : {tier}")
        print(f"  dry_run : {dry_run}")

    body = {
        "title": title_for(p),
        "description": f"Disclosed via disclose.py — {p} — {len(content)} bytes.",
        "inventor_did": did,
        "document_base64": base64.b64encode(content).decode("ascii"),
        "document_format": "code" if p.suffix.lower() in (".py", ".js", ".ts", ".rs", ".go", ".sh") else "data",
        "classification": classification_for(p),
        "tier": tier,
        "request_bft_review": bool(cfg.get("REQUEST_BFT_REVIEW")),
    }

    if dry_run:
        print(f"[dry-run] would POST {api_base.rstrip('/')}/v1/disclosure")
        print(f"[dry-run] body keys: {sorted(body.keys())}")
        print(f"[dry-run] predicted document_hash: DRYRUN_{digest[:16]}")
        print(SIG)
        return 0

    try:
        code, resp = http_post(f"{api_base.rstrip('/')}/v1/disclosure", body)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        print(f"network error: {e}", file=sys.stderr)
        return 1

    if not (200 <= code < 300):
        print(f"HTTP {code}: {resp}", file=sys.stderr)
        return 1

    doc_hash = resp.get("document_hash", "?")
    status = resp.get("status", "DISCLOSED")
    print()
    print("─" * 60)
    print(f"  status        : {status}")
    print(f"  document_hash : {doc_hash}")
    print(f"  sha3_512      : {digest}")
    print(f"  tier          : {tier}")
    print(f"  attest_url    : {resp.get('attestation_url', 'n/a')}")
    print("─" * 60)
    print(SIG)
    return 0


# ─────────── batch (delegates to auto-disclose.py logic, inlined) ───────────
def state_path(vault: pathlib.Path) -> pathlib.Path:
    return vault / ".openpatent" / "state.json"


def load_state(p: pathlib.Path) -> dict:
    if not p.is_file():
        return {"version": 1, "files": {}, "batches": []}
    try:
        with p.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {"version": 1, "files": {}, "batches": []}
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


def discover_new(vault: pathlib.Path, cfg: dict, args, state: dict) -> list[tuple[pathlib.Path, str, str, bytes]]:
    import fnmatch
    globs = args.globs.split(",") if args.globs else cfg["FILE_GLOBS"]
    exclude = set(cfg.get("EXCLUDE_DIRS", [".git", "node_modules", "__pycache__", ".venv", "venv", "dist", "build", ".openpatent"]))
    max_bytes = int(cfg["MAX_FILE_BYTES"])
    files_record = state.setdefault("files", {})
    out: list[tuple[pathlib.Path, str, str, bytes]] = []
    for root, dirs, fnames in os.walk(vault):
        dirs[:] = [d for d in dirs if d not in exclude and not d.startswith(".")]
        for fn in fnames:
            if not any(fnmatch.fnmatch(fn, g) for g in globs):
                continue
            p = pathlib.Path(root) / fn
            try:
                if p.stat().st_size > max_bytes:
                    continue
            except OSError:
                continue
            rel = str(p.relative_to(vault)) if p.is_relative_to(vault) else str(p)
            try:
                content = p.read_bytes()
            except OSError:
                continue
            if not content:
                continue
            d = sha3_512(content)
            if files_record.get(rel, {}).get("sha3_512") == d:
                continue
            out.append((p, rel, d, content))
    return out


def submit_items(api_base: str, tier: str, did: str, items: list[tuple[pathlib.Path, bytes]], use_batch: bool) -> list[dict]:
    if use_batch:
        body = {
            "items": [
                {
                    "title": title_for(p),
                    "description": f"Disclosed via disclose.py — {p} — {len(content)} bytes.",
                    "inventor_did": did,
                    "document_base64": base64.b64encode(content).decode("ascii"),
                    "document_format": "code" if p.suffix.lower() in (".py", ".js", ".ts", ".rs", ".go", ".sh") else "data",
                    "classification": classification_for(p),
                    "tier": tier,
                    "request_bft_review": False,
                }
                for p, content in items
            ]
        }
        code, resp = http_post(f"{api_base.rstrip('/')}/v1/disclose/batch", body, timeout=20.0)
        if not (200 <= code < 300):
            return [{"status": "ERROR", "error": f"HTTP {code}: {resp}"} for _ in items]
        return resp.get("results", []) if isinstance(resp, dict) else []
    else:
        out: list[dict] = []
        for p, content in items:
            body = {
                "title": title_for(p),
                "description": f"Disclosed via disclose.py — {p} — {len(content)} bytes.",
                "inventor_did": did,
                "document_base64": base64.b64encode(content).decode("ascii"),
                "document_format": "code" if p.suffix.lower() in (".py", ".js", ".ts", ".rs", ".go", ".sh") else "data",
                "classification": classification_for(p),
                "tier": tier,
                "request_bft_review": False,
            }
            try:
                code, resp = http_post(f"{api_base.rstrip('/')}/v1/disclosure", body)
            except (urllib.error.URLError, TimeoutError, OSError) as e:
                out.append({"status": "ERROR", "error": str(e)})
                continue
            if 200 <= code < 300 and isinstance(resp, dict) and resp.get("document_hash"):
                out.append({"status": resp.get("status", "DISCLOSED"), "document_hash": resp["document_hash"]})
            else:
                out.append({"status": "ERROR", "error": f"HTTP {code}: {resp}"})
        return out


def cmd_batch(args, cfg) -> int:
    vault = pathlib.Path(args.vault_dir).expanduser().resolve()
    if not vault.is_dir():
        print(f"vault-dir not found: {vault}", file=sys.stderr)
        return 2
    api_base = args.api_base or cfg["API_BASE"]
    tier = args.tier or cfg["TIER"]
    did = args.did or cfg.get("DID") or "did:key:z6MkDiscloseCliAnon"
    dry_run = bool(args.dry_run or cfg.get("DRY_RUN"))
    batch_size = max(1, int(args.batch_size or cfg.get("BATCH_SIZE") or 10))
    use_batch = bool(args.batch)

    state = load_state(state_path(vault))
    if not args.quiet:
        print(f"disclose.py batch mode")
        print(f"  vault    : {vault}")
        print(f"  api_base : {api_base}")
        print(f"  tier     : {tier}")
        print(f"  batch    : {use_batch}  size={batch_size}")
        print(f"  dry_run  : {dry_run}")
        print(f"  watch    : {bool(args.watch)}")
        print()

    rows: list[dict] = []

    def _pass() -> dict:
        new = discover_new(vault, cfg, args, state)
        if dry_run:
            if not args.quiet:
                for _p, rel, d, _c in new:
                    print(f"  [dry-run] would disclose {rel}  →  DRYRUN_{d[:16]}")
            return {
                "scanned": sum(1 for _ in pathlib.Path(vault).rglob("*")),
                "submitted": 0,
                "skipped": 0,
                "failed": 0,
                "dry_run": True,
                "would_submit": len(new),
            }
        submitted = 0
        failed = 0
        skipped = 0
        files_record = state.setdefault("files", {})
        for start in range(0, len(new), batch_size):
            chunk = new[start:start + batch_size]
            results = submit_items(api_base, tier, did, [(p, c) for p, _r, _d, c in chunk], use_batch)
            for i, (p, rel, d, _c) in enumerate(chunk):
                r = results[i] if i < len(results) else {"status": "ERROR", "error": "no result"}
                if r.get("status") in ("DISCLOSED", "DEDUPED", "DUPLICATE") and r.get("document_hash"):
                    rec = {
                        "path": rel,
                        "sha3_512": d,
                        "document_hash": r["document_hash"],
                        "status": r.get("status", "DISCLOSED"),
                        "tier": tier,
                        "ts": int(time.time()),
                    }
                    files_record[rel] = rec
                    submitted += 1
                    if not args.quiet:
                        print(f"  ✓ {rel}  →  {rec['document_hash']}")
                else:
                    failed += 1
                    if not args.quiet:
                        print(f"  ✗ {rel}: {r.get('error', r.get('status', '?'))}", file=sys.stderr)
        if submitted:
            save_state(state_path(vault), state)
        return {
            "scanned": sum(1 for _ in pathlib.Path(vault).rglob("*")),
            "submitted": submitted,
            "skipped": skipped,
            "failed": failed,
            "dry_run": False,
        }

    if args.watch:
        interval = parse_interval(cfg["WATCH_INTERVAL"])
        if not args.quiet:
            print(f"  watching every {interval:.1f}s — Ctrl-C to stop")
        try:
            while True:
                rows.append(_pass())
                time.sleep(interval)
        except KeyboardInterrupt:
            pass
    else:
        rows.append(_pass())

    print()
    print("=" * 78)
    print(f"{'pass':>4}  {'scanned':>8}  {'submit':>7}  {'skip':>6}  {'fail':>5}  {'mode':>10}")
    print("-" * 78)
    for i, r in enumerate(rows, 1):
        mode = "dry-run" if r.get("dry_run") else "live"
        if r.get("dry_run") and "would_submit" in r:
            mode = f"dry({r['would_submit']})"
        print(
            f"{i:>4}  {r.get('scanned', 0):>8}  {r.get('submitted', 0):>7}  "
            f"{r.get('skipped', 0):>6}  {r.get('failed', 0):>5}  {mode:>10}"
        )
    print("=" * 78)
    print(SIG)
    real_failures = sum(r.get("failed", 0) for r in rows if not r.get("dry_run"))
    return 1 if real_failures > 0 else 0


# ─────────── main ───────────
def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="disclose",
        description="OpenPatent.ai production disclosure CLI — single, batch, and watch modes.",
    )
    ap.add_argument("--file", help="Single file to disclose (single mode)")
    ap.add_argument("--vault-dir", default=".", help="Vault to scan (batch/watch modes)")
    ap.add_argument("--tier", choices=["starter", "defensive", "full", "premium", "enterprise"], help="Pricing tier")
    ap.add_argument("--dry-run", action="store_true", help="Plan only, do not call API")
    ap.add_argument("--watch", action="store_true", help="Watch mode (batch + poll)")
    ap.add_argument("--batch", action="store_true", help="Use /v1/disclose/batch for batch mode")
    ap.add_argument("--once", action="store_true", help="Single pass and exit (default)")
    ap.add_argument("--config", default=None, help="Path to config.json")
    ap.add_argument("--api-base", default=None, help="Override API_BASE")
    ap.add_argument("--did", default=None, help="Override inventor_did")
    ap.add_argument("--globs", default=None, help='Comma-separated glob list, e.g. "*.md,*.py"')
    ap.add_argument("--batch-size", type=int, default=None, help="Override BATCH_SIZE")
    ap.add_argument("--quiet", action="store_true", help="Summary only")
    args = ap.parse_args(argv)

    cfg_path = pathlib.Path(args.config) if args.config else (
        pathlib.Path(args.vault_dir).expanduser().resolve() / ".openpatent" / "config.json"
    )
    cfg = load_config(cfg_path)
    if args.api_base:
        cfg["API_BASE"] = args.api_base
    if args.batch_size:
        cfg["BATCH_SIZE"] = args.batch_size

    if args.file:
        return cmd_single(args, cfg)
    return cmd_batch(args, cfg)


if __name__ == "__main__":
    sys.exit(main())
