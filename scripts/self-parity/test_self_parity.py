#!/usr/bin/env python3
"""Offline tests for self_parity.py (stdlib unittest; no network).

    python3 -m unittest -v test_self_parity.py

Negative controls the brief requires:
  * a version mismatch MUST be flagged INCONSISTENT;
  * a missing listing MUST be NOT_LISTED (and only from a COMPLETE read: a PARTIAL read is UNCHECKABLE);
  * a re-ordered list MUST NOT count as a change.
Plus: the three altered-preimage signature controls must all be rejected, wording is never a verdict,
and the rate limiter really waits.
"""
import copy, importlib.util, json, pathlib, sys, unittest

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("self_parity", HERE / "self_parity.py")
sp = importlib.util.module_from_spec(spec); spec.loader.exec_module(sp)


def mcp_off(version="1.4.2", tools=("a", "b", "c")):
    return {"id": "mcp:councilof.ai/mcp", "kind": "mcp-remote", "canonical_url": sp.CANON_MCP, "version": version,
            "live_state": "LIVE", "mcp_server": True, "facts": {"tools": sorted(tools), "n_tools": len(tools)}}


def npm_off(version="0.3.0"):
    return {"id": "npm:csoai-gspc-mcp", "kind": "npm-package", "canonical_url": "x", "version": version,
            "live_state": "LIVE", "mcp_server": True, "facts": {}}


def door_off(url="https://councilof.ai/api/free-door", amount="0"):
    return {"id": "x402:door:" + url, "kind": "x402-door", "canonical_url": url, "version": None, "live_state": "LIVE",
            "mcp_server": False, "facts": {"amount_atomic": amount, "payTo": "0xABC", "network": "eip155:8453", "x402Version": 2,
                                           "description": "free door"}}


def reg_index(listings, read_state="COMPLETE", openness="OPEN_DIRECTORY"):
    ix = sp.index("mcp-registry", "reg", openness, {}, read_state=read_state, applies=("mcp-server",))
    ix["listings"] = listings
    return ix


def reg_listing(version="1.4.2", tools=("a", "b", "c"), desc="3 tools. Measurement only."):
    return {"key": "ai.councilof/gspc", "maps_to": ["mcp:councilof.ai/mcp"],
            "fields": {"name": "ai.councilof/gspc", "description": desc, "version": version,
                       "remotes": [{"type": "streamable-http", "url": "https://councilof.ai/mcp/"}], "tools": list(tools)}}


