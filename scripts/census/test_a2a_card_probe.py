#!/usr/bin/env python3
"""Offline tests for a2a-card-probe.py. Fixture agent hosts on 127.0.0.1; keys generated per run.

Run: python3 -m unittest scripts/census/test_a2a_card_probe.py -v
"""
from __future__ import annotations

import base64
import copy
import importlib.util
import json
import os
import socket
import tempfile
import time
import unittest
from pathlib import Path

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import ec, ed25519, padding, rsa, utils

HERE = Path(__file__).resolve().parent
_SPEC = importlib.util.spec_from_file_location("a2a_card_probe", HERE / "a2a-card-probe.py")
A = importlib.util.module_from_spec(_SPEC)
_SPEC.loader.exec_module(A)
_T = importlib.util.spec_from_file_location("t_hf", HERE / "test_hf_spaces_mcp_probe.py")
T = importlib.util.module_from_spec(_T)
_T.loader.exec_module(T)
Srv, send = T.Srv, T.send

CFG = {"min_interval": 0.01, "workers": 4, "connect_timeout": 1.0, "read_timeout": 0.8,
       "allow_non_public": True, "sleep": lambda s: None}


def b64u(b):
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def n2b(n, ln=None):
    ln = ln or (n.bit_length() + 7) // 8
    return n.to_bytes(ln, "big")


def card(name="Fixture agent", **extra):
    c = {"protocolVersion": "0.3.0", "name": name, "version": "1.2.3", "url": "https://agent.example/a2a",
         "preferredTransport": "JSONRPC", "additionalInterfaces": [{"url": "https://agent.example/grpc", "transport": "GRPC"}],
         "capabilities": {"streaming": True, "pushNotifications": False},
         "skills": [{"id": "s1", "name": "one"}, {"id": "s2", "name": "two"}], "price": 4.50}
    c.update(extra)
    return c


def sign(c, header, signer):
    body = {k: v for k, v in c.items() if k != "signatures"}
    prot = b64u(json.dumps(header).encode())
    si = (prot + "." + b64u(A.jcs(body).encode())).encode()
    out = dict(c)
    out["signatures"] = [{"protected": prot, "signature": b64u(signer(si))}]
    return out


EC_KEY = ec.generate_private_key(ec.SECP256R1())
EC_PUB = EC_KEY.public_key().public_numbers()
EC_JWK = {"kty": "EC", "crv": "P-256", "kid": "k-ec", "x": b64u(n2b(EC_PUB.x, 32)), "y": b64u(n2b(EC_PUB.y, 32))}
OTHER = ec.generate_private_key(ec.SECP256R1()).public_key().public_numbers()
OTHER_JWK = {"kty": "EC", "crv": "P-256", "kid": "k-ec", "x": b64u(n2b(OTHER.x, 32)), "y": b64u(n2b(OTHER.y, 32))}
ED_KEY = ed25519.Ed25519PrivateKey.generate()
from cryptography.hazmat.primitives import serialization  # noqa: E402
ED_JWK = {"kty": "OKP", "crv": "Ed25519", "x": b64u(ED_KEY.public_key().public_bytes(
    serialization.Encoding.Raw, serialization.PublicFormat.Raw))}
RSA_KEY = rsa.generate_private_key(public_exponent=65537, key_size=2048)
RN = RSA_KEY.public_key().public_numbers()
RSA_JWK = {"kty": "RSA", "n": b64u(n2b(RN.n)), "e": b64u(n2b(RN.e))}


def es256(si):
    r, s = utils.decode_dss_signature(EC_KEY.sign(si, ec.ECDSA(hashes.SHA256())))
    return n2b(r, 32) + n2b(s, 32)


JKU = "https://keys.agent.example/jwks.json"
DID = "did:web:agent.example"
SIGNED_JKU = sign(card("jku agent"), {"alg": "ES256", "kid": "k-ec", "jku": JKU, "typ": "JOSE"}, es256)
TAMPERED = copy.deepcopy(SIGNED_JKU)
TAMPERED["skills"].append({"id": "s3", "name": "added after signing"})
SIGNED_NOKEY = sign(card("kid-only agent"), {"alg": "ES256", "kid": "k-ec"}, es256)
SIGNED_ED_EMBEDDED = sign(card("ed agent"), {"alg": "EdDSA", "jwk": ED_JWK}, ED_KEY.sign)
SIGNED_RSA_DID = sign(card("rsa did agent"), {"alg": "RS256", "kid": DID + "#key-1"},
                      lambda si: RSA_KEY.sign(si, padding.PKCS1v15(), hashes.SHA256()))
