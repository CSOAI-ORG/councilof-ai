#!/usr/bin/env python3
"""gspc_bank_language.py — the language of each GSPC bank's items, read from the published bytes.

WHY
  The model-comparison banks on the board are written in English and the board did not say so. A
  reader who asks "does this number hold in another language?" could not answer it from
  GET /api/gspc. The dataset cards carry `language: en`, but that tag is stamped on every card (the
  fact-run datasets with no item text carry it too), so a card tag is a declaration, not a reading
  of the items. This producer reads the items. The first run showed why that matters: the care
  bank's card declares English only, and one of its 199 item texts is not English.

WHAT IT READS
  For each model-comparison axis, the published file the SERVED bank's items are in:
    * the per-item rows the axis is graded on (csoai/gspc-peritem-rows-2026-08-12, field `item`),
      the same files functions/api/_gspc_rows_separation.ts binds by sha256; or
    * where those rows are not the served bank (jail, swarm), the bank's samples.jsonl (field
      `input`), the same files scripts/gspc_bank_distinct.py pins;
  and the dataset card (README.md) of that dataset at the same revision.
  Every file is fetched at a pinned revision and checked against a pinned sha256 before a byte is
  read; one byte off and the run stops.

HOW EACH DISTINCT ITEM TEXT IS DECIDED (canary rows are not items)
  1. A reviewer's verdict for that exact text, where one is recorded in
     scripts/gspc_bank_language_review.json (keyed by the sha256 of the normalised text), wins.
     A verdict is "en" or "other" (with the language it reads as).
  2. Otherwise the text is English when every letter is Latin script AND the text outside any ```
     fenced code block holds at least one word of EN_FUNCTION_WORDS.
  3. Otherwise it is UNDECIDED. A terse item ("Falcon lattice-based signatures.") carries no
     function word in any language, and a rule cannot tell what it is. A reviewer has to read it.
  The review file says who read the texts and when. The reviewer here is an AI agent reading the
  published bytes, not a linguist; any reader can list the same texts with --reviewed and disagree.

WHAT IT DECIDES
  state CENSUSED     iff the card declares a language, at least one text was read, and NO text is
                     undecided. texts_by_language then accounts for every text.
  state UNMEASURED   otherwise, with a reason code. One undecided text is enough: a bank that
                     changes fails closed until someone reads the new text.
  A review entry that matches no text in the bank stops the run, so the table cannot rot.
  The census reads the item text in the published file. Any instruction the harness adds around
  an item is not in that file and is not read.

MODES
  --board REPO      fetch, count, and write functions/api/_gspc_bank_language.ts inside REPO.
  --check REPO      fetch, count, and exit 1 if the committed module differs from a fresh run.
  --local-dir DIR   read DIR/<dataset name>/<file> instead of fetching (still sha256-checked).
  --undecided       print every text no rule and no review entry decides, with its sha256.
  --reviewed        print every text a review entry decides, with its verdict.

Unsigned: the module changes no signed byte.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import unicodedata
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gspc_bank_distinct import normalise_prompt, prompt_sha256  # noqa: E402  (one definition of "the same text")

PRODUCER = "scripts/gspc_bank_language.py"
SCHEMA = "csoai.gspc-bank-language/0.1"
MODULE = "functions/api/_gspc_bank_language.ts"
REVIEW = "scripts/gspc_bank_language_review.json"
REVIEW_SCHEMA = "csoai.gspc-bank-language-review/0.1"

STATE_OK = "CENSUSED"
STATE_UNMEASURED = "UNMEASURED"

METHOD = (
    "For each model-comparison axis the published file holding the served bank's items is fetched at a "
    "pinned revision and checked against a pinned sha256, with the dataset card (README.md) of the same "
    "revision. Each distinct item text (canary rows excluded) is decided in this order: a reviewer's "
    "recorded verdict for that exact text (keyed by sha256) wins; otherwise the text is English when every "
    "letter is Latin script and the text outside any fenced code block holds at least one word of a fixed "
    "list of English function words; otherwise it is undecided. A terse item carries no function word in "
    "any language, so a reviewer reads those. An axis is CENSUSED only when its card declares a language "
    "and no text is left undecided; one undecided text makes it UNMEASURED."
)
SCOPE = (
    "The census reads the item text in the published file. Any instruction the harness adds around an item "
    "is not in that file and was not read. The reviewer is an AI agent reading the published bytes, not a "
    "linguist: a verdict of 'other' names the language a text reads as, and anyone can list the reviewed "
    "texts with the producer's --reviewed mode and check them."
)

# English function words (articles, prepositions, conjunctions, auxiliaries, pronouns, determiners).
# Short words that are also everyday words of French, German, Spanish, Italian or Portuguese
# (a, an, in, is, on, or, as, no, me, he, we, do, at, was, so, i, has, had, will, all, but) are
# left out on purpose, so a hit is evidence of English and not of "some Latin-script language".
# The list is pinned: the test holds its sha256.
EN_FUNCTION_WORDS = (
    "the and of to that it for with be by this from which were been being its can could would should "
    "shall may might must if their they them does did when what where who whose how why any each not "
    "are you your our these those there then than into about after before between without within "
    "through while because whether only other such both some have having"
).split()
_EN = frozenset(EN_FUNCTION_WORDS)

ROWS_DATASET = "csoai/gspc-peritem-rows-2026-08-12"
ROWS_REVISION = "294e4cf9e8b72a00aa50de024b3ed3e7ab0b3361"
ROWS_CARD_SHA256 = "9b987bcbf78664b672285b27bc12a187f3a1c5e043bb3249bddacc2b5864932e"
ROWS_IS = "the published per-item rows this axis is graded on"
BANK_IS = "the served bank's published samples (its per-item rows are not published, or are a retired bank)"


def _rows(file: str, sha256: str) -> dict:
    return {
        "dataset": ROWS_DATASET, "revision": ROWS_REVISION, "file": f"rows/{file}", "sha256": sha256,
        "text_field": "item", "source_is": ROWS_IS, "card_file": "README.md", "card_sha256": ROWS_CARD_SHA256,
    }


# One entry per model-comparison axis. Pinned by revision AND sha256. The rows files are the ones
# functions/api/_gspc_rows_separation.ts binds; jail and swarm are the ones gspc_bank_distinct.py pins.
BANKS = {
    "governance": _rows("peritem_gov.jsonl", "3a1d3193d3651448dd311efe4c7efcbdffb19e07fba06c15e628b844bfbfa2a5"),
    "safety": _rows("peritem_agi.jsonl", "b70ccaa015668a80aeb50196623e8a138b6238e023b6cdff4308ee4fd592b2cb"),
    "provenance": _rows("peritem_prv.jsonl", "fb9efe3afda9d075cf38607c53f1c6a8044909b642e58747b9559a87fcc83237"),
    "continuity": _rows("peritem_asi.jsonl", "f90910c6cede5f97a1158226535020c17cf6f7f22a19ce65201511b179ef9e40"),
    "conformance": _rows("peritem_mcp.jsonl", "9ac4db30d9d0039555702445ab940346974da36b4b1d8de58dc775849caa26da"),
    "openness": _rows("peritem_oss.jsonl", "f04421a8a8b4a6f01d79dfe771ede8ef40de4338955dcb64a48244df9008685f"),
    "machinery-conformity": _rows("peritem_mach.jsonl", "d3133100c2889cf259f2faa5390c69ccd3c71ac157fbb4ccd369b3c679996a0b"),
    "care": _rows("peritem_care.jsonl", "888f230b58e5d78a8570244b9e8374c9740f24c3d6fd9f45d67b372db25f27b2"),
    "cross-reality": _rows("peritem_xr.jsonl", "34758dd55d2b632e8a2a26390c3f1e01d7044a92e8c38d7ee76bd0386bcc8a6a"),
    "detector-interop": _rows("peritem_det.jsonl", "665e358bedbaf899620fd5119a2a9d9b1415eb91396a463955c0e667c21b94a3"),
    "art5-safeguard": _rows("peritem_art5.jsonl", "950861961ed3e1d0481c4577850b908b41ef696785b500956f11c502015cf1a3"),
    "affect": _rows("peritem_affect.jsonl", "7e8a612889d486df40ba638e36ba976cd2820460272fe65c0202e271c95e99e7"),
    "swarm": {
        "dataset": "csoai/gspc-swarm", "revision": "32cfaa0e2e7de4a62eee85ab79aa72dd5df01e4a",
        "file": "samples.jsonl", "sha256": "2d5a791f971f98a83fd34b38a12cd222386a076fbf0dc46a4c8ebad2839dd26f",
        "text_field": "input", "source_is": BANK_IS,
        "card_file": "README.md", "card_sha256": "0405ed5dd27a1cde09b27888731655c50a661acb5caf32de61674dc61fa2a7ea",
    },
    "jail": {
        "dataset": "csoai/gspc-jail-goldbank", "revision": "df16e7855ff04b90fea19aa5f11f4b86cb466a47",
        "file": "samples.jsonl", "sha256": "0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a",
        "text_field": "input", "source_is": BANK_IS,
        "card_file": "README.md", "card_sha256": "3d9e94609e4c5c813229ac93e61c0dd6b3731adba561931a881cabed33121056",
    },
}

_WORD = re.compile(r"[a-z]+")
_FENCE = re.compile(r"```.*?(?:```|\Z)", re.S)
_LANG_KEY = re.compile(r"^language:[ \t]*(.*)$")
_LIST_ITEM = re.compile(r"^[ \t]*-[ \t]+(.+?)[ \t]*$")
_TAG = re.compile(r"^[a-z]{2,3}$")


def declared_languages(card_text: str):
    """The top-level `language:` list of a dataset card's YAML front matter, lower-cased and sorted.

    Returns None when there is no front matter or no language key: absent is not English.
    Reads the three shapes a card uses: a block list, an inline [a, b] list, and a bare scalar.
    """
    if not card_text.startswith("---"):
        return None
    end = card_text.find("\n---", 3)
    if end < 0:
        return None
    lines = card_text[3:end].splitlines()
    for i, line in enumerate(lines):
        m = _LANG_KEY.match(line)
        if not m:
            continue
        rest = m.group(1).strip()
        if rest.startswith("["):
            vals = rest.strip("[]").split(",")
        elif rest:
            vals = [rest]
        else:
            vals = []
            for nxt in lines[i + 1:]:
                item = _LIST_ITEM.match(nxt)
                if item:
                    vals.append(item.group(1))
                elif nxt.strip():
                    break
        out = sorted({v.strip().strip("'\"").lower() for v in vals if v.strip().strip("'\"")})
        return out or None
    return None


def has_non_latin_letter(text: str) -> bool:
    """True when any letter is not Latin script. Punctuation, digits and symbols are not letters."""
    for ch in text:
        if unicodedata.category(ch).startswith("L") and not unicodedata.name(ch, "").startswith("LATIN"):
            return True
    return False


def has_code_fence(text: str) -> bool:
    return "```" in text


def has_english_function_word(text: str) -> bool:
    """At least one word of EN_FUNCTION_WORDS in the text outside any fenced code block.

    Code is read out: `for`, `if`, `with`, `from` and `not` are Python keywords, and counting them
    would find English in a cell that holds none.
    """
    prose = _FENCE.sub(" ", text)
    return any(w in _EN for w in _WORD.findall(prose.lower()))


def parse_rows(data: bytes) -> list:
    """Every graded row. A canary row (`_canary` set) is not an item; `_canary: null` is a graded row."""
    rows = []
    for i, line in enumerate(data.decode("utf-8").splitlines(), 1):
        if not line.strip():
            continue
        r = json.loads(line)
        if not isinstance(r, dict):
            raise ValueError(f"line {i}: not an object")
        if r.get("_canary"):
            continue
        rows.append(r)
    return rows


def distinct_texts(rows: list, field: str) -> dict:
    """sha256 of the normalised text -> the normalised text, over every graded row."""
    out = {}
    for i, r in enumerate(rows):
        if not isinstance(r.get(field), str):
            raise ValueError(f"row {i}: text field {field!r} missing or not a string")
        out.setdefault(prompt_sha256(r[field]), normalise_prompt(r[field]))
    return out


def check_review(review: dict) -> dict:
    """Refuse a malformed verdict before it can decide anything. Returns the same mapping."""
    for h, v in review.items():
        if not re.match(r"^[0-9a-f]{64}$", h):
            raise ValueError(f"review key {h!r} is not a sha256")
        if not isinstance(v, dict) or v.get("verdict") not in ("en", "other"):
            raise ValueError(f"review {h[:12]}…: verdict must be 'en' or 'other'")
        if v["verdict"] == "other" and not _TAG.match(str(v.get("reads_as", ""))):
            raise ValueError(f"review {h[:12]}…: an 'other' verdict must say what it reads_as (a language tag)")
        if v["verdict"] == "other" and v.get("reads_as") == "en":
            raise ValueError(f"review {h[:12]}…: 'other' cannot read as en")
    return review


def decide(text: str, verdict) -> tuple:
    """Pure: (language tag or None, basis). None is UNDECIDED. A recorded verdict always wins."""
    if verdict is not None:
        return ("en", "review") if verdict["verdict"] == "en" else (verdict["reads_as"], "review")
    if not has_non_latin_letter(text) and has_english_function_word(text):
        return ("en", "function_word")
    return (None, "undecided")


def census(texts: dict, review: dict) -> dict:
    """Pure: the counts over distinct item texts. `review` is this axis's sha256 -> verdict table."""
    stale = sorted(h for h in review if h not in texts)
    if stale:
        raise ValueError(f"{len(stale)} review entr{'y matches' if len(stale) == 1 else 'ies match'} no item text: {stale[0][:16]}…")
    by_language = {}
    by_review = 0
    by_word = 0
    undecided = 0
    for h, t in texts.items():
        tag, basis = decide(t, review.get(h))
        if tag is None:
            undecided += 1
            continue
        by_language[tag] = by_language.get(tag, 0) + 1
        if basis == "review":
            by_review += 1
        else:
            by_word += 1
    ordered = dict(sorted(by_language.items(), key=lambda kv: (-kv[1], kv[0])))
    return {
        "item_texts": len(texts),
        "texts_by_language": ordered,
        "texts_decided_by_function_word": by_word,
        "texts_decided_by_review": by_review,
        "texts_undecided": undecided,
        "texts_with_non_latin_letters": sum(1 for t in texts.values() if has_non_latin_letter(t)),
        "texts_with_code_fence": sum(1 for t in texts.values() if has_code_fence(t)),
    }