class VersionMismatch(unittest.TestCase):
    def test_registry_version_lag_is_inconsistent(self):
        cells = sp.build_cells([mcp_off("1.4.3")], [reg_index([reg_listing("1.4.2")])])
        self.assertEqual(cells[0]["state"], "INCONSISTENT")
        f = [x for x in cells[0]["listings"][0]["fields"] if x["field"] == "version"][0]
        self.assertEqual((f["ours"], f["theirs"], f["verdict"]), ("1.4.3", "1.4.2", "DIFFERS"))

    def test_same_version_trailing_slash_is_consistent(self):
        cells = sp.build_cells([mcp_off()], [reg_index([reg_listing()])])
        self.assertEqual(cells[0]["state"], "CONSISTENT")
        self.assertIn("url", cells[0]["fields_checked"])

    def test_package_version_lag(self):
        off = {"id": "pypi:council-signal-mcp", "kind": "pypi-package", "canonical_url": "x", "version": "0.1.4",
               "live_state": "LIVE", "mcp_server": True, "facts": {}}
        l = {"key": "io.github.CSOAI-ORG/council-signal-mcp", "maps_to": [off["id"]],
             "fields": {"version": "0.1.3", "packages": [{"registryType": "pypi", "identifier": "council-signal-mcp", "version": "0.1.3"}]}}
        self.assertEqual(sp.build_cells([off], [reg_index([l])])[0]["state"], "INCONSISTENT")

    def test_stale_version_pin_in_description(self):
        l = reg_listing(desc="Stdio package: csoai-gspc-mcp@0.2.2.")
        cells = sp.build_cells([mcp_off(), npm_off("0.3.0")], [reg_index([l])])
        mc = [c for c in cells if c["offering"] == "mcp:councilof.ai/mcp"][0]
        self.assertEqual(mc["state"], "INCONSISTENT")
        self.assertTrue(any(f["field"] == "description.version_pin" and f["verdict"] == "DIFFERS" for f in mc["listings"][0]["fields"]))

    def test_tool_count_claim(self):
        self.assertEqual(sp.tool_count_claims("13 tools (9 free, 4 x402-metered)"), [13])
        self.assertEqual(sp.tool_count_claims("nine free readers plus four x402-metered evidence tools"), [])
        self.assertEqual(sp.tool_count_claims("Twelve tools: eight free"), [12])
        cells = sp.build_cells([mcp_off()], [reg_index([reg_listing(desc="13 tools")])])
        self.assertEqual(cells[0]["state"], "INCONSISTENT")

    def test_tool_set_order_free(self):
        cells = sp.build_cells([mcp_off(tools=("a", "b", "c"))], [reg_index([reg_listing(tools=("c", "a", "b"))])])
        self.assertEqual(cells[0]["state"], "CONSISTENT")

    def test_x402_price_and_payto(self):
        ix = sp.index("cdp-bazaar", "cdp", "OPEN_DIRECTORY", {}, read_state="COMPLETE", applies=("x402-door",))
        ix["listings"] = [{"key": "u", "maps_to": ["x402:door:https://councilof.ai/api/free-door"],
                           "fields": {"url": "https://councilof.ai/api/free-door", "amount_atomic": ["10000"], "payTo": ["0xabc"],
                                      "network": ["eip155:8453"], "x402Version": 2}}]
        c = sp.build_cells([door_off()], [ix])[0]
        self.assertEqual(c["state"], "INCONSISTENT")
        verdicts = {f["field"]: f["verdict"] for f in c["listings"][0]["fields"]}
        self.assertEqual(verdicts["price"], "DIFFERS")
        self.assertEqual(verdicts["payTo"], "AGREES")  # case-insensitive address

    def test_price_not_adjudicated_without_catalogue_amount(self):
        ix = sp.index("402index", "i", "OPEN_DIRECTORY", {}, read_state="COMPLETE", applies=("x402-door",))
        ix["listings"] = [{"key": "u", "maps_to": ["x402:door:https://councilof.ai/api/proof?bundle=1"],
                           "fields": {"url": "https://councilof.ai/api/proof?bundle=1", "amount_atomic": ["10000"]}}]
        c = sp.build_cells([door_off("https://councilof.ai/api/proof?bundle=1", None)], [ix])[0]
        self.assertEqual(c["state"], "CONSISTENT")
        self.assertEqual([f for f in c["listings"][0]["fields"] if f["field"] == "price"][0]["verdict"], "NOT_ADJUDICATED")


