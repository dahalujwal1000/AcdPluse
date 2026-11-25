import uuid
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Index,
    JSON,
    Text,
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # student | teacher | admin
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="instructor")


class Course(Base):
    __tablename__ = "courses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    term = Column(String(50), nullable=False)
    total_weeks = Column(Integer, default=14, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="course", cascade="all, delete-orphan")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    title = Column(String(255), nullable=False)
    assessment_type = Column(String(50), nullable=False)  # TMA | CMA | Exam
    due_week = Column(Integer, nullable=False)
    due_day = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    max_score = Column(Float, default=100.0, nullable=False)

    course = relationship("Course", back_populates="assessments")
    submissions = relationship("Submission", back_populates="assessment")


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    course_id = Column(String(36), ForeignKey("courses.id"), nullable=False)
    status = Column(String(50), default="enrolled", nullable=False)  # enrolled | withdrawn | completed
    withdrawn_week = Column(Integer, nullable=True)
    final_result = Column(String(50), nullable=True)  # Pass | Distinction | Fail | Withdrawn
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")
    attendance_logs = relationship("AttendanceLog", back_populates="enrollment", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="enrollment", cascade="all, delete-orphan")
    prediction_runs = relationship("PredictionRun", back_populates="enrollment", cascade="all, delete-orphan")


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    enrollment_id = Column(String(36), ForeignKey("enrollments.id"), nullable=False)
    week_num = Column(Integer, nullable=False)
    sessions_attended = Column(Integer, default=0, nullable=False)
    sessions_total = Column(Integer, default=0, nullable=False)
    vle_click_count = Column(Integer, default=0, nullable=False)
    recorded_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    enrollment = relationship("Enrollment", back_populates="attendance_logs")

    __table_args__ = (
        Index("idx_enrollment_week", "enrollment_id", "week_num"),
    )


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    assessment_id = Column(String(36), ForeignKey("assessments.id"), nullable=False)
    enrollment_id = Column(String(36), ForeignKey("enrollments.id"), nullable=False)
    submission_day = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    assessment = relationship("Assessment", back_populates="submissions")
    enrollment = relationship("Enrollment", back_populates="submissions")


class PredictionRun(Base):
    """
    Immutable audit trail for inference runs.
    Never update rows in place; insert a new run.
    """
    __tablename__ = "prediction_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    enrollment_id = Column(String(36), ForeignKey("enrollments.id"), nullable=False)
    checkpoint_week = Column(Integer, nullable=False)  # 4 | 8 | 12
    risk_probability = Column(Float, nullable=False)
    risk_tier = Column(String(50), nullable=False)  # Safe | Moderate | High
    persona_cluster_id = Column(Integer, nullable=False)
    shap_values = Column(JSON, nullable=False)
    feature_snapshot = Column(JSON, nullable=False)
    model_version = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    enrollment = relationship("Enrollment", back_populates="prediction_runs")
    interventions = relationship("Intervention", back_populates="prediction_run")


class Intervention(Base):
    __tablename__ = "interventions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    prediction_run_id = Column(String(36), ForeignKey("prediction_runs.id"), nullable=False)
    instructor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    intervention_type = Column(String(50), nullable=False)  # email | meeting | tutoring
    notes = Column(Text, nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending | in_progress | completed
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    prediction_run = relationship("PredictionRun", back_populates="interventions")
    instructor = relationship("User", back_populates="interventions")
