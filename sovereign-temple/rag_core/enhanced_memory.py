"""
Enhanced Memory System for Sovereign Temple
Features: Temporal chains, episodic compaction, importance scoring
"""

import asyncio
import asyncpg
import weaviate
from weaviate.client import Client
from weaviate.util import generate_uuid5
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from dataclasses import dataclass, asdict
import json
import hashlib


@dataclass
class MemoryEpisode:
    """Represents a single memory episode"""

    id: str
    content: str
    timestamp: datetime
    importance_score: float
    care_weight: float
    source_agent: str
    memory_type: str  # 'interaction', 'insight', 'decision', 'emotion'
    related_episodes: List[str]  # IDs of causally related episodes
    tags: List[str]
    access_count: int = 0
    last_accessed: Optional[datetime] = None
    compacted_from: Optional[List[str]] = (
        None  # IDs of episodes this was summarized from
    )

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["timestamp"] = self.timestamp.isoformat()
        data["last_accessed"] = (
            self.last_accessed.isoformat() if self.last_accessed else None
        )
        return data


class TemporalMemoryChain:
    """
    Manages cause-effect relationships between memories
    Creates chains of related episodes for narrative continuity
    """

    def __init__(self):
        self.chains: Dict[str, List[str]] = {}  # chain_id -> ordered episode IDs
        self.episode_chains: Dict[
            str, List[str]
        ] = {}  # episode_id -> list of chain IDs

    def create_chain(self, chain_name: str, initial_episode_id: str) -> str:
        """Create a new temporal chain"""
        chain_id = f"chain_{chain_name}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        self.chains[chain_id] = [initial_episode_id]

        if initial_episode_id not in self.episode_chains:
            self.episode_chains[initial_episode_id] = []
        self.episode_chains[initial_episode_id].append(chain_id)

        return chain_id

    def add_to_chain(
        self, chain_id: str, episode_id: str, cause_episode_id: Optional[str] = None
    ):
        """Add an episode to a chain, optionally specifying causal predecessor"""
        if chain_id not in self.chains:
            raise ValueError(f"Chain {chain_id} does not exist")

        self.chains[chain_id].append(episode_id)

        if episode_id not in self.episode_chains:
            self.episode_chains[episode_id] = []
        self.episode_chains[episode_id].append(chain_id)

    def get_chain(self, chain_id: str) -> List[str]:
        """Get all episodes in a chain in temporal order"""
        return self.chains.get(chain_id, [])

    def get_episode_chains(self, episode_id: str) -> List[str]:
        """Get all chains an episode belongs to"""
        return self.episode_chains.get(episode_id, [])

    def find_causal_path(
        self, start_episode: str, end_episode: str, max_depth: int = 10
    ) -> Optional[List[str]]:
        """Find a causal path between two episodes"""
        # Simple BFS to find path
        visited = set()
        queue = [(start_episode, [start_episode])]

        while queue and len(visited) < max_depth * 10:
            current, path = queue.pop(0)

            if current == end_episode:
                return path

            if current in visited:
                continue
            visited.add(current)

            # Find related episodes through chains
            for chain_id in self.episode_chains.get(current, []):
                chain = self.chains[chain_id]
                idx = chain.index(current)
                if idx < len(chain) - 1:
                    next_ep = chain[idx + 1]
                    if next_ep not in visited:
                        queue.append((next_ep, path + [next_ep]))

        return None


class ImportanceScorer:
    """
    Automatically scores memory importance based on multiple factors
    """

    def __init__(self):
        self.weights = {
            "emotional_intensity": 0.25,
            "care_relevance": 0.20,
            "decision_impact": 0.20,
            "novelty": 0.15,
            "access_frequency": 0.10,
            "agent_significance": 0.10,
        }

    def calculate_importance(
        self,
        episode: MemoryEpisode,
        emotional_valence: float = 0.5,
        decision_impact: float = 0.0,
        agent_trust: float = 0.5,
    ) -> float:
        """Calculate importance score for a memory episode"""

        # Emotional intensity (higher for extreme positive or negative)
        emotional_intensity = abs(emotional_valence - 0.5) * 2

        # Care relevance
        care_relevance = episode.care_weight

        # Novelty based on tags and type
        novelty = 0.7 if episode.memory_type in ["insight", "decision"] else 0.4

        # Access frequency (more accessed = more important)
        access_freq = min(episode.access_count / 10, 1.0)

        # Agent significance
        agent_significance = agent_trust

        # Calculate weighted score
        score = (
            emotional_intensity * self.weights["emotional_intensity"]
            + care_relevance * self.weights["care_relevance"]
            + decision_impact * self.weights["decision_impact"]
            + novelty * self.weights["novelty"]
            + access_freq * self.weights["access_frequency"]
            + agent_significance * self.weights["agent_significance"]
        )

        return min(score, 1.0)

    def update_importance(
        self,
        episode: MemoryEpisode,
        access_increment: bool = False,
        new_emotional_valence: Optional[float] = None,
    ):
        """Update importance score based on new information"""
        if access_increment:
            episode.access_count += 1
            episode.last_accessed = datetime.now()

        # Recalculate if needed
        # (In practice, this would fetch additional context)


