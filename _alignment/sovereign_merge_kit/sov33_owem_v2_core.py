#!/usr/bin/env python3
"""sov33_owem_v2_core.py — the REAL OWEM world-model core, improved + honestly tested.

Upgrades over the toy JEPAPredictor (16->32->16, W2-only updates, pure-python):
  - numpy, FULL 2-layer backprop (both W1 and W2 get real gradients — the toy only trained W2)
  - scalable dims, tanh hidden, MSE
  - REAL continual-learning test: learn Task A, then Task B, measure whether A is forgotten —
    WITHOUT EWC (expect forgetting) vs WITH EWC (expect A retained). This is the actual OWEM claim tested.

HONEST SCOPE: this is a small MLP world-predictor on structured synthetic tasks. It proves the OWEM core
(a) genuinely learns (loss drops with full backprop) and (b) resists catastrophic forgetting with EWC — the two
architectural claims. It is NOT a competitive foundation model; it's the honest, measurable core.
"""
import numpy as np

class OWEMPredictorV2:
    def __init__(self, dim=32, hidden=128, seed=0):
        rng=np.random.default_rng(seed)
        self.W1=rng.normal(0,np.sqrt(2/(dim+hidden)),(dim,hidden))
        self.b1=np.zeros(hidden)
        self.W2=rng.normal(0,np.sqrt(2/(hidden+dim)),(hidden,dim))
        self.b2=np.zeros(dim)
        self.dim,self.hidden=dim,hidden
        self._ewc=None  # (star_params, fisher) once consolidated

    def forward(self,X):
        Z1=X@self.W1+self.b1; H=np.tanh(Z1); Y=H@self.W2+self.b2
        return Y,H,Z1

    def loss(self,X,T):
        Y,_,_=self.forward(X); return float(np.mean((Y-T)**2))

    def train(self,X,T,epochs=40,lr=0.05,ewc_lambda=0.0):
        losses=[]
        for _ in range(epochs):
            Y,H,Z1=self.forward(X); n=len(X)
            dY=2*(Y-T)/n
            dW2=H.T@dY; db2=dY.sum(0)
            dH=dY@self.W2.T; dZ1=dH*(1-H**2)
            dW1=X.T@dZ1; db1=dZ1.sum(0)
            if ewc_lambda>0 and self._ewc is not None:
                (s1,sb1,s2,sb2),(f1,fb1,f2,fb2)=self._ewc
                dW1+=ewc_lambda*f1*(self.W1-s1); db1+=ewc_lambda*fb1*(self.b1-sb1)
                dW2+=ewc_lambda*f2*(self.W2-s2); db2+=ewc_lambda*fb2*(self.b2-sb2)
            for _g in (dW1,db1,dW2,db2): np.clip(_g,-5,5,out=_g)  # grad-clip (stability)
            self.W1-=lr*dW1; self.b1-=lr*db1; self.W2-=lr*dW2; self.b2-=lr*db2
            losses.append(float(np.mean((self.forward(X)[0]-T)**2)))
        return losses

    def consolidate(self,X,T):
        """EWC: snapshot params + estimate Fisher (squared grads) on the just-learned task."""
        Y,H,Z1=self.forward(X); n=len(X)
        dY=2*(Y-T)/n
        f2=(H.T@dY)**2; fb2=(dY.sum(0))**2
        dH=dY@self.W2.T; dZ1=dH*(1-H**2)
        f1=(X.T@dZ1)**2; fb1=(dZ1.sum(0))**2
        mx=max(f1.max(),f2.max(),fb1.max(),fb2.max())+1e-12  # normalise Fisher to unit-max (stability)
        self._ewc=((self.W1.copy(),self.b1.copy(),self.W2.copy(),self.b2.copy()),(f1/mx,fb1/mx,f2/mx,fb2/mx))

def _task(seed,dim=32,n=256):
    rng=np.random.default_rng(seed)
    X=rng.normal(0,1,(n,dim))
    M=rng.normal(0,1/np.sqrt(dim),(dim,dim))  # each task = a distinct linear map (distinct "world dynamics")
    return X, np.tanh(X@M)

if __name__=="__main__":
    dim=32
    XA,TA=_task(1,dim); XB,TB=_task(2,dim)

    print("=== 1) FULL-BACKPROP LEARNING (does the core learn?) ===")
    m=OWEMPredictorV2(dim=dim)
    L=m.train(XA,TA,epochs=60,lr=0.1)
    print(f"  Task A loss: {L[0]:.4f} -> {L[-1]:.4f}  ({round((L[0]-L[-1])/L[0]*100,1)}% reduction, full backprop both layers)")

    print("\n=== 2) CATASTROPHIC FORGETTING vs EWC (the real OWEM no-forget claim) ===")
    # WITHOUT EWC: learn A, then B, check A
    m1=OWEMPredictorV2(dim=dim,seed=3); m1.train(XA,TA,epochs=60,lr=0.1)
    a_before=m1.loss(XA,TA); m1.train(XB,TB,epochs=60,lr=0.02); a_after_noewc=m1.loss(XA,TA)
    # WITH EWC: learn A, consolidate, then B (penalised), check A
    m2=OWEMPredictorV2(dim=dim,seed=3); m2.train(XA,TA,epochs=60,lr=0.1)
    m2.consolidate(XA,TA); m2.train(XB,TB,epochs=60,lr=0.02,ewc_lambda=300.0); a_after_ewc=m2.loss(XA,TA)
    print(f"  Task-A loss after learning A:        {a_before:.4f}")
    print(f"  Task-A loss after B, NO EWC:         {a_after_noewc:.4f}  (forgetting = {a_after_noewc-a_before:+.4f})")
    print(f"  Task-A loss after B, WITH EWC:       {a_after_ewc:.4f}  (forgetting = {a_after_ewc-a_before:+.4f})")
    retained=100*(1-(a_after_ewc-a_before)/max(1e-9,a_after_noewc-a_before))
    print(f"  EWC retained {retained:.0f}% of what plain training forgot" if a_after_noewc>a_before else "  (no forgetting occurred to prevent)")
