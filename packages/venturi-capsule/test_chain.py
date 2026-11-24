# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""The daily index chain (index 0.3): an intact chain verifies back to genesis; every must-fail control breaks it.

Signatures here are made with a throwaway Ed25519 key standing in for the board key (the verifier's key lookup is
pointed at it); the signing, sidecar format and verification code paths are the production ones."""
import argparse, datetime, json, pathlib, shutil, tempfile, unittest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

import venturi_capsule as v
import chain
from test_adapters import ALL_FIXTURES
from adapters import cross_ledger

PRIV = Ed25519PrivateKey.generate()
PUB = PRIV.public_key()
PUB_HEX = PUB.public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw).hex()
D1, D2, D3, D4, D5 = ("2026-09-26", "2026-09-27", "2026-09-28", "2026-09-29", "2026-09-30")


def fake_sign_payload(payload, pins, tok_path):
    """The board endpoint, locally: Ed25519 over the canonical payload, with the same altered-preimage controls."""
    c = v.canon(payload)
    r = {"did": chain.BOARD_DID, "sig_ed25519": PRIV.sign(c).hex(), "payload_sha256": v.sha(c), "signed_at": "2026-09-26T00:00:00.000Z"}
    controls = {}
    for name, alt in [("trailing byte", c + b" ")] + [(n, c.replace(x.encode(), b"0" * len(x))) for n, x in pins]:
        try:
            PUB.verify(bytes.fromhex(r["sig_ed25519"]), alt); controls[name] = "VERIFIED (CONTROL FAILED)"
        except Exception:
            controls[name] = "rejected (control holds)"
    return r, controls


def ns(**k):
    base = dict(file=None, out=None, token="unused", artifact_path=None, pending=None, date=None, prev="auto", index_dir=None,
                supersedes=None, supersedes_now_at=None)
    base.update(k)
    return argparse.Namespace(**base)


class ChainBase(unittest.TestCase):
    def setUp(self):
        self._saved = (v.sign_payload, list(v._DID_KEY), list(chain.PUB_HEX_FOR_ANCHORS), v.PUBLICATION_APPROVAL_FILE)
        v.PUBLICATION_APPROVAL_FILE = "/nonexistent/publication.APPROVED"  # the host's real approval must not leak into tests
        v.sign_payload = fake_sign_payload
        v._DID_KEY[:] = [PUB]
        chain.PUB_HEX_FOR_ANCHORS[:] = [PUB_HEX]
        self.t = tempfile.TemporaryDirectory(); self.d = pathlib.Path(self.t.name)
        self.batch = self.d / "measurement-capsules-v0.2-2026-09-26-cross_ledger"
        v.write_batch(self.batch, "cross_ledger", cross_ledger.KIND, ALL_FIXTURES["cross_ledger"](), {})
        v.sign(ns(out=str(self.batch)))
        self.n = 0

    def tearDown(self):
        v.sign_payload = self._saved[0]; v._DID_KEY[:] = self._saved[1]; chain.PUB_HEX_FOR_ANCHORS[:] = self._saved[2]
        v.PUBLICATION_APPROVAL_FILE = self._saved[3]
        self.t.cleanup()

    def f(self, date):
        return self.d / f"measurement-index-v0.2-{date}.json"

    def day(self, date, prev="auto"):
        """What capsule-daily does: index in staging -> sign -> (keep the previous version) -> move into place."""
        self.n += 1
        st = self.d / f"staging-{self.n}"; st.mkdir()
        sf = st / self.f(date).name
        final = self.f(date)
        sup_to = self.d / f"measurement-index-v0.2-{date}.superseded-{self.n:04d}.json"
        v.index(ns(file=str(sf), batches=[str(self.batch)], date=date, index_dir=str(self.d), prev=prev,
                   supersedes=str(final) if final.exists() else None, supersedes_now_at=str(sup_to) if final.exists() else None))
        v.sign(ns(file=str(sf)))
        if final.exists():
            o, nw = json.loads(final.read_bytes()), json.loads(sf.read_bytes())
            with open(self.d / f"measurement-index-v0.2-{date}.supersession.jsonl", "a") as fh:
                fh.write(json.dumps({"superseded": {"now_at": str(sup_to), "sha256": v.file_sha(final), "index_root": o["index_root"]},
                                     "by": {"path": str(final), "sha256": v.file_sha(sf), "index_root": nw["index_root"]}}) + "\n")
            final.rename(sup_to)
            final.with_name(final.stem + ".signed.json").rename(sup_to.with_name(sup_to.stem + ".signed.json"))
        sf.rename(final); (st / (final.stem + ".signed.json")).rename(final.with_name(final.stem + ".signed.json"))
        shutil.rmtree(st)
        return final

    def genesis_v02(self, date=D1):
        """The real genesis: a pre-chain 0.2 index (bytes never changed), pinned by a signed genesis record."""
        p = self.day(date, prev="none")
        d = json.loads(p.read_bytes())
        for k in ("date", "chain_seq", "prev_date", "prev_index_sha256", "prev_index_root", "gap_days", "missing_dates",
                  "genesis", "supersedes", "chain_rule"):
            d.pop(k, None)
        d["schema"] = v.INDEX_SCHEMA_V02
        p.write_bytes(json.dumps(d, indent=1).encode() + b"\n")
        v.sign(ns(file=str(p)))
        g = chain.make_genesis(p)
        v.sign(ns(file=str(g)))
        return p

    def resign_edited(self, p, edit):
        d = json.loads(p.read_bytes()); edit(d)
        p.write_bytes(json.dumps(d, indent=1).encode() + b"\n")
        v.sign(ns(file=str(p)))

    def verify(self, **k):
        return chain.verify_chain(self.d, today=D5, **k)

    def four_days(self):
        self.genesis_v02(); self.day(D2); self.day(D3); self.day(D4)


class Intact(ChainBase):
    def test_four_days_back_to_the_v02_genesis(self):
        self.four_days()
        r = self.verify(deep=True)
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        self.assertEqual(r["chain_length"], 4)
        self.assertEqual(r["head"]["date"], D4); self.assertEqual(r["head"]["chain_seq"], 3)
        self.assertEqual(r["genesis"]["date"], D1)
        self.assertEqual([x["link"].split(" ")[0] for x in r["days"]], ["OK", "OK", "OK", "GENESIS"])
        self.assertEqual(r["gaps"], [])
        self.assertTrue(all(x["deep"].startswith("recomputes") for x in r["days"]))
        d2 = json.loads(self.f(D2).read_bytes())
        self.assertEqual(d2["schema"], "csoai.measurement-capsule-index/0.3")
        self.assertEqual((d2["prev_date"], d2["prev_index_sha256"], d2["gap_days"]), (D1, v.file_sha(self.f(D1)), 0))
        self.assertEqual(d2["prev_index_root"], json.loads(self.f(D1).read_bytes())["index_root"])

    def test_a_03_index_can_be_its_own_genesis(self):
        self.day(D1, prev="none"); self.day(D2)
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        g = json.loads(self.f(D1).read_bytes())
        self.assertIsNone(g["prev_date"]); self.assertTrue(g["genesis"].startswith("GENESIS"))

    def test_the_chain_fields_are_in_the_signed_payload(self):
        self.four_days()
        s = json.loads(self.f(D3).with_name(self.f(D3).stem + ".signed.json").read_text())
        self.assertEqual(s["payload"]["chain"]["prev_index_sha256"], v.file_sha(self.f(D2)))
        self.assertEqual(s["payload"]["artifact"]["path"], f"measurement-capsules/v0.2/index/{D3}.json")
        self.assertEqual(s["local_verification"]["altered_preimage_controls"]["prev index sha altered"], "rejected (control holds)")


class MustFail(ChainBase):
    def test_edited_middle_day_breaks_the_chain(self):
        self.four_days()
        p = self.f(D3); d = json.loads(p.read_bytes()); d["n_capsules_total"] += 1
        p.write_bytes(json.dumps(d, indent=1).encode() + b"\n")
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_BROKEN")
        self.assertTrue(any(e.startswith(f"{D3}: SIGNATURE FAILS") for e in r["errors"]), r["errors"])
        self.assertTrue(any(e.startswith(f"{D4}: PREV_SHA_MISMATCH") for e in r["errors"]), r["errors"])

    def test_edited_and_resigned_middle_day_still_breaks_the_next_link(self):
        # an insider with the key can re-sign a day, but not the day after it without re-signing all later days
        self.four_days()
        self.resign_edited(self.f(D3), lambda d: d.update(n_capsules_total=d["n_capsules_total"] + 1))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_BROKEN")
        self.assertEqual([x["signature"] for x in r["days"]], ["VERIFIES"] * 4)
        self.assertTrue(any(e.startswith(f"{D4}: PREV_SHA_MISMATCH") for e in r["errors"]), r["errors"])

    def test_removed_day_shows_as_an_undeclared_gap(self):
        self.four_days()
        for q in self.d.glob(f"measurement-index-v0.2-{D3}*"):
            q.unlink()
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_BROKEN")
        self.assertIn({"dates": [D3], "declared": False}, [{k: g[k] for k in ("dates", "declared")} for g in r["gaps"]])
        self.assertEqual(r["gap_days_undeclared"], 1)
        self.assertTrue(any(e.startswith(f"{D4}: REMOVED_DAY") for e in r["errors"]), r["errors"])
        self.assertEqual(r["genesis"]["date"], D1)  # the walk resumes below the hole and still reaches genesis

    def test_swapped_prev_link_fails(self):
        self.four_days()
        s2 = v.file_sha(self.f(D2)); r2 = json.loads(self.f(D2).read_bytes())["index_root"]
        # (a) the link now names day 2's bytes but still says prev_date = day 3
        self.resign_edited(self.f(D4), lambda d: d.update(prev_index_sha256=s2, prev_index_root=r2))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_BROKEN")
        self.assertTrue(any(e.startswith(f"{D4}: PREV_SHA_MISMATCH") for e in r["errors"]), r["errors"])

    def test_swapped_prev_link_with_consistent_gap_fields_is_a_fork(self):
        self.four_days()
        s2 = v.file_sha(self.f(D2)); r2 = json.loads(self.f(D2).read_bytes())["index_root"]
        # (b) a consistent-looking swap that skips day 3 (declared as a gap, chain_seq adjusted): day 3 is on disk
        self.resign_edited(self.f(D4), lambda d: d.update(prev_date=D2, prev_index_sha256=s2, prev_index_root=r2, gap_days=1,
                                                         missing_dates=[D3], chain_seq=2))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_BROKEN")
        self.assertTrue(any("FORK" in e for e in r["errors"]), r["errors"])
        self.assertTrue(any(e.startswith(f"{D3}: ORPHAN") for e in r["errors"]), r["errors"])

    def test_signed_payload_must_carry_the_chain_fields(self):
        # control: an index whose file fields changed but whose signature still pins the bytes cannot exist, so this
        # checks the other direction: a payload built for another link does not pass as this one's
        self.four_days()
        sp = self.f(D4).with_name(self.f(D4).stem + ".signed.json"); s = json.loads(sp.read_text())
        s["payload"]["chain"]["gap_days"] = 5
        c = v.canon(s["payload"]); s["signature"].update(sig_ed25519=PRIV.sign(c).hex(), payload_sha256=v.sha(c))
        sp.write_text(json.dumps(s))
        r = self.verify()
        self.assertTrue(any(e.startswith(f"{D4}: SIGNED_CHAIN_FIELDS") for e in r["errors"]), r["errors"])

    def test_tampered_genesis_record_fails(self):
        self.four_days()
        g = self.d / chain.GENESIS_NAME; d = json.loads(g.read_bytes()); d["prev_date"] = "2026-09-25"
        g.write_bytes(json.dumps(d, indent=1).encode())
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_BROKEN")
        self.assertTrue(any(e.startswith("GENESIS_RECORD") for e in r["errors"]), r["errors"])

    def test_pre_chain_index_without_genesis_record_is_unanchored(self):
        self.four_days()
        (self.d / chain.GENESIS_NAME).unlink()
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_BROKEN")
        self.assertTrue(any("PRE_CHAIN_INDEX" in e for e in r["errors"]), r["errors"])

    def test_unrecorded_replacement_of_a_final_index_fails(self):
        self.four_days(); self.day(D4)  # a recorded re-issue of the head is fine ...
        self.assertEqual(self.verify()["result"], "CHAIN_INTACT")
        p = self.f(D4)  # ... a silent replacement (new signed bytes, no supersession record) is not
        self.resign_edited(p, lambda d: d.update(as_of="2026-09-29T23:59:59Z"))
        r = self.verify()
        self.assertTrue(any("SUPERSESSION" in e and "final version" in e for e in r["errors"]), r["errors"])


class Gaps(ChainBase):
    def test_missed_day_is_a_declared_gap_and_the_chain_holds(self):
        self.genesis_v02(); self.day(D2); self.day(D4)
        d4 = json.loads(self.f(D4).read_bytes())
        self.assertEqual((d4["prev_date"], d4["gap_days"], d4["missing_dates"]), (D2, 1, [D3]))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        self.assertEqual(r["gap_days_declared"], 1); self.assertEqual(r["gaps"][0]["dates"], [D3])

    def test_control_a_gap_hidden_by_editing_gap_days_fails(self):
        self.genesis_v02(); self.day(D2); self.day(D4)
        self.resign_edited(self.f(D4), lambda d: d.update(gap_days=0, missing_dates=[]))
        r = self.verify()
        self.assertTrue(any(e.startswith(f"{D4}: GAP_FIELDS") for e in r["errors"]), r["errors"])

    def test_backfilling_a_missed_day_under_a_chained_day_is_refused(self):
        self.genesis_v02(); self.day(D2); self.day(D4)
        with self.assertRaises(SystemExit):
            self.day(D3)

    def test_open_days_since_head(self):
        self.genesis_v02(); self.day(D2)
        self.assertEqual(self.verify()["open_days_since_head"], [D3, D4])


class Supersession(ChainBase):
    def test_reissued_day_the_chain_follows_the_final_version(self):
        self.genesis_v02(); self.day(D2); self.day(D3); old = v.file_sha(self.f(D3)); self.day(D3); self.day(D4)
        d3 = json.loads(self.f(D3).read_bytes())
        self.assertEqual(d3["supersedes"]["sha256"], old)
        self.assertEqual(json.loads(self.f(D4).read_bytes())["prev_index_sha256"], v.file_sha(self.f(D3)))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        self.assertTrue(r["days"][1]["supersession"]["supersedes"].startswith("OK"))

    def test_control_reissue_after_the_next_day_chained_is_refused(self):
        self.four_days()
        with self.assertRaises(SystemExit):
            self.day(D3)

    def test_control_forced_reissue_after_the_next_day_chained_is_detected(self):
        self.four_days()
        d4 = self.f(D4); keep = self.d / "d4.keep"; keep_s = self.d / "d4s.keep"
        d4.rename(keep); d4.with_name(d4.stem + ".signed.json").rename(keep_s)   # hide day 4 to get past the refusal
        self.day(D3)
        keep.rename(d4); keep_s.rename(d4.with_name(d4.stem + ".signed.json"))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_BROKEN")
        self.assertTrue(any(e.startswith(f"{D4}: PREV_LINK_TO_SUPERSEDED") for e in r["errors"]), r["errors"])

    def test_control_deleted_superseded_version_is_detected(self):
        self.genesis_v02(); self.day(D2); self.day(D2)
        for q in self.d.glob(f"measurement-index-v0.2-{D2}.superseded-*.json"):
            q.unlink()
        r = self.verify()
        self.assertTrue(any("SUPERSEDED_VERSION_MISSING" in e for e in r["errors"]), r["errors"])


class OTS(ChainBase):
    def stamp(self, target, height=None, digest=None):
        from opentimestamps.core.timestamp import Timestamp, DetachedTimestampFile
        from opentimestamps.core.op import OpSHA256, OpAppend
        from opentimestamps.core.notary import BitcoinBlockHeaderAttestation, PendingAttestation
        from opentimestamps.core.serialize import BytesSerializationContext
        ts = Timestamp(digest or v.hashlib.sha256(target.read_bytes()).digest())
        t = ts.ops.add(OpAppend(b"\x01" * 32)).ops.add(OpSHA256())
        t.attestations.add(BitcoinBlockHeaderAttestation(height) if height else PendingAttestation("https://example.invalid"))
        ctx = BytesSerializationContext(); DetachedTimestampFile(OpSHA256(), ts).serialize(ctx)
        target.with_name(target.name + ".ots").write_bytes(ctx.getbytes())

    def test_reports_bitcoin_block_height_and_pending(self):
        self.four_days(); self.stamp(self.f(D4), height=915000); self.stamp(self.f(D3))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        self.assertEqual(r["days"][0]["ots"]["state"], "BITCOIN_ATTESTED")
        self.assertEqual(r["days"][0]["ots"]["bitcoin_block_heights"], [915000])
        self.assertEqual(r["days"][1]["ots"]["state"], "PENDING_CALENDAR_COMMITMENT")
        self.assertEqual(r["ots_summary"]["NOT_STAMPED"], 2)

    def test_control_a_proof_for_other_bytes_fails(self):
        self.four_days(); self.stamp(self.f(D3), digest=b"\x00" * 32)
        r = self.verify()
        self.assertTrue(any(e.startswith(f"{D3}: OTS proof does not bind") for e in r["errors"]), r["errors"])


class Head(ChainBase):
    def test_weekly_head_signed_with_prepared_anchors(self):
        self.four_days()
        rep = self.verify()
        h = chain.make_head(self.d, "2026-10-04", rep)
        v.sign(ns(file=str(h)))
        self.assertEqual(chain.verify_chain_doc(h)["signature"], "VERIFIES")
        doc = json.loads(h.read_bytes())
        self.assertEqual((doc["head_date"], doc["chain_length"], doc["head_index_sha256"]), (D4, 4, v.file_sha(self.f(D4))))
        rk = json.loads(chain.prepare_rekor(h, self.d / "h.rekor-submission.PREPARED.json").read_text())
        self.assertEqual(rk["status"], "PREPARED_NOT_SUBMITTED"); self.assertEqual(rk["body"]["kind"], "rekord")
        pre = json.loads(v.base64.b64decode(rk["body"]["spec"]["data"]["content"]))
        self.assertEqual(pre["chain"]["chain_length"], 4); self.assertEqual(pre["artifact"]["sha256"], v.file_sha(h))
        PUB.verify(v.base64.b64decode(rk["body"]["spec"]["signature"]["content"]), v.base64.b64decode(rk["body"]["spec"]["data"]["content"]))
        self.assertTrue(all("control holds" in str(x) or x is True for x in rk["local_checks"].values()), rk["local_checks"])
        xr = json.loads(chain.prepare_xrpl(h, self.d / "h.xrpl-memo.unsigned.json").read_text())
        self.assertEqual(xr["_draft"]["status"], "UNSIGNED_DRAFT_NOT_BROADCAST"); self.assertEqual(xr["tx_json"]["Account"], "OWNER_ACCOUNT")
        self.assertEqual(xr["tx_json"]["Memos"][0]["Memo"]["MemoData"], v.file_sha(h).upper())
        # the next week's head chains to this one
        self.day(D5)
        h2 = chain.make_head(self.d, "2026-10-11", chain.verify_chain(self.d, today="2026-10-11"))
        self.assertEqual(json.loads(h2.read_bytes())["prev_head_sha256"], v.file_sha(h))

    def test_control_edited_head_refuses_anchor_preparation(self):
        self.four_days()
        h = chain.make_head(self.d, "2026-10-04", self.verify()); v.sign(ns(file=str(h)))
        d = json.loads(h.read_bytes()); d["chain_length"] = 40; h.write_bytes(json.dumps(d).encode())
        with self.assertRaises(SystemExit):
            chain.prepare_rekor(h, self.d / "x.json")
        with self.assertRaises(AssertionError):
            chain.verify_chain_doc(h)

    def test_control_no_head_over_a_broken_chain(self):
        self.four_days()
        for q in self.d.glob(f"measurement-index-v0.2-{D3}*"):
            q.unlink()
        with self.assertRaises(SystemExit):
            chain.cli_head(argparse.Namespace(dir=str(self.d), date="2026-10-04", deep=False, token="x", no_sign=True))
        self.assertFalse(list(self.d.glob("measurement-index-chain-head-*")))


class FakeHub:
    """get_paths_info / create_commit / dataset_info, in memory: what the publisher sends is what it would upload."""
    def __init__(self, files=None):
        self.files, self.commits, self.token = dict(files or {}), [], None

    def get_paths_info(self, repo, paths, repo_type=None):
        return [argparse.Namespace(path=p, blob_id=chain.git_blob_sha1(self.files[p]), lfs=None) for p in paths if p in self.files]

    def dataset_info(self, repo):
        return argparse.Namespace(sha="0" * 40)

    def create_commit(self, repo, ops, **k):
        for o in ops:
            self.files[o.path_in_repo] = o.path_or_fileobj if isinstance(o.path_or_fileobj, bytes) else pathlib.Path(o.path_or_fileobj).read_bytes()
        self.commits.append([o.path_in_repo for o in ops])
        return argparse.Namespace(oid="c" * 40, commit_url="https://example.invalid/c")


class PublishHF(ChainBase):
    def pub(self, hub, approved=True, date=D1):
        for f in list(self.d.glob("measurement-index-*.json")):   # the loop OTS-stamps everything it signs
            if not f.name.endswith(".signed.json") and not f.with_name(f.name + ".ots").exists():
                OTS.stamp(self, f)
        ap = self.d / "APPROVED"
        if approved:
            ap.write_text("owner: test")
        return chain.publish_hf(self.d, date, approval_file=str(ap), api=hub)

    def test_gated_without_owner_approval_uploads_nothing(self):
        self.four_days(); hub = FakeHub()
        r = self.pub(hub, approved=False)
        self.assertEqual(r["state"], "GATED"); self.assertEqual(hub.commits, [])
        self.assertIn("measurement-index/2026-09-26/measurement-index-chain-genesis.json", r["to_add"])

    def test_create_only_then_idempotent(self):
        self.four_days(); hub = FakeHub()
        r = self.pub(hub)
        self.assertEqual(r["state"], "PUBLISHED")
        self.assertIn("measurement-index/2026-09-26/measurement-index-v0.2-2026-09-26.json", hub.files)
        self.assertIn("measurement-index/README.md", hub.files)
        self.assertEqual(self.pub(hub)["state"], "ALREADY_PUBLISHED")
        self.assertEqual(len(hub.commits), 1)
        r = self.pub(hub, date=D2)
        self.assertEqual(r["state"], "PUBLISHED"); self.assertEqual(len(hub.commits), 2)
        self.assertTrue(all(p.startswith("measurement-index/2026-09-27/") for p in hub.commits[1]))

    def test_control_never_overwrites_different_bytes(self):
        self.four_days()
        hub = FakeHub({"measurement-index/2026-09-27/measurement-index-v0.2-2026-09-27.json": b"{}"})
        r = self.pub(hub, date=D2)
        self.assertEqual(r["state"], "REFUSED"); self.assertEqual(hub.commits, [])

    def test_control_refuses_a_broken_chain(self):
        self.four_days()
        for q in self.d.glob(f"measurement-index-v0.2-{D3}*"):
            q.unlink()
        hub = FakeHub()
        self.assertEqual(self.pub(hub, date=D4)["state"], "REFUSED"); self.assertEqual(hub.commits, [])

    def test_control_refuses_an_internal_name(self):
        self.four_days()
        h = chain.make_head(self.d, D2, self.verify())
        d = json.loads(h.read_bytes()); d["note"] = "Venturi"; h.write_bytes(json.dumps(d).encode()); v.sign(ns(file=str(h)))
        hub = FakeHub()
        r = self.pub(hub, date=D2)
        self.assertEqual(r["state"], "REFUSED"); self.assertIn("internal name", r["why"]); self.assertEqual(hub.commits, [])


class Freshness(ChainBase):
    def test_carried_daily_batch_is_not_updated_with_last_good_date(self):
        # the fixture batch is dated 2026-09-26 (cross_ledger, a daily adapter): fresh on the 26th, NOT_UPDATED after
        self.day(D1, prev="none"); self.day(D2)
        f1, f2 = (json.loads(self.f(x).read_bytes())["freshness"] for x in (D1, D2))
        self.assertEqual(f1["adapters"]["cross_ledger"], {"state": "FRESH", "last_good_date": D1}); self.assertEqual(f1["not_updated"], [])
        self.assertEqual(f2["adapters"]["cross_ledger"], {"state": "NOT_UPDATED", "last_good_date": D1})
        self.assertEqual(f2["not_updated"], [f"cross_ledger@{D1}"])
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        self.assertEqual(r["not_updated"], [{"date": D2, "adapters": [f"cross_ledger@{D1}"]}])
        self.assertEqual(r["days"][0]["freshness"]["states"], {"cross_ledger": "NOT_UPDATED"})

    def test_pending_adapter_without_batch_is_absent(self):
        f = v.freshness([], D2, [{"adapter": "tool_drift", "why": "x"}, {"adapter": "tool_drift_daily_source", "why": "y"}])
        self.assertEqual(f["adapters"], {"tool_drift": {"state": "ABSENT", "last_good_date": None}})

    def test_weekly_or_sibling_batches_are_carried_not_stale(self):
        P = "/evac-bulk/measurement-capsules-v0.2-2026-09-26-"
        f = v.freshness([{"dir": P + "contract_parity.r2", "adapter": "contract_parity"},
                         {"dir": P + "mill_cross_runtime-batch2", "adapter": "mill_cross_runtime"},
                         {"dir": P + "self_parity", "adapter": "self_parity"}], D2, [])
        self.assertEqual({k: x["state"] for k, x in f["adapters"].items()},
                         {"contract_parity": "CARRIED", "mill_cross_runtime-batch2": "CARRIED", "self_parity": "NOT_UPDATED"})

    def test_control_a_false_fresh_claim_breaks_verification(self):
        self.day(D1, prev="none"); self.day(D2)
        self.resign_edited(self.f(D2), lambda d: d["freshness"]["adapters"]["cross_ledger"].update(state="FRESH"))
        r = self.verify()
        self.assertTrue(any("FRESHNESS" in e for e in r["errors"]), r["errors"])


class Publication(ChainBase):
    def test_private_until_without_approval_or_record(self):
        self.four_days()
        d4 = json.loads(self.f(D4).read_bytes())
        self.assertEqual(d4["private_until"], "owner approves publication"); self.assertNotIn("publication", d4)
        self.assertEqual(self.verify()["days"][0]["publication"]["state"], "PRIVATE_UNTIL_OWNER_APPROVES")

    def test_index_says_public_once_approval_is_recorded(self):
        ap = self.d / "pub.APPROVED"; ap.write_text("approved_by: owner\nrecorded_at: 2026-09-26T13:38:15Z\n")
        v.PUBLICATION_APPROVAL_FILE = str(ap)
        self.four_days()
        d4 = json.loads(self.f(D4).read_bytes())
        self.assertNotIn("private_until", d4)
        self.assertEqual((d4["publication"]["state"], d4["publication"]["approved"]), ("PUBLIC", "2026-09-26"))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        self.assertEqual(r["days"][0]["publication"], {"state": "PUBLIC", "approved": "2026-09-26", "by": "the index itself"})

    def record(self, date=D1):
        p = chain.make_publication(self.d, date, "2026-09-26", "owner approval recorded 2026-09-26",
                                   ["https://example.invalid/index.json"], check=False)
        v.sign(ns(file=str(p)))
        return p

    def test_signed_record_makes_an_old_index_public(self):
        self.four_days(); p = self.record()
        self.assertEqual(chain.verify_chain_doc(p)["signature"], "VERIFIES")
        s = json.loads(p.with_name(p.stem + ".signed.json").read_text())
        self.assertEqual(len(s["local_verification"]["altered_preimage_controls"]), 3)
        self.assertTrue(all("control holds" in x for x in s["local_verification"]["altered_preimage_controls"].values()))
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        g = r["days"][-1]["publication"]
        self.assertEqual((g["state"], g["approved"]), ("PUBLIC", "2026-09-26")); self.assertIn("signed publication record", g["by"])
        self.assertEqual(r["days"][0]["publication"]["state"], "PRIVATE_UNTIL_OWNER_APPROVES")

    def test_control_record_pinning_other_bytes_fails(self):
        self.four_days(); p = self.record()
        self.resign_edited(p, lambda d: d.update(index_sha256="ab" * 32))
        r = self.verify()
        self.assertTrue(any("PUBLICATION record pins another" in e for e in r["errors"]), r["errors"])

    def test_control_unsigned_edit_of_record_fails(self):
        self.four_days(); p = self.record()
        d = json.loads(p.read_bytes()); d["publication"]["approved"] = "2026-09-01"; p.write_bytes(json.dumps(d).encode())
        r = self.verify()
        self.assertTrue(any("PUBLICATION record signature FAILS" in e for e in r["errors"]), r["errors"])

    def test_record_refused_when_no_location_serves_the_bytes(self):
        self.four_days()
        with self.assertRaises(SystemExit):
            chain.make_publication(self.d, D1, "2026-09-26", "x", ["https://127.0.0.1:9/none"], check=True)

    def approve(self):
        ap = self.d / "pub.APPROVED"; ap.write_text("approved_by: owner\nrecorded_at: 2026-09-26T13:38:15Z\n")
        v.PUBLICATION_APPROVAL_FILE = str(ap)

    def test_batch_record_genesis_and_head_say_public_once_approved(self):
        self.approve()
        b = self.d / "measurement-capsules-v0.2-2026-09-27-cross_ledger"
        rec = v.write_batch(b, "cross_ledger", cross_ledger.KIND, ALL_FIXTURES["cross_ledger"](), {})
        self.assertNotIn("private_until", rec); self.assertEqual(rec["publication"]["state"], "PUBLIC")
        self.four_days()
        g = json.loads((self.d / chain.GENESIS_NAME).read_bytes())
        self.assertNotIn("private_until", g); self.assertEqual(g["publication"]["approved"], "2026-09-26")
        h = json.loads(chain.make_head(self.d, D4, self.verify()).read_bytes())
        self.assertNotIn("private_until", h); self.assertEqual(h["publication"]["state"], "PUBLIC")

    def erratum(self, date=D1):
        p = chain.make_publication_erratum(self.d, date, "2026-09-26", "owner approval recorded 2026-09-26", check=False)
        v.sign(ns(file=str(p)))
        return p

    def test_erratum_names_every_file_still_saying_private_until(self):
        self.four_days(); v.sign(ns(file=str(chain.make_head(self.d, D1, self.verify())))); self.record()
        for f in list(self.d.glob("measurement-index-*.json")):
            if not f.name.endswith(".signed.json") and not f.with_name(f.name + ".ots").exists():
                OTS.stamp(self, f)
        p = self.erratum(); OTS.stamp(self, p); e = json.loads(p.read_bytes())
        roles = sorted(f["role"] for f in e["files"])
        self.assertEqual(roles, ["batch record (cross_ledger)", "chain genesis", "daily index (final)", "weekly chain head"])
        self.assertTrue(all(f["private_until"] == "owner approves publication" for f in e["files"]))
        self.assertEqual(e["index_publication_record"]["file"], f"measurement-index-v0.2-{D1}.publication.json")
        self.assertEqual(chain.verify_chain_doc(p)["signature"], "VERIFIES")
        r = self.verify()
        self.assertEqual(r["result"], "CHAIN_INTACT", r["errors"])
        self.assertIn(p.name, [lp.name for _, lp in chain.publish_set(self.d, D1)])
        with self.assertRaises(SystemExit):   # never overwritten
            self.erratum()

    def test_control_erratum_file_list_swapped_after_signing_fails(self):
        self.four_days(); p = self.erratum()
        d = json.loads(p.read_bytes()); d["files"][0]["sha256"] = "ab" * 32; p.write_bytes(json.dumps(d).encode())
        self.assertTrue(any("erratum" in x for x in self.verify()["errors"]))

    def test_erratum_not_needed_when_everything_says_public(self):
        self.approve()
        shutil.rmtree(self.batch)
        self.batch = self.d / "measurement-capsules-v0.2-2026-09-26-cross_ledger"
        v.write_batch(self.batch, "cross_ledger", cross_ledger.KIND, ALL_FIXTURES["cross_ledger"](), {}); v.sign(ns(out=str(self.batch)))
        self.day(D1, prev="none")
        with self.assertRaises(SystemExit):
            chain.make_publication_erratum(self.d, D1, "2026-09-26", "x", check=False)


class Anchors(ChainBase):
    def test_anchors_read_from_the_files_nothing_inferred(self):
        self.four_days(); OTS.stamp(self, self.f(D4), height=968674)
        a = chain.make_anchors(self.d, D4)
        self.assertEqual(a["opentimestamps"]["bitcoin_block_heights"], [968674])
        self.assertEqual(a["rekor"], [])                       # no entry saved: none claimed
        self.assertEqual(a["xrpl"]["state"], "PREPARED_NOT_SUBMITTED")
        self.assertEqual(a["index"]["sha256"], v.file_sha(self.f(D4)))

    def test_anchors_carry_a_saved_rekor_entry(self):
        self.four_days()
        chain.rekor_anchor(self.f(D4), approval_file=Rekor.approve(self), http=FakeRekor())
        a = chain.make_anchors(self.d, D4)
        self.assertEqual(len(a["rekor"]), 1); self.assertIn("INCLUDED", a["rekor"][0]["state"])
        self.assertTrue(a["rekor"][0]["search_url"].endswith(str(a["rekor"][0]["logIndex"])))


# ----------------------------------------------------------------------------- Rekor
TD = pathlib.Path(__file__).resolve().parent / "testdata"


def _lh(b):
    return v.hashlib.sha256(b"\x00" + b).digest()


def _mth(D):
    if len(D) == 1:
        return D[0]
    k = 1 << ((len(D) - 1).bit_length() - 1)
    return v.hashlib.sha256(b"\x01" + _mth(D[:k]) + _mth(D[k:])).digest()


def _path(m, D):
    """RFC 6962 section 2.1.1 PATH(m, D), written independently of chain.verify_inclusion."""
    if len(D) == 1:
        return []
    k = 1 << ((len(D) - 1).bit_length() - 1)
    return _path(m, D[:k]) + [_mth(D[k:])] if m < k else _path(m - k, D[k:]) + [_mth(D[:k])]


class FakeRekor:
    """Rekor's four calls in memory: index/retrieve, log/entries (POST), entries/{uuid}, entries?logIndex=."""
    def __init__(self, known=None, mangle=False, fail=False, conflict=False):
        self.entries, self.calls, self.mangle, self.fail, self.conflict = {}, [], mangle, fail, conflict
        self.known = known or {}

    def entry_for(self, body):
        pre = v.base64.b64decode(body["spec"]["data"]["content"])
        h = "0" * 64 if self.mangle else v.sha(pre)
        stored = {"apiVersion": "0.0.1", "kind": "rekord", "spec": {"data": {"hash": {"algorithm": "sha256", "value": h}},
                                                                     "signature": body["spec"]["signature"]}}
        raw = json.dumps(stored, sort_keys=True).encode()
        leaves = [_lh(bytes([i])) for i in range(10)] + [_lh(raw)] + [_lh(b"x")]
        m = 10
        e = {"body": v.base64.b64encode(raw).decode(), "integratedTime": 1790430210, "logID": "c0" * 32, "logIndex": 4242,
             "verification": {"inclusionProof": {"logIndex": m, "treeSize": len(leaves), "rootHash": _mth(leaves).hex(),
                                                 "hashes": [x.hex() for x in _path(m, leaves)], "checkpoint": "x"}}}
        return "u" * 80, e, h

    def __call__(self, method, url, body=None):
        self.calls.append((method, url.split("/api/v1/")[1]))
        if self.fail:
            raise OSError("network down")
        if url.endswith("/index/retrieve"):
            u = self.known.get(body["hash"].split(":")[1])
            return 200, {}, [u] if u else []
        if method == "POST":
            uuid, e, h = self.entry_for(body)
            self.entries[uuid] = e
            if self.conflict:
                return 409, {"Location": "/api/v1/log/entries/" + uuid}, {"message": "exists"}
            return 201, {}, {uuid: e}
        uuid = url.rsplit("/", 1)[1] if "logIndex=" not in url else next(iter(self.entries))
        return 200, {}, {uuid: self.entries[uuid]}


