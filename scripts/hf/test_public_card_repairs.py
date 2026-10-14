"""Offline checks of exact selected publisher functions; no network or source-runtime imports."""
from __future__ import annotations
import argparse, ast, copy, importlib.metadata, json, os, re, shutil, sys, tempfile, types, unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]

def selected(path, names, extra=None):
    nodes = []
    for node in ast.parse(path.read_text(encoding="utf-8")).body:
        if isinstance(node, (ast.FunctionDef, ast.ClassDef)) and node.name in names:
            nodes.append(node)
        elif isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id in names for t in node.targets):
            nodes.append(node)
    ns = dict(__name__="offline", __doc__="", Path=Path, json=json, re=re, os=os, shutil=shutil,
              tempfile=tempfile, argparse=argparse, sys=sys)
    ns.update(extra or {})
    exec(compile(ast.Module(body=nodes, type_ignores=[]), str(path), "exec"), ns)
    return types.SimpleNamespace(**ns), ns

def kaggle():
    return selected(ROOT / "scripts/spray/gspc-spray.py",
        {"KAGGLE_ID", "KAGGLE_LICENCE_NAMES", "KAGGLE_TYPED_READ_VERSIONS", "Refused", "kaggle_licences", "kaggle_read_metadata", "kaggle_metadata_payload",
         "kaggle_metadata_drift", "kaggle_page_text", "spray_kaggle", "BANNED", "BOARD_URL", "DID_URL",
         "VERIFY_URL", "HOWTO_URL", "ZENODO_METHODOLOGY_DOI", "ZENODO_CONCEPT"})

def cards():
    return selected(ROOT / "scripts/hf/hf-org-card.py",
        {"LEGACY_LINE_RULES", "TYPED_LID", "TYPED_MCP_ROW", "LID_POINTER", "MCP_POINTER", "BIB_DOI",
         "NORMALIZED_GUIDE", "NORMALIZED_LEGACY_GUIDE", "NORMALIZED_BLOCK", "scrub_legacy", "clean_card",
         "scrub", "main", "API", "MCP", "ORG", "TARGETS", "DOI"}, {"now_iso": lambda: "TEST"})

def settings(licence="CC-BY-4.0"):
    return dict(title="Existing title", subtitle="old", description="old", isPrivate=True,
                collaborators=[dict(username="owner", role="admin")], keywords=["a","b","c","d","e","f"],
                resources=[dict(path="board.json", description="original")],
                userSpecifiedSources=["original"], expectedUpdateFrequency="daily",
                licenses=[dict(name=licence)])

