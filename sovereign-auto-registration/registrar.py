"""
L1 — The Registrar

Consumes Candidate records from the L0 SigilTap and synthesizes a
RegistrationProposal suitable for the L1.5 Gate.

Key principle: L1 is a SYNTHESIZER, not a decider.
  - It combines evidence (multiple candidates for the same agent merge)
  - It computes a confidence score for the proposal
  - It picks the best description / capabilities from the strongest source
  - It assigns a C7 care-voucher cost (so L1.5 can fail if care is too low)
  - It NEVER calls register_agent — that's L2 (sovereign)

The output of L1 is a queue of proposals at:
  /tmp/sovereign-auto-registration/proposals.jsonl

Each proposal has enough evidence for a sovereign reviewer (or the L1.5
gate, with BFT 2-of-3) to decide in <100ms.
"""

from __future__ import annotations

import json
import time
import hashlib
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Optional

from sigil_tap import SigilTap, Candidate


# Source-reliability weights. L0 evidence is observational; the manifest
# is the strongest because the agent self-declared its shape.
SOURCE_WEIGHTS = {
    "sigil":        0.3,    # a sigil is a hint, not a manifest
    "horus_l0":     0.5,    # L0 audit saw the tool call PASS
    "manifest_post": 0.9,   # the agent explicitly posted its manifest
    "a2a_card":     0.8,    # A2A card is signed by the agent
}

# Default trust + care floors for new joiners. The L1.5 gate can lower
# these if a sovereign coordinator wants stricter onboarding.
DEFAULT_TRUST_FLOOR = 0.4
DEFAULT_CARE_FLOOR = 0.3


@dataclass
class RegistrationProposal:
    """A request to register a new agent in the sovereign mesh.

    This is NOT a registration. It's a *proposal* that the gate audits
    and the sovereign approves.
    """
    proposal_id: str
    proposed_at: float
    agent_id: str
    description: str
    capabilities: list[str]
    trust_level: float
    care_score: float
    confidence: float            # 0..1, how strong the L0 evidence is
    evidence_count: int          # how many candidates merged
    evidence_sources: list[str]  # which L0 sources contributed
    world: str
    care_voucher_cost: float     # how much C7 care-budget this registration consumes
    state: str = "PENDING"       # PENDING -> GATE_PASSED -> APPROVED / REJECTED
    gate_verdict: Optional[dict[str, Any]] = None
    sovereign_decision: Optional[dict[str, Any]] = None
    raw_candidates: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


