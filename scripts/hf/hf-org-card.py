#!/usr/bin/env python3
"""Derive the Hugging Face org card, the ONE living Space card, and any csoai/* dataset card
from GET /api/gspc and the repository's own file tree. Nothing numeric is typed here.

    python3 scripts/hf/hf-org-card.py                      # derive the live-board block, write to --out (dry)
    python3 scripts/hf/hf-org-card.py --push               # also `hf upload` the two Space READMEs
    python3 scripts/hf/hf-org-card.py --check              # score every csoai/* card on the 16-point rubric
    python3 scripts/hf/hf-org-card.py --check --public     # public repos only (what a stranger can see)
    python3 scripts/hf/hf-org-card.py --dataset-board      # regenerate datasets/csoai/gspc-board (parquet only)
    python3 scripts/hf/hf-org-card.py --hubcard csoai/x402-bazaar-census [...]   # refresh the 16-point block on a dataset

Two idempotent blocks, each replaced between its own markers and never appended twice:
    <!-- csoai-live-board --> … <!-- /csoai-live-board -->   the derived 22-axis table (Spaces + board datasets)
    <!-- csoai-hubcard-v2 --> … <!-- /csoai-hubcard-v2 -->   the 16-point rubric block (every card)

The ONE living Space rule: this script never creates a Space or a repo. The viewer rule: a
dataset's `configs:` name ONE file format; when there is nothing to view the card says
`viewer: false` instead of leaving the viewer to error.
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
MCP = "https://councilof.ai/mcp"
ORG = "csoai"
TARGETS = {"README": "space", "gspc-board": "space"}
BOARD_DATASET = f"{ORG}/gspc-board"
OPEN, CLOSE = "<!-- csoai-live-board -->", "<!-- /csoai-live-board -->"
HUB_OPEN, HUB_CLOSE = "<!-- csoai-hubcard-v2 -->", "<!-- /csoai-hubcard-v2 -->"
DOI = "10.5281/zenodo.21991104"
SNAPSHOT_DOI = "10.5281/zenodo.22293341"
LINKS = {
    "Live board (authority)": API,
    "Verify a card, free": "https://councilof.ai/gspc-verify",
    "Signed Merkle root": "https://councilof.ai/root.json",
    "DID document (did:web:csoai.org)": "https://csoai.org/.well-known/did.json",
    "How to verify by hand": "https://councilof.ai/signed/HOW-TO-VERIFY.md",
    "A2A agent card": "https://councilof.ai/.well-known/agent-card.json",
    "Methodology DOI": f"https://doi.org/{DOI}",
}
# A stale string counts only in a sentence with no negation: "never print 2410 measured" is a guardrail.
STALE = [r"13 measured of 14", r"mint after final name", r"14-slot", r"14 slot", r"2410 measured", r"22·15·7"]
NEGATION = re.compile(r"\b(never|not|no|nothing|superseded|retired|earlier|history|was|were|old|stale)\b", re.I)
FILLER_TAGS = ["council-of-ai", "measurement", "transparency", "ai-governance", "responsible-ai", "evaluation"]
DATA_EXT = (".parquet", ".jsonl", ".csv")


def fetch_json(url: str, timeout: int = 30, data: bytes | None = None, headers: dict | None = None) -> tuple[dict | None, str]:
    h = {"accept": "application/json", "user-agent": "csoai-hf-org-card/1"}
    h.update(headers or {})
    req = urllib.request.Request(url, headers=h, data=data, method="POST" if data else "GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.load(r), ""
    except Exception as e:  # noqa: BLE001 — the reason is printed, never hidden
        return None, f"{type(e).__name__}: {e}"


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


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


def splice(readme: str, block: str, open_: str = OPEN, close: str = CLOSE, before: str | None = HUB_OPEN) -> str:
    if open_ in readme and close in readme:
        return re.sub(re.escape(open_) + r".*?" + re.escape(close) + r"\n?", block, readme, count=1, flags=re.S)
    if before and before in readme:
        return readme.replace(before, block + "\n" + before, 1)
    return readme.rstrip("\n") + "\n\n" + block


# ── hub io (hf CLI for pushes, huggingface_hub for reads) ──────────────────────────────────

def hf_download(repo: str, kind: str, filename: str, dest: Path) -> Path:
    from huggingface_hub import hf_hub_download
    return Path(hf_hub_download(repo, filename, repo_type=kind, local_dir=dest))


def hf_upload(local: Path, repo: str, kind: str, path_in_repo: str, msg: str) -> None:
    cmd = ["hf", "upload", repo, str(local), path_in_repo, "--repo-type", kind, "--commit-message", msg]
    print("  $", " ".join(cmd))
    subprocess.run(cmd, check=True)


def mcp_tool_count() -> tuple[int | None, str]:
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}).encode()
    js, reason = fetch_json(MCP, data=body, headers={"content-type": "application/json", "accept": "application/json, text/event-stream"})
    tools = ((js or {}).get("result") or {}).get("tools")
    return (len(tools), "") if isinstance(tools, list) else (None, reason or "no result.tools")


# ── front matter ──────────────────────────────────────────────────────────────────────────

def split_front_matter(text: str) -> tuple[dict, str]:
    import yaml  # PyYAML
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.S)
    if not m:
        return {}, text
    return (yaml.safe_load(m.group(1)) or {}), text[m.end():]


def join_front_matter(fm: dict, body: str) -> str:
    import yaml
    return "---\n" + yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=1000).rstrip("\n") + "\n---\n\n" + body.lstrip("\n")


def size_category(rows: int) -> str:
    for cap, label in ((1_000, "n<1K"), (10_000, "1K<n<10K"), (100_000, "10K<n<100K"), (1_000_000, "100K<n<1M")):
        if rows < cap:
            return label
    return "1M<n<10M"


# ── the 16-point rubric (memory: csoai-hf-card-v2) ────────────────────────────────────────

def stale_hits(body: str) -> list[str]:
    hits = []
    for sentence in re.split(r"(?<=[.!?\n])\s+", body):
        for p in STALE:
            if re.search(p, sentence) and not NEGATION.search(sentence):
                hits.append(p)
    return hits


def score_card(kind: str, text: str, files: list[str], viewer_ok: bool | None) -> tuple[int, int, list[str]]:
    fm, body = split_front_matter(text)
    ds = kind == "dataset"
    viewer_pass = (fm.get("viewer") is False) or (bool(fm.get("configs")) and viewer_ok is True)
    checks: list[tuple[str, bool | None]] = [
        ("license", bool(fm.get("license"))),
        ("pretty_name/title", bool(fm.get("pretty_name") or fm.get("title"))),
        ("language", bool(fm.get("language")) if kind != "space" else None),
        ("tags>=6", isinstance(fm.get("tags"), list) and len(fm["tags"]) >= 6),
        ("task_categories", bool(fm.get("task_categories") or fm.get("pipeline_tag")) if kind != "space" else None),
        ("size_categories", bool(fm.get("size_categories")) if ds else None),
        ("configs+viewer", viewer_pass if ds else None),
        ("manifest.*", any(f.startswith("manifest.") for f in files) if ds else None),
        ("live-GET citation", "councilof.ai/api/gspc" in body),
        ("lid", "TIE is TIE" in body),
        ("DOI", DOI in body),
        ("BibTeX", "@misc{" in body),
        ("verify+root", "gspc-verify" in body and "root.json" in body),
        ("org index link", "huggingface.co/csoai" in body),
        ("no stale strings", not stale_hits(body)),
        ("body>1800", len(body) > 1800),
    ]
    applicable = [(n, ok) for n, ok in checks if ok is not None]
    passed = sum(1 for _, ok in applicable if ok)
    return passed, len(applicable), [n for n, ok in applicable if not ok]


def splits_ok(repo: str) -> bool | None:
    js, _ = fetch_json(f"https://datasets-server.huggingface.co/splits?dataset={repo}")
    if not js:
        return None
    if js.get("splits"):
        return True
    return None if "busier" in str(js.get("error", "")) else False


def check(public_only: bool, kinds: tuple[str, ...] = ("dataset", "model", "space")) -> int:
    from huggingface_hub import HfApi
    api = HfApi()
    tmp = Path(tempfile.mkdtemp(prefix="csoai-cards-"))
    bad = 0
    lister = {"dataset": api.list_datasets, "model": api.list_models, "space": api.list_spaces}
    for kind in kinds:
        for it in lister[kind](author=ORG):
            private = bool(getattr(it, "private", False))
            if public_only and private:
                continue
            files = api.list_repo_files(it.id, repo_type=kind)
            vis = "PRIV" if private else "pub "
            if "README.md" not in files:
                print(f"{kind:7} {vis} {it.id:45} 0/16  no README"); bad += 1; continue
            text = hf_download(it.id, kind, "README.md", tmp / kind / it.id.split("/")[1]).read_text(encoding="utf-8")
            viewer = splits_ok(it.id) if kind == "dataset" else None
            p, n, fails = score_card(kind, text, files, viewer)
            pct = round(100 * p / n)
            mixed = {e for f in files for e in (".jsonl", ".parquet") if f.lower().endswith(e)}
            mix = " MIXED-FILES" if len(mixed) == 2 else ""
            note = " (viewer state unknown: datasets-server busy)" if kind == "dataset" and viewer is None and "configs+viewer" in fails else ""
            flag = "" if pct == 100 else f"  FAIL: {', '.join(fails)}{note}"
            print(f"{kind:7} {vis} {it.id:45} {pct:3}/100 ({p}/{n}){mix}{flag}")
            if pct < 100:
                bad += 1
    print(f"\ncards below 100/100: {bad}")
    return 1 if bad else 0


# ── the hubcard-v2 block for any dataset ──────────────────────────────────────────────────

ONE_LINERS = {
    "csoai/gspc-board": "a derived export of the board — every row comes from the live GET at the as_of printed above; the board itself is the GET.",
    "csoai/gspc-bench-results": "a derived export of the per-axis board rows (`results.parquet`); the earlier 14-slot files are history, superseded by the live GET.",
    "csoai/gspc-leaderboard-results": "the results file behind the csoai/gspc-governance-leaderboard Space — submitted rows only, never a board cell.",
    "csoai/gspc-hf-model-census": "a census (the denominator) — every row is UNMEASURED by construction; it carries no axis score.",
}
GENERIC_ONE_LINER = "**NOT A BOARD MEASUREMENT** — this repository is a corpus, mirror or door published by CSOAI. It carries no axis score. The measured slots live on the board GET below."


def repo_tree(api, repo: str, kind: str) -> list[dict]:
    rows = []
    for t in api.list_repo_tree(repo, repo_type=kind, recursive=True):
        if getattr(t, "size", None) is None:
            continue
        lfs = getattr(t, "lfs", None)
        rows.append({
            "file": t.path,
            "bytes": t.size,
            "sha256": (lfs.get("sha256") if isinstance(lfs, dict) else getattr(lfs, "sha256", None)) if lfs else None,
            "blob_id": getattr(t, "blob_id", None),
            "url": f"https://huggingface.co/{'datasets/' if kind == 'dataset' else ''}{repo}/resolve/main/{t.path}",
        })
    return sorted(rows, key=lambda r: -r["bytes"])


def count_rows(api, repo: str, kind: str, path: str, dest: Path, max_bytes: int = 25_000_000) -> int | None:
    info = next((r for r in repo_tree(api, repo, kind) if r["file"] == path), None)
    if not info or info["bytes"] > max_bytes:
        return None
    p = hf_download(repo, kind, path, dest)
    if path.endswith(".jsonl"):
        return sum(1 for line in p.open(encoding="utf-8") if line.strip())
    if path.endswith(".parquet"):
        import pyarrow.parquet as pq
        return pq.ParquetFile(p).metadata.num_rows
    if path.endswith(".csv"):
        return max(0, sum(1 for _ in p.open(encoding="utf-8")) - 1)
    return None


def hubcard_block(repo: str, kind: str, d: dict, tree: list[dict], rows: dict[str, int], as_of: str) -> str:
    mcp_n, _ = mcp_tool_count()
    slug = repo.split("/")[1]
    title = None
    lines = [
        HUB_OPEN,
        "## The live board is the authority",
        "",
        "[![GSPC](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fcouncilof.ai%2Fapi%2Fgspc&query=%24.totals.public_count&label=GSPC%20board&color=0B1F33)](https://councilof.ai/api/gspc)",
        "[![verify](https://img.shields.io/badge/verify%20a%20card-free%2C%20no%20account-0B1F33)](https://councilof.ai/gspc-verify)",
        f"[![DOI](https://img.shields.io/badge/DOI-{DOI.replace('/', '%2F')}-0B1F33)](https://doi.org/{DOI})",
        "",
        f"`GET {API}` — quote `totals.public_count`. This Hub card is a **printer** of that GET, never a second",
        "engine. If the fetch fails the honest answer is `UNCHECKABLE` — never a fabricated `0.000`.",
        "Status words: `LOADING` / `UNREACHABLE` / `UNMEASURED` / `UNCHECKABLE`.",
        "",
        f"**Lid:** {d['lid']}" if d["state"] == "DERIVED" else f"**Lid:** UNCHECKABLE — `GET {API}` did not answer at {as_of}.",
        "",
        f"**This repository:** {ONE_LINERS.get(repo, GENERIC_ONE_LINER)}",
        "",
        "| | |", "|---|---|",
        f"| Live board (authority) | <{API}> |",
        "| Verify a card — free, no account | <https://councilof.ai/gspc-verify> |",
        "| How to verify, by hand | <https://councilof.ai/signed/HOW-TO-VERIFY.md> |",
        "| Transparency root (Merkle) | <https://councilof.ai/root.json> |",
        "| DID document | <https://csoai.org/.well-known/did.json> |",
        "| A2A agent card | <https://councilof.ai/.well-known/agent-card.json> |",
        "| Every CSOAI repo on the Hub | <https://huggingface.co/csoai> |",
        f"| Methodology DOI | <https://doi.org/{DOI}> |",
    ]
    if mcp_n is not None:
        lines.append(f"| MCP endpoint — {mcp_n} tools, verified {as_of} | `POST {MCP}` |")
    lines += [
        "| MCP Registry | `io.github.CSOAI-ORG/gspc` — version not pinned here; the registry is the authority |",
        "| npm — MCP server | [`csoai-gspc-mcp`](https://www.npmjs.com/package/csoai-gspc-mcp) — `npx -y csoai-gspc-mcp`. No version is pinned here: ask the registry for the current one rather than trusting a number written on a card. |",
        "| Python reader + card verifier | `pip install \"csoai-gspc[verify]\"` then `csoai-gspc check` — re-derives the board totals from the axis array and exits non-zero if they disagree |",
        f"| The board as a dated, citable snapshot | <https://doi.org/{SNAPSHOT_DOI}> |",
        "",
        "## What is in this repository",
        "",
        "| file | bytes | rows | what |", "|---|---:|---:|---|",
    ]
    for r in tree:
        f = r["file"]
        if f == ".gitattributes":
            continue
        what = ("card" if f == "README.md" else "data (Parquet)" if f.endswith(".parquet") else "data (one JSON object per line)" if f.endswith(".jsonl")
                else "data (CSV)" if f.endswith(".csv") else "JSON document" if f.endswith(".json") else "OpenTimestamps proof" if f.endswith(".ots") else "file")
        if f == "manifest.jsonl":
            what = f"derived at {as_of}"
        n = rows.get(f, "")
        lines.append(f"| `{f}` | {r['bytes']} | {n} | {what} |")
    lines += [
        "",
        f"`manifest.jsonl` is derived from this repository's own file tree at {as_of}; it lists every file with its",
        "size, its blob hash and a direct URL, so an agent can enumerate the repo without cloning it.",
        "",
        "## Citation",
        "",
        "```bibtex",
        f"@misc{{csoai_gspc_{slug.replace('-', '_')},",
        f"  title        = {{{title or slug} — Council of AI / GSPC}},",
        "  author       = {{CSOAI Ltd}},",
        "  year         = {2026},",
        f"  doi          = {{{DOI}}},",
        f"  howpublished = {{Hugging Face Hub, \\url{{https://huggingface.co/{'datasets/' if kind == 'dataset' else ''}{repo}}}}},",
        f"  note         = {{Live board: {API}. Measurement, not certification.}}",
        "}",
        "```",
        "",
        "---",
        "",
        "**Measurement, not certification.** Issued by CSOAI Ltd (England & Wales, Companies House **16939677**),",
        f"3rd Floor, 86–90 Paul Street, London EC2A 4NE. Card refreshed {as_of}.",
        HUB_CLOSE,
    ]
    return "\n".join(lines) + "\n"


REPLACE_BODY = {
    "csoai/gspc-bench-results": lambda d: "\n".join([
        "# GSPC Bench Results",
        "",
        f"Per-axis rows of the GSPC board, derived from `GET {API}` at {d['as_of']} into `results.parquet` — the only file the",
        "dataset viewer reads. The earlier files in this repository (`gspc-bench-results.jsonl`, `results.json`, `results.csv`,",
        "`living-board.json`, `eval.yaml`) are the August 2026 export from the retired 14-slot count; they are kept as history,",
        "superseded by the live GET, and must not be quoted as the board. A row here is a printout, never a second scoreboard.",
        "",
        render(d),
    ]),
    "csoai/gspc-leaderboard-results": lambda d: "\n".join([
        "# GSPC Governance Leaderboard Results",
        "",
        "The results file behind the [csoai/gspc-governance-leaderboard](https://huggingface.co/spaces/csoai/gspc-governance-leaderboard)",
        "Space. `results.jsonl` holds submitted rows — `subject, measured_axes, total_axes, as_of` — and nothing else. It is empty",
        "until a submission is merged, so the dataset viewer is switched off (`viewer: false`) rather than left to error on an",
        "empty file. `results.csv` and `eval.yaml` are the same schema and harness pointer from the August 2026 export, kept as history.",
        "",
        "## Submission flow (PR-based)",
        "",
        "1. Fork this dataset repository.",
        "2. Add one JSON object per line to `results.jsonl` with the subject's exact name and immutable revision.",
        "3. Open a pull request carrying the signed measurement card the row rests on.",
        "4. A row is merged only when its card verifies at <https://councilof.ai/gspc-verify>. A merged row is still not a board",
        f"   cell: the board is `GET {API}` and nothing here changes it.",
        "",
        f"**Lid at {d['as_of']}:** {d.get('lid', 'UNCHECKABLE')}",
        "",
    ]),
}


def hubcard(repo: str, d: dict, push: bool, out: Path, kind: str = "dataset") -> None:
    from huggingface_hub import HfApi
    api = HfApi()
    as_of = d["as_of"]
    dest = out / "hubcard" / repo.split("/")[1]
    dest.mkdir(parents=True, exist_ok=True)
    text = hf_download(repo, kind, "README.md", dest / "current").read_text(encoding="utf-8")
    fm, body = split_front_matter(text)
    uploads: list[tuple[Path, str]] = []

    # Derived data for the two stale exports: one parquet the viewer reads, derived from the live GET.
    if repo == "csoai/gspc-bench-results" and d["state"] == "DERIVED":
        import pandas as pd
        pd.DataFrame(d["axes"]).to_parquet(dest / "results.parquet", index=False)
        uploads.append((dest / "results.parquet", "results.parquet"))

    tree = repo_tree(api, repo, kind)
    have = {r["file"] for r in tree}
    if uploads:
        have |= {p for _, p in uploads}

    # Front matter — fill only what is absent; never overwrite an owner's choice.
    fm.setdefault("license", "cc-by-4.0")
    tags = list(fm.get("tags") or [])
    for t in FILLER_TAGS:
        if len(tags) >= 6:
            break
        if t not in tags:
            tags.append(t)
    fm["tags"] = tags
    rows: dict[str, int] = {}
    if kind == "space":
        # A Space card has a title, no viewer, no manifest: only the block and the tags apply.
        fm.setdefault("title", repo.split("/")[1])
        block = hubcard_block(repo, kind, d, tree, rows, as_of)
        new = join_front_matter(fm, splice(body, block, HUB_OPEN, HUB_CLOSE, before=None))
        (dest / "README.md").write_text(new, encoding="utf-8")
        p, n, fails = score_card(kind, new, sorted(have), None)
        print(f"{repo}: {round(100 * p / n)}/100 locally{'  FAIL: ' + ', '.join(fails) if fails else ''} -> {dest / 'README.md'}")
        if push:
            hf_upload(dest / "README.md", repo, kind, "README.md", f"card v2: derive the block from the repo tree and GET /api/gspc at {as_of}")
        return
    fm.setdefault("language", ["en"])
    fm.setdefault("pretty_name", repo.split("/")[1])
    fm.setdefault("task_categories", ["other"])
    fm.pop("dataset_info", None)  # a typed features/splits block is the stale-count carrier; the viewer infers from configs

    # Configs: ONE format. Prefer parquet; else the largest jsonl; else csv. Empty file -> viewer: false.
    if repo in REPLACE_BODY and repo == "csoai/gspc-leaderboard-results":
        fm.pop("configs", None)
        fm["viewer"] = False
    elif not fm.get("configs"):
        data_files = [r["file"] for r in tree if r["file"].endswith(DATA_EXT) and "/" not in r["file"]]
        if repo == "csoai/gspc-bench-results":
            data_files = ["results.parquet"]
        chosen = next((f for f in data_files if f.endswith(".parquet")), None) or next((f for f in data_files if f.endswith(".jsonl")), None) or next(iter(data_files), None)
        if chosen:
            fm["configs"] = [{"config_name": "default", "data_files": [{"split": "train", "path": chosen}]}]
    for cfg in fm.get("configs") or []:
        for df in cfg.get("data_files") or []:
            p = df.get("path")
            if isinstance(p, str) and "*" not in p and p in have:
                n = count_rows(api, repo, kind, p, dest / "rows") if p not in {u[1] for u in uploads} else len(d.get("axes") or [])
                if n is not None:
                    rows[p] = n
    if rows and "size_categories" not in fm:
        fm["size_categories"] = [size_category(max(rows.values()))]
    fm.setdefault("size_categories", ["n<1K"])

    # manifest.jsonl derived from the tree.
    manifest = [{k: v for k, v in r.items() if k != "url"} | {"url": r["url"], "as_of": as_of} for r in tree if r["file"] != "manifest.jsonl"]
    (dest / "manifest.jsonl").write_text("".join(json.dumps(m) + "\n" for m in manifest), encoding="utf-8")
    uploads.append((dest / "manifest.jsonl", "manifest.jsonl"))
    if "manifest.jsonl" not in have:
        tree.append({"file": "manifest.jsonl", "bytes": (dest / "manifest.jsonl").stat().st_size, "sha256": None, "blob_id": None, "url": ""})
    rows["manifest.jsonl"] = len(manifest)

    if repo in REPLACE_BODY:
        body = REPLACE_BODY[repo](d)
    block = hubcard_block(repo, kind, d, tree, rows, as_of)
    body = splice(body, block, HUB_OPEN, HUB_CLOSE, before=None)
    new = join_front_matter(fm, body)
    (dest / "README.md").write_text(new, encoding="utf-8")
    uploads.append((dest / "README.md", "README.md"))
    p, n, fails = score_card(kind, new, sorted(have | {"manifest.jsonl"}), True)
    print(f"{repo}: {round(100 * p / n)}/100 locally (viewer assumed; re-check /splits after push){'  FAIL: ' + ', '.join(fails) if fails else ''} -> {dest / 'README.md'}")
    if push:
        for local, path in uploads:
            hf_upload(local, repo, kind, path, f"card v2: derive {path} from the repo tree and GET /api/gspc at {as_of}")


# ── the gspc-board dataset (parquet only; the viewer rule) ─────────────────────────────────

def dataset_board(d: dict, push: bool, out: Path) -> None:
    if d["state"] != "DERIVED":
        print("UNCHECKABLE — not touching the dataset"); return
    import pandas as pd
    rows = [dict(a) for a in d["axes"]]
    out.mkdir(parents=True, exist_ok=True)
    pd.DataFrame(rows).to_parquet(out / "board.parquet", index=False)
    (out / "board.jsonl").write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows), encoding="utf-8")
    manifest = []
    for f in ("board.parquet", "board.jsonl"):
        b = (out / f).read_bytes()
        manifest.append({"file": f, "sha256": hashlib.sha256(b).hexdigest(), "bytes": len(b), "derived_from": API, "as_of": d["as_of"]})
    (out / "manifest.jsonl").write_text("".join(json.dumps(m) + "\n" for m in manifest), encoding="utf-8")
    fm = {
        "license": "cc-by-4.0", "language": ["en"],
        "pretty_name": "GSPC Board Export — derived from the live board, never typed",
        "tags": ["gspc", "council-of-ai", "ai-governance", "eu-ai-act", "measurement", "attestation", "signed-evidence", "transparency", "responsible-ai", "evaluation"],
        "task_categories": ["other"], "size_categories": ["n<1K"],
        "configs": [{"config_name": "default", "data_files": [{"split": "board", "path": "board.parquet"}]}],
    }
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
        f"every CSOAI repo is at <https://huggingface.co/csoai>; the methodology DOI is <https://doi.org/{DOI}>.",
        "",
        f"**Lid:** {d['lid']}",
        "",
        "## Citation", "", "```bibtex", "@misc{csoai_dataset_gspc_board,",
        "  title        = {GSPC Board Export — Council of AI / GSPC},", "  author       = {{CSOAI Ltd}},",
        f"  year         = {{2026}},", f"  doi          = {{{DOI}}},",
        "  howpublished = {Hugging Face Datasets, \\url{https://huggingface.co/datasets/csoai/gspc-board}},",
        f"  note         = {{Live board: {API}. Measurement, not certification.}}", "}", "```", "",
        "---", "",
        "**Measurement, not certification.** Issued by CSOAI Ltd (England & Wales, Companies House **16939677**), "
        f"3rd Floor, 86–90 Paul Street, London EC2A 4NE. Card derived {d['as_of']}.",
        HUB_CLOSE, "",
    ])
    (out / "README.md").write_text(join_front_matter(fm, body), encoding="utf-8")
    print(f"dataset files written to {out}")
    if push:
        for f in ("board.parquet", "board.jsonl", "manifest.jsonl", "README.md"):
            hf_upload(out / f, BOARD_DATASET, "dataset", f, f"derive {f} from GET /api/gspc at {d['as_of']}")


# ── main ──────────────────────────────────────────────────────────────────────────────────

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--push", action="store_true", help="hf upload what was derived")
    ap.add_argument("--check", action="store_true", help="score every csoai/* card on the 16-point rubric; exit 1 if any is below 100")
    ap.add_argument("--public", action="store_true", help="with --check: public repos only")
    ap.add_argument("--dataset-board", action="store_true", help="regenerate datasets/csoai/gspc-board (parquet only)")
    ap.add_argument("--hubcard", nargs="*", default=None, metavar="REPO", help="refresh the 16-point block (+ front matter, manifest) on these datasets")
    ap.add_argument("--space-hubcard", nargs="*", default=None, metavar="SPACE", help="refresh the 16-point block on these Spaces")
    ap.add_argument("--no-spaces", action="store_true", help="skip the two Space READMEs")
    ap.add_argument("--out", default=str(Path(tempfile.gettempdir()) / "csoai-hf-org-card"), help="where derived files are written")
    args = ap.parse_args()

    if args.check:
        return check(args.public)

    fetched_at = now_iso()
    board, reason = fetch_json(API)
    d = derive(board, reason, fetched_at)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    if not args.no_spaces:
        block = render(d)
        print(block)
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
    for repo in args.hubcard or []:
        hubcard(repo if "/" in repo else f"{ORG}/{repo}", d, args.push, out)
    for repo in args.space_hubcard or []:
        hubcard(repo if "/" in repo else f"{ORG}/{repo}", d, args.push, out, kind="space")
    return 0 if d["state"] == "DERIVED" else 2


if __name__ == "__main__":
    sys.exit(main())
