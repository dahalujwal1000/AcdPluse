# AcadPulse UML Diagrams

This document contains Unified Modeling Language (UML) specifications: Use-Case Diagram, Class Diagram, Sequence Diagram (Inference & SHAP), and Activity Diagram (What-If Solver).

---

## 1. Use-Case Diagram

```mermaid
flowchart LR
    Student((Student))
    Teacher((Teacher / Advisor))
    Admin((Administrator))

    subgraph AcadPulse ["AcadPulse System Boundaries"]
        UC1["Authenticate (OAuth2/JWT)"]
        UC2["View Personal Risk Trajectory"]
        UC3["Simulate Counterfactual What-If"]
        UC4["View Course Risk Roster"]
        UC5["Inspect SHAP Waterfall Plot"]
        UC6["Record Intervention Log"]
        UC7["Trigger Batch Ingestion & Telemetry"]
        UC8["View Fairness & Calibration Audits"]
    end

    Student --> UC1
    Student --> UC2
    Student --> UC3

    Teacher --> UC1
    Teacher --> UC4
    Teacher --> UC5
    Teacher --> UC6
    Teacher --> UC3

    Admin --> UC1
    Admin --> UC7
    Admin --> UC8
```

---

## 2. Class Diagram (Core Domain & ML Engine)

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String password_hash
        +String role
        +verify_password(String password) bool
    }

    class Course {
        +UUID id
        +String code
        +String title
        +int total_weeks
    }

    class Enrollment {
        +UUID id
        +UUID user_id
        +UUID course_id
        +String status
        +String final_result
    }

    class PredictionRun {
        +UUID id
        +UUID enrollment_id
        +int checkpoint_week
        +float risk_probability
        +String risk_tier
        +int persona_cluster_id
        +dict shap_values
        +datetime created_at
    }

    class MLArtifactLoader {
        -dict models
        -dict scalers
        -dict kmeans
        +load_artifacts(String version)
        +get_model(int checkpoint) Model
    }

    class RiskPredictor {
        +predict_risk(dict features, int checkpoint) PredictionResult
        +compute_shap(dict features, int checkpoint) dict
    }

    class CounterfactualSolver {
        +solve(dict baseline, float target_threshold) CounterfactualResult
        -cost_function(dict delta) float
    }

    User "1" --> "0..*" Enrollment
    Course "1" --> "0..*" Enrollment
    Enrollment "1" --> "0..*" PredictionRun
    RiskPredictor ..> MLArtifactLoader : uses
    CounterfactualSolver ..> RiskPredictor : evaluates
```

---

## 3. Sequence Diagram — Inference & SHAP Pipeline

```mermaid
sequenceDiagram
    autonumber
    actor Client as Teacher / Student
    participant API as FastAPI Router
    participant Service as InferenceService
    participant Loader as MLArtifactLoader
    participant Model as XGBoost Classifier
    participant TreeExplainer as SHAP Explainer
    participant DB as PostgreSQL DB

    Client->>API: POST /api/v1/predict/cohort (or /predict/{enrollment_id})
    API->>Service: run_inference(enrollment_id, checkpoint=8)
    Service->>DB: Fetch attendance & assessments up to Week 8
    DB-->>Service: Return raw records
    Service->>Service: Build leak-free feature vector x_8
    Service->>Loader: get_artifacts(checkpoint=8)
    Loader-->>Service: model, scaler, explainer
    Service->>Model: predict_proba(x_8_scaled)
    Model-->>Service: risk_prob = 0.72 (High)
    Service->>TreeExplainer: shap_values(x_8_scaled)
    TreeExplainer-->>Service: attributions_dict
    Service->>DB: INSERT into PREDICTION_RUNS
    DB-->>Service: saved run_id
    Service-->>API: InferenceResponse (risk_tier, risk_prob, persona, shap)
    API-->>Client: HTTP 200 OK JSON
```

---

## 4. Activity Diagram — Counterfactual "What-If" Optimization

```mermaid
flowchart TD
    Start([Start What-If Simulation]) --> FetchCurrent[Fetch baseline features x and model for checkpoint t]
    FetchCurrent --> FixFeatures[Fix immutable & demographic features]
    FixFeatures --> InitGrid[Initialize bounded grid over actionable features: attendance, submissions, quiz study]
    InitGrid --> LoopGrid[Generate candidate perturbed feature vector x_prime = x + delta_x]
    LoopGrid --> EvalModel[Evaluate P_risk = Model.predict_proba x_prime]
    EvalModel --> CheckSafe{Is P_risk < 0.35?}
    CheckSafe -- Yes --> ComputeCost[Calculate Cost = w_e * delta_eng + w_s * delta_score]
    ComputeCost --> RecordCandidate[Record as feasible candidate]
    CheckSafe -- No --> CheckNext{More grid points?}
    RecordCandidate --> CheckNext
    CheckNext -- Yes --> LoopGrid
    CheckNext -- No --> FindMin{Any feasible candidate found?}
    FindMin -- Yes --> ReturnMin[Return candidate with minimum cost]
    FindMin -- No --> ReturnNone[Return: No feasible plan exists within bounds]
    ReturnMin --> End([End Simulation])
    ReturnNone --> End
```
