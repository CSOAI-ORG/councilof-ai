#!/usr/bin/env python3
"""Link every bank card on the Hub to the ONE live board row it stands behind.

    python3 scripts/hf/hf_live_row.py --dry            # print what would change, upload nothing
    python3 scripts/hf/hf_live_row.py --push           # upload README.md where the block is missing
    python3 scripts/hf/hf_live_row.py --push --ledger out.json

The axis→repo map is the live board (GET /api/gspc → axes[].dataset), never typed here. The block
is scripts/hf/hf-org-card.py::live_row_block — imported, not copied — so a producer run and this
script land byte-identical bytes under the same markers and neither appends twice.

One more edit rides along, and only on cards that carry it: the hand-pasted TUI7 block typed the
board pair as "(22·22·0 derived, never typed as a frozen paste)" — a typed count that claimed to
be derived. The number is dropped; the sentence keeps its instruction. No new number is written.

The token is resolved on the pod (csoai_keys.py --key HF_TOKEN) and passed via HF_TOKEN; it is
never printed. Every card is read back anonymously after upload and the ledger records what the
public sees, not what was sent.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
import time
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("hf_org_card", HERE / "hf-org-card.py")
card = importlib.util.module_from_spec(spec)
spec.loader.exec_module(card)  # type: ignore[union-attr]

STALE_PAIR = "(22·22·0 derived, never typed as a frozen paste)"
STALE_FIX = "(derived live from totals, never typed as a frozen paste)"


def anon_readme(repo: str) -> tuple[int, str]:
    req = urllib.request.Request(
        f"https://huggingface.co/datasets/{repo}/raw/main/README.md",
        headers={"user-agent": "Mozilla/5.0 csoai-hf-live-row/0.1"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:  # noqa: PERF203
        return e.code, ""
    except Exception as e:  # noqa: BLE001
        return 0, f"UNREACHABLE: {type(e).__name__}: {e}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--push", action="store_true")
    ap.add_argument("--dry", action="store_true")
    ap.add_argument("--ledger", default=None)
    ap.add_argument("--only", default=None, help="comma-separated axis ids")
    args = ap.parse_args()
    if not (args.push or args.dry):
        ap.error("pass --dry or --push")
    tok = os.environ.get("HF_TOKEN") if args.push else None
    if args.push and not tok:
        print("HF_TOKEN is not in the environment; refusing to push", file=sys.stderr)
        return 2

    board, why = card.fetch_json(card.API)
    d = card.derive(board, why, card.now_iso())
    if d["state"] != "DERIVED":
        print(f"UNCHECKABLE: {d.get('reason')} — no axis→repo map without the board", file=sys.stderr)
        return 1
    only = set(args.only.split(",")) if args.only else None
    targets = [(a["axis"], a["dataset"]) for a in d["axes"] if a.get("dataset") and (only is None or a["axis"] in only)]
    skipped = [a["axis"] for a in d["axes"] if not a.get("dataset")]

    from huggingface_hub import HfApi, hf_hub_download
    api = HfApi(token=tok) if tok else HfApi()
    ledger = {"schema": "csoai.hf-live-row-ledger/0.1", "as_of": card.now_iso(), "board_measured_on": d.get("measured_on"),
              "commit_message": "card: link the live board row (2026-09-22)", "no_dataset_on_row": skipped, "cards": []}
    for axis, repo in targets:
        entry = {"axis": axis, "repo": repo}
        try:
            local = Path(hf_hub_download(repo, "README.md", repo_type="dataset", local_dir=Path("/tmp/hf-live-row") / repo.split("/")[1]))
            text = local.read_text(encoding="utf-8")
        except Exception as e:  # noqa: BLE001
            entry["state"] = f"UNREACHABLE: {type(e).__name__}: {e}"
            ledger["cards"].append(entry); print(f"{axis:24} {repo:40} {entry['state']}"); continue
        # Spliced on the raw text, not through split/join_front_matter: re-serialising the YAML
        # would re-indent every tag list and turn a one-block edit into a whole-card diff. The
        # markers live in the body, so the front matter stays byte-identical.
        block = card.live_row_block(axis)
        had_block = card.LIVE_ROW_OPEN in text
        new = card.splice(text, block, card.LIVE_ROW_OPEN, card.LIVE_ROW_CLOSE, before=card.HUB_OPEN)
        stale = STALE_PAIR in new
        if stale:
            new = new.replace(STALE_PAIR, STALE_FIX)
        changed = new != text
        entry.update({"had_live_row_block": had_block, "stale_typed_pair_dropped": stale, "changed": changed})
        if changed and args.push:
            local.write_text(new, encoding="utf-8")
            api.upload_file(path_or_fileobj=str(local), path_in_repo="README.md", repo_id=repo, repo_type="dataset",
                            commit_message=ledger["commit_message"])
            entry["uploaded"] = True
            time.sleep(2)
            code, back = anon_readme(repo)
            entry["readback"] = {"http": code, "links_this_row": f"api/gspc?axis={axis}" in back,
                                 "block_present": card.LIVE_ROW_OPEN in back, "stale_pair_gone": STALE_PAIR not in back}
        else:
            entry["uploaded"] = False
        ledger["cards"].append(entry)
        print(f"{axis:24} {repo:40} changed={changed} had_block={had_block} stale={stale} uploaded={entry['uploaded']}"
              + (f" readback={entry['readback']}" if "readback" in entry else ""))
    ledger["totals"] = {"cards": len(ledger["cards"]), "uploaded": sum(1 for c in ledger["cards"] if c.get("uploaded")),
                        "readback_links_row": sum(1 for c in ledger["cards"] if c.get("readback", {}).get("links_this_row"))}
    if args.ledger:
        Path(args.ledger).write_text(json.dumps(ledger, indent=2) + "\n", encoding="utf-8")
        print(f"ledger -> {args.ledger}")
    print(json.dumps(ledger["totals"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
