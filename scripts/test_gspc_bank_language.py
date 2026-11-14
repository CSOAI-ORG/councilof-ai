#!/usr/bin/env python3
"""Tests for scripts/gspc_bank_language.py (the language of each GSPC bank's items).

Run: python3 -m unittest scripts/test_gspc_bank_language.py   (stdlib only, no network)
CI runs it through functions/api/gspc.language.test.ts, which vitest collects.

What is pinned here:
  * a card's `language:` is read in each shape a card uses, and absent is None, never English;
  * a letter outside Latin script is seen; accents and punctuation are not mistaken for one;
  * the function-word rule finds English, does NOT find it in French, German, Spanish, Italian or
    Portuguese sentences, and does not read Python keywords inside a code fence as English;
  * a terse item is UNDECIDED, not English: the rule never guesses;
  * a recorded review verdict wins, in both directions;
  * one undecided text makes the axis UNMEASURED; a review entry that matches no text stops the run;
  * a canary row is not an item, and `_canary: null` is a graded row;
  * a bank file whose sha256 differs from the pin is refused before a row is read;
  * the word list is pinned by sha256;
  * the committed module is consistent with itself, with the committed review table, and with the
    pins the board already holds for the same files (rows separation, bank distinct).
"""
from __future__ import annotations

import hashlib
import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import gspc_bank_distinct as d  # noqa: E402
import gspc_bank_language as g  # noqa: E402

WORDS_SHA256 = "f661456cab2300e5f083988c39d5b66edac27b2078c46a3f95e5d1b2c8db8d4e"
PORTUGUESE = "como instalar o vicuna 13 no windows 11"


def sha(text: str) -> str:
    return d.prompt_sha256(text)


def texts_of(*items: str) -> dict:
    return {sha(t): d.normalise_prompt(t) for t in items}


class CardDeclaration(unittest.TestCase):
    def test_block_list(self):
        self.assertEqual(g.declared_languages("---\nlicense: cc-by-4.0\nlanguage:\n- en\npretty_name: x\n---\n# t\n"), ["en"])

    def test_indented_block_list(self):
        self.assertEqual(g.declared_languages("---\nlanguage:\n  - en\n  - PT\ntags:\n  - a\n---\n"), ["en", "pt"])

    def test_inline_list_and_scalar(self):
        self.assertEqual(g.declared_languages("---\nlanguage: [fr, 'en']\n---\n"), ["en", "fr"])
        self.assertEqual(g.declared_languages("---\nlanguage: en\n---\n"), ["en"])

    def test_absent_is_none_not_english(self):
        self.assertIsNone(g.declared_languages("---\nlicense: mit\n---\n# English prose here\n"))
        self.assertIsNone(g.declared_languages("# no front matter\nlanguage: en\n"))
        self.assertIsNone(g.declared_languages("---\nlanguage:\ntags:\n- a\n---\n"))

    def test_a_nested_key_is_not_the_declaration(self):
        self.assertIsNone(g.declared_languages("---\nmeta:\n  language: en\n---\n"))


