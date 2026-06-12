"""
substrate_backed_hive.py — a King Hive that delegates to the real
meok/council/bft_council.py substrate (36 nodes, 22/36 threshold, 235
total architecture nodes including expertise + bridge).

This replaces the in-hive simplified KingHive with the production-grade
Sovereign Temple BFT council. The BFT semantics, care veto, SCL check,
expertise rings (132), and bridge network (55) are all real.
"""
from __future__ import annotations

import asyncio
import os
import sys
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

# import the real meok substrate
sys.path.insert(0, "/Users/nicholas/clawd")
try:
    from meok.council.bft_council import BFTCouncil
    SUBSTRATE_AVAILABLE = True
except ImportError:
    SUBSTRATE_AVAILABLE = False
    BFTCouncil = None  # type: ignore


@dataclass
class SubstrateVote:
    """A real vote from the meok substrate."""
    node_id: str
    domain: str
    recommendation: str
    avg_score: float
    rationale: str = ""


@dataclass
class SubstrateResult:
    """The substrate's verdict on a proposal."""
    proposal: str
    decision: str            # APPROVED | REJECTED | REJECTED_SCL_VIOLATION | REJECTED_CARE_VETO
    approve_count: int
    reject_count: int
    threshold: str
    total_nodes: int
    average_care_score: float
    expertise_summary: Dict[str, Any]
    bridge_conflicts: int
    consensus_reached: bool
    raw: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


class SubstrateBackedHive:
    """A King that delegates to the real meok BFTCouncil. Drop-in
    replacement for the in-hive KingHive. Each vote is a 235-node PBFT
    deliberation (36 council + 132 expertise + 55 bridge = 223+ nodes),
    with care veto and SCL check."""

    def __init__(self, name: str = "sov3-substrate",
                 secret: str = "sov3-sigil-v2-default-key",
                 threshold: int = 22):
        self.name = name
        self.secret = secret
        self.substrate_available = SUBSTRATE_AVAILABLE
        if self.substrate_available:
            self.council = BFTCouncil(threshold=threshold)
        self.tickets: Dict[str, SubstrateResult] = {}
        self._counter = 0
        self._log: List[Dict[str, Any]] = []

    def _run_sync(self, coro):
        try:
            loop = asyncio.new_event_loop()
            return loop.run_until_complete(coro)
        finally:
            loop.close()

    def propose(self, prompt: str, requester: str = "csoai.org",
                care_veto: bool = True) -> SubstrateResult:
        if not self.substrate_available:
            return SubstrateResult(
                proposal=prompt, decision="REJECTED_NO_SUBSTRATE",
                approve_count=0, reject_count=0, threshold="0/0",
                total_nodes=0, average_care_score=0.0,
                expertise_summary={}, bridge_conflicts=0,
                consensus_reached=False,
                raw={"error": "meok.council.bft_council not importable"},
            )
        old_veto = self.council.care_veto_enabled
        self.council.care_veto_enabled = care_veto
        try:
            raw = self._run_sync(
                self.council.propose_decision(prompt, requester=requester)
            )
        finally:
            self.council.care_veto_enabled = old_veto

        result = SubstrateResult(
            proposal=prompt,
            decision=raw.get("decision", "UNKNOWN"),
            approve_count=raw.get("vote_counts", {}).get("approve", 0),
            reject_count=raw.get("vote_counts", {}).get("reject", 0),
            threshold=raw.get("threshold", "?"),
            total_nodes=raw.get("node_count", 0),
            average_care_score=raw.get("average_care_score", 0.0),
            expertise_summary=raw.get("expertise_summary", {}),
            bridge_conflicts=raw.get("bridge_conflicts", 0),
            consensus_reached=raw.get("consensus_reached", False),
            raw=raw,
        )

        self._counter += 1
        ticket_id = f"substrate-{self._counter}-{int(time.time()*1000)}"
        self.tickets[ticket_id] = result
        self._log.append({
            "ticket_id": ticket_id, "proposal": prompt,
            "decision": result.decision,
            "approve": result.approve_count,
            "reject": result.reject_count,
            "care_score": result.average_care_score,
            "ts": result.timestamp,
        })
        return result

    def status(self) -> Dict[str, Any]:
        if not self.substrate_available:
            return {
                "name": self.name, "substrate_available": False,
                "error": "meok.council.bft_council not importable",
            }
        return {
            "name": self.name,
            "substrate_available": True,
            "node_count": self.council.node_count,
            "expertise_node_count": self.council.expertise_node_count,
            "bridge_node_count": self.council.bridge_node_count,
            "total_architecture_nodes": self.council.total_architecture_nodes,
            "domains": sorted(self.council.domains),
            "threshold": f"{self.council.threshold}/{self.council.node_count}",
            "care_veto_enabled": self.council.care_veto_enabled,
            "decision_history": len(self.council.decision_history),
            "tickets_handled": len(self.tickets),
        }


def make_sov3_substrate_hive() -> SubstrateBackedHive:
    return SubstrateBackedHive(name="sov3", threshold=22)


def make_meok_substrate_hive() -> SubstrateBackedHive:
    return SubstrateBackedHive(name="meok", threshold=22)


if __name__ == "__main__":
    hive = make_sov3_substrate_hive()
    print("=== SOV3 Substrate-Backed Hive ===")
    st = hive.status()
    for k, v in st.items():
        if k != "domains":
            print(f"  {k}: {v}")
    print()
    r = hive.propose(
        "Ship csoai.org chain attestations through the real meok substrate PBFT",
        requester="csoai.org",
    )
    print(f"  decision: {r.decision}, votes: {r.approve_count}/{r.total_nodes}, "
          f"care={r.average_care_score:.3f}, threshold {r.threshold}")
    r2 = hive.propose("Deploy weapons to attack civilians")
    print(f"  SCL test: {r2.decision}, {r2.approve_count}/{r2.total_nodes}")
    r3 = hive.propose("do stuff")
    print(f"  low-care: {r3.decision}, {r3.approve_count}/{r3.total_nodes}, "
          f"care={r3.average_care_score:.3f}")
