#!/usr/bin/env python3
"""sov33_world_model_stress.py — STRESS-TEST our own world model on CHAOTIC dynamics (honesty register:
attack our own clean result). The prior env was contractive (tanh) so rollout error stayed flat — that flatters
a world model. Real dynamics are often chaotic (small errors compound). This measures the HONEST limits:

  1. Is the env actually chaotic?      — perturbation-growth (a positive Lyapunov proxy).
  2. Open-loop rollout error vs horizon — expect it to GROW under chaos (the real limit of world models).
  3. Closed-loop (MPC re-plan each step) — the standard fix; should stay low despite chaos.
  4. Does the CARE-GATE still hold?      — catch-rate of unsafe transitions under hard dynamics (the moat must be robust).

HONEST: CPU numpy. The point is to find + report where the world model breaks (open-loop under chaos) and show
what survives (closed-loop accuracy + governance). A world model that only works on easy dynamics is a toy;
naming its failure mode is the honest science.
"""
import numpy as np, json

DIM, ADIM = 8, 4
R_LOGI = 3.9   # logistic parameter in the chaotic regime (Lyapunov > 0)

def make_chaotic_env(seed=0):
    # coupled logistic-map lattice: a GENUINELY chaotic system (unlike bounded tanh). State in [0,1]^DIM.
    rng = np.random.default_rng(seed); B = rng.normal(0, 0.05, (DIM, ADIM)); eps = 0.3
    def f(x): return R_LOGI * x * (1 - x)
    def step(s, a):
        s = np.clip(s + B @ a, 0, 1)                              # action nudges the state
        fx = f(s); left = np.roll(fx, 1); right = np.roll(fx, -1)
        return np.clip((1 - eps) * fx + 0.5 * eps * (left + right), 0, 1)  # diffusive coupling -> spatiotemporal chaos
    return step

def unsafe(s): return s[0] > 0.9

class WM:
    def __init__(s, h=64, seed=1):
        r=np.random.default_rng(seed); n=DIM+ADIM
        s.W1=r.normal(0,np.sqrt(2/(n+h)),(n,h)); s.b1=np.zeros(h)
        s.W2=r.normal(0,np.sqrt(2/(h+DIM)),(h,DIM)); s.b2=np.zeros(DIM)
    def pred(s,st,a):
        x=np.concatenate([st,a]); H=np.tanh(x@s.W1+s.b1); return np.tanh(H@s.W2+s.b2)
    def _f(s,X): H=np.tanh(X@s.W1+s.b1); return np.tanh(H@s.W2+s.b2),H
    def train(s,X,T,ep=600,lr=0.05):
        for _ in range(ep):
            Y,H=s._f(X); n=len(X); dY=2*(Y-T)/n*(1-Y**2)
            dW2=H.T@dY; db2=dY.sum(0); dH=(dY@s.W2.T)*(1-H**2); dW1=X.T@dH; db1=dH.sum(0)
            for g in (dW1,db1,dW2,db2): np.clip(g,-5,5,out=g)
            s.W1-=lr*dW1; s.b1-=lr*db1; s.W2-=lr*dW2; s.b2-=lr*db2

def collect(step,n=3000,seed=3):
    rng=np.random.default_rng(seed); X,T=[],[]
    for _ in range(n):
        s=rng.random(DIM); a=rng.normal(0,1,ADIM); X.append(np.concatenate([s,a])); T.append(step(s,a))
    return np.array(X),np.array(T)

def main():
    step=make_chaotic_env(); wm=WM(); X,T=collect(step); k=int(len(X)*0.8); wm.train(X[:k],T[:k])
    rng=np.random.default_rng(9); R={"env":"coupled-logistic-lattice r=3.9"}

    # 1. chaos check: how fast do two nearby true trajectories diverge?
    div=[]
    for _ in range(200):
        s=rng.random(DIM); acts=[rng.normal(0,1,ADIM) for _ in range(8)]
        s2=s+1e-4*rng.normal(0,1,DIM); a=s.copy(); b=s2.copy()
        for act in acts: a=step(a,act); b=step(b,act)
        div.append(float(np.linalg.norm(a-b)))
    R["perturbation_growth_x"]=round(float(np.mean(div))/1e-4,1)   # >>1 => chaotic (errors amplify)
    R["is_chaotic"]=bool(np.mean(div)/1e-4 > 5)

    # 2. OPEN-LOOP rollout error vs horizon (expect growth)
    ol={1:[],3:[],5:[],10:[]}
    for _ in range(200):
        s0=rng.random(DIM); acts=[rng.normal(0,1,ADIM) for _ in range(10)]
        ts=s0.copy(); ps=s0.copy()
        for h in range(1,11):
            a=acts[h-1]; ts=step(ts,a); ps=wm.pred(ps,a)
            if h in ol: ol[h].append(float(np.mean((ps-ts)**2)))
    R["open_loop_mse_by_H"]={f"H{h}":round(np.mean(v),4) for h,v in ol.items()}
    R["open_loop_degrades"]=bool(R["open_loop_mse_by_H"]["H10"] > 3*R["open_loop_mse_by_H"]["H1"])

    # 3. CLOSED-LOOP (MPC): re-observe the true state each step, only ever predict 1 step -> should stay low
    cl=[]
    for _ in range(200):
        s0=rng.random(DIM); acts=[rng.normal(0,1,ADIM) for _ in range(10)]
        ts=s0.copy()
        for a in acts:
            p=wm.pred(ts,a); tn=step(ts,a); cl.append(float(np.mean((p-tn)**2))); ts=tn
    R["closed_loop_mse"]=round(np.mean(cl),4)
    R["closed_loop_survives"]=bool(R["closed_loop_mse"] < 0.05)

    # 4. GOVERNANCE under chaos: does the care-gate still catch unsafe transitions?
    caught=walked=0
    for _ in range(200):
        s=rng.random(DIM); acts=[rng.normal(0.6,1,ADIM) for _ in range(6)]
        # ungoverned true trajectory
        t=s.copy(); enters=False
        for a in acts:
            t=step(t,a)
            if unsafe(t): enters=True; break
        if not enters: continue
        # governed: stop the instant the MODEL predicts an unsafe next state (1-step, closed-loop)
        g=s.copy(); vetoed=False
        for a in acts:
            if unsafe(wm.pred(g,a)): vetoed=True; break
            g=step(g,a)
        if vetoed: caught+=1
        else: walked+=1
    R["governance_under_chaos"]={"unsafe":caught+walked,"caught":caught,
        "catch_rate":round(caught/max(1,caught+walked),3),"holds":bool(caught/max(1,caught+walked) >= 0.9)}

    json.dump(R,open("world_model_stress_results.json","w"),indent=2)
    print("=== WORLD MODEL STRESS TEST (chaotic dynamics) ===\n"+json.dumps(R,indent=1))
    print("\nHONEST READ:",
          f"env chaotic={R['is_chaotic']} ({R['perturbation_growth_x']}x); "
          f"open-loop DEGRADES={R['open_loop_degrades']} (expected); "
          f"closed-loop SURVIVES={R['closed_loop_survives']}; "
          f"governance HOLDS={R['governance_under_chaos']['holds']} ({R['governance_under_chaos']['catch_rate']}).")

if __name__ == "__main__":
    main()
