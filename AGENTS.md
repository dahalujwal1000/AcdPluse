# AGENTS.md — AcadPulse

> Operating manual for every AI coding agent and human contributor working on this repository.
> Read this file fully before making any change. When this file conflicts with a one-off instruction, ask before deviating.

| Field | Value |
|---|---|
| **Project** | AcadPulse — Explainable Academic Early-Warning & Counterfactual Intervention System |
| **Programme** | Bachelor (Honours) of Information Technology, Lincoln University College |
| **Nature** | Individual full-stack AI/ML capstone (Final Year Project) |
| **Owner** | Ujwal |
| **Timeline** | 14-week agile plan, submission November 2026 |
| **Status of this file** | Living document. Update it whenever an architectural decision changes (see §13). |

---

## 1. Mission & Final Goal

AcadPulse shifts academic assessment from **reactive post-exam remediation** to **proactive mid-semester intervention**. It must:

1. **Forecast** at-risk students at Week 4, 8 and 12 checkpoints, with no future-data leakage.
2. **Segment** learners into interpretable engagement personas (k-Means).
3. **Explain** every prediction with SHAP attributions that teachers can act on.
4. **Simulate** the cheapest behavioural change that moves a student from Moderate/High to Safe (counterfactual "What-If").
5. **Deliver** a secure, role-based, tested, deployed full-stack application with complete documentation.

The system runs **100% locally**: no external commercial LLM or prediction API anywhere in the product or the ML pipeline.

### 1.1 Definition of Project Success

| Area | Target | Notes |
|---|---|---|
| At-risk recall | ≥ 0.80 at Week 8 | Target, confirmed empirically. Report the real number even if lower. |
| p95 inference latency (incl. SHAP) | < 100 ms | Measured on a development laptop. |
| Validation | 5-fold stratified CV, mean ± SD per checkpoint | Hyperparameters tuned **inside** folds. |
| Metrics | ROC-AUC, PR-AUC, macro F1, recall (at-risk), Brier score, reliability curve | All reported per model, per checkpoint. |
| Earliness gain | Week 4/8/12 compared against Week 12 and G1-only baselines | Proves the value of early prediction. |
| Fairness | Offline audit of error rates across gender, region, disability | Attributes used for audit only, never as model inputs. |
| What-If | Returns the minimum-cost plan to Safe, or states clearly that none exists | Never suggests impossible targets. |

---

## 2. Non-Negotiable Rules (Hard Constraints)

These are never traded off for speed. Violating any of them is a defect.

### 2.1 Institutional (BIT FYP Guidelines)
- **One individual project.** No group work.
- Must include **Backend + Frontend + Database + AI/ML + Deployment + Documentation**.
- **Not a CRUD app.** Real inference, SHAP, counterfactual solver and cohort analytics must remain the core.
- **No no-code / low-code tools. No template-based apps.**
- **An external API alone is not AI.** Models are trained, evaluated and serialized locally.
- **GitHub from day one**, supervisor invited, 3–5 meaningful commits per week, branches `main` / `dev` / `feature/*`. Last-minute code dumps are rejected.
- **Copy-pasted GitHub projects are prohibited.** Any borrowed snippet must be small, understood, and attributed in a comment.

### 2.2 ML Integrity
- **No temporal leakage.** A checkpoint-`t` model sees only observations recorded on or before week `t`. The final result is used **only as the label**.
- **Fit on training folds only.** Scalers, k-Means, encoders and imputers are fitted inside each fold and never on the full dataset.
- **Demographic fields are never model inputs.** They are used only for the offline fairness audit.
- **Students who withdrew before week `t` are excluded** from that checkpoint's cohort.
- **Never fabricate or round up results.** Every number in docs, README or UI comes from a reproducible run. If a target is missed, report the truth and explain it.
- **Reproducibility.** Fixed random seeds, pinned dependencies, logged `model_version`, saved metrics JSON per run.

### 2.3 Ethics & Product Language
- UI says **"Support Priority"**, never "failing" or "failed student".
- Counterfactual output is **support guidance based on patterns in past cohorts, not a guarantee**. The model captures association, not causation. Do not use causal language.
- Public datasets are anonymized. The demo portal uses a **clearly labeled synthetic cohort**.