SIGNED_JKU_DOWN = sign(card("jku down"), {"alg": "ES256", "kid": "k-ec", "jku": "https://down.example/jwks.json"}, es256)
SIGNED_HS = sign(card("hmac"), {"alg": "HS256"}, lambda si: b"\x00" * 32)

SIGNED_SORTED_JSON = dict(card("sorted-json signer \u00e9"))
_prot = b64u(json.dumps({"alg": "ES256", "kid": "k-ec", "jku": JKU}).encode())
SIGNED_SORTED_JSON["signatures"] = [{"protected": _prot, "signature": b64u(es256((_prot + "." + b64u(json.dumps(
    card("sorted-json signer \u00e9"), sort_keys=True, separators=(",", ":")).encode())).encode()))}]
SIGNED_DER = sign(card("der signer"), {"alg": "ES256", "kid": "k-ec", "jku": JKU},
                  lambda si: EC_KEY.sign(si, ec.ECDSA(hashes.SHA256())))

KEYDOCS = {JKU: {"keys": [EC_JWK]},
           "https://agent.example/.well-known/did.json": {"id": DID, "verificationMethod": [
               {"id": DID + "#key-1", "type": "JsonWebKey2020", "publicKeyJwk": RSA_JWK}]}}


def stub_fetch(url):
    return (KEYDOCS[url], None) if url in KEYDOCS else (None, "HTTP 404")


class JCS(unittest.TestCase):
    def test_rfc8785_example(self):
        v = json.loads('{"numbers":[333333333.33333329,1E30,4.50,2e-3,0.000000000000000000000000001],'
                       '"string":"\\u20ac$\\u000F\\u000aA\'\\u0042\\u0022\\u005c\\\\\\"\\/","literals":[null,true,false]}')
        want = ('{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],'
                '"string":"€$\\u000f\\nA\'B\\"\\\\\\\\\\"/"}')
        self.assertEqual(A.jcs(v), want)

    def test_utf16_key_order(self):
        v = {"€": 1, "\r": 2, "דּ": 3, "1": 4, "\U0001f600": 5, "\u0080": 6, "ö": 7}
        keys = list(json.loads(A.jcs(v)))
        self.assertEqual(keys, ["\r", "1", "\u0080", "ö", "€", "\U0001f600", "דּ"])

    def test_small_numbers(self):
        self.assertEqual(A.jcs([1e-7, 0.000001, 1e21, 123.0, -0.0]), "[1e-7,0.000001,1e+21,123,0]")


