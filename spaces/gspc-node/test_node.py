#!/usr/bin/env python3
"""Drive the shipped GSPC node HTTP handlers. Not a mill of Hub weights."""
from __future__ import annotations

import json
import os
import threading
import time
import urllib.error
import urllib.request

os.environ["PORT"] = os.environ.get("GSPC_NODE_TEST_PORT") or "8765"

import app  # noqa: E402  — shipped entry


def get(path: str):
    with urllib.request.urlopen("http://127.0.0.1:%s%s" % (os.environ["PORT"], path), timeout=5) as r:
        return r.status, json.loads(r.read())


def main() -> int:
    t = threading.Thread(target=app.main, daemon=True)
    t.start()
    time.sleep(0.3)
    st, health = get("/health")
    assert st == 200
    assert health.get("writes_board") is False
    assert "router.huggingface.co" in (health.get("router") or "")
    st, models = get("/v1/models")
    assert st == 200
    assert models["data"][0]["object"] == "instrument"
    assert models["data"][0]["id"] == "csoai/gspc-node"
    req = urllib.request.Request(
        "http://127.0.0.1:%s/v1/measure" % os.environ["PORT"],
        data=b'{"model":"Qwen/Qwen3-8B:featherless-ai","n":1}',
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    try:
        urllib.request.urlopen(req, timeout=5)
        raise SystemExit("expected 401")
    except urllib.error.HTTPError as e:
        body = json.loads(e.read())
        assert e.code == 401
        assert body.get("writes_board") is False
        assert body.get("status") == "INFERENCE_FAIL"
    print("NODE_HANDLERS_OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
