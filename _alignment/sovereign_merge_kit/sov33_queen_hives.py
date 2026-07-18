#!/usr/bin/env python3
"""sov33_queen_hives.py — Queen SOV3 -> sub-hive GOVERNANCE TOPOLOGY.

HONEST REGISTER (binding): a GOVERNANCE topology (hierarchical consensus), NOT a
hive-mind, NOT a consciousness claim. The Queen ARBITRATES + GOVERNS across
sub-hives; she does NOT "think for" them. Capability DOMAINS become NAMED SUB-HIVES,
each a local f-fault-tolerant BFT quorum + local loop + UPWARD REPORTING to the
Queen (central kernel authority); every cross-hive arbitration is SIGIL-signed
(hash-chained). BFT trust math REUSED from sov33_effective_votes.py; sov33.sigil_emit
replicated byte-compatibly (the full kernel pulls `oci`, absent in this sandbox).
RUNNING: topology+demo. DESIGNED elsewhere: live model routing / 4-brain mesh.
"""
import os, sys, json, hashlib
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
from sov33_effective_votes import effective_votes, agreement_confidence  # BFT trust math
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


RHO = 0.76          # OUR measured checker error-correlation (sov33 council default)
TRUST_MIN = 2.0     # effective independent votes required to TRUST agreement

# ── SIGIL chain (byte-compatible with sov33.sigil_emit) ──────────────────────
SIGIL_DIR = Path(os.environ.get('SOV33_SIGIL_DIR', str(Path(_SOVDIR))))  # env override matches sov33
try:
    SIGIL_DIR.mkdir(parents=True, exist_ok=True)
except (PermissionError, OSError):
    SIGIL_DIR = Path(os.environ.get('TMPDIR', '/tmp')) / 'sov33_sigil'; SIGIL_DIR.mkdir(parents=True, exist_ok=True)
SIGIL_FILE = SIGIL_DIR / 'sov33_queen.sigil.jsonl'

def sigil_emit(hop):
    chain = [json.loads(l) for l in SIGIL_FILE.read_text().splitlines() if l.strip()] if SIGIL_FILE.exists() else []
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f: f.write(json.dumps(signed) + '\n')
    return digest

# ── SUB-HIVE: named capability cluster with a local BFT council ──────────────
class SubHive:
    """Capability cluster self-governing via a local f-fault-tolerant BFT quorum.
    `rho` = error-correlation among this hive's delegates: diverse-lineage (low rho)
    hives can commit; mono-lineage (rho~0.76) hives mostly escalate — sov33_effective_
    votes' lesson that the fix is DIVERSE lineages, not MORE judges."""
    def __init__(self, name, agent_count, council, rho=RHO):
        self.name, self.agent_count, self.council, self.rho = name, agent_count, council, rho
        self.f = (council - 1) // 3        # BFT fault tolerance: n=3f+1, commit >= 2f+1
        self.quorum = 2 * self.f + 1

    def deliberate(self, proposal, votes):
        """Local loop: commit the plurality iff it clears the BFT quorum AND the
        correlated-vote trust floor; else ESCALATE. Returns the upward report."""
        tally = {}
        for v in votes: tally[v] = tally.get(v, 0) + 1
        winner, n_agree = max(tally.items(), key=lambda kv: kv[1])
        conf = agreement_confidence(n_agree, self.rho, TRUST_MIN)
        bft_ok = n_agree >= self.quorum
        committed = bft_ok and conf['verdict'] == 'TRUST_AGREEMENT'
        return {
            'hive': self.name, 'proposal': proposal, 'decision': winner if committed else 'ESCALATE',
            'n_agree': n_agree, 'council': self.council, 'f': self.f, 'quorum': self.quorum,
            'bft_ok': bft_ok, 'rho': self.rho, 'n_eff': conf['n_eff'],
            'trust': conf['verdict'], 'committed': committed,
        }

