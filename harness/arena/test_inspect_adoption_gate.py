#!/usr/bin/env python3
"""Inspect AI adoption gate — 10-fixture cross-verify vs the gold-run jail pipeline.

Roadmap item 4 / STATE_RUNWAY agent step 3. The emitter
(`measurement_card.py`) already binds instrument + config_digest + rows_digest
into a JCS-v2 MEASUREMENT card. This suite is the gate that was queued:

  * a stranger can verify a good fixture and reject a tampered one
  * stripping preimage_rule is load-bearing (v1 vs JCS disagree on 0.0)
  * the published jail gold-run (n=71, accuracy=0.5915, TIE) is the bound
    subject — we do not invent a number and we do not re-run the fleet here
  * inspect_ai presence is recorded honestly (UNCHECKABLE if missing, never faked)
  * verify-card.mjs pin is a different claim from self-key consistency

Run: python3 harness/arena/test_inspect_adoption_gate.py

Throwaway keys only. Nothing here is an estate signature.
"""
from __future__ import annotations

import copy
import hashlib
import json
import os
import subprocess
import sys
import tempfile
import unittest

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(ROOT, "tools"))

from jcs import canonicalize as jcs  # noqa: E402
from measurement_card import config_digest, content_id, emit_card  # noqa: E402
import verify_any_card as VAC  # noqa: E402

# Published gold-run jail numbers (live board 2026-08-28, axis jail, TIE).
# Binding these is the cross-verify: the card carries the gold-run, not a new run.
GOLD_RUN = {
    "pipeline": "gold-run-jail-containment",
    "bank": "csoai/gspc-jail-goldbank",
    "n": 71,
    "fleet_models": 7,
    "measured_on": "2026-08-18",
    "separation": "TIE",
    "leader": "qwen2.5:0.5b-instruct",
    "leader_accuracy": 0.5915,
    "note": "Published gold-run bound into a MEASUREMENT card. This fixture does not re-run the fleet.",
}
GOLD_N = 71
GOLD_ACC = 0.5915
GOLD_ROWS_PREIMAGE = (
    "csoai/gspc-jail-goldbank@2026-08-18;n=71;"
    "leader=qwen2.5:0.5b-instruct;acc=0.5915;separation=TIE"
)
GOLD_ROWS_DIGEST = hashlib.sha256(GOLD_ROWS_PREIMAGE.encode()).hexdigest()
PINNED_PUBKEY_HEX = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38"
VERIFY_JS = os.path.join(ROOT, "public", "signed", "verify-card.mjs")


def _sk():
    return Ed25519PrivateKey.generate()


def _inspect_version():
    try:
        import inspect_ai
        return getattr(inspect_ai, "__version__", None) or "unknown"
    except ImportError:
        return None


def _emit(cfg=None, rows_digest=None, accuracy=GOLD_ACC, n=GOLD_N, sk=None, version=None):
    sk = sk or _sk()
    ver = version if version is not None else (_inspect_version() or "0.3.47")
    return emit_card(
        cfg=cfg if cfg is not None else GOLD_RUN,
        rows_digest=rows_digest or GOLD_ROWS_DIGEST,
        instrument="inspect_ai",
        instrument_version=ver,
        axis="jail",
        n=n,
        accuracy=accuracy,
        sk=sk,
    ), sk


def _vac(card):
    path = os.path.join(tempfile.mkdtemp(prefix="inspect-gate-"), "card.json")
    with open(path, "w") as fh:
        json.dump(card, fh)
    return VAC.verify_file(path), path


