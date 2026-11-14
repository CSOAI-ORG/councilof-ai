"""Dry-run public comparison never needs a write identity; actual writes still do."""
import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace
import pytest

spec=importlib.util.spec_from_file_location("gspc_spray_preview_test",Path(__file__).with_name("gspc-spray.py"))
spray=importlib.util.module_from_spec(spec);spec.loader.exec_module(spray)

@pytest.fixture
def environment(monkeypatch,tmp_path):
    events=[]
    class FakeApi:
        def __init__(self,**kwargs):events.append("api_created")
        def whoami(self):events.append("whoami");raise RuntimeError("synthetic missing permission")
        def upload_folder(self,**kwargs):events.append("WRITE");raise AssertionError("unexpected upload")
    monkeypatch.setitem(sys.modules,"huggingface_hub",SimpleNamespace(HfApi=FakeApi))
    monkeypatch.setattr(spray,"built_files",lambda p:{"board.json":b"public"})
    monkeypatch.setattr(spray,"remote_snapshot",lambda url:None)
    monkeypatch.setattr(spray,"fetch_ok",lambda url,timeout=60:b"public")
    return events,tmp_path,{"as_of":"2026-09-26T00:00:00Z","fingerprint":"f"*64}

@pytest.mark.parametrize("force",[False,True])
def test_preview_of_changed_public_snapshot_never_creates_auth_client(environment,force):
    events,path,truth=environment
    result=spray.spray_hf(truth,path,dry_run=True,force=force)
    assert [row["status"] for row in result]==["DRY-RUN","DRY-RUN"]
    assert events==[]


def test_unchanged_public_preview_still_checks_actual_bytes(environment,monkeypatch):
    events,path,truth=environment
    monkeypatch.setattr(spray,"remote_snapshot",lambda url:dict(truth))
    rows=spray.spray_hf(truth,path,dry_run=True,force=False)
    assert [r["status"] for r in rows]==["UNCHANGED","UNCHANGED"]
    assert events==[]


def test_changed_bytes_same_timestamp_do_not_get_unchanged(environment,monkeypatch):
    events,path,truth=environment
    monkeypatch.setattr(spray,"remote_snapshot",lambda url:dict(truth))
    monkeypatch.setattr(spray,"fetch_ok",lambda url,timeout=60:b"different")
    assert [r["status"] for r in spray.spray_hf(truth,path,dry_run=True,force=False)]==["DRY-RUN","DRY-RUN"]
    assert events==[]


def test_publish_still_refuses_missing_authorization(environment):
    events,path,truth=environment
    rows=spray.spray_hf(truth,path,dry_run=False,force=False)
    assert len(rows)==1 and rows[0]["status"]=="BLOCKED"
    assert events==["api_created","whoami"]


def test_preview_works_without_hub_sdk(environment,monkeypatch):
    events,path,truth=environment
    monkeypatch.setitem(sys.modules,"huggingface_hub",None)
    assert [r["status"] for r in spray.spray_hf(truth,path,dry_run=True,force=False)]==["DRY-RUN","DRY-RUN"]
    assert events==[]
