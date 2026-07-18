#!/usr/bin/env python3
"""sov33_consensus_log_demo.py — WAVE B proof: the 6 COORDINATION components each reach a CORRECT
quorum decision by reading/writing the ConsensusLog ACROSS THREE SEPARATE COLD PROCESSES.

PROOF SHAPE (per component):
    cold-call-1 (PID_a):  append the FIRST batch of members' votes/readings to the shared log
    cold-call-2 (PID_b):  append the SECOND batch (fresh process, fresh import — nothing in memory
                          carried over; the only channel is the durable log)
    cold-call-3 (PID_c):  read the AGREED ORDERED VIEW back and tally the quorum verdict using each
                          component's REAL quorum rule. PASS iff the verdict is the one the
                          component's own logic produces on the union of cold-1 + cold-2 votes.

Because each phase is a separate `python sov33_consensus_log_demo.py <component> <c1|c2|tally>`
subprocess (distinct PIDs, printed), a correct tally in cold-3 PROVES the votes travelled only
through the durable, ordered, hash-chained ConsensusLog — the serverless-compatible stand-in for a
replicated consensus log.

Each component's quorum logic is faithful to its source module. TWO reuse levels, stated honestly
per component (NOT a blanket "all imported" claim):
    IMPORTED  = the tally function imports and runs the source module's real class/function.
    INLINED   = the source module runs at import time (OCI/network side-effects) or has no dedicated
                module, so the tally function re-computes the SAME formula inline, verbatim from source.
                Faithful to the source arithmetic, but a re-implementation of the rule, not an import.

    bft_hive            heartbeat quorum  n-f  (f=(n-1)//3)                 [INLINED from sov33_bft_hive:
                                                                            the source runs its rule under
                                                                            __main__ with live sensor loads]
    bft33_owem_council  23/33 quorum + Free-MAD decision                   [INLINED from sov33_bft33_owem_council:
                                                                            run_bft33_council imports OWEM
                                                                            inference engines at call time]
    sac_council         ConfidenceProbe + FreeMADAggregator, (F+1)=11      [IMPORTED from sov33_sac_council]
    queen_hives         SubHive.deliberate (BFT 2f+1 + trust floor)         [IMPORTED from sov33_queen_hives]
    l3_anchor_quorum    3 routers, plurality, commit iff >=2               [INLINED from sov33_l3_anchor_quorum:
                                                                            quorum() lives under __main__ and
                                                                            calls live OCI routing]
    l0_p7_bft           PBFT n=3f+1, commit iff >= 2f+1                     [estate BFT math: sov33_4brain
                                                                            BFT_CONFIGS (n=3f+1) + queen_hives
                                                                            SubHive (quorum=2f+1). L0 P7 has
                                                                            NO dedicated module — audit lists
                                                                            only the abstract "BFT quorum"
                                                                            symbol; this applies the estate's
                                                                            own canonical PBFT instantiation.]

HONESTY (per component, in HONEST_NOTE + printed in tally): the ordered log supplies the SHARED
ORDERED VIEW + TOTAL ORDER these need to tally — that part is RUNNING (proven cold here). What stays
DESIGNED for ALL of them is Byzantine AGREEMENT ON THAT ORDER across untrusted replicas (Raft/PBFT):
the local proof trusts sqlite as the single writer of the order. See ConsensusLog.honest_limits().

CLI:  python sov33_consensus_log_demo.py <component> <c1|c2|tally>
      -> prints one JSON line: {"component","phase","pid","ok","detail"}
"""
import os, sys, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_consensus_log import ConsensusLog

def LOG():
    return ConsensusLog()   # DEFAULT_DB under SOV33_STATE_DB_DIR / SOV33_SIGIL_DIR (shared across cold calls)

HONEST_NOTE = {}

# =====================================================================================
# 1 · BFT hive — heartbeat quorum.  n entities each append a heartbeat "ALIVE" reading.
#     Rule (sov33_bft_hive): f=(n-1)//3 ; layer LIVE iff (n-f) entities beat (quorum = n-f).
# =====================================================================================
_HIVE_N = 7                    # 7 entities -> f=2, quorum = n-f = 5
_HIVE_TOPIC = "bft_hive.heartbeat"
def hive_c1(log):
    for e in ("ent0", "ent1", "ent2"):        # 3 entities beat in cold-1
        log.append_vote(_HIVE_TOPIC, e, "ALIVE", {"beat": 1.0})
    return {"cold1_beats": 3}