class KaggleGuards(unittest.TestCase):
    def setUp(self):
        self.api, self.ns = kaggle()
        self.board = dict(totals=dict(license="CC-BY-4.0"))

    def test_known_matching_licence(self):
        self.assertEqual(self.api.kaggle_licences(self.board, settings()), [dict(name="CC-BY-4.0")])

    def test_conflict_needs_exact_owner_pair_and_never_mutates(self):
        info = settings("CC0-1.0"); before = copy.deepcopy(info)
        for approval in (None, ("CC-BY-4.0", "CC0-1.0"), ("other", "CC-BY-4.0")):
            with self.subTest(approval=approval), self.assertRaises(self.api.Refused):
                self.api.kaggle_licences(self.board, info, approval)
        self.assertEqual(self.api.kaggle_licences(self.board, info, ("CC0-1.0","CC-BY-4.0")), [dict(name="CC-BY-4.0")])
        self.assertEqual(info, before)

    def test_unknown_missing_multiple_conflicting_licences_refuse(self):
        for info in ({}, {"licenses":[]}, {"licenses":[{"name":"unknown"}]},
                     {"licenses":[{"name":"CC0-1.0"},{"name":"CC-BY-4.0"}]},
                     {"licenses":[{"name":"CC-BY-4.0"}],"licenseName":"CC0: Public Domain"}):
            with self.subTest(info=info), self.assertRaises(self.api.Refused):
                self.api.kaggle_licences(self.board, info, ("CC0-1.0","CC-BY-4.0"))
        with self.assertRaises(self.api.Refused):
            self.api.kaggle_licences({"totals":{"license":"unknown"}}, settings())

    def test_metadata_retains_settings_and_original(self):
        info = settings(); before = copy.deepcopy(info)
        new = self.api.kaggle_metadata_payload(info, "new subtitle", "new description", info["licenses"])
        for key in ("title","isPrivate","collaborators","keywords","resources","userSpecifiedSources","expectedUpdateFrequency"):
            self.assertEqual(new[key], info[key])
        self.assertEqual(info,before)

    def test_missing_complete_settings_refuses(self):
        for field in ("title","isPrivate","collaborators"):
            info=settings(); del info[field]
            with self.subTest(field=field), self.assertRaises(self.api.Refused):
                self.api.kaggle_metadata_payload(info,"sub","desc",[dict(name="CC-BY-4.0")])

    def test_malformed_privacy_or_collaborators_refuse(self):
        for field,value in (("isPrivate",None),("isPrivate",1),("collaborators",None),("collaborators",[{"username":"owner"}])):
            info=settings(); info[field]=value
            with self.subTest(field=field,value=value),self.assertRaises(self.api.Refused):
                self.api.kaggle_metadata_payload(info,"sub","desc",[dict(name="CC-BY-4.0")])

    def test_readback_rejects_protected_changes(self):
        info=settings()
        self.assertIsNone(self.api.kaggle_metadata_drift(info,"old","old",info["licenses"],info))
        for field,value in (("description","wrong"),("licenses",[dict(name="CC0-1.0")]),("isPrivate",False),
                            ("collaborators",[]),("keywords",[]),("title","wrong")):
            changed=copy.deepcopy(info); changed[field]=value
            with self.subTest(field=field):
                self.assertIsNotNone(self.api.kaggle_metadata_drift(changed,"old","old",info["licenses"],info))

    def test_did_link_and_original_capture_time(self):
        _,desc=self.api.kaggle_page_text(dict(as_of="2026-10-13T03:31:42Z",read_at="2026-10-13T17:08:02Z",
                                            lid="TIE is TIE",board={},fingerprint="test"))
        self.assertIn("[DID document](https://councilof.ai/.well-known/did.json)",desc)
        self.assertIn("read at 2026-10-13T17:08:02Z",desc)

    def invoke(self, mismatch=False, corrupt=None):
        info=settings(); calls=[]; remote={"SNAPSHOT.json":b"{}"}
        def run(args,check=False):
            calls.append(args); directory=Path(args[args.index("-p")+1])
            if "--update" in args:
                info.update(json.loads((directory/"dataset-metadata.json").read_text()))
                if corrupt: info[corrupt]=False if corrupt=="isPrivate" else []
            else: (directory/"dataset-metadata.json").write_text(json.dumps(info))
            return types.SimpleNamespace(returncode=0,stdout="",stderr="")
        self.ns.update(run=run,kaggle_read_metadata=lambda:{"info":copy.deepcopy(info)},
                       kaggle_public_files=lambda:remote,kaggle_page_text=lambda tr:("new sub","new desc"),
                       unchanged=lambda *a:"same",built_files=lambda p:remote,log=lambda *a:None,
                       byte_parity_reason=lambda a,b:"mismatch" if mismatch else None,
                       wait_for=lambda check,**kw:check(),result=lambda surface,status,*a,**kw:dict(status=status))
        with patch.object(shutil,"which",return_value="kaggle"),patch.dict(os.environ,{"KAGGLE_USERNAME":"offline","KAGGLE_KEY":"offline"}):
            result=self.api.spray_kaggle(dict(board=self.board,as_of="2026-10-13T03:31:42Z"),Path("/unused"),
                                         dry_run=False,force=False,metadata_only=True)
        return result,calls

    def test_metadata_only_does_not_upload_version(self):
        result,calls=self.invoke()
        self.assertEqual(result[0]["status"],"PUBLISHED")
        self.assertTrue(any("--update" in c for c in calls))
        self.assertTrue(all("version" not in c for c in calls))

    def test_metadata_only_refuses_byte_mismatch(self):
        with self.assertRaises(self.api.Refused): self.invoke(mismatch=True)

    def test_changed_privacy_or_collaborators_never_pass(self):
        for field in ("isPrivate","collaborators"):
            result,_=self.invoke(corrupt=field)
            self.assertEqual(result[0]["status"],"PUBLISHED-METADATA-UNCONFIRMED")


    def typed_read(self, info=None, error=None, versions=("2.2.4","0.1.35")):
        if info is None:
            info=dict(ownerUser="nicktempleman",datasetSlug="csoai-gspc-living-board",
                      isPrivate=False,collaborators=[],licenses=[dict(name="CC0-1.0")])
        captured={}
        class Response:
            error_message=error
            def to_json(self, **kw):
                captured.update(kw)
                return json.dumps(dict(info=info))
        def get(request):
            captured["owner"]=request.owner_slug; captured["slug"]=request.dataset_slug
            return Response()
        client=types.SimpleNamespace(datasets=types.SimpleNamespace(dataset_api_client=types.SimpleNamespace(get_dataset_metadata=get)))
        class Context:
            def __enter__(self): return client
            def __exit__(self,*a): return False
        api=types.SimpleNamespace(build_kaggle_client=lambda:Context())
        modules={"kaggle":types.SimpleNamespace(api=api),
                 "kagglesdk":types.ModuleType("kagglesdk"),
                 "kagglesdk.datasets":types.ModuleType("kagglesdk.datasets"),
                 "kagglesdk.datasets.types":types.ModuleType("kagglesdk.datasets.types"),
                 "kagglesdk.datasets.types.dataset_api_service":types.SimpleNamespace(ApiGetDatasetMetadataRequest=types.SimpleNamespace)}
        with patch.dict(sys.modules,modules),patch.object(importlib.metadata,"version",side_effect=lambda name:versions[0 if name=="kaggle" else 1]):
            result=self.api.kaggle_read_metadata()
        return result,captured

    def test_typed_metadata_preserves_false_and_empty_without_defaults_guessing(self):
        result,captured=self.typed_read()
        self.assertIs(result["info"]["isPrivate"],False)
        self.assertEqual(result["info"]["collaborators"],[])
        self.assertIs(captured["ignore_defaults"],False)
        self.assertEqual((captured["owner"],captured["slug"]),("nicktempleman","csoai-gspc-living-board"))

    def test_unknown_sdk_schema_refuses_before_request(self):
        with self.assertRaises(self.api.Refused):
            self.typed_read(versions=("2.2.4","different"))

    def test_typed_metadata_error_or_other_owner_refuses(self):
        with self.assertRaises(self.api.Refused): self.typed_read(error="not permitted")
        with self.assertRaises(self.api.Refused):
            self.typed_read(info=dict(ownerUser="other",datasetSlug="csoai-gspc-living-board",isPrivate=False,collaborators=[]))

    def test_missing_or_malformed_typed_settings_refuse(self):
        for fields in ({},{"isPrivate":False},{"isPrivate":None,"collaborators":[]},{"isPrivate":False,"collaborators":None}):
            info=dict(ownerUser="nicktempleman",datasetSlug="csoai-gspc-living-board",**fields)
            with self.subTest(fields=fields),self.assertRaises(self.api.Refused): self.typed_read(info=info)

