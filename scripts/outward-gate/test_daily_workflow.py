#!/usr/bin/env python3
"""Invariants of .github/workflows/outward-gate-daily.yml, and the one property of the gate it leans on.

The daily scorecard moved to a GitHub runner on 13 Oct 2026: the Oracle cron that made it had been
skipped on a free-disk floor since its 8 Oct run. The workflow promises three things and these tests
pin each one, so a later edit cannot quietly break it:

  1. It only reads. One permission (contents: read), no secret, no token: it cannot write anywhere.
  2. It reports and does not block. A score below 100% never turns the run red.
  3. It cannot hide a run that did not measure. No rules, no scorecard or no read of the live board
     turns the run red, because on a green run that would look like a real (and wrong) scorecard.

The workflow is read as text (this repo's gates carry no YAML dependency), with comments stripped
first, so a sentence in a comment can neither satisfy nor trip a test. The two inline scripts are not
read for phrases: they are lifted out of the workflow and run, on a clean input and on doctored ones.

    python3 -m unittest -v test_daily_workflow.py
"""
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import textwrap
import unittest
from unittest import mock

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
WF_PATH = os.path.join(REPO, ".github", "workflows", "outward-gate-daily.yml")
GATE_CMD = "python3 scripts/outward-gate/outward_gate.py run --artifacts live --out out/"

sys.path.insert(0, HERE)
import outward_gate as g  # noqa: E402


def read_wf():
    with open(WF_PATH, encoding="utf-8") as f:
        return f.read()


def code(text):
    """The workflow without its comments: whole-line comments dropped, trailing ' # ...' cut."""
    out = []
    for line in text.split("\n"):
        if re.match(r"\s*#", line):
            continue
        out.append(re.sub(r"\s+#\s.*$", "", line))
    return "\n".join(out)


def steps(text):
    """The job's steps in order, each as (name, raw block). A step starts at a six-space '- '."""
    body = code(text)
    start = body.index("\n    steps:\n")
    blocks = re.split(r"\n(?=      - )", body[start:])[1:]
    out = []
    for b in blocks:
        m = re.search(r"^\s+(?:- )?name:\s*(.+)$", b, re.M) or re.search(r"^\s+- uses:\s*(.+)$", b, re.M)
        out.append((m.group(1).strip() if m else "", b))
    return out


def step(text, name_re):
    hits = [b for n, b in steps(text) if re.search(name_re, n)]
    if len(hits) != 1:
        raise AssertionError("expected exactly one step matching %r, found %d" % (name_re, len(hits)))
    return hits[0]


def inline_python(block):
    """The body of the step's python3 heredoc, dedented, exactly as the runner would execute it."""
    m = re.search(r"python3 - <<'PY'\n(.*?)\n\s*PY\s*$", block, re.S | re.M)
    if not m:
        raise AssertionError("no python3 heredoc in this step")
    return textwrap.dedent(m.group(1)) + "\n"


class TestTriggers(unittest.TestCase):
    def setUp(self):
        self.wf = read_wf()
        self.code = code(self.wf)

    def on_block(self):
        m = re.search(r"^on:\n((?:[ \t]+.*\n|\n)+)", self.code, re.M)
        self.assertIsNotNone(m, "no top-level on: block")
        return m.group(1)

    def test_runs_once_a_day_and_by_hand(self):
        crons = re.findall(r"^\s*- cron:\s*(.+)$", self.code, re.M)
        self.assertEqual(len(crons), 1, "exactly one schedule: %r" % crons)
        m = re.match(r'^"(\d{1,2}) (\d{1,2}) \* \* \*"$', crons[0].strip())
        self.assertIsNotNone(m, "the schedule must be one fixed minute and hour every day, got %s" % crons[0])
        self.assertTrue(0 <= int(m.group(1)) <= 59 and 0 <= int(m.group(2)) <= 23)
        self.assertNotEqual(int(m.group(1)), 0, "keep it off the top of the hour, where GitHub drops crons under load")
        self.assertRegex(self.on_block(), r"(?m)^  workflow_dispatch:")

    def test_no_trigger_beyond_schedule_manual_and_its_own_pull_request(self):
        keys = re.findall(r"(?m)^  ([a-z_]+):", self.on_block())
        self.assertIn("schedule", keys)
        self.assertIn("workflow_dispatch", keys)
        self.assertLessEqual(set(keys), {"schedule", "workflow_dispatch", "pull_request"}, keys)

    def test_a_pull_request_runs_it_only_when_this_file_changes(self):
        # Each run is a few hundred requests to the live site. A pull_request trigger without this
        # filter would send them on every push of every lane.
        block = self.on_block()
        if "pull_request" not in block:
            return
        m = re.search(r"(?m)^  pull_request:\n    paths:\n((?:      - .+\n)+)", block)
        self.assertIsNotNone(m, "pull_request must carry a paths filter")
        paths = [p.strip().strip("\"'") for p in re.findall(r"- (.+)", m.group(1))]
        self.assertEqual(paths, [".github/workflows/outward-gate-daily.yml"])
        after = block[m.end():]
        self.assertNotRegex(after, r"(?m)^    [a-z-]+:", "pull_request carries nothing but the paths filter")


