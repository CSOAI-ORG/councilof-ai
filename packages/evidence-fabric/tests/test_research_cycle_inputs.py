"""Regression controls for bounded, nonblocking research-cycle input reads."""
import contextlib
import io
import json
import os
from pathlib import Path
import stat
import subprocess
import sys
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import research_cycle as C


class ResearchCycleInputTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.cat = self.root / 'catalogue.json'
        self.obs = self.root / 'observations.json'
        self.cat.write_text(json.dumps({'schema': 'council.research-catalogue/1', 'records': [
            {'id': 'R1', 'repo': 'example/component', 'commit': 'a' * 40, 'runtime_status': 'NOT_RUN'}]}))
        self.obs.write_text(json.dumps([{'repo': 'example/component', 'observed_commit': 'a' * 40,
            'observed_at': '2026-10-30T09:00:00Z',
            'source_url': 'https://api.github.com/repos/example/component/commits?per_page=1'}]))
        self.store = self.root / 'cycles'

    def tearDown(self):
        self.tmp.cleanup()

    def build(self):
        return C.build(self.cat, self.obs, self.store, '2026-10-30T10:00:00Z')

    def cli(self, *args):
        return subprocess.run([sys.executable, '-B', C.__file__, *map(str, args)],
                              capture_output=True, text=True, timeout=2)

    def build_cli(self):
        return self.cli('build', '--catalogue', self.cat, '--observations', self.obs,
                        '--store', self.store, '--as-of', '2026-10-30T10:00:00Z')

    def test_regular_file_at_exact_bound_is_unchanged(self):
        self.cat.write_bytes(b'0123456789')
        self.assertEqual(C.read_input(self.cat, 10), b'0123456789')

    def test_invalid_bounds_fail_before_open(self):
        for bound in (-1, True, 1.5, None):
            with self.subTest(bound=bound), mock.patch.object(C.os, 'open') as opened:
                with self.assertRaises(C.CycleError):
                    C.read_input(self.cat, bound)
                opened.assert_not_called()

    def test_read_is_bounded_even_if_the_size_check_is_raced(self):
        self.cat.write_bytes(b'01234567890')
        real_fdopen = C.os.fdopen
        calls = []

        class ReadSpy:
            def __init__(self, fd, mode):
                self.stream = real_fdopen(fd, mode)
            def __enter__(self):
                return self
            def __exit__(self, *args):
                self.stream.close()
            def fileno(self):
                return self.stream.fileno()
            def read(self, size=-1):
                calls.append(size)
                return self.stream.read(size)

        with mock.patch.object(C.os, 'fdopen', side_effect=ReadSpy), mock.patch.object(
                C.os, 'fstat', return_value=SimpleNamespace(st_mode=stat.S_IFREG, st_size=0)):
            with self.assertRaisesRegex(C.CycleError, 'byte limit'):
                C.read_input(self.cat, 10)
        self.assertEqual(calls, [11])

    def test_oversized_catalogue_rejected_before_any_stream_read(self):
        with self.cat.open('wb') as stream:
            stream.truncate(C.MAX_BYTES + 1)
        real_fdopen = C.os.fdopen
        reads = []

        class NoRead:
            def __init__(self, fd, mode):
                self.stream = real_fdopen(fd, mode)
            def __enter__(self):
                return self
            def __exit__(self, *args):
                self.stream.close()
            def fileno(self):
                return self.stream.fileno()
            def read(self, size=-1):
                reads.append(size)
                raise AssertionError('oversized input must not be read')

        with mock.patch.object(C.os, 'fdopen', side_effect=NoRead):
            with self.assertRaisesRegex(C.CycleError, 'bounded regular'):
                self.build()
        self.assertEqual(reads, [])
        self.assertFalse(self.store.exists())

    def test_oversized_observation_rejected_without_store_creation(self):
        with self.obs.open('wb') as stream:
            stream.truncate(C.MAX_BYTES + 1)
        with self.assertRaisesRegex(C.CycleError, 'bounded regular'):
            self.build()
        self.assertFalse(self.store.exists())

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'requires POSIX FIFO support')
    def test_fifo_catalogue_returns_rejection_instead_of_hanging(self):
        self.cat.unlink()
        os.mkfifo(self.cat)
        result = self.build_cli()
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('bounded regular', result.stderr)
        self.assertFalse(self.store.exists())

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'requires POSIX FIFO support')
    def test_fifo_observation_returns_rejection_instead_of_hanging(self):
        self.obs.unlink()
        os.mkfifo(self.obs)
        result = self.build_cli()
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('bounded regular', result.stderr)
        self.assertFalse(self.store.exists())

    def test_final_symlink_inputs_are_rejected(self):
        for path in (self.cat, self.obs):
            with self.subTest(path=path.name):
                target = path.with_suffix('.target')
                path.rename(target)
                path.symlink_to(target)
                with self.assertRaises(OSError):
                    self.build()
                self.assertFalse(self.store.exists())
                path.unlink()
                target.rename(path)

    def test_directory_input_is_rejected(self):
        self.cat.unlink()
        self.cat.mkdir()
        with self.assertRaises((OSError, C.CycleError)):
            self.build()
        self.assertFalse(self.store.exists())

    @unittest.skipUnless(hasattr(os, 'mkfifo'), 'requires POSIX FIFO support')
    def test_cli_packet_fifo_returns_rejection(self):
        packet = self.root / 'packet.json'
        os.mkfifo(packet)
        result = self.cli('verify-packet', packet, '--expected-manifest', '0' * 64)
        self.assertEqual(result.returncode, 2, result.stderr)
        self.assertIn('bounded regular', result.stderr)

    def test_cli_packet_uses_the_distinct_aggregate_bound(self):
        with (mock.patch.object(sys, 'argv', ['research_cycle.py', 'verify-packet', 'packet.json',
                                            '--expected-manifest', '0' * 64]),
              mock.patch.object(C, 'read_input', side_effect=C.CycleError('bounded input sentinel')) as reader,
              contextlib.redirect_stderr(io.StringIO())):
            self.assertEqual(C.main(), 2)
        reader.assert_called_once_with('packet.json', C.MAX_PACKET_BYTES)

    def test_exact_predecessor_reader_preserves_event_and_carrier_bytes(self):
        result = self.build()
        binding = C.parse(C.read_regular(result['directory'], 'binding.json'))
        binding['implementation_pins']['research_cycle.py'] = C.INPUT_IO_PREDECESSOR_SHA256
        regenerated = C.derive(self.cat.read_bytes(), self.obs.read_bytes(), binding)
        for name in ('events.jsonl', 'summary.json', 'evaluation.otlp.json', 'evidence.sarif.json'):
            self.assertEqual(regenerated[name], C.read_regular(result['directory'], name))
        binding['implementation_pins']['event.py'] = 'f' * 64
        with self.assertRaisesRegex(C.CycleError, 'reader revision differs'):
            C.derive(self.cat.read_bytes(), self.obs.read_bytes(), binding)

    def test_unknown_reader_is_not_requalified(self):
        result = self.build()
        binding = C.parse(C.read_regular(result['directory'], 'binding.json'))
        binding['implementation_pins']['research_cycle.py'] = 'f' * 64
        with self.assertRaisesRegex(C.CycleError, 'reader revision differs'):
            C.derive(self.cat.read_bytes(), self.obs.read_bytes(), binding)


if __name__ == '__main__':
    unittest.main()
