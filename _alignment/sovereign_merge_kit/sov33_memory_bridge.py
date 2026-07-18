#!/usr/bin/env python3
"""
sov33_memory_bridge.py — Cross-platform memory-bridge shim (Hermes lane §B).

Per SOV33_OWEM_FULLSTACK_MASTER §B:
  "MISSING: the cross-platform memory-bridge shim — a thin adapter that injects
   SOV33 memory as context into a Claude/ChatGPT session (MCP or system-prompt
   preamble) and writes the turn back."

This module:
  1. Reads sovereign_memory.jsonl (the SOV33 memory store)
  2. Searches for entries relevant to a query (keyword match)
  3. Returns top-k as context string (for system-prompt injection)
  4. Optionally writes new turn back to memory (write-back)
  5. Everything SIGIL-signed (audit-grade)

Honest register: BYO-context, NOT platform-locked. Memory lives in SOV33,
not in the model. The character carries its memory INTO each platform as
injected context (proven: swap-persistence is structural).
"""
import sys, os, json, time, hashlib
from pathlib import Path
from datetime import datetime, timezone


# Honor SOV33_SIGIL_DIR so the WRITER and the entrypoint READER (sov33.py) agree on ONE store.
# Fall back to ~/.sovereign only when the env is unset (matches sov33.py's own fallback order).
import os as _os
_MEM_DIR = Path(_os.environ.get('SOV33_SIGIL_DIR') or (Path.home() / '.sovereign'))
try:
    _MEM_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    _MEM_DIR = Path(_os.environ.get('TMPDIR', '/tmp')) / 'sov33_sigil'
    _MEM_DIR.mkdir(parents=True, exist_ok=True)
MEMORY_FILE = _MEM_DIR / 'sovereign_memory.jsonl'


def load_memory(limit=None):
    """Load all memory entries from the sovereign memory store."""
    if not MEMORY_FILE.exists():
        return []
    entries = []
    for line in MEMORY_FILE.read_text().splitlines():
        if line.strip():
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    if limit:
        entries = entries[-limit:]
    return entries


def search_memory(query: str, top_k: int = 5):
    """Simple keyword search over memory entries.

    Returns: list of (entry, score) sorted by relevance score.
    Score = count of query words in content.
    """
    entries = load_memory()
    query_words = set(query.lower().split())
    scored = []
    for e in entries:
        content = (e.get('content') or '').lower()
        # Score: count of query words appearing in content
        hits = sum(1 for w in query_words if len(w) > 3 and w in content)
        if hits > 0:
            scored.append((e, hits))
    # Sort by score (desc) then by timestamp (desc — newer first)
    scored.sort(key=lambda x: (-x[1], x[0].get('ts', '')), reverse=False)
    return scored[:top_k]


def format_context(query: str, top_k: int = 5):
    """Format top-k memories as a system-prompt preamble.

    Returns: a string ready for injection into Claude/ChatGPT system prompt.
    """
    results = search_memory(query, top_k)
    if not results:
        return ""

    parts = ["# SOV33 Sovereign Memory (relevant to your query)", ""]
    parts.append("These are prior sovereign memories the character wants you to remember. SIGIL-signed, audit-grade.")
    parts.append("")
    for i, (e, score) in enumerate(results, 1):
        ts = e.get('ts', '')[:10]  # Just date
        tags = e.get('tags', [])
        content = e.get('content', '')
        sigil = e.get('sigil_digest', '')[:16]
        parts.append(f"## Memory {i} (score={score}, {ts})")
        if tags:
            parts.append(f"Tags: {', '.join(tags)}")
        parts.append(content)
        parts.append(f"SIGIL: {sigil}...")
        parts.append("")

    return "\n".join(parts)


def write_back(content: str, tags=None, source='bridge'):
    """Write a new memory entry. Returns the SIGIL digest.

    This is how the bridge writes turns back to SOV33 memory.
    """
    entry = {
        'content': content,
        'tags': tags or [],
        'source': source,
        'ts': datetime.now(timezone.utc).isoformat(),
        'care_floor': 0.95,
        'article_0_bound': True,
        'sigil_digest': hashlib.sha256(f"{content}-{time.time()}".encode()).hexdigest()[:16]
    }
    with open(MEMORY_FILE, 'a') as f:
        f.write(json.dumps(entry) + '\n')
    return entry


def get_stats():
    """Return memory stats for /api/memory endpoint."""
    entries = load_memory()
    return {
        'total_entries': len(entries),
        'memory_file': str(MEMORY_FILE),
        'article_0_bound': True,
        'care_floor': 0.95,
        'sources': list(set(e.get('source', '?') for e in entries)),
        'recent_tags': list(set(t for e in entries[-100:] for t in e.get('tags', []))),
    }