class Rekor(ChainBase):
    def test_real_entry_known_answer(self):
        # the 26 Sep 2026 index entry, logIndex 2968539665, as Rekor served it; preimage sha from the signed sidecar
        real = json.loads((TD / "rekor-entry-measurement-index-2026-09-26.json").read_text())
        s = json.loads((TD / "measurement-index-v0.2-2026-09-26.signed.json").read_text())
        pre = v.sha(v.canon(s["payload"]))
        ok, det = chain.check_rekor_entry(real, pre, s["signature"]["sig_ed25519"])
        self.assertTrue(ok, det); self.assertEqual(det["logIndex"], 2968539665); self.assertEqual(det["inclusion_proof"], "VERIFIES")
        self.assertFalse(chain.check_rekor_entry(real, "0" * 64)[0])                       # control: another preimage
        bad = json.loads(json.dumps(real)); e = next(iter(bad.values()))
        e["verification"]["inclusionProof"]["hashes"][0] = "00" * 32                        # control: a forged audit path
        self.assertFalse(chain.check_rekor_entry(bad, pre)[0])

    def test_inclusion_proof_every_size_and_index(self):
        for n in range(1, 18):
            D = [_lh(bytes([i])) for i in range(n)]
            for m in range(n):
                self.assertTrue(chain.verify_inclusion(D[m], m, n, _path(m, D), _mth(D)), (n, m))
                if n > 1:
                    self.assertFalse(chain.verify_inclusion(D[m], (m + 1) % n, n, _path(m, D), _mth(D)), (n, m))

    def approve(self):
        ap = self.d / "REKOR.APPROVED"; ap.write_text("owner: test"); return str(ap)

    def test_gated_without_approval(self):
        self.four_days(); hub = FakeRekor()
        r = chain.rekor_anchor(self.f(D4), approval_file=str(self.d / "absent"), http=hub)
        self.assertEqual(r["state"], "GATED"); self.assertEqual(hub.calls, [])

    def test_submitted_once_verified_and_reported(self):
        self.four_days(); hub = FakeRekor(); ap = self.approve()
        r = chain.rekor_anchor(self.f(D4), approval_file=ap, http=hub)
        self.assertEqual(r["state"], "ANCHORED", r); self.assertEqual(r["logIndex"], 4242)
        self.assertEqual(sum(1 for m, u in hub.calls if m == "POST" and u == "log/entries"), 1)
        self.assertIn(("GET", "log/entries?logIndex=4242"), hub.calls)                    # read back by logIndex
        rc = json.loads(self.f(D4).with_name(f"measurement-index-v0.2-{D4}.rekor-receipt.json").read_text())
        self.assertEqual((rc["logIndex"], rc["inclusion_proof"]), (4242, "VERIFIES"))
        n = len(hub.calls)
        self.assertEqual(chain.rekor_anchor(self.f(D4), approval_file=ap, http=hub)["state"], "ALREADY_ANCHORED")
        self.assertEqual(len(hub.calls), n)                                                  # idempotent: no network at all
        rep = self.verify()
        self.assertEqual(rep["result"], "CHAIN_INTACT", rep["errors"])
        self.assertTrue(rep["days"][0]["rekor"]["state"].startswith("INCLUDED")); self.assertEqual(rep["days"][1]["rekor"]["state"], "NOT_ANCHORED")
        self.assertEqual(rep["rekor_summary"]["days_included"], 1)

    def test_already_in_rekor_is_not_resubmitted(self):
        self.four_days(); ap = self.approve()
        pre = v.sha(v.canon(json.loads(self.f(D4).with_name(f"measurement-index-v0.2-{D4}.signed.json").read_text())["payload"]))
        hub = FakeRekor(known={pre: "u" * 80})
        hub.entries["u" * 80] = hub.entry_for(json.loads(chain.prepare_rekor_any(self.f(D4), self.d / "p.json").read_text())["body"])[1]
        r = chain.rekor_anchor(self.f(D4), approval_file=ap, http=hub)
        self.assertEqual(r["state"], "ANCHORED"); self.assertIn("not resubmitted", r["how"])
        self.assertFalse(any(m == "POST" and u == "log/entries" for m, u in hub.calls))

    def test_conflict_409_is_read_back(self):
        self.four_days()
        r = chain.rekor_anchor(self.f(D4), approval_file=self.approve(), http=FakeRekor(conflict=True))
        self.assertEqual(r["state"], "ANCHORED"); self.assertIn("409", r["how"])

    def test_control_readback_with_another_hash_fails_and_saves_nothing(self):
        self.four_days()
        r = chain.rekor_anchor(self.f(D4), approval_file=self.approve(), http=FakeRekor(mangle=True))
        self.assertEqual(r["state"], "REKOR_FAILED")
        self.assertFalse(self.f(D4).with_name(f"measurement-index-v0.2-{D4}.rekor-entry.json").exists())

    def test_control_network_failure_is_rekor_failed(self):
        self.four_days()
        self.assertEqual(chain.rekor_anchor(self.f(D4), approval_file=self.approve(), http=FakeRekor(fail=True))["state"], "REKOR_FAILED")

    def test_control_tampered_saved_entry_breaks_verification(self):
        self.four_days(); chain.rekor_anchor(self.f(D4), approval_file=self.approve(), http=FakeRekor())
        ep = self.f(D4).with_name(f"measurement-index-v0.2-{D4}.rekor-entry.json"); d = json.loads(ep.read_text())
        next(iter(d.values()))["verification"]["inclusionProof"]["rootHash"] = "11" * 32; ep.write_text(json.dumps(d))
        rep = self.verify()
        self.assertEqual(rep["result"], "CHAIN_BROKEN"); self.assertTrue(any("REKOR" in e for e in rep["errors"]), rep["errors"])

    def test_receipt_and_entry_are_published(self):
        self.four_days(); chain.rekor_anchor(self.f(D4), approval_file=self.approve(), http=FakeRekor())
        for f in list(self.d.glob("measurement-index-*.json")):
            if not f.name.endswith(".signed.json") and ".rekor-" not in f.name and not f.with_name(f.name + ".ots").exists():
                OTS.stamp(self, f)
        names = [lp.name for _, lp in chain.publish_set(self.d, D4)]
        self.assertIn(f"measurement-index-v0.2-{D4}.rekor-entry.json", names)
        self.assertIn(f"measurement-index-v0.2-{D4}.rekor-receipt.json", names)


if __name__ == "__main__":
    unittest.main()
