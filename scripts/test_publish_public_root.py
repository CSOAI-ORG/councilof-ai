#!/usr/bin/env python3
"""A source that cannot be reached must not retract a published measurement.

Fixture repo only: these cases never read the real tree, so they run whatever state
master is in.

The defect this covers (measured 2026-10-26): the candidate root built on 2026-10-25
ran while xrpl.fi was unreachable, so all 16 locked-16 asset leaves were honest
placeholders (asset_class None) and they REPLACED the 16 measured leaves the published
root carried. The derived readiness view then said "425 indexed assets, 0 measured" and
the stablecoin readiness gate failed closed on the candidate, which is what kept the ONE
public root from advancing.

Every rule here ships with the case that proves it can go red:
  - test_retraction_guard_fails_closed_on_a_dropped_measurement is the negative control
    for the guard itself, and
  - test_the_guard_is_not_vacuous checks that the same scenario with the carry-forward
    switched off really does retract, so a green guard means something.
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

import publish_public_root as ppr  # noqa: E402

SOURCE = "https://xrpl.fi/api/metrics"
RLUSD = ("RLUSD", "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De")
USDC = ("USDC", "rGm7WCVp9gb4jZHWTEtGUr4dd74z2XuWhE")


def asset_card(
    symbol: str,
    issuer: str,
    as_of: str,
    asset_class: str | None,
    *,
    signed: bool = True,
) -> dict:
    """One xrpl.asset.state leaf, shaped exactly like the adapter's output."""
    card = {
        "surface": "xrpl.asset.state",
        "subject": f"XRPL {symbol} public state",
        "as_of": as_of,
        "source_urls": [SOURCE],
        "payload": {
            "asset_class": asset_class,
            "holders": 1234 if asset_class else None,
            "issuer": "Example Issuer" if asset_class else None,
            "issuer_address": issuer,
            "kind": "distributed",
            "source": SOURCE,
            "supply": 99 if asset_class else None,
            "symbol": symbol,
            "verified_domain": "example.test" if asset_class else None,
            "verified_via": "Bidirectional domain match" if asset_class else None,
        },
        "unmeasured": [] if asset_class else ["xrpl.fi_row", "holders", "supply", "verified_via"],
        "tags": ["framework:xrpl", "jurisdiction:permissionless"],
    }
    card["sha256"] = ppr.card_sha256(card)
    if signed:
        # A real signature is not needed to prove which leaf was chosen; the digest rule
        # excludes sig_ed25519, exactly as the publisher relies on.
        card["sig_ed25519"] = "ed" + "0" * 126
    return card


def write_repo(root: Path, cards: list[dict], committed_shas: list[str]) -> dict:
    cards_dir = root / "public" / "cards"
    cards_dir.mkdir(parents=True, exist_ok=True)
    for card in cards:
        (cards_dir / f"{card['sha256'][:16]}.json").write_text(
            json.dumps({"card": card}, ensure_ascii=False), encoding="utf-8"
        )
    committed = {
        "as_of": "2026-10-13T03:31:42Z",
        "card_count": len(committed_shas),
        "card_sha256": list(committed_shas),
        "kind": "csoai.public-root/v1",
        "merkle_root": ppr.merkle_root(list(committed_shas)) if committed_shas else "",
    }
    (root / "public" / "root.json").write_text(
        json.dumps(committed, ensure_ascii=False), encoding="utf-8"
    )
    return committed


