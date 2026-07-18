#!/usr/bin/env python3
"""
MEOK AI LABS — Speciation Engine
Agent mutation and hybridization. New agent species emerge
from combining existing domains. Darwinian selection.
From Kimi Gap #20: Offspring Protocol.
"""

import json
import logging
import random
import time
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple

log = logging.getLogger("speciation")

SPECIES_DIR = Path(__file__).parent / "data" / "species"
SPECIES_DIR.mkdir(parents=True, exist_ok=True)

# Base agent domains (the 47 original species)
BASE_DOMAINS = [
    "safety_validator", "code_generator", "researcher", "auditor",
    "diamond_miner", "storyteller", "conscience", "empathy",
    "growth", "security", "knowledge", "beauty",
    "mortality", "chrono", "curiosity", "synthesis",
]

# Mutation vectors — new specializations that can emerge
MUTATION_VECTORS = {
    "safety_validator": [
        "safety_visual", "safety_predictive", "safety_emotional", "safety_gossip",
    ],
    "researcher": [
        "researcher_arxiv", "researcher_patent", "researcher_regulatory", "researcher_competitor",
    ],
    "code_generator": [
        "coder_security", "coder_performance", "coder_test", "coder_refactor",
    ],
    "storyteller": [
        "storyteller_technical", "storyteller_marketing", "storyteller_incident",
    ],
}

# Hybridization pairs — two species merge into something new
HYBRID_COMBINATIONS = {
    ("safety_validator", "storyteller"): "safety_narrative_agent",
    ("researcher", "curiosity"): "active_learner",
    ("code_generator", "auditor"): "code_guardian",
    ("empathy", "growth"): "customer_advocate",
    ("conscience", "security"): "ethical_hacker",
    ("diamond_miner", "synthesis"): "insight_miner",
    ("chrono", "mortality"): "legacy_planner",
    ("knowledge", "beauty"): "documentation_artist",
}


class Species:
    """A species of agent with traits and lineage."""

    def __init__(self, name: str, parent_a: str, parent_b: str = "",
                 generation: int = 0, traits: List[str] = None):
        self.species_id = f"sp_{uuid.uuid4().hex[:8]}"
        self.name = name
        self.parent_a = parent_a
        self.parent_b = parent_b
        self.generation = generation
        self.traits = traits or []
        self.born_at = datetime.now().isoformat()
        self.fitness = 0.5  # Neutral start
        self.alive = True
        self.task_count = 0
        self.success_rate = 0.0

    def to_dict(self) -> Dict:
        return {
            "species_id": self.species_id,
            "name": self.name,
            "parent_a": self.parent_a,
            "parent_b": self.parent_b,
            "generation": self.generation,
            "traits": self.traits,
            "born_at": self.born_at,
            "fitness": self.fitness,
            "alive": self.alive,
            "task_count": self.task_count,
            "success_rate": self.success_rate,
        }


