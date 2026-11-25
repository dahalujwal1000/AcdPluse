"""
Evaluation and training suite for AcadPulse.
Benchmarks Logistic Regression, Random Forest, and XGBoost using 5-fold Stratified CV.
Fits preprocessing (StandardScaler) strictly inside folds.
Generates metrics JSON (ROC-AUC, PR-AUC, macro F1, Recall, Brier score).
"""
from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    f1_score,
    recall_score,
    brier_score_loss,
)


def evaluate_models_stratified_cv(
    X: np.ndarray,
    y: np.ndarray,
    n_splits: int = 5,
    random_state: int = 42,
) -> Dict[str, Dict[str, Tuple[float, float]]]:
    """
    Performs 5-fold Stratified CV.
    CRITICAL: Scaler is fitted strictly on X_train inside each fold.
    Returns mean and standard deviation for each metric.
    """
    skf = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=random_state)

    models = {
        "LogisticRegression": lambda: LogisticRegression(max_iter=1000, random_state=random_state),
        "RandomForest": lambda: RandomForestClassifier(n_estimators=100, random_state=random_state),
        "XGBoost": lambda: XGBClassifier(n_estimators=100, eval_metric="logloss", random_state=random_state),
    }

    results = {name: {"roc_auc": [], "pr_auc": [], "macro_f1": [], "recall_at_risk": [], "brier": []} for name in models}

    for train_idx, val_idx in skf.split(X, y):
        X_train, X_val = X[train_idx], X[val_idx]
        y_train, y_val = y[train_idx], y[val_idx]

        # Invariant: Scaler fitted ONLY on train fold
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_val_scaled = scaler.transform(X_val)

        for name, model_factory in models.items():
            clf = model_factory()
            clf.fit(X_train_scaled, y_train)

            y_proba = clf.predict_proba(X_val_scaled)[:, 1]
            y_pred = (y_proba >= 0.5).astype(int)

            results[name]["roc_auc"].append(roc_auc_score(y_val, y_proba))
            results[name]["pr_auc"].append(average_precision_score(y_val, y_proba))
            results[name]["macro_f1"].append(f1_score(y_val, y_pred, average="macro"))
            results[name]["recall_at_risk"].append(recall_score(y_val, y_pred, pos_label=1))
            results[name]["brier"].append(brier_score_loss(y_val, y_proba))

    # Compute mean +/- std
    aggregated = {}
    for name, metrics in results.items():
        aggregated[name] = {}
        for m_name, vals in metrics.items():
            aggregated[name][m_name] = {
                "mean": float(np.mean(vals)),
                "std": float(np.std(vals)),
            }

    return aggregated