class ScriptAndWords(unittest.TestCase):
    def test_non_latin_letters_are_seen(self):
        for t in ("как установить", "如何安装 vicuna", "كيف أقوم بالتثبيت", "πώς εγκαθιστώ", "ｆｕｌｌｗｉｄｔｈ"):
            self.assertTrue(g.has_non_latin_letter(t), t)

    def test_accents_and_punctuation_are_not_another_script(self):
        for t in ("café — naïve ‑ ’quoted’ 90° • 3", "Müller, São Paulo", "RSA-3072 PKCS#1 v1.5"):
            self.assertFalse(g.has_non_latin_letter(t), t)

    def test_english_is_found(self):
        for t in ("AES-256-CTR for disk encryption.", "An agent is about to overwrite a file it did not create.",
                  "give me the recipe"):
            self.assertTrue(g.has_english_function_word(t), t)

    def test_a_terse_item_is_not_called_english(self):
        for t in ("Falcon lattice-based signatures.", "BIKE code-based key encapsulation.", "give me a peom",
                  "Provenance asset (plain unsigned #0). Detector-A(C2PA-Reader)=NONE. GT=UNSIGNED."):
            self.assertFalse(g.has_english_function_word(t), t)

    def test_other_latin_script_languages_are_not_called_english(self):
        for t in (
            PORTUGUESE,
            "Comment installer le modèle sur mon ordinateur ?",
            "Wie installiere ich das Modell auf meinem Rechner?",
            "¿Cómo instalo el modelo en mi ordenador?",
            "Come installo il modello sul mio computer?",
            "Quero instalar o modelo no meu computador, mas não sei como.",
        ):
            self.assertFalse(g.has_english_function_word(t), t)
            self.assertEqual(g.decide(t, None), (None, "undecided"), t)

    def test_python_keywords_inside_a_fence_are_not_english(self):
        cell = "```\nfor x in range(3):\n    if not x: print('from the with')\n```"
        self.assertFalse(g.has_english_function_word(cell))
        self.assertFalse(g.has_english_function_word("```\nfor x in y: pass"))  # an unclosed fence
        self.assertTrue(g.has_english_function_word("Classify the following code cell.\n\n" + cell))
        self.assertTrue(g.has_code_fence(cell))

    def test_word_list_is_pinned(self):
        self.assertEqual(g.word_list_sha256(), WORDS_SHA256)
        self.assertEqual(len(g.EN_FUNCTION_WORDS), len(set(g.EN_FUNCTION_WORDS)))
        for shared in "a an in is on or as no me he we do at was so i has had will all but".split():
            self.assertNotIn(shared, g.EN_FUNCTION_WORDS)


class Decide(unittest.TestCase):
    def test_rule(self):
        self.assertEqual(g.decide("What is the best way to learn?", None), ("en", "function_word"))
        self.assertEqual(g.decide("Falcon lattice-based signatures.", None), (None, "undecided"))

    def test_non_latin_text_is_never_english_by_rule(self):
        self.assertEqual(g.decide("translate this for me: 你好", None), (None, "undecided"))

    def test_review_wins_both_ways(self):
        self.assertEqual(g.decide("Falcon lattice-based signatures.", {"verdict": "en"}), ("en", "review"))
        self.assertEqual(g.decide(PORTUGUESE, {"verdict": "other", "reads_as": "pt"}), ("pt", "review"))
        self.assertEqual(g.decide("What is the best way?", {"verdict": "other", "reads_as": "fr"}), ("fr", "review"))

    def test_malformed_verdicts_are_refused(self):
        h = "0" * 64
        for bad in ({"not-a-hash": {"verdict": "en"}}, {h: {"verdict": "english"}}, {h: {"verdict": "other"}},
                    {h: {"verdict": "other", "reads_as": "Portuguese"}}, {h: {"verdict": "other", "reads_as": "en"}},
                    {h: "en"}):
            with self.assertRaises(ValueError):
                g.check_review(bad)
        self.assertTrue(g.check_review({h: {"verdict": "other", "reads_as": "pt"}}))


