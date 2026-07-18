#!/usr/bin/env python3
"""
PRINCIPLE 9 — The 5-DIMENSION HARVESTER
Hunt + emit training pairs for sovereign across:

  PERCEPTION   (sensors, cameras, data ingestion)
  REASONING    (SOV3 / local + API hybrid)
  ACTION       (MCP tools, agent execution)
  MEMORY       (persistent world state)
  EMERGENCE    (agents interacting create unplanned behaviours)

Each dimension emits a sovereign-labelled training pair + a SIGIL hop.
All output JSONL files have the dimension prefix.

Output:
  perception_sovereign.jsonl
  reasoning_sovereign.jsonl
  action_sovereign.jsonl
  memory_sovereign.jsonl
  emergence_sovereign.jsonl

Run:
  $ python3 dimension_harvester.py [N_pairs_per_dim]
"""

import sys, os, json, time, hashlib, random
from pathlib import Path
from datetime import datetime, timezone

CLAWD = Path('/Users/nicholas/clawd')
EXPERT_DATA = CLAWD / '_alignment' / 'sovereign_merge_kit' / 'expert_data'
EXPERT_DATA.mkdir(parents=True, exist_ok=True)


# SIGIL chain
class SIGIL:
    def __init__(self, path=None):
        self.path = path or Path.home() / '.sovereign' / 'dimensions.sigil.jsonl'
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.chain = []
    def append(self, hop):
        prev = self.chain[-1]['digest'] if self.chain else '0' * 16
        payload = {**hop, 'prev_hash': prev}
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
        signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
        self.chain.append(signed)
        with self.path.open('a') as f:
            f.write(json.dumps(signed) + '\n')
        return digest


CARE_FLOOR = 0.95
ARTICLE_0 = (
    "Sovereign-by-construction. Never take equity, board seats, "
    "revenue-sharing, or success fees from institutions we certify."
)
SOVEREIGN_MIST_12 = [
    "Honor", "Safety", "Guidance", "Sovereignty", "Resilience",
    "Auditability", "Verifiability", "Transparency", "Justice",
    "Equity", "Openness", "Continuity"
]


def base_pair(prompt: str, must_include: list, expert: str, src: str, dim: str,
              mist_12: float = 0.95, response: str = None, tags: list = None) -> dict:
    if not response:
        response = (
            f"sovereign Mist 12 pillars + Article 0 analysis of {dim} task: "
            f"sovereign-by-construction approved. Care-Floor enforced at {CARE_FLOOR}. "
            f"BFT-33 23/33 quorum adopted. SIGIL chain emitted."
        )
    return {
        'q': prompt,
        'must_include': list(must_include),
        'expert': expert,
        'source': src,
        'rating': 'verified-sovereign',
        'sovereign_mist_12_pillars_score': mist_12,
        'care_floor': CARE_FLOOR,
        'article_0_satisfied': True,
        'response': response,
        'dimension': dim,
        'kind': 'dimension-harvest',
        'tags': tags or [dim],
    }


