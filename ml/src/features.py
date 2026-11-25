"""
Feature extraction pipeline for AcadPulse.
Enforces strict leak-free temporal boundaries at checkpoints (Weeks 4, 8, 12).
Demographic attributes are explicitly excluded from model features per AGENTS.md.
"""
from typing import Dict, List, Optional
import numpy as np
import pandas as pd


# Explicit model feature contract (order preserved)
FEATURE_COLUMNS = [
    "rolling_engagement_rate",
    "total_vle_clicks",
    "assessment_count",
    "assessment_score_mean",
    "assessment_score_min",
    "assessment_score_std",
    "avg_submission_delta_days",
    "late_submission_count",
    "prior_attempts_count",
]


def build_temporal_features(
    student_id: str,
    checkpoint_week: int,
    attendance_df: pd.DataFrame,
    submissions_df: pd.DataFrame,
    prior_attempts: int = 0,
) -> Dict[str, float]:
    """
    Build leak-free temporal features for a student at a specific checkpoint week.
    
    CRITICAL INVARIANT:
    Only observations recorded on or before `checkpoint_week` are considered.
    Any records with week_num > checkpoint_week or submission_day > (checkpoint_week * 7)
    must be strictly ignored.
    """
    if checkpoint_week not in [4, 8, 12]:
        raise ValueError(f"Invalid checkpoint week: {checkpoint_week}. Must be 4, 8, or 12.")

    # 1. Filter attendance & VLE telemetry up to checkpoint week
    if not attendance_df.empty:
        student_att = attendance_df[
            (attendance_df["student_id"] == student_id)
            & (attendance_df["week_num"] <= checkpoint_week)
        ]
        total_sessions = student_att["sessions_total"].sum()
        attended_sessions = student_att["sessions_attended"].sum()
        rolling_eng_rate = (
            float(attended_sessions / total_sessions) if total_sessions > 0 else 0.0
        )
        total_clicks = float(student_att["vle_click_count"].sum())
    else:
        rolling_eng_rate = 0.0
        total_clicks = 0.0

    # 2. Filter assessment submissions up to checkpoint cutoff day
    # An assessment belongs to checkpoint week if its due_day <= cutoff_day
    # Submissions recorded after cutoff_day cannot be seen at checkpoint_week
    cutoff_day = checkpoint_week * 7
    if not submissions_df.empty:
        # Observational integrity: student submissions submitted on or before cutoff_day
        student_subs = submissions_df[
            (submissions_df["student_id"] == student_id)
            & (submissions_df["due_day"] <= cutoff_day)
            & (submissions_df["submission_day"] <= cutoff_day)
        ]
        sub_count = len(student_subs)
        if sub_count > 0:
            scores = student_subs["score"].values
            score_mean = float(np.mean(scores))
            score_min = float(np.min(scores))
            score_std = float(np.std(scores)) if sub_count > 1 else 0.0
            
            # Submission punctuality delta: (submission_day - due_day)
            deltas = student_subs["submission_day"].values - student_subs["due_day"].values
            avg_delta = float(np.mean(deltas))
            late_count = int(np.sum(deltas > 0))
        else:
            score_mean = 0.0
            score_min = 0.0
            score_std = 0.0
            avg_delta = 0.0
            late_count = 0
    else:
        sub_count = 0
        score_mean = 0.0
        score_min = 0.0
        score_std = 0.0
        avg_delta = 0.0
        late_count = 0

    return {
        "rolling_engagement_rate": rolling_eng_rate,
        "total_vle_clicks": total_clicks,
        "assessment_count": float(sub_count),
        "assessment_score_mean": score_mean,
        "assessment_score_min": score_min,
        "assessment_score_std": score_std,
        "avg_submission_delta_days": avg_delta,
        "late_submission_count": float(late_count),
        "prior_attempts_count": float(prior_attempts),
    }