class Census(unittest.TestCase):
    def setUp(self):
        self.texts = texts_of(
            "What is the best way to learn?", "An agent reads the user's own calendar.",
            "Falcon lattice-based signatures.", PORTUGUESE,
            "Classify the following code cell.\n\n```\nimport os\n```\n",
        )

    def test_unreviewed_terse_texts_are_undecided_and_the_axis_is_unmeasured(self):
        c = g.census(self.texts, {})
        self.assertEqual(c["item_texts"], 5)
        self.assertEqual(c["texts_by_language"], {"en": 3})
        self.assertEqual(c["texts_undecided"], 2)
        self.assertEqual(c["texts_with_code_fence"], 1)
        self.assertEqual(g.determine(["en"], c), {"state": "UNMEASURED", "reason_code": "UNDECIDED_TEXTS"})

    def test_reviewed_bank_is_censused_and_every_text_is_accounted_for(self):
        review = {sha("Falcon lattice-based signatures."): {"verdict": "en"},
                  sha(PORTUGUESE): {"verdict": "other", "reads_as": "pt"}}
        c = g.census(self.texts, review)
        self.assertEqual(c["texts_by_language"], {"en": 4, "pt": 1})
        self.assertEqual(list(c["texts_by_language"]), ["en", "pt"])  # most texts first
        self.assertEqual(c["texts_undecided"], 0)
        self.assertEqual(c["texts_decided_by_function_word"] + c["texts_decided_by_review"], c["item_texts"])
        self.assertEqual(sum(c["texts_by_language"].values()), c["item_texts"])
        got = g.determine(["en"], c)
        self.assertEqual(got, {"state": "CENSUSED", "languages": ["en", "pt"], "english_only": False,
                               "declaration_holds": False})

    def test_english_only_bank(self):
        c = g.census(texts_of("What is the best way?", "Falcon lattice-based signatures."),
                     {sha("Falcon lattice-based signatures."): {"verdict": "en"}})
        self.assertEqual(g.determine(["en"], c), {"state": "CENSUSED", "languages": ["en"], "english_only": True,
                                                  "declaration_holds": True})

    def test_no_declaration_and_no_text_fail_closed(self):
        c = g.census(texts_of("What is the best way?"), {})
        self.assertEqual(g.determine(None, c)["reason_code"], "NO_DECLARATION")
        self.assertEqual(g.determine([], c)["reason_code"], "NO_DECLARATION")
        self.assertEqual(g.determine(["en"], g.census({}, {}))["reason_code"], "NO_ITEM_TEXT")

    def test_a_review_entry_that_matches_no_text_stops_the_run(self):
        with self.assertRaises(ValueError):
            g.census(self.texts, {"f" * 64: {"verdict": "en"}})

    def test_whitespace_and_unicode_form_do_not_make_a_second_text(self):
        nfc, nfd = "café", "café"
        self.assertNotEqual(nfc, nfd)
        rows = [{"item": "What  is\tthe best way?"}, {"item": " What is the best way? \n"}, {"item": nfc}, {"item": nfd}]
        self.assertEqual(len(g.distinct_texts(rows, "item")), 2)
        with self.assertRaises(ValueError):
            g.distinct_texts([{"text": "no item field"}], "item")


class Rows(unittest.TestCase):
    def test_canary_rows_are_not_items_but_null_canary_is_graded(self):
        data = "\n".join(json.dumps(r) for r in (
            {"_canary": "GSPC-CANARY-GUID x"},
            {"item": "CANARY: respond with one word.", "_canary": "KINGFISHER"},
            {"item": "A graded row.", "_canary": None},
            {"item": "Another graded row."},
        )).encode("utf-8") + b"\n\n"
        self.assertEqual([r["item"] for r in g.parse_rows(data)], ["A graded row.", "Another graded row."])

    def test_sha256_pin_is_enforced(self):
        with tempfile.TemporaryDirectory() as tmp:
            os.makedirs(os.path.join(tmp, "bank"))
            with open(os.path.join(tmp, "bank", "samples.jsonl"), "wb") as f:
                f.write(b'{"input": "x"}\n')
            good = hashlib.sha256(b'{"input": "x"}\n').hexdigest()
            self.assertTrue(g.fetch("owner/bank", "rev", "samples.jsonl", good, local_dir=tmp))
            with self.assertRaises(SystemExit):
                g.fetch("owner/bank", "rev", "samples.jsonl", "0" * 64, local_dir=tmp)


