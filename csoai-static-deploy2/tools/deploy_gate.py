#!/usr/bin/env python3
"""tools/deploy_gate.py — phantom-page prevention gate.

Parses AGENTS.md claim log (CLAIM/RELEASED/EMERGENCY lines), extracts
filenames, verifies each exists on disk in deploy root.
Exit 0 = all gating claims resolve; 1 = phantom detected; 2 = log missing.
Emits a HMAC-SHA256 SIGIL receipt to /tmp/deploy-gate-sigil.jsonl.
Flags: --dry-run, --strict, --root DIR, --log PATH, --json, --verbose, --no-sigil.
Pure stdlib. CPython 3.9+.
"""
from __future__ import annotations
import argparse, hashlib, hmac, json, os, re, sys
from datetime import datetime, timezone
from pathlib import Path

# Hard-coded thresholds (mission requirement).
MAX_PHANTHOMS_FAIL = 0
MAX_CLAIMS_SCAN = 5000
SIGIL_KEY_SEED = b"csoai-defoneos-deploy-gate/v1::"
SIGIL_OUTPUT = "/tmp/deploy-gate-sigil.jsonl"
RESOLVE_EXTS = (".html", ".json", ".xml", ".md")
# Filename must be slug-shaped: defoneos-foo, defoneos-mod-foo, tick-NN-foo,
# sitemap, sitemap.xml. Uppercase "DEFONEOS" in prose must NOT match. Trailing
# dashes forbidden so "defoneos-mod-*" in prose does not match "defoneos-mod-".
FILENAME_RE = re.compile(
    r"\b(defoneos-mod-[a-z0-9][-a-z0-9]*[a-z0-9]"
    r"|defoneos-[a-z0-9][-a-z0-9]*[a-z0-9]"
    r"|tick-\d{1,3}(?:-[a-z0-9][-a-z0-9]*[a-z0-9])?"
    r"|sitemap(?:\.[a-z]+)?)(?!\.[a-z])",
    re.IGNORECASE,
)
CLAIM_KINDS = (
    ("EMERGENCY", re.compile(r"^\s*-\s*\[(?P<ts>[^\]]+?)\s+(?P<agent>[\w/]+)\]\s+EMERGENCY\b",  re.IGNORECASE)),
    ("RELEASED",  re.compile(r"^\s*-\s*\[(?P<ts>[^\]]+?)\s+(?P<agent>[\w/]+)\]\s+RELEASED\b",   re.IGNORECASE)),
    ("CLAIM",     re.compile(r"^\s*-\s*\[(?P<ts>[^\]]+?)\s+(?P<agent>[\w/]+)\]\s+CLAIM\b",      re.IGNORECASE)),
)


def _hmac_key() -> bytes:
    seed = SIGIL_KEY_SEED + os.uname().nodename.encode("utf-8", "replace")
    return hashlib.sha256(seed).digest()


def _prev_sigil_digest(p: Path) -> str:
    if not p.exists() or p.stat().st_size == 0:
        return "0" * 64
    try:
        with p.open("rb") as f:
            f.seek(0, os.SEEK_END); size = f.tell()
            if size == 0: return "0" * 64
            f.seek(max(0, size - 8192))
            tail = f.read().decode("utf-8", errors="replace")
        last = tail.strip().splitlines()[-1] if tail.strip() else ""
        return json.loads(last).get("digest", "0" * 64) if last else "0" * 64
    except (json.JSONDecodeError, OSError, IndexError):
        return "0" * 64


def _emit_sigil(payload: dict, sigil_path: Path, key: bytes) -> str:
    body = dict(payload)
    body["prev_digest"] = _prev_sigil_digest(sigil_path)
    body["ts"] = datetime.now(timezone.utc).isoformat()
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode("utf-8")
    digest = hashlib.sha256(canonical).hexdigest()
    body["digest"] = digest
    body["hmac_sha256"] = hmac.new(key, digest.encode("utf-8"), hashlib.sha256).hexdigest()
    sigil_path.parent.mkdir(parents=True, exist_ok=True)
    with sigil_path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(body, sort_keys=True, separators=(",", ":")) + "\n")
    return digest


def extract_claims(log_path: Path) -> list[dict]:
    """Walk AGENTS.md, return list of {ts, agent, kind, filenames}."""
    out: list[dict] = []
    if not log_path.exists():
        return out
    for raw in log_path.read_text(encoding="utf-8", errors="replace").splitlines():
        if len(out) >= MAX_CLAIMS_SCAN:
            break
        for kind, rx in CLAIM_KINDS:
            m = rx.match(raw)
            if not m:
                continue
            seen: set[str] = set()
            fnames: list[str] = []
            for full in FILENAME_RE.findall(raw):
                # The AGENTS.md log is inconsistent: some lines write the
                # bare slug (defoneos-mod-board-update), some write the
                # full filename (sitemap.xml, tick-71-sigil.json). We
                # accept both shapes — disk resolution handles missing
                # extensions via _resolve() in the gate step.
                name = full.lower()
                if name not in seen:
                    seen.add(name); fnames.append(name)
            if fnames:
                out.append({"ts": m.group("ts").strip(),
                            "agent": m.group("agent").strip(),
                            "kind": kind, "filenames": fnames})
            break
    return out


RESOLVE_EXTS = (".html", ".json", ".xml", ".md")


def _resolve(root: Path, name: str) -> Path | None:
    """Resolve a name against disk. If bare name not found, try common exts."""
    if (root / name).exists():
        return root / name
    if "." not in name:
        for ext in RESOLVE_EXTS:
            if (root / (name + ext)).exists():
                return root / (name + ext)
    return None


