#!/usr/bin/env python3
"""Tests for scripts/watch/provider_watch.py — normaliser, diff, robots, states, leaves, state file.

Runs under pytest or directly: python3 scripts/watch/test_provider_watch.py
No network: every fetch is a fixture-backed fake.
"""
from __future__ import annotations

import json
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
sys.path.insert(0, str(HERE))

import provider_watch as pw  # noqa: E402
from adapters import provider_diff  # noqa: E402
from adapters.staged_leaves import VERDICT_RE, _check  # noqa: E402

FIX = HERE / "fixtures"
T_A = {"id": "acme/usage_policy", "provider": "acme", "provider_name": "Acme", "surface": "usage_policy", "url": "https://acme.example/policies/usage"}
T_B = {"id": "acme/terms", "provider": "acme", "provider_name": "Acme", "surface": "terms", "url": "https://acme.example/terms"}
T_C = {"id": "other/pricing", "provider": "other", "provider_name": "Other", "surface": "pricing", "url": "https://other.example/pricing"}
UA = "csoai-provider-watch/0.1 (test)"


def _res(status, body=b"", headers=None, final_url=None, error=None):
    return pw.FetchResult(status=status, body=body, headers=headers or {}, final_url=final_url, error=error)


def fake_fetcher(table: dict[str, object]):
    """table: url -> FetchResult | Exception-name string (network error)."""
    calls: list[str] = []

    def fetch(url: str) -> pw.FetchResult:
        calls.append(url)
        v = table.get(url)
        if v is None:
            return _res(404, b"<html><title>nope</title></html>", {"content-type": "text/html"}, final_url=url)
        if isinstance(v, str):
            return _res(None, b"", {}, final_url=url, error=v)
        return v

    fetch.calls = calls  # type: ignore[attr-defined]
    return fetch


def html_res(name: str, status: int = 200, url: str | None = None, headers: dict | None = None):
    h = {"content-type": "text/html; charset=utf-8", "etag": f'"{name}"'}
    h.update(headers or {})
    return _res(status, (FIX / name).read_bytes(), h, final_url=url)


ROBOTS_ALLOW = _res(200, (FIX / "robots_allow.txt").read_bytes(), {"content-type": "text/plain"})
ROBOTS_DISALLOW = _res(200, (FIX / "robots_disallow.txt").read_bytes(), {"content-type": "text/plain"})


# ── normaliser ───────────────────────────────────────────────────────────────
def test_normaliser_ignores_cosmetics_and_hidden_carriers() -> None:
    a = pw.normalise((FIX / "page_a.html").read_bytes(), "text/html")
    b = pw.normalise((FIX / "page_a_cosmetic.html").read_bytes(), "text/html")
    assert a == b, (a, b)
    assert "nonce" not in a and "csrf" not in a and "tok-first-load" not in a and "analytics" not in a
    assert "rendered at" not in a  # comments stripped
    assert "Usage Policy You may not use" in a  # visible text kept, case kept
    assert pw.norm_sha256(a) == pw.norm_sha256(b)


def test_normaliser_sees_a_real_edit() -> None:
    a = pw.normalise((FIX / "page_a.html").read_bytes(), "text/html")
    c = pw.normalise((FIX / "page_a_changed.html").read_bytes(), "text/html")
    assert a != c
    assert pw.norm_sha256(a) != pw.norm_sha256(c)


def test_normaliser_version_is_hashed_in() -> None:
    assert pw.norm_sha256("x") != pw.sha256_hex(b"x")
    assert pw.NORMALISER == "csoai-norm-v1"


def test_normaliser_non_html_is_whitespace_only() -> None:
    assert pw.normalise(b'{"a":  1,\n "b": "<b>"}', "application/json") == '{"a": 1, "b": "<b>"}'


# ── states ───────────────────────────────────────────────────────────────────
def test_capture_ok_hash_only() -> None:
    fetch = fake_fetcher({"https://acme.example/robots.txt": ROBOTS_ALLOW, T_A["url"]: html_res("page_a.html", url=T_A["url"])})
    cap = pw.capture(T_A, fetch, pw.RobotsCache(fetch, UA), fetched_at="2026-09-03T05:20:00Z")
    assert cap["state"] == "OK" and cap["http_status"] == 200 and cap["robots"] == "allow"
    assert re.fullmatch(r"[0-9a-f]{64}", cap["bytes_sha256"]) and re.fullmatch(r"[0-9a-f]{64}", cap["norm_sha256"])
    assert cap["etag"] == '"page_a.html"' and cap["byte_length"] == len((FIX / "page_a.html").read_bytes())
    blob = json.dumps(cap)
    assert "violates" not in blob and "Usage Policy" not in blob  # never the content


