#!/usr/bin/env python3
"""MCP conformance-suite runner (agent-interop lane, 2026-10).

Runs the Model Context Protocol conformance suite against a pinned subject
set, with scenarios filtered to ONE frozen spec version per instrument, and
stages one unsigned atom per (subject, instrument) run.

Two instruments are pinned, because they are not the same thing:
  stable-2025-11-25   @modelcontextprotocol/conformance@0.1.16 at spec 2025-11-25
  alpha-2026-07-28    @modelcontextprotocol/conformance@0.2.0-alpha.12 at spec 2026-07-28

The stable suite does not know the 2026-07-28 spec release, so a run against
the current spec needs the alpha suite. Both are recorded on every atom, so a
reader can tell a stable-instrument result from an alpha-instrument result
and neither can be mistaken for the other.

Vocabulary (never collapsed):
  RUN_COMPLETED      the suite ran and emitted checks for at least one scenario
  RUN_DEVIATIONS     the suite ran; at least one check did not pass
  TARGET_UNREACHABLE the target could not be reached by the suite
  SUITE_UNAVAILABLE  the suite could not be executed on this host
  NOT_PROBED         no endpoint was recorded for the subject

A conformance run is a probe, never a grade: PROBED is not MEASURED. The
suite reports which checks ran for one subject against one frozen spec
version. It says nothing about any other subject, any other spec version,
any other transport, or behaviour under load.

Output: public/interop/mcp-conformance-2026-10/
  sample.json                   the exact subject set, instruments and pins
  report.json                   per-run states, check tallies, limitations
  checks/index.json             the corpus index: every run, its digest, its deviations
  checks/<subject>__<inst>.json  every check the suite recorded, with its spec citations
  card-<subject>-<inst>-unsigned.json   staged atom, one per run
Never raises; per-run failures are data.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PACK = "mcp-conformance-2026-10"
PACK_DIR = ROOT / "public" / "interop" / PACK
REGISTRY_API = "https://registry.modelcontextprotocol.io/v0/servers?limit=100"
AGNTCY_API = "https://ai-catalog.outshift.io/v1/agents"
REPORT_URL = f"https://councilof.ai/interop/{PACK}/report.json"
CHECKS_INDEX_URL = f"https://councilof.ai/interop/{PACK}/checks/index.json"
UA = {"User-Agent": "councilof-ai-conformance/0.1 (one frozen-revision suite run per subject)"}

# The house admission rule for a staged atom bans verdict words. A check NAME is
# quoted from the suite, never authored here, so it is filtered before it can
# reach a payload. The corpus files keep the suite's own words; only the atom
# is filtered.
BANNED_RE = re.compile(
    r"\b(hacked|broken|unsafe|non-?compliant|compliant|violat(?:ed|es|ion|ions)?|fined|certif(?:ied|ication|y)|approved)\b"
    r"|(?<!UN)MEASURED",
    re.I,
)

# The pinned instruments. A re-check needs all three of: subject, suite version,
# spec version. Changing any one of them is a different measurement, not a new
# reading of the same one.
INSTRUMENTS = [
    {"id": "stable-2025-11-25", "suite": "@modelcontextprotocol/conformance@0.1.16",
     "suite_version": "0.1.16", "spec_version": "2025-11-25", "channel": "stable"},
    {"id": "alpha-2026-07-28", "suite": "@modelcontextprotocol/conformance@0.2.0-alpha.12",
     "suite_version": "0.2.0-alpha.12", "spec_version": "2026-07-28", "channel": "alpha"},
]

# Subjects that are not taken from a sample: the estate's own door, and the two
# directory records whose declared endpoint is a loopback address.
FIRST_PARTY = {"id": "councilof.ai/mcp/free", "url": "https://councilof.ai/mcp/free",
               "source": "first-party", "record_url": "https://councilof.ai/mcp/free"}
LOOPBACK = [
    {"id": "agntcy:Hello World Agent", "url": "http://localhost:9999/",
     "source": "agntcy-directory", "record_url": AGNTCY_API},
    {"id": "agntcy:a2a-helloworld", "url": "http://localhost:8080",
     "source": "agntcy-directory", "record_url": AGNTCY_API},
]

SAMPLE_N = 6
PER_RUN_TIMEOUT = 300
CARD_CAP = 3072

STATE_COMPLETED = "RUN_COMPLETED"
STATE_DEVIATIONS = "RUN_DEVIATIONS"
STATE_UNREACHABLE = "TARGET_UNREACHABLE"
STATE_SUITE_UNAVAILABLE = "SUITE_UNAVAILABLE"
STATE_NOT_PROBED = "NOT_PROBED"


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _canon(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def _get_json(url: str, timeout: int = 30):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception:
        return None


def _registry_candidates() -> list[dict]:
    data = _get_json(REGISTRY_API) or {}
    out: list[dict] = []
    for entry in data.get("servers", []) or []:
        server = entry.get("server", entry) or {}
        name, version = server.get("name"), server.get("version")
        if not name or not version:
            continue
        for remote in (server.get("remotes") or entry.get("remotes") or []):
            if not isinstance(remote, dict):
                continue
            url = remote.get("url")
            if isinstance(url, str) and url.startswith("https://"):
                out.append({"id": f"{name}@{version}", "url": url,
                            "source": "mcp-registry", "record_url": url,
                            "transport": remote.get("type") or "streamable-http"})
    return out


def _sample(cands: list[dict], n: int) -> list[dict]:
    uniq: dict[str, dict] = {}
    for c in cands:
        uniq.setdefault(c["id"], c)
    rows = sorted(uniq.values(), key=lambda c: hashlib.sha256(c["id"].encode()).hexdigest())
    return rows[:n]


def _collect_checks(out_dir: Path) -> tuple[list[dict], str, int]:
    """Every scenario's checks.json, canonicalised as one aggregate.

    The scenario name is the suite's own output-directory name, which carries a
    timestamp; it is normalised to the scenario's stable stem so a corpus file
    can be diffed between runs.
    """
    files = sorted(out_dir.rglob("checks.json"))
    scenarios: list[dict] = []
    total_bytes = 0
    for p in files:
        raw = p.read_bytes()
        total_bytes += len(raw)
        try:
            body = json.loads(raw.decode("utf-8"))
        except Exception:
            body = {"unparsed": True}
        scenarios.append({
            "scenario": p.parent.name,
            "checks_sha256": hashlib.sha256(raw).hexdigest(),
            "body": body,
        })
    aggregate = {"schema": "csoai.mcp-conformance-checks/0.1", "scenarios": scenarios}
    return scenarios, hashlib.sha256(_canon(aggregate)).hexdigest(), total_bytes


def _items(body) -> list[dict]:
    """The suite's check records, whichever shape it wrote them in."""
    if isinstance(body, dict):
        items = body.get("checks")
        if not isinstance(items, list):
            items = body if isinstance(body, list) else []
    elif isinstance(body, list):
        items = body
    else:
        items = []
    return [i for i in items if isinstance(i, dict)]


