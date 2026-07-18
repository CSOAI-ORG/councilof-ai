"""dataset_loader.py — load CSV/JSON test data and normalize to (X, y) numpy arrays.

Goal: turn whatever shape of test data is on disk into a uniform
(X, y) ndarray pair that every downstream eval module can consume
without re-parsing each file format.

Supported input shapes:
1. JSON: list[dict] where each dict has an `input_features` (list[float])
   and a `expected_score` (list[float] OR dict[dim -> float]) field.
   Optional `labels` for classification-style tasks (threat_eval).
2. CSV: header row, a column named `input_features` that holds a JSON-encoded
   list[float] (e.g. "[0.1, 0.2, ...]"), and remaining numeric columns are
   treated as label columns.
3. NumPy .npz: 'X' (n, d) features, 'y' (n, k) labels.

Public API:
- load_json(path) -> EvalDataset
- load_csv(path, feature_col, label_cols) -> EvalDataset
- load_auto(path) -> EvalDataset          # dispatch on extension
- EvalDataset: dataclass with .X, .y, .feature_names, .label_names,
  .metadata (dict of any extra per-file context).

The loader does NOT auto-fit or touch the live SOV3 NNs. It only reshapes.
"""
from __future__ import annotations

import csv
import json
import os
import re
from dataclasses import dataclass, field, asdict
from typing import Any, Iterable, List, Optional, Sequence, Tuple, Union

import numpy as np


# ---------- EvalDataset ------------------------------------------------------
@dataclass
class EvalDataset:
    """Uniform (X, y) representation of one test set."""
    X: np.ndarray                     # shape (n_samples, n_features)
    y: np.ndarray                     # shape (n_samples, n_label_dims)
    feature_names: Optional[List[str]] = None
    label_names: Optional[List[str]] = None
    cases: List[dict] = field(default_factory=list)   # raw case dicts (text + scores)
    metadata: dict = field(default_factory=dict)
    source_path: Optional[str] = None

    # ----- convenience -----
    @property
    def n_samples(self) -> int:
        return int(self.X.shape[0])

    @property
    def n_features(self) -> int:
        return int(self.X.shape[1])

    @property
    def n_labels(self) -> int:
        return int(self.y.shape[1]) if self.y.ndim == 2 else 1

    def to_summary(self) -> dict:
        return {
            "source_path": self.source_path,
            "n_samples": self.n_samples,
            "n_features": self.n_features,
            "n_labels": self.n_labels,
            "label_names": self.label_names,
            "feature_names_first_5": (self.feature_names[:5] if self.feature_names else None),
            "X_dtype": str(self.X.dtype),
            "y_dtype": str(self.y.dtype),
            "metadata": self.metadata,
        }

    def subset(self, mask: np.ndarray) -> "EvalDataset":
        m = np.asarray(mask, dtype=bool)
        return EvalDataset(
            X=self.X[m],
            y=self.y[m],
            feature_names=self.feature_names,
            label_names=self.label_names,
            cases=[c for i, c in enumerate(self.cases) if bool(m[i])],
            metadata={**self.metadata, "subset_total": int(m.sum()), "subset_of": len(m)},
            source_path=self.source_path,
        )

    def split(self, frac: float = 0.5, seed: int = 0) -> Tuple["EvalDataset", "EvalDataset"]:
        """Random deterministic split for sanity checks."""
        rng = np.random.default_rng(seed)
        idx = rng.permutation(self.n_samples)
        cut = int(self.n_samples * frac)
        keep, drop = idx[:cut], idx[cut:]
        return self.subset(keep), self.subset(drop)


# ---------- numpy coercion helper -------------------------------------------
_NUMERIC_RE = re.compile(r"^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?$")


def _to_float(x: Any) -> Optional[float]:
    """Coerce a single cell into a float. Returns None on failure."""
    if x is None:
        return None
    if isinstance(x, (int, float)):
        f = float(x)
        # np.nan stays np.nan; inf is allowed but flagged downstream
        return f
    if isinstance(x, str):
        s = x.strip()
        if not s:
            return None
        # try JSON-encoded list first
        if s.startswith("[") and s.endswith("]"):
            try:
                arr = json.loads(s)
                if isinstance(arr, list) and arr:
                    f = float(arr[0])
                    return f
            except Exception:
                pass
        if _NUMERIC_RE.match(s):
            try:
                return float(s)
            except Exception:
                return None
        return None
    if isinstance(x, (list, tuple)):
        if not x:
            return None
        return _to_float(x[0])
    return None


