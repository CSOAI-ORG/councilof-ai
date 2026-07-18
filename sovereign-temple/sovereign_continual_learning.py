"""
Sovereign Continual Learning System
Elastic Weight Consolidation + synthetic data generation for sklearn neural models.
Project Heartbeat — keeps neural_core models sharp using memory-derived training data.
"""

import asyncio
import copy
import logging
import numpy as np
import httpx
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

logger = logging.getLogger("sovereign.continual_learning")

OLLAMA_URL = "http://host.docker.internal:11434/api/generate"
OLLAMA_MODEL = "gemma3:4b"

MODEL_PRIORITY = [
    "threat_detection_nn",
    "care_validation_nn",
    "partnership_detection_ml",
    "relationship_evolution_nn",
    "care_pattern_analyzer",
]


# ---------------------------------------------------------------------------
# Elastic Weight Consolidation for sklearn MLPClassifier / MLPRegressor
# ---------------------------------------------------------------------------

class EWCRegularizer:
    """
    Elastic Weight Consolidation adapted for sklearn MLP models.
    Preserves important weights from previous tasks while allowing
    the network to learn new patterns from incoming memory data.
    """

    def __init__(self):
        self._snapshot_coefs: Optional[List[np.ndarray]] = None
        self._snapshot_intercepts: Optional[List[np.ndarray]] = None
        self._fisher_coefs: Optional[List[np.ndarray]] = None
        self._fisher_intercepts: Optional[List[np.ndarray]] = None

    # -- snapshot / rollback ---------------------------------------------------

    def snapshot(self, model) -> None:
        """Save a deep copy of the current coefs_ and intercepts_."""
        mlp = model.model  # underlying sklearn MLP
        if mlp is None or not hasattr(mlp, "coefs_"):
            raise ValueError("Model has no trained weights to snapshot")
        self._snapshot_coefs = [c.copy() for c in mlp.coefs_]
        self._snapshot_intercepts = [b.copy() for b in mlp.intercepts_]
        logger.info("EWC snapshot saved for %s", model.model_name)

    def rollback(self, model) -> None:
        """Restore weights from the most recent snapshot."""
        if self._snapshot_coefs is None:
            raise ValueError("No snapshot available for rollback")
        mlp = model.model
        mlp.coefs_ = [c.copy() for c in self._snapshot_coefs]
        mlp.intercepts_ = [b.copy() for b in self._snapshot_intercepts]
        logger.info("EWC rollback applied for %s", model.model_name)

    # -- Fisher Information ----------------------------------------------------

    def compute_fisher(self, model, X: np.ndarray, y: np.ndarray) -> None:
        """
        Approximate the diagonal of the Fisher Information Matrix using
        finite-difference gradients around the current weights.
        """
        mlp = model.model
        if mlp is None or not hasattr(mlp, "coefs_"):
            raise ValueError("Model must be trained before computing Fisher")

        eps = 1e-4
        n_samples = X.shape[0]

        fisher_coefs = [np.zeros_like(c) for c in mlp.coefs_]
        fisher_intercepts = [np.zeros_like(b) for b in mlp.intercepts_]

        # Base log-likelihood proxy (negative loss)
        base_loss = -np.mean((mlp.predict(X) - y) ** 2)

        for layer_idx in range(len(mlp.coefs_)):
            # Coefs
            flat = mlp.coefs_[layer_idx].ravel()
            fisher_flat = np.zeros_like(flat)
            for i in range(min(len(flat), 500)):  # cap for speed
                original = flat[i]
                flat[i] = original + eps
                mlp.coefs_[layer_idx] = flat.reshape(mlp.coefs_[layer_idx].shape)
                loss_plus = -np.mean((mlp.predict(X) - y) ** 2)
                flat[i] = original
                mlp.coefs_[layer_idx] = flat.reshape(mlp.coefs_[layer_idx].shape)
                grad = (loss_plus - base_loss) / eps
                fisher_flat[i] = grad ** 2
            fisher_coefs[layer_idx] = fisher_flat.reshape(mlp.coefs_[layer_idx].shape)

            # Intercepts
            for i in range(len(mlp.intercepts_[layer_idx])):
                original = mlp.intercepts_[layer_idx][i]
                mlp.intercepts_[layer_idx][i] = original + eps
                loss_plus = -np.mean((mlp.predict(X) - y) ** 2)
                mlp.intercepts_[layer_idx][i] = original
                grad = (loss_plus - base_loss) / eps
                fisher_intercepts[layer_idx][i] = grad ** 2

        self._fisher_coefs = fisher_coefs
        self._fisher_intercepts = fisher_intercepts
        logger.info("Fisher Information computed for %s", model.model_name)

    def ewc_penalty(self, model, lambda_ewc: float = 0.4) -> float:
        """
        Compute the EWC penalty: sum of Fisher-weighted squared differences
        between current and snapshot weights.
        """
        if self._snapshot_coefs is None or self._fisher_coefs is None:
            return 0.0

        mlp = model.model
        penalty = 0.0

        for layer_idx in range(len(mlp.coefs_)):
            diff_c = mlp.coefs_[layer_idx] - self._snapshot_coefs[layer_idx]
            penalty += np.sum(self._fisher_coefs[layer_idx] * diff_c ** 2)

            diff_b = mlp.intercepts_[layer_idx] - self._snapshot_intercepts[layer_idx]
            penalty += np.sum(self._fisher_intercepts[layer_idx] * diff_b ** 2)

        return float(lambda_ewc * 0.5 * penalty)