class TestReadOnly(unittest.TestCase):
    def setUp(self):
        self.code = code(read_wf())

    def test_the_only_permission_is_contents_read(self):
        blocks = re.findall(r"(?m)^( *)permissions:[ \t]*(.*)\n((?:\1 +.*\n)*)", self.code)
        self.assertEqual(len(blocks), 1, "one permissions block, at the top level")
        indent, inline, body = blocks[0]
        self.assertEqual(indent, "", "permissions is set for the whole workflow, not per job")
        self.assertEqual(inline.strip(), "")
        self.assertEqual([l.strip() for l in body.splitlines() if l.strip()], ["contents: read"])

    def test_no_secret_and_no_token_reaches_any_step(self):
        for needle in ("secrets.", "github.token", "GITHUB_TOKEN", "GH_TOKEN", "id-token"):
            self.assertNotIn(needle, self.code, needle)
        self.assertRegex(self.code, r"persist-credentials:\s*false")

    def test_no_step_writes_sends_or_publishes(self):
        # Belt, not braces: the permission and token tests above are what make writing impossible.
        banned = (r"\bgit\s+(?:push|commit|add|tag|merge)\b|\bgh\s+(?:pr|issue|api|workflow|release|run|repo)\b|"
                  r"\bwrangler\b|\bnpm\s+publish\b|\btwine\b|\bhuggingface-cli\b|\bhf\s+upload\b|\bsendmail\b|\bcurl\b")
        self.assertIsNone(re.search(banned, self.code), re.search(banned, self.code))

    def test_no_expression_is_interpolated_into_a_script(self):
        # Nothing here needs ${{ }}. None at all means no input can reach a shell line.
        self.assertNotIn("${{", self.code)


class TestRunsTheGate(unittest.TestCase):
    def setUp(self):
        self.wf = read_wf()
        self.code = code(self.wf)
        self.names = [n for n, _ in steps(self.wf)]

    def idx(self, name_re):
        hits = [i for i, n in enumerate(self.names) if re.search(name_re, n)]
        self.assertEqual(len(hits), 1, "%r in %r" % (name_re, self.names))
        return hits[0]

    def test_it_scores_masters_gate(self):
        co = step(self.wf, r"^actions/checkout@")
        self.assertRegex(co, r"(?m)^\s+ref:\s*master\s*$")

    def test_the_command_is_the_gate_over_the_live_surfaces_once(self):
        # executed lines only: the summary step also prints the command as text
        ran = re.findall(r"(?m)^\s+(?:run:\s*)?python3 scripts/outward-gate/outward_gate\.py run\b.*$", self.code)
        self.assertEqual(len(ran), 1, ran)
        run = step(self.wf, r"^Run the outward gate")
        self.assertRegex(run, r"(?m)^\s+run:\s*%s\s*$" % re.escape(GATE_CMD))

    def test_node_and_the_preflight_come_before_the_first_request(self):
        self.assertLess(self.idx(r"^actions/setup-node@"), self.idx(r"^Preflight"))
        self.assertLess(self.idx(r"^Preflight"), self.idx(r"^Run the outward gate"))

    def test_a_crash_of_the_gate_cannot_be_swallowed(self):
        self.assertNotIn("continue-on-error", self.code)
        run = step(self.wf, r"^Run the outward gate")
        self.assertNotRegex(run, r"\|\|")
        self.assertNotRegex(run, r"(?m)^\s+if:")

    def test_scorecard_is_uploaded_and_summarised_even_when_a_step_failed(self):
        up = step(self.wf, r"^Upload the scorecard")
        self.assertRegex(up, r"uses:\s*actions/upload-artifact@v4")
        self.assertIn("out/scorecard.json", up)
        self.assertIn("out/SCORECARD.md", up)
        self.assertRegex(up, r"(?m)^\s+if:\s*always\(\)\s*$")
        sm = step(self.wf, r"^Scorecard to the job summary")
        self.assertIn('>> "$GITHUB_STEP_SUMMARY"', sm)
        self.assertIn("out/SCORECARD.md", sm)
        self.assertRegex(sm, r"(?m)^\s+if:\s*always\(\)\s*$")

    def test_the_measured_check_is_last_and_runs_only_after_a_clean_gate_run(self):
        i = self.idx(r"^The gate measured")
        self.assertEqual(i, len(self.names) - 1)
        self.assertNotRegex(step(self.wf, r"^The gate measured"), r"(?m)^\s+if:")


def scorecard(at_100, artifacts, fails, live):
    return {"schema": "csoai.outward-gate/0.1", "meta": {"live": live},
            "summary": {"artifacts": artifacts, "at_100": at_100, "fails": fails, "fails_by_owner": {}}}