class Signatures(unittest.TestCase):
    def st(self, c, fetch=stub_fetch):
        return A.check_signatures(c, fetch)

    def test_unsigned(self):
        self.assertEqual(self.st(card())["sig_state"], "NO_SIGNATURES")

    def test_jku_verifies(self):
        r = self.st(SIGNED_JKU)
        self.assertEqual(r["sig_state"], "VERIFIED")
        self.assertEqual(r["verified_key_sources"], ["jku"])

    def test_tampered_fails(self):
        self.assertEqual(self.st(TAMPERED)["sig_state"], "FAILED")

    def test_wrong_key_fails(self):
        r = self.st(SIGNED_JKU, lambda u: ({"keys": [OTHER_JWK]}, None))
        self.assertEqual(r["sig_state"], "FAILED")

    def test_no_key_pointer_is_uncheckable(self):
        r = self.st(SIGNED_NOKEY)
        self.assertEqual(r["sig_state"], "UNCHECKABLE")
        self.assertIn("points to no key", r["signatures"][0]["reason"])

    def test_key_unreachable_is_uncheckable(self):
        r = self.st(SIGNED_JKU_DOWN)
        self.assertEqual(r["sig_state"], "UNCHECKABLE")
        self.assertIn("not obtained", r["signatures"][0]["reason"])

    def test_embedded_ed25519(self):
        r = self.st(SIGNED_ED_EMBEDDED)
        self.assertEqual((r["sig_state"], r["verified_key_sources"]), ("VERIFIED", ["embedded_jwk"]))

    def test_did_web_rsa(self):
        self.assertEqual(self.st(SIGNED_RSA_DID)["sig_state"], "VERIFIED")
        self.assertEqual(A.did_web_url("did:web:example.com:user:alice#k"), "https://example.com/user/alice/did.json")

    def test_symmetric_alg_uncheckable(self):
        self.assertEqual(self.st(SIGNED_HS)["sig_state"], "UNCHECKABLE")

    def test_non_spec_serialisation_is_failed_with_a_diagnostic(self):
        r = self.st(SIGNED_SORTED_JSON)
        self.assertEqual(r["sig_state"], "FAILED")
        self.assertIn("json_sorted_compact_ascii/b64", r["signatures"][0]["alt_serialisations_verifying"])
        self.assertEqual(self.st(TAMPERED)["signatures"][0]["alt_serialisations_verifying"], [])

    def test_der_encoded_es256_is_failed_and_named(self):
        r = self.st(SIGNED_DER)
        self.assertEqual(r["sig_state"], "FAILED")
        self.assertIn("DER", r["signatures"][0]["reason"])

    def test_garbage_signature_object(self):
        self.assertEqual(self.st(card(signatures=[{"protected": "!!", "signature": "x"}]))["sig_state"], "UNCHECKABLE")


# A2A spec 8.4.1 "Example of Default Value Removal" (docs/specification.md @ 72b3761), verbatim.
SPEC_EXAMPLE_IN = {"name": "Example Agent", "description": "",
                   "capabilities": {"streaming": False, "pushNotifications": False, "extensions": []}, "skills": []}
SPEC_EXAMPLE_OUT = '{"capabilities":{"pushNotifications":false,"streaming":false},"description":"","name":"Example Agent","skills":[]}'


def card_with_defaults():
    """A v1.0-shaped card carrying properties whose value is the proto3 default, next to REQUIRED
    and `optional` ones that must survive, plus one field the proto does not define."""
    return {
        "name": "defaults agent", "description": "", "version": "1.0.0",
        "supportedInterfaces": [{"url": "https://agent.example/a2a", "protocolBinding": "JSONRPC",
                                 "protocolVersion": "1.0", "tenant": ""}],       # tenant: plain string, default
        "provider": {"organization": "Example", "url": "https://agent.example"},
        "documentationUrl": "",                                                    # optional: explicitly set, kept
        "capabilities": {"streaming": False, "extensions": [                       # streaming optional: kept
            {"uri": "urn:x-ext", "description": "", "required": False, "params": {}}]},  # "" / false: removed; Struct kept
        "securitySchemes": {},                                                     # map, empty: removed
        "securityRequirements": [],                                                # repeated, empty: removed
        "defaultInputModes": ["text/plain"], "defaultOutputModes": ["text/plain"],
        "skills": [{"id": "s1", "name": "one", "description": "", "tags": [], "examples": [],  # tags REQUIRED: kept
                    "inputModes": None}],                                          # null == not set: removed
        "x-vendor": {"note": ""},                                                  # not in the proto: kept as served
    }


def sign_spec(c, header, signer):
    """Sign the way 8.4.2 says: defaults removed, signatures excluded, JCS."""
    body = A.strip_defaults({k: v for k, v in c.items() if k != "signatures"})
    prot = b64u(json.dumps(header).encode())
    out = dict(c)
    out["signatures"] = [{"protected": prot, "signature": b64u(signer((prot + "." + b64u(A.jcs(body).encode())).encode()))}]
    return out


