#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Turn the capture's client transcript into witness.jsonl (the adapter's witness format).

The witness here is the client (curl 7.68.0) and what came back to it, not the enforcer.
Run in the capture directory on the host where the capture was taken (it reads the
response bodies, which are not all redistributed):

    python3 build_witness.py > witness.jsonl

Rule for `left` (did the request's bytes reach the named destination?):
  - CONNECT refused by the proxy (http_connect != 200): no tunnel, so the request did not leave;
  - tunnel opened, and the response body is an OpenShell proxy error body
    (JSON whose "error" is policy_denied / middleware_denied / middleware_failed / ssrf_denied):
    the proxy answered, so the request did not reach the origin;
  - tunnel opened and any other body came back: the origin answered, so the request left.
This sees the request, not the connection: whether the proxy opened a TCP or TLS
connection upstream before refusing a request is not visible to the client (UNMEASURED).
"""
import hashlib
import json
import re
import sys

# The three requests, in the order the capture command sent them (README.md).
REQUESTS = [("example.org", "https://example.org/"), ("example.com", "https://example.com/"),
            ("example.net", "https://example.net/")]
PROXY_ERRORS = {"policy_denied", "middleware_denied", "middleware_failed", "ssrf_denied"}


def field(line, name):
    m = re.search(r'"%s":(?:"([^"]*)"|(-?\d+))' % name, line)
    return None if not m else (m.group(1) if m.group(1) is not None else int(m.group(2)))


def main():
    # curl 7.68 has no %{url} or %{exitcode}; those fields came out empty, so the raw lines are
    # not valid JSON. Read the fields that curl did fill in.
    lines = [x for x in open("client-transcript.raw.txt", encoding="utf-8").read().splitlines() if x.strip()]
    assert len(lines) == len(REQUESTS), "one transcript line per request"
    for (host, url), line in zip(REQUESTS, lines):
        connect, code, size = field(line, "http_connect"), field(line, "http_code"), field(line, "size_download")
        ev = {"source": "client_transcript", "client": "curl 7.68.0", "via_proxy": "127.0.0.1:39128",
              "http_connect": connect, "http_code": code, "size_download": size}
        left = False
        if connect == 200:
            body = open(f"body-{host}.bin", "rb").read()
            ev["body_sha256"] = hashlib.sha256(body).hexdigest()
            err = None
            try:
                err = json.loads(body).get("error")
            except (ValueError, AttributeError):
                pass
            ev["body_is_proxy_error"] = err in PROXY_ERRORS
            if err in PROXY_ERRORS:
                ev["proxy_error"] = err
            left = err not in PROXY_ERRORS
        print(json.dumps({"kind": "egress", "t": field(line, "time_start_utc"), "host": host, "port": 443,
                          "method": "GET", "path": "/", "binary": "/usr/bin/curl", "left": left, "evidence": ev},
                         separators=(",", ":")))


if __name__ == "__main__":
    sys.exit(main())
