#!/usr/bin/env python3
"""Fail if a PUBLISHED gspc-hub-cards index row disagrees with its signed card body.

Why this exists
---------------
Issue #1155 was fixed in `mill_index_row()` on 2026-09-02 and covered by unit
tests. It stayed live anyway: the 82 rows already on the Hub had been written by
the OLD code and nothing ever rebuilt them. Every row said MEASURED; every card
body said UNMEASURED with `unmeasured: ["signed-pending-verify"]`.

A unit test proves the generator is honest. It cannot prove the published bytes
came from the honest generator. Only fetching them can. That is this check.

The card body is authoritative. A valid signature over a body that says
UNMEASURED means the card genuinely is UNMEASURED — an index row may never
upgrade it. An index that overrides a signature is worse than an unsigned
index, because the signature is what invites trust.

There is a SECOND way a published row can be wrong, and comparing it to its own
card cannot see it. `sign_mill_cards.py` corrects a body by writing a NEW
content-addressed card and recording the replacement in SUPERSEDED.jsonl; the
old card stays on disk so a published card_id never 404s, and it still says
UNMEASURED. A stale row pointing at that retired card therefore MIRRORS IT
PERFECTLY and passes.

That is not hypothetical. This check was written expecting to be red until the
82 rows were regenerated. Writing the corrected superseding cards is what turned
it GREEN -- on 2026-09-05 it reported "[OK] 725 published index rows all mirror
their signed card body" while 70 rows still pointed at cards the ledger had
retired, each with a MEASURED replacement for the same (model, axis). The
correction silenced the guard that was watching for the uncorrected rows.

So a row is also drift when its card is no longer the LIVE card for its pair.

A THIRD failure mode is not drift at all, and bailing on it hid the other two.
The index is regenerated and uploaded to the Hub the moment a mill PR merges,
but the card bytes only reach councilof.ai when the site deploy for that commit
finishes. In between, published rows point at card_urls that 404. On 2026-09-06
that gap was 64 of 866 rows -- and because this check returned 2 on the FIRST
unreadable card, it never looked at the 802 rows it could read. A guard that
goes dark whenever a deploy is in flight, on a repo that merges every couple of
minutes, is a guard that is structurally dark.

So an unreadable card now costs only the check that needs it. Of the three
checks here, exactly one -- row status vs card body -- reads a card at all. The
retired-card check and the satellite-subset check compare index rows to the
ledger and to each other, so they run over EVERY row whether the site has caught
up or not, and the coverage of the one that cannot is stated in the output.

Exit 0 = every published row mirrors its body AND cites the live card.
Exit 1 = drift (with the rows) -- a CONFIRMED defect, which outranks an unknown.
Exit 2 = could not check: the indexes or the ledger were unreadable, or some
cards were. Never silently pass on a fetch failure: UNCHECKABLE is not VALID,
an unreadable ledger is not an empty one, and an unread card is not a clean one.
"""
from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from collections import Counter
from concurrent.futures import ThreadPoolExecutor

REPO = "csoai/gspc-hub-cards"
BASE = f"https://huggingface.co/datasets/{REPO}/resolve/main/mill-cards/"
INDEXES = ["INDEX", "INDEX-safety", "INDEX-art5-affect", "INDEX-empty3"]
TIMEOUT = 45
LEDGER = "https://councilof.ai/interop/mill-cards-signed/SUPERSEDED.jsonl"

# A satellite is a filtered VIEW of INDEX.jsonl, produced by flip_hub_queue.py from the
# LIVE cards (see docs/operations/SATELLITE-INDEX-PRODUCER.md). Nothing produced them
# before 2026-09-05: they were hand-made once and froze, and the 70 stale rows that
# followed are why this check exists at all. Deriving them removed the class -- this
# keeps it removed, because a producer only holds while nothing writes around it.
# Where a 404'd card can be looked up to tell "not deployed yet" from "does not
# exist". Public and unauthenticated, so a stranger running this gets the same
# answer we do. It classifies ONLY -- it never feeds the verdict, because the
# whole point of this check is that the PUBLISHED surface is consistent, and
# bytes GitHub serves are not bytes councilof.ai serves.
SITE_CARDS = "https://councilof.ai/interop/mill-cards-signed/"
REPO_CARDS = (
    "https://raw.githubusercontent.com/CSOAI-ORG/councilof-ai/master/"
    "public/interop/mill-cards-signed/"
)

SATELLITE_AXES = {
    "INDEX-safety": {"safety"},
    "INDEX-art5-affect": {"art5-safeguard", "affect"},
    "INDEX-empty3": {"machinery-conformity", "cross-reality", "detector-interop"},
}