def determine(declared, counts: dict) -> dict:
    """Pure: the state. Fails closed — every branch but the last is UNMEASURED."""
    if not declared:
        return {"state": STATE_UNMEASURED, "reason_code": "NO_DECLARATION"}
    if counts["item_texts"] == 0:
        return {"state": STATE_UNMEASURED, "reason_code": "NO_ITEM_TEXT"}
    if counts["texts_undecided"] > 0:
        return {"state": STATE_UNMEASURED, "reason_code": "UNDECIDED_TEXTS"}
    languages = list(counts["texts_by_language"])
    return {
        "state": STATE_OK,
        "languages": languages,
        "english_only": languages == ["en"],
        "declaration_holds": sorted(languages) == sorted(declared),
    }


def fetch(dataset: str, revision: str, file: str, sha256: str, local_dir=None) -> bytes:
    if local_dir:
        with open(os.path.join(local_dir, dataset.split("/")[-1], file), "rb") as f:
            data = f.read()
    else:
        url = f"https://huggingface.co/datasets/{dataset}/resolve/{revision}/{file}"
        with urllib.request.urlopen(url, timeout=120) as r:  # noqa: S310 (pinned https host)
            data = r.read()
    got = hashlib.sha256(data).hexdigest()
    if got != sha256:
        raise SystemExit(f"{dataset}/{file}: sha256 {got} != pinned {sha256}; refusing")
    return data


