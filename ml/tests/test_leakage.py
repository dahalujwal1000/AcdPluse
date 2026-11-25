"""
Unit tests for temporal leakage guarantees.
Verifies that modifying, adding, or deleting data after checkpoint week t
does NOT alter features computed at checkpoint t.
"""
import pytest
import pandas as pd
import numpy as np
from ml.src.features import build_temporal_features, FEATURE_COLUMNS


@pytest.fixture
def mock_telemetry():
    attendance_data = [
        {"student_id": "std_1", "week_num": 1, "sessions_attended": 3, "sessions_total": 3, "vle_click_count": 50},
        {"student_id": "std_1", "week_num": 2, "sessions_attended": 2, "sessions_total": 3, "vle_click_count": 40},
        {"student_id": "std_1", "week_num": 3, "sessions_attended": 3, "sessions_total": 3, "vle_click_count": 60},
        {"student_id": "std_1", "week_num": 4, "sessions_attended": 3, "sessions_total": 3, "vle_click_count": 55},
        # Future data (after week 4 checkpoint)
        {"student_id": "std_1", "week_num": 5, "sessions_attended": 0, "sessions_total": 3, "vle_click_count": 5},
        {"student_id": "std_1", "week_num": 8, "sessions_attended": 1, "sessions_total": 3, "vle_click_count": 10},
    ]

    submissions_data = [
        {"student_id": "std_1", "due_day": 14, "submission_day": 13, "score": 85.0}, # Week 2 (submitted on time)
        {"student_id": "std_1", "due_day": 26, "submission_day": 28, "score": 70.0}, # Week 4 (submitted on day 28, late by 2 days)
        # Future submissions (after week 4, cutoff day 28)
        {"student_id": "std_1", "due_day": 42, "submission_day": 40, "score": 45.0}, # Week 6
        {"student_id": "std_1", "due_day": 56, "submission_day": 70, "score": 20.0}, # Week 8
    ]

    return pd.DataFrame(attendance_data), pd.DataFrame(submissions_data)


def test_leak_free_checkpoint_4(mock_telemetry):
    att_df, subs_df = mock_telemetry

    # Baseline features at week 4
    feat_baseline = build_temporal_features("std_1", 4, att_df, subs_df)

    # Perturb/corrupt future records (week 5, week 6, week 8)
    att_perturbed = att_df.copy()
    att_perturbed.loc[att_perturbed["week_num"] > 4, "sessions_attended"] = 999
    att_perturbed.loc[att_perturbed["week_num"] > 4, "vle_click_count"] = 50000

    subs_perturbed = subs_df.copy()
    subs_perturbed.loc[subs_perturbed["submission_day"] > 28, "score"] = 0.0

    feat_after_perturbation = build_temporal_features("std_1", 4, att_perturbed, subs_perturbed)

    # Invariant: Features at week 4 must remain strictly identical
    assert feat_baseline == feat_after_perturbation
    assert feat_baseline["rolling_engagement_rate"] == 11.0 / 12.0
    assert feat_baseline["total_vle_clicks"] == 205.0
    assert feat_baseline["assessment_count"] == 2.0
    assert feat_baseline["late_submission_count"] == 1.0


def test_checkpoint_isolation_progression(mock_telemetry):
    att_df, subs_df = mock_telemetry

    feat_w4 = build_temporal_features("std_1", 4, att_df, subs_df)
    feat_w8 = build_temporal_features("std_1", 8, att_df, subs_df)

    # Week 8 should see more submissions and total sessions than Week 4
    assert feat_w8["assessment_count"] > feat_w4["assessment_count"]
    assert feat_w8["total_vle_clicks"] > feat_w4["total_vle_clicks"]


def test_invalid_checkpoint_raises(mock_telemetry):
    att_df, subs_df = mock_telemetry
    with pytest.raises(ValueError):
        build_temporal_features("std_1", 5, att_df, subs_df)
