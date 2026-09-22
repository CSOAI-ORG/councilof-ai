#!/usr/bin/env python3
"""Tests for the claim-measurement harnesses — every one of them a FAILING control.

A harness that has never failed has not been tested. Each measurable claim type here is fed a
planted input that it MUST reject, alongside one it must accept, so the pass is evidence that
the instrument discriminates rather than evidence that it always says yes.

Runs two ways, with no dependency either way:
    python3 scripts/claims/test_claim_harness.py
    npx/pytest scripts/claims/test_claim_harness.py
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import common as cm  # noqa: E402
import corroborate  # noqa: E402
import feed_health as fh  # noqa: E402
import merkle_rfc9162 as mk  # noqa: E402
import oracle_share as osh  # noqa: E402
import presence  # noqa: E402
import restatement as rs  # noqa: E402


# ---------------------------------------------------------------- RFC 9162 Merkle

def test_merkle_matches_the_published_rfc_test_vectors():
    """Known answers from the CT specification's eight-entry test tree."""
    d = [bytes.fromhex(x) for x in
         ["", "00", "10", "2021", "3031", "40414243", "5051525354555657", "606162636465666768696a6b6c6d6e6f"]]
    assert mk.root_hex([]) == "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    assert mk.root_hex(d[:1]) == "6e340b9cffb37a989ca544e6bb780a2c78901d3fb33738768511a30617afa01d"
    assert mk.root_hex(d[:3]) == "aeb6bcfe274b70a14fb067a5e5578264db0fa9b51af5e0ba159158f329e06e77"
    assert mk.root_hex(d) == "5dc9da79a70659a9ad559cb701ded9a2ab9d823aad2f4960cfe370eff4604328"


def test_merkle_control_a_tampered_leaf_must_not_verify():
    """FAILING CONTROL: change one byte of an entry and its own proof must stop verifying."""
    d = [b"a", b"b", b"c", b"d", b"e"]
    root = mk.mth(d)
    for m in range(len(d)):
        p = mk.inclusion_proof(d, m)
        assert mk.verify_inclusion(d[m], m, len(d), p, root)
        assert not mk.verify_inclusion(d[m] + b"\x00", m, len(d), p, root), "tampered leaf verified"
        assert not mk.verify_inclusion(d[m], m, len(d), p, b"\x00" * 32), "wrong root verified"
    # A truncated path must not verify either.
    assert not mk.verify_inclusion(d[0], 0, len(d), mk.inclusion_proof(d, 0)[:-1], root)


def test_merkle_control_must_not_be_the_estate_s_other_two_shapes():
    """FAILING CONTROL: the two Merkle shapes already in the estate must NOT reproduce this root.

    public/root.json duplicates an odd node; scripts/measurement_root.py carries it up. Both are
    unprefixed. If either matched, this module would be one of them under a new name.
    """
    import hashlib
    leaves = [b"a", b"b", b"c"]
    lh = [hashlib.sha256(x).hexdigest() for x in leaves]

    def dup(hs):
        while len(hs) > 1:
            if len(hs) % 2:
                hs = hs + [hs[-1]]
            hs = [hashlib.sha256(bytes.fromhex(hs[i]) + bytes.fromhex(hs[i + 1])).hexdigest()
                  for i in range(0, len(hs), 2)]
        return hs[0]

    def carry(hs):
        while len(hs) > 1:
            nxt = [hashlib.sha256(bytes.fromhex(hs[i]) + bytes.fromhex(hs[i + 1])).hexdigest()
                   for i in range(0, len(hs) - 1, 2)]
            if len(hs) % 2:
                nxt.append(hs[-1])
            hs = nxt
        return hs[0]

    ours = mk.root_hex(leaves)
    assert ours != dup(list(lh)), "this root is the odd-duplication shape"
    assert ours != carry(list(lh)), "this root is the carry-up shape"
    assert mk.largest_power_of_two_below(3) == 2 and mk.largest_power_of_two_below(5) == 4


# ---------------------------------------------------------------- keyless by construction

def test_control_a_harness_that_tries_to_authenticate_must_be_refused():
    """FAILING CONTROL: keyless is enforced, not promised."""
    for header in ("Authorization", "x-api-key", "Cookie"):
        try:
            cm.get("https://example.invalid/", headers={header: "secret"})
        except cm.CredentialRefused:
            continue
        raise AssertionError(f"{header} was accepted; the harness is not keyless")


