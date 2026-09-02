#!/usr/bin/env python3
"""witness_queue adapter against recorded KV fixtures. No network.

Runs under pytest or plain `python3 scripts/adapters/test_witness_queue.py`.
"""
from __future__ import annotations

import json
import sys
import tempfile
import urllib.parse
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))
from adapters import witness_queue as wq  # noqa: E402

FX = json.loads((HERE / "fixtures" / "witness_kv_recorded.json").read_text(encoding="utf-8"))
ENV = {"CLOUDFLARE_API_TOKEN": "t", "CLOUDFLARE_ACCOUNT_ID": "acct", "WITNESS_KV_NAMESPACE_ID": "ns"}
A, B, C = "a" * 64, "b" * 64, "c" * 64


class FakeKv:
    """Plays back the recorded REST shapes; records PUTs; mutates its store like the real thing."""

    def __init__(self, values: dict | None = None) -> None:
        self.values = json.loads(json.dumps(values if values is not None else FX["values"]))
        self.puts: list[str] = []
        self.calls: list[str] = []

    def __call__(self, method: str, url: str, body: bytes | None, headers: dict) -> tuple[int, bytes]:
        assert headers.get("Authorization") == "Bearer t"
        assert "/accounts/acct/storage/kv/namespaces/ns/" in url
        self.calls.append(f"{method} {url.split('/namespaces/ns')[1][:40]}")
        path = url.split("/namespaces/ns", 1)[1]
        if path.startswith("/keys"):
            page = dict(FX["keys_page"])
            page["result"] = [{"name": k} for k in self.values]
            return 200, json.dumps(page).encode()
        if path.startswith("/values/"):
            key = urllib.parse.unquote(path[len("/values/"):])
            if method == "GET":
                if key not in self.values:
                    return 404, b'{"success":false}'
                return 200, json.dumps(self.values[key]).encode()
            if method == "PUT":
                self.values[key] = json.loads(body.decode())
                self.puts.append(key)
                return 200, b'{"success":true}'
        return 500, b"unexpected"


def _repo(tmp: str) -> Path:
    root = Path(tmp)
    (root / "public" / "interop").mkdir(parents=True)
    return root


def test_absent_config_no_leaves_never_raises() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        out = wq.collect(_repo(tmp), env={})
    assert out["leaves"] == []
    assert out["sidecar"]["kv"].startswith("NOT_YET")
    assert out["sidecar"]["n_leaves"] == 0


def test_recorded_queue_becomes_canonical_leaves() -> None:
    kv = FakeKv()
    with tempfile.TemporaryDirectory() as tmp:
        out = wq.collect(_repo(tmp), env=ENV, transport=kv)
    leaves = out["leaves"]
    assert [l["payload"]["sha256"] for l in leaves] == [A, C]  # B skipped
    assert out["sidecar"]["n_kv"] == 3 and out["sidecar"]["n_leaves"] == 2
    assert any("verdict word" in s["reason"] for s in out["sidecar"]["skipped"])
    for leaf in leaves:
        assert leaf["surface"] == "public.notice"
        p = leaf["payload"]
        assert p["kind"] == wq.KIND and p["state"] == "PROBED" and p["attests"] == wq.ATTESTS
        assert len(wq.canonical_bytes(p)) <= wq.CAP
        assert leaf["as_of"] == "2026-09-02T08:00:00Z"
        assert leaf["source_urls"][0] == f"https://councilof.ai/api/witness/status?sha256={p['sha256']}"
        assert all(u.startswith("https://") for u in leaf["source_urls"])
        assert leaf["tags"] == ["rail:x402", "sku:witness_hash", "witness"]
        blob = json.dumps(leaf)
        assert "SECRET" not in blob and "example.org" not in blob and "url\"" not in blob.replace("url_hash", "")
        assert "rfc3161_token\"" not in blob and "MIIBAA" not in blob
        assert not wq.VERDICT_RE.search(blob)
    a = leaves[0]
    assert a["payload"]["url_hash"] and a["payload"]["http_status"] == 200 and a["payload"]["rfc3161_status"] == "TIMESTAMPED"
    assert a["subject"].startswith("witness sha256:aaaaaaaaaaaaaaaa release 1.2")
    c = leaves[1]
    assert "url_hash" not in c["payload"] and c["payload"]["rfc3161_token_sha256"] is None
    assert any(u.startswith("rfc3161 (UNCHECKABLE: TSA HTTP 500") for u in c["unmeasured"])
    assert any("hash only" in u for u in c["unmeasured"])
    # deterministic: the same entry yields the same card sha every hour
    assert wq.payload_sha256(a["payload"]) == wq.payload_sha256(wq.leaf_payload(kv.values["witness:" + A]))


