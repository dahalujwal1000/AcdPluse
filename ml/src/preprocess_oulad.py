"""
Preprocesses raw OULAD CSV files into leak-free checkpoint feature matrices (Weeks 4, 8, 12).
Rules strictly adhered to (per AGENTS.md §2.2, §3.3):
1. No future leakage: Checkpoint t sees only data up to week t (cutoff day = t * 7).
2. Students withdrawn before checkpoint t are excluded.
3. Label definition: At-Risk = 1 if final_result in ['Fail', 'Withdrawn'], else 0 (Pass / Distinction).
4. Demographic attributes are saved SEPARATELY for offline fairness audits, never as model features.
"""
from pathlib import Path
import pandas as pd
import numpy as np

RAW_DIR = Path("ml/data/raw/oulad")
PROCESSED_DIR = Path("ml/data/processed")


def preprocess_checkpoints(sample_frac: float = 1.0):
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    print("Loading raw OULAD tables...")
    try:
        student_info = pd.read_csv(RAW_DIR / "studentInfo.csv")
        student_reg = pd.read_csv(RAW_DIR / "studentRegistration.csv")
        student_vle = pd.read_csv(RAW_DIR / "studentVle.csv")
        student_assessment = pd.read_csv(RAW_DIR / "studentAssessment.csv")
        assessments = pd.read_csv(RAW_DIR / "assessments.csv")
    except FileNotFoundError as e:
        print(f"Required raw CSV not found: {e}. Please run `python ml/src/download_data.py` first.")
        return

    # Unique identifier per student module presentation
    student_info["student_key"] = (
        student_info["code_module"] + "_" + student_info["code_presentation"] + "_" + student_info["id_student"].astype(str)
    )
    student_reg["student_key"] = (
        student_reg["code_module"] + "_" + student_reg["code_presentation"] + "_" + student_reg["id_student"].astype(str)
    )

    # Merge unregistration day to identify withdrawals
    student_meta = student_info.merge(
        student_reg[["student_key", "date_unregistration"]],
        on="student_key",
        how="left",
    )

    # Label definition: At-Risk (1) vs Safe/Successful (0)
    student_meta["is_at_risk"] = student_meta["final_result"].isin(["Fail", "Withdrawn"]).astype(int)

    # Prepare assessment info
    assessment_merged = student_assessment.merge(
        assessments[["id_assessment", "code_module", "code_presentation", "date", "weight"]],
        on="id_assessment",
        how="inner",
    )
    assessment_merged["student_key"] = (
        assessment_merged["code_module"] + "_" + assessment_merged["code_presentation"] + "_" + assessment_merged["id_student"].astype(str)
    )

    # Prepare VLE interaction
    student_vle["student_key"] = (
        student_vle["code_module"] + "_" + student_vle["code_presentation"] + "_" + student_vle["id_student"].astype(str)
    )

    # Build feature matrices for checkpoints 4, 8, and 12
    for week in [4, 8, 12]:
        cutoff_day = week * 7
        print(f"\nBuilding leak-free features for Checkpoint Week {week} (cutoff day <= {cutoff_day})...")

        # Exclude students who withdrew before checkpoint week
        # date_unregistration is relative to start of module (day 0)
        active_students = student_meta[
            student_meta["date_unregistration"].isna() | (student_meta["date_unregistration"] > cutoff_day)
        ].copy()

        # 1. Temporal VLE clicks up to cutoff_day
        vle_cutoff = student_vle[student_vle["date"] <= cutoff_day]
        vle_summary = vle_cutoff.groupby("student_key").agg(
            total_vle_clicks=("sum_click", "sum"),
            active_days=("date", "nunique"),
        ).reset_index()

        # VLE engagement rate = active_days / total_days_so_far
        vle_summary["rolling_engagement_rate"] = vle_summary["active_days"] / float(cutoff_day)
        vle_summary["rolling_engagement_rate"] = vle_summary["rolling_engagement_rate"].clip(0.0, 1.0)

        # 2. Temporal Assessment performance up to cutoff_day
        # Must have assessment due date <= cutoff_day AND submitted on/before cutoff_day
        sub_cutoff = assessment_merged[
            (assessment_merged["date"] <= cutoff_day) & (assessment_merged["date_submitted"] <= cutoff_day)
        ]

        if not sub_cutoff.empty:
            sub_cutoff["score"] = pd.to_numeric(sub_cutoff["score"], errors="coerce").fillna(0.0)
            sub_cutoff["delta_days"] = sub_cutoff["date_submitted"] - sub_cutoff["date"]
            sub_cutoff["is_late"] = (sub_cutoff["delta_days"] > 0).astype(int)

            sub_summary = sub_cutoff.groupby("student_key").agg(
                assessment_count=("id_assessment", "count"),
                assessment_score_mean=("score", "mean"),
                assessment_score_min=("score", "min"),
                assessment_score_std=("score", "std"),
                avg_submission_delta_days=("delta_days", "mean"),
                late_submission_count=("is_late", "sum"),
            ).reset_index()
            sub_summary["assessment_score_std"] = sub_summary["assessment_score_std"].fillna(0.0)
        else:
            sub_summary = pd.DataFrame(columns=[
                "student_key", "assessment_count", "assessment_score_mean",
                "assessment_score_min", "assessment_score_std",
                "avg_submission_delta_days", "late_submission_count",
            ])

        # Merge features onto active students
        merged = active_students.merge(vle_summary, on="student_key", how="left")
        merged = merged.merge(sub_summary, on="student_key", how="left")

        # Fill missing values for students with 0 clicks or no early submissions
        merged["rolling_engagement_rate"] = merged["rolling_engagement_rate"].fillna(0.0)
        merged["total_vle_clicks"] = merged["total_vle_clicks"].fillna(0.0)
        merged["assessment_count"] = merged["assessment_count"].fillna(0.0)
        merged["assessment_score_mean"] = merged["assessment_score_mean"].fillna(0.0)
        merged["assessment_score_min"] = merged["assessment_score_min"].fillna(0.0)
        merged["assessment_score_std"] = merged["assessment_score_std"].fillna(0.0)
        merged["avg_submission_delta_days"] = merged["avg_submission_delta_days"].fillna(0.0)
        merged["late_submission_count"] = merged["late_submission_count"].fillna(0.0)
        merged["prior_attempts_count"] = pd.to_numeric(merged["num_of_prev_attempts"], errors="coerce").fillna(0.0)

        # Feature order per model contract
        feature_cols = [
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

        # Audit columns (demographics preserved ONLY for offline fairness audits, NEVER model inputs)
        audit_cols = [
            "student_key",
            "gender",
            "region",
            "highest_education",
            "imd_band",
            "age_band",
            "disability",
            "final_result",
            "is_at_risk",
        ]

        output_df = merged[audit_cols + feature_cols].copy()

        out_path = PROCESSED_DIR / f"oulad_checkpoint_w{week}.csv"
        output_df.to_csv(out_path, index=False)
        print(f"Saved {len(output_df)} samples to {out_path} (At-Risk rate: {output_df['is_at_risk'].mean():.2%})")

    print("\nOULAD Checkpoint preprocessing completed successfully.")


if __name__ == "__main__":
    preprocess_checkpoints()
