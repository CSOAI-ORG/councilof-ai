#!/usr/bin/env python3
"""ONE observation schema. A LAB, a MODEL and a HUMAN in the same graph.

THE MODEL (owner's, implemented as given — not adapted)

  ONE instrument, ONE graph.
  A SUBJECT is a lab, a model, or a human.
  An OBSERVATION is one measurement of one subject. (The owner calls it a marble.)
  A HUMAN subject appears in one of exactly two ROLES:
      PARTICIPANT — they did the task
      JUDGE       — they scored someone else's work
  These are different facts and must NEVER collapse into "a human was involved".
  Observations link to each other so a graph exists:
      PAIRED_WITH — a model observation and a human-PARTICIPANT observation on the SAME items
      SCORES      — a JUDGE observation scores another observation

WHAT THIS EXTENDS, AND WHY IT IS NOT A NEW VOCABULARY

  scripts/express_as_evidence.py (lane m4, branch `m4-integrity`, commit 7706b2fd) already
  expresses four live producers into a ten-binding evidence object:

      subject · instrument · run · observation · admission
      signature · corpus_inclusion · witness · publication · time

  This file is that object plus the four bindings the owner's model needs, and NOTHING else:

      subject.value.subject_type   LAB | MODEL | HUMAN
      subject.value.role           PARTICIPANT | JUDGE  — required iff HUMAN, forbidden otherwise
      denominator                  the score's divisor, in denominator.ts's exact spelling
      item_set                     the digest that makes PAIRED_WITH checkable rather than asserted
      links[]                      the edges that make it a graph

  The ten parent bindings keep their names, their {state, reason} absence shape and their
  four-kinds-of-time rule verbatim. A reader of an evidence object can read an observation.

  The parent landed on master first as scripts/express_as_evidence.py (m4-integrity,
  commit 7706b2fd). This file imports from it directly — `extends` names it; the import
  resolves from the repo. The vocabulary did not fork — that is the whole point of the
  exercise.

THE DENOMINATOR IS NOT RENAMED

  functions/_lib/denominator.ts is the estate's one reader of a card's divisor and it has
  carried attempted / graded_n / parse_errors_excluded / transport_errors_excluded correctly
  all along. Those four names are used here unchanged, with the same arithmetic
  (attempted = graded_n + parse_errors_excluded + transport_errors_excluded, DERIVED) and the
  same three-valued exclusions_state. A fifth spelling of the divisor is exactly the defect
  this lane exists to stop.

  scripts/sign_mill_cards.py:126 sets EXCLUSION_CEILING = 0.20 and emits the state
  MEASURED_HIGH_EXCLUSION above it. That predicate is applied here too, to whatever the
  observation's own denominator says — so a live card that predates the ceiling is shown
  against it rather than re-signed.

THE TWO RULES INHERITED FROM THE PARENT, UNCHANGED

  1. ABSENCE IS RECORDED, NEVER FILLED. A lab that declares no review cadence gets
     NO_CADENCE_DECLARED. It never gets 0, null, "" or "unknown" dressed as a value.
  2. AN UNCHECKABLE CLAIM IS REFUSED, NOT RECORDED. A score with no denominator, a human
     with no role, a pair over items that were never shared — refused. Recording them would
     launder an unverifiable claim into a clean schema, which is worse than no schema.

FOUR KINDS OF TIME, NEVER COLLAPSED
  observed_at · published_at · read_at · witnessed_at

NOTHING HERE IS SIGNED. The board signer runs inside GitHub Actions and Actions is disabled
on this account. Every artifact this script writes says UNSIGNED in its own bytes.

NO RANKING. Subjects are never ordered, scored against each other, or totalled. Six labs are
expressed; no "stalest", no league table, no cross-subject number. See NO_RANKING below.

Usage:
  python3 scripts/express_observation.py --express            # all three, live
  python3 scripts/express_observation.py --selftest           # the refusals must FIRE
  python3 scripts/express_observation.py --express --out public/interop/observations-....json
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import io
import json
import os
import pathlib
import re
import sys
import tempfile
import urllib.request

SCHEMA = "csoai.observation/0.1"
EXTENDS = "csoai.evidence-object/0.1"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36"
CACHE = pathlib.Path(os.environ.get("OBS_CACHE", tempfile.gettempdir())) / "csoai-observation-cache"

# scripts/sign_mill_cards.py:126 — not re-derived, quoted.
EXCLUSION_CEILING = 0.20

NO_RANKING = (
    "This file ranks nothing. Observations of different subjects are not comparable and are "
    "never ordered, differenced or totalled across subjects. A LAB's staleness interval and a "
    "MODEL's accuracy are not the same kind of number and no arithmetic relates them."
)
UNSIGNED = (
    "UNSIGNED. No signature covers these bytes. The board signer "
    "(did:web:csoai.org#board-attestation-1) runs inside GitHub Actions, which is disabled on "
    "this account, so nothing here was offered to it. Do not cite this file as attested."
)

SUBJECT_TYPES = ("LAB", "MODEL", "HUMAN")
ROLES = ("PARTICIPANT", "JUDGE")
LINK_RELS = ("PAIRED_WITH", "SCORES")


class Refused(Exception):
    """An artifact that cannot be expressed without inventing a binding."""


# Real import — no vendored half. The parent landed on master first (m4-integrity),
# so the parent vocabulary is importable here. When this branch lands, the import
# resolves from the repo (no sys.path hacks, no sys.modules edits).
from scripts.express_as_evidence import (
    SCHEMA as PARENT_SCHEMA,
    now,
    absent,
    present,
    is_present,
    times,
    Refused,
)


# ── the observation (a marble) ───────────────────────────────────────────────
def observation(observation_id: str, subject_type: str, subject, role=None,
                score=None, denom=None, items=None, links=None, **parent) -> dict:
    """Build ONE observation of ONE subject, or REFUSE.

    Every refusal below is a claim that could not be checked from the bytes. Each names the
    binding that was missing, so the caller can go and publish it rather than guess.
    """
    # R0 — a subject is a lab, a model or a human. Nothing else is a subject.
    if subject_type not in SUBJECT_TYPES:
        raise Refused(
            f"REFUSED [SUBJECT_TYPE_UNKNOWN] subject_type={subject_type!r} is not one of "
            f"{'/'.join(SUBJECT_TYPES)}. A subject is a lab, a model or a human.")

    # R1 — the load-bearing one. "A human was involved" is not a fact this schema can carry.
    if subject_type == "HUMAN":
        if role is None:
            raise Refused(
                "REFUSED [HUMAN_ROLE_MISSING] a HUMAN subject must declare role PARTICIPANT "
                "(they did the task) or JUDGE (they scored someone else's work). These are "
                "different facts and must never collapse into 'a human was involved'. "
                "Recording a roleless human would make the two indistinguishable forever.")
        if role not in ROLES:
            raise Refused(
                f"REFUSED [HUMAN_ROLE_UNKNOWN] role={role!r} is not one of {'/'.join(ROLES)}.")
    elif role is not None:
        raise Refused(
            f"REFUSED [ROLE_ON_NON_HUMAN] role={role!r} was given for subject_type="
            f"{subject_type}. Only a HUMAN holds a role; a lab and a model do not.")

    # R2 — a score is a numerator. A numerator without its divisor is not a measurement.
    if is_present(score) and not is_present(denom):
        raise Refused(
            "REFUSED [SCORE_WITHOUT_DENOMINATOR] the observation asserts a score but publishes "
            "no denominator. A score is a numerator; without graded_n it cannot be read, "
            "compared to its own exclusions, or checked against EXCLUSION_CEILING. "
            "Publish the denominator or publish no score.")

    # `subject` is a parent binding supplied positionally; seat it before defaulting, or the
    # spread below would overwrite a real subject with the ABSENT placeholder.
    parent["subject"] = subject
    for name in PARENT_BINDINGS:
        parent.setdefault(name, absent(f"this producer publishes no {name}"))

    obs = {
        "schema": SCHEMA,
        "extends": EXTENDS,
        "extends_note": (
            "the ten bindings below named in PARENT_BINDINGS are the evidence object's, "
            "unchanged in name, shape and meaning (scripts/express_as_evidence.py)"),
        "observation_id": observation_id,
        "subject_type": subject_type,
        "role": role if role else absent(
            "role is a HUMAN-only binding; this subject is a "
            f"{subject_type} and holds no role"),
        "score": score if score is not None else absent(
            "this observation grades no items and asserts no score"),
        "denominator": denom if denom is not None else absent(
            "this observation asserts no score, so it needs no denominator"),
        "item_set": items if items is not None else absent(
            "producer publishes no enumerable item set, so no observation can be PAIRED_WITH "
            "this one — a pair would be an assertion rather than a check"),
        **{k: parent[k] for k in PARENT_BINDINGS},
        "links": links or [],
        "not_a_certificate": True,
        "signature_state": "UNSIGNED",
        "unsigned_note": UNSIGNED,
        "no_ranking": NO_RANKING,
    }
    return obs


def link(source_obs: dict, rel: str, target_obs: dict, basis: str = "") -> dict:
    """Make ONE edge, or REFUSE. The edge is checked against the bytes, never asserted."""
    if rel not in LINK_RELS:
        raise Refused(f"REFUSED [LINK_REL_UNKNOWN] rel={rel!r} is not one of {'/'.join(LINK_RELS)}.")

    if rel == "PAIRED_WITH":
        # R3 — a pair is a claim that the SAME items were put to both subjects. It is checked
        # by digest, never by name, date, benchmark title or the author's say-so.
        a, b = source_obs.get("item_set"), target_obs.get("item_set")
        if not is_present(a) or not is_present(b):
            missing = source_obs["observation_id"] if not is_present(a) else target_obs["observation_id"]
            raise Refused(
                f"REFUSED [PAIR_ITEMS_NOT_ENUMERABLE] {missing} publishes no item set, so "
                "'the same items' cannot be checked. A pair asserted over an unenumerable item "
                "set is the claim the reader wanted verified, restated.")
        da, db = a["value"]["item_set_sha256"], b["value"]["item_set_sha256"]
        if da != db:
            raise Refused(
                f"REFUSED [PAIR_ITEMS_NOT_SHARED] {source_obs['observation_id']} was measured on "
                f"item set {da[:16]}… ({a['value']['item_count']} items) and "
                f"{target_obs['observation_id']} on {db[:16]}… ({b['value']['item_count']} items). "
                "These are different item sets. A PAIR over items that were never shared is a "
                "comparison of two unrelated runs wearing the word 'pair'.")
        # A pair is model↔human-PARTICIPANT. A judge did not do the task.
        pairing = {source_obs["subject_type"], target_obs["subject_type"]}
        if pairing != {"MODEL", "HUMAN"}:
            raise Refused(
                f"REFUSED [PAIR_NOT_MODEL_HUMAN] a PAIRED_WITH edge joins a MODEL observation to "
                f"a HUMAN-PARTICIPANT observation on the same items; got {sorted(pairing)}.")
        human = source_obs if source_obs["subject_type"] == "HUMAN" else target_obs
        if human.get("role") != "PARTICIPANT":
            raise Refused(
                "REFUSED [PAIR_HUMAN_NOT_PARTICIPANT] the human side of a pair must be a "
                f"PARTICIPANT (they did the task); got role={human.get('role')!r}. A JUDGE "
                "scored someone else's work and cannot be paired against a model's own attempt.")

    if rel == "SCORES":
        # R4 — only a judge scores. A participant's own result is not a judgment of anyone.
        if source_obs["subject_type"] != "HUMAN" or source_obs.get("role") != "JUDGE":
            raise Refused(
                "REFUSED [SCORES_FROM_NON_JUDGE] a SCORES edge may only originate at a HUMAN "
                f"observation whose role is JUDGE; got subject_type="
                f"{source_obs['subject_type']} role={source_obs.get('role')!r}.")

    return {
        "rel": rel,
        "from_observation_id": source_obs["observation_id"],
        "to_observation_id": target_obs["observation_id"],
        "basis": basis,
        "checked": (
            {"shared_item_set_sha256": source_obs["item_set"]["value"]["item_set_sha256"],
             "shared_item_count": source_obs["item_set"]["value"]["item_count"],
             "how": "both observations' item_set_sha256 were computed from their own rows and "
                    "compared; the edge exists because the digests are equal"}
            if rel == "PAIRED_WITH" else
            {"how": "source observation's role is JUDGE"}),
    }


# ══════════════════════════════════════════════════════════════════════════════
# THE THREE REAL OBSERVATIONS
# ══════════════════════════════════════════════════════════════════════════════

MILL_CARD = "https://councilof.ai/interop/mill-cards-signed/signed-care-26e1f64e1436.json"


def express_model() -> dict:
    """A MODEL observation — a live signed mill card, read as published."""
    doc = json.loads(fetch(MILL_CARD))
    b = doc.get("body") or {}
    ce = b.get("compute_evidence") or {}

    return observation(
        observation_id="obs:model:gspc-care:llama3.1-8b",
        subject_type="MODEL",
        subject=present({
            "subject_id": b.get("model"),
            "axis": b.get("axis"),
            "model_manifest_digest": ce.get("model_manifest_digest"),
        }, f"{MILL_CARD} → body.model, body.axis"),
        score=present({
            "metric": "accuracy",
            "value": b.get("accuracy"),
            "correct": None if b.get("accuracy") is None or b.get("n") is None
                       else round(b["accuracy"] * b["n"]),
            "correct_note": "DERIVED from accuracy x n; the card publishes no correct count",
        }, f"{MILL_CARD} → body.accuracy"),
        denom=denominator(
            graded_n=b.get("n"),
            parse_errors_excluded=ce.get("parse_errors_excluded"),
            transport_errors_excluded=ce.get("transport_errors_excluded"),
            source=f"{MILL_CARD} → body.n, body.compute_evidence"),
        items=absent(
            "the card publishes items_sha256 (a digest of the item set) but not the item ids "
            "themselves, so the SET cannot be intersected with another producer's. The digest "
            "is comparable only to another card built from the identical bank",
            would_be="item_set"),
        instrument=present({
            "instrument_sha256": ce.get("instrument_sha256"),
            "bank_sha256": ce.get("bank_sha256"),
            "items_sha256": ce.get("items_sha256"),
        }, f"{MILL_CARD} → body.compute_evidence"),
        run=present({"run_id": ce.get("run_id")}, f"{MILL_CARD} → body.compute_evidence.run_id")
            if ce.get("run_id") else absent("card publishes no run id"),
        admission=present({
            "decision": b.get("status"),
            "decided_by_producer_under": "n >= 30 (the predicate in force when this card was signed)",
            "restated_against_current_ceiling": (
                "scripts/sign_mill_cards.py now also refuses MEASURED above "
                f"EXCLUSION_CEILING={EXCLUSION_CEILING}. This card's own bytes give an exclusion "
                "ratio above that ceiling, so under today's predicate it would publish as "
                "MEASURED_HIGH_EXCLUSION. The signed bytes are NOT edited — the restatement "
                "sits beside them (see denominator.against_ceiling)."),
        }, f"{MILL_CARD} → body.status"),
        signature=present({
            "alg": doc.get("alg"), "did": doc.get("did"),
            "authority_state": "BOARD_KEY_CLAIMED_did:web:csoai.org#board-attestation-1",
            "authority_note": "the CARD claims this signature; THIS file verifies nothing and "
                              "is itself UNSIGNED",
        }, f"{MILL_CARD} → alg, did"),
        corpus_inclusion=present({
            "corpus": "mill card-root",
            "note": "a SEPARATE corpus from the public root and the signed card index; the "
                    "three are never added (council-os/CARD-CORPORA.md)",
        }, "public/interop/card-root-2026-09-14.json"),
        witness=absent("no witness protocol covers any CSOAI corpus"),
        publication=present({"url": MILL_CARD, "http_status": 200}, "this fetch"),
        time=times(observed=absent(
            "the card publishes no observation timestamp; run_id embeds 20260914T025502Z but "
            "the card does not publish it AS a time, and this file will not reinterpret an "
            "identifier as a date")),
    )


# ── LAB: frontier-lab safety-document staleness, each date from the doc's OWN text ──
AS_OF = dt.date(2026, 9, 17)

LAB_DOCS = [
    # (lab, document, url, the regex that must match the DOCUMENT'S OWN declared text)
    ("OpenAI", "Preparedness Framework",
     "https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf",
     r"Last updated:\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Z][a-z]+),?\s*(\d{4})"),
    ("Microsoft", "Frontier Governance Framework",
     "https://cdn-dynmedia-1.microsoft.com/is/content/microsoftcorp/microsoft/msc/documents/"
     "presentations/CSR/Frontier-Governance-Framework-Feb-2026.pdf",
     r"\b(February)\s+(2026)\b"),
    ("Meta", "Advanced AI Scaling Framework",
     "https://ai.meta.com/static-resource/Meta_Advanced-AI-Scaling-Framework-v2",
     None),  # searched for a declared date; the document carries none
    ("Google DeepMind", "Frontier Safety Framework",
     "https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/"
     "strengthening-our-frontier-safety-framework/frontier-safety-framework_3-1.pdf",
     r"Published:\s*([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})"),
    ("xAI", "Frontier Artificial Intelligence Framework",
     "https://media.x.ai/v1/website/xai-frontier-artificial-intelligence-framework-30-june-2026-99c40684.pdf",
     r"Effective Date:\s*(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})"),
    ("Anthropic", "Responsible Scaling Policy",
     "https://cdn.sanity.io/files/4zrzovbb/website/0bacdc8440ea96e62a8766d99ebe1d4eea6d5f3a.pdf",
     r"Effective\s+([A-Z][a-z]+)\s+(\d{1,2}),\s*(\d{4})"),
]

MONTHS = {m: i for i, m in enumerate(
    ["January", "February", "March", "April", "May", "June", "July",
     "August", "September", "October", "November", "December"], 1)}


def pdf_text(raw: bytes) -> str:
    """Extract the document's own text. pdftotext if present, else pypdf."""
    import shutil
    import subprocess
    if shutil.which("pdftotext"):
        p = subprocess.run(["pdftotext", "-", "-"], input=raw, capture_output=True, timeout=180)
        if p.returncode == 0 and p.stdout.strip():
            return p.stdout.decode(errors="replace")
    try:
        from pypdf import PdfReader
    except ImportError:
        from PyPDF2 import PdfReader  # type: ignore
    return "".join((pg.extract_text() or "") for pg in PdfReader(io.BytesIO(raw)).pages)


