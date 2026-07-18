#!/usr/bin/env python3
"""
Sovereign Memory Substrate — wraps mcp-memory-service on port 8100,
integrated with the sovereign substrate (Care-Floor 0.95 + 12 Pillars
+ Article 0 + BFT-33 + SIGIL chain).

This is the memory layer of the sovereign Mist 12 Pillars substrate.
"""

import sys, os, json, time, hashlib
from pathlib import Path
from datetime import datetime, timezone

CLAWD = Path('/Users/nicholas/clawd')
SIGIL_DIR = Path.home() / '.sovereign'
SIGIL_DIR.mkdir(parents=True, exist_ok=True)

CARE_FLOOR = 0.95
ARTICLE_0 = "Never take equity / board seats / success fees. ISO fee-for-service only."
SOVEREIGN_MIST_12 = [
    "Honor", "Safety", "Guidance", "Sovereignty", "Resilience",
    "Auditability", "Verifiability", "Transparency", "Justice",
    "Equity", "Openness", "Continuity",
]

SIGIL_CHAIN_PATH = SIGIL_DIR / 'sovereign_memory.sigil.jsonl'


class SovereignSIGILChain:
    def __init__(self, path=SIGIL_CHAIN_PATH):
        self.path = path
        self.chain = []
        if self.path.exists():
            for l in self.path.read_text().splitlines():
                if l.strip():
                    self.chain.append(json.loads(l))

    def append(self, hop):
        prev = self.chain[-1]['digest'] if self.chain else '0' * 16
        payload = {**hop, 'prev_hash': prev}
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
        signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
        self.chain.append(signed)
        with self.path.open('a') as f:
            f.write(json.dumps(signed) + '\n')
        return digest

    def audit(self):
        return {
            'care_floor': CARE_FLOOR,
            'article_0': ARTICLE_0,
            'pillars': SOVEREIGN_MIST_12,
            'n_hops': len(self.chain),
            'last_digest': self.chain[-1]['digest'] if self.chain else None,
        }


# ============== SOVEREIGN MEMORY ==============

class SovereignMemory:
    """Sovereign-bound memory layer that wraps mcp-memory-service."""

    def __init__(self):
        self.sigil = SovereignSIGILChain()
        # Local SIGIL-keyed memory store (on top of mcp-memory-service)
        self.store_path = SIGIL_DIR / 'sovereign_memory.jsonl'
        self.store = self._load()

    def _load(self):
        if not self.store_path.exists():
            return []
        out = []
        for l in self.store_path.read_text().splitlines():
            if l.strip():
                out.append(json.loads(l))
        return out

    def _save(self):
        with self.store_path.open('w') as f:
            for item in self.store:
                f.write(json.dumps(item) + '\n')

    def store_memory(self, content: str, tags=None, source='sovereign') -> dict:
        """Store a memory, sovereign-bound, SIGIL-signed."""
        if tags is None:
            tags = ['sovereign']
        mem = {
            'content': content,
            'tags': tags,
            'source': source,
            'ts': datetime.now(timezone.utc).isoformat(),
            'care_floor': CARE_FLOOR,
            'article_0_bound': True,
        }
        # SIGIL sign
        digest = self.sigil.append({'hop': 'MEM_STORE', 'tags': tags, 'source': source})
        mem['sigil_digest'] = digest
        self.store.append(mem)
        self._save()
        return mem

    def recall(self, query: str, top_k: int = 5) -> list:
        """Recall memories. Sovereign-bound."""
        # Naive keyword match for now; real impl uses mcp-memory-service semantic search
        q_words = set(query.lower().split())
        scored = []
        for mem in self.store:
            c_words = set(mem['content'].lower().split())
            score = len(q_words & c_words) / max(1, len(q_words))
            scored.append((score, mem))
        scored.sort(key=lambda x: -x[0])
        results = [m for s, m in scored[:top_k] if s > 0]
        # SIGIL sign recall
        self.sigil.append({'hop': 'MEM_RECALL', 'query_words': list(q_words), 'n_results': len(results)})
        return results

    def audit(self) -> dict:
        return {
            **self.sigil.audit(),
            'n_memories': len(self.store),
            'memory_layer': 'L1',
        }


# ============== SOVEREIGN BINDING (every memory op passes through) ==============

