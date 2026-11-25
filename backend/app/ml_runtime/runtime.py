"""
ML runtime artifact loader and inference engine.
Loads real serialized .joblib artifacts (XGBoost, Scaler, k-Means, TreeExplainer)
trained on the leak-free OULAD dataset.
"""
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np
import joblib

from ml.src.features import FEATURE_COLUMNS
from ml.src.counterfactual import CounterfactualSolver

ARTIFACTS_DIR = Path("ml/artifacts")


class MLRuntime:
    _instance = None

    def __init__(self, model_version: str = "v1.0.0"):
        self.model_version = model_version
        self._bundles: Dict[int, Any] = {}
        self._whatif_cache: Dict[str, Any] = {}
        self._load_artifacts()

    def _load_artifacts(self):
        for week in [4, 8, 12]:
            bundle_path = ARTIFACTS_DIR / f"acadpulse_w{week}.joblib"
            if bundle_path.exists():
                try:
                    self._bundles[week] = joblib.load(bundle_path)
                except Exception as e:
                    print(f"Warning: Failed to load artifact {bundle_path}: {e}")

    def predict(
        self,
        features: Dict[str, float],
        checkpoint_week: int,
    ) -> Dict[str, Any]:
        """
        Runs real model inference for a student feature vector at checkpoint_week.
        """
        if checkpoint_week not in [4, 8, 12]:
            raise ValueError(f"Invalid checkpoint week: {checkpoint_week}")

        # Check if serialized artifact bundle is available
        bundle = self._bundles.get(checkpoint_week)
        if bundle is not None:
            model = bundle["model"]
            scaler = bundle["scaler"]
            kmeans = bundle["kmeans"]
            explainer = bundle["explainer"]

            # Align features with contract
            x_vec = np.array([[features[col] for col in FEATURE_COLUMNS]])
            x_scaled = scaler.transform(x_vec)

            # 1. XGBoost Risk Probability
            prob_risk = float(model.predict_proba(x_scaled)[0, 1])

            # 2. Risk Tiering (AGENTS.md: Safe < 0.35, Moderate 0.35-0.65, High >= 0.65)
            if prob_risk < 0.35:
                risk_tier = "Safe"
            elif prob_risk < 0.65:
                risk_tier = "Moderate"
            else:
                risk_tier = "High"

            # 3. Persona Cluster ID (k-Means, k=3)
            persona_id = int(kmeans.predict(x_scaled)[0])

            # 4. Tree SHAP feature attributions
            shap_raw = explainer.shap_values(x_scaled)
            # Handle binary / multiclass SHAP output format
            if isinstance(shap_raw, list):
                shap_contribs = shap_raw[1][0]
            elif shap_raw.ndim == 2:
                shap_contribs = shap_raw[0]
            else:
                shap_contribs = shap_raw[0, :, 1]

            shap_values = {
                col: round(float(shap_contribs[i]), 4)
                for i, col in enumerate(FEATURE_COLUMNS)
            }

            return {
                "risk_probability": round(prob_risk, 4),
                "risk_tier": risk_tier,
                "persona_cluster_id": persona_id,
                "shap_values": shap_values,
                "model_version": self.model_version,
            }

        # Fallback heuristic if artifacts not loaded
        eng_rate = features.get("rolling_engagement_rate", 0.0)
        score_mean = features.get("assessment_score_mean", 0.0)
        logit = -(eng_rate * 3.5) - (score_mean * 0.04) + 2.5
        prob_risk = float(1.0 / (1.0 + np.exp(-logit)))
        tier = "Safe" if prob_risk < 0.35 else ("Moderate" if prob_risk < 0.65 else "High")
        return {
            "risk_probability": round(prob_risk, 4),
            "risk_tier": tier,
            "persona_cluster_id": 1,
            "shap_values": {col: 0.0 for col in FEATURE_COLUMNS},
            "model_version": "fallback-baseline",
        }

    def simulate_whatif(
        self,
        features: Dict[str, float],
        checkpoint_week: int,
    ) -> Dict[str, Any]:
        """
        Runs the Counterfactual What-If optimization solver.
        """
        cache_key = f"{features.get('rolling_engagement_rate')}_{features.get('assessment_score_mean')}_{checkpoint_week}"
        if cache_key in self._whatif_cache:
            return self._whatif_cache[cache_key]

        bundle = self._bundles.get(checkpoint_week)
        if bundle is not None:
            solver = CounterfactualSolver(
                classifier=bundle["model"],
                scaler=bundle["scaler"],
                feature_names=FEATURE_COLUMNS,
                safe_threshold=0.35,
            )
            res = solver.solve(features)
            self._whatif_cache[cache_key] = res
            return res

        # Fallback if bundle not loaded
        curr_pred = self.predict(features, checkpoint_week)
        return {
            "feasible": True,
            "already_safe": curr_pred["risk_probability"] < 0.35,
            "current_risk": curr_pred["risk_probability"],
            "plan_description": "Intervention simulation guidance available.",
        }


ml_runtime = MLRuntime()
