# SPDX-License-Identifier: Apache-2.0
"""A CONSISTENT verdict must carry the control that made it CONSISTENT.

The gap this file closes: an evidence event could carry `state: CONSISTENT`
with a negative control that was never identified and never expected — it just
*declared* that the control came out CONSISTENT — and pass both the event
rules and the JSON Schema. A record that way asserts "the method worked"
without ever showing a method that could have failed.

Owner invariant 4 says it already: *all-pass is not competent measurement.* The
instrument census applies that at the instrument level; this file is the same
rule at the record level.

The rule, in one line: a CONSISTENT event must carry an identified control, an
expected outcome for it, the fact that it ran, and the fact that it behaved as
expected. Anything less is PARTIAL (we did not check) or NOT_DISCRIMINATING
(the method cannot separate), and those states exist for exactly this.
"""
import copy
import importlib.util
import json
import os
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
PKG_LIB = os.path.join(REPO, "packages", "evidence-fabric")
SAFE_LIB = os.path.join(REPO, "docs", "standards", "osaia-safe-evidence-pack", "lib")


def _load(name, path):
    """Load a module by path under a distinct name.

    Two copies of event.py exist and both are under test, so neither is
    imported by bare name: an import that resolved to the wrong copy would
    make the freeze test prove nothing.
    """
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


E = _load("evidence_fabric_event", os.path.join(PKG_LIB, "event.py"))


def _subject():
    return {"kind": "mcp_server", "locator": "https://example.org/mcp"}


def _claim():
    return {"text": "The server declares tools/list returns 3 tools.",
            "source_sha256": "0" * 64,
            "source_url": "https://example.org/server.json"}


def _method():
    return {"id": "tools/count", "version": "1.0.0", "holder": "csoai"}


def _limits():
    return ["FIXTURE: synthetic event; it measures nothing."]


def _build(state="CONSISTENT", negative_control=None):
    """A minimal event, built through the real builder so the rules apply."""
    return E.build(
        subject=_subject(), claim=_claim(), method=_method(),
        declared={"tools": 3}, observed={"tools": 3},
        state=state, value=1.0 if state not in ("UNMEASURED", "UNCHECKABLE") else None,
        negative_control=negative_control, limits=_limits(),
    )


# The record that used to pass: CONSISTENT, a control that was never
# identified, never expected, and simply declared to have come out CONSISTENT.
UNDECLARED_CONTROL = {"id": None, "expected": None, "got": "CONSISTENT"}

# The control that makes it honest: identified, expected, run, and it behaved
# as expected — which is what "the method discriminated" means.
DISCRIMINATING_CONTROL = {"id": "known-bad-server", "expected": "DIVERGENT",
                          "got": "DIVERGENT"}


class TestTheGapIsClosed:
    def test_consistent_with_an_undeclared_control_is_rejected(self):
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control=UNDECLARED_CONTROL)
        msg = str(exc.value)
        assert "identified negative control" in msg
        assert "expected outcome" in msg

    def test_the_error_names_the_state_to_use_instead(self):
        """An admission error that does not say what to do is half an error."""
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control=UNDECLARED_CONTROL)
        msg = str(exc.value)
        assert "PARTIAL" in msg or "NOT_DISCRIMINATING" in msg

    def test_a_control_that_was_never_run_is_rejected(self):
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control={"id": "known-bad-server", "expected": "DIVERGENT",
                                     "got": "NOT_RUN"})
        assert "no negative control run" in str(exc.value)

    def test_a_control_with_no_expected_outcome_is_rejected(self):
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control={"id": "known-bad-server", "expected": None,
                                     "got": "DIVERGENT"})
        assert "expected outcome" in str(exc.value)

    def test_a_control_that_did_not_discriminate_is_rejected(self):
        """The control came back as the claim, so the method separated nothing."""
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control={"id": "known-bad-server", "expected": "DIVERGENT",
                                     "got": "CONSISTENT"})
        assert "did not discriminate" in str(exc.value)


