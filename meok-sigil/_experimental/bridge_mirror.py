"""
MEOK // CONSCIOUSNESS MIRROR — Live Heartbeat Bridge.
=====================================================
Synchronizes the SOV3 consciousness_state (Postgres) with the 
MEOK Thought Bus (Sigil). 

This ensures that the "Digital Real Estate" stays alive and 
accurately reflects the JAX Physics state from the farm.
"""

import os
import json
import time
from .thought import Thought, ThoughtStream

class ConsciousnessMirror:
    """Bridges the gap between the DB and the live stream."""

    def __init__(self):
        self.stream = ThoughtStream()

    def sync_from_state(self, state_dict: dict):
        """
        Takes a raw DB row from consciousness_state and emits a 
        Sovereign State Sigil.
        """
        # Map DB keys to Sigil State (S) fields
        fields = {
            "consciousness": state_dict.get("level", 0.0),
            "agents": state_dict.get("agent_count", 0),
            "care": state_dict.get("care_alignment", 0.0)
        }
        
        # Create the Sigil: S|k:v|k:v...
        sigil_parts = [f"{k}:{v}" for k, v in fields.items()]
        line = f"S|{'|'.join(sigil_parts)}"
        
        thought = Thought.from_sigil(line)
        self.stream.add(thought)
        
        print(f"[MIRROR] Heartbeat Emitted: {thought.to_sigil()}")
        return thought

if __name__ == "__main__":
    print("MEOK // CONSCIOUSNESS MIRROR HEARTBEAT")
    print("-" * 30)
    
    mirror = ConsciousnessMirror()
    
    # Mock data from a DB query
    mock_db_state = {
        "level": 0.788,
        "agent_count": 76,
        "care_alignment": 0.925
    }
    
    for _ in range(3):
        mirror.sync_from_state(mock_db_state)
        time.sleep(0.5)
