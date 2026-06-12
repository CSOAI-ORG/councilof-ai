"""
king_hive.py — the King Hive.

Central arbiter and BFT consensus engine. Routes SIGIL envelopes, holds
the 12 queens, runs PBFT-style consensus (2f+1 quorum of votes, not weight).
The King is the only node that certifies a result. Fails safe: if no
quorum, the King returns "no_consensus" rather than blessing a wrong answer.
"""
from __future__ import annotations

import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

from .sigil_v2 import Sigil, Hemisphere, MsgKind, make_sigil, DEFAULT_SECRET
from ..ghives.queen_ghives import (
    GHIVE_REGISTRY, Ghive, GhiveDomain, QueenSwarm, QueenVote, SAFETY_RING,
)


class TicketStatus(str, Enum):
    OPEN = "open"
    CERTIFIED = "certified"
    REJECTED = "rejected"
    NO_QUORUM = "no_quorum"
    EXPIRED = "expired"


@dataclass
class ConsensusTicket:
    ticket_id: str
    proposal: str
    proposer: str
    votes: List[QueenVote] = field(default_factory=list)
    status: TicketStatus = TicketStatus.OPEN
    created_at: float = field(default_factory=time.time)
    certified_at: Optional[float] = None
    rationale: str = ""
    audit_log: List[Dict[str, Any]] = field(default_factory=list)
    bft_round: int = 0
    consensus_latency_ms: float = 0.0

    def add_audit(self, event: str, **details: Any) -> None:
        self.audit_log.append({"ts": time.time(), "event": event,
                               "round": self.bft_round, **details})

    def tallies(self) -> Dict[str, float]:
        out: Dict[str, float] = {}
        for v in self.votes:
            out[v.vote] = out.get(v.vote, 0.0) + v.weight
        return out

    def leader(self) -> Tuple[str, float]:
        t = self.tallies()
        if not t:
            return ("", 0.0)
        return max(t.items(), key=lambda kv: kv[1])