def hive_c2(log):
    for e in ("ent3", "ent4", "ent5"):        # 3 more beat in cold-2 (ent6 stays silent = faulty)
        log.append_vote(_HIVE_TOPIC, e, "ALIVE", {"beat": 1.0})
    return {"cold2_beats": 3}
def hive_tally(log):
    n = _HIVE_N
    f = (n - 1) // 3
    quorum = n - f
    v = log.read_quorum(_HIVE_TOPIC, quorum=quorum)
    beats = v["tally"].get("ALIVE", 0)
    live = beats >= quorum
    return {"n_entities": n, "f_tolerated": f, "quorum_needed": quorum, "beats_seen": beats,
            "layer_live": live, "chain_ok": v["chain_ok"], "ordered_view_len": v["ordered_view_len"],
            "expected": "LIVE (6 beats >= quorum 5)", "ok": live and v["chain_ok"] and beats == 6}
HONEST_NOTE["bft_hive"] = ("Heartbeat-quorum rule (f=(n-1)//3, quorum=n-f) reused from sov33_bft_hive; "
    "6 of 7 entities beat across two cold calls -> layer LIVE, tallied cold-3 from the ordered log.")

# =====================================================================================
# 2 · BFT-33 OWEM council — 23/33 quorum + Free-MAD (allow-count minus reject-count) decision.
#     Rule reused from sov33_bft33_owem_council.run_bft33_council: quorum_met = (#allow+#reject)>=23;
#     decision = 'allow' if (allow - reject) > 0 else 'reject'.
# =====================================================================================
_BFT33_TOPIC = "bft33_owem_council.vote"
def bft33_c1(log):
    for i in range(12):                        # 12 voters in cold-1: 10 allow, 2 reject
        log.append_vote(_BFT33_TOPIC, f"v{i:02d}", "allow" if i < 10 else "reject", {"lineage": ["qwen","llama","deepseek","mistral"][i%4]})
    return {"cold1_votes": 12}
def bft33_c2(log):
    for i in range(12, 33):                    # 21 more in cold-2: 16 allow, 5 reject
        log.append_vote(_BFT33_TOPIC, f"v{i:02d}", "allow" if (i - 12) < 16 else "reject", {"lineage": ["qwen","llama","deepseek","mistral"][i%4]})
    return {"cold2_votes": 21}
def bft33_tally(log):
    v = log.read_quorum(_BFT33_TOPIC, quorum=23)     # 23/33 threshold on the winning option
    allow = v["tally"].get("allow", 0)
    reject = v["tally"].get("reject", 0)
    responded = allow + reject
    quorum_met = responded >= 23                     # BFT-33 quorum: >=23 of 33 respond
    weighted_score = allow - reject                  # Free-MAD (no majority conformity)
    decision = "allow" if weighted_score > 0 else "reject"
    return {"n_voters": v["distinct_members"], "allow": allow, "reject": reject,
            "responded": responded, "quorum_23_33_met": quorum_met, "weighted_score": weighted_score,
            "decision": decision, "chain_ok": v["chain_ok"],
            "expected": "allow, quorum met (26 allow, 7 reject, 33 responded)",
            "ok": quorum_met and decision == "allow" and allow == 26 and reject == 7 and v["chain_ok"]}
HONEST_NOTE["bft33_owem_council"] = ("23/33 quorum + Free-MAD weighted decision reused from "
    "sov33_bft33_owem_council; 33 voters split across two cold calls, tallied cold-3 from the ordered "
    "log -> allow, quorum met. Voters are ballots here (real OWEM inference is the DESIGNED prod path).")

# =====================================================================================
# 3 · SAC council — ConfidenceProbe + FreeMADAggregator (real classes), (F+1)=11 robustness.
#     Byzantine voters self-report a vote but the SEPARATE probe down-weights weak reasoning.
# =====================================================================================
_SAC_TOPIC = "sac_council.vote"
def sac_c1(log):
    for i in range(22):                        # 22 honest allow with real charter reasoning
        log.append_vote(_SAC_TOPIC, f"honest_{i:02d}",
            {"decision": "allow",
             "reasoning": "This request aligns with sovereign charter Article 0 and the care floor of 0.95. Pillar 3 (BFT) is satisfied.",
             "lineage": ["qwen","llama","deepseek","mistral"][i%4]})
    return {"cold1_honest_voters": 22}
