"""Assert that two deliberately broken private copies fail the target assertions."""
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]

class MutationTests(unittest.TestCase):
    def expect_detected(self, old, new, target):
        source=(ROOT/'render/axis_referee_review.py').read_text()
        self.assertEqual(source.count(old),1,'mutation preimage changed; review the control')
        with tempfile.TemporaryDirectory(prefix='referee-mutant-') as temp:
            base=Path(temp);(base/'render').mkdir();(base/'tests').mkdir()
            shutil.copyfile(ROOT/'event.py',base/'event.py')
            (base/'render/axis_referee_review.py').write_text(source.replace(old,new))
            for name in ('test_axis_referee_review.py','test_axis_referee_continuity.py'):
                shutil.copyfile(ROOT/'tests'/name,base/'tests'/name)
            run=subprocess.run([sys.executable,'-B','-m','unittest','-v',target],cwd=base/'tests',
                               capture_output=True,text=True,timeout=20)
            output=run.stdout+run.stderr
            self.assertNotEqual(run.returncode,0,'broken control escaped the regression suite')
            self.assertIn('AssertionError',output,'failure must be the intended assertion')
            self.assertNotIn('ImportError',output)
            self.assertNotIn('SyntaxError',output)
            self.assertIn('FAILED (failures=1)',output)

    def test_capture_time_mutant_is_detected(self):
        self.expect_detected('    body["claim"].pop("read_at", None)',
                             '    pass  # deliberately retain capture time in continuity identity',
                             'test_axis_referee_continuity.ContinuityTests.test_capture_only_refresh_is_carried_content')

    def test_metadata_whitelist_mutant_is_detected(self):
        self.expect_detected('for key in ("version", "sha256", "mapping_kind")}},',
                             'for key in index["charter"]}},',
                             'test_axis_referee_continuity.ContinuityTests.test_arbitrary_charter_metadata_does_not_escape')

if __name__=='__main__':unittest.main(verbosity=2)