def _features_to_array(cell: Any, default_dim: int = 175) -> np.ndarray:
    """Coerce a feature cell into a 1-D numpy array of float32."""
    if cell is None:
        return np.zeros(default_dim, dtype=np.float32)
    if isinstance(cell, str):
        s = cell.strip()
        if s.startswith("["):
            try:
                arr = json.loads(s)
                if isinstance(arr, list):
                    return np.asarray(arr, dtype=np.float32)
            except Exception:
                pass
        # else treat as bag-of-words indicator (rare for our schemas)
        return np.zeros(default_dim, dtype=np.float32)
    if isinstance(cell, (list, tuple)):
        return np.asarray(cell, dtype=np.float32)
    return np.zeros(default_dim, dtype=np.float32)


def _resolve_label_array(case: dict, label_keys: Sequence[str]) -> np.ndarray:
    """Pull per-dimension expected scores from a case dict.

    Supports:
    - case['expected_score'] as list[float]  -> used directly (mapped to label_keys)
    - case['expected_score'] as dict[dim -> float]  -> use label_keys order
    - case['expected_scores'] (plural) as dict or list, same rules
    - case['expected'][dim] or any nested form
    - case has direct keys matching each label_key
    """
    src = None
    for k in ("expected_score", "expected_scores", "expected", "scores"):
        if k in case and case[k] is not None:
            src = case[k]
            break
    if src is None:
        # fall back: top-level keys matching label_keys
        if all(lk in case for lk in label_keys):
            src = {lk: case[lk] for lk in label_keys}
    if src is None:
        # classification label (single int / 0-1)
        if "label" in case:
            return np.asarray([float(case["label"])], dtype=np.float32)
        return np.zeros(len(label_keys), dtype=np.float32)

    if isinstance(src, dict):
        return np.asarray([float(src.get(k, 0.0)) for k in label_keys], dtype=np.float32)
    if isinstance(src, (list, tuple)):
        # length may match label_keys OR be 1 (binary)
        arr = [float(v) for v in src]
        if len(arr) == len(label_keys):
            return np.asarray(arr, dtype=np.float32)
        if len(arr) == 1:
            return np.asarray(arr * len(label_keys), dtype=np.float32)
        # truncate / pad
        padded = (arr + [0.0] * len(label_keys))[:len(label_keys)]
        return np.asarray(padded, dtype=np.float32)
    # scalar
    try:
        v = float(src)
    except Exception:
        v = 0.0
    return np.asarray([v] * len(label_keys), dtype=np.float32)


# ---------- loaders ----------------------------------------------------------
def load_json(
    path: str,
    feature_key: str = "input_features",
    label_keys: Optional[Sequence[str]] = None,
) -> EvalDataset:
    """Load JSON test data.

    label_keys: list of dimension names. If omitted, inferred from
    case['care_dimensions'] or by the union of keys seen in `expected_score`
    (dict form). If inference yields 0 we fall back to the 6 care dimensions.
    """
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"{path}: expected JSON list, got {type(data).__name__}")
    if not data:
        return EvalDataset(
            X=np.zeros((0, 0), dtype=np.float32),
            y=np.zeros((0, 0), dtype=np.float32),
            metadata={"empty": True},
            source_path=path,
        )

    # infer label_keys if missing
    if label_keys is None:
        if "care_dimensions" in data[0] and isinstance(data[0]["care_dimensions"], list):
            label_keys = list(data[0]["care_dimensions"])
        else:
            # union from first 20 cases
            union = []
            for c in data[:20]:
                src = c.get("expected_score") or c.get("expected_scores") or c.get("expected")
                if isinstance(src, dict):
                    for k in src.keys():
                        if k not in union:
                            union.append(k)
            if union:
                label_keys = union
            elif "label" in data[0]:
                label_keys = ["label"]
            elif "threat_category" in data[0] or "severity" in data[0]:
                label_keys = ["severity"]
            else:
                label_keys = ["score"]

    # dimensions: 175 if present, else inferred
    inferred_dim = None
    for c in data[:20]:
        feat = c.get(feature_key)
        if isinstance(feat, list) and feat:
            inferred_dim = len(feat)
            break
        if isinstance(feat, str) and feat.startswith("["):
            try:
                arr = json.loads(feat)
                inferred_dim = len(arr)
                break
            except Exception:
                pass
    default_dim = inferred_dim if inferred_dim and inferred_dim > 0 else 175

    X_rows, y_rows = [], []
    cases = []
    for c in data:
        X_rows.append(_features_to_array(c.get(feature_key), default_dim=default_dim))
        y_rows.append(_resolve_label_array(c, label_keys))
        cases.append(c)

    X = np.vstack(X_rows).astype(np.float32) if X_rows else np.zeros((0, default_dim), dtype=np.float32)
    y = np.vstack(y_rows).astype(np.float32) if y_rows else np.zeros((0, len(label_keys)), dtype=np.float32)

    meta = {
        "format": "json",
        "label_keys_inferred": False if label_keys else True,
        "categories": _distinct_categories(data),
        "edge_case_breakdown": _edge_case_breakdown(data),
    }
    return EvalDataset(
        X=X,
        y=y,
        label_names=list(label_keys),
        cases=cases,
        metadata=meta,
        source_path=path,
    )