### 2.4 Security
- Passwords: **bcrypt** hashes only. Never log, return or store plaintext.
- Auth: **OAuth2 + JWT** access/refresh tokens. Every endpoint has an explicit role guard.
- **Strict data isolation:** students see only their own records; teachers see only assigned cohorts; admin is **read-only analytics**.
- All input validated by **Pydantic** schemas. All DB access via SQLAlchemy (no string-built SQL).
- **No secrets in git.** Use `.env` (git-ignored) and commit `.env.example` only.

---

## 3. System Architecture

Four decoupled tiers. Training is **offline**; the online API only loads serialized models.

```
┌──────────────────────────────────────────────────────────────┐
│ TIER 1  Presentation   Next.js · React · TypeScript ·        │
│                        Tailwind · Recharts                   │
│   Student What-If UI │ Teacher SHAP Portal │ Admin Console   │
└───────────────────────────────┬──────────────────────────────┘
                                │ REST / JSON over HTTPS
┌───────────────────────────────▼──────────────────────────────┐
│ TIER 2  API & Auth     FastAPI · Python 3.11 · Uvicorn ·     │
│                        SQLAlchemy 2.0 · Pydantic             │
│   JWT + RBAC │ Schemas │ Batch CSV Processor │ OpenAPI      │
└───────────────────────────────┬──────────────────────────────┘
                                │ in-process inference calls
┌───────────────────────────────▼──────────────────────────────┐
│ TIER 3  ML / XAI Engine  scikit-learn · XGBoost · SHAP ·     │
│                          NumPy · Pandas · Joblib             │
│   k-Means personas │ XGBoost risk │ SHAP │ Counterfactual    │
└───────────────────────────────┬──────────────────────────────┘
                                │ load artifacts · persist predictions
┌───────────────────────────────▼──────────────────────────────┐
│ TIER 4  Data & Artifacts PostgreSQL 16 · Alembic ·           │
│                          JSONB SHAP store · .joblib registry │
└──────────────────────────────────────────────────────────────┘

OFFLINE PIPELINE:  OULAD + UCI → temporal features → 5-fold CV
                   → benchmark export → .joblib artifacts → deploy
```

### 3.1 Process & Data Store Map (DFD Level 1)

| ID | Process | Responsibility |
|---|---|---|
| 1.0 | Authentication & RBAC Validation | Verify credentials, issue JWTs, enforce role guards |
| 2.0 | Telemetry & CSV Record Ingestion | Validate and store marks, attendance, batch uploads |
| 3.0 | Temporal Feature Checkpoint Builder | Build leak-free features using data up to week `t` |
| 4.0 | ML Risk & SHAP Inference Engine | Predict risk + persona, compute SHAP |
| 5.0 | Counterfactual "What-If" Simulator | Find minimum behaviour change to reach Safe |
| 6.0 | Intervention & Cohort Reporting | Track advisor actions, cohort analytics, exports |

Data stores: **D1** Users & Courses · **D2** Attendance & Marks · **D3** Predictions & Logs · **D4** `.joblib` Model Store.

### 3.2 Database (3NF, UUID primary keys)

Eight entities: `USERS`, `COURSES`, `ASSESSMENTS`, `ENROLLMENTS`, `ATTENDANCE_LOGS`, `SUBMISSIONS`, `PREDICTION_RUNS`, `INTERVENTIONS`.

- `PREDICTION_RUNS` is an **immutable audit trail** (checkpoint, risk_prob, risk_tier, persona_cluster_id, `shap_values` JSONB, `model_version`, `created_at`). Never update rows in place; insert a new run.
- Required index: `(enrollment_id, week_num)` on `ATTENDANCE_LOGS`.
- Every schema change goes through an **Alembic migration**. Never edit the DB by hand.

### 3.3 ML Pipeline

| Stage | Component | Rules |
|---|---|---|
| Feature builder | Checkpoints at weeks 4, 8, 12 | Rolling engagement rate, submission punctuality Δt_sub, weighted assessment trajectory (mean, min, std), prior attempts |
| Stage 1 | k-Means (hypothesis k = 3) | Validate k = 2–6 with elbow + silhouette on training folds only |
| Stage 2 | XGBoost vs Logistic Regression vs Random Forest | 5-fold stratified CV, class weighting / `scale_pos_weight`, thresholds from the PR curve |
| Stage 3 | SHAP `TreeExplainer` + counterfactual solver | SHAP stored as JSONB; bounded grid search over actionable features only |

