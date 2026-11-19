"""Real Gradio controls with exact-source service; external identity is mocked only where noted."""
from pathlib import Path
import os,sys,copy,unittest,json
from unittest.mock import patch
ROOT=Path(__file__).resolve().parent
os.environ['GRADIO_ANALYTICS_ENABLED']='false'
os.environ['HF_HUB_OFFLINE']='1'
os.environ['SYSTEM']=''
os.environ.pop('MEOK_MEMORY_ROOT',None)
sys.path[:0]=[str(ROOT/'candidate'),str(ROOT/'source')]
import gradio as gr
import memory_ui as ui
import memory_readiness as ready

class UITests(unittest.TestCase):
 def make(self):
  with gr.Blocks() as demo:
   controls=ui.create_controls();state=gr.State(None)
   outputs=[state]+[gr.Textbox() for _ in range(7)];consent=gr.Checkbox(False)
   event=gr.Button('test chat event').click(lambda:None,[],state,api_visibility='private')
   bound=ui.bind_controls(controls,state,outputs,consent,event)
  self.addCleanup(demo.close)
  return demo,controls,bound
 def test_unconfigured_disables_four_actions_and_consent(self):
  d,c,b=self.make()
  for name in ('save','refresh','restore','remove','opt_in'):self.assertIs(c[name].interactive,False)
  self.assertIn('not configured',c['status'].value)
 def test_availability_control_stays_usable(self):
  d,c,b=self.make();self.assertIsNot(c['availability'].interactive,False)
 def test_readiness_callback_has_zero_client_inputs(self):
  d,c,b=self.make();deps=d.get_config_file()['dependencies']
  found=[x for x in deps if x.get('api_name')=='memory_readiness']
  self.assertEqual(len(found),1);self.assertEqual(found[0]['inputs'],[]);self.assertEqual(len(found[0]['outputs']),8)
 def test_recheck_clears_stale_selection_and_consent(self):
  d,c,b=self.make();out=b['availability']()
  self.assertEqual(out[5].choices,[]);self.assertIsNone(out[5].value);self.assertIs(out[4].value,False)
  self.assertEqual(out[7]['state'],'NOT_CONFIGURED');self.assertFalse(out[7]['identity_verified'])
 def test_mount_recovery_is_only_availability_not_permission(self):
  d,c,b=self.make()
  with patch.object(ui,'assess_storage',return_value=ready._result('MOUNT_ACCESSIBLE_UNQUALIFIED')):out=b['availability']()
  for x in out[:4]:self.assertIs(x.interactive,True)
  self.assertIs(out[4].value,False)
  for k in ('identity_verified','write_performed','durability_qualified','execution_authority'):self.assertIs(out[7][k],False)
 def test_later_mount_loss_disables_again(self):
  d,c,b=self.make()
  with patch.object(ui,'assess_storage',return_value=ready._result('MOUNT_ACCESSIBLE_UNQUALIFIED')):b['availability']()
  out=b['availability']()
  self.assertTrue(all(x.interactive is False for x in out[:4]))
 def test_no_auth_or_storage_write_on_readiness_check(self):
  with patch.object(ui._SERVICE,'save') as save,patch.object(ui._SERVICE,'list') as listing,patch('memory_auth.HfApi') as api:
   d,c,b=self.make();b['availability']()
  save.assert_not_called();listing.assert_not_called();api.assert_not_called()
 def test_direct_anonymous_calls_still_refused(self):
  d,c,b=self.make()
  with patch('memory_auth.HfApi') as api:
   self.assertEqual(b['list']()[2]['operation'],'refused')
   self.assertEqual(b['save'](None,True)[2]['operation'],'refused')
   self.assertEqual(b['restore']('a'*64)[10]['operation'],'refused')
   self.assertEqual(b['remove']('a'*64)[2]['operation'],'refused')
  api.assert_not_called()
 def test_optin_still_required(self):
  d,c,b=self.make()
  with patch('memory_auth.HfApi') as api:out=b['save'](None,False)
  self.assertEqual(out[2]['operation'],'refused');self.assertIn('consent',out[2]['reason']);api.assert_not_called()
 def test_failed_restore_preserves_chat_fields(self):
  d,c,b=self.make();out=b['restore']('a'*64)
  self.assertEqual(out[:9],tuple(gr.skip() for _ in range(9)))
  self.assertIs(out[11],False);self.assertEqual(out[12].choices,[])
 def test_existing_handler_contracts_preserved(self):
  d,c,b=self.make();deps=d.get_config_file()['dependencies']
  for name,n in [('memory_save',2),('memory_list',0),('memory_restore',1),('memory_remove',1)]:
   x=next(x for x in deps if x.get('api_name')==name)
   self.assertEqual(len(x['inputs']),n);self.assertEqual(x['api_visibility'],'undocumented')
 def test_authenticated_unconfigured_list_remains_refused(self):
  import time
  d,c,b=self.make();token=gr.OAuthToken(token='hf_synthetic_test',scope='openid profile',expires_at=time.time()+60)
  with patch('memory_auth.HfApi') as api:
   api.return_value.whoami.return_value={'type':'user','id':'test-subject'}
   out=b['list'](token)
  self.assertEqual(out[2]['operation'],'refused');self.assertIn('not configured',out[2]['reason'])
  api.return_value.whoami.assert_called_once_with(token='hf_synthetic_test',cache=False)

if __name__=='__main__':
 suite=unittest.defaultTestLoader.loadTestsFromTestCase(UITests)
 result=unittest.TextTestRunner(verbosity=2).run(suite)
 receipt={'tests':result.testsRun,'errors':len(result.errors),'failures':len(result.failures),'skipped':len(result.skipped),'gradio':gr.__version__,'python':sys.version,'new_model_calls':0,'external_identity_calls':0,'persistent_storage_writes':0,'scope':'Actual Gradio controller/binding tests; no browser or mounted backend qualification.'}
 (ROOT/'ui-tests-result.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt))
 raise SystemExit(0 if result.wasSuccessful() and result.testsRun==12 and not result.skipped else 1)
