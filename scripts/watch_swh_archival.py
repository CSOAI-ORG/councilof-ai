#!/usr/bin/env python3
"""Daily readback of Software Heritage VISITS for this estate's source origins.

Not a second copy of loops/swh-archive.sh. That loop SUBMITS save requests and
keeps a ledger of the ones that came back with a SWHID. This reads the durable
side -- `origin/<url>/visits/` -- which answers a question the ledger cannot:
"is this origin still being archived?", whether or not we asked today.

It exists because three things hid a week-long outage (verified 2026-09-23):

  1. swh-archive.sh appends the canonical GitHub origin LAST to a ~109-origin
     queue, spends a budget of 8 per run, and breaks early on the anonymous
     endpoint's HTTP 429. Observed runs submitted 2. The canonical origin sits
     at the tail and is never reached -- zero mentions in its detail log.
  2. That loop's ledger only retains origins that HAVE a snapshot_swhid, so it
     read "10 origins with a SWHID" and looked perfectly healthy.
  3. public/.well-known/software-heritage.json was hand-written, frozen at
     checked_at 2026-09-09, and publicly asserted ARCHIVED_BY_THIRD_PARTY.

So this reader takes a short, explicit origin list and cannot be starved by a
budget, and it GENERATES the public door instead of letting a human retype it.

A fetch that does not complete is FETCH_FAILED -- a failed collection, never a
successful empty inventory, and never "archived". Exits non-zero when archival
is failing so a scheduled run surfaces instead of passing silently.
"""
from __future__ import annotations
import json, pathlib, sys, urllib.error, urllib.request
from datetime import datetime, timezone

BASE = pathlib.Path(__file__).resolve().parent.parent
OUT = BASE / "public" / ".well-known" / "software-heritage.json"
API = "https://archive.softwareheritage.org/api/1"

# Origins this estate asks Software Heritage to archive.
ORIGINS = [
    {
        "url": "https://github.com/CSOAI-ORG/councilof-ai",
        "role": "canonical",
        "note": "Canonical remote. Anonymous fetchers get HTTP 404 while the "
                "authenticated API reports visibility: public, so the SWH "
                "loader has nothing to clone.",
    },
    {
        "url": "https://huggingface.co/datasets/csoai/councilof-ai-source",
        "role": "public_mirror",
        "note": "Public, anonymously clonable. Carries a dated snapshot of the "
                "tracked working tree plus a full-history git bundle. Archiving "
                "it preserves the bytes, NOT councilof-ai's revision graph.",
    },
]

# Beyond this, a stale archive is reported as a defect rather than as health.
STALE_AFTER_DAYS = 14


def _get(url: str) -> object:
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-swh-watch/1"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def read_origin(origin: dict) -> dict:
    """Read one origin's visit history. Never invents a status."""
    url = origin["url"]
    row = {"origin": url, "role": origin["role"], "note": origin["note"]}
    try:
        visits = _get(f"{API}/origin/{url}/visits/?per_page=20")
    except urllib.error.HTTPError as e:
        # 404 here means SWH knows no such origin at all -- a real fact.
        row["state"] = "NOT_IN_ARCHIVE" if e.code == 404 else "FETCH_FAILED"
        row["error"] = f"HTTP {e.code}"
        return row
    except Exception as e:  # network, DNS, timeout
        row["state"] = "FETCH_FAILED"
        row["error"] = f"{type(e).__name__}: {e}"
        return row

    if not isinstance(visits, list):
        row["state"] = "FETCH_FAILED"
        row["error"] = "unexpected payload shape"
        return row

    visits.sort(key=lambda v: v.get("date") or "", reverse=True)
    row["visits_read"] = len(visits)

    latest = visits[0] if visits else None
    full = next((v for v in visits if v.get("status") == "full"), None)

    row["latest_visit"] = {
        "date": latest.get("date"),
        "status": latest.get("status"),
        "snapshot": latest.get("snapshot"),
    } if latest else None

    # Failures accumulated since the most recent successful visit.
    failed_since_full = [
        {"date": v.get("date"), "status": v.get("status")}
        for v in visits
        if v.get("status") != "full" and (not full or (v.get("date") or "") > (full.get("date") or ""))
    ]
    row["failed_visits_since_last_full"] = failed_since_full

    if not full:
        row["state"] = "NEVER_ARCHIVED" if visits else "NOT_IN_ARCHIVE"
        row["last_full_visit"] = None
        return row

    row["last_full_visit"] = {
        "date": full.get("date"),
        "swhid": f"swh:1:snp:{full.get('snapshot')}",
        "visit_status": "full",
    }
    try:
        ts = datetime.fromisoformat((full.get("date") or "").replace("Z", "+00:00"))
        age = (datetime.now(timezone.utc) - ts).days
    except Exception:
        age = None
    row["days_since_last_full_visit"] = age

    if failed_since_full:
        row["state"] = "ARCHIVAL_FAILING"
    elif age is not None and age > STALE_AFTER_DAYS:
        row["state"] = "ARCHIVED_STALE"
    else:
        row["state"] = "ARCHIVED_CURRENT"
    return row