def _tally(scenarios: list[dict]) -> dict:
    counts: dict[str, int] = {}
    for sc in scenarios:
        for item in _items(sc.get("body")):
            status = item.get("status") or item.get("result") or item.get("outcome") or "UNKNOWN"
            counts[str(status)] = counts.get(str(status), 0) + 1
    return counts


def _is_failure(status: str) -> bool:
    return status.strip().upper() in {"FAILURE", "FAIL", "FAILED", "ERROR"}


def _ledger(scenarios: list[dict], subject: dict, instrument: dict,
            digest: str, ts: str) -> dict:
    """The corpus record for one run: every check, with the suite's own words.

    This is the artefact a third party can read without running anything: what
    was asked, what answered, what the suite recorded, and which spec section
    each check cites. It is not a score and it does not rank anything.
    """
    out_scenarios = []
    deviation_names: list[str] = []
    for sc in scenarios:
        raw_name = str(sc.get("scenario") or "")
        stem = raw_name
        for suffix in ("__",):
            if suffix in stem:
                stem = stem.split(suffix)[0]
        # "server-tools-list-2026-10-25T05-56-03-267Z" -> "tools-list"
        stem = re.sub(r"^server-", "", stem)
        stem = re.sub(r"-\d{4}-\d{2}-\d{2}T.*$", "", stem)
        checks = []
        for item in _items(sc.get("body")):
            status = str(item.get("status") or item.get("result") or item.get("outcome") or "UNKNOWN")
            name = str(item.get("name") or item.get("id") or "UNKNOWN")
            if _is_failure(status) and name not in deviation_names:
                deviation_names.append(name)
            rec = {
                "check": name,
                "id": item.get("id"),
                "status": status,
                "description": item.get("description"),
            }
            msg = item.get("errorMessage")
            if isinstance(msg, str) and msg:
                rec["errorMessage"] = msg[:400]
            refs = item.get("specReferences")
            if isinstance(refs, list) and refs:
                rec["specReferences"] = [
                    {"id": r.get("id"), "url": r.get("url")}
                    for r in refs if isinstance(r, dict) and r.get("url")
                ]
            details = item.get("details")
            if isinstance(details, dict):
                rec["details"] = details
            checks.append(rec)
        out_scenarios.append({
            "scenario": stem,
            "scenario_run_id": raw_name,
            "checks_sha256": sc.get("checks_sha256"),
            "checks": checks,
        })
    return {
        "schema": "csoai.mcp-conformance-run/0.1",
        "generated_at": ts,
        "subject_id": subject["id"],
        "subject_url": subject["url"],
        "subject_record_url": subject.get("record_url") or subject["url"],
        "source": subject["source"],
        "instrument": instrument["id"],
        "instrument_channel": instrument["channel"],
        "suite_version": instrument["suite_version"],
        "spec_version": instrument["spec_version"],
        "checks_sha256": digest,
        "scenarios": out_scenarios,
        "deviation_checks": deviation_names,
        "note": _loopback_note(subject["url"]),
        "not_a_grade": True,
    }