class CarryForwardPublishedMeasurementTest(unittest.TestCase):
    def test_an_unmeasured_fresh_leaf_is_replaced_by_the_published_measured_leaf(self) -> None:
        published = asset_card(*RLUSD, "2026-08-28T09:06:28.399Z", "Stablecoin")
        placeholder = asset_card(*RLUSD, "2026-10-25T03:05:34Z", None)
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [published], [published["sha256"]])
            leaves = ppr.load_committed_asset_leaves(committed, repo)
            self.assertEqual({("RLUSD", RLUSD[1])}, set(leaves))

            cards, carried, replaced = ppr.carry_forward_measured_asset_leaves([placeholder], leaves)
            self.assertEqual(1, len(carried))
            self.assertEqual(published["sha256"], cards[0]["sha256"])
            # The sha that was replaced is the PLACEHOLDER's, not the published leaf's.
            self.assertEqual(placeholder["sha256"], replaced.pop())
            # The carried leaf is the published one, byte for byte.
            self.assertEqual(published, cards[0])

    def test_a_newer_measured_leaf_is_never_replaced(self) -> None:
        published = asset_card(*USDC, "2026-08-28T09:06:28.399Z", "Stablecoin")
        fresh = asset_card(*USDC, "2026-10-26T03:05:34Z", "Stablecoin")
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [published], [published["sha256"]])
            leaves = ppr.load_committed_asset_leaves(committed, repo)
            cards, carried, replaced = ppr.carry_forward_measured_asset_leaves([fresh], leaves)
            self.assertEqual([], carried)
            self.assertEqual(set(), replaced)
            self.assertEqual(fresh["sha256"], cards[0]["sha256"])

    def test_an_asset_that_was_never_measured_keeps_its_honest_placeholder(self) -> None:
        published = asset_card(*RLUSD, "2026-08-28T09:06:28.399Z", "Stablecoin")
        placeholder = asset_card(*USDC, "2026-10-25T03:05:34Z", None)
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [published], [published["sha256"]])
            leaves = ppr.load_committed_asset_leaves(committed, repo)
            cards, carried, _ = ppr.carry_forward_measured_asset_leaves([placeholder], leaves)
            self.assertEqual([], carried)
            self.assertEqual(placeholder["sha256"], cards[0]["sha256"])
            # The placeholder still declares what it could not read.
            self.assertIn("holders", cards[0]["unmeasured"])

    def test_a_card_on_disk_that_the_published_root_does_not_carry_is_not_carried(self) -> None:
        published = asset_card(*RLUSD, "2026-08-28T09:06:28.399Z", "Stablecoin")
        stranger = asset_card(*RLUSD, "2026-09-01T00:00:00.000Z", "Stablecoin")
        placeholder = asset_card(*RLUSD, "2026-10-25T03:05:34Z", None)
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            # The stranger is on disk but NOT in the committed root, so it is not published.
            committed = write_repo(repo, [published, stranger], [published["sha256"]])
            leaves = ppr.load_committed_asset_leaves(committed, repo)
            self.assertEqual({("RLUSD", RLUSD[1])}, set(leaves))
            self.assertEqual(published["sha256"], leaves[("RLUSD", RLUSD[1])]["sha256"])
            cards, carried, _ = ppr.carry_forward_measured_asset_leaves([placeholder], leaves)
            self.assertEqual(1, len(carried))
            self.assertEqual(published["sha256"], cards[0]["sha256"])

    def test_the_symbol_is_matched_case_insensitively_but_the_issuer_is_not(self) -> None:
        published = asset_card("RLUSD", RLUSD[1], "2026-08-28T09:06:28.399Z", "Stablecoin")
        same_asset_other_case = asset_card("rLusd", RLUSD[1], "2026-10-25T03:05:34Z", None)
        other_issuer = asset_card("RLUSD", "rOTHERissuerXXXXXXXXXXXXXXXXXXXXXXXXXXXX", "2026-10-25T03:05:34Z", None)
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [published], [published["sha256"]])
            leaves = ppr.load_committed_asset_leaves(committed, repo)
            cards, carried, _ = ppr.carry_forward_measured_asset_leaves(
                [same_asset_other_case, other_issuer], leaves
            )
            self.assertEqual(1, len(carried))
            self.assertEqual(published["sha256"], cards[0]["sha256"])
            # A different issuer is a different asset and keeps its placeholder.
            self.assertEqual(other_issuer["sha256"], cards[1]["sha256"])


class RetractionGuardTest(unittest.TestCase):
    def test_retraction_guard_fails_closed_on_a_dropped_measurement(self) -> None:
        published = asset_card(*RLUSD, "2026-08-28T09:06:28.399Z", "Stablecoin")
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [published], [published["sha256"]])
            leaves = ppr.load_committed_asset_leaves(committed, repo)
            with self.assertRaises(SystemExit) as caught:
                ppr.assert_no_measurement_retraction([], leaves)
            message = str(caught.exception)
            self.assertIn("HALT-ON-MEASUREMENT-RETRACTION", message)
            self.assertIn("RLUSD", message)

    def test_the_guard_is_not_vacuous(self) -> None:
        """The same scenario without the carry-forward really does retract.

        If this ever stops retracting, the guard above is passing because it never
        looked — which is worse than having no guard.
        """
        published = asset_card(*RLUSD, "2026-08-28T09:06:28.399Z", "Stablecoin")
        placeholder = asset_card(*RLUSD, "2026-10-25T03:05:34Z", None)
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [published], [published["sha256"]])
            leaves = ppr.load_committed_asset_leaves(committed, repo)
            # No carry-forward: the placeholder replaces the published measurement, so
            # nothing measured survives in this root.
            without = [placeholder]
            measured_without = {
                ppr.asset_identity(c) for c in without if ppr.asset_leaf_is_measured(c)
            }
            self.assertEqual(set(), measured_without)
            with self.assertRaises(SystemExit):
                ppr.assert_no_measurement_retraction(without, leaves)
            # With the carry-forward, nothing is retracted and the guard stays quiet.
            carried, _, _ = ppr.carry_forward_measured_asset_leaves(without, leaves)
            ppr.assert_no_measurement_retraction(carried, leaves)

    def test_a_root_that_keeps_every_published_measurement_passes(self) -> None:
        published = asset_card(*RLUSD, "2026-08-28T09:06:28.399Z", "Stablecoin")
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [published], [published["sha256"]])
            leaves = ppr.load_committed_asset_leaves(committed, repo)
            ppr.assert_no_measurement_retraction([published], leaves)


class CommittedLeafSelectionTest(unittest.TestCase):
    def test_an_empty_committed_root_carries_nothing(self) -> None:
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [], [])
            self.assertEqual({}, ppr.load_committed_asset_leaves(committed, repo))

    def test_a_non_asset_surface_is_never_carried(self) -> None:
        notice = {
            "surface": "public.notice",
            "subject": "a notice",
            "as_of": "2026-10-25T00:00:00Z",
            "source_urls": ["https://councilof.ai/"],
            "payload": {"asset_class": "Stablecoin", "symbol": "RLUSD"},
            "unmeasured": [],
            "tags": [],
        }
        notice["sha256"] = ppr.card_sha256(notice)
        with tempfile.TemporaryDirectory() as d:
            repo = Path(d)
            committed = write_repo(repo, [notice], [notice["sha256"]])
            self.assertEqual({}, ppr.load_committed_asset_leaves(committed, repo))


if __name__ == "__main__":
    unittest.main()