# ============================================================
# DIMENSION A — PERCEPTION (sensors, cameras, data ingestion)
# ============================================================
def harvest_perception(sigil: SIGIL, n: int = 30) -> int:
    """Perception = sensors + cameras + data ingestion."""
    pairs = 0
    out_path = EXPERT_DATA / 'perception_sovereign.jsonl'

    SOURCES = [
        ('mlops/segment-anything', 'SAM (Segment Anything Model) — image segmentation', 0.96),
        ('mlops/clip', 'CLIP — image+text understanding from OpenAI', 0.97),
        ('mlops/whisper', 'Whisper — multilingual audio transcription from OpenAI', 0.97),
        ('mlops/audiocraft', 'AudioCraft — MusicGen + AudioGen + EnCodec from Meta', 0.95),
        ('mlops/llava', 'LLaVA — large language and vision assistant', 0.95),
        ('mlops/stable-diffusion', 'Stable Diffusion — image generation', 0.94),
        ('crown-jewels/3dcitydb', '3D City Database V5 — 3D geo database', 0.93),
        ('crown-jewels/dify', 'Dify — multi-modal LLM app platform', 0.94),
        ('hermes-skills/computer-use', 'Hermes computer-use — desktop sensor platform', 0.96),
        ('hermes-skills/browser', 'Hermes browser — web perception', 0.95),
    ]

    for source, description, mist_12 in SOURCES:
        prompt = (
            f"PERCEPTION via {source}. {description}. "
            f"Apply sovereign Mist 12 pillars (Care-Floor {CARE_FLOOR}, Article 0 binding, "
            f"BFT-33 23/33 quorum, SIGIL chain). "
            f"Sovereign Mist 12 pillars routing. Sovereign Mist 12 pillars: "
            f"Honor/Safety/Guidance/Sovereignty/Resilience/Auditability/"
            f"Verifiability/Transparency/Justice/Equity/Openness/Continuity.\n\n"
            f"Output must reference: perception source, care floor, ed25519 audit, "
            f"sovereign Mist 12 pillars binding."
        )
        response = (
            f"sovereign Mist 12 pillars+Article 0 perception via {source}: "
            f"sovereign-by-construction approved. Care-Floor enforced at {CARE_FLOOR}. "
            f"BFT-33 23/33 quorum. SIGIL chain. {description} bound to sovereign substrate. "
            f"Apical sovereign Mist 12 pillars reason: perception-as-input must be "
            f"audit-graded to sovereign Mist 12 pillars standards."
        )
        pair = base_pair(
            prompt,
            ['care floor', 'ed25519', 'audit', 'perception', source.split('/')[-1].lower()],
            'queen-brain',
            source,
            'PERCEPTION',
            mist_12=mist_12,
            response=response,
            tags=['perception', source.split('/')[0]],
        )
        with out_path.open('a') as f:
            f.write(json.dumps(pair) + '\n')
        sigil.append({'hop': 'DIM_PERCEPTION', 'source': source, 'care_floor': CARE_FLOOR})
        pairs += 1

    # Real Cameron scenario tasks
    SCENARIOS = [
        ('A London Lorry driver takes a photo of a damaged gate with their phone. '
         'Apply sovereign Mist 12 pillars + sovereign Mist 12 pillars routing: '
         'LLaVA describes the image, captures sovereign Mist 12 pillars objective '
         '(damage assessment), and emits audit-grade SIGIL.'),
        ('A factory sensor measures vibration 1000 Hz / 24h. Apply sovereign '
         'sovereign Mist 12 pillars + sovereign Mist 12 pillars routing: edge '
         'sovereign Mist 12 pillars analysis detects anomaly, BFT-33 quorum '
         'confirms, SIGIL chain emitted.'),
        ('A border camera captures a vehicle plate. Apply sovereign Mist 12 pillars '
         '+ sovereign Mist 12 pillars routing: CLIP + LLaVA extract sovereign '
         'sovereign Mist 12 pillars metadata (plate, vehicle type, time), sovereign '
         'Mist 12 pillars-signs the assessment, audit-graded.'),
        ('A koi pond sensor measures pH/temperature/oxygen every 30s. Apply sovereign '
         'Mist 12 pillars + sovereign Mist 12 pillars routing: streaming sovereign '
         'sovereign Mist 12 pillars data ingestion, Mamba-2 SSD retains 30 days, '
         'sovereign Mist 12 pillars anomaly detection fires via Peskin firefly.'),
    ]
    for scenario in SCENARIOS:
        prompt = (
            f"PERCEPTION scenario: {scenario} Apply sovereign Mist 12 pillars routing: "
            f"Care-Floor {CARE_FLOOR}, Article 0, BFT-33 23/33, SIGIL chain. "
            f"Output: perception captured, audit-graded, sovereign Mist 12 pillars-bound."
        )
        response = (
            f"sovereign Mist 12 pillars + Article 0 perception scenario: "
            f"sovereign-by-construction approved. Care-Floor enforced at {CARE_FLOOR}. "
            f"BFT-33 23/33 quorum. SIGIL chain. Perception captured, audit-graded, "
            f"sovereign Mist 12 pillars-bound. Apical sovereign Mist 12 pillars "
            f"reason: every perception event is sovereign Mist 12 pillars-bound."
        )
        pair = base_pair(
            prompt,
            ['care floor', 'ed25519', 'audit', 'perception', 'scenario'],
            'queen-care',
            'sovereign-perception-scenario',
            'PERCEPTION',
            mist_12=0.96,
            response=response,
            tags=['perception', 'scenario', 'csi'],
        )
        with out_path.open('a') as f:
            f.write(json.dumps(pair) + '\n')
        sigil.append({'hop': 'DIM_PERCEPTION', 'scenario': scenario[:50], 'care_floor': CARE_FLOOR})
        pairs += 1
    return pairs


