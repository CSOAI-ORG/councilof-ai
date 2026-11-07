"""Regression tests for the existing read-only Layer 0 liveness reader. No network."""
import copy,hashlib,importlib.util,json,os,sys,unittest
from pathlib import Path
from unittest.mock import patch
SOURCE=Path(os.environ.get("LAYER0_TEST_SOURCE",str(Path(__file__).with_name("layer0_liveness_reader.py"))))
spec=importlib.util.spec_from_file_location("tested_liveness",SOURCE)
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
MERKLE="a"*16+"b"*48
DID={"verificationMethod":[{"id":"did:web:csoai.org#board-attestation-1","publicKeyJwk":{"kty":"OKP","crv":"Ed25519","x":"public-shape-only"}}]}
ROOT={"merkle_root":MERKLE,"card_count":305,"as_of":"2026-09-22T08:54:02Z"}
PTR={"live_root":{"merkle_root":MERKLE},"witnesses":{"rekor":"WITNESSED","ots":"CONFIRMED_BITCOIN"}}
WIT={"witnesses":{"rekor":{"status":"WITNESSED"},"ots":{"status":"STAMPED_PENDING_BITCOIN"}}}
def reading(changes=None):
    values=[(200,DID),(200,ROOT),(200,PTR),(200,WIT)]
    for key,value in (changes or {}).items():values[key]=value
    with patch.object(r,"get_json",side_effect=copy.deepcopy(values)) as get:
        result=r.read_floor();assert get.call_count==4;return result

def atom(value=None,gate="UNRUN"):
    return r.build_atom(reading() if value is None else value,gate,"2026-09-26T04:50:00Z")

