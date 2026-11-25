"""
Counterfactual "What-If" simulator for AcadPulse.
Finds the minimum cost behavioral change delta_x to move risk below the Safe threshold (< 0.35).
Objective:
    min cost(delta_x) = w_e * delta_eng + w_s * delta_score
Subject to:
    P(Risk | x + delta_x) < safe_threshold (default 0.35)
    engagement <= 1.0 (100%)
    assessment_score <= 100.0
    demographics and immutable features unchanged.
"""
from typing import Dict, Any, Optional
import numpy as np


class CounterfactualSolver:
    def __init__(
        self,
        classifier: Any,
        scaler: Any,
        feature_names: list,
        safe_threshold: float = 0.35,
        w_engagement: float = 1.0,
        w_score: float = 1.5,
    ):
        self.classifier = classifier
        self.scaler = scaler
        self.feature_names = feature_names
        self.safe_threshold = safe_threshold
        self.w_engagement = w_engagement
        self.w_score = w_score

    def solve(
        self,
        current_features: Dict[str, float],
        max_delta_eng: float = 0.40,
        max_delta_score: float = 30.0,
        steps: int = 20,
    ) -> Dict[str, Any]:
        """
        Executes bounded grid search over actionable features:
        - rolling_engagement_rate (can increase up to 1.0)
        - assessment_score_mean (can increase up to 100.0)
        """
        base_eng = current_features.get("rolling_engagement_rate", 0.0)
        base_score = current_features.get("assessment_score_mean", 0.0)

        # Baseline risk
        x_vec = np.array([[current_features[col] for col in self.feature_names]])
        x_scaled = self.scaler.transform(x_vec)
        base_risk = float(self.classifier.predict_proba(x_scaled)[0, 1])

        # If already safe, no change needed
        if base_risk < self.safe_threshold:
            return {
                "feasible": True,
                "already_safe": True,
                "current_risk": base_risk,
                "target_risk": base_risk,
                "delta_engagement": 0.0,
                "delta_score": 0.0,
                "cost": 0.0,
                "plan_description": "Current trajectory is already within the Safe tier.",
            }

        eng_steps = np.linspace(0.0, min(max_delta_eng, 1.0 - base_eng), steps)
        score_steps = np.linspace(0.0, min(max_delta_score, 100.0 - base_score), steps)

        best_plan = None
        min_cost = float("inf")

        eng_idx = self.feature_names.index("rolling_engagement_rate")
        score_idx = self.feature_names.index("assessment_score_mean")

        for d_eng in eng_steps:
            for d_score in score_steps:
                candidate = x_vec.copy()
                candidate[0, eng_idx] = base_eng + d_eng
                candidate[0, score_idx] = base_score + d_score

                cand_scaled = self.scaler.transform(candidate)
                prob_risk = float(self.classifier.predict_proba(cand_scaled)[0, 1])

                if prob_risk < self.safe_threshold:
                    cost = (self.w_engagement * (d_eng * 100.0)) + (self.w_score * d_score)
                    if cost < min_cost:
                        min_cost = cost
                        best_plan = {
                            "feasible": True,
                            "already_safe": False,
                            "current_risk": base_risk,
                            "target_risk": prob_risk,
                            "delta_engagement": float(d_eng),
                            "delta_score": float(d_score),
                            "target_engagement": float(base_eng + d_eng),
                            "target_score": float(base_score + d_score),
                            "cost": float(cost),
                            "plan_description": (
                                f"Support guidance: Increasing engagement by {d_eng*100:.1f}% "
                                f"and assessment marks by {d_score:.1f} pts moves projected risk to {prob_risk:.2f} (Safe)."
                            ),
                        }

        if best_plan is None:
            return {
                "feasible": False,
                "already_safe": False,
                "current_risk": base_risk,
                "cost": None,
                "plan_description": "No feasible plan found within reasonable intervention limits. Immediate direct instructor advising recommended.",
            }

        return best_plan
