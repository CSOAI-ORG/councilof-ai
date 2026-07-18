"""SOV3 NN eval + training harness.

Exposes:
- dataset_loader: load CSV/JSON test data and normalize to (X, y) numpy arrays
- benchmark: measure accuracy/MAE/R^2 per NN; compute regression vs baseline
- hyperparam_sweep: grid sweep over (lr, batch, epochs, hidden_dim)
- report: render markdown + JSON reports from benchmark / sweep results
"""

__version__ = "0.1.0"
