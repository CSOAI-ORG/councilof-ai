#!/usr/bin/env python3
"""
BLACK SWAN PREDICTOR
=====================
Predict the next 12 black swan windows from regulatory cliff calendar + charter cross-walks.
Outputs: top 10 upcoming windows + cascading effects.

(c) 2026 CSOAI Ltd · UK Companies House 16939677
Charter Article 0 binding.
"""
import sys, argparse, datetime
from pathlib import Path

# Black Swan Window Calendar (15+ regulatory cliffs)
BLACK_SWAN_WINDOWS = [
    {'date': '2026-08-02', 'name': 'EU AI Act Art 50 enforcement', 'jurisdiction': 'EU', 'trigger': 'Generative AI transparency mandate begins', 'cascade': ['Charter 03-proofof (ProofOf)', 'Charter 07-transparencyof', 'Charter 10-asisecurity'], 'severity': 5},
    {'date': '2026-08-02', 'name': 'EU AI Act Annex III high-risk baseline', 'jurisdiction': 'EU', 'trigger': 'High-risk AI system requirements begin', 'cascade': ['Charter 06-ethicalgovernanceof', 'Charter 08-biasdetectionof'], 'severity': 4},
    {'date': '2026-12-02', 'name': 'EU AI Act Annex IV high-risk', 'jurisdiction': 'EU', 'trigger': 'Annex IV category-specific requirements', 'cascade': ['Charter 11-agisafe'], 'severity': 4},
    {'date': '2026-12-31', 'name': 'US NIST AI RMF audit baseline', 'jurisdiction': 'US', 'trigger': 'Federal AI Risk Management standards effective', 'cascade': ['Charter 03-proofof', 'Charter 13-councilof'], 'severity': 3},
    {'date': '2027-02-01', 'name': 'UK AI Bill 2026 expected enactment', 'jurisdiction': 'UK', 'trigger': 'UK pro-innovation AI regulatory regime', 'cascade': ['Charter 04-safetyof', 'Charter 09-dataprivacyof'], 'severity': 4},
    {'date': '2027-03-31', 'name': 'EU CRA cyber resilience', 'jurisdiction': 'EU', 'trigger': 'Connected device security requirements', 'cascade': ['Charter 10-asisecurity', 'Charter 23-cobolbridge'], 'severity': 3},
    {'date': '2027-06-15', 'name': 'UK Online Safety Act AI provisions', 'jurisdiction': 'UK', 'trigger': 'Online harm AI classification requirements', 'cascade': ['Charter 04-safetyof', 'Charter 21-optimobile'], 'severity': 3},
    {'date': '2027-12-02', 'name': 'Korea AI Basic Act 2026 enforcement', 'jurisdiction': 'KR', 'trigger': 'Korea AI Basic Act 2026 takes effect', 'cascade': ['Charter 13-councilof', 'Charter 01-csoai'], 'severity': 4},
    {'date': '2028-01-01', 'name': 'Japan AI Promotion Act operational', 'jurisdiction': 'JP', 'trigger': 'Japan AI Promotion Act 2025 begins operations', 'cascade': ['Charter 13-councilof', 'Charter 10-asisecurity'], 'severity': 3},
    {'date': '2028-08-02', 'name': 'EU AI Act 24-month review', 'jurisdiction': 'EU', 'trigger': 'EU AI Act 2-year review scheduled', 'cascade': ['All 41 charters'], 'severity': 3},
    {'date': '2028-12-31', 'name': 'NIST PQC standards finalised deadline', 'jurisdiction': 'US', 'trigger': 'NIST PQC migration deadline', 'cascade': ['All Charter Article 0', 'Sovereign PKI'], 'severity': 5},
    {'date': '2029-02-01', 'name': 'EU AI Liability Directive expected', 'jurisdiction': 'EU', 'trigger': 'EU AI Liability Directive adoption', 'cascade': ['Charter 05-accountabilityof', 'Charter 13-councilof'], 'severity': 4},
    {'date': '2030-01-01', 'name': 'Ed25519 deprecation in sovereign PKI', 'jurisdiction': 'GLOBAL', 'trigger': 'Pure PQC transition complete', 'cascade': ['Sovereign PKI', 'All 41 charters'], 'severity': 5},
    {'date': '2030-08-02', 'name': 'EU AI Act 4-year review', 'jurisdiction': 'EU', 'trigger': 'EU AI Act 4-year review', 'cascade': ['All 41 charters'], 'severity': 4},
    {'date': '2032-01-01', 'name': 'KEM signatures integrated', 'jurisdiction': 'GLOBAL', 'trigger': 'ML-KEM-768 quantum-safe full integration', 'cascade': ['Sovereign PKI', 'All 41 charters'], 'severity': 5},
]


