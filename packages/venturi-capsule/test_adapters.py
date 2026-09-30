# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""Per-adapter tests with must-fail controls. Fixtures are shapes copied from the real source records (small)."""
import copy, json, random, unittest
import venturi_capsule as v
from adapters import a2a_card, contract_parity, cross_ledger, self_parity, mill_cross_runtime
from test_venturi_capsule import decl as mill_decl

H = "a" * 64


def root(caps):
    return v.merkle_root([c["capsule_id"] for c in caps])


# ---------------------------------------------------------------- contract_parity fixtures
def cp_row(endpoint, auth_value="false", tools_state="CONSISTENT"):
    return {"attempted": True, "endpoint": endpoint, "host": endpoint.split("/")[2], "in_watch_list": False, "inclusion": "responded",
            "own_estate": False, "registry_ids": ["io.example/x"], "shared_origin": True,
            "live": {"finished": "2026-09-25T06:39:27Z", "http_status": 200, "n_tools": 2, "state": "RESPONDED",
                     "tool_names_sha256": H, "server_version": "1.0.0", "protocol_version": "2025-11-25"},
            "surfaces": {"mcp.json": [{"url": endpoint + "/.well-known/mcp.json", "sha256": "b" * 64, "state": "PRESENT"}]},
            "dimensions": {
                "AUTH": {"declared": [{"path": "auth_required", "surface": "mcp.json", "value": auth_value},
                                      {"path": "authentication.required", "surface": "server-card", "value": "false"}],
                         "observed": {"path": "initialize/tools-list", "surface": "observed discovery boundary", "value": "answered without credentials"},
                         "state": "CONSISTENT" if auth_value == "false" else "INCONSISTENT",
                         **({} if auth_value == "false" else {"conflict": "mcp.json vs server-card"})},
                "PAYMENT": {"detail": "no payment surface", "reason": "NO_PAYMENT_SURFACE", "state": "UNCHECKABLE"},
                "PROTOCOL": {"detail": "no surface declares", "live": {"value": "2025-11-25"}, "state": "SINGLE_SURFACE"},
                "TOOLS": {"declared": [{"path": "tools", "surface": "mcp.json", "value": "n=2"}], "live": {"value": "n=2"}, "state": tools_state},
                "VERSION": {"claims": [{"path": "server.version", "surface": "registry", "value": "1.0.0"},
                                       {"path": "serverInfo.version", "surface": "live initialize", "value": "1.0.0"}], "state": "CONSISTENT"}}}


CP_CTX = {"record_version": "0.1.1", "record_schema": "csoai.mcp-contract-parity/0.1.1", "record_sha256": "c" * 64,
          "rows_sha256": "d" * 64, "sig_payload_sha256": "e" * 64, "as_of": "2026-09-25T12:24:52Z", "supersedes_sha256": "f" * 64,
          "fix_commit": "1" * 40, "changes": {("https://b.example/mcp", "TOOLS"): {"from": "INCONSISTENT", "to": "CONSISTENT", "cause": ["D2b"]}}}


def cp_caps(rows):
    st = {}
    return [c for r in rows for c in contract_parity.capsules_from_row(r, CP_CTX, st)], st


# ---------------------------------------------------------------- a2a fixtures
def b64(o):
    import base64
    return base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip("=")


A2A_CTX = {"record_schema": "csoai.a2a-card-census/0.1.1", "record_version": "0.1.1", "record_sha256": "c" * 64, "rows_sha256": "d" * 64,
           "bodies_sha256": "e" * 64, "sig_payload_sha256": "f" * 64, "evidence_sha256": "9" * 64, "supersedes_sha256": "8" * 64,
           "corrected_utc": "2026-09-26T04:05:43Z", "as_of": "2026-09-25T07:25:59Z",
           "changes": {"id-1": {"from": "VERIFIED", "to": "FAILED", "why": "8.4.3 step 3 applied"}}}


def a2a_row(i, state="VERIFIED", major="1.x"):
    return {"id": f"id-{i}", "host": f"h{i}.example", "card_url": f"https://h{i}.example/.well-known/agent-card.json",
            "card_sha256": v.sha(str(i).encode()), "card_source": "listing.wellKnownURI", "n_signatures": 1, "sig_state": state,
            "sig_state_0_1": "VERIFIED", "sig_state_under_1x_rules": "FAILED" if major == "0.x" else None, "declared_major": major,
            "canonicalisation_rule": "a2a-1.x-8.4.3" if major == "1.x" else "a2a-0.x-served-bytes", "verify_results": [state],
            "key_source_kinds": ["jku"], "algs": ["EdDSA"], "card_protocolVersion": "1.0" if major == "1.x" else "0.3.0",
            "listed_protocolVersion": "1.0"}