class MissingListing(unittest.TestCase):
    def test_absent_from_complete_read_is_not_listed(self):
        c = sp.build_cells([mcp_off()], [reg_index([])])[0]
        self.assertEqual(c["state"], "NOT_LISTED")

    def test_absent_from_partial_read_is_uncheckable_not_not_listed(self):
        c = sp.build_cells([mcp_off()], [reg_index([], read_state="PARTIAL")])[0]
        self.assertEqual(c["state"], "UNCHECKABLE")

    def test_auth_required_index_is_uncheckable(self):
        c = sp.build_cells([mcp_off()], [reg_index([], read_state="NOT_READ", openness="AUTH_REQUIRED")])[0]
        self.assertEqual(c["state"], "UNCHECKABLE")

    def test_offering_not_live_gets_no_cell(self):
        off = npm_off(); off["live_state"] = "NOT_FOUND"
        self.assertEqual(sp.build_cells([off], [reg_index([])]), [])

    def test_stale_door_listing_flags_manifest(self):
        man = {"id": "x402:manifest", "kind": "x402-manifest", "canonical_url": "m", "version": None, "live_state": "LIVE",
               "mcp_server": False, "facts": {}}
        ix = sp.index("payai-bazaar", "p", "OPEN_DIRECTORY", {}, read_state="COMPLETE", applies=("x402-door", "x402-manifest"))
        ix["orphan_listings"] = [{"key": "https://councilof.ai/api/old-door", "maps_to": [], "fields": {}}]
        c = sp.build_cells([man, door_off()], [ix])
        self.assertEqual({x["offering"]: x["state"] for x in c},
                         {"x402:manifest": "INCONSISTENT", "x402:door:https://councilof.ai/api/free-door": "NOT_LISTED"})

    def test_wording_is_not_a_verdict(self):
        ix = sp.index("402index", "i", "OPEN_DIRECTORY", {}, read_state="COMPLETE", applies=("x402-door",))
        ix["listings"] = [{"key": "u", "maps_to": ["x402:door:https://councilof.ai/api/free-door"],
                           "fields": {"url": "https://councilof.ai/api/free-door", "description": "a totally different blurb"}}]
        c = sp.build_cells([door_off()], [ix])[0]
        self.assertEqual(c["state"], "CONSISTENT")
        self.assertEqual(len(c["listings"][0]["text_diffs"]), 1)


class ReorderIsNotChange(unittest.TestCase):
    def rec(self, cells, ids, names):
        return {"as_of": "t", "cells": cells, "catalog_rows": [{"id": "a", "version": "1", "live_state": "LIVE"}],
                "hf_dataset_ids": ids, "registry_namespace_names": names, "indices": [{"id": "x", "openness": "OPEN_DIRECTORY"}]}

    def cells(self):
        return sp.build_cells([mcp_off("1.4.3"), door_off()],
                              [reg_index([reg_listing("1.4.2")]),
                               sp.index("cdp-bazaar", "c", "OPEN_DIRECTORY", {}, read_state="COMPLETE", applies=("x402-door",))])

    def test_reordered_lists_are_not_change(self):
        a = self.rec(self.cells(), ["d1", "d2", "d3"], ["n1", "n2"])
        b = self.rec(list(reversed(copy.deepcopy(self.cells()))), ["d3", "d1", "d2"], ["n2", "n1"])
        for c in b["cells"]:
            for l in c.get("listings") or []:
                l["fields"].reverse()
        ch = sp.changes(a, b)
        self.assertEqual(ch["cells"], {"changed": [], "appeared": [], "disappeared": []})
        self.assertEqual(ch["hf_datasets"], {"removed": [], "added": []})
        self.assertEqual(ch["registry_namespace"], {"removed": [], "added": []})
        self.assertEqual(ch["catalog"]["version_or_state_changed"], [])

    def test_real_change_is_reported_by_name(self):
        a = self.rec(self.cells(), ["d1", "d2"], ["n1"])
        cells_b = sp.build_cells([mcp_off("1.4.2"), door_off()],
                                 [reg_index([reg_listing("1.4.2")]),
                                  sp.index("cdp-bazaar", "c", "OPEN_DIRECTORY", {}, read_state="COMPLETE", applies=("x402-door",))])
        b = self.rec(cells_b, ["d2", "d3"], ["n1"])
        ch = sp.changes(a, b)
        self.assertEqual([(c["index"], c["state"]) for c in ch["cells"]["changed"]], [("mcp-registry", ["INCONSISTENT", "CONSISTENT"])])
        self.assertEqual(ch["hf_datasets"], {"removed": ["d1"], "added": ["d3"]})

    def test_first_record(self):
        self.assertTrue(sp.changes(None, self.rec([], [], []))["first_record"])


