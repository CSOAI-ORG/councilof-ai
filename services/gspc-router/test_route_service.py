# SPDX-License-Identifier: Apache-2.0
"""GSPC Route pod service tests.

  python3 -m pytest services/gspc-router -q      (after: bash services/gspc-router/build.sh)

* Cedar parity: the Cedar the TypeScript core rendered for every golden case is re-run with the real
  `cedar authorize` (cedar-policy-cli; $CEDAR or on PATH) and must decide exactly as the core did.
* The service: /route answers with a record that verify.py --structure accepts; /v1/* and /route_execute
  answer 501 NOT_ENABLED. Local Ollama is stood in for by its RECORDED /api/tags response from the 4090
  builder (fixtures/route-golden/ollama-tags-4090-2026-09-30.json), never an invented shape.
"""
import http.server, json, os, shutil, socket, subprocess, sys, tempfile, threading, time, urllib.error, urllib.request
import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
GOLD = os.path.join(ROOT, "fixtures", "route-golden")
DIST = os.path.join(HERE, "dist", "route-core.mjs")
CEDAR = os.environ.get("CEDAR") or shutil.which("cedar")
sys.path.insert(0, os.path.join(ROOT, "packages", "evidence-fabric"))
import verify as VF  # noqa: E402

needs_dist = pytest.mark.skipif(not os.path.exists(DIST), reason="dist/route-core.mjs missing: run build.sh")
needs_cedar = pytest.mark.skipif(not CEDAR, reason="cedar CLI not found (set CEDAR=/path/to/cedar)")


def _free_port():
    s = socket.socket(); s.bind(("127.0.0.1", 0)); p = s.getsockname()[1]; s.close(); return p


@needs_cedar
def test_committed_cedar_validates_against_schema():
    pol = os.path.join(ROOT, "functions", "_lib", "route", "policy")
    files = [os.path.join(pol, "floor.cedar")] + sorted(os.path.join(pol, "presets", f) for f in os.listdir(os.path.join(pol, "presets")))
    for f in files:
        r = subprocess.run([CEDAR, "validate", "--schema", os.path.join(pol, "gspc-route.cedarschema"), "--policies", f, "--deny-warnings"],
                           capture_output=True, text=True)
        assert r.returncode == 0, f"{f}: {r.stdout}{r.stderr}"


@needs_cedar
@needs_dist
def test_cedar_parity_with_the_core(tmp_path):
    data = json.loads(subprocess.run(["node", os.path.join(HERE, "cedar_inputs.mjs")], capture_output=True, text=True, check=True).stdout)
    schema = tmp_path / "s.cedarschema"; schema.write_text(data["schema"])
    checked = 0
    for case in data["cases"]:
        pol = tmp_path / f"{case['name']}.cedar"; pol.write_text(case["policies"])
        ctx = tmp_path / "ctx.json"; ctx.write_text(json.dumps(case["context"]))
        v = subprocess.run([CEDAR, "validate", "--schema", str(schema), "--policies", str(pol), "--deny-warnings"], capture_output=True, text=True)
        assert v.returncode == 0, v.stdout + v.stderr
        for req in case["requests"]:
            if req["entity"] is None:
                assert req["expect"] is False  # UNCHECKABLE: refused before policy
                continue
            ents = tmp_path / "e.json"
            ents.write_text(json.dumps([req["entity"], {"uid": {"type": "Caller", "id": "caller"}, "attrs": {}, "parents": []}]))
            r = subprocess.run([CEDAR, "authorize", "--schema", str(schema), "--policies", str(pol), "--entities", str(ents),
                                "--principal", 'Caller::"caller"', "--action", 'Action::"route"',
                                "--resource", f'Candidate::{json.dumps(req["id"])}', "--context", str(ctx)],
                               capture_output=True, text=True)
            got = r.stdout.strip().splitlines()[0] if r.stdout.strip() else r.stderr
            assert got in ("ALLOW", "DENY"), f"{case['name']}/{req['id']}: {r.stdout}{r.stderr}"
            assert (got == "ALLOW") == req["expect"], f"{case['name']}/{req['id']}: cedar {got}, core permit={req['expect']}"
            checked += 1
    assert checked >= 15, checked


class _Tags(http.server.BaseHTTPRequestHandler):
    body = open(os.path.join(GOLD, "ollama-tags-4090-2026-09-30.json"), "rb").read() if os.path.exists(os.path.join(GOLD, "ollama-tags-4090-2026-09-30.json")) else b"{}"

    def do_GET(self):
        self.send_response(200 if self.path == "/api/tags" else 404); self.end_headers()
        if self.path == "/api/tags":
            self.wfile.write(self.body)

    def log_message(self, *a):
        pass


@pytest.fixture(scope="module")
def service():
    if not os.path.exists(DIST):
        pytest.skip("dist/route-core.mjs missing: run build.sh")
    tags = http.server.HTTPServer(("127.0.0.1", 0), _Tags)
    threading.Thread(target=tags.serve_forever, daemon=True).start()
    port = _free_port()
    rec = tempfile.NamedTemporaryFile(suffix=".jsonl", delete=False).name
    env = dict(os.environ, ROUTE_PORT=str(port), OLLAMA_URL=f"http://127.0.0.1:{tags.server_port}",
               BOARD_FILE=os.path.join(GOLD, "board-2026-09-30.json"), RECORDS_FILE=rec)
    p = subprocess.Popen(["node", os.path.join(HERE, "route_service.mjs")], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    base = f"http://127.0.0.1:{port}"
    for _ in range(50):
        try:
            urllib.request.urlopen(base + "/healthz", timeout=1); break
        except Exception:
            time.sleep(0.1)
    yield base, rec
    p.terminate(); tags.shutdown()


def _post(url, body):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"content-type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"{}")


def test_recorded_tags_fixture_is_real():
    d = json.load(open(os.path.join(GOLD, "ollama-tags-4090-2026-09-30.json")))
    assert d["models"] and all("digest" in m and "size" in m for m in d["models"])


def test_route_over_local_ollama_candidates_is_a_valid_record(service):
    base, rec = service
    st, out = _post(base + "/route", {"task": "Summarise a public paragraph.", "objective": {"quality_axis": "governance"}})
    assert st == 200 and out["candidate_source"] == "local_ollama", out
    assert all(c["kind"] == "local_gpu" for c in out["record"]["observed"]["considered"])
    res, why, info = VF.verify_structure(out["record"])
    assert res == "STRUCTURE_VALID", why
    assert out["record"]["observed"]["chosen"]["choice_basis"].startswith(("tie_break:", "only_permitted", "separated_leader:"))
    assert "best" not in out["summary"].lower()
    assert json.loads(open(rec).read().splitlines()[-1])["event_id"] == out["record"]["event_id"]


@pytest.mark.parametrize("path", ["/v1/chat/completions", "/route_execute", "/authz"])
def test_execution_paths_are_not_enabled(service, path):
    base, _ = service
    st, out = _post(base + path, {"model": "gspc/route", "messages": [{"role": "user", "content": "hi"}]})
    assert st == 501 and out["state"] == "NOT_ENABLED"


def test_execute_mode_is_not_enabled(service):
    base, _ = service
    st, out = _post(base + "/route", {"task": "x", "mode": "execute"})
    assert st == 501 and out["state"] == "NOT_ENABLED"