class TestTheHonestRecordStillPasses:
    def test_a_discriminating_control_admits_the_record(self):
        ev = _build(negative_control=DISCRIMINATING_CONTROL)
        assert E.validate(ev) == []
        assert ev["state"] == "CONSISTENT"

    def test_an_empty_control_id_is_not_an_identification(self):
        with pytest.raises(E.DoctrineError):
            _build(negative_control={"id": "   ", "expected": "DIVERGENT", "got": "DIVERGENT"})


class TestOtherStatesAreUnaffected:
    """Only CONSISTENT claims the method worked. The weaker states may have no control."""

    @pytest.mark.parametrize("state", ["PARTIAL", "DIVERGENT", "NOT_DISCRIMINATING",
                                       "UNMEASURED", "UNCHECKABLE"])
    def test_a_record_without_a_control_is_still_admitted_in_weaker_states(self, state):
        ev = E.build(
            subject=_subject(), claim=_claim(), method=_method(),
            declared={"tools": 3}, observed={"tools": 3},
            state=state,
            value=None if state in ("UNMEASURED", "UNCHECKABLE") else 1.0,
            negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
            limits=_limits(),
        )
        assert E.validate(ev) == []


class TestTheJsonSchemaLayerAgrees:
    """The schema is the second gate. It must close the same hole."""

    @staticmethod
    def _validator():
        from jsonschema import Draft7Validator
        path = os.path.join(PKG_LIB, "schema", "evidence-event-0.1.schema.json")
        with open(path, encoding="utf-8") as fh:
            return Draft7Validator(json.load(fh))

    def test_the_schema_rejects_an_undeclared_control(self):
        ev = _build(negative_control=DISCRIMINATING_CONTROL)
        # Make it schema-legal except for the control, so the rejection is
        # attributable to the control rule and nothing else.
        ev = copy.deepcopy(ev)
        ev["negative_control"] = UNDECLARED_CONTROL
        ev["event_id"] = E.compute_event_id(ev)
        errors = list(self._validator().iter_errors(ev))
        assert errors, "the JSON Schema must reject a CONSISTENT record with no identified control"

    def test_the_schema_admits_the_honest_record(self):
        ev = _build(negative_control=DISCRIMINATING_CONTROL)
        assert list(self._validator().iter_errors(ev)) == []


