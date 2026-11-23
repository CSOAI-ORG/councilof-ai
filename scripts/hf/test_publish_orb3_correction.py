#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""ORB-III public correction source and remote-change refusal controls."""
import os
import tempfile
import unittest
from pathlib import Path
from publish_orb3_correction import (
    REPO,SOURCE,BASELINE_SHA256,MARKERS,source_bytes,classify_remote,publish,sha,
)


class CorrectionPublicationTests(unittest.TestCase):
    @staticmethod
    def fake_source(root):
        p=root/SOURCE
        p.parent.mkdir(parents=True,exist_ok=True)
        text="\n".join(MARKERS)+ "\n" + ("Source-preserving research limitation. "*50)
        p.write_text(text,encoding="utf-8")
        return p

    def test_approved_source_must_have_all_claim_qualifiers(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            p=self.fake_source(root)
            self.assertEqual(source_bytes(root),p.read_bytes())
            p.write_text(p.read_text().replace("answer-bearing metadata","a generic assurance"))
            with self.assertRaisesRegex(ValueError,"required source correction missing"):
                source_bytes(root)

    def test_obsolete_unqualified_queue_refused(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            p=self.fake_source(root)
            p.write_text(p.read_text()+"\nReal review queue: 676 artefacts, 664 PENDING")
            with self.assertRaisesRegex(ValueError,"unqualified old claim"):
                source_bytes(root)

    def test_changed_remote_cannot_be_overwritten(self):
        self.assertEqual(classify_remote(b"unseen update",b"new source"),"REFUSE_REMOTE_CHANGED")

    def test_already_correct_remote_idempotent(self):
        data=b"exact source-reviewed bytes"
        self.assertEqual(classify_remote(data,data),"ALREADY_CORRECTED")

    def test_pull_request_event_cannot_use_master_ref_to_publish(self):
        with tempfile.TemporaryDirectory() as tmp:
            prior_ref=os.environ.get("GITHUB_REF")
            prior_event=os.environ.get("GITHUB_EVENT_NAME")
            try:
                os.environ["GITHUB_REF"]="refs/heads/master"
                os.environ["GITHUB_EVENT_NAME"]="pull_request"
                with self.assertRaises(ValueError):
                    publish(Path(tmp),b"test")
            finally:
                if prior_ref is None:os.environ.pop("GITHUB_REF",None)
                else:os.environ["GITHUB_REF"]=prior_ref
                if prior_event is None:os.environ.pop("GITHUB_EVENT_NAME",None)
                else:os.environ["GITHUB_EVENT_NAME"]=prior_event

    def test_protected_master_required_before_token_or_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            prev=os.environ.get("GITHUB_REF")
            try:
                os.environ["GITHUB_REF"]="refs/pull/70/merge"
                with self.assertRaises(ValueError):
                    publish(Path(tmp),b"test")
            finally:
                if prev is None:os.environ.pop("GITHUB_REF",None)
                else:os.environ["GITHUB_REF"]=prev

    def test_no_stored_keys_or_human_authority_claim(self):
        self.assertEqual(REPO,"csoai/hitl-academy-orb3")
        self.assertEqual(len(BASELINE_SHA256),64)
        self.assertIn("execution authority false",MARKERS)
        self.assertEqual(len({x for x in MARKERS}),len(MARKERS))


if __name__=="__main__":
    unittest.main()
