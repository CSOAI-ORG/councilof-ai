#!/usr/bin/env python3
"""Read-only contract probe; never verifies signatures or executes paid tools.
Run --self-test for offline fixtures. No retries or redirect following.
"""
import argparse
import copy
import json
import sys
import unittest
import urllib.error
import urllib.request

BASE = "https://councilof.ai"
LIMIT = 5 * 1024 * 1024
REFERENCES = {
    "regulatory_crosswalk": BASE + "/crosswalk/east-west-v1.json",
    "cross_border_card": BASE + "/signals/cross-border-card.signed.json",
    "verifier": BASE + "/gspc-verify",
}


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request(path, payload=None):
    req = urllib.request.Request(
        BASE + path,
        data=None if payload is None else json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "A2A-Version": "1.0",
                 "User-Agent": "CSOAI-external-contract-readback/1.1"})
    opener = urllib.request.build_opener(NoRedirect)
    with opener.open(req, timeout=20) as response:
        data = response.read(LIMIT + 1)
        if len(data) > LIMIT:
            raise ValueError("response exceeds bounded read limit")
        return json.loads(data)


def call_crosswalk():
    return request("/api/a2a", {"jsonrpc": "2.0", "id": 1, "method": "SendMessage",
        "params": {"message": {"messageId": "external-contract-probe", "role": "ROLE_USER",
        "parts": [{"data": {"skill": "east-west-crosswalk", "input": {}},
                   "mediaType": "application/json"}]}}})


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def validate(direct, response):
    require(isinstance(direct, dict), "invalid direct object")
    require(isinstance(response, dict) and "error" not in response, "RPC response error")
    try:
        parts = response["result"]["message"]["parts"]
    except (KeyError, TypeError):
        raise ValueError("missing message parts") from None
    require(isinstance(parts, list), "invalid message parts")
    records = [p["data"] for p in parts if isinstance(p, dict)
               and isinstance(p.get("data"), dict)
               and p["data"].get("skill") == "east-west-crosswalk"]
    require(len(records) == 1, "expected one crosswalk source record")
    data = records[0]
    payload = data.get("payload")
    require(isinstance(payload, dict), "missing source payload")
    require(data.get("source") == BASE + "/api/cross", "unexpected source")
    require(data.get("state") == "DELIVERED_SOURCE", "source attribution lost")
    require(isinstance(data.get("source_attribution"), str)
            and "did not independently verify" in data["source_attribution"],
            "independent verification boundary missing")
    schema = direct.get("schema")
    require(isinstance(schema, str) and bool(schema.strip()), "missing direct schema")
    require(schema == payload.get("schema"), "schema mismatch between routes")
    require(isinstance(direct.get("rows"), list) and isinstance(payload.get("rows"), list),
            "missing structured rows")
    related = data.get("related_resources")
    require(isinstance(related, dict), "separate resource links missing")
    require(related.get("live_divergence") == {"url": BASE + "/api/cross", "schema": schema},
            "incorrect live divergence reference")
    for name, url in REFERENCES.items():
        require(related.get(name) == {"url": url, "state": "REFERENCE_ONLY"},
                "incorrect or promoted reference: " + name)
    require(isinstance(related.get("note"), str)
            and "not fetched or verified" in related["note"], "reference boundary missing")
    return {
        "state": "REFERENCE_CONTRACT_OBSERVED",
        "direct_schema": schema, "a2a_payload_schema": payload["schema"],
        "source_attribution_preserved": True, "row_count": len(payload["rows"]),
        "separate_reference_contract_established": True,
        "advertised_v1_contract_established": False,
        "reference_contents_fetched": False, "signature_verified": False,
        "independent_reassessment": False,
        "note": "Only source shape and reference metadata checked. Direct and A2A are separate reads; no equality of underlying snapshot, crosswalk v1 contents, signature or external grade is established.",
    }


class ContractFixtures(unittest.TestCase):
    def setUp(self):
        self.direct = {"schema": "csoai.cross/0.1", "rows": [{"fixture": True}]}
        self.data = {"skill": "east-west-crosswalk", "state": "DELIVERED_SOURCE",
                     "source": BASE + "/api/cross",
                     "source_attribution": "Direct same-origin source output. The A2A router did not independently verify or promote it.",
                     "payload": copy.deepcopy(self.direct), "related_resources": {
                         "live_divergence": {"url": BASE + "/api/cross", "schema": "csoai.cross/0.1"},
                         **{k: {"url": v, "state": "REFERENCE_ONLY"} for k, v in REFERENCES.items()},
                         "note": "Separate resources; linked artifacts were not fetched or verified by this call."}}
        self.response = {"result": {"message": {"parts": [{"data": self.data}]}}}

    def test_valid_only_reference_contract(self):
        result = validate(self.direct, self.response)
        self.assertTrue(result["separate_reference_contract_established"])
        for field in ("advertised_v1_contract_established", "signature_verified",
                      "reference_contents_fetched", "independent_reassessment"):
            self.assertFalse(result[field])

    def test_old_shape_refused(self):
        del self.data["related_resources"]
        with self.assertRaises(ValueError):
            validate(self.direct, self.response)

    def test_null_schema_refused(self):
        self.direct["schema"] = self.data["payload"]["schema"] = None
        with self.assertRaises(ValueError):
            validate(self.direct, self.response)

    def test_wrong_source_refused(self):
        self.data["source"] = "https://example.invalid/api/cross"
        with self.assertRaises(ValueError):
            validate(self.direct, self.response)

    def test_promoted_reference_refused(self):
        self.data["related_resources"]["cross_border_card"]["state"] = "VERIFIED"
        with self.assertRaises(ValueError):
            validate(self.direct, self.response)

    def test_wrong_reference_refused(self):
        self.data["related_resources"]["verifier"]["url"] = "https://example.invalid"
        with self.assertRaises(ValueError):
            validate(self.direct, self.response)

    def test_missing_attribution_refused(self):
        del self.data["source_attribution"]
        with self.assertRaises(ValueError):
            validate(self.direct, self.response)

    def test_duplicate_record_refused(self):
        self.response["result"]["message"]["parts"].append({"data": self.data})
        with self.assertRaises(ValueError):
            validate(self.direct, self.response)

    def test_missing_rows_refused(self):
        del self.data["payload"]["rows"]
        with self.assertRaises(ValueError):
            validate(self.direct, self.response)

    def test_redirect_not_followed(self):
        self.assertIsNone(NoRedirect().redirect_request(None, None, 302, "", {}, "https://example.invalid"))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        outcome = unittest.TextTestRunner(verbosity=2).run(
            unittest.defaultTestLoader.loadTestsFromTestCase(ContractFixtures))
        return 0 if outcome.wasSuccessful() else 1
    try:
        output = validate(request("/api/cross"), call_crosswalk())
    except (ValueError, urllib.error.URLError, TimeoutError) as error:
        # No retry or alternate route. In particular, 403 is not a measured outage.
        state = {"state": "UNCHECKABLE", "reason": type(error).__name__,
                 "http_status": getattr(error, "code", None),
                 "separate_reference_contract_established": False,
                 "signature_verified": False}
        print(json.dumps(state, indent=2))
        return 1
    print(json.dumps(output, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