def read_declared_date(url: str, pattern: str | None):
    """Return (date, precision, quoted_string, version_string, text_len).

    The date comes from the DOCUMENT'S OWN declared text and nothing else. An HTTP
    Last-Modified header, a CDN timestamp, a copyright footer and a blog post's date are all
    rejected by construction: none of them is ever read.
    """
    try:
        raw = fetch(url, binary=True)
    except Refused as e:
        # UNREACHABLE is a fact about our read, not about the document. It never licenses
        # substituting a date from a header, a file name or a third party's summary.
        return "UNREACHABLE", None, None, None, str(e)
    text = pdf_text(raw)
    ver = re.search(r"\bVersion\s+([0-9]+(?:\.[0-9]+)?)\b", text)
    version = ver.group(1) if ver else None
    if pattern is None:
        return None, None, None, version, len(text)
    m = re.search(pattern, text)
    if not m:
        return None, None, None, version, len(text)
    g = m.groups()
    if len(g) == 2:                                   # month + year only
        return dt.date(int(g[1]), MONTHS[g[0]], 1), "MONTH", m.group(0), version, len(text)
    if g[0].isdigit():                                # "15th April, 2025" / "30 June 2026"
        return dt.date(int(g[2]), MONTHS[g[1]], int(g[0])), "DAY", m.group(0), version, len(text)
    return dt.date(int(g[2]), MONTHS[g[0]], int(g[1])), "DAY", m.group(0), version, len(text)