class TestMeasuredCheck(unittest.TestCase):
    """The workflow's last step, lifted out and run. It may fail a run that did not measure. It may
    never fail a run for its scores."""
    BOARD = {"axes": 23, "measured": 23, "unmeasured": 0}

    def setUp(self):
        self.script = inline_python(step(read_wf(), r"^The gate measured"))

    def run_on(self, doc):
        with tempfile.TemporaryDirectory() as d:
            os.mkdir(os.path.join(d, "out"))
            if doc is not None:
                with open(os.path.join(d, "out", "scorecard.json"), "w", encoding="utf-8") as f:
                    json.dump(doc, f)
            return subprocess.run([sys.executable, "-"], input=self.script, cwd=d, capture_output=True, text=True, timeout=60)

    def test_nothing_at_100_is_a_report_not_a_failure(self):
        r = self.run_on(scorecard(0, 20, 141, self.BOARD))
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("0 of 20", r.stdout)

    def test_everything_at_100_passes_the_same_way(self):
        self.assertEqual(self.run_on(scorecard(20, 20, 0, self.BOARD)).returncode, 0)

    def test_no_scorecard_fails(self):
        self.assertNotEqual(self.run_on(None).returncode, 0)

    def test_no_artifact_scored_fails_as_unmeasured(self):
        r = self.run_on(scorecard(0, 0, 0, self.BOARD))
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("UNMEASURED", r.stderr)

    def test_board_not_read_fails_as_unmeasured(self):
        # A runner refused at the edge, or a site that is down: every artifact FAILs, none for its own reason.
        for live in ({}, None, {"axes": None}, {"tools": 19}):
            r = self.run_on(scorecard(0, 20, 141, live))
            self.assertNotEqual(r.returncode, 0, live)
            self.assertIn("UNMEASURED", r.stderr)


class TestPreflight(unittest.TestCase):
    """The workflow's preflight, lifted out and run from the repo root as the runner runs it."""

    def setUp(self):
        self.script = inline_python(step(read_wf(), r"^Preflight"))

    def run_with(self, path):
        env = dict(os.environ, PATH=path)
        return subprocess.run([sys.executable, "-"], input=self.script, cwd=REPO, env=env, capture_output=True, text=True, timeout=120)

    def test_without_node_the_run_stops_as_unmeasured(self):
        with tempfile.TemporaryDirectory() as empty:
            r = self.run_with(empty)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn("UNMEASURED", r.stderr)

    def test_with_node_and_the_rules_file_it_passes(self):
        if not shutil.which("node") or not os.path.exists(os.path.join(REPO, "scripts", "brand-gate.mjs")):
            self.skipTest("node or scripts/brand-gate.mjs not available")
        r = self.run_with(os.environ.get("PATH", ""))
        self.assertEqual(r.returncode, 0, r.stderr)
        self.assertIn("brand-gate rules loaded", r.stdout)


class TestGateReportsAndDoesNotBlock(unittest.TestCase):
    """The workflow relies on this: the gate's exit code says whether it ran, never what it scored.
    If the gate ever learns to exit non-zero on a FAIL, the daily job turns red on every imperfect day
    and stops being a report. This is the test that says so before that change merges."""

    class FakeCtx(g.Ctx):
        def load(self):  # the real load() is the network read of the board, the MCP server and the DID
            self.live, self.did_status = {"axes": 23}, 200
            return self

    @staticmethod
    def failing(ctx, kind, name):
        return {"id": "%s:%s" % (kind, name), "kind": "package", "url": "https://example.invalid/" + name,
                "checks": [g.R("control.pass", g.PASS, "clean"), g.R("control.fail", g.FAIL, "doctored input", "owner")]}

    def test_exit_is_clean_when_every_artifact_is_below_100(self):
        with tempfile.TemporaryDirectory() as d, mock.patch.object(g, "Ctx", self.FakeCtx), \
                mock.patch.object(g, "package_artifact", self.failing), mock.patch.object(sys, "stderr", io.StringIO()):
            try:
                rc = g.main(["run", "--artifacts", "packages", "--out", d])
            except SystemExit as e:
                rc = e.code
            self.assertIn(rc, (None, 0), "the gate must exit 0 on a low score; it exited %r" % (rc,))
            with open(os.path.join(d, "scorecard.json"), encoding="utf-8") as f:
                doc = json.load(f)
            self.assertTrue(os.path.getsize(os.path.join(d, "SCORECARD.md")) > 0)
        s = doc["summary"]
        self.assertEqual(s["artifacts"], len(g.PYPI) + len(g.NPM))
        self.assertEqual(s["at_100"], 0)
        self.assertEqual(s["fails"], s["artifacts"])
        self.assertEqual({a["gate"] for a in doc["artifacts"]}, {"CLOSED"})
        # the field the workflow's last step reads to tell a reading from a blocked runner
        self.assertEqual(doc["meta"]["live"], {"axes": 23})


if __name__ == "__main__":
    unittest.main()
