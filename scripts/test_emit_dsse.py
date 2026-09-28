import base64
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

import emit_dsse

class DSSETests(unittest.TestCase):
    def test_pae_known_shape(self):
        self.assertEqual(emit_dsse.pae('text/plain', b'abc'), b'DSSEv1 10 text/plain 3 abc')

    def test_envelope_signs_pae(self):
        sk=Ed25519PrivateKey.generate(); env,pub=emit_dsse.build_envelope(b'payload',sk,'text/plain')
        self.assertEqual(emit_dsse.verify_envelope(env,pub),b'payload')
        raw_sig=base64.b64decode(env['signatures'][0]['sig'])
        with self.assertRaises(InvalidSignature):
            sk.public_key().verify(raw_sig,b'payload')

    def test_payload_type_is_authenticated(self):
        sk=Ed25519PrivateKey.generate(); env,pub=emit_dsse.build_envelope(b'payload',sk,'text/plain')
        env['payloadType']='application/json'
        with self.assertRaises(InvalidSignature): emit_dsse.verify_envelope(env,pub)

if __name__=='__main__': unittest.main()