class Signing(unittest.TestCase):
    def test_three_tamper_controls_rejected(self):
        from cryptography.hazmat.primitives.asymmetric import ed25519
        sk = ed25519.Ed25519PrivateKey.generate(); pk = sk.public_key()
        payload = {"artifact": {"sha256": "ab" * 32}, "states": {"CONSISTENT": 3, "NOT_LISTED": 1}}
        canon = sp.canon_json(payload)
        sig = sk.sign(canon).hex()
        pk.verify(bytes.fromhex(sig), canon)
        ctl = sp.tamper_controls(pk, sig, payload, canon, "ab" * 32)
        self.assertEqual(len(ctl), 3)
        self.assertTrue(all(v == "rejected (control holds)" for v in ctl.values()), ctl)

    def test_sign_record_with_fake_signer(self):
        import tempfile
        from cryptography.hazmat.primitives.asymmetric import ed25519
        sk = ed25519.Ed25519PrivateKey.generate()
        with tempfile.TemporaryDirectory() as d:
            out = pathlib.Path(d)
            rec = {"date": "2026-09-26", "as_of": "t", "counts": {"by_state": {s: 1 for s in sp.STATES}, "n_cells": 4},
                   "own_surface_parity": {"counts": {}}, "files": {"catalog.json": {"sha256": "1"}, "CHANGES.json": {"sha256": "2"}},
                   "indices": [{"id": "x", "openness": "OPEN_DIRECTORY"}]}
            (out / "record.json").write_text(json.dumps(rec))

            def poster(payload):
                c = sp.canon_json(payload)
                return {"payload_sha256": sp.sha(c), "sig_ed25519": sk.sign(c).hex(), "did": "did:test"}
            r = sp.sign_record(out, rec, pk=sk.public_key(), poster=poster)
            self.assertEqual(len(r["controls"]), 3)
            self.assertTrue((out / "record.signed.json").exists())

            def bad(payload):
                c = sp.canon_json(payload)
                return {"payload_sha256": sp.sha(c), "sig_ed25519": ed25519.Ed25519PrivateKey.generate().sign(c).hex()}
            (out / "record.signed.json").unlink()
            with self.assertRaises(Exception):
                sp.sign_record(out, rec, pk=sk.public_key(), poster=bad)
            self.assertFalse((out / "record.signed.json").exists())


class Plumbing(unittest.TestCase):
    def test_rate_limit_waits_per_host(self):
        t = [100.0]; slept = []
        h = sp.Http(min_interval=1.0, sleep=lambda d: (slept.append(d), t.__setitem__(0, t[0] + d)), clock=lambda: t[0])
        h._wait("a.example"); h._wait("b.example"); h._wait("a.example")
        self.assertEqual(len(slept), 1)
        self.assertAlmostEqual(slept[0], 1.0)

    def test_norms(self):
        self.assertEqual(sp.norm_url("HTTPS://CouncilOf.ai/mcp/"), "https://councilof.ai/mcp")
        self.assertEqual(sp.norm_url("https://councilof.ai/api/x?b=1"), "https://councilof.ai/api/x?b=1")
        self.assertEqual(sp.norm_network("base"), "eip155:8453")
        self.assertEqual(sp.usd_to_atomic(0.01), "10000")
        self.assertEqual(sp.version_pins("npx -y csoai-gspc-mcp@0.2.2"), {"csoai-gspc-mcp": ["0.2.2"]})
        self.assertEqual(sp.version_pins("Stdio package: csoai-gspc-mcp@0.2.2. Docs"), {"csoai-gspc-mcp": ["0.2.2"]})
        self.assertEqual(sp.version_pins("csoai-gspc-mcp@1.0.0-rc.1 x"), {"csoai-gspc-mcp": ["1.0.0-rc.1"]})

    def test_absent_indexed_in_is_not_a_contradiction(self):
        d = door_off(); d["facts"]["indexed_in"] = None
        d2 = door_off("https://councilof.ai/api/proof?bundle=1"); d2["facts"]["indexed_in"] = "x402 Bazaar (PayAI)"
        ix = sp.index("payai-bazaar", "p", "OPEN_DIRECTORY", {}, read_state="COMPLETE", applies=("x402-door",))
        ix["listings"] = [{"key": "u", "maps_to": [d["id"]], "fields": {}}]
        own = sp.own_surface_cells([d, d2], [ix])
        states = sorted(o["state"] for o in own)
        self.assertEqual(states, ["INCONSISTENT", "NOT_DECLARED"])  # d2 claims PayAI but PayAI does not list it
        self.assertTrue(sp.is_own("https://api.councilof.ai/x")); self.assertFalse(sp.is_own("https://notcouncilof.ai"))


