import hashlib
import io
import json
import shutil
import tempfile
import unittest
import zipfile
from pathlib import Path
import build

class PublicationTests(unittest.TestCase):
    def test_repeatable_archive_and_manifest(self):
        first=build.generate();self.assertEqual(first,build.generate())
        manifest=json.loads(first['manifest.json'])
        for name,row in manifest['files'].items():
            self.assertEqual(hashlib.sha256(first[name]).hexdigest(),row['sha256'])
        with zipfile.ZipFile(io.BytesIO(first['key-evidence-profile.zip'])) as archive:
            self.assertIn('profile.py',archive.namelist())
            self.assertIn('THIRD_PARTY_NOTICES.md',archive.namelist())
            self.assertTrue(all(x.compress_type==zipfile.ZIP_STORED for x in archive.infolist()))

    def test_unlisted_local_file_is_never_published(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)/'kit';shutil.copytree(build.HERE,root,ignore=shutil.ignore_patterns('__pycache__','.venv'))
            (root/'private-test-marker.txt').write_text('synthetic non-public test marker')
            before=build.HERE
            try:
                build.HERE=root;out=build.generate()
                with zipfile.ZipFile(io.BytesIO(out['key-evidence-profile.zip'])) as archive:
                    self.assertNotIn('private-test-marker.txt',archive.namelist())
            finally:build.HERE=before

    def test_changed_test_source_invalidates_execution_record(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td)/'kit';shutil.copytree(build.HERE,root,ignore=shutil.ignore_patterns('__pycache__','.venv'))
            with (root/'profile.py').open('a') as stream:stream.write('\n# changed source\n')
            before=build.HERE
            try:
                build.HERE=root
                with self.assertRaises(AssertionError):build.generate()
            finally:build.HERE=before

if __name__=='__main__':unittest.main(verbosity=2)