class CardGuards(unittest.TestCase):
    def setUp(self): self.api,self.ns=cards()

    def test_model_pointer_preserves_no_weights_and_dated_history(self):
        history="<!-- csoai-archive-by-axis:start 2026-10-06 -->\n- ~GET https://councilof.ai/api/gspc~ → 23 axes · 23 measured\n<!-- csoai-archive-by-axis:end 2026-10-06 -->\n"
        old="**No weights published.**\n**Lid:** 22 axes measured · 8 fact runs.\n- Live board: ~GET https://councilof.ai/api/gspc~ → **23 axes · 23 measured** (**23·23·0**). Quote ~totals.public_count~.\n"+history
        old=old.replace("~",chr(96)); history=history.replace("~",chr(96))
        new,changes=self.api.clean_card("csoai/clan-csoai-plain","model",old)
        self.assertTrue(changes); self.assertIn("**No weights published.**",new); self.assertIn(history,new)
        self.assertNotIn("22 axes measured",new); self.assertIn("totals.lid",new)
        self.assertIn("TIE is TIE",new); self.assertIn("UNTESTED",new)
        self.assertNotIn("**23·23·0**",new)
        self.assertEqual(self.api.clean_card("csoai/clan-csoai-plain","model",new),(new,[]))

    def test_normalized_managed_only_pinned_and_idempotent(self):
        text="schema\n"+self.api.NORMALIZED_LEGACY_GUIDE+"\nhistory\n"+self.api.NORMALIZED_LEGACY_GUIDE+"\nlicence\n"
        new,changes=self.api.clean_card("csoai/gspc-normalized","dataset",text)
        self.assertTrue(changes)
        self.assertEqual(new,"schema\n"+self.api.NORMALIZED_GUIDE+"\nhistory\n\nlicence\n")
        self.assertEqual(new.count("## Reuse the corpus"),1)
        self.assertEqual(new.count('revision="0d3e2a77f96d1b4cdb02ead4d01bb16a6900d203"'),1)
        self.assertEqual(self.api.clean_card("csoai/gspc-normalized","dataset",new),(new,[]))

    def test_unknown_normalized_managed_bytes_refuse(self):
        for text in ("hand edited",self.api.NORMALIZED_LEGACY_GUIDE.replace("Hub bank:","Edited bank:")):
            with self.subTest(text=text[:30]),self.assertRaises(ValueError):
                self.api.clean_card("csoai/gspc-normalized","dataset",text)

    def test_model_mode_cannot_publish_default_spaces(self):
        with patch.object(sys,"argv",["hf-org-card.py","--model-scrub","csoai/council-safe","--push"]),self.assertRaises(SystemExit) as raised:
            self.api.main()
        self.assertEqual(raised.exception.code,2)

    def test_only_readme_upload_at_observed_parent(self):
        with tempfile.TemporaryDirectory() as d:
            source=Path(d)/"original.md"; source.write_text("**No weights published.**\n**Lid:** 22 axes measured · 8 fact runs.\n")
            commits=[]
            class API:
                def repo_info(self,*a,**kw): return types.SimpleNamespace(sha="observed-parent")
                def hf_hub_download(self,*a,**kw):
                    if kw["revision"]!="observed-parent": raise AssertionError("not pinned")
                    return source
                def create_commit(self,repo,operations,**kw):
                    commits.append((operations,kw)); return types.SimpleNamespace(oid="test-commit")
            class Add:
                def __init__(self,**kw): self.__dict__.update(kw)
            self.ns["stale_hits"]=lambda text:[]
            with patch.dict(sys.modules,{"huggingface_hub":types.SimpleNamespace(HfApi=API,CommitOperationAdd=Add)}):
                self.api.scrub("csoai/council-safe",{"state":"COPY_ONLY"},True,Path(d)/"out",kind="model")
            self.assertEqual(len(commits),1)
            self.assertEqual([o.path_in_repo for o in commits[0][0]],["README.md"])
            self.assertEqual(commits[0][1]["parent_commit"],"observed-parent")
            self.assertEqual(commits[0][1]["repo_type"],"model")


