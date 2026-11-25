from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.db.models import User, PredictionRun, Intervention
from backend.app.core.deps import get_current_user, require_role
from backend.app.schemas.schemas import InterventionCreate, InterventionResponse
from typing import List

router = APIRouter(prefix="/interventions", tags=["Interventions"])


@router.post("", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
def create_intervention(
    body: InterventionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher"])),
):
    run = db.query(PredictionRun).filter(PredictionRun.id == body.prediction_run_id).first()
    if not run:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction run not found",
        )

    intervention = Intervention(
        prediction_run_id=body.prediction_run_id,
        instructor_id=current_user.id,
        intervention_type=body.intervention_type,
        notes=body.notes,
        status="pending",
    )
    db.add(intervention)
    db.commit()
    db.refresh(intervention)
    return intervention


@router.get("/by-run/{run_id}", response_model=List[InterventionResponse])
def get_interventions_for_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["teacher", "admin"])),
):
    return db.query(Intervention).filter(Intervention.prediction_run_id == run_id).all()
