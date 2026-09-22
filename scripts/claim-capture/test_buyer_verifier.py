import unittest
from hashlib import sha256
import claim_capture as cc
from verify_csoai_delivery import verify_inclusion as verify
class Tests(unittest.TestCase):
 def test_bounds(self):
  root=sha256(b'\x00a').hexdigest()
  for i,n in [(999,1),(0,0),(-1,1),(0,427),(True,1),(0,True)]:self.assertFalse(verify(b'a',i,[],n,root))
 def test_427_valid(self):
  rows=[str(i).encode() for i in range(427)];root=cc.merkle_root(rows).hex()
  for i in range(427):self.assertTrue(verify(rows[i],i,[bytes.fromhex(p['hash']) for p in cc.inclusion(rows,i)],427,root))
 def test_missing_extra_tampered(self):
  rows=[str(i).encode() for i in range(17)];root=cc.merkle_root(rows).hex()
  for i in range(17):
   proof=[bytes.fromhex(p['hash']) for p in cc.inclusion(rows,i)]
   self.assertFalse(verify(rows[i],i,proof[:-1],17,root))
   self.assertFalse(verify(rows[i],i,proof+[b'0'*32],17,root))
   self.assertFalse(verify(rows[i]+b'!',i,proof,17,root))
 def test_invalid_hash_length(self):self.assertFalse(verify(b'a',0,[b'x'],2,'0'*64))
if __name__=='__main__':unittest.main(verbosity=2)
