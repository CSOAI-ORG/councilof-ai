import base64
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

ROOT = Path(__file__).resolve().parents[1]
CODE_ROOT = ROOT/'work' if (ROOT/'work/scripts/master_closed_loop.py').exists() else ROOT
spec = importlib.util.spec_from_file_location('repaired_closed_loop', CODE_ROOT/'scripts/master_closed_loop.py')
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)

@pytest.fixture
def signer():
    return m.HarvestSigner(Ed25519PrivateKey.generate())


def record(n=1):
    return {'schema':'fixture/1', 'observation_kind':'synthetic-test',
            'measurement_performed':False, 'value':n}


# Independent recursive RFC6962 root oracle, not the implementation's parent function.
def oracle(leaves):
    import hashlib
    if not leaves: return hashlib.sha256(b'').digest()
    if len(leaves)==1: return hashlib.sha256(b'\x00'+leaves[0]).digest()
    k=1 << ((len(leaves)-1).bit_length()-1)
    return hashlib.sha256(b'\x01'+oracle(leaves[:k])+oracle(leaves[k:])).digest()

@pytest.mark.parametrize('n',[1,2,3,4,5,7,8,9,16,17,31,32,33,64,65,129])
def test_merkle_all_leaves_against_independent_oracle(n):
    leaves=[m.encoded({'i':i}) for i in range(n)]
    root,layers=m.merkle_root(leaves)
    assert root==oracle(leaves)
    for i,leaf in enumerate(leaves):
        proof=m.inclusion_proof(i,layers)
        assert m.verify_inclusion(leaf,proof,root.hex())
        assert not m.verify_inclusion(leaf+b'!',proof,root.hex())


def test_empty_tree_and_duplicate_payloads():
    root,layers=m.merkle_root([])
    assert root==oracle([]) and layers==[]
    with pytest.raises(m.IntegrityError): m.inclusion_proof(0,layers)
    raw=[b'a',b'a',b'b']
    root,layers=m.merkle_root(raw)
    for i,leaf in enumerate(raw): assert m.verify_inclusion(leaf,m.inclusion_proof(i,layers),root.hex())

@pytest.mark.parametrize('field,value',[
 ('scheme','legacy'),('leaf_index',-1),('leaf_index',True),('leaf_index',2),
 ('tree_size',0),('tree_size',False),('siblings',['not-hex']),('siblings',[]),
 ('siblings',['00'*32,'00'*32]),
])
def test_malformed_proofs_fail(field,value):
    root,layers=m.merkle_root([b'a',b'b'])
    proof=m.inclusion_proof(0,layers);proof[field]=value
    assert not m.verify_inclusion(b'a',proof,root.hex())


def test_added_nodes_not_hidden():
    root3,ls3=m.merkle_root([b'a',b'b',b'c'])
    root4,_=m.merkle_root([b'a',b'b',b'c',b'c'])
    assert root3!=root4
    proof=m.inclusion_proof(2,ls3);proof['tree_size']=4
    assert not m.verify_inclusion(b'c',proof,root3.hex())


def test_detached_signature_checks_exact_bytes_and_trust(signer):
    raw=m.encoded(record()); receipt=signer.sign(raw)
    assert m.verify_signature(raw,receipt)=={'signature':'VALID','signer_authority':'NOT_ESTABLISHED','scope':'harvest-stage-not-board'}
    assert m.verify_signature(raw,receipt,[signer.key_id])['signer_authority']=='ALLOWLISTED_HARVEST_KEY'
    assert m.verify_signature(raw+b' ',receipt)['signature']=='INVALID'

@pytest.mark.parametrize('field,value',[
 ('schema','old'),('algorithm','RSA'),('scope','board'),('artifact_sha256','00'*32),
 ('artifact_bytes',0),('key_id','wrong'),('signature_b64','AAAA'),('public_key_pem','bad')
])
def test_signature_tamper(signer,field,value):
    raw=b'test'; receipt=signer.sign(raw);receipt[field]=value
    assert m.verify_signature(raw,receipt)['signature']=='INVALID'


def test_forged_key_not_trusted(signer):
    raw=b'test'; other=m.HarvestSigner(Ed25519PrivateKey.generate())
    forged=other.sign(raw)
    assert m.verify_signature(raw,forged,[signer.key_id])['signer_authority']=='NOT_ESTABLISHED'


def test_real_rekor_payload_not_placeholder(signer):
    raw=b'{"scope":"synthetic"}'
    receipt=signer.sign(raw); entry=m.prepare_rekor_entry(raw,receipt)
    assert entry['kind']=='rekord' and entry['apiVersion']=='0.0.1'
    sig=entry['spec']['signature']
    assert 'publicKey' in sig and 'public_key' not in sig
    pub=serialization.load_pem_public_key(base64.b64decode(sig['publicKey']['content']))
    pub.verify(base64.b64decode(sig['content']),base64.b64decode(entry['spec']['data']['content']))
    assert base64.b64decode(sig['content'])!=b'\0'*64


