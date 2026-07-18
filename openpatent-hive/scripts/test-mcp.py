import subprocess, json, time
proc = subprocess.Popen(['node', '/opt/openpatent-hive/services/openpatent-mcp/dist/index.js'],
                       stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
proc.stdin.write(b'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"h","version":"1.0.0"}}}\n')
proc.stdin.flush()
proc.stdin.write(b'{"jsonrpc":"2.0","method":"notifications/initialized"}\n')
proc.stdin.flush()
proc.stdin.write(b'{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n')
proc.stdin.flush()
buf = b""
end = time.time() + 3
got = 0
while time.time() < end and got < 2:
    ch = proc.stdout.read(1)
    if not ch: break
    buf += ch
    if ch == b"\n":
        line = buf.decode().strip()
        buf = b""
        if not line: continue
        try:
            obj = json.loads(line)
            print("GOT:", json.dumps(obj)[:200])
            got += 1
            if obj.get("id") == 2:
                print("TOOLS:", len(obj["result"].get("tools", [])))
        except Exception as e:
            print("PARSE:", e, line[:80])
proc.kill()