class EpisodicCompactor:
    """
    Summarizes old memories to maintain manageable memory size
    While preserving essential information
    """

    def __init__(self, importance_scorer: ImportanceScorer):
        self.scorer = importance_scorer
        self.compaction_threshold_days = 30  # Compact memories older than this
        self.min_episodes_for_compaction = 5
        self.compaction_ratio = 0.3  # Keep top 30% of old episodes

    def should_compact(self, episodes: List[MemoryEpisode]) -> bool:
        """Determine if episodes should be compacted"""
        if len(episodes) < self.min_episodes_for_compaction:
            return False

        oldest = min(ep.timestamp for ep in episodes)
        age_days = (datetime.now() - oldest).days

        return age_days > self.compaction_threshold_days

    def compact_episodes(
        self, episodes: List[MemoryEpisode], chain_manager: TemporalMemoryChain
    ) -> Tuple[MemoryEpisode, List[MemoryEpisode]]:
        """
        Compact a group of episodes into a single summary episode
        Returns: (summary_episode, list_of_archived_episodes)
        """
        # Sort by importance and recency
        scored_episodes = []
        for ep in episodes:
            # Age factor: newer episodes get slight boost
            age_days = (datetime.now() - ep.timestamp).days
            age_factor = max(0.5, 1 - (age_days / 365))  # Decay over a year

            adjusted_score = ep.importance_score * age_factor
            scored_episodes.append((adjusted_score, ep))

        scored_episodes.sort(reverse=True)

        # Keep top episodes, summarize the rest
        keep_count = max(1, int(len(episodes) * self.compaction_ratio))
        keep_episodes = [ep for _, ep in scored_episodes[:keep_count]]
        summarize_episodes = [ep for _, ep in scored_episodes[keep_count:]]

        # Create summary
        summary_content = self._generate_summary(summarize_episodes)
        summary_tags = list(set(tag for ep in summarize_episodes for tag in ep.tags))

        summary_episode = MemoryEpisode(
            id=f"compact_{datetime.now().strftime('%Y%m%d%H%M%S')}_{hashlib.md5(summary_content.encode()).hexdigest()[:8]}",
            content=summary_content,
            timestamp=datetime.now(),
            importance_score=max(ep.importance_score for ep in keep_episodes)
            if keep_episodes
            else 0.5,
            care_weight=np.mean([ep.care_weight for ep in episodes]),
            source_agent="system",
            memory_type="compaction_summary",
            related_episodes=[ep.id for ep in keep_episodes],
            tags=summary_tags + ["compacted"],
            compacted_from=[ep.id for ep in summarize_episodes],
        )

        # Update chains to point to summary
        for ep in summarize_episodes:
            for chain_id in chain_manager.get_episode_chains(ep.id):
                chain = chain_manager.chains[chain_id]
                if ep.id in chain:
                    idx = chain.index(ep.id)
                    chain[idx] = summary_episode.id

        return summary_episode, summarize_episodes

    def _generate_summary(self, episodes: List[MemoryEpisode]) -> str:
        """Generate a natural language summary of episodes"""
        # Simple template-based summarization
        # In production, this would use an LLM

        by_type: Dict[str, List[MemoryEpisode]] = {}
        for ep in episodes:
            by_type.setdefault(ep.memory_type, []).append(ep)

        summary_parts = [f"Summary of {len(episodes)} past interactions:"]

        for mem_type, type_eps in by_type.items():
            if mem_type == "interaction":
                summary_parts.append(
                    f"- {len(type_eps)} interactions with various agents"
                )
            elif mem_type == "insight":
                key_insights = [ep.content[:100] + "..." for ep in type_eps[:3]]
                summary_parts.append(
                    f"- {len(type_eps)} key insights including: "
                    + "; ".join(key_insights)
                )
            elif mem_type == "decision":
                summary_parts.append(
                    f"- {len(type_eps)} decisions made, primarily related to: {', '.join(type_eps[0].tags[:3])}"
                )

        avg_care = np.mean([ep.care_weight for ep in episodes])
        summary_parts.append(f"- Average care level: {avg_care:.2f}")

        return "\n".join(summary_parts)