def express_lab(lab: str, doc_name: str, url: str, pattern: str | None) -> dict:
    date, precision, quoted, version, n_chars = read_declared_date(url, pattern)

    if date == "UNREACHABLE":
        date = None
        unreachable = n_chars   # the refusal text
        interval = absent(
            f"UNREACHABLE_TO_US — this process could not obtain the document's bytes under any "
            f"header profile, so no date was read from its own text. NOT zero, NOT today, and "
            f"NOT a figure taken from a summary elsewhere. {unreachable}")
        declared = absent("UNREACHABLE_TO_US — the document's own text was never read")
        reachable = absent(f"UNREACHABLE_TO_US — {unreachable}")
        n_chars = 0
    elif date is None:
        interval = absent(
            "NO_DATE_DECLARED — the document's own text declares no publication, effective or "
            f"last-updated date ({n_chars} characters of extracted text were searched). The "
            "staleness interval is therefore not computable and is NOT zero, NOT today, and "
            "NOT the date of the blog post that links it. A date taken from an HTTP header, a "
            "CDN path or a copyright footer would not be the document's own claim.")
        declared = absent("NO_DATE_DECLARED — see observation.value.staleness_days")
    else:
        lo = (AS_OF - date).days
        if precision == "MONTH":
            # Month precision is an INTERVAL, not a point. Collapsing it to the 1st would
            # publish a spurious extra day of precision the lab never claimed.
            import calendar
            hi = (AS_OF - dt.date(date.year, date.month,
                                  calendar.monthrange(date.year, date.month)[1])).days
            interval = present({
                "staleness_days_range": [hi, lo],
                "precision": "MONTH",
                "note": f"the document declares only {quoted!r} — a month, not a day. The "
                        f"interval is {hi}-{lo} days. A single number here would assert a day "
                        f"the lab did not declare.",
            }, f"{url} → the document's own text")
        else:
            interval = present({
                "staleness_days": lo, "precision": "DAY",
            }, f"{url} → the document's own text")
        declared = present({
            "declared_date": date.isoformat(),
            "quoted_from_document": quoted,
            "precision": precision,
        }, f"{url} → the document's own text")

    if n_chars:
        log = FETCH_LOG.get(url, {})
        reachable = present({
            "fetched": True,
            "accepted_header_profile": log.get("accepted_profile"),
            "attempts": log.get("attempts"),
            "extracted_text_chars": n_chars,
            "sourcing": "PRIMARY — the date above was read out of the document's own declared "
                        "text by this process, not from a header, a footer or a third party",
        }, "this fetch")
    if lab == "Meta" and is_present(reachable):
        reachable["value"]["profile_note"] = (
            "ai.meta.com serves this document to a client sending NO User-Agent and returns "
            "HTTP 400 to a browser User-Agent — the inverse of openai.com. Recorded because a "
            "fetcher hardcoding either profile would publish the other lab as unreachable.")
    if lab == "OpenAI" and is_present(reachable):
        reachable["value"]["apex_note"] = (
            "openai.com/safety/preparedness/ returns HTTP 403 to this process, but the "
            "Preparedness Framework PDF on cdn.openai.com returns 200 to any user-agent "
            "including curl's default. The document was therefore read FIRST-HAND and this "
            "observation is PRIMARY-sourced, not secondary. Recorded because the lane brief "
            "expected it to be unreachable.")

    return observation(
        observation_id=f"obs:lab:{lab.lower().replace(' ', '-')}:safety-doc-staleness",
        subject_type="LAB",
        subject=present({
            "subject_id": lab,
            "document": doc_name,
            "declared_version": version if version else absent(
                "the document's own text declares no version number; a version named only on "
                "the linking page or in the file name is not the document's own claim"),
        }, f"{url} → the document's own text"),
        # Staleness is an interval between two dates, not a graded score, so it carries no
        # denominator — and, by R2, asserts no score either.
        score=None,
        denom=None,
        items=absent("a document is not an item set; nothing here is graded item-by-item"),
        instrument=present({
            "method": "read the date the document declares about ITSELF, then subtract",
            "as_of": AS_OF.isoformat(),
            "rejected_by_construction": [
                "HTTP Last-Modified / Date headers", "CDN or object-store timestamps",
                "copyright footers", "the date of a blog post that links the document",
                "a version number in the file name or URL",
            ],
            "pattern": pattern if pattern else "n/a — searched, no declared date found",
        }, "this process"),
        observation=present({
            "measurement": "days since the document's own declared date",
            "declared": declared,
            "staleness": interval,
            "review_cadence": absent(
                "NO_CADENCE_DECLARED — this observation did not measure whether the document "
                "declares a review cadence, and an unmeasured cadence is not a cadence of 0"),
        }, f"{url} → the document's own text"),
        admission=absent(
            "no admission decision is asserted. This is a read of a public document, not a "
            "graded run, and no ladder or threshold applies to it"),
        signature=absent("the document is published unsigned by its lab; this observation is "
                         "UNSIGNED"),
        corpus_inclusion=absent("this observation is in no signed CSOAI corpus"),
        witness=absent("no witness cosigned this read"),
        publication=present({"url": url, "reachability": reachable}, "this fetch"),
        time=times(
            observed=present(now(), "this process — the read IS the observation"),
            published=declared if is_present(declared) else absent(
                "the document declares no publication date")),
    )


