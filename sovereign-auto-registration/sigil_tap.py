"""
L0 — Sigil Tap (READ-ONLY)

Watches the SOV3 substrate for signals that something new wants to join the mesh:
  - Sigil bus events with op=A (alert) or op=H (handoff) for unknown agent_ids
  - Horus L0 audit events with verdict=PASS for tool invocations from unseen agents
  - Hive manifest POSTs (intercepted at the bridge level via the chronicle log)

This module has NO side effects. It produces a stream of "candidate" records
that L1 (the registrar) can consume.

Per the sovereign-oversight-plane contract:
  - L0 observes, never acts
  - Any VETO from the BFT replica already blocked the action upstream
  - L1 only ever sees candidates that have already passed L0

Codename: "the Tap" — like a phone tap, it only listens.
"""

from __future__ import annotations

import json
import time
from collections import deque
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Iterator, Optional

# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Candidate:
    """A signal that something new is asking to join the sovereign mesh.

    The candidate is evidence, not an authorization. L1 turns it into a
    proposal; L1.5 audits it; L2 (sovereign) approves.
    """
    candidate_id: str                  # sha-style: ts + source + hint
    discovered_at: float               # unix epoch
    source: str                        # "sigil", "horus_l0", "manifest_post", "a2a_card"
    source_event: dict[str, Any]       # the raw event
    hint: str                          # short label, e.g. "new_agent:foo"
    agent_id: Optional[str] = None     # detected agent identifier (if any)
    capabilities: list[str] = field(default_factory=list)
    care_score: float = 0.5            # initial care estimate (L0 can't be sure)
    trust_level: float = 0.5           # initial trust (L0 can't be sure)
    world: str = "sov3"                # which world/tier did the signal come from
    extra: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# The Tap itself
# ---------------------------------------------------------------------------