class EnhancedMemoryStore:
    """
    Main memory store integrating all enhanced features
    """

    def __init__(
        self,
        postgres_dsn: str = "postgresql://sovereign:sovereign@localhost:5432/sovereign_memory",
        weaviate_url: str = "http://localhost:8080",
    ):
        self.postgres_dsn = postgres_dsn
        self.weaviate_url = weaviate_url
        self.pool: Optional[asyncpg.Pool] = None
        self.weaviate_client: Optional[weaviate.Client] = None

        self.chain_manager = TemporalMemoryChain()
        self.importance_scorer = ImportanceScorer()
        self.compactor = EpisodicCompactor(self.importance_scorer)

    async def initialize(self):
        """Initialize database connections with retry logic"""
        import logging

        logger = logging.getLogger(__name__)

        # PostgreSQL with retry
        max_retries = 5
        retry_delay = 2.0
        for attempt in range(max_retries):
            try:
                self.pool = await asyncpg.create_pool(
                    self.postgres_dsn,
                    min_size=2,
                    max_size=10,
                    max_queries=50000,
                    max_inactive_connection_lifetime=300.0,
                    command_timeout=60.0,
                )
                await self._create_tables()
                await self._create_pgvector_index()
                logger.info("PostgreSQL memory store initialized")
                break
            except Exception as e:
                import traceback
                logger.warning(
                    f"PostgreSQL connection attempt {attempt + 1}/{max_retries} failed: {type(e).__name__}: {e}\n{traceback.format_exc()}"
                )
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay * (attempt + 1))
                else:
                    logger.error(
                        "PostgreSQL memory store failed after all retries — running without persistence"
                    )
                    self.pool = None

        # Weaviate (optional — Postgres is the primary store)
        try:
            self.weaviate_client = weaviate.Client(self.weaviate_url)
            await self._ensure_schema()
        except Exception as _wv_err:
            logger.warning("Weaviate unavailable (Postgres OK): %s", _wv_err)
            self.weaviate_client = None

    async def _create_tables(self):
        """Create PostgreSQL tables"""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS memory_episodes (
                    id TEXT PRIMARY KEY,
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    importance_score FLOAT NOT NULL,
                    care_weight FLOAT NOT NULL,
                    source_agent TEXT NOT NULL,
                    memory_type TEXT NOT NULL,
                    related_episodes TEXT[],
                    tags TEXT[],
                    access_count INTEGER DEFAULT 0,
                    last_accessed TIMESTAMP,
                    compacted_from TEXT[],
                    vector_id TEXT
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS temporal_chains (
                    chain_id TEXT PRIMARY KEY,
                    chain_name TEXT NOT NULL,
                    episode_ids TEXT[] NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)

            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_episodes_timestamp 
                ON memory_episodes(timestamp DESC)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_episodes_importance 
                ON memory_episodes(importance_score DESC)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_episodes_tags 
                ON memory_episodes USING GIN(tags)
            """)

            # pgvector extension and HNSW index for semantic search
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            await conn.execute("""
                ALTER TABLE memory_episodes 
                ADD COLUMN IF NOT EXISTS embedding vector(384)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_episodes_embedding 
                ON memory_episodes USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64)
            """)

    async def _create_pgvector_index(self):
        """Ensure pgvector extension and HNSW index exist"""
        if not self.pool:
            return
        async with self.pool.acquire() as conn:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            await conn.execute("""
                ALTER TABLE memory_episodes 
                ADD COLUMN IF NOT EXISTS embedding vector(384)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_episodes_embedding 
                ON memory_episodes USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64)
            """)

    async def _ensure_schema(self):
        """Ensure Weaviate schema exists"""
        schema = {
            "class": "MemoryEpisode",
            "vectorizer": "text2vec-openai",
            "moduleConfig": {"text2vec-openai": {"vectorizeClassName": False}},
            "properties": [
                {"name": "content", "dataType": ["text"]},
                {"name": "memory_type", "dataType": ["text"]},
                {"name": "source_agent", "dataType": ["text"]},
                {"name": "tags", "dataType": ["text[]"]},
                {"name": "importance_score", "dataType": ["number"]},
                {"name": "care_weight", "dataType": ["number"]},
                {"name": "timestamp", "dataType": ["text"]},
            ],
        }

        try:
            self.weaviate_client.schema.create_class(schema)
        except weaviate.exceptions.UnexpectedStatusCodeException:
            pass  # Class already exists

    async def record_episode(
        self,
        content: str,
        source_agent: str,
        memory_type: str = "interaction",
        care_weight: float = 0.5,
        tags: List[str] = None,
        related_to: Optional[str] = None,
        emotional_valence: float = 0.5,
        decision_impact: float = 0.0,
        agent_trust: float = 0.5,
    ) -> MemoryEpisode:
        """Record a new memory episode"""
        tags = tags or []

        # BUG 5 FIX: Apply importance floor for autonomous/maintenance memories.
        # Cap care_weight at 0.15 unless the memory also has 'decision' or 'insight' tag.
        if any(t in tags for t in ("autonomous", "maintenance")):
            if not any(t in tags for t in ("decision", "insight")):
                care_weight = min(care_weight, 0.15)

        episode_id = generate_uuid5(
            {"content": content, "timestamp": datetime.now().isoformat()}
        )

        episode = MemoryEpisode(
            id=episode_id,
            content=content,
            timestamp=datetime.now(),
            importance_score=0.0,  # Will calculate
            care_weight=care_weight,
            source_agent=source_agent,
            memory_type=memory_type,
            related_episodes=[related_to] if related_to else [],
            tags=tags,
        )

        # Calculate importance
        episode.importance_score = self.importance_scorer.calculate_importance(
            episode, emotional_valence, decision_impact, agent_trust
        )

        # Store in PostgreSQL (with DB-level deduplication)
        async with self.pool.acquire() as conn:
            # Check for identical OR near-identical content in last hour
            # Phase 1: exact match
            existing = await conn.fetchval(
                """
                SELECT id FROM memory_episodes
                WHERE content = $1 AND timestamp > NOW() - INTERVAL '1 hour'
                LIMIT 1
            """,
                episode.content,
            )
            if existing:
                import logging

                logging.getLogger(__name__).debug(
                    "Skipping exact duplicate memory: %s", episode.content[:50]
                )
                return episode  # Return without inserting
            # Phase 2: prefix similarity (catches heartbeat/registration with embedded timestamps)
            prefix = (
                episode.content[:60] if len(episode.content) > 60 else episode.content
            )
            prefix_match = await conn.fetchval(
                """
                SELECT id FROM memory_episodes
                WHERE LEFT(content, 60) = $1 AND timestamp > NOW() - INTERVAL '1 hour'
                LIMIT 1
            """,
                prefix,
            )
            if prefix_match:
                import logging

                logging.getLogger(__name__).debug(
                    "Skipping prefix-duplicate memory: %s", prefix
                )
                return episode  # Return without inserting

            await conn.execute(
                """
                INSERT INTO memory_episodes
                (id, content, timestamp, importance_score, care_weight, source_agent,
                 memory_type, related_episodes, tags, access_count)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """,
                episode.id,
                episode.content,
                episode.timestamp,
                episode.importance_score,
                episode.care_weight,
                episode.source_agent,
                episode.memory_type,
                episode.related_episodes,
                episode.tags,
                episode.access_count,
            )

        # Generate and store pgvector embedding (non-fatal)
        try:
            import requests as _req
            _emb_resp = _req.post("http://localhost:11434/api/embed", json={
                "model": "nomic-embed-text",
                "input": content[:2000],
            }, timeout=15)
            _emb_data = _emb_resp.json().get("embeddings", [])
            if _emb_data:
                _raw = _emb_data[0][:384]
                _norm = sum(x*x for x in _raw) ** 0.5
                _emb = [x/_norm for x in _raw] if _norm > 0 else _raw
                _vec_str = "[" + ",".join(str(x) for x in _emb) + "]"
                async with self.pool.acquire() as conn:
                    await conn.execute(
                        "UPDATE memory_episodes SET embedding = $1::vector WHERE id = $2",
                        _vec_str, episode.id,
                    )
        except Exception:
            pass  # Non-fatal — backfill script catches stragglers

        # Store in Weaviate for vector search (non-fatal — Postgres is source of truth)
        try:
            self.weaviate_client.data_object.create(
                {
                    "content": content,
                    "memory_type": memory_type,
                    "source_agent": source_agent,
                    "tags": tags or [],
                    "importance_score": episode.importance_score,
                    "care_weight": care_weight,
                    "timestamp": episode.timestamp.isoformat(),
                },
                "MemoryEpisode",
                episode_id,
            )
        except Exception as e:
            print(f"Weaviate write failed (Postgres OK): {e}")

        return episode

    async def consolidate_memories_by_tag(
        self, tag: str, window_hours: int = 24
    ) -> Dict[str, Any]:
        """BUG 5 FIX: Consolidate memories — if >50 share a tag within 24h, summarize into 1."""
        cutoff = datetime.now() - timedelta(hours=window_hours)
        try:
            async with self.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT id, content, care_weight, importance_score, memory_type
                    FROM memory_episodes
                    WHERE $1 = ANY(tags)
                      AND timestamp >= $2
                      AND 'consolidated_source' != ALL(tags)
                    ORDER BY importance_score DESC
                """,
                    tag,
                    cutoff,
                )
        except Exception as e:
            return {"consolidated": 0, "error": str(e)}

        if len(rows) <= 50:
            return {
                "consolidated": 0,
                "message": f"Only {len(rows)} memories with tag '{tag}' in window — no consolidation needed",
            }

        # Build summary content
        top_rows = rows[:5]
        summary_snippets = [r["content"][:120] for r in top_rows]
        summary_content = (
            f"[Consolidated {len(rows)} memories tagged '{tag}' from last {window_hours}h] "
            + " | ".join(summary_snippets)
        )
        avg_care = float(np.mean([r["care_weight"] for r in rows]))
        all_ids = [r["id"] for r in rows]

        summary_ep = await self.record_episode(
            content=summary_content,
            source_agent="system",
            memory_type="insight",
            care_weight=min(avg_care, 0.5),
            tags=[tag, "consolidated", "insight"],
        )

        # Mark originals as consolidated (avoid double-counting)
        try:
            async with self.pool.acquire() as conn:
                await conn.execute(
                    """
                    UPDATE memory_episodes
                    SET tags = array_append(tags, 'consolidated_source')
                    WHERE id = ANY($1)
                """,
                    all_ids,
                )
        except Exception:
            pass

        return {"consolidated": len(rows), "summary_id": summary_ep.id, "tag": tag}

    async def query_memories(
        self,
        query: str = "",
        care_weight_min: float = 0.2,
        tags: List[str] = None,
        limit: int = 5,
        start_time=None,
        end_time=None,
        **kwargs,
    ) -> List[Dict[str, Any]]:
        """Query memories using vector similarity + care weighting.

        Falls back to PostgreSQL keyword search if Weaviate is unavailable.
        """

        memories = []

        # Try vector search in Weaviate first
        try:
            near_text = {"concepts": [query]}

            results = (
                self.weaviate_client.query.get(
                    "MemoryEpisode",
                    [
                        "content",
                        "memory_type",
                        "source_agent",
                        "tags",
                        "importance_score",
                        "care_weight",
                        "timestamp",
                    ],
                )
                .with_near_text(near_text)
                .with_limit(limit * 2)
                .do()
            )

            if results and "data" in results:
                memories = (
                    results.get("data", {}).get("Get", {}).get("MemoryEpisode") or []
                )
        except Exception as e:
            print(f"Weaviate query failed, falling back to Postgres: {e}")

        # Fallback: PostgreSQL pgvector similarity search (HNSW index)
        if not memories:
            try:
                async with self.pool.acquire() as conn:
                    # Try vector similarity search first (pgvector HNSW)
                    # Generate a simple embedding using SentenceTransformer or fallback
                    embedding = None
                    try:
                        # Use Ollama nomic-embed-text (matches stored embeddings)
                        import requests as _req
                        _emb_resp = _req.post("http://localhost:11434/api/embed", json={
                            "model": "nomic-embed-text",
                            "input": query[:2000],
                        }, timeout=15)
                        _emb_data = _emb_resp.json().get("embeddings", [])
                        if _emb_data:
                            _raw = _emb_data[0][:384]  # Truncate to match stored dims
                            _norm = sum(x*x for x in _raw) ** 0.5
                            embedding = [x/_norm for x in _raw] if _norm > 0 else _raw
                    except Exception:
                        pass

                    if embedding:
                        # Use pgvector cosine similarity with HNSW index
                        # asyncpg needs vector as string format '[x,y,z]'
                        vec_str = "[" + ",".join(str(x) for x in embedding) + "]"
                        rows = await conn.fetch(
                            """
                            SELECT content, memory_type, source_agent, tags,
                                   importance_score, care_weight, timestamp,
                                   embedding <=> $1::vector AS similarity
                            FROM memory_episodes
                            WHERE embedding IS NOT NULL
                              AND care_weight >= $2
                            ORDER BY embedding <=> $1::vector
                            LIMIT $3
                            """,
                            vec_str,
                            care_weight_min,
                            limit * 2,
                        )
                    else:
                        # No embedder available — use keyword search with GIN tag index
                        where_clause = "content ILIKE $1"
                        params = [f"%{query[:100]}%", limit * 2]
                        if start_time:
                            where_clause += f" AND timestamp >= ${len(params) + 1}"
                            params.append(start_time)
                        if end_time:
                            where_clause += f" AND timestamp <= ${len(params) + 1}"
                            params.append(end_time)
                        rows = await conn.fetch(
                            f"""
                            SELECT content, memory_type, source_agent, tags,
                                   importance_score, care_weight, timestamp
                            FROM memory_episodes
                            WHERE {where_clause}
                            ORDER BY importance_score DESC
                            LIMIT $2
                            """,
                            *params,
                        )

                    memories = [
                        {
                            "content": row["content"],
                            "memory_type": row["memory_type"],
                            "source_agent": row["source_agent"],
                            "tags": row["tags"] or [],
                            "importance_score": float(row["importance_score"] or 0),
                            "care_weight": float(row["care_weight"] or 0),
                            "timestamp": row["timestamp"].isoformat()
                            if row["timestamp"]
                            else None,
                        }
                        for row in rows
                    ]
            except Exception as e:
                print(f"Postgres fallback also failed: {e}")
                return []

        # Fallback 3: tag-only GIN-index search.
        # Weaviate/pgvector may not have indexed a fresh memory yet; the GIN index
        # on tags is always consistent. This ensures tag-filtered queries return
        # memories even when vector search misses, which is critical for W2
        # rag_rescan to inspect recently-poisoned records.
        if not memories and tags:
            try:
                async with self.pool.acquire() as conn:
                    rows = await conn.fetch(
                        """
                        SELECT content, memory_type, source_agent, tags,
                               importance_score, care_weight, timestamp
                        FROM memory_episodes
                        WHERE tags && $1::text[]
                          AND care_weight >= $2
                        ORDER BY timestamp DESC
                        LIMIT $3
                        """,
                        tags,
                        care_weight_min,
                        limit * 2,
                    )
                    memories = [
                        {
                            "content": row["content"],
                            "memory_type": row["memory_type"],
                            "source_agent": row["source_agent"],
                            "tags": row["tags"] or [],
                            "importance_score": float(row["importance_score"] or 0),
                            "care_weight": float(row["care_weight"] or 0),
                            "timestamp": row["timestamp"].isoformat()
                            if row["timestamp"]
                            else None,
                        }
                        for row in rows
                    ]
            except Exception as e:
                print(f"Postgres tag-index fallback failed: {e}")

        # Apply care weighting and filtering
        scored_memories = []
        for mem in memories:
            care_wt = float(mem.get("care_weight", 0) or 0)
            if care_wt >= care_weight_min:
                if tags and not any(tag in (mem.get("tags") or []) for tag in tags):
                    continue

                # Care-weighted score
                care_boost = care_wt * 0.3
                importance_boost = float(mem.get("importance_score", 0) or 0) * 0.2
                scored_memories.append(
                    (care_boost + importance_boost, len(scored_memories), mem)
                )

        scored_memories.sort(key=lambda x: x[0], reverse=True)
        return [mem for _, _, mem in scored_memories[:limit]]

    async def get_temporal_chain(
        self, episode_id: str, direction: str = "forward", max_steps: int = 5
    ) -> List[Dict[str, Any]]:
        """Get the temporal chain from an episode"""

        chain_ids = self.chain_manager.get_episode_chains(episode_id)
        if not chain_ids:
            return []

        chain_id = chain_ids[0]  # Take first chain
        episode_ids = self.chain_manager.get_chain(chain_id)

        idx = episode_ids.index(episode_id)

        if direction == "forward":
            related_ids = episode_ids[idx : idx + max_steps + 1]
        elif direction == "backward":
            related_ids = episode_ids[max(0, idx - max_steps) : idx + 1]
        else:  # both
            related_ids = episode_ids[max(0, idx - max_steps) : idx + max_steps + 1]

        # Fetch episode details
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM memory_episodes WHERE id = ANY($1)
                ORDER BY timestamp
            """,
                related_ids,
            )

        return [dict(row) for row in rows]

    async def run_compaction(self):
        """Run memory compaction on old episodes"""
        cutoff_date = datetime.now() - timedelta(
            days=self.compactor.compaction_threshold_days
        )

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT * FROM memory_episodes 
                WHERE timestamp < $1 AND compacted_from IS NULL
                ORDER BY timestamp
            """,
                cutoff_date,
            )

        if len(rows) < self.compactor.min_episodes_for_compaction:
            return {"compacted": 0, "summary": None}

        episodes = [MemoryEpisode(**dict(row)) for row in rows]

        if not self.compactor.should_compact(episodes):
            return {"compacted": 0, "summary": None}

        summary_episode, archived = self.compactor.compact_episodes(
            episodes, self.chain_manager
        )

        # Store summary
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO memory_episodes 
                (id, content, timestamp, importance_score, care_weight, source_agent,
                 memory_type, related_episodes, tags, compacted_from)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            """,
                summary_episode.id,
                summary_episode.content,
                summary_episode.timestamp,
                summary_episode.importance_score,
                summary_episode.care_weight,
                summary_episode.source_agent,
                summary_episode.memory_type,
                summary_episode.related_episodes,
                summary_episode.tags,
                summary_episode.compacted_from,
            )

            # Mark archived episodes
            for ep in archived:
                await conn.execute(
                    """
                    UPDATE memory_episodes 
                    SET tags = array_append(tags, 'archived_compacted')
                    WHERE id = $1
                """,
                    ep.id,
                )

        return {
            "compacted": len(archived),
            "kept": len(episodes) - len(archived),
            "summary": summary_episode.to_dict(),
        }

    async def get_stats(self) -> Dict[str, Any]:
        """Get memory statistics"""
        async with self.pool.acquire() as conn:
            total = await conn.fetchval("SELECT COUNT(*) FROM memory_episodes")
            avg_importance = await conn.fetchval(
                "SELECT AVG(importance_score) FROM memory_episodes"
            )
            avg_care = await conn.fetchval(
                "SELECT AVG(care_weight) FROM memory_episodes"
            )

            type_counts = await conn.fetch("""
                SELECT memory_type, COUNT(*) FROM memory_episodes 
                GROUP BY memory_type
            """)

            tag_counts = await conn.fetch("""
                SELECT UNNEST(tags) as tag, COUNT(*) 
                FROM memory_episodes 
                GROUP BY tag
                ORDER BY COUNT(*) DESC
                LIMIT 10
            """)

        return {
            "total_episodes": total,
            "average_importance": round(avg_importance or 0, 3),
            "average_care_weight": round(avg_care or 0, 3),
            "by_type": {row["memory_type"]: row["count"] for row in type_counts},
            "top_tags": {row["tag"]: row["count"] for row in tag_counts},
        }

    async def list_all_memories(self, limit: int = 100) -> List[Dict[str, Any]]:
        """List all memories from PostgreSQL"""
        if self.pool is None:
            return []
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, content, timestamp, importance_score, care_weight,
                       source_agent, memory_type, tags, access_count
                FROM memory_episodes
                ORDER BY timestamp DESC
                LIMIT $1
            """,
                limit,
            )

            return [
                {
                    "id": row["id"],
                    "content": row["content"],
                    "timestamp": row["timestamp"].isoformat()
                    if row["timestamp"]
                    else None,
                    "importance_score": row["importance_score"],
                    "care_weight": row["care_weight"],
                    "source_agent": row["source_agent"],
                    "memory_type": row["memory_type"],
                    "tags": row["tags"] or [],
                    "access_count": row["access_count"],
                }
                for row in rows
            ]
