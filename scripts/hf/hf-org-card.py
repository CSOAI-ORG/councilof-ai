#!/usr/bin/env python3
"""Derive the Hugging Face org card and the ONE living Space card from GET /api/gspc.

Nothing numeric is typed here. The lid is printed verbatim from totals.lid, the 22 axis rows
are read from the axis array, and the as_of is the moment this script fetched the board.
If the fetch fails the block says UNCHECKABLE and no table is written.

The block lives between  <!-- csoai-live-board --> … <!-- /csoai-live-board -->  and is replaced
idempotently; the 16-point  <!-- csoai-hubcard-v2 -->  block on every card is left alone.

    python3 scripts/hf/hf-org-card.py                 # derive, print, write to --out (dry)
    python3 scripts/hf/hf-org-card.py --push          # also `hf upload` the two READMEs
    python3 scripts/hf/hf-org-card.py --check         # score every csoai/* card on the 16-point rubric
    python3 scripts/hf/hf-org-card.py --dataset-board # regenerate the csoai/gspc-board dataset (parquet only)

Targets (the ONE living Space rule — no new Space is ever created here):
    spaces/csoai/README       the org page
    spaces/csoai/gspc-board   the living board
    datasets/csoai/gspc-board the board export (with --dataset-board)
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

API = "https://councilof.ai/api/gspc"
ORG = "csoai"
TARGETS = {"README": "space", "gspc-board": "space"}
BOARD_DATASET = f"{ORG}/gspc-board"
OPEN, CLOSE = "<!-- csoai-live-board -->", "<!-- /csoai-live-board -->"
HUB_OPEN = "<!-- csoai-hubcard-v2 -->"
LINKS = {
    "Live board (authority)": API,
    "Verify a card, free": "https://councilof.ai/gspc-verify",
    "Signed Merkle root": "https://councilof.ai/root.json",
    "DID document (did:web:csoai.org)": "https://csoai.org/.well-known/did.json",
    "How to verify by hand": "https://councilof.ai/signed/HOW-TO-VERIFY.md",
    "A2A agent card": "https://councilof.ai/.well-known/agent-card.json",
    "Methodology DOI": "https://doi.org/10.5281/zenodo.21991104",
}
STALE = [
    r"13 measured of 14", r"mint after final name", r"14-slot", r"14 slot",
    r"(?<!never print \")2410 measured", r"22·15·7(?![^\n]*never)",
]


def fetch_json(url: str, timeout: int = 30) -> tuple[dict | None, str]:
    req = urllib.request.Request(url, headers={"accept": "application/json", "user-agent": "csoai-hf-org-card/1"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r), ""
    except Exception as e:  # noqa: BLE001 — the reason is printed, never hidden
        return None, f"{type(e).__name__}: {e}"


# ── derivation ──────────────────────────────────────────────────────────────────────────

def leader_cell(a: dict) -> str:
    if a.get("leader"):
        return str(a["leader"])
    state = a.get("public_leader_state")
    if state == "EXCLUDED_OWN_MODEL":
        return "withheld — own model led"
    if state == "NO_SIGNED_CARD":
        return "withheld — no signed card"
    if a.get("kind") == "deterministic-facts":
        return "none by design (facts run)"
    return "—"


def derive(board: dict | None, reason: str, fetched_at: str) -> dict:
    if not board:
        return {"state": "UNCHECKABLE", "reason": reason, "as_of": fetched_at}
    totals = board.get("totals") or {}
    axes = board.get("axes") or []
    lid = totals.get("lid")
    if not lid or not axes:
        return {"state": "UNCHECKABLE", "reason": "no totals.lid or empty axis array", "as_of": fetched_at}
    measured = sum(1 for a in axes if a.get("status") == "MEASURED")
    rederived = f"{len(axes)} axis · {measured} measured"
    return {
        "state": "DERIVED",
        "as_of": fetched_at,
        "lid": lid,
        "public_count": totals.get("public_count"),
        "rederived": rederived,
        "agrees": rederived == totals.get("public_count"),
        "measured_on": (board.get("measured_on") or {}).get("date"),
        "gold_run": ((board.get("measured_on") or {}).get("living_stamp") or {}).get("gold_run"),
        "signer": (board.get("site_attestation") or {}).get("signer"),
        "axes": [
            {
                "axis": a.get("axis"), "family": a.get("family"), "kind": a.get("kind"),
                "status": a.get("status"), "n": a.get("n"), "separation": a.get("separation"),
                "leader": leader_cell(a), "dataset": a.get("dataset"),
            }
            for a in axes
        ],
    }


def render(d: dict) -> str:
    out = [OPEN, f"## Live board — derived {d['as_of']} from `GET {API}`", ""]
    if d["state"] != "DERIVED":
        out += [f"**UNCHECKABLE** — `GET {API}` did not answer as a board ({d['reason']}). No table is printed and no number is quoted.", ""]
    else:
        out += [f"**Lid:** {d['lid']}", ""]
        agree = "agrees" if d["agrees"] else "**DISAGREES — read the API, not this card**"
        out += [
            f"`totals.public_count` = **{d['public_count']}**; re-derived here from the axis array = {d['rederived']} ({agree}).",
            "",
            "| # | axis | family | kind | status | n | separation | leader | bank |",
            "|--:|---|---|---|---|--:|---|---|---|",
        ]
        for i, a in enumerate(d["axes"], 1):
            sep = a["separation"] or "n/a"
            bank = f"[{a['dataset']}](https://huggingface.co/datasets/{a['dataset']})" if a.get("dataset") else "—"
            out.append(f"| {i} | `{a['axis']}` | {a['family']} | {a['kind']} | {a['status']} | {a['n']} | {sep} | {a['leader']} | {bank} |")
        out += [
            "",
            f"as_of: fetched {d['as_of']} · measured_on: {d['measured_on']} · gold run: {d['gold_run']} · board signer: `{d['signer']}`",
            "",
            "A TIE is never a win. A withheld leader is a state, not a zero. Facts runs have no leader by design. Empty stays empty.",
        ]
    out += ["", "[![GSPC](https://councilof.ai/api/badge)](https://councilof.ai/gspc-verify) — live SVG, derived at request time.", "", "| | |", "|---|---|"]
    out += [f"| {k} | <{v}> |" for k, v in LINKS.items()]
    out += ["", "Measurement, not certification. Signed means Ed25519 under `did:web:csoai.org`; nothing here is a certificate, a rank for sale, or a conformity mark.", CLOSE]
    return "\n".join(out) + "\n"


def splice(readme: str, block: str) -> str:
    if OPEN in readme and CLOSE in readme:
        return re.sub(re.escape(OPEN) + r".*?" + re.escape(CLOSE) + r"\n?", block, readme, count=1, flags=re.S)
    if HUB_OPEN in readme:
        return readme.replace(HUB_OPEN, block + "\n" + HUB_OPEN, 1)
    return readme.rstrip("\n") + "\n\n" + block


# ── hub io (hf CLI for pushes, huggingface_hub for reads) ──────────────────────────────────

def hf_download(repo: str, kind: str, filename: str, dest: Path) -> Path:
    from huggingface_hub import hf_hub_download
    return Path(hf_hub_download(repo, filename, repo_type=kind, local_dir=dest))


def hf_upload(local: Path, repo: str, kind: str, path_in_repo: str, msg: str) -> None:
    cmd = ["hf", "upload", repo, str(local), path_in_repo, "--repo-type", kind, "--commit-message", msg]
    print("  $", " ".join(cmd))
    subprocess.run(cmd, check=True)


# ── the 16-point rubric (memory: csoai-hf-card-v2) ────────────────────────────────────────

def front_matter(text: str) -> dict:
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not m:
        return {}
    try:
        import yaml  # type: ignore
        return yaml.safe_load(m.group(1)) or {}
    except Exception:  # noqa: BLE001
        fm: dict = {}
        for line in m.group(1).splitlines():
            if ":" in line and not line.startswith((" ", "-")):
                k, v = line.split(":", 1)
                fm[k.strip()] = v.strip() or True
        return fm


def score_card(repo: str, kind: str, text: str, files: list[str], viewer_ok: bool | None) -> tuple[int, int, list[str]]:
    fm = front_matter(text)
    body = text.split("---", 2)[-1] if text.startswith("---") else text
    ds = kind == "dataset"
    checks: list[tuple[str, bool | None]] = [
        ("license", bool(fm.get("license"))),
        ("pretty_name/title", bool(fm.get("pretty_name") or fm.get("title"))),
        ("language", bool(fm.get("language")) if kind != "space" else None),
        ("tags>=6", isinstance(fm.get("tags"), list) and len(fm["tags"]) >= 6),
        ("task_categories", bool(fm.get("task_categories") or fm.get("pipeline_tag")) if kind != "space" else None),
        ("size_categories", bool(fm.get("size_categories")) if ds else None),
        ("configs+viewer", (bool(fm.get("configs")) and viewer_ok is True) if ds else None),
        ("manifest.*", any(f.startswith("manifest.") for f in files) if ds else None),
        ("live-GET citation", "councilof.ai/api/gspc" in body),
        ("lid", "TIE is TIE" in body),
        ("DOI", "10.5281/zenodo" in body),
        ("BibTeX", "@misc{" in body),
        ("verify+root", "gspc-verify" in body and "root.json" in body),
        ("org index link", "huggingface.co/csoai" in body),
        ("no stale strings", not any(re.search(p, body) for p in STALE)),
        ("body>1800", len(body) > 1800),
    ]
    applicable = [(n, ok) for n, ok in checks if ok is not None]
    passed = sum(1 for _, ok in applicable if ok)
    return passed, len(applicable), [n for n, ok in applicable if not ok]


def check(kinds: tuple[str, ...] = ("dataset", "model", "space")) -> int:
    from huggingface_hub import HfApi
    api = HfApi()
    tmp = Path(tempfile.mkdtemp(prefix="csoai-cards-"))
    bad = 0
    lister = {"dataset": api.list_datasets, "model": api.list_models, "space": api.list_spaces}
    for kind in kinds:
        for it in lister[kind](author=ORG):
            files = api.list_repo_files(it.id, repo_type=kind)
            if "README.md" not in files:
                print(f"{kind:7} {it.id:45} 0/16  no README"); bad += 1; continue
            text = hf_download(it.id, kind, "README.md", tmp / kind / it.id.split("/")[1]).read_text(encoding="utf-8")
            viewer = None
            if kind == "dataset":
                js, _ = fetch_json(f"https://datasets-server.huggingface.co/splits?dataset={it.id}")
                viewer = bool(js and js.get("splits"))
            p, n, fails = score_card(it.id, kind, text, files, viewer)
            pct = round(100 * p / n)
            mixed = {e for f in files for e in (".jsonl", ".parquet") if f.lower().endswith(e)}
            mix = " MIXED-FILES" if len(mixed) == 2 else ""
            flag = "" if pct == 100 and not fails else f"  FAIL: {', '.join(fails)}"
            print(f"{kind:7} {it.id:45} {pct:3}/100 ({p}/{n}){mix}{flag}")
            if pct < 100:
                bad += 1
    print(f"\ncards below 100/100: {bad}")
    return 1 if bad else 0


# ── the gspc-board dataset (parquet only; the viewer rule) ─────────────────────────────────

def dataset_board(d: dict, push: bool, out: Path) -> None:
    if d["state"] != "DERIVED":
        print("UNCHECKABLE — not touching the dataset"); return
    import pandas as pd
    rows = [{k: v for k, v in a.items()} for a in d["axes"]]
    out.mkdir(parents=True, exist_ok=True)
    df = pd.DataFrame(rows)
    df.to_parquet(out / "board.parquet", index=False)
    (out / "board.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    manifest = []
    for f in ("board.parquet", "board.jsonl"):
        b = (out / f).read_bytes()
        manifest.append({"file": f, "sha256": hashlib.sha256(b).hexdigest(), "bytes": len(b), "derived_from": API, "as_of": d["as_of"]})
    (out / "manifest.jsonl").write_text("".join(json.dumps(m) + "\n" for m in manifest), encoding="utf-8")
    fm = "\n".join([
        "---", "license: cc-by-4.0", "language:", "- en",
        "pretty_name: GSPC Board Export — derived from the live board, never typed",
        "tags:", *[f"- {t}" for t in ("gspc", "council-of-ai", "ai-governance", "eu-ai-act", "measurement", "attestation", "signed-evidence", "transparency", "responsible-ai", "evaluation")],
        "task_categories:", "- other", "size_categories:", "- n<1K",
        "configs:", "- config_name: default", "  data_files:", "  - split: board", "    path: board.parquet",
        "---", "",
    ])
    body = "\n".join([
        "# GSPC Board Export",
        "",
        "**Council of AI · CSOAI Ltd (UK Companies House 16939677).** This dataset is a *printer* of "
        f"`GET {API}`: every row is derived from the live axis array at the `as_of` below and nothing is typed. "
        "The viewer reads one format only (`board.parquet`); `board.jsonl` carries the same rows for readers without parquet. "
        "Older files in this repo (`board.json`, `board.parquet.json`, `gspc-board.jsonl`, `living-board.json`) are earlier "
        "exports kept as history — they are superseded by the live API, not edited, and must not be quoted as the board.",
        "",
        render(d),
        "## Files",
        "",
        "| file | what |", "|---|---|",
        "| `board.parquet` | the 22 derived rows — the only file the viewer reads |",
        "| `board.jsonl` | the same rows, one JSON object per line |",
        "| `manifest.jsonl` | sha256 + byte length of the derived files, with the as_of |",
        "| `axis-register.json`, `board-axes.json` | axis register and slot list, mirrored from the live API |",
        "| `board.json`, `board.parquet.json`, `gspc-board.jsonl`, `living-board.json` | earlier exports, history only |",
        "",
        HUB_OPEN,
        "## The live board is the authority",
        "",
        f"If `GET {API}` and this card ever disagree, the API is right and this card is stale. "
        "Verify a card free at <https://councilof.ai/gspc-verify>; the signed Merkle root is <https://councilof.ai/root.json>; "
        "every CSOAI repo is at <https://huggingface.co/csoai>; the methodology DOI is <https://doi.org/10.5281/zenodo.21991104>.",
        "",
        f"**Lid:** {d['lid']}",
        "",
        "## Citation", "", "```bibtex", "@misc{csoai_dataset_gspc_board,",
        "  title        = {GSPC Board Export — Council of AI / GSPC},", "  author       = {{CSOAI Ltd}},",
        "  year         = {2026},", "  doi          = {10.5281/zenodo.21991104},",
        "  howpublished = {Hugging Face Datasets, \\url{https://huggingface.co/datasets/csoai/gspc-board}},",
        f"  note         = {{Live board: {API}. Measurement, not certification.}}", "}", "```", "",
        "---", "",
        "**Measurement, not certification.** Issued by CSOAI Ltd (England & Wales, Companies House **16939677**), "
        f"3rd Floor, 86–90 Paul Street, London EC2A 4NE. Card derived {d['as_of']}.",
        "<!-- /csoai-hubcard-v2 -->", "",
    ])
    (out / "README.md").write_text(fm + body, encoding="utf-8")
    print(f"dataset files written to {out}")
    if push:
        for f in ("board.parquet", "board.jsonl", "manifest.jsonl", "README.md"):
            hf_upload(out / f, BOARD_DATASET, "dataset", f, f"derive {f} from GET /api/gspc at {d['as_of']}")


# ── main ──────────────────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--push", action="store_true", help="hf upload the derived READMEs")
    ap.add_argument("--check", action="store_true", help="score every csoai/* card on the 16-point rubric and exit non-zero if any is below 100")
    ap.add_argument("--dataset-board", action="store_true", help="regenerate datasets/csoai/gspc-board (parquet only)")
    ap.add_argument("--out", default=str(Path(tempfile.gettempdir()) / "csoai-hf-org-card"), help="where derived files are written")
    args = ap.parse_args()

    if args.check:
        return check()

    fetched_at = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    board, reason = fetch_json(API)
    d = derive(board, reason, fetched_at)
    block = render(d)
    print(block)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    for name, kind in TARGETS.items():
        repo = f"{ORG}/{name}"
        current = hf_download(repo, kind, "README.md", out / "current" / name).read_text(encoding="utf-8")
        new = splice(current, block)
        dest = out / name / "README.md"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(new, encoding="utf-8")
        changed = new != current
        print(f"{repo}: {'changed' if changed else 'unchanged'} -> {dest}")
        if args.push and changed:
            hf_upload(dest, repo, kind, "README.md", f"live board block derived from GET /api/gspc at {fetched_at}")

    if args.dataset_board:
        dataset_board(d, args.push, out / "dataset-gspc-board")
    return 0 if d["state"] == "DERIVED" else 2


if __name__ == "__main__":
    sys.exit(main())
