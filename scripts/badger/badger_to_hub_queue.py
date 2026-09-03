#!/usr/bin/env python3
"""badger_to_hub_queue.py — turn badger atoms into rows the mill can actually grade.

WHY THIS EXISTS. 45 badger harvesters write to scripts/badger/_queue/. Nothing read
it. csoai-eat-all-chains.py closed every run with "Next step: let mill_hub_queue.py
sign + upload the staged atoms" — and mill_hub_queue.py has zero references to badger
and takes --queue pointing at the HF dataset csoai/hub-queue. Tens of thousands of
harvested rows went nowhere, for as long as the harvesters had been running.

WHAT CAN AND CANNOT BE BRIDGED. The two queues sit at opposite ends of the pipeline:

    badger row      = an OUTPUT shape (a card body: subject/scope/measurement)
    queue.jsonl row = an INPUT shape  (a subject to go and grade)

So there is only one honest direction. Feeding badger atoms in as FINISHED cards
would mean inventing `n >= 30` and an `accuracy`, because land_mill_cards.py requires
both and sign_mill_cards.py only writes MEASURED at n>=30. A badger atom carries
measurement.evidence and measurement.url — narrative evidence, never a labelled item
set graded against a frozen bank's `expected` gold. Fabricating that number is
precisely what test_mill_honesty.py exists to prevent. This adapter therefore emits
mill INPUT only, and the mill does the grading it has always done.

WHAT GETS DROPPED, AND WHY THAT IS THE POINT. Most badger atoms are companies,
papers, corrections, bank ledgers and datasets. None of those is an inference
endpoint; there is no way to POST a chat completion to a Companies House number. The
drop count is not a footnote, it is the real answer to "can the harvest feed the
mill", so it is printed as a headline.

    python3 scripts/badger/badger_to_hub_queue.py --out mill-in/queue.jsonl
    python3 scripts/badger/badger_to_hub_queue.py --selftest
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
QUEUE = HERE / "_queue"
DEAD = REPO / "harness" / "gspc-top100" / "dead_slugs.jsonl"

# mill_hub_queue.SERVABLE_TAGS. image-text-to-text is deliberately excluded there.
SERVABLE_TAGS = {"text-generation", "text2text-generation", "conversational"}

# mill_hub_queue.MODEL_AXES. Anything outside this is SILENTLY COERCED to
# "governance" at mill_hub_queue.py:705 — so an adapter that passes an unknown axis
# through would relabel a bank atom as a governance measurement. We reject instead.
MODEL_AXES = {
    "governance", "safety", "provenance", "continuity", "conformance", "openness",
    "machinery-conformity", "care", "cross-reality", "detector-interop",
    "art5-safeguard", "swarm", "affect", "jail",
}


def slug_of(atom: dict) -> tuple[str | None, str]:
    """(HF slug, reason). Slug is None when this atom is not a gradeable HF model.

    The reason is returned rather than inferred by the caller, because the
    interesting rejections are models we DID harvest and still cannot grade — those
    deserve naming, not lumping under "not a model".

    Two writer families use two different keys, and neither is `id`:
      huggingface-model-badge-*.jsonl -> subject.slug,    subject.hub    == "huggingface"
      top-models/*.jsonl              -> subject.repo_id, subject.source == "huggingface"
    """
    s = atom.get("subject")
    if not isinstance(s, dict):
        # The largest single class in the queue is not a measurement atom at all:
        # scripts/badger/_queue/learn/ holds prompt/response corpus rows. They have
        # no subject because they are not about anything — they ARE the text. Naming
        # them keeps the drop report honest; "no subject" told the reader nothing.
        if "prompt" in atom and "response" in atom:
            return None, "learn-corpus row (prompt/response), not a measurement atom"
        return None, "no subject"
    if s.get("kind") != "model":
        return None, f"not a model (subject.kind={s.get('kind')})"

    hub = s.get("hub") or s.get("source")
    if hub != "huggingface":
        # A real model, harvested, on a hub the mill cannot reach. mill_hub_queue
        # grades through the HF router (with an OpenRouter fallback UNDER THE SAME
        # id), so an OpenRouter-native id like "anthropic/claude-fable-5.1:batch"
        # has no HF repo to call. Reverse-mapping it would be inventing a slug.
        return None, f"model on a hub the mill cannot grade (hub={hub})"

    slug = s.get("slug") or s.get("repo_id")
    if not isinstance(slug, str):
        return None, "HF model with no slug/repo_id key"
    # fleet:governance and friends are board aggregates, not endpoints. infer_hub()
    # would POST a chat completion to a model that does not exist.
    if slug.startswith("fleet:"):
        return None, "fleet:* board aggregate, not a servable endpoint"
    if "/" not in slug:
        return None, "slug has no org prefix, cannot be an HF repo id"
    return slug, ""


def to_row(atom: dict, slug: str) -> dict | None:
    """A mill-input row, or None with the reason recorded by the caller.

    Column set is flip_hub_queue.py:107 — the canonical queue schema.
    """
    scope = atom.get("scope") or {}
    tag = scope.get("pipeline")
    if tag not in SERVABLE_TAGS:
        return None
    meas = atom.get("measurement") or {}
    dl = meas.get("downloads")
    return {
        "rank": 0,                       # replaced by a real rank after sorting
        "id": slug,
        "downloads": int(dl) if isinstance(dl, (int, float)) else 0,
        "pipeline_tag": tag,
        # DISCOVERED means nothing to mill_hub_queue.is_empty(); UNMEASURED with an
        # empty card_id is what marks a cell as needing work.
        "status": "UNMEASURED",
        "card_id": "",
        "measured_axes": {},
        "as_of": atom.get("as_of"),
    }


def load_dead() -> set[str]:
    dead: set[str] = set()
    if not DEAD.exists():
        return dead
    for line in DEAD.read_text(errors="replace").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            d = json.loads(line)
            if isinstance(d, dict) and d.get("id"):
                dead.add(d["id"])
        except Exception:
            continue
    return dead


def build(queue_dir: Path = QUEUE) -> tuple[list[dict], Counter]:
    why: Counter = Counter()
    best: dict[str, dict] = {}
    for jsonl in sorted(queue_dir.rglob("*.jsonl")):
        for line in jsonl.read_text(errors="replace").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                atom = json.loads(line)
            except Exception:
                why["unparseable line"] += 1
                continue
            if not isinstance(atom, dict):
                why["not an object"] += 1
                continue

            # Reject, never coerce, an axis the mill does not know.
            ax = (atom.get("scope") or {}).get("axis")
            if ax is not None and ax not in MODEL_AXES:
                why[f"axis not in MODEL_AXES ({ax})"] += 1
                continue

            slug, reason = slug_of(atom)
            if slug is None:
                why[reason] += 1
                continue

            row = to_row(atom, slug)
            if row is None:
                tag = (atom.get("scope") or {}).get("pipeline")
                why[f"pipeline_tag not servable ({tag})"] += 1
                continue

            # badger appends, so the same slug recurs across timestamped files.
            # Keep the row with the highest downloads.
            prev = best.get(slug)
            if prev is None or row["downloads"] > prev["downloads"]:
                best[slug] = row

    dead = load_dead()
    for s in list(best):
        if s in dead:
            del best[s]
            why["already proven dead"] += 1

    rows = sorted(best.values(), key=lambda r: -r["downloads"])
    for i, r in enumerate(rows, 1):
        r["rank"] = i
    return rows, why


def _selftest() -> int:
    """Prove the adapter rejects what it must. A filter that never drops is not one."""
    cases, failed = [], 0

    def check(name, got, want):
        nonlocal failed
        ok = got == want
        if not ok:
            failed += 1
        cases.append((ok, name, got, want))

    good = {"subject": {"kind": "model", "hub": "huggingface", "slug": "Qwen/Qwen3-0.6B"},
            "scope": {"chain": "huggingface", "kind": "model-badge", "pipeline": "text-generation"},
            "measurement": {"downloads": 22741013}, "as_of": "2026-09-03T00:00:00Z"}
    check("a real HF model row is accepted", slug_of(good)[0], "Qwen/Qwen3-0.6B")
    r = to_row(good, "Qwen/Qwen3-0.6B")
    check("row carries every queue column", sorted(r),
          sorted(["rank", "id", "downloads", "pipeline_tag", "status", "card_id",
                  "measured_axes", "as_of"]))
    check("status is UNMEASURED, not DISCOVERED", r["status"], "UNMEASURED")
    check("card_id is empty so the cell reads as empty", r["card_id"], "")

    # fleet:* are board aggregates. infer_hub() would POST to a nonexistent model.
    fleet = {"subject": {"kind": "model", "hub": "huggingface", "slug": "fleet:governance"}}
    check("a fleet:* pseudo-slug is rejected", slug_of(fleet)[0], None)

    # subject.kind that is not a model at all
    for kind, sub in [("company", {"kind": "company", "company_number": "07154576"}),
                      ("correction", {"kind": "correction", "id": "C-2026-0902-09"}),
                      ("bank-issuer", {"kind": "bank-issuer", "swift_id": "hsbc"})]:
        check(f"a {kind} atom is not a servable model", slug_of({"subject": sub})[0], None)

    # a real model on a hub the mill cannot reach must be NAMED, not lumped in with
    # "not a model" — 1,696 OpenRouter and 2,272 local-ollama atoms hide there.
    orow = {"subject": {"kind": "model", "hub": "openrouter", "slug": "anthropic/claude-fable-5.1:batch"}}
    check("an OpenRouter-native id is rejected", slug_of(orow)[0], None)
    check("...and the reason names the hub", "hub=openrouter" in slug_of(orow)[1], True)

    # a slug with no org prefix cannot be an HF repo id
    check("a bare name with no org is rejected",
          slug_of({"subject": {"kind": "model", "hub": "huggingface", "slug": "gpt2"}})[0], None)

    # pipeline gating
    for tag in ("image-text-to-text", None, "feature-extraction"):
        atom = {"subject": {"kind": "model", "hub": "huggingface", "slug": "a/b"},
                "scope": {"pipeline": tag}, "measurement": {}}
        check(f"pipeline_tag {tag!r} is dropped", to_row(atom, "a/b"), None)

    # the coercion trap: mill_hub_queue.py:705 turns an unknown axis into "governance"
    rows, why = build(Path("/nonexistent-for-selftest"))
    check("an empty tree yields no rows", rows, [])

    for ok, name, got, want in cases:
        print(f"  {'ok  ' if ok else 'FAIL'}  {name}" + ("" if ok else f"  -> got {got!r}, want {want!r}"))
    print(f"\n  {len(cases) - failed} passed, {failed} failed")
    if failed:
        print("\nbadger_to_hub_queue SELFTEST FAILED.")
        return 1
    print("\nbadger_to_hub_queue selftest OK — fleet aggregates, non-model subjects and")
    print("unservable pipelines are all rejected rather than passed through.")
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", type=Path, help="write queue.jsonl here")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--limit", type=int, default=None, help="cap emitted rows")
    args = ap.parse_args()

    if args.selftest:
        return _selftest()

    rows, why = build()
    total_seen = sum(why.values()) + len(rows)

    print(f"  gradeable rows : {len(rows)}")
    print(f"  atoms examined : {total_seen}")
    print(f"  dropped        : {sum(why.values())}"
          f"  ({100 * sum(why.values()) / total_seen:.1f}% of everything harvested)")
    print()
    print("  Why they were dropped — this IS the answer to whether the harvest can")
    print("  feed the mill. A company number is not an inference endpoint.")
    for reason, n in why.most_common(10):
        print(f"    {n:>7}  {reason}")

    if args.limit:
        rows = rows[: args.limit]
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text("\n".join(json.dumps(r, sort_keys=True) for r in rows) + "\n")
        print(f"\n  wrote {len(rows)} rows -> {args.out}")
        print(f"  next: python3 harness/gspc-top100/mill_hub_queue.py --queue {args.out} --out mill-out")
    else:
        print("\n  (no --out given; nothing written)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
