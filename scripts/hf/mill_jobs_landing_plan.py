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
or an identical set on a PR a human has worked on or on a lower-numbered PR). Only bot-authored
PRs are ever closed: a PR with a commit by anyone else has a human working on it and is left
alone. A PR whose cards could not be read is never closed.

Merge-only commits are not human work. A two-parent commit whose second parent is already on
master only brought master into the branch (the "Update branch" button, a merge-lane catch-up):
#2815 carried one such commit by a person and every other commit by the bot, so it read as
human-touched and was never closed although #2843 held all of its gradings. The workflow marks
those commits (merges_master, read from the GitHub compare API); they no longer count.

Stale rolling PR. A bot-only own-prefix PR that conflicts with master, or whose head has carried a
failed (or no) required check for --replace-after-hours, cannot merge without a human, and while it
is open the hold below lands nothing: #2843, #2846 and #2815 sat there until a person closed them
on 2026-10-07 ("merge conflict with master; the mill pipeline will re-generate"). Such a PR stops
holding when every grading it carries is accounted for: on master, in another open PR, below the
--min-graded floor, or in a cell this run admits. Then it is replaced: this run lands from current
master, and the workflow closes the stale PR once the new PR exists and lands those cells. If any
of its gradings is not accounted for (staging no longer holds it), it keeps holding and the hold
reason says why, for a human.

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
from datetime import datetime, timezone
from pathlib import Path

UNSIGNED = "public/interop/mill-cards-unsigned"
SIGNED = "public/interop/mill-cards-signed"
OWN_PREFIX = "mill/land-hfjobs-"
LAND_PREFIX = "mill/land-"
BOT_EMAILS = frozenset({"board@csoai.org", "41898282+github-actions[bot]@users.noreply.github.com"})
# The contexts branch protection requires on master (GET /repos/CSOAI-ORG/councilof-ai/branches/master,
# read 2026-10-07: gates from pr-gates.yml, build from ci.yml).
REQUIRED_CHECKS = ("gates", "build")
FAILED = frozenset({"FAILURE", "TIMED_OUT", "CANCELLED", "ACTION_REQUIRED", "STARTUP_FAILURE", "ERROR"})


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
    stale: str = ""  # why this PR cannot merge without a human ("" = it can, or it is not known)
    graded: dict[str, tuple[tuple[str, str], int]] = field(default_factory=dict)  # digest -> (cell, n)

    @property
    def own(self) -> bool:
        return self.branch.startswith(OWN_PREFIX)

    @classmethod
    def from_gradings(cls, number: int, branch: str, bot_only: bool, gradings: list[Grading],
                      readable: bool = True, stale: str = "") -> "OpenPR":
        return cls(number, branch, bot_only, {g.digest for g in gradings}, {g.cell for g in gradings},
                   readable, stale, {g.digest: (g.cell, g.n) for g in gradings})


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


def merges_master_only(commit: dict) -> bool:
    """A two-parent commit whose second parent the workflow found on master (merges_master: true).

    That commit brought master into the branch and nothing else of its own: GitHub's "Update
    branch" button and a merge-lane catch-up both make one. Parents unknown -> not a merge."""
    parents = commit.get("parents")
    return isinstance(parents, list) and len(parents) == 2 and commit.get("merges_master") is True


def is_bot_only(pr: dict) -> bool:
    """Every commit is the bot's, or only merged master in. Unknown authorship is never bot-only."""
    commits = pr.get("commits")
    if not isinstance(commits, list) or not commits:
        return False
    for c in commits:
        if not isinstance(c, dict):
            return False
        if merges_master_only(c):
            continue
        authors = c.get("authors")
        if not isinstance(authors, list) or not authors:
            return False
        for a in authors:
            if str((a or {}).get("email") or "").lower() not in BOT_EMAILS:
                return False
    return True


def _when(raw: object) -> datetime | None:
    try:
        t = datetime.fromisoformat(str(raw or "").replace("Z", "+00:00"))
    except ValueError:
        return None
    return t if t.tzinfo else t.replace(tzinfo=timezone.utc)


