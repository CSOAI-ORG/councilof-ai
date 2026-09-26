#!/usr/bin/env python3
"""Run scripts/outward-gate/outward_gate.py page checks against a locally served dist/client.

Pages Functions other than /api/* are run from the repo's own functions/ source through
scripts/state-report/run-pages-function.mjs (workerd needs a newer glibc than the build pod has).

    python3 scripts/state-report/local-outward-gate.py --repo /root/state-report --dist dist/client --paths /state/,/state/2026-09/ --out DIR

Local server mimics Cloudflare Pages for static output: <path>/index.html is served for <path>/,
a bare path whose <path>/index.html exists answers 308 to the slash form, exact (non-splat) rules
in _redirects are honoured, and /api/* is proxied read-only to the live site (Pages Functions do not
exist in a static build). Everything else that is not a file is 404. The gate code is imported
unchanged; only its site origin is pointed at the local server.
"""
import argparse
import http.server
import json
import os
import socketserver
import subprocess
import sys
import threading
import urllib.request

ap = argparse.ArgumentParser()
ap.add_argument("--repo", required=True)
ap.add_argument("--dist", default="dist/client")
ap.add_argument("--paths", default="/state/,/state/2026-09/")
ap.add_argument("--out", required=True)
ap.add_argument("--base", default="", help="use an already-running local server (e.g. wrangler pages dev) instead of the built-in one")
a = ap.parse_args()
DIST = os.path.join(a.repo, a.dist)

RULES = {}
for line in open(os.path.join(DIST, "_redirects")):
    p = line.split()
    if len(p) >= 2 and not line.startswith("#") and "*" not in p[0] and ":" not in p[0]:
        RULES.setdefault(p[0], (p[1], int(p[2]) if len(p) > 2 and p[2].isdigit() else 302))


class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *x, **k):
        super().__init__(*x, directory=DIST, **k)

    def log_message(self, *x):
        pass

    def _redir(self, to, code):
        self.send_response(code)
        self.send_header("Location", to)
        self.end_headers()

    def do_GET(self):
        path = self.path.split("?")[0]
        if path.startswith("/api/"):
            try:
                req = urllib.request.Request("https://councilof.ai" + self.path, headers={"User-Agent": "CSOAI-outward-gate/0.1 (local proxy)"})
                r = urllib.request.urlopen(req, timeout=30)
                code, body, ct = r.status, r.read(), r.headers.get("content-type", "application/json")
            except urllib.error.HTTPError as e:
                code, body, ct = e.code, e.read(), e.headers.get("content-type", "text/plain")
            self.send_response(code)
            self.send_header("content-type", ct)
            self.end_headers()
            self.wfile.write(body)
            return
        fs = os.path.join(DIST, path.lstrip("/"))
        if path in RULES and not os.path.isfile(fs):
            to, code = RULES[path]
            if to.rstrip("/") != path.rstrip("/") or not os.path.isfile(os.path.join(fs, "index.html")):
                return self._redir(to, code)
        if not path.endswith("/") and os.path.isfile(os.path.join(fs, "index.html")):
            return self._redir(path + "/", 308)
        if os.path.isdir(fs) and not os.path.isfile(os.path.join(fs, "index.html")):
            self.send_error(404)
            return
        if not os.path.exists(fs):
            # a Pages Function route: run the repo's own handler (functions/<path>.ts or <path>/index.ts)
            base = os.path.join(a.repo, "functions", path.strip("/"))
            for cand in (base + ".ts", os.path.join(base, "index.ts")):
                if path.strip("/") and os.path.isfile(cand):
                    r = subprocess.run(["node", os.path.join(a.repo, "scripts/state-report/run-pages-function.mjs"), cand,
                                        "https://councilof.ai" + self.path], cwd=a.repo, capture_output=True, text=True, timeout=120)
                    try:
                        o = json.loads(r.stdout)
                    except Exception:
                        self.send_error(500, (r.stderr or "")[:200])
                        return
                    body = o["body"].encode()
                    self.send_response(o["status"])
                    self.send_header("content-type", o["ct"] or "text/plain")
                    self.send_header("content-length", str(len(body)))
                    self.end_headers()
                    self.wfile.write(body)
                    return
            self.send_error(404)
            return
        return super().do_GET()

    do_HEAD = do_GET


class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


if a.base:
    srv, BASE = None, a.base.rstrip("/")
else:
    srv = S(("127.0.0.1", 0), H)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    BASE = f"http://127.0.0.1:{srv.server_address[1]}"

sys.path.insert(0, os.path.join(a.repo, "scripts", "outward-gate"))
import outward_gate as og  # noqa: E402

og.SITE = BASE
_orig_links = og.internal_links


def _local_links(h, base=BASE):
    # the gate canonicalises every same-host link to https; the local server speaks plain http
    return [u.replace("https://127.0.0.1:", "http://127.0.0.1:", 1) for u in _orig_links(h, base)]


og.internal_links = _local_links
http_ = og.Http(min_interval=0.0)
ctx = og.Ctx(http_, lambda *x: sys.stderr.write(" ".join(map(str, x)) + "\n")).load()
lc = og.LinkChecker(http_, 2000)
arts = [og.page_artifact(ctx, p, lc) for p in a.paths.split(",")]
doc = og.write_outputs(arts, a.out, {"local_base": BASE, "dist": DIST, "requests": dict(http_.n), "live": ctx.live})
for x in doc["artifacts"]:
    print(f"{x['id']}: {x['score_pct']}% ({x['passes']}/{x['applicable']}) gate {x['gate']}")
    for c in x["checks"]:
        print(f"   {c['status']:4} {c['check']}: {c['evidence'][:220]}")
if srv:
    srv.shutdown()
sys.exit(0 if all(x["gate"] == "OPEN" for x in doc["artifacts"]) else 1)
