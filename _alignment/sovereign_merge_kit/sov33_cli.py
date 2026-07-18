#!/usr/bin/env python3
"""sov33_cli.py — talk to THE SOVEREIGN from any terminal.
  python3 sov33_cli.py "your question"      # one-shot
  python3 sov33_cli.py                        # interactive REPL
"""
import sys; sys.path.insert(0,'.')
from sov33 import Sovereign
def show(o):
    print(f"\n  care={o['care_derived']:.2f}  decision={o['decision']}  brain={o['brain_source']}  sigil={o['sigil_hops']}h/{o['sigil_ok']}")
    print(f"  {o['answer']}\n")
def main():
    sov=Sovereign()
    if len(sys.argv)>1:
        show(sov.ask(" ".join(sys.argv[1:]))); return
    print("SOV33 SOVEREIGN — interactive (blank line or 'exit' to quit)")
    while True:
        try: q=input("sov33> ").strip()
        except EOFError: break
        if not q or q=="exit": break
        show(sov.ask(q))
if __name__=="__main__": main()