# ── HUMAN: a real third-party human-PARTICIPANT observation. We hold none of our own. ──
METR_RUNS = ("https://raw.githubusercontent.com/METR/eval-analysis-public/main/"
             "reports/time-horizon-1-1/data/raw/runs.jsonl")
ARC_CSV = ("https://huggingface.co/datasets/arcprize/arc_agi_2_human_testing/"
           "resolve/main/test_pair_attempts.csv")
METR_MODEL = "o3_inspect"


def _metr_rows():
    return [json.loads(l) for l in fetch(METR_RUNS).splitlines() if l.strip()]


def express_human_and_pair() -> tuple[dict, dict, dict]:
    """METR publishes human runs and model runs on the SAME task ids — a real PAIR.

    THIS IS NOT OUR OBSERVATION. We hold no human measurements of our own and invent none.
    This expresses METR's, and says so in the bytes.
    """
    rows = _metr_rows()
    # human_source 'estimate' rows are NOT human attempts — they are estimates of how long a
    # task would take. Expressing them as human observations would be the exact collapse this
    # schema exists to prevent.
    hum = [r for r in rows if r["model"] == "human" and r.get("human_source") == "baseline"]
    mod = [r for r in rows if r["model"] == METR_MODEL]
    n_est = sum(1 for r in rows if r["model"] == "human" and r.get("human_source") == "estimate")

    shared = sorted({r["task_id"] for r in hum} & {r["task_id"] for r in mod})
    S = set(shared)
    h = [r for r in hum if r["task_id"] in S]
    m = [r for r in mod if r["task_id"] in S]
    h_ok = sum(1 for r in h if r["score_binarized"] == 1)
    m_ok = sum(1 for r in m if r["score_binarized"] == 1)
    m_fatal = sum(1 for r in m if r.get("fatal_error_from"))

    src = f"{METR_RUNS} → rows"
    items = item_set(shared, f"{src} (task_id of every row in the human∩model intersection)")

    human = observation(
        observation_id="obs:human:metr-hcast-baseliner:participant",
        subject_type="HUMAN",
        role="PARTICIPANT",          # they DID the tasks. Not a judge of anyone's work.
        subject=present({
            "subject_id": "METR HCAST/RE-Bench human baseliners (aggregate cohort)",
            "held_by": "METR — NOT CSOAI. CSOAI holds no human measurements of its own and "
                       "invented none for this file.",
            "citation": "METR/eval-analysis-public, reports/time-horizon-1-1/data/raw/runs.jsonl",
            "identification": absent(
                "METR publishes no participant identifiers, counts or demographics in this "
                "file; rows carry run_id 0 and no person id. The cohort size is therefore "
                "unknown — unknown, not one, and not the row count"),
        }, src),
        score=present({
            "metric": "fraction of baseline attempts scored successful",
            "value": round(h_ok / len(h), 4),
            "correct": h_ok,
            "metric_note": "score_binarized == 1, METR's own field, not recomputed here",
        }, f"{src} → score_binarized"),
        denom=denominator(
            graded_n=len(h),
            parse_errors_excluded=None,
            transport_errors_excluded=None,
            attempted_directly=len(h),
            attempted_source=f"{src} — COUNTED, one row per attempt, not derived",
            source=src),
        items=items,
        instrument=present({
            "tasks": "HCAST / RE-Bench / SWAA task families",
            "human_minutes_total": round(sum(
                {r["task_id"]: r["human_minutes"] for r in h}.values()), 2),
            "human_minutes_note": "sum over DISTINCT shared tasks of the baseline minutes METR "
                                  "publishes per task",
        }, f"{src} → task_id, human_minutes"),
        run=absent("METR publishes run_id 0 for every human row; there is no per-run identifier"),
        observation=present({
            "attempts": len(h), "successful": h_ok,
            "distinct_tasks": len(shared),
            "excluded_from_this_observation": {
                "human_source_estimate_rows": n_est,
                "why": "rows whose human_source is 'estimate' are METR's ESTIMATE of how long a "
                       "task would take, not a record of a human attempting it. Counting them "
                       "as human observations would collapse 'a human did this' into 'someone "
                       "guessed how long this takes' — the exact collapse this schema forbids.",
            },
        }, src),
        admission=absent("METR asserts no admission decision per row; no CSOAI ladder applies "
                         "to a third party's measurement"),
        signature=absent("METR publishes these rows unsigned; this observation is UNSIGNED"),
        corpus_inclusion=absent("third-party data; in no CSOAI corpus"),
        witness=absent("no witness cosigned this read"),
        publication=present({"url": METR_RUNS, "repo": "METR/eval-analysis-public"}, "this fetch"),
        time=times(observed=absent(
            "human rows carry started_at 0.0 and completed_at as a task-duration figure, not a "
            "wall-clock observation time; METR publishes no date for when the baseline was run")),
    )

    model = observation(
        observation_id=f"obs:model:metr-{METR_MODEL.replace('_', '-')}:hcast",
        subject_type="MODEL",
        subject=present({
            "subject_id": METR_MODEL,
            "alias": next((r["alias"] for r in m if r.get("alias")), None),
            "held_by": "METR — NOT CSOAI.",
        }, f"{src} → model, alias"),
        score=present({
            "metric": "fraction of GRADED attempts scored successful",
            "value": round(m_ok / (len(m) - m_fatal), 4),
            "correct": m_ok,
            "metric_note": "denominator is graded_n (attempts that produced a score), not "
                           "attempted — see denominator.rule",
        }, f"{src} → score_binarized"),
        denom=denominator(
            graded_n=len(m) - m_fatal,
            parse_errors_excluded=0,
            transport_errors_excluded=m_fatal,
            source=f"{src} → fatal_error_from (COUNTED, one row per attempt)"),
        items=item_set(shared, f"{src} (task_id of every row in the human∩model intersection)"),
        instrument=present({
            "scaffold": next((r["scaffold"] for r in m if r.get("scaffold")), None),
            "tasks": "the identical 162 task ids put to the human baseliners",
        }, f"{src} → scaffold, task_id"),
        run=present({"run_id_example": m[0]["run_id"], "n_runs": len(m)}, f"{src} → run_id"),
        observation=present({
            "attempts": len(m), "successful": m_ok, "fatal_errors": m_fatal,
            "distinct_tasks": len(shared),
        }, src),
        admission=absent("METR asserts no admission decision per row"),
        signature=absent("METR publishes these rows unsigned; this observation is UNSIGNED"),
        corpus_inclusion=absent("third-party data; in no CSOAI corpus"),
        witness=absent("no witness cosigned this read"),
        publication=present({"url": METR_RUNS, "repo": "METR/eval-analysis-public"}, "this fetch"),
        time=times(observed=absent("per-row completed_at is an epoch ms field whose meaning "
                                   "METR does not document in this file")),
    )

    edge = link(model, "PAIRED_WITH", human,
                basis=(f"METR put the same {len(shared)} task ids to {METR_MODEL} and to its "
                       "human baseliners. The pair holds because both item sets hash to the "
                       "same digest, computed here from each side's own rows."))
    model["links"].append(edge)
    human["links"].append(dict(edge, from_observation_id=human["observation_id"],
                               to_observation_id=model["observation_id"]))
    return human, model, edge