def _safe_deviations(names: list[str]) -> tuple[list[str], list[str]]:
    """Split deviation names into (kept, dropped).

    The house admission rule matches verdict words on word boundaries, which is
    right for prose. A suite check name is a compound identifier
    ("DNSRebindingRejected", "ToolsCallSimpleText"), where the verdict word can
    sit mid-token. So the filter here matches substrings, which is stricter
    than the house rule: anything that could read as a verdict is dropped from
    the atom. The corpus keeps the suite's own words either way, and the count
    of what was dropped is recorded rather than hidden.
    """
    kept: list[str] = []
    dropped: list[str] = []
    for n in names:
        low = n.lower()
        if any(w in low for w in ("hacked", "broken", "unsafe", "compliant", "violat",
                                  "fined", "certif", "approved")) or (
                "measured" in low and "unmeasured" not in low):
            dropped.append(n)
        else:
            kept.append(n)
    return kept, dropped


def _run(subject: dict, instrument: dict, ts: str) -> dict:
    """One (subject, instrument) run. Never raises."""
    tmp = Path(tempfile.mkdtemp(prefix="mcpconf-"))
    try:
        cmd = ["npx", "--yes", instrument["suite"], "server",
               "--url", subject["url"],
               "--spec-version", instrument["spec_version"],
               "--output-dir", str(tmp)]
        env = dict(os.environ)
        env["npm_config_yes"] = "true"
        try:
            proc = subprocess.run(cmd, capture_output=True, text=True,
                                  timeout=PER_RUN_TIMEOUT, env=env)
            stdout, stderr, rc = proc.stdout, proc.stderr, proc.returncode
        except subprocess.TimeoutExpired:
            return {"state": STATE_UNREACHABLE, "note": "suite timeout"}
        except FileNotFoundError:
            return {"state": STATE_SUITE_UNAVAILABLE, "note": "npx not found"}

        scenarios, digest, total_bytes = _collect_checks(tmp)
        if not scenarios:
            blob = (stdout + "\n" + stderr).lower()
            missing = any(k in blob for k in ("could not find", "enoent", "no such file",
                                              "command not found", "unknown spec version"))
            note = _first_signal(stdout, stderr)
            return {"state": STATE_SUITE_UNAVAILABLE if missing else STATE_UNREACHABLE,
                    "note": note, "returncode": rc}
        counts = _tally(scenarios)
        # The suite's own outcome vocabulary is SUCCESS / FAILURE / WARNING / INFO.
        # It is quoted verbatim in the atom; it is never collapsed into "pass".
        failed = sum(v for k, v in counts.items() if _is_failure(k))
        ledger = _ledger(scenarios, subject, instrument, digest, ts)
        return {"state": STATE_DEVIATIONS if failed else STATE_COMPLETED,
                "checks_sha256": digest, "checks_bytes": total_bytes,
                "scenarios": len(scenarios), "check_counts": counts, "returncode": rc,
                "failed_checks": failed, "ledger": ledger}
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _loopback_note(url: str) -> str:
    """A loopback endpoint's reachability is a property of the measuring host."""
    if not url.startswith("http://"):
        return ""
    return ("declared endpoint is a loopback address; any reachability observed is a "
            "property of the measuring host, not of the published record")