class ConditionalGet(unittest.TestCase):
    """A 304 must re-read the SAME bytes (same sha256) at the new check time, be logged as 304 with
    UNCHANGED_SINCE and the prior evidence, and never vouch for stored bytes that are gone or altered."""

    def _http(self, root, answers, seen):
        import email.message, io, tempfile, urllib.error

        class R(io.BytesIO):
            def __init__(self, st, body, hd):
                super().__init__(body); self.status = st; self.headers = email.message.Message()
                for k, v in hd.items():
                    self.headers[k] = v
            def geturl(self): return "https://x.example/list"
            def __enter__(self): return self
            def __exit__(self, *a): return False

        class Opener:
            def open(self, req, timeout=None):
                seen.append({k.lower(): v for k, v in req.header_items()})
                st, body, hd = answers.pop(0)
                if st == 304:
                    m = email.message.Message(); m["etag"] = hd.get("etag", "")
                    raise urllib.error.HTTPError(req.full_url, 304, "Not Modified", m, io.BytesIO(b""))
                return R(st, body, hd)
        return sp.Http(min_interval=0, sleep=lambda d: None, opener=Opener(), cache=sp.CondCache(root, "2026-09-26"))

    def test_304_replays_the_same_bytes_and_logs_unchanged_since(self):
        import tempfile
        with tempfile.TemporaryDirectory() as t:
            body = b'{"items":[1,2,3]}'
            seen = []
            h1 = self._http(t, [(200, body, {"ETag": '"v1"'})], seen)
            r1 = h1.get("https://x.example/list", note="n"); h1.cache.save()
            self.assertEqual(r1.json(), {"items": [1, 2, 3]})
            self.assertNotIn("if-none-match", seen[0])
            h2 = self._http(t, [(304, b"", {"etag": '"v1"'})], seen)
            r2 = h2.get("https://x.example/list", note="n"); h2.cache.save()
            self.assertEqual(seen[1].get("if-none-match"), '"v1"')
            self.assertTrue(r2.ok)
            self.assertEqual((r2["body"], r2["sha256"]), (body, r1["sha256"]))
            e = h2.log[-1]
            self.assertEqual((e["status"], e["n_bytes"], e["wire_status"], e["wire_bytes"]), (200, len(body), 304, 0))
            self.assertEqual(e["observation"], f"UNCHANGED_SINCE {r1['fetched_at']}")
            self.assertEqual(e["prior_evidence"]["sha256"], r1["sha256"])
            self.assertEqual(e["prior_evidence"]["record_date"], "2026-09-26")

    def test_altered_stored_bytes_force_a_full_fetch(self):
        import tempfile, gzip as gz
        with tempfile.TemporaryDirectory() as t:
            seen = []
            h1 = self._http(t, [(200, b"A", {"ETag": '"v1"'})], seen)
            r1 = h1.get("https://x.example/list"); h1.cache.save()
            p = pathlib.Path(t) / "bodies" / f"{r1['sha256']}.gz"
            p.write_bytes(gz.compress(b"B"))
            h2 = self._http(t, [(304, b"", {}), (200, b"A", {"ETag": '"v1"'})], seen)
            r2 = h2.get("https://x.example/list")
            self.assertEqual(r2["body"], b"A")
            self.assertEqual(h2.log[-1]["status"], 200)
            self.assertNotIn("observation", h2.log[-1]); self.assertNotIn("wire_status", h2.log[-1])
            self.assertNotIn("if-none-match", seen[-1])

    def test_no_validators_no_cache(self):
        import tempfile
        with tempfile.TemporaryDirectory() as t:
            seen = []
            h1 = self._http(t, [(200, b"A", {})], seen)
            h1.get("https://x.example/list"); h1.cache.save()
            h2 = self._http(t, [(200, b"A", {})], seen)
            h2.get("https://x.example/list")
            self.assertNotIn("if-none-match", seen[-1]); self.assertNotIn("if-modified-since", seen[-1])



