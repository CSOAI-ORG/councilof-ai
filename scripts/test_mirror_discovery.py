#!/usr/bin/env python3
"""Controls for mirror_fanout's artifact discovery.

The defect this guards: DEFAULT_ARTIFACTS was a hand-maintained list of four
paths. On 2026-09-17 a whole day's published output went to one provider because
nobody added four lines to it. Discovery replaces the list -- so discovery itself
now needs a test that fires in BOTH directions.
"""
import pathlib, sys, tempfile
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import mirror_fanout as mf

def main():
    fails = []
    def check(name, got, want):
        ok = got == want
        print(f"  {'ok  ' if ok else 'FAIL'} {name:56} {got!r}")
        if not ok: fails.append(f"{name}: got {got!r} want {want!r}")

    # 1. discovery over a synthetic tree: includes what it should, excludes what it should
    with tempfile.TemporaryDirectory() as td:
        r = pathlib.Path(td)
        for rel in ["public/interop/a.json", "public/interop/b.ots", "public/interop/c.ots.invalid",
                    "public/interop/_wip.json", "public/interop/d-unsigned.json",
                    "public/interop/ots/e.json", "public/press/f.md", "public/press/g.txt",
                    "public/root.json", "public/signed/card_index.json",
                    "public/signed/other.json", "public/cards/h.json"]:
            p = r/rel; p.parent.mkdir(parents=True, exist_ok=True); p.write_text("{}")
        found, excluded = mf.discover_artifacts(r)
        check("picks up a new interop json with no code change", "public/interop/a.json" in found, True)
        check("picks up a new press markdown", "public/press/f.md" in found, True)
        check("picks up root.json", "public/root.json" in found, True)
        check("picks up the signed card index", "public/signed/card_index.json" in found, True)
        # these three are excluded STRUCTURALLY -- the globs never surface them --
        # which is why there is no regex for them. Assert the outcome, not the mechanism.
        check("never surfaces .ots proofs", "public/interop/b.ots" in found, False)
        check("never surfaces .ots.invalid", "public/interop/c.ots.invalid" in found, False)
        check("never surfaces the ots/ sidecar dir", "public/interop/ots/e.json" in found, False)
        check("EXCLUDES unsigned staging drafts", "public/interop/d-unsigned.json" in found, False)
        check("EXCLUDES leading-underscore WIP", "public/interop/_wip.json" in found, False)
        check("does NOT sweep all of public/signed/", "public/signed/other.json" in found, False)
        check("does NOT sweep public/cards/", "public/cards/h.json" in found, False)
        check("press/*.txt is not matched by press/*.md", "public/press/g.txt" in found, False)
        check("every exclusion carries a stated reason", all(w.strip() for _, w in excluded), True)
        ex = {rel for rel, _ in excluded}
        check("the -unsigned rule actually FIRED", "public/interop/d-unsigned.json" in ex, True)
        check("the _wip rule actually FIRED", "public/interop/_wip.json" in ex, True)
        # every declared rule must be reachable, or it is decoration
        fired = {i for i, (rx, _) in enumerate(mf.PUBLISH_EXCLUDE)
                 for rel in ex if rx.search(rel)}
        check("no PUBLISH_EXCLUDE rule is dead code", len(fired), len(mf.PUBLISH_EXCLUDE))

    # 2. the floor must FAIL when discovery loses a required path, and pass when it does not
    try:
        mf.enforce_floor([p for p in mf.ARTIFACT_FLOOR if p != mf.ARTIFACT_FLOOR[0]])
        check("floor raises when a required path is missing", "did not raise", "SystemExit")
    except SystemExit as e:
        check("floor raises when a required path is missing", "SystemExit" in type(e).__name__, True)
        check("the failure names the missing path", mf.ARTIFACT_FLOOR[0] in str(e), True)
    try:
        mf.enforce_floor(list(mf.ARTIFACT_FLOOR) + ["public/interop/extra.json"])
        check("floor does NOT fire on a superset", True, True)
    except SystemExit:
        check("floor does NOT fire on a superset", "raised", "no raise")

    # 3. against the REAL tree: today's artifacts must be discovered without being listed
    real, _ = mf.discover_artifacts(pathlib.Path(__file__).resolve().parent.parent)
    for must in ["public/interop/verifiability-census-2026-09-17-v0.2.json",
                 "public/interop/paired-arm-arc-agi-2-2026-09-17.json",
                 "public/press/2026-09-17-can-you-check-their-work.md"]:
        check(f"real tree discovers {pathlib.Path(must).name[:34]}", must in real, True)
    print(f"\n  real tree: {len(real)} artifacts discovered")
    print(f"\n{'FAILURES: ' + '; '.join(fails) if fails else 'all controls pass — discovery includes, excludes, and the floor fires both ways'}")
    return 1 if fails else 0

if __name__ == "__main__":
    sys.exit(main())
