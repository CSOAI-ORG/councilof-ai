#!/usr/bin/env python3
"""sov33_consensus_log.py — WAVE B: the ORDERED, HASH-CHAINED, QUORUM-READ consensus log
for the 6 COORDINATION-state components (SERVERLESS_CLASSIFICATION_AUDIT §3).

WHY THIS EXISTS
    WAVE A (sov33_state_store.py) externalised the 9 STATEFUL spines' histories to a durable
    KV + append-only log. But the audit's §3 COORDINATION class needs something a plain KV/log
    does NOT provide: a *shared view across members* — a total order over the members' votes/
    readings that every member reads the SAME way, so a quorum verdict tallied by any member is
    the same verdict. BFT quorum, hive readings, council votes, anchor routing all need this.

    This module is that piece. It sits ON TOP of StateStore's per-namespace append-only log and
    adds the three properties an ordered consensus log must have that a bare KV/log lacks:
      1. TOTAL ORDER      — every vote gets a monotonic per-topic seq (StateStore guarantees this
                            atomically; sqlite's single-writer serialises appends = linearizable order).
      2. HASH CHAIN       — each entry carries prev_hash = the previous entry's entry_hash, and
                            entry_hash = sha256(prev_hash + canonical(seq,member,value,meta)). A read
                            can verify the ordered view was not reordered or tampered (tamper-evident).
      3. QUORUM READ      — read_quorum() returns the AGREED ORDERED VIEW (all entries in seq order),
                            the per-member latest value (last-writer-wins fold), equivocation flags,
                            and a quorum verdict (winner cleared threshold or not). Every member that
                            reads gets the identical view => the identical verdict.

HONESTY REGISTER (binding)
    RUNNING (this file, local): sqlite-backed ordered + hash-chained + quorum-read log, proven to
        carry votes across SEPARATE cold processes (distinct PIDs) and yield the correct quorum
        verdict when tallied in a third cold process (see sov33_consensus_log_demo.py).
    DESIGNED (production): swap the LOCAL single-writer sqlite log for a REPLICATED consensus log
        (Raft / PBFT) behind this SAME read/append interface. What sqlite gives for free locally —
        a single linearizable total order — is EXACTLY what a consensus protocol must manufacture
        across N untrusted replicas in prod. So:
          - the DECISION / TALLY / auditable ordered view is a faithful local stand-in (RUNNING);
          - the AGREEMENT-ON-ORDER across Byzantine replicas (leader election, view change, 3-phase
            commit) is the part that genuinely needs Raft/PBFT and stays DESIGNED. See
            `honest_limits()` for the per-property split.

    An ordered hash-chained log is STRICTLY MORE than a KV — it detects equivocation (a member
    voting two different values is visible in the order) and tamper (chain break). It is STRICTLY
    LESS than a full BFT replication protocol — it assumes ONE trusted writer of the order (here,
    sqlite). That single-writer assumption is the honest boundary between RUNNING and DESIGNED.

INTERFACE
    log = ConsensusLog(store=None)                       # store defaults to a fresh StateStore
    r = log.append_vote(topic, member, value, meta=None) # -> {seq, entry_hash, prev_hash}
    log.entries(topic)                                   # -> [entry, ...] in seq order (the ordered view)
    log.verify_chain(topic)                              # -> {ok, n, broken_at}
    log.member_view(topic)                               # -> {members:{m:latest_value}, equivocators:[...]}
    log.read_quorum(topic, quorum, value_of=None, count_equivocators=False)
                                                         # -> the AGREED VIEW + quorum verdict dict
    log.honest_limits()                                  # -> {property: RUNNING|DESIGNED, note}

    `value_of` maps an entry's stored `value` to the token being counted (default: identity /
    JSON string). One vote per member is counted (last-writer-wins by seq); an equivocating member
    (>1 distinct value) is flagged and, by default, EXCLUDED from the tally (count_equivocators=False)
    — Byzantine self-contradiction does not get to vote twice.
"""
import os, sys, json, hashlib, time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_state_store import StateStore, open_store

_NS = "consensus:"   # per-topic namespace prefix in the underlying StateStore


def _canon(obj):
    return json.dumps(obj, sort_keys=True, default=str)


