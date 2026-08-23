#!/usr/bin/env python3
"""Push /tmp/mcp-align-*.json batches via GitHub MCP-equivalent git API."""
import json
import socket
import os
import sys
import time
import urllib.request
import urllib.error

OWNER, REPO, BRANCH = "CSOAI-ORG", "councilof-ai", "cursor/instruments-catalog-7fb8"
SOCK = os.environ.get("CURSOR_AGENT_SOCKET", "/run/cursor/api.sock")


def get_token():
    for aud in ("https://github.com/CSOAI-ORG", "https://api.github.com", "github.com"):
        try:
            body = json.dumps({"aud": aud})
            s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            s.settimeout(10)
            s.connect(SOCK)
            hdr = (
                f"POST /v1/tokens/oidc HTTP/1.1\r\n"
                f"Host: localhost\r\n"
                f"Content-Type: application/json\r\n"
                f"Content-Length: {len(body)}\r\n\r\n"
            )
            s.sendall((hdr + body).encode())
            chunks = []
            while True:
                try:
                    c = s.recv(65536)
                    if not c:
                        break
                    chunks.append(c)
                except socket.timeout:
                    break
            s.close()
            payload = json.loads(b"".join(chunks).decode().split("\r\n\r\n", 1)[-1])
            token = payload.get("token")
            if token:
                return token
        except Exception:
            continue
    raise RuntimeError("Could not obtain OIDC token")


def api(token, method, path, data=None):
    url = f"https://api.github.com{path}"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "User-Agent": "council-align-push",
    }
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def push_files(token, args):
    base_sha = api(token, "GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{BRANCH}")["object"]["sha"]
    base_tree = api(token, "GET", f"/repos/{OWNER}/{REPO}/git/commits/{base_sha}")["tree"]["sha"]
    tree_items = []
    for f in args["files"]:
        blob = api(
            token,
            "POST",
            f"/repos/{OWNER}/{REPO}/git/blobs",
            {"content": f["content"], "encoding": "utf-8"},
        )
        tree_items.append({"path": f["path"], "mode": "100644", "type": "blob", "sha": blob["sha"]})
    tree = api(token, "POST", f"/repos/{OWNER}/{REPO}/git/trees", {"base_tree": base_tree, "tree": tree_items})
    commit = api(
        token,
        "POST",
        f"/repos/{OWNER}/{REPO}/git/commits",
        {"message": args["message"], "tree": tree["sha"], "parents": [base_sha]},
    )
    api(token, "PATCH", f"/repos/{OWNER}/{REPO}/git/refs/heads/{BRANCH}", {"sha": commit["sha"]})
    return commit["sha"]


def main():
    paths = sys.argv[1:] or sorted(
        [f"/tmp/mcp-align-{i}.json" for i in range(1, 8)]
        + ["/tmp/mcp-align-1a.json", "/tmp/mcp-align-1b.json"]
    )
    token = get_token()
    for path in paths:
        if not os.path.exists(path):
            print("skip", path)
            continue
        args = json.load(open(path))
        sha = push_files(token, args)
        print("OK", path, sha, [f["path"] for f in args["files"]])
        time.sleep(0.5)


if __name__ == "__main__":
    main()