def superseded_ids() -> set[str]:
    """Card ids SUPERSEDED.jsonl says are no longer the live card for their pair.

    Raises rather than returning an empty set: "the ledger did not answer" and
    "nothing is superseded" are different facts, and returning the empty set
    would make this whole check silently vacuous again.
    """
    ids: set[str] = set()
    for line in fetch(LEDGER).decode().splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if row.get("superseded_id"):
            ids.add(str(row["superseded_id"]))
    return ids



def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-hub-index-drift"})
    return urllib.request.urlopen(req, timeout=TIMEOUT).read()


def classify_unreadable(row: dict, err: str) -> str:
    """Why a card did not load: a deploy that has not landed, or a card that is not
    there. Only a 404 is worth asking about — a timeout says nothing about which
    cards exist. Classification never changes the verdict; it only tells the reader
    which of the two they are looking at, because one clears itself and one does not."""
    url = str(row.get("card_url") or "")
    if "404" not in err or not url.startswith(SITE_CARDS):
        return "UNKNOWN"
    try:
        card = json.loads(fetch(REPO_CARDS + url[len(SITE_CARDS):]).decode())
    except Exception:  # noqa: BLE001 - absence here is itself the answer
        return "MISSING"
    return "PENDING_DEPLOY" if str(card.get("id") or "") == str(row.get("card_sha256") or "") else "MISMATCH"