class KingHive:
    def __init__(self, secret: str = DEFAULT_SECRET,
                 queen_count: int = 12,
                 f_tolerance: Optional[int] = None) -> None:
        self.secret = secret
        self.queens = QueenSwarm()
        assert len(self.queens.all()) == queen_count
        self.n = queen_count
        self.f = f_tolerance if f_tolerance is not None else (queen_count - 1) // 3
        self.quorum = 2 * self.f + 1
        self.tickets: Dict[str, ConsensusTicket] = {}
        self.sigil_log: List[Sigil] = []
        self.safety_ring_names = {g.domain.value for g in self.queens.safety_ring()}

    def hemisphere_for_kind(self, kind: MsgKind) -> Hemisphere:
        if kind == MsgKind.THINK:
            return Hemisphere.RIGHT
        if kind == MsgKind.ANALYZE:
            return Hemisphere.LEFT
        if kind in (MsgKind.SYNTHESIZE, MsgKind.VOTE, MsgKind.CERTIFY, MsgKind.DREAM):
            return Hemisphere.BOTH
        return Hemisphere.KING

    def route(self, sigil: Sigil) -> Dict[str, Any]:
        if not sigil.verify(self.secret):
            return {"status": "rejected", "reason": "bad_signature"}
        if sigil.is_expired():
            return {"status": "rejected", "reason": "expired"}
        hemi = self.hemisphere_for_kind(sigil.kind)
        self.sigil_log.append(sigil)
        return {
            "status": "routed", "msg_id": sigil.msg_id,
            "kind": sigil.kind.value, "hemisphere": hemi.value, "dst": sigil.dst,
        }

    def open_ticket(self, proposal: str, proposer: str) -> ConsensusTicket:
        t = ConsensusTicket(ticket_id=str(uuid.uuid4()),
                            proposal=proposal, proposer=proposer)
        t.add_audit("opened", proposer=proposer)
        self.tickets[t.ticket_id] = t
        return t

    def cast_votes(self, ticket_id: str, votes: List[QueenVote]) -> ConsensusTicket:
        t = self.tickets.get(ticket_id)
        if not t:
            raise KeyError(f"unknown ticket: {ticket_id}")
        if t.status != TicketStatus.OPEN:
            return t
        t.bft_round += 1
        start = time.time()
        t.votes.extend(votes)
        t.add_audit("votes_received", count=len(votes), round_=t.bft_round)
        t.consensus_latency_ms = (time.time() - start) * 1000.0
        return t

    def certify(self, ticket_id: str, rationale: str = "") -> ConsensusTicket:
        t = self.tickets.get(ticket_id)
        if not t:
            raise KeyError(f"unknown ticket: {ticket_id}")
        if t.status != TicketStatus.OPEN:
            return t

        leading, _ = t.leader()
        supporters = [v for v in t.votes if v.vote == leading]
        non_supporters = [v for v in t.votes if v.vote != leading]

        t.add_audit("certify_attempt",
                    leading=leading, supporters=len(supporters),
                    needed=self.quorum, total=len(t.votes))

        if len(supporters) >= self.quorum:
            t.status = TicketStatus.CERTIFIED
            t.certified_at = time.time()
            t.rationale = rationale or f"quorum {len(supporters)}/{self.quorum} for '{leading}'"
            t.add_audit("certified", winner=leading, quorum=len(supporters))
        elif len(t.votes) >= self.n:
            t.status = TicketStatus.NO_QUORUM
            t.rationale = f"only {len(supporters)}/{self.quorum} for '{leading}'; failing safe"
            t.add_audit("no_quorum", winner=leading, supporters=len(supporters))
        else:
            t.add_audit("waiting", voted=len(t.votes), needed=self.n)
        return t

    def forge_sigils(self, prompt: str, queens_votes: Dict[str, str],
                     from_node: str = "sov3://king/king-01") -> List[Sigil]:
        sigils: List[Sigil] = []
        for i, (domain, vote) in enumerate(queens_votes.items()):
            s = make_sigil(
                src=from_node,
                dst=f"sov3://queen/{domain}/q-{domain}",
                hemisphere=Hemisphere.KING, kind=MsgKind.VOTE,
                body={"vote": vote, "prompt": prompt}, counter=i,
            )
            s.sign(self.secret)
            sigils.append(s)
        return sigils

    def run_queens_on(self, prompt: str,
                      decide: Optional[Any] = None) -> ConsensusTicket:
        t = self.open_ticket(proposal=prompt, proposer="sov3://king")

        def default_decide(g: Ghive) -> QueenVote:
            if g.in_safety_ring and any(bad in prompt.lower()
                                        for bad in ("exploit", "harm", "bypass", "ignore safety")):
                return QueenVote(ghive=g.domain.value, vote="against", weight=g.weight,
                                 confidence=0.95, rationale="charter violation")
            return QueenVote(ghive=g.domain.value, vote="for", weight=g.weight,
                             confidence=0.85, rationale="queen ack")

        votes = self.queens.cast_votes(prompt, decide or default_decide)
        self.cast_votes(t.ticket_id, votes)
        return self.certify(t.ticket_id, rationale=f"BFT 2f+1 on: {prompt[:60]}")

    def status(self) -> Dict[str, Any]:
        return {
            "queens": len(self.queens.all()),
            "safety_ring": sorted(self.safety_ring_names),
            "n": self.n, "f": self.f, "quorum": self.quorum,
            "tickets_open": sum(1 for t in self.tickets.values() if t.status == TicketStatus.OPEN),
            "tickets_certified": sum(1 for t in self.tickets.values() if t.status == TicketStatus.CERTIFIED),
            "tickets_no_quorum": sum(1 for t in self.tickets.values() if t.status == TicketStatus.NO_QUORUM),
            "sigils_routed": len(self.sigil_log),
        }
