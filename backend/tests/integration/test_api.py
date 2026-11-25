import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.db.models import User, Course, Enrollment, AttendanceLog, Submission, Assessment

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def test_auth_registration_and_login(client):
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": "teacher1@example.com",
            "password": "Password123!",
            "full_name": "Dr. Sarah Adams",
            "role": "teacher",
        },
    )
    assert reg_res.status_code == 201

    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": "teacher1@example.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token = login_res.json()
    assert "access_token" in token


def test_student_data_isolation_negative_rbac(client, db_session):
    reg_res_a = client.post("/api/v1/auth/register", json={"email": "stdA@example.com", "password": "Password123!", "full_name": "Student A", "role": "student"})
    assert reg_res_a.status_code == 201
    reg_res_b = client.post("/api/v1/auth/register", json={"email": "stdB@example.com", "password": "Password123!", "full_name": "Student B", "role": "student"})
    assert reg_res_b.status_code == 201

    user_b_id = reg_res_b.json()["id"]

    course = Course(code="CS201", title="Algorithms", term="2026-Fall")
    db_session.add(course)
    db_session.commit()

    # Enrollment for student B
    enr_b = Enrollment(user_id=user_b_id, course_id=course.id, status="enrolled")
    db_session.add(enr_b)
    db_session.commit()

    # Login as student A
    tok_a = client.post("/api/v1/auth/login", data={"username": "stdA@example.com", "password": "Password123!"}).json()["access_token"]

    # Student A attempts to run prediction on Student B's enrollment
    headers = {"Authorization": f"Bearer {tok_a}"}
    forbidden_res = client.post(
        "/api/v1/predict",
        json={"enrollment_id": enr_b.id, "checkpoint_week": 4},
        headers=headers,
    )
    # Must reject with 403 Forbidden per AGENTS.md §2.4
    assert forbidden_res.status_code == 403


def test_predict_and_whatif_pipeline(client, db_session):
    # Login as teacher
    tok = client.post("/api/v1/auth/login", data={"username": "teacher1@example.com", "password": "Password123!"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {tok}"}

    # Register student C
    reg_c = client.post("/api/v1/auth/register", json={"email": "stdC@example.com", "password": "Password123!", "full_name": "Student C", "role": "student"}).json()
    user_c_id = reg_c["id"]

    course = db_session.query(Course).first()
    enr = Enrollment(user_id=user_c_id, course_id=course.id, status="enrolled")
    db_session.add(enr)
    db_session.commit()

    # Add mock attendance logs
    att = AttendanceLog(enrollment_id=enr.id, week_num=4, sessions_attended=2, sessions_total=4, vle_click_count=45)
    db_session.add(att)
    db_session.commit()

    # Predict
    pred_res = client.post("/api/v1/predict", json={"enrollment_id": enr.id, "checkpoint_week": 4}, headers=headers)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    assert "risk_probability" in pred_data
    assert "shap_values" in pred_data
    assert "persona_cluster_id" in pred_data

    # What-If
    whatif_res = client.post("/api/v1/whatif", json={"enrollment_id": enr.id, "checkpoint_week": 4}, headers=headers)
    assert whatif_res.status_code == 200
    whatif_data = whatif_res.json()
    assert "feasible" in whatif_data
    assert "plan_description" in whatif_data
