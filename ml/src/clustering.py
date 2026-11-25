"""
Clustering module for learner personas (k-Means).
Per AGENTS.md:
- Hypothesis k = 3
- Elbow and silhouette score comparison for k in [2, 6]
- Fitted strictly on training folds only.
"""
from typing import Dict, Any, Tuple
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler


def find_optimal_k(
    X_train: np.ndarray,
    k_range: range = range(2, 7),
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Evaluates inertia (elbow method) and silhouette scores across k in [2, 6].
    Must be called strictly on training data.
    """
    results = {}
    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=random_state, n_init=10)
        labels = kmeans.fit_predict(X_train)
        sil = silhouette_score(X_train, labels)
        results[k] = {
            "inertia": float(kmeans.inertia_),
            "silhouette": float(sil),
        }
    return results


def train_persona_model(
    X_train: np.ndarray,
    n_clusters: int = 3,
    random_state: int = 42
) -> Tuple[KMeans, StandardScaler]:
    """
    Fits StandardScaler and KMeans(k=3) on the training fold.
    Returns (fitted_kmeans, fitted_scaler).
    """
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_train)
    kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)
    kmeans.fit(X_scaled)
    return kmeans, scaler
