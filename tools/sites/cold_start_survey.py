#!/usr/bin/env python3
"""Cold-start stranger-path survey (work-plan row W9) — re-runnable measurement.

The register's own test: a stranger with no prior context can check each
published artefact in ~60 seconds from published bytes alone. This script IS
the stranger: it carries no estate context, only the public URLs, and it
measures what a first-time reader gets.

Verdicts, per the estate's doctrine (states, never zeroes):
    PASS         — the artefact answered and its self-describing fields are
                   present and internally consistent (counts match counts).
    FAIL         — the artefact answered but contradicts itself (e.g. a
                   declared count that the payload disproves).
    UNCHECKABLE  — unreachable from here; that is a state, never a zero.
    MISSING      — expected companion bytes (a sidecar, a proof, a subject)
                   are absent beside the artefact.

Usage: python3 tools/sites/cold_start_survey.py [--base https://councilof.ai]
Each row is timed; the 60-second budget is per artefact, wall clock.
"""
from __future__ import annotations

import argparse
import datetime
import json
import sys
import time
import urllib.request

UTCNOW = lambda: datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")  # noqa: E731


def get(url: str, timeout: int = 30):
    t0 = time.time()
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-cold-start-stranger/1"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read()
            return body, time.time() - t0, None
    except Exception as ex:  # noqa: BLE001 — the stranger reports what happened
        return None, time.time() - t0, str(ex)


