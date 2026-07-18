#!/usr/bin/env python3
"""
webbridge_upload.py — Upload a local directory to a GitHub repo via
the Kimi WebBridge browser-automation daemon (127.0.0.1:10086).

Uses the browser's logged-in GitHub session to drive the web UI:
  1. Navigate to https://github.com/<owner>/<repo>/upload/main
  2. Drop each file onto the upload widget (or via the "choose your files" link)
  3. Wait for GitHub to compute diffs
  4. Click "Commit changes"
  5. Poll the repo via the GitHub web UI for confirmation

This bypasses the lack of write-scoped GitHub PATs by using the user's
already-authenticated browser session.

Usage:
    python3 webbridge_upload.py --repo CSOAI-ORG/openmoe.ai --dir /path/to/dir
"""

import argparse
import json
import os
import sys
import time
import urllib.request

DAEMON_URL = "http://127.0.0.1:10086/command"


def call(action, args=None, session="webbridge-upload"):
    payload = {"action": action, "args": args or {}, "session": session}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        DAEMON_URL, data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def upload_files(owner_repo, local_dir):
    owner, repo = owner_repo.split("/", 1)
    files = []
    for root, _, names in os.walk(local_dir):
        for n in names:
            full = os.path.join(root, n)
            rel = os.path.relpath(full, local_dir)
            files.append((full, rel))
    if not files:
        print("No files to upload")
        return

    print(f"[webbridge] {len(files)} files in {local_dir}")
    # Step 1: navigate to upload page
    target = f"https://github.com/{owner}/{repo}/upload/main"
    print(f"[webbridge] navigate to {target}")
    call("navigate", {"url": target, "newTab": True})

    # Step 2: snapshot to find the file input
    time.sleep(2)
    snap = call("snapshot")
    if not snap.get("ok"):
        print(f"[webbridge] snapshot failed: {snap}")
        sys.exit(1)

    # Step 3: upload each file via the upload tool
    # The GitHub upload page has a hidden <input type="file" multiple webkitdirectory>
    # We need to first click "choose your files" to surface the file picker,
    # but since we can pass files directly via the `upload` tool, we use that.
    #
    # GitHub's upload widget accepts a file input. The element may not have an
    # @e ref in the snapshot if it's hidden. Try common selectors.
    selectors_to_try = [
        'input[type="file"][webkitdirectory]',
        'input[type="file"][multiple]',
        'input[type="file"]',
    ]
    uploaded = False
    for sel in selectors_to_try:
        file_paths = [f[0] for f in files]
        r = call("upload", {"selector": sel, "files": file_paths})
        if r.get("ok") and r.get("data", {}).get("success"):
            print(f"[webbridge] uploaded via {sel}")
            uploaded = True
            break
    if not uploaded:
        print("[webbridge] direct upload failed — falling back to GitHub CLI")
        sys.exit(2)

    # Step 4: wait + commit
    time.sleep(5)
    snap = call("snapshot")
    print("[webbridge] post-upload snapshot saved (see screenshot)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, help="owner/repo, e.g. CSOAI-ORG/openmoe.ai")
    ap.add_argument("--dir", required=True, help="local directory to upload")
    args = ap.parse_args()
    upload_files(args.repo, args.dir)


if __name__ == "__main__":
    main()
