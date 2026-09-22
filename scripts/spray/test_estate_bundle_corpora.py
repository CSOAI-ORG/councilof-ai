"""The living-registry card count must be READ, never derived from the container's length.

An earlier revision of build_cards() wrote `len(live_cards.get("cards", []))` for corpus
"living". GET /api/cards returns `cards` as an OBJECT, so len() counted its KEYS — four —
and 4 shipped as the living-registry card count until someone read it off a figure. The
four keys are count, signed, list and full_count_hint, so the wrong answer is small,
plausible and silent: it is a card count that looks like a card count.

The fixture below is the real response shape (probed live 2026-09-22): four keys, and
cards.count = 336. Under the bug this test reads 4; under the fix it reads 336. Nothing
else here distinguishes them, which is the point — see also the truncated-in-the-middle
trap the same bundle guards against elsewhere.

Offline: every network read is monkeypatched. No token, no fetch, no signing.
"""
from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

HERE = Path(__file__).resolve().parent
SPEC = importlib.util.spec_from_file_location("build_estate_bundle",
                                              HERE / "build_estate_bundle.py")
assert SPEC and SPEC.loader
bundle = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bundle)

# GET /api/cards, verbatim in shape: `cards` is an object of four keys. `list` is a
# 100-row page and is NOT the population, which is exactly why its length must not be
# used either. Trimmed to three rows here; the count it carries is the live 336.
API_CARDS = {
    "schema": "csoai.cards/0.1",
    "issuer": "did:web:csoai.org",
    "measured_on": "2026-08-18T03:22:16Z",
    "cards": {
        "count": 336,
        "signed": 336,
        "list": [{"id": f"card-{i}"} for i in range(3)],
        "full_count_hint": 336,
    },
}

API_STATE = {
    "public_root": {
        "card_count": {"value": 305, "kind": "catalogued", "as_of": "2026-09-17T00:00:00Z"},
        "corpus_relation": {"identifier_overlap": 0, "relationship": "SEPARATE_CORPORA"},
    },
    "signed_cards": {"count": {"value": 335, "kind": "measured",
                               "as_of": "2026-09-05T00:00:00Z"}},
    "card_chain": {"bodies_verified_valid": {"value": 335, "kind": "measured"}},
}

CARDS_BUNDLE = {"card_count": 1072, "as_of": "2026-09-05T00:00:00Z"}


@pytest.fixture()
def repo(tmp_path: Path) -> Path:
    """The parts of the working tree build_cards() reads. One signed mill card, an empty
    supersession ledger, the corpora doc it copies, and one evidence file."""
    mill = tmp_path / "public/interop/mill-cards-signed"
    mill.mkdir(parents=True)
    (mill / "signed-affect-0000.json").write_text(json.dumps({
        "id": "sha256:0000", "did": "did:web:csoai.org#board-attestation-1",
        "alg": "Ed25519", "signature": "00" * 64,
        "body": {"axis": "affect", "model": "m", "n": 30, "accuracy": 0.5,
                 "status": "MEASURED", "evidence": {}},
    }))
    (mill / "SUPERSEDED.jsonl").write_text("")
    (tmp_path / "council-os").mkdir()
    (tmp_path / "council-os/CARD-CORPORA.md").write_text("# corpora\n")
    ev = tmp_path / "public/interop/mill-evidence"
    ev.mkdir(parents=True)
    (ev / "items-affect-0000.jsonl").write_text('{"observed": "a"}\n')
    return tmp_path


@pytest.fixture()
def offline(monkeypatch: pytest.MonkeyPatch):
    """Answer the three endpoint reads build_cards() makes; fail loudly on any other URL,
    so a new fetch cannot quietly reach the network from inside a test."""
    payloads = {
        "https://councilof.ai/api/state": API_STATE,
        "https://councilof.ai/cards-bundle.json": CARDS_BUNDLE,
        "https://councilof.ai/api/cards": API_CARDS,
    }

    def fake_get(url: str, tolerate=()) -> bytes:
        if url not in payloads:
            raise AssertionError(f"unstubbed network read: {url}")
        return json.dumps(payloads[url]).encode()

    monkeypatch.setattr(bundle, "get", fake_get)


def corpus(result: dict, name) -> dict:
    (row,) = [c for c in result["corpora"] if c["corpus"] == name]
    return row


def test_living_registry_count_is_read_not_len(tmp_path: Path, repo: Path, offline) -> None:
    result = bundle.build_cards(tmp_path / "out", repo)
    living = corpus(result, "living")
    assert living["value"] == 336, "living registry must carry cards.count"
    # The regression, named: len() over the same object yields the number of keys.
    assert living["value"] != len(API_CARDS["cards"]) == 4
    # ...and not the length of the 100-row page either.
    assert living["value"] != len(API_CARDS["cards"]["list"])
    assert living["field"] == "cards.count"


def test_each_corpus_keeps_its_own_number(tmp_path: Path, repo: Path, offline) -> None:
    """Five readings of five sets of bytes. Never added, never reconciled, never swapped."""
    result = bundle.build_cards(tmp_path / "out", repo)
    assert [(c["corpus"], c["value"]) for c in result["corpora"]] == [
        (1, 1072), (2, 305), (3, 335), ("living", 336), ("mill", 1),
    ]
    for c in result["corpora"]:
        assert c["identifier_overlap_with_other_corpora"] == 0
        assert c["relationship"] == "SEPARATE_CORPORA"


def test_corpora_row_is_written_to_the_bundle(tmp_path: Path, repo: Path, offline) -> None:
    """The value the caller returns and the value published on disk are the same read."""
    out = tmp_path / "out"
    bundle.build_cards(out, repo)
    rows = [json.loads(l) for l in
            (out / "cards/card-corpora.jsonl").read_text().splitlines() if l.strip()]
    (living,) = [r for r in rows if r["corpus"] == "living"]
    assert living["value"] == 336
