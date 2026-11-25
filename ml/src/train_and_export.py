"""
Full training and serialization pipeline for AcadPulse.
Trains and benchmarks models across Weeks 4, 8, and 12 on processed OULAD datasets.
Performs:
1. 5-fold Stratified Cross-Validation on each checkpoint.
2. Final model fitting on full checkpoint data.
3. TreeExplainer SHAP setup.
4. Persona clustering (k-Means, k=3).
5. Serialization of .joblib artifacts and metrics JSON report.
"""
import json
import time
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import shap

from ml.src.features import FEATURE_COLUMNS
from ml.src.train import evaluate_models_stratified_cv

PROCESSED_DIR = Path("ml/data/processed")
ARTIFACTS_DIR = Path("ml/artifacts")
MODEL_VERSION = "v1.0.0"


def train_and_export():
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    full_metrics = {"model_version": MODEL_VERSION, "checkpoints": {}}

    print(f"=== Starting AcadPulse ML Training Pipeline ({MODEL_VERSION}) ===\n")

    for week in [4, 8, 12]:
        csv_file = PROCESSED_DIR / f"oulad_checkpoint_w{week}.csv"
        if not csv_file.exists():
            print(f"Dataset {csv_file} not found. Please run preprocessing first.")
            return

        print(f"--- Training Checkpoint Week {week} ---")
        df = pd.read_csv(csv_file)
        print(f"Loaded {len(df)} samples. Features: {len(FEATURE_COLUMNS)}")

        X = df[FEATURE_COLUMNS].values
        y = df["is_at_risk"].values

        # 1. Evaluate with 5-Fold Stratified CV
        print("Running 5-fold Stratified Cross-Validation across models...")
        cv_metrics = evaluate_models_stratified_cv(X, y, n_splits=5, random_state=42)
        full_metrics["checkpoints"][f"week_{week}"] = cv_metrics

        for m_name, scores in cv_metrics.items():
            print(
                f"  [{m_name}] ROC-AUC: {scores['roc_auc']['mean']:.3f} +/- {scores['roc_auc']['std']:.3f} | "
                f"Recall (At-Risk): {scores['recall_at_risk']['mean']:.3f} | "
                f"Brier: {scores['brier']['mean']:.3f}"
            )

        # 2. Fit final production model on full checkpoint dataset
        print("Fitting final production XGBoost model...")
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # Handle class imbalance with scale_pos_weight
        num_neg = np.sum(y == 0)
        num_pos = np.sum(y == 1)
        scale_pos = float(num_neg / num_pos) if num_pos > 0 else 1.0

        model = XGBClassifier(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.08,
            scale_pos_weight=scale_pos,
            eval_metric="logloss",
            random_state=42,
        )
        model.fit(X_scaled, y)

        # 3. Fit Persona k-Means model (k=3)
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        kmeans.fit(X_scaled)

        # 4. Measure inference + SHAP latency (target < 100ms per AGENTS.md)
        explainer = shap.TreeExplainer(model)
        sample_x = X_scaled[:1]
        t0 = time.time()
        _ = model.predict_proba(sample_x)
        _ = explainer.shap_values(sample_x)
        p95_sample_ms = (time.time() - t0) * 1000.0
        print(f"Inference + SHAP latency benchmark: {p95_sample_ms:.2f} ms")

        # 5. Serialize .joblib bundle
        bundle = {
            "model": model,
            "scaler": scaler,
            "kmeans": kmeans,
            "explainer": explainer,
            "feature_names": FEATURE_COLUMNS,
            "checkpoint_week": week,
            "model_version": MODEL_VERSION,
            "latency_ms": p95_sample_ms,
        }
        bundle_path = ARTIFACTS_DIR / f"acadpulse_w{week}.joblib"
        joblib.dump(bundle, bundle_path)
        print(f"Saved checkpoint artifact to: {bundle_path}\n")

    # 6. Save benchmark metrics report
    report_path = ARTIFACTS_DIR / "metrics_report.json"
    with open(report_path, "w") as f:
        json.dump(full_metrics, f, indent=2)
    print(f"Metrics report exported to: {report_path}")
    print("=== Training Pipeline Complete ===")


if __name__ == "__main__":
    train_and_export()
