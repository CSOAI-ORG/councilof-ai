import contextlib, importlib.util, io, json, sys, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('engine', HERE/'hourly_loop_engine.py')
e = importlib.util.module_from_spec(spec); spec.loader.exec_module(e)
class DependencyTests(unittest.TestCase):
    def run_case(self, amend, failures=('1',)):
        loops = [{'id':f'H-{i:02d}','family':'test','name':'synthetic test',
                  'probes':[{'kind':'file','path':str(i)}], 'depends_on':[],
                  'deep_action':'review_only'} for i in range(1,41)]
        loops[-1].update(probes=[], depends_on=[x['id'] for x in loops[:-1]])
        amend(loops)
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); manifest=root/'manifest.json'; state=root/'state'
            manifest.write_text(json.dumps({'loops':loops})); state.mkdir()
            (state/'loop-state.json').write_text(json.dumps({x['id']:{'fingerprint':'old'} for x in loops}))
            def probe(p, **_kwargs):
                return {'source':p['path'],'state':'INCONCLUSIVE' if p['path'] in failures else 'OBSERVED','sha256':'a'*64}
            with patch.object(e,'run_probe',side_effect=probe), patch.object(e,'root_freshness_special'), patch.object(e,'axis_touch',return_value={'state':'INCONCLUSIVE'}), patch.object(sys,'argv',['engine','--manifest',str(manifest),'--state',str(state)]), contextlib.redirect_stdout(io.StringIO()):
                e.main()
            report=json.loads((state/'latest.json').read_text())
            queue=[json.loads(x) for x in (state/'deep-candidates.jsonl').read_text().splitlines()] if (state/'deep-candidates.jsonl').exists() else []
            return {x['id']:x for x in report['receipts']}, queue
    def test_failure_propagates_and_never_queues_dependent(self):
        rows,queue=self.run_case(lambda a:a[1].update(probes=[],depends_on=['H-01']))
        self.assertEqual(rows['H-02']['state'],'INCONCLUSIVE')
        self.assertEqual(rows['H-40']['state'],'INCONCLUSIVE')
        self.assertEqual(rows['H-02']['dependency_states'],{'H-01':'INCONCLUSIVE'})
        self.assertNotIn('H-02',{x['loop_id'] for x in queue})
    def test_failure_propagates_multiple_hops(self):
        def amend(a):
            a[1].update(probes=[],depends_on=['H-01']); a[2].update(probes=[],depends_on=['H-02'])
        rows,_=self.run_case(amend)
        self.assertEqual(rows['H-03']['state'],'INCONCLUSIVE')
    def test_own_success_cannot_override_failed_dependency(self):
        rows,_=self.run_case(lambda a:a[1].update(depends_on=['H-01']))
        self.assertEqual(rows['H-02']['state'],'INCONCLUSIVE')
    def test_all_healthy_dependencies_remain_observed(self):
        rows,queue=self.run_case(lambda a:a[1].update(probes=[],depends_on=['H-01']),failures=())
        self.assertEqual(rows['H-02']['state'],'OBSERVED')
        self.assertEqual(rows['H-40']['state'],'OBSERVED')
        self.assertIn('H-02',{x['loop_id'] for x in queue})
        self.assertTrue(all(x['execution']=='not_performed' and x['publication']=='not_performed' for x in queue))
    def test_no_evidence_is_inconclusive(self):
        rows,_=self.run_case(lambda a:a[1].update(probes=[],depends_on=[]),failures=())
        self.assertEqual(rows['H-02']['state'],'INCONCLUSIVE')
    def test_real_manifest_dependency_order_is_valid(self):
        e.validate_loop_graph(json.loads((HERE/'loops.json').read_text())['loops'])
    def test_duplicate_id_rejected(self):
        with self.assertRaises(ValueError): e.validate_loop_graph([{'id':'A'},{'id':'A'}])
    def test_missing_dependency_rejected(self):
        with self.assertRaises(ValueError): e.validate_loop_graph([{'id':'A','depends_on':['B']}])
    def test_self_cycle_rejected(self):
        with self.assertRaises(ValueError): e.validate_loop_graph([{'id':'A','depends_on':['A']}])
    def test_cycle_or_forward_dependency_rejected(self):
        with self.assertRaises(ValueError): e.validate_loop_graph([{'id':'A','depends_on':['B']},{'id':'B','depends_on':['A']}])
    def test_duplicate_dependency_rejected(self):
        with self.assertRaises(ValueError): e.validate_loop_graph([{'id':'A'},{'id':'B','depends_on':['A','A']}])
    def test_bad_dependency_type_rejected(self):
        with self.assertRaises(ValueError): e.validate_loop_graph([{'id':'A','depends_on':'B'}])
    def test_invalid_graph_cannot_write_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp); m=p/'manifest.json'; target=p/'untouched'
            m.write_text(json.dumps({'loops':[{'id':'SAME'}]*40}))
            with patch.object(sys,'argv',['engine','--manifest',str(m),'--state',str(target)]), self.assertRaises(ValueError): e.main()
            self.assertFalse(target.exists())
if __name__=='__main__': unittest.main()