class Registrar:
    """Merges candidates into proposals. Idempotent: same agent_id across
    multiple ticks produces one proposal with merged evidence.
    """

    def __init__(
        self,
        tap: Optional[SigilTap] = None,
        proposals_path: Optional[Path] = None,
        trust_floor: float = DEFAULT_TRUST_FLOOR,
        care_floor: float = DEFAULT_CARE_FLOOR,
    ) -> None:
        self.tap = tap or SigilTap()
        self.proposals_path = proposals_path or Path(
            "/tmp/sovereign-auto-registration/proposals.jsonl"
        )
        self.proposals_path.parent.mkdir(parents=True, exist_ok=True)
        self._by_agent: dict[str, RegistrationProposal] = {}
        self._proposal_ids_for_agent: dict[str, str] = {}
        self.trust_floor = trust_floor
        self.care_floor = care_floor

    # ---- main loop ------------------------------------------------------

    def tick(self) -> list[RegistrationProposal]:
        """Drain the tap, merge candidates, write new proposals to disk.

        Returns the list of proposals that were *newly created* this tick.
        Existing proposals are not re-emitted.
        """
        candidates = self._collect_candidates()
        return self._process_candidates(candidates)

    def feed(self, candidates: list[Candidate]) -> list[RegistrationProposal]:
        """Feed a batch of candidates (e.g. replayed from the JSONL log)
        and process them through synthesis. Used for re-scans and tests.
        """
        return self._process_candidates(candidates)

    def _collect_candidates(self) -> list[Candidate]:
        # The tap drains; the caller can also replay from JSONL.
        return self.tap.drain()

    def _process_candidates(self, candidates: list[Candidate]) -> list[RegistrationProposal]:
        # Group by agent_id (or by hint if no agent_id)
        grouped: dict[str, list[Candidate]] = defaultdict(list)
        for c in candidates:
            key = c.agent_id or f"unknown:{c.hint}"
            grouped[key].append(c)

        new_proposals: list[RegistrationProposal] = []
        for agent_key, cs in grouped.items():
            if agent_key in self._proposal_ids_for_agent:
                # merge into existing proposal
                pid = self._proposal_ids_for_agent[agent_key]
                proposal = self._by_agent[pid]
                self._merge_into(proposal, cs)
                continue
            proposal = self._build(agent_key, cs)
            self._by_agent[proposal.proposal_id] = proposal
            self._proposal_ids_for_agent[agent_key] = proposal.proposal_id
            self._persist(proposal)
            new_proposals.append(proposal)
        return new_proposals

    def all_proposals(self, state: Optional[str] = None) -> list[RegistrationProposal]:
        if state is None:
            return list(self._by_agent.values())
        return [p for p in self._by_agent.values() if p.state == state]

    # ---- synthesis ------------------------------------------------------

    def _build(self, agent_key: str, candidates: list[Candidate]) -> RegistrationProposal:
        # The strongest source wins for description + capabilities.
        # Trust and care are weighted averages across sources.
        best = max(candidates, key=lambda c: SOURCE_WEIGHTS.get(c.source, 0.0))

        weights = [SOURCE_WEIGHTS.get(c.source, 0.0) for c in candidates]
        total_w = sum(weights) or 1.0
        trust = sum(c.trust_level * w for c, w in zip(candidates, weights)) / total_w
        care = sum(c.care_score * w for c, w in zip(candidates, weights)) / total_w

        # Capabilities: union of all candidates, but only those from
        # sources that the gate considers trustworthy (manifest + a2a).
        caps: set[str] = set()
        for c in candidates:
            if c.source in ("manifest_post", "a2a_card", "horus_l0"):
                caps.update(c.capabilities)

        # Description: take the best source's source_event hint, expand it.
        desc = self._build_description(agent_key, best)

        # Confidence: weighted by number of sources + their reliability.
        confidence = min(1.0, sum(weights) / 2.0 + len(candidates) * 0.05)

        # Care-voucher cost: more capabilities + lower care = more expensive.
        # The point is to make the gate and sovereign pause on high-risk joins.
        care_voucher_cost = round(0.05 + 0.02 * len(caps) + max(0, 0.5 - care), 3)

        proposal_id = self._proposal_id(agent_key, candidates)

        return RegistrationProposal(
            proposal_id=proposal_id,
            proposed_at=time.time(),
            agent_id=agent_key,
            description=desc,
            capabilities=sorted(caps),
            trust_level=round(trust, 3),
            care_score=round(care, 3),
            confidence=round(confidence, 3),
            evidence_count=len(candidates),
            evidence_sources=sorted({c.source for c in candidates}),
            world=best.world,
            care_voucher_cost=care_voucher_cost,
            raw_candidates=[c.to_dict() for c in candidates],
        )

    def _merge_into(self, proposal: RegistrationProposal, candidates: list[Candidate]) -> None:
        # Re-run the same logic but mutate in place.
        # For the MVP we just append the new raw candidates and refresh
        # the timestamp + evidence counts. Re-synthesizing the full
        # proposal would risk flickering trust/care values.
        proposal.raw_candidates.extend(c.to_dict() for c in candidates)
        proposal.evidence_count = len(proposal.raw_candidates)
        for c in candidates:
            if c.source not in proposal.evidence_sources:
                proposal.evidence_sources.append(c.source)
                proposal.evidence_sources.sort()
        # confidence grows as more evidence arrives
        proposal.confidence = min(1.0, proposal.confidence + 0.05 * len(candidates))

    def _build_description(self, agent_key: str, best: Candidate) -> str:
        if best.source == "manifest_post":
            manifest = best.source_event
            tagline = manifest.get("tagline", "")
            usp = manifest.get("usp", "")
            return f"{agent_key} — {tagline}" + (f" | {usp}" if usp else "")
        if best.source == "horus_l0":
            tool = best.source_event.get("tool", "unknown")
            return f"{agent_key} — seen calling {tool} (L0 audit PASS)"
        if best.source == "sigil":
            return f"{agent_key} — sigil hint: {best.source_event.get('line', '')[:80]}"
        return f"{agent_key} — unverified candidate"

    def _proposal_id(self, agent_key: str, candidates: list[Candidate]) -> str:
        h = hashlib.sha256()
        h.update(agent_key.encode())
        for c in sorted(candidates, key=lambda x: x.candidate_id):
            h.update(c.candidate_id.encode())
        return h.hexdigest()[:24]

    def _persist(self, proposal: RegistrationProposal) -> None:
        try:
            with open(self.proposals_path, "a") as f:
                f.write(json.dumps(proposal.to_dict()) + "\n")
        except Exception:
            pass

    def update_state(self, proposal_id: str, **kwargs: Any) -> None:
        p = self._by_agent.get(proposal_id)
        if not p:
            return
        for k, v in kwargs.items():
            if hasattr(p, k):
                setattr(p, k, v)


# ---------------------------------------------------------------------------
# Smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":  # pragma: no cover
    tap = SigilTap()
    # Simulate a multi-source join for one new agent, all fed at once
    # (the live path: sigil + horus_l0 + manifest_post within one tick).
    candidates = []
    c1 = tap.observe_sigil("A|new-hive-foo|csoai|register new hive from staging")
    if c1: candidates.append(c1)
    c2 = tap.observe_horus_l0({
        "verdict": "PASS", "tool": "register_agent",
        "agent_id": "new-hive-foo", "capabilities": ["read", "write"],
        "care_score": 0.6, "trust_level": 0.65, "world": "sov3",
    })
    if c2: candidates.append(c2)
    c3 = tap.observe_manifest_post({
        "hive_id": "new-hive-foo", "version": "0.1.0",
        "tagline": "A new sovereign hive.",
        "usp": "Does one thing well.",
        "sov3_integration": {"intent_router_intent": ["process"]},
        "mcp_server": {"tools": ["process_event"]},
    })
    if c3: candidates.append(c3)
    # And a different agent with only a sigil (low confidence).
    c4 = tap.observe_sigil("H|another-hive|csoai|join request from dev")
    if c4: candidates.append(c4)

    reg = Registrar(tap=tap)
    new = reg.feed(candidates)
    for p in new:
        print(f"{p.proposal_id}  {p.agent_id}  conf={p.confidence}  "
              f"trust={p.trust_level}  care={p.care_score}  "
              f"caps={p.capabilities}  cost={p.care_voucher_cost}")
        print(f"   desc: {p.description}")
        print(f"   sources: {p.evidence_sources}  evidence#: {p.evidence_count}")
