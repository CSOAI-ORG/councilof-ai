#!/usr/bin/env python3
"""Tests for the census window archiver.

The archiver copies dated Hub census windows out of superseded PR branches so
that closing those branches does not delete observations that exist nowhere
else. It is copying EVIDENCE, so the bytes must be exactly the bytes of the
branch's blob, filed under the RIGHT window's directory.

THE FAULT THIS EXISTS TO CATCH. The first draft read `FETCH_HEAD` after the
loop instead of inside it. `git fetch` overwrites FETCH_HEAD on every fetch,
so every window was written from the LAST branch fetched: eleven directories
of correct-looking JSON, filed under eleven wrong dates, with the right
window_end in the index and the wrong bytes underneath. A size check would
not have caught it - the files were the right shape. Only a byte comparison
against the source branch caught it, and that comparison is what these tests
make routine.

Run: python3 scripts/census/archive_windows.test.py
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest

_HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    'archive_windows', os.path.join(_HERE, 'archive_windows.py'))
aw = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(aw)


def make_git_repo(tmp):
    """A tiny git repo with two branches, each holding a DIFFERENT file.

    `main` holds 'main-content'; `branch-a` holds 'branch-a-content'.
    """
    repo = os.path.join(tmp, 'repo')
    os.makedirs(repo)
    run = lambda *a: subprocess.run(['git', *a], cwd=repo, capture_output=True)
    run('init', '-q', '-b', 'main')
    run('config', 'user.email', 't@example.com')
    run('config', 'user.name', 'test')
    with open(os.path.join(repo, 'f.txt'), 'w', encoding='utf-8') as h:
        h.write('main-content\n')
    run('add', 'f.txt')
    run('commit', '-qm', 'main')
    run('checkout', '-qb', 'branch-a')
    with open(os.path.join(repo, 'f.txt'), 'w', encoding='utf-8') as h:
        h.write('branch-a-content\n')
    run('commit', '-qam', 'branch-a')
    run('checkout', '-q', 'main')
    return repo


class ArchiveWindowTest(unittest.TestCase):

    def test_the_rolling_paths_are_the_five_the_workflow_overwrites(self):
        self.assertEqual(len(aw.ROLLING), 5)
        self.assertIn('public/interop/hf-census/SUMMARY.json', aw.ROLLING)
        self.assertIn('public/interop/hf-census/org-register.json', aw.ROLLING)
        self.assertIn('public/signed/hub-census-delta.json', aw.ROLLING)
        self.assertIn('scripts/census/delta.SUMMARY.json', aw.ROLLING)

    def test_every_rolling_path_has_a_destination_name(self):
        for src in aw.ROLLING:
            self.assertIn(src, aw.DEST, f'{src} has no destination')
            self.assertNotIn('/', aw.DEST[src],
                             'a destination must be a flat file name')

    def test_the_index_states_what_a_window_is_not(self):
        """A window is a COUNT. The index must never read like a measurement."""
        rows = [{
            'pr': 1, 'branch': 'b', 'window_end': '2026-10-15T09:18:47Z',
            'window_start': '2026-10-15T03:18:44Z', 'n': 2509,
            'n_measured': 0, 'status_all': 'UNMEASURED',
            'listing_state_all': 'DISCOVERED',
        }]
        idx = aw.index(rows)
        self.assertIn('not a measurement', idx['what_this_is_not'].lower())
        self.assertIn('not a cumulative total', idx['what_this_is_not'].lower())
        self.assertEqual(idx['n_windows'], 1)
        self.assertEqual(idx['windows'][0]['n_measured'], 0)
        self.assertEqual(idx['windows'][0]['status_all'], 'UNMEASURED')

    def test_a_window_is_filed_under_its_own_date(self):
        rows = [
            {'pr': 1, 'branch': 'b1', 'window_end': '2026-10-15T09:18:47Z',
             'window_start': '2026-10-15T03:18:44Z', 'n': 2509,
             'n_measured': 0, 'status_all': 'UNMEASURED',
             'listing_state_all': 'DISCOVERED'},
            {'pr': 2, 'branch': 'b2', 'window_end': '2026-10-16T09:12:46Z',
             'window_start': '2026-10-16T03:12:44Z', 'n': 2405,
             'n_measured': 0, 'status_all': 'UNMEASURED',
             'listing_state_all': 'DISCOVERED'},
        ]
        idx = aw.index(rows)
        self.assertEqual(idx['windows'][0]['directory'],
                         'public/interop/hf-census/windows/2026-10-15')
        self.assertEqual(idx['windows'][1]['directory'],
                         'public/interop/hf-census/windows/2026-10-16')

    def test_a_branch_is_read_inside_its_own_iteration(self):
        """THE REGRESSION TEST for the mis-filing fault.

        FETCH_HEAD is overwritten by every fetch. If the archiver reads it
        after the loop, every window gets the LAST branch's bytes. This test
        drives `apply` over two real branches with different content and
        asserts each directory holds ITS OWN bytes.
        """
        with tempfile.TemporaryDirectory() as tmp:
            repo = make_git_repo(tmp)
            # Two "windows", each with a distinct payload, on a real repo.
            rows = [
                {'pr': 1, 'branch': 'branch-a',
                 'window_end': '2026-10-15T09:18:47Z',
                 'window_start': '2026-10-15T03:18:44Z', 'n': 1,
                 'n_measured': 0, 'status_all': 'UNMEASURED',
                 'listing_state_all': 'DISCOVERED'},
                {'pr': 2, 'branch': 'main',
                 'window_end': '2026-10-16T09:12:46Z',
                 'window_start': '2026-10-16T03:12:44Z', 'n': 2,
                 'n_measured': 0, 'status_all': 'UNMEASURED',
                 'listing_state_all': 'DISCOVERED'},
            ]
            original_rolling = list(aw.ROLLING)
            original_dest = dict(aw.DEST)
            try:
                aw.ROLLING[:] = ['f.txt']
                aw.DEST.clear()
                aw.DEST['f.txt'] = 'f.txt'
                # `apply` fetches from origin; point it at this local repo.
                original_git = aw.git

                def local_git(*args, **kwargs):
                    if args and args[0] == 'fetch':
                        return subprocess.run(
                            ['git', 'fetch', '.', args[2]],
                            cwd=repo, capture_output=True)
                    kwargs['cwd'] = repo
                    return original_git(*args, **kwargs)

                aw.git = local_git
                aw.apply(repo, rows)
            finally:
                aw.git = original_git
                aw.ROLLING[:] = original_rolling
                aw.DEST.clear()
                aw.DEST.update(original_dest)

            first = open(os.path.join(
                repo, 'public/interop/hf-census/windows/2026-10-15/f.txt'),
                'rb').read()
            second = open(os.path.join(
                repo, 'public/interop/hf-census/windows/2026-10-16/f.txt'),
                'rb').read()
            self.assertEqual(first, b'branch-a-content\n',
                             'the 2026-10-15 window holds the wrong bytes')
            self.assertEqual(second, b'main-content\n',
                             'the 2026-10-16 window holds the wrong bytes')
            self.assertNotEqual(first, second,
                                'two windows must not hold identical bytes')


if __name__ == '__main__':
    unittest.main(verbosity=2)