def _first_signal(stdout: str, stderr: str) -> str:
    blob = (stderr + "\n" + stdout).strip()
    for line in blob.splitlines():
        low = line.lower()
        if any(k in low for k in ("econnrefused", "unreachable", "failed to fetch",
                                  "unknown spec version", "timeout")):
            return line.strip()[:200]
    return blob.splitlines()[0].strip()[:200] if blob else "no output"


def _slug(subject: dict, instrument: dict) -> str:
    return (subject["id"] + "__" + instrument["id"]) \
        .replace("/", "_").replace("@", "_").replace(":", "_")


def _card(subject: dict, instrument: dict, run: dict, ts: str) -> dict:
    slug = _slug(subject, instrument)
    checks_url = f"https://councilof.ai/interop/{PACK}/checks/{slug}.json"
    base_payload = {
        "kind": "csoai.mcp-conformance/0.1",
        "state": "PROBED",
        "run_state": run["state"],
        "subject_id": subject["id"],
        "instrument": instrument["id"],
        "suite_version": instrument["suite_version"],
        "spec_version": instrument["spec_version"],
        "instrument_channel": instrument["channel"],
        "checks_sha256": run.get("checks_sha256"),
        "scenarios": run.get("scenarios"),
        "check_counts": run.get("check_counts") or {},
        "not_a_grade": True,
        "report": REPORT_URL,
        "checks": checks_url,
    }
    # The scope note travels INSIDE the payload. A reader who sees only the
    # atom still learns that a loopback endpoint's reachability is a property
    # of the measuring host, not of the published record.
    scope_note = _loopback_note(subject["url"])
    if scope_note:
        base_payload["scope_note"] = scope_note

    # The names of the checks that did not pass, quoted from the suite. They
    # are filtered against the house verdict-word rule before they get here.
    deviations, dropped = _safe_deviations(
        list((run.get("ledger") or {}).get("deviation_checks") or []))
    if dropped:
        base_payload["deviation_checks_withheld"] = len(dropped)

    urls = [checks_url, REPORT_URL]
    if subject["url"].startswith("https://"):
        urls.insert(0, subject["url"])
    else:
        urls.insert(0, subject["record_url"])

    def build(devs: list[str], truncated: bool) -> dict:
        payload = dict(base_payload)
        if devs:
            payload["deviation_checks"] = devs
        if truncated:
            payload["deviation_checks_truncated"] = True
        return {
            "schema": "https://councilof.ai/schema/card-v0.json",
            "surface": "public.notice",
            "subject": f"MCP conformance run {instrument['id']} for {subject['id']}",
            "as_of": ts,
            "source_urls": urls,
            "payload": payload,
            "sha256": hashlib.sha256(_canon(payload)).hexdigest(),
            "unmeasured": [
                "behaviour under load",
                "scenarios outside the frozen spec version",
                "subjects outside the pinned set",
            ],
            "tags": ["mcp", "conformance", "probe", PACK],
        }

    # The WHOLE card has a 3072-byte cap, not just the payload, so the trim
    # is measured against the card. The corpus keeps the full detail and the
    # trim is recorded rather than hidden.
    card = build(deviations, False)
    trimmed = False
    while deviations and len(_canon(card)) > CARD_CAP:
        deviations = deviations[:-1]
        trimmed = True
        card = build(deviations, True)
    return card


