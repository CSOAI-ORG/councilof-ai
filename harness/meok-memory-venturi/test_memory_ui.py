import unittest
from memory_ui_tools import memory_rehearsal
from research_lab import components

class MemoryIntegrationTests(unittest.TestCase):
    def test_real_predictor_and_existing_event(self):
        out=memory_rehearsal(17,80)
        p=out['trained_process_replay']
        self.assertEqual(p['actual_neural_evaluations'],8)
        self.assertEqual(p['exact_cache_hits'],4)
        self.assertEqual(p['access_revocation'],'ACCESS_DENIED')
        self.assertTrue(all(e['output_equal_to_initial'] for e in p['events']))
        self.assertEqual(components()[1].validate(out['evidence_event']),[])
        self.assertEqual(out['evidence_event']['state'],'PARTIAL')
        self.assertFalse(out['training_performed'])
        rows={r['strategy']:r for r in out['cache_experiment']['rows']}
        self.assertEqual(rows['revision_lazy']['stale_or_forbidden_returns'],0)
        self.assertGreater(rows['query_only_unsafe']['stale_or_forbidden_returns'],0)
    def test_seed_domain(self):
        for x in [True,-1,10001,1.5]:
            with self.subTest(x=x),self.assertRaises(ValueError):memory_rehearsal(x,80)
    def test_reuse_domain(self):
        for x in [True,49,96,80.5]:
            with self.subTest(x=x),self.assertRaises(ValueError):memory_rehearsal(17,x)
    def test_separate_calls_no_persistent_user_memory(self):
        a=memory_rehearsal(7,50);b=memory_rehearsal(7,50)
        self.assertEqual(a['trained_process_replay']['actual_neural_evaluations'],8)
        self.assertEqual(b['trained_process_replay']['actual_neural_evaluations'],8)
        self.assertNotEqual(a['evidence_event']['event_id'],b['evidence_event']['event_id'])

if __name__=='__main__':unittest.main()
