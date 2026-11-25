from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    type: Optional[str] = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = Field(..., pattern="^(student|teacher|admin)$")


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


# Prediction & ML Schemas
class PredictRequest(BaseModel):
    enrollment_id: str
    checkpoint_week: int = Field(..., description="Checkpoint week: 4, 8, or 12")


class PredictResponse(BaseModel):
    run_id: str
    enrollment_id: str
    checkpoint_week: int
    risk_probability: float
    risk_tier: str
    persona_cluster_id: int
    shap_values: Dict[str, float]
    feature_snapshot: Dict[str, float]
    model_version: str
    created_at: datetime


class WhatIfRequest(BaseModel):
    enrollment_id: str
    checkpoint_week: int = 8
    target_risk_tier: str = "Safe"


class WhatIfResponse(BaseModel):
    feasible: bool
    already_safe: bool
    current_risk: float
    target_risk: Optional[float] = None
    delta_engagement: Optional[float] = None
    delta_score: Optional[float] = None
    target_engagement: Optional[float] = None
    target_score: Optional[float] = None
    cost: Optional[float] = None
    plan_description: str


# Intervention Schemas
class InterventionCreate(BaseModel):
    prediction_run_id: str
    intervention_type: str = Field(..., pattern="^(email|meeting|tutoring)$")
    notes: str


class InterventionResponse(BaseModel):
    id: str
    prediction_run_id: str
    instructor_id: str
    intervention_type: str
    notes: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
