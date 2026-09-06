"""Tests for the benchmark-quality register v1.

    python3 scripts/benchmark_quality/test_register.py

THE TEST THAT MATTERS IS test_every_predicate_can_flip. A guard nobody has watched fail
is not a guard, and a register whose cells cannot move is a table of constants dressed as
a measurement. So for every one of the 35 predicates this file takes the real fixture,
mutates it, and asserts the cell changed. If a predicate cannot be made to flip, the test
names it and fails — because that predicate is either unreachable or vacuous.

The second thing under test is the shell gate: a client-rendered results surface must
produce UNMEASURED and never FAIL. Recording "this publisher does not publish confidence
intervals" from a page that returned an empty div would be a fabricated finding about a
real company, and it is the single most likely way this register could libel someone.
"""
from __future__ import annotations

import json
import pathlib
import re
import shutil
import sys
import tempfile

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import predicates as PD  # noqa: E402
import register as R  # noqa: E402

FAILURES: list[str] = []
CHECKS = 0


def check(cond: bool, msg: str) -> None:
    global CHECKS
    CHECKS += 1
    if not cond:
        FAILURES.append(msg)


# ── 1. catalogue integrity ───────────────────────────────────────────────────────────
def test_catalogue() -> None:
    check(len(PD.P) >= 30, f"register v1 needs >=30 predicates, has {len(PD.P)}")
    check(len({p["id"] for p in PD.P}) == len(PD.P), "duplicate predicate id")
    check(len(PD.GROUPS) == 7, f"expected 7 groups, got {len(PD.GROUPS)}")
    known_on = {"robots", "board", "board_raw", "board_href", "machine"}
    for p in PD.P:
        check(p["on"] in known_on, f"{p['id']}: unknown artifact key {p['on']!r}")
        check(len(p["question"]) > 20, f"{p['id']}: question is not a question")
        check(len(p["why"]) > 20, f"{p['id']}: no one-line why")
        check(bool(p["evidence_type"]), f"{p['id']}: no evidence type")
    for g, _ in PD.GROUPS:
        check(any(p["group"] == g for p in PD.P), f"group {g} has no predicates")


# ── 2. the fetch budget is identical for everyone, us included ───────────────────────
def test_budget_is_symmetric() -> None:
    sys.path.insert(0, str(HERE))
    import fetch  # noqa: PLC0415

    for pid, spec in fetch.PLAN.items():
        check(len(spec["fetch"]) <= fetch.FETCH_BUDGET,
              f"{pid}: {len(spec['fetch'])} fetches exceeds the budget of {fetch.FETCH_BUDGET}")
    sizes = {pid: len(s["fetch"]) for pid, s in fetch.PLAN.items()}
    check(len(set(sizes.values())) == 1,
          f"the fetch budget is not identical across publishers: {sizes}")
    check(sizes.get("council-of-ai") == max(sizes.values()),
          "we must not grade ourselves from more artifacts than anyone else")


# ── 3. THE FLIP TEST ─────────────────────────────────────────────────────────────────
# For each predicate, build a fixture set in which it must land on the OTHER verdict.
# A predicate that cannot be flipped is reported by id, not silently skipped.
FLIP_TEXT = {
    "method_page_linked": ("board", 'href="/methodology"'),
    "scorer_named_on_board": ("board", "scored by exact match"),
    "structured_data_on_board": ("board", '<script type="application/ld+json">{}</script>'),
    "changelog_linked": ("board", 'href="/changelog"'),
    "limitations_stated": ("board", "Known limitation: this is not a guarantee."),
    "item_data_channel_linked": ("board", 'href="https://huggingface.co/datasets/x/y"'),
    "item_count_published_on_board": ("board", "12,345 items"),
    "held_out_set_declared": ("board", "a private test set is kept private"),
    "code_repository_linked": ("board", 'href="https://github.com/x/y"'),
    "run_command_published": ("board", "pip install thing"),
    "environment_pinning_stated": ("board", "runs in a Docker container with a fixed seed"),
    "stranger_recompute_path_complete": (
        "board", 'href="https://huggingface.co/datasets/x/y" href="https://github.com/x/y" pip install thing'),
    "uncertainty_shown_beside_scores": ("board", "72.1 ± 1.4"),
    "sample_size_shown_beside_scores": ("board", "n = 412"),
    "separation_rule_published": ("board", "systems whose 95% CI overlap are statistically indistinguishable"),
    "minimum_n_rule_published": ("board", "we do not publish a figure below n >= 30"),
    "repeats_or_variance_disclosed": ("board", "averaged over 5 runs, standard deviation reported"),
    "as_of_date_on_board": ("board", "Updated 2026-09-01"),
    "as_of_within_30_days": ("board", "Updated 2026-09-01"),
    "machine_readable_channel_linked": ("board", 'href="/api/results.json"'),
    "status_or_uptime_page_linked": ("board", 'href="https://status.example.org/"'),
    "results_carry_a_signature": ("board", "each row carries an Ed25519 detached signature"),
    "verification_key_published": ("board", 'href="/.well-known/did.json"'),
    "transparency_log_or_witness": ("board", "every root is witnessed in Rekor with an inclusion proof"),
    "content_hash_published": ("board", "sha-256 of the release file"),
    "persistent_identifier_published": ("board", 'href="https://doi.org/10.5281/zenodo.1"'),
    "corrections_route_published": ("board", "to report an error in a figure, write to us"),
    "corrections_ledger_public": ("board", "see our corrections log"),
    "funding_or_ownership_disclosed": ("board", "Example Analytics Ltd , funded by a public grant"),
    "commercial_offering_disclosed": ("board", 'contact sales for an enterprise plan'),
    "results_licence_stated_on_board": ("board", "these results are released under CC-BY-4.0"),
}


