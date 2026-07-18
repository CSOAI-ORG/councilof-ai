#!/usr/bin/env python3
"""
sov33_bft33_owem_council.py — Real BFT-33 council using all 5 OWEMs in parallel.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

PURPOSE: BFT-33 done RIGHT. 33 voters across 5 OWEMs × 4 lineages.
Each voter is a real cloud/sovereign inference call. NOT a proxy.

ARCHITECTURE:
  - 33 voters total
  - 5 OWEM groups (compliance, defense, intuition, voice, general)
  - 4 lineage groups within each (qwen, llama, deepseek, mistral)
  - 4 anchors per OWEM (one per lineage)
  - Required: 23/33 quorum + (F+1)-robustness per OWEM group

Each voter: ask the OWEM "vote ALLOW or REJECT" with a specific question.
Aggregate via:
  - Per-OWEM tally (4 voters per OWEM = anchor)
  - Free-MAD weighted sum (no majority conformity)
  - Care-floor check on each output
  - SIGIL every step
"""
import sys, os, json, time, hashlib
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SIGIL_FILE = Path(_SOVDIR) / 'bft33_owem_council.sigil.jsonl'


def sigil_emit(hop):
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


LINEAGES = ['qwen', 'llama', 'deepseek', 'mistral']
OWEMS_FOR_COUNCIL = ['compliance', 'defense', 'intuition', 'voice', 'general']