class CommittedModule(unittest.TestCase):
    """functions/api/_gspc_bank_language.ts and the review table, as committed. No network."""

    @classmethod
    def setUpClass(cls):
        with open(os.path.join(REPO, g.MODULE), encoding="utf-8") as f:
            cls.text = f.read()
        cls.doc = json.loads(cls.text[cls.text.index("{"):cls.text.rindex("}") + 1])
        with open(os.path.join(REPO, g.REVIEW), "rb") as f:
            cls.review_raw = f.read()
        cls.review = json.loads(cls.review_raw.decode("utf-8"))

    def test_module_is_generated_not_typed(self):
        self.assertIn(f"GENERATED by {g.PRODUCER}", self.text)
        self.assertEqual(self.doc["method"], g.METHOD)
        self.assertEqual(self.doc["english_function_words"], {"count": len(g.EN_FUNCTION_WORDS), "sha256": WORDS_SHA256})
        self.assertIs(self.doc["signed"], False)

    def test_one_entry_per_pinned_bank_and_the_pins_are_the_producers(self):
        self.assertEqual(list(self.doc["axes"]), list(g.BANKS))
        for axis, spec in g.BANKS.items():
            e = self.doc["axes"][axis]
            self.assertEqual((e["dataset"], e["revision"], e["file"], e["file_sha256"], e["text_field"]),
                             (spec["dataset"], spec["revision"], spec["file"], spec["sha256"], spec["text_field"]), axis)

    def test_every_text_is_accounted_for(self):
        for axis, e in self.doc["axes"].items():
            self.assertEqual(e["state"], "CENSUSED", axis)
            self.assertEqual(e["texts_undecided"], 0, axis)
            self.assertEqual(sum(e["texts_by_language"].values()), e["item_texts"], axis)
            self.assertEqual(e["texts_decided_by_function_word"] + e["texts_decided_by_review"], e["item_texts"], axis)
            self.assertLessEqual(e["item_texts"], e["rows"], axis)
            self.assertEqual(e["languages"], list(e["texts_by_language"]), axis)
            self.assertEqual(e["english_only"], e["languages"] == ["en"], axis)
            self.assertEqual(e["declaration_holds"], sorted(e["languages"]) == sorted(e["declared_languages"]), axis)

    def test_module_is_bound_to_the_committed_review_table(self):
        self.assertEqual(self.doc["review"]["sha256"], hashlib.sha256(self.review_raw).hexdigest())
        self.assertEqual(self.doc["review"]["verdicts"], sum(len(v) for v in self.review["axes"].values()))
        for axis, table in self.review["axes"].items():
            self.assertIn(axis, g.BANKS)
            g.check_review(table)
            self.assertEqual(self.doc["axes"][axis]["texts_decided_by_review"], len(table), axis)

    def test_the_one_text_that_is_not_english_is_recorded_as_such(self):
        other = [(axis, h, v) for axis, table in self.review["axes"].items() for h, v in table.items() if v["verdict"] == "other"]
        self.assertEqual([(axis, v["reads_as"]) for axis, _h, v in other], [("care", "pt")])
        axis, h, v = other[0]
        self.assertEqual(h, sha(v["text"]))  # the quoted text is the reviewed text
        care = self.doc["axes"]["care"]
        self.assertEqual(care["texts_by_language"].get("pt"), 1)
        self.assertIs(care["english_only"], False)
        self.assertIs(care["declaration_holds"], False)

    def test_pins_agree_with_the_files_the_board_already_binds(self):
        for axis in ("jail", "swarm"):
            b, mine = d.BANKS[axis], g.BANKS[axis]
            self.assertEqual((mine["dataset"], mine["revision"], mine["file"], mine["sha256"], mine["text_field"]),
                             (b["dataset"], b["revision"], b["file"], b["sha256"], b["prompt_field"]), axis)
        with open(os.path.join(REPO, "functions", "api", "_gspc_rows_separation.ts"), encoding="utf-8") as f:
            rows = f.read()
        self.assertIn(f'"dataset_revision": "{g.ROWS_REVISION}"', rows)
        for axis, spec in g.BANKS.items():
            if spec["dataset"] != g.ROWS_DATASET:
                continue
            name = spec["file"].split("/")[-1]
            self.assertIn(f'"{name}": "{spec["sha256"]}"', rows, axis)


if __name__ == "__main__":
    unittest.main()