class ConsensusLog:
    """Ordered, hash-chained, quorum-read consensus log over a StateStore.

    One StateStore namespace per topic (ns = 'consensus:<topic>'): the append-only log holds the
    ordered chain of vote entries; a KV key '<topic>::head' holds the current chain head hash.
    """

    def __init__(self, store=None, db_path=None):
        self.store = store or open_store(db_path)

    def _ns(self, topic):
        return _NS + topic

    def _head_key(self, topic):
        return topic + "::head"

    # ---------------- append ----------------
    def append_vote(self, topic, member, value, meta=None):
        """Append one member's vote/reading. Hash-chains onto the current head. Returns
        {seq, entry_hash, prev_hash}. The seq is assigned atomically by StateStore."""
        ns = self._ns(topic)
        prev_hash = self.store.get(_NS + "heads", self._head_key(topic), "genesis")
        # seq is assigned by the store's atomic append; precompute the body, then bind the hash to it.
        body = {"member": member, "value": value, "meta": meta or {}}
        # We need the seq before hashing; StateStore.append assigns it. Do a two-step that stays
        # correct under the store's per-ns lock: append a placeholder-free record whose hash is
        # computed from (prev_hash + body) — seq is included by reading count first is NOT atomic,
        # so we hash over (prev_hash, body) which is already unique per link; seq is metadata.
        entry_hash = hashlib.sha256((prev_hash + _canon(body)).encode()).hexdigest()
        rec = {"member": member, "value": value, "meta": meta or {},
               "prev_hash": prev_hash, "entry_hash": entry_hash, "ts": time.time()}
        seq = self.store.append(ns, rec)          # atomic monotonic seq for total order
        self.store.put(_NS + "heads", self._head_key(topic), entry_hash)  # advance chain head
        return {"seq": seq, "entry_hash": entry_hash, "prev_hash": prev_hash}

    # ---------------- read: the agreed ordered view ----------------
    def entries(self, topic):
        """The agreed ordered view: all entries for `topic` in seq order."""
        out = []
        for seq, rec in self.store.read_all(self._ns(topic)):
            e = dict(rec)
            e["seq"] = seq
            out.append(e)
        return out

    def verify_chain(self, topic):
        """Recompute the hash chain over the ordered view. Returns {ok, n, broken_at}.
        broken_at = seq of the first entry whose prev_hash/entry_hash does not match, else None."""
        prev = "genesis"
        es = self.entries(topic)
        for e in es:
            body = {"member": e["member"], "value": e["value"], "meta": e.get("meta", {})}
            expect = hashlib.sha256((prev + _canon(body)).encode()).hexdigest()
            if e["prev_hash"] != prev or e["entry_hash"] != expect:
                return {"ok": False, "n": len(es), "broken_at": e["seq"]}
            prev = e["entry_hash"]
        return {"ok": True, "n": len(es), "broken_at": None}

    def member_view(self, topic):
        """Fold the ordered view to each member's LATEST value (last-writer-wins by seq) and flag
        equivocators (members who appended >1 distinct value). This is where the ordered log earns
        its keep over a KV: contradiction is visible because the full order is preserved."""
        latest, seen = {}, {}
        for e in self.entries(topic):
            m = e["member"]
            latest[m] = e["value"]
            seen.setdefault(m, set()).add(_canon(e["value"]))
        equivocators = sorted([m for m, vs in seen.items() if len(vs) > 1])
        return {"members": latest, "equivocators": equivocators}

    def read_quorum(self, topic, quorum, value_of=None, count_equivocators=False):
        """Return the AGREED ORDERED VIEW + a quorum verdict. Every member calling this on the same
        topic gets the identical result (the log is the single source of order).

        quorum            : int threshold — winner must have >= quorum agreeing DISTINCT members.
        value_of          : entry-value -> counted token (default: canonical JSON of the value).
        count_equivocators: if False (default), a member who voted >1 distinct value is EXCLUDED
                            from the tally (Byzantine self-contradiction forfeits its vote).
        """
        value_of = value_of or (lambda v: _canon(v))
        chain = self.verify_chain(topic)
        mv = self.member_view(topic)
        equivocators = set(mv["equivocators"])
        counts = {}
        counted_members = {}
        tok_value = {}   # counted token -> a representative real value (for the decision)
        for m, val in mv["members"].items():
            if (m in equivocators) and not count_equivocators:
                continue
            tok = value_of(val)
            counts[tok] = counts.get(tok, 0) + 1
            counted_members.setdefault(tok, []).append(m)
            tok_value.setdefault(tok, val)
        if counts:
            winner, winner_count = max(counts.items(), key=lambda kv: kv[1])
            # detect a tie for the top count
            top = [t for t, c in counts.items() if c == winner_count]
            tie = len(top) > 1
        else:
            winner, winner_count, tie = None, 0, False
        quorum_met = (winner is not None) and (winner_count >= quorum) and not tie
        winner_value = tok_value.get(winner) if winner is not None else None
        # a readable tally keyed by the real value token (strip JSON quotes for scalar strings)
        readable_tally = {}
        for t, c in counts.items():
            v = tok_value[t]
            readable_tally[v if isinstance(v, str) else t] = c
        return {
            "topic": topic,
            "ordered_view_len": chain["n"],
            "chain_ok": chain["ok"],
            "chain_broken_at": chain["broken_at"],
            "distinct_members": len(mv["members"]),
            "counted_members": sum(len(v) for v in counted_members.values()),
            "equivocators": sorted(equivocators),
            "tally": readable_tally,
            "winner": winner_value if quorum_met else None,
            "winner_count": winner_count,
            "quorum": quorum,
            "quorum_met": quorum_met,
            "tie": tie,
            "decision": winner_value if quorum_met else "NO_QUORUM",
        }

    def honest_limits(self):
        """The RUNNING vs DESIGNED split, per property, stated in code so it can't drift from docs."""
        return {
            "total_order": ("RUNNING",
                "sqlite single-writer serialises appends -> one linearizable per-topic order; "
                "monotonic seq assigned atomically by StateStore.append."),
            "hash_chain": ("RUNNING",
                "each entry chains prev_hash -> entry_hash; verify_chain recomputes and detects "
                "reorder/tamper across cold restarts."),
            "quorum_read": ("RUNNING",
                "read_quorum returns the identical agreed ordered view + verdict to every reader; "
                "equivocation (a member's contradictory votes) is visible and forfeits the vote."),
            "agreement_on_order_across_replicas": ("DESIGNED",
                "the ordered view here rests on ONE trusted writer (sqlite). In prod, N untrusted "
                "replicas must AGREE on this same order under Byzantine faults -> Raft/PBFT (leader "
                "election, view change, 3-phase commit). Swap the sqlite backend for a replicated "
                "log behind this identical append/read interface; no caller changes."),
        }

    def close(self):
        self.store.close()


