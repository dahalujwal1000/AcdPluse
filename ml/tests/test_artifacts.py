"""
Unit test verifying that serialized .joblib artifacts:
1. Load correctly.
2. Comply with the locked feature contract.
3. Successfully run prediction, SHAP attributions, and persona assignment.
4. Meet the p95 latency target (< 100ms).
"""
import time
from pathlib import Path
import pytest
import joblib
import numpy as np
from ml.src.features import FEATURE_COLUMNS

ARTIFACTS_DIR = Path("ml/artifacts")


@pytest.mark.parametrize("week", [4, 8, 12])
def test_serialized_artifact_contract_and_inference(week):
    bundle_path = ARTIFACTS_DIR / f"acadpulse_w{week}.joblib"
    assert bundle_path.exists(), f"Artifact bundle missing for week {week}"

    bundle = joblib.load(bundle_path)
    assert "model" in bundle
    assert "scaler" in bundle
    assert "kmeans" in bundle
    assert "explainer" in bundle
    assert bundle["feature_names"] == FEATURE_COLUMNS
    assert bundle["checkpoint_week"] == week

    # Synthetic test student sample
    sample_feat = np.array([[
        0.65,    # rolling_engagement_rate
        120.0,   # total_vle_clicks
        3.0,     # assessment_count
        72.5,    # assessment_score_mean
        50.0,    # assessment_score_min
        12.0,    # assessment_score_std
        -1.5,    # avg_submission_delta_days (submitted early)
        0.0,     # late_submission_count
        0.0,     # prior_attempts_count
    ]])

    scaler = bundle["scaler"]
    model = bundle["model"]
    explainer = bundle["explainer"]
    kmeans = bundle["kmeans"]

    # Scaled input
    x_scaled = scaler.transform(sample_feat)

    # Latency measurement
    t0 = time.time()
    probs = model.predict_proba(x_scaled)
    shap_vals = explainer.shap_values(x_scaled)
    cluster = kmeans.predict(x_scaled)
    elapsed_ms = (time.time() - t0) * 1000.0

    # Assertions
    assert probs.shape == (1, 2)
    assert 0.0 <= probs[0, 1] <= 1.0
    assert cluster[0] in [0, 1, 2]
    # Check that latency meets target (< 100ms)
    assert elapsed_ms < 100.0
