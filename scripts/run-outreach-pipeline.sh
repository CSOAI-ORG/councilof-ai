#!/bin/bash
# Autonomous Care Home Outreach Pipeline
# Generates emails for uncontacted care homes

cd /Users/nicholas/clawd/optometry-integration

echo "=== CAR HOME OUTREACH PIPELINE ==="
python3 outreach_engine.py report
echo ""

# Show top 5 prospects
echo "=== TOP 5 PROSPECTS (largest homes first) ==="
python3 outreach_engine.py prospects 5

echo ""
echo "=== GENERATING EMAIL FOR LARGEST HOME ==="
python3 outreach_engine.py email
echo ""

echo "=== PIPELINE VALUE ==="
python3 -c "
import sqlite3
conn = sqlite3.connect('/Users/nicholas/care-homes-essex.db')
c = conn.cursor()
c.execute('SELECT SUM(residents) FROM care_homes WHERE contacted=0')
total = c.fetchone()[0] or 0
# Average contract value: £8K per home
revenue = len([x for x in c.execute('SELECT id FROM care_homes WHERE contacted=0')]) * 8000
print(f'Uncontacted homes: {total} residents')
print(f'Potential revenue: £{revenue:,}/year')
print(f'Target (30% conversion): £{int(revenue*0.3):,}/year')
print(f'MRR equivalent: £{int(revenue*0.3/12):,}/month')
"
echo ""
echo "✅ Pipeline ready. Run: python3 outreach_engine.py email"