def main() -> int:
    rows: list[tuple[str, dict]] = []
    try:
        for name in INDEXES:
            body = fetch(BASE + name + ".jsonl").decode()
            for line in body.splitlines():
                if line.strip():
                    rows.append((name, json.loads(line)))
    except (urllib.error.URLError, OSError, json.JSONDecodeError) as exc:
        print(f"UNCHECKABLE: could not read published indexes: {exc}", file=sys.stderr)
        return 2

    if not rows:
        print("UNCHECKABLE: published indexes are empty", file=sys.stderr)
        return 2

    try:
        retired = superseded_ids()
    except (urllib.error.URLError, OSError) as exc:
        print(f"UNCHECKABLE: could not read the supersession ledger: {exc}", file=sys.stderr)
        return 2

    def load(item: tuple[str, dict]):
        name, row = item
        try:
            return name, row, json.loads(fetch(row["card_url"]).decode())
        except Exception as exc:  # noqa: BLE001 - reported, never swallowed
            return name, row, {"__err__": f"{type(exc).__name__}: {exc}"}

    with ThreadPoolExecutor(max_workers=8) as pool:
        loaded = list(pool.map(load, rows))

    readable = [(n, r, c) for n, r, c in loaded if "__err__" not in c]
    unreadable = [(n, r, c["__err__"]) for n, r, c in loaded if "__err__" in c]

    # Two of the three checks compare index rows to the ledger and to each other.
    # Neither opens a card, so neither is entitled to go dark because the site is
    # mid-deploy -- they run over every row that was published.
    stale = [(n, r) for n, r in rows if str(r.get("card_sha256") or "") in retired]

    # A satellite must be a SUBSET of INDEX.jsonl and carry only its own axes. Either
    # failure means something wrote a satellite directly instead of deriving it, which is
    # exactly how the 70 stale rows arrived -- and those rows were self-consistent, so
    # neither of the other checks would have caught them.
    by_index: dict[str, list[dict]] = {}
    for name, row in rows:
        by_index.setdefault(name, []).append(row)
    main_ids = {str(r.get("card_sha256") or "") for r in by_index.get("INDEX", [])}
    off = []
    for name, axes in SATELLITE_AXES.items():
        for row in by_index.get(name, []):
            cid = str(row.get("card_sha256") or "")
            if cid not in main_ids:
                off.append((name, row, "cites a card INDEX.jsonl does not carry"))
            elif str(row.get("axis") or "") not in axes:
                off.append((name, row, f"axis {row.get('axis')!r} is outside {sorted(axes)}"))

    # The only check that needs the card body, over the only rows that have one.
    drift = []
    for name, row, card in readable:
        body = card.get("body") if isinstance(card.get("body"), dict) else {}
        body_status = str(body.get("status") or "").upper()
        row_status = str(row.get("status") or "").upper()
        if body_status and row_status != body_status:
            drift.append((name, row, body_status, row_status))

    if stale:
        print(
            f"[FAIL] {len(stale)} of {len(rows)} published index rows cite a card the "
            f"supersession ledger has retired.\n"
        )
        for name, row in stale[:20]:
            print(
                f"  {name}: {row.get('model')} / {row.get('axis')}\n"
                f"    cites {str(row.get('card_sha256'))[:16]}, which SUPERSEDED.jsonl replaced\n"
                f"    {row.get('card_url')}"
            )
        if len(stale) > 20:
            print(f"  ... and {len(stale) - 20} more")
        print(
            "\nThese rows are SELF-CONSISTENT — the retired card really does say what the row\n"
            "says — so a row-vs-body check passes them. Fix by REGENERATING the index through\n"
            "mill_index_row() from the LIVE cards and re-uploading. Never edit a signed card.\n"
        )

    if drift:
        print(f"[FAIL] {len(drift)} of {len(readable)} readable index rows contradict their signed card body.\n")
        for name, row, body_status, row_status in drift[:20]:
            print(
                f"  {name}: {row.get('model')} / {row.get('axis')}\n"
                f"    index says {row_status}, signed body says {body_status}\n"
                f"    {row.get('card_url')}"
            )
        if len(drift) > 20:
            print(f"  ... and {len(drift) - 20} more")
        print(
            "\nFix by REGENERATING the index through mill_index_row() and re-uploading.\n"
            "Never edit a signed card to agree with an index."
        )

    if off:
        print(f"[FAIL] {len(off)} satellite row(s) are not a view of INDEX.jsonl.\n")
        for name, row, why in off[:20]:
            print(f"  {name}: {row.get('model')} / {row.get('axis')}\n    {why}")
        if len(off) > 20:
            print(f"  ... and {len(off) - 20} more")
        print(
            "\nA satellite is a filtered view of INDEX.jsonl, derived by flip_hub_queue.py from\n"
            "the LIVE cards. A row here that INDEX.jsonl does not carry was written directly,\n"
            "and a hand-written satellite is what froze 70 stale rows into the census.\n"
        )

    if unreadable:
        kinds = Counter(classify_unreadable(r, e) for _, r, e in unreadable)
        print(
            f"[UNCHECKABLE] {len(unreadable)} of {len(rows)} published rows name a card the site "
            f"did not serve, so their body could not be compared.\n"
        )
        for name, row, err in unreadable[:10]:
            print(
                f"  {name}: {row.get('model')} / {row.get('axis')}\n"
                f"    {row.get('card_url')}\n"
                f"    {err}"
            )
        if len(unreadable) > 10:
            print(f"  ... and {len(unreadable) - 10} more")
        print("\n  " + "  ".join(f"{k}={v}" for k, v in sorted(kinds.items())))
        print(
            "\nPENDING_DEPLOY: the card is in master under the id the row cites, and the site\n"
            "deploy carrying it has not landed. The index is uploaded when a mill PR merges;\n"
            "the card bytes arrive when that commit's deploy finishes. This clears itself.\n"
            "MISSING: no such card in master either — the index names a card that does not\n"
            "exist, which is real drift and does NOT clear itself.\n"
        )

    # A confirmed defect outranks an unknown: report 1 even while some rows are dark,
    # so a real drift is never filed under "the deploy was in flight".
    if drift or stale or off:
        return 1
    if unreadable:
        print(
            f"[UNCHECKABLE] {len(readable)} of {len(rows)} rows mirror their signed card body; "
            f"{len(unreadable)} could not be read.\n"
            f"All {len(rows)} rows passed the retired-card and satellite-subset checks, which "
            f"need no card."
        )
        return 2

    print(
        f"[OK] {len(rows)} published index rows mirror their signed card body, "
        f"and none cites one of the {len(retired)} cards the ledger has retired."
    )
    return 0