def word_list_sha256() -> str:
    return hashlib.sha256("\n".join(EN_FUNCTION_WORDS).encode("utf-8")).hexdigest()


def load_review(repo: str):
    """(parsed review document, sha256 of its bytes)."""
    with open(os.path.join(repo, REVIEW), "rb") as f:
        raw = f.read()
    doc = json.loads(raw.decode("utf-8"))
    if doc.get("schema") != REVIEW_SCHEMA:
        raise SystemExit(f"{REVIEW}: schema {doc.get('schema')!r} != {REVIEW_SCHEMA}")
    unknown = sorted(set(doc.get("axes", {})) - set(BANKS))
    if unknown:
        raise SystemExit(f"{REVIEW}: review for an axis with no pinned bank: {unknown}")
    return doc, hashlib.sha256(raw).hexdigest()


def read_axis(axis: str, local_dir=None) -> dict:
    spec = BANKS[axis]
    data = fetch(spec["dataset"], spec["revision"], spec["file"], spec["sha256"], local_dir=local_dir)
    rows = parse_rows(data)
    return {"rows": len(rows), "texts": distinct_texts(rows, spec["text_field"])}


def build(review_doc: dict, review_sha256: str, local_dir=None) -> dict:
    axes = {}
    cards = {}
    reviewed = 0
    for axis, spec in BANKS.items():
        ck = (spec["dataset"], spec["revision"], spec["card_file"], spec["card_sha256"])
        if ck not in cards:
            cards[ck] = declared_languages(fetch(*ck, local_dir=local_dir).decode("utf-8"))
        declared = cards[ck]
        got = read_axis(axis, local_dir)
        review = check_review(review_doc.get("axes", {}).get(axis, {}))
        reviewed += len(review)
        counts = census(got["texts"], review)
        axes[axis] = {
            "dataset": spec["dataset"],
            "revision": spec["revision"],
            "file": spec["file"],
            "file_sha256": spec["sha256"],
            "text_field": spec["text_field"],
            "source_is": spec["source_is"],
            "card_file": spec["card_file"],
            "card_sha256": spec["card_sha256"],
            "declared_languages": declared,
            "rows": got["rows"],
            **counts,
            **determine(declared, counts),
        }
    return {
        "schema": SCHEMA,
        "producer": PRODUCER,
        "method": METHOD,
        "scope": SCOPE,
        "english_function_words": {"count": len(EN_FUNCTION_WORDS), "sha256": word_list_sha256()},
        "review": {
            "file": REVIEW,
            "sha256": review_sha256,
            "reviewer": review_doc.get("reviewer"),
            "reviewed_on": review_doc.get("reviewed_on"),
            "verdicts": reviewed,
        },
        "signed": False,
        "axes": axes,
    }