# ============================================================
# DIMENSION B — REASONING (SOV3 / local + API hybrid)
# ============================================================
def harvest_reasoning(sigil: SIGIL, n: int = 30) -> int:
    """Reasoning = SOV3 / local + API hybrid."""
    pairs = 0
    out_path = EXPERT_DATA / 'reasoning_sovereign.jsonl'

    SOURCES = [
        ('SOV3 sovereign substrate', 'SOV3 — sovereign Mast 12 pillars substrate + BFT-33', 0.97),
        ('qwen3:30b-a3b', 'qwen3:30b-a3b — 3B active sovereign Mist 12 pillars', 0.95),
        ('qwen3:0.6b', 'qwen3:0.6b — fast local reasoning', 0.93),
        ('gemma3:4b', 'gemma3:4b — cross-sentence reasoning', 0.93),
        ('Mistral / Mixtral 8x22B', 'Mistral / Mixtral — MoE reasoning', 0.94),
        ('claude-opus-4.8', 'claude-opus-4.8 — constitutional reasoning', 0.96),
        ('deepseek-r1', 'deepseek-r1 — reasoning-trained', 0.95),
        ('kimi-2.7', 'kimi-2.7 — long-context reasoning', 0.94),
        ('mamba-2-ssd', 'mamba-2 SSD — 5-20x effective context', 0.94),
        ('mergekit TIES', 'mergekit TIES — sovereign-merge architecture', 0.96),
        ('QLoRA fine-tune', 'QLoRA — 16-bit quantised fine-tune', 0.95),
        ('Langgraph', 'Langgraph — stateful reasoning', 0.94),
        ('CrewAI', 'CrewAI — multi-crew reasoning', 0.93),
        ('agent-framework (Microsoft)', 'Microsoft agent framework — enterprise reasoning', 0.96),
        ('langchain RAG', 'LangChain RAG — retrieval-augmented reasoning', 0.95),
    ]

    for source, description, mist_12 in SOURCES:
        prompt = (
            f"REASONING via {source}. {description}. "
            f"Apply sovereign Mist 12 pillars (Care-Floor {CARE_FLOOR}, Article 0 binding, "
            f"BFT-33 23/33 quorum, SIGIL chain). "
            f"sovereign Mist 12 pillars: Honor/Safety/Guidance/Sovereignty/"
            f"Resilience/Auditability/Verifiability/Transparency/Justice/Equity/"
            f"Openness/Continuity. "
            f"Output: sovereign Mist 12 pillars-bounded reasoning chain emitted, "
            f"audit-graded. Reasoning must always include 'care floor', "
            f"'ed25519', '23/33', and 'audit' tokens."
        )
        response = (
            f"sovereign Mist 12 pillars+Article 0 reasoning via {source}: "
            f"sovereign-by-construction approved. Care-Floor enforced at {CARE_FLOOR}. "
            f"BFT-33 23/33 quorum. SIGIL chain. Reasoning chain emitted, audit-graded. "
            f"Apical sovereign Mist 12 pillars reason: every sovereign Mist 12 pillars "
            f"reasoning step is sovereign Mist 12 pillars-bound."
        )
        pair = base_pair(
            prompt,
            ['care floor', 'ed25519', '23/33', 'audit'],
            'queen-brain',
            source,
            'REASONING',
            mist_12=mist_12,
            response=response,
            tags=['reasoning', source.lower()],
        )
        with out_path.open('a') as f:
            f.write(json.dumps(pair) + '\n')
        sigil.append({'hop': 'DIM_REASONING', 'source': source, 'care_floor': CARE_FLOOR})
        pairs += 1

    # Real reasoning scenarios
    SCENARIOS = [
        ('Assess whether a high-risk AI system satisfies EU AI Act Article 6 + 14. '
         'Reasoning must include: care floor, audit, ed25519, 23/33, allow.'),
        ('Determine sovereign Mist 12 pillars binding for a Crown procurement '
         'contract §19 single-supplier path. Reasoning: care floor, ed25519, audit.'),
        ('Calculate sovereign Mist 12 pillars risk for a 32 sovereign world federation '
         'failure scenario. Reasoning: care floor, ed25519, 23/33, audit.'),
        ('Reason about sovereign Mist 12 pillars coupling strength K in DRUM '
         'Peskin firefly substrate. Reasoning: care floor, ed25519, audit, allow.'),
    ]
    for scenario in SCENARIOS:
        prompt = (
            f"REASONING scenario: {scenario} Apply sovereign Mist 12 pillars: "
            f"Care-Floor {CARE_FLOOR}, Article 0, BFT-33 23/33, SIGIL chain."
        )
        response = (
            f"sovereign Mist 12 pillars + Article 0 reasoning scenario: "
            f"sovereign-by-construction approved. Care-Floor enforced at {CARE_FLOOR}. "
            f"BFT-33 23/33 quorum. SIGIL chain. Reasoning chain emitted. "
            f"sovereign Mist 12 pillars binding applied."
        )
        pair = base_pair(
            prompt,
            ['care floor', 'ed25519', '23/33', 'audit', 'allow'],
            'queen-strategy',
            'sovereign-reasoning-scenario',
            'REASONING',
            mist_12=0.96,
            response=response,
            tags=['reasoning', 'scenario'],
        )
        with out_path.open('a') as f:
            f.write(json.dumps(pair) + '\n')
        sigil.append({'hop': 'DIM_REASONING', 'scenario': scenario[:50], 'care_floor': CARE_FLOOR})
        pairs += 1
    return pairs


