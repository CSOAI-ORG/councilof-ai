"""Strict completion contract for this pinned synthetic Worker; not source/authentication proof."""
import hashlib,json,math
WEIGHTS='9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b'
EXPIRY='2026-11-12T00:00:00Z'
TOLERANCE=1e-12
class ContractError(ValueError):pass

def decode(raw,maximum=64000):
    if type(raw) is not bytes or len(raw)>maximum:raise ContractError('RESPONSE_BYTE_BOUND')
    def pairs(items):
        result={}
        for key,value in items:
            if key in result:raise ContractError('DUPLICATE_JSON_KEY')
            result[key]=value
        return result
    def constant(_):raise ContractError('NONFINITE_JSON_CONSTANT')
    try:return json.loads(raw.decode('utf-8','strict'),object_pairs_hook=pairs,parse_constant=constant)
    except (UnicodeError,json.JSONDecodeError,RecursionError) as e:raise ContractError('INVALID_JSON_ENCODING') from e

def finite(x):return type(x) in (int,float) and math.isfinite(x)

def exact_rule(features):
    if features[8]<=0:return features[:4]
    return [0,features[4]+features[5],features[6],0] if features[7]==features[9]==1 else [features[4],features[5],features[6],0]

def validate_prediction(payload,request_bytes,features,reference):
    fields={'schema','state','weights_sha256','input_sha256','rows','outputs','limits','signed','persisted','authorises_execution','gspc_admitted','cosmos_loaded'}
    if type(payload) is not dict or set(payload)!=fields:raise ContractError('RESPONSE_FIELDS')
    if payload['schema']!='csoai.process-cross-runtime/1' or payload['state']!='SYNTHETIC_PREDICTIONS_ONLY':raise ContractError('RESPONSE_IDENTITY')
    if payload['weights_sha256']!=WEIGHTS or payload['input_sha256']!=hashlib.sha256(request_bytes).hexdigest():raise ContractError('REQUEST_OR_MODEL_BINDING')
    if type(features) is not list or not 1<=len(features)<=8 or len(reference)!=len(features):raise ContractError('EXPECTED_BATCH')
    count=len(features)
    if type(payload['rows']) is not int or payload['rows']!=count:raise ContractError('DECLARED_ROW_COUNT')
    outputs=payload['outputs']
    if type(outputs) is not list or len(outputs)!=count:raise ContractError('ACTUAL_OUTPUT_COUNT')
    if any(payload[k] is not False for k in ['signed','persisted','authorises_execution','gspc_admitted','cosmos_loaded']):raise ContractError('RESEARCH_BOUNDARY')
    limits=payload['limits']
    if type(limits) is not dict or set(limits)!={'max_input_bytes','max_rows','expires_at'}:raise ContractError('LIMIT_FIELDS')
    if type(limits['max_input_bytes']) is not int or limits['max_input_bytes']!=8192 or type(limits['max_rows']) is not int or limits['max_rows']!=8 or limits['expires_at']!=EXPIRY:raise ContractError('LIMIT_VALUES')
    worst=0.0
    for output,x,ref in zip(outputs,features,reference):
        if type(output) is not dict or set(output)!={'raw','constrained','exact_synthetic_rule','expiry_rule_applied'}:raise ContractError('OUTPUT_FIELDS')
        if type(output['expiry_rule_applied']) is not bool or output['expiry_rule_applied']!=(x[8]<=0):raise ContractError('EXPIRY_RULE_BINDING')
        for name,expected in [('raw',ref['raw_prediction']),('constrained',ref['prediction']),('exact_synthetic_rule',exact_rule(x))]:
            actual=output[name]
            if type(actual) is not list or len(actual)!=4 or not all(finite(v) for v in actual):raise ContractError('OUTPUT_VECTOR')
            if type(expected) is not list or len(expected)!=4 or not all(finite(v) for v in expected):raise ContractError('REFERENCE_VECTOR')
            if name!='raw' and (any(v<0 or v>1 for v in actual) or abs(sum(actual)-1)>1e-8):raise ContractError('OUTPUT_SIMPLEX')
            for a,b in zip(actual,expected):
                delta=abs(a-b)
                if delta>TOLERANCE:raise ContractError('NUMERICAL_MISMATCH')
                worst=max(worst,delta)
    return {'verified_rows':count,'verified_scalar_values':12*count,'max_absolute_difference':worst,'tolerance':TOLERANCE,'signature_verified':False,'execution_authority':False}
