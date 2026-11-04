#!/usr/bin/env python3
"""test_evidence_sync_per_directory.py — prove the per-directory mirror fix before it is trusted.

THE FAILURE IT REPRODUCES. The evidence mirror is a git repository on HuggingFace, and git refuses a
push that leaves any directory holding more than 10,000 files. Two directories of the mirror reached that
cliff on 1 Nov 2026 — interop/mill-cards-unsigned held 9,920 files and the build adds 1,270 more
(11,190), interop/mill-evidence held 9,794 and adds 1,270 (11,064) — and the sync pushed every
differing file in ONE commit, so the whole push was rejected and the OTS manifest, the card wrappers and
the proofs stopped publishing with it. The published evidence froze at 677 proof rows while the
repository carried 694.

THE CLAIM UNDER TEST. Committing per directory means an over-cap directory fails alone: the other
directories still publish. These tests build the real shape of the failure — offline, no network, the
push stubbed — and assert that:

  1. the plan names exactly the two directories that cannot take their files, with the counts;
  2. the over-limit directories are not attempted at all (no push git would reject);
  3. the directory that CAN take its file — interop/ots, the one holding the OTS manifest — is pushed;
  4. a rejection from one directory does not stop the next one from being attempted.
"""
import importlib.util, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
SCRIPT = os.path.join(HERE, "pod-loops", "evidence_sync.py")

spec = importlib.util.spec_from_file_location("evidence_sync", SCRIPT)
es = importlib.util.module_from_spec(spec)
spec.loader.exec_module(es)

MIRROR = {
    "interop/mill-cards-unsigned": 9920,
    "interop/mill-evidence": 9794,
    "interop/ots": 1912,
    "cards": 6074,
    "proofs": 6074,
}
NEW = {
    "interop/mill-cards-unsigned": 1270,
    "interop/mill-evidence": 1270,
    "interop/ots": 1,        # public/interop/ots/manifest.json — the manifest the repository carries
    "cards": 0,
    "proofs": 0,
}


def _shape():
    tree, files = {}, {}
    for d, n in MIRROR.items():
        for i in range(n):
            p = f"{d}/f{i}.json"
            tree[p] = ("oid", None)
            files[p] = p
    for d, n in NEW.items():
        for i in range(n):
            p = f"{d}/new{i}.json"
            files[p] = p
    rels = [p for p in files if p not in tree]
    return tree, files, rels


def test_the_build_has_files_the_mirror_does_not():
    _, _, rels = _shape()
    assert len(rels) == 2541, len(rels)


def test_the_plan_names_exactly_the_two_directories_at_the_cliff():
    tree, files, rels = _shape()
    plan = es.plan_by_directory(rels, tree, files)
    over = {e["directory"] for e in plan if e["over_limit"]}
    assert over == {"interop/mill-cards-unsigned", "interop/mill-evidence"}, over


def test_the_ots_manifest_directory_can_take_its_file():
    tree, files, rels = _shape()
    plan = es.plan_by_directory(rels, tree, files)
    ots = [e for e in plan if e["directory"] == "interop/ots"][0]
    assert not ots["over_limit"]
    assert ots["new_files"] == 1


def test_the_counts_that_break_the_limit_are_reported():
    tree, files, rels = _shape()
    plan = es.plan_by_directory(rels, tree, files)
    after = {e["directory"]: e["mirror_files_after"] for e in plan}
    assert after["interop/mill-cards-unsigned"] == 11190, after
    assert after["interop/mill-evidence"] == 11064, after


def test_an_over_limit_directory_is_not_pushed_and_the_ots_manifest_is():
    tree, files, rels = _shape()
    plan = es.plan_by_directory(rels, tree, files)
    attempted = []

    def fake_commit(rels_, files_, token, message):
        d = es.dir_of(rels_[0])
        attempted.append(d)
        n_mirror = MIRROR.get(d, 0)
        n_new = sum(1 for r in rels_ if r not in tree)
        if n_mirror + n_new > es.HF_MAX_FILES_PER_DIR:
            raise SystemExit("evidence-sync: commit HTTP 400: too many files per directory")
        return None

    es.commit = fake_commit
    results = es.commit_grouped(rels, files, "tok", "msg", plan)
    assert "interop/mill-cards-unsigned" not in attempted, attempted
    assert "interop/mill-evidence" not in attempted, attempted
    assert "interop/ots" in attempted, attempted
    assert results["interop/ots"]["state"] == "SYNCED"
    assert results["interop/mill-cards-unsigned"]["state"] == "OVER_DIRECTORY_LIMIT"
    assert "11190" in results["interop/mill-cards-unsigned"]["detail"]


def test_a_rejected_directory_does_not_stop_the_next_one():
    files2 = {"interop/ots/manifest.json": "x", "cards/wrapper.json": "y"}
    rels2 = list(files2)
    plan2 = es.plan_by_directory(rels2, {}, files2)
    attempted = []

    def failing_commit(rels_, files_, token, message):
        d = es.dir_of(rels_[0])
        attempted.append(d)
        if d == "cards":
            raise SystemExit("evidence-sync: commit HTTP 500: transient")
        return None

    es.commit = failing_commit
    results = es.commit_grouped(rels2, files2, "tok", "msg", plan2)
    assert "cards" in attempted and "interop/ots" in attempted, attempted
    assert results["cards"]["state"] == "REJECTED"
    assert results["interop/ots"]["state"] == "SYNCED"


if __name__ == "__main__":
    fns = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    failed = 0
    for fn in fns:
        try:
            fn()
            print(f"  ok   {fn.__name__}")
        except AssertionError as e:
            print(f"  FAIL {fn.__name__}: {e}")
            failed += 1
    print(f"\n{len(fns) - failed}/{len(fns)} passed")
    sys.exit(1 if failed else 0)