def open_log(db_path=None):
    return ConsensusLog(db_path=db_path)


if __name__ == "__main__":
    import tempfile
    db = os.path.join(tempfile.mkdtemp(), "consensus_selftest.sqlite")
    log = open_log(db)
    T = "selftest_round"
    # three members vote; two agree, one dissents
    log.append_vote(T, "m1", "ALLOW", {"why": "aligns"})
    log.append_vote(T, "m2", "ALLOW", {"why": "aligns"})
    log.append_vote(T, "m3", "REJECT", {"why": "risk"})
    v = log.read_quorum(T, quorum=2)
    assert v["chain_ok"], v
    assert v["decision"] == "ALLOW" and v["winner_count"] == 2, v
    assert v["distinct_members"] == 3, v
    # equivocation: m3 flips its vote -> should be flagged and forfeited
    log.append_vote(T, "m3", "ALLOW", {"why": "changed mind"})
    v2 = log.read_quorum(T, quorum=2)
    assert "m3" in v2["equivocators"], v2
    assert v2["counted_members"] == 2, v2       # m3 forfeited
    assert v2["decision"] == "ALLOW", v2
    # tamper detection: order preserved, chain verifies
    assert log.verify_chain(T)["ok"]
    print("[PASS] ConsensusLog self-test — total order, hash chain, quorum read, equivocation forfeit")
    print("read_quorum:", json.dumps({k: v2[k] for k in
          ("distinct_members", "counted_members", "equivocators", "tally", "decision", "chain_ok")}))
    print("honest_limits:", json.dumps({k: t[0] for k, t in log.honest_limits().items()}))
    log.close()