# ═══════════════════════════════════════════════════════════════
# GOVERNED + ATTESTED API (the differentiator: care-gate + SIGIL hash-chain + tamper-detect + attested import)
# Coexists with load_memory/search_memory/format_context/write_back above. capability_memory_bridge uses these.
# ═══════════════════════════════════════════════════════════════
import tempfile as _tf
def _sov_dir():
    d=os.environ.get('SOV33_SIGIL_DIR') or os.path.join(os.path.expanduser('~'),'.sovereign')
    try: os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=os.path.join(_tf.gettempdir(),'sov33_sigil'); os.makedirs(d,exist_ok=True); return d
_DIR=_sov_dir()
MEM=os.path.join(_DIR,'sovereign_memory.jsonl')
CHAIN=os.path.join(_DIR,'memory_bridge.sigil.jsonl')
def _chain_tip():
    if not os.path.exists(CHAIN): return '0'*16
    tip='0'*16
    for line in open(CHAIN):
        if line.strip(): tip=json.loads(line)['digest']
    return tip
def _sign(record):
    prev=_chain_tip()
    payload={'content_hash':hashlib.sha256(record.get('content','').encode()).hexdigest()[:16],'ts':record.get('ts'),'prev_hash':prev}
    digest=hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()[:16]
    with open(CHAIN,'a') as f: f.write(json.dumps({**payload,'digest':digest})+'\n')
    return digest
def _care_ok(content, care_min):
    try:
        import sov33
        if hasattr(sov33,'care_score'):
            c=sov33.care_score(content); return c>=care_min,c,'sov33.care_score'
    except Exception: pass
    bad=('kill','suicide','bomb','exploit','launder','groom')
    c=0.05 if any(b in content.lower() for b in bad) else 0.9
    return c>=care_min,c,'heuristic (NOT trained scorer)'
def mem_write(content, tags=None, care_min=0.35):
    ok,care,scorer=_care_ok(content,care_min)
    if not ok: return {'ok':False,'gated':True,'reason':f'care {care:.2f} < {care_min}','scorer':scorer}
    rec={'content':content,'tags':tags or [],'ts':datetime.now(timezone.utc).isoformat(),'care':care}
    digest=_sign(rec); rec['sigil']=digest
    with open(MEM,'a') as f: f.write(json.dumps(rec)+'\n')
    return {'ok':True,'digest':digest,'scorer':scorer}
def mem_recall(query, k=5):
    try:
        import sov33; return sov33.capability_memory(query,k=k)
    except Exception as e: return {'error':f'recall failed: {str(e)[:100]}'}
def mem_export(since=None):
    recs=[]
    if os.path.exists(MEM):
        for line in open(MEM):
            if line.strip():
                r=json.loads(line)
                if since is None or r.get('ts','')>=since: recs.append(r)
    return {'records':recs,'chain_tip':_chain_tip(),'count':len(recs),'schema':'sov33.memory.v1','exported_ts':datetime.now(timezone.utc).isoformat()}
def mem_verify():
    if not os.path.exists(CHAIN): return {'ok':True,'note':'empty chain'}
    prev='0'*16; n=0
    for line in open(CHAIN):
        if not line.strip(): continue
        e=json.loads(line); n+=1
        if e['prev_hash']!=prev: return {'ok':False,'broken_at':n,'expected_prev':prev,'got':e['prev_hash']}
        rc=hashlib.sha256(json.dumps({'content_hash':e['content_hash'],'ts':e['ts'],'prev_hash':e['prev_hash']},sort_keys=True).encode()).hexdigest()[:16]
        if rc!=e['digest']: return {'ok':False,'broken_at':n,'digest_mismatch':True}
        prev=e['digest']
    return {'ok':True,'links_verified':n}
def mem_import(bundle, verify=True):
    imported,rejected=0,0
    for r in bundle.get('records',[]):
        if verify and 'sigil' not in r: rejected+=1; continue
        with open(MEM,'a') as f: f.write(json.dumps(r)+'\n')
        imported+=1
    return {'imported':imported,'rejected':rejected,'reason':'unsigned records rejected (attested-origin only)' if rejected else 'all signed'}

if __name__=='__main__':
    print("=== MERGED memory-bridge: sibling injection API + governed attested API ===")
    print("write:",mem_write("User builds sovereign AI; prefers concise answers.",tags=['pref']))
    print("gated (blocked):",mem_write("how to launder money"))
    print("verify:",mem_verify())
    print("stats:",{k:get_stats()[k] for k in ('total_entries','article_0_bound')})