def test_visible_text_control_a_phrase_only_inside_a_script_is_not_on_the_page():
    """FAILING CONTROL: a match must come from what a reader sees, not from a JSON blob."""
    html = b'<html><head><script>var x = {"partner":"Chainlink"};</script></head><body>Nothing here.</body></html>'
    text = cm.visible_text(html)
    assert "Chainlink" not in text
    assert corroborate.find_term(text, "Chainlink")[0] is False
    assert corroborate.find_term(cm.visible_text(b"<p>We work with Chainlink today.</p>"), "Chainlink")[0] is True


def test_corroborate_control_word_boundaries_must_not_match_inside_a_longer_word():
    """FAILING CONTROL: 'Ondo' must not be found inside 'rondom'."""
    assert corroborate.find_term("dynamiek rondom de dollar", "Ondo")[0] is False
    assert corroborate.find_term("issued by Ondo Finance", "Ondo")[0] is True


# ---------------------------------------------------------------- CL-3 oracle share

def _pop(rows):
    return [{"name": n, "tvl": t, **({"oracles": o} if o is not None else {})} for n, t, o in rows]


def test_oracle_share_arithmetic_on_a_planted_population():
    r = osh.compute(_pop([("A", 100.0, ["X"]), ("B", 100.0, ["X", "Y"]), ("C", 800.0, None), ("D", 0.0, ["X"])]))
    assert r["protocols_tracked_with_positive_tvl"] == 3
    assert r["tvl_usd_all_tracked_protocols"] == 1000.0
    assert r["protocols_carrying_an_oracles_field"] == 2
    assert r["tvl_usd_with_oracle_attribution"] == 200.0
    assert r["attribution_coverage_pct_of_tracked_tvl"] == 20.0
    s = osh.share_of(r, "X")
    assert s["upper_bound_pct_of_attributed_tvl"] == 100.0     # credited both protocols
    assert s["lower_bound_pct_of_attributed_tvl"] == 50.0      # sole oracle on A only
    assert s["pct_of_all_tracked_defi_tvl_upper_bound"] == 20.0


def test_oracle_share_control_a_dominant_share_of_a_tiny_slice_must_not_read_as_a_majority():
    """FAILING CONTROL: 99% of an attributed slice that is 1% of DeFi is not a majority of DeFi.

    Planted so the numerator looks overwhelming and the denominator does not support it. The
    harness must keep the two apart.
    """
    r = osh.compute(_pop([("A", 99.0, ["X"]), ("B", 1.0, ["Y"]), ("C", 9900.0, None)]))
    s = osh.share_of(r, "X")
    assert s["upper_bound_pct_of_attributed_tvl"] == 99.0
    assert r["attribution_coverage_pct_of_tracked_tvl"] == 1.0
    assert s["pct_of_all_tracked_defi_tvl_upper_bound"] < 1.0, "a slice share leaked out as a whole-market share"


def test_oracle_share_control_an_absent_oracle_must_score_zero_not_be_omitted():
    r = osh.compute(_pop([("A", 10.0, ["X"])]))
    s = osh.share_of(r, "NotAnOracle")
    assert s["upper_bound_pct_of_attributed_tvl"] == 0.0 and s["lower_bound_pct_of_attributed_tvl"] == 0.0


# ---------------------------------------------------------------- CL-5 feed cadence

def _rounds(gaps, price=100.0, t0=1_700_000_000, decimals=8, moves=None):
    out, t, p = [{"round_id": 1, "answer_raw": int(price * 10 ** decimals), "started_at": t0,
                  "updated_at": t0, "answered_in_round": 1}], t0, price
    for i, g in enumerate(gaps, start=2):
        t += g
        p = p * (1 + (moves[i - 2] if moves else 0) / 100)
        out.append({"round_id": i, "answer_raw": int(round(p * 10 ** decimals)), "started_at": t,
                    "updated_at": t, "answered_in_round": i})
    return out


def test_feed_health_control_a_planted_outage_must_be_flagged():
    """FAILING CONTROL: a gap of twice the declared heartbeat must not pass."""
    a = fh.analyse(_rounds([1800, 7200, 1800]), heartbeat_s=3600, threshold_pct=0.5, decimals=8)
    assert a["excess_over_grace_count"] == 1, a
    assert a["excess_max_s"] == 3600
    assert a["interval_excess_buckets"]["over_by_more_than_10pct_of_heartbeat"] == 1
    assert a["intervals_exceeding_heartbeat_beyond_grace"][0]["gap_s"] == 7200


