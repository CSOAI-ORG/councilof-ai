#!/usr/bin/env python3
"""sov33_mcp_cards.py — export SOV33's capability surface as tappable MCP-card JSON for the overlay workspace.
Each card = {id, title, desc, args, scope, governed}. The overlay renders these; the character invokes them
GOVERNED (care-floor -> SIGIL) via sov33.ask. This is the data feed behind 'the desktop becomes a true AI-OS'."""
import os, sys, json, inspect, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
def _sov_dir():
    d=os.environ.get('SOV33_SIGIL_DIR') or os.path.join(os.path.expanduser('~'),'.sovereign')
    try: os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=os.path.join(tempfile.gettempdir(),'sov33_sigil'); os.makedirs(d,exist_ok=True); return d

def export_cards():
    import sov33
    cards=[]
    for name, fn in sorted(sov33.CAPABILITIES.items()):
        try:
            sig=inspect.signature(fn)
            args=[p for p in sig.parameters if p not in ('kwargs','args')]
        except Exception:
            args=[]
        doc=(inspect.getdoc(fn) or '').split('\n')[0][:120]
        cards.append({'id':name,'title':name.replace('-',' ').title(),'desc':doc,
                      'args':args,'governed':True})  # every card flows through the gate when invoked
    out={'cards':cards,'count':len(cards),'schema':'sov33.mcpcards.v1',
         'note':'render as tappable cards; invoke via sov33.ask (care-floor -> SIGIL). governed=True always.'}
    p=os.path.join(_sov_dir(),'mcp_cards.json'); json.dump(out,open(p,'w'),indent=2)
    return out

if __name__=='__main__':
    o=export_cards(); print(f"exported {o['count']} MCP cards")