def a2a_body(i):
    return {"name": f"agent {i}", "signatures": [{"protected": b64({"alg": "EdDSA", "kid": f"k{i}", "jku": f"https://h{i}.example/jwks.json"}),
                                                 "signature": "sig"}]}


# ---------------------------------------------------------------- cross-ledger fixtures
def xl_record(rows, listed_not_read=()):
    return {"schema": "csoai.cross-ledger-supply/0.1", "asset": "USDC", "issuer": "Circle", "as_of": "2026-09-25T04:18:40Z",
            "issuer_list_evidence": {"page": "https://issuer.example/list", "md_sha256": "1" * 64, "html_sha256": "2" * 64, "state": "READ"},
            "rows": rows, "listed_not_read": list(listed_not_read), "issuer_reported": []}


def xl_row(ledger, kind, proof=None, supply="100"):
    return {"ledger": ledger, "deployment_id": f"0x{ledger}", "scope": "core", "supply_base_units": supply, "decimals": 6,
            "supply_decimal": supply, "observed_at": "2026-09-25T04:18:41Z", "height": {"number": 1}, "endpoint": "https://rpc.example",
            "operator": "op", "response_sha256": "3" * 64, "evidence_kind": kind, "two_operators_agree": "true",
            "second_read": {"supply_base_units": supply, "response_sha256": "4" * 64}, "identity": {"symbol": "USDC"},
            "proof": proof, "issuer_listed": {"identifier": f"0x{ledger}", "in_rendered_html": True}, "circle_label": ledger.title()}


VERIFIED_PROOF = {"type": "EIP-1186 eth_getProof", "account_proof_verified": True, "storage_proof_verified": True, "error": None,
                  "response_sha256": "5" * 64, "file": {"sha256": "6" * 64}}


def xl_caps(rec):
    return cross_ledger.capsules_from_record(rec, "c" * 64, {"payload_sha256": "d" * 64}, {})


# ---------------------------------------------------------------- self-parity fixture (schema csoai.self-parity/0.1)
SP_CTX = {"record_sha256": "c" * 64, "sig": "d" * 64, "as_of": "2026-09-26T06:00:00Z", "catalog_sha256": "e" * 64, "fetch_log_sha256": "f" * 64}


def sp_record(version_theirs="1.4.2"):
    return {"schema": "csoai.self-parity/0.1",
            "catalog_rows": [{"id": "mcp:councilof.ai/mcp", "kind": "mcp-remote", "version": "1.4.2", "live_state": "LIVE", "sha256": "7" * 64}],
            "cells": [{"index": "mcp-registry", "offering": "mcp:councilof.ai/mcp",
                       "state": "CONSISTENT" if version_theirs == "1.4.2" else "INCONSISTENT",
                       "listings": [{"key": "io.github.CSOAI-ORG/gspc", "text_diffs": [],
                                     "fields": [{"field": "presence", "ours": True, "theirs": True, "verdict": "AGREES"},
                                                {"field": "version", "ours": "1.4.2", "theirs": version_theirs,
                                                 "verdict": "AGREES" if version_theirs == "1.4.2" else "DIFFERS"}]}],
                       "fields_checked": ["presence", "version"]},
                      {"index": "smithery", "offering": "mcp:councilof.ai/mcp", "state": "NOT_LISTED", "reason": "whole list read"}],
            "own_surface_parity": {"checks": [{"surface": "mcp.json", "field": "version", "live": "1.4.2", "declared": "1.4.2", "state": "CONSISTENT"}]}}


def sp_caps(rec):
    return self_parity.capsules_from_record(rec, None, SP_CTX, {})


def _ps_caps():
    from adapters import public_signals
    from test_public_signals import BASE, record
    ctx = {"record_sha256": H, "as_of": "2026-09-26T06:05:00Z", "fetch_log_sha256": H, "local_inputs_sha256": None,
           "prev_sha256": None, "prev_date": None}
    return public_signals.capsules_from_record(record("2026-09-26", BASE), None, ctx, {})


