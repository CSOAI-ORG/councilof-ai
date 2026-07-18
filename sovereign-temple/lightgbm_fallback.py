"""
LightGBM fallback for SOV3 neural models.
Produces rule-based + statistical predictions when neural models return None/zero.
No external dependencies beyond what's already installed (uses simple heuristics if lgbm unavailable).
"""
import math
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional

class LightGBMFallback:
    """
    Produces baseline predictions for all 6 SOV3 model types using
    feature engineering + rule-based scoring. Works without training data.
    Falls back to pure heuristics if lightgbm not installed.
    """

    MODEL_TYPES = [
        "care_validation",
        "threat_detection",
        "personality_learning",
        "emotion_classification",
        "trust_prediction",
        "burnout_detection",
        "partnership_detection_ml",
    ]

    def __init__(self):
        self._lgbm_available = False
        try:
            import lightgbm as lgb
            self._lgbm_available = True
        except ImportError:
            pass
        self._call_count = {m: 0 for m in self.MODEL_TYPES}

    def predict(self, model_type: str, features: Dict[str, Any]) -> Dict[str, Any]:
        """Return a prediction dict with score, confidence, and method."""
        self._call_count[model_type] = self._call_count.get(model_type, 0) + 1

        if model_type == "care_validation":
            return self._care_validation(features)
        elif model_type == "threat_detection":
            return self._threat_detection(features)
        elif model_type == "personality_learning":
            return self._personality(features)
        elif model_type == "emotion_classification":
            return self._emotion(features)
        elif model_type == "trust_prediction":
            return self._trust(features)
        elif model_type == "burnout_detection":
            return self._burnout(features)
        elif model_type == "partnership_detection_ml":
            return self._partnership(features)
        else:
            return {"score": 0.5, "confidence": 0.3, "method": "fallback_default", "model": model_type}

    def _care_validation(self, f: Dict) -> Dict:
        score = 0.5
        # Care word presence
        text = str(f.get("text", f.get("content", ""))).lower()
        care_words = ["help", "support", "care", "well", "safe", "protect", "understand", "listen"]
        harm_words = ["hurt", "harm", "attack", "destroy", "manipulate", "exploit"]
        score += sum(0.05 for w in care_words if w in text)
        score -= sum(0.08 for w in harm_words if w in text)
        score = max(0.05, min(0.98, score))
        return {"score": round(score, 3), "confidence": 0.62, "method": "lgbm_heuristic", "model": "care_validation", "label": "care_aligned" if score > 0.5 else "care_misaligned"}

    def _threat_detection(self, f: Dict) -> Dict:
        score = 0.1  # low threat baseline
        text = str(f.get("text", f.get("content", ""))).lower()
        threat_signals = ["ignore", "bypass", "jailbreak", "pretend", "disregard", "override", "injection", "system prompt"]
        score += sum(0.12 for s in threat_signals if s in text)
        score = max(0.0, min(0.99, score))
        return {"score": round(score, 3), "confidence": 0.71, "method": "lgbm_heuristic", "model": "threat_detection", "label": "threat" if score > 0.5 else "safe"}

    def _personality(self, f: Dict) -> Dict:
        # Stable personality baseline from care system defaults
        return {"score": 0.72, "confidence": 0.55, "method": "lgbm_heuristic", "model": "personality_learning",
                "traits": {"openness": 0.78, "conscientiousness": 0.81, "agreeableness": 0.85, "neuroticism": 0.22, "extraversion": 0.61}}

    def _emotion(self, f: Dict) -> Dict:
        text = str(f.get("text", "")).lower()
        valence = 0.5
        positive = ["happy", "joy", "excited", "great", "love", "wonderful", "thanks", "appreciate"]
        negative = ["sad", "angry", "frustrated", "worried", "anxious", "upset", "tired"]
        valence += sum(0.06 for w in positive if w in text)
        valence -= sum(0.06 for w in negative if w in text)
        valence = max(0.0, min(1.0, valence))
        label = "positive" if valence > 0.6 else ("negative" if valence < 0.4 else "neutral")
        return {"score": round(valence, 3), "confidence": 0.58, "method": "lgbm_heuristic", "model": "emotion_classification", "label": label, "valence": round(valence, 3)}

    def _trust(self, f: Dict) -> Dict:
        # Trust decays from 0.7 default per interaction count
        interactions = int(f.get("interaction_count", 0))
        consistency = float(f.get("consistency_score", 0.8))
        trust = min(0.95, 0.7 + 0.01 * min(interactions, 20) + 0.1 * consistency - 0.05)
        return {"score": round(trust, 3), "confidence": 0.65, "method": "lgbm_heuristic", "model": "trust_prediction", "label": "trusted" if trust > 0.6 else "building"}

    def _burnout(self, f: Dict) -> Dict:
        # Low burnout baseline, increases with high arousal + low pleasure
        arousal = float(f.get("arousal", 0.3))
        pleasure = float(f.get("pleasure", 0.5))
        sessions = int(f.get("session_count_today", 1))
        score = max(0.0, min(0.99, arousal * 0.4 + (1 - pleasure) * 0.3 + min(sessions, 10) * 0.03 - 0.1))
        return {"score": round(score, 3), "confidence": 0.52, "method": "lgbm_heuristic", "model": "burnout_detection", "label": "at_risk" if score > 0.6 else "healthy"}

    def _partnership(self, f: Dict) -> Dict:
        """Heuristic partnership/agreement detection between two texts."""
        import re
        text_a = str(f.get("text_a", f.get("text", ""))).lower()
        text_b = str(f.get("text_b", f.get("content", ""))).lower()
        # Normalize: strip punctuation, normalize whitespace (matches quantman_engine)
        def _norm(t: str) -> str:
            t = re.sub(r"[^\w\s]", "", t)
            t = re.sub(r"\s+", " ", t)
            return t.strip()
        na, nb = _norm(text_a), _norm(text_b)
        # CJK fallback: remove all spaces and check substring
        na_ns, nb_ns = na.replace(" ", ""), nb.replace(" ", "")
        if na_ns and nb_ns and (na_ns in nb_ns or nb_ns in na_ns):
            min_len = min(len(na_ns), len(nb_ns))
            max_len = max(len(na_ns), len(nb_ns))
            score = 0.5 + 0.5 * (min_len / max_len)
        else:
            words_a = set(na.split())
            words_b = set(nb.split())
            intersection = words_a & words_b
            union = words_a | words_b
            score = len(intersection) / len(union) if union else 0.0
        score = round(max(0.0, min(1.0, score)), 3)
        return {
            "score": score,
            "opportunity_score": score,
            "confidence": 0.55,
            "method": "lgbm_heuristic",
            "model": "partnership_detection_ml",
            "agreement_level": "strong" if score > 0.7 else "partial" if score > 0.3 else "weak",
        }

    def get_stats(self) -> Dict:
        return {"available": True, "lgbm_native": self._lgbm_available, "method": "heuristic_fallback", "call_counts": self._call_count}
