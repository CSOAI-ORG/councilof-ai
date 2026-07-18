"""Smoke test the openpatent-mcp stdio server (mock api.openpatent.ai)."""
import json
import subprocess
import time
import os
import fcntl

# Spawn a mock HTTP server that pretends to be api.openpatent.ai
# Then run the MCP server pointed at it and exercise all 4 tools.

# 1. Start a fake API on port 9999
fake = subprocess.Popen(
    ["python3", "-c", """
import http.server, json, socketserver

class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        n = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(n)
        print(f"[fake] POST {self.path} body={body[:80]}", flush=True)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        if '/v1/disclosure' in self.path:
            self.wfile.write(json.dumps({'status': 'DISCLOSED', 'attestation_url': 'https://verify.openpatent.ai/abc123', 'document_hash': 'deadbeef' * 16}).encode())
        elif '/v1/verify' in self.path:
            self.wfile.write(json.dumps({'all_checks_pass': True, 'checks': ['sha3_512', 'hmac', 'ed25519', 'ots']}).encode())
        elif '/v1/search' in self.path:
            self.wfile.write(json.dumps({'total': 1, 'entries': [{'title': 'Mock entry', 'hash': 'cafebabe'}]}).encode())
        elif '/v1/draft-claims' in self.path:
            self.wfile.write(json.dumps({'title': 'Mock invention', 'independent_claims': [{'number': 1, 'category': 'method', 'preamble': 'A method'}]}).encode())
        else:
            self.wfile.write(b'{}')
    def log_message(self, *a): pass

socketserver.TCPServer(('127.0.0.1', 9999), H).serve_forever()
"""],
    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
)
time.sleep(1)

# 2. Build the MCP server if not already
proc = subprocess.run(["npm", "install", "--no-audit", "--no-fund"],
                      cwd="/Users/nicholas/clawd/openpatent-hive/services/openpatent-mcp",
                      capture_output=True, text=True)
proc = subprocess.run(["npx", "tsc"],
                      cwd="/Users/nicholas/clawd/openpatent-hive/services/openpatent-mcp",
                      capture_output=True, text=True)
if proc.returncode != 0:
    print("tsc failed:", proc.stdout, proc.stderr)
    fake.terminate()
    raise SystemExit(1)

# 3. Spawn MCP server
mcp = subprocess.Popen(
    ["node", "dist/index.js"],
    cwd="/Users/nicholas/clawd/openpatent-hive/services/openpatent-mcp",
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env={**os.environ, "OPENPATENT_API_BASE": "http://127.0.0.1:9999"},
    bufsize=0,
)
for f in (mcp.stdout, mcp.stderr):
    fl = fcntl.fcntl(f.fileno(), fcntl.F_GETFL)
    fcntl.fcntl(f.fileno(), fcntl.F_SETFL, fl | os.O_NONBLOCK)

# 4. Send MCP handshake + 4 tool calls
def send(req):
    line = (json.dumps(req) + "\n").encode()
    mcp.stdin.write(line)
    mcp.stdin.flush()

send({"jsonrpc": "2.0", "id": 1, "method": "initialize",
      "params": {"protocolVersion": "2024-11-05", "capabilities": {},
                 "clientInfo": {"name": "test", "version": "1.0"}}})
send({"jsonrpc": "2.0", "method": "notifications/initialized"})
send({"jsonrpc": "2.0", "id": 3, "method": "tools/list"})
send({"jsonrpc": "2.0", "id": 4, "method": "tools/call",
      "params": {"name": "disclose_invention", "arguments": {
          "title": "Test", "description": "Test", "inventor_did": "did:key:z6Mk...",
          "document_base64": "dGVzdA=="}}})
send({"jsonrpc": "2.0", "id": 5, "method": "tools/call",
      "params": {"name": "verify_disclosure", "arguments": {"document_hash": "deadbeef"}}})
send({"jsonrpc": "2.0", "id": 6, "method": "tools/call",
      "params": {"name": "search_prior_art", "arguments": {"query": "test"}}})
send({"jsonrpc": "2.0", "id": 7, "method": "tools/call",
      "params": {"name": "draft_patent_claims", "arguments": {
          "invention_description": "A method for testing the MCP bridge"}}})

time.sleep(2.0)
out = b""
err = b""
try: out = mcp.stdout.read()
except: pass
try: err = mcp.stderr.read()
except: pass

mcp.terminate()
try: mcp.wait(timeout=1)
except: mcp.kill()
fake.terminate()
try: fake.wait(timeout=1)
except: fake.kill()

print(f"--- STDOUT ({len(out)} bytes) ---")
print(out.decode(errors="replace")[:3000])
print()
print(f"--- STDERR ({len(err)} bytes) ---")
print(err.decode(errors="replace")[:500])

# Count JSON-RPC responses
lines = [l for l in out.decode().split("\n") if l.strip()]
print(f"\n--- {len(lines)} response lines ---")
ok = sum(1 for l in lines if '"id":' in l and '"error"' not in l)
print(f"  ok responses: {ok}")
