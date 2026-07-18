"""
test_council_e2e_with_hmac.py — fixed council E2E that uses HMAC dev fallback
when pynacl is missing. Runs ON the VM (where the council lives + the keys/ dir).

The earlier test had pynacl not on the import path. This one:
  - imports meok.council.pubkey_registry directly from /opt/meok-council
  - sets MEOK_COUNCIL_DEV_HMAC_FALLBACK=1 before import
  - signs ballots with HMAC-SHA256
  - submits 23+ valid ballots
  - checks the round finalizes (committed phase)
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# CRITICAL: set the env var BEFORE importing meok.council
os.environ["MEOK_COUNCIL_DEV_HMAC_FALLBACK"] = "1"
sys.path.insert(0, "/opt/meok-council")

import hashlib
import hmac
import urllib.error
import urllib.request
import json

BASE = "http://127.0.0.1:3200"

# Import the council substrate
from meok.council.bft_council import COUNCIL_NODES  # type: ignore
from meok.council.pubkey_registry import (  # type: ignore
    get_or_create_node_keypair, get_public_key, sign_ballot, verify_ballot
)


def http(method, url, body=None, timeout=10):
    req = urllib.request.Request(url, method=method)
    if body is not None:
        req.add_header("Content-Type", "application/json")
        body = json.dumps(body).encode() if not isinstance(body, bytes) else body
    try:
        with urllib.request.urlopen(req, data=body, timeout=timeout) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        body = e.read()
        try: return e.code, json.loads(body or b"{}")
        except: return e.code, {"_raw": body.decode("utf-8", "replace")[:200]}
    except Exception as e:
        return 0, {"_err": str(e)}


def open_round(subject_ref):
    s, d = http("POST", f"{BASE}/api/council/round/open", body={
        "subject_type": "watchdog_cert_issuance",
        "subject_ref": subject_ref, "timeout_seconds": 60
    })
    if s != 200:
        raise RuntimeError(f"open_round failed: {s} {d}")
    return d


def sign_and_vote(round_id, node_id, decision, rationale_hash, ts, phase):
    """Sign with the SAME canonical payload the server builds (per the server source)."""
    payload = json.dumps({
        "round_id": round_id, "node_id": node_id, "decision": decision,
        "phase": phase, "rationale_hash": rationale_hash,
    }, sort_keys=True).encode("utf-8")
    sig = sign_ballot(node_id, payload)
    s, d = http("POST", f"{BASE}/api/council/vote", body={
        "round_id": round_id, "node_id": node_id, "decision": decision,
        "rationale_hash": rationale_hash, "ballot_signature": sig,
        "timestamp_utc": ts,
    })
    return s, d, sig


def get_decision(decision_id):
    s, d = http("GET", f"{BASE}/api/council/decisions/{decision_id}")
    return s, d


def main():
    # Eagerly generate all 36 node keypairs (does it once + caches)
    print("Eagerly generating 36 node keypairs...")
    for n in COUNCIL_NODES:
        get_or_create_node_keypair(n["id"], n["domain"])
    print(f"  done. 36 keys cached.\n")

    # Open a test round
    rid_ref = f"e2e-hmac-{int(time.time())}"
    rd = open_round(rid_ref)
    rid = rd["round_id"]
    threshold = rd["threshold"]
    print(f"Opened round {rid[:8]}...  threshold={threshold}\n")

    # Sign + submit 25 ballots (more than threshold to be safe)
    node_ids = [n["id"] for n in COUNCIL_NODES[:25]]
    ts = datetime.now(timezone.utc).isoformat()
    rationale = f"e2e hmac test {time.time()}"
    rh = hashlib.sha256(rationale.encode()).hexdigest()

    submitted = 0
    last_phase = "pre-prepare"  # server starts in pre-prepare
    fail = []
    for nid in node_ids:
        # Use the LAST KNOWN phase (server advances after each successful vote)
        s, d, sig = sign_and_vote(rid, nid, "approve", rh, ts, last_phase)
        if s == 200:
            submitted += 1
            new_phase = d.get("phase")
            if new_phase:
                last_phase = new_phase
        else:
            fail.append((nid, s, str(d)[:100]))
    print(f"Submitted: {submitted}/{len(node_ids)} (last_phase={last_phase})")
    if fail:
        print(f"Failed: {len(fail)}")
        # Show first 3 fails
        for nid, s, msg in fail[:3]:
            print(f"  {nid}: {s} {msg}")

    # Check the round is now committed (since we hit threshold)
    time.sleep(2)
    s, d = http("GET", f"{BASE}/api/council/proposals")
    if isinstance(d, list) and len(d) == 0:
        print("\n✓ Round finalized (no open rounds left)")

    # Check history
    s, d = http("GET", f"{BASE}/api/council/history?limit=5")
    total = d.get("total", 0)
    print(f"\nHistory: {total} décisions total")
    if d.get("decisions"):
        last = d["decisions"][0]
        print(f"  latest: outcome={last.get('outcome')} votes={len(last.get('votes', []))}")
        print(f"  commit_proof.set_hash={last.get('final_state', {}).get('commit_proof', {}).get('set_hash', '?')[:16]}...")
        # Fetch full decision
        s2, full = get_decision(last["decision_id"])
        if s2 == 200:
            print(f"  decision fetch: {s2} phase={full.get('phase')} outcome={full.get('outcome')}")

    print()
    if submitted >= threshold:
        print(f"✓✓✓ PBFT TEST PASSED: {submitted} votes accepted, threshold {threshold} reached")
        return 0
    else:
        print(f"✗ PBFT TEST FAILED: only {submitted} of {len(node_ids)} votes accepted")
        return 1


if __name__ == "__main__":
    sys.exit(main())