def stale_reason(pr: dict, now: datetime, after_hours: float, required: tuple[str, ...] = REQUIRED_CHECKS) -> str:
    """Why this open PR cannot merge without a human, or "" when it can (or it is not yet known).

    CONFLICTING (gh pr view --json mergeable) is stale at once: no check runs on a conflicting
    merge ref, and the bot never resolves conflicts. A required check that FAILED on the head, or
    one that never reported on a head this old, is stale after `after_hours`; until then a human
    (or a re-run) may still fix it. UNKNOWN mergeability and running checks are never stale."""
    if str(pr.get("mergeable") or "").upper() == "CONFLICTING":
        return "it conflicts with master"
    latest: dict[str, tuple[datetime | None, str]] = {}
    for c in pr.get("statusCheckRollup") or []:
        if not isinstance(c, dict):
            continue
        name = str(c.get("name") or c.get("context") or "")
        if name not in required:
            continue
        at = _when(c.get("completedAt") or c.get("startedAt"))
        state = str(c.get("conclusion") or c.get("state") or c.get("status") or "").upper()
        prev = latest.get(name)
        if prev is None or (at and (prev[0] is None or at > prev[0])):
            latest[name] = (at, state)
    failed = [n for n in required if n in latest and latest[n][1] in FAILED]
    if failed:
        times = [latest[n][0] for n in failed if latest[n][0]]
        if not times:
            return ""
        hours = (now - max(times)).total_seconds() / 3600
        if hours >= after_hours:
            return f"required check(s) {', '.join(failed)} failed on its head {hours:.0f} h ago"
        return ""
    missing = [n for n in required if n not in latest]
    commits = pr.get("commits") if isinstance(pr.get("commits"), list) else []
    head_at = _when((commits[-1] or {}).get("committedDate")) if commits and isinstance(commits[-1], dict) else None
    if missing and head_at:
        hours = (now - head_at).total_seconds() / 3600
        if hours >= after_hours:
            return f"required check(s) {', '.join(missing)} never reported on its head in {hours:.0f} h"
    return ""


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


def superseded_prs(prs: list[OpenPR], on_master: set[str]) -> list[tuple[OpenPR, str, int | None]]:
    """Own-prefix, bot-only, readable PRs whose every digest lives on master or in another open PR.
    Each row: (pr, reason, the PR that holds its gradings or None for master)."""
    closing: list[tuple[OpenPR, str, int | None]] = []
    closed: set[int] = set()
    for pr in sorted(prs, key=lambda p: p.number):
        if not (pr.own and pr.bot_only and pr.readable and pr.digests):
            continue
        if pr.digests <= on_master:
            closing.append((pr, f"all {len(pr.digests)} evidence digests it carries are already on master", None))
            closed.add(pr.number)
            continue
        for other in sorted(prs, key=lambda p: p.number):
            if other.number == pr.number or other.number in closed or not other.readable:
                continue
            # Compare what each PR still adds over master: two PRs that differ only in gradings
            # master already holds are the same PR. Of such twins the one a human has worked on is
            # kept (this PR is bot-only by the guard above), else the lower number.
            rest, other_rest = pr.digests - on_master, other.digests - on_master
            if rest and rest <= other_rest and (rest < other_rest or not other.bot_only or other.number < pr.number):
                closing.append((pr, f"every grading it carries that is not on master is also in #{other.number}", other.number))
                closed.add(pr.number)
                break
    return closing