def test_rekor_refuses_invalid_signature(signer):
    receipt=signer.sign(b'original')
    with pytest.raises(m.IntegrityError): m.prepare_rekor_entry(b'changed',receipt)

@pytest.mark.parametrize('value',[0,False,[],{},''])
def test_zero_and_empty_not_lost(value):
    assert m.first_present({'measurement':value,'enumerated_count':9},'measurement','enumerated_count')==value


def test_harness_preserves_source_names_and_no_measurement_claim():
    h={'generated_at':'2026-09-17T00:00:00Z','sources_bound_to_harness':[
        {'source':'first','axes':['governance'],'goal_objects':['assurance'],'measurement':0},
        {'source':'second','axes':['governance'],'goal_objects':['assurance'],'measurement':3}]}
    records=m.records_from_harness(h)
    assert [r['source_name'] for r in records]==['first','second']
    assert records[0]['declared_value']==0
    assert all(r['measurement_performed'] is False for r in records)

@pytest.mark.parametrize('source',[
 {'source':'a','goal_objects':['care']}, {'source':'?','goal_objects':[]},
 {'source':'','goal_objects':[]}, {'goal_objects':[]}, {'source':'a','goal_objects':'assurance'},
 {'source':'a','goal_objects':[1]},
])
def test_harness_rejects_invalid_namespace_identity(source):
    with pytest.raises(m.IntegrityError): m.records_from_harness({'sources_bound_to_harness':[source]})

@pytest.mark.parametrize('raw',[b'{"a":1,"a":2}',b'{"x":NaN}',b'{"x":Infinity}',b'{"x":-Infinity}'])
def test_invalid_json_rejected(raw):
    with pytest.raises(m.IntegrityError): m.strict_load(raw)


def test_cross_type_key_and_nan_rejected():
    with pytest.raises(m.IntegrityError): m.encoded({1:'x'})
    with pytest.raises(m.IntegrityError): m.encoded({'x':float('nan')})


def test_immutable_replay_conflict_and_concurrency(tmp_path):
    p=tmp_path/'object.json'
    with ThreadPoolExecutor(max_workers=8) as pool:
        results=list(pool.map(lambda _:m.immutable_write(p,b'test'),range(16)))
    assert sum(results)==1 and p.read_bytes()==b'test'
    with pytest.raises(m.IntegrityError):m.immutable_write(p,b'changed')
    assert not list(tmp_path.glob('.csoai-*'))


def test_no_symlink_write(tmp_path):
    dest=tmp_path/'real';dest.write_bytes(b'original')
    p=tmp_path/'alias';p.symlink_to(dest)
    with pytest.raises(m.IntegrityError):m.immutable_write(p,b'other')
    assert dest.read_bytes()==b'original'


def test_immutable_loop_and_replay(tmp_path,signer):
    rows=[record(1),record(2),record(3),record(1)]
    result=m.run_loop(rows,tmp_path,signer)
    snapshots={str(p.relative_to(tmp_path)):p.read_bytes() for p in tmp_path.rglob('*') if p.is_file()}
    repeat=m.run_loop(rows,tmp_path,signer)
    assert repeat['new_objects']==0
    assert repeat['batch_sha256']==result['batch_sha256']
    assert result['records_received']==4 and result['distinct_records']==3
    assert result['model_evaluations_executed']==result['fixes_executed']==result['publications']==0
    for rel,raw in snapshots.items(): assert (tmp_path/rel).read_bytes()==raw
    for p in (tmp_path/'objects').glob('*.json'):
        assert m.sha256(p.read_bytes())==p.stem
        receipt=json.loads((tmp_path/'signatures'/signer.key_id.split(':')[1]/p.name).read_bytes())
        assert m.verify_signature(p.read_bytes(),receipt)['signature']=='VALID'
        proof=json.loads((tmp_path/'proofs'/result['batch_sha256']/p.name).read_bytes())
        assert m.verify_inclusion(p.read_bytes(),proof,result['root'])
    batch_path=tmp_path/'batches'/(result['batch_sha256']+'.json')
    assert m.sha256(batch_path.read_bytes())==result['batch_sha256']


def test_unsigned_does_not_create_or_find_keys(tmp_path,monkeypatch):
    monkeypatch.setenv('HOME',str(tmp_path/'fake-home'))
    res=m.run_loop([record()],tmp_path/'out')
    assert res['local_signatures_verified']==0 and res['rekor']=='NOT_REQUESTED'
    assert not (tmp_path/'fake-home').exists()