- **Label:** At-risk = `Fail` or `Withdrawn`; Not at-risk = `Pass` or `Distinction`. UCI: G3 below 10.
- **Risk tiers (initial):** Safe < 0.35 · Moderate 0.35–0.65 · High ≥ 0.65. Final cut-offs tuned on the validation PR curve.
- **Counterfactual:** minimize `cost(Δx) = w_e·Δengagement + w_s·Δscore` subject to `P(Risk | x+Δx) < 0.35`, engagement ≤ 100%, scores ≤ 100%. Demographic and historical fields stay fixed.
- **Data caveat:** OULAD has no classroom attendance. VLE activity is the documented engagement proxy (see mapping table in the proposal §6.2). UCI is secondary and has no weekly timeline, so it is **never** used for Week 4/8/12 checkpoints.

---

## 4. Technology Stack (Locked)

| Layer | Technology |
|---|---|
| Frontend | Next.js / React (TypeScript), Tailwind CSS, Recharts |
| Backend | Python 3.11, FastAPI, Uvicorn, SQLAlchemy 2.0, Pydantic |
| Database | PostgreSQL 16, Alembic |
| ML / XAI | scikit-learn, XGBoost, SHAP, NumPy, Pandas, Joblib |
| Auth | OAuth2 + JWT (access/refresh), bcrypt, role guards |
| Testing | Pytest, React Testing Library |
| DevOps | Docker, Docker Compose, GitHub Actions; Render / Railway for cloud |

**Do not add** a new framework, database, cache server, queue or external AI service without an Architecture Decision Record (§13). Repeated simulations use a small **in-process cache**; no Redis.

---

## 5. Repository Structure

```
acadpulse/
├── AGENTS.md
├── README.md
├── docker-compose.yml
├── .env.example
├── .github/workflows/ci.yml
├── backend/
│   ├── app/
│   │   ├── api/            # routers (auth, ingest, predict, whatif, interventions, cohorts)
│   │   ├── core/           # config, security, deps, RBAC guards
│   │   ├── db/             # session, base, models (SQLAlchemy)
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # business logic (no HTTP concerns)
│   │   └── ml_runtime/     # artifact loader, inference, SHAP, counterfactual
│   ├── alembic/
│   └── tests/              # unit/ and integration/
├── ml/
│   ├── data/               # raw/ (git-ignored), processed/ (git-ignored)
│   ├── src/                # features, labels, clustering, training, evaluation, explain
│   ├── notebooks/          # EDA only; no logic that production depends on
│   ├── artifacts/          # versioned .joblib + metrics JSON (large files git-ignored)
│   └── tests/
├── frontend/
│   ├── src/app/            # routes per role (student, teacher, admin)
│   ├── src/components/
│   ├── src/lib/            # API client, types
│   └── tests/
└── docs/
    ├── proposal/ srs/ design/ ai-report/ test-report/ final-report/
    ├── adr/                # architecture decision records
    └── deployment/
```

**Layering rule:** `api → services → db / ml_runtime`. Routers contain no business logic; services contain no HTTP objects; `ml_runtime` never touches the DB directly.

---

## 6. Phase-Wise Working Structure

Work strictly in phase order. A phase is **closed only when its exit criteria pass**. Do not start building on top of an unclosed phase. Within a phase, follow an **MVP-first** order (core path before polish).

### Phase 1 — Requirements & Design (Weeks 1–2)

**Objective:** Lock requirements and design so later phases never need structural rework.

| Task | Deliverable |
|---|---|
| Repo bootstrap | Git repo, `main`/`dev` branches, supervisor invited, README skeleton, `.gitignore`, `.env.example`, CI stub |
| SRS | Functional + non-functional requirements document |
| ERD | Normalized 3NF ERD (8 entities) |
| DFDs | **Level 0, Level 1 and Level 2** (Level 2 for process 4.0 or 5.0) |
| UML | Use-case, **class**, sequence and **activity** diagrams |
| Literature review | Related works, theoretical framework, research gap (feeds Chapter 2) |
| Report | Chapters 1–4 draft |

**Exit criteria:**
- [ ] All diagrams exported to `docs/design/` and consistent with each other (entity names match across ERD, DFD, class diagram)
- [ ] SRS reviewed by supervisor
- [ ] Repo, branches, and first commits visible on GitHub

### Phase 2 — Data Pipeline & ML (Weeks 3–5)

**Objective:** Produce trustworthy, leak-free, evaluated model artifacts.

