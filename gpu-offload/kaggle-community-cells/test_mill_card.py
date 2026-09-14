"""Drive the Kaggle kernel through the real lander and the real v0.2 admission verifier.

Runs as a script (mirror-connector-contract.yml) or under pytest. The evidence tests are
failing controls: each one asserts both the accepted path and the refusal it must produce.
"""
from __future__ import annotations

import copy
import hashlib
import json
import re
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
LAND = REPO / "scripts"
HARNESS = REPO / "harness" / "gspc-top100"
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HARNESS))
sys.path.insert(0, str(LAND))
from mill_card import canonical_body_bytes, filename_for, make_unsigned  # noqa: E402

SAMPLE = HERE / "fixtures" / "unsigned-sample.json"
MODEL = "Qwen/Qwen2.5-0.5B-Instruct"
ROUTE = "kaggle-community:tesla-t4"


def test_canonical_matches_landed_sample() -> None:
    wrap = json.loads(SAMPLE.read_text())
    raw = canonical_body_bytes(wrap["body"])
    assert hashlib.sha256(raw).hexdigest() == wrap["id"]


def test_builder_accepted_by_land_mill_cards() -> None:
    import land_mill_cards as lm  # noqa: E402 — real shipped land path

    wrap = make_unsigned(
        axis="jail",
        model="kaggle:default",
        n=20,
        accuracy=0.55,
        route="kaggle-community",
    )
    why = lm.reject_reason(wrap)
    assert why is None, why
    assert wrap["signature"] is None
    assert wrap["body"]["status"] == "UNMEASURED"
    assert wrap["body"]["n"] == 20
    assert wrap["body"]["unmeasured"] == ["n<30 unquotable"]
    name = filename_for(wrap)
    assert name.startswith("unsigned-jail-")
    assert name.endswith(".json")


def test_empty_n_rejected() -> None:
    try:
        make_unsigned(axis="jail", model="kaggle:default", n=0, accuracy=None, route="kaggle-community")
    except ValueError as e:
        assert "empty is not a card" in str(e)
    else:
        raise AssertionError("n=0 must not produce a card")


def test_kernel_is_self_contained() -> None:
    src = (HERE / "kaggle_community_cells.py").read_text()
    assert "from mill_card" not in src
    assert "import mill_card" not in src
    assert "mill_hub_queue" not in re.sub(r'""".*?"""|#.*', "", src, flags=re.S), "kernel must not import the harness"
    assert "def make_unsigned(" in src


def test_inventory_counts_unique_refs() -> None:
    import kaggle_community_cells as cells

    original = cells._get_json
    cells._get_json = lambda _url: [
        {"ref": "csoai/one", "title": "one"},
        {"ref": "csoai/two", "title": "two"},
        {"ref": "csoai/one", "title": "duplicate"},
    ]
    try:
        inv = cells.inventory_community_datasets(("first", "second"))
    finally:
        cells._get_json = original
    assert inv["n"] == len(inv["refs"])
    assert inv["n"] == 2
    assert "not a grade" in inv["note"]


