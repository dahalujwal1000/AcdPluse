# System Requirements Specification (SRS)
## AcadPulse: Explainable Academic Early-Warning & Counterfactual Intervention System

**Author:** Ujwal  
**Degree:** Bachelor (Honours) of Information Technology, Lincoln University College  
**Date:** November 2026  
**Document Version:** 1.0.0  

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **AcadPulse**, an explainable academic early-warning and counterfactual intervention system. AcadPulse empowers educators and academic advisors to identify at-risk students proactively during a semester (at Weeks 4, 8, and 12) rather than reactively post-examinations.

### 1.2 Scope
AcadPulse encompasses:
- Temporal, leak-free feature extraction from student telemetry and assessment history.
- Unsupervised learner persona clustering ($k$-Means).
- Supervised academic risk classification (XGBoost, Random Forest, Logistic Regression).
- Local explainability via Tree SHAP feature attributions.
- Actionable counterfactual simulation computing minimum-effort behavioral paths to reach "Safe" status.
- Role-based web dashboards for Students, Teachers, and Administrators.

### 1.3 Definitions, Acronyms, and Abbreviations
- **XAI:** Explainable Artificial Intelligence.
- **SHAP:** SHapley Additive exPlanations.
- **OULAD:** Open University Learning Analytics Dataset.
- **VLE:** Virtual Learning Environment.
- **RBAC:** Role-Based Access Control.
- **3NF:** Third Normal Form.
- **Checkpoint:** Observation boundary ($t \in \{4, 8, 12\}$ weeks).

---

## 2. Overall Description

### 2.1 Product Perspective
AcadPulse is a self-contained, 4-tier web application running 100% locally with no external commercial LLM or prediction API dependencies:
1. **Presentation Tier:** Next.js / React (TypeScript), Tailwind CSS, Recharts.
2. **API & Auth Tier:** FastAPI (Python 3.11), SQLAlchemy 2.0, Pydantic, OAuth2/JWT.
3. **ML / XAI Engine:** scikit-learn, XGBoost, SHAP, NumPy, Pandas, Joblib.
4. **Data & Storage Tier:** PostgreSQL 16 (3NF, UUID keys), Alembic migrations, local `.joblib` model registry.

### 2.2 User Classes and Characteristics
- **Student:** Can view personal risk trajectory, personal SHAP explanations, and interact with the "What-If" counterfactual scenario sliders.
- **Teacher / Advisor:** Can monitor assigned course cohorts, filter by risk tiers, inspect individual SHAP waterfall plots, persona tags, and log interventions.
- **Administrator:** Read-only institutional analytics, cohort heatmaps, CSV telemetry ingestion triggers, and fairness/calibration audit summaries.

---

## 3. Specific System Requirements

### 3.1 Functional Requirements (FR)

| Req ID | Title | Description | Role |
|---|---|---|---|
| **FR-AUTH-01** | User Authentication | System shall authenticate users via OAuth2 password flow with JWT access and refresh tokens. | All |
| **FR-AUTH-02** | Role-Based Access Guard | System shall restrict endpoint access based on assigned roles (Student, Teacher, Admin). | All |
| **FR-ING-01** | Telemetry Ingestion | System shall validate and ingest batch CSV student telemetry (assessments, attendance, VLE clicks). | Admin / Teacher |
| **FR-ML-01** | Temporal Feature Pipeline | System shall generate temporal feature checkpoints ($t=4, 8, 12$) strictly using observations recorded on or before week $t$. | System |
| **FR-ML-02** | Learner Persona Clustering | System shall segment students into $k$-Means personas ($k=3$) based on engagement vectors. | System |
| **FR-ML-03** | Risk Classification | System shall estimate probability of academic risk ($P(\text{Risk})$) and categorize into Safe ($<0.35$), Moderate ($0.35$–$0.65$), or High ($\ge 0.65$). | System |
| **FR-ML-04** | SHAP Attribution | System shall calculate local SHAP feature attributions for every prediction and persist them in JSONB audit records. | System |
| **FR-SIM-01** | Counterfactual What-If Simulator | System shall find the minimum cost behavioral change vector $\Delta x$ over actionable features to achieve $P(\text{Risk} \mid x + \Delta x) < 0.35$. | Student / Teacher |
| **FR-INT-01** | Intervention Tracking | Teachers shall record intervention logs (advising notes, tutoring referrals) tied to student prediction runs. | Teacher |
| **FR-AUD-01** | Fairness & Calibration Audit | System shall provide offline/read-only audit views for model error rates across demographic groups (gender, region, disability). | Admin |

### 3.2 Non-Functional Requirements (NFR)

- **NFR-PERF-01 (Inference Latency):** $p95$ prediction latency including SHAP computation must remain $< 100\text{ ms}$ on development hardware.
- **NFR-SEC-01 (Password Security):** All user credentials must be hashed using bcrypt (cost factor $\ge 12$). Plaintext passwords must never be logged or stored.
- **NFR-SEC-02 (Data Isolation):** Students must strictly access only their own individual data. Cross-student access returns HTTP 403 Forbidden.
- **NFR-DAT-01 (Temporal Leak-Free Guarantee):** No future information ($> t$) may be accessible during feature extraction for checkpoint $t$.
- **NFR-DAT-02 (Audit Immutability):** Records in `PREDICTION_RUNS` must be append-only with UUID primary keys and timestamps.
- **NFR-REL-01 (Reproducibility):** All model evaluation benchmarks, random seeds, and artifact versions must be reproducible and logged.
