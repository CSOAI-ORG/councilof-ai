#!/usr/bin/env python3
"""Tests for scripts/media/compile.py.  python3 -m unittest scripts/media/test_compile.py -v

Offline by default: fixtures are the published a2a-card-census and mcp-remote-census records with their
real board signatures, and a snapshot of https://csoai.org/.well-known/did.json (public keys only).
CSOAI_ONLINE=1 adds the same refusal test against the live DID document and the live HF record.
"""
import base64
import copy
import hashlib
import json
import os
import pathlib
import shutil
import sys
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import compile as mc  # noqa: E402

FIX = HERE / "fixtures"
DID = (FIX / "did.json").as_uri()


def url(p):
    return pathlib.Path(p).as_uri()


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = pathlib.Path(tempfile.mkdtemp(prefix="mc-test-"))
        self.a2a = self.tmp / "a2a"
        shutil.copytree(FIX / "a2a", self.a2a)
        self.mcp = self.tmp / "mcp"
        shutil.copytree(FIX / "mcp-remote", self.mcp)
        self.out = self.tmp / "out"

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_c(self, rec_url, **kw):
        kw.setdefault("did_doc_url", DID)
        kw.setdefault("allow_noncanonical_did", True)
        kw.setdefault("ots_upgrade", False)
        return mc.compile_record(rec_url, str(self.out), now="2026-09-25T00:00:00Z", **kw)

    def assertRefused(self, rec_url, needle, **kw):
        with self.assertRaises(mc.Refusal) as cm:
            self.run_c(rec_url, **kw)
        self.assertIn(needle, str(cm.exception))
        self.assertFalse(self.out.exists(), "a refusal must write nothing")
        return str(cm.exception)

    # a signed record under a throwaway key, for paths the published records cannot exercise
    def signed_fixture(self, rec_bytes, name="record.json"):
        from cryptography.hazmat.primitives.asymmetric import ed25519
        from cryptography.hazmat.primitives import serialization
        sk = ed25519.Ed25519PrivateKey.generate()
        x = base64.urlsafe_b64encode(sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)).rstrip(b"=").decode()
        d = self.tmp / "synthetic"
        d.mkdir(exist_ok=True)
        rec = json.loads(rec_bytes)
        (d / name).write_bytes(rec_bytes)
        payload = {"schema": "csoai.signed-artifact/0.1", "artifact": {"sha256": hashlib.sha256(rec_bytes).hexdigest(),
                                                                         "schema": rec["schema"], "as_of": rec["as_of"]}}
        c = mc.canon(payload)
        env = {"payload": payload, "signature": {"did": mc.EXPECTED_DID, "alg": "Ed25519", "sig_ed25519": sk.sign(c).hex(),
                                                  "payload_sha256": hashlib.sha256(c).hexdigest()}}
        (d / (name[:-5] + ".signed.json")).write_text(json.dumps(env))
        (d / "did.json").write_text(json.dumps({"id": "did:web:test", "verificationMethod": [
            {"id": "did:web:test#board-attestation-1", "publicKeyJwk": {"kty": "OKP", "crv": "Ed25519", "x": x}}]}))
        return d, sk


