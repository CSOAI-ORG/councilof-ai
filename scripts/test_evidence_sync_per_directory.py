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
from unittest.mock import patch
from pathlib import Path
import json, tempfile
import urllib.error

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
# The live shape of the two directories at the cliff: the mirror holds far more
# files than the build does, and the difference are ORPHANS — files the mirror
# holds that this build does not have. MEASURED 6 Nov 2026 against the live
# mirror: interop/mill-cards-unsigned 9,920 in the mirror, 3,656 in the build,
# 7,534 orphans; interop/mill-evidence 9,795 in the mirror, 4,472 in the build,
# 6,593 orphans. A plan grants no permission to prune them, so they accumulate,
# and they consume the budget the build's own files need.
ORPHANS = {
    "interop/mill-cards-unsigned": 7534,
    "interop/mill-evidence": 6593,
}


def _shape():
    tree, files = {}, {}
    for d, n in MIRROR.items():
        for i in range(n):
            p = f"{d}/f{i}.json"
            tree[p] = ("oid", None)
            files[p] = p
    for d, n in ORPHANS.items():
        for i in range(n):
            files.pop(f"{d}/f{i}.json", None)
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


def test_the_plan_reports_the_orphans_that_occupy_the_budget():
    """The orphans are why the two directories are at the cliff.

    MEASURED 6 Nov 2026 against the live mirror: interop/mill-cards-unsigned
    held 9,920 files where the build holds 3,656 — 7,534 of them orphans — and
    interop/mill-evidence held 9,795 where the build holds 4,472 (6,593
    orphans). 40 of the 40 sampled orphans name an admission evidence file this
    tree does not hold. They are never written and never pruned, so they consume
    the per-directory budget the build's own files need: 9,920 + 1,270 = 11,190
    is over the 10,000 limit, and the legitimate files were never published.

    The count has to be VISIBLE, or the freeze looks like a network problem.
    """
    tree, files, rels = _shape()
    plan = {e["directory"]: e for e in es.plan_by_directory(rels, tree, files)}
    unsigned = plan["interop/mill-cards-unsigned"]
    evidence = plan["interop/mill-evidence"]
    # The fixture mirrors the live shape: the mirror holds 9,920 files where
    # this build holds 3,656, and every OTHER mirror file is an orphan.
    assert unsigned["mirror_files_before"] == 9920
    assert unsigned["new_files"] == 1270
    assert unsigned["orphan_files"] == 7534
    assert evidence["orphan_files"] == 6593
    # The orphans are the reason the directory is over the limit, so the count
    # must be a real number and not a guess.
    assert unsigned["orphan_files"] > 0 and unsigned["over_limit"]


def test_the_orphan_count_is_validated_before_any_write():
    files = {"cards/x": "fixture"}
    plan = es.plan_by_directory(list(files), {}, files)
    plan[0]["orphan_files"] = -1
    with patch.object(es, "commit", side_effect=AssertionError("must never write")):
        try:
            es.commit_grouped(list(files), files, "fixture", "test", plan)
        except ValueError:
            return
    raise AssertionError("Negative orphan count accepted")


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

    with patch.object(es, "commit", fake_commit):
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

    with patch.object(es, "commit", failing_commit):
        results = es.commit_grouped(rels2, files2, "tok", "msg", plan2)
    assert "cards" in attempted and "interop/ots" in attempted, attempted
    assert results["cards"]["state"] == "REJECTED"
    assert results["interop/ots"]["state"] == "SYNCED"



def test_replacements_at_limit_do_not_count_as_new_files():
    tree={f'cards/f{i}.json':('old',None) for i in range(10000)}
    p=es.plan_by_directory(['cards/f1.json'],tree,{'cards/f1.json':'fixture'})[0]
    assert p['new_files']==0 and p['mirror_files_after']==10000 and not p['over_limit']


def test_duplicate_and_traversal_paths_are_refused():
    for paths in [['cards/x','cards/x'],['../x'],['/x'],['cards//x'],['cards/../x']]:
        try:es.plan_by_directory(paths,{},dict.fromkeys(paths))
        except ValueError:continue
        raise AssertionError('Unsafe plan accepted')


def test_tampered_plan_is_refused_before_any_write():
    files={'cards/x':'fixture'};p=es.plan_by_directory(list(files),{},files);p[0]['over_limit']=True
    with patch.object(es,'commit',side_effect=AssertionError('must never write')):
        try:es.commit_grouped(list(files),files,'fixture','test',p)
        except ValueError:return
    raise AssertionError('Inconsistent plan accepted')


def test_denied_authorization_stops_other_directories():
    files={'cards/x':'fixture','proofs/x':'fixture'};p=es.plan_by_directory(list(files),{},files);attempts=[]
    def deny(*args):attempts.append(1);raise SystemExit('HTTP 403: private synthetic response')
    with patch.object(es,'commit',deny):out=es.commit_grouped(list(files),files,'synthetic-token','test',p)
    assert len(attempts)==1 and out['proofs']['state']=='NOT_ATTEMPTED'
    assert 'synthetic-token'not in json.dumps(out) and 'private synthetic response'not in json.dumps(out)


def test_unknown_programming_failure_is_not_silently_swallowed():
    files={'cards/x':'fixture'};p=es.plan_by_directory(list(files),{},files)
    with patch.object(es,'commit',side_effect=ValueError('fixture bug')):
        try:es.commit_grouped(list(files),files,'fixture','test',p)
        except ValueError:return
    raise AssertionError('Programming failure hidden')