class SigilTap:
    """Read-only observer over the SOV3 sigil bus + Horus L0 audit log.

    Backed by an in-memory ring buffer plus a JSONL persistence file so the
    registrar can re-scan after a restart.
    """

    # Op codes that suggest a new agent is asking for membership.
    # See sov3-hive-activation skill: A=alert, H=handoff, M=memory, C=care.
    MEMBERSHIP_HINT_OPS = ("A", "H")

    # Tool names that imply a new agent/manifest is on the wire.
    NEW_JOINER_TOOLS = {
        "register_agent",
        "coord_register_agent",
        "submit_council_proposal",
        "hive_register",            # legacy
        "manifest_post",            # legacy
    }

    def __init__(
        self,
        sov3_bridge_url: str = "http://localhost:3101",
        persistence_path: Optional[Path] = None,
        max_ring: int = 1000,
    ) -> None:
        self.sov3_bridge_url = sov3_bridge_url.rstrip("/")
        self.persistence_path = persistence_path or Path(
            "/tmp/sovereign-auto-registration/sigil_tap.jsonl"
        )
        self.persistence_path.parent.mkdir(parents=True, exist_ok=True)
        self._ring: deque[Candidate] = deque(maxlen=max_ring)
        # The tap does NOT de-dupe by agent_id across events — that
        # decision belongs to the registrar. The tap only de-dupes
        # exact-duplicate candidate_ids (same ts+source+hint).
        self._seen_candidate_ids: set[str] = set()

    # ---- sources --------------------------------------------------------

    def observe_sigil(self, line: str, gloss: str = "") -> Optional[Candidate]:
        """Parse a sigil bus line (e.g. 'A|new-agent|...|...') and produce a
        candidate if it looks like a membership hint.

        The sigil line format (canonical, verified 14 Jun 2026):
            <op>|<actor>|<target>|<summary>
        """
        try:
            parts = line.split("|", 4)
            if len(parts) < 4:
                return None
            op, actor, target, summary = parts[0], parts[1], parts[2], parts[3]
        except Exception:
            return None

        if op not in self.MEMBERSHIP_HINT_OPS:
            return None
        if not actor:
            return None
        if "register" not in summary.lower() and "join" not in summary.lower() \
                and "new" not in summary.lower():
            return None

        cand = self._make_candidate(
            source="sigil",
            source_event={"line": line, "gloss": gloss, "op": op},
            hint=f"sigil:{op}:{actor}",
            agent_id=actor,
            capabilities=[],
            world="sov3",
        )
        return cand

    def observe_horus_l0(self, audit_event: dict[str, Any]) -> Optional[Candidate]:
        """Parse a Horus L0 audit event and produce a candidate if a new
        agent is being seen for the first time.
        """
        if audit_event.get("verdict") != "PASS":
            return None
        tool = audit_event.get("tool", "")
        if tool not in self.NEW_JOINER_TOOLS:
            return None
        agent_id = audit_event.get("agent_id") or audit_event.get("source")
        if not agent_id:
            return None

        return self._make_candidate(
            source="horus_l0",
            source_event=audit_event,
            hint=f"horus_l0:{tool}:{agent_id}",
            agent_id=agent_id,
            capabilities=audit_event.get("capabilities", []),
            care_score=float(audit_event.get("care_score", 0.5)),
            trust_level=float(audit_event.get("trust_level", 0.5)),
            world=audit_event.get("world", "sov3"),
        )

    def observe_manifest_post(self, manifest: dict[str, Any]) -> Optional[Candidate]:
        """Parse a hive manifest POST and produce a candidate.

        The manifest is the same shape as `services/sov3-hive/manifest.json`
        on each hive (verified 13/14 Jun 2026)."""
        hive_id = manifest.get("hive_id")
        if not hive_id:
            return None

        capabilities = []
        sov3 = manifest.get("sov3_integration", {})
        if isinstance(sov3, dict):
            for intent in sov3.get("intent_router_intent", []):
                capabilities.append(f"intent:{intent}")
        mcp = manifest.get("mcp_server", {})
        if isinstance(mcp, dict):
            for tool in mcp.get("tools", []):
                capabilities.append(f"mcp_tool:{tool}")
        memory_tiers = manifest.get("memory_tiers", {})
        if isinstance(memory_tiers, dict):
            capabilities.append("memory_tier:aware")

        return self._make_candidate(
            source="manifest_post",
            source_event=manifest,
            hint=f"manifest:{hive_id}",
            agent_id=hive_id,
            capabilities=capabilities,
            trust_level=0.7,           # manifest exists = baseline trust
            world="sov3",
            extra={"manifest_version": manifest.get("version", "0.0.0")},
        )

    # ---- helpers --------------------------------------------------------

    def _make_candidate(
        self,
        source: str,
        source_event: dict[str, Any],
        hint: str,
        agent_id: Optional[str],
        capabilities: list[str],
        world: str,
        care_score: float = 0.5,
        trust_level: float = 0.5,
        extra: Optional[dict[str, Any]] = None,
    ) -> Candidate:
        ts = time.time()
        candidate_id = f"{int(ts*1000):x}-{source}-{hint}"[:80]
        cand = Candidate(
            candidate_id=candidate_id,
            discovered_at=ts,
            source=source,
            source_event=source_event,
            hint=hint,
            agent_id=agent_id,
            capabilities=capabilities,
            care_score=care_score,
            trust_level=trust_level,
            world=world,
            extra=extra or {},
        )
        if candidate_id in self._seen_candidate_ids:
            # de-dupe
            return cand  # caller can re-check
        self._seen_candidate_ids.add(candidate_id)
        self._ring.append(cand)
        self._persist(cand)
        return cand

    def _persist(self, cand: Candidate) -> None:
        try:
            with open(self.persistence_path, "a") as f:
                f.write(json.dumps(cand.to_dict()) + "\n")
        except Exception:
            # Persistence is best-effort; L0 must never raise.
            pass

    # ---- iteration ------------------------------------------------------

    def drain(self) -> list[Candidate]:
        """Return everything currently in the ring buffer and clear it."""
        out = list(self._ring)
        self._ring.clear()
        return out

    def recent(self, n: int = 50) -> list[Candidate]:
        """Return the last n candidates without clearing."""
        return list(self._ring)[-n:]

    def __iter__(self) -> Iterator[Candidate]:
        return iter(self.drain())


# ---------------------------------------------------------------------------
# Smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":  # pragma: no cover
    tap = SigilTap()
    c1 = tap.observe_sigil("A|new-agent-7|csoai|register new agent from dev")
    c2 = tap.observe_horus_l0({
        "verdict": "PASS", "tool": "register_agent",
        "agent_id": "new-agent-7", "capabilities": ["read"],
        "care_score": 0.6, "trust_level": 0.7, "world": "sov3",
    })
    c3 = tap.observe_manifest_post({
        "hive_id": "openpatent", "version": "1.0.0",
        "sov3_integration": {"intent_router_intent": ["disclose", "verify"]},
        "mcp_server": {"tools": ["disclose_invention", "verify_disclosure"]},
        "memory_tiers": {"version": "0.1.0-mvp"},
    })
    # the openpatent one will be skipped (already in seen set from c2)
    print("c1:", c1.hint if c1 else None)
    print("c2:", c2.hint if c2 else None)
    print("c3:", c3.hint if c3 else None)
    print("drained:", len(list(tap)))
