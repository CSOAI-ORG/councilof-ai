import importlib.util,unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('report',Path(__file__).with_name('inspection_report.py'));r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)
class ReportTests(unittest.TestCase):
 def setUp(self):
  self.value={'source_id':'fixture','source_url':'https://example.invalid/<script>alert(1)</script>','source_as_of':'2026-09-01','records_recounted':2,'recorded_state_counts_recounted':{'UNMEASURED':2},**{k:'a'*64 for k in ['request_id','packet_sha256','delivery_sha256','source_sha256','observation_sha256','method_sha256','full_request_record_sha256']}}
 def render(self):
  with patch.object(r,'verify_packet',return_value=self.value):return r.render_report(b'fixture','a'*64,'b'*64)
 def test_source_text_is_escaped(self):
  html=self.render();self.assertNotIn('<script>alert(1)</script>',html);self.assertIn('&lt;script&gt;',html)
 def test_no_remote_active_resources(self):
  html=self.render();self.assertNotIn('<script',html);self.assertNotIn('<iframe',html);self.assertNotIn('src=',html);self.assertIn("default-src 'none'",html)
 def test_recount_is_not_fresh_measurement(self):
  html=self.render();self.assertIn('not a new measurement',html);self.assertIn('publisher is not authenticated',html)
 def test_original_date_remains_visible(self):self.assertIn('2026-09-01',self.render())
 def test_verify_failure_prevents_render(self):
  with patch.object(r,'verify_packet',side_effect=ValueError('tampered')):
   with self.assertRaises(ValueError):r.render_report(b'bad')
 def test_empty_collection_has_no_false_zero_assessment(self):
  self.value['records_recounted']=None;self.value['recorded_state_counts_recounted']={};html=self.render();self.assertIn('Not a row-indexed collection',html)
if __name__=='__main__':unittest.main()