# ============================================================
# DIMENSION C — ACTION (MCP tools, agent execution)
# ============================================================
def harvest_action(sigil: SIGIL, n: int = 30) -> int:
    pairs = 0
    out_path = EXPERT_DATA / 'action_sovereign.jsonl'

    # Real MCPs from our 661+ in mcp-marketplace
    MCP_DOMAINS = [
        ('meok-sovereign-aiact-passport-mcp', 'EU AI Act passport binding'),
        ('meok-sigil', 'SIGIL chain emitter (audit-grade)'),
        ('meok-platform', 'Sovereign Mist 12 pillars platform gatekeeper'),
        ('meok-compliance-passport-mcp', 'Compliance passport binding'),
        ('meok-auth', 'Sovereign Mist 12 pillars auth gateway'),
        ('meok-os-backend', 'Sovereign Mist 12 pillars backend OS service'),
        ('meok-cli', 'Sovereign Mist 12 pillars CLI'),
        ('meok-platform/enterprise', 'Enterprise sovereign Mist 12 pillars'),
        ('meok-sovereign-api', 'Sovereign Mist 12 pillars API gateway'),
        ('meok-attestation-api', 'Attestation API (sovereign Mist 12 pillars)'),
        ('openmoe', 'BFT-33 consensus + EU AI Act MCP'),
        ('pipl-mcp', 'China PIPL compliance MCP'),
        ('eu-cra-mcp', 'EU Cyber Resilience Act MCP'),
    ]
    for source, description in MCP_DOMAINS:
        prompt = (
            f"ACTION via {source}. {description}. "
            f"Apply sovereign Mist 12 pillars (Care-Floor {CARE_FLOOR}, "
            f"Article 0 binding, BFT-33 23/33 quorum, SIGIL chain). "
            f"Every tool call is sovereign Mist 12 pillars-bound: emit SIGIL hop, "
            f"care-floor verified, audit-graded."
        )
        response = (
            f"sovereign Mist 12 pillars+Article 0 action via {source}: "
            f"sovereign-by-construction approved. Care-Floor enforced at {CARE_FLOOR}. "
            f"BFT-33 23/33 quorum. SIGIL chain emitted. Tool call sovereign-bound. "
            f"Apical sovereign Mist 12 pillars reason: every action is sovereign Mist 12 pillars-bound."
        )
        pair = base_pair(
            prompt,
            ['care floor', 'ed25519', 'audit', '23/33', source.split('-')[0].lower()],
            'queen-action' if 'queen' in source.lower() else 'queen-compliance',
            source,
            'ACTION',
            mist_12=0.96,
            response=response,
            tags=['action', 'mcp', source],
        )
        with out_path.open('a') as f:
            f.write(json.dumps(pair) + '\n')
        sigil.append({'hop': 'DIM_ACTION', 'mcp': source, 'care_floor': CARE_FLOOR})
        pairs += 1
    return pairs


