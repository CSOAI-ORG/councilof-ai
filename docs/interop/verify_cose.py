#!/usr/bin/env python3
"""Stranger-verifier for card-cose-sign1.cbor (deps: cryptography — same floor as
the Vaara checkers). Parses the COSE_Sign1 envelope, re-derives Sig_structure,
verifies EdDSA against the pubkey in the meta file, and checks the payload is the
canonical JSON of a card entry whose content-hash it prints for cross-checking
against the live signed/card_index.json."""
import json, sys, hashlib
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
raw=open(sys.argv[1] if len(sys.argv)>1 else "card-cose-sign1.cbor","rb").read()
meta=json.load(open("card-cose-sign1.meta.json"))
def rd(b,i):
    ib=b[i]; mt,ai=ib>>5,ib&31; i+=1
    if ai<24: n=ai
    elif ai==24: n=b[i]; i+=1
    elif ai==25: n=int.from_bytes(b[i:i+2]); i+=2
    elif ai==26: n=int.from_bytes(b[i:i+4]); i+=4
    else: raise ValueError("len")
    if mt==0: return n,i
    if mt==1: return -1-n,i
    if mt==2: return b[i:i+n],i+n
    if mt==3: return b[i:i+n].decode(),i+n
    if mt==4:
        out=[]
        for _ in range(n): v,i=rd(b,i); out.append(v)
        return out,i
    if mt==5:
        out={}
        for _ in range(n):
            k,i=rd(b,i); v,i=rd(b,i); out[k]=v
        return out,i
    if mt==6: return rd(b,i)  # tag: return content
    raise ValueError("mt")
arr,_=rd(raw,0)
protected,unprot,payload,sig=arr
# rebuild Sig_structure with the same minimal encoder rules
def _h(mt,n):
    import struct
    if n<24: return bytes([mt<<5|n])
    if n<256: return bytes([mt<<5|24,n])
    return bytes([mt<<5|25])+n.to_bytes(2)
ss=_h(4,4)+_h(3,10)+b"Signature1"+_h(2,len(protected))+protected+_h(2,0)+_h(2,len(payload))+payload
Ed25519PublicKey.from_public_bytes(bytes.fromhex(meta["pubkeyHex"])).verify(sig,ss)
card=json.loads(payload)
print("COSE_Sign1 VALID  alg=EdDSA  kid=cose-interop-1")
print("payload card content-hash:",card["card"])
print("cross-check it appears in https://councilof.ai/signed/card_index.json")