def main() -> int:
    ts = _now()
    PACK_DIR.mkdir(parents=True, exist_ok=True)
    cands = _registry_candidates()
    sampled = _sample(cands, SAMPLE_N)
    subjects = [FIRST_PARTY] + sampled + LOOPBACK

    sample = {
        "schema": "csoai.mcp-conformance-sample/0.1",
        "generated_at": ts,
        "selection_rule": (f"first-party door + {SAMPLE_N} remote-exposing registry identities by "
                           f"sha256(id) + every directory record whose declared endpoint is a "
                           f"loopback address — deterministic, reproducible"),
        "n": len(subjects),
        "registry_population_sampled": len(cands),
        "registry_api": REGISTRY_API,
        "agntcy_api": AGNTCY_API,
        "instruments": INSTRUMENTS,
        "subjects": [{"id": s["id"], "url": s["url"], "source": s["source"]} for s in subjects],
    }
    (PACK_DIR / "sample.json").write_text(json.dumps(sample, indent=1, sort_keys=True) + "\n")

    rows: list[dict] = []
    counts: dict[str, int] = {}
    staged = 0
    # The pack belongs to this probe. A card from an earlier run must not
    # survive into a later one as if it were current: if a subject becomes
    # unreachable, no card is written and the stale one has to go, or the root
    # would publish an old digest as a fresh leaf.
    for subject in subjects:
        for instrument in INSTRUMENTS:
            stale = PACK_DIR / f"card-{_slug(subject, instrument)}-unsigned.json"
            if stale.exists():
                stale.unlink()
    checks_dir = PACK_DIR / "checks"
    checks_dir.mkdir(parents=True, exist_ok=True)
    corpus: list[dict] = []
    for subject in subjects:
        for instrument in INSTRUMENTS:
            run = _run(subject, instrument, ts)
            st = run.get("state", STATE_NOT_PROBED)
            counts[st] = counts.get(st, 0) + 1
            note = run.get("note")
            extra = _loopback_note(subject["url"])
            if extra:
                note = ((note + "; ") if note else "") + extra
            slug = _slug(subject, instrument)
            ledger = run.get("ledger")
            if ledger:
                (checks_dir / f"{slug}.json").write_text(
                    json.dumps(ledger, indent=1, sort_keys=True) + "\n")
                corpus.append({
                    "subject_id": subject["id"],
                    "instrument": instrument["id"],
                    "file": f"checks/{slug}.json",
                    "checks_sha256": ledger.get("checks_sha256"),
                    "scenarios": len(ledger.get("scenarios") or []),
                    "deviation_checks": ledger.get("deviation_checks") or [],
                })
            rows.append({
                "subject_id": subject["id"], "url": subject["url"],
                "source": subject["source"], "instrument": instrument["id"],
                "spec_version": instrument["spec_version"], "state": st,
                "checks_sha256": run.get("checks_sha256"),
                "scenarios": run.get("scenarios"),
                "check_counts": run.get("check_counts") or {},
                "note": note, "returncode": run.get("returncode"),
            })
            if st in (STATE_COMPLETED, STATE_DEVIATIONS):
                card = _card(subject, instrument, run, ts)
                if len(_canon(card)) <= CARD_CAP:
                    (PACK_DIR / f"card-{slug}-unsigned.json").write_text(
                        json.dumps(card, indent=1, sort_keys=True) + "\n")
                    staged += 1
                else:
                    (PACK_DIR / f"skip-{subject['id']}-{instrument['id']}.json").write_text(
                        json.dumps({"reason": "card over cap", "bytes": len(_canon(card))}, indent=1) + "\n")

    (checks_dir / "index.json").write_text(json.dumps({
        "schema": "csoai.mcp-conformance-corpus/0.1",
        "generated_at": ts,
        "instruments": INSTRUMENTS,
        "runs": corpus,
        "what_this_is": (
            "Every check the pinned MCP conformance suite recorded for one subject against one "
            "frozen spec version, with the suite's own status words and the spec section each "
            "check cites. A probe, never a grade: it says what was asked and what answered, "
            "and nothing about any other subject, spec version, transport or load."
        ),
        "not_a_grade": True,
    }, indent=1, sort_keys=True) + "\n")

    report = {
        "schema": "csoai.mcp-conformance/0.1",
        "generated_at": ts,
        "instruments": INSTRUMENTS,
        "subjects_n": len(subjects),
        "runs": len(rows),
        "state_counts": counts,
        "cards_staged": staged,
        "corpus": f"https://councilof.ai/interop/{PACK}/checks/index.json",
        "limitations": [
            "one frozen-spec-version suite run per subject and instrument — a probe, never a grade",
            "PROBED is not MEASURED; a completed run shows only that those checks ran once",
            "the stable suite 0.1.16 does not know the 2026-07-28 spec release; that revision "
            "needs the alpha suite, so an alpha-channel result is not comparable with a "
            "stable-channel result",
            "a subject with a loopback declared endpoint is unreachable by definition for any "
            "remote runner; that is a property of the record, not a defect of the subject",
            "the registry sample is deterministic by id hash; population claims need the full census",
            "the corpus files quote the suite's own error strings verbatim; they are observations "
            "recorded by the suite, not verdicts and not findings against any subject",
        ],
        "results": rows,
    }
    (PACK_DIR / "report.json").write_text(json.dumps(report, indent=1, sort_keys=True) + "\n")
    print(json.dumps(counts, sort_keys=True))
    print(f"subjects {len(subjects)}; runs {len(rows)}; staged {staged} atoms")
    return 0


if __name__ == "__main__":
    sys.exit(main())
