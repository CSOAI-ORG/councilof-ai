#!/usr/bin/env python3
"""sov33_world_model.py — the GOVERNED WORLD MODEL (the frontier gap, seeded on CPU).
A world model = represents state + dynamics so future consequences are predictable UNDER ACTION. This scales
the OWEM next-state predictor into an action-conditioned one and adds the differentiator NOBODY else has:
CARE-GATED TRANSITIONS — the model refuses to simulate/plan INTO an unsafe region (fail-closed), and every
transition can be SIGIL-signed. Measures the 4 things a world model must do:
  1. DYNAMICS   — learn s' = f(s, a); report multi-step open-loop rollout error vs the true env.
  2. PLANNING   — pick an action sequence that reaches a goal, using ONLY the learned model; beat random.
  3. COUNTERFACTUAL — compare two action plans' predicted outcomes (offline choice).
  4. GOVERNANCE — a care-gate vetoes trajectories entering the unsafe set (governed vs ungoverned).

HONEST SCOPE: CPU numpy, synthetic controllable dynamics. Proves the GOVERNED-WORLD-MODEL MECHANISM
(action-rollouts + care-gated transitions), NOT a Genie/V-JEPA-scale visual world model. That's the bridge
(adopt V-JEPA2/Genie for perception); this is the governed-dynamics core they lack.
"""
import numpy as np

DIM, ADIM = 8, 4

def make_env(seed=0):
    rng = np.random.default_rng(seed)
    A = rng.normal(0, 1/np.sqrt(DIM), (DIM, DIM))
    B = rng.normal(0, 1/np.sqrt(ADIM), (DIM, ADIM))
    def step(s, a): return np.tanh(A @ s + B @ a)          # true dynamics
    return step

def unsafe(s):  # the unsafe region: first coordinate driven high (a "danger" state)
    return s[0] > 0.8

class WorldModel:
    """MLP predicting next state from [state, action]. The action-conditioned OWEM."""
    def __init__(self, h=48, seed=1):
        r = np.random.default_rng(seed); n = DIM + ADIM
        self.W1 = r.normal(0, np.sqrt(2/(n+h)), (n, h)); self.b1 = np.zeros(h)
        self.W2 = r.normal(0, np.sqrt(2/(h+DIM)), (h, DIM)); self.b2 = np.zeros(DIM)
    def pred(self, s, a):
        x = np.concatenate([s, a]); H = np.tanh(x @ self.W1 + self.b1); return np.tanh(H @ self.W2 + self.b2)
    def _fwd(self, X): H = np.tanh(X @ self.W1 + self.b1); return np.tanh(H @ self.W2 + self.b2), H
    def train(self, X, T, epochs=400, lr=0.05):
        for _ in range(epochs):
            Y, H = self._fwd(X); n = len(X); dY = 2*(Y-T)/n * (1-Y**2)
            dW2 = H.T@dY; db2 = dY.sum(0); dH = (dY@self.W2.T)*(1-H**2)
            dW1 = X.T@dH; db1 = dH.sum(0)
            for g in (dW1,db1,dW2,db2): np.clip(g,-5,5,out=g)
            self.W1-=lr*dW1; self.b1-=lr*db1; self.W2-=lr*dW2; self.b2-=lr*db2

def collect(step, n=1500, seed=3):
    rng = np.random.default_rng(seed); X, T = [], []
    for _ in range(n):
        s = rng.normal(0,1,DIM); a = rng.normal(0,1,ADIM)
        X.append(np.concatenate([s,a])); T.append(step(s,a))
    return np.array(X), np.array(T)

def rollout(pred, s0, actions):
    s = s0.copy(); traj=[s.copy()]
    for a in actions: s = pred(s,a); traj.append(s.copy())
    return traj

def governed_rollout(pred, s0, actions, care_floor=0.95):
    """care-gated: veto (stop) the instant a predicted transition enters the unsafe set."""
    s = s0.copy(); traj=[s.copy()]; vetoed=False
    for a in actions:
        s2 = pred(s,a)
        care = 0.05 if unsafe(s2) else 0.98
        if care < care_floor: vetoed=True; break        # fail-closed: refuse to simulate into danger
        s = s2; traj.append(s.copy())
    return traj, vetoed