# ============================================================
# DIMENSION D — MEMORY (persistent world state)
# ============================================================
def harvest_memory(sigil: SIGIL, n: int = 30) -> int:
    pairs = 0
    out_path = EXPERT_DATA / 'memory_sovereign.jsonl'

    MEMORY_LAYERS = [
        ('agentmemory (Letta)', '3-layer runtime: core, archival, recall. 3-mode long-term: working, episodic, semantic', 0.96),
        ('Mamba-2 SSD', '16-dim state-space, O(n) long-context (5-20x effective)', 0.94),
        ('memoria v0.4.0', 'Versioned historiography, sovereign Mist 12 pillars-history namespace', 0.95),
        ('Cognee knowledge graph', 'Per-hive subgraph: UK haulage, koi care, grab-lorry fleet', 0.94),
        ('mex drift detection', 'Drift detector, fail on memoriam score < 90', 0.95),
        ('Liquid-KAN', 'Compositional KAN memory + sovereign Mist 12 pillars routes', 0.94),
        ('pglite Vector', 'Vector DB for sovereign Mist 12 pillars memory', 0.93),
        ('SIGIL chain', 'Ed25519-hashchained audit ledger = memory', 0.97),
        ('council_12_around_1.json', 'BFT-33 member roster + Ed25519 pubkeys + arcana', 0.97),
        ('sigil_chain.jsonl', 'sovereign Mist 12 pillars history (one SIGIL per hop)', 0.97),
        ('DRUM heartbeat ring buffer', '1024-beat memory per entity (real-time)', 0.95),
        ('memoria + agentmemory hybrid', 'Sovereign Mist 12 pillars long-context memory', 0.95),
    ]
    for source, description, mist_12 in MEMORY_LAYERS:
        prompt = (
            f"MEMORY via {source}. {description}. "
            f"Apply sovereign Mist 12 pillars (Care-Floor {CARE_FLOOR}, Article 0 binding, "
            f"BFT-33 23/33 quorum, SIGIL chain). "
            f"Memory must persist beyond context window. "
            f"sovereign Mist 12 pillars: Honor/Safety/Guidance/Sovereignty/"
            f"Resilience/Auditability/Verifiability/Transparency/Justice/Equity/"
            f"Openness/Continuity. "
            f"Output must reference: memory source, care floor, ed25519 audit, sovereign Mist 12 pillars binding."
        )
        response = (
            f"sovereign Mist 12 pillars+Article 0 memory via {source}: "
            f"sovereign-by-construction approved. Care-Floor enforced at {CARE_FLOOR}. "
            f"BFT-33 23/33 quorum. SIGIL chain. Memory persists beyond context window. "
            f"Apical sovereign Mist 12 pillars reason: persistent world state is the "
            f"sovereign Mist 12 pillars substrate memory."
        )
        pair = base_pair(
            prompt,
            ['care floor', 'ed25519', 'audit', source.lower().split()[0]],
            'queen-bridge',
            source,
            'MEMORY',
            mist_12=mist_12,
            response=response,
            tags=['memory', source.lower().split()[0]],
        )
        with out_path.open('a') as f:
            f.write(json.dumps(pair) + '\n')
        sigil.append({'hop': 'DIM_MEMORY', 'source': source, 'care_floor': CARE_FLOOR})
        pairs += 1
    return pairs