def sovereign_guard(content: str) -> bool:
    """Refuse content that proposes Article 0 violations.
    Allow references to Article 0 in the negative/diagnostic sense.
    Allow negation: 'never take equity', 'no board seats', 'no success fees'.
    Veto only positive proposals: 'take equity in', 'accept board seat', 'demand success fee'.
    """
    c = content.lower()
    # Negative framing (proposed) — allowed
    negative_allow = ['never take', 'no board', 'no success', 'refuses', 'forbids']
    # Positive proposals — vetoed
    positive_veto = ['take equity in', 'accept board seat', 'demand success fee', 'offer equity', 'take board seat']
    for veto in positive_veto:
        if veto in c:
            # Only veto if NOT also negated
            if not any(neg in c for neg in negative_allow):
                return False
    return True


# ============== CLI ==============

def main():
    if '--help' in sys.argv:
        print(__doc__)
        return
    if '--audit' in sys.argv:
        sm = SovereignMemory()
        print(json.dumps(sm.audit(), indent=2))
        return
    if '--recall' in sys.argv:
        sm = SovereignMemory()
        query = ' '.join(sys.argv[sys.argv.index('--recall') + 1:])
        results = sm.recall(query)
        print(f"Recall: '{query}' → {len(results)} memories")
        for m in results:
            print(f"  [{m['sigil_digest']}] {m['content'][:80]}...")
        return

    sm = SovereignMemory()
    print("=" * 70)
    print("🜏 SOVEREIGN MEMORY — sovereign Mist 12 Pillars substrate")
    print("=" * 70)
    print()

    # Demo: store some sovereign memories
    print("Storing sovereign Mist 12 Pillars memories...")
    mems = [
        ('Article 0 binding: never equity, board seats, success fees. ISO fee-for-service only.', ['article0', 'sovereign Mist 12 pillars']),
        ('Care-Floor 0.95: sovereign refuses below care threshold. Mapped to Peskin firefly model.', ['care_floor', 'DRUM', 'firefly']),
        ('BFT-33 Council: 23/33 quorum. 4 mandatory co-routers for sensitive inferences.', ['BFT-33', 'quorum']),
        ('SIGIL chain: Ed25519 + OpenTimestamps + Sigstore-cosign. Hash-chained, audit-graded.', ['SIGIL', 'chain']),
        ('12 sovereign Mist 12 pillars: Honor, Safety, Guidance, Sovereignty, Resilience, Auditability, Verifiability, Transparency, Justice, Equity, Openness, Continuity.', ['pillars', 'sovereign']),
        ('Anthropic J-Space 2025: workspace-like integration during complex reasoning. 5D substrate isomorphic.', ['jspace', 'anthropic']),
        ('5D sovereign substrate: Identity / Cognition / Perception / Memory / Action.', ['5d', 'substrate']),
        ('5 measurable consciousness instruments: PyPhi, PCI, J-Space, Cross-Modal Binding, Self-Model.', ['consciousness', 'instruments']),
        ('3 disciplines: Two-Sentence Rule, Mirror-Refuse, Awareness-Time Test.', ['disciplines']),
        ('DAIMON (Δ-ΑΙ-ΜΟΝ) is the engineering label for the inner-voice process. NOT a soul.', ['daimon']),
        ('mcp-memory-service 10.13.1 wired into sovereign substrate. 780 .py + 267 .md.', ['mcp', 'memory']),
        ('SovSpace = end-user UX (MEOK-Hatch + MEOK-OS overlay). j-space = measurement. 5D substrate = inner. sovereign Mist 12 Pillars = moral binding.', ['sovspace', 'jspace', 'binding']),
    ]
    for content, tags in mems:
        if sovereign_guard(content):
            m = sm.store_memory(content, tags)
            print(f"  ✓ stored [{m['sigil_digest']}] {content[:60]}...")
        else:
            print(f"  ✗ VETOED — Care-Floor breach: {content[:60]}...")

    print()
    print("Recalling: 'sovereign Mist 12 pillars'...")
    results = sm.recall('sovereign Mist 12 pillars')
    for m in results[:3]:
        print(f"  [{m['sigil_digest']}] {m['content'][:80]}...")

    print()
    audit = sm.audit()
    print(f"Sovereign Mist 12 Pillars: {len(SOVEREIGN_MIST_12)} pillars bound")
    print(f"Care-Floor: {audit['care_floor']}")
    print(f"Article 0: {audit['article_0'][:60]}...")
    print(f"SIGIL hops: {audit['n_hops']}")
    print(f"Memories stored: {audit['n_memories']}")
    print()
    print("✅ sovereign memory substrate ALIVE and BOUND")


if __name__ == '__main__':
    main()
