# AcadPulse

**Explainable Academic Early-Warning & Counterfactual Intervention System**

AcadPulse is an individual Bachelor of Information Technology (Honours) final-year project at Lincoln University College. It aims to help educators identify students who may benefit from support during the semester, understand the factors associated with a risk prediction, and explore feasible support scenarios.

> **Project status:** In progress. The project repository and GitHub setup are complete. Features, datasets, model results, and deployment are not yet represented as completed unless explicitly documented here.

## Project goals

AcadPulse is planned to:

- Estimate academic risk at Week 4, Week 8, and Week 12 using only information available by each checkpoint.
- Group learners into interpretable engagement personas.
- Explain predictions with SHAP feature attributions.
- Explore bounded, minimum-cost behavioural changes that may move a prediction below the Safe-risk threshold.
- Provide role-based experiences for students, teachers, and administrators.

Predictions and What-If scenarios are intended as support guidance based on historical patterns, not guarantees or causal claims. The product will use the term **Support Priority** rather than stigmatizing labels.

## Planned technology

| Area | Planned technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS, Recharts |
| Backend | Python 3.11, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic |
| Database | PostgreSQL 16, Alembic |
| ML and explainability | scikit-learn, XGBoost, SHAP, NumPy, Pandas, Joblib |
| Authentication | OAuth2, JWT access/refresh tokens, bcrypt, role-based guards |
| Testing and delivery | Pytest, React Testing Library, Docker Compose, GitHub Actions |

The intended product and ML pipeline run locally and do not depend on a commercial LLM or external prediction API. Model training is planned as an offline process; the online API will load serialized model artifacts.

## Planned repository structure

```text
.
├── AGENTS.md
├── README.md
├── .env.example
├── docker-compose.yml
├── .github/
│   └── workflows/
│       └── ci.yml
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── ml_runtime/
│   ├── alembic/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── tests/
├── ml/
│   ├── data/
│   ├── src/
│   ├── notebooks/
│   ├── artifacts/
│   └── tests/
└── docs/
    ├── proposal/
    ├── srs/
    ├── design/
    ├── ai-report/
    ├── test-report/
    ├── final-report/
    ├── adr/
    └── deployment/
```

This is the intended structure; directories and components should be treated as planned until they exist in the repository.

## Project phases

1. **Requirements and design** — requirements, normalized data model, process diagrams, UML, and report drafts.
2. **Data pipeline and ML** — reproducible data processing, leak-free temporal features, cross-validation, model comparison, explainability, counterfactual prototype, and fairness audit.
3. **Backend API and authentication** — database models and migrations, role-based access, ingestion, inference, What-If, and cohort endpoints.
4. **Frontend and explainability UI** — role-based portals, prediction explanations, What-If controls, and accessible loading/error/empty states.
5. **Testing, deployment, and thesis** — end-to-end verification, measured performance, deployment documentation, final report, and release.

Phases are intended to be completed in order. Reported model metrics and performance measurements will come from reproducible runs; targets will not be presented as achieved results.

## Data and ML integrity

- A checkpoint model must use only observations recorded on or before that checkpoint.
- Final outcomes are labels only, not model inputs.
- Preprocessing and clustering must be fitted within training folds.
- Demographic attributes are reserved for offline fairness auditing and are not model features.
- Students withdrawn before a checkpoint are excluded from that checkpoint's cohort.
- Raw datasets and large model artifacts are not committed to Git.
- The OULAD VLE activity signal is an engagement proxy, not classroom attendance. UCI data is secondary and is not used to create weekly checkpoints.

## Security and privacy principles

- Store bcrypt password hashes; never log or return plaintext passwords.
- Protect endpoints with explicit role guards and enforce student/teacher data isolation.
- Validate inputs with Pydantic and access the database through SQLAlchemy.
- Keep secrets in a local, ignored `.env` file; commit only a safe `.env.example`.
- Treat prediction runs as an immutable audit trail.

## Development setup

The application setup instructions will be added after the backend, frontend, database, and environment configuration have been established and verified. No claim is made yet that a fresh clone can run the full application.

Planned local commands (subject to verification as the project is implemented):

```bash
# Planned full-stack startup
 docker compose up --build
```

## Documentation

Project documentation is planned under `docs/`, including the proposal, SRS, system design, AI model training and evaluation report, test report, final report, and deployment guide. Architecture and data-contract decisions that change the agreed design will be recorded as ADRs in `docs/adr/`.

## Academic project

- **Programme:** Bachelor (Honours) of Information Technology
- **Institution:** Lincoln University College
- **Project owner:** Ujwal
- **Target submission:** November 2026