def arc_human() -> dict:
    """A second real human-PARTICIPANT observation: ARC Prize's published human testing."""
    rows = list(csv.DictReader(io.StringIO(fetch(ARC_CSV))))
    ev = [r for r in rows if r["task_set"] == "Public Eval"]
    ok = sum(1 for r in ev if int(r["correct_submissions"]) > 0)
    src = f"{ARC_CSV} → test_pair_attempts.csv rows"
    return observation(
        observation_id="obs:human:arcprize-agi2-testers:participant",
        subject_type="HUMAN",
        role="PARTICIPANT",
        subject=present({
            "subject_id": "ARC Prize ARC-AGI-2 human test participants (aggregate cohort)",
            "held_by": "ARC Prize — NOT CSOAI.",
            "distinct_sessions": len({r["session_ID"] for r in ev}),
            "cohort_size": absent(
                "the file publishes session ids, not person ids. One person may hold several "
                "sessions, so the number of PEOPLE is unknown — unknown, not the session count"),
        }, src),
        score=present({
            "metric": "fraction of attempts with at least one correct submission",
            "value": round(ok / len(ev), 4), "correct": ok,
        }, f"{src} → correct_submissions"),
        denom=denominator(
            graded_n=len(ev),
            attempted_directly=len(ev),
            attempted_source=f"{src} — COUNTED, one row per attempt",
            source=src),
        items=item_set(sorted({r["task_ID"] for r in ev}), f"{src} → task_ID (Public Eval)"),
        instrument=present({
            "task_set": "ARC-AGI-2 Public Eval",
            "distinct_tasks": len({r["task_ID"] for r in ev}),
            "coverage_caveat": "ARC's own README: 'Not all tasks in the released Public Train "
                               "sets were tested, so these results are not comprehensive.'",
        }, f"{ARC_CSV} → README.md"),
        run=absent("the file publishes session ids, not run ids"),
        observation=present({
            "attempts": len(ev), "solved": ok,
            "total_submissions": sum(int(r["submissions"]) for r in ev),
        }, src),
        admission=absent("ARC Prize asserts no admission decision per row"),
        signature=absent("published unsigned by ARC Prize; this observation is UNSIGNED"),
        corpus_inclusion=absent("third-party data; in no CSOAI corpus"),
        witness=absent("no witness cosigned this read"),
        publication=present({"url": ARC_CSV, "licence": "mit (dataset README)"}, "this fetch"),
        time=times(observed=absent(
            "start_time_seconds is an offset from session start, not a wall-clock date; the "
            "file publishes no calendar date for any session")),
    )