class DailyRefusalIsolation(unittest.TestCase):
    def daily(self):
        class API:
            def list_datasets(self, **kw):
                return [types.SimpleNamespace(id="csoai/gspc-normalized")]
            def list_models(self, **kw):
                return [types.SimpleNamespace(id="csoai/council-safe")]
            def list_spaces(self, **kw): return []
        def clean(repo,kind,text):
            if repo=="csoai/gspc-normalized": raise ValueError("changed managed bytes")
            return "repaired",["live pointer"]
        hoc=types.SimpleNamespace(ORG="csoai",clean_card=clean)
        api,ns=selected(ROOT/"scripts/hf/hf-scrub-daily.py",
                        {"load","save","cmd_queue","cmd_run","MAX_TRIES","KINDS"},
                        {"hoc":hoc,"now":lambda:"TEST","card_text":lambda *a:("input","observed-parent")})
        module=types.SimpleNamespace(HfApi=API,CommitOperationAdd=object)
        return api,module

    def test_queue_persists_refused_row_and_continues(self):
        api,module=self.daily()
        with tempfile.TemporaryDirectory() as d,patch.dict(sys.modules,{"huggingface_hub":module}):
            state=Path(d)
            self.assertEqual(api.cmd_queue(state),1)
            rows=json.loads((state/"queue.json").read_text())["rows"]
            self.assertEqual(rows["dataset:csoai/gspc-normalized"]["state"],"refused")
            self.assertEqual(rows["dataset:csoai/gspc-normalized"]["parent"],"observed-parent")
            self.assertEqual(rows["model:csoai/council-safe"]["state"],"pending")

    def test_run_logs_refusal_and_continues_without_upload(self):
        api,module=self.daily()
        with tempfile.TemporaryDirectory() as d,patch.dict(sys.modules,{"huggingface_hub":module}):
            state=Path(d)
            (state/"queue.json").write_text(json.dumps({"rows":{
                "dataset:csoai/gspc-normalized":{"repo":"csoai/gspc-normalized","kind":"dataset","state":"pending"},
                "model:csoai/council-safe":{"repo":"csoai/council-safe","kind":"model","state":"pending"}}}))
            self.assertEqual(api.cmd_run(state,5,False),1)
            rows=json.loads((state/"queue.json").read_text())["rows"]
            self.assertEqual(rows["dataset:csoai/gspc-normalized"]["state"],"refused")
            entries=[json.loads(line) for line in (state/"runs.jsonl").read_text().splitlines()]
            self.assertEqual([row["result"] for row in entries],["refused","dry"])
            self.assertEqual(rows["model:csoai/council-safe"]["tries"],1)

if __name__=="__main__": unittest.main()