def plan(staged_cards: list[Grading], prs: list[OpenPR], on_master: set[str], min_graded: int) -> dict:
    closing = superseded_prs(prs, on_master)
    closing_numbers = {pr.number for pr, _, _ in closing}
    # Stale bot-only HF Jobs PRs (see the module note) do not hold the landing by themselves.
    candidates = [pr for pr in prs if pr.own and pr.bot_only and pr.readable and pr.stale
                  and pr.number not in closing_numbers]
    candidate_numbers = {pr.number for pr in candidates}
    holding = [pr for pr in prs if pr.number not in closing_numbers and pr.number not in candidate_numbers]
    pr_digest = {d: pr.number for pr in holding for d in pr.digests}
    pr_cell = {c: pr.number for pr in holding for c in pr.cells}
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
    admitted_cells = {g.cell for g in unique}

    open_own = [pr for pr in holding if pr.own]
    hold = bool(open_own)

    def unaccounted(pr: OpenPR, use_admitted: bool) -> list[str]:
        """Digests of `pr` that are not on master, not in flight elsewhere, not below the floor and
        (with use_admitted) not in a cell this run admits."""
        out = []
        for d in sorted(pr.digests):
            if d in on_master:
                continue
            cell, n = pr.graded.get(d, (None, None))
            if cell is not None and (cell in pr_cell or (min_graded and n is not None and n < min_graded)
                                     or (use_admitted and cell in admitted_cells)):
                continue
            out.append(d)
        return out

    close_now: list[tuple[OpenPR, str]] = []
    replace: list[tuple[OpenPR, list[tuple[str, str]]]] = []
    blocked: list[tuple[OpenPR, int]] = []
    for pr in candidates:
        if not unaccounted(pr, False):
            close_now.append((pr, f"it cannot merge as it is ({pr.stale}), and every grading it carries is on master, "
                                  f"in another open landing PR, or below the {min_graded}-graded floor"))
            continue
        missing = unaccounted(pr, not hold)
        if not hold and not missing:
            needs = sorted({pr.graded[d][0] for d in unaccounted(pr, False)})
            replace.append((pr, needs))
        else:
            blocked.append((pr, len(missing)))
    if blocked and replace:
        # Something stale still holds, so nothing lands this run and nothing can replace the rest.
        blocked += [(pr, len(needs)) for pr, needs in replace]
        replace = []
    if blocked:
        hold = True
    # A close comment names the PR that holds the gradings; say so when that PR goes too in this run.
    replaced = {pr.number for pr, _ in replace}
    settled = {pr.number for pr, _ in close_now}
    closing = [(pr, why + (f"; #{via} is itself replaced in this run by a fresh landing from current master, "
                           "which carries those gradings" if via in replaced else
                           f"; #{via} closes in this run too, its gradings being on master, in another open "
                           "landing PR, or below the floor" if via in settled else ""), via)
               for pr, why, via in closing]
    held = [f"#{pr.number}" + (f" ({pr.stale}; a human has committed to it)" if pr.stale else "") for pr in open_own]
    held += [f"#{pr.number} ({pr.stale}; {k} of its gradings {'are' if k != 1 else 'is'} not re-landable this run"
             f"{', because another landing PR holds the slot' if open_own else ' from csoai/mill-jobs-staging'},"
             " so it is not replaced: a human must repair or close it)" for pr, k in blocked]
    return {
        "kind": "csoai.mill-jobs-landing-plan/0.2",
        "staged_cards": len(staged_cards),
        "admitted": [{"path": g.path, "model": g.model, "axis": g.axis, "n": g.n, "quotable": g.quotable} for g in unique],
        "excluded": excluded,
        "close": [{"number": pr.number, "branch": pr.branch, "reason": why}
                  for pr, why in [(pr, why) for pr, why, _ in closing] + close_now],
        "replace": [{"number": pr.number, "branch": pr.branch, "reason": pr.stale,
                     "needs_cells": [list(c) for c in needs]} for pr, needs in replace],
        "hold": hold,
        "hold_reason": (f"open rolling PR(s) {', '.join(held)}: new gradings wait in "
                        "csoai/mill-jobs-staging and land in one PR after that merges or closes") if hold else "",
        "open_landing_prs": [{"number": pr.number, "branch": pr.branch, "readable": pr.readable,
                              "bot_only": pr.bot_only, "stale": pr.stale, "gradings": len(pr.digests)} for pr in prs],
    }


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--staged", required=True)
    ap.add_argument("--open-prs", required=True,
                    help="JSON list of gh pr view --json number,headRefName,commits,mergeable,statusCheckRollup "
                         "(commits may carry parents and merges_master; see mill-jobs-land.yml)")
    ap.add_argument("--repo", default=".")
    ap.add_argument("--min-graded", type=int, default=10)
    ap.add_argument("--excluded-dir", default="")
    ap.add_argument("--out", required=True)
    ap.add_argument("--github-output", default="")
    ap.add_argument("--replace-after-hours", type=float, default=24.0,
                    help="a bot-only HF Jobs PR whose required check failed (or never reported) this long ago is stale")
    ap.add_argument("--now", default="", help="ISO time to judge staleness at (tests); default: now")
    args = ap.parse_args(argv)
    now = _when(args.now) if args.now else datetime.now(timezone.utc)
    if now is None:
        print("UNCHECKABLE: --now is not an ISO time", file=sys.stderr)
        return 2
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
        prs.append(OpenPR.from_gradings(int(row["number"]), branch, is_bot_only(row), cards, readable,
                                        stale_reason(row, now, args.replace_after_hours)))
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
                      "excluded": hist, "close": [c["number"] for c in p["close"]],
                      "replace": [r["number"] for r in p["replace"]], "hold": p["hold"]}))
    if p["hold"]:
        print(p["hold_reason"])
    if args.github_output:
        with open(args.github_output, "a", encoding="utf-8") as fh:
            fh.write(f"hold={'true' if p['hold'] else 'false'}\n")
            fh.write(f"admitted={len(p['admitted'])}\n")
            fh.write(f"close={' '.join(str(c['number']) for c in p['close'])}\n")
            fh.write(f"replace={' '.join(str(r['number']) for r in p['replace'])}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
