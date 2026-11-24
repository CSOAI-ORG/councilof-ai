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
  * a dataset derived from someone else's data (a registry `source` record) takes the source's licence and
    credits the source after its title and in How to cite: csoai/gspc-gov said cc0-1.0 over CC BY 4.0 items and
    credited only us (correction C-2026-1120-02). fixtures/cite-block/before/gspc-gov.md is that card at revision
    beecacfc2136a41d2c23274116770585d7da5c14; the producer must turn it into fixtures/cite-block/gspc-gov.md, the
    card read back from the Hub at revision c6ddc5a92c2354248e6b1328ebd341872ee80019 (20 Nov 2026);
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
import os
import re
import sys
import tempfile
import unittest
from unittest.mock import patch
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
#   template     publishes a dedicated product template, not a cite_block-generated census card
PRODUCERS = {
    "fleet/publish_fleet_status.py": "wired",
    "scripts/pubbus/publish-fleet-status.py": "wired",
    "scripts/hf/hf-org-card.py": "wired",
    "scripts/pod-loops/hf_upload.py": "wired",
    "scripts/pod-loops/census-capture.py": "via-uploader",   # README.md job to hf_upload.py
    "scripts/pod-loops/gspc-estate-spray.sh": "via-uploader",  # hf_upload.py --folder
    "scripts/pod-loops/revenue-snapshot.sh": "via-uploader",   # hf_upload.py --readme-if-absent
    "scripts/pod-loops/trust-chain.sh": "via-uploader",        # hf_upload.py --readme-if-absent
    "scripts/retire-superseded-datasets.py": "via-uploader", # retirement notice on live README, through hf_upload.py
    "scripts/census/build-mcp-remote-census-record.py": "wired",
    "scripts/census/contract-parity.py": "wired",
    "scripts/census/correct-a2a-card-census.py": "edits-live",
    "scripts/census/dataset-card-hygiene.py": "edits-live",
    "scripts/hf/fix-card-link.py": "edits-live",
    "scripts/hf/correct_orb3_readme.py": "edits-live", # exact-reviewed public ORB-III historical notice, data rows unchanged
    "scripts/hf/hf_live_row.py": "edits-live",
    "scripts/hf/hf_card_metadata.py": "edits-live",          # preserves the existing citation/body
    "scripts/hf/polish_frontdoors.py": "template",           # reviewed product templates; content/hash guards
    "scripts/claims/maintenance_due.py": "not-a-card",       # README below the claim-maintenance archive subfolder
    "scripts/hf/publish_evidence_adaptation.py": "template", # dedicated source-reviewed research product, not census card
    "scripts/hf/publish_evidence_adaptation.py": "template", # reviewed original research card, protected-master release with privacy and byte-replay gates
    "scripts/measurements/publish-fact-table.py": "template", # dedicated fact-table product card
    "scripts/surface/publish-hf-evaluation.py": "template",   # pinned evaluation pack/results cards and Space template
    "scripts/hf/hf-scrub-daily.py": "edits-live",        # hf-org-card.py scrub_legacy line-edits, commit against the revision read
    "scripts/spray/gspc-spray.py": "edits-live",             # hf_dataset_companions() line-edits the live card
    "scripts/pod-loops/gspc-spray.py": "edits-live",
    "scripts/pod-loops/durability_hf_publish.py": "private",  # csoai/councilof-ai-source; additive markers
    "scripts/mirror_to_hf.py": "private",                    # no default target; its old one, csoai/councilof-ai-mirror, was deleted 21 Nov 2026
    "scripts/pod-loops/corrections-watch.py": "not-a-card",  # sub-folder README (public/interop/corrections-watch/) in csoai/councilof-ai-evidence, not a dataset card
    "scripts/pod-loops/drift-draft.py": "private",           # csoai/corrections-watch, created --private
    "scripts/sync_hf_gspc.py": "not-a-card",                 # the gspc-board Space shell
    "scripts/sync_hf_coliseum.py": "not-a-card",             # council-coliseum Space, not a dataset card
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
            for repo in ("csoai/example-census", "csoai/gspc-gov"):   # gspc-gov: a card with a source section
                md = cb.apply(card, repo)
                links = re.findall(r"https?://[^\s)\]>\"'`]+", md)
                got = {c["check"]: c["status"] for c in og.accountability_checks(md, og.md_text(md), "x", links)}
                for chk in ("accountability.objection_route", "accountability.contact_plain_email",
                            "accountability.corrections_link", "accountability.entity_named"):
                    self.assertEqual(got.get(chk), "PASS", (repo, chk, got))
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

    def test_a_source_record_decides_the_licence_of_derived_data(self):
        cc0 = CARD.replace("license: cc-by-4.0", "license: cc0-1.0")
        derived = cb.apply(cc0, "csoai/gspc-gov")                 # items copied from a CC BY 4.0 source
        self.assertEqual(cb.fm_licence(cb.fm_split(derived)[0]), "cc-by-4.0")
        self.assertNotIn("Attribution is appreciated, not required", derived)
        kept = cb.apply(cc0, "csoai/gspc-ontology")              # no source record: the card's own licence stays
        self.assertEqual(cb.fm_licence(cb.fm_split(kept)[0]), "cc0-1.0")
        self.assertNotIn(cb.SRC_START, kept)
        self.assertNotIn(cb.SRC_START, cb.apply(CARD, "csoai/example-census"))

    def test_the_gspc_gov_card_credits_its_source_and_states_the_limit(self):
        # C-2026-1120-02: the card at revision beecacfc said cc0-1.0, credited only us and stated no limit.
        before = (FIX / "before" / "gspc-gov.md").read_text(encoding="utf-8")
        self.assertEqual(cb.fm_licence(cb.fm_split(before)[0]), "cc0-1.0")
        self.assertNotIn("Davvetas", before)
        out = cb.apply(before, "csoai/gspc-gov")
        self.assertEqual(out, (FIX / "gspc-gov.md").read_text(encoding="utf-8"))   # the card now published
        self.assertEqual(cb.apply(out, "csoai/gspc-gov"), out)
        fm, body = cb.fm_split(out)
        self.assertEqual(cb.fm_licence(fm), "cc-by-4.0")
        self.assertEqual(cb.registry()["gspc-gov"]["source"]["authors"],   # as named on arXiv:2603.09435
                         ["Athanasios Davvetas", "Michael Papademas", "Xenia Ziouvelou", "Vangelis Karkaletsis"])
        self.assertEqual(out.count(cb.SRC_START), 1)
        self.assertEqual(out.count(cb.SRC_END), 1)
        self.assertTrue(body.split(cb.SRC_START)[0].rstrip().endswith("# GSPC — governance bank (GovBench)"))
        sec = out[out.index(cb.SRC_START):out.index(cb.SRC_END)]
        for s in ("## Source, licence and limit",
                  "by Athanasios Davvetas, Michael Papademas, Xenia Ziouvelou and Vangelis Karkaletsis (NCSR Demokritos)",
                  "(https://arxiv.org/abs/2603.09435)", "(https://github.com/davidath/ai-act-evaluation-benchmark)",
                  "(https://creativecommons.org/licenses/by/4.0/)", "this dataset is offered under CC BY 4.0",
                  "**Changes we made.**", "237 of the 339 scenarios", "we changed no label",
                  "**Limit.**", "matches 225 of the 237 labels", "It is not a test of how a system applies the EU AI Act",
                  "a qualified person has checked the labels", "correction C-2026-1120-02",
                  "https://councilof.ai/api/corrections"):
            self.assertIn(s, sec)
        blk = cb.extract(out)
        for s in ("Cite its paper, as its authors ask:", "@article{Davvetas2026,", "To cite this derived dataset:",
                  "@misc{csoai_gspc_gov,", "note         = {Derived from arXiv:2603.09435 (CC BY 4.0). Corrections:",
                  "Licence: CC-BY-4.0, the licence of the source's data, which governs this derived dataset.",
                  "Credit the source's authors, Athanasios Davvetas, Michael Papademas, Xenia Ziouvelou and "
                  "Vangelis Karkaletsis (arXiv:2603.09435)"):
            self.assertIn(s, blk)
        self.assertLess(blk.index("@article{Davvetas2026,"), blk.index("@misc{csoai_gspc_gov,"))
        self.assertNotRegex((sec + blk).lower(), r"certif")

    def test_the_source_section_follows_the_title_outside_code_and_is_never_doubled(self):
        fenced = "---\nlicense: cc0-1.0\n---\n```python\n# not a title\n```\n\n# Real title\n\nBody.\n"
        out = cb.apply(fenced, "csoai/gspc-gov")
        self.assertLess(out.index("# Real title"), out.index(cb.SRC_START))
        self.assertLess(out.index(cb.SRC_END), out.index("Body."))
        self.assertEqual(cb.apply(out, "csoai/gspc-gov"), out)
        untitled = cb.apply("No title here.\n", "csoai/gspc-gov")
        self.assertLess(untitled.index(cb.SRC_END), untitled.index("No title here."))
        self.assertEqual(cb.apply(untitled, "csoai/gspc-gov"), untitled)
        self.assertEqual(untitled.count(cb.SRC_START), 1)

    def test_every_source_record_is_complete(self):
        need = ("scope", "name", "title", "authors", "year", "arxiv", "paper", "repository", "licence",
                "licence_short", "licence_url", "licence_basis", "bibtex", "changes")
        sources = {k: v["source"] for k, v in cb.registry().items() if "source" in v}
        self.assertIn("gspc-gov", sources)
        for name, src in sources.items():
            for k in need:
                self.assertTrue(src.get(k), (name, k))
            self.assertIn(src["licence"], cb.LIC_LABEL, name)
            self.assertNotIn(name, cb.LIC_FIX, name)             # one licence decision per dataset
            if src.get("limit"):
                self.assertRegex(src.get("correction", ""), r"^C-\d{4}-\d{4}-\d{2}$", name)


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


class TheUploaderRuntime(unittest.TestCase):
    def test_import_and_local_card_helper_need_no_lanes_runtime(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(Path, "is_dir", return_value=False):
            up = load("hf_upload_offline", REPO / "scripts/pod-loops/hf_upload.py")
        self.assertIsNone(up.LANES)
        self.assertIsNone(up.QUEUE)
        with patch.object(up, "resolve_lanes", side_effect=AssertionError("offline helper resolved runtime")):
            self.assertTrue(cb.has_block(up.carded(CARD, "csoai/example-census")))

    def test_missing_producer_and_runtime_leave_the_card_held(self):
        up = load("hf_upload_no_producer", REPO / "scripts/pod-loops/hf_upload.py")
        with patch.dict(os.environ, {}, clear=True), patch.object(Path, "is_file", return_value=False), \
                patch.object(up, "resolve_lanes", side_effect=SystemExit("no lanes root")):
            self.assertIsNone(up.carded(CARD, "csoai/example-census"))

    def test_no_token_still_queues_and_flush_preserves_pending_work(self):
        up = load("hf_upload_queue_control", REPO / "scripts/pod-loops/hf_upload.py")
        with tempfile.TemporaryDirectory() as d, patch.dict(os.environ, {"LANES": d}, clear=True), \
                patch.object(up, "do_upload", side_effect=AssertionError("unexpected upload")), \
                patch.object(up, "do_upload_folder", side_effect=AssertionError("unexpected upload")):
            source = Path(d) / "fixture.jsonl"; source.write_text('{}\n')
            with patch.object(sys, "argv", ["hf_upload", "--repo", "csoai/example-census", "--file", str(source),
                    "--path-in-repo", "fixture.jsonl"]):
                self.assertEqual(up.main(), 3)
            queue_path = Path(d) / "out" / "pending-upload.jsonl"
            queued = queue_path.read_text()
            job = json.loads(queued)
            self.assertEqual(job["repo"], "csoai/example-census")
            self.assertEqual(job["path_in_repo"], "fixture.jsonl")
            self.assertEqual(job["file"], str(source.resolve()))
            with patch.object(sys, "argv", ["hf_upload", "--flush"]):
                self.assertEqual(up.main(), 3)
            self.assertEqual(queue_path.read_text(), queued)

    def test_missing_runtime_refuses_before_upload_or_queue(self):
        up = load("hf_upload_missing_runtime", REPO / "scripts/pod-loops/hf_upload.py")
        with patch.dict(os.environ, {}, clear=True), patch.object(Path, "is_dir", return_value=False), \
                patch.object(up, "do_upload") as upload, patch.object(up, "queue") as queue, \
                patch.object(sys, "argv", ["hf_upload", "--repo", "csoai/example-census", "--file", "fixture.jsonl",
                    "--path-in-repo", "fixture.jsonl"]):
            with self.assertRaisesRegex(SystemExit, "LANES is unset"):
                up.main()
            upload.assert_not_called()
            queue.assert_not_called()
            self.assertIsNone(up.QUEUE)


if __name__ == "__main__":
    unittest.main(verbosity=2)
