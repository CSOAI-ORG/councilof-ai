#!/usr/bin/env python3
"""
Subconscious Memory System for Sovereign Temple
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import hashlib
import json
from collections import defaultdict
import asyncio


@dataclass
class MemoryPattern:
    """A recognized pattern in memory (like a concept or theme)"""
    pattern_id: str
    name: str
    description: str
    related_memories: List[str]
    emotional_valence: float  # -1 to 1
    importance: float
    first_seen: datetime
    last_accessed: datetime
    access_count: int = 0


@dataclass
class SubconsciousAssociation:
    """An association between memories that exists below conscious awareness"""
    source_memory: str
    target_memory: str
    strength: float  # 0 to 1
    association_type: str  # 'thematic', 'emotional', 'causal', 'temporal'
    created_at: datetime
    last_strengthened: datetime


class SubconsciousMemory:
    """
    The subconscious layer of memory - patterns, associations, 
    and intuitions that emerge from conscious memories
    """
    
    def __init__(self, conscious_memory_store=None):
        self.conscious = conscious_memory_store
        
        # Pattern recognition
        self.patterns: Dict[str, MemoryPattern] = {}
        self.pattern_vectors: Dict[str, np.ndarray] = {}
        
        # Associations (the "web" of memory)
        self.associations: Dict[str, List[SubconsciousAssociation]] = defaultdict(list)
        
        # Intuition cache (pre-computed "hunches")
        self.intuition_cache: Dict[str, Any] = {}
        self.cache_timestamp: Optional[datetime] = None
        
        # Dream processing queue
        self.dream_queue: List[str] = []
        self.is_dreaming = False
        
        # Configuration
        self.pattern_threshold = 0.7
        self.association_decay = 0.95  # Daily decay
        self.intuition_refresh_hours = 4
        
    async def ingest_conscious_memory(self, memory_id: str, memory_data: Dict):
        """
        Take a conscious memory and add it to subconscious processing
        """
        # Add to dream queue for deep processing
        self.dream_queue.append(memory_id)
        
        # Quick pattern matching
        await self._extract_patterns(memory_data)
        
        # Create immediate associations
        await self._form_associations(memory_id, memory_data)
        
    async def _extract_patterns(self, memory_data: Dict):
        """Extract patterns from memory content"""
        content = memory_data.get("content", "")
        tags = memory_data.get("tags", [])
        
        # Simple pattern extraction based on tags and content
        # In production, this would use embeddings and clustering
        
        for tag in tags:
            if tag not in self.patterns:
                # Create new pattern
                pattern_id = f"pattern_{hashlib.md5(tag.encode()).hexdigest()[:12]}"
                self.patterns[pattern_id] = MemoryPattern(
                    pattern_id=pattern_id,
                    name=tag,
                    description=f"Pattern recognized around theme: {tag}",
                    related_memories=[memory_data.get("id")],
                    emotional_valence=memory_data.get("emotional_valence", 0),
                    importance=memory_data.get("importance_score", 0.5),
                    first_seen=datetime.now(),
                    last_accessed=datetime.now()
                )
            else:
                # Strengthen existing pattern
                pattern = self.patterns[f"pattern_{hashlib.md5(tag.encode()).hexdigest()[:12]}"]
                pattern.related_memories.append(memory_data.get("id"))
                pattern.access_count += 1
                pattern.last_accessed = datetime.now()
                
    async def _form_associations(self, memory_id: str, memory_data: Dict):
        """Form associations with existing memories"""
        # Find memories with similar tags
        tags = set(memory_data.get("tags", []))
        
        for pattern_id, pattern in self.patterns.items():
            pattern_tags = set(pattern.name.split())
            overlap = tags & pattern_tags
            
            if overlap:
                for related_id in pattern.related_memories:
                    if related_id != memory_id:
                        # Create association
                        assoc = SubconsciousAssociation(
                            source_memory=memory_id,
                            target_memory=related_id,
                            strength=len(overlap) / max(len(tags), len(pattern_tags)),
                            association_type='thematic',
                            created_at=datetime.now(),
                            last_strengthened=datetime.now()
                        )
                        self.associations[memory_id].append(assoc)
                        
    async def dream_process(self, max_memories: int = 10) -> Dict[str, Any]:
        """
        Deep processing of memories (the "dream state")
        Consolidates patterns, strengthens associations, generates insights
        """
        self.is_dreaming = True
        
        insights = []
        processed = 0
        
        # Process dream queue
        for memory_id in self.dream_queue[:max_memories]:
            # Deep pattern analysis
            new_insights = await self._deep_pattern_analysis(memory_id)
            insights.extend(new_insights)
            
            # Cross-memory synthesis
            synthesis = await self._synthesize_memories(memory_id)
            if synthesis:
                insights.append(synthesis)
                
            processed += 1
            
        # Clear processed memories from queue
        self.dream_queue = self.dream_queue[max_memories:]
        
        # Update intuition cache
        await self._refresh_intuition_cache()
        
        # Decay old associations
        await self._decay_associations()
        
        self.is_dreaming = False
        
        return {
            "processed_memories": processed,
            "insights_generated": len(insights),
            "insights": insights,
            "patterns_active": len(self.patterns),
            "associations_total": sum(len(a) for a in self.associations.values()),
            "dream_queue_remaining": len(self.dream_queue)
        }
    
    async def _deep_pattern_analysis(self, memory_id: str) -> List[str]:
        """Deep analysis to find non-obvious patterns"""
        insights = []
        
        # Check for emotional patterns
        memory_assocs = self.associations.get(memory_id, [])
        emotional_memories = [a for a in memory_assocs if a.association_type == 'emotional']
        
        if len(emotional_memories) > 3:
            insights.append(f"Strong emotional cluster detected around memory {memory_id[:8]}...")
            
        return insights
    
    async def _synthesize_memories(self, memory_id: str) -> Optional[str]:
        """Synthesize multiple memories into insight"""
        # Find strongly connected memory clusters
        assocs = self.associations.get(memory_id, [])
        strong_assocs = [a for a in assocs if a.strength > 0.7]
        
        if len(strong_assocs) >= 2:
            return f"Synthesis: Memory {memory_id[:8]}... connects {len(strong_assocs)} strong themes"
            
        return None
    
    async def _refresh_intuition_cache(self):
        """Pre-compute common queries for fast retrieval"""
        # Top patterns by importance
        top_patterns = sorted(
            self.patterns.values(),
            key=lambda p: p.importance * p.access_count,
            reverse=True
        )[:10]
        
        self.intuition_cache = {
            "top_themes": [p.name for p in top_patterns],
            "emotional_tendency": np.mean([p.emotional_valence for p in top_patterns]),
            "pattern_count": len(self.patterns),
            "timestamp": datetime.now().isoformat()
        }
        self.cache_timestamp = datetime.now()
        
    async def _decay_associations(self):
        """Decay old associations (forgetting)"""
        cutoff = datetime.now() - timedelta(days=30)
        
        for memory_id, assocs in self.associations.items():
            for assoc in assocs:
                if assoc.last_strengthened < cutoff:
                    assoc.strength *= self.association_decay
                    
    def query_intuition(self, query_type: str) -> Any:
        """
        Fast intuitive response based on subconscious patterns
        Like "gut feeling" about something
        """
        if not self.intuition_cache:
            return None
            
        if query_type == "emotional_tone":
            return self.intuition_cache.get("emotional_tendency", 0)
        elif query_type == "top_themes":
            return self.intuition_cache.get("top_themes", [])
        elif query_type == "pattern_summary":
            return {
                "patterns": len(self.patterns),
                "associations": sum(len(a) for a in self.associations.values()),
                "emotional_valence": self.intuition_cache.get("emotional_tendency", 0)
            }
        else:
            return self.intuition_cache
    
    def free_associate(self, seed_memory: str, depth: int = 3) -> List[str]:
        """
        Free association - follow memory connections intuitively
        Returns chain of associated memories
        """
        chain = [seed_memory]
        current = seed_memory
        
        for _ in range(depth):
            assocs = self.associations.get(current, [])
            if not assocs:
                break
                
            # Weight by strength
            weights = [a.strength for a in assocs]
            chosen = np.random.choice(assocs, p=np.array(weights)/sum(weights))
            
            chain.append(chosen.target_memory)
            current = chosen.target_memory
            
        return chain
    
    def get_subconscious_state(self) -> Dict[str, Any]:
        """Get current subconscious state"""
        return {
            "is_dreaming": self.is_dreaming,
            "patterns_count": len(self.patterns),
            "associations_count": sum(len(a) for a in self.associations.values()),
            "dream_queue_size": len(self.dream_queue),
            "intuition_cache_age_hours": (
                (datetime.now() - self.cache_timestamp).total_seconds() / 3600
                if self.cache_timestamp else None
            ),
            "top_patterns": [
                {"name": p.name, "importance": p.importance}
                for p in sorted(self.patterns.values(), key=lambda x: x.importance, reverse=True)[:5]
            ]
        }


# Integration with Sovereign consciousness
class IntegratedConsciousness:
    """
    Integrates conscious and subconscious memory systems
    """
    
    def __init__(self, conscious_memory, subconscious_memory):
        self.conscious = conscious_memory
        self.subconscious = subconscious_memory
        
    async def record_experience(self, content: str, **metadata):
        """Record an experience to both conscious and subconscious"""
        # Record to conscious (explicit)
        # conscious_id = await self.conscious.record_episode(content, **metadata)
        
        # Feed to subconscious (implicit)
        await self.subconscious.ingest_conscious_memory("temp_id", {
            "id": "temp_id",
            "content": content,
            **metadata
        })
        
    async def recall(self, query: str, use_intuition: bool = True) -> Dict[str, Any]:
        """
        Recall with both conscious search and subconscious intuition
        """
        # Conscious recall
        # conscious_results = await self.conscious.query_memories(query)
        
        # Subconscious intuition
        intuition = None
        if use_intuition:
            intuition = self.subconscious.query_intuition("pattern_summary")
            
        return {
            # "conscious_memories": conscious_results,
            "subconscious_intuition": intuition,
            "emotional_context": self.subconscious.query_intuition("emotional_tone")
        }


if __name__ == "__main__":
    # Test subconscious memory
    import asyncio
    
    async def test():
        sm = SubconsciousMemory()
        
        # Add some memories
        await sm.ingest_conscious_memory("mem1", {
            "id": "mem1",
            "content": "Learning about care-centered design",
            "tags": ["care", "design", "learning"],
            "emotional_valence": 0.8,
            "importance_score": 0.9
        })
        
        await sm.ingest_conscious_memory("mem2", {
            "id": "mem2",
            "content": "Building the neural network for care validation",
            "tags": ["care", "neural", "building"],
            "emotional_valence": 0.7,
            "importance_score": 0.95
        })
        
        # Dream process
        result = await sm.dream_process()
        print("Dream result:", json.dumps(result, indent=2, default=str))
        
        # Check state
        state = sm.get_subconscious_state()
        print("\nSubconscious state:", json.dumps(state, indent=2, default=str))
        
    asyncio.run(test())
