#!/usr/bin/env python3
"""Land hub-queue-mill artifacts into the sign path's inbox — the consumer the mill lacked.

hub-queue-mill.yml stages UNSIGNED cards (harness/gspc-top100/mill_hub_queue.py) as a run
artifact and, until this script, nothing read them. This copies them to
public/interop/mill-cards-unsigned/ — the directory scripts/sign_mill_cards.py reads under
hf-fin-shells-measure.yml (target=mill; OIDC → /api/board-sign; the workflow filename is the
allowlist key). Before landing, each card must be honestly unsigned: signature null, status
UNMEASURED, id == sha256(canonical body), ≤3KB, brand-gate clean. A (model, axis) cell that
already carries a signed card is skipped — one cell, one card.

Never signs. Never stamps MEASURED. Never touches master (the workflow lands on a branch and
opens a PR; a human merge is the gate).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "harness" / "gspc-top100"))
from verify_card import canonical_body_bytes  # noqa: E402

INBOX = ROOT / "public" / "interop" / "mill-cards-unsigned"
SIGNED = ROOT / "public" / "interop" / "mill-cards-signed"
MAX_PAYLOAD_BYTES = 3072


def signed_cells(signed_dir: Path) -> dict[tuple[str, str], str]:
    """(model, axis) → signed filename for every card that carries a signature."""
    out: dict[tuple[str, str], str] = {}
    if not signed_dir.is_dir():
        return out
    for f in sorted(signed_dir.glob("signed-*.json")):
        try:
            w = json.loads(f.read_text(encoding="utf-8"))
        except Exception:
            continue
        b = w.get("body") if isinstance(w.get("body"), dict) else {}
        if w.get("signature") and b.get("model") and b.get("axis"):
            out[(str(b["model"]), str(b["axis"]))] = f.name
    return out


def reject_reason(wrap: dict) -> str | None:
    """None iff the wrap is an honest unsigned mill card."""
    body = wrap.get("body")
    if not isinstance(body, dict):
        return "no body"
    if wrap.get("signature"):
        return "carries a signature — the mill must stage unsigned"
    if str(body.get("status") or "").upper() != "UNMEASURED":
        return "status must be UNMEASURED before sign"
    if body.get("kind") != "gspc.measurement-card":
        return "kind is not gspc.measurement-card"
    if not body.get("model") or not body.get("axis"):
        return "no model/axis"
    n = body.get("n")
    if not isinstance(n, int) or n <= 0:
        return "n missing — empty is not a card"
    raw = canonical_body_bytes(body)
    if hashlib.sha256(raw).hexdigest() != wrap.get("id"):
        return "sha256(canonical body) != id"
    if len(raw) > MAX_PAYLOAD_BYTES:
        return f"HALT {len(raw)}B>3KB"
    if "SOVOS" in json.dumps(wrap).upper():
        return "brand-gate SOVOS"
    return None


def land(staged: Path, inbox: Path, signed_dir: Path) -> dict:
    files = sorted(staged.rglob("unsigned-*.json"))
    have = signed_cells(signed_dir)
    landed: list[dict] = []
    skipped: list[dict] = []
    for f in files:
        try:
            w = json.loads(f.read_text(encoding="utf-8"))
        except Exception as e:
            skipped.append({"file": f.name, "reason": f"json {type(e).__name__}"})
            continue
        why = reject_reason(w)
        if why:
            skipped.append({"file": f.name, "reason": why})
            continue
        b = w["body"]
        key = (str(b["model"]), str(b["axis"]))
        if key in have:
            skipped.append({"file": f.name, "reason": f"already-signed {have[key]}"})
            continue
        inbox.mkdir(parents=True, exist_ok=True)
        dest = inbox / f.name
        if dest.is_file():
            try:
                prev = json.loads(dest.read_text(encoding="utf-8"))
            except Exception:
                prev = {}
            if prev.get("id") == w.get("id"):
                skipped.append({"file": f.name, "reason": "already-landed same id"})
                continue
        shutil.copyfile(f, dest)
        landed.append(
            {
                "file": f.name,
                "model": key[0],
                "axis": key[1],
                "n": b["n"],
                "accuracy": b.get("accuracy"),
                "quotable": int(b["n"]) >= 30,
            }
        )
    return {
        "kind": "csoai.hub-queue-land/0.1",
        "staged_files": len(files),
        "landed": landed,
        "skipped": skipped,
        "axes": sorted({r["axis"] for r in landed}),
        "writes_board": False,
        "signed_here": False,
        "note": "Landed = copied to the OIDC sign inbox. Nothing is MEASURED until the signed card verifies VALID.",
    }


def pr_body(rep: dict, mill_report: dict | None, run_id: str) -> str:
    lines = [
        f"Lands **{len(rep['landed'])}** UNSIGNED mill cards from `hub-queue-mill` run `{run_id}` into "
        "`public/interop/mill-cards-unsigned/` (the inbox `scripts/sign_mill_cards.py` reads).",
        "",
        "Sign: `hf-fin-shells-measure.yml` (target=mill) was dispatched on this branch — OIDC → `/api/board-sign`, "
        "signed cards are pushed back here as `public/interop/mill-cards-signed/signed-*.json`.",
        "",
        "Nothing here is MEASURED. A hub-queue (id, axis) cell flips only after merge, and only if the signed card "
        "verifies VALID under the live DID with n≥30 (`hub-queue-flip.yml`). n<30 is unquotable. TIE is never a win.",
        "",
        "| model | axis | n | accuracy | quotable |",
        "|---|---|---:|---:|---|",
    ]
    for r in rep["landed"]:
        lines.append(f"| `{r['model']}` | {r['axis']} | {r['n']} | {r['accuracy']} | {'yes' if r['quotable'] else 'no (n<30)'} |")
    if rep["skipped"]:
        lines += ["", f"Skipped {len(rep['skipped'])}:"]
        for r in rep["skipped"]:
            lines.append(f"- `{r['file']}` — {r['reason']}")
    if mill_report:
        hist = Counter(str(s.get("reason", ""))[:80] for s in mill_report.get("skips", []))
        lines += [
            "",
            f"Mill run: queue_n={mill_report.get('queue_n')} picked={mill_report.get('picked')} "
            f"graded={mill_report.get('graded')} staged_unsigned={len(mill_report.get('staged_unsigned') or [])}",
            "",
            "Skip histogram:",
        ]
        for reason, n in hist.most_common():
            lines.append(f"- {n} × {reason}")
    lines += ["", "Opened by `hub-queue-land.yml`. Human merge is the only gate; this PR was opened with GITHUB_TOKEN so CI must be triggered by a push or `gh workflow run` if required."]
    return "\n".join(lines) + "\n"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--staged", required=True, help="downloaded hub-queue-mill artifact dir")
    ap.add_argument("--inbox", default=str(INBOX))
    ap.add_argument("--signed", default=str(SIGNED))
    ap.add_argument("--run-id", default="")
    ap.add_argument("--pr-body", default="", help="write the PR body markdown here")
    ap.add_argument("--github-output", default="", help="append landed=/axis= lines here")
    args = ap.parse_args()
    staged = Path(args.staged)
    rep = land(staged, Path(args.inbox), Path(args.signed))
    mill_report = None
    mr = next(iter(staged.rglob("mill-report.json")), None)
    if mr is not None:
        try:
            mill_report = json.loads(mr.read_text(encoding="utf-8"))
        except Exception:
            mill_report = None
    (staged / "land-report.json").write_text(json.dumps(rep, indent=2) + "\n", encoding="utf-8")
    if args.pr_body:
        Path(args.pr_body).write_text(pr_body(rep, mill_report, args.run_id), encoding="utf-8")
    axis = rep["axes"][0] if len(rep["axes"]) == 1 else ("multi" if rep["axes"] else "none")
    if args.github_output:
        with open(args.github_output, "a", encoding="utf-8") as fh:
            fh.write(f"landed={len(rep['landed'])}\naxis={axis}\n")
    print(json.dumps({"staged_files": rep["staged_files"], "landed": len(rep["landed"]), "skipped": len(rep["skipped"]), "axis": axis}))
    for s in rep["skipped"]:
        print("SKIP", s["file"], s["reason"])
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