def _main_fixture(mode):
    with tempfile.TemporaryDirectory()as temp:
        root=Path(temp);f=root/'a.json';g=root/'b.json';f.write_text('safe-a');g.write_text('safe-b')
        manifest=root/'manifest.json';manifest.write_text('{}');receipt=root/'receipt.json'
        files={'cards/a.json':f,'interop/ots/b.json':g};remote={};attempts=[];probes=[]
        if mode=='partial':remote={f'cards/old{i}':('different',None) for i in range(10000)}
        def send(rels,*args):
            attempts.extend(rels)
            for relative in rels:remote[relative]=(es.git_blob_sha(files[relative].read_bytes()),None)
        def probe(_files,rels,n):probes.extend(rels[:n]);return ['fixture failure']if mode=='bad-anon'else []
        args=['evidence_sync.py','--apply','--manifest',str(manifest),'--receipt',str(receipt),'--probe','1']
        code=0
        with patch.object(sys,'argv',args),patch.dict(os.environ,{'HF_TOKEN':'synthetic-fixture'}),patch.object(es,'local_files',return_value=files),patch.object(es,'remote_tree',side_effect=lambda *a,**k:dict(remote)),patch.object(es,'commit',send),patch.object(es,'anon_probe',probe):
            try:es.main()
            except SystemExit as error:code=error.code
        return code,json.loads(receipt.read_text()),attempts,probes


def test_main_partial_sync_keeps_publication_blocked_and_probes_success():
    code,receipt,attempts,probes=_main_fixture('partial')
    assert code==6 and receipt['state']=='PARTIAL_SYNC' and receipt['uploaded']is None
    assert attempts==['interop/ots/b.json'] and probes==['interop/ots/b.json']
    assert receipt['directories']['cards']['state']=='OVER_DIRECTORY_LIMIT'
    assert receipt['verified_matching']==1 and receipt['remaining']==1


def test_main_full_sync_probes_each_successful_directory():
    code,receipt,attempts,probes=_main_fixture('complete')
    assert code==0 and receipt['state']=='IN_SYNC' and receipt['uploaded']==2
    assert set(probes)==set(attempts) and len(probes)==2


def test_main_anonymous_failure_is_not_success():
    code,receipt,_,_=_main_fixture('bad-anon')
    assert code==7 and receipt['state']=='ANON_READBACK_FAILED' and receipt['uploaded']is None


def test_lost_remote_readback_preserves_unknown_upload_count():
    with tempfile.TemporaryDirectory()as temp:
        root=Path(temp);f=root/'a';f.write_text('safe');m=root/'m.json';m.write_text('{}');receipt=root/'r.json'
        with patch.object(sys,'argv',['sync','--apply','--manifest',str(m),'--receipt',str(receipt)]),patch.dict(os.environ,{'HF_TOKEN':'fixture'}),patch.object(es,'local_files',return_value={'cards/a':f}),patch.object(es,'remote_tree',side_effect=[{},SystemExit('HTTP 503')]),patch.object(es,'commit',return_value=None):
            try:es.main()
            except SystemExit as error:assert error.code==6
        result=json.loads(receipt.read_text());assert result['state']=='READBACK_UNAVAILABLE'and result['uploaded']is None


def test_verification_exceptions_replace_stale_success_receipts():
    for mode, expected_state, expected_code in (
        ('anonymous-network-after-upload', 'ANON_READBACK_FAILED', 7),
        ('anonymous-network-check-mode', 'ANON_READBACK_FAILED', 7),
        ('malformed-tree-after-upload', 'READBACK_UNAVAILABLE', 6),
    ):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            source = root / 'a.json'; source.write_text('safe')
            manifest = root / 'manifest.json'; manifest.write_text('{}')
            receipt = root / 'receipt.json'
            receipt.write_text(json.dumps({'state': 'IN_SYNC', 'at': 'previous-run', 'uploaded': 10}))
            matching = {'cards/a.json': (es.git_blob_sha(source.read_bytes()), None)}
            listing = [matching] if mode == 'anonymous-network-check-mode' else [{}, matching]
            if mode == 'malformed-tree-after-upload':
                listing[1] = json.JSONDecodeError('private response', '?', 0)
            argv = ['sync', '--manifest', str(manifest), '--receipt', str(receipt)]
            if mode != 'anonymous-network-check-mode':
                argv.append('--apply')
            with patch.object(sys, 'argv', argv), \
                    patch.dict(os.environ, {'HF_TOKEN': 'offline-fixture'}, clear=True), \
                    patch.object(es, 'local_files', return_value={'cards/a.json': source}), \
                    patch.object(es, 'remote_tree', side_effect=listing), \
                    patch.object(es, 'commit', return_value=None), \
                    patch.object(es, 'anon_probe', side_effect=urllib.error.URLError('private response')), \
                    patch.object(es, 'req', side_effect=AssertionError('network forbidden')):
                try:
                    es.main()
                except SystemExit as error:
                    assert error.code == expected_code
                else:
                    raise AssertionError('verification failure returned success')
            result = json.loads(receipt.read_text())
            assert result['state'] == expected_state and result['uploaded'] is None
            assert result['at'] != 'previous-run'
            assert 'private response' not in json.dumps(result)


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