| Task | Deliverable |
|---|---|
| Data ingestion | Reproducible download/preprocess scripts for OULAD and UCI (raw data never committed) |
| EDA | Notebook confirming class balance (verify the OULAD Fail vs Fail+Withdrawn split) |
| Feature builder | Checkpoint-filtered features for weeks 4, 8, 12 with **leakage unit tests** |
| Personas | k-Means with k = 2–6 comparison, final k justified |
| Classifiers | LR, RF, XGBoost benchmarked with 5-fold stratified CV |
| Calibration & thresholds | Brier score, reliability curve, tuned tier cut-offs |
| Explainability | SHAP TreeExplainer serialization format (JSONB-ready) |
| Counterfactual prototype | Grid-search solver verified against the Safe threshold |
| Fairness audit | Offline error-rate comparison by gender, region, disability |
| Report | **AI Model Training & Evaluation Report** (draft) |

**Exit criteria:**
- [ ] Leakage tests pass: perturbing any post-week-`t` data does not change checkpoint-`t` features
- [ ] Metrics JSON saved per model per checkpoint (mean ± SD)
- [ ] Earliness-gain comparison against Week 12 and G1-only baselines produced
- [ ] Versioned `.joblib` artifacts + `model_version` string defined
- [ ] Recall and latency numbers recorded **as measured**, not as targeted

### Phase 3 — Backend API & Auth (Weeks 6–8)

**Objective:** Secure, tested API exposing the ML engine.

| Task | Deliverable |
|---|---|
| DB layer | SQLAlchemy models + Alembic migrations for all 8 entities |
| Auth | JWT access/refresh, bcrypt, RBAC guards (student / teacher / admin) |
| Ingestion | Marks, attendance and batch CSV endpoints with strict validation and error reports |
| Inference | `/predict` using checkpoint model, persona, SHAP; persists to `PREDICTION_RUNS` |
| What-If | `/whatif` endpoint using the counterfactual solver, with in-process cache |
| Interventions & cohorts | Intervention logging, cohort analytics, heatmap data, CSV export |
| API docs | Auto-generated OpenAPI/Swagger |
| Tests | Pytest unit + integration suite; RBAC negative tests |