def main() -> int:
    rows = [read_origin(o) for o in ORIGINS]
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    healthy = [r for r in rows if r["state"] == "ARCHIVED_CURRENT"]
    failing = [r for r in rows if r["state"] in ("ARCHIVAL_FAILING", "NEVER_ARCHIVED", "NOT_IN_ARCHIVE")]
    unread = [r for r in rows if r["state"] == "FETCH_FAILED"]

    if unread:
        # Could not read: say so. Never report health from an unread origin.
        estate_state = "UNKNOWN_READ_FAILED"
    elif healthy:
        estate_state = "ARCHIVED_BY_THIRD_PARTY" if not failing else "ARCHIVED_BY_THIRD_PARTY_DEGRADED"
    elif any(r["state"] == "ARCHIVED_STALE" for r in rows):
        estate_state = "ARCHIVED_STALE"
    else:
        estate_state = "NOT_ARCHIVED"

    # Backward-compatible block: consumers (and evidenceMetadata.test.ts) read
    # primary_snapshot. It now tracks the canonical origin's LAST FULL visit as
    # re-read today, rather than a snapshot identifier typed in by hand.
    canonical = next((r for r in rows if r["role"] == "canonical"), None)
    primary = None
    if canonical and canonical.get("last_full_visit"):
        lf = canonical["last_full_visit"]
        primary = {
            "origin": canonical["origin"],
            "swhid": lf["swhid"],
            "visit_date": lf["date"],
            "visit_status": "full",
            "is_latest_visit": not canonical.get("failed_visits_since_last_full"),
            "caveat": (
                "This is the most recent SUCCESSFUL visit, not proof that archival "
                "is currently working. See origins[].state."
            ),
        }

    doc = {
        "schema": "csoai.well-known/0.2",
        "slug": "software-heritage",
        "name": "Software Heritage — independent archival of this estate",
        "description": (
            "Third-party archival state, re-read from the Software Heritage API "
            "on every run. Records failed visits as facts."
        ),
        "as_of": now,
        "generated_by": "scripts/watch_swh_archival.py",
        "state": estate_state,
        "why_this_matters": (
            "Every other durability claim in this estate rests on our own signature. "
            "This one does not. But an archive that has stopped accepting visits is "
            "not archival, and a save request that was merely 'accepted' is not a "
            "visit — so this door reports the failures alongside the successes."
        ),
        "primary_snapshot": primary,
        "origins": rows,
        "what_this_does_not_establish": [
            "Software Heritage does not endorse, review or verify the Council of AI. It archives source code, and archival is not approval.",
            "An archived snapshot proves the bytes existed at the visit date. It is not a timestamp anchor for a measurement.",
            "A save request with save_request_status 'accepted' proves nothing: the loading task can fail afterwards, and did here.",
            "Archiving the public mirror preserves the source bytes and a history bundle. It does not archive councilof-ai's commit graph as revisions.",
        ],
        "probe": (
            "curl -s 'https://archive.softwareheritage.org/api/1/origin/"
            "https://github.com/CSOAI-ORG/councilof-ai/visits/?per_page=20'"
        ),
        "links": {
            "self": "https://councilof.ai/.well-known/software-heritage.json",
            "anchor_posture": "https://councilof.ai/.well-known/anchor-posture.json",
            "verify_yourself": "https://councilof.ai/.well-known/verify-yourself.json",
        },
        "doctrine": (
            "An independent archive is worth more than our own copy, and worth less "
            "than an anchor. A broken archive is worth less than saying so."
        ),
    }

    OUT.write_text(json.dumps(doc, indent=2) + "\n")

    for r in rows:
        print(f"{r['state']:26} {r['origin']}")
        for f in r.get("failed_visits_since_last_full", []):
            print(f"  failed visit: {f['date']} status={f['status']}")
    print(f"\nestate_state: {estate_state}")
    print(f"wrote: {OUT.relative_to(BASE)}")

    # Fail loudly so a scheduled run surfaces rather than passes silently.
    return 1 if (failing or unread) else 0


if __name__ == "__main__":
    sys.exit(main())