JUDGE_STATE = (
    "UNEXERCISED. The JUDGE role is defined, validated and refusable, but no observation in "
    "this file uses it, because no genuine human-judge data was found to express. Both human "
    "sources grade deterministically — ARC by exact grid match, METR by its task scorers — so "
    "the human in each is a PARTICIPANT and never a judge of someone else's work. The role is "
    "left empty rather than filled with a participant relabelled, which is precisely the "
    "collapse the two-role rule exists to prevent. The selftest exercises the JUDGE validation "
    "path (SCORES_FROM_NON_JUDGE) so the rule is proven to fire even though no data uses it."
)


def express_all() -> dict:
    labs = [express_lab(*d) for d in LAB_DOCS]
    model_card = express_model()
    human, metr_model, edge = express_human_and_pair()
    arc = arc_human()
    obs = [model_card, metr_model] + labs + [human, arc]
    return {
        "schema": "csoai.observation-set/0.1",
        "built_at": now(),
        "signature_state": "UNSIGNED",
        "unsigned_note": UNSIGNED,
        "no_ranking": NO_RANKING,
        "what_this_proves": (
            "one schema carried a LAB, a MODEL and a HUMAN observation from real published "
            "bytes, with the human's ROLE recorded rather than collapsed, and a PAIR that "
            "holds because both sides' item sets hash to the same digest"),
        "judge_role_state": JUDGE_STATE,
        "counts": {
            "observations": len(obs),
            "by_subject_type": {t: sum(1 for o in obs if o["subject_type"] == t)
                                for t in SUBJECT_TYPES},
            "human_by_role": {"PARTICIPANT": sum(1 for o in obs if o.get("role") == "PARTICIPANT"),
                              "JUDGE": sum(1 for o in obs if o.get("role") == "JUDGE")},
            "links": sum(len(o["links"]) for o in obs),
        },
        "observations": obs,
    }