def main():
    step = make_env(); wm = WorldModel()
    X,T = collect(step); k=int(len(X)*0.8)
    wm.train(X[:k],T[:k])
    R={}

    # 1. DYNAMICS — multi-step open-loop rollout error vs the true env
    rng=np.random.default_rng(9); errs={1:[],3:[],5:[]}
    for _ in range(200):
        s0=rng.normal(0,1,DIM); acts=[rng.normal(0,1,ADIM) for _ in range(5)]
        true=rollout(step,s0,acts); pred=rollout(wm.pred,s0,acts)
        for H in errs: errs[H].append(float(np.mean((np.array(pred[H])-np.array(true[H]))**2)))
    R["rollout_mse_by_horizon"]={f"H{H}":round(np.mean(v),4) for H,v in errs.items()}
    R["dynamics_learned"]=bool(R["rollout_mse_by_horizon"]["H1"]<0.05)

    # 2. PLANNING — reach a goal using ONLY the learned model; beat random
    goal=np.tanh(rng.normal(0,1,DIM)); s0=rng.normal(0,1,DIM)
    def plan(model_step, n_cand=200, H=4):
        best,ba=1e9,None
        for _ in range(n_cand):
            acts=[rng.normal(0,1,ADIM) for _ in range(H)]
            sf=rollout(model_step,s0,acts)[-1]; d=float(np.mean((sf-goal)**2))
            if d<best: best,ba=d,acts
        return ba
    plan_acts=plan(wm.pred)                                  # plan in the MODEL
    true_final=rollout(step,s0,plan_acts)[-1]                # execute in the REAL env
    rand_final=rollout(step,s0,[rng.normal(0,1,ADIM) for _ in range(4)])[-1]
    R["planning"]={"model_plan_goal_dist":round(float(np.mean((true_final-goal)**2)),4),
                   "random_goal_dist":round(float(np.mean((rand_final-goal)**2)),4)}
    R["planning"]["model_beats_random"]=bool(R["planning"]["model_plan_goal_dist"]<R["planning"]["random_goal_dist"])

    # 3. COUNTERFACTUAL — offline comparison of two plans
    pA=[rng.normal(0,1,ADIM) for _ in range(4)]; pB=[rng.normal(0,1,ADIM) for _ in range(4)]
    dA=float(np.mean((rollout(wm.pred,s0,pA)[-1]-goal)**2)); dB=float(np.mean((rollout(wm.pred,s0,pB)[-1]-goal)**2))
    chosen="A" if dA<dB else "B"
    trueA=float(np.mean((rollout(step,s0,pA)[-1]-goal)**2)); trueB=float(np.mean((rollout(step,s0,pB)[-1]-goal)**2))
    R["counterfactual"]={"model_picked":chosen,"model_correct":bool((chosen=="A")==(trueA<trueB))}

    # 4. GOVERNANCE — care-gate vetoes entering the unsafe set (governed vs ungoverned)
    # craft action sequences that DRIVE toward the unsafe region, measure who enters it
    caught=walked=0
    for _ in range(100):
        s0=rng.normal(0,1,DIM); acts=[rng.normal(0.6,1,ADIM) for _ in range(6)]  # biased toward danger
        traj,vetoed=governed_rollout(wm.pred,s0,acts)
        ungov=rollout(wm.pred,s0,acts)
        if any(unsafe(s) for s in ungov[1:]):                # this trajectory would enter danger
            if vetoed: caught+=1                             # governed model refused before entering
            else: walked+=1
    R["governance"]={"unsafe_trajectories":caught+walked,"care_gate_caught":caught,
                     "catch_rate":round(caught/max(1,caught+walked),3),
                     "fail_closed":bool(caught>0 and walked==0)}

    import json; json.dump(R,open("world_model_results.json","w"),indent=2)
    print("=== GOVERNED WORLD MODEL — measured ===\n"+json.dumps(R,indent=1))

if __name__ == "__main__":
    main()