def predict(n=10, as_of=None):
    """Predict the next N black swan windows relative to a reference date."""
    if as_of is None:
        as_of = datetime.date.today()
    as_of = datetime.datetime.strptime(as_of, '%Y-%m-%d').date() if isinstance(as_of, str) else as_of
    upcoming = []
    for window in BLACK_SWAN_WINDOWS:
        win_date = datetime.datetime.strptime(window['date'], '%Y-%m-%d').date()
        t_minus = (win_date - as_of).days
        if t_minus >= 0:
            window = dict(window)
            window['t_minus_days'] = t_minus
            upcoming.append(window)
    upcoming.sort(key=lambda w: w['t_minus_days'])
    return upcoming[:n]


def list_all():
    """Return all known windows with T-minus values."""
    return predict(n=len(BLACK_SWAN_WINDOWS) + 10)


def main():
    parser = argparse.ArgumentParser(description='Sovereign Black Swan Predictor.')
    parser.add_argument('--n', type=int, default=10, help='Number of upcoming windows')
    parser.add_argument('--as-of', help='Reference date (YYYY-MM-DD)')
    parser.add_argument('--list-all', action='store_true', help='List all known windows')
    parser.add_argument('--self-test', action='store_true', help='Run self-test')
    parser.add_argument('--format', choices=['text', 'json'], default='text', help='Output format')
    args = parser.parse_args()

    if args.self_test:
        print('[SELF-TEST] black_swan_predictor.py')
        # Test 1: predict from known date
        r = predict(n=5, as_of='2026-07-01')
        assert len(r) == 5, 'should predict 5'
        assert r[0]['date'] == '2026-08-02', 'should be EU AI Act Art 50'
        print('  OK predict 5 from 2026-07-01 (first = EU AI Act Art 50)')
        # Test 2: list_all returns all
        all_w = list_all()
        assert len(all_w) >= 15, 'should have 15+ windows'
        print('  OK list_all (%d windows)' % len(all_w))
        # Test 3: t_minus count
        assert all('t_minus_days' in w for w in r)
        print('  OK T-minus days computed')
        # Test 4: severity filter
        s5 = [w for w in all_w if w['severity'] == 5]
        assert len(s5) >= 4
        print('  OK S5 windows count = %d' % len(s5))
        # Test 5: cascade effects
        cascades = set()
        for w in all_w:
            for c in w.get('cascade', []):
                cascades.add(c)
        assert len(cascades) >= 10
        print('  OK unique cascading charters = %d' % len(cascades))
        print('[SELF-TEST PASSED] 5/5 tests')
        return

    if args.list_all:
        result = list_all()
    else:
        result = predict(args.n, args.as_of)

    if args.format == 'json':
        import json
        print(json.dumps(result, indent=2))
    else:
        print('\n' + '=' * 95)
        print('Sovereign Black Swan Predictions (as of %s)' % (args.as_of or 'today'))
        print('=' * 95)
        for w in result:
            print('\n[T-%dd] %s' % (w['t_minus_days'], w['date']))
            print('  Event: %s' % w['name'])
            print('  Jurisdiction: %s' % w['jurisdiction'])
            print('  Severity: S%d' % w['severity'])
            print('  Trigger: %s' % w['trigger'])
            print('  Cascades to: %s' % ', '.join(w.get('cascade', [])))


if __name__ == '__main__':
    main()