# ── QUEEN SOV3: central kernel authority, arbitrates ACROSS sub-hives ────────
class QueenSOV3:
    def __init__(self): self.hives = {}
    def register(self, hive): self.hives[hive.name] = hive
    def arbitrate(self, topic, reports):
        """Cross-hive arbitration (SIGIL-signed). Queen governs, does NOT re-decide
        substance: drop reports that failed local BFT; among committed, higher
        EFFECTIVE-vote confidence wins; tie or none-committed -> ESCALATE."""
        committed = [r for r in reports if r['committed']]
        if not committed:
            ruling, why = 'ESCALATE', 'no sub-hive cleared local BFT+trust floor'
        else:
            committed.sort(key=lambda r: r['n_eff'], reverse=True)
            top = committed[0]
            tie = len(committed) > 1 and abs(committed[1]['n_eff'] - top['n_eff']) < 1e-9
            if tie: ruling, why = 'ESCALATE', 'cross-hive tie on effective-vote confidence'
            else:   ruling, why = top['decision'], f"{top['hive']} carries (N_eff={top['n_eff']})"
        digest = sigil_emit({'kind': 'cross_hive_arbitration', 'topic': topic,
                             'ruling': ruling, 'why': why,
                             'inputs': [{'hive': r['hive'], 'decision': r['decision'],
                                         'n_eff': r['n_eff'], 'committed': r['committed']} for r in reports]})
        return {'topic': topic, 'ruling': ruling, 'why': why, 'sigil': digest}

# ── 106 agents -> capability-DOMAIN sub-hives (OVERLAPPING membership) ───────
# HONEST: total_agents=106. The by_capability counts below are TAG counts — an agent
# holds multiple capabilities, so a hive is a domain an agent can belong to more than
# one of. The counts sum to 320 (overlapping), NOT a partition of the 106 headcount.
TOTAL_AGENTS = 106
CLUSTERS = {  # capability-domain: (by_capability tag-count, BFT council, intra-hive rho)
    'analysis': (93, 10, 0.20), 'creative': (65, 7, 0.30), 'code': (59, 7, 0.25),
    'communication': (22, 7, 0.40), 'neural': (20, 4, 0.76), 'monitoring': (18, 4, 0.30),
    'planning': (18, 4, 0.50), 'security': (10, 4, 0.20), 'memory': (10, 4, 0.60), 'web': (5, 4, 0.76),
}

def build_queen():
    q = QueenSOV3()
    for name, (ac, council, rho) in CLUSTERS.items(): q.register(SubHive(name, ac, council, rho))
    return q

def demo():
    q = build_queen()
    print("QUEEN SOV3 -> SUB-HIVE TOPOLOGY  (governance, not hive-mind)\n")
    print(f"  {'sub-hive':<14}{'tag-cnt':>8}{'council':>8}{'f':>3}{'quorum':>7}{'rho':>6}")
    for h in q.hives.values():
        print(f"  {h.name:<14}{h.agent_count:>8}{h.council:>8}{h.f:>3}{h.quorum:>7}{h.rho:>6}")
    tags = sum(c for c,_,_ in CLUSTERS.values())
    print(f"\n  {TOTAL_AGENTS} agents total; {tags} capability tags across {len(CLUSTERS)} "
          f"domain sub-hives (OVERLAPPING, not a partition of {TOTAL_AGENTS}).")
    print(f"  trust floor N_eff>={TRUST_MIN} (per-hive rho: diverse lineage -> lower rho -> can commit)\n")

    print("── 3 sub-hives run local BFT consensus ─────────────────────────────")
    reports = []  # Queen arbitrates on EVIDENCE QUALITY (N_eff), not her own opinion:
    T = 'route batch to GPU pool'  # security & code commit and DISAGREE; monitoring escalates
    scenarios = [
        ('security',   T, ['POOL_A']*4),                          # unanimous -> commits A
        ('code',       T, ['POOL_B']*6 + ['POOL_A']),             # 6/7 -> commits B
        ('monitoring', T, ['POOL_A','POOL_A','POOL_B','POOL_B']),  # split -> escalate
    ]
    for name, prop, votes in scenarios:
        r = q.hives[name].deliberate(prop, votes)
        reports.append(r)
        print(f"  [{r['hive']:<11}] votes={r['n_agree']}/{r['council']} rho={r['rho']} "
              f"BFT(>= {r['quorum']})={'ok' if r['bft_ok'] else 'no':<3} "
              f"N_eff={r['n_eff']:<5} {r['trust']:<16} -> report: {r['decision']}")

    print("\n── Queen arbitrates the cross-hive conflict ────────────────────────")
    ruling = q.arbitrate(T, reports)
    print(f"  topic : {ruling['topic']}\n  ruling: {ruling['ruling']}   ({ruling['why']})\n  SIGIL : {ruling['sigil']}")
    print("\n── SIGIL chain (hash-linked, auditable) ────────────────────────────")
    for hop in [json.loads(l) for l in SIGIL_FILE.read_text().splitlines() if l.strip()][-3:]:
        print(f"  {hop['digest']}  prev={hop['prev_hash']}  {hop['kind']}: {hop['ruling']}")

if __name__ == '__main__':
    demo()
