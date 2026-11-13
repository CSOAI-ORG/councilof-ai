#!/usr/bin/env python3
# Dependency-free raw and rule-constrained inference for MEOK v1 research weights.
import argparse,json,math

def predict(features,model):
    if len(features)!=len(model["features"]): raise ValueError("wrong feature count")
    if any(not math.isfinite(float(x)) for x in features): raise ValueError("non-finite feature")
    z=[(float(x)-m)/s for x,m,s in zip(features,model["scaler_mean"],model["scaler_scale"])]
    predictions=[]
    for member in model["ensemble"]:
        a=z[:]
        for i,(w,b) in enumerate(zip(member["coefs"],member["intercepts"])):
            a=[sum(a[j]*w[j][k] for j in range(len(a)))+b[k] for k in range(len(b))]
            if i+1<len(member["coefs"]): a=[max(0.0,x) for x in a]
        predictions.append(a)
    raw=[sum(p[k] for p in predictions)/len(predictions) for k in range(4)]
    clipped=[min(1.0,max(0.0,x)) for x in raw];total=sum(clipped)
    constrained=[x/total for x in clipped] if total>1e-12 else [float(x) for x in features[:4]]
    if float(features[9])<=0.0: constrained=[float(x) for x in features[:4]]
    return {"state":"MODEL_PREDICTION_NOT_OBSERVED","raw_prediction":raw,"constrained_prediction":constrained,"constraints_applied":["clip_and_normalise_to_simplex","preserve_previous_state_when_permit_expired"],"authority":"NONE"}

if __name__=="__main__":
    p=argparse.ArgumentParser();p.add_argument("--weights",default="weights.json");p.add_argument("--features",required=True);a=p.parse_args()
    print(json.dumps(predict(json.loads(a.features),json.load(open(a.weights))),allow_nan=False))