#!/usr/bin/env python3
"""THE BENCHMARK-QUALITY REGISTER v1 — the producer.

Reads ONLY the committed fixtures under scripts/fixtures/benchmark-quality/, applies the
35 deterministic predicates in predicates.py to eight benchmark publishers — the seven
named in the 6 Sep 2026 self-audit and ourselves — and writes

    docs/product/benchmark-quality/<date>/register.json     the whole register
    docs/product/benchmark-quality/<date>/register.md       the same thing, readable
    docs/product/benchmark-quality/<date>/cards/<pub>.json  one card-v0 per publisher
    public/interop/benchmark-quality/index.json             the served index

    python3 scripts/benchmark_quality/register.py                       # produce
    python3 scripts/benchmark_quality/register.py --check               # drift, exit 1
    python3 scripts/benchmark_quality/register.py --explain lmarena:uncertainty_shown_beside_scores

THE THREE RULES THIS FILE ENFORCES IN CODE, NOT IN PROSE

 1. NO NETWORK. This module imports no HTTP client and opens no socket. Its entire input
    is a directory of files whose SHA-256 is recorded on every result it emits. That is
    why --check is a drift check and not a second opinion: the same bytes must give the
    same verdict or the build fails.

 2. NO MODEL JUDGES. Every verdict comes from `re.search`, an RFC 9309 path evaluation,
    or a field lookup in a JSON index. There is no scorer here that could have an opinion.

 3. WE ARE THE EIGHTH ROW, ON THE SAME BUDGET. Council of AI is graded by the same 35
    predicates, from the same three artifacts, with no extra fetches — see SELF_ASSESSED.
    Marking ourselves would be worthless if we graded ourselves from ten artifacts while
    grading everyone else from three, so the code refuses to let us have more.

STATUS. Every card ships `status: "STAGED"`. STAGED means produced, self-consistent and
unsigned. Only the OIDC signer may move a card to MEASURED, and only where the count of
RESOLVED predicates (PASS + FAIL) for that publisher is at least 30. Nothing in this file
can write MEASURED; see docs/product/benchmark-quality/<date>/SIGNING.md.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import html as _html
import json
import pathlib
import re
import sys
from urllib.parse import urlsplit, unquote

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from predicates import GROUPS, P  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
FIXTURES = ROOT / "scripts" / "fixtures" / "benchmark-quality"
SURFACE = "benchmark-quality.v1"
SCHEMA = "https://councilof.ai/schema/card-v0.json"
KIND = "csoai.benchmark-quality-register/1.0"
MAX_CARD_PAYLOAD_BYTES = 3072
MIN_RESOLVED_FOR_MEASURED = 30

RUN_DATE = "2026-09-06"  # the date the fixtures were fetched; pinned so --check is stable

# Below this many characters of visible text, the response is a client-rendered shell:
# the bytes that would answer a content predicate are not in it. Everything read from
# that surface becomes UNMEASURED, with the character count in the reason.
SHELL_TEXT_THRESHOLD = 400

PUBLISHERS = {
    "lmarena": dict(
        name="LMArena", legal="LMArena / Arena Intelligence Inc.", homepage="https://arena.ai/",
        index="hf", attribution=r"(?i)^lmarena[-_]?ai/",
        note="lmarena.ai redirects to arena.ai; the robots.txt and the board were both read after the redirect."),
    "vals-ai": dict(
        name="Vals AI", legal="Vals AI, Inc.", homepage="https://www.vals.ai/",
        index="hf", attribution=r"(?i)^vals[-_]?ai/"),
    "helm-crfm": dict(
        name="HELM", legal="Stanford Center for Research on Foundation Models (CRFM)",
        homepage="https://crfm.stanford.edu/helm/", index="gh", attribution=r"(?i)^stanford-crfm/"),
    "epoch-ai": dict(
        name="Epoch AI", legal="Epoch AI", homepage="https://epoch.ai/",
        index="gh", attribution=r"(?i)^epoch-research/",
        note="https://epoch.ai/data/ai-benchmarking-dashboard redirected to https://epoch.ai/benchmarks; the redirect target is what was read."),
    "artificial-analysis": dict(
        name="Artificial Analysis", legal="Artificial Analysis Pty Ltd", homepage="https://artificialanalysis.ai/",
        index="hf", attribution=r"(?i)^artificialanalysis/"),
    "scale-seal": dict(
        name="Scale SEAL", legal="Scale AI, Inc.", homepage="https://scale.com/leaderboard",
        index="hf", attribution=r"(?i)^scale",
        note="scale.com/leaderboard redirected to labs.scale.com/leaderboard — a different host, whose robots.txt is not the one fetched."),
    "uk-aisi-inspect": dict(
        name="UK AISI (Inspect)", legal="UK AI Security Institute", homepage="https://inspect.aisi.org.uk/",
        index="gh", attribution=r"(?i)^UKGovernmentBEIS/"),
    "council-of-ai": dict(
        name="Council of AI", legal="CSOAI Ltd (GB, Companies House 16939677)", homepage="https://councilof.ai/",
        index="hf", attribution=r"(?i)^csoai/", self_assessed=True),
}

SELF_ASSESSED = {k for k, v in PUBLISHERS.items() if v.get("self_assessed")}


# ── artifact loading ─────────────────────────────────────────────────────────────────
_TAG = re.compile(r"(?s)<[^>]+>")
_DROP = re.compile(r"(?is)<(script|style|noscript|template)[^>]*>.*?</\1>")
# HTML COMMENTS ARE NOT PUBLISHED CONTENT. Stripped from BOTH views after run 2, where our
# OWN row passed funding_or_ownership_disclosed on the string "CSOAI LTD is a UK private
# company" sitting inside an `<!-- ... -->` comment that no reader ever sees. Grading
# ourselves on invisible markup is the precise failure this register exists to catch, so
# the comment stripper is applied to everybody.
_COMMENT = re.compile(r"(?s)<!--.*?-->")
_HREF = re.compile(r"""(?i)\b(?:href|src|action|data-href)\s*=\s*["']([^"']{1,400})["']""")


def visible_text(raw: str) -> str:
    t = _DROP.sub(" ", raw)
    t = _TAG.sub(" ", t)
    t = _html.unescape(t)
    return re.sub(r"\s+", " ", t).strip()


class Artifacts:
    """The three files fetched for one publisher, plus the two views derived from them.

    The derived views (`board`, `board_href`) are produced HERE, by committed code, from
    committed bytes — so a stranger who distrusts the extraction can run this module and
    diff, rather than having to take our word for the normalisation."""

    def __init__(self, pid: str):
        self.pid = pid
        self.dir = FIXTURES / pid
        self.meta: dict[str, dict] = {}
        self.raw: dict[str, str] = {}
        for key in ("robots", "board", "machine"):
            mp = self.dir / f"{key}.meta.json"
            if not mp.exists():
                continue
            self.meta[key] = json.loads(mp.read_text())
            bp = self.dir / f"{key}.body"
            self.raw[key] = bp.read_bytes().decode("utf-8", "replace") if bp.exists() else ""
        self.board_raw = _COMMENT.sub(" ", self.raw.get("board", ""))
        self.board_text = visible_text(self.board_raw)
        self.board_hrefs = "\n".join(unquote(h) for h in _HREF.findall(self.board_raw))
        self.shell = len(self.board_text) < SHELL_TEXT_THRESHOLD

    def view(self, on: str) -> tuple[str, dict]:
        if on == "board":
            return self.board_text, self.meta.get("board", {})
        if on == "board_href":
            return self.board_hrefs, self.meta.get("board", {})
        if on == "board_raw":
            return self.board_raw, self.meta.get("board", {})
        return self.raw.get(on, ""), self.meta.get(on, {})


# ── evidence ─────────────────────────────────────────────────────────────────────────
def evidence(meta: dict, matched: str | None, note: str = "", context: str | None = None) -> dict:
    e = {
        "artifact": meta.get("key"),
        "source_url": meta.get("url_effective") or meta.get("url_requested"),
        "url_requested": meta.get("url_requested"),
        "http_status": meta.get("status"),
        "fetched": meta.get("fetched"),
        "sha256": meta.get("sha256"),
        "bytes": meta.get("bytes_decoded"),
        "bytes_note": "decoded bytes, the ones the sha256 covers and the ones every predicate reads",
    }
    if matched is not None:
        e["matched"] = matched[:180]
    if context:
        # THE SPAN IN ITS SURROUNDINGS. A matched token on its own hides the bug that
        # matters: run 1 recorded `Subscribe`, `cc0` and `p=0.9` as PASSes and only the
        # surrounding words showed that a newsletter button, an asset hash and a top-p
        # setting had been scored. Every regex verdict now ships the neighbourhood so a
        # reader can catch the next one without re-fetching anything.
        e["context"] = context
    if note:
        e["note"] = note
    return e


# ── index probes ─────────────────────────────────────────────────────────────────────
def index_records(a: Artifacts, pub: dict) -> tuple[list[dict], str]:
    """Return (records attributable to this publisher, the index kind)."""
    body = a.raw.get("machine", "")
    if not body:
        return [], pub["index"]
    try:
        doc = json.loads(body)
    except Exception:
        return [], pub["index"]
    rows = doc.get("items", []) if isinstance(doc, dict) else doc
    rx = re.compile(pub["attribution"])
    out = []
    for r in rows or []:
        ident = r.get("full_name") or r.get("id") or ""
        if rx.search(ident):
            out.append(r)
    return out, pub["index"]


def record_licence(r: dict) -> str | None:
    lic = (r.get("license") or {}).get("spdx_id") if isinstance(r.get("license"), dict) else None
    if lic and lic != "NOASSERTION":
        return lic
    cd = r.get("cardData") or {}
    if cd.get("license"):
        lic = cd["license"]
        return lic if isinstance(lic, str) else (lic[0] if lic else None)
    for t in r.get("tags") or []:
        if isinstance(t, str) and t.startswith("license:"):
            return t.split(":", 1)[1]
    return None


# ── RFC 9309 ─────────────────────────────────────────────────────────────────────────
def robots_verdict(a: Artifacts) -> tuple[str, str, str]:
    """(result, matched, note) for robots_permits_results_surface."""
    rm, bm = a.meta.get("robots", {}), a.meta.get("board", {})
    if not rm or not bm:
        return "UNMEASURED", "", "robots.txt or the results surface was not fetched."
    rhost = urlsplit(rm.get("url_effective") or "").netloc.lower()
    bhost = urlsplit(bm.get("url_effective") or "").netloc.lower()
    if rhost != bhost:
        return ("UNMEASURED", "",
                f"The results surface resolved to {bhost}, a different host from {rhost} where "
                f"robots.txt was fetched. Under RFC 9309 a robots.txt governs only its own "
                f"authority, so the file we hold does not answer this question. Fetching the "
                f"second host would exceed the three-artifact budget every publisher is held to.")
    if rm.get("status") != 200 or "text/plain" not in (rm.get("content_type") or ""):
        return ("PASS", f"HTTP {rm.get('status')}, content-type {rm.get('content_type')!r}",
                "No usable robots.txt was served. RFC 9309 §2.3.1.4: where robots.txt is "
                "unavailable, the crawler may assume no restrictions. Recorded as PASS on that "
                "rule, not as an approval of anything.")
    path = urlsplit(bm.get("url_effective") or "").path or "/"
    best_allow, best_dis, in_star = -1, -1, False
    star_matched = None
    for line in a.raw["robots"].splitlines():
        line = line.split("#", 1)[0].strip()
        if not line or ":" not in line:
            continue
        field, _, value = line.partition(":")
        field, value = field.strip().lower(), value.strip()
        if field == "user-agent":
            in_star = value == "*"
            continue
        if not in_star or field not in ("allow", "disallow"):
            continue
        if field == "disallow" and value == "":
            continue
        rx = "^" + re.escape(value).replace(r"\*", ".*").replace(r"\$", "$") + ".*"
        if re.match(rx, path):
            if field == "allow" and len(value) > best_allow:
                best_allow, star_matched = len(value), f"Allow: {value}"
            elif field == "disallow" and len(value) > best_dis:
                best_dis, star_matched = len(value), f"Disallow: {value}"
    if best_allow < 0 and best_dis < 0:
        return "PASS", "no rule in the `*` group matches this path", f"path {path}"
    if best_allow >= best_dis:
        return "PASS", star_matched or "", f"path {path}; longest match wins, ties to Allow (RFC 9309 §2.2.2)"
    return "FAIL", star_matched or "", f"path {path}; longest matching rule is a Disallow"


# ── date parsing ─────────────────────────────────────────────────────────────────────
_MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}


def parse_date(s: str) -> _dt.date | None:
    s = s.strip().rstrip(",")
    m = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", s)
    if m:
        try:
            return _dt.date(int(m[1]), int(m[2]), int(m[3]))
        except ValueError:
            return None
    m = re.match(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$", s)
    if m:  # ambiguous D/M vs M/D — take the reading that is a valid date and nearest the run date
        cands = []
        for a_, b_ in ((int(m[1]), int(m[2])), (int(m[2]), int(m[1]))):
            try:
                cands.append(_dt.date(int(m[3]), a_, b_))
            except ValueError:
                pass
        if cands:
            ref = _dt.date.fromisoformat(RUN_DATE)
            return min(cands, key=lambda d: abs((ref - d).days))
    m = re.match(r"^([A-Za-z]{3,9})\.? (\d{1,2}),? (\d{4})$", s)
    if m and m[1][:3].lower() in _MONTHS:
        try:
            return _dt.date(int(m[3]), _MONTHS[m[1][:3].lower()], int(m[2]))
        except ValueError:
            return None
    m = re.match(r"^(\d{1,2}) ([A-Za-z]{3,9}) (\d{4})$", s)
    if m and m[2][:3].lower() in _MONTHS:
        try:
            return _dt.date(int(m[3]), _MONTHS[m[2][:3].lower()], int(m[1]))
        except ValueError:
            return None
    return None


# ── the evaluator ────────────────────────────────────────────────────────────────────
def evaluate(pid: str) -> dict:
    pub = PUBLISHERS[pid]
    a = Artifacts(pid)
    out: dict[str, dict] = {}

    for p in P:
        pid_, kind, on = p["id"], p["kind"], p["on"]
        text, meta = a.view(on)

        # gate 1: the artifact was not fetched at all
        if not meta:
            out[pid_] = dict(result="UNMEASURED", evidence=evidence({}, None),
                             reason=f"The {on} artifact was not fetched for this publisher.")
            continue

        # gate 2: the results surface is a client-rendered shell
        if on.startswith("board") and a.shell:
            out[pid_] = dict(
                result="UNMEASURED", evidence=evidence(meta, None),
                reason=(f"The results surface returned {len(a.board_text)} characters of visible "
                        f"text after script and style removal ({meta.get('bytes_decoded')} bytes on the "
                        f"wire) — a client-rendered shell. The bytes that would answer this "
                        f"predicate are not in the response. Rendering it would require executing "
                        f"the publisher's JavaScript, which this register does not do."))
            continue

        if kind == "regex":
            m = re.search(p["pattern"], text)
            ctx = None
            if m:
                lo, hi = max(0, m.start() - 90), min(len(text), m.end() + 90)
                ctx = ("…" if lo else "") + re.sub(r"\s+", " ", text[lo:hi]) + ("…" if hi < len(text) else "")
            out[pid_] = dict(result="PASS" if m else "FAIL",
                             evidence=evidence(meta, m.group(0) if m else None, context=ctx),
                             pattern=p["pattern"])
            if m:
                out[pid_]["captured"] = m.group(1) if m.lastindex else None

        elif kind == "robots":
            r, matched, note = robots_verdict(a)
            e = evidence(meta, matched or None, note if r != "UNMEASURED" else "")
            out[pid_] = dict(result=r, evidence=e)
            if r == "UNMEASURED":
                out[pid_]["reason"] = note

        elif kind == "json":
            recs, ikind = index_records(a, pub)
            q = meta.get("url_requested", "")
            if p["probe"] == "index_nonempty":
                if recs:
                    out[pid_] = dict(result="PASS",
                                     evidence=evidence(meta, f"{len(recs)} record(s): " +
                                                       ", ".join((r.get('full_name') or r.get('id') or '') for r in recs[:4])))
                else:
                    out[pid_] = dict(result="UNMEASURED", evidence=evidence(meta, "0 attributable records"),
                                     reason=("The index query returned no record attributable to this "
                                             "publisher. A zero from one search term establishes something "
                                             "about the term, not about the publisher — so this is "
                                             f"UNMEASURED and never FAIL. Query: {q}. If the publisher's "
                                             "handle in this index differs, tell us and the record is "
                                             "recomputed against it."))
            elif p["probe"] == "index_licence":
                if not recs:
                    out[pid_] = dict(result="UNMEASURED", evidence=evidence(meta, "0 attributable records"),
                                     reason=f"No attributable record to read a licence from. Query: {q}")
                else:
                    lic = [(r.get("full_name") or r.get("id"), record_licence(r)) for r in recs]
                    hit = [x for x in lic if x[1]]
                    out[pid_] = dict(result="PASS" if hit else "FAIL",
                                     evidence=evidence(meta, (f"{hit[0][0]} → {hit[0][1]}" if hit else
                                                              f"{len(lic)} records, none carrying a licence field")))
            elif p["probe"] == "index_code_licence":
                if ikind != "gh":
                    out[pid_] = dict(result="UNMEASURED", evidence=evidence(meta, None),
                                     reason=("The index queried for this publisher was the Hugging Face "
                                             "dataset index, which holds no source-repository records. A "
                                             "code licence is not answerable from the artifact fetched, and "
                                             "a fourth fetch would break the budget every publisher shares."))
                elif not recs:
                    out[pid_] = dict(result="UNMEASURED", evidence=evidence(meta, "0 attributable records"),
                                     reason=f"No attributable repository to read a licence from. Query: {q}")
                else:
                    hit = [(r.get("full_name"), (r.get("license") or {}).get("spdx_id"))
                           for r in recs if (r.get("license") or {}).get("spdx_id") not in (None, "NOASSERTION")]
                    out[pid_] = dict(result="PASS" if hit else "FAIL",
                                     evidence=evidence(meta, (f"{hit[0][0]} → {hit[0][1]}" if hit else
                                                              f"{len(recs)} repositories, none with an SPDX identifier")))

        elif kind == "all_of":
            parts = {i: out[i]["result"] for i in p["inputs"]}
            if any(v == "UNMEASURED" for v in parts.values()):
                out[pid_] = dict(result="UNMEASURED", evidence=evidence(meta, None), inputs=parts,
                                 reason="A composite cannot be resolved while one of its inputs is UNMEASURED.")
            else:
                ok = all(v == "PASS" for v in parts.values())
                out[pid_] = dict(result="PASS" if ok else "FAIL",
                                 evidence=evidence(meta, ", ".join(f"{k}={v}" for k, v in parts.items())),
                                 inputs=parts)

        elif kind == "date":
            src = out.get(p["from_pred"], {})
            cap = src.get("captured")
            if src.get("result") != "PASS" or not cap:
                out[pid_] = dict(result="UNMEASURED", evidence=evidence(meta, None),
                                 reason=(f"{p['from_pred']} did not yield a parseable date, so there is "
                                         f"no date to compare. Absence of a date is recorded there; it is "
                                         f"not restated as a failure here."))
            else:
                d = parse_date(cap)
                if not d:
                    out[pid_] = dict(result="UNMEASURED", evidence=evidence(meta, cap),
                                     reason=f"The captured string {cap!r} did not parse as a date.")
                else:
                    age = (_dt.date.fromisoformat(RUN_DATE) - d).days
                    out[pid_] = dict(result="PASS" if 0 <= age <= p["window_days"] else "FAIL",
                                     evidence=evidence(meta, f"{cap} → {d.isoformat()} ({age} days before {RUN_DATE})"),
                                     age_days=age)
        else:
            raise SystemExit(f"unknown rule kind {kind!r} on {pid_}")

    return out


# ── assembly ─────────────────────────────────────────────────────────────────────────
def tally(res: dict) -> dict:
    v = [r["result"] for r in res.values()]
    return {"predicates": len(v), "pass": v.count("PASS"), "fail": v.count("FAIL"),
            "unmeasured": v.count("UNMEASURED"), "resolved": v.count("PASS") + v.count("FAIL")}


def build() -> dict:
    by_id = {p["id"]: p for p in P}
    rows = {}
    for pid in PUBLISHERS:
        res = evaluate(pid)
        a = Artifacts(pid)
        t = tally(res)
        rows[pid] = {
            "publisher": PUBLISHERS[pid]["name"],
            "legal_entity": PUBLISHERS[pid]["legal"],
            "homepage": PUBLISHERS[pid]["homepage"],
            "self_assessed": pid in SELF_ASSESSED,
            **({"note": PUBLISHERS[pid]["note"]} if PUBLISHERS[pid].get("note") else {}),
            "artifacts": [
                {"key": k, "url_requested": m.get("url_requested"), "url_effective": m.get("url_effective"),
                 "http_status": m.get("status"), "content_type": m.get("content_type"),
                 "bytes_decoded": m.get("bytes_decoded"), "bytes_on_the_wire": m.get("bytes_on_the_wire"),
                 "fetched": m.get("fetched"), "sha256": m.get("sha256")}
                for k, m in sorted(a.meta.items())
            ],
            "results_surface_is_client_rendered_shell": a.shell,
            "visible_text_chars_on_results_surface": len(a.board_text),
            "n": t,
            "status": "STAGED",
            "predicates": {k: {**v, "group": by_id[k]["group"]} for k, v in res.items()},
        }

    return {
        "schema": f"https://councilof.ai/schema/{SURFACE}.json",
        "surface": SURFACE,
        "kind": KIND,
        "status": "STAGED",
        "not_a_certificate": True,
        "register": ("Benchmark-quality register — deterministic predicates applied to the process "
                     "integrity of eight AI benchmark publishers, ourselves included"),
        "issuer": "CSOAI Ltd (GB, Companies House 16939677)",
        "authored_by": "did:web:csoai.org",
        "as_of": RUN_DATE,
        "run_date": RUN_DATE,
        "record_type": "measured-current-state",
        "endorsement": "none",
        "solicited": False,
        "subject_participation": "none",
        "access": "public_artifacts_only",
        "no_model_judgment": True,
        "method": {
            "scorer": "re.search, an RFC 9309 path evaluation, and field lookups in a JSON index. Nothing else.",
            "input": "Only the files under scripts/fixtures/benchmark-quality/. This producer makes no network call.",
            "fetch_budget": {"artifacts_per_publisher": 3, "applies_to": "every publisher including Council of AI",
                             "artifacts": ["robots.txt", "the results surface a reader lands on",
                                           "a public index query (Hugging Face datasets API or GitHub repository search)"],
                             "why": ("Marking ourselves would be worthless on a wider budget than everyone "
                                     "else's, so the budget is identical and enforced in scripts/benchmark_quality/fetch.py.")},
            "index_queries_are_searches_not_guesses": ("Where absence matters the query goes to an index, not to a "
                                                       "URL we invented, because a 404 on a constructed path is "
                                                       "evidence about the guess."),
            "recompute": "python3 scripts/benchmark_quality/register.py --check",
            "explain_one_cell": "python3 scripts/benchmark_quality/register.py --explain <publisher>:<predicate_id>",
        },
        "result_semantics": {
            "PASS": "The pattern matched the named artifact. The matched span and the artifact's SHA-256 are on the result.",
            "FAIL": ("The artifact was read and the pattern did not match. Scoped to that artifact on that date: "
                     "a statement about what the publisher put at that URL, never about the publisher."),
            "UNMEASURED": ("The bytes that would answer the question are not in the artifact — a client-rendered "
                           "shell, a redirect to a host outside the budget, an index with no attributable record, "
                           "or a question downstream of an unresolved one. A result, not a zero and not a failure."),
        },
        "measured_gate": {
            "current": "STAGED",
            "rule": (f"A publisher row may be signed to MEASURED only where resolved (PASS+FAIL) >= "
                     f"{MIN_RESOLVED_FOR_MEASURED}. Nothing in this producer can write MEASURED; only the "
                     f"OIDC signer can, and it re-checks the count."),
            "threshold_resolved": MIN_RESOLVED_FOR_MEASURED,
        },
        "self_assessment": {
            "row": "council-of-ai",
            "declared": True,
            "rule": ("Our row is graded by the same 35 predicates from the same 3 artifacts, and is flagged "
                     "self_assessed on the register, on the card and in every export. A self-assessed row is "
                     "not independent evidence about us and must never be read as such. It is here because a "
                     "register of other people's disclosure that exempted its author would be worth nothing."),
            "supersedes": ("The v0.1 register at functions/api/benchmark-quality.ts excludes Council of AI by an "
                           "impartiality firewall. That firewall is correct for v0.1, which grades benchmarks we "
                           "do not publish. v1 grades PUBLISHERS, we are one, and the honest handling of a "
                           "conflict of interest at this scale is disclosure plus identical treatment rather than "
                           "silence. The two surfaces are separate and both remain live. This is an owner-visible "
                           "doctrine change, flagged in the PR, not a quiet edit."),
        },
        "limitations": [
            "These predicates measure DISCLOSURE ON A NAMED SURFACE. They do not measure whether any publisher's "
            "numbers are correct, whether a benchmark measures what its name claims, or whether one publisher is "
            "better than another. Construct validity is not scored here because no regular expression can score it.",
            "There is no total, no score and no ranking. The counts are unweighted, the predicates are not "
            "independent, and the set is not exhaustive. Ordering publishers by PASS count would be a misuse of "
            "this file, and the file deliberately contains nothing that makes it easy.",
            "A FAIL is bounded by one URL on one date. Most of these publishers document more, elsewhere, than the "
            "surface a reader lands on. That gap is the thing being measured, and it is not the same as an absence.",
            "Three artifacts per publisher is a small window, chosen so that ours is the same size. A wider window "
            "would resolve more predicates for everyone and would change results in both directions.",
            "Regular expressions produce false positives. A page that says 'we publish no confidence intervals' "
            "matches the interval pattern. Every PASS carries the matched span so that a reader can see this "
            "happen, and any such case is a correction we will make.",
            "One row is self-assessed. It is marked everywhere it appears and it is not independent evidence.",
            "No language model judged anything on this register. The scorer is re.search.",
        ],
        "predicate_catalogue": [
            {"id": p["id"], "group": p["group"], "question": p["question"],
             "evaluable_from": p["on"], "evidence_type": p["evidence_type"], "why": p["why"],
             **({"pattern": p["pattern"]} if p.get("pattern") else {}),
             **({"inputs": p["inputs"]} if p.get("inputs") else {}),
             **({"narrowed_after_run_1": p["narrowed"]} if p.get("narrowed") else {}),
             **({"directional": p["directional"]} if p.get("directional") else {}),
             "recompute": f"python3 scripts/benchmark_quality/register.py --explain <publisher>:{p['id']}"}
            for p in P
        ],
        "groups": [{"id": g, "what": w,
                    "predicates": [p["id"] for p in P if p["group"] == g]} for g, w in GROUPS],
        "totals": {
            "publishers": len(rows),
            "predicates_per_publisher": len(P),
            "cells": len(rows) * len(P),
            "pass": sum(r["n"]["pass"] for r in rows.values()),
            "fail": sum(r["n"]["fail"] for r in rows.values()),
            "unmeasured": sum(r["n"]["unmeasured"] for r in rows.values()),
            "note": "Counts, not a score. Do not rank publishers by them.",
        },
        "publishers": rows,
        "license": "CC-BY-4.0",
        "attribution": "Council of AI, CSOAI Ltd 16939677, councilof.ai",
        "right_of_reply": "https://councilof.ai/contact",
        "corrections": "https://councilof.ai/api/corrections",
    }


# ── card-v0 per publisher ────────────────────────────────────────────────────────────
def card(reg: dict, pid: str) -> dict:
    r = reg["publishers"][pid]
    worst = {g: [] for g, _ in GROUPS}
    for k, v in r["predicates"].items():
        worst[v["group"]].append(v["result"][0])  # P / F / U
    return {
        "schema": SCHEMA,
        "surface": SURFACE,
        "subject": f"{r['publisher']} — disclosure on three public artifacts, {reg['run_date']}",
        "as_of": reg["run_date"],
        "source_urls": [a["url_effective"] for a in r["artifacts"]],
        "payload": {
            "kind": KIND,
            "flags": {"read_only": True, "keyless": True, "writes_board": False,
                      "no_model_judgment": True, "self_assessed": r["self_assessed"]},
            "publisher": r["publisher"],
            "legal_entity": r["legal_entity"],
            "method": ("35 deterministic predicates over 3 cached artifacts. Scorer: re.search plus an "
                       "RFC 9309 path evaluation. No language model judged anything."),
            "n": r["n"],
            "by_group": {g: "".join(sorted(v)) for g, v in worst.items() if v},
            "artifact_sha256": {a["key"]: a["sha256"] for a in r["artifacts"]},
            "results_surface_client_rendered": r["results_surface_is_client_rendered_shell"],
            "recompute": "python3 scripts/benchmark_quality/register.py --check",
            "full_row": f"https://councilof.ai/interop/benchmark-quality/{reg['run_date']}/{pid}.json",
            "not_a_ranking": "Counts, not a score. This card cannot be compared with another to order publishers.",
        },
        "status": "STAGED",
        "not_a_certificate": True,
    }


# ── rendering ────────────────────────────────────────────────────────────────────────
SYM = {"PASS": "PASS", "FAIL": "FAIL", "UNMEASURED": "UNMEAS"}


def render_md(reg: dict) -> str:
    pids = list(reg["publishers"])
    L = []
    A = L.append
    A(f"# Benchmark-quality register v1 — {reg['run_date']}\n")
    A(f"**{reg['surface']} · status {reg['status']} · not a certificate · no model judged anything here.**\n")
    A(reg["register"] + ". Issued by " + reg["issuer"] + ". " + reg["license"] + ".\n")
    A("Measurement, not certification. Unsolicited; no publisher participated; public artifacts only. "
      "There is no score and no ranking here — the counts are unweighted and non-exhaustive, and ordering "
      "publishers by them is a misuse of this file.\n")
    A("## How to disagree with any cell\n")
    A("```\npython3 scripts/benchmark_quality/register.py --explain <publisher>:<predicate_id>\npython3 scripts/benchmark_quality/register.py --check\n```")
    A("The producer makes no network call. Its whole input is the bytes under "
      "`scripts/fixtures/benchmark-quality/`, whose SHA-256 is printed on every cell.\n")

    A("## Counts per publisher\n")
    A("| publisher | pass | fail | unmeasured | resolved | results surface | self-assessed |")
    A("|---|---|---|---|---|---|---|")
    for pid in pids:
        r = reg["publishers"][pid]
        n = r["n"]
        A(f"| {r['publisher']} | {n['pass']} | {n['fail']} | {n['unmeasured']} | {n['resolved']} | "
          f"{'client-rendered shell' if r['results_surface_is_client_rendered_shell'] else 'server-rendered'} | "
          f"{'YES' if r['self_assessed'] else 'no'} |")
    t = reg["totals"]
    A(f"\n{t['cells']} cells: {t['pass']} PASS, {t['fail']} FAIL, {t['unmeasured']} UNMEASURED. {t['note']}\n")

    for g, what in GROUPS:
        A(f"\n## {g.replace('_', ' ')}\n\n_{what}_\n")
        A("| predicate | " + " | ".join(reg["publishers"][p]["publisher"] for p in pids) + " |")
        A("|---" * (len(pids) + 1) + "|")
        for p in [x for x in P if x["group"] == g]:
            cells = []
            for pid in pids:
                v = reg["publishers"][pid]["predicates"][p["id"]]
                cells.append(SYM[v["result"]])
            A(f"| `{p['id']}` | " + " | ".join(cells) + " |")
        A("")
        for p in [x for x in P if x["group"] == g]:
            A(f"- **`{p['id']}`** — {p['question']} Read from: {p['on']}. {p['why']}")

    A("\n## Every UNMEASURED, with its reason\n")
    for pid in pids:
        r = reg["publishers"][pid]
        um = {k: v for k, v in r["predicates"].items() if v["result"] == "UNMEASURED"}
        if not um:
            continue
        A(f"\n### {r['publisher']} — {len(um)} UNMEASURED\n")
        seen = set()
        for k, v in um.items():
            reason = v.get("reason", "")
            if reason in seen:
                A(f"- `{k}` — as above.")
                continue
            seen.add(reason)
            A(f"- `{k}` — {reason}")

    A("\n## Limitations\n")
    for x in reg["limitations"]:
        A(f"- {x}")
    A("\n## Right of reply\n")
    A("Any publisher named here may reply, and the reply is published beside the row, unedited, whether or "
      "not we agree with it. Where a cell is shown to be wrong the row is recomputed and the correction is "
      "published; a signed row is superseded, never edited. "
      f"Right of reply: {reg['right_of_reply']} · Corrections: {reg['corrections']}\n")
    return "\n".join(L) + "\n"


# ── main ─────────────────────────────────────────────────────────────────────────────
def outputs(reg: dict) -> dict[pathlib.Path, str]:
    d = ROOT / "docs" / "product" / "benchmark-quality" / reg["run_date"]
    files: dict[pathlib.Path, str] = {
        d / "register.json": json.dumps(reg, indent=2, sort_keys=True) + "\n",
        d / "register.md": render_md(reg),
    }
    interop = ROOT / "public" / "interop" / "benchmark-quality"
    idx = {
        "schema": f"https://councilof.ai/schema/{SURFACE}.json",
        "surface": SURFACE, "status": "STAGED", "as_of": reg["run_date"],
        "not_a_certificate": True, "no_model_judgment": True,
        "register": reg["register"],
        "license": reg["license"], "attribution": reg["attribution"],
        "measured_gate": reg["measured_gate"],
        "self_assessment": reg["self_assessment"],
        "recompute": reg["method"]["recompute"],
        "totals": reg["totals"],
        "full_register": f"https://councilof.ai/interop/benchmark-quality/{reg['run_date']}/register.json",
        "publishers": [],
    }
    for pid in reg["publishers"]:
        c = card(reg, pid)
        body = json.dumps(c["payload"], separators=(",", ":"), sort_keys=True).encode()
        if len(body) > MAX_CARD_PAYLOAD_BYTES:
            raise SystemExit(f"card {pid} payload is {len(body)} bytes, cap is {MAX_CARD_PAYLOAD_BYTES}")
        files[d / "cards" / f"{pid}.json"] = json.dumps(c, indent=2, sort_keys=True) + "\n"
        files[interop / reg["run_date"] / f"{pid}.json"] = json.dumps(c, indent=2, sort_keys=True) + "\n"
        r = reg["publishers"][pid]
        idx["publishers"].append({
            "id": pid, "publisher": r["publisher"], "self_assessed": r["self_assessed"],
            "n": r["n"], "status": "STAGED",
            "card": f"https://councilof.ai/interop/benchmark-quality/{reg['run_date']}/{pid}.json",
            "card_payload_bytes": len(body),
        })
    files[interop / "index.json"] = json.dumps(idx, indent=2, sort_keys=True) + "\n"
    # THE FUNCTION'S DATA IS WRITTEN HERE, NOT TYPED THERE. functions/api/benchmark-quality.ts
    # imports this module and hand-maintains none of it, so the served payload cannot drift
    # from the register: --check regenerates this file and fails on a byte difference.
    # A TS module rather than a JSON import because the repo's export tool loads that door
    # under `node --experimental-strip-types`, which rejects a JSON import without an
    # attribute — a static JSON import would have silently broken an existing script.
    files[ROOT / "functions" / "api" / "_benchmark-quality-v1.ts"] = (
        "// GENERATED by scripts/benchmark_quality/register.py — do not edit.\n"
        "// Regenerate:  python3 scripts/benchmark_quality/register.py\n"
        "// Verify:      python3 scripts/benchmark_quality/register.py --check\n"
        "export const V1_INDEX = " + json.dumps(idx, indent=2, sort_keys=True) + " as const;\n"
    )
    files[interop / reg["run_date"] / "register.json"] = json.dumps(reg, indent=2, sort_keys=True) + "\n"
    return files


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="recompute and exit 1 on any drift")
    ap.add_argument("--explain", metavar="PUB:PRED", help="print one cell, its bytes and its verdict")
    a = ap.parse_args()

    if a.explain:
        pid, _, prid = a.explain.partition(":")
        if pid not in PUBLISHERS:
            print(f"unknown publisher {pid!r}; known: {', '.join(PUBLISHERS)}", file=sys.stderr)
            return 2
        res = evaluate(pid)
        if prid not in res:
            print(f"unknown predicate {prid!r}", file=sys.stderr)
            return 2
        p = next(x for x in P if x["id"] == prid)
        v = res[prid]
        print(f"publisher : {PUBLISHERS[pid]['name']} ({pid}){'  [SELF-ASSESSED]' if pid in SELF_ASSESSED else ''}")
        print(f"predicate : {prid}  [{p['group']}]")
        print(f"question  : {p['question']}")
        print(f"read from : {p['on']}")
        if p.get("pattern"):
            print(f"pattern   : {p['pattern']}")
        print(f"artifact  : {v['evidence'].get('source_url')}")
        print(f"fetched   : {v['evidence'].get('fetched')}   sha256 {v['evidence'].get('sha256')}")
        print(f"RESULT    : {v['result']}")
        if p.get("narrowed"):
            print(f"narrowed  : {p['narrowed']}")
        if v.get("evidence", {}).get("matched"):
            print(f"matched   : {v['evidence']['matched']!r}")
        if v.get("evidence", {}).get("context"):
            print(f"context   : …{v['evidence']['context']}…")
        if v.get("reason"):
            print(f"reason    : {v['reason']}")
        print(f"why it is here: {p['why']}")
        return 0

    reg = build()
    files = outputs(reg)
    drift = []
    for path, content in files.items():
        if a.check:
            if not path.exists():
                drift.append(f"MISSING  {path.relative_to(ROOT)}")
            elif path.read_text() != content:
                drift.append(f"DRIFTED  {path.relative_to(ROOT)}  "
                             f"(on disk sha256 {hashlib.sha256(path.read_bytes()).hexdigest()[:16]}, "
                             f"recomputed {hashlib.sha256(content.encode()).hexdigest()[:16]})")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content)
            print(f"wrote {path.relative_to(ROOT)}")
    if a.check:
        if drift:
            print("DRIFT — the committed register is not what these fixtures produce:", file=sys.stderr)
            for d_ in drift:
                print("  " + d_, file=sys.stderr)
            return 1
        print(f"OK — {len(files)} files match the register recomputed from "
              f"{sum(1 for _ in FIXTURES.glob('*/*.body'))} cached artifacts.")
    else:
        t = reg["totals"]
        print(f"\n{t['publishers']} publishers x {t['predicates_per_publisher']} predicates = {t['cells']} cells: "
              f"{t['pass']} PASS, {t['fail']} FAIL, {t['unmeasured']} UNMEASURED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