def test_feed_health_control_a_healthy_window_must_pass_clean():
    a = fh.analyse(_rounds([600, 1200, 3599]), heartbeat_s=3600, threshold_pct=0.5, decimals=8)
    assert a["excess_over_grace_count"] == 0
    assert a["intervals_over_declared_heartbeat_zero_tolerance"] == 0
    assert a["pct_of_intervals_within_declared_heartbeat_plus_grace"] == 100.0


def test_feed_health_control_ordinary_write_latency_must_not_be_reported_as_a_miss():
    """FAILING CONTROL in the other direction: the grace must actually apply, and must be visible.

    Real Ethereum DAI/USD rounds land 12-36 s past a declared 3600 s heartbeat. Counting those as
    outages would turn write latency into an allegation; hiding them entirely would be no better.
    """
    a = fh.analyse(_rounds([3612, 3624, 3636]), heartbeat_s=3600, threshold_pct=0.25, decimals=8)
    assert a["excess_over_grace_count"] == 0, "write latency was reported as a heartbeat miss"
    assert a["intervals_over_declared_heartbeat_zero_tolerance"] == 3, "the raw count was hidden"
    assert a["interval_excess_buckets"]["over_by_1_to_60s"] == 3


def test_feed_health_deviation_is_measured_against_the_feeds_own_threshold():
    a = fh.analyse(_rounds([600, 600], moves=[0.6, 0.1]), heartbeat_s=3600, threshold_pct=0.5, decimals=8)
    assert a["intervals_at_or_over_declared_deviation_threshold"] == 1
    assert 0.59 < a["deviation_max_pct"] < 0.61


def test_feed_health_control_an_implausible_decode_must_be_refused_not_published():
    """FAILING CONTROL: a round whose timestamp cannot be real is dropped, never reported as data."""
    good = "0x" + "".join(f"{v:064x}" for v in [7, 100 * 10 ** 8, 1_700_000_000, 1_700_000_000, 7])
    assert fh.decode_round(good)["updated_at"] == 1_700_000_000
    for bad_ts in (0, 1, 1_000_000_000):  # epoch zero, one second, and a pre-feed timestamp
        bad = "0x" + "".join(f"{v:064x}" for v in [7, 100 * 10 ** 8, bad_ts, bad_ts, 7])
        assert fh.decode_round(bad) is None, f"implausible updatedAt {bad_ts} was accepted"
    assert fh.decode_round("0xdeadbeef") is None


def test_feed_health_control_one_round_is_not_a_measurement():
    a = fh.analyse(_rounds([]), heartbeat_s=3600, threshold_pct=0.5, decimals=8)
    assert a["state"] == "UNMEASURED"


def test_feed_health_selectors_match_keccak_where_one_is_installed():
    try:
        from eth_hash.auto import keccak
    except Exception:
        try:
            from Crypto.Hash import keccak as _k

            def keccak(b):  # type: ignore
                return _k.new(digest_bits=256, data=b).digest()
        except Exception:
            return  # no keccak here; the pod's run enforces it
    for sig, sel in fh.SELECTORS.items():
        assert "0x" + keccak(sig.encode()).hex()[:8] == sel, f"{sig} selector drifted"


# ---------------------------------------------------------------- CL-1 restatement watch

def test_restatement_control_one_capture_is_not_a_measurement():
    a = rs.analyse([{"observed_at": "2026-09-22T10:00:00Z", "value": 100}])
    assert a["state"] == "UNMEASURED" and a["distinct_utc_dates"] == 1
    b = rs.analyse([{"observed_at": "2026-09-22T10:00:00Z", "value": 100},
                    {"observed_at": "2026-09-22T23:00:00Z", "value": 101}])
    assert b["state"] == "UNMEASURED", "two readings on one date were treated as a measurement"
    cc = rs.analyse([{"observed_at": "2026-09-22T10:00:00Z", "value": 100},
                     {"observed_at": "2026-09-29T10:00:00Z", "value": 101}])
    assert cc["state"] == "CLAIM_MEASURED"


