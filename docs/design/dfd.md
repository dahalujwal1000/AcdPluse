# AcadPulse Data Flow Diagrams (DFD)

This document specifies the Data Flow Diagrams across Level 0 (Context), Level 1 (Subsystems), and Level 2 (Decomposition of Process 4.0 & 5.0).

---

## 1. DFD Level 0 — Context Diagram

```mermaid
flowchart TD
    subgraph External_Entities [External Entities]
        Student["Student"]
        Teacher["Teacher / Academic Advisor"]
        Admin["Administrator"]
    end

    System(("0.0 AcadPulse System"))

    Student -->|Telemetry Clicks / Sliders| System
    System -->|Risk Trajectory & What-If Targets| Student

    Teacher -->|Intervention Notes & Marks| System
    System -->|Cohort Risk Roster & SHAP Explanations| Teacher

    Admin -->|Batch CSV Telemetry / Checkpoint Trigger| System
    System -->|Audit Logs, Calibration & Fairness Reports| Admin
```

---

## 2. DFD Level 1 — Subsystem Data Flow

```mermaid
flowchart TD
    %% Entities
    U["Users (Student / Teacher / Admin)"]
    ADM["Admin / Ingestion Source"]

    %% Processes
    P1(("1.0 Authentication & RBAC"))
    P2(("2.0 Ingestion & Telemetry"))
    P3(("3.0 Temporal Feature Builder"))
    P4(("4.0 ML Risk & SHAP Inference"))
    P5(("5.0 Counterfactual Simulator"))
    P6(("6.0 Intervention & Cohort Reporting"))

    %% Data Stores
    D1[("D1 Users & Courses")]
    D2[("D2 Attendance & Marks")]
    D3[("D3 Predictions & Logs")]
    D4[("D4 .joblib Model Registry")]

    %% Flows
    U -->|Login Credentials| P1
    P1 <-->|Verify User & Role| D1
    P1 -->|JWT Claims| U

    ADM -->|Batch CSV Records| P2
    P2 -->|Persist Logs & Submissions| D2

    D2 -->|Raw Records up to Week t| P3
    P3 -->|Leak-Free Feature Vector x_t| P4

    D4 -->|Trained Models & Scalers| P4
    P4 -->|Store Risk Prob, Personas, SHAP| D3
    D3 -->|Display Risk & SHAP Waterfall| U

    U -->|Adjust What-If Targets| P5
    D3 -->|Current State x_t| P5
    D4 -->|Risk Classifier| P5
    P5 -->|Feasible Support Plan Δx| U

    U -->|Log Interventions| P6
    P6 <-->|Read / Write Interventions| D3
```

---

## 3. DFD Level 2 — Process 4.0 & 5.0 (ML Inference & Counterfactual Engine)

```mermaid
flowchart TD
    %% Input
    Feat["Feature Vector (Week t)"]

    subgraph Process_4 ["4.0 ML Risk & SHAP Inference Engine"]
        P4_1(("4.1 Standardize & Scale Features"))
        P4_2(("4.2 k-Means Persona Clustering"))
        P4_3(("4.3 XGBoost Risk Probability Estimation"))
        P4_4(("4.4 Tree SHAP Attribution Computation"))
    end

    Feat --> P4_1
    P4_1 -->|Scaled x| P4_2
    P4_1 -->|Scaled x| P4_3
    P4_3 -->|Risk Score| P4_4

    subgraph Process_5 ["5.0 Counterfactual What-If Simulator"]
        P5_1(("5.1 Define Bounded Actionable Search Grid"))
        P5_2(("5.2 Evaluate Cost: w_e * Δeng + w_s * Δscore"))
        P5_3(("5.3 Filter Candidates P(Risk | x + Δx) < 0.35"))
        P5_4(("5.4 Select Min-Cost Plan"))
    end

    P4_1 -->|Current Baseline x| P5_1
    P5_1 --> P5_2
    P5_2 --> P5_3
    P5_3 --> P5_4
    P5_4 --> TargetPlan["Optimal Feasible Counterfactual Plan"]
```
