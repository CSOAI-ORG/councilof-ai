import copy
import datetime as dt
import unittest
import paper_diagnostics as d

watch,paper = d.load_frozen()
AT=dt.datetime(2026,9,19,17,tzinfo=dt.timezone.utc)
def fixture(prices=None):
    prices=prices or [100.]*40
    return [dict(symbol='BTC/USDC',exchange='coinbase',bid=p,ask=p+.1,
        observed_at=(AT+dt.timedelta(seconds=30*i)).isoformat()) for i,p in enumerate(prices)]

class DiagnosticsTests(unittest.TestCase):
    def test_cash_has_no_fees_or_gain(self):
        rows=fixture(); result=paper.replay(rows,'cash_baseline')
        a=d.attribution(rows,result)
        self.assertEqual(a['total_modeled_friction'],0)
        self.assertEqual(a['virtual_net_pnl'],0)
    def test_flat_hold_loss_is_entirely_cost(self):
        rows=fixture(); a=d.attribution(rows,paper.replay(rows,'buy_hold_paper'))
        self.assertAlmostEqual(a['midprice_component_same_fills'],0)
        self.assertAlmostEqual(a['virtual_net_pnl'],-a['total_modeled_friction'])
        self.assertGreater(a['modeled_final_liquidation_cost'],0)
    def test_all_strategies_reconcile_variable_prices(self):
        import math
        rows=fixture([100+5*math.sin(i/4) for i in range(100)])
        for strategy in paper.STRATEGIES:
            a=d.attribution(rows,paper.replay(rows,strategy))
            self.assertLess(abs(a['identity_error']),1e-7)
    def test_upward_hold_has_positive_midprice_component(self):
        rows=fixture([100+i for i in range(40)])
        a=d.attribution(rows,paper.replay(rows,'buy_hold_paper'))
        self.assertGreater(a['midprice_component_same_fills'],0)
        self.assertLess(a['virtual_net_pnl'],a['midprice_component_same_fills'])
    def test_insufficient_is_not_zero(self):
        rows=fixture()[:3]
        self.assertIsNone(d.attribution(rows,paper.replay(rows,'buy_hold_paper'))['virtual_net_pnl'])
    def test_tampered_profit_rejected(self):
        rows=fixture(); result=paper.replay(rows,'buy_hold_paper'); result['virtual_profit']+=1
        with self.assertRaises(ValueError): d.attribution(rows,result)
    def test_tampered_price_rejected(self):
        rows=fixture(); result=paper.replay(rows,'buy_hold_paper'); result['fills'][0]['price']+=1
        with self.assertRaises(ValueError): d.attribution(rows,result)
    def test_tampered_fee_rejected(self):
        rows=fixture(); result=paper.replay(rows,'buy_hold_paper'); result['fills'][0]['fee']+=1
        with self.assertRaises(ValueError): d.attribution(rows,result)
    def test_duplicate_input_rejected(self):
        rows=fixture(); result=paper.replay(rows,'buy_hold_paper')
        with self.assertRaises(ValueError): d.attribution(rows+[rows[0]],result)
    def test_no_input_mutation(self):
        rows=fixture(); before=copy.deepcopy(rows); result=paper.replay(rows,'buy_hold_paper')
        saved=copy.deepcopy(result); d.attribution(rows,result)
        self.assertEqual(rows,before); self.assertEqual(result,saved)
    def test_unknown_side_rejected(self):
        rows=fixture(); result=paper.replay(rows,'buy_hold_paper'); result['fills'][0]['side']='transfer'
        with self.assertRaises(ValueError): d.attribution(rows,result)

class ReceiptTests(unittest.TestCase):
    def receipt(self, rows):
        return watch.make_receipt(watch.load_manifest(),rows,AT+dt.timedelta(hours=1))
    def test_full_receipt_reconciles(self):
        output=d.diagnose(self.receipt(fixture()))
        self.assertEqual(output['reconciliation'],'MATCH')
        self.assertEqual(output['groups']['momentum_paper']['usable_cases'],1)
        self.assertFalse(output['changes_to_strategy'])
    def test_rehashed_wrong_result_rejected(self):
        receipt=self.receipt(fixture())
        receipt['payload']['report']['results'][0]['virtual_profit']=50
        receipt['payload_sha256']=paper.digest(receipt['payload'])
        with self.assertRaises(ValueError): d.diagnose(receipt)
    def test_empty_family_unknown_not_zero(self):
        output=d.diagnose(self.receipt([]))
        self.assertIsNone(output['groups']['cash_baseline']['virtual_net_pnl'])
        self.assertEqual(output['groups']['cash_baseline']['insufficient_cases'],12)
    def test_empty_dashboard_renders_unknown(self):
        html=d.html_page(d.diagnose(self.receipt([])))
        self.assertIn('INSUFFICIENT',html)
        self.assertIn('Simulation only',html)

if __name__=='__main__': unittest.main(verbosity=2)