def _clone(dest: pathlib.Path, pid: str) -> pathlib.Path:
    shutil.copytree(R.FIXTURES / pid, dest / pid)
    return dest / pid


# Two publishers, because one is not enough: the Hugging Face dataset index carries no
# source-repository record, so code_licence_machine_readable is UNMEASURED for every
# HF-indexed publisher and can only be exercised against a GitHub-indexed one.
FLIP_SUBJECTS = ["council-of-ai", "uk-aisi-inspect"]


def _flip_once(tmp: pathlib.Path, subject: str, p: dict, before: str) -> str | None:
    """Mutate the fixture so predicate `p` must land on the other verdict. Returns the
    new verdict, or None if this predicate has no defined mutation."""
    pid_ = p["id"]
    d = tmp / f"{pid_}-{subject}"
    d.mkdir(parents=True, exist_ok=True)
    _clone(d, subject)

    board = d / subject / "board.body"
    if p["kind"] in ("regex", "date", "all_of") or pid_ in FLIP_TEXT:
        if pid_ not in FLIP_TEXT and p["kind"] != "regex":
            return None
        if before == "PASS":
            board.write_text("<html><body>" + ("word " * 200) + "</body></html>")
        else:
            _, inject = FLIP_TEXT.get(pid_, ("board", ""))
            if not inject:
                return None
            board.write_text("<html><body>" + ("word " * 200) + inject + "</body></html>")
    elif p["kind"] == "robots":
        rb = d / subject / "robots.body"
        rb.write_text("User-agent: *\nDisallow: /\n" if before == "PASS"
                      else "User-agent: *\nAllow: /\n")
    elif p["kind"] == "json":
        mb = d / subject / "machine.body"
        if before == "PASS" and p.get("probe") == "index_nonempty":
            mb.write_text("[]")   # the only mutation that can move an attribution predicate
        elif before == "PASS":
            # RECORDS PRESENT, LICENCE ABSENT — not an empty index. An empty index sends the
            # licence predicates to UNMEASURED ("no record to read a licence from"), which is
            # correct behaviour and therefore useless as a flip: it never proves the predicate
            # can say FAIL. The mutation has to leave the record and remove the field.
            mb.write_text(json.dumps({"items": [
                {"full_name": "UKGovernmentBEIS/inspect_ai", "license": None},
                {"id": "csoai/x"}]}))
        else:
            mb.write_text(json.dumps({"items": [
                {"full_name": "UKGovernmentBEIS/inspect_ai", "license": {"spdx_id": "MIT"}}]}))
    else:
        return None

    real = R.FIXTURES
    R.FIXTURES = d
    try:
        return R.evaluate(subject)[pid_]["result"]
    finally:
        R.FIXTURES = real


