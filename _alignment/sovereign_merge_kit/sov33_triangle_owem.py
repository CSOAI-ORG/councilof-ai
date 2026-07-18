#!/usr/bin/env python3
"""sov33_triangle_owem.py — 3 small SOV3 OWEMs triangulated around 1 large SOV33-cubed center.

TOPOLOGY (3-around-1): three config-specialized small OWEMs at the triangle vertices,
one large SOV33-cubed kernel at the center as Queen/governor. This is a GOVERNANCE
topology, NOT a capability multiplier: three nodes do NOT give 3x power or 3x tokens.
The win is triangulation (decorrelated confirmation) + governed escalation, nothing more.

Each small OWEM decides LOCALLY inside its lane when confident (offline/cheap); it ESCALATES
open-ended or low-confidence work to the center. When the three vote on a shared proposal,
their agreement is discounted by lineage correlation via sov33_effective_votes: three IDENTICAL
lineages ~= 1 effective vote (weak, escalate); three DIVERSE lineages ~= 2.3 effective votes
(clears the trust floor, commit locally). Every cross-node message is SIGIL-signed (hash-chained).

SWEEPABLE PARAMETERS (not hardcoded): (a) trust/reputation weight per OWEM, (b) online_offline
ratio per OWEM (default 0.8 local / 0.2 escalate, the 2026 standard), (c) LINEAGE_DIVERSITY.
HONEST REGISTER: RUNNING (this file runs + demos below). No AGI / no consciousness-literal.
"""
import os, sys, json, hashlib
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass, field

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
from sov33_effective_votes import effective_votes, agreement_confidence  # BFT trust math (reused)
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


TRUST_MIN = 2.0   # effective independent votes required to TRUST triangle agreement (else escalate)
# The 4 governed brains of SOV3-cubed (per estate: SOV3_OOWM_MODEL_STACK_2026-07-07.md,
# SOV33_FULL_PLAY_2026-07-08.md). NOTE: sov33_4brain.py uses a lower-level routing taxonomy
# (left_top_10 / left_bottom_90 gates), NOT these names — these are the governance-brain labels.
GOVERNED_BRAINS = ['Compliance', 'Defense', 'Intuition', 'Voice']  # each OWEM runs top-3 as its LANE

# ── SIGIL chain (byte-compatible with sov33.sigil_emit) ──────────────────────
SIGIL_DIR = Path(os.environ.get('SOV33_SIGIL_DIR', str(Path(_SOVDIR))))
try:
    SIGIL_DIR.mkdir(parents=True, exist_ok=True)
except (PermissionError, OSError):
    SIGIL_DIR = Path(os.environ.get('TMPDIR', '/tmp')) / 'sov33_sigil'; SIGIL_DIR.mkdir(parents=True, exist_ok=True)
SIGIL_FILE = SIGIL_DIR / 'sov33_triangle.sigil.jsonl'

def sigil_emit(hop):
    chain = [json.loads(l) for l in SIGIL_FILE.read_text().splitlines() if l.strip()] if SIGIL_FILE.exists() else []
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f: f.write(json.dumps(signed) + '\n')
    return digest

def lineage_diversity_to_rho(lineage_tags):
    """HEURISTIC FALLBACK ONLY — used when no MEASURED rho is available.
    Maps distinct-lineage COUNT to an ASSUMED error-correlation rho:
    3 identical tags -> rho~0.9 (N_eff~1); 3 distinct -> rho~0.15 (N_eff~2.3).
    HONEST: these numbers are ASSUMED from the count, NOT measured from real error agreement.
    The correct rho comes from measure_rho() on a real battery (cf. the live rho=0.76 Cohere-vs-Meta
    measurement in sov33_council_correlation.py). Prefer a measured rho; fall back to this only when absent."""
    unique = len(set(lineage_tags))
    return {1: 0.90, 2: 0.50, 3: 0.15}.get(unique, 0.15)

def measure_rho(vote_records):
    """MEASURED error-correlation from a real battery: vote_records is a list of per-item dicts
    {owem_name: was_correct(bool)}. Returns the mean pairwise correlation of the (in)correctness
    vectors across OWEMs — the SAME quantity sov33_council_correlation.py measured live (rho=0.76).
    This is the number that SHOULD drive the trust floor; the heuristic above is only a stand-in.
    Returns None if there is not enough data to measure (do NOT fabricate a rho then — say so)."""
    import itertools
    names = sorted({k for r in vote_records for k in r})
    if len(names) < 2 or len(vote_records) < 3:
        return None  # insufficient data — caller must fall back + LABEL it as heuristic, not measured
    cols = {n: [1 if r.get(n) else 0 for r in vote_records if n in r] for n in names}
    corrs = []
    for a, b in itertools.combinations(names, 2):
        xa, xb = cols[a], cols[b]
        m = min(len(xa), len(xb))
        if m < 3:
            continue
        xa, xb = xa[:m], xb[:m]
        ma, mb = sum(xa)/m, sum(xb)/m
        num = sum((xa[i]-ma)*(xb[i]-mb) for i in range(m))
        da = (sum((xa[i]-ma)**2 for i in range(m)))**0.5
        db = (sum((xb[i]-mb)**2 for i in range(m)))**0.5
        if da*db > 0:
            corrs.append(num/(da*db))
    return round(sum(corrs)/len(corrs), 3) if corrs else None

