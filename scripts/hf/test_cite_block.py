#!/usr/bin/env python3
"""test_cite_block.py - the How-to-cite / corrections / verification block has ONE producer
(cite_block.py), and every generator that rewrites a public csoai/* dataset card keeps it.

On 28 Sep 2026 lane L5 wrote the block onto every public csoai/* card, to the ARTIFACT only. A generator
that rewrites a card from its own template would strip it on its next run (fix-producer-not-artifact).
These tests hold the producer side:

  * the block opens with the objections, contact and corrections section (29 Sep 2026), and the outward
    gate's accountability checks pass on a produced card;

  * apply() reproduces live cards byte for byte (fixtures are anonymous reads of the live cards,
    28 Sep 2026 13:50Z), is idempotent, and keeps exactly one block, at the end;
  * the year and DOI come from cite-block-registry.json, the licence only from L5's recorded decisions;
  * every script in the repository that uploads a README.md to a Hugging Face dataset is classified BY
    NAME below, and every one that writes a card from its own template passes it through the producer.
    A new uploader fails the classification test until someone decides which kind it is;
  * two producers are run end to end offline and reproduce their live card exactly: the fleet-status
    publisher and census-capture's README through the pod-loop uploader (hf_upload.carded).

Run: python3 -m pytest scripts/hf/test_cite_block.py   (or python3 scripts/hf/test_cite_block.py)
No network, no token.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import importlib.util
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
FIX = HERE / "fixtures" / "cite-block"
sys.path.insert(0, str(HERE))
import cite_block as cb  # noqa: E402


def load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


CARD = "---\nlicense: cc-by-4.0\npretty_name: Example census\n---\n# Example census\n\nBody text.\n"

# Every script in the repository that uploads a README.md to a Hugging Face dataset, by name.
#   wired        writes the card from its own template; the card passes through cite_block.apply()
#   via-uploader reaches the Hub only through scripts/pod-loops/hf_upload.py, which is wired
#   edits-live   downloads the LIVE card and edits it in place, so the block already in it is kept
#   private      writes only to a private dataset (no public card, no block expected)
#   not-a-card   uploads a README that is not one of the public csoai/* dataset cards (a Space, a
#                package, or a dataset that is not public)
PRODUCERS = {
    "fleet/publish_fleet_status.py": "wired",
    "scripts/pubbus/publish-fleet-status.py": "wired",
    "scripts/hf/hf-org-card.py": "wired",
    "scripts/pod-loops/hf_upload.py": "wired",
    "scripts/pod-loops/census-capture.py": "via-uploader",   # README.md job to hf_upload.py
    "scripts/pod-loops/gspc-estate-spray.sh": "via-uploader",  # hf_upload.py --folder
    "scripts/pod-loops/revenue-snapshot.sh": "via-uploader",   # hf_upload.py --readme-if-absent
    "scripts/pod-loops/trust-chain.sh": "via-uploader",        # hf_upload.py --readme-if-absent
    "scripts/census/build-mcp-remote-census-record.py": "wired",
    "scripts/census/contract-parity.py": "wired",
    "scripts/census/correct-a2a-card-census.py": "edits-live",
    "scripts/census/dataset-card-hygiene.py": "edits-live",
    "scripts/hf/fix-card-link.py": "edits-live",
    "scripts/hf/hf_live_row.py": "edits-live",
    "scripts/spray/gspc-spray.py": "edits-live",             # hf_dataset_companions() line-edits the live card
    "scripts/pod-loops/gspc-spray.py": "edits-live",
    "scripts/pod-loops/durability_hf_publish.py": "private",  # csoai/councilof-ai-source; additive markers
    "scripts/mirror_to_hf.py": "private",                    # csoai/councilof-ai-mirror
    "scripts/pod-loops/corrections-watch.py": "not-a-card",  # sub-folder README (public/interop/corrections-watch/) in csoai/councilof-ai-evidence, not a dataset card
    "scripts/pod-loops/drift-draft.py": "private",           # csoai/corrections-watch, created --private
    "scripts/sync_hf_gspc.py": "not-a-card",                 # the gspc-board Space shell
    "scripts/harness-x/render.mjs": "not-a-card",            # package and Space READMEs
    "scripts/export-benchmark-quality.mjs": "not-a-card",    # csoai/benchmark-quality-register, not public
}
# Generators that write a card into a stage directory for a separate upload step; the scan below cannot
# see the upload, so they are named here and must be wired.
STAGE_GENERATORS = [
    "scripts/census/build-universes-census-records.py",
    "scripts/census/build-agent-interop-census.py",
    "scripts/evidence-index/render_evidence_index.py",
    "scripts/readers/cross_ledger_dataset_card.py",
]
HOOK = re.compile(r"cite_apply\(|carded\(|from cite_block import apply")
UPLOAD = re.compile(r"upload_file|upload_folder|CommitOperationAdd|create_commit|hf_upload|huggingface-cli upload|hf upload")


def scan_readme_uploaders() -> set[str]:
    hits = set()
    for top in ("scripts", "fleet"):
        for p in (REPO / top).rglob("*"):
            if p.suffix not in (".py", ".sh", ".mjs") or not p.is_file():
                continue
            rel = p.relative_to(REPO).as_posix()
            if any(s in rel for s in ("/tests/", "/fixtures/", "/node_modules/", "/superseded/")) or p.name.startswith("test_"):
                continue
            t = p.read_text(encoding="utf-8", errors="replace")
            if "README" in t and UPLOAD.search(t) and re.search(r"csoai/|HF_REPO|repo_id", t):
                hits.add(rel)
    return hits


class TheBlock(unittest.TestCase):
    def test_reproduces_live_cards_byte_for_byte(self):
        files = sorted(FIX.glob("*.md"))
        self.assertGreaterEqual(len(files), 4)
        for f in files:
            live = f.read_text(encoding="utf-8")
            self.assertTrue(cb.has_block(live), f.name)
            self.assertEqual(cb.apply(live, f"csoai/{f.stem}"), live, f.name)

    def test_idempotent_one_copy_at_the_end(self):
        once = cb.apply(CARD, "csoai/example-census")
        self.assertEqual(cb.apply(once, "csoai/example-census"), once)
        self.assertEqual(once.count(cb.START), 1)
        self.assertEqual(once.count(cb.END), 1)
        self.assertTrue(once.endswith(cb.END + "\n"))
        self.assertTrue(once.startswith("---\nlicense: cc-by-4.0\n"))

    def test_an_earlier_copy_is_replaced_and_moved_to_the_end(self):
        once = cb.apply(CARD, "csoai/example-census")
        blk = cb.extract(once)
        edited = CARD + "\n" + blk + "\n## Added later\n\nMore text.\n"
        out = cb.apply(edited, "csoai/example-census")
        self.assertEqual(out.count(cb.START), 1)
        self.assertTrue(out.endswith(cb.END + "\n"))
        self.assertIn("## Added later", out)

    def test_the_block_names_citation_corrections_and_verification(self):
        blk = cb.extract(cb.apply(CARD, "csoai/example-census"))
        for s in ("## How to cite", "*Example census*", "@misc{csoai_example_census,",
                  "https://huggingface.co/datasets/csoai/example-census",
                  "https://councilof.ai/api/corrections", "https://councilof.ai/gspc-verify/",
                  "https://councilof.ai/signed/HOW-TO-VERIFY.md",
                  "https://councilof.ai/spec/signed-receipts/v1/conformance/",
                  "Licence: CC-BY-4.0."):
            self.assertIn(s, blk)
        # the outward gate's notice list bans this word; L5 removed it from the first draft
        self.assertNotRegex(blk.lower(), r"certif")

    def test_the_block_carries_the_objections_contact_and_corrections_section(self):
        blk = cb.extract(cb.apply(CARD, "csoai/example-census"))
        self.assertEqual(blk.count(cb.OBJ_HEADING), 1)
        for s in ("nicholas@csoai.org", "https://councilof.ai/dispute/", "https://councilof.ai/api/corrections",
                  "object to a row", "re-check", "request a correction", "CSOAI Ltd (company no. 16939677"):
            self.assertIn(s, blk)
        self.assertLess(blk.index(cb.OBJ_HEADING), blk.index("## How to cite"))

    def test_the_outward_gate_accountability_checks_pass_on_a_produced_card(self):
        # the exact checks that failed on 117 of 131 public cards on 29 Sep 2026 (05:00Z gate run)
        og = load("outward_gate", REPO / "scripts/outward-gate/outward_gate.py")
        for card in (CARD, "# Bare card without front matter\n\nBody.\n"):
            md = cb.apply(card, "csoai/example-census")
            links = re.findall(r"https?://[^\s)\]>\"'`]+", md)
            got = {c["check"]: c["status"] for c in og.accountability_checks(md, og.md_text(md), "x", links)}
            for chk in ("accountability.objection_route", "accountability.contact_plain_email",
                        "accountability.corrections_link", "accountability.entity_named"):
                self.assertEqual(got.get(chk), "PASS", (chk, got))
            bare = {c["check"]: c["status"] for c in og.accountability_checks(card, og.md_text(card), "x", [])}
            self.assertEqual(bare["accountability.objection_route"], "FAIL")  # the check is not vacuous

    def test_a_card_with_its_own_objections_section_is_not_given_a_second(self):
        own = CARD + "\n## Objections, contact and corrections\n\nWrite to us.\n"
        once = cb.apply(own, "csoai/example-census")
        self.assertEqual(once.count(cb.OBJ_HEADING), 1)
        self.assertNotIn(cb.OBJ_HEADING, cb.extract(once))
        self.assertEqual(cb.apply(once, "csoai/example-census"), once)
        # the section inside the block never counts as the card's own
        plain = cb.apply(CARD, "csoai/example-census")
        self.assertFalse(cb.has_own_objections(plain.split("---\n", 2)[2]))
        self.assertEqual(cb.apply(plain, "csoai/example-census"), plain)

    def test_year_and_doi_come_from_the_registry(self):
        reg = json.loads((HERE / "cite-block-registry.json").read_text())["datasets"]
        self.assertEqual(reg["gspc-drift"]["doi"], "10.57967/hf/10111")
        blk = cb.extract(cb.apply(CARD, "csoai/gspc-drift"))
        self.assertIn("DOI: [10.57967/hf/10111](https://doi.org/10.57967/hf/10111)", blk)
        self.assertIn("doi          = {10.57967/hf/10111},", blk)
        new = cb.extract(cb.apply(CARD, "csoai/not-in-the-registry"))
        self.assertNotIn("DOI", new)
        self.assertIn(f"year         = {{{dt.datetime.now(dt.timezone.utc).year}}}", new)

    def test_a_published_citation_is_kept_on_rebuild(self):
        # a card another producer made after L5, with its own BibTeX key, year and DOI, not in the registry
        once = cb.apply(CARD, "csoai/made-later", year=2025, doi="10.57967/hf/1")
        custom = once.replace("@misc{csoai_made_later,", "@misc{csoai_made_later_v0_2,")
        again = cb.apply(custom, "csoai/made-later")
        self.assertEqual(again, custom)
        self.assertIn("@misc{csoai_made_later_v0_2,", again)
        self.assertIn("year         = {2025},", again)
        self.assertIn("doi          = {10.57967/hf/1},", again)

    def test_only_the_recorded_licence_decisions_change_a_licence(self):
        mit = CARD.replace("license: cc-by-4.0", "license: mit")
        fixed = cb.apply(mit, "csoai/living-catalog")          # L5 decision: mit -> cc-by-4.0
        self.assertIn("license: cc-by-4.0", fixed)
        self.assertIn("Licence: CC-BY-4.0.", fixed)
        kept = cb.apply(mit, "csoai/some-other-dataset")        # no decision recorded: licence kept
        self.assertIn("license: mit", kept)
        self.assertIn("Licence: MIT.", kept)
        mixed = cb.apply(CARD, "csoai/index-presence")
        self.assertIn("license: other", mixed)
        self.assertIn("license_name: csoai-mixed-data", mixed)
        self.assertEqual(mixed.count("## Licence note"), 1)
        self.assertEqual(cb.apply(mixed, "csoai/index-presence").count("## Licence note"), 1)


class TheProducers(unittest.TestCase):
    def test_every_readme_uploader_is_classified_by_name(self):
        found = scan_readme_uploaders()
        unclassified = sorted(found - set(PRODUCERS))
        self.assertEqual(unclassified, [], "classify each new README uploader in PRODUCERS")
        gone = sorted(set(PRODUCERS) - found)
        self.assertEqual(gone, [], "a classified producer no longer uploads a README; update PRODUCERS")

    def test_every_wired_producer_calls_the_one_producer(self):
        wired = [p for p, k in PRODUCERS.items() if k == "wired"] + STAGE_GENERATORS
        for rel in wired:
            self.assertRegex((REPO / rel).read_text(encoding="utf-8"), HOOK, rel)
        # these reach the Hub only through hf_upload.py, which is wired
        for rel in (p for p, k in PRODUCERS.items() if k == "via-uploader"):
            t = (REPO / rel).read_text(encoding="utf-8")
            self.assertIn("hf_upload.py", t, rel)
            self.assertNotRegex(t, r"huggingface-cli upload|hf upload|upload_file\(", rel)

    def test_fleet_status_publisher_reproduces_the_live_card(self):
        live = (FIX / "fleet-status.md").read_text(encoding="utf-8")
        for rel in ("fleet/publish_fleet_status.py", "scripts/pubbus/publish-fleet-status.py"):
            mod = load("pfs_" + rel.replace("/", "_").replace("-", "_")[:-3], REPO / rel)
            self.assertEqual(mod.card("csoai/fleet-status"), live, rel)

    def test_census_capture_readme_through_the_pod_uploader_reproduces_the_live_card(self):
        live = (FIX / "claim-capture-census.md").read_text(encoding="utf-8")
        date = re.search(r"Last run in this README's generation: (\d{4}-\d{2}-\d{2})", live).group(1)
        cc = load("census_capture", REPO / "scripts/pod-loops/census-capture.py")
        up = load("hf_upload", REPO / "scripts/pod-loops/hf_upload.py")
        self.assertEqual(up.carded(cc.build_readme(list(cc.SOURCES), date), "csoai/claim-capture-census"), live)

    def test_pod_uploader_cards_a_folder_and_keeps_its_manifest_true(self):
        up = load("hf_upload_folder", REPO / "scripts/pod-loops/hf_upload.py")
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d)
            (folder / "README.md").write_text(CARD, encoding="utf-8")
            (folder / "data.jsonl").write_text("{}\n", encoding="utf-8")
            rows = [{"file": "README.md", "bytes": 1, "sha256": "0" * 64, "blob_id": "0" * 40},
                    {"file": "data.jsonl", "bytes": 3, "sha256": hashlib.sha256(b"{}\n").hexdigest()}]
            (folder / "manifest.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
            self.assertEqual(up.card_folder_readme(folder, "csoai/example-census"), "CARDED")
            data = (folder / "README.md").read_bytes()
            self.assertTrue(cb.has_block(data.decode()))
            got = [json.loads(x) for x in (folder / "manifest.jsonl").read_text().splitlines()]
            self.assertEqual(got[0]["bytes"], len(data))
            self.assertEqual(got[0]["sha256"], hashlib.sha256(data).hexdigest())
            self.assertEqual(got[0]["blob_id"], hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest())
            self.assertEqual(got[1], rows[1])                  # other rows untouched
            # a second pass changes nothing
            before = (folder / "manifest.jsonl").read_bytes()
            self.assertEqual(up.card_folder_readme(folder, "csoai/example-census"), "CARDED")
            self.assertEqual((folder / "manifest.jsonl").read_bytes(), before)

    def test_pod_uploader_holds_a_readme_when_the_producer_is_missing(self):
        up = load("hf_upload_held", REPO / "scripts/pod-loops/hf_upload.py")
        up.carded = lambda text, repo: None
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / "README.md").write_text(CARD, encoding="utf-8")
            self.assertEqual(up.card_folder_readme(d, "csoai/example-census"), "HELD")
            self.assertEqual((Path(d) / "README.md").read_text(encoding="utf-8"), CARD)


if __name__ == "__main__":
    unittest.main(verbosity=2)