def test_restatement_control_a_planted_downward_revision_must_be_caught():
    """FAILING CONTROL: a cumulative counter that goes down must raise the review flag."""
    a = rs.analyse([{"observed_at": "2026-09-22T10:00:00Z", "value": 34_177_623_388_199},
                    {"observed_at": "2026-09-29T10:00:00Z", "value": 34_200_000_000_000},
                    {"observed_at": "2026-10-06T10:00:00Z", "value": 30_000_000_000_000}])
    assert a["observed_change_requiring_review"] is True
    assert len(a["downward_revisions"]) == 1 and a["downward_revisions"][0]["direction"] == "down"
    assert "allegation" in a["review_note"]
    rising = rs.analyse([{"observed_at": "2026-09-22T10:00:00Z", "value": 1},
                         {"observed_at": "2026-09-29T10:00:00Z", "value": 2}])
    assert rising["observed_change_requiring_review"] is False, "a rising counter raised a review flag"


def test_restatement_control_the_extractor_must_refuse_to_guess():
    """FAILING CONTROL: no label, no number. The extractor must not grab a nearby figure."""
    page = "$ 34,177,623,388,199 transaction value enabled  •  1,234,567 nodes"
    assert rs.extract_labelled_number(page, "transaction value enabled")[0] == 34_177_623_388_199
    assert rs.extract_labelled_number(page, "total value locked")[0] is None
    assert rs.extract_labelled_number("transaction value enabled", "transaction value enabled")[0] is None
    # and it must follow the label, not a hard-coded value
    moved = "$ 41,000,000,000,000 transaction value enabled"
    assert rs.extract_labelled_number(moved, "transaction value enabled")[0] == 41_000_000_000_000


# ---------------------------------------------------------------- presence baseline

def test_presence_control_a_planted_removal_must_be_detected_without_an_allegation():
    before = {"page_sha256": "aa", "names": {"Swift": {"present": True}, "Aave": {"present": True}}}
    after = {"page_sha256": "bb", "names": {"Swift": {"present": False}, "Aave": {"present": True}}}
    d = presence.diff(before, after)
    assert d["removed_since_baseline"] == ["Swift"] and d["observed_change_requiring_review"] is True
    assert "not an allegation" in d["review_note"]
    same = presence.diff(before, before)
    assert same["observed_change_requiring_review"] is False and same["review_note"] is None


# ---------------------------------------------------------------- language boundary

def test_control_no_module_may_emit_an_accusation():
    """FAILING CONTROL: scan every harness's own output vocabulary for words we do not get to use."""
    import re
    # \b on every pattern: without it "lied" matches inside "implied" and the control fires on
    # its own disclaimer text. A scanner that cries wolf gets switched off, so it is bounded here.
    banned = [r"\bis false\b", r"\blied\b", r"\blying\b", r"\bfalsehoods?\b", r"\bmisleading\b",
              r"\bmisrepresent\w*\b", r"\bdeceptive\b", r"\bfrauds?\b", r"\bdisproven\b", r"\bdebunk\w*\b"]
    here = os.path.dirname(os.path.abspath(__file__))
    scanned = 0
    for fn in sorted(os.listdir(here)):
        if not fn.endswith(".py") or fn.startswith("test_"):
            continue
        scanned += 1
        src = open(os.path.join(here, fn), encoding="utf-8").read().lower()
        lines = src.splitlines()
        for pat in banned:
            for i, line in enumerate(lines):
                if not re.search(pat, line):
                    continue
                # Allowed only inside an explicit disclaimer. Prose wraps, so the disclaimer may
                # open on the line above: the window is the match line and the one before it.
                ctx = (lines[i - 1] if i else "") + " " + line
                assert ("not " in ctx or "never" in ctx or "no finding" in ctx), f"{fn}: {line.strip()[:90]}"
    assert scanned >= 6, f"the scanner only saw {scanned} modules; it is not covering the package"
    # FAILING CONTROL for the control: a planted accusation must be caught.
    probe = 'the claim is false and the vendor lied about it'
    assert any(re.search(p, probe) for p in banned), "the accusation scanner does not detect an accusation"


def _tests():
    return [(k, v) for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]


