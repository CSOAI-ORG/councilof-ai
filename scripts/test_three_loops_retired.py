import contextlib,io,runpy,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
class LegacyOutreachTests(unittest.TestCase):
 def invoke(self,args):
  script=Path(__file__).with_name('three_loops.py')
  with patch.object(sys,'argv',[str(script),*args]),patch('urllib.request.urlopen',side_effect=AssertionError('Network must not run')),patch('opentimestamps.calendar.RemoteCalendar.submit',side_effect=AssertionError('Timestamp must not run')),contextlib.redirect_stderr(io.StringIO()):
   with self.assertRaises(SystemExit) as e:runpy.run_path(str(script),run_name='__main__')
   self.assertEqual(e.exception.code,2)
 def test_outreach_guard_runs_before_output_or_network(self):
  with tempfile.TemporaryDirectory() as d:
   target=Path(d)/'not-created';self.invoke(['--loop','1','--out',str(target)]);self.assertFalse(target.exists())
 def test_default_all_is_not_a_sender_or_publisher(self):self.invoke([])
 def test_legacy_measurement_cannot_write_public_tree(self):self.invoke(['--loop','2','--out',str(Path(__file__).resolve().parents[1]/'public/interop/three-loops')])
if __name__=='__main__':unittest.main()
