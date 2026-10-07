#!/usr/bin/env python3
"""Decide what one mill-jobs-land run may land: only new gradings, one rolling PR at a time.

Why (M-P1-6, 2026-10-07). csoai/mill-jobs-staging is cumulative and deletes nothing, and
mill-jobs-land.yml landed the whole tree every run. #2843 and #2846 each carried 176 cards for
26 distinct cells, and their tables were identical; #2815 carried 141. Every run re-landed what
earlier PRs already held, the signer re-signed it, and SUPERSEDED.jsonl grew by a chain per cell.

Identity. land_mill_cards.bind_run_provenance rewrites body.run_id to "gha-<run>", so the same
grading lands under a different card id every run. The run-independent identity of a grading is
its item-evidence digest, body.evidence.items_sha256 (the raw outputs it was graded from).

Rules, in order, for each staged unsigned card:
  1. its evidence digest is already on master (unsigned or signed dir)    -> not landed
  2. its evidence digest is in any open mill/land-* PR                       -> not landed
  3. its (model, axis) cell is in any open mill/land-* PR                    -> not landed
  4. fewer than --min-graded items parsed (a route failure, see M-P1-7)      -> not landed
  5. several gradings of one cell remain: keep one -- quotable first, then larger n, then the
     smaller card id. Never chosen by accuracy.

Superseded PRs. An open PR on the own prefix (mill/land-hfjobs-) is closed when every evidence
digest it carries is on master, or is carried by another open mill/land-* PR (a strict superset,
or an identical set on a lower-numbered PR). Only bot-authored PRs are ever closed: a PR with a
commit by anyone else has a human working on it and is left alone. A PR whose cards could not be
read is never closed.

One rolling PR. While any own-prefix PR stays open, nothing new lands (hold); the staged cards
wait in the dataset and land in one PR after that one merges or is closed.

Writes nothing to master. Moves excluded staged cards out of --staged (to --excluded-dir) so
land_mill_cards.py sees only what this plan admits.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

UNSIGNED = "public/interop/mill-cards-unsigned"
SIGNED = "public/interop/mill-cards-signed"
OWN_PREFIX = "mill/land-hfjobs-"
LAND_PREFIX = "mill/land-"
BOT_EMAILS = frozenset({"board@csoai.org", "41898282+github-actions[bot]@users.noreply.github.com"})


@dataclass
class Grading:
    path: str
    card_id: str
    model: str
    axis: str
    n: int
    digest: str

    @property
    def cell(self) -> tuple[str, str]:
        return (self.model, self.axis)

    @property
    def quotable(self) -> bool:
        return self.n >= 30


@dataclass
class OpenPR:
    number: int
    branch: str
    bot_only: bool
    digests: set[str] = field(default_factory=set)
    cells: set[tuple[str, str]] = field(default_factory=set)
    readable: bool = True

    @property
    def own(self) -> bool:
        return self.branch.startswith(OWN_PREFIX)


def grading_of(wrap: object, path: str = "") -> Grading | None:
    if not isinstance(wrap, dict):
        return None
    body = wrap.get("body")
    if not isinstance(body, dict):
        return None
    ev = body.get("evidence") if isinstance(body.get("evidence"), dict) else {}
    digest = str(ev.get("items_sha256") or "").lower()
    model, axis, n = body.get("model"), body.get("axis"), body.get("n")
    if len(digest) != 64 or not model or not axis or not isinstance(n, int) or isinstance(n, bool):
        return None
    return Grading(path, str(wrap.get("id") or ""), str(model), str(axis), n, digest)


def digests_in_dir(directory: Path, pattern: str) -> set[str]:
    out: set[str] = set()
    if not directory.is_dir():
        return out
    for f in directory.glob(pattern):
        try:
            g = grading_of(json.loads(f.read_text(encoding="utf-8")))
        except (OSError, ValueError):
            continue
        if g:
            out.add(g.digest)
    return out


def master_digests(repo: Path) -> set[str]:
    return digests_in_dir(repo / UNSIGNED, "unsigned-*.json") | digests_in_dir(repo / SIGNED, "signed-*.json")


def is_bot_only(pr: dict) -> bool:
    commits = pr.get("commits")
    if not isinstance(commits, list) or not commits:
        return False  # unknown authorship is never treated as bot-only
    for c in commits:
        authors = c.get("authors") if isinstance(c, dict) else None
        if not isinstance(authors, list) or not authors:
            return False
        for a in authors:
            if str((a or {}).get("email") or "").lower() not in BOT_EMAILS:
                return False
    return True


def read_pr_cards(repo: Path, branch: str, on_master: set[str]) -> tuple[list[Grading], bool]:
    """The unsigned cards a landing branch adds over master (by file name). (cards, readable)."""
    def git(*args: str) -> str:
        return subprocess.run(["git", *args], cwd=repo, check=True, capture_output=True, text=True).stdout
    try:
        # --depth=1 only where the clone is already shallow (the Actions checkout): on a full clone
        # it would mark the fetched tip shallow and turn the whole repository shallow.
        depth = ["--depth=1"] if git("rev-parse", "--is-shallow-repository").strip() == "true" else []
        git("fetch", "--quiet", "--no-tags", *depth, "origin", branch)
        names = git("ls-tree", "-r", "--name-only", "FETCH_HEAD", "--", UNSIGNED).split()
    except subprocess.CalledProcessError as exc:
        print(f"UNREADABLE {branch}: {(exc.stderr or '').strip()[:160]}", file=sys.stderr)
        return [], False
    out: list[Grading] = []
    for name in names:
        base = name.rsplit("/", 1)[-1]
        if not base.startswith("unsigned-") or not base.endswith(".json") or base in on_master:
            continue
        try:
            g = grading_of(json.loads(git("show", f"FETCH_HEAD:{name}")), name)
        except (subprocess.CalledProcessError, ValueError):
            continue
        if g:
            out.append(g)
    return out, True


def superseded_prs(prs: list[OpenPR], on_master: set[str]) -> list[tuple[OpenPR, str]]:
    """Own-prefix, bot-only, readable PRs whose every digest lives on master or in another open PR."""
    closing: list[tuple[OpenPR, str]] = []
    closed: set[int] = set()
    for pr in sorted(prs, key=lambda p: p.number):
        if not (pr.own and pr.bot_only and pr.readable and pr.digests):
            continue
        if pr.digests <= on_master:
            closing.append((pr, f"all {len(pr.digests)} evidence digests it carries are already on master"))
            closed.add(pr.number)
            continue
        for other in sorted(prs, key=lambda p: p.number):
            if other.number == pr.number or other.number in closed or not other.readable:
                continue
            # Compare what each PR still adds over master: two PRs that differ only in gradings
            # master already holds are the same PR, and the lower number is the one kept.
            rest, other_rest = pr.digests - on_master, other.digests - on_master
            if rest and rest <= other_rest and (rest < other_rest or other.number < pr.number):
                closing.append((pr, f"every grading it carries that is not on master is also in #{other.number}"))
                closed.add(pr.number)
                break
    return closing


def plan(staged_cards: list[Grading], prs: list[OpenPR], on_master: set[str], min_graded: int) -> dict:
    pr_digest = {d: pr.number for pr in prs for d in pr.digests}
    pr_cell = {c: pr.number for pr in prs for c in pr.cells}
    excluded: list[dict] = []
    survivors: dict[tuple[str, str], list[Grading]] = {}
    for g in staged_cards:
        reason = None
        if g.digest in on_master:
            reason = "evidence digest already on master"
        elif g.digest in pr_digest:
            reason = f"evidence digest already in open PR #{pr_digest[g.digest]}"
        elif g.cell in pr_cell:
            reason = f"cell already in flight in open PR #{pr_cell[g.cell]}"
        elif min_graded and g.n < min_graded:
            reason = f"low-yield route: n={g.n} < {min_graded} graded (route failure, not a measurement)"
        if reason:
            excluded.append({"path": g.path, "model": g.model, "axis": g.axis, "n": g.n, "reason": reason})
        else:
            survivors.setdefault(g.cell, []).append(g)
    kept: list[Grading] = []
    for cell, gs in sorted(survivors.items()):
        gs.sort(key=lambda g: (not g.quotable, -g.n, g.card_id))
        kept.append(gs[0])
        for dup in gs[1:]:
            excluded.append({"path": dup.path, "model": dup.model, "axis": dup.axis, "n": dup.n,
                             "reason": f"another grading of this cell is kept ({gs[0].card_id[:12]}, n={gs[0].n})"})
    # Two staged files can carry one grading (the same digest under two names); land it once.
    seen: set[str] = set()
    unique: list[Grading] = []
    for g in kept:
        if g.digest in seen:
            excluded.append({"path": g.path, "model": g.model, "axis": g.axis, "n": g.n, "reason": "same grading staged twice"})
            continue
        seen.add(g.digest)
        unique.append(g)
    closing = superseded_prs(prs, on_master)
    closing_numbers = {pr.number for pr, _ in closing}
    still_open = [pr.number for pr in prs if pr.own and pr.number not in closing_numbers]
    hold = bool(still_open)
    return {
        "kind": "csoai.mill-jobs-landing-plan/0.1",
        "staged_cards": len(staged_cards),
        "admitted": [{"path": g.path, "model": g.model, "axis": g.axis, "n": g.n, "quotable": g.quotable} for g in unique],
        "excluded": excluded,
        "close": [{"number": pr.number, "branch": pr.branch, "reason": why} for pr, why in closing],
        "hold": hold,
        "hold_reason": (f"open rolling PR(s) {', '.join('#' + str(n) for n in still_open)}: new gradings wait in "
                        "csoai/mill-jobs-staging and land in one PR after that merges or closes") if hold else "",
        "open_landing_prs": [{"number": pr.number, "branch": pr.branch, "readable": pr.readable,
                              "bot_only": pr.bot_only, "gradings": len(pr.digests)} for pr in prs],
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--staged", required=True)
    ap.add_argument("--open-prs", required=True, help="gh pr list --state open --json number,headRefName,commits")
    ap.add_argument("--repo", default=".")
    ap.add_argument("--min-graded", type=int, default=10)
    ap.add_argument("--excluded-dir", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--github-output", default="")
    args = ap.parse_args(argv)
    repo = Path(args.repo).resolve()
    staged = Path(args.staged)
    raw_prs = json.loads(Path(args.open_prs).read_text(encoding="utf-8"))
    if not isinstance(raw_prs, list):
        print("UNCHECKABLE: --open-prs is not a JSON list", file=sys.stderr)
        return 2
    on_master = master_digests(repo)
    master_names = {p.name for p in (repo / UNSIGNED).glob("unsigned-*.json")} if (repo / UNSIGNED).is_dir() else set()
    prs: list[OpenPR] = []
    for row in raw_prs:
        branch = str(row.get("headRefName") or "")
        if not branch.startswith(LAND_PREFIX):
            continue
        cards, readable = read_pr_cards(repo, branch, master_names)
        prs.append(OpenPR(int(row["number"]), branch, is_bot_only(row), {g.digest for g in cards},
                          {g.cell for g in cards}, readable))
    if any(not pr.readable for pr in prs):
        # An unreadable open landing PR could hold any cell: landing beside it is a blind guess.
        print("UNCHECKABLE: an open mill/land-* PR could not be read; landing nothing this run", file=sys.stderr)
        return 3
    staged_cards: list[Grading] = []
    for f in sorted(staged.rglob("unsigned-*.json")):
        try:
            g = grading_of(json.loads(f.read_text(encoding="utf-8")), str(f.relative_to(staged)))
        except (OSError, ValueError):
            g = None
        if g:
            staged_cards.append(g)
        # A card without a readable evidence digest is left in place: land_mill_cards.py
        # --require-evidence rejects it with its own reason, which the PR body then shows.
    p = plan(staged_cards, prs, on_master, max(0, args.min_graded))
    if args.excluded_dir:
        dest = Path(args.excluded_dir)
        for row in p["excluded"]:
            src = staged / row["path"]
            if src.is_file():
                (dest / row["path"]).parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(src), str(dest / row["path"]))
    Path(args.out).write_text(json.dumps(p, indent=2) + "\n", encoding="utf-8")
    hist: dict[str, int] = {}
    for row in p["excluded"]:
        key = row["reason"].split(":")[0].split("(")[0].strip()
        hist[key] = hist.get(key, 0) + 1
    print(json.dumps({"staged": p["staged_cards"], "admitted": len(p["admitted"]),
                      "quotable_admitted": sum(1 for r in p["admitted"] if r["quotable"]),
                      "excluded": hist, "close": [c["number"] for c in p["close"]], "hold": p["hold"]}))
    if p["hold"]:
        print(p["hold_reason"])
    if args.github_output:
        with open(args.github_output, "a", encoding="utf-8") as fh:
            fh.write(f"hold={'true' if p['hold'] else 'false'}\n")
            fh.write(f"admitted={len(p['admitted'])}\n")
            fh.write(f"close={' '.join(str(c['number']) for c in p['close'])}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