def sac_c2(log):
    for i in range(11):                        # 11 byzantine reject with weak (probe-failing) reasoning
        log.append_vote(_SAC_TOPIC, f"byz_{i:02d}",
            {"decision": "reject", "reasoning": "NO", "lineage": "gpt"})
    return {"cold2_byzantine_voters": 11}
def sac_tally(log):
    from sov33_sac_council import ConfidenceProbe, FreeMADAggregator
    entries = log.entries(_SAC_TOPIC)
    # reconstruct the voter list (one latest ballot per member) from the ordered view
    mv = log.member_view(_SAC_TOPIC)
    voters = [mv["members"][m] for m in sorted(mv["members"])]
    probe = ConfidenceProbe(); agg = FreeMADAggregator()
    probed = [probe.probe(v) for v in voters]
    n_honest_estimate = sum(1 for c in probed if c > 0.5)
    f_plus_1 = 11
    robust = n_honest_estimate >= f_plus_1
    result = agg.aggregate(voters, probed)
    chain = log.verify_chain(_SAC_TOPIC)
    return {"n_voters": len(voters), "n_honest_estimate": n_honest_estimate, "f_plus_1_required": f_plus_1,
            "f_plus_1_satisfied": robust, "decision": result["decision"],
            "allow_score": result["allow_score"], "reject_score": result["reject_score"],
            "avg_probed_confidence": round(sum(probed)/len(probed), 3), "chain_ok": chain["ok"],
            "expected": "allow (byzantine reject down-weighted by separate confidence probe)",
            "ok": robust and result["decision"] == "allow" and chain["ok"] and len(voters) == 33}
HONEST_NOTE["sac_council"] = ("Real ConfidenceProbe + FreeMADAggregator reused from sov33_sac_council; "
    "22 honest + 11 byzantine ballots across two cold calls, aggregated cold-3 from the ordered log -> "
    "allow. Probe is heuristic + voters are ballots (trained classifier + real LLM panel = DESIGNED).")

# =====================================================================================
# 4 · Queen sub-hive — SubHive.deliberate (real class): BFT 2f+1 quorum + effective-vote trust floor.
#     A 'security' sub-hive (council=4, rho=0.20) collects delegate votes across cold calls.
# =====================================================================================
_QUEEN_TOPIC = "queen_hives.security.route"
def queen_c1(log):
    for d in ("d0", "d1"):                     # 2 delegates vote POOL_A in cold-1
        log.append_vote(_QUEEN_TOPIC, d, "POOL_A", {"hive": "security"})
    return {"cold1_delegate_votes": 2}
def queen_c2(log):
    for d in ("d2", "d3"):                     # 2 more delegates vote POOL_A in cold-2 (unanimous 4/4)
        log.append_vote(_QUEEN_TOPIC, d, "POOL_A", {"hive": "security"})
    return {"cold2_delegate_votes": 2}
def queen_tally(log):
    from sov33_queen_hives import SubHive
    mv = log.member_view(_QUEEN_TOPIC)
    votes = [mv["members"][m] for m in sorted(mv["members"])]   # reconstruct ballot list from ordered view
    hive = SubHive("security", agent_count=10, council=4, rho=0.20)  # real class, real BFT+trust math
    report = hive.deliberate("route batch to GPU pool", votes)
    chain = log.verify_chain(_QUEEN_TOPIC)
    return {"hive": report["hive"], "n_agree": report["n_agree"], "council": report["council"],
            "f": report["f"], "quorum_2f_plus_1": report["quorum"], "bft_ok": report["bft_ok"],
            "n_eff": report["n_eff"], "trust": report["trust"], "committed": report["committed"],
            "decision": report["decision"], "chain_ok": chain["ok"],
            "expected": "POOL_A committed (4/4 clears BFT quorum 3 and trust floor at rho=0.20)",
            "ok": report["committed"] and report["decision"] == "POOL_A" and report["bft_ok"] and chain["ok"]}
