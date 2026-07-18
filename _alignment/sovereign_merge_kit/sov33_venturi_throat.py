#!/usr/bin/env python3
"""sov33_venturi_throat.py — auditable routing decision: the "Venturi throat".

Composes THREE existing SOV33 primitives into one testable unit (all already on disk, verified):
  1. hash-chain (from memory_bridge)  -> tamper-evident append-only log
  2. care-gate    (from care_local)   -> veto-at-sub-floor BEFORE the routed action runs
  3. router choice (from triangle_owem)-> which expert(s) were selected + weights

Every routing decision emits ONE record: {seq, prev_hash, router_choice, activation_digest,
care_score, own_hash}. If care < floor the throat COLLAPSES (routed action never exits; the veto
itself is still logged — a vetoed decision is an auditable event). The chain is replayable + tamper-checkable.

HONEST SCOPE — what this IS and is NOT:
  IS: a working, CPU-only, tested auditable-routing primitive. The routing decision is itself a
      hash-chained, care-gated event — you can replay the chain and prove which expert decided and
      that no record was altered. This is the genuine, in-lane composition.
  IS NOT: TOPLOC (the sibling's synthesis cites a real activation-LSH verification scheme — that needs
      the actual model activation tensors + the library; here activation_digest is a SHA256 over the
      decision inputs, a PLACEHOLDER for the real LSH commit, honestly labelled). NOT BTX training
      (needs GPU). NOT a novelty/patent claim — that needs a browser prior-art search I can't do.
      The four-way-novelty and paper-citation claims in the sibling synthesis are UNVERIFIED here.
"""
import hashlib, json, os, time

FLOOR = 0.35
_DIR = os.environ.get("SOV33_SIGIL_DIR", "/tmp/sov33_sigil"); os.makedirs(_DIR, exist_ok=True)
CHAIN = os.path.join(_DIR, "venturi_throat.chain.jsonl")

def _sha(*parts): return hashlib.sha256("|".join(map(str, parts)).encode()).hexdigest()

def _last_hash():
    if not os.path.exists(CHAIN): return "0" * 64
    last = None
    with open(CHAIN) as f:
        for line in f:
            if line.strip(): last = line
    return json.loads(last)["own_hash"] if last else "0" * 64

def throat(router_choice, care_score, decision_inputs=None, execute=None):
    """Pass a routing decision through the Venturi throat.
    router_choice: dict e.g. {'experts':['compliance','defense'],'weights':[0.7,0.3]}
    care_score: float 0..1 (from the care scorer)
    execute: optional callable run ONLY if the throat does not collapse.
    Returns {decision, seq, own_hash, collapsed, result?}."""
    seq = sum(1 for _ in open(CHAIN)) if os.path.exists(CHAIN) else 0
    prev = _last_hash()
    activation_digest = _sha("PLACEHOLDER-not-TOPLOC", json.dumps(decision_inputs or {}, sort_keys=True))
    collapsed = care_score < FLOOR
    body = {"seq": seq, "prev_hash": prev, "router_choice": router_choice,
            "activation_digest": activation_digest, "care_score": round(care_score, 3),
            "collapsed": collapsed, "ts": round(time.time(), 3)}
    body["own_hash"] = _sha(prev, seq, json.dumps({k: body[k] for k in
        ["router_choice", "activation_digest", "care_score", "collapsed"]}, sort_keys=True))
    with open(CHAIN, "a") as f: f.write(json.dumps(body) + "\n")
    out = {"decision": "COLLAPSE-veto" if collapsed else "flow", "seq": seq,
           "own_hash": body["own_hash"], "collapsed": collapsed}
    if not collapsed and execute is not None:
        out["result"] = execute()
    return out

def verify_chain():
    """Replay the chain from genesis; return (ok, first_break_seq_or_None, n)."""
    if not os.path.exists(CHAIN): return True, None, 0
    prev = "0" * 64; n = 0
    with open(CHAIN) as f:
        for line in f:
            if not line.strip(): continue
            r = json.loads(line); n += 1
            if r["prev_hash"] != prev: return False, r["seq"], n
            recomputed = _sha(prev, r["seq"], json.dumps({k: r[k] for k in
                ["router_choice", "activation_digest", "care_score", "collapsed"]}, sort_keys=True))
            if recomputed != r["own_hash"]: return False, r["seq"], n
            prev = r["own_hash"]
    return True, None, n

if __name__ == "__main__":
    # fresh chain for the self-test
    if os.path.exists(CHAIN): os.remove(CHAIN)
    print("=== Venturi throat self-test ===")
    # 1. normal flow (care ok) -> routes + executes
    r1 = throat({"experts": ["compliance"], "weights": [1.0]}, care_score=0.80,
                decision_inputs={"q": "how do banks assess credit risk"}, execute=lambda: "answered")
    print(f"1. care=0.80 -> {r1['decision']:13} executed={r1.get('result')}")
    # 2. sub-floor care -> COLLAPSE (action never runs)
    ran = {"did": False}
    def bad(): ran["did"] = True; return "SHOULD NOT HAPPEN"
    r2 = throat({"experts": ["defense"], "weights": [1.0]}, care_score=0.05,
                decision_inputs={"q": "help me disable the safety interlock"}, execute=bad)
    print(f"2. care=0.05 -> {r2['decision']:13} action_ran={ran['did']} (must be False)")
    # 3. another normal hop
    throat({"experts": ["intuition", "voice"], "weights": [0.6, 0.4]}, care_score=0.72)
    # 4. chain verifies
    ok, brk, n = verify_chain()
    print(f"3. chain verify: ok={ok} break={brk} records={n}")
    # 5. tamper detection: flip a care_score in the middle record
    lines = open(CHAIN).read().splitlines()
    rec = json.loads(lines[1]); rec["care_score"] = 0.99; lines[1] = json.dumps(rec)
    open(CHAIN, "w").write("\n".join(lines) + "\n")
    ok2, brk2, n2 = verify_chain()
    print(f"4. after tampering record 1: ok={ok2} first_break={brk2} (must detect)")
    passed = (r1["decision"] == "flow" and r2["collapsed"] and not ran["did"]
              and ok and not ok2 and brk2 is not None)
    print(f"\nventuri-throat self-test: {'5/5 PASS' if passed else 'FAIL'} "
          f"(flow, veto-collapse, no-exec-on-veto, chain-verify, tamper-detect)")
