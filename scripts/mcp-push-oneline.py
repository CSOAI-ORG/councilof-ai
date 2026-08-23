#!/usr/bin/env python3
"""Push /tmp/mcp-oneline/*.json via local GitHub MCP server (sequential)."""
import json
import os
import subprocess
import sys
import time

MCP = "/home/ubuntu/.npm/_npx/3dfbf5a9eea4a1b3/node_modules/@modelcontextprotocol/server-github/dist/index.js"


def send_msg(proc, msg):
    body = json.dumps(msg).encode()
    proc.stdin.write(f"Content-Length: {len(body)}\r\n\r\n".encode() + body)
    proc.stdin.flush()


def read_msg(proc, timeout=180):
    import select

    start = time.time()
    while True:
        if time.time() - start > timeout:
            raise TimeoutError("MCP read timeout")
        ready, _, _ = select.select([proc.stdout], [], [], 1.0)
        if not ready:
            if proc.poll() is not None:
                raise RuntimeError(proc.stderr.read().decode() if proc.stderr else "MCP exited")
            continue
        line = proc.stdout.readline()
        if line == b"\r\n":
            break
    headers = {}
    while True:
        line = proc.stdout.readline()
        if line == b"\r\n":
            break
        k, v = line.decode().strip().split(": ", 1)
        headers[k.lower()] = v
    n = int(headers.get("content-length", 0))
    return json.loads(proc.stdout.read(n))


def mcp_push_files(args):
    env = os.environ.copy()
    proc = subprocess.Popen(
        ["node", MCP],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=env,
    )
    send_msg(proc, {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "mcp-push", "version": "1"}}})
    read_msg(proc)
    send_msg(proc, {"jsonrpc": "2.0", "method": "notifications/initialized"})
    send_msg(
        proc,
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": "push_files", "arguments": args},
        },
    )
    result = read_msg(proc)
    proc.terminate()
    if result.get("isError"):
        raise RuntimeError(str(result))
    return result


def main():
    paths = sys.argv[1:] or sorted(
        p for p in os.listdir("/tmp/mcp-oneline") if p.endswith(".json")
    )
    ok = []
    for name in paths:
        path = name if name.startswith("/") else f"/tmp/mcp-oneline/{name}"
        if not os.path.exists(path):
            print("skip", path)
            continue
        args = json.load(open(path))
        try:
            mcp_push_files(args)
            ok.append(args["files"][0]["path"])
            print("OK", path, ok[-1])
        except Exception as e:
            print("FAIL", path, e, file=sys.stderr)
            sys.exit(1)
        time.sleep(0.5)
    print("done", len(ok))


if __name__ == "__main__":
    main()
