#!/usr/bin/env python3
"""Publish committed evaluation mirrors with a compare-and-swap Hub commit.
Run the documented CPU qualification before --apply.

Dry-run by default. --apply needs --expected-head and a clean, committed source tree.
This does not merge a PR, deploy the website, invoke inference, or publish any measured score.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACK = "public/bench/lm-eval"
SPACE = "spaces/gspc-auto-measure"
ALIASES = {"mcp": "conformance", "oss": "openness", "prv": "provenance",
           "asi": "continuity", "det": "detector-interop", "art5": "art5-safeguard"}
SPACE_FILES = ["app.py", "measurement.py", "inference.py", "grader.py", "banks.json", "README.md", "requirements.txt"]


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def source_bytes(path, committed=False):
    raw = (ROOT / path).read_bytes()
    if committed:
        frozen = subprocess.check_output(["git", "show", f"HEAD:{path}"], cwd=ROOT)
        if raw != frozen:
            raise ValueError(f"uncommitted source bytes: {path}")
    return raw


def build_payload(target, commit, committed=False):
    manifest = json.loads(source_bytes(f"{PACK}/manifest.json", committed))
    # Validate every generated input, including the Space assets, before selecting either target.
    for entry in manifest["files"]:
        if digest(source_bytes(entry["path"], committed)) != entry["sha256"]:
            raise ValueError(f"generated manifest mismatch: {entry['path']}")
    if target == "pack":
        files = {str(path.relative_to(ROOT / PACK)): source_bytes(str(path.relative_to(ROOT)), committed)
                 for path in (ROOT / PACK).rglob("*") if path.is_file() and path.suffix in {".py", ".yaml", ".json", ".jsonl", ".md"}}
        payload = {f"lm-eval/{path}": raw for path, raw in files.items()}
        payload["README.md"] = files["README.md"]
        for old, axis in ALIASES.items():
            payload[f"tasks/gspc_{old}.yaml"] = (
                f"# Compatibility alias generated from the canonical pack.\n"
                f"include: ../lm-eval/{axis}/{axis}.yaml\ntask: gspc_{old}\n").encode()
        payload["tasks/utils.py"] = b'''"""Deprecated entry point; delegate Dataset filtering to the canonical pack."""
import importlib.util
from pathlib import Path
_path = Path(__file__).resolve().parents[1] / "lm-eval/provenance/utils.py"
_spec = importlib.util.spec_from_file_location("gspc_legacy_filter", _path)
_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_module)
filter_canaries = _module.process_docs
'''
    else:
        paths = SPACE_FILES + [str(path.relative_to(ROOT / SPACE)) for path in (ROOT / SPACE / "banks").glob("*.jsonl")]
        payload = {path: source_bytes(f"{SPACE}/{path}", committed) for path in paths}
        payload["README.md"] = payload["README.md"].replace(b"/tree/master/spaces/gspc-auto-measure",
            f"/tree/{commit}/spaces/gspc-auto-measure".encode())
    release = {"schema": "csoai.evaluation-source/1", "repository": "CSOAI-ORG/councilof-ai",
               "commit": commit, "target": target, "producer": "scripts/surface/publish-hf-evaluation.py",
               "files": {path: digest(raw) for path, raw in sorted(payload.items())},
               "publisher_model_calls": 0, "writes_board": False}
    payload["SOURCE_REVISION.json"] = (json.dumps(release, indent=2, sort_keys=True) + "\n").encode()
    return payload


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--target", choices=["pack", "auto-measure"], required=True)
    parser.add_argument("--expected-head")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    if args.apply and not args.expected_head:
        parser.error("--apply requires --expected-head from a fresh Hub read")
    if args.apply:
        for producer in ["scripts/surface/publish-hf-evaluation.py", "scripts/surface/build-lm-eval-tasks.mjs",
                         "harness/gspc-top100/mill_hub_queue.py"]:
            source_bytes(producer, committed=True)
        subprocess.run(["node", "scripts/surface/build-lm-eval-tasks.mjs", "--check"], cwd=ROOT, check=True)
    payload = build_payload(args.target, commit, committed=args.apply)
    repo, kind = ("csoai/gspc-lm-eval-tasks", "dataset") if args.target == "pack" else ("csoai/gspc-auto-measure", "space")
    plan = {"repo": repo, "type": kind, "source_commit": commit, "files": len(payload),
            "bytes": sum(map(len, payload.values())), "apply": args.apply}
    if not args.apply:
        print(json.dumps(plan))
        return
    from huggingface_hub import HfApi, CommitOperationAdd, hf_hub_download
    api = HfApi()
    identity = api.whoami()
    if not any(org.get("name") == "csoai" for org in identity.get("orgs", [])):
        raise PermissionError("authenticated account is not a csoai organization member")
    info = api.repo_info(repo, repo_type=kind)
    if info.sha != args.expected_head:
        raise ValueError("Hub head moved; read and review the new revision before publishing")
    if info.private:
        raise ValueError("expected public mirror; refusing visibility/source mismatch")
    result = api.create_commit(repo_id=repo, repo_type=kind, parent_commit=args.expected_head,
        commit_message=f"Mirror evaluation contracts from Council source {commit[:12]}",
        operations=[CommitOperationAdd(path_in_repo=path, path_or_fileobj=raw) for path, raw in sorted(payload.items())])
    verified = 0
    for path, expected in payload.items():
        actual = Path(hf_hub_download(repo, path, repo_type=kind, revision=result.oid)).read_bytes()
        if digest(actual) != digest(expected):
            raise ValueError(f"published byte mismatch at {path}")
        verified += 1
    receipt = {**plan, "previous_hub_commit": args.expected_head, "hub_commit": result.oid,
               "hub_url": result.commit_url, "verified_files": verified, "model_calls": 0, "writes_board": False}
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt))


if __name__ == "__main__":
    main()