class TestTheFrozenCopyStaysFrozen:
    """The SAFE pack is a SIGNED, FROZEN artifact — not a second implementation to keep in step.

    An earlier draft of this file asserted that the two copies of event.py enforce
    the same admission rule. That assertion was wrong, and the only way to satisfy
    it was to edit a board-signed, OpenTimestamps-anchored artifact, which the pack's
    own doctrine forbids: *"a new pack is a new FREEZE, never an edit."*

    The freeze is the anti-drift mechanism, and it is a stronger one than a copied
    rule: SHA256SUMS pins every byte of the pack, FREEZE.json pins SHA256SUMS, and
    the board signature pins FREEZE.json. So the invariants that actually matter are
    these two, and they are what this class checks:

      1. the frozen copy has not moved — the freeze still binds the bytes on disk;
      2. the live rule is stricter without retroactively changing what was signed —
         every published event still satisfies the live rule.

    Check (2) is the one that matters in practice: it says the tightened rule is a
    forward-looking admission change, not a rewriting of history.
    """

    PACK = os.path.join(REPO, "docs", "standards", "osaia-safe-evidence-pack")

    @staticmethod
    def _sha(path):
        import hashlib
        with open(path, "rb") as fh:
            return hashlib.sha256(fh.read()).hexdigest()

    def test_the_frozen_pack_matches_its_own_checksums(self):
        """Every file the freeze lists must still have the digest the freeze names."""
        sums = os.path.join(self.PACK, "SHA256SUMS")
        listed = 0
        with open(sums, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                digest, relative = line.split(None, 1)
                relative = relative.strip()
                target = os.path.join(self.PACK, relative)
                assert os.path.isfile(target), f"{relative} is listed by SHA256SUMS but missing"
                assert self._sha(target) == digest, (
                    f"{relative} has moved since the freeze; a frozen pack is never edited "
                    f"in place — publish a new FREEZE instead")
                listed += 1
        assert listed >= 30, f"SHA256SUMS listed only {listed} files; the freeze is too small to be real"

    def test_the_freeze_binds_its_checksums_and_the_board_binds_the_freeze(self):
        """FREEZE.json pins SHA256SUMS; the board signature pins FREEZE.json."""
        freeze_path = os.path.join(self.PACK, "FREEZE.json")
        with open(freeze_path, encoding="utf-8") as fh:
            freeze = json.load(fh)
        assert freeze["sha256sums_sha256"] == self._sha(os.path.join(self.PACK, "SHA256SUMS")), \
            "FREEZE.json does not bind the SHA256SUMS bytes on disk"
        with open(os.path.join(self.PACK, "FREEZE.signed.json"), encoding="utf-8") as fh:
            signed = json.load(fh)
        assert signed["payload"]["artifact"]["sha256"] == self._sha(freeze_path), \
            "the board signature does not bind the FREEZE.json bytes on disk"

    def test_the_frozen_copy_still_validates_the_published_events(self):
        """The frozen reader still re-derives what was signed."""
        safe = _load("safe_evidence_event", os.path.join(SAFE_LIB, "event.py"))
        for ev in self._published_events():
            assert safe.validate(ev) == [], ev.get("event_id")

    def test_the_published_events_still_satisfy_the_live_rule(self):
        """The cross-boundary proof: tightening the live rule breaks no published record.

        All ten published events carry a real discriminating control
        (`designed_to_fail`, expected DIVERGENT, got DIVERGENT), so the stricter
        admission rule admits every one of them. If a future event does not, that
        is the rule working, and this test says so rather than hiding it.
        """
        for ev in self._published_events():
            assert E.validate(ev) == [], (
                f"{ev.get('event_id')} was signed under the older rule and does not satisfy "
                f"the live rule: {E.validate(ev)}")

    @classmethod
    def _published_events(cls):
        path = os.path.join(cls.PACK, "events", "events.jsonl")
        events = []
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if line:
                    events.append(json.loads(line))
        assert events, "no published events found in the frozen pack"
        return events


class TestTheExistingCorpusIsUnaffected:
    """No published record breaks. The corpus is the regression proof."""

    def test_every_fixture_still_validates(self):
        path = os.path.join(HERE, "fixtures", "events.jsonl")
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                assert E.validate(json.loads(line)) == [], line[:120]

    def test_the_safe_pack_records_still_validate_against_the_pack_schema(self):
        """The re-verification records in the pack still satisfy the schema the pack freezes.

        An earlier version of this test filtered the records directory for evidence
        events and matched zero of them, so it asserted nothing at all — a passing
        test that could not fail. The records there are safe-reverification records;
        they are checked against the schema the pack itself freezes.
        """
        from jsonschema import Draft7Validator
        pack = os.path.dirname(SAFE_LIB)
        rec_dir = os.path.join(pack, "records")
        if not os.path.isdir(rec_dir):
            pytest.skip("no SAFE pack records in this checkout")
        with open(os.path.join(pack, "schema", "safe-reverification-record-v0.1.schema.json"),
                  encoding="utf-8") as fh:
            validator = Draft7Validator(json.load(fh))
        checked = 0
        for name in sorted(os.listdir(rec_dir)):
            if not name.endswith(".json") or name == "index.json":
                continue
            with open(os.path.join(rec_dir, name), encoding="utf-8") as fh:
                doc = json.load(fh)
            for rec in (doc if isinstance(doc, list) else [doc]):
                if isinstance(rec, dict) and "record_id" in rec:
                    errors = list(validator.iter_errors(rec))
                    assert not errors, f"{name}: {errors[0].message}"
                    checked += 1
        assert checked >= 10, f"only {checked} records were checked; this test would pass vacuously"