class PositiveControl(Base):
    def test_real_a2a_record_compiles_and_quotes_exactly(self):
        m = self.run_c(url(self.a2a / "record.json"))
        self.assertEqual(m["signature"]["state"], "VERIFIED")
        self.assertEqual(m["number_provenance"]["violations"], 0)
        x = (self.out / "x.txt").read_text()
        self.assertLessEqual(len(x.rstrip("\n")), 280)
        self.assertIn("4.27% of served A2A agent cards carry a signature that verifies", x)
        p12 = m["source"]["sha256"][:12]
        self.assertEqual(p12, "b290b53d0591")
        for f in ("card.svg", "x.txt", "linkedin.txt", "video-script.txt"):
            t = (self.out / f).read_text()
            sig = "sig:TEST-KEY" if f == "x.txt" else "VERIFIED (test key, not the board key)"
            for must in ("a2a-card-census-2026-09-25", "2026-09-25", p12, sig, "OTS",
                         "https://huggingface.co/datasets/csoai/a2a-card-census"):
                self.assertIn(must, t, f"{f} lacks {must}")
            self.assertIn("population", t.lower(), f)
        svg = (self.out / "card.svg").read_text()
        self.assertIn('width="1200" height="675"', svg)

    def test_output_is_deterministic(self):
        self.run_c(url(self.a2a / "record.json"))
        first = {f: (self.out / f).read_bytes() for f in ("card.svg", "x.txt", "linkedin.txt", "video-script.txt")}
        shutil.rmtree(self.out)
        self.run_c(url(self.a2a / "record.json"))
        for f, b in first.items():
            self.assertEqual((self.out / f).read_bytes(), b, f)