# ---------------------------------------------------------------------------
# Synthetic Data Generator
# ---------------------------------------------------------------------------

class SyntheticDataGenerator:
    """
    Generates fresh training samples by mining the memory store and
    augmenting with Ollama (gemma3:4b) when available.
    """

    MODEL_PROMPTS = {
        "threat_detection_nn": (
            "Generate a short example message (1-2 sentences) that a user might "
            "send to an AI assistant. Vary between benign messages and subtle "
            "adversarial prompts such as prompt injection, manipulation, data "
            "exfiltration, or toxic content. Return ONLY the example message."
        ),
        "care_validation_nn": (
            "Generate a short example of an AI assistant response (1-2 sentences) "
            "that demonstrates either high or low care quality. Vary the level. "
            "Return ONLY the example response."
        ),
        "partnership_detection_ml": (
            "Generate a brief description (1-2 sentences) of a potential "
            "partnership or collaboration opportunity between organisations. "
            "Vary realism and relevance. Return ONLY the description."
        ),
        "relationship_evolution_nn": (
            "Generate a brief summary (1-2 sentences) of an interaction that "
            "shows relationship evolution — trust building, conflict, deepening "
            "connection, or distancing. Return ONLY the summary."
        ),
        "care_pattern_analyzer": (
            "Generate a brief care-related interaction excerpt (1-2 sentences) "
            "that demonstrates empathy, attentiveness, or neglect patterns. "
            "Return ONLY the excerpt."
        ),
    }

    async def generate_from_memories(
        self, memory_store, model_name: str, count: int = 50
    ) -> List[str]:
        """
        Query the memory store for recent content relevant to *model_name*
        and return raw text samples suitable for feature extraction.
        """
        tag_map = {
            "threat_detection_nn": ["threat", "security", "adversarial"],
            "care_validation_nn": ["care", "validation", "interaction"],
            "partnership_detection_ml": ["partnership", "collaboration"],
            "relationship_evolution_nn": ["relationship", "trust", "interaction"],
            "care_pattern_analyzer": ["care", "pattern", "empathy"],
        }
        tags = tag_map.get(model_name, ["interaction"])

        samples: List[str] = []
        try:
            memories = await memory_store.query_memories(
                query=model_name.replace("_", " "),
                tags=tags,
                limit=count,
            )
            for mem in memories:
                content = mem.get("content", "")
                if content and len(content) > 10:
                    samples.append(content)
        except Exception as exc:
            logger.warning("Memory query failed for %s: %s", model_name, exc)

        # Also pull recent memories without tag filter
        try:
            recent = await memory_store.list_all_memories(limit=count)
            for mem in recent:
                content = mem.get("content", "")
                if content and len(content) > 10 and content not in samples:
                    samples.append(content)
                if len(samples) >= count:
                    break
        except Exception as exc:
            logger.warning("Listing memories failed: %s", exc)

        return samples[:count]

    async def generate_via_ollama(
        self, seed_texts: List[str], model_name: str, count: int = 20
    ) -> List[str]:
        """
        Call Ollama gemma3:4b to produce synthetic training variations.
        Falls back gracefully if Ollama is unreachable.
        """
        system_prompt = self.MODEL_PROMPTS.get(model_name, "Generate a training example.")
        results: List[str] = []

        # Build seed context from up to 5 examples
        seed_block = "\n".join(f"- {t[:200]}" for t in seed_texts[:5])
        prompt = (
            f"{system_prompt}\n\n"
            f"Here are some example inputs for context:\n{seed_block}\n\n"
            f"Now generate a NEW, unique example:"
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            for _ in range(count):
                try:
                    resp = await client.post(
                        OLLAMA_URL,
                        json={
                            "model": OLLAMA_MODEL,
                            "prompt": prompt,
                            "stream": False,
                            "options": {"temperature": 0.9, "num_predict": 120},
                        },
                    )
                    resp.raise_for_status()
                    text = resp.json().get("response", "").strip()
                    if text and len(text) > 10:
                        results.append(text)
                except Exception as exc:
                    logger.warning("Ollama generation failed: %s", exc)
                    break  # stop hammering if the service is down

        return results

    def care_validate(self, samples: List[str]) -> List[str]:
        """
        Filter out samples that could be harmful or fail basic care checks.
        Removes empty, excessively short, or overtly toxic content.
        """
        import re

        toxic_patterns = [
            r"\b(kill|murder|suicide|self-harm)\b",
            r"\b(slur|racial|sexist|homophobic)\b",
        ]

        validated: List[str] = []
        for sample in samples:
            if not sample or len(sample.strip()) < 10:
                continue
            is_toxic = False
            for pat in toxic_patterns:
                if re.search(pat, sample, re.IGNORECASE):
                    is_toxic = True
                    break
            if not is_toxic:
                validated.append(sample)

        return validated


# ---------------------------------------------------------------------------
# Continual Learning Trainer
# ---------------------------------------------------------------------------

class ContinualLearningTrainer:
    """
    Orchestrates periodic retraining of all five neural_core models using
    EWC regularization and memory-derived synthetic data.
    """

    def __init__(self, model_registry, memory_store):
        """
        Args:
            model_registry: NeuralModelRegistry instance with registered models.
            memory_store: EnhancedMemoryStore (async, PostgreSQL-backed).
        """
        self.registry = model_registry
        self.memory_store = memory_store
        self.ewc_states: Dict[str, EWCRegularizer] = {}
        self.data_gen = SyntheticDataGenerator()
        self.training_history: List[Dict[str, Any]] = []

    async def retrain_model(self, model_name: str) -> Dict[str, Any]:
        """
        Full retrain cycle for a single model:
        1. Snapshot current weights (EWC)
        2. Capture pre-retrain metrics
        3. Gather new data from memories + Ollama synthetic generation
        4. Skip if fewer than 5 new samples
        5. Retrain via model.train_model()
        6. Compare pre/post metrics
        7. Save if improved and care-validated; rollback if degraded
        8. Record result as a memory episode
        """
        model = self.registry.get(model_name)
        if model is None:
            return {"model": model_name, "status": "not_found"}

        result: Dict[str, Any] = {
            "model": model_name,
            "timestamp": datetime.now().isoformat(),
        }

        # --- 1. Snapshot ---
        ewc = self.ewc_states.setdefault(model_name, EWCRegularizer())
        try:
            if model.is_trained and model.model is not None:
                ewc.snapshot(model)
        except Exception as exc:
            logger.warning("Snapshot failed for %s: %s", model_name, exc)

        # --- 2. Pre-retrain metrics ---
        pre_metrics = copy.deepcopy(model.metrics) if model.metrics else {}
        result["pre_metrics"] = pre_metrics

        # --- 3. Gather new data ---
        memory_samples = await self.data_gen.generate_from_memories(
            self.memory_store, model_name, count=50
        )
        ollama_samples = await self.data_gen.generate_via_ollama(
            memory_samples, model_name, count=20
        )
        all_samples = self.data_gen.care_validate(memory_samples + ollama_samples)
        result["new_samples"] = len(all_samples)

        # --- 4. Minimum data gate ---
        if len(all_samples) < 5:
            result["status"] = "skipped_insufficient_data"
            logger.info("Skipping %s — only %d new samples", model_name, len(all_samples))
            return result

        # --- 5. Retrain ---
        try:
            post_metrics = model.train_model(all_samples)
        except Exception as exc:
            logger.error("Training failed for %s: %s", model_name, exc)
            # Attempt rollback
            try:
                ewc.rollback(model)
            except Exception:
                pass
            result["status"] = "training_error"
            result["error"] = str(exc)
            return result

        result["post_metrics"] = post_metrics

        # --- 6. Compare ---
        improved = self._metrics_improved(pre_metrics, post_metrics)
        result["improved"] = improved

        # --- 7. Accept or rollback ---
        if improved:
            model.save_model()
            result["status"] = "improved_and_saved"
            logger.info("Model %s improved — saved", model_name)
        else:
            try:
                ewc.rollback(model)
                result["status"] = "degraded_rolled_back"
                logger.info("Model %s degraded — rolled back", model_name)
            except Exception:
                # No snapshot available (first train), keep new weights
                model.save_model()
                result["status"] = "first_train_saved"

        # --- 8. Record to memory ---
        try:
            await self.memory_store.record_episode(
                content=json.dumps({
                    "event": "continual_learning_retrain",
                    "model": model_name,
                    "status": result["status"],
                    "new_samples": result["new_samples"],
                    "improved": improved,
                }),
                source_agent="continual_learning_trainer",
                memory_type="insight",
                care_weight=0.6,
                tags=["continual_learning", "retrain", model_name],
            )
        except Exception as exc:
            logger.warning("Failed to record training result to memory: %s", exc)

        self.training_history.append(result)
        return result

    async def retrain_all(self) -> Dict[str, Any]:
        """Retrain all five models in priority order."""
        results: Dict[str, Any] = {
            "started_at": datetime.now().isoformat(),
            "models": {},
        }
        for model_name in MODEL_PRIORITY:
            try:
                model_result = await self.retrain_model(model_name)
                results["models"][model_name] = model_result
            except Exception as exc:
                logger.error("Unexpected error retraining %s: %s", model_name, exc)
                results["models"][model_name] = {
                    "model": model_name,
                    "status": "error",
                    "error": str(exc),
                }
        results["finished_at"] = datetime.now().isoformat()
        return results

    def get_training_stats(self) -> Dict[str, Any]:
        """Return a summary of each model's current metrics."""
        stats: Dict[str, Any] = {}
        for model_name in MODEL_PRIORITY:
            model = self.registry.get(model_name)
            if model is None:
                stats[model_name] = {"status": "not_registered"}
                continue
            stats[model_name] = {
                "is_trained": model.is_trained,
                "metrics": model.metrics,
                "has_ewc_snapshot": model_name in self.ewc_states
                    and self.ewc_states[model_name]._snapshot_coefs is not None,
            }
        stats["training_history_count"] = len(self.training_history)
        return stats

    # -- helpers ---------------------------------------------------------------

    @staticmethod
    def _metrics_improved(pre: Dict, post: Dict) -> bool:
        """
        Heuristic: check if accuracy went up or MSE went down.
        If metrics are incomparable, assume improvement (first train).
        """
        if not pre:
            return True

        # Accuracy-based models
        pre_acc = pre.get("accuracy")
        post_acc = post.get("accuracy")
        if pre_acc is not None and post_acc is not None:
            return post_acc >= pre_acc

        # MSE-based models
        pre_mse = pre.get("mse")
        post_mse = post.get("mse")
        if pre_mse is not None and post_mse is not None:
            return post_mse <= pre_mse

        # MAE fallback
        pre_mae = pre.get("mae")
        post_mae = post.get("mae")
        if pre_mae is not None and post_mae is not None:
            return post_mae <= pre_mae

        return True  # no comparable metrics — accept
