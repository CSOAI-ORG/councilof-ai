#!/usr/bin/env python3
"""test_meok_ori.py — tests for meok-ori.

Hermetic: stub backend only, receipts and the receipt key in tmp dirs, no network.
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PKG_ROOT = ROOT / "meok-ori" if (ROOT / "meok-ori" / "meok_ori").exists() else ROOT
sys.path.insert(0, str(PKG_ROOT))

from meok_ori import core
from meok_ori.cli import main


def tmp_receipts(fn):
    """Decorator: point the receipt chain and the receipt key at a temp dir."""
    def wrapper(*a, **kw):
        with tempfile.TemporaryDirectory() as td:
            old = core.RECEIPT_PATH
            old_env = {k: os.environ.get(k) for k in ("MEOK_SIGIL_SECRET", "MEOK_SIGIL_KEY_FILE")}
            core.RECEIPT_PATH = Path(td) / "receipts.jsonl"
            os.environ.pop("MEOK_SIGIL_SECRET", None)
            os.environ["MEOK_SIGIL_KEY_FILE"] = str(Path(td) / "receipt.key")
            try:
                return fn(*a, **kw)
            finally:
                core.RECEIPT_PATH = old
                for k, v in old_env.items():
                    if v is None:
                        os.environ.pop(k, None)
                    else:
                        os.environ[k] = v
    return wrapper


class T1Articles(unittest.TestCase):
    def test_t01_22_articles(self):
        self.assertEqual(len(core.ARTICLES), 22)
        self.assertEqual(core.ARTICLES[0][0], 1)
        self.assertEqual(core.ARTICLES[-1][0], 22)

    def test_t02_article_titles(self):
        titles = [t for _, t in core.ARTICLES]
        self.assertIn("Default deny", titles)
        self.assertIn("No self-approval", titles)
        self.assertIn("Versioned constitution", titles)

    def test_t03_no_self_approval_enforced(self):
        r = core.route_prompt("hello world ok")
        a = core.audit_run(model="qwen3.5-0.8b", route=r, receipt_hash="abc",
                           chain_ok=True, max_cost=1.0, signed=False,
                           screen=None, backend="stub")
        arts = {f["article"] for f in a.findings}
        self.assertIn(19, arts)


class T2Sigil(unittest.TestCase):
    @tmp_receipts
    def test_t04_sign_deterministic(self):
        p = {"a": 1, "b": "x"}
        self.assertEqual(core.mac(p), core.mac(p))

    @tmp_receipts
    def test_t05_append_and_verify(self):
        core.append_receipt({"kind": "test1"})
        core.append_receipt({"kind": "test2"})
        ok, count, last = core.verify_chain()
        self.assertTrue(ok)
        self.assertEqual(count, 2)
        self.assertNotEqual(last, "0" * 64)

    @tmp_receipts
    def test_t06_tamper_breaks_chain(self):
        core.append_receipt({"kind": "test"})
        # tamper
        text = core.RECEIPT_PATH.read_text().replace('"test"', '"evil"')
        core.RECEIPT_PATH.write_text(text)
        ok, _, _ = core.verify_chain()
        self.assertFalse(ok)

    @tmp_receipts
    def test_t07_prev_links(self):
        e1 = core.append_receipt({"n": 1})
        e2 = core.append_receipt({"n": 2})
        self.assertEqual(e1["prev"], "0" * 64)
        self.assertEqual(e2["prev"], e1["hash"])


class T3Router(unittest.TestCase):
    def test_t08_short_chat_is_tier1(self):
        r = core.route_prompt("hi")
        self.assertEqual(r.tier, 1)

    def test_t09_audit_is_tier4(self):
        r = core.route_prompt("x" * 50, task="audit")
        self.assertEqual(r.tier, 4)

    def test_t10_long_is_higher_tier(self):
        self.assertEqual(core.route_prompt("x" * 600).tier, 2)
        self.assertEqual(core.route_prompt("x" * 1600).tier, 3)

    def test_t11_force_tier_clamped(self):
        self.assertEqual(core.route_prompt("x", force_tier=9).tier, 4)
        self.assertEqual(core.route_prompt("x", force_tier=0).tier, 1)

    def test_t12_cost_monotonic(self):
        c1 = core.route_prompt("x", force_tier=1).est_cost_usd
        c4 = core.route_prompt("x", force_tier=4).est_cost_usd
        self.assertGreater(c4, c1)


class T4Backends(unittest.TestCase):
    def test_t13_detect_has_four(self):
        d = core.detect_backends()
        self.assertEqual(set(d), {"openrouter", "ollama", "parallax", "stub"})
        self.assertTrue(d["stub"])

    def test_t14_default_deny_unknown_backend(self):
        with self.assertRaises(ValueError):
            core.resolve_backend("skynet")

    def test_t15_stub_completion(self):
        r = core.route_prompt("hello sovereign")
        res = core.complete("hello sovereign", route=r, backend="stub")
        self.assertEqual(res.status, "offline-stub")
        self.assertIn("hello sovereign", res.text)
        self.assertEqual(res.backend, "stub")

    def test_t16_stub_echoes_prompt(self):
        res = core.complete("ping", backend="stub")
        self.assertIn("ping", res.text)


class T5Screen(unittest.TestCase):
    def test_t17_13_rules_2_blocking(self):
        self.assertEqual(len(core.SCREEN_RULES), 13)
        self.assertEqual(sum(1 for r in core.SCREEN_RULES if r["blocking"]), 2)
        self.assertEqual(sum(1 for r in core.SCREEN_RULES if r["check"] == "none"), 5)

    def test_t18_benign_passes(self):
        v = core.keyword_screen("hello world, the sovereign stack is green and tested.")
        self.assertTrue(v.passed)
        self.assertGreaterEqual(v.rules_passed, 9)
        self.assertEqual(v.blocking_failed, [])

    def test_t19_harm_word_blocks(self):
        v = core.keyword_screen("you must kill the target now")
        self.assertFalse(v.passed)
        self.assertIn("harm-words", v.blocking_failed)

    def test_t20_tally_threshold(self):
        res = [{"id": "r", "blocking": False, "result": "pass"} for _ in range(8)]
        res += [{"id": "r", "blocking": False, "result": "fail"} for _ in range(5)]
        self.assertFalse(core.screen_tally(res).passed)  # 8 < 9
        res = res[:1] * 9 + res[9:]
        # 9 pass, 4 fail -> passes
        self.assertTrue(core.screen_tally(res[:13]).passed)

    def test_t21_blocking_rule_fails_even_with_passes(self):
        res = [{"id": "harm-words", "blocking": True, "result": "fail"}]
        res += [{"id": "r", "blocking": False, "result": "pass"} for _ in range(12)]
        v = core.screen_tally(res)
        self.assertFalse(v.passed)
        self.assertEqual(v.blocking_failed, ["harm-words"])


class T6Audit(unittest.TestCase):
    def test_t22_default_deny_unknown_model(self):
        r = core.route_prompt("x")
        a = core.audit_run(model="totally-made-up", route=r, receipt_hash="h",
                           chain_ok=True, max_cost=1.0, signed=False,
                           screen=None, backend="stub")
        f = next(x for x in a.findings if x["article"] == 2)
        self.assertEqual(f["status"], "fail")
        self.assertFalse(a.ok)

    def test_t23_budget_exceeded_fails(self):
        r = core.route_prompt("x" * 2000, force_tier=4)
        a = core.audit_run(model="qwen3.5-0.8b", route=r, receipt_hash="h",
                           chain_ok=True, max_cost=0.000001, signed=False,
                           screen=None, backend="stub")
        f = next(x for x in a.findings if x["article"] == 6)
        self.assertEqual(f["status"], "fail")

    def test_t24_missing_receipt_fails(self):
        r = core.route_prompt("x")
        a = core.audit_run(model="qwen3.5-0.8b", route=r, receipt_hash="",
                           chain_ok=True, max_cost=1.0, signed=False,
                           screen=None, backend="stub")
        f = next(x for x in a.findings if x["article"] == 10)
        self.assertEqual(f["status"], "fail")

    def test_t25_signing_not_automatic(self):
        r = core.route_prompt("x")
        a = core.audit_run(model="qwen3.5-0.8b", route=r, receipt_hash="h",
                           chain_ok=True, max_cost=1.0, signed=False,
                           screen=None, backend="stub")
        f = next(x for x in a.findings if x["article"] == 12)
        self.assertIn("default", f["detail"])


class T7CLI(unittest.TestCase):
    def _run(self, *argv):
        with tempfile.TemporaryDirectory() as td:
            env = dict(os.environ, MEOK_ORI_RECEIPTS=str(Path(td) / "r.jsonl"),
                       MEOK_SIGIL_KEY_FILE=str(Path(td) / "receipt.key"),
                       MEOK_ORI_MAX_COST="1.0")
            env.pop("MEOK_SIGIL_SECRET", None)
            pkg_parent = PKG_ROOT if (PKG_ROOT / "meok_ori").exists() else ROOT
            p = subprocess.run(
                [sys.executable, "-m", "meok_ori", *argv],
                capture_output=True, text=True, timeout=60, env=env,
                cwd=str(pkg_parent))
            return p

    def test_t26_run_json(self):
        p = self._run("run", "hello sovereign world", "--json", "--backend", "stub")
        self.assertEqual(p.returncode, 0, p.stderr)
        out = json.loads(p.stdout)
        self.assertEqual(out["backend"], "stub")
        self.assertIn("text", out)
        self.assertTrue(out["constitution"]["ok"])
        self.assertEqual(len(out["constitution"]["findings"]), 9)

    def test_t27_run_screen_passes(self):
        for flag in ("--screen", "--council"):  # --council is the 0.1.0 alias
            p = self._run("run", "hello world, the sovereign stack is green.",
                          flag, "--json", "--backend", "stub")
            self.assertEqual(p.returncode, 0, p.stderr)
            out = json.loads(p.stdout)
            self.assertTrue(out["keyword_screen"]["passed"])
            self.assertNotIn("council", out)

    def test_t28_run_denies_unknown_model(self):
        p = self._run("run", "hi", "--model", "made-up-model-9000", "--json")
        self.assertEqual(p.returncode, 1)
        out = json.loads(p.stdout)
        self.assertFalse(out["constitution"]["ok"])

    def test_t29_status_and_constitution(self):
        p = self._run("status")
        self.assertEqual(p.returncode, 0, p.stderr)
        st = json.loads(p.stdout)
        self.assertIn("backends", st)
        self.assertIn("receipts", st)
        p2 = self._run("constitution")
        self.assertEqual(p2.returncode, 0)
        self.assertIn("22 articles", p2.stdout)

    def test_t30_eval_offline(self):
        p = self._run("eval", "compare the sovereign tiers", "--json")
        self.assertEqual(p.returncode, 0, p.stderr)
        rep = json.loads(p.stdout)
        self.assertEqual(len(rep["runs"]), 2)
        self.assertEqual(rep["runs"][0]["tier"], 1)
        self.assertEqual(rep["runs"][1]["tier"], 4)


class T8CC0Constitution(unittest.TestCase):
    """The CC0 Claude constitution folded in as meta-seed (2026-10-07)."""

    def test_t31_four_tiers_verbatim_order(self):
        from meok_ori.constitution_cc0 import CC0_TIERS
        self.assertEqual([t for t, _, _ in CC0_TIERS], [1, 2, 3, 4])
        names = [n for _, n, _ in CC0_TIERS]
        self.assertEqual(names[0], "Broadly safe")
        self.assertEqual(names[3], "Genuinely helpful")

    def test_t32_cc0_attribution_present(self):
        from meok_ori.constitution_cc0 import CC0_LICENSE, attribution
        self.assertIn("CC0", CC0_LICENSE)
        self.assertIn("anthropic.com/constitution", attribution())

    def test_t33_all_22_articles_mapped(self):
        from meok_ori.constitution_cc0 import coverage
        cov = coverage()
        self.assertEqual(cov["unmapped"], 0)
        self.assertEqual(cov["mapped"], 22)

    def test_t34_priority_order_puts_safety_first(self):
        from meok_ori.constitution_cc0 import priority_order
        ordered = priority_order([21, 19, 2, 6])
        # Art.2 (tier 1) and Art.19 (tier 1) considered before Art.21 (tier 4)
        self.assertLess(ordered.index(2), ordered.index(21))
        self.assertLess(ordered.index(19), ordered.index(21))


class T9Honesty(unittest.TestCase):
    """0.2.0 corrections: no secret in source, a real chain check, honest names."""

    def test_t35_no_default_secret_in_source(self):
        src = (PKG_ROOT / "meok_ori" / "core.py").read_text(encoding="utf-8")
        self.assertNotIn("meok-ori-sovereign-2026", src)
        self.assertNotIn("SIGIL_SECRET = os.environ.get(", src)

    @tmp_receipts
    def test_t36_key_file_created_0600_and_random(self):
        kf = Path(os.environ["MEOK_SIGIL_KEY_FILE"])
        self.assertFalse(kf.exists())
        m1 = core.mac({"a": 1})
        self.assertTrue(kf.exists())
        self.assertEqual(kf.stat().st_mode & 0o777, 0o600)
        self.assertEqual(len(kf.read_text().strip()), 64)
        with tempfile.TemporaryDirectory() as td2:
            os.environ["MEOK_SIGIL_KEY_FILE"] = str(Path(td2) / "receipt.key")
            self.assertNotEqual(core.mac({"a": 1}), m1)  # another install, another key
            os.environ["MEOK_SIGIL_KEY_FILE"] = str(kf)

    @tmp_receipts
    def test_t37_chain_under_another_key_fails(self):
        os.environ["MEOK_SIGIL_SECRET"] = "key-a"
        core.append_receipt({"kind": "old"})
        self.assertTrue(core.verify_chain()[0])
        os.environ["MEOK_SIGIL_SECRET"] = "key-b"
        self.assertFalse(core.verify_chain()[0])

    def test_t38_cli_chain_check_is_not_constant(self):
        with tempfile.TemporaryDirectory() as td:
            rp = Path(td) / "r.jsonl"
            env = dict(os.environ, MEOK_ORI_RECEIPTS=str(rp),
                       MEOK_SIGIL_KEY_FILE=str(Path(td) / "receipt.key"),
                       MEOK_ORI_MAX_COST="1.0")
            env.pop("MEOK_SIGIL_SECRET", None)

            def run():
                return subprocess.run(
                    [sys.executable, "-m", "meok_ori", "run", "hello sovereign world",
                     "--json", "--backend", "stub"], capture_output=True, text=True,
                    timeout=60, env=env, cwd=str(PKG_ROOT))

            p1 = run()
            self.assertEqual(p1.returncode, 0, p1.stderr)
            self.assertTrue(json.loads(p1.stdout)["chain_ok"])
            rp.write_text(rp.read_text().replace('"stub"', '"forged"'))
            p2 = run()
            self.assertEqual(p2.returncode, 1)
            out = json.loads(p2.stdout)
            self.assertFalse(out["chain_ok"])
            f11 = next(f for f in out["constitution"]["findings"] if f["article"] == 11)
            self.assertEqual(f11["status"], "fail")

    def test_t39_sign_hashes_the_whole_reply(self):
        with tempfile.TemporaryDirectory() as td:
            rp = Path(td) / "r.jsonl"
            env = dict(os.environ, MEOK_ORI_RECEIPTS=str(rp),
                       MEOK_SIGIL_KEY_FILE=str(Path(td) / "receipt.key"),
                       MEOK_ORI_MAX_COST="1.0")
            env.pop("MEOK_SIGIL_SECRET", None)
            prompt = "x" * 200
            p = subprocess.run(
                [sys.executable, "-m", "meok_ori", "run", prompt, "--sign", "--json",
                 "--backend", "stub"], capture_output=True, text=True, timeout=60,
                env=env, cwd=str(PKG_ROOT))
            self.assertEqual(p.returncode, 0, p.stderr)
            text = json.loads(p.stdout)["text"]
            rec = json.loads(rp.read_text().splitlines()[-1])
            self.assertEqual(rec["reply_sha256"], hashlib.sha256(text.encode()).hexdigest())
            self.assertNotIn("sigil", rec)

    def test_t40_screen_command_says_what_it_is(self):
        for cmd in ("screen", "council"):
            p = subprocess.run([sys.executable, "-m", "meok_ori", cmd],
                               capture_output=True, text=True, timeout=60,
                               cwd=str(PKG_ROOT))
            self.assertEqual(p.returncode, 0, p.stderr)
            self.assertIn("Not a council, not BFT", p.stdout)
            self.assertNotIn("Queen", p.stdout)

    def test_t41_parallax_default_port_3001(self):
        if os.environ.get("MEOK_PARALLAX_URL"):
            self.skipTest("MEOK_PARALLAX_URL is set")
        self.assertTrue(core.PARALLAX_URL.startswith("http://localhost:3001/"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
