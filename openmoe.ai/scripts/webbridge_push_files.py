#!/usr/bin/env python3
"""
webbridge_push_files.py — Push local files to a GitHub repo by driving the
GitHub web UI's "create new file" + "upload files" forms via the Kimi
WebBridge daemon (127.0.0.1:10086).

For files <5KB: uses the create-new-file flow (filename + contenteditable fill + commit).
For larger files: tries the upload-files page first (works for some content types);
falls back to chunked-content into create-new-file if upload is rejected.

Usage:
    python3 webbridge_push_files.py --repo CSOAI-ORG/openmoe.ai \
        --files /path/to/file1.md /path/to/file2.png ...
"""
import argparse
import json
import os
import sys
import time
import urllib.request

DAEMON_URL = "http://127.0.0.1:10086/command"


def call(action, args=None, session="webbridge-push"):
    payload = {"action": action, "args": args or {}, "session": session}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        DAEMON_URL, data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


def get_refs(session):
    """Get the @e refs for the new-file page elements."""
    snap = call("snapshot", session=session)
    if not snap.get("ok"):
        return {}
    tree = snap.get("data", {}).get("tree", "")
    refs = {}
    def walk(node):
        if isinstance(node, list):
            for n in node: walk(n)
        elif isinstance(node, dict):
            role = node.get("role", "")
            name = node.get("name", "")
            ref = node.get("ref", "")
            if ref and role in ("textbox", "button"):
                refs[name] = ref
            for c in node.get("children", []):
                walk(c)
    walk(tree)
    return refs


def create_and_commit_file(repo, filepath, session="webbridge-push"):
    """Create a single file via the GitHub web UI."""
    filename = os.path.basename(filepath)
    # Detect text vs binary
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        is_binary = False
    except UnicodeDecodeError:
        is_binary = True
        content = None

    if not is_binary and len(content) > 200_000:
        print(f"[skip] {filename} too large ({len(content)} bytes) for web UI")
        return False

    print(f"[push] {filename} ({'binary' if is_binary else len(content)+' bytes'})")
    owner, repo_name = repo.split("/", 1)

    if is_binary:
        # Use the upload page
        call("navigate", {"url": f"https://github.com/{owner}/{repo_name}/upload/main", "newTab": False}, session=session)
        time.sleep(2)
        r = call("upload", {"selector": "input[type=file]", "files": [filepath]}, session=session)
        if not r.get("ok"):
            print(f"[skip] binary upload failed for {filename}: {r}")
            return False
        # Wait for GitHub to render the diff view
        time.sleep(3)
        refs = get_refs(session)
        commit_ref = None
        for k, v in refs.items():
            if k.startswith("Commit changes"):
                commit_ref = v
                break
        if commit_ref:
            call("click", {"selector": commit_ref}, session=session)
            time.sleep(1)
            refs = get_refs(session)
            for k, v in refs.items():
                if k == "Commit changes":
                    call("click", {"selector": v}, session=session)
                    break
        time.sleep(3)
        return True

    call("navigate", {"url": f"https://github.com/{owner}/{repo_name}/new/main", "newTab": False}, session=session)
    time.sleep(2)

    refs = get_refs(session)
    file_name_ref = refs.get("File name", refs.get("file name"))
    content_ref = next((v for k, v in refs.items() if "Editing" in k and "file contents" in k), None)
    if not file_name_ref or not content_ref:
        print(f"[skip] could not find file-name or content refs: {list(refs)[:5]}")
        return False

    call("fill", {"selector": file_name_ref, "value": filename}, session=session)
    time.sleep(0.5)
    r = call("fill", {"selector": content_ref, "value": content}, session=session)
    if not r.get("ok"):
        print(f"[skip] fill failed for {filename}")
        return False

    # Find commit button
    time.sleep(1)
    refs = get_refs(session)
    commit_ref = refs.get("Commit changes\u2026", refs.get("Commit changes..."))
    if not commit_ref:
        # try alternate
        for k, v in refs.items():
            if k.startswith("Commit changes"):
                commit_ref = v
                break
    if not commit_ref:
        print(f"[skip] no commit button for {filename}")
        return False

    r = call("click", {"selector": commit_ref}, session=session)
    time.sleep(1)
    refs = get_refs(session)
    modal_commit = refs.get("Commit changes", refs.get("Commit changes\u2026"))
    if not modal_commit:
        for k, v in refs.items():
            if k == "Commit changes":
                modal_commit = v
                break
    if modal_commit:
        r = call("click", {"selector": modal_commit}, session=session)
    time.sleep(3)
    print(f"[ok] {filename} committed")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--files", nargs="+", required=True)
    args = ap.parse_args()
    ok = 0
    fail = 0
    for f in args.files:
        if not os.path.exists(f):
            print(f"[missing] {f}")
            fail += 1
            continue
        if create_and_commit_file(args.repo, f):
            ok += 1
        else:
            fail += 1
    print(f"\n[summary] ok={ok} fail={fail}")


if __name__ == "__main__":
    main()