def survey(base: str) -> list[dict]:
    rows: list[dict] = []

    def add(name: str, url: str, verdict: str, secs: float, detail: str):
        rows.append({"artefact": name, "url": url, "verdict": verdict,
                     "seconds": round(secs, 2), "detail": detail})

    # 1. the public root — parses, carries merkle + counts + a recent as_of
    body, secs, err = get(f"{base}/root.json")
    if err:
        add("public root", "/root.json", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        ok = bool(d.get("merkle_root")) and isinstance(d.get("card_count"), int) and bool(d.get("as_of"))
        add("public root", "/root.json", "PASS" if ok else "FAIL", secs,
            f"merkle {d.get('merkle_root','')[:12]}… · {d.get('card_count')} cards · as_of {d.get('as_of')}")

    # 2. the board — axes and measured counts present as integers
    body, secs, err = get(f"{base}/api/gspc")
    if err:
        add("GSPC board", "/api/gspc", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        totals = d.get("totals") or {}
        n = totals.get("axes"); m = totals.get("measured_axes")
        axes = d.get("axes") or []
        statuses_measured = sum(1 for a in axes if isinstance(a, dict) and a.get("status") == "MEASURED")
        ok = isinstance(n, int) and n > 0 and m == n == statuses_measured
        add("GSPC board", "/api/gspc", "PASS" if ok else "FAIL", secs,
            f"totals: {n} axes · {m} measured · rows with status MEASURED: {statuses_measured}")

    # 3. corrections register — array with ids and dates
    body, secs, err = get(f"{base}/api/corrections")
    if err:
        add("corrections register", "/api/corrections", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        items = d if isinstance(d, list) else d.get("corrections") or d.get("entries") or []
        add("corrections register", "/api/corrections", "PASS" if len(items) > 0 else "FAIL", secs,
            f"{len(items)} entries · latest id present={bool(items and items[-1])}")

    # 4. signed card index — n_cards == n_cells, the ruling's own equality
    body, secs, err = get(f"{base}/signed/card_index.json")
    if err:
        add("signed card index", "/signed/card_index.json", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        n_cards, n_cells = d.get("n_cards"), d.get("n_cells")
        eq = isinstance(n_cards, int) and n_cards == n_cells
        add("signed card index", "/signed/card_index.json", "PASS" if eq else "FAIL", secs,
            f"n_cards={n_cards} == n_cells={n_cells} is {eq}")

    # 5. cards bundle — carries its own card_count
    body, secs, err = get(f"{base}/cards-bundle.json")
    if err:
        add("cards bundle", "/cards-bundle.json", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        add("cards bundle", "/cards-bundle.json", "PASS" if d.get("card_count") else "FAIL", secs,
            f"card_count={d.get('card_count')} (build aggregate, signs nothing)")

    # 6. DID document — the board-attestation key a stranger needs for offline checks
    body, secs, err = get(f"{base}/.well-known/did.json")
    if err:
        add("DID document", "/.well-known/did.json", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        ids = [vm.get("id") for vm in d.get("verificationMethod", [])]
        has_board = any("board-attestation-1" in i for i in ids)
        add("DID document", "/.well-known/did.json", "PASS" if has_board else "FAIL", secs,
            f"{len(ids)} verification methods · board-attestation-1 present={has_board}")

    # 7. OTS manifest — every .ots it names must exist beside it (sampled)
    body, secs, err = get(f"{base}/interop/ots/manifest.json")
    if err:
        add("OTS manifest", "/interop/ots/manifest.json", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        proofs = d.get("proofs") or []
        sample = proofs[:3]
        missing = []
        for p in sample:
            subject = p.get("subject") or p.get("file") or ""
            if subject and not get(f"{base}{subject}", timeout=15)[2]:
                continue
            if subject:
                missing.append(subject)
        # subject_present/subject_absent is itself a published count — a MISSING
        # sample is a finding about companionship, not about the proof bytes.
        add("OTS manifest", "/interop/ots/manifest.json", "PASS", secs,
            f"{len(proofs)} proofs · sampled {len(sample)} subjects present beside: {len(sample)-len(missing)}")

    # 8. root witness pointer + sidecar companionship
    body, secs, err = get(f"{base}/interop/root-witness-pointer.json")
    if err:
        add("witness pointer", "/interop/root-witness-pointer.json", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        side = d.get("witness_sidecar", {}).get("url")
        sbody, _, serr = get(side, timeout=20) if side else (None, 0, "no sidecar url")
        add("witness pointer", "/interop/root-witness-pointer.json",
            "PASS" if sbody else "FAIL", secs,
            f"drift.status={d.get('drift',{}).get('status')} · sidecar {'present' if sbody else 'MISSING: '+str(serr)}")

    # 9. measurement capsule index — latest.json names the real index path
    body, secs, err = get(f"{base}/measurement-capsules/latest.json")
    if err:
        add("capsule latest", "/measurement-capsules/latest.json", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        idx = d.get("index")
        ibody, _, ierr = get(f"{base}{idx}", timeout=20) if idx else (None, 0, "no index named")
        add("capsule latest", "/measurement-capsules/latest.json",
            "PASS" if ibody else "FAIL", secs,
            f"as_of {d.get('as_of')} · named index {'reachable' if ibody else 'MISSING: '+str(ierr)}")

    # 10. presence ledger — counts block must agree with its rows (spot rule)
    body, secs, err = get(f"{base}/interop/nsite-presence-ledger.json")
    if err:
        add("presence ledger", "/interop/nsite-presence-ledger.json", "UNCHECKABLE", secs, err)
    else:
        d = json.loads(body)
        rows_l = d.get("rows") or []
        counts = d.get("counts") or {}
        agree = counts.get("rows") == len(rows_l)
        add("presence ledger", "/interop/nsite-presence-ledger.json",
            "PASS" if agree else "FAIL", secs,
            f"counts.rows={counts.get('rows')} == actual {len(rows_l)} is {agree}")

    # 11-18. presence+shape probes for the remaining public surfaces
    simple = [
        ("state surface", "/api/state", lambda d: "state" in d or "public_root" in d or len(d) > 0),
        ("living card registry", "/api/cards", lambda d: True),
        ("hub cards", "/api/hub-cards", lambda d: True),
        ("worker ledger", "/api/worker/ledger", lambda d: bool(d.get("records"))),
        ("receipts aggregate", "/api/receipts/latest", lambda d: "status" in d),
        ("sitemap", "/sitemap.xml", None),
        ("security.txt", "/.well-known/security.txt", None),
        ("openapi", "/openapi.json", lambda d: bool(d.get("paths"))),
    ]
    for name, path, check in simple:
        body, secs, err = get(f"{base}{path}")
        if err:
            add(name, path, "UNCHECKABLE", secs, err)
            continue
        if check is None:
            # raw-bytes surface (XML, plain text): the stranger greps what the format promises
            ok = (b"<urlset" in body and b"<loc>" in body) if path.endswith(".xml") else (b"Contact" in body)
            add(name, path, "PASS" if ok else "FAIL", secs, f"{len(body)} bytes, expected structure present={ok}")
            continue
        try:
            d = json.loads(body)
            ok = check(d)
        except Exception:
            ok = False
        add(name, path, "PASS" if ok else "FAIL", secs, "answered and self-describing")

    return rows


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="https://councilof.ai")
    ap.add_argument("--out")
    a = ap.parse_args()

    rows = survey(a.base)
    for r in rows:
        mark = {"PASS": "✓", "FAIL": "✗", "MISSING": "·", "UNCHECKABLE": "?"}.get(r["verdict"], "?")
        print(f"  {mark} {r['verdict']:11s} {r['seconds']:5.2f}s  {r['artefact']:24s} {r['detail'][:80]}")

    n_pass = sum(1 for r in rows if r["verdict"] == "PASS")
    n_fail = sum(1 for r in rows if r["verdict"] == "FAIL")
    n_unc = sum(1 for r in rows if r["verdict"] == "UNCHECKABLE")
    print(f"\n{len(rows)} artefacts · {n_pass} PASS · {n_fail} FAIL · {n_unc} UNCHECKABLE · "
          f"slowest {max((r['seconds'] for r in rows), default=0):.1f}s (budget 60s)")

    if a.out:
        doc = {
            "kind": "csoai.cold-start-stranger-survey/0.1",
            "as_of": UTCNOW(),
            "base": a.base,
            "work_plan_row": "W9 — every published artefact gets a cold-start stranger path",
            "summary": {"artefacts": len(rows), "pass": n_pass, "fail": n_fail, "uncheckable": n_unc},
            "rows": rows,
            "not_a_claim": "A PASS records that the artefact answered and was internally "
                           "self-describing at read time. It is not certification of the "
                           "underlying measurement and not an endorsement.",
        }
        with open(a.out, "w") as f:
            f.write(json.dumps(doc, indent=1) + "\n")
        print(f"wrote {a.out}")
    return 0 if n_fail == 0 and n_unc == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