class SpecDefaultRemoval(unittest.TestCase):
    """A2A spec 8.4.3 step 3: "Remove properties with default values from the received Agent Card"."""
    H = {"alg": "ES256", "kid": "k-ec", "jku": JKU, "typ": "JOSE"}

    def test_spec_example_verbatim(self):
        self.assertEqual(A.jcs(A.strip_defaults(SPEC_EXAMPLE_IN)), SPEC_EXAMPLE_OUT)

    def test_field_rules(self):
        unknown = []
        b = A.strip_defaults(card_with_defaults(), unknown=unknown)
        self.assertEqual(b["description"], "")                          # REQUIRED
        self.assertEqual(b["documentationUrl"], "")                     # optional, explicitly set
        self.assertIs(b["capabilities"]["streaming"], False)            # optional
        self.assertEqual(b["capabilities"]["extensions"], [{"uri": "urn:x-ext", "params": {}}])
        self.assertNotIn("tenant", b["supportedInterfaces"][0])
        for k in ("securitySchemes", "securityRequirements"):
            self.assertNotIn(k, b)
        self.assertEqual(b["skills"], [{"id": "s1", "name": "one", "description": "", "tags": []}])
        self.assertEqual(b["x-vendor"], {"note": ""})
        self.assertEqual(unknown, ["x-vendor"])
        self.assertEqual(A.strip_defaults({"documentation_url": "", "icon_url": None, "name": ""}), {"documentation_url": "", "name": ""})

    def test_card_carrying_defaults_verifies(self):
        c = sign_spec(card_with_defaults(), self.H, es256)
        r = A.check_signatures(c, stub_fetch)
        self.assertEqual(r["sig_state"], "VERIFIED")
        self.assertTrue(r["defaults_removed"])
        self.assertEqual(r["fields_not_in_schema"], ["x-vendor"])

    def test_tampered_default_carrying_card_fails(self):
        c = sign_spec(card_with_defaults(), self.H, es256)
        c["skills"][0]["examples"] = ["added after signing"]
        self.assertEqual(A.check_signatures(c, stub_fetch)["sig_state"], "FAILED")

    def test_signed_over_served_bytes_is_failed_with_a_diagnostic(self):
        c = sign(card_with_defaults(), self.H, es256)  # JCS of the card as served: 8.4.3 not followed by the signer
        r = A.check_signatures(c, stub_fetch)
        self.assertEqual(r["sig_state"], "FAILED")
        self.assertIn("jcs_defaults_not_removed/b64", r["signatures"][0]["alt_serialisations_verifying"])

    def test_sdk_clean_empty_signer_is_named(self):
        body = A._sdk_clean_empty({k: v for k, v in card_with_defaults().items()})
        prot = b64u(json.dumps(self.H).encode())
        c = card_with_defaults()
        c["signatures"] = [{"protected": prot, "signature": b64u(es256((prot + "." + b64u(A.jcs(body).encode())).encode()))}]
        r = A.check_signatures(c, stub_fetch)
        self.assertEqual(r["sig_state"], "FAILED")
        self.assertIn("jcs_sdk_clean_empty/b64", r["signatures"][0]["alt_serialisations_verifying"])

    def test_no_default_card_payload_unchanged(self):
        self.assertFalse(A.check_signatures(SIGNED_JKU, stub_fetch)["defaults_removed"])

    def test_must_fail_control_without_step_3(self):
        """Restore the pre-fix verifier (no default removal): the spec-signed default-carrying card must
        then FAIL - so test_card_carrying_defaults_verifies cannot pass without step 3."""
        c = sign_spec(card_with_defaults(), self.H, es256)
        saved = A.strip_defaults
        try:
            A.strip_defaults = lambda v, *a, **k: v
            self.assertEqual(A.check_signatures(c, stub_fetch)["sig_state"], "FAILED")
        finally:
            A.strip_defaults = saved
        self.assertEqual(A.check_signatures(c, stub_fetch)["sig_state"], "VERIFIED")

    def test_proto_pin_fails_closed(self):
        saved, cache = A.A2A_PROTO_SHA256, dict(A._SCHEMA_CACHE)
        try:
            A._SCHEMA_CACHE.clear()
            A.A2A_PROTO_SHA256 = "0" * 64
            with self.assertRaises(RuntimeError):
                A.a2a_schema()
        finally:
            A.A2A_PROTO_SHA256 = saved
            A._SCHEMA_CACHE.clear()
            A._SCHEMA_CACHE.update(cache)