ALL_FIXTURES = {
    "contract_parity": lambda: cp_caps([cp_row("https://a.example/mcp"), cp_row("https://b.example/mcp", "true")])[0],
    "a2a_card": lambda: [a2a_card.capsule_for(a2a_row(i, "FAILED" if i == 1 else "VERIFIED", "0.x" if i == 2 else "1.x"), a2a_body(i), None, A2A_CTX) for i in range(3)],
    "cross_ledger": lambda: xl_caps(xl_record([xl_row("ethereum", "STATE_PROOF_VERIFIED", VERIFIED_PROOF), xl_row("solana", "OPERATOR_API")],
                                              [{"circle_label": "Algorand", "identifier": "31566704", "reason": "no reader wired"}])),
    "self_parity": lambda: sp_caps(sp_record()),
    "mill_cross_runtime": lambda: [v.capsule_from_mill_decl(mill_decl([], True), "t")],
    "public_signals": lambda: _ps_caps(),
    "tool_drift": lambda: _td_caps(),
}


def _td_caps():
    from adapters import tool_drift as td
    from test_tool_drift import row, obs, tools, BASE, E
    t1, t2 = obs(row(E, BASE)), obs(row(E, BASE + tools(("delete", "Delete.", {})), started="2026-09-26T07:30:00Z"))
    return [td.capsule_for(E, t1, t2, {"t1": ["f" * 64], "t2": ["f" * 64]}),
            td.capsule_for(E + "/b", t1, t1, {"t1": ["f" * 64], "t2": ["f" * 64]})]


class ContractParity(unittest.TestCase):
    def test_skips_single_surface_and_counts_it(self):
        caps, st = cp_caps([cp_row("https://a.example/mcp")])
        dims = sorted(c["claim"]["dimension"] for c in caps)
        self.assertEqual(dims, ["AUTH", "TOOLS", "VERSION"])
        self.assertEqual(st["skipped"]["PROTOCOL:SINGLE_SURFACE"], 1)
        # an UNCHECKABLE dimension no surface spoke to (NO_PAYMENT_SURFACE) is counted, never capsuled
        self.assertEqual(st["skipped"]["PAYMENT:UNCHECKABLE(NO_PAYMENT_SURFACE):fewer_than_two_surfaces"], 1)

    def test_uncheckable_with_two_surfaces_is_capsuled(self):
        r = cp_row("https://a.example/mcp")
        r["dimensions"]["PROTOCOL"] = {"declared": [{"path": "protocolVersion", "surface": "server-card", "value": "2025-06-18"}],
                                       "live": {"value": "2025-11-25 (requested 2025-11-25)"}, "detail": "d",
                                       "reason": "DECLARED_VERSION_NOT_REQUESTED", "state": "UNCHECKABLE"}
        c = [c for c in cp_caps([r])[0] if c["claim"]["dimension"] == "PROTOCOL"][0]
        self.assertEqual(c["measurement_state"], "UNCHECKABLE")
        self.assertEqual(c["differential"]["surfaces_speaking"], ["live", "server-card"])

    def test_not_attempted_counted_not_capsuled(self):
        r = cp_row("https://a.example/mcp"); r["attempted"] = False
        caps, st = cp_caps([r])
        self.assertEqual(caps, []); self.assertEqual(st["not_attempted_rows"], 1)

    def test_declared_observed_split(self):
        c = [c for c in cp_caps([cp_row("https://a.example/mcp")])[0] if c["claim"]["dimension"] == "AUTH"][0]
        self.assertEqual(len(c["declared"]["declared"]), 2)
        self.assertIn("observed", c["observed"]); self.assertEqual(c["observed"]["live_read"]["n_tools"], 2)
        self.assertEqual(c["measurement_state"], "CONSISTENT")

    def test_correction_pointer(self):
        caps, _ = cp_caps([cp_row("https://b.example/mcp")])
        t = [c for c in caps if c["claim"]["dimension"] == "TOOLS"][0]
        self.assertEqual(t["correction_pointer"]["record_version"], "0.1.1")
        self.assertEqual(t["correction_pointer"]["from"], "INCONSISTENT")
        self.assertIsNone([c for c in caps if c["claim"]["dimension"] == "AUTH"][0]["correction_pointer"])

    def test_tamper_changes_id(self):
        a = cp_caps([cp_row("https://a.example/mcp")])[0]
        r = cp_row("https://a.example/mcp"); r["dimensions"]["AUTH"]["declared"][1]["value"] = "true"
        b = cp_caps([r])[0]
        self.assertNotEqual({c["capsule_id"] for c in a if c["claim"]["dimension"] == "AUTH"},
                            {c["capsule_id"] for c in b if c["claim"]["dimension"] == "AUTH"})

    def test_reorder_keeps_root(self):
        rows = [cp_row(f"https://{i}.example/mcp", "true" if i % 2 else "false") for i in range(6)]
        rev = list(reversed(rows))
        self.assertEqual(root(cp_caps(rows)[0]), root(cp_caps(rev)[0]))


