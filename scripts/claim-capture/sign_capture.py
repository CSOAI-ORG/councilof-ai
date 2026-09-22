#!/usr/bin/env python3
"""Detached capture-only signatures. Never uses or impersonates the board signing key."""
import base64, datetime as dt, hashlib, json, os
from pathlib import Path
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
BASE=Path(__file__).resolve().parent

def sign(root_path):
 folder=BASE/'private';folder.mkdir(mode=0o700,exist_ok=True);folder.chmod(0o700)
 keyfile=folder/'capture-ed25519.pem'
 if not keyfile.exists():
  key=Ed25519PrivateKey.generate();raw=key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption())
  try:
   fd=os.open(keyfile,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
   with os.fdopen(fd,'wb') as f:f.write(raw)
  except FileExistsError:pass
 keyfile.chmod(0o600);key=serialization.load_pem_private_key(keyfile.read_bytes(),password=None)
 if not isinstance(key,Ed25519PrivateKey):raise ValueError('Capture key is not Ed25519')
 pub=key.public_key().public_bytes(serialization.Encoding.Raw,serialization.PublicFormat.Raw)
 kid=hashlib.sha256(pub).hexdigest();data=root_path.read_bytes();sig=key.sign(data);key.public_key().verify(sig,data)
 side=root_path.with_name(root_path.name+'.sig.json')
 if side.exists():
  old=json.loads(side.read_bytes())
  if old['key_id_sha256']!=kid or old['signed_file_sha256']!=hashlib.sha256(data).hexdigest():raise ValueError('Existing signature identity changed; manual rotation required')
  return old
 record={'schema':'csoai.capture-signature/0.1','algorithm':'Ed25519','key_id_sha256':kid,'public_key_base64':base64.b64encode(pub).decode(),'signature_base64':base64.b64encode(sig).decode(),'signed_file_sha256':hashlib.sha256(data).hexdigest(),'signed_at':dt.datetime.now(dt.timezone.utc).isoformat(),'key_role':'dedicated capture-pipeline key; not the board key','identity_assurance':'self-published key; not independently identity-verified','scope':'Exact root manifest bytes only; no claim of source truth, reserve sufficiency, Bitcoin confirmation or payment.'}
 tmp=side.with_suffix('.tmp');tmp.write_text(json.dumps(record,indent=2)+'\n');os.replace(tmp,side)
 return record