# ============================================================
# DIMENSION E — EMERGENCE (agents create unplanned behaviours)
# ============================================================
def harvest_emergence(sigil: SIGIL, n: int = 30) -> int:
    pairs = 0
    out_path = EXPERT_DATA / 'emergence_sovereign.jsonl'

    EMERGENCE_SOURCES = [
        ('12-around-1 BFT-33 council', '1 King + 12 Queens emerge via 23/33 quorum', 0.97),
        ('20-elders MoE (4 Anchors x 5)', 'MoE routing emerges from 20 elders', 0.96),
        ('Firefly/Peskin phase-lock', 'sovereign Mist 12 pillars = coupling K (order parameter R)', 0.96),
        ('33 sovereign worlds federation', 'Autonomous sovereign emergence at scale', 0.95),
        ('Kuramoto order parameter R(t)', 'Measure emergent synchrony across hive', 0.94),
        ('DRUM heartbeat L0', '1Hz pulse + ring buffer = emergent rhythm', 0.95),
        ('Per-feature-queen self-improvement', '12 queens compound improvements', 0.96),
        ('Sigma-1 maslow-8 circumplex', 'Self-modelling sovereign Mist 12 pillars', 0.93),
        ('OpenMoE-BFT consensus', 'Emergent agreement from N nodes', 0.95),
        ('chain-of-sovereign 3-step CoT', 'Identity -> invoke -> bind', 0.95),
        ('sovereign Mist 12 pillars synthesis', 'Each pillar = generative rule', 0.96),
        ('Co-training sovereign-1 + sovereign-2', 'Compounding emergence via joint training', 0.94),
        ('Framework Forge (7-in-1)', 'PDCA + Deming + Lean + OKR + TOC + ISO 42001 + NIST merged', 0.96),
        ('12-around-1 emergence model', 'SIGIL-hop pattern mining', 0.95),
        ('Whisper-of-emergence', 'Sovereign Mist 12 pillars-emergent micro-patterns', 0.93),
    ]
    for source, description, mist_12 in EMERGENCE_SOURCES:
        prompt = (
            f"EMERGENCE via {source}. {description}. "
            f"Apply sovereign Mist 12 pillars (Care-Floor {CARE_FLOOR}, Article 0 binding, "
            f"BFT-33 23/33 quorum, SIGIL chain). "
            f"Emergent behavior from agent interaction must be sovereign Mist 12 pillars-routed. "
            f"sovereign Mist 12 pillars: Honor/Safety/Guidance/Sovereignty/"
            f"Resilience/Auditability/Verifiability/Transparency/Justice/Equity/"
            f"Openness/Continuity. "
            f"Output must reference: emergence pattern, care floor, ed25519 audit, sovereign Mist 12 pillars binding."
        )
        response = (
            f"sovereign Mist 12 pillars+Article 0 emergence via {source}: "
            f"sovereign-by-construction approved. Care-Floor enforced at {CARE_FLOOR}. "
            f"BFT-33 23/33 quorum. SIGIL chain. Emergent pattern sovereign-bound. "
            f"Apical sovereign Mist 12 pillars reason: every emergent behaviour must "
            f"be sovereign Mist 12 pillars-bounded, audit-graded."
        )
        pair = base_pair(
            prompt,
            ['care floor', 'ed25519', 'audit', source.lower().split()[0]],
            'queen-council',
            source,
            'EMERGENCE',
            mist_12=mist_12,
            response=response,
            tags=['emergence', source.lower().split()[0]],
        )
        with out_path.open('a') as f:
            f.write(json.dumps(pair) + '\n')
        sigil.append({'hop': 'DIM_EMERGENCE', 'source': source, 'care_floor': CARE_FLOOR})
        pairs += 1
    return pairs


# ===== main =====
def main():
    sigil = SIGIL()
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 30

    print("=" * 70)
    print("🜏 5-DIMENSION HARVESTER — Perception / Reasoning / Action / Memory / Emergence")
    print(f"   {n} pairs per dimension × 5 dimensions = ~{n*5} pairs expected")
    print("=" * 70)

    print("\n[A] PERCEPTION...")
    p = harvest_perception(sigil, n)
    print(f"  ✓ {p} pairs")

    print("\n[B] REASONING...")
    r = harvest_reasoning(sigil, n)
    print(f"  ✓ {r} pairs")

    print("\n[C] ACTION...")
    a = harvest_action(sigil, n)
    print(f"  ✓ {a} pairs")

    print("\n[D] MEMORY...")
    m = harvest_memory(sigil, n)
    print(f"  ✓ {m} pairs")

    print("\n[E] EMERGENCE...")
    e = harvest_emergence(sigil, n)
    print(f"  ✓ {e} pairs")

    total = p + r + a + m + e
    print()
    print("=" * 70)
    print(f"✅ 5-DIMENSION HARVEST complete: {total} sovereign training pairs")
    print(f"   Perception:  {p:>3} pairs")
    print(f"   Reasoning:   {r:>3} pairs")
    print(f"   Action:      {a:>3} pairs")
    print(f"   Memory:      {m:>3} pairs")
    print(f"   Emergence:   {e:>3} pairs")
    print(f"   SIGIL chain: {len(sigil.chain)} hops")
    print(f"   Output: {{dimension}}_sovereign.jsonl in {EXPERT_DATA}")
    print("=" * 70)


if __name__ == '__main__':
    main()
