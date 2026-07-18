"""sov33_fluid_router.py — FLUID composition: route per task based on measured error-correlation.

"Fluid" done honestly = the composition CHANGES per task, NOT weights rewriting live.
Rule (from rho gate): where the brains fail DIFFERENTLY (low rho) -> FUSE all (emergence headroom);
where they fail TOGETHER (high rho) -> ROUTE to single best brain (fusion only adds cost).
The venturi (sov1) is STATIC and does the routing; the brains (sov3/33/333) are the fluid selection;
planet-memory stays FIXED (identity). No live weight-editing is claimed.
"""
import numpy as np

FUSE_THRESHOLD = 0.3   # rho below this -> decorrelated enough to fuse
def decide(task_class, rho_by_class, acc_by_class):
    """rho_by_class[task] = measured mean error-correlation for that task type.
    acc_by_class[task] = {brain: accuracy} on that task type.
    Returns the fluid routing decision for this task class."""
    rho = rho_by_class.get(task_class)
    accs = acc_by_class.get(task_class, {})
    if rho is None or not accs:
        return {"task": task_class, "mode": "route_best", "reason": "no rho/acc data -> safe default single best"}
    best_brain = max(accs, key=accs.get)
    if rho < FUSE_THRESHOLD:
        return {"task": task_class, "mode": "FUSE_ALL", "rho": rho,
                "reason": f"rho {rho} < {FUSE_THRESHOLD}: brains decorrelated here, fusion has headroom"}
    return {"task": task_class, "mode": "ROUTE_BEST", "route_to": best_brain, "rho": rho,
            "reason": f"rho {rho} >= {FUSE_THRESHOLD}: brains agree here, fuse would only add cost -> use {best_brain}"}