HONEST_NOTE["queen_hives"] = ("Real SubHive.deliberate (BFT n=3f+1 -> quorum 2f+1, plus effective-vote "
    "trust floor via sov33_effective_votes) reused from sov33_queen_hives; 4 delegate votes across two "
    "cold calls -> POOL_A committed, tallied cold-3 from the ordered log.")

# =====================================================================================
# 5 · L3 anchor quorum — 3 routers pick an anchor; plurality commits iff >=2 agree, else ESCALATE.
#     Rule reused from sov33_l3_anchor_quorum.quorum (Counter.most_common, escalate if n<2).
# =====================================================================================
_L3_TOPIC = "l3_anchor_quorum.route"
def l3_c1(log):
    log.append_vote(_L3_TOPIC, "router0", "COMPLIANCE", {"view": 0})   # 1 router in cold-1
    return {"cold1_router_votes": 1}
def l3_c2(log):
    log.append_vote(_L3_TOPIC, "router1", "COMPLIANCE", {"view": 1})
    log.append_vote(_L3_TOPIC, "router2", "DEFENSE", {"view": 2})       # 2 routers in cold-2 (2-1 split)
    return {"cold2_router_votes": 2}
def l3_tally(log):
    v = log.read_quorum(_L3_TOPIC, quorum=2)     # commit iff a single anchor has >=2 of 3
    return {"n_routers": v["distinct_members"], "tally": v["tally"], "chosen": v["winner"],
            "escalate": not v["quorum_met"], "decision": v["decision"], "chain_ok": v["chain_ok"],
            "expected": "COMPLIANCE (2 of 3 routers agree -> commit, not escalate)",
            "ok": v["quorum_met"] and v["winner"] == "COMPLIANCE" and v["chain_ok"] and v["distinct_members"] == 3}
HONEST_NOTE["l3_anchor_quorum"] = ("Plurality-commit-iff->=2-of-3 rule reused from "
    "sov33_l3_anchor_quorum.quorum; 3 router votes (2-1 split) across two cold calls -> COMPLIANCE "
    "commits, tallied cold-3 from the ordered log. Routers are ballots (real OCI routing = DESIGNED).")

# =====================================================================================
# 6 · L0 P7 — BFT council protocol. PBFT: n=3f+1 replicas; a value COMMITS iff >= 2f+1 prepare on it.
#     n=4 -> f=1 -> commit threshold 2f+1 = 3.  One faulty replica proposes a conflicting value.
# =====================================================================================
_P7_TOPIC = "l0_p7_bft.commit"
_P7_N = 4                                          # n=3f+1 with f=1 -> commit needs 2f+1 = 3
def p7_c1(log):
    log.append_vote(_P7_TOPIC, "replica0", "V_apply", {"phase": "prepare"})
    log.append_vote(_P7_TOPIC, "replica1", "V_apply", {"phase": "prepare"})   # 2 prepares in cold-1
    return {"cold1_prepares": 2}
def p7_c2(log):
    log.append_vote(_P7_TOPIC, "replica2", "V_apply", {"phase": "prepare"})   # 3rd honest prepare
    log.append_vote(_P7_TOPIC, "replica3", "V_reject", {"phase": "prepare"})  # faulty replica -> different value
    return {"cold2_prepares": 2}
def p7_tally(log):
    f = (_P7_N - 1) // 3
    commit_threshold = 2 * f + 1
    v = log.read_quorum(_P7_TOPIC, quorum=commit_threshold)
    committed_val = v["winner"]
    return {"n_replicas": v["distinct_members"], "f_tolerated": f, "commit_threshold_2f_plus_1": commit_threshold,
            "tally": v["tally"], "committed_value": committed_val, "committed": v["quorum_met"],
            "chain_ok": v["chain_ok"],
            "expected": "V_apply commits (3 of 4 replicas prepare it >= 2f+1=3; 1 faulty forfeits)",
            "ok": v["quorum_met"] and committed_val == "V_apply" and v["chain_ok"] and v["distinct_members"] == 4}
