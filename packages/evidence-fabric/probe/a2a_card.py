#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""A2A agent card at a well-known URI -> one evidence event, via the census probe scripts/census/a2a-card-probe.py.

    python3 probe/a2a_card.py --card-url https://host/.well-known/agent-card.json --workdir DIR --census-dir scripts/census > events.jsonl

Runs the existing read-only census probe (robots.txt respected, GET only, 1 s per host) over a two-listing frame:
the card URL, and a control URL on the same host that nobody publishes (/.well-known/agent-card.csoai-negative-control.json).
CONSISTENT: the listed card URL itself serves a parseable agent card (CARD_SERVED with card_source
listing.wellKnownURI) and the control URL does not (the probe's fallback to the origin's card does not count). DIVERGENT: the
listed URL does not serve a card. The control must not come back CARD_SERVED, or the event is NOT_DISCRIMINATING.
Signature state (A2A 8.4.3) is recorded in observed; an unsigned card is a fact about the card, not a failure.
"""
import argparse, gzip, json, os, subprocess, sys, urllib.parse
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from probe import E  # noqa: E402

CONTROL_PATH = "/.well-known/agent-card.csoai-negative-control.json"


def frame(dirpath, card_url):
    o = urllib.parse.urlsplit(card_url)
    base = f"{o.scheme}://{o.netloc}"
    listings = [{"id": "target", "name": o.netloc, "url": base + "/", "wellKnownURI": card_url},
                {"id": "control", "name": o.netloc + " control", "url": base + "/", "wellKnownURI": base + CONTROL_PATH}]
    raw = os.path.join(dirpath, "raw", "a2aregistry")
    os.makedirs(raw, exist_ok=True)
    json.dump([{"file": "p1.json.gz"}], open(os.path.join(raw, "pages.json"), "w"))
    with gzip.open(os.path.join(raw, "p1.json.gz"), "wt") as f:
        json.dump({"agents": listings}, f)
    with gzip.open(os.path.join(dirpath, "entries.jsonl.gz"), "wt") as f:
        for i, a in enumerate(listings):
            f.write(json.dumps({"source": "a2aregistry", "id": a["id"], "order": i}) + "\n")


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--card-url", required=True); ap.add_argument("--workdir", required=True); ap.add_argument("--census-dir", required=True)
    a = ap.parse_args(argv)
    fr, out = os.path.join(a.workdir, "frame"), os.path.join(a.workdir, "out")
    frame(fr, a.card_url)
    subprocess.run([sys.executable, os.path.join(a.census_dir, "a2a-card-probe.py"), "--frame", fr, "--out", out, "--workers", "1"],
                   check=True, capture_output=True)
    rows = {}
    with gzip.open(os.path.join(out, "results.jsonl.gz"), "rt") as f:
        for l in f:
            r = json.loads(l); rows[r["id"]] = r
    t, c = rows["target"], rows["control"]
    at_listed = lambda r: r["state"] == "CARD_SERVED" and r.get("card_source") == "listing.wellKnownURI"
    served = at_listed(t)
    ctl_got = "CONSISTENT" if at_listed(c) else "DIVERGENT"  # the probe may fall back to the origin's card; that is not the listed URL
    state = ("CONSISTENT" if served else "DIVERGENT") if ctl_got == "DIVERGENT" else "NOT_DISCRIMINATING"
    card = t.get("card") or {}
    ev = E.build(
        subject={"kind": "a2a_card", "locator": a.card_url, "declared_by": "the host's well-known A2A agent-card path"},
        claim={"text": f"{urllib.parse.urlsplit(a.card_url).netloc} publishes an A2A agent card at {a.card_url}.",
               "source_url": a.card_url, "source_sha256": t.get("card_sha256"), "read_at": t.get("finished")},
        method={"id": "a2a-card-probe", "version": "census a2a-card-probe.py (A2A 8.4.3 @ 72b3761)", "code_sha256": None, "holder": "csoai"},
        declared={"card_url": a.card_url, "name": card.get("name"), "protocolVersion": card.get("protocolVersion"),
                  "n_skills": card.get("n_skills"), "signatures_block": card.get("signatures_block")},
        observed={"state": t["state"], "reason": t.get("reason"), "signature_check": t.get("signature_check"),
                  "card_bytes": t.get("card_bytes"), "requests": t.get("requests")},
        state=state, value=None,
        negative_control=({"id": "unpublished-control-path", "expected": "DIVERGENT", "got": "DIVERGENT"} if ctl_got == "DIVERGENT"
                          else {"id": "unpublished-control-path", "expected": None, "got": "CONSISTENT"}),
        limits=["A served card is what one URL returned at one moment; it does not show the agent works or is who it says.",
                f"Signature state {((t.get('signature_check') or {}).get('sig_state'))}: an unsigned card vouches for nothing about its origin beyond TLS.",
                "No task, message or JSON-RPC call was sent to the agent."])
    sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
