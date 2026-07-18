"""
Sovereign Metacognitive Engine
Weekly self-assessment of learning, model trends, research quality,
and strategy adjustments for Project Heartbeat.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

logger = logging.getLogger("sovereign.metacognition")


class MetacognitiveEngine:
    """
    Metacognitive reflection system — evaluates Sovereign's own learning
    trajectory, model health, research effectiveness, and proposes
    strategy adjustments on a weekly cadence.
    """

    def __init__(self, model_registry, memory_store):
        self.model_registry = model_registry
        self.memory_store = memory_store

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _query_memories_by_tags(
        self, tags: List[str], days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Query memories matching any of the given tags within the time window.
        Handles multiple memory-store API shapes gracefully.
        """
        since = datetime.utcnow() - timedelta(days=days)

        if hasattr(self.memory_store, "query_memories"):
            return await self.memory_store.query_memories(tags=tags, start_time=since)
        elif hasattr(self.memory_store, "query"):
            return await self.memory_store.query(tags=tags, start_time=since)
        elif hasattr(self.memory_store, "pool") and self.memory_store.pool:
            async with self.memory_store.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT * FROM memory_episodes
                    WHERE created_at >= $1
                      AND tags && $2::text[]
                    ORDER BY created_at DESC
                    """,
                    since,
                    tags,
                )
                return [dict(r) for r in rows]
        return []

    async def _count_memories_per_day(self, days: int = 7) -> Dict[str, int]:
        """Count total new memories per day for the given window."""
        since = datetime.utcnow() - timedelta(days=days)

        if hasattr(self.memory_store, "pool") and self.memory_store.pool:
            async with self.memory_store.pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT created_at::date AS day, COUNT(*) AS cnt
                    FROM memory_episodes
                    WHERE created_at >= $1
                    GROUP BY day
                    ORDER BY day
                    """,
                    since,
                )
                return {str(r["day"]): r["cnt"] for r in rows}

        # Fallback: fetch all and bucket in Python
        if hasattr(self.memory_store, "query_memories"):
            mems = await self.memory_store.query_memories(start_time=since)
        elif hasattr(self.memory_store, "query"):
            mems = await self.memory_store.query(start_time=since)
        else:
            return {}

        buckets: Dict[str, int] = {}
        for m in mems:
            ts = m.get("created_at") if isinstance(m, dict) else getattr(m, "created_at", None)
            if ts is None:
                continue
            day_key = ts.strftime("%Y-%m-%d") if hasattr(ts, "strftime") else str(ts)[:10]
            buckets[day_key] = buckets.get(day_key, 0) + 1

        return buckets

    # ------------------------------------------------------------------
    # Model trends
    # ------------------------------------------------------------------

    async def get_model_trends(self) -> Dict[str, Any]:
        """
        For each registered model, determine whether it is improving,
        stable, or degrading based on current metrics and recent retrain
        memories.
        """
        logger.info("Analyzing model trends")

        models = self.model_registry.list_models()
        retrain_memories = await self._query_memories_by_tags(["neural_retrain"], days=7)

        trends: Dict[str, Any] = {}

        for model_info in models:
            name = model_info.get("name", "") if isinstance(model_info, dict) else getattr(model_info, "name", "")
            metrics = model_info.get("metrics", {}) if isinstance(model_info, dict) else getattr(model_info, "metrics", {})

            # Find retrain events for this model
            related_retrains = [
                m for m in retrain_memories
                if name.lower() in str(m.get("content", "") if isinstance(m, dict) else getattr(m, "content", "")).lower()
            ]

            retrain_count = len(related_retrains)
            current_accuracy = metrics.get("accuracy", None) if isinstance(metrics, dict) else None

            # Heuristic: if multiple retrains and accuracy is decent, improving
            # If no retrains, stable. If retrains but accuracy is low, degrading.
            if retrain_count >= 2 and current_accuracy is not None and current_accuracy >= 0.7:
                trend = "improving"
            elif retrain_count == 0:
                trend = "stable"
            elif current_accuracy is not None and current_accuracy < 0.5:
                trend = "degrading"
            else:
                trend = "stable"

            trends[name] = {
                "current_metrics": metrics,
                "retrains_last_7d": retrain_count,
                "trend": trend,
            }

            logger.debug("Model %s — trend=%s, retrains=%d", name, trend, retrain_count)

        logger.info("Model trend analysis complete for %d models", len(trends))
        return trends

    # ------------------------------------------------------------------
    # Research quality
    # ------------------------------------------------------------------

    async def assess_research_quality(self) -> Dict[str, Any]:
        """
        Analyze research sweep effectiveness by examining memories tagged
        'research' from the last 7 days.
        """
        logger.info("Assessing research quality")

        research_memories = await self._query_memories_by_tags(["research"], days=7)
        total_findings = len(research_memories)

        if total_findings == 0:
            logger.info("No research memories found in the last 7 days")
            return {
                "total_findings": 0,
                "average_relevance": 0.0,
                "category_counts": {},
                "assessment": "no_data",
            }

        relevance_scores: List[float] = []
        category_counts: Dict[str, int] = {}

        for mem in research_memories:
            # Extract relevance from metadata or care_weight as proxy
            if isinstance(mem, dict):
                relevance = mem.get("metadata", {}).get("relevance", mem.get("care_weight", 0.5))
                tags = mem.get("tags", [])
            else:
                meta = getattr(mem, "metadata", {}) or {}
                relevance = meta.get("relevance", getattr(mem, "care_weight", 0.5))
                tags = getattr(mem, "tags", [])

            if isinstance(relevance, (int, float)):
                relevance_scores.append(float(relevance))

            # Count categories (tags beyond 'research')
            for tag in (tags if isinstance(tags, list) else []):
                if tag != "research":
                    category_counts[tag] = category_counts.get(tag, 0) + 1

        avg_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0.0

        # Identify most-cited categories
        sorted_categories = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)
        top_categories = sorted_categories[:5]

        summary = {
            "total_findings": total_findings,
            "average_relevance": round(avg_relevance, 4),
            "category_counts": category_counts,
            "top_categories": top_categories,
            "assessment": "strong" if avg_relevance >= 0.6 else "moderate" if avg_relevance >= 0.4 else "weak",
        }

        logger.info(
            "Research quality: %d findings, avg relevance %.2f, assessment=%s",
            total_findings, avg_relevance, summary["assessment"],
        )
        return summary

    # ------------------------------------------------------------------
    # Learning velocity
    # ------------------------------------------------------------------

    async def assess_learning_velocity(self) -> Dict[str, Any]:
        """
        Compute how fast Sovereign is learning based on new memories per day,
        successful model retrains, and absorbed research insights.
        """
        logger.info("Assessing learning velocity")

        # Memories per day
        daily_counts = await self._count_memories_per_day(days=7)
        total_new_memories = sum(daily_counts.values())
        avg_per_day = total_new_memories / 7.0 if daily_counts else 0.0

        # Successful retrains
        retrain_memories = await self._query_memories_by_tags(["neural_retrain"], days=7)
        successful_retrains = len(retrain_memories)

        # Research insights
        research_memories = await self._query_memories_by_tags(["research"], days=7)
        research_insights = len(research_memories)

        # Composite velocity score (0-1)
        # Normalize each component and weight
        memory_component = min(avg_per_day / 50.0, 1.0)       # 50 memories/day = max
        retrain_component = min(successful_retrains / 5.0, 1.0)  # 5 retrains/week = max
        research_component = min(research_insights / 20.0, 1.0)  # 20 insights/week = max

        velocity_score = round(
            memory_component * 0.4 + retrain_component * 0.3 + research_component * 0.3,
            4,
        )

        summary = {
            "daily_memory_counts": daily_counts,
            "total_new_memories": total_new_memories,
            "avg_memories_per_day": round(avg_per_day, 2),
            "successful_retrains": successful_retrains,
            "research_insights": research_insights,
            "velocity_score": velocity_score,
            "velocity_label": (
                "high" if velocity_score >= 0.7
                else "moderate" if velocity_score >= 0.4
                else "low"
            ),
        }

        logger.info(
            "Learning velocity: %.2f (%s) — %d memories, %d retrains, %d insights",
            velocity_score, summary["velocity_label"],
            total_new_memories, successful_retrains, research_insights,
        )
        return summary

    # ------------------------------------------------------------------
    # Strategy adjustments
    # ------------------------------------------------------------------

    async def generate_strategy_adjustments(self) -> List[Dict[str, Any]]:
        """
        Propose concrete adjustments based on model trends, research quality,
        and learning velocity.
        """
        logger.info("Generating strategy adjustments")

        model_trends = await self.get_model_trends()
        research = await self.assess_research_quality()
        velocity = await self.assess_learning_velocity()

        adjustments: List[Dict[str, Any]] = []

        # Check each model for degradation or stagnation
        for model_name, info in model_trends.items():
            trend = info.get("trend", "stable")
            if trend == "degrading":
                adjustments.append({
                    "target": model_name,
                    "type": "model_improvement",
                    "priority": "high",
                    "suggestion": f"Model '{model_name}' is degrading. Consider gathering more diverse training data or adjusting hyperparameters.",
                })
            elif trend == "stable" and info.get("retrains_last_7d", 0) == 0:
                adjustments.append({
                    "target": model_name,
                    "type": "model_attention",
                    "priority": "medium",
                    "suggestion": f"Model '{model_name}' has not been retrained in 7 days. Schedule a retrain cycle to prevent staleness.",
                })

        # Research quality check
        if research.get("assessment") == "weak":
            adjustments.append({
                "target": "research_sweeps",
                "type": "research_improvement",
                "priority": "medium",
                "suggestion": "Research relevance is low. Consider revising search keywords, expanding source lists, or narrowing topic focus.",
            })
        elif research.get("total_findings", 0) == 0:
            adjustments.append({
                "target": "research_sweeps",
                "type": "research_activation",
                "priority": "high",
                "suggestion": "No research findings in 7 days. Verify research sweeps are running and producing output.",
            })

        # Learning velocity check
        if velocity.get("velocity_label") == "low":
            adjustments.append({
                "target": "nightshift",
                "type": "activity_increase",
                "priority": "medium",
                "suggestion": "Learning velocity is declining. Increase nightshift activity — more research sweeps, retrain cycles, and memory consolidation.",
            })

        if not adjustments:
            adjustments.append({
                "target": "general",
                "type": "status_quo",
                "priority": "low",
                "suggestion": "All systems performing within expected parameters. No adjustments needed.",
            })

        logger.info("Generated %d strategy adjustment(s)", len(adjustments))
        return adjustments

    # ------------------------------------------------------------------
    # Weekly review
    # ------------------------------------------------------------------

    async def run_weekly_review(self) -> Dict[str, Any]:
        """
        Full metacognitive cycle: model trends, research quality,
        learning velocity, and strategy adjustments. Records the review
        as a memory episode.
        """
        logger.info("=== Metacognitive Weekly Review START ===")
        review_start = datetime.utcnow()

        # 1. Model trends
        model_trends = await self.get_model_trends()

        # 2. Research quality
        research_quality = await self.assess_research_quality()

        # 3. Learning velocity
        learning_velocity = await self.assess_learning_velocity()

        # 4. Strategy adjustments
        strategy_adjustments = await self.generate_strategy_adjustments()

        review_end = datetime.utcnow()
        duration_s = (review_end - review_start).total_seconds()

        review = {
            "timestamp": review_start.isoformat(),
            "duration_seconds": round(duration_s, 2),
            "model_trends": model_trends,
            "research_quality": research_quality,
            "learning_velocity": learning_velocity,
            "strategy_adjustments": strategy_adjustments,
        }

        # 5. Record as memory
        velocity_score = learning_velocity.get("velocity_score", "N/A")
        research_assessment = research_quality.get("assessment", "N/A")
        adjustment_count = len(strategy_adjustments)

        summary_text = (
            f"Weekly metacognitive review — "
            f"velocity_score={velocity_score}, "
            f"research_assessment={research_assessment}, "
            f"strategy_adjustments={adjustment_count}, "
            f"models_analyzed={len(model_trends)}"
        )

        try:
            if hasattr(self.memory_store, "record"):
                await self.memory_store.record(
                    content=summary_text,
                    care_weight=0.8,
                    tags=["metacognition", "autonomous", "self_improvement", "weekly"],
                    metadata={"full_review": review},
                )
            elif hasattr(self.memory_store, "record_memory"):
                await self.memory_store.record_memory(
                    content=summary_text,
                    care_weight=0.8,
                    tags=["metacognition", "autonomous", "self_improvement", "weekly"],
                    metadata={"full_review": review},
                )
            else:
                logger.warning("Memory store has no record/record_memory method; skipping memory write")
        except Exception as exc:
            logger.error("Failed to record metacognitive review memory: %s", exc)

        logger.info(
            "=== Metacognitive Weekly Review END (%.1fs) ===", duration_s,
        )
        return review