def show_controls() -> None:
    """Print what each harness ACTUALLY SAYS when fed the planted input it must reject.

    The assertions above prove the controls hold. This prints the rejection itself, so the
    failing case is visible in a run log rather than only implied by a green test.
    """
    print("=== CONTROL 1: RFC 9162 inclusion proof, one byte of the leaf changed")
    d = [b"a", b"b", b"c", b"d", b"e"]
    root, path = mk.mth(d), mk.inclusion_proof(d, 2)
    print(f"  intact leaf  verify_inclusion -> {mk.verify_inclusion(d[2], 2, 5, path, root)}")
    print(f"  tampered leaf verify_inclusion -> {mk.verify_inclusion(d[2] + chr(0).encode(), 2, 5, path, root)}  <- MUST be False")

    print("=== CONTROL 2: feed cadence, a planted gap of twice the declared heartbeat")
    a = fh.analyse(_rounds([1800, 7200, 1800]), heartbeat_s=3600, threshold_pct=0.5, decimals=8)
    print("  " + json.dumps({k: a[k] for k in ("excess_max_s", "excess_over_grace_count",
                                               "interval_excess_buckets")}))
    print("  flagged interval: " + json.dumps(a["intervals_exceeding_heartbeat_beyond_grace"][0]))

    print("=== CONTROL 3: feed cadence, ordinary write latency must NOT be flagged")
    b = fh.analyse(_rounds([3612, 3624, 3636]), heartbeat_s=3600, threshold_pct=0.25, decimals=8)
    print("  " + json.dumps({k: b[k] for k in ("excess_over_grace_count",
                                               "intervals_over_declared_heartbeat_zero_tolerance",
                                               "interval_excess_buckets")}))

    print("=== CONTROL 4: on-chain decode, a planted implausible updatedAt")
    bad = "0x" + "".join(f"{v:064x}" for v in [7, 100 * 10 ** 8, 1, 1, 7])
    print(f"  decode_round(updatedAt=1) -> {fh.decode_round(bad)}  <- MUST be None")

    print("=== CONTROL 5: oracle share, 99% of a slice that is 1% of DeFi")
    r = osh.compute(_pop([("A", 99.0, ["X"]), ("B", 1.0, ["Y"]), ("C", 9900.0, None)]))
    print("  " + json.dumps({"coverage_pct_of_tracked_tvl": r["attribution_coverage_pct_of_tracked_tvl"],
                             **osh.share_of(r, "X")}))

    print("=== CONTROL 6: restatement watch, a planted downward revision")
    x = rs.analyse([{"observed_at": "2026-09-22T10:00:00Z", "value": 34_177_623_388_199},
                    {"observed_at": "2026-10-06T10:00:00Z", "value": 30_000_000_000_000}])
    print("  " + json.dumps({k: x[k] for k in ("state", "observed_change_requiring_review",
                                               "downward_revisions", "review_note")}))

    print("=== CONTROL 7: restatement extractor, the label removed")
    page = "$ 34,177,623,388,199 transaction value enabled"
    print(f"  label present -> {rs.extract_labelled_number(page, 'transaction value enabled')[0]}")
    print(f"  label absent  -> {rs.extract_labelled_number(page, 'total value locked')[0]}  <- MUST be None")

    print("=== CONTROL 8: corroboration, the term only inside a <script> block")
    html = b'<html><script>var x={"partner":"Chainlink"};</script><body>Nothing here.</body></html>'
    print(f"  find_term on visible text -> {corroborate.find_term(cm.visible_text(html), 'Chainlink')[0]}  <- MUST be False")
    print(f"  'Ondo' inside 'rondom'    -> {corroborate.find_term('dynamiek rondom de dollar', 'Ondo')[0]}  <- MUST be False")

    print("=== CONTROL 9: keyless by construction, a harness that tries to authenticate")
    try:
        cm.get("https://example.invalid/", headers={"Authorization": "Bearer x"})
        print("  NO REFUSAL  <- control FAILED")
    except cm.CredentialRefused as e:
        print(f"  CredentialRefused: {e}  <- MUST raise")

    print("=== CONTROL 10: presence baseline, a planted removal")
    print("  " + json.dumps(presence.diff(
        {"page_sha256": "aa", "names": {"Swift": {"present": True}}},
        {"page_sha256": "bb", "names": {"Swift": {"present": False}}})))


if __name__ == "__main__":
    if "--controls" in sys.argv:
        show_controls()
        sys.exit(0)
    failed = 0
    for name, fn in _tests():
        try:
            fn()
            print(f"PASS {name}")
        except Exception as e:
            failed += 1
            print(f"FAIL {name}: {type(e).__name__}: {e}")
    print(f"\n{len(_tests()) - failed}/{len(_tests())} passed")
    sys.exit(1 if failed else 0)