def test_mark_is_idempotent_and_mirrors_public_fields_only() -> None:
    kv = FakeKv()
    a_card = wq.payload_sha256(wq.leaf_payload(FX["values"]["witness:" + A]))
    with tempfile.TemporaryDirectory() as tmp:
        root = _repo(tmp)
        merkle = "m" * 64
        (root / "public" / "root.json").write_text(json.dumps({"as_of": "2026-09-02T08:07:00Z", "merkle_root": merkle, "card_sha256": [a_card, "x" * 64]}))
        side = json.loads(json.dumps(FX["root_witness_latest"]))
        side["artifact"]["merkle_root"] = merkle
        (root / "public" / "interop" / "root-witness-latest.json").write_text(json.dumps(side))

        s1 = wq.mark(root, env=ENV, transport=kv)
        assert s1["status"] == "ok" and s1["marked"] == [A[:16]] and s1["mirrored"] == 1
        e = kv.values["witness:" + A]
        assert e["status"] == "witnessed"
        assert e["witnessed"] == {
            "root_as_of": "2026-09-02T08:07:00Z", "merkle_root": merkle, "card_sha256": a_card,
            "card_url": f"/cards/{a_card[:16]}.json", "proof_url": f"/api/proof?sha={a_card}",
            "anchors": {"merkle_root": merkle, "rekor": {"status": "WITNESSED", "logIndex": 2684053226, "uuid": "108e", "url": "https://rekor.sigstore.dev/api/v1/log/entries?logIndex=2684053226"}, "ots": {"status": "STAMPED_PENDING_BITCOIN", "path": "public/interop/root-728e8c5e.json.ots", "url": "https://councilof.ai/interop/root-728e8c5e.json.ots"}, "sidecar": "https://councilof.ai/interop/root-witness-latest.json"},
        }
        assert kv.values["witness:" + C]["status"] == "queued"  # not in this root
        assert any("verdict" in s["reason"] for s in s1["skipped"])

        mirror = json.loads((root / "public" / "interop" / "witness" / f"{A}.json").read_text())
        assert mirror["schema"] == wq.MIRROR_SCHEMA
        assert mirror["entry"]["sha256"] == A and mirror["entry"]["status"] == "witnessed"
        for secret in ("url", "rfc3161_token", "payer", "network", "headers"):
            assert secret not in mirror["entry"], secret
        assert "SECRET" not in json.dumps(mirror)

        s2 = wq.mark(root, env=ENV, transport=kv)
        assert s2["marked"] == [] and s2["mirrored"] == 0 and kv.puts == ["witness:" + A]

        # mirror ∪ KV dedupes to the same leaves; mirror alone keeps A landing without KV
        both = wq.collect(root, env=ENV, transport=kv)
        assert [l["payload"]["sha256"] for l in both["leaves"]] == [A, C]
        assert both["sidecar"]["n_mirror"] == 1
        alone = wq.collect(root, env={})
        assert [l["payload"]["sha256"] for l in alone["leaves"]] == [A]
        assert wq.payload_sha256(alone["leaves"][0]["payload"]) == a_card


def test_kv_unreachable_never_raises_and_mirrors_still_land() -> None:
    def down(method, url, body, headers):
        raise OSError("dns")

    with tempfile.TemporaryDirectory() as tmp:
        root = _repo(tmp)
        wq.write_mirror(root, FX["values"]["witness:" + A])
        out = wq.collect(root, env=ENV, transport=down)
        assert [l["payload"]["sha256"] for l in out["leaves"]] == [A]
        assert "errors" in out["sidecar"]["kv"]
        m = wq.mark(root, env=ENV, transport=down)
        assert m["status"] == "UNCHECKABLE"  # no root.json in the temp repo — recorded, not raised


def test_mark_without_config_is_not_yet() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        root = _repo(tmp)
        (root / "public" / "root.json").write_text('{"card_sha256": []}')
        assert wq.mark(root, env={})["status"] == "NOT_YET"


if __name__ == "__main__":
    names = [n for n in dir() if n.startswith("test_")]
    for n in names:
        globals()[n]()
        print("ok", n)
    print(f"{len(names)} passed")
