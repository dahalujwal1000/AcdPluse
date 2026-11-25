"""
Unit tests for ML components:
- Stratified CV evaluation pipeline (leak-free fold scaling)
- Persona clustering (k-Means silhouette check)
- Counterfactual "What-If" solver bounds & feasibility
"""
import pytest
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from ml.src.train import evaluate_models_stratified_cv
from ml.src.clustering import find_optimal_k, train_persona_model
from ml.src.counterfactual import CounterfactualSolver
from ml.src.features import FEATURE_COLUMNS


@pytest.fixture
def synthetic_training_data():
    np.random.seed(42)
    n_samples = 200
    n_features = len(FEATURE_COLUMNS)
    X = np.random.randn(n_samples, n_features)
    # Generate binary label: at-risk (1) vs safe (0) correlated with engagement and score
    # Feature 0: engagement rate, Feature 3: assessment_score_mean
    X[:, 0] = np.random.uniform(0.1, 1.0, n_samples)
    X[:, 3] = np.random.uniform(20.0, 95.0, n_samples)
    prob_risk = 1.0 / (1.0 + np.exp(X[:, 0] * 3.0 + X[:, 3] * 0.05 - 5.0))
    y = (prob_risk > 0.5).astype(int)
    return X, y


def test_stratified_cv_runs_all_models(synthetic_training_data):
    X, y = synthetic_training_data
    results = evaluate_models_stratified_cv(X, y, n_splits=3, random_state=42)

    assert "LogisticRegression" in results
    assert "RandomForest" in results
    assert "XGBoost" in results

    for model_name, metrics in results.items():
        assert "roc_auc" in metrics
        assert 0.0 <= metrics["roc_auc"]["mean"] <= 1.0
        assert "recall_at_risk" in metrics
        assert "brier" in metrics


def test_persona_clustering_evaluation(synthetic_training_data):
    X, _ = synthetic_training_data
    k_eval = find_optimal_k(X, k_range=range(2, 5), random_state=42)

    assert 2 in k_eval
    assert 3 in k_eval
    assert "silhouette" in k_eval[3]

    kmeans, scaler = train_persona_model(X, n_clusters=3, random_state=42)
    assert kmeans.n_clusters == 3
    assert len(kmeans.cluster_centers_) == 3


def test_counterfactual_solver_bounds_and_feasibility(synthetic_training_data):
    X, y = synthetic_training_data
    scaler = StandardScaler().fit(X)
    clf = LogisticRegression().fit(scaler.transform(X), y)

    solver = CounterfactualSolver(
        classifier=clf,
        scaler=scaler,
        feature_names=FEATURE_COLUMNS,
        safe_threshold=0.35,
    )

    # Moderate risk student feature vector
    student_feat = {col: float(np.mean(X[:, i])) for i, col in enumerate(FEATURE_COLUMNS)}
    student_feat["rolling_engagement_rate"] = 0.30
    student_feat["assessment_score_mean"] = 45.0

    res = solver.solve(student_feat)
    assert "feasible" in res
    if res["feasible"] and not res.get("already_safe", False):
        assert res["target_risk"] < 0.35
        assert res["target_engagement"] <= 1.0
        assert res["target_score"] <= 100.0