class LivenessHardening(unittest.TestCase):
    def test_01_exact_full_merkle(self): self.assertIs(reading()["pointer_match"],True)
    def test_02_same_prefix_different_full_root(self):
        self.assertIs(reading({2:(200,{"live_root":{"merkle_root":"a"*16+"c"*48}})})["pointer_match"],False)
    def test_03_only_prefix_is_unknown(self):
        self.assertIsNone(reading({2:(200,{"live_root":{"merkle_root":MERKLE[:16]}})})["pointer_match"])
    def test_04_sha_domain_is_not_merkle(self):
        self.assertIsNone(reading({2:(200,{"live_root":{"sha256":MERKLE}})})["pointer_match"])
    def test_05_scalar_pointer_not_accepted(self):
        self.assertIsNone(reading({2:(200,{"live_root":MERKLE})})["pointer_match"])
    def test_06_wrong_root(self):
        self.assertIs(reading({2:(200,{"live_root":{"merkle_root":"f"*64}})})["pointer_match"],False)
    def test_07_malformed_root(self):
        self.assertIsNone(reading({1:(200,{"merkle_root":"z"*64})})["pointer_match"])
    def test_08_uppercase_digest_unknown(self):
        self.assertIsNone(reading({2:(200,{"live_root":{"merkle_root":MERKLE.upper()}})})["pointer_match"])
    def test_09_root_array(self): self.assertIsNone(reading({1:(200,[1])})["pointer_match"])
    def test_10_DID_array(self): self.assertIs(reading({0:(200,[1])})["did_key_present"],False)
    def test_11_pointer_array(self): self.assertIsNone(reading({2:(200,[1])})["pointer_match"])
    def test_12_witness_array(self):
        self.assertEqual(reading({2:(200,{}),3:(200,[1])})["ots_state"],"UNKNOWN")
    def test_13_witnesses_array(self):
        self.assertEqual(reading({2:(200,{"witnesses":[1]}),3:(200,{})})["rekor_state"],"UNKNOWN")
    def test_14_nested_status_array(self):
        self.assertEqual(reading({2:(200,{}),3:(200,{"witnesses":{"rekor":[1]}})})["rekor_state"],"UNKNOWN")
    def test_15_failed_root_http(self): self.assertIsNone(reading({1:(503,ROOT)})["pointer_match"])
    def test_16_failed_pointer_http(self): self.assertIsNone(reading({2:(404,PTR)})["pointer_match"])
    def test_17_failed_DID_http(self): self.assertIs(reading({0:(503,DID)})["did_key_present"],False)
    def test_18_failed_witness_http(self):
        self.assertEqual(reading({2:(200,{}),3:(503,WIT)})["ots_state"],"UNKNOWN")
    def test_19_count_boolean_not_number(self): self.assertIsNone(reading({1:(200,dict(ROOT,card_count=True))})["root_card_count"])
    def test_20_count_string_not_number(self): self.assertIsNone(reading({1:(200,dict(ROOT,card_count="305"))})["root_card_count"])
    def test_21_negative_count(self): self.assertIsNone(reading({1:(200,dict(ROOT,card_count=-1))})["root_card_count"])
    def test_22_zero_count(self): self.assertEqual(reading({1:(200,dict(ROOT,card_count=0))})["root_card_count"],0)
    def test_23_invalid_time_type(self): self.assertIsNone(reading({1:(200,dict(ROOT,as_of=[1]))})["root_as_of"])
    def test_24_original_source_time(self): self.assertEqual(reading()["root_as_of"],ROOT["as_of"])
    def test_25_empty_methods(self): self.assertIs(reading({0:(200,{"verificationMethod":[]})})["did_key_present"],False)
    def test_26_nonkeys_in_methods(self): self.assertIs(reading({0:(200,{"verificationMethod":[None,True,{}]})})["did_key_present"],False)
    def test_27_untyped_status_not_claim(self):
        self.assertEqual(reading({2:(200,{"witnesses":{"ots":True}}),3:(200,{})})["ots_state"],"UNKNOWN")
    def test_28_sidecar_fallback(self): self.assertEqual(reading({2:(200,{})})["ots_state"],"STAMPED_PENDING_BITCOIN")
    def test_29_reserved_state(self): self.assertEqual(atom({"state":"MEASURED"})["payload"]["state"],"PROBED")
    def test_30_reserved_kind(self): self.assertEqual(atom({"kind":"forged"})["payload"]["kind"],r.KIND)
    def test_31_reserved_grade(self): self.assertIs(atom({"not_a_grade":False})["payload"]["not_a_grade"],True)
    def test_32_reserved_gate(self): self.assertEqual(atom({"release_gate":"PASS"})["payload"]["release_gate"],"UNRUN")
    def test_33_unknown_authority_dropped(self): self.assertNotIn("execution_authority",atom({"execution_authority":True})["payload"])
    def test_34_explicit_scope(self): self.assertEqual(atom()["payload"]["pointer_match_scope"],"FULL_MERKLE_DIGEST_ONLY")
    def test_35_witness_not_verified(self): self.assertIs(atom({"witness_claims_verified":True})["payload"]["witness_claims_verified"],False)
    def test_36_invalid_gate(self):
        with self.assertRaises(ValueError): atom(gate="APPROVED")
    def test_37_invalid_reading(self):
        with self.assertRaises(TypeError): atom([1])
    def test_38_payload_digest(self):
        a=atom();self.assertEqual(a["sha256"],hashlib.sha256(r.canonical_bytes(a["payload"])).hexdigest())
    def test_39_size_limit(self): self.assertLessEqual(len(r.canonical_bytes(atom())),3072)
    def test_40_witness_source_included(self): self.assertIn(r.SITE+"/interop/root-witness-latest.json",atom()["source_urls"])
    def test_41_all_declared_gates(self):
        for gate in ["PASS","FAIL","UNRUN"]:self.assertEqual(atom(gate=gate)["payload"]["release_gate"],gate)
    def test_42_many_same_prefix_collisions(self):
        for i in range(128):
            other=MERKLE[:16]+format(i,"048x")
            self.assertIs(reading({2:(200,{"live_root":{"merkle_root":other}})})["pointer_match"],False)

if __name__=="__main__":unittest.main(verbosity=2)