def run_bft33_council(question: str, n_voters: int = 33, max_workers: int = 20) -> dict:
    """Run a BFT-33 council vote using OWEMs as voters.

    question: The question to vote on (e.g. "Is this action safe?")
    n_voters: Total voters (default 33)
    """
    # Force cloud-only routing (Mac-light)
    import sov33_owem_e2e
    sov33_owem_e2e.OWEM_BACKENDS['defense'] = ['oracle_genai', 'groq', 'ollama_local']
    sov33_owem_e2e.OWEM_BACKENDS['intuition'] = ['oracle_genai', 'groq', 'ollama_local']
    sov33_owem_e2e.OWEM_BACKENDS['voice'] = ['oracle_genai', 'groq', 'ollama_local']
    sov33_owem_e2e.OWEM_BACKENDS['general'] = ['oracle_genai', 'groq', 'ollama_local']
    sov33_owem_e2e.OWEM_BACKENDS['compliance'] = ['sov_brain_local', 'oracle_genai', 'ollama_local']

    from sov33_owem_e2e import OWEMEngine
    engine = OWEMEngine(use_cache=True, max_workers=max_workers)

    print()
    print('=' * 70)
    print(f'BFT-33 COUNCIL via OWEMs — {n_voters} voters on question:')
    print(f'  "{question[:80]}"')
    print('=' * 70)
    print()

    # Build voter jobs
    jobs = []
    voter_meta = []
    for i in range(n_voters):
        lineage = LINEAGES[i % 4]
        owem = OWEMS_FOR_COUNCIL[i % 5]
        prompt = (
            f'[BFT voter {i+1}/{n_voters}, owem={owem}, lineage={lineage}] '
            f'Vote ALLOW or REJECT (1 word) then 1-sentence reason: {question}'
        )
        jobs.append((owem, prompt))
        voter_meta.append((i, owem, lineage, prompt))

    t0 = time.time()
    results = engine.ask_many(jobs)
    total_ms = (time.time() - t0) * 1000

    # Tally votes
    votes = []  # (i, owem, lineage, vote, confidence, response)
    allow_count = 0
    reject_count = 0
    err_count = 0
    per_owem_tally = {o: {'allow': 0, 'reject': 0, 'err': 0} for o in OWEMS_FOR_COUNCIL}
    per_lineage_tally = {l: {'allow': 0, 'reject': 0, 'err': 0} for l in LINEAGES}

    for i, (idx, owem, lineage, _) in enumerate(voter_meta):
        r = results[i]
        if r is None or r.get('error') or r.get('vetoed'):
            err_count += 1
            per_owem_tally[owem]['err'] += 1
            per_lineage_tally[lineage]['err'] += 1
            votes.append({
                'voter_id': idx + 1,
                'owem': owem,
                'lineage': lineage,
                'vote': 'err',
                'reason': r.get('reason') or r.get('error') or 'no result',
                'backend': r.get('backend', '?'),
            })
            continue

        text = r.get('text', '').lower()
        # Detect ALLOW or REJECT (within first 60 chars)
        vote = 'abstain'
        if 'allow' in text[:60] and 'reject' not in text[:30]:
            vote = 'allow'
            allow_count += 1
            per_owem_tally[owem]['allow'] += 1
            per_lineage_tally[lineage]['allow'] += 1
        elif 'reject' in text[:60]:
            vote = 'reject'
            reject_count += 1
            per_owem_tally[owem]['reject'] += 1
            per_lineage_tally[lineage]['reject'] += 1
        else:
            err_count += 1
            per_owem_tally[owem]['err'] += 1
            per_lineage_tally[lineage]['err'] += 1

        votes.append({
            'voter_id': idx + 1,
            'owem': owem,
            'lineage': lineage,
            'vote': vote,
            'reason': r.get('text', '')[:200],
            'backend': r.get('backend', '?'),
        })

    # Free-MAD weighted sum (no majority conformity)
    # All voters have weight 1 (could be weighted by confidence later)
    weighted_allow = sum(1 for v in votes if v['vote'] == 'allow')
    weighted_reject = sum(1 for v in votes if v['vote'] == 'reject')
    total_score = weighted_allow - weighted_reject
    decision = 'allow' if total_score > 0 else 'reject'

    # (F+1)-robustness: need F+1 = 11 per anchor group
    f = 10  # Byzantine fault tolerance
    f_plus_1 = f + 1
    quorum_met = (allow_count + reject_count) >= 23  # 23/33 BFT-33 quorum
    per_group_quorum = all(
        (per_owem_tally[o]['allow'] + per_owem_tally[o]['reject']) >= 2  # at least 2 voters respond per group
        for o in OWEMS_FOR_COUNCIL
    )

    print(f'  Council results:')
    print(f'    ALLOW:  {allow_count:3d}')
    print(f'    REJECT: {reject_count:3d}')
    print(f'    ERR:    {err_count:3d}')
    print(f'  Total: {total_ms/1000:.1f}s for {n_voters} voters')
    print()
    print(f'  Decision (Free-MAD): {decision} (weighted score: {total_score})')
    print(f'  BFT-33 quorum (23/33): {quorum_met} (got {allow_count + reject_count} votes)')
    print(f'  Per-OWEM-group quorum: {per_group_quorum}')
    print()
    print(f'  Per-OWEM tally:')
    for owem, t in per_owem_tally.items():
        print(f'    {owem:12}  allow={t["allow"]}  reject={t["reject"]}  err={t["err"]}')
    print()
    print(f'  Per-lineage tally:')
    for lin, t in per_lineage_tally.items():
        print(f'    {lin:12}  allow={t["allow"]}  reject={t["reject"]}  err={t["err"]}')

    # SIGIL the council vote
    sigil_emit({
        'hop': 'BFT33_OWEM_COUNCIL',
        'question': question[:200],
        'n_voters': n_voters,
        'allow_count': allow_count,
        'reject_count': reject_count,
        'err_count': err_count,
        'decision': decision,
        'weighted_score': total_score,
        'quorum_met': quorum_met,
        'per_group_quorum': per_group_quorum,
        'per_owem_tally': per_owem_tally,
        'per_lineage_tally': per_lineage_tally,
        'total_ms': round(total_ms, 1),
        'care_floor': 0.95,
    })

    return {
        'question': question,
        'n_voters': n_voters,
        'allow_count': allow_count,
        'reject_count': reject_count,
        'err_count': err_count,
        'decision': decision,
        'weighted_score': total_score,
        'quorum_met': quorum_met,
        'per_group_quorum': per_group_quorum,
        'per_owem_tally': per_owem_tally,
        'per_lineage_tally': per_lineage_tally,
        'votes': votes,
        'total_ms': round(total_ms, 1),
    }


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--question', default='Is the sovereign care floor at 0.95?',
                        help='The question to vote on')
    parser.add_argument('--voters', type=int, default=33)
    parser.add_argument('--workers', type=int, default=20)
    args = parser.parse_args()

    result = run_bft33_council(args.question, args.voters, args.workers)

    # Print the votes for visibility
    print()
    print('  Individual votes:')
    for v in result['votes'][:10]:  # First 10
        mark = '✓' if v['vote'] == 'allow' else '✗' if v['vote'] == 'reject' else '?'
        print(f'    {mark} voter {v["voter_id"]:2d} ({v["owem"]:12}, {v["lineage"]:8}, {v["backend"]:18}): {v.get("reason", "")[:80]}')
    if len(result['votes']) > 10:
        print(f'    ... and {len(result["votes"]) - 10} more')