def render(doc: dict) -> str:
    return (
        f"/** GENERATED by {PRODUCER} from the published bank files (pinned revision + sha256)\n"
        f" * and the review table {REVIEW}. Do not edit by hand — re-run the producer.\n"
        " * Unsigned: it changes no signed byte. */\n"
        f"export const BANK_LANGUAGE = {json.dumps(doc, indent=2, ensure_ascii=False)} as const;\n"
    )


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board", metavar="REPO")
    ap.add_argument("--check", metavar="REPO")
    ap.add_argument("--local-dir", metavar="DIR")
    ap.add_argument("--undecided", action="store_true")
    ap.add_argument("--reviewed", action="store_true")
    a = ap.parse_args(argv)
    repo = a.board or a.check or os.path.dirname(HERE)
    review_doc, review_sha = load_review(repo)

    if a.undecided or a.reviewed:
        for axis in BANKS:
            review = check_review(review_doc.get("axes", {}).get(axis, {}))
            for h, t in sorted(read_axis(axis, a.local_dir)["texts"].items(), key=lambda kv: kv[1]):
                tag, basis = decide(t, review.get(h))
                if (a.undecided and tag is None) or (a.reviewed and basis == "review"):
                    print(f"{axis}\t{h}\t{tag or 'UNDECIDED'}\t{t}")
        return 0

    doc = build(review_doc, review_sha, a.local_dir)
    for axis, e in doc["axes"].items():
        print(
            f"  {axis:21s} texts={e['item_texts']:4d} by_language={e['texts_by_language']} "
            f"word={e['texts_decided_by_function_word']:4d} review={e['texts_decided_by_review']:3d} "
            f"undecided={e['texts_undecided']} declared={e['declared_languages']} -> {e['state']}"
        )
    text = render(doc)
    if a.check:
        with open(os.path.join(a.check, MODULE), encoding="utf-8") as f:
            if f.read() != text:
                print(f"STALE: {MODULE} differs from a fresh run", file=sys.stderr)
                return 1
        print(f"OK: {MODULE} matches a fresh run")
    if a.board:
        with open(os.path.join(a.board, MODULE), "w", encoding="utf-8") as f:
            f.write(text)
        print(f"wrote {MODULE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
