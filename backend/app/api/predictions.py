from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, Enrollment
from backend.app.core.deps import get_current_user, require_role
from backend.app.schemas.schemas import PredictRequest, PredictResponse, WhatIfRequest, WhatIfResponse
from backend.app.services.prediction_service import PredictionService

router = APIRouter(tags=["Predictions & What-If"])


@router.post("/predict", response_model=PredictResponse)
def predict_student_risk(
    req: PredictRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce strict student data isolation (AGENTS.md §2.4)
    if current_user.role == "student":
        enrollment = db.query(Enrollment).filter(Enrollment.id == req.enrollment_id).first()
        if not enrollment or enrollment.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You can only access your own academic prediction runs.",
            )

    run = PredictionService.run_prediction_for_enrollment(
        db=db,
        enrollment_id=req.enrollment_id,
        checkpoint_week=req.checkpoint_week,
    )

    return PredictResponse(
        run_id=run.id,
        enrollment_id=run.enrollment_id,
        checkpoint_week=run.checkpoint_week,
        risk_probability=run.risk_probability,
        risk_tier=run.risk_tier,
        persona_cluster_id=run.persona_cluster_id,
        shap_values=run.shap_values,
        feature_snapshot=run.feature_snapshot,
        model_version=run.model_version,
        created_at=run.created_at,
    )


@router.post("/whatif", response_model=WhatIfResponse)
def simulate_counterfactual_intervention(
    req: WhatIfRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Enforce student data isolation
    if current_user.role == "student":
        enrollment = db.query(Enrollment).filter(Enrollment.id == req.enrollment_id).first()
        if not enrollment or enrollment.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: You can only simulate What-If scenarios for your own records.",
            )

    res = PredictionService.simulate_whatif_for_enrollment(
        db=db,
        enrollment_id=req.enrollment_id,
        checkpoint_week=req.checkpoint_week,
    )

    return WhatIfResponse(**res)
