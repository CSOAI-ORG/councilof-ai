#!/usr/bin/env python3
import base64
import copy
import hashlib
import importlib.util
import io
import json
import os
from pathlib import Path
import stat
import sys
import tempfile
import threading
import unittest
from contextlib import redirect_stdout, redirect_stderr

spec = importlib.util.spec_from_file_location("recover_paid_output", Path(__file__).with_name("recover_paid_output.py"))
recovery = importlib.util.module_from_spec(spec)
spec.loader.exec_module(recovery)
BODY = b' \n{"unicode":"caf\xc3\xa9 \xe9\x9b\xaa","signature":"original"}\n'
TX, RESOURCE = "retention-fixture", "https://example.test/paid?original=1"

def fixture():
    record = {"schema":"csoai.x402.delivery-record/0.1","transaction":TX,"resource":RESOURCE,
              "response_sha256":hashlib.sha256(BODY).hexdigest(),"response_bytes":len(BODY),
              "content_type":"application/json; charset=utf-8","delivered_at":"2026-11-06T00:00:00.000Z",
              "settled_tx_key":"settled:tx:"+TX,"receipt_tx_key":"receipt:tx:"+TX,
              "signed":False,"claim_boundary":"unsigned prepared output only"}
    saved = {**{k:record[k] for k in ("transaction","resource","response_sha256","response_bytes","content_type","delivered_at","signed","claim_boundary")},
             "schema":"csoai.x402.prepared-output/0.1","delivery_tx_key":"delivery:tx:"+TX,
             "status":201,"status_text":"Original prepared output",
             "headers":[["content-type",record["content_type"]]],"body_base64":base64.b64encode(BODY).decode()}
    return {"delivery_record":record,"retained_output":saved}

ACTUAL = None
if "--fixture-stdin" in sys.argv:
    sys.argv.remove("--fixture-stdin")
    ACTUAL = json.load(sys.stdin)

