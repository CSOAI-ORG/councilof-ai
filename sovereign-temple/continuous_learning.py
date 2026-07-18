#!/usr/bin/env python3
"""
Continuous Learning System for Sovereign Neural Models
Implements online learning, periodic retraining, and ensemble growth
"""

import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import json
import pickle
import os
from dataclasses import dataclass, asdict


@dataclass
class LearningRecord:
    """Record of a prediction and its feedback"""
    timestamp: datetime
    model_name: str
    input_hash: str
    prediction: Any
    actual_outcome: Optional[Any] = None
    feedback_score: Optional[float] = None  # 0-1, how good was the prediction
    user_correction: Optional[Any] = None
    
    def to_dict(self):
        return {
            "timestamp": self.timestamp.isoformat(),
            "model_name": self.model_name,
            "input_hash": self.input_hash,
            "prediction": self.prediction,
            "actual_outcome": self.actual_outcome,
            "feedback_score": self.feedback_score,
            "user_correction": self.user_correction
        }


class ContinuousLearningManager:
    """
    Manages continuous learning for all neural models
    - Logs every prediction
    - Collects feedback
    - Periodically retrains with accumulated data
    - Grows ensemble when new patterns emerge
    """
    
    def __init__(self, models_dir: str = "models", feedback_dir: str = "feedback"):
        self.models_dir = models_dir
        self.feedback_dir = feedback_dir
        self.feedback_log: List[LearningRecord] = []
        self.learning_stats: Dict[str, Dict] = {}
        
        # Ensure directories exist
        os.makedirs(feedback_dir, exist_ok=True)
        
        # Configuration
        self.retrain_threshold = 100  # New samples before retrain
        self.feedback_window_days = 30
        
        # Load existing feedback
        self._load_feedback()
        
    def _load_feedback(self):
        """Load existing feedback log"""
        feedback_file = os.path.join(self.feedback_dir, "feedback_log.json")
        if os.path.exists(feedback_file):
            with open(feedback_file, 'r') as f:
                data = json.load(f)
                for record in data:
                    self.feedback_log.append(LearningRecord(
                        timestamp=datetime.fromisoformat(record["timestamp"]),
                        model_name=record["model_name"],
                        input_hash=record["input_hash"],
                        prediction=record["prediction"],
                        actual_outcome=record.get("actual_outcome"),
                        feedback_score=record.get("feedback_score"),
                        user_correction=record.get("user_correction")
                    ))
    
    def _save_feedback(self):
        """Save feedback log"""
        feedback_file = os.path.join(self.feedback_dir, "feedback_log.json")
        with open(feedback_file, 'w') as f:
            json.dump([r.to_dict() for r in self.feedback_log], f, indent=2)
    
    def log_prediction(self, model_name: str, input_data: Any, prediction: Any) -> str:
        """
        Log a prediction for potential feedback
        
        Returns:
            prediction_id (hash for later feedback)
        """
        # Create hash of input
        input_str = str(input_data)
        input_hash = str(hash(input_str) % 100000000)
        
        record = LearningRecord(
            timestamp=datetime.now(),
            model_name=model_name,
            input_hash=input_hash,
            prediction=prediction
        )
        
        self.feedback_log.append(record)
        
        # Save periodically
        if len(self.feedback_log) % 10 == 0:
            self._save_feedback()
        
        return input_hash
    
    def provide_feedback(self, input_hash: str, actual_outcome: Any = None, 
                        feedback_score: float = None, user_correction: Any = None):
        """
        Provide feedback on a previous prediction
        
        Args:
            input_hash: Hash from log_prediction
            actual_outcome: What actually happened
            feedback_score: 0-1 score of prediction quality
            user_correction: User's corrected output
        """
        # Find the record
        for record in reversed(self.feedback_log):
            if record.input_hash == input_hash:
                record.actual_outcome = actual_outcome
                record.feedback_score = feedback_score
                record.user_correction = user_correction
                break
        
        self._save_feedback()
    
    def get_learning_stats(self, model_name: str = None) -> Dict[str, Any]:
        """Get statistics about learning progress"""
        
        if model_name:
            records = [r for r in self.feedback_log if r.model_name == model_name]
        else:
            records = self.feedback_log
        
        # Calculate stats
        total = len(records)
        with_feedback = len([r for r in records if r.feedback_score is not None])
        avg_score = np.mean([r.feedback_score for r in records if r.feedback_score is not None]) if with_feedback > 0 else None
        
        # Recent activity
        recent_cutoff = datetime.now() - timedelta(days=7)
        recent = [r for r in records if r.timestamp > recent_cutoff]
        
        return {
            "total_predictions": total,
            "with_feedback": with_feedback,
            "feedback_rate": with_feedback / total if total > 0 else 0,
            "average_score": round(avg_score, 3) if avg_score else None,
            "recent_predictions": len(recent),
            "ready_for_retrain": with_feedback >= self.retrain_threshold
        }
    
    def get_training_data(self, model_name: str) -> Tuple[List, List]:
        """
        Get accumulated training data for a model
        
        Returns:
            (inputs, targets) for retraining
        """
        records = [r for r in self.feedback_log 
                  if r.model_name == model_name and r.user_correction is not None]
        
        # This is simplified - in practice you'd need to store the original inputs
        # and map corrections to proper training targets
        
        return records
    
    def should_retrain(self, model_name: str) -> bool:
        """Check if model should be retrained"""
        stats = self.get_learning_stats(model_name)
        return stats["ready_for_retrain"]
    
    def generate_learning_report(self) -> str:
        """Generate a report on learning progress"""
        report = ["# Continuous Learning Report\n"]
        report.append(f"Generated: {datetime.now().isoformat()}\n")
        report.append(f"Total feedback records: {len(self.feedback_log)}\n\n")
        
        # Group by model
        models = set(r.model_name for r in self.feedback_log)
        
        for model in models:
            stats = self.get_learning_stats(model)
            report.append(f"## {model}\n")
            report.append(f"- Predictions: {stats['total_predictions']}\n")
            report.append(f"- With feedback: {stats['with_feedback']}\n")
            report.append(f"- Avg score: {stats['average_score']}\n")
            report.append(f"- Ready for retrain: {'Yes' if stats['ready_for_retrain'] else 'No'}\n\n")
        
        return "".join(report)


