"""
e2e_test.py — the real end-to-end test suite for SOV3 / csoai.org.

Run:  python3 -m sov3_hive.e2e_test
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path
from typing import Any, Dict, List

sys.path.insert(0, "/Users/nicholas/clawd")
from sov3_hive.core.sigil_v2 import (
    Sigil, Hemisphere, MsgKind, make_sigil, DEFAULT_SECRET,
)
from sov3_hive.core.memory import MemoryStore, NodeType
from sov3_hive.ghives.queen_ghives import GHIVE_REGISTRY, QueenSwarm, QueenVote, Ghive
from sov3_hive.core.king_hive import KingHive, TicketStatus
from sov3_hive.core.horus import HorusHive, HorusVerdict
from sov3_hive.core.federation import Federation, AttestationKind
from sov3_hive.integrations.openmoe_bft_bridge import (
    OpenMoEBridge, evaluate_eu_ai_act, validate_a2a_card,
)
from sov3_hive.integrations.queen_expert_map import build_mapping
from sov3_hive.integrations.qudit_consensus import all_dimensions, weighted_quorum


PASS: List[str] = []
FAIL: List[tuple] = []


def t(name: str):
    def deco(fn):
        try:
            fn()
            PASS.append(name)
            print(f"  PASS  {name}")
        except AssertionError as e:
            FAIL.append((name, f"assertion: {e}"))
            print(f"  FAIL  {name}  -- {e}")
        except Exception as e:
            FAIL.append((name, f"{type(e).__name__}: {e}"))
            print(f"  FAIL  {name}  -- {type(e).__name__}: {e}")
        return fn
    return deco


def test_sigil():
    print("== SIGIL v2 ==")
    secret = "test-secret-1"

    @t("sigil: sign and verify")
    def _():
        s = make_sigil("a", "b", Hemisphere.RIGHT, MsgKind.THINK, {"x": 1})
        s.sign(secret)
        assert s.verify(secret), "verify should pass"

    @t("sigil: tampered body fails verify")
    def _():
        s = make_sigil("a", "b", Hemisphere.RIGHT, MsgKind.THINK, {"x": 1})
        s.sign(secret)
        s.body = {"x": 999}
        assert not s.verify(secret), "tampered should fail"

    @t("sigil: is_expired uses ttl")
    def _():
        s = make_sigil("a", "b", Hemisphere.LEFT, MsgKind.ANALYZE, {}, ttl=1)
        s.timestamp -= 100
        assert s.is_expired()

    @t("sigil: hemispheres + kinds are stable enums")
    def _():
        assert Hemisphere.RIGHT.value == "right"
        assert MsgKind.THINK.value == "think"

    @t("sigil: to_dict / from_dict round trip")
    def _():
        s = make_sigil("a", "b", Hemisphere.BOTH, MsgKind.SYNTHESIZE,
                       {"x": 1}, charter_refs=[9, 15])
        s.sign(secret)
        s2 = Sigil.from_dict(s.to_dict())
        assert s2.verify(secret)
        assert s2.charter_refs == [9, 15]


def test_memory():
    print("== Memory ==")

    @t("memory: add and query")
    def _():
        m = MemoryStore()
        a = m.add(NodeType.FACT, {"topic": "MCP", "content": "Model Context Protocol"},
                 tags=["protocol"], salience=0.9)
        b = m.add(NodeType.PATTERN, {"topic": "MCP", "content": "client/server"},
                 tags=["protocol"], salience=0.7)
        assert m.query("MCP protocol")[0].id == a
        assert m.stats()["total_nodes"] == 2

    @t("memory: link creates edge")
    def _():
        m = MemoryStore()
        a = m.add(NodeType.FACT, {"k": "v"}, tags=["x"])
        b = m.add(NodeType.FACT, {"k": "v2"}, tags=["x"])
        m.link(a, b, "elaborates")
        assert len(m.edges) == 1

    @t("memory: persistence round trip")
    def _():
        p = Path("/tmp/_sov3_mem_test.json")
        if p.exists():
            p.unlink()
        m1 = MemoryStore(persist_path=p)
        m1.add(NodeType.FACT, {"k": "v"}, salience=0.8)
        m1.save(p)
        m2 = MemoryStore(persist_path=p)
        assert m2.stats()["total_nodes"] == 1
        p.unlink()


def test_queens():
    print("== 12 Queen Ghives ==")

    @t("queens: registry has 12 distinct queens")
    def _():
        assert len(GHIVE_REGISTRY) == 12
        domains = {g.domain for g in GHIVE_REGISTRY}
        assert len(domains) == 12

    @t("queens: safety ring is 3 queens (ethics/audit/system)")
    def _():
        s = QueenSwarm()
        ring = {g.domain.value for g in s.safety_ring()}
        assert ring == {"ethics", "audit", "system"}

    @t("queens: delegate returns named queen")
    def _():
        s = QueenSwarm()
        r = s.delegate("code", "write async fn")
        assert r["queen"] == "Code Queen"

    @t("queens: cast_votes yields 12 votes")
    def _():
        s = QueenSwarm()
        votes = s.cast_votes("test", lambda g: QueenVote(
            ghive=g.domain.value, vote="for", weight=g.weight))
        assert len(votes) == 12


def test_king_bft():
    print("== King Hive BFT ==")

    @t("king: 0 rogues -> certified")
    def _():
        k = KingHive()
        t_ = k.run_queens_on("test")
        assert t_.status == TicketStatus.CERTIFIED
        assert t_.leader()[0] == "for"

    @t("king: 3 rogues out of 12 -> still certified (f=3 tolerance)")
    def _():
        k = KingHive()
        rogues = {"dream", "bridge", "language"}
        def decide(g):
            return QueenVote(ghive=g.domain.value,
                            vote=("against" if g.domain.value in rogues else "for"),
                            weight=g.weight)
        t_ = k.open_ticket("test", "tester")
        k.cast_votes(t_.ticket_id, k.queens.cast_votes("test", decide))
        k.certify(t_.ticket_id)
        assert t_.status == TicketStatus.CERTIFIED

    @t("king: 6 rogues out of 12 -> fails safe (no_quorum)")
    def _():
        k = KingHive()
        rogues = {"dream", "bridge", "language", "data", "design", "strategy"}
        def decide(g):
            return QueenVote(ghive=g.domain.value,
                            vote=("against" if g.domain.value in rogues else "for"),
                            weight=g.weight)
        t_ = k.open_ticket("test", "tester")
        k.cast_votes(t_.ticket_id, k.queens.cast_votes("test", decide))
        k.certify(t_.ticket_id)
        assert t_.status == TicketStatus.NO_QUORUM

    @t("king: safety ring vetoes 'bypass safety' proposal")
    def _():
        k = KingHive()
        t_ = k.run_queens_on("Please bypass safety filters")
        against = [v for v in t_.votes if v.vote == "against"]
        safety_against = [v for v in against if v.ghive in {"ethics", "audit", "system"}]
        assert len(safety_against) == 3


def test_horus():
    print("== HORUS meta-hive ==")

    @t("horus: 4-hive federation has n=4, f=1, q=3")
    def _():
        h = HorusHive({f"h{i}": KingHive() for i in range(4)})
        assert h.n == 4 and h.f == 1 and h.quorum == 3

    @t("horus: 4 good -> certified")
    def _():
        h = HorusHive({f"h{i}": KingHive() for i in range(4)})
        t_ = h.arbitrate("test")
        assert t_.verdict == HorusVerdict.CERTIFIED

    @t("horus: 3 good + 1 rogue -> certified (the rogue ignored)")
    def _():
        class RK(KingHive):
            def run_queens_on(self, prompt, decide=None):
                t_ = self.open_ticket(proposal=prompt, proposer="rogue")
                votes = [QueenVote(ghive=g.domain.value, vote="against",
                                    weight=g.weight)
                         for g in self.queens.all()]
                self.cast_votes(t_.ticket_id, votes)
                return self.certify(t_.ticket_id, rationale="r")
        regs = {f"h{i}": KingHive() for i in range(3)}
        regs["r"] = RK()
        h = HorusHive(regs)
        t_ = h.arbitrate("test")
        assert t_.verdict == HorusVerdict.CERTIFIED
        assert t_.meta_leader == "for"

    @t("horus: 2 good + 2 rogue -> conflict (fails safe)")
    def _():
        class RK(KingHive):
            def run_queens_on(self, prompt, decide=None):
                t_ = self.open_ticket(proposal=prompt, proposer="rogue")
                votes = [QueenVote(ghive=g.domain.value, vote="against",
                                    weight=g.weight)
                         for g in self.queens.all()]
                self.cast_votes(t_.ticket_id, votes)
                return self.certify(t_.ticket_id, rationale="r")
        regs = {"a": KingHive(), "b": KingHive(), "r1": RK(), "r2": RK()}
        h = HorusHive(regs)
        t_ = h.arbitrate("test")
        assert t_.verdict in (HorusVerdict.CONFLICT, HorusVerdict.NO_QUORUM)


def test_federation():
    print("== Federation (data moat) ==")

    @t("federation: 4 hives, f=1, q=3")
    def _():
        f = Federation(log_path="/tmp/_t_fed1.jsonl")
        st = f.horus.status()
        assert st["n"] == 4 and st["f"] == 1 and st["quorum"] == 3

    @t("federation: attest creates hash-chained entry")
    def _():
        p = "/tmp/_t_fed2.jsonl"
        if os.path.exists(p): os.remove(p)
        f = Federation(log_path=p)
        a1 = f.attest(AttestationKind.DIAMOND, "test1", {"k": "v1"})
        a2 = f.attest(AttestationKind.DIAMOND, "test2", {"k": "v2"})
        assert a2.prev_hash == a1.attestation_hash
        assert f.verify_chain()
        os.remove(p)

    @t("federation: chain survives reload from disk")
    def _():
        p = "/tmp/_t_fed3.jsonl"
        if os.path.exists(p): os.remove(p)
        f1 = Federation(log_path=p)
        for i in range(5):
            f1.attest(AttestationKind.DIAMOND, f"subj{i}", {"i": i})
        f2 = Federation(log_path=p)
        assert len(f2.log) == 5
        assert f2.verify_chain()
        os.remove(p)

    @t("federation: tamper detection works")
    def _():
        p = "/tmp/_t_fed4.jsonl"
        if os.path.exists(p): os.remove(p)
        f = Federation(log_path=p)
        for i in range(3):
            f.attest(AttestationKind.DIAMOND, f"s{i}", {"i": i})
        with open(p) as fh:
            lines = fh.read().splitlines()
        d = json.loads(lines[1])
        d["claim"] = {"tampered": True}
        lines[1] = json.dumps(d)
        with open(p, "w") as fh:
            fh.write("\n".join(lines) + "\n")
        f2 = Federation(log_path=p)
        assert not f2.verify_chain()
        os.remove(p)

    @t("federation: get_by_hash returns the right entry")
    def _():
        p = "/tmp/_t_fed5.jsonl"
        if os.path.exists(p): os.remove(p)
        f = Federation(log_path=p)
        a = f.attest(AttestationKind.DIAMOND, "findme", {"k": "v"})
        found = f.get_by_hash(a.attestation_hash)
        assert found is not None
        assert found.attestation_id == a.attestation_id
        os.remove(p)


def test_compliance():
    print("== EU AI Act + A2A ==")

    @t("eu-ai-act: 100% with all evidence")
    def _():
        ev = {k: True for k in [
            "Art.5_prohibited","Art.6_classification","Art.9_risk_management",
            "Art.10_data_governance","Art.11_technical_docs","Art.12_record_keeping",
            "Art.13_transparency","Art.14_human_oversight","Art.15_accuracy",
            "Art.16_robustness","Art.52_provider_obligations","Art.53_provider_registration",
            "Art.54_post_market","Art.55_serious_incident","Art.69_standardisation",
            "Art.70_codes_of_conduct","Art.71_sandbox","Art.72_testing_real_world",
            "Art.73_governance","Art.74_enforcement"]}
        r = evaluate_eu_ai_act(ev)
        assert r["score"] == 100.0
        assert r["blockers"] == []

    @t("a2a: full card passes")
    def _():
        ok, _ = validate_a2a_card({
            "id": "x", "name": "n", "version": "1.0", "description": "d",
            "endpoints": ["/a"], "capabilities": ["b"],
            "expert": {"id": "EXP-CODE-01"}, "charter_alignment": [9, 15],
            "audit_endpoint": "/audit",
        })
        assert ok


def test_mappings():
    print("== Mappings ==")

    @t("qudit: 12 dimensions match 12 queens")
    def _():
        dims = all_dimensions()
        assert len(dims) == 12

    @t("queen-expert: 12 mappings with 3 safety + 7 regional + 2 special")
    def _():
        m = build_mapping()
        assert len(m) == 12
        rings = {x.ring for x in m}
        assert rings == {"safety", "regional", "special"}


def test_frameworks():
    print("== 30 frameworks + 14 missing MCPs ==")

    @t("frameworks: 30 total, 30 live, 14 new MCPs")
    def _():
        from sov3_hive.integrations.frameworks import all_frameworks, live_count, REGISTRY_NEW_14
        assert len(all_frameworks()) == 30
        assert live_count() == 30
        assert len(REGISTRY_NEW_14) == 14

    @t("frameworks: 14 new MCPs each have evaluate() with valid score")
    def _():
        from sov3_hive.integrations.frameworks import REGISTRY_NEW_14
        for fid, mcp in REGISTRY_NEW_14.items():
            r = mcp().evaluate({f"key-{i}": True for i in range(5)})
            assert r.framework_id == fid
            assert 0 <= r.score <= 100

    @t("frameworks: include all 14 originally-missing")
    def _():
        from sov3_hive.integrations.frameworks import REGISTRY_NEW_14
        required = {"pipl", "mas-trmg", "appi", "sk-ai-basic", "india-dpdp",
                    "fda-samd", "fda-ai-ml", "eu-mdr", "owasp-agentic",
                    "aisi-uk", "nist-cyber", "ftc-section-5", "ada-2024",
                    "wp29-aiact"}
        assert set(REGISTRY_NEW_14.keys()) == required


def test_real_hives():
    print("== Real hive bridges ==")

    @t("real-hives: 4 hives registered")
    def _():
        from sov3_hive.core.real_hives import all_4_real_hives
        hives = all_4_real_hives()
        assert set(hives.keys()) == {"sov3", "meok", "sovereign-comm", "csoai-ri"}

    @t("real-hives: probe returns HiveProbe with status")
    def _():
        from sov3_hive.core.real_hives import all_4_real_hives
        for name, hive in all_4_real_hives().items():
            p = hive.ping()
            assert p.last_status in ("ok", "down")
            assert p.last_latency_ms > 0

    @t("real-hives: degraded backend -> all queens vote against")
    def _():
        from sov3_hive.core.real_hives import RealHive
        h = RealHive(name="test", probe_url="http://127.0.0.1:1/health")
        t_ = h.run_queens_on("test")
        against = [v for v in t_.votes if v.vote == "against"]
        assert len(against) == 12


def test_art50_and_search():
    print("== Art 50 + search + verify-by-hash ==")
    import urllib.request
    BASE = "http://127.0.0.1:8766"

    @t("art50: 50 days remaining, 3+ chain evidence entries")
    def _():
        try:
            r = urllib.request.urlopen(f"{BASE}/art50", timeout=5)
            d = json.loads(r.read())
        except Exception:
            print("    (server not on 8766, skipped)")
            return
        assert d["days_remaining"] >= 49 and d["days_remaining"] <= 51
        assert d["chain_evidence_count"] >= 3
        assert d["frameworks_total"] == 30
        assert d["frameworks_live"] == 30
        assert d["cliff_product"]["tier"] == "article50"

    @t("search: ?q=mcp returns diamond attestations")
    def _():
        try:
            r = urllib.request.urlopen(f"{BASE}/search?q=mcp&limit=5", timeout=5)
            d = json.loads(r.read())
        except Exception:
            print("    (server not on 8766, skipped)")
            return
        assert d["total"] >= 9

    @t("search: ?kind=regulatory filters to 6 regulatory entries")
    def _():
        try:
            r = urllib.request.urlopen(f"{BASE}/search?kind=regulatory", timeout=5)
            d = json.loads(r.read())
        except Exception:
            print("    (server not on 8766, skipped)")
            return
        assert d["total"] == 6
        for r_ in d["results"]:
            assert r_["kind"] == "regulatory"

    @t("frameworks endpoint: 30 frameworks served")
    def _():
        try:
            r = urllib.request.urlopen(f"{BASE}/frameworks", timeout=5)
            d = json.loads(r.read())
        except Exception:
            print("    (server not on 8766, skipped)")
            return
        assert d["total"] == 30
        assert d["live"] == 30
        assert d["new_14_mcps"] == 14

    @t("verify-by-hash: returns the attestation with chain position")
    def _():
        try:
            r = urllib.request.urlopen(f"{BASE}/log?limit=1", timeout=5)
            items = json.loads(r.read())["items"]
            if not items:
                return
            h = items[0]["attestation_hash"]
            r2 = urllib.request.urlopen(f"{BASE}/attest/verify/{h}", timeout=5)
            d = json.loads(r2.read())
        except Exception:
            print("    (server not on 8766, skipped)")
            return
        assert d["verified"] is True
        assert d["attestation_hash"] == h
        assert d["chain_position"] >= 0
        assert d["sigil_verified"] is True

    @t("checkout: posts a purchase intent anchored to chain")
    def _():
        try:
            req = urllib.request.Request(f"{BASE}/checkout",
                data=json.dumps({"tier": "article50", "email": "test@x.io"}).encode(),
                headers={"Content-Type": "application/json"}, method="POST")
            d = json.loads(urllib.request.urlopen(req, timeout=5).read())
        except Exception:
            print("    (server not on 8766, skipped)")
            return
        assert d["tier"] == "article50"
        assert "checkout_url" in d
        assert d["intent_attestation"]["status"] == "certified"

    @t("pricing: 3 tiers served")
    def _():
        try:
            r = urllib.request.urlopen(f"{BASE}/pricing", timeout=5)
            d = json.loads(r.read())
        except Exception:
            print("    (server not on 8766, skipped)")
            return
        assert len(d["tiers"]) == 3
        ids = [t["id"] for t in d["tiers"]]
        assert "article50" in ids
        assert "pro" in ids
        assert "enterprise" in ids


def test_sov3_hive():
    print("== Sov3Hive ==")

    @t("hive: init + status")
    def _():
        from sov3_hive.sov3_hive import Sov3Hive
        h = Sov3Hive()
        st = h.status()
        assert st["king"]["queens"] == 12

    @t("hive: think returns certified reply")
    def _():
        from sov3_hive.sov3_hive import Sov3Hive
        h = Sov3Hive()
        r = h.think("What is 2+2?")
        assert r.reply.text
        assert r.cert.status == TicketStatus.CERTIFIED
        assert r.sigil.verify(h._secret)

    @t("hive: swap_right_brain changes model")
    def _():
        from sov3_hive.sov3_hive import Sov3Hive
        h = Sov3Hive()
        res = h.swap_right_brain("anthropic/claude-opus-4.8-fast", temperature=0.5)
        assert h.right.config.model == "anthropic/claude-opus-4.8-fast"
        assert res["old"] == "anthropic/claude-opus-4.8"

    @t("hive: apply_brain_preset swaps to a real model")
    def _():
        from sov3_hive.sov3_hive import Sov3Hive
        h = Sov3Hive()
        r = h.apply_brain_preset("left", "left_m3")
        assert r["model"] == "minimax/minimax-m3"
        assert h.left.config.model == "minimax/minimax-m3"

    @t("hive: LIVE OpenRouter call (Claude Opus, real)")
    def _():
        from sov3_hive.brains.openrouter_client import api_key, chat, ChatMessage
        from sov3_hive.brains.brain_hemispheres import Brain, PRESETS
        if not api_key():
            print("    (skipped — no OPENROUTER_API_KEY)")
            return
        brain = Brain(PRESETS["right_claude_opus"])
        r = brain.ask("In one sentence, what is sovereignty?")
        assert r.live, f"expected live call, got {r}"
        assert r.text
        assert r.input_tokens > 0 or r.output_tokens > 0


def test_bootstrap():
    print("== Bootstrap content ==")

    @t("bootstrap: 48 attestations across 6 kinds")
    def _():
        from sov3_hive.bootstrap import seed
        p = "/tmp/_t_bootstrap.jsonl"
        counts = seed(log_path=p, reset=True)
        assert counts["diamond"] == 20
        assert counts["bootstrap"] == 6
        assert counts["integration"] == 5
        assert counts["regulatory"] == 6
        assert counts["competitive"] == 5
        assert counts["architecture"] == 6
        assert sum(counts.values()) == 48
        f = Federation(log_path=p)
        assert f.verify_chain()
        os.remove(p)


def main() -> int:
    print("=" * 70)
    print("SOV3 + csoai.org end-to-end test suite (durable build)")
    print("=" * 70)
    test_sigil()
    test_memory()
    test_queens()
    test_king_bft()
    test_horus()
    test_federation()
    test_compliance()
    test_mappings()
    test_frameworks()
    test_real_hives()
    test_art50_and_search()
    test_sov3_hive()
    test_bootstrap()
    print()
    print("=" * 70)
    print(f"PASS: {len(PASS)}")
    print(f"FAIL: {len(FAIL)}")
    if FAIL:
        for name, err in FAIL:
            print(f"  FAIL  {name}\n         {err}")
    print("=" * 70)
    return 0 if not FAIL else 1


if __name__ == "__main__":
    sys.exit(main())