def test_robots_disallow_is_uncheckable_and_not_fetched() -> None:
    fetch = fake_fetcher({"https://acme.example/robots.txt": ROBOTS_DISALLOW, T_A["url"]: html_res("page_a.html")})
    cap = pw.capture(T_A, fetch, pw.RobotsCache(fetch, UA))
    assert cap["state"] == "UNCHECKABLE" and cap["robots"] == "disallow"
    assert T_A["url"] not in fetch.calls  # honoured: never fetched
    # /terms is allowed for our UA on the same host
    cap2 = pw.capture(T_B, fetch, pw.RobotsCache(fetch, UA))
    assert cap2["robots"] == "allow"


def test_robots_unreadable_fails_closed() -> None:
    fetch = fake_fetcher({"https://acme.example/robots.txt": _res(503, b"", {}), T_A["url"]: html_res("page_a.html")})
    cap = pw.capture(T_A, fetch, pw.RobotsCache(fetch, UA))
    assert cap["state"] == "UNCHECKABLE" and cap["robots"] == "unreadable"
    assert T_A["url"] not in fetch.calls


def test_robots_404_means_allow() -> None:
    fetch = fake_fetcher({T_A["url"]: html_res("page_a.html")})  # robots.txt -> 404 from the fake
    cap = pw.capture(T_A, fetch, pw.RobotsCache(fetch, UA))
    assert cap["state"] == "OK" and cap["robots"] == "allow"


def test_challenge_is_uncheckable_never_hashed() -> None:
    fetch = fake_fetcher({"https://acme.example/robots.txt": ROBOTS_ALLOW, T_A["url"]: html_res("challenge.html", status=403, headers={"server": "cloudflare"})})
    cap = pw.capture(T_A, fetch, pw.RobotsCache(fetch, UA))
    assert cap["state"] == "UNCHECKABLE" and "challenge" in cap["reason"] and cap["norm_sha256"] is None
    # even a 200 that is an interstitial
    fetch = fake_fetcher({"https://acme.example/robots.txt": ROBOTS_ALLOW, T_A["url"]: html_res("challenge.html", status=200)})
    cap = pw.capture(T_A, fetch, pw.RobotsCache(fetch, UA))
    assert cap["state"] == "UNCHECKABLE"


def test_network_error_and_non_200_are_unknown() -> None:
    fetch = fake_fetcher({"https://acme.example/robots.txt": ROBOTS_ALLOW, T_A["url"]: "TimeoutError"})
    cap = pw.capture(T_A, fetch, pw.RobotsCache(fetch, UA))
    assert cap["state"] == "UNKNOWN" and "TimeoutError" in cap["reason"]
    fetch = fake_fetcher({"https://acme.example/robots.txt": ROBOTS_ALLOW})
    cap = pw.capture(T_A, fetch, pw.RobotsCache(fetch, UA))
    assert cap["state"] == "UNKNOWN" and cap["reason"] == "HTTP 404" and cap["norm_sha256"] is None


# ── classify ─────────────────────────────────────────────────────────────────
def test_classify() -> None:
    ok1 = {"state": "OK", "norm_sha256": "n1", "bytes_sha256": "b1"}
    assert pw.classify(None, ok1) == "FIRST_CAPTURE"
    assert pw.classify(ok1, {"state": "OK", "norm_sha256": "n1", "bytes_sha256": "b1"}) == "UNCHANGED"
    assert pw.classify(ok1, {"state": "OK", "norm_sha256": "n1", "bytes_sha256": "b2"}) == "BYTES_ONLY"
    assert pw.classify(ok1, {"state": "OK", "norm_sha256": "n2", "bytes_sha256": "b2"}) == "CHANGED"
    assert pw.classify(ok1, {"state": "UNKNOWN"}) is None


# ── three runs: first capture, cosmetic, real change ─────────────────────────
def _run(table, state, leaves_dir, run_at, targets=(T_A, T_B, T_C)):
    fetch = fake_fetcher(table)
    return pw.run_once(list(targets), state, fetch, UA, leaves_dir, run_at=run_at, pause=0)