class A2A(unittest.TestCase):
    def test_declared_key_reference(self):
        c = a2a_card.capsule_for(a2a_row(0), a2a_body(0), None, A2A_CTX)
        s = c["declared"]["signatures"][0]
        self.assertEqual((s["kid"], s["jku"], s["embedded_jwk"]), ("k0", "https://h0.example/jwks.json", False))
        self.assertEqual(c["measurement_state"], "VERIFIED")

    def test_0x_note_and_correction(self):
        c = a2a_card.capsule_for(a2a_row(2, "VERIFIED", "0.x"), a2a_body(2), None, A2A_CTX)
        self.assertIn("0.x", c["differential"]["note_0x"]); self.assertEqual(c["differential"]["sig_state_under_1x_rules"], "FAILED")
        c1 = a2a_card.capsule_for(a2a_row(1, "FAILED"), a2a_body(1), None, A2A_CTX)
        self.assertEqual(c1["correction_pointer"]["to"], "FAILED"); self.assertTrue(c1["differential"]["changed_in_0_1_1"])

    def test_tamper_changes_id(self):
        a = a2a_card.capsule_for(a2a_row(0), a2a_body(0), None, A2A_CTX)
        body = a2a_body(0); body["signatures"][0]["protected"] = b64({"alg": "EdDSA", "kid": "other", "jku": "https://h0.example/jwks.json"})
        b = a2a_card.capsule_for(a2a_row(0), body, None, A2A_CTX)
        self.assertNotEqual(a["capsule_id"], b["capsule_id"])

    def test_reorder_keeps_root(self):
        caps = [a2a_card.capsule_for(a2a_row(i), a2a_body(i), None, A2A_CTX) for i in range(7)]
        sh = caps[:]; random.Random(4).shuffle(sh)
        self.assertEqual(root(caps), root(sh))


class CrossLedger(unittest.TestCase):
    def test_operator_api_never_labelled_state_proof(self):
        # an OPERATOR_API row that happens to carry a verified-looking proof object stays OPERATOR_API
        caps = xl_caps(xl_record([xl_row("solana", "OPERATOR_API", VERIFIED_PROOF)]))
        self.assertEqual(caps[0]["measurement_state"], "OPERATOR_API")
        self.assertNotIn("STATE_PROOF", caps[0]["measurement_state"])
        self.assertNotIn("STATE_PROOF", caps[0]["observed"]["evidence_kind"])

    def test_state_proof_label_without_verified_proof_is_refused(self):
        for bad in (None, dict(VERIFIED_PROOF, storage_proof_verified=False), dict(VERIFIED_PROOF, error="ProofError")):
            with self.assertRaises(cross_ledger.LabelInconsistent):
                xl_caps(xl_record([xl_row("ethereum", "STATE_PROOF_VERIFIED", bad)]))

    def test_recorded_is_not_upgraded(self):
        p = dict(VERIFIED_PROOF, account_proof_verified=False, storage_proof_verified=False, error="ProofError")
        caps = xl_caps(xl_record([xl_row("avalanche", "STATE_PROOF_RECORDED", p)]))
        self.assertEqual(caps[0]["measurement_state"], "STATE_PROOF_RECORDED")

    def test_listed_not_read_and_no_list(self):
        caps = ALL_FIXTURES["cross_ledger"]()
        self.assertEqual(sorted(c["measurement_state"] for c in caps), ["LISTED_NOT_READ", "OPERATOR_API", "STATE_PROOF_VERIFIED"])
        rec = xl_record([]); rec["issuer_list_evidence"] = {"state": "ISSUER_LIST_UNAVAILABLE", "tried": [{"url": "https://x", "sha256": "1" * 64}]}
        self.assertEqual(xl_caps(rec)[0]["measurement_state"], "ISSUER_LIST_UNAVAILABLE")

    def test_tamper_changes_id(self):
        a = xl_caps(xl_record([xl_row("solana", "OPERATOR_API", supply="100")]))[0]
        b = xl_caps(xl_record([xl_row("solana", "OPERATOR_API", supply="101")]))[0]
        self.assertNotEqual(a["capsule_id"], b["capsule_id"])

    def test_reorder_keeps_root(self):
        rows = [xl_row(l, "OPERATOR_API") for l in ("solana", "sui", "xrpl", "stellar", "hedera")]
        self.assertEqual(root(xl_caps(xl_record(rows))), root(xl_caps(xl_record(list(reversed(rows))))))