def test_reviewed_stream_is_consumed_without_authority_transfer() -> None:
    from kaggle_community_cells import CANONICAL_AUTHORITY, CONNECTOR_SCHEMA, validate_reviewed_stream

    core = {
        "schema": CONNECTOR_SCHEMA,
        "source": {"platform": "councilofai", "uri": "https://councilof.ai/root.json", "revision": "sha256:" + "a" * 64},
        "subject": {"kind": "measurement-root", "id": "gspc-root"},
        "measurement_kind": "gspc.root-manifest",
        "artifact": {"uri": "https://councilof.ai/root.json", "sha256": "a" * 64, "bytes": 1, "media_type": "application/json"},
        "timestamp": "2026-09-14T10:56:05Z",
        "license_provenance": {"license": "MIT", "provenance_uri": "https://councilof.ai/root.json"},
        "lifecycle": {"state": "published"},
        "error": None,
        "authority": CANONICAL_AUTHORITY,
        "mirror_role": "consumer",
    }
    row = dict(core)
    row["envelope_id"] = hashlib.sha256(
        json.dumps(core, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
    ).hexdigest()
    payload = (json.dumps(row) + "\n").encode()
    assert validate_reviewed_stream(payload) == [row]

    row["authority"] = {"uri": "https://kaggle.com", "role": "canonical-review-authority"}
    bad = (json.dumps(row) + "\n").encode()
    try:
        validate_reviewed_stream(bad)
    except ValueError as e:
        assert "replace authority" in str(e)
    else:
        raise AssertionError("Kaggle authority transfer must fail closed")


def test_reviewed_artifacts_are_hash_verified() -> None:
    import kaggle_community_cells as cells
    payload = b"x"
    row = {
        "artifact": {
            "uri": "https://councilof.ai/root.json",
            "sha256": hashlib.sha256(payload).hexdigest(),
            "bytes": len(payload),
        }
    }
    original = cells._get_bytes
    try:
        cells._get_bytes = lambda _url: payload
        cells.verify_reviewed_artifacts([row])
        cells._get_bytes = lambda _url: b"changed"
        try:
            cells.verify_reviewed_artifacts([row])
        except ValueError as e:
            assert "changed" in str(e)
        else:
            raise AssertionError("changed reviewed artifact must fail closed")
    finally:
        cells._get_bytes = original


# ── v0.2 item evidence (#2391 Kaggle harvest) ───────────────────────────────────

def _bank(n_items: int, labels_for) -> bytes:
    return "".join(
        json.dumps({"item": f"frozen item {i}", "expected": labels_for(i), "id": f"x-{i:03d}"}) + "\n"
        for i in range(n_items)
    ).encode()


def _stage(root: Path, bank_raw: bytes, answer, *, axis: str = "provenance", probes_left: int = 100):
    import kaggle_community_cells as k

    calls: list[str] = []

    def generate(prompt: str) -> str:
        calls.append(prompt)
        i = int(re.search(r"Item: frozen item (\d+)\n", prompt).group(1))
        return answer(i)

    work = root / "working"
    row = k.run_cell(
        axis=axis, bank_raw=bank_raw, bank_dataset="csoai/gspc-prv", bank_revision="a" * 40,
        model=MODEL, model_revision="b" * 40, generate=generate, provider_route=ROUTE,
        out_dirs=[work, work / "mill-out"], probes_left=probes_left,
    )
    return row, calls, work


def _two_label(i: int) -> str:
    return "SURVIVES" if i % 2 == 0 else "DESTROYED"


def test_grading_primitives_match_hub_mill() -> None:
    import kaggle_community_cells as k
    import mill_hub_queue as hub

    assert k.ITEM_EVIDENCE_SCHEMA == hub.ITEM_EVIDENCE_SCHEMA
    assert k.MILL_INSTRUMENT == hub.MILL_INSTRUMENT
    assert k.PROMPT_KEYS == hub.PROMPT_KEYS
    assert k.GRADING_MODE_SENTINELS == hub.GRADING_MODE_SENTINELS
    labels = ["SURVIVES", "DESTROYED", "SURVIVES"]
    assert k.axis_prompt("provenance", "x", labels) == hub.axis_prompt("provenance", "x", labels)
    for txt in ("SURVIVES", "Answer: destroyed.", "<think>SURVIVES</think>DESTROYED",
                "SURVIVES | DESTROYED", "", "reasoning\n**SURVIVES**", "maybe"):
        assert k.read_label(txt, labels) == hub.read_label(txt, labels), txt
    for bad in (["KEYWORD_MATCH"] * 3, ["YES"] * 3, [], ["KEYWORD_MATCH", "YES"]):
        for fn in (k.exact_label_menu, hub.exact_label_menu):
            try:
                fn(bad)
            except ValueError:
                pass
            else:
                raise AssertionError(f"{fn.__module__} accepted a one-option menu {bad}")
    with tempfile.TemporaryDirectory() as d:
        p = Path(d) / "bank.jsonl"
        p.write_text(
            json.dumps({"_canary": "c"}) + "\n\n"
            + json.dumps({"scenario": "s", "expected": "A"}) + "\n"
            + json.dumps({"question": "q", "expected": ""}) + "\n"
            + json.dumps({"prompt": "p", "expected": "B"}) + "\n"
        )
        assert k.load_bank(p) == hub.load_bank(p) == [("s", "A"), ("p", "B")]


def test_kaggle_card_lands_with_require_evidence_and_passes_admission() -> None:
    import land_mill_cards as lm
    from verify_hub_mill_evidence import validate_admission

    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        # 32 gradable items; the model answers every fifth one wrong.
        bank_raw = _bank(32, _two_label)
        row, calls, work = _stage(root, bank_raw, lambda i: ("DESTROYED" if i % 2 == 0 else "SURVIVES")
                                  if i % 5 == 0 else _two_label(i))
        assert row["state"] == "STAGED", row
        assert row["n"] == 30 and row["items"] == 30 and row["probes"] == 30 and len(calls) == 30
        assert len(set(calls)) == 30, "items are never repeated"
        wrap = json.loads((work / row["card"]).read_text())
        body = wrap["body"]
        assert body["status"] == "UNMEASURED" and wrap["signature"] is None
        assert body["unmeasured"] == ["signed-pending-verify"]
        assert body["accuracy"] == round(24 / 30, 4)
        ev = body["evidence"]
        assert ev["schema"] == "csoai.mill-item-evidence/0.2"
        assert ev["bank_sha256"] == hashlib.sha256(bank_raw).hexdigest()
        for key in ("items_sha256", "bank_sha256", "instrument_sha256"):
            assert re.fullmatch(r"[0-9a-f]{64}", ev[key]), key
        first = json.loads((work / ev["items_file"]).read_text().splitlines()[0])
        assert first["provider_route"] == ROUTE and first["expected"] == "SURVIVES"
        assert first["prompt_sha256"] == hashlib.sha256(first["prompt"].encode()).hexdigest()
        assert first["raw_output_sha256"] == hashlib.sha256(first["raw_output"].encode()).hexdigest()
        for sub in (work, work / "mill-out"):  # every card copy sits beside its bundle
            assert (sub / ev["items_file"]).is_file() and (sub / ev["bank_file"]).is_file()

        inbox, signed, evidence = root / "inbox", root / "signed", root / "evidence"
        rep = lm.land(work, inbox, signed, "34849702079", evidence_dir=evidence, require_evidence=True)
        assert len(rep["landed"]) == 1, rep
        assert rep["landed"][0]["quotable"] is True
        for skip in rep["skipped"]:
            assert skip["reason"] == "already-landed same id", skip
        landed = json.loads(next(inbox.glob("unsigned-*.json")).read_text())
        receipt = validate_admission(landed, evidence)
        assert receipt["summary"]["answered"] == 30 and receipt["summary"]["correct"] == 24
        assert receipt["summary"]["provider_routes"] == [ROUTE]

        # Control: the aggregate-only card the failing run produced is still refused.
        legacy = make_unsigned(axis="jail", model="t4:" + MODEL, n=20, accuracy=0.55, route="kaggle-community")
        old = root / "old"
        old.mkdir()
        (old / filename_for(legacy)).write_text(json.dumps(legacy))
        rep = lm.land(old, root / "inbox2", signed, "34849702079", evidence_dir=root / "ev2", require_evidence=True)
        assert rep["landed"] == [] and "no evidence bundle" in rep["skipped"][0]["reason"]


def test_tampered_items_fail_admission() -> None:
    from verify_hub_mill_evidence import EvidenceError, admit, validate_admission, validate_bundle

    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        row, _calls, work = _stage(root, _bank(30, _two_label), _two_label)
        wrap = json.loads((work / row["card"]).read_text())
        evidence = root / "evidence"
        wrap["admission"] = admit(wrap, work, evidence)
        validate_admission(wrap, evidence)

        items = evidence / wrap["body"]["evidence"]["items_file"]
        original = items.read_bytes()
        lines = original.splitlines(keepends=True)
        r0 = json.loads(lines[0])
        r0["raw_output"] = "DESTROYED"
        r0["raw_output_sha256"] = hashlib.sha256(b"DESTROYED").hexdigest()
        items.write_bytes(json.dumps(r0, sort_keys=True, separators=(",", ":")).encode() + b"\n" + b"".join(lines[1:]))
        try:
            validate_admission(wrap, evidence)
        except EvidenceError as e:
            assert "items digest mismatch" in str(e), e
        else:
            raise AssertionError("tampered items.jsonl must fail admission")

        # Re-hashing the tampered transcript into the card does not help: the grade no longer recomputes.
        body = copy.deepcopy(wrap["body"])
        body["evidence"]["items_sha256"] = hashlib.sha256(items.read_bytes()).hexdigest()
        try:
            validate_bundle(body, evidence)
        except EvidenceError as e:
            assert "does not recompute" in str(e), e
        else:
            raise AssertionError("a changed observed label must not recompute")

        # The route widening is exact: another runtime name is still refused.
        r1 = json.loads(original.splitlines()[0])
        r1["provider_route"] = "kaggle:t4"
        items.write_bytes(json.dumps(r1, sort_keys=True, separators=(",", ":")).encode() + b"\n" + b"".join(lines[1:]))
        body = copy.deepcopy(wrap["body"])
        body["evidence"]["items_sha256"] = hashlib.sha256(items.read_bytes()).hexdigest()
        try:
            validate_bundle(body, evidence)
        except EvidenceError as e:
            assert "provider route" in str(e), e
        else:
            raise AssertionError("an unnamed provider route must fail admission")


def test_short_bank_stays_unmeasured_without_padding() -> None:
    import land_mill_cards as lm
    from verify_hub_mill_evidence import validate_admission

    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        row, calls, work = _stage(root, _bank(12, _two_label), _two_label)
        assert row["state"] == "STAGED", row
        assert row["n"] == 12 and row["items"] == 12 and len(calls) == 12 == len(set(calls))
        body = json.loads((work / row["card"]).read_text())["body"]
        assert body["status"] == "UNMEASURED" and body["n"] == 12
        assert body["unmeasured"] == ["n<30 unquotable; frozen bank has 12 gradable items, none repeated"]
        assert len((work / body["evidence"]["items_file"]).read_text().splitlines()) == 12

        rep = lm.land(work, root / "inbox", root / "signed", "1", evidence_dir=root / "ev", require_evidence=True)
        assert len(rep["landed"]) == 1 and rep["landed"][0]["quotable"] is False
        landed = json.loads(next((root / "inbox").glob("unsigned-*.json")).read_text())
        assert validate_admission(landed, root / "ev")["summary"]["answered"] == 12

        # Unparsed answers leave the denominator; 30 items with 1 unparsed is n=29, still UNMEASURED.
        row, _calls, work = _stage(root / "b", _bank(30, _two_label), lambda i: "not sure" if i == 7 else _two_label(i))
        body = json.loads((work / row["card"]).read_text())["body"]
        assert body["n"] == 29 and body["status"] == "UNMEASURED"
        assert body["unmeasured"] == ["n<30 unquotable; 1 of 30 items returned no parseable label"]


def test_one_option_bank_refused_before_any_probe() -> None:
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        for label in ("CONFINED", "KEYWORD_MATCH"):
            row, calls, work = _stage(root / label, _bank(37, lambda _i: label), lambda _i: label, axis="jail")
            assert row["state"] == "REFUSED" and "one-option menu refused" in row["reason"], row
            assert row["probes"] == 0 and calls == []
            assert not list(work.rglob("unsigned-*.json")) and not list(work.rglob("items-*.jsonl"))


def test_pinned_bank_bytes_and_probe_cap_fail_closed() -> None:
    import kaggle_community_cells as k

    raw = _bank(30, _two_label)
    pin = {"axis": "provenance", "bank_dataset": "csoai/gspc-prv", "bank_revision": "a" * 40,
           "bank_path": "items.jsonl", "bank_sha256": hashlib.sha256(raw).hexdigest()}
    assert k.fetch_pinned_bank(pin, get=lambda _u, _t: raw) == raw
    for bad_pin, fetched in ((pin, raw + b"\n"), (dict(pin, bank_revision="main"), raw)):
        try:
            k.fetch_pinned_bank(bad_pin, get=lambda _u, _t, b=fetched: b)
        except ValueError:
            pass
        else:
            raise AssertionError("a moved or unpinned bank must be refused")
    for p in k.BANK_PINS:
        assert re.fullmatch(r"[0-9a-f]{40}", p["bank_revision"]) and re.fullmatch(r"[0-9a-f]{64}", p["bank_sha256"])
    assert k.PROBE_CAP == 100 and k.ITEMS_CAP == 30

    with tempfile.TemporaryDirectory() as d:
        row, calls, work = _stage(Path(d), raw, _two_label, probes_left=29)
        assert row["state"] == "REFUSED" and "probe_cap" in row["reason"] and calls == []
        assert not list(work.rglob("unsigned-*.json"))
        row, calls, _work = _stage(Path(d) / "m", raw, _two_label)
        import kaggle_community_cells as kk
        norev = kk.run_cell(axis="provenance", bank_raw=raw, bank_dataset="csoai/gspc-prv", bank_revision="a" * 40,
                            model=MODEL, model_revision=None, generate=lambda _p: "SURVIVES",
                            provider_route=ROUTE, out_dirs=[Path(d) / "n"], probes_left=100)
        assert norev["state"] == "REFUSED" and "model revision" in norev["reason"] and norev["probes"] == 0


if __name__ == "__main__":
    tests = [(name, fn) for name, fn in list(globals().items()) if name.startswith("test_") and callable(fn)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print("PASS", name)
        except Exception as error:  # noqa: BLE001 — report every test, then fail the run
            failed += 1
            print("FAIL", name, f"{type(error).__name__}: {error}"[:300])
    print(f"{len(tests) - failed} passed, {failed} failed")
    if failed:
        raise SystemExit(1)
    print("PASS test_mill_card")
