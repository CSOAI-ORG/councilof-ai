#!/usr/bin/env python3
"""g2_gate.py — Measure's G2 pre-sign gate for autoeat.* items (ruling 2026-10-16).

DRY-RUN ONLY by default. This script never signs, never calls board-sign, and
never writes card_index.json or any signed manifest/card. It decides which
autoeat.* items WOULD be eligible to sign and writes:
  * an explicit, capped id list (one id per line) for the signer — never a glob
  * an UNSIGNED reject manifest with a reason per rejected item
  * a human-readable dry-run report

G2 (every check must pass; any missing field is a FAIL — fail closed):
  1. n_valid >= 30
  2. (unparsed + truncated) / n_total <= 10%
  3. transport_errors / n_total <= 5%
  4. score is neither 0% nor 100%
  5. run of record: no duplicate_of, not stitched, serial, temperature 0, seed 0
  6. not hit by the hold rule (scripts/runpod_gspc_held_cells.json)
  7. not a det (deterministic) cell

Enabling any signing from this list is Nick's call after Measure reviews a dry run.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
COMPACT = ROOT / "public" / "interop" / "auto-eat" / "cards-compact.json"
HELD = ROOT / "scripts" / "runpod_gspc_held_cells.json"
DEFAULT_CAP = 25
FORBIDDEN_NAMES = {"card_index.json"}


def _num(d, *keys):
    for k in keys:
        v = d.get(k)
        if isinstance(v, (int, float)) and not isinstance(v, bool):
            return v
    return None


def _strip_model(m: str) -> str:
    m = (m or "").removeprefix("ollama:")
    return m.split("@sha256:")[0]


def load_held() -> list[dict]:
    try:
        return json.loads(HELD.read_text(encoding="utf-8")).get("cells", [])
    except (OSError, ValueError):
        return []


def held_hit(p: dict, held: list[dict]) -> str | None:
    model = _strip_model(str(p.get("model", "")))
    axis = p.get("axis")
    digest = str(p.get("model", "")).split("@sha256:")[1] if "@sha256:" in str(p.get("model", "")) else None
    for c in held:
        if c.get("model") == model and c.get("axis") == axis and c.get("digest") in ("any", digest):
            return c.get("reason", "HELD")
    return None


def g2_reasons(item_id: str, p: dict, held: list[dict]) -> list[str]:
    if not isinstance(p, dict):
        return ["payload is not an object"]
    r: list[str] = []
    m = p.get("measurement") if isinstance(p.get("measurement"), dict) else p
    if p.get("det") is True or p.get("cell_type") == "det" or str(p.get("axis", "")).startswith("det") or ".det." in item_id:
        r.append("det cell (excluded)")
    n_valid = _num(m, "n_valid")
    n_total = _num(m, "n_total", "n")
    if n_valid is None:
        r.append("no n_valid (not a measured run)")
    elif n_valid < 30:
        r.append(f"n_valid={n_valid} < 30")
    unp, trunc, terr = _num(m, "unparsed"), _num(m, "truncated"), _num(m, "transport_errors", "n_transport_error")
    if not n_total:
        r.append("no n_total (rates uncomputable)")
    else:
        if unp is None or trunc is None:
            r.append("no unparsed/truncated counts")
        elif (unp + trunc) / n_total > 0.10:
            r.append(f"unparsed+truncated={(unp + trunc) / n_total:.1%} > 10%")
        if terr is None:
            r.append("no transport_errors count")
        elif terr / n_total > 0.05:
            r.append(f"transport_errors={terr / n_total:.1%} > 5%")
    score = _num(m, "score", "pass_rate")
    if score is None:
        r.append("no score")
    elif score in (0, 1) or score in (0.0, 100.0):
        r.append(f"score={score} is 0% or 100%")
    rr = p.get("run") if isinstance(p.get("run"), dict) else p
    if p.get("duplicate_of") or rr.get("duplicate_of"):
        r.append("duplicate_of set (re-run, not run of record)")
    if rr.get("stitched") or rr.get("stitched_from"):
        r.append("stitched run")
    if rr.get("serial") is not True:
        r.append("not proven serial")
    if rr.get("temperature") != 0:
        r.append("temperature not proven 0")
    if rr.get("seed") != 0:
        r.append("seed not proven 0")
    if rr.get("run_of_record") is not True:
        r.append("not marked run_of_record")
    h = held_hit(p, held)
    if h:
        r.append(f"hold rule: {h}")
    return r


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--report", required=True)
    ap.add_argument("--cap", type=int, default=DEFAULT_CAP)
    ap.add_argument("--dry-run", action="store_true", default=True)
    args = ap.parse_args()
    out = Path(args.out_dir).resolve()
    for f in (out, Path(args.report).resolve()):
        if f.name in FORBIDDEN_NAMES or "signed" in f.parts:
            print(f"g2: REFUSE to write under {f}", file=sys.stderr)
            return 2
    out.mkdir(parents=True, exist_ok=True)
    compact = json.loads(COMPACT.read_text(encoding="utf-8"))
    held = load_held()
    passed, rejects = [], []
    for item_id, p in sorted(compact.items()):
        if not item_id.startswith("autoeat."):
            continue
        reasons = g2_reasons(item_id, p, held)
        (rejects.append({"id": item_id, "reasons": reasons}) if reasons else passed.append(item_id))
    would_sign = passed[: args.cap]
    over_cap = passed[args.cap:]
    for i in over_cap:
        rejects.append({"id": i, "reasons": [f"over cap {args.cap} (defer to next batch)"]})
    (out / "would-sign-ids.txt").write_text("".join(i + "\n" for i in would_sign), encoding="utf-8")
    manifest = {"schema": "csoai.autoeat-g2-rejects/0.1", "signed": False, "sig_ed25519": None,
                "dry_run": True, "cap": args.cap, "n_items": len(passed) + len(rejects) - len(over_cap),
                "n_would_sign": len(would_sign), "n_reject": len(rejects), "rejects": rejects}
    (out / "rejects-unsigned.json").write_text(json.dumps(manifest, indent=1) + "\n", encoding="utf-8")
    from collections import Counter
    rc = Counter(x for j in rejects for x in j["reasons"])
    lines = ["# auto-eat G2 gate — DRY RUN", "", "Nothing signed. allowedWf unchanged. Cron still commented.", "",
             f"- autoeat.* items evaluated: {manifest['n_items']}", f"- would-sign (cap {args.cap}): {len(would_sign)}",
             f"- would-reject: {len(rejects)}", "", "## Would-sign", ""]
    lines += [f"- {i}" for i in would_sign] or ["- (none)"]
    lines += ["", "## Reject reasons (count of items)", ""] + [f"- {n} x {k}" for k, n in rc.most_common()]
    lines += ["", "## Would-reject (id: reasons)", ""] + [f"- {j['id']}: {'; '.join(j['reasons'])}" for j in rejects]
    Path(args.report).write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"g2 dry-run: items={manifest['n_items']} would_sign={len(would_sign)} would_reject={len(rejects)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