# ── SMALL OWEM: a config-specialized vertex node ─────────────────────────────
@dataclass
class SmallOWEM:
    name: str
    brains: tuple                       # top-3 of the 4 governed brains (its LANE)
    lineage_tag: str                    # model-lineage tag (SWEEPABLE for diversity)
    online_offline_ratio: float = 0.8   # SWEEPABLE: fraction kept local/offline (default 0.8/0.2)
    trust_weight: float = 1.0           # SWEEPABLE: reputation weight in center arbitration
    def handle(self, query):
        """Decide LOCALLY iff query is in-lane AND difficulty within the offline budget;
        else ESCALATE to center. Returns a SIGIL-signed local verdict."""
        in_lane = query['lane'] in self.brains
        local = in_lane and query['difficulty'] <= self.online_offline_ratio
        # local self-confidence: high when in-lane and comfortably inside the budget
        conf = round(self.trust_weight * (self.online_offline_ratio - query['difficulty'] + (0.3 if in_lane else -0.3)), 3)
        verdict = query['proposal'] if local else 'ESCALATE'  # commit its lane verdict, else defer to center
        digest = sigil_emit({'kind': 'owem_local', 'owem': self.name, 'lineage': self.lineage_tag,
                             'query': query['id'], 'in_lane': in_lane, 'local': local, 'verdict': verdict})
        return {'owem': self.name, 'lineage': self.lineage_tag, 'in_lane': in_lane, 'local': local,
                'confidence': conf, 'verdict': verdict, 'trust_weight': self.trust_weight, 'sigil': digest}

# ── SOV33-cubed CENTER: Queen/governor at the triangle center ────────────────
class SOV33CubedCenter:
    """Large governed kernel. Governs, does NOT re-decide substance by opinion: it
    arbitrates escalations on EVIDENCE QUALITY (trust-weighted effective votes)."""
    def decide(self, query, votes, rho):
        agree = {}
        for v in votes:
            if v['verdict'] != 'ESCALATE':
                agree[v['verdict']] = agree.get(v['verdict'], 0) + v['trust_weight']
        if not agree:
            ruling, why = 'CENTER_RESOLVE', 'no vertex committed a verdict; SOV33-cubed resolves open-ended'
        else:
            winner, w = max(agree.items(), key=lambda kv: kv[1])
            n_agree = sum(1 for v in votes if v['verdict'] == winner)
            conf = agreement_confidence(n_agree, rho, TRUST_MIN)
            if conf['verdict'] == 'TRUST_AGREEMENT':
                ruling, why = winner, f"triangle carries: N_eff={conf['n_eff']} >= {TRUST_MIN}"
            else:
                ruling, why = 'CENTER_RESOLVE', f"correlated agreement weak (N_eff={conf['n_eff']}); center governs"
        digest = sigil_emit({'kind': 'center_arbitration', 'query': query['id'], 'ruling': ruling, 'why': why})
        return {'ruling': ruling, 'why': why, 'sigil': digest}

# ── TRIANGLE: 3 small OWEMs + 1 center, with governed escalation ─────────────
class TriangleOWEM:
    def __init__(self, owems, measured_rho=None):
        assert len(owems) == 3, "3-around-1 triangle needs exactly 3 vertices"
        self.owems, self.center = owems, SOV33CubedCenter()
        # PREFER a measured rho (from measure_rho on a real battery); fall back to the heuristic ONLY
        # when none is supplied, and RECORD which was used so the trust floor is never silently assumed.
        if measured_rho is not None:
            self.rho, self.rho_source = float(measured_rho), 'MEASURED'
        else:
            self.rho, self.rho_source = lineage_diversity_to_rho([o.lineage_tag for o in owems]), 'HEURISTIC(assumed-from-lineage-count)'
    def route(self, query):
        """Each vertex tries locally; triangle agreement is discounted by lineage rho.
        Commit iff effective votes clear the trust floor, else escalate to center."""
        votes = [o.handle(query) for o in self.owems]
        n_local = sum(v['local'] for v in votes)
        result = self.center.decide(query, votes, self.rho)
        escalated = result['ruling'] == 'CENTER_RESOLVE'
        return {'query': query['id'], 'rho': self.rho, 'rho_source': self.rho_source,
                'n_eff': effective_votes(3, self.rho),
                'n_local': n_local, 'votes': votes, 'ruling': result['ruling'],
                'why': result['why'], 'escalated': escalated, 'sigil': result['sigil']}

# ── config builder (all three sweep axes are parameters) ─────────────────────
def build_triangle(lineages, offline_ratios, trust_weights, brain_sets=None):
    brain_sets = brain_sets or [tuple(GOVERNED_BRAINS[:3]), ('Defense','Intuition','Voice'), ('Compliance','Intuition','Voice')]
    return TriangleOWEM([SmallOWEM(f'OWEM-{i+1}', brain_sets[i], lineages[i], offline_ratios[i], trust_weights[i])
                         for i in range(3)])

