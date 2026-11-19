"""Dependency-free inference for MEOK's synthetic process-state research model.
Predictions are not observations, permissions, or GSPC measurements.
"""
import argparse, hashlib, json, math
from pathlib import Path

class ProcessPredictor:
    def __init__(self, path, expected_sha256=None):
        raw=Path(path).read_bytes()
        if len(raw)>262144: raise ValueError('Model exceeds size bound')
        self.sha256=hashlib.sha256(raw).hexdigest()
        if expected_sha256 is not None and self.sha256!=expected_sha256: raise ValueError('Model digest mismatch')
        self.model=json.loads(raw)
        if self.model.get('format')!='meok.experimental-process-predictor/1': raise ValueError('Unsupported model format')
        self.weights=self.model['coefs'];self.bias=self.model['intercepts']
        self.mean=self.model['scaler_mean'];self.scale=self.model['scaler_scale']
        if len(self.mean)!=11 or len(self.scale)!=11 or any(v<=0 or not math.isfinite(v) for v in self.scale): raise ValueError('Invalid scaler')
        if not 1<=len(self.weights)<=5 or len(self.weights)!=len(self.bias):raise ValueError('Invalid layer count')
        width=11
        for a,b in zip(self.weights,self.bias):
            if len(a)!=width or not 1<=len(b)<=1024 or any(len(row)!=len(b) for row in a):raise ValueError('Invalid tensor shape')
            if any(not math.isfinite(v) for row in a for v in row) or any(not math.isfinite(v) for v in b):raise ValueError('Nonfinite weights')
            width=len(b)
        if width!=4:raise ValueError('Wrong output shape')
    def predict(self, features, constrained=True):
        if not isinstance(features,list) or len(features)!=11 or any(type(v) not in (int,float) or not math.isfinite(v) for v in features):raise ValueError('Expected 11 finite numeric features')
        if any(v<0 or v>1 for v in features[:7]) or abs(sum(features[:4])-1)>1e-8 or abs(sum(features[4:7])-1)>1e-8:raise ValueError('Invalid observed proportions')
        if features[7] not in (0,1) or features[9] not in (0,1) or not -.875<=features[8]<=1.125 or not 0<=features[10]<=.875:raise ValueError('Outside qualified synthetic input range')
        x=[(v-m)/s for v,m,s in zip(features,self.mean,self.scale)]
        for i,(a,b) in enumerate(zip(self.weights,self.bias)):
            x=[sum(v*row[j] for v,row in zip(x,a))+b[j] for j in range(len(b))]
            if i<len(self.weights)-1:x=[max(0,v) for v in x]
        raw=x[:]
        if constrained:
            x=[min(1,max(0,v)) for v in x];total=sum(x)
            x=[v/total for v in x] if total else features[:4]
            if features[8]<=0:x=features[:4]
        return {'state':'MODEL_PREDICTION_NOT_OBSERVED','prediction':x,'raw_prediction':raw,'weights_sha256':self.sha256,'known_expiry_rule_applied':bool(constrained and features[8]<=0),'synthetic_domain_only':True,'authorises_execution':False,'gspc_admitted':False}

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--weights',default=str(Path(__file__).with_name('weights.json')));parser.add_argument('--features',required=True);parser.add_argument('--expected-sha256');parser.add_argument('--raw',action='store_true');args=parser.parse_args()
    try:print(json.dumps(ProcessPredictor(args.weights,args.expected_sha256).predict(json.loads(args.features),not args.raw)))
    except (ValueError,KeyError,TypeError) as exc:raise SystemExit(str(exc))