class CoinbaseMerchantLookup(unittest.TestCase):
    class FakeHttp:
        def __init__(self, response):
            self.response = response
            self.urls = []

        def get(self, url, note=None):
            self.urls.append(url)
            body = json.dumps(self.response).encode()
            return sp.Resp(url=url, status=200, body=body, sha256=sp.sha(body),
                           n_bytes=len(body), error=None)

    def _door(self):
        return door_off("https://councilof.ai/api/free-door", "0")

    def test_empty_merchant_result_proves_current_payee_absence(self):
        http = self.FakeHttp({"payTo": "0xABC", "resources": [],
                              "pagination": {"limit": 100, "offset": 0, "total": 0}})
        ix = sp.read_cdp_merchant(http, [self._door()])
        self.assertEqual(ix["read_state"], "COMPLETE")
        self.assertEqual(ix["reported_total"], {"0xABC": 0})
        self.assertIn("/discovery/merchant?", http.urls[0])
        self.assertIn("payTo=0xABC", http.urls[0])
        self.assertEqual(sp.build_cells([self._door()], [ix])[0]["state"], "NOT_LISTED")

    def test_wrong_payee_cannot_prove_absence(self):
        http = self.FakeHttp({"payTo": "0xDEF", "resources": [],
                              "pagination": {"limit": 100, "offset": 0, "total": 0}})
        ix = sp.read_cdp_merchant(http, [self._door()])
        self.assertEqual(ix["read_state"], "PARTIAL")
        self.assertEqual(sp.build_cells([self._door()], [ix])[0]["state"], "UNCHECKABLE")

    def test_matching_resource_maps_to_current_door(self):
        resource = {"resource": "https://councilof.ai/api/free-door", "x402Version": 2,
                    "accepts": [{"payTo": "0xabc", "amount": "0", "network": "eip155:8453"}]}
        http = self.FakeHttp({"payTo": "0xABC", "resources": [resource],
                              "pagination": {"limit": 100, "offset": 0, "total": 1}})
        ix = sp.read_cdp_merchant(http, [self._door()])
        self.assertEqual(ix["read_state"], "COMPLETE")
        self.assertEqual(ix["listings"][0]["maps_to"], [self._door()["id"]])
        self.assertEqual(sp.build_cells([self._door()], [ix])[0]["state"], "CONSISTENT")

    def test_unmatched_resource_cannot_prove_complete_read(self):
        resource = {"resource": "https://councilof.ai/api/free-door", "x402Version": 2,
                    "accepts": [{"payTo": "0xDEF", "amount": "0", "network": "eip155:8453"}]}
        http = self.FakeHttp({"payTo": "0xABC", "resources": [resource],
                              "pagination": {"limit": 100, "offset": 0, "total": 1}})
        ix = sp.read_cdp_merchant(http, [self._door()])
        self.assertEqual(ix["read_state"], "PARTIAL")
        self.assertEqual(sp.build_cells([self._door()], [ix])[0]["state"], "UNCHECKABLE")

if __name__ == "__main__":
    unittest.main()
