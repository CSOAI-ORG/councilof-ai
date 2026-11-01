#!/usr/bin/env python3
"""Build a VERIFIED presence ledger from the N-site hunt's evidence.

The hunt has measured 1,200+ surfaces and written an evidence bundle for each. Until now
nothing consumed those bundles: the lane produced evidence and the estate published nothing
from it. This turns the lane's output into a ledger a reader can check.

What makes it checkable: every bundle carries its own `bundle_sha256`, and the convention is
    sha256( canonical_json( bundle_body minus the bundle_sha256 field ) )
where canonical_json is sorted-keys, compact-separator JSON. This was derived by testing
candidate conventions against the bundles on disk, not assumed. Every bundle is re-hashed here
and compared against BOTH the bundle's own field and the row's recorded digest, so a row that
pins a digest the bytes no longer match is reported UNVERIFIABLE rather than passed.

Three states, never two:
    VERIFIED      — the bundle exists, re-hashes to the digest the row recorded, and the
                    bundle's own field agrees with its body.
    UNVERIFIABLE  — the bundle exists but the digests disagree (the row pins older bytes).
    MISSING       — the row has no bundle on disk.

The ledger also reports duplicate event_hash values, because a repeated event id means the
event chain is not a chain.

    python3 build_presence_ledger.py --out presence-ledger.json
"""
from __future__ import annotations
import argparse, collections, hashlib, json, os, datetime

LANE = os.path.dirname(os.path.abspath(__file__))
EV = os.path.join(LANE, "evidence")


def canon(body: dict) -> bytes:
    return json.dumps(body, sort_keys=True, separators=(",", ":")).encode()


def sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(LANE, "presence-ledger.json"))
    ap.add_argument("--max-rows", type=int, default=0, help="0 = all")
    a = ap.parse_args()

    rows = []
    dp = os.path.join(LANE, "done.jsonl")
    for line in open(dp, encoding="utf-8"):
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            pass

    # Index the bundles TWICE: by the domain they name, and by the CONTENT HASH of their
    # body. A row's pin is a digest, so a digest is what resolves it: a row is VERIFIED when
    # the bytes it pinned still exist, wherever they live. A domain that was onboarded more
    # than once has one file per run; only the newest is at evidence/<id>.json, the older
    # ones survive under their content-addressed names, so their rows keep resolving.
    bundles = {}          # domain -> (file, body)  (the newest run for that domain)
    by_hash = {}          # content hash -> (file, body)
    for fn in os.listdir(EV) if os.path.isdir(EV) else []:
        if not fn.endswith(".json"):
            continue
        try:
            raw = open(os.path.join(EV, fn), "rb").read()
            d = json.loads(raw)
        except Exception:
            continue
        if not isinstance(d, dict) or not d.get("domain"):
            continue
        body = {k: v for k, v in d.items() if k != "bundle_sha256"}
        h = sha(canon(body))
        by_hash.setdefault(h, (fn, d))
        cur = bundles.get(d["domain"])
        if cur is None or str(d.get("at") or "") >= str(cur[1].get("at") or ""):
            bundles[d["domain"]] = (fn, d)

    out_rows = []
    tally = collections.Counter()
    by_result = collections.Counter()
    by_presence = collections.Counter()
    by_class = collections.Counter()
    unverifiable = []
    missing = []
    events = collections.Counter()

    for r in rows:
        dom = r.get("domain")
        result = r.get("result")
        presence = r.get("presence")
        cls = r.get("classification")
        by_result[result] += 1
        by_presence[presence] += 1
        by_class[cls] += 1
        if r.get("event_hash"):
            events[r["event_hash"]] += 1

        claimed = r.get("bundle_sha256")
        # RESOLVE BY DIGEST: the row pins bytes, so the bytes are what count.
        hit = by_hash.get(claimed) if claimed else None
        ent = bundles.get(dom)
        state = "MISSING"
        recomputed = None
        if hit is not None:
            fn, d = hit
            body = {k: v for k, v in d.items() if k != "bundle_sha256"}
            recomputed = sha(canon(body))
            own = d.get("bundle_sha256")
            if own and own != recomputed:
                state = "UNVERIFIABLE"
                unverifiable.append({"domain": dom, "row_bundle_sha256": claimed,
                                      "recomputed_bundle_sha256": recomputed, "bundle": fn,
                                      "why": "the bundle's own digest field disagrees with its body"})
            else:
                state = "VERIFIED"
        elif ent is not None:
            fn, d = ent
            body = {k: v for k, v in d.items() if k != "bundle_sha256"}
            recomputed = sha(canon(body))
            state = "UNVERIFIABLE"
            unverifiable.append({"domain": dom, "row_bundle_sha256": claimed,
                                  "recomputed_bundle_sha256": recomputed, "bundle": fn,
                                  "why": "the bytes this row pinned are not on disk; the bundle was rewritten in place by a later run of the same domain"})
        else:
            missing.append({"domain": dom, "row_bundle_sha256": r.get("bundle_sha256")})
        tally[state] += 1

        out_rows.append({
            "domain": dom,
            "result": result,
            "presence": presence,
            "classification": cls,
            "observed": r.get("observed"),
            "score": r.get("score"),
            "at": r.get("at"),
            "event_hash": r.get("event_hash"),
            "bundle_sha256": r.get("bundle_sha256"),
            "evidence_state": state,
            "evidence_recomputed_sha256": recomputed,
        })

    if a.max_rows and len(out_rows) > a.max_rows:
        out_rows = out_rows[: a.max_rows]

    dup_events = {k: v for k, v in events.items() if v > 1}
    ledger = {
        "kind": "csoai.nsite-presence-ledger/0.1",
        "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {
            "lane": "nsite-onboard (Oracle micro)",
            "rows": "~/lanes/nsite-onboard/done.jsonl",
            "bundles": "~/lanes/nsite-onboard/evidence/",
        },
        "digest_convention": "sha256(json.dumps(body_without_bundle_sha256, sort_keys=True, separators=(',',':')))",
        "states": ["VERIFIED", "UNVERIFIABLE", "MISSING"],
        "claim": "These surfaces were read by the lane's probes at the stated times. The evidence_state says whether the bundle still hashes to the digest the row pinned. VERIFIED is a statement about the bytes, not about any listing.",
        "not_a_claim": "That CSOAI is present on any surface. 'presence' is MEASURED only where a live read could see it; UNMEASURED means the read could not see, which is not absence.",
        "counts": {
            "rows": len(rows),
            "bundles_on_disk": len(bundles),
            "evidence_files": len(by_hash),
            "distinct_content_hashes": len(by_hash),
            "verified": tally["VERIFIED"],
            "unverifiable": tally["UNVERIFIABLE"],
            "missing": tally["MISSING"],
            "by_result": dict(by_result),
            "by_presence": {k: v for k, v in by_presence.items() if k is not None},
            "by_classification": {k: v for k, v in by_class.items() if k is not None},
            "duplicate_event_hashes": len(dup_events),
            "events_repeated": sum(dup_events.values()) - len(dup_events),
        },
        "unverifiable_rows": unverifiable,
        "missing_rows": missing,
        "duplicate_event_hashes": dup_events,
        "rows": out_rows,
    }
    with open(a.out, "w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=1, sort_keys=False)
        f.write("\n")
    print(json.dumps(ledger["counts"], indent=1))
    print(f"wrote {a.out}")


if __name__ == "__main__":
    main()