def agent_host(h, method):
    p = h.path
    routes = {
        "/plain/.well-known/agent-card.json": (200, card("plain")),
        "/.well-known/agent-card.json": (404, {"detail": "nf"}),
        "/signed/.well-known/agent-card.json": (200, SIGNED_JKU),
        "/auth/.well-known/agent-card.json": (401, {"error": "unauthorized"}),
        "/html/.well-known/agent-card.json": (200, b"<html>hi</html>"),
        "/redir/.well-known/agent-card.json": (302, b""),
    }
    if p == "/robots.txt":
        return send(h, 200, b"User-agent: *\nDisallow: /private/\n", "text/plain")
    if p == "/redir/.well-known/agent-card.json":
        return send(h, 302, b"", headers={"Location": "/plain/.well-known/agent-card.json"})
    if p == "/slow/.well-known/agent-card.json":
        time.sleep(1.5)
        return send(h, 200, card("slow"))
    if p in routes:
        code, body = routes[p]
        ct = "text/html" if isinstance(body, bytes) and body.startswith(b"<") else "application/json"
        return send(h, code, body, ct)
    return send(h, 404, {"detail": "nf"})


def closed_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def legacy_host(h, method):
    if h.path == "/.well-known/agent.json":
        return send(h, 200, card("legacy only"))
    return send(h, 404, {"detail": "nf"})


