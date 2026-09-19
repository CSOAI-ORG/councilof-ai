import json
import tempfile
import unittest
from pathlib import Path

import collect_public_token_evidence as c


def abi_string(value):
    raw = value.encode()
    return "0x" + ((32).to_bytes(32, "big") + len(raw).to_bytes(32, "big") + raw + bytes((-len(raw)) % 32)).hex()


class PositiveAndMalformedControls(unittest.TestCase):
    def test_valid_abi_and_large_supply_keep_exact_integer(self):
        self.assertEqual(c.decode_abi(abi_string("LINK"), "string"), "LINK")
        large = 10_000_000_000 * 10**18
        self.assertEqual(c.decode_abi("0x" + large.to_bytes(32, "big").hex(), "uint"), str(large))

    def test_malformed_abi_is_rejected_not_zero(self):
        cases = [("0x", "uint"), ("0x01", "uint"), ("0x" + "00" * 64, "string"),
                 (abi_string("LINK")[:-2], "string"), (abi_string("LINK")[:-2] + "01", "string")]
        for value, kind in cases:
            with self.subTest(value=value), self.assertRaises(ValueError):
                c.decode_abi(value, kind)

    def test_json_rpc_errors_and_mismatched_ids_fail_closed(self):
        self.assertEqual(c.rpc_result(b'{"jsonrpc":"2.0","id":1,"result":"0x1"}', 1), "0x1")
        for obj in ({"jsonrpc": "2.0", "id": 2, "result": "0x1"}, {"jsonrpc": "2.0", "id": 1, "result": None},
                    {"jsonrpc": "2.0", "id": 1, "error": {"code": -32000}}, {"id": 1, "result": "0x1"},
                    {"jsonrpc": "2.0", "id": True, "result": "0x1"}):
            with self.subTest(obj=obj), self.assertRaises(ValueError):
                c.rpc_result(json.dumps(obj), 1)

    def test_link_source_requires_exact_mainnet_section(self):
        source = c.SOURCES[1]
        section = f'### Ethereum Mainnet\n| Chain ID | `1` |\n| Address | {source["contract_address"]} |\n| Symbol | LINK |\n| Decimals | 18 |\n### Sepolia Testnet\n'
        self.assertTrue(c.docs_match(source, section.encode()))
        self.assertFalse(c.docs_match(source, section.replace('`1`', '`11155111`').encode()))
        self.assertFalse(c.docs_match(source, section.replace('Ethereum Mainnet', 'Sepolia Testnet').encode()))
        self.assertFalse(c.docs_match(source, section.replace(source['contract_address'], '0x' + '00' * 20).encode()))

    def test_native_eth_and_ondo_are_not_interchangeable(self):
        self.assertIsNone(c.SOURCES[0]['contract_address'])
        self.assertTrue(c.docs_match(c.SOURCES[0], b'Ether is the native cryptocurrency. Native ETH itself is not an ERC-20 token.'))
        self.assertFalse(c.docs_match(c.SOURCES[0], b'WETH is an ERC-20 token.'))
        ondo = c.SOURCES[2]
        self.assertTrue(c.docs_match(ondo, ('ONDO is the governance token ' + ondo['contract_address']).encode()))
        self.assertFalse(c.docs_match(ondo, b'OUSG token 0x1B19C19393e2d034D8Ff31ff34c81252FcBbee92'))

    def test_receipt_tampering_is_detected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'raw'
            path.write_bytes(b'original')
            receipt = {'body_path': 'raw', 'body_sha256': c.sha(b'original'), 'request_path': 'raw',
                       'request_sha256': c.sha(b'original'), 'headers_path': 'unused', 'headers_sha256': None}
            self.assertEqual(c.check_receipts(tmp, [receipt]), 2)
            path.write_bytes(b'tampered')
            with self.assertRaises(ValueError):
                c.check_receipts(tmp, [receipt])

    def test_transaction_method_is_forbidden(self):
        with tempfile.TemporaryDirectory() as tmp:
            collector = c.Collector(tmp)
            with self.assertRaises(ValueError):
                collector.rpc('https://invalid.example', 'eth_sendRawTransaction', ['0x00'])
            self.assertEqual(collector.receipts, [])

    def test_invalid_or_noncanonical_quantity_is_rejected(self):
        self.assertEqual(c.quantity('0x1'), 1)
        for value in ('0x01', '0x', '', None, '123', '0x-1'):
            with self.subTest(value=value), self.assertRaises(ValueError):
                c.quantity(value)

    def test_failed_chain_returns_no_invented_metadata(self):
        with tempfile.TemporaryDirectory() as tmp:
            collector = c.Collector(tmp)
            collector.rpc = lambda *_args: (None, {'id': 'failed'}, 'provider unavailable')
            chain = collector.chain()
            self.assertEqual(chain['status'], 'UNCHECKABLE')
            self.assertIsNone(chain['primary'])
            self.assertEqual(chain['verified_providers'], [])

    def test_wrong_chain_is_rejected_before_any_block_read(self):
        with tempfile.TemporaryDirectory() as tmp:
            collector = c.Collector(tmp)
            calls = []
            def wrong_chain(endpoint, method, params):
                calls.append(method)
                return '0x89', {'id': 'wrong-chain'}, None
            collector.rpc = wrong_chain
            chain = collector.chain()
            self.assertIsNone(chain['primary'])
            self.assertEqual(calls, ['eth_chainId', 'eth_chainId'])

    def test_second_provider_with_conflicting_block_hash_is_excluded(self):
        with tempfile.TemporaryDirectory() as tmp:
            collector = c.Collector(tmp)
            def response(endpoint, method, params):
                if method == 'eth_chainId':
                    return '0x1', {'id': 'chain'}, None
                block = {'number': '0x1', 'timestamp': '0x1', 'gasUsed': '0x0', 'gasLimit': '0x1',
                         'hash': '0x' + ('11' if endpoint == c.RPCS[0] else '22') * 32,
                         'stateRoot': '0x' + '33' * 32, 'parentHash': '0x' + '00' * 32}
                return block, {'id': 'block'}, None
            collector.rpc = response
            chain = collector.chain()
            self.assertEqual(chain['verified_providers'], [c.RPCS[0]])
            self.assertEqual(chain['attempts'][1]['pinned_block_agreement'], 'UNCHECKABLE')


if __name__ == '__main__':
    unittest.main()