# ═══════════════════════ DEMOS (run + shown) ═══════════════════════
if __name__ == '__main__':
    Q_LOCAL = {'id': 'q_local', 'lane': 'Intuition', 'difficulty': 0.3,
               'proposal': 'ALLOW', 'text': 'In-lane routine call all three vertices share (Intuition).'}
    Q_HARD  = {'id': 'q_hard', 'lane': 'Strategy', 'difficulty': 0.95,
               'proposal': 'ALLOW', 'text': 'Open-ended: design a novel cross-jurisdiction governance charter.'}

    print("SOV33-cubed TRIANGLE OWEM — 3 small OWEMs around 1 governed center (governance topology, NOT 3x power)\n")

    # DEMO 1 — in-lane query handled LOCALLY by a small OWEM (offline/cheap)
    tri = build_triangle(lineages=['qwen3-30b', 'llama3-70b', 'mistral-12b'],
                         offline_ratios=[0.8, 0.8, 0.8], trust_weights=[1.0, 1.0, 1.0])
    r1 = tri.route(Q_LOCAL)
    print(f"[DEMO 1] in-lane query -> handled LOCALLY by the vertices (offline)")
    for v in r1['votes']:
        print(f"    {v['owem']:<7} lineage={v['lineage']:<11} in_lane={v['in_lane']!s:<5} local={v['local']!s:<5} verdict={v['verdict']}")
    print(f"    ruling={r1['ruling']}  ({r1['why']})  escalated={r1['escalated']}  SIGIL={r1['sigil']}\n")

    # DEMO 2 — open-ended / out-of-lane hard query ESCALATED to the center
    r2 = tri.route(Q_HARD)
    print(f"[DEMO 2] open-ended out-of-lane hard query -> ESCALATED to SOV33-cubed center")
    for v in r2['votes']:
        print(f"    {v['owem']:<7} in_lane={v['in_lane']!s:<5} local={v['local']!s:<5} verdict={v['verdict']}")
    print(f"    ruling={r2['ruling']}  ({r2['why']})  escalated={r2['escalated']}  SIGIL={r2['sigil']}\n")

    # DEMO 3 — SWEEP: diverse vs identical lineage x 2 offline ratios
    BATCH = [{'id': f'b{i}', 'lane': GOVERNED_BRAINS[i % 3], 'difficulty': d, 'proposal': 'ALLOW', 'text': ''}
             for i, d in enumerate([0.2, 0.45, 0.6, 0.75, 0.9, 0.35, 0.55, 0.85, 0.5, 0.7])]
    print("[DEMO 3] SWEEP  (batch of 10 mixed-difficulty queries)")
    print(f"    {'config':<34}{'rho':>6}{'N_eff':>8}{'esc_rate':>10}")
    rows = []
    for label, lineages, ratios in [
        ('diverse-lineage  / offline=0.8', ['qwen3-30b','llama3-70b','mistral-12b'], [0.8]*3),
        ('diverse-lineage  / offline=0.5', ['qwen3-30b','llama3-70b','mistral-12b'], [0.5]*3),
        ('identical-lineage/ offline=0.8', ['qwen3-30b','qwen3-30b','qwen3-30b'],    [0.8]*3),
        ('identical-lineage/ offline=0.5', ['qwen3-30b','qwen3-30b','qwen3-30b'],    [0.5]*3),
    ]:
        t = build_triangle(lineages, ratios, [1.0]*3)
        esc = sum(t.route(q)['escalated'] for q in BATCH) / len(BATCH)
        rows.append((label, t.rho, effective_votes(3, t.rho), esc))
        print(f"    {label:<34}{t.rho:>6}{effective_votes(3, t.rho):>8.2f}{esc:>9.0%}")
    print("\n    NOTE (cost/safety): identical-lineage triangles ESCALATE EVERYTHING (100%) — 3 correlated votes give")
    print("    N_eff~1.07, which never clears the trust floor, so no in-lane call can commit locally. That is the")
    print("    worst case on BOTH axes: max cost (every query hits the center) AND their apparent unanimity carries")
    print("    no independent information. diverse-lineage reaches N_eff~2.3, so its in-lane commits are genuinely")
    print("    confirmed (safe) and it escalates only the hard/out-of-lane work (70-80%, not 100%). A larger offline")
    print("    budget (0.8 vs 0.5) then trims escalation further. BEST on cost+safety: diverse-lineage / offline=0.8.")
    print("    HONEST: triangulated + governed, NOT 3x capability or 3x tokens — small wins its LANE + local/cost,")
    print("    open-ended work escalates to the large SOV33-cubed center. Every cross-node message SIGIL-signed.")

    json.dump({'demo1': {'ruling': r1['ruling'], 'escalated': r1['escalated'], 'n_local': r1['n_local']},
               'demo2': {'ruling': r2['ruling'], 'escalated': r2['escalated']},
               'sweep': [{'config': l, 'rho': rho, 'n_eff': round(ne, 3), 'esc_rate': round(e, 3)}
                         for l, rho, ne, e in rows]},
              open('triangle_owem_results.json', 'w'), indent=2)