def load_csv(
    path: str,
    feature_col: str = "input_features",
    label_cols: Optional[Sequence[str]] = None,
    default_dim: int = 175,
) -> EvalDataset:
    """Load CSV where `feature_col` cells are JSON-encoded list[float].

    All other columns are treated as label columns (or scalar). If `label_cols`
    is omitted, every remaining column except the feature column is a label.
    """
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    if not rows:
        return EvalDataset(
            X=np.zeros((0, default_dim), dtype=np.float32),
            y=np.zeros((0, 0), dtype=np.float32),
            metadata={"format": "csv", "empty": True},
            source_path=path,
        )
    if feature_col not in rows[0]:
        raise ValueError(f"{path}: feature column '{feature_col}' missing in CSV")
    if label_cols is None:
        label_cols = [c for c in rows[0].keys() if c != feature_col]

    X_rows = [_features_to_array(r[feature_col], default_dim=default_dim) for r in rows]
    y_rows = []
    for r in rows:
        vals = []
        for lc in label_cols:
            v = _to_float(r.get(lc))
            vals.append(0.0 if v is None else v)
        y_rows.append(np.asarray(vals, dtype=np.float32))

    X = np.vstack(X_rows).astype(np.float32)
    y = np.vstack(y_rows).astype(np.float32)
    return EvalDataset(
        X=X,
        y=y,
        label_names=list(label_cols),
        metadata={"format": "csv", "n_rows": len(rows)},
        source_path=path,
    )


def load_npz(path: str) -> EvalDataset:
    """Load .npz with keys 'X' and 'y'."""
    data = np.load(path, allow_pickle=True)
    X = np.asarray(data["X"]).astype(np.float32)
    y = np.asarray(data["y"]).astype(np.float32)
    if y.ndim == 1:
        y = y.reshape(-1, 1)
    label_names = list(data["label_names"]) if "label_names" in data else None
    return EvalDataset(
        X=X,
        y=y,
        label_names=label_names,
        metadata={"format": "npz", "keys": list(data.keys())},
        source_path=path,
    )


def load_auto(path: str) -> EvalDataset:
    """Dispatch by file extension."""
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    ext = os.path.splitext(path)[1].lower()
    if ext == ".json":
        return load_json(path)
    if ext == ".csv":
        return load_csv(path)
    if ext == ".npz":
        return load_npz(path)
    raise ValueError(f"Unsupported extension {ext} for {path}")


# ---------- helpers ---------------------------------------------------------
def _distinct_categories(data: List[dict]) -> dict:
    """Tally case categories (`category` field)."""
    counts: dict = {}
    for c in data:
        k = c.get("category") or c.get("edge_case_type") or c.get("severity") or "normal"
        counts[k] = counts.get(k, 0) + 1
    return counts


def _edge_case_breakdown(data: List[dict]) -> dict:
    """Tally `edge_case` and `adversarial` markers."""
    edge = sum(1 for c in data if c.get("edge_case"))
    adv = sum(1 for c in data if c.get("adversarial"))
    return {"edge_case_count": edge, "adversarial_count": adv, "total": len(data)}


# ---------- self-test -------------------------------------------------------
if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Inspect a test set file.")
    p.add_argument("path")
    p.add_argument("--feature-col", default="input_features")
    args = p.parse_args()
    ds = load_auto(args.path) if not args.path.endswith(".csv") else load_csv(args.path, feature_col=args.feature_col)
    import json as _json
    print(_json.dumps(ds.to_summary(), indent=2, default=str))
    if ds.cases:
        print(f"\nFirst case raw keys: {list(ds.cases[0].keys())}")