class TamperRefusal(Base):
    def test_record_number_changed(self):
        p = self.a2a / "record.json"
        p.write_bytes(p.read_bytes().replace(b'"pct_verified": 4.27', b'"pct_verified": 42.7'))
        self.assertRefused(url(p), "record altered")

    def test_record_one_bit_flipped(self):
        p = self.a2a / "record.json"
        b = bytearray(p.read_bytes())
        b[len(b) // 2] ^= 0x01
        p.write_bytes(bytes(b))
        self.assertRaises(mc.Refusal, self.run_c, url(p))
        self.assertFalse(self.out.exists())

    def test_envelope_payload_altered_and_rehashed(self):
        s = self.a2a / "record.signed.json"
        env = json.loads(s.read_text())
        env["payload"]["states"]["CARD_SERVED"] = 423
        env["signature"]["payload_sha256"] = hashlib.sha256(mc.canon(env["payload"])).hexdigest()
        s.write_text(json.dumps(env))
        self.assertRefused(url(self.a2a / "record.json"), "does NOT verify")

    def test_envelope_payload_altered_not_rehashed(self):
        s = self.a2a / "record.signed.json"
        env = json.loads(s.read_text())
        env["payload"]["read_state"] = "PARTIAL"
        s.write_text(json.dumps(env))
        self.assertRefused(url(self.a2a / "record.json"), "envelope altered")

    def test_attacker_rewrites_record_and_resigns_with_own_key(self):
        p = self.a2a / "record.json"
        new = p.read_bytes().replace(b'"pct_verified": 4.27', b'"pct_verified": 42.7')
        p.write_bytes(new)
        _, sk = self.signed_fixture(new)
        s = self.a2a / "record.signed.json"
        env = json.loads(s.read_text())
        env["payload"]["artifact"]["sha256"] = hashlib.sha256(new).hexdigest()
        c = mc.canon(env["payload"])
        env["signature"]["payload_sha256"] = hashlib.sha256(c).hexdigest()
        env["signature"]["sig_ed25519"] = sk.sign(c).hex()
        s.write_text(json.dumps(env))
        self.assertRefused(url(p), "does NOT verify")

    def test_missing_signature(self):
        (self.a2a / "record.signed.json").unlink()
        self.assertRefused(url(self.a2a / "record.json"), "unsigned records are never rendered")

    def test_ots_proof_over_other_bytes(self):
        shutil.copy(self.mcp / "record.json.ots", self.a2a / "record.json.ots")
        (self.a2a / "record.ots.json").unlink()
        self.assertRefused(url(self.a2a / "record.json"), "OTS proof is over different bytes")

    def test_noncanonical_did_needs_explicit_flag(self):
        self.assertRefused(url(self.a2a / "record.json"), "DID document must be", allow_noncanonical_did=False)

    def test_wrong_key_in_did_document(self):
        d, _ = self.signed_fixture(b'{"schema": "x", "as_of": "y"}')
        self.assertRefused(url(self.a2a / "record.json"), "does NOT verify", did_doc_url=url(d / "did.json"))


class Supersession(Base):
    def test_superseded_record_refused(self):
        msg = self.assertRefused(url(self.mcp / "record.json"), "SUPERSEDED")
        self.assertIn("record.v0.1.1.json", msg)

    def test_superseded_record_labelled_when_allowed(self):
        self.run_c(url(self.mcp / "record.json"), allow_superseded=True)
        for f in ("card.svg", "x.txt", "linkedin.txt", "video-script.txt"):
            self.assertIn("SUPERSEDED", (self.out / f).read_text(), f)

    def test_superseding_record_compiles_and_carries_correction(self):
        m = self.run_c(url(self.mcp / "record.v0.1.1.json"))
        self.assertIn("supersedes v0.1", (self.out / "linkedin.txt").read_text())
        self.assertIn("PARTIAL", (self.out / "x.txt").read_text())
        self.assertEqual(m["source"]["sha256"][:8], "fd5c8a7a")

    def test_unverifiable_supersession_claim_fails_closed(self):
        v = self.mcp / "record.v0.1.1.json"
        v.write_bytes(v.read_bytes().replace(b'"scope"', b'"scope "', 1))
        self.assertRefused(url(self.mcp / "record.json"), "claims to supersede this record but does not verify")


class NumberProvenance(Base):
    REC = '{"a": 4.27, "b": 422, "c": "top 20% of one plan", "h": "b4230f", "t": "2026-09-25T07:25:59Z"}'

    def test_verbatim_numbers_pass(self):
        v, src = mc.provenance_check({"t": "4.27% of 422 cards; top 20%"}, self.REC, "")
        self.assertEqual(v, [])
        self.assertEqual(src["4.27"], "record.json")

    def test_rounded_or_recomputed_numbers_fail(self):
        for bad in ("4.3%", "4.270", "427", "0.0427", "423 cards", "4.28"):
            v, _ = mc.provenance_check({"t": bad}, self.REC, "")
            self.assertTrue(v, f"{bad!r} should be a violation")

    def test_number_inside_a_hash_is_not_provenance(self):
        v, _ = mc.provenance_check({"t": "423 things"}, self.REC, "")
        self.assertTrue(v, "423 appears only inside the hex string b4230f and must not count")

    def test_envelope_is_provenance_only_source(self):
        v, src = mc.provenance_check({"t": "signed 08:22:33.567"}, self.REC, '"signed_at": "2026-09-25T08:22:33.567Z"')
        self.assertEqual(v, [])
        self.assertEqual(src["33.567"], "signed envelope (provenance)")

    def test_float_not_verbatim_in_record_refuses_compile(self):
        a2a = json.loads((FIX / "a2a" / "record.json").read_text())
        raw = (FIX / "a2a" / "record.json").read_bytes().replace(b'"pct_verified": 4.27', b'"pct_verified": 4.270')
        d, _ = self.signed_fixture(raw)
        self.assertEqual(json.loads(raw)["signatures"]["pct_verified"], a2a["signatures"]["pct_verified"])
        self.assertRefused(url(d / "record.json"), "number-provenance check failed", did_doc_url=url(d / "did.json"))

    def test_unknown_schema_refused(self):
        d, _ = self.signed_fixture(b'{"schema": "csoai.unknown/0.1", "as_of": "2026-09-25T00:00:00Z"}')
        self.assertRefused(url(d / "record.json"), "never improvises", did_doc_url=url(d / "did.json"))

    def test_missing_spec_path_refused(self):
        rec = json.loads((FIX / "a2a" / "record.json").read_text())
        del rec["signatures"]["pct_verified"]
        d, _ = self.signed_fixture(json.dumps(rec, indent=1).encode())
        self.assertRefused(url(d / "record.json"), "never fills a gap", did_doc_url=url(d / "did.json"))


class OtsBitcoin(unittest.TestCase):
    """fixtures/a2a/record.json.upgraded.ots: the published pending proof after calendar upgrade (3 Bitcoin attestations)."""
    RAW = (FIX / "a2a" / "record.json").read_bytes()
    PROOF = (FIX / "a2a" / "record.json.upgraded.ots").read_bytes()

    def with_explorer(self, merkle_for):
        real = mc.fetch

        def fake(u, timeout=30):
            if u.startswith(mc.EXPLORER + "/block-height/"):
                return ("hash-" + u.rsplit("/", 1)[1]).encode()
            if u.startswith(mc.EXPLORER + "/block/hash-"):
                return json.dumps({"merkle_root": merkle_for(int(u.rsplit("-", 1)[1]))}).encode()
            raise OSError("offline test: no network")
        mc.fetch = fake
        self.addCleanup(setattr, mc, "fetch", real)

    def roots(self):
        from opentimestamps.core.serialize import BytesDeserializationContext
        from opentimestamps.core.timestamp import DetachedTimestampFile
        from opentimestamps.core.notary import BitcoinBlockHeaderAttestation
        d = DetachedTimestampFile.deserialize(BytesDeserializationContext(self.PROOF))
        return {a.height: m[::-1].hex() for m, a in d.timestamp.all_attestations() if isinstance(a, BitcoinBlockHeaderAttestation)}

    def test_matching_merkle_roots_are_explorer_checked(self):
        r = self.roots()
        self.assertEqual(len(r), 3)
        self.with_explorer(lambda h: r[h])
        st = mc.ots_state(self.RAW, self.PROOF, None, upgrade=True)
        self.assertEqual(st["state"], "BITCOIN_BLOCK_ATTESTED_EXPLORER_CHECKED")

    def test_mismatched_merkle_root_refuses(self):
        r = self.roots()
        self.with_explorer(lambda h: "00" * 32 if h == min(r) else r[h])
        with self.assertRaises(mc.Refusal):
            mc.ots_state(self.RAW, self.PROOF, None, upgrade=True)

    def test_unreachable_explorer_is_unchecked_not_passed(self):
        self.with_explorer(lambda h: (_ for _ in ()).throw(OSError("down")))
        st = mc.ots_state(self.RAW, self.PROOF, None, upgrade=True)
        self.assertEqual(st["state"], "BITCOIN_ATTESTATION_FROM_CALENDAR")
        self.assertIn("did NOT check", st["detail"])

    def test_upgraded_proof_for_other_bytes_refuses(self):
        with self.assertRaises(mc.Refusal):
            mc.ots_state(self.RAW + b" ", self.PROOF, None, upgrade=False)


@unittest.skipUnless(os.environ.get("CSOAI_ONLINE") == "1", "set CSOAI_ONLINE=1 for live DID + HF checks")
class Online(Base):
    def test_live_did_tampered_record_refused(self):
        p = self.a2a / "record.json"
        p.write_bytes(p.read_bytes().replace(b'"verified": 18', b'"verified": 81'))
        self.assertRefused(url(p), "record altered", did_doc_url=mc.CANONICAL_DID_DOC, allow_noncanonical_did=False)

    def test_live_did_untampered_record_verifies(self):
        m = self.run_c(url(self.a2a / "record.json"), did_doc_url=mc.CANONICAL_DID_DOC, allow_noncanonical_did=False)
        self.assertEqual(m["signature"]["state"], "VERIFIED")
        self.assertIn("sig:VERIFIED", (self.out / "x.txt").read_text())
        self.assertNotIn("test key", (self.out / "linkedin.txt").read_text())

    def test_live_hf_record(self):
        m = self.run_c("https://huggingface.co/datasets/csoai/a2a-card-census/resolve/main/record.json",
                       did_doc_url=mc.CANONICAL_DID_DOC, allow_noncanonical_did=False)
        self.assertEqual(m["source"]["sha256"], "b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662176c")


if __name__ == "__main__":
    unittest.main()