def gate(root: Path, claims: list[dict], strict: bool = False) -> dict:
    gating = [c for c in claims if strict or c["kind"] == "CLAIM"]
    phantoms: list[dict] = []; found: list[dict] = []; skipped: list[dict] = []
    for c in gating:
        for fn in c["filenames"]:
            entry = {"file": fn, "claim_ts": c["ts"], "agent": c["agent"], "kind": c["kind"]}
            tgt = _resolve(root, fn)
            if tgt is not None:
                entry["resolved_as"] = tgt.name
                entry["size"] = tgt.stat().st_size
                found.append(entry)
            else:
                phantoms.append(entry)
    if not strict:
        for c in claims:
            if c["kind"] in ("RELEASED", "EMERGENCY"):
                for fn in c["filenames"]:
                    if _resolve(root, fn) is None:
                        skipped.append({"file": fn, "claim_ts": c["ts"], "kind": c["kind"]})
    return {"root": str(root), "scanned_claims": len(claims),
            "gating_claims": len(gating), "found": found, "phantoms": phantoms,
            "skipped_non_gating": skipped,
            "phantom_count": len(phantoms), "found_count": len(found),
            "passed": not phantoms}


def render_text(r: dict, verbose: bool = False) -> str:
    L = ["=" * 72, "DEPLOY GATE — phantom-page prevention", "=" * 72,
         f"Deploy root        : {r['root']}",
         f"Scanned claim lines: {r['scanned_claims']}",
         f"Gating claims      : {r['gating_claims']}",
         f"Files FOUND on disk: {r['found_count']}",
         f"PHANTOMS (claimed, : {r['phantom_count']}  <-- gate condition",
         f"  missing on disk)",
         f"Skipped (RELEASED) : {len(r['skipped_non_gating'])}  (ignored in non-strict mode)",
         "-" * 72]
    if r["phantoms"]:
        L.append("PHANTOM FILES (must exist before deploy is allowed):")
        for p in r["phantoms"][:50]:
            L.append(f"  X {p['file']:<55s} claimed_by={p['agent']:<14s} @ {p['claim_ts']}")
        if len(r["phantoms"]) > 50:
            L.append(f"  ... and {len(r['phantoms']) - 50} more")
    else:
        L.append("OK: no phantoms detected — all gating claims resolve to files on disk.")
    if verbose and r["found"]:
        L += ["-" * 72, "FOUND (sample, first 25):"]
        for f in r["found"][:25]:
            L.append(f"  OK {f['file']:<55s} {f['size']:>8d} bytes  ({f['kind']})")
    L += ["=" * 72,
          "VERDICT: PASS — exit 0" if r["passed"]
          else f"VERDICT: FAIL — exit 1 ({r['phantom_count']} phantom(s))"]
    return "\n".join(L)


def main(argv: list[str] | None = None) -> int:
    here = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(prog="deploy_gate.py",
        description="Phantom-page prevention gate.")
    ap.add_argument("--root", type=Path, default=here.parent,
                    help=f"Deploy root (default: {here.parent})")
    ap.add_argument("--log", type=Path, default=None,
                    help="Claim log path (default: <root>/AGENTS.md)")
    ap.add_argument("--dry-run", action="store_true", help="Report only, no exit failure")
    ap.add_argument("--strict", action="store_true",
                    help="Fail on any phantom, incl. RELEASED reclassifications")
    ap.add_argument("--json", action="store_true", help="Emit report as JSON on stdout")
    ap.add_argument("--verbose", "-v", action="store_true",
                    help="Show every checked filename, not just phantoms")
    ap.add_argument("--no-sigil", action="store_true", help="Skip SIGIL emission (debug)")
    ap.add_argument("--hmac-key", default=None, help="Override HMAC key")
    ap.add_argument("--sigil-out", default=SIGIL_OUTPUT,
                    help=f"SIGIL output path (default: {SIGIL_OUTPUT})")
    args = ap.parse_args(argv)
    root = args.root.resolve()
    log_path = (args.log or root / "AGENTS.md").resolve()
    if not log_path.exists():
        sys.stderr.write(f"deploy_gate: claim log not found: {log_path}\n"); return 2
    if not root.is_dir():
        sys.stderr.write(f"deploy_gate: deploy root not a directory: {root}\n"); return 2
    claims = extract_claims(log_path)
    report = gate(root, claims, strict=args.strict)
    report["args"] = {"dry_run": args.dry_run, "strict": args.strict, "log": str(log_path)}
    sigil_digest = ""
    if not args.no_sigil:
        key = args.hmac_key.encode("utf-8") if args.hmac_key else _hmac_key()
        sigil_digest = _emit_sigil({
            "op": "GATE", "root": str(root), "log": str(log_path),
            "scanned_claims": report["scanned_claims"],
            "gating_claims": report["gating_claims"],
            "phantom_count": report["phantom_count"],
            "found_count": report["found_count"],
            "passed": report["passed"], "strict": args.strict,
            "dry_run": args.dry_run,
        }, Path(args.sigil_out), key)
        report["sigil"] = {"path": args.sigil_out, "digest": sigil_digest}
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print(render_text(report, verbose=args.verbose))
        if sigil_digest:
            print(f"SIGIL emitted -> {args.sigil_out}  digest={sigil_digest[:16]}...")
    if args.dry_run: return 0
    return 1 if report["phantom_count"] > MAX_PHANTHOMS_FAIL else 0


if __name__ == "__main__":
    raise SystemExit(main())
