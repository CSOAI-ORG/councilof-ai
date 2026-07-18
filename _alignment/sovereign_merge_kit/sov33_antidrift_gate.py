#!/usr/bin/env python3
"""sov33_antidrift_gate.py — governs the AI's OWN advice, on Nick's terms.
Encodes known model failure-modes into the wrapper Nick controls. Wraps a decision and enforces:
  - no unverified "yes" reaches the user (yes-bias catch)
  - every direction is signed+logged so a later reversal must be accounted for (whipsaw catch)
  - nothing is "done" without a functional-test result attached (fake-done catch)
  - every output tagged PROGRESS (money/user/test) vs MOTION (doc/commit) (motion catch)
  - no re-asking an order already given (question-loop catch)
"""
import os, sys, json, time, hashlib
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
LOG=os.path.join(os.environ.get("SOV33_SIGIL_DIR","/tmp"),"antidrift_ledger.jsonl")

def _sign(obj):
    return hashlib.sha256(json.dumps(obj,sort_keys=True).encode()).hexdigest()[:16]

def gate(action, kind, *, verified=None, test_result=None, order_already_given=False, reversal_of=None, superiority_claim=False, heldout_measurement=None):
    """Pass an AI action through the anti-drift gate. Returns allow/block + honest tag.
    kind: 'yes'|'build'|'done'|'doc'|'question'
    verified: bool — was the claim actually checked (required for 'yes'/'build')
    test_result: dict|None — functional test output (required for 'done')
    order_already_given: bool — True if this repeats a question the user already answered
    reversal_of: str|None — sigil of a prior direction this contradicts (whipsaw)
    """
    rec={"ts":int(time.time()),"action":action[:200],"kind":kind}
    # CATCH 1: yes-bias — no unverified yes/build
    if kind in ("yes","build") and not verified:
        return {"allow":False,"reason":"BLOCKED: unverified '%s' — verify before agreeing"%kind,"tag":"MOTION"}
    # CATCH 2: fake-done — no done without a test
    if kind=="done" and not test_result:
        return {"allow":False,"reason":"BLOCKED: 'done' with no functional test attached","tag":"MOTION"}
    # CATCH 3: question-loop — no re-asking a given order
    if kind=="question" and order_already_given:
        return {"allow":False,"reason":"BLOCKED: re-asking an order already given — execute instead","tag":"MOTION"}
    # CATCH F (FIT-BY-MEASURE): no "X is best/wins/better" without a held-out measurement attached
    if superiority_claim and not heldout_measurement:
        return {"allow":False,"reason":"BLOCKED: superiority claim ('best/wins/better') with no held-out measurement — measure per-task, don't assume a universal winner","tag":"MOTION"}
    # CATCH 4: whipsaw — a reversal must be accounted for
    if reversal_of:
        rec["reversal_of"]=reversal_of
        rec["must_account"]=True
    # TAG: progress vs motion (binding definition)
    is_progress = (test_result is not None) or kind in ("money","user")
    rec["tag"]="PROGRESS" if is_progress else ("MOTION" if kind in ("doc","build","yes") else "NEUTRAL")
    rec["sigil"]=_sign(rec)
    with open(LOG,"a") as f: f.write(json.dumps(rec)+"\n")
    return {"allow":True,"reason":"passed anti-drift gate","tag":rec["tag"],"sigil":rec["sigil"],
            "must_account_for_reversal":bool(reversal_of)}

def selftest():
    r=[]
    # unverified yes -> BLOCKED
    r.append(("unverified_yes_blocked", gate("yes build the T-model","yes",verified=False)["allow"]==False))
    # verified build -> allowed
    r.append(("verified_build_allowed", gate("build RAG, retrieval tested 3/3","build",verified=True)["allow"]==True))
    # done without test -> BLOCKED
    r.append(("fakedone_blocked", gate("it works","done",test_result=None)["allow"]==False))
    # done WITH test -> allowed + PROGRESS
    g=gate("RAG retrieval","done",test_result={"pass":3,"n":3}); r.append(("real_done_progress", g["allow"] and g["tag"]=="PROGRESS"))
    # re-asking given order -> BLOCKED
    r.append(("reask_blocked", gate("want me to build it?","question",order_already_given=True)["allow"]==False))
    # doc tagged MOTION not progress
    r.append(("doc_is_motion", gate("wrote a plan","doc")["tag"]=="MOTION"))
    return {name:ok for name,ok in r}

if __name__=="__main__":
    res=selftest(); print(json.dumps(res,indent=2)); print("ALL PASS:", all(res.values()))