class SelfParity(unittest.TestCase):
    def test_cells_and_own(self):
        caps = sp_caps(sp_record())
        self.assertEqual(sorted(c["measurement_state"] for c in caps), ["CONSISTENT", "CONSISTENT", "NOT_LISTED"])
        c = [c for c in caps if c["subject_id"] == "mcp:councilof.ai/mcp@mcp-registry"][0]
        self.assertEqual(c["declared"]["listings"][0]["fields"]["version"], ["1.4.2"])
        self.assertEqual(c["observed"]["fields"]["version"], ["1.4.2"])

    def test_tamper_changes_id(self):
        a = {c["subject_id"]: c["capsule_id"] for c in sp_caps(sp_record())}
        b = {c["subject_id"]: c["capsule_id"] for c in sp_caps(sp_record("1.4.1"))}
        self.assertNotEqual(a["mcp:councilof.ai/mcp@mcp-registry"], b["mcp:councilof.ai/mcp@mcp-registry"])

    def test_reorder_keeps_root(self):
        r = sp_record(); r2 = copy.deepcopy(r); r2["cells"].reverse()
        self.assertEqual(root(sp_caps(r)), root(sp_caps(r2)))

    def test_pending_source(self):
        import tempfile
        from adapters import PendingSource
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(PendingSource):
                list(self_parity.capsules(d, {}))


class Mill(unittest.TestCase):
    def test_adapter_is_the_legacy_path(self):
        import tempfile, pathlib
        with tempfile.TemporaryDirectory() as d:
            (pathlib.Path(d) / "decl").mkdir()
            (pathlib.Path(d) / "decl" / "runtime-declaration-x.json").write_text(json.dumps(mill_decl([], True)))
            c = list(mill_cross_runtime.capsules(d, {}))[0]
            self.assertEqual(c, v.capsule_from_mill_decl(mill_decl([], True), c["observed_at"]))


class EveryAdapter(unittest.TestCase):
    def test_no_decision_or_authority_field_in_any_adapter(self):
        for name, mk in ALL_FIXTURES.items():
            for c in mk():
                self.assertEqual(v.authority_violations(c), [], name)
                s = json.dumps(c)
                self.assertNotIn('"decision"', s.lower(), name)
                for bad in ('"ALLOW"', '"HOLD"', '"REJECT"'):
                    self.assertNotIn(bad, s, name)
                self.assertTrue(c["authority_state"].startswith("NONE"), name)
                self.assertEqual(v.capsule_id(c), c["capsule_id"], name)
                self.assertEqual(c["schema"], v.SCHEMA)

    def test_every_adapter_module_is_covered(self):
        import adapters
        self.assertEqual(set(ALL_FIXTURES), set(adapters.NAMES))

    def test_control_authority_field_is_refused(self):
        base = dict(kind="k", subject_id="s", claim={}, declared={}, observed={}, differential={}, sources={"x": H},
                    measurement_state="CONSISTENT", limitations=[], observed_at="t")
        v.make_capsule(**base)  # the control's baseline builds
        for bad in ({"declared": {"decision": "x"}}, {"observed": {"result": "ALLOW"}}, {"differential": {"gate": "open"}},
                    {"claim": {"authority": "admin"}}, {"measurement_state": "HOLD"}, {"declared": {"x": ["REJECT"]}}):
            with self.assertRaises(ValueError, msg=str(bad)):
                v.make_capsule(**dict(base, **bad))

    def test_control_non_digest_source_is_refused(self):
        with self.assertRaises(ValueError):
            v.make_capsule(kind="k", subject_id="s", claim={}, declared={}, observed={}, differential={},
                           sources={"evidence": "the full evidence text copied in"}, measurement_state="X", limitations=[], observed_at="t")

    def test_verify_catches_tampered_batch(self):
        import tempfile, pathlib, gzip as gz
        with tempfile.TemporaryDirectory() as d:
            caps = ALL_FIXTURES["cross_ledger"]()
            v.write_batch(d, "cross_ledger", cross_ledger.KIND, caps, {})
            res, rec, ids = v.verify_batch(d, check_signature=False)
            self.assertEqual(res["capsules"], 3)
            lines = gz.decompress((pathlib.Path(d) / "capsules.jsonl.gz").read_bytes()).replace(b'"100"', b'"999"')
            (pathlib.Path(d) / "capsules.jsonl.gz").write_bytes(gz.compress(lines, mtime=0))
            with self.assertRaises(AssertionError):
                v.verify_batch(d, check_signature=False)


if __name__ == "__main__":
    unittest.main()
