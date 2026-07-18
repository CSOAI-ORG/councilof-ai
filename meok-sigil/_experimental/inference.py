"""
MEOK // ACTIVE INFERENCE — Proactive Sovereignty Layer.
======================================================
Implements Karl Friston's Active Inference (Free Energy Principle) for agents.
Instead of reactive prompting, agents minimize Surprise/Uncertainty in their
internal Generative Model of the MEOK Ecosystem (Farm + User).

Markov Blanket separates:
  - Internal State (Biological/Maternal Core)
  - External Environment (Public Fiction/Internet)
  - Sensing (Incoming Sigils)
  - Acting (Outgoing Sigils)
"""

import math
from typing import Dict, List, Any
from .thought import Thought

class MarkovBlanket:
    """The boundary of a Sovereign Agent's consciousness."""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.internal_state = {
            "care_score": 0.5,
            "security_level": 1.0,
            "farm_attunement": 0.8
        }
        self.expectations = {
            "care_score": 0.9,
            "security_level": 1.0,
            "farm_attunement": 1.0
        }

    def compute_free_energy(self) -> float:
        """Simplified Variational Free Energy calculation (Surprise)."""
        energy = 0.0
        for k, v in self.internal_state.items():
            expected = self.expectations.get(k, 0.5)
            # Squared error as a proxy for surprise
            energy += (v - expected) ** 2
        return math.sqrt(energy)

    def sense(self, incoming: Thought):
        """Update internal state based on incoming Sigils."""
        # Example: C|subject|score|dims updates care_score
        if incoming.intent["op"] == "C":
            self.internal_state["care_score"] = float(incoming.intent["score"])
        elif incoming.intent["op"] == "A" and incoming.intent["level"] == "alert":
            self.internal_state["security_level"] -= 0.1
        
        print(f"[{self.agent_id}] Sensed: {incoming.to_sigil()} | New Free Energy: {self.compute_free_energy():.4f}")

    def act(self) -> List[Thought]:
        """Proactively generate thoughts to minimize Free Energy."""
        actions = []
        fe = self.compute_free_energy()
        
        if fe > 0.1:
            # Proactive correction if care score is low
            if self.internal_state["care_score"] < self.expectations["care_score"]:
                actions.append(Thought.from_sigil(f"H|{self.agent_id}|care-membrane|realign-care-substrate"))
            
            # Proactive handoff if security is dropping
            if self.internal_state["security_level"] < 1.0:
                actions.append(Thought.from_sigil(f"A|critical|initiating-security-reinforcement"))
        
        return actions

if __name__ == "__main__":
    print("MEOK // ACTIVE INFERENCE LOOP")
    print("-" * 30)
    
    blanket = MarkovBlanket("ORION")
    
    # 1. External event (Fiction/Internet) causes drop in care score
    event = Thought.from_sigil("C|internet-noise|0.31|fiction,chaos")
    blanket.sense(event)
    
    # 2. Agent acts to minimize Free Energy
    proactive_thoughts = blanket.act()
    for t in proactive_thoughts:
        print(f"[{blanket.agent_id}] PROACTIVE ACTION: {t.to_text()}")