def test_every_predicate_can_flip() -> None:
    base = {s_: R.evaluate(s_) for s_ in FLIP_SUBJECTS}
    unflippable = []
    with tempfile.TemporaryDirectory() as td:
        tmp = pathlib.Path(td)
        for p in PD.P:
            pid_ = p["id"]
            moved = []
            for subject in FLIP_SUBJECTS:
                before = base[subject][pid_]["result"]
                after = _flip_once(tmp, subject, p, before)
                if after is None:
                    continue
                # A FLIP MUST BE PASS<->FAIL. Sliding to UNMEASURED is what happens when the
                # fixture path is wrong and NOTHING is read — the first version of this test
                # did exactly that and reported every predicate as flippable. Requiring the
                # pair {PASS, FAIL} is what makes this test able to fail.
                if {before, after} == {"PASS", "FAIL"}:
                    moved.append(f"{subject}:{before}->{after}")
                elif before == "UNMEASURED" and after == "PASS":
                    moved.append(f"{subject}:UNMEASURED->PASS")
                elif p.get("directional") and {before, after} == {"PASS", "UNMEASURED"}:
                    # ONE predicate is allowed to be two-valued, and only because it says so
                    # in the catalogue: an empty index result is a fact about the search term.
                    moved.append(f"{subject}:{before}->{after} (declared directional)")
            if not moved:
                unflippable.append(
                    f"{pid_} could not be moved between PASS and FAIL on any of {FLIP_SUBJECTS}"
                    + ("" if p.get("directional") else
                       " — and it does not declare itself directional, so it is vacuous"))
    check(sum(1 for p in PD.P if p.get("directional")) <= 1,
          "more than one predicate exempts itself from PASS/FAIL; that exemption must stay rare")

    for u in unflippable:
        FAILURES.append("UNFLIPPABLE: " + u)
    check(not unflippable, f"{len(unflippable)} predicate(s) could not be made to change verdict")


# ── 4. a client-rendered shell must never produce FAIL ───────────────────────────────
def test_shell_is_unmeasured_never_fail() -> None:
    with tempfile.TemporaryDirectory() as td:
        tmp = pathlib.Path(td)
        _clone(tmp, "council-of-ai")
        (tmp / "council-of-ai" / "board.body").write_text('<html><body><div id="root"></div></body></html>')
        real = R.FIXTURES
        R.FIXTURES = tmp
        try:
            res = R.evaluate("council-of-ai")
        finally:
            R.FIXTURES = real
    board_preds = [p["id"] for p in PD.P if p["on"].startswith("board")]
    for pid_ in board_preds:
        check(res[pid_]["result"] == "UNMEASURED",
              f"{pid_}: a client-rendered shell produced {res[pid_]['result']}, not UNMEASURED")
        check(bool(res[pid_].get("reason")), f"{pid_}: UNMEASURED with no reason")


# ── 5. the committed register is what these fixtures produce ─────────────────────────
def test_no_drift() -> None:
    reg = R.build()
    for path, content in R.outputs(reg).items():
        check(path.exists(), f"missing output {path}")
        if path.exists():
            check(path.read_text() == content, f"DRIFT in {path.relative_to(R.ROOT)}")


# ── 6. doctrine, enforced on the emitted bytes ───────────────────────────────────────
def test_doctrine() -> None:
    reg = R.build()
    blob = json.dumps(reg)

    for pid, row in reg["publishers"].items():
        check(row["status"] == "STAGED", f"{pid}: status is {row['status']}, must be STAGED before signing")
        for k, v in row["predicates"].items():
            check(v["result"] in ("PASS", "FAIL", "UNMEASURED"), f"{pid}/{k}: bad result {v['result']}")
            if v["result"] == "UNMEASURED":
                check(bool(v.get("reason")), f"{pid}/{k}: UNMEASURED carries no reason")
            check(v["result"] != 0 and v["result"] != "0", f"{pid}/{k}: UNMEASURED rendered as a zero")

    for pid, row in reg["publishers"].items():
        check(row["status"] != "MEASURED", f"{pid}: the producer wrote MEASURED; only the signer may")

    # no prices anywhere, including inside quoted evidence
    check(not re.search(r"[$£€]\s?\d", blob), "a price appears in the register")
    check(not re.search(r"\b\d+\s?(?:USD|GBP|EUR)\b", blob), "a price appears in the register")

    # NO COMPARATIVE LANGUAGE — checked over the strings WE WROTE ABOUT SUBJECTS, which is
    # the thing the rule is actually about. Checking the whole blob was worse than useless:
    # it fired on our own disclaimer ("whether one publisher is better than another") and on
    # a publisher's own page text quoted inside an evidence context ("from leading AI labs").
    # A guard that matches its own disclaimer teaches you to delete the disclaimer.
    authored = " ".join(
        [reg["register"]]
        + [p["question"] + " " + p["why"] + " " + p["evidence_type"] for p in reg["predicate_catalogue"]]
        + [g["what"] for g in reg["groups"]]
        + [row.get("note", "") for row in reg["publishers"].values()]
    ).lower()
    for word in ("best", "worst", "leading", "top-ranked", "winner", "outperforms",
                 "better than", "worse than", "gold standard", "most rigorous", "trusted"):
        check(word not in authored, f"comparative language in an authored string: {word!r}")
    for word in ("certified", "certification of", "accredited", "approved", "endorse",
                 "verified by us", "seal of"):
        check(word not in authored, f"certification language in an authored string: {word!r}")
    check("not_a_certificate" in blob and reg["not_a_certificate"] is True,
          "the register does not carry not_a_certificate")
    check(reg["endorsement"] == "none" and reg["solicited"] is False,
          "the register does not disclaim endorsement and solicitation")

    # the self-assessed row is flagged wherever it appears
    check(reg["publishers"]["council-of-ai"]["self_assessed"] is True, "our row is not flagged self_assessed")
    check(reg["self_assessment"]["declared"] is True, "self-assessment is not declared at the top level")
    for pid, row in reg["publishers"].items():
        check(row["self_assessed"] == (pid == "council-of-ai"), f"{pid}: self_assessed flag is wrong")

    # every result carries evidence bytes
    for pid, row in reg["publishers"].items():
        for k, v in row["predicates"].items():
            e = v["evidence"]
            if v["result"] != "UNMEASURED" or e.get("sha256"):
                check(bool(e.get("sha256")), f"{pid}/{k}: result with no evidence hash")
                check(bool(e.get("fetched")), f"{pid}/{k}: result with no fetch date")
                check(bool(e.get("source_url")), f"{pid}/{k}: result with no source URL")


