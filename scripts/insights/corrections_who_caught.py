#!/usr/bin/env python3
"""Who catches the errors in our published corrections record?

Evidence note: /notes/who-caught-our-published-errors/

Reads the signed corrections record served at https://councilof.ai/api/corrections (or a saved copy
of it), checks that its content id recomputes from the bytes, and counts the entries by the
`detected_by` field each entry carries, by the month in each entry's `date`, and by whether the
entry records when its correction went live (`published_at`).

Entries whose `detected_by` is `external report` are grouped into separate outside reports with the
hand-assigned table OUTSIDE_REPORTS below. Each assignment quotes the basis in the entry's own
`how_caught` or `timing_evidence`. A report is counted as separate when its date or channel differs
from every other. The script refuses to run if an outside entry has no assignment, so a new outside
report cannot be silently folded into an old one.

`detected_by` is our own label; this script counts it and does not re-judge it. Standard library
only. Measurement, not certification: a correction entry is evidence of what we recorded about an
error, not proof that every error was recorded.

    python3 scripts/insights/corrections_who_caught.py                     # fetch live, print JSON
    python3 scripts/insights/corrections_who_caught.py --in corrections.json --out \\
        public/interop/insights/corrections-who-caught-2026-11-24.json
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import sys
import urllib.request

SOURCE = "https://councilof.ai/api/corrections"

GROUP = {
    "internal audit": "our own checks",
    "internal monitor": "our own checks",
    "persona test": "our own checks",
    "self-report": "our own checks",
    "external report": "outside readers",
    "UNRECORDED": "not recorded",
}

# entry id -> (report key, basis quoted from the entry). One key per separate outside report.
OUTSIDE_REPORTS = {
    "C-2026-0819-01": ("2026-08-19 live-surface audit", "how_caught: 'External live-surface audit; confirmed by direct curl.'"),
    "C-2026-0826-06b": ("2026-08-26 live-site audit", "how_caught: 'Outside audit of the live site, 2026-08-26 (finding D9).'"),
    "C-2026-0826-07b": ("2026-08-26 live-site audit", "how_caught: 'Outside audit of the live site, 2026-08-26 (finding D8).'"),
    "C-2026-0826-08b": ("2026-08-26 live-site audit", "how_caught: 'Outside audit of the live site, 2026-08-26 (finding A3)'"),
    "C-2026-0826-09": ("2026-08-26 live-site audit", "how_caught: 'Outside audit of the live site, 2026-08-26 (finding D11).'"),
    "C-2026-0826-10": ("2026-08-26 live-site audit", "how_caught: 'Outside audit of the live site, 2026-08-26 (finding D10).'"),
    "C-2026-0826-11": ("2026-08-26 live-site audit", "how_caught: 'Outside audit of the live site, 2026-08-26 (finding P1).'"),
    "C-2026-0826-12": ("2026-08-26 live-site audit", "how_caught: 'Outside audit of the live site, 2026-08-26 (finding A2).'"),
    "C-2026-0826-08": ("2026-08-26 live-site audit", "how_caught: 'An outside auditor with no CSOAI code and no CSOAI credentials'; no finding code, same date, so assigned to the audit of that day (conservative: lowers the count of separate reports)"),
    "C-2026-0826-07": ("2026-08-26 IETF list implementer", "how_caught: 'An outside SCITT implementer followed our post to the IETF list'"),
    "C-2026-0902-10": ("2026-09-02 IETF agentproto list objection", "how_caught: 'IETF agentproto list, 31 Aug-2 Sep 2026: an objection to the offline-verification sentence'"),
    "C-2026-0905-02": ("2026-09-05 outside review", "how_caught: 'Outside review of the estate on 2026-09-05'"),
    "C-2026-0917-02": ("2026-09-17 outside correspondent", "timing_evidence: 'the external correspondent's report preceded it'"),
    "C-2026-0928-01": ("2026-09-28 IETF SCITT architecture issue", "how_caught: 'IETF SCITT architecture issue #462, opened by an outside participant'"),
    "C-2026-1118-01": ("2026-11-18 independent security researcher", "how_caught: 'an independent security researcher ... reported it to us privately'"),
}


def content_id(doc: dict) -> tuple[str, str]:
    check = doc.get("signature_check") or {}
    strip = set(check.get("unsigned_wrapper_fields") or [])
    if not strip:
        raise SystemExit("record carries no unsigned_wrapper_fields; cannot recompute its content id")
    body = {k: v for k, v in doc.items() if k not in strip}
    canon = json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()
    attested = ((doc.get("signature") or {}).get("attestation") or {}).get("content_id") or check.get("attested_content_id")
    return hashlib.sha256(canon).hexdigest(), attested


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="inp", help="saved copy of /api/corrections (default: fetch live)")
    ap.add_argument("--out", help="write the table here")
    a = ap.parse_args()
    if a.inp:
        raw = open(a.inp, "rb").read()
    else:
        # The zone refuses urllib's default client signature (Cloudflare 1010; correction
        # C-2026-0917-02, still open as an owner dashboard action), so name this script honestly.
        req = urllib.request.Request(SOURCE, headers={"User-Agent": "councilof-ai-insights/0.1 (+https://github.com/CSOAI-ORG/councilof-ai)"})
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
    doc = json.loads(raw)
    recomputed, attested = content_id(doc)
    if recomputed != attested:
        raise SystemExit(f"content id {recomputed} does not match the attested {attested}; refusing to count a record that moved since it was signed")
    entries = doc["corrections"]

    by_label = collections.Counter(e.get("detected_by", "UNRECORDED") for e in entries)
    unknown = sorted(set(by_label) - set(GROUP))
    if unknown:
        raise SystemExit(f"detected_by values with no group: {unknown}")
    by_group = collections.Counter(GROUP[e.get("detected_by", "UNRECORDED")] for e in entries)

    outside = [e for e in entries if e.get("detected_by") == "external report"]
    unmapped = sorted(e["id"] for e in outside if e["id"] not in OUTSIDE_REPORTS)
    stale = sorted(set(OUTSIDE_REPORTS) - {e["id"] for e in outside})
    if unmapped or stale:
        raise SystemExit(f"OUTSIDE_REPORTS out of date: unmapped {unmapped}, no longer outside {stale}")
    reports = collections.defaultdict(list)
    for e in outside:
        reports[OUTSIDE_REPORTS[e["id"]][0]].append(e["id"])

    by_month = collections.defaultdict(collections.Counter)
    for e in entries:
        by_month[e["date"][:7]][GROUP[e.get("detected_by", "UNRECORDED")]] += 1

    def recorded(v) -> bool:
        return isinstance(v, str) and v != "UNRECORDED" and v[:4].isdigit()

    published_recorded = sorted(e["id"] for e in entries if recorded(e.get("published_at")))
    detected_recorded = sum(recorded(e.get("detected_at")) for e in entries)

    out = {
        "schema": "csoai.insight.corrections-who-caught/0.1",
        "note": "/notes/who-caught-our-published-errors/",
        "source": SOURCE,
        "source_content_id": recomputed,
        "source_content_id_check": "sha256 of the record with its unsigned_wrapper_fields removed, json.dumps(sort_keys=True, separators=(',',':'), ensure_ascii=True); equals the attested content_id. The Ed25519 signature over the attestation is checked by the endpoint itself (signature_check) and can be re-checked with any Ed25519 library under the published key.",
        "entries": len(entries),
        "by_detected_by": dict(by_label.most_common()),
        "by_group": dict(by_group.most_common()),
        "group_rule": GROUP,
        "outside_reports": {
            "entries": len(outside),
            "separate_reports": len(reports),
            "rule": "one report per distinct date and channel; an unlabelled outside entry on the date of a labelled audit is assigned to that audit, which can only lower this count",
            "reports": [
                {"report": k, "entries": len(v), "ids": sorted(v), "basis": [OUTSIDE_REPORTS[i][1] for i in sorted(v)]}
                for k, v in sorted(reports.items())
            ],
        },
        "by_month": {m: dict(c) for m, c in sorted(by_month.items())},
        "timing": {
            "detected_at_recorded": detected_recorded,
            "published_at_recorded": len(published_recorded),
            "published_at_recorded_ids": published_recorded,
            "why_no_time_to_fix_summary": "published_at is UNRECORDED for most entries, so a time to fix cannot be computed for the record as a whole; the endpoint's own correction_latency block reports the few that can be measured",
        },
        "limits": [
            "detected_by is our own label on each entry; it is counted here, not re-judged",
            "an error nobody recorded is absent from this record and from this table",
            "fewer entries per month can mean fewer errors or less recording; the record does not say which",
        ],
    }
    text = json.dumps(out, indent=1, ensure_ascii=False) + "\n"
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text)
    sys.stdout.write(text if not a.out else f"wrote {a.out}: {len(entries)} entries, {len(outside)} outside in {len(reports)} reports\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
