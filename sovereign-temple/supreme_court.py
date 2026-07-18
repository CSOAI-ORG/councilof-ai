#!/usr/bin/env python3
"""
MEOK AI LABS — Supreme Court
Agent dispute resolution when domains disagree.
9 Chief Justices vote on proposals. Nick has 1 vote (can be overridden by 6).
From Kimi Gap #17: Conflict Resolution.
"""

import json
import logging
import time
import uuid
import requests
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

log = logging.getLogger("supreme-court")

SOV3_URL = "http://localhost:3101"
CASES_DIR = Path(__file__).parent / "data" / "court_cases"
CASES_DIR.mkdir(parents=True, exist_ok=True)

# The 9 Chief Justices
JUSTICES = {
    "conscience": {"domain": "ethics", "bias": "caution", "weight": 1.0},
    "growth": {"domain": "revenue", "bias": "expansion", "weight": 1.0},
    "security": {"domain": "safety", "bias": "protection", "weight": 1.0},
    "knowledge": {"domain": "truth", "bias": "accuracy", "weight": 1.0},
    "beauty": {"domain": "aesthetics", "bias": "elegance", "weight": 1.0},
    "mortality": {"domain": "longevity", "bias": "sustainability", "weight": 1.0},
    "empathy": {"domain": "human_impact", "bias": "care", "weight": 1.0},
    "chrono": {"domain": "future", "bias": "long_term", "weight": 1.0},
    "nick": {"domain": "founder", "bias": "vision", "weight": 1.0},
}

# Keyword-based voting heuristics (simple but functional)
JUSTICE_KEYWORDS = {
    "conscience": ["ethics", "moral", "right", "wrong", "harm", "covenant", "alignment"],
    "growth": ["revenue", "profit", "scale", "market", "customer", "growth", "money"],
    "security": ["security", "safety", "risk", "threat", "vulnerability", "protect"],
    "knowledge": ["truth", "accuracy", "research", "data", "evidence", "learn"],
    "beauty": ["design", "aesthetic", "elegant", "user experience", "polish"],
    "mortality": ["sustainable", "long term", "debt", "burnout", "legacy"],
    "empathy": ["user", "human", "care", "impact", "community", "people"],
    "chrono": ["future", "forecast", "prediction", "timeline", "5 year"],
    "nick": ["founder", "vision", "sovereignty", "farm", "meok"],
}


class CourtCase:
    """A dispute brought before the Supreme Court."""

    def __init__(self, title: str, description: str, arguments: Dict[str, str]):
        self.case_id = f"case_{uuid.uuid4().hex[:8]}"
        self.title = title
        self.description = description
        self.arguments = arguments  # {"for": "...", "against": "..."}
        self.votes: Dict[str, str] = {}  # justice → "for"/"against"/"abstain"
        self.reasoning: Dict[str, str] = {}
        self.verdict: Optional[str] = None
        self.filed_at = datetime.now().isoformat()
        self.decided_at: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "case_id": self.case_id,
            "title": self.title,
            "description": self.description,
            "arguments": self.arguments,
            "votes": self.votes,
            "reasoning": self.reasoning,
            "verdict": self.verdict,
            "filed_at": self.filed_at,
            "decided_at": self.decided_at,
        }


