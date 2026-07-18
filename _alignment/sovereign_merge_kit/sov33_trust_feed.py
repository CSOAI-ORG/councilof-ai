#!/usr/bin/env python3
"""sov33_trust_feed.py — the trust-panel feed: tail the SIGIL hash-chain as human-readable governed-action rows.
This is the cheapest high-value differentiator: the audit trail MADE VISIBLE. Every row is an attested action."""
import os, sys, json, glob, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
def _sov_dir():
    d=os.environ.get('SOV33_SIGIL_DIR') or os.path.join(os.path.expanduser('~'),'.sovereign')
    try: os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=os.path.join(tempfile.gettempdir(),'sov33_sigil'); os.makedirs(d,exist_ok=True); return d

def feed(limit=50):
    rows=[]
    for cf in glob.glob(os.path.join(_sov_dir(),'*.sigil.jsonl')):
        chain=os.path.basename(cf).replace('.sigil.jsonl','')
        try:
            for line in open(cf):
                if line.strip():
                    e=json.loads(line)
                    rows.append({'chain':chain,'digest':e.get('digest'),'ts':e.get('ts'),
                                 'hop':e.get('hop') or e.get('content_hash') or 'action',
                                 'prev':e.get('prev_hash')})
        except Exception: pass
    rows.sort(key=lambda r:r.get('ts') or '', reverse=True)
    return {'rows':rows[:limit],'total':len(rows),'schema':'sov33.trustfeed.v1',
            'note':'each row = one attested governed action (SIGIL hash-chained). This is the audit trail visible.'}

if __name__=='__main__':
    f=feed(); print(f"trust feed: {f['total']} attested actions across chains")