class Probe(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = Srv(agent_host)
        cls.legacy = Srv(legacy_host)
        b = cls.srv.base
        cls.L = {
            "plain": {"id": "plain", "url": b + "/plain/", "wellKnownURI": b + "/plain/.well-known/agent-card.json"},
            "legacy": {"id": "legacy", "url": cls.legacy.base + "/x/",
                       "wellKnownURI": cls.legacy.base + "/x/.well-known/agent-card.json"},
            "signed": {"id": "signed", "url": b + "/signed/", "wellKnownURI": b + "/signed/.well-known/agent-card.json"},
            "auth": {"id": "auth", "url": b + "/auth/", "wellKnownURI": b + "/auth/.well-known/agent-card.json"},
            "html": {"id": "html", "url": b + "/html/", "wellKnownURI": b + "/html/.well-known/agent-card.json"},
            "redir": {"id": "redir", "url": b + "/redir/", "wellKnownURI": b + "/redir/.well-known/agent-card.json"},
            "private": {"id": "private", "url": b + "/private/", "wellKnownURI": b + "/private/.well-known/agent-card.json"},
            "slow": {"id": "slow", "url": b + "/slow/", "wellKnownURI": b + "/slow/.well-known/agent-card.json"},
            "bad": {"id": "bad", "url": "not a url"},
        }

    @classmethod
    def tearDownClass(cls):
        cls.srv.close()
        cls.legacy.close()

    def one(self, k, cfg=CFG):
        return A.probe_listing(self.L[k], A.P.HostGate(0.01), cfg, {})

    def test_plain(self):
        r = self.one("plain")
        self.assertEqual((r["state"], r["card_source"]), ("CARD_SERVED", "listing.wellKnownURI"))
        self.assertEqual(r["card"]["n_skills"], 2)
        self.assertEqual(r["card"]["transports"], ["GRPC", "JSONRPC"])
        self.assertEqual(r["card"]["capabilities_true"], ["streaming"])
        self.assertFalse(r["card"]["signatures_block"])

    def test_legacy_name_found_after_both_new_names_404(self):
        r = self.one("legacy")
        self.assertEqual((r["state"], r["card_source"]), ("CARD_SERVED", "origin/.well-known/agent.json"))
        self.assertEqual(r["card"]["name"], "legacy only")

    def test_states(self):
        self.assertEqual(self.one("auth")["state"], "AUTH_REQUIRED")
        self.assertEqual(self.one("html")["state"], "CARD_INVALID")  # HTML at the listed URI, 404 at the origin
        self.assertEqual(self.one("redir")["card"]["name"], "plain")
        self.assertEqual(self.one("bad")["state"], "INVALID_URL")
        self.assertEqual(self.one("slow")["state"], "TIMEOUT")

    def test_robots_disallowed_path_is_not_fetched(self):
        before = len(self.srv.reqs)
        r = self.one("private")
        paths = [p for _m, p in self.srv.reqs[before:]]
        self.assertNotIn("/private/.well-known/agent-card.json", paths)
        self.assertEqual(r["state"], "ROBOTS_DISALLOWED")  # the origin candidates were still tried: both 404
        self.assertIn("/.well-known/agent.json", paths)

    def test_unreachable(self):
        r = A.probe_listing({"id": "dead", "url": f"http://127.0.0.1:{closed_port()}/"}, A.P.HostGate(0.01), CFG, {})
        self.assertEqual(r["state"], "UNREACHABLE")

    def test_non_public_address_is_never_contacted(self):
        before = len(self.srv.reqs)
        r = self.one("plain", cfg=dict(CFG, allow_non_public=False))
        self.assertEqual(r["state"], "NON_PUBLIC_ADDRESS")
        self.assertEqual(len(self.srv.reqs), before)
        for ip, want in (("10.1.2.3", "non_public"), ("100.101.102.103", "non_public"), ("169.254.1.1", "non_public"),
                         ("::1", "non_public"), ("8.8.8.8", "public")):
            self.assertEqual(A.address_class(ip)[0], want, ip)
        fake = lambda h, p, proto=0: [(2, 1, 6, "", ("192.168.1.9", 0)), (2, 1, 6, "", ("1.1.1.1", 0))]
        self.assertEqual(A.address_class("mixed.example", fake)[0], "non_public")

    def test_every_candidate_host_is_address_checked(self):
        inner = Srv(agent_host)
        try:
            port = self.srv.httpd.server_address[1]
            listing = {"id": "mixed", "wellKnownURI": f"http://localhost:{port}/nf/.well-known/agent-card.json",
                       "url": inner.base + "/a2a"}  # 127.0.0.1 literal: non-global
            pretend_public = lambda h, p, proto=0: [(2, 1, 6, "", ("8.8.8.8", 0))]
            r = A.probe_listing(listing, A.P.HostGate(0.01), dict(CFG, allow_non_public=False), {}, pretend_public)
            self.assertEqual(inner.reqs, [])
            self.assertEqual(r["state"], "NOT_FOUND")
            self.assertIn("non-global", r["reason"])
        finally:
            inner.close()

    def test_hf_space_host_is_never_contacted(self):
        r = A.probe_listing({"id": "hf", "url": "https://someone-demo.hf.space/",
                             "wellKnownURI": "https://someone-demo.hf.space/.well-known/agent.json"},
                            A.P.HostGate(0.01), CFG, {})
        self.assertEqual((r["state"], r["requests"]), ("HF_SPACE_NOT_CONTACTED", []))

    def test_run_end_to_end_signature_and_summary(self):
        out = tempfile.mkdtemp()
        ls = [dict(self.L[k], order=i) for i, k in enumerate(("plain", "signed", "auth", "bad"), 1)]
        run = A.Run(ls, out, dict(CFG, workers=2))
        run.fetch_key_doc = stub_fetch
        s0, s1 = run.run()
        s = A.summarise(run, s0, s1, len(ls), len(ls))
        self.assertEqual(s["states"]["CARD_SERVED"], 2)
        self.assertEqual(s["signatures"]["sig_state"], {"NO_SIGNATURES": 1, "VERIFIED": 1, "FAILED": 0, "UNCHECKABLE": 0})
        self.assertEqual(s["signatures"]["pct_verifying"], 50.0)
        self.assertEqual(s["read_state"], "EXHAUSTED")
        self.assertTrue(os.path.exists(os.path.join(out, "results.jsonl.gz")))
        import gzip
        cards = [json.loads(l) for l in gzip.open(os.path.join(out, "cards.jsonl.gz"), "rt")]
        self.assertEqual(sorted(c["id"] for c in cards), ["plain", "signed"])
        self.assertEqual(json.loads(cards[1]["body"])["name"] if cards[1]["id"] == "signed" else "jku agent", "jku agent")
        self.assertTrue(all(m == "GET" for m, _p in self.srv.reqs), "only GETs are ever sent")


if __name__ == "__main__":
    unittest.main()