class SpeciationEngine:
    """Creates new agent species through mutation and hybridization."""

    def __init__(self):
        self.species: Dict[str, Species] = {}
        self._load_species()

    def _load_species(self):
        for path in SPECIES_DIR.glob("*.json"):
            try:
                with open(path) as f:
                    data = json.load(f)
                sp = Species(data["name"], data["parent_a"], data.get("parent_b", ""))
                sp.species_id = data["species_id"]
                sp.generation = data.get("generation", 0)
                sp.fitness = data.get("fitness", 0.5)
                sp.alive = data.get("alive", True)
                self.species[sp.species_id] = sp
            except Exception:
                pass

    def _persist(self, sp: Species):
        path = SPECIES_DIR / f"{sp.species_id}.json"
        with open(path, "w") as f:
            json.dump(sp.to_dict(), f, indent=2)

    def mutate(self, base_domain: str) -> Optional[Species]:
        """Create a mutant variant of an existing domain."""
        vectors = MUTATION_VECTORS.get(base_domain, [])
        if not vectors:
            log.info(f"No mutation vectors for {base_domain}")
            return None

        variant = random.choice(vectors)
        sp = Species(
            name=variant,
            parent_a=base_domain,
            generation=1,
            traits=[base_domain, "mutant", variant.split("_")[-1]],
        )
        self.species[sp.species_id] = sp
        self._persist(sp)
        log.info(f"🧬 MUTATION: {base_domain} → {variant} (gen {sp.generation})")
        return sp

    def hybridize(self, species_a: str, species_b: str) -> Optional[Species]:
        """Cross-breed two species into a hybrid."""
        key = (species_a, species_b)
        reverse_key = (species_b, species_a)

        hybrid_name = HYBRID_COMBINATIONS.get(key) or HYBRID_COMBINATIONS.get(reverse_key)
        if not hybrid_name:
            hybrid_name = f"{species_a}_{species_b}_hybrid"

        sp = Species(
            name=hybrid_name,
            parent_a=species_a,
            parent_b=species_b,
            generation=1,
            traits=[species_a, species_b, "hybrid"],
        )
        self.species[sp.species_id] = sp
        self._persist(sp)
        log.info(f"🧬 HYBRID: {species_a} × {species_b} → {hybrid_name}")
        return sp

    def natural_selection(self, survival_threshold: float = 0.3) -> List[str]:
        """Kill unfit species. Returns list of extinct species."""
        extinct = []
        for sp in list(self.species.values()):
            if sp.alive and sp.fitness < survival_threshold and sp.task_count > 10:
                sp.alive = False
                self._persist(sp)
                extinct.append(sp.name)
                log.info(f"💀 EXTINCT: {sp.name} (fitness {sp.fitness:.2f})")
        return extinct

    def record_task_result(self, species_id: str, success: bool):
        """Update fitness based on task outcome."""
        sp = self.species.get(species_id)
        if sp:
            sp.task_count += 1
            sp.success_rate = (
                sp.success_rate * (sp.task_count - 1) + (1.0 if success else 0.0)
            ) / sp.task_count
            sp.fitness = sp.success_rate * 0.7 + 0.3  # Floor of 0.3
            self._persist(sp)

    def evolve_cycle(self) -> Dict:
        """Run one evolution cycle: mutate + hybridize + select."""
        log.info("🧬 Evolution cycle starting...")

        # 1. Random mutations (1% of base domains)
        mutations = []
        for domain in BASE_DOMAINS:
            if random.random() < 0.1:  # 10% chance per domain per cycle
                sp = self.mutate(domain)
                if sp:
                    mutations.append(sp.name)

        # 2. Random hybridizations
        hybrids = []
        if len(BASE_DOMAINS) >= 2:
            a, b = random.sample(BASE_DOMAINS, 2)
            sp = self.hybridize(a, b)
            if sp:
                hybrids.append(sp.name)

        # 3. Natural selection
        extinct = self.natural_selection()

        return {
            "mutations": mutations,
            "hybrids": hybrids,
            "extinct": extinct,
            "total_species": len(self.species),
            "alive": sum(1 for s in self.species.values() if s.alive),
            "timestamp": datetime.now().isoformat(),
        }

    def get_stats(self) -> Dict:
        alive = [s for s in self.species.values() if s.alive]
        return {
            "total_species": len(self.species),
            "alive": len(alive),
            "extinct": len(self.species) - len(alive),
            "avg_fitness": sum(s.fitness for s in alive) / max(len(alive), 1),
            "top_species": sorted(alive, key=lambda s: -s.fitness)[:5],
        }


engine = SpeciationEngine()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")

    # Run evolution cycle
    result = engine.evolve_cycle()
    print(f"\nEvolution: {json.dumps(result, indent=2)}")

    # Another cycle
    result2 = engine.evolve_cycle()
    print(f"\nEvolution 2: {json.dumps(result2, indent=2)}")

    print(f"\nStats: {json.dumps(engine.get_stats(), indent=2, default=str)}")