class OnlineLearner:
    """
    Wraps a sklearn model with online learning capabilities
    """
    
    def __init__(self, base_model, learning_rate: float = 0.01):
        self.model = base_model
        self.learning_rate = learning_rate
        self.partial_fit_support = hasattr(base_model, 'partial_fit')
        self.recent_samples: List[Tuple] = []  # (X, y) pairs
        self.max_recent = 1000
        
    def predict(self, X):
        """Make prediction"""
        return self.model.predict(X)
    
    def learn_from_feedback(self, X, y_true, y_pred):
        """
        Online learning from feedback
        
        If model supports partial_fit, use it.
        Otherwise, accumulate samples for batch retraining.
        """
        # Store sample
        self.recent_samples.append((X, y_true))
        if len(self.recent_samples) > self.max_recent:
            self.recent_samples.pop(0)
        
        # Try online update if supported
        if self.partial_fit_support:
            try:
                # Calculate error
                error = np.mean((y_pred - y_true) ** 2)
                
                # Partial fit with sample weight based on error
                # Higher error = more learning
                weight = 1.0 + error * 10
                
                self.model.partial_fit(X, y_true, sample_weight=np.array([weight]))
                return True
            except Exception as e:
                print(f"Partial fit failed: {e}")
                return False
        
        return False
    
    def get_recent_training_batch(self, n: int = 100) -> Tuple[np.ndarray, np.ndarray]:
        """Get recent samples for batch training"""
        recent = self.recent_samples[-n:]
        X = np.vstack([x for x, _ in recent])
        y = np.vstack([y for _, y in recent])
        return X, y


# Integration with Sovereign
def integrate_with_sovereign():
    """
    Instructions for integrating continuous learning with Sovereign:
    
    1. Wrap each neural model with OnlineLearner
    2. Log every prediction with ContinuousLearningManager
    3. When feedback provided, call learn_from_feedback
    4. Periodically check should_retrain() and trigger retraining
    5. Use the subconscious_memory to track learning patterns
    """
    pass


if __name__ == "__main__":
    # Test continuous learning
    manager = ContinuousLearningManager()
    
    # Simulate some predictions
    for i in range(10):
        pred_id = manager.log_prediction(
            "care_validation_nn",
            f"test input {i}",
            {"care_score": 0.8}
        )
        
        # Simulate feedback on some
        if i % 2 == 0:
            manager.provide_feedback(
                pred_id,
                actual_outcome={"care_score": 0.85},
                feedback_score=0.9
            )
    
    # Get stats
    stats = manager.get_learning_stats("care_validation_nn")
    print(f"Learning stats: {json.dumps(stats, indent=2)}")
    
    # Generate report
    print("\n" + manager.generate_learning_report())
