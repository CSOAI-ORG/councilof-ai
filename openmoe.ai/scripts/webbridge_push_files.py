#!/usr/bin/env python3
"""webbridge_push_files.py — Push local files to a GitHub repo via the
Kimi WebBridge daemon (127.0.0.1:10086). Uses the GitHub web UI's
"create new file" form for text files, "upload files" for binaries."""
import argparse, json, os, sys, time, urllib.request
DAEMON_URL = "http://127.0.0.1:10086/command"

def call(action, args=None, session="webbridge-push"):
    payload = {"action": action, "args": args or {}, "session": session}
    req = urllib.request.Request(DAEMON_URL, data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def get_refs(session):
    snap = call("snapshot", session=session)
    if not snap.get("ok"): return {}
    tree = snap.get("data", {}).get("tree", "")
    refs = {}
    def walk(node):
        if isinstance(node, list):
            for n in node: walk(n)
        elif isinstance(node, dict):
            r, n, x = node.get("ref",""), node.get("name",""), node.get("role","")
            if r and x in ("textbox","button"): refs[n] = r
            for c in node.get("children", []): walk(c)
    walk(tree)
    return refs

def push(repo, filepath, session="webbridge-push"):
    fn = os.path.basename(filepath)
    try:
        with open(filepath, encoding="utf-8") as f: content = f.read()
        is_bin = False
    except UnicodeDecodeError:
        is_bin, content = True, None
    if not is_bin and len(content) > 200_000:
        print(f"[skip] {fn} too large")
        return False
    print(f"[push] {fn} ({'binary' if is_bin else f'{len(content)} bytes'})")
    o, r = repo.split("/", 1)
    if is_bin:
        call("navigate", {"url": f"https://github.com/{o}/{r}/upload/main", "newTab": False}, session=session)
        time.sleep(2)
        rr = call("upload", {"selector": "input[type=file]", "files": [filepath]}, session=session)
        if not rr.get("ok"):
            print(f"[skip] binary upload failed: {rr}")
            return False
        time.sleep(3)
        refs = get_refs(session)
        cb = next((v for k, v in refs.items() if k.startswith("Commit changes")), None)
        if cb: call("click", {"selector": cb}, session=session)
        time.sleep(1)
        refs = get_refs(session)
        for k, v in refs.items():
            if k == "Commit changes":
                call("click", {"selector": v}, session=session)
                break
        time.sleep(3)
        return True
    call("navigate", {"url": f"https://github.com/{o}/{r}/new/main", "newTab": False}, session=session)
    time.sleep(2)
    refs = get_refs(session)
    fnref = refs.get("File name", refs.get("file name"))
    cref = next((v for k, v in refs.items() if "Editing" in k and "file contents" in k), None)
    if not fnref or not cref:
        print(f"[skip] no refs found: {list(refs)[:8]}")
        return False
    call("fill", {"selector": fnref, "value": fn}, session=session)
    time.sleep(0.5)
    rr = call("fill", {"selector": cref, "value": content}, session=session)
    if not rr.get("ok"):
        print(f"[skip] fill failed: {rr}")
        return False
    time.sleep(1)
    refs = get_refs(session)
    cb = next((v for k, v in refs.items() if k.startswith("Commit changes")), None)
    if cb: call("click", {"selector": cb}, session=session)
    time.sleep(1)
    refs = get_refs(session)
    for k, v in refs.items():
        if k == "Commit changes":
            call("click", {"selector": v}, session=session)
            break
    time.sleep(3)
    print(f"[ok] {fn}")
    return True

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--files", nargs="+", required=True)
    a = ap.parse_args()
    ok = fail = 0
    for f in a.files:
        if not os.path.exists(f):
            print(f"[missing] {f}"); fail += 1; continue
        if push(a.repo, f): ok += 1
        else: fail += 1
    print(f"\n[summary] ok={ok} fail={fail}")

if __name__ == "__main__":
    main()
