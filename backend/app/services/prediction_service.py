"""
Business logic service for predictions and What-If interventions.
Decoupled from HTTP controllers.
"""
from typing import Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.db.models import Enrollment, AttendanceLog, Submission, PredictionRun
from backend.app.ml_runtime.runtime import ml_runtime
from ml.src.features import build_temporal_features
import pandas as pd


class PredictionService:
    @staticmethod
    def run_prediction_for_enrollment(
        db: Session,
        enrollment_id: str,
        checkpoint_week: int,
    ) -> PredictionRun:
        enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enrollment not found",
            )

        # Check if student withdrew before checkpoint week (per AGENTS.md §2.2)
        if enrollment.status == "withdrawn" and enrollment.withdrawn_week and enrollment.withdrawn_week < checkpoint_week:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student withdrew at week {enrollment.withdrawn_week}, prior to checkpoint {checkpoint_week}.",
            )

        # Fetch attendance logs
        att_records = db.query(AttendanceLog).filter(AttendanceLog.enrollment_id == enrollment_id).all()
        att_data = [
            {
                "student_id": enrollment.user_id,
                "week_num": a.week_num,
                "sessions_attended": a.sessions_attended,
                "sessions_total": a.sessions_total,
                "vle_click_count": a.vle_click_count,
            }
            for a in att_records
        ]
        att_df = pd.DataFrame(att_data)

        # Fetch submissions
        subs_records = db.query(Submission).filter(Submission.enrollment_id == enrollment_id).all()
        subs_data = [
            {
                "student_id": enrollment.user_id,
                "due_day": s.assessment.due_day if s.assessment else 14,
                "submission_day": s.submission_day,
                "score": s.score,
            }
            for s in subs_records
        ]
        subs_df = pd.DataFrame(subs_data)

        # Build leak-free feature snapshot
        features = build_temporal_features(
            student_id=enrollment.user_id,
            checkpoint_week=checkpoint_week,
            attendance_df=att_df,
            submissions_df=subs_df,
        )

        # Run ML inference
        pred_output = ml_runtime.predict(features, checkpoint_week)

        # Persist immutable prediction run audit
        run = PredictionRun(
            enrollment_id=enrollment_id,
            checkpoint_week=checkpoint_week,
            risk_probability=pred_output["risk_probability"],
            risk_tier=pred_output["risk_tier"],
            persona_cluster_id=pred_output["persona_cluster_id"],
            shap_values=pred_output["shap_values"],
            feature_snapshot=features,
            model_version=pred_output["model_version"],
        )
        db.add(run)
        db.commit()
        db.refresh(run)
        return run

    @staticmethod
    def simulate_whatif_for_enrollment(
        db: Session,
        enrollment_id: str,
        checkpoint_week: int,
    ) -> Dict[str, Any]:
        enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Enrollment not found",
            )

        # Re-fetch or extract features
        att_records = db.query(AttendanceLog).filter(AttendanceLog.enrollment_id == enrollment_id).all()
        att_df = pd.DataFrame([
            {
                "student_id": enrollment.user_id,
                "week_num": a.week_num,
                "sessions_attended": a.sessions_attended,
                "sessions_total": a.sessions_total,
                "vle_click_count": a.vle_click_count,
            }
            for a in att_records
        ])

        subs_records = db.query(Submission).filter(Submission.enrollment_id == enrollment_id).all()
        subs_df = pd.DataFrame([
            {
                "student_id": enrollment.user_id,
                "due_day": s.assessment.due_day if s.assessment else 14,
                "submission_day": s.submission_day,
                "score": s.score,
            }
            for s in subs_records
        ])

        features = build_temporal_features(
            student_id=enrollment.user_id,
            checkpoint_week=checkpoint_week,
            attendance_df=att_df,
            submissions_df=subs_df,
        )

        return ml_runtime.simulate_whatif(features, checkpoint_week)