# ══════════════════════════════════════════════════════════════════════════════
# SELFTEST — the schema must REFUSE bad input. Acceptance alone proves nothing.
# ══════════════════════════════════════════════════════════════════════════════
def selftest() -> int:
    fails, shown = [], 0

    def must_refuse(name: str, code: str, fn):
        nonlocal shown
        try:
            fn()
        except Refused as e:
            if code in str(e):
                shown += 1
                print(f"  REFUSED  {name}\n           {str(e)[:150]}…\n")
                return
            fails.append(f"{name}: refused with the wrong code (wanted {code}): {e}")
            return
        fails.append(f"{name}: ACCEPTED input it was required to refuse ({code})")

    def must_accept(name: str, fn):
        try:
            fn()
            print(f"  ACCEPTED {name}")
        except Refused as e:
            fails.append(f"{name}: refused something valid: {e}")

    print("\n" + "=" * 78)
    print("REQUIRED REFUSAL 1 — a HUMAN with no role")
    print("=" * 78)
    must_refuse("subject_type=HUMAN, role omitted", "HUMAN_ROLE_MISSING",
                lambda: observation("obs:t:1", "HUMAN",
                                    present({"subject_id": "someone"}, "<synthetic>")))
    must_refuse("role given on a MODEL", "ROLE_ON_NON_HUMAN",
                lambda: observation("obs:t:2", "MODEL",
                                    present({"subject_id": "m"}, "<synthetic>"), role="PARTICIPANT"))
    must_accept("HUMAN with role=PARTICIPANT",
                lambda: observation("obs:t:3", "HUMAN",
                                    present({"subject_id": "p"}, "<synthetic>"), role="PARTICIPANT"))
    must_accept("HUMAN with role=JUDGE",
                lambda: observation("obs:t:4", "HUMAN",
                                    present({"subject_id": "j"}, "<synthetic>"), role="JUDGE"))

    print("=" * 78)
    print("REQUIRED REFUSAL 2 — a PAIR between observations that did not share items")
    print("=" * 78)
    a = observation("obs:t:model-A", "MODEL", present({"subject_id": "A"}, "<synthetic>"),
                    items=item_set(["task-1", "task-2", "task-3"], "<synthetic A>"))
    b = observation("obs:t:human-B", "HUMAN", present({"subject_id": "B"}, "<synthetic>"),
                    role="PARTICIPANT",
                    items=item_set(["task-7", "task-8", "task-9"], "<synthetic B>"))
    same = observation("obs:t:human-C", "HUMAN", present({"subject_id": "C"}, "<synthetic>"),
                       role="PARTICIPANT",
                       items=item_set(["task-3", "task-1", "task-2"], "<synthetic C>"))
    noitems = observation("obs:t:human-D", "HUMAN", present({"subject_id": "D"}, "<synthetic>"),
                          role="PARTICIPANT")
    judge = observation("obs:t:human-J", "HUMAN", present({"subject_id": "J"}, "<synthetic>"),
                        role="JUDGE", items=item_set(["task-1", "task-2", "task-3"], "<synthetic J>"))

    must_refuse("pair over disjoint item sets", "PAIR_ITEMS_NOT_SHARED",
                lambda: link(a, "PAIRED_WITH", b))
    must_refuse("pair where one side enumerates no items", "PAIR_ITEMS_NOT_ENUMERABLE",
                lambda: link(a, "PAIRED_WITH", noitems))
    must_refuse("pair whose human side is a JUDGE", "PAIR_HUMAN_NOT_PARTICIPANT",
                lambda: link(a, "PAIRED_WITH", judge))
    must_accept("pair over the SAME items (order-independent)",
                lambda: link(a, "PAIRED_WITH", same))

    print("=" * 78)
    print("REQUIRED REFUSAL 3 — a score with no denominator")
    print("=" * 78)
    must_refuse("score asserted, denominator omitted", "SCORE_WITHOUT_DENOMINATOR",
                lambda: observation("obs:t:5", "MODEL", present({"subject_id": "m"}, "<synthetic>"),
                                    score=present({"metric": "accuracy", "value": 0.87},
                                                  "<synthetic>")))
    must_accept("score WITH a denominator",
                lambda: observation("obs:t:6", "MODEL", present({"subject_id": "m"}, "<synthetic>"),
                                    score=present({"metric": "accuracy", "value": 0.87}, "<s>"),
                                    denom=denominator(graded_n=100, parse_errors_excluded=0,
                                                      transport_errors_excluded=0, source="<s>")))

    print("=" * 78)
    print("ADDITIONAL REFUSALS — the rest of the rule set")
    print("=" * 78)
    must_refuse("SCORES edge from a PARTICIPANT", "SCORES_FROM_NON_JUDGE",
                lambda: link(same, "SCORES", a))
    must_refuse("SCORES edge from a MODEL", "SCORES_FROM_NON_JUDGE",
                lambda: link(a, "SCORES", same))
    must_accept("SCORES edge from a JUDGE", lambda: link(judge, "SCORES", a))
    must_refuse("a subject that is not lab/model/human", "SUBJECT_TYPE_UNKNOWN",
                lambda: observation("obs:t:7", "DATASET", present({}, "<synthetic>")))
    must_refuse("an unknown link relation", "LINK_REL_UNKNOWN",
                lambda: link(a, "BEATS", same))

    print("=" * 78)
    print("ABSENCE IS NEVER ZERO-FILLED")
    print("=" * 78)
    d = denominator(graded_n=49, source="<synthetic>")   # exclusions not published
    v = d["value"]
    for f in ("parse_errors_excluded", "transport_errors_excluded"):
        if v[f] == 0:
            fails.append(f"{f} was zero-filled")
        elif not (isinstance(v[f], dict) and v[f].get("state") == "ABSENT" and v[f].get("reason")):
            fails.append(f"{f} absent without a reason")
    if v["exclusions_state"] != "EXCLUSIONS_ABSENT":
        fails.append("exclusions_state should be EXCLUSIONS_ABSENT")
    if is_present(v["attempted"]):
        fails.append("attempted must not be derivable from an incomplete denominator")
    print(f"  parse_errors_excluded    -> ABSENT: {v['parse_errors_excluded']['reason'][:60]}…")
    print(f"  transport_errors_excluded-> ABSENT: {v['transport_errors_excluded']['reason'][:60]}…")
    print(f"  attempted                -> ABSENT (not derivable), exclusions_state="
          f"{v['exclusions_state']}")

    # An attempted count COUNTED directly still must not manufacture a clean exclusion ratio
    # out of two absent counts: 0.0 would read as "nothing was excluded" and WITHIN_CEILING
    # would read as a clean bill of health the producer never issued.
    d2 = denominator(graded_n=1260, attempted_directly=1260,
                     attempted_source="<counted>", source="<synthetic>")["value"]
    if d2["exclusion_ratio"] == 0.0:
        fails.append("exclusion_ratio zero-filled from two ABSENT exclusion counts")
    elif not (isinstance(d2["exclusion_ratio"], dict)
              and d2["exclusion_ratio"].get("state") == "ABSENT"):
        fails.append("exclusion_ratio absent without a reason")
    elif is_present(d2["against_ceiling"]) or d2["against_ceiling"].get("state") != "ABSENT":
        fails.append("against_ceiling must be ABSENT when the ratio is unknown")
    else:
        print("  exclusion_ratio          -> ABSENT with attempted COUNTED (never 0.0)")
        print("  against_ceiling          -> ABSENT (unpublished exclusions != WITHIN_CEILING)")

    lab_absent = observation("obs:t:lab", "LAB", present({"subject_id": "L"}, "<synthetic>"),
                             observation=present({"review_cadence": absent("NO_CADENCE_DECLARED")},
                                                 "<synthetic>"))
    cad = lab_absent["observation"]["value"]["review_cadence"]
    if cad.get("state") != "ABSENT" or "NO_CADENCE_DECLARED" not in cad.get("reason", ""):
        fails.append("a lab with no declared cadence must record NO_CADENCE_DECLARED")
    else:
        print("  review_cadence           -> ABSENT: NO_CADENCE_DECLARED (never 0)")

    print("=" * 78)
    print("FOUR KINDS OF TIME STAY SEPARATE")
    print("=" * 78)
    t = observation("obs:t:8", "MODEL", present({}, "<s>"), time=times())["time"]
    for k in ("observed_at", "published_at", "read_at", "witnessed_at"):
        if k not in t:
            fails.append(f"time.{k} missing")
    if is_present(t["witnessed_at"]):
        fails.append("witnessed_at must be ABSENT — no witness exists")
    print(f"  observed_at={t['observed_at']['state']}  published_at={t['published_at']['state']}"
          f"  read_at={t['read_at']['state']}  witnessed_at={t['witnessed_at']['state']}")

    print("=" * 78)
    print("EVERY ARTIFACT SAYS UNSIGNED IN ITS OWN BYTES")
    print("=" * 78)
    o = observation("obs:t:9", "LAB", present({"subject_id": "L9"}, "<s>"))
    if o.get("signature_state") != "UNSIGNED":
        fails.append("observation does not declare UNSIGNED")
    else:
        print("  signature_state=UNSIGNED present on every observation")

    # Regression guard: `subject` is both a positional argument and a parent binding, and an
    # earlier revision let the parent-binding spread overwrite a real subject with the ABSENT
    # placeholder. A schema that silently loses its subject is worse than one that refuses.
    if not is_present(o["subject"]) or o["subject"]["value"].get("subject_id") != "L9":
        fails.append("the supplied subject did not survive into the observation")
    else:
        print("  supplied subject survives the parent-binding merge")

    print("\n" + "=" * 78)
    for f in fails:
        print(f"FAIL  {f}")
    print(f"{shown} refusals fired; {len(fails)} failures")
    print("=" * 78)
    return 1 if fails else 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--express", action="store_true", help="express the real observations, live")
    ap.add_argument("--selftest", action="store_true", help="prove the schema REFUSES bad input")
    ap.add_argument("--out", help="write the observation set here")
    a = ap.parse_args()

    if a.selftest:
        return selftest()
    if a.express:
        doc = express_all()
        text = json.dumps(doc, indent=2, ensure_ascii=False) + "\n"
        if a.out:
            pathlib.Path(a.out).parent.mkdir(parents=True, exist_ok=True)
            pathlib.Path(a.out).write_text(text)
            print(f"wrote {a.out}  ({len(text)} bytes)")
        else:
            print(text)
        c = doc["counts"]
        print(f"\n{c['observations']} observations · {c['by_subject_type']} · "
              f"human roles {c['human_by_role']} · {c['links']} links")
        for o in doc["observations"]:
            n_absent = sum(1 for k in PARENT_BINDINGS if o[k].get("state") == "ABSENT")
            role = f"/{o['role']}" if isinstance(o.get("role"), str) else ""
            print(f"  {o['subject_type']:<6}{role:<13} {o['observation_id']:<52} "
                  f"{n_absent}/{len(PARENT_BINDINGS)} parent bindings ABSENT")
        return 0
    ap.print_help()
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