class RecoveryControls(unittest.TestCase):
    def refused(self, packet, tx=TX, resource=RESOURCE):
        with self.assertRaises(recovery.RecoveryRefused):
            recovery.recover_export(packet, tx, resource)

    def test_01_exact_original_unicode(self):
        body, receipt = recovery.recover_export(fixture(), TX, RESOURCE)
        self.assertEqual(body, BODY)
        self.assertEqual(receipt["response_sha256"], hashlib.sha256(BODY).hexdigest())
        self.assertEqual(receipt["status"], 201)
        self.assertIs(receipt["signed"], False)

    def test_02_actual_writer_envelope(self):
        self.assertIsNotNone(ACTUAL, "normal paid-delivery runner must supply actual writer output")
        body, receipt = recovery.recover_export(ACTUAL, ACTUAL["delivery_record"]["transaction"],
                                                ACTUAL["delivery_record"]["resource"])
        self.assertEqual(hashlib.sha256(body).hexdigest(), receipt["response_sha256"])

    def test_03_wrong_transaction(self):
        self.refused(fixture(), tx="other-transaction")

    def test_04_wrong_resource_including_query(self):
        self.refused(fixture(), resource=RESOURCE.replace("original=1", "original=2"))

    def test_05_tampered_body(self):
        value=fixture();value["retained_output"]["body_base64"]=base64.b64encode(BODY+b"x").decode()
        self.refused(value)

    def test_06_mismatched_digest_size_and_time(self):
        for field, value in (("response_sha256","b"*64),("response_bytes",True),
                             ("response_bytes",len(BODY)+1),("delivered_at","2020-01-01T00:00:00Z")):
            packet=fixture();packet["retained_output"][field]=value
            self.refused(packet)

    def test_07_missing_body_is_not_regenerated(self):
        for value in ({}, {"delivery_record":fixture()["delivery_record"]}):
            self.refused(value)

    def test_08_reference_and_schema_mismatches(self):
        for member, field, value in (("delivery_record","receipt_tx_key","receipt:tx:other"),
                                     ("retained_output","delivery_tx_key","delivery:tx:other"),
                                     ("delivery_record","schema","future"),
                                     ("retained_output","schema","future"),
                                     ("retained_output","signed",True)):
            packet=fixture();packet[member][field]=value
            self.refused(packet)

    def test_09_invalid_base64_and_oversize(self):
        for encoded in ("***", fixture()["retained_output"]["body_base64"]+"\n", "a"*(2*1024*1024)):
            packet=fixture();packet["retained_output"]["body_base64"]=encoded
            self.refused(packet)

    def test_10_unsafe_status_headers_and_content_type(self):
        for field, value in (("status",500),("status",True),("status_text","bad\nstatus"),
                             ("headers",[["authorization","private"]]),
                             ("headers",[["content-type","different"]]),
                             ("headers",[["etag","one"],["etag","two"]]),
                             ("headers",[["etag","bad\r\nheader"]])):
            packet=fixture();packet["retained_output"][field]=value
            self.refused(packet)

    def test_11_private_exclusive_body_and_receipt(self):
        body, receipt=recovery.recover_export(fixture(),TX,RESOURCE)
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/"original.bin"
            result=recovery.write_recovery(body,receipt,path)
            proof=Path(result["receipt_path"])
            self.assertEqual(path.read_bytes(),BODY)
            self.assertEqual(json.loads(proof.read_bytes())["response_sha256"],hashlib.sha256(BODY).hexdigest())
            self.assertEqual(stat.S_IMODE(path.stat().st_mode),0o600)
            self.assertEqual(stat.S_IMODE(proof.stat().st_mode),0o600)
            before=(path.read_bytes(),proof.read_bytes())
            with self.assertRaises(recovery.RecoveryRefused):
                recovery.write_recovery(b"different",receipt,path)
            self.assertEqual((path.read_bytes(),proof.read_bytes()),before)

    def test_12_existing_receipt_prevents_body_creation(self):
        body, receipt=recovery.recover_export(fixture(),TX,RESOURCE)
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/"original.bin";proof=path.with_name(path.name+".receipt.json")
            proof.write_bytes(b"unique original")
            with self.assertRaises(recovery.RecoveryRefused):
                recovery.write_recovery(body,receipt,path)
            self.assertFalse(path.exists());self.assertEqual(proof.read_bytes(),b"unique original")

    def test_13_symlink_destination_refused(self):
        body, receipt=recovery.recover_export(fixture(),TX,RESOURCE)
        with tempfile.TemporaryDirectory() as directory:
            target=Path(directory)/"unique";target.write_bytes(b"unique")
            alias=Path(directory)/"alias";alias.symlink_to(target)
            with self.assertRaises(recovery.RecoveryRefused):
                recovery.write_recovery(body,receipt,alias)
            self.assertEqual(target.read_bytes(),b"unique")

    def test_14_cli_success_and_refusal_exit(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/"private.json";path.write_text(json.dumps(fixture()))
            args=["--input",str(path),"--transaction",TX,"--resource",RESOURCE,"--output",str(Path(directory)/"original.bin")]
            with redirect_stdout(io.StringIO()),redirect_stderr(io.StringIO()):
                self.assertEqual(recovery.main(args),0)
                self.assertEqual(recovery.main(args),2)

    def test_15_refusal_creates_no_artifact(self):
        with tempfile.TemporaryDirectory() as directory:
            packet=fixture();packet["retained_output"]["resource"]="wrong"
            path=Path(directory)/"private.json";path.write_text(json.dumps(packet))
            output=Path(directory)/"original.bin"
            with redirect_stdout(io.StringIO()),redirect_stderr(io.StringIO()):
                self.assertEqual(recovery.main(["--input",str(path),"--transaction",TX,"--resource",RESOURCE,"--output",str(output)]),2)
            self.assertFalse(output.exists())
            self.assertFalse(output.with_name(output.name+".receipt.json").exists())


    def test_16_fifo_cli_refused_without_blocking_or_output(self):
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/"not-a-regular-export";os.mkfifo(path,0o600)
            output=Path(directory)/"original.bin";result={}
            def call():
                with redirect_stdout(io.StringIO()),redirect_stderr(io.StringIO()):
                    result["code"]=recovery.main(["--input",str(path),"--transaction",TX,
                                                  "--resource",RESOURCE,"--output",str(output)])
            worker=threading.Thread(target=call,daemon=True);worker.start();worker.join(.5)
            blocked=worker.is_alive()
            if blocked:
                # Release the old blocking implementation before reporting its regression.
                writer=os.open(path,os.O_WRONLY|os.O_NONBLOCK)
                os.close(writer);worker.join(1)
            self.assertFalse(worker.is_alive(),"FIFO reader cleanup must finish")
            self.assertFalse(blocked,"input open must refuse a FIFO without waiting for a writer")
            self.assertEqual(result.get("code"),2)
            self.assertFalse(output.exists())
            self.assertFalse(output.with_name(output.name+".receipt.json").exists())


def audit(event, args):
    if event.startswith(("socket.", "subprocess.")) or event in {"os.system", "os.fork", "os.exec", "os.posix_spawn"}:
        raise RuntimeError("offline recovery control refuses effect: "+event)
sys.addaudithook(audit)

if __name__ == "__main__":
    unittest.main(verbosity=2)