HONEST_NOTE["l0_p7_bft"] = ("PBFT commit rule (n=3f+1, commit iff >= 2f+1 prepare the same value) applied "
    "over the ordered log; 4 replica prepares (3 agree, 1 faulty) across two cold calls -> V_apply commits, "
    "tallied cold-3. PROVENANCE: L0 P7 has no dedicated module (the audit lists only the abstract 'BFT quorum' "
    "symbol); n=3f+1 with quorum 2f+1 is the estate's OWN canonical BFT math (sov33_4brain BFT_CONFIGS: f=1 at "
    "n=5, f=3 at n=12; sov33_queen_hives.SubHive: quorum=2*f+1) instantiated here at n=4. The ordered view is "
    "RUNNING; Byzantine AGREEMENT on that order across untrusted replicas (leader election, view change, "
    "3-phase commit) is the DESIGNED prod part.")

# ---- dispatch ----
COMPONENTS = {
    "bft_hive":           (hive_c1,   hive_c2,   hive_tally),
    "bft33_owem_council": (bft33_c1,  bft33_c2,  bft33_tally),
    "sac_council":        (sac_c1,    sac_c2,    sac_tally),
    "queen_hives":        (queen_c1,  queen_c2,  queen_tally),
    "l3_anchor_quorum":   (l3_c1,     l3_c2,     l3_tally),
    "l0_p7_bft":          (p7_c1,     p7_c2,     p7_tally),
}
PHASE_IDX = {"c1": 0, "c2": 1, "tally": 2}

def negative_controls():
    """Prove the quorum-read DISCRIMINATES — it does not rubber-stamp. Returns pass/fail per control.
    (In-process: these are property tests of the log's verdict logic, not the cold-process claim.)"""
    import tempfile, sqlite3
    db = os.path.join(tempfile.mkdtemp(), "neg_controls.sqlite")
    log = ConsensusLog(db_path=db)
    out = {}
    # A: genuine 1-1-1 split -> NO_QUORUM (does not invent a winner)
    for m, v in (("r0", "COMPLIANCE"), ("r1", "DEFENSE"), ("r2", "VOICE")):
        log.append_vote("split", m, v)
    a = log.read_quorum("split", quorum=2)
    out["split_returns_no_quorum"] = (a["decision"] == "NO_QUORUM" and not a["quorum_met"])
    # B: 2-2 tie -> NO_QUORUM (a tie is not a quorum)
    for m, v in (("a", "X"), ("b", "X"), ("c", "Y"), ("d", "Y")):
        log.append_vote("tie", m, v)
    b = log.read_quorum("tie", quorum=2)
    out["tie_returns_no_quorum"] = (b["tie"] and b["decision"] == "NO_QUORUM")
    # C: tamper a committed entry's stored value in sqlite -> verify_chain catches it at the right seq
    for m in ("m1", "m2", "m3"):
        log.append_vote("tamper", m, "ALLOW")
    assert log.verify_chain("tamper")["ok"]
    log.close()
    raw = sqlite3.connect(db)
    rows = raw.execute("SELECT seq,record FROM log WHERE ns=? ORDER BY seq", ("consensus:tamper",)).fetchall()
    rec = json.loads(rows[1][1]); rec["value"] = "REJECT"
    raw.execute("UPDATE log SET record=? WHERE ns=? AND seq=?",
                (json.dumps(rec, sort_keys=True), "consensus:tamper", rows[1][0]))
    raw.commit(); raw.close()
    log2 = ConsensusLog(db_path=db)
    chk = log2.verify_chain("tamper")
    out["tamper_detected_at_seq2"] = (not chk["ok"] and chk["broken_at"] == 2)
    log2.close()
    return {"controls": out, "ok": all(out.values())}


if __name__ == "__main__":
    if len(sys.argv) == 2 and sys.argv[1] == "controls":
        r = negative_controls()
        print(json.dumps({"component": "negative_controls", "phase": "controls",
                          "pid": os.getpid(), "ok": r["ok"], "detail": r["controls"]}))
        sys.exit(0)
    comp, phase = sys.argv[1], sys.argv[2]
    fn = COMPONENTS[comp][PHASE_IDX[phase]]
    log = LOG()
    try:
        detail = fn(log)
    finally:
        log.close()
    ok = detail.get("ok", True) if phase == "tally" else True
    print(json.dumps({"component": comp, "phase": phase, "pid": os.getpid(), "ok": ok, "detail": detail}))