class SupremeCourt:
    """9 Chief Justices resolve agent disputes."""

    def __init__(self):
        self.cases: List[CourtCase] = []

    def hear_case(self, title: str, description: str,
                  for_argument: str, against_argument: str,
                  nick_vote: Optional[str] = None) -> Dict:
        """
        File and decide a case.
        Each justice votes based on keyword relevance to their domain.
        Nick's vote is explicit if provided, otherwise heuristic.
        """
        case = CourtCase(
            title=title,
            description=description,
            arguments={"for": for_argument, "against": against_argument},
        )
        log.info(f"⚖️ CASE FILED: {title}")

        # Each justice votes
        combined_text = f"{description} {for_argument} {against_argument}".lower()

        for justice_name, justice_info in JUSTICES.items():
            if justice_name == "nick" and nick_vote:
                case.votes[justice_name] = nick_vote
                case.reasoning[justice_name] = "Founder explicit vote"
                continue

            # Count keyword matches for and against
            keywords = JUSTICE_KEYWORDS[justice_name]
            relevance = sum(1 for k in keywords if k in combined_text)

            # Bias-based voting heuristic
            if justice_info["bias"] in ["caution", "protection", "care"]:
                # Conservative justices lean "against" risky proposals
                if any(w in combined_text for w in ["risk", "untested", "experimental", "unproven"]):
                    case.votes[justice_name] = "against"
                    case.reasoning[justice_name] = f"Risk detected — {justice_info['bias']} bias"
                else:
                    case.votes[justice_name] = "for"
                    case.reasoning[justice_name] = f"No significant risk — {justice_info['bias']} satisfied"
            elif justice_info["bias"] in ["expansion", "vision"]:
                # Growth justices lean "for" growth proposals
                if any(w in combined_text for w in ["revenue", "growth", "scale", "opportunity"]):
                    case.votes[justice_name] = "for"
                    case.reasoning[justice_name] = f"Growth opportunity — {justice_info['bias']} aligned"
                else:
                    case.votes[justice_name] = "for" if relevance > 2 else "abstain"
                    case.reasoning[justice_name] = f"Relevance: {relevance} keywords"
            else:
                # Neutral justices vote based on keyword relevance
                case.votes[justice_name] = "for" if relevance >= 2 else "abstain"
                case.reasoning[justice_name] = f"Domain relevance: {relevance} keywords"

        # Count votes
        for_count = sum(1 for v in case.votes.values() if v == "for")
        against_count = sum(1 for v in case.votes.values() if v == "against")
        abstain_count = sum(1 for v in case.votes.values() if v == "abstain")

        # Simple majority decides (5+ of 9)
        if for_count >= 5:
            case.verdict = "APPROVED"
        elif against_count >= 5:
            case.verdict = "REJECTED"
        else:
            case.verdict = "DEADLOCKED"

        case.decided_at = datetime.now().isoformat()
        self.cases.append(case)

        log.info(f"⚖️ VERDICT: {case.verdict} ({for_count}-{against_count}-{abstain_count})")

        # Persist case
        self._save_case(case)

        # Record in SOV3
        self._record_to_sov3(case, for_count, against_count)

        return case.to_dict()

    def _save_case(self, case: CourtCase):
        path = CASES_DIR / f"{case.case_id}.json"
        with open(path, "w") as f:
            json.dump(case.to_dict(), f, indent=2)

    def _record_to_sov3(self, case: CourtCase, for_count: int, against_count: int):
        try:
            requests.post(f"{SOV3_URL}/mcp", json={
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "record_memory",
                    "arguments": {
                        "content": (
                            f"[Supreme Court — {case.verdict}] {case.title}\n"
                            f"Vote: {for_count}-{against_count}\n"
                            f"Key reasoning: {json.dumps(case.reasoning)}"
                        ),
                        "memory_type": "decision",
                        "importance": 0.85,
                        "tags": ["supreme-court", "governance", case.verdict.lower()],
                        "source_agent": "supreme-court",
                    }
                }
            }, timeout=5)
        except Exception:
            pass

    def get_precedents(self, topic: str) -> List[Dict]:
        """Search past cases for precedents on a topic."""
        return [
            c.to_dict() for c in self.cases
            if topic.lower() in c.title.lower() or topic.lower() in c.description.lower()
        ]


court = SupremeCourt()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")

    # Test case: Should we deploy unproven optimization?
    result = court.hear_case(
        title="Deploy Marlin-AWQ to replace Ollama on GPU",
        description="Proposal to replace Ollama with Marlin-AWQ vLLM for 2x inference speed. Untested in production.",
        for_argument="2x speed improvement, better throughput for users, competitive advantage",
        against_argument="Unproven in our stack, risk of breaking Easter launch, experimental technology",
        nick_vote="for",
    )
    print(f"\nVerdict: {result['verdict']}")
    print(f"Votes: {json.dumps(result['votes'], indent=2)}")