def test_three_runs_state_and_leaves() -> None:
    with tempfile.TemporaryDirectory() as td:
        leaves = Path(td) / "leaves"
        leaves.mkdir()
        state = pw.empty_state()
        robots_all_off = _res(200, b"User-agent: csoai-provider-watch\nDisallow: /\n\nUser-agent: *\nAllow: /\n", {"content-type": "text/plain"})
        base = {"https://acme.example/robots.txt": ROBOTS_ALLOW, "https://other.example/robots.txt": robots_all_off,
                T_B["url"]: html_res("page_a_changed.html", url=T_B["url"]), T_C["url"]: html_res("page_a.html")}

        r1 = _run({**base, T_A["url"]: html_res("page_a.html", url=T_A["url"])}, state, leaves, "2026-09-03T05:20:00Z")
        assert (r1["first"], r1["changed"], r1["uncheckable"], r1["unknown"]) == (2, 0, 1, 0)
        assert r1["uncheckable_ids"] == ["other/pricing"]
        assert [f for f in leaves.iterdir()] and all(f.name.startswith("card-daily-") for f in leaves.iterdir())  # no diff leaf on first capture

        r2 = _run({**base, T_A["url"]: html_res("page_a_cosmetic.html", url=T_A["url"])}, state, leaves, "2026-09-04T05:20:00Z")
        assert (r2["first"], r2["changed"], r2["bytes_only"], r2["unchanged"]) == (0, 0, 1, 1)
        assert not [f for f in leaves.iterdir() if "acme" in f.name]  # cosmetic reformat is not a diff

        r3 = _run({**base, T_A["url"]: html_res("page_a_changed.html", url=T_A["url"])}, state, leaves, "2026-09-05T05:20:00Z")
        assert r3["changed"] == 1 and r3["changed_ids"] == ["acme/usage_policy"]
        diff_files = [f for f in leaves.iterdir() if "acme-usage_policy" in f.name]
        assert len(diff_files) == 1

        # the diff leaf
        card = json.loads(diff_files[0].read_text())
        assert _check(card) is None, _check(card)
        p = card["payload"]
        assert p["kind"] == pw.LEAF_KIND and p["state"] == "PROBED"
        assert p["prev_fetched_at"] == "2026-09-04T05:20:00Z" and p["fetched_at"] == "2026-09-05T05:20:00Z"
        assert p["prev_sha256"] != p["new_sha256"] and p["attests"] == pw.ATTESTS
        assert card["sig_ed25519"] is None and card["sha256"] == pw.sha256_hex(pw.canonical_bytes(p))
        assert len(pw.canonical_bytes(p)) <= pw.CAP and len(pw.canonical_bytes(card)) <= pw.CAP
        assert not VERDICT_RE.search(json.dumps(card))

        # state: append-only history, hash-only, per-target facts
        ent = state["targets"]["acme/usage_policy"]
        kinds = [h["kind"] for h in ent["history"]]
        assert kinds == ["FIRST_CAPTURE", "BYTES_ONLY", "CHANGED"], kinds
        assert ent["history"][-1]["leaf"] == diff_files[0].name
        assert ent["n_runs"] == 3 and ent["n_changed"] == 1
        assert state["targets"]["acme/terms"]["history"][-1]["kind"] == "FIRST_CAPTURE"  # unchanged runs not appended
        assert state["targets"]["other/pricing"]["latest"]["state"] == "UNCHECKABLE"
        assert len(state["runs"]) == 3
        blob = json.dumps(state) + "".join(f.read_text() for f in leaves.iterdir())
        for word in ("violates", "competing model", "Usage Policy", "applicable law"):
            assert word not in blob, word  # never the content

        # daily leaves: one per run, valid, under cap, no verdict word
        dailies = sorted(f for f in leaves.iterdir() if f.name.startswith("card-daily-"))
        assert len(dailies) == 3
        d = json.loads(dailies[-1].read_text())
        assert _check(d) is None and d["payload"]["kind"] == pw.DAILY_KIND
        assert d["payload"]["n_changed"] == 1 and d["payload"]["uncheckable"] == ["other/pricing"]
        assert not VERDICT_RE.search(json.dumps(d))

        # the adapter picks every leaf up and skips nothing
        fake_root = Path(td) / "repo"
        (fake_root / "public" / "feeds" / "provider-diff").mkdir(parents=True)
        (fake_root / "public" / "feeds" / "provider-diff" / "leaves").symlink_to(leaves)
        out = provider_diff.collect(fake_root)
        assert out["sidecar"]["n_skipped"] == 0 and out["sidecar"]["n_leaves"] == 4, out["sidecar"]
        assert all(leaf["surface"] == "public.notice" for leaf in out["leaves"])

        # the index
        idx = pw.build_index(state, [T_A, T_B, T_C])
        assert idx["schema"] == pw.INDEX_SCHEMA and idx["n_targets"] == 3
        assert idx["counts"] == {"OK": 2, "UNCHECKABLE": 1, "UNKNOWN": 0}
        assert len(idx["recent_diffs"]) == 1 and idx["recent_diffs"][0]["id"] == "acme/usage_policy"
        assert idx["recent_diffs"][0]["leaf"].endswith(diff_files[0].name)
        row = next(r for r in idx["targets"] if r["id"] == "acme/usage_policy")
        assert row["n_changes"] == 1 and row["last_change_at"] == "2026-09-05T05:20:00Z" and row["churn_suspect"] is False
        assert not VERDICT_RE.search(json.dumps(idx))