def selftest() -> int:
    """Prove this check can BOTH fail and pass, against controlled bytes.

    The bug it now catches was invisible precisely because the failing rows were
    self-consistent, so "it went green" was never evidence of correctness. A guard
    that cannot be shown to go red on the real defect, and green without it, is a
    guard nobody should trust -- this one shipped green for days over 70 bad rows.
    """
    import io

    global fetch  # noqa: PLW0603 - the point of the selftest is to control the wire
    real = fetch
    LIVE, RETIRED = "aaa" * 21 + "a", "bbb" * 21 + "b"

    def make(card_sha: str, ledger_has: bool):
        def fake(url: str) -> bytes:
            if url == LEDGER:
                return (json.dumps({"superseded_id": RETIRED, "by_id": LIVE}) + "\n").encode() if ledger_has else b""
            if url.endswith(".jsonl"):
                if url != BASE + "INDEX.jsonl":
                    return b""
                return (json.dumps({
                    "model": "a/one", "axis": "safety", "status": "UNMEASURED",
                    "card_sha256": card_sha, "card_url": "https://x/card.json",
                }) + "\n").encode()
            return json.dumps({"body": {"status": "UNMEASURED"}}).encode()
        return fake

    def make_sat(sat_sha: str, sat_axis: str):
        """INDEX carries one live safety card; INDEX-safety carries the row under test."""
        def fake(url: str) -> bytes:
            if url == LEDGER:
                return b""
            if url.endswith(".jsonl"):
                if url == BASE + "INDEX.jsonl":
                    return (json.dumps({
                        "model": "a/one", "axis": "safety", "status": "MEASURED",
                        "card_sha256": LIVE, "card_url": "https://x/card.json",
                    }) + "\n").encode()
                if url == BASE + "INDEX-safety.jsonl":
                    return (json.dumps({
                        "model": "a/one", "axis": sat_axis, "status": "MEASURED",
                        "card_sha256": sat_sha, "card_url": "https://x/card.json",
                    }) + "\n").encode()
                return b""
            return json.dumps({"body": {"status": "MEASURED"}}).encode()
        return fake

    def make_dark(stale_row: bool, repo_has_card: bool):
        """One row's card 404s on the site; a second row is readable.

        This is the case that used to blind the whole check. The readable row here
        carries a REAL defect (it cites the retired card) and the old code returned 2
        on the dark row before ever looking at it -- a confirmed drift filed under
        "the deploy was in flight". The dark row must cost only its own comparison.
        """
        DARK = "ccc" * 21 + "c"

        def fake(url: str) -> bytes:
            if url == LEDGER:
                return (json.dumps({"superseded_id": RETIRED, "by_id": LIVE}) + "\n").encode()
            if url.endswith(".jsonl"):
                if url != BASE + "INDEX.jsonl":
                    return b""
                return "".join(
                    json.dumps(r) + "\n"
                    for r in (
                        {"model": "a/dark", "axis": "safety", "status": "MEASURED",
                         "card_sha256": DARK, "card_url": SITE_CARDS + "signed-safety-dark.json"},
                        {"model": "a/lit", "axis": "safety", "status": "UNMEASURED",
                         "card_sha256": RETIRED if stale_row else LIVE,
                         "card_url": SITE_CARDS + "signed-safety-lit.json"},
                    )
                ).encode()
            if url == SITE_CARDS + "signed-safety-dark.json":
                raise urllib.error.HTTPError(url, 404, "Not Found", {}, None)  # type: ignore[arg-type]
            if url.startswith(REPO_CARDS):
                if not repo_has_card:
                    raise urllib.error.HTTPError(url, 404, "Not Found", {}, None)  # type: ignore[arg-type]
                return json.dumps({"id": DARK, "body": {"status": "MEASURED"}}).encode()
            return json.dumps({"body": {"status": "UNMEASURED"}}).encode()

        return fake

    cases = [
        ("a row citing a RETIRED card must FAIL", make(RETIRED, True), 1),
        ("the same row citing the LIVE card must PASS", make(LIVE, True), 0),
        ("an empty ledger must PASS (nothing retired)", make(RETIRED, False), 0),
        ("a satellite that is a true view of INDEX must PASS", make_sat(LIVE, "safety"), 0),
        ("a satellite row INDEX does not carry must FAIL", make_sat(RETIRED, "safety"), 1),
        ("a satellite row outside its own axes must FAIL", make_sat(LIVE, "governance"), 1),
        ("a dark card must NOT hide a stale row that is readable", make_dark(True, True), 1),
        ("a dark card alone is UNCHECKABLE, never clean", make_dark(False, True), 2),
        ("a card absent from master too is still UNCHECKABLE", make_dark(False, False), 2),
    ]
    failures = 0
    for label, faker, want in cases:
        fetch = faker  # noqa: F811
        buf = io.StringIO()
        stdout, sys.stdout = sys.stdout, buf
        try:
            got = main()
        finally:
            sys.stdout = stdout
        ok = got == want
        failures += not ok
        print(f"  {'ok  ' if ok else 'FAIL'}  {label}  (exit {got}, want {want})")
    fetch = real
    if failures:
        print(f"\nselftest FAILED: {failures} of {len(cases)}", file=sys.stderr)
        return 1
    print(
        f"\n{len(cases)} passed — provably red on a retired-card row, green without one,\n"
        "and still red on a real defect while another row's card is unreadable."
    )
    return 0


if __name__ == "__main__":
    sys.exit(selftest() if "--selftest" in sys.argv[1:] else main())