def test_different_sources_never_collapse(tmp_path):
    h={'sources_bound_to_harness':[{'source':'a'},{'source':'b'}]}
    res=m.run_loop(m.records_from_harness(h),tmp_path)
    assert res['distinct_records']==2


def test_compact_under_3000_no_silent_truncation():
    raw=m.compact_reference('a'*64,'b'*64,'c'*64,True)
    assert len(raw)<=3000 and json.loads(raw)['is_new_model_measurement'] is False
    with pytest.raises(m.IntegrityError):m.compact_reference('a'*64,'b'*64,'c'*64,True,10)

@pytest.mark.parametrize('kind',['rekor','ots'])
@pytest.mark.parametrize('transport',['NOT_REQUESTED','SUBMITTED','FAILED','RECEIVED'])
def test_witness_never_promotes_transport_to_proof(kind,transport):
    r=m.observe_witness_attempt(kind,b'payload',transport,b'receipt' if transport=='RECEIVED' else None)
    assert r['cryptographic_state']=='UNCHECKED'
    assert r['bitcoin_confirmation']=='NOT_ESTABLISHED'


def test_received_requires_bytes():
    with pytest.raises(m.IntegrityError):m.observe_witness_attempt('ots',b'payload','RECEIVED')


def test_explicit_key_file(signer,tmp_path):
    p=tmp_path/'key.pem'
    p.write_bytes(signer.private_key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption()))
    p.chmod(0o600)
    loaded=m.HarvestSigner.from_file(p)
    assert loaded.key_id==signer.key_id
    if os.name=='posix':
        p.chmod(0o644)
        with pytest.raises(m.IntegrityError):m.HarvestSigner.from_file(p)


def test_public_cli_output_blocked(tmp_path):
    assert m.main(['--out',str(tmp_path/'public'/'test'),'--harness','nonexistent'])==2


def test_cli_end_to_end_unsigned(tmp_path):
    h=tmp_path/'harness.json';h.write_text(json.dumps({'sources_bound_to_harness':[{'source':'fixture','measurement':0}]}))
    p=subprocess.run([sys.executable,str(CODE_ROOT/'scripts/master_closed_loop.py'),'--harness',str(h),'--out',str(tmp_path/'stage')],capture_output=True,text=True,timeout=15)
    assert p.returncode==0,p.stderr
    r=json.loads(p.stdout)
    assert r['distinct_records']==1 and r['ots']=='NOT_REQUESTED'


def make_bundle(tmp_path,signer):
    res=m.run_loop([record(1),record(2)],tmp_path,signer)
    p=sorted((tmp_path/'objects').glob('*.json'))[0]
    batch=(tmp_path/'batches'/(res['batch_sha256']+'.json')).read_bytes()
    proof=json.loads((tmp_path/'proofs'/res['batch_sha256']/p.name).read_bytes())
    return p.read_bytes(),batch,proof


def test_bundle_checks_all_bindings(tmp_path,signer):
    raw,batch,proof=make_bundle(tmp_path,signer)
    res=m.verify_record_bundle(raw,batch,proof,signer.sign(raw),signer.sign(batch),[signer.key_id])
    assert res['binding']=='VALID'
    assert res['batch_signature']['signer_authority']=='ALLOWLISTED_HARVEST_KEY'
    assert res['external_timestamp']=='NOT_VERIFIED' and res['factual_truth']=='NOT_DETERMINED'

@pytest.mark.parametrize('field,value',[
 ('artifact_sha256','a'*64),('batch_sha256','b'*64),('root','c'*64),
 ('tree_size',3),('leaf_index',1),
])
def test_bundle_rejects_misbound_reference(tmp_path,signer,field,value):
    raw,batch,proof=make_bundle(tmp_path,signer)
    proof[field]=value
    assert m.verify_record_bundle(raw,batch,proof)['binding']=='INVALID'


def test_bundle_rejects_tampered_batch(tmp_path,signer):
    raw,batch,proof=make_bundle(tmp_path,signer)
    b=json.loads(batch);b['tree_size']=1
    assert m.verify_record_bundle(raw,m.encoded(b),proof)['binding']=='INVALID'


def test_mutated_witness_does_not_mutate_payload(tmp_path):
    r=m.run_loop([record()],tmp_path)
    p=next((tmp_path/'objects').glob('*.json'));old=p.read_bytes()
    receipt=m.observe_witness_attempt('ots',old,'RECEIVED',b'synthetic-not-a-real-proof')
    m.immutable_write(tmp_path/'witness-attempts'/ (m.sha256(m.encoded(receipt))+'.json'),m.encoded(receipt))
    assert p.read_bytes()==old and m.sha256(old)==p.stem