def test_daily_leaf_fits_cap_with_many_ids() -> None:
    run = {"run_at": "2026-09-03T05:20:00Z", "n_targets": 400, "ok": 0, "unchanged": 0, "changed": 0, "bytes_only": 0, "first": 0,
           "uncheckable": 200, "unknown": 200, "changed_ids": [], "uncheckable_ids": [f"prov{i}/surface_long_name" for i in range(200)],
           "unknown_ids": [f"other{i}/pricing_page_x" for i in range(200)]}
    card = pw.daily_leaf(run)
    assert _check(card) is None, _check(card)
    assert len(pw.canonical_bytes(card["payload"])) <= pw.CAP
    assert card["payload"]["unknown"][-1].endswith(" more")
    assert card["payload"]["n_unknown"] == 200  # the count is never trimmed


def test_adapter_skips_bad_files_never_raises() -> None:
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        d = root / "public" / "feeds" / "provider-diff" / "leaves"
        d.mkdir(parents=True)
        (d / "card-x-unsigned.json").write_text("{not json")
        bad = pw.make_card("s", "2026-09-03T00:00:00Z", ["https://a.example/"], {"kind": pw.LEAF_KIND, "state": "PROBED", "note": "the vendor is non-compliant"}, [], [])
        (d / "card-y-unsigned.json").write_text(json.dumps(bad))
        signed = pw.make_card("s", "2026-09-03T00:00:00Z", ["https://a.example/"], {"kind": pw.LEAF_KIND, "state": "PROBED"}, [], [])
        signed["sig_ed25519"] = "deadbeef"
        (d / "card-z-unsigned.json").write_text(json.dumps(signed))
        other = pw.make_card("s", "2026-09-03T00:00:00Z", ["https://a.example/"], {"kind": "something.else/0.1", "state": "PROBED"}, [], [])
        (d / "card-w-unsigned.json").write_text(json.dumps(other))
        out = provider_diff.collect(root)
        assert out["leaves"] == [] and out["sidecar"]["n_skipped"] == 4
        reasons = " | ".join(s["reason"] for s in out["sidecar"]["skipped"])
        assert "json" in reasons and "verdict word" in reasons and "signature" in reasons and "not a provider-diff kind" in reasons


def test_targets_file_loads_and_is_https_only() -> None:
    targets, ua = pw.load_targets(HERE / "targets.json")
    assert len(targets) >= 40 and ua.startswith("csoai-provider-watch/")
    assert all(t["url"].startswith("https://") for t in targets)
    ids = [t["id"] for t in targets]
    assert len(ids) == len(set(ids))
    providers = {t["provider"] for t in targets}
    for p in ("openai", "anthropic", "google", "meta", "mistral", "xai", "cohere", "deepseek", "alibaba-qwen", "amazon"):
        assert p in providers, p


def test_publisher_wires_the_adapter() -> None:
    src = (ROOT / "scripts" / "publish_public_root.py").read_text()
    assert "provider_diff" in src and 'provider_diff_out["leaves"]' in src


def main() -> int:
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
    print("selftest OK: normaliser stable + version-bound; robots honoured (disallow/unreadable = UNCHECKABLE, never fetched); challenge UNCHECKABLE; non-200 UNKNOWN; diff leaf valid <=3072 no verdict; state append-only hash-only; adapter never raises")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