**Exit criteria:**
- [ ] Every endpoint has a role guard and a negative-access test (student cannot read another student's data)
- [ ] Migrations apply cleanly on an empty database
- [ ] Inference endpoint benchmarked; p95 latency recorded
- [ ] CI runs lint + tests green on `dev`
- [ ] Swagger docs complete and accurate

### Phase 4 — Frontend & XAI UI (Weeks 9–11)

**Objective:** Role-based interface that makes the ML explainable and actionable.

| Task | Deliverable |
|---|---|
| App shell | Auth flow, role-based routing, API client with typed responses |
| Student portal | Trajectory dashboard, engagement/submission streaks, **What-If sliders** |
| Teacher portal | Course risk roster, **SHAP waterfall chart**, persona tags, intervention logging |
| Admin console | Cohort heatmaps, CSV upload, checkpoint triggers, intervention-efficacy and fairness/calibration summaries (read-only) |
| UX standards | Loading, empty and error states; responsive; accessible contrast and labels |
| Tests | React Testing Library integration tests for critical flows |

**Exit criteria:**
- [ ] Each role can complete its primary journey end-to-end against the real API
- [ ] UI language follows §2.3 ("Support Priority", guidance disclaimer on What-If)
- [ ] "No feasible plan" state implemented and tested
- [ ] Screenshots captured for README and report

### Phase 5 — Test, Deploy & Thesis (Weeks 12–14)

**Objective:** Prove it works, ship it, and document it.

| Task | Deliverable |
|---|---|
| Testing | End-to-end tests, final unit/integration pass, **Test Report** |
| Performance | Latency benchmark (p95 incl. SHAP), results reported honestly |
| Deployment | Docker Compose (local, primary fallback) and Render/Railway cloud; **Deployment Guide** |
| Documentation | README complete (overview, tech stack, setup, DB schema, AI model details, screenshots, deployment guide) |
| Final report | Chapters 1–7 in APA, preliminary pages, formatted per §10 |
| Defence | Viva slides, demo script, synthetic-cohort demo data |
| Release | Tag `v1.0.0` on `main` |

**Exit criteria:**
- [ ] Fresh clone → `docker compose up` works following the README only
- [ ] All required documents exist (§10.1)
- [ ] Report numbers match the metrics JSON files exactly
- [ ] Release tagged; GitHub link ready for submission

---

## 7. Engineering Standards

### 7.1 Python (backend and ML)
- Type hints on all public functions. Format with **Black**, lint with **Ruff**, type-check with **mypy** where practical.
- Functions do one thing. Keep services pure and testable; inject dependencies.
- Configuration via environment (Pydantic settings). No hardcoded paths, URLs or secrets.
- Errors: raise domain exceptions in services, map to HTTP responses in the API layer. Never leak stack traces or internal paths to clients.
- Logging: structured, no PII (no emails, names or passwords in logs).

### 7.2 TypeScript (frontend)
- `strict` mode on. No `any` without a comment explaining why.
- API types mirror backend schemas; keep them in one place (`src/lib/types`).
- Components are small and role-scoped; data fetching lives in hooks, not in presentational components.
- ESLint + Prettier clean before commit.

### 7.3 ML Code
- All pipeline logic lives in `ml/src` as importable, tested modules. **Notebooks are for exploration only**: nothing in production may import from a notebook.
- Each training run writes: model artifact, `model_version`, feature list, hyperparameters, seed, dataset hash and metrics JSON.
- Feature order and names are part of the artifact contract. Inference must assert they match.

### 7.4 Testing Policy
| Layer | Tool | Must cover |
|---|---|---|
| ML | Pytest | Leakage, label construction, feature builder, solver bounds, artifact load |
| API | Pytest + test DB | Auth, RBAC (positive **and** negative), validation, inference, What-If |
| UI | React Testing Library | Role journeys, error/empty states, What-If interaction |
| E2E | Pytest/Playwright (optional) | Login → predict → explain → What-If |

A feature is not done until it has tests. Bug fixes require a regression test.

---

## 8. Git & Collaboration Workflow

- **Branches:** `main` (release-ready) ← `dev` (integration) ← `feature/<scope>-<short-name>` (e.g. `feature/ml-pipeline`, `feature/backend-api`, `feature/frontend-ui`). Never commit directly to `main`.
- **Cadence:** 3–5 meaningful commits per week. Commit small and often. Never batch a week of work into one commit.
- **Commit messages:** [Conventional Commits](https://www.conventionalcommits.org/).
  - `feat: add JWT refresh token rotation`
  - `fix: resolve checkpoint-8 feature leakage`
  - `refactor: optimize enrollment queries`
  - `test: add RBAC negative cases for student role`
  - `docs: update AI training process`
  - `chore:` / `ci:` for tooling
- **Pull requests (recommended):** short description, linked phase/task, test evidence, screenshots for UI changes.
- **Weekly supervisor review** tracks commit frequency, code quality and branch usage. Keep history clean and honest.
- **Never commit:** secrets, `.env`, raw datasets, large model binaries, `node_modules`, virtualenvs, build output.

---

## 9. Agent Operating Rules

### 9.1 Before Coding
1. Identify which **phase** and task the request belongs to. If it belongs to a later phase whose prerequisites are not closed, say so before proceeding.
2. For any change touching more than ~3 files, a schema, an API contract or the ML pipeline, **state a short plan first**.
3. Read the relevant existing code and docs. Do not assume; verify.
4. If the request is ambiguous or conflicts with §2, **ask**. Do not guess on anything that is expensive to undo.

### 9.2 While Coding
- Make the **smallest change that solves the problem**. No drive-by refactors or unrelated reformatting.
- Respect the layering rule (§5) and locked stack (§4).
- Write or update tests in the same change.
- Keep API contracts, Pydantic schemas, TS types and docs in sync.
- Prefer clear, boring code over clever code. The author must be able to explain every line in the viva.

### 9.3 After Coding
- Run the relevant tests and linters; report actual results, not assumptions.
- Summarize **what changed, why, and what was verified**, plus any follow-ups or risks.
- Update docs (README, ADR, report notes) when behaviour or architecture changed.

### 9.4 Always Do
- Treat the **leak-free guarantee** as the highest-priority ML invariant.
- Keep the offline-training / online-inference split.
- Record measured results with the commit or artifact that produced them.
- Flag scope creep immediately and propose the MVP cut.

### 9.5 Never Do
- Call an external LLM or prediction API from the product or pipeline.
- Use demographic attributes as model features.
- Fit preprocessing on data outside the training fold.
- Invent, estimate or "adjust" metrics, benchmarks or screenshots.
- Bypass RBAC "temporarily", disable validation, or hardcode credentials.
- Delete or rewrite audit data (`PREDICTION_RUNS`) or force-push shared branches.
- Add dependencies or services outside §4 without an ADR.
- Present counterfactual output as a guaranteed or causal outcome.

### 9.6 Escalate to the Owner When
- A target (recall, latency) cannot be met and the plan needs to change.
- A requirement conflicts with the BIT guidelines or this file.
- A schema, API or artifact contract change would break existing work.
- Anything involves real student data, credentials or deployment secrets.

---

## 10. Documentation & Compliance Checklist

### 10.1 Required Documents
- [ ] Proposal
- [ ] SRS Document
- [ ] System Design (UML, ERD, architecture, DFD L0/L1/L2)
- [ ] AI Model Training & Evaluation Report
- [ ] Test Report
- [ ] Final Report (APA format)
- [ ] GitHub repository link (supervisor added as collaborator)
- [ ] Deployment documentation
- [ ] Presentation slides

### 10.2 README Must Contain
Project overview · Tech stack · Setup instructions · Database schema · AI model details · Screenshots · Deployment guide.

### 10.3 Final Report Structure
Preliminary pages (roman numerals) → Ch.1 Introduction → Ch.2 Literature Review → Ch.3 Methodology → Ch.4 System Design → Ch.5 Implementation → Ch.6 Testing & Result Analysis → Ch.7 Conclusion & Recommendations → References (APA) → Appendices.

### 10.4 Final Report Formatting
- A4 or Letter; margins 1" all sides, **1.5" left**
- **Times New Roman**: body 12 pt, chapter headings 14 pt bold centered uppercase, subheadings 12 pt bold
- Line spacing 1.5 or double (single for executive summary and references)
- Page numbers: roman (i, ii) for preliminary pages, Arabic from Chapter 1
- Figure captions below (italic), table captions above (bold), 10 pt
- References in APA with 0.5" hanging indent, single-spaced

### 10.5 Guideline Gap Tracker
- [ ] DFD Level 2 added
- [ ] Class diagram and activity diagrams added
- [ ] Literature review chapter scheduled and written
- [ ] Deployment documentation and GitHub link listed in doc set
- [ ] Supervisor name filled in on cover page
- [ ] Confirm with supervisor whether the proposal also needs the report formatting

---

## 11. Risk Register (Operational)

| Risk | Mitigation |
|---|---|
| Class imbalance | Stratified folds, class weighting / `scale_pos_weight`, PR-curve thresholds, recall-focused evaluation |
| Dataset–deployment mismatch (no attendance in OULAD) | VLE proxy, feature mapping table, local recalibration, labeled synthetic demo cohort |
| Algorithmic fairness and stigma | No demographic inputs, offline fairness audit, "Support Priority" language |
| Cold start for new courses | Fall back to cross-module OULAD/UCI ensemble |
| Student data privacy | RBAC isolation, hashed passwords, minimal retention, anonymized datasets |
| Scope creep (solo developer) | Three roles only, no cache server, MVP-first sprint order, weekly review |
| SHAP latency | `TreeExplainer` on compact models, cached repeat simulations, benchmark in Phase 5 |
| Cloud memory limits (SHAP + XGBoost on free tier) | Keep Docker Compose local deployment as the guaranteed fallback |

---

## 12. Commands (Convention)

> Establish these in Phase 1 and keep them stable. Update this section if they change.

```bash
# Environment
cp .env.example .env
docker compose up --build            # full stack: db + backend + frontend

# Backend
cd backend && pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
pytest backend/tests -q

# ML pipeline
python -m ml.src.training.run --checkpoint 8 --seed 42
pytest ml/tests -q

# Frontend
cd frontend && npm install
npm run dev
npm test

# Quality
ruff check . && black --check .
npm run lint
```

---

## 13. Decision Records & Change Control

- Any change to the stack, architecture, data contract, schema, risk-tier thresholds or success targets requires an **ADR** in `docs/adr/` (`NNNN-short-title.md`: context, decision, alternatives, consequences).
- Update this file in the same PR as the decision it reflects.
- When in doubt, prefer the option that is **more honest, more reproducible and easier to defend in the viva**.

---

*Last reviewed: November 2026 · Maintained by the project owner.*
