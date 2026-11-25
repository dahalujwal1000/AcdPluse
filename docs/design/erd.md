# AcadPulse System Design: 3NF ERD & Data Dictionary

This document details the normalized Third Normal Form (3NF) relational database schema for PostgreSQL 16. All primary keys are UUIDs.

---

## 1. Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ ENROLLMENTS : has
    COURSES ||--o{ ENROLLMENTS : contains
    COURSES ||--o{ ASSESSMENTS : defines
    ENROLLMENTS ||--o{ ATTENDANCE_LOGS : records
    ENROLLMENTS ||--o{ SUBMISSIONS : submits
    ASSESSMENTS ||--o{ SUBMISSIONS : evaluated_by
    ENROLLMENTS ||--o{ PREDICTION_RUNS : evaluates
    PREDICTION_RUNS ||--o{ INTERVENTIONS : triggers
    USERS ||--o{ INTERVENTIONS : logged_by

    USERS {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        string role "student | teacher | admin"
        timestamp created_at
        timestamp updated_at
    }

    COURSES {
        uuid id PK
        string code UK "e.g. CS101"
        string title
        string term "e.g. 2026-Fall"
        int total_weeks "default 14"
        timestamp created_at
    }

    ASSESSMENTS {
        uuid id PK
        uuid course_id FK
        string title
        string assessment_type "TMA | CMA | Exam"
        int due_week
        int due_day
        numeric weight
        numeric max_score
    }

    ENROLLMENTS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        string status "enrolled | withdrawn | completed"
        int withdrawn_week "nullable"
        string final_result "Pass | Distinction | Fail | Withdrawn"
        timestamp created_at
    }

    ATTENDANCE_LOGS {
        uuid id PK
        uuid enrollment_id FK
        int week_num
        int sessions_attended
        int sessions_total
        int vle_click_count
        timestamp recorded_at
    }

    SUBMISSIONS {
        uuid id PK
        uuid assessment_id FK
        uuid enrollment_id FK
        int submission_day
        numeric score
        timestamp submitted_at
    }

    PREDICTION_RUNS {
        uuid id PK
        uuid enrollment_id FK
        int checkpoint_week "4 | 8 | 12"
        numeric risk_probability
        string risk_tier "Safe | Moderate | High"
        int persona_cluster_id
        jsonb shap_values
        jsonb feature_snapshot
        string model_version
        timestamp created_at
    }

    INTERVENTIONS {
        uuid id PK
        uuid prediction_run_id FK
        uuid instructor_id FK
        string intervention_type "email | meeting | tutoring"
        string notes
        string status "pending | in_progress | completed"
        timestamp created_at
        timestamp updated_at
    }
```

---

## 2. Table Specifications & Indexes

### 2.1 `ATTENDANCE_LOGS` Indexing
- Required Composite Index: `(enrollment_id, week_num)` to optimize temporal feature aggregations at Weeks 4, 8, and 12.

### 2.2 `PREDICTION_RUNS` Immutability Constraint
- Table is append-only.
- Never update rows in place; new inference runs generate a fresh row with `created_at` timestamp.
- Stores local `shap_values` and `feature_snapshot` as JSONB for audit and historical reconstruction.