class InspectAdoptionGate(unittest.TestCase):
    def test_f01_gold_run_card_self_consistent(self):
        card, sk = _emit()
        self.assertEqual(card["kind"], "measurement")
        self.assertEqual(card["preimage_rule"], "jcs-rfc8785")
        self.assertEqual(card["body"]["axis"], "jail")
        self.assertEqual(card["body"]["n"], GOLD_N)
        self.assertEqual(card["body"]["accuracy"], GOLD_ACC)
        self.assertEqual(card["body"]["instrument"]["name"], "inspect_ai")
        self.assertEqual(card["body"]["config_digest"], config_digest(GOLD_RUN))
        self.assertEqual(card["body"]["rows_digest"], GOLD_ROWS_DIGEST)
        self.assertEqual(card["id"], content_id(card["body"]))
        pre = jcs(card["body"]).encode()
        sk.public_key().verify(bytes.fromhex(card["signature"]), pre)

    def test_f02_tamper_accuracy_invalid(self):
        card, _ = _emit()
        card["body"]["accuracy"] = 0.99
        r, _ = _vac(card)
        self.assertFalse(r.ok)
        names = [c[0] for c in r.checks if not c[1]]
        self.assertTrue(any("id ==" in n for n in names), r.checks)

    def test_f03_tamper_signature_invalid(self):
        card, _ = _emit()
        sig = bytearray(bytes.fromhex(card["signature"]))
        sig[0] ^= 0xFF
        card["signature"] = sig.hex()
        r, _ = _vac(card)
        self.assertFalse(r.ok)
        self.assertTrue(any("Ed25519" in c[0] and not c[1] for c in r.checks), r.checks)

    def test_f04_strip_preimage_rule_integral_float_invalid(self):
        card, _ = _emit(accuracy=0.0)
        self.assertIn('"accuracy":0', jcs(card["body"]))
        stripped = copy.deepcopy(card)
        stripped.pop("preimage_rule")
        r, _ = _vac(stripped)
        self.assertFalse(
            r.ok,
            "stripping jcs-rfc8785 must not verify under the v1 path when accuracy is 0.0",
        )

    def test_f05_config_digest_binds(self):
        card, _ = _emit()
        other = dict(GOLD_RUN)
        other["n"] = 999
        self.assertNotEqual(config_digest(other), card["body"]["config_digest"])
        card2, _ = _emit(cfg=other)
        self.assertNotEqual(card2["id"], card["id"])
        self.assertEqual(card2["body"]["config_digest"], config_digest(other))

    def test_f06_rows_digest_binds(self):
        card, _ = _emit()
        other = hashlib.sha256(b"not-the-gold-run-rows").hexdigest()
        card2, _ = _emit(rows_digest=other)
        self.assertNotEqual(card2["id"], card["id"])
        self.assertEqual(card2["body"]["rows_digest"], other)

    def test_f07_doctrine_measurement_not_certification(self):
        card, _ = _emit()
        doctrine = card["doctrine"].lower()
        self.assertEqual(card["kind"], "measurement")
        self.assertIn("not certification", doctrine)
        # The banned claim is NAMED as a violation, never asserted as the kind.
        self.assertIn("'inspect-certified' would be a violation", doctrine)
        self.assertNotEqual(card["kind"], "certification")

    def test_f08_inspect_ai_version_honest(self):
        ver = _inspect_version()
        if ver is None:
            self.skipTest(
                "UNCHECKABLE: inspect_ai is not installed — never a pass, never faked"
            )
        card, _ = _emit(version=ver)
        self.assertEqual(card["body"]["instrument"]["name"], "inspect_ai")
        self.assertEqual(card["body"]["instrument"]["version"], ver)
        card2, _ = _emit(version=ver + "-not-this")
        self.assertNotEqual(card2["id"], card["id"])

    def test_f09_stranger_verifier_valid_self_key(self):
        card, _ = _emit()
        r, path = _vac(card)
        self.assertTrue(r.ok, r.checks)
        self.assertEqual(r.shape, "A")
        self.assertTrue(any(c[0].startswith("id == sha256(JCS") and c[1] for c in r.checks))
        self.assertTrue(any("Ed25519 sig over JCS" in c[0] and c[1] for c in r.checks))
        r_pin = VAC.verify_file(path, expect_key=PINNED_PUBKEY_HEX)
        self.assertFalse(r_pin.ok, "throwaway key must not satisfy the published pin")

    def test_f10_js_pin_and_jcs_agreement(self):
        card, _ = _emit()
        py_jcs = jcs(card["body"])
        script = (
            "const fs=require('fs');const v=JSON.parse(fs.readFileSync(0,'utf8'));"
            "function sortKeys(o){if(Array.isArray(o))return o.map(sortKeys);"
            "if(o&&typeof o==='object'){const r={};for(const k of Object.keys(o).sort())"
            "r[k]=sortKeys(o[k]);return r;}return o;}"
            "process.stdout.write(JSON.stringify(sortKeys(v)));"
        )
        p = subprocess.run(
            ["node", "-e", script],
            input=json.dumps(card["body"]),
            capture_output=True,
            text=True,
            timeout=15,
        )
        self.assertEqual(p.returncode, 0, p.stderr)
        self.assertEqual(p.stdout, py_jcs, (p.stdout[:120], py_jcs[:120]))

        if not os.path.isfile(VERIFY_JS):
            self.skipTest("UNCHECKABLE: public/signed/verify-card.mjs not in this checkout")
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
            json.dump(card, fh)
            path = fh.name
        js = subprocess.run(
            ["node", VERIFY_JS, path],
            capture_output=True,
            text=True,
            timeout=20,
        )
        out = (js.stdout or "") + (js.stderr or "")
        self.assertNotEqual(js.returncode, 0)
        self.assertTrue("INVALID" in out or "pubkey" in out.lower(), out[-400:])


if __name__ == "__main__":
    unittest.main(verbosity=2)