# ── 6b. every recorded hash covers the file a stranger will actually open ────────────
def test_evidence_hash_covers_the_file() -> None:
    """The first version of the fetcher recorded curl's %{size_download} as `bytes` while
    writing the DECODED body to disk, so one artifact claimed 624,653 bytes against a
    5,139,029 byte file. The hash was right and the number beside it was not, which is worse
    than no number: anyone checking `shasum -a 256` against `wc -c` would have found a
    contradiction in the evidence and been right to stop reading. This asserts the hash and
    the byte count both describe the file that is committed."""
    import hashlib  # noqa: PLC0415

    n = 0
    for meta_path in sorted(R.FIXTURES.glob("*/*.meta.json")):
        m = json.loads(meta_path.read_text())
        body = (meta_path.parent / m["body_file"]).read_bytes()
        check(hashlib.sha256(body).hexdigest() == m["sha256"],
              f"{meta_path}: sha256 does not cover the committed body")
        check(m.get("bytes_decoded") == len(body),
              f"{meta_path}: bytes_decoded {m.get('bytes_decoded')} != file length {len(body)}")
        check("bytes" not in m, f"{meta_path}: ambiguous `bytes` key is back")
        n += 1
    check(n == 24, f"expected 24 committed artifacts (8 publishers x 3), found {n}")


# ── 7. cards stay within the 3 KB leaf cap ───────────────────────────────────────────
def test_card_size() -> None:
    reg = R.build()
    for pid in reg["publishers"]:
        body = json.dumps(R.card(reg, pid)["payload"], separators=(",", ":"), sort_keys=True).encode()
        check(len(body) <= R.MAX_CARD_PAYLOAD_BYTES,
              f"card {pid}: payload {len(body)} bytes exceeds {R.MAX_CARD_PAYLOAD_BYTES}")


# ── 8. the MEASURED gate is a real threshold ─────────────────────────────────────────
def test_measured_gate() -> None:
    reg = R.build()
    check(reg["measured_gate"]["threshold_resolved"] >= 30, "the MEASURED gate is below n>=30")
    for pid, row in reg["publishers"].items():
        if row["n"]["resolved"] < reg["measured_gate"]["threshold_resolved"]:
            check(row["status"] == "STAGED",
                  f"{pid}: resolved {row['n']['resolved']} is under the gate and must not be signable")


def main() -> int:
    for fn in (test_catalogue, test_budget_is_symmetric, test_every_predicate_can_flip,
               test_shell_is_unmeasured_never_fail, test_no_drift, test_doctrine,
               test_evidence_hash_covers_the_file, test_card_size, test_measured_gate):
        fn()
    if FAILURES:
        print(f"FAIL — {len(FAILURES)} of {CHECKS} checks failed:")
        for f in FAILURES:
            print("  " + f)
        return 1
    print(f"OK — {CHECKS} checks passed across {len(PD.P)} predicates and "
          f"{len(R.PUBLISHERS)} publishers.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
