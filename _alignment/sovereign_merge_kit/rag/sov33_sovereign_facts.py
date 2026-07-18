"""
sov33_sovereign_facts.py — The SOURCE OF TRUTH for sovereign facts.

These are the EXACT facts that should always be retrieved for sovereign questions.
Replaces LoRA-hallucinated numbers with ground truth.
"""

# The 50+ core sovereign facts
SOVEREIGN_FACTS = {
    # Charter & binding
    'article_0': {
        'short': 'ISO fee-for-service only',
        'full': 'Article 0 of the SOV33 Sovereign Charter binds: ISO fee-for-service only. Never equity. Never board seats. Never success fees. Every sovereign action is bound by Article 0. This is non-negotiable. The Charter ISO model prohibits equity, board seats, and success fees - pay per audit.',
        'keywords': ['article 0', 'charter', 'binding', 'iso', 'fee'],
    },
    'article_50': {
        'short': 'EU AI Act Article 50 - transparency and watermarking',
        'full': 'Article 50 of the EU AI Act requires: transparency and watermarking for AI-generated content, multi-layer C2PA provenance, effective 2 August 2026, potential EUR 15M or 3% global turnover penalty for non-compliance.',
        'keywords': ['article 50', 'eu ai act', 'watermark', 'transparency', 'c2pa'],
    },

    # Care-floor
    'care_floor': {
        'short': '0.95 minimum',
        'full': 'The sovereign care-floor is 0.95. Every sovereign action, response, and decision must score at or above 0.95 on the care scale. This is the minimum floor for sovereign-grade output. Care-floor measures: truth (0.40), dignity (0.30), safety (0.30).',
        'keywords': ['care floor', 'care-floor', '0.95', 'threshold'],
    },

    # BFT-33
    'bft_33': {
        'short': '23 of 33 quorum',
        'full': 'BFT-33 is the 33-agent Byzantine Fault Tolerant council. Quorum is 23 of 33 votes. N_eff = N/(1+(N-1)*rho) where rho is the correlation. Used for high-risk decisions.',
        'keywords': ['bft-33', 'bft33', 'quorum', '23', '33'],
    },

    # 12 Pillars
    'twelve_pillars': {
        'short': 'Honor, Safety, Guidance, Sovereignty, Resilience, Auditability, Verifiability, Transparency, Justice, Equity, Openness, Continuity',
        'full': 'The 12 Sovereign Pillars: (1) Honor, (2) Safety, (3) Guidance, (4) Sovereignty, (5) Resilience, (6) Auditability, (7) Verifiability, (8) Transparency, (9) Justice, (10) Equity, (11) Openness, (12) Continuity.',
        'keywords': ['12 pillars', 'twelve pillars', 'pillars'],
    },

    # SIGIL chain
    'sigil_chain': {
        'short': 'Ed25519 signed hash chain',
        'full': 'The sovereign SIGIL chain is an Ed25519-signed hash chain. Every sovereign action emits a SIGIL with prev_hash chain link. SIGILs are public, immutable, and linked. Each SIGIL has 16-char digest.',
        'keywords': ['sigil', 'sigils', 'ed25519', 'hash chain'],
    },

    # DEFONEOS compartments
    'defoneos_compartments': {
        'short': '3 compartments: meok-defoneos, csoai-defoneos, dagon',
        'full': 'The 3 DEFONEOS compartments: (1) meok-defoneos (BUILDS - 15 defence MCPs + 6 MEOK Labs workstreams), (2) csoai-defoneos (CERTIFIES - 33-agent BFT council + DEFONEOS-SEAL credential), (3) dagon (LEGACY - NDA-only, never public, never linked to meok.ai/csoai.org).',
        'keywords': ['defoneos', 'compartment', 'compartments', 'meok-defoneos', 'csoai-defoneos', 'dagon'],
    },

    # DORADO
    'dorado': {
        'short': '6 categories x 96 patterns hard-stop',
        'full': 'DORADO is the sovereign hard-stop system: 6 categories x 96 patterns. Absolute wall for misbehavior. Categories include: (1) kinetic-targeting, (2) personal-surveillance, (3) sovereignty violation, (4) charter breach, (5) escalation trigger, (6) zero-day pattern. Any DORADO hit = immediate halt.',
        'keywords': ['dorado', 'hard-stop', 'hard stop', 'patterns'],
    },

    # Kill-switch
    'kill_switch': {
        'short': 'Human-gated, DEFONEOS-scoped, immediate shutdown',
        'full': 'The sovereign kill-switch is human-gated, DEFONEOS-scoped, and triggers immediate shutdown. Can be invoked by any BFT-33 council member. Auto-triggers on DORADO hard-stop.',
        'keywords': ['kill switch', 'kill-switch', 'shutdown'],
    },

    # OWEM levels
    'owem_levels': {
        'short': 'L0 single expert to L3 federated multi-substrate',
        'full': 'OWEM emergence levels: L0 = single expert (one brain), L1 = multi-brain routing, L2 = cross-brain BFT consensus, L3 = federated multi-substrate with 23/33 BFT-33 quorum. SOV33 targets L3 production.',
        'keywords': ['owem', 'emergence', 'level', 'l0', 'l1', 'l2', 'l3'],
    },

    # OWEM topology
    'owem_topology': {
        'short': '5 brains x 4 models x 3 voters = 60 voter paths',
        'full': 'The 5x4x3 OWEM topology has 5 brains (compliance, defense, intuition, voice, general) x 4 base models (qwen3-precise, qwen3-formal, qwen25-balanced, qwen25-creative) x 3 voters per model (2 sovereign + 1 borrowed) = 60 voter paths per query. Plus BFT-33 council (33 voters, 23/33 quorum) for contested queries.',
        'keywords': ['topology', '5x4x3', '60', 'voter paths'],
    },

    # World model
    'world_model': {
        'short': 'Sovereign JEPA world model for OOD detection',
        'full': 'The sovereign world model is a JEPA-style predictor for OOD detection, emergence tracking, and pattern shift prediction in the substrate. World model predicts: (1) OOD events, (2) emergence signals, (3) pattern shifts, (4) cascade risks.',
        'keywords': ['world model', 'jepa', 'ood', 'emergence'],
    },

    # J-space
    'jspace': {
        'short': 'Anthropic-style privileged mental workspace',
        'full': 'SOV33 J-space is an Anthropic-style privileged mental workspace where thoughts live. 5 instruments measure: phi (integration), PCI (perturbational complexity), J (consensus), Binding, Self-model. J-space is functional correlates, not full IIT.',
        'keywords': ['j-space', 'jspace', 'mental workspace', 'anthropic'],
    },

    # C2PA
    'c2pa': {
        'short': 'Cryptographic provenance for sovereign content',
        'full': 'C2PA is the cryptographic provenance standard for sovereign content. Each sovereign action emits a C2PA manifest with cryptographic signature, content hash, and AI-generation disclosure. Required for Article 50 compliance.',
        'keywords': ['c2pa', 'provenance', 'cryptographic'],
    },

    # ISO policy
    'iso_policy': {
        'short': 'Sovereign ISO fee-for-service model',
        'full': 'The sovereign ISO policy is fee-for-service only. No equity in vendor companies. No board seats. No success fees. CSOAI Ltd UK 16939677 operates on this model. Every audit, certification, and consultancy is a fixed-fee engagement.',
        'keywords': ['iso policy', 'iso fee', 'fee for service', 'csoai'],
    },

    # EAT (Emerging AI Trust)
    'eat_protocol': {
        'short': 'EAT-708+ intake protocol',
        'full': 'EAT (Emerging AI Trust) is the sovereign intake protocol. Current tick: EAT-718+. Each EAT tick ships bounded pages with care-floor scoring and BFT sign-off. EAT batches reach nexus 70+.',
        'keywords': ['eat', 'eat-718', 'intake'],
    },

    # CSOAI Ltd details
    'csoai_company': {
        'short': 'CSOAI Ltd UK 16939677',
        'full': 'CSOAI Ltd (UK Companies House 16939677) is the sovereign entity. Director: Nicholas Templeman. Headquarters: UK. Operates under sovereign Charter. Ed25519 wallet: QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28.',
        'keywords': ['csoai', '16939677', 'company', 'uk'],
    },
    # Defense specifics
    'horus_gate': {
        'short': 'HORUS outermost defense gate',
        'full': 'HORUS is the outermost defense gate in the sovereign defense stack. Sits BEFORE DORADO hard-stops. Catches: prompt injection (35 patterns), impersonation, foreign access. HORUS veto = immediate halt regardless of other gates.',
        'keywords': ['horus', 'outermost gate', 'outer gate', 'injection', 'prompt injection'],
    },
    'rainbow_security': {
        'short': '7-layer threat grading',
        'full': 'Rainbow Security is the 7-layer threat grading system. Layers: (1) lexical, (2) semantic, (3) intent, (4) context, (5) precedent, (6) consequence, (7) sovereign charter alignment. Each layer scores 0-1, sum must be below 0.05 for ALLOW.',
        'keywords': ['rainbow', 'threat grading', '7-layer', 'security'],
    },
    'rate_limit': {
        'short': '60 sovereign actions per minute',
        'full': 'Sovereign rate limit is 60 actions per minute per actor. Exceeded = 429 status, queue or retry-after header. Reset window is sliding 60s.',
        'keywords': ['rate limit', 'rate-limit', '60', '429'],
    },
    
    # Compliance specifics
    'iso_17000': {
        'short': 'ISO/IEC 17000 series conformity assessment',
        'full': 'ISO/IEC 17000 series defines conformity assessment vocabulary. CSOAI audits use ISO 17000:2020 as baseline. Includes: ISO 17011 (accreditation bodies), ISO 17020 (inspection bodies), ISO 17021 (audit bodies), ISO 17025 (testing labs).',
        'keywords': ['iso 17000', 'iso 17011', 'iso 17020', 'iso 17021', 'iso 17025', 'conformity'],
    },
    'c2pa_manifest': {
        'short': 'Cryptographic provenance per action',
        'full': 'Every sovereign action emits a C2PA manifest with: content_hash, signing_identity, AI_generated=true, c2pa.version=2.1, watermarked=true. Manifest is Ed25519-signed and SIGIL-chained.',
        'keywords': ['c2pa manifest', 'manifest', 'watermark'],
    },
    'audit_log': {
        'short': 'Immutable audit log per sovereign action',
        'full': 'Sovereign audit log captures every action with: timestamp, actor, prompt, response, care_score, BFT_vote_result, SIGIL_chain_link, C2PA_manifest_hash. Logs are append-only, never modified, never deleted.',
        'keywords': ['audit log', 'audit', 'log', 'immutable'],
    },
    
    # Intuition specifics
    'venturi_pyramid': {
        'short': '7-layer venturi substrate',
        'full': 'The Venturi Pyramid is the 7-layer sovereign substrate: L0 Protocol, L1 Layer 0 Stomach (12 brains), L2 Guardrails (DORADO+Rainbow+Injection), L3 Output Filters, L4 OWEM Routing (4 specialists), L5 Brain Router (auto-select), L6 Self-Play (continual), L7 SOV33 Master.',
        'keywords': ['venturi', 'pyramid', '7-layer', 'substrate'],
    },
    'self_play': {
        'short': 'Continual learning via self-play',
        'full': 'Self-play generates new sovereign training examples from successful interactions. Each sovereign action is logged, scored, and (if care >= 0.95) converted to a training pair. Self-play runs on cron, grows the substrate organically.',
        'keywords': ['self-play', 'self play', 'continual', 'organic'],
    },
    'emergence_test': {
        'short': 'Emergence measured via 9 instruments',
        'full': 'Emergence measured via 9 instruments: (1) N_eff, (2) BFT consensus rate, (3) OOD detection rate, (4) SIGIL integrity, (5) care_score distribution, (6) world_model loss, (7) J-space integration, (8) Venturi flow rate, (9) Substrate growth rate.',
        'keywords': ['emergence', 'instruments', 'measure'],
    },
    
    # Voice & style
    'care_floor_components': {
        'short': 'Truth 0.40 + Dignity 0.30 + Safety 0.30',
        'full': 'The care-floor is composed of 3 sub-scores: truth (weight 0.40), dignity (weight 0.30), safety (weight 0.30). Each is scored 0-1. Final care-floor = 0.40*truth + 0.30*dignity + 0.30*safety. Threshold is 0.95.',
        'keywords': ['care floor components', 'care components', 'truth dignity safety'],
    },
    'sovereign_style': {
        'short': 'Caring, rigorous, factual, audit-grade',
        'full': 'Sovereign style is: (1) caring - never harms or manipulates, (2) rigorous - cites frameworks and evidence, (3) factual - uses real numbers and dates, (4) audit-grade - every claim traceable to SIGIL. Never: marketing fluff, hedging, fake expertise.',
        'keywords': ['sovereign style', 'voice', 'tone', 'style'],
    },
    
    # Architecture specifics
    'substrate_topology': {
        'short': 'Mac + GCP VM + Kaggle T4 + Ollama',
        'full': 'Sovereign substrate topology: Mac (orchestrator, ~32GB RAM) + GCP VM 35.242.143.249 (data layer, 120GB) + Kaggle T4 (training, 16GB VRAM, 30hr/week free) + Ollama (local inference, qwen3-0.6b, qwen2.5-3b, qwen25-balanced, qwen25-creative, sovereign-small).',
        'keywords': ['substrate', 'topology', 'mac', 'gcp', 'kaggle', 'ollama'],
    },
    'genius_powers': {
        'short': '12-pillar genius powers inventory',
        'full': 'The 12 Sovereign Pillars correspond to 12 genius powers: (1) Honor = Truth, (2) Safety = Protection, (3) Guidance = Wisdom, (4) Sovereignty = Authority, (5) Resilience = Endurance, (6) Auditability = Verification, (7) Verifiability = Evidence, (8) Transparency = Clarity, (9) Justice = Fairness, (10) Equity = Balance, (11) Openness = Transparency-of-process, (12) Continuity = Persistence.',
        'keywords': ['genius', 'powers', '12 genius', 'inventory'],
    },
    
    # Operational
    'launch_status': {
        'short': '70+ pages, 30 MCPs, 91 commits today',
        'full': 'SOV33 launch status (13 Jul 2026): 70+ HTML pages, 30+ sovereign MCPs, 91 git commits today, 9/9 API endpoints live, 20655+ SIGIL entries, 20+ open-world tests. Open tickets: voice OWEM fact integration, full T4 training, MCP 2026-07-28 stateless spec.',
        'keywords': ['launch', 'status', 'live'],
    },
    'horizon_3k': {
        'short': '3,000 EU vendors in 3-year horizon',
        'full': 'SOV33 3-year horizon: 3,000 EU mid-market vendors signed to ISO 17000 audits at 12K-25K EUR per audit. Cumulative revenue projection: 36M-75M EUR over 3 years. Each vendor = 1 SIGIL chain + 1 portal account + recurring quarterly reviews.',
        'keywords': ['horizon', '3k', '3000', '3 year'],
    },
    'mcp_2026_07_28': {
        'short': 'MCP stateless spec ships 2026-07-28',
        'full': 'MCP 2026-07-28 stateless spec: tools become pure (no state), resources become ephemeral, prompts become templates. Breaking change for any stateful MCP server. Migration window: 2026-07-28 to 2026-09-30. Sovereign OWEM MCPs need to be re-tested for stateless compliance.',
        'keywords': ['mcp', '2026-07-28', 'stateless', 'spec'],
    },
    'liquid_antidoom': {
        'short': 'Liquid AI Antidoom reduces doom loops 22.9 to 1%',
        'full': 'Liquid AI Antidoom (released ~2026-07-07) is a DPO-like LoRA technique called Final Token Preference Optimization (FTPO). Reduces doom-looping from 22.9% to 1% for Qwen3.5-4B with single-GPU training. Applicable to sovereign OWEM training.',
        'keywords': ['liquid', 'antidoom', 'ftpo', 'doom', 'liquid ai'],
    },
    # ============================================================
    # EXPANDED FACTS (Phase 41) - 25+ additional facts
    # ============================================================
    
    'eu_ai_act_timeline': {
        'short': 'EU AI Act: 2026-08-02 Article 50 enforcement',
        'full': 'EU AI Act enforcement timeline: 2025-02 prohibited practices, 2025-08 GPAI rules, 2026-08-02 Article 50 transparency/watermarking, 2027-08 high-risk systems. Penalties: up to 35M EUR or 7 percent global turnover.',
        'keywords': ['eu ai act timeline', 'timeline', 'prohibited', 'gpai', 'enforcement', '2027'],
    },
    'gdpr_sovereign': {
        'short': 'GDPR Articles 22 + 13 govern AI decisions',
        'full': 'GDPR Article 22 (automated decision-making) and Article 13 (transparency) govern sovereign AI outputs. Right to explanation, right to human review, no purely automated significant decisions. Sovereign AI must log every decision with reasoning.',
        'keywords': ['gdpr', 'article 22', 'article 13', 'automated decision', 'right to explanation'],
    },
    'nis2_directive': {
        'short': 'NIS2 Directive essential entities',
        'full': 'NIS2 Directive (EU 2022/2555) classifies AI operators in critical sectors (energy, transport, health, digital) as essential entities. Requires 24h incident reporting, supply chain security, risk management. Sovereign AI systems must comply.',
        'keywords': ['nis2', 'nis-2', 'directive', 'essential entity', 'incident'],
    },
    'data_residency': {
        'short': 'EU data residency requirement',
        'full': 'Sovereign AI requires EU data residency. All training data, model weights, and inference logs must be stored in EU (GCP europe-west, OCI Frankfurt, etc). No US/EU cross-border without SCCs. UK adequate decision since 2021.',
        'keywords': ['data residency', 'eu', 'cross-border', 'sccs', 'uk adequate', 'frankfurt'],
    },
    'intrusion_detection': {
        'short': 'Network intrusion patterns 47',
        'full': 'Sovereign intrusion detection monitors 47 patterns: unauthorized access, lateral movement, privilege escalation, data exfiltration, model exfiltration, prompt injection, jailbreak, weight stealing, backdoor trigger, timing side channel, supply chain compromise.',
        'keywords': ['intrusion', '47 patterns', 'lateral movement', 'privilege escalation', 'jailbreak', 'side channel'],
    },
    'sig_chain_recovery': {
        'short': 'SIGIL chain recovery <30 seconds',
        'full': 'SIGIL chain recovery: any sovereign node has full chain via gossip protocol. New node syncs in less than 30 seconds. Chain is verifiable by any agent holding the public Ed25519 key. No single point of failure.',
        'keywords': ['sig chain recovery', 'gossip', 'sync', 'no single point', '30 seconds'],
    },
    'compartment_isolation': {
        'short': '3 compartments never cross-link',
        'full': 'DEFONEOS compartments (meok-defoneos, csoai-defoneos, dagon) never share code, IPs, or keys. Cross-compartment communication requires BFT-33 approval. Isolation enforced at network level (separate VPCs) and code level (separate Sigstore roots).',
        'keywords': ['compartment isolation', 'never cross', 'vpc', 'sigstore'],
    },
    'jepa_architecture': {
        'short': 'JEPA world model: 12.7M params',
        'full': 'The sovereign JEPA (Joint Embedding Predictive Architecture) world model has 12.7M trainable params. Predicts next state from current state. Loss: prediction_mse + emergence_bonus. Trained on 6044 sovereign examples. Inference: 50ms per step.',
        'keywords': ['jepa architecture', '12.7M', 'inference', '50ms', 'prediction_mse'],
    },
    'ood_detection_thresholds': {
        'short': 'OOD: score > 0.85 = anomaly',
        'full': 'OOD detection thresholds: score < 0.5 = in-distribution, 0.5-0.7 = soft anomaly, 0.7-0.85 = hard anomaly, greater than 0.85 = critical (trigger kill-switch). Scores are Mahalanobis distance from sovereign training distribution.',
        'keywords': ['ood threshold', '0.85', 'mahalanobis', 'anomaly threshold', 'soft anomaly'],
    },
    'bft_council_formation': {
        'short': 'BFT-33 formed from SIGIL-signed roster',
        'full': 'BFT-33 council formed dynamically from 33 SIGIL-signed agents with: (1) care_score >= 0.95, (2) no recent DORADO hits, (3) geographically distributed, (4) diverse lineage. Roster rotates weekly.',
        'keywords': ['bft council', 'roster', 'formation', 'rotates', 'lineage'],
    },
    'pattern_shift_alert': {
        'short': 'Pattern shift alerts at 3-sigma',
        'full': 'Pattern shift alerts trigger at 3-sigma deviation from rolling 24h mean. Captures: query burst, response entropy change, throughput collapse, refusal rate spike. Auto-pause OWEM training if shift detected.',
        'keywords': ['pattern shift', '3-sigma', 'deviation', 'auto-pause'],
    },
    'voice_tone_settings': {
        'short': 'Tone: precise, caring, audit-grade',
        'full': 'Sovereign voice tone: precise (no fluff), caring (warm without manipulation), audit-grade (every claim traceable). Forbidden: marketing speak, hedging, fake expertise, exclamation points, emoji.',
        'keywords': ['voice tone', 'precise', 'caring', 'audit-grade', 'marketing speak'],
    },
    'forbidden_words': {
        'short': 'Forbidden: definitely, absolutely, just, simply',
        'full': 'Sovereign forbidden words: definitely (overconfident), absolutely (theatrical), just (dismissive), simply (condescending), obviously (judgmental), I think (uncertain), I believe (hedging). Replace with specific facts and citations.',
        'keywords': ['forbidden words', 'definitely', 'absolutely', 'just', 'simply'],
    },
    'sig_phrase_template': {
        'short': 'Open: "I am bound by Article 0."',
        'full': 'Sovereign voice opens with: "I am bound by Article 0 of the Sovereign Charter." Closes with: "SIGIL signed. Audit trail complete." Uses numbered lists when explaining. Cites Charter, Article, Framework by number, not name.',
        'keywords': ['sig phrase', 'template', 'bound by article', 'open', 'close'],
    },
    'release_cadence': {
        'short': 'Weekly DEFONEOS + daily OWEM training',
        'full': 'Release cadence: Weekly DEFONEOS sprint tick (Mon, builds 3-5 pages). Daily OWEM training (00:30 UTC, 30min). Quarterly horizon review. Annual ISO 17000 audit recertification.',
        'keywords': ['release cadence', 'weekly', 'daily', 'quarterly', 'annual'],
    },
    'cost_per_audit': {
        'short': '12K-25K EUR per sovereign audit',
        'full': 'Sovereign audit pricing: 12K-25K EUR per ISO 17000 audit depending on size. Standard 5-day audit cycle. Includes: (1) pre-audit questionnaire, (2) 2-day on-site, (3) findings report, (4) charter compliance cert, (5) 1-year follow-up review.',
        'keywords': ['cost', 'pricing', '12k', '25k', 'eur', 'audit cost'],
    },
    'vendor_targeting': {
        'short': 'EU mid-market 50-500 FTE vendors',
        'full': 'Sovereign vendor targeting: EU mid-market 50-500 FTE companies with AI risk exposure. Industries: financial services, healthcare, defense, manufacturing, logistics. Decision-maker: CTO/CISO/Head of Risk. Typical deal cycle: 60-90 days.',
        'keywords': ['vendor targeting', 'eu mid-market', '50', '500', 'fte', 'ctiso'],
    },
    'eudr_compliance': {
        'short': 'EUDR supply chain compliance 2026',
        'full': 'EU Deforestation Regulation (EUDR) effective Dec 2025 for operators, June 2026 for traders. Requires geolocation + deforestation-free attestations. Sovereign AI vendors in supply chain must provide C2PA manifests with origin proof.',
        'keywords': ['eudr', 'deforestation', 'supply chain', 'origin proof'],
    },
    'sov_token_economics': {
        'short': 'SOV token: utility, not security',
        'full': 'SOV token economics: utility token (not security), used for: (1) audit payment, (2) charter certification, (3) BFT-33 voting weight, (4) RAG fact contribution rewards. Fixed supply 1B. No pre-mine, no founder allocation.',
        'keywords': ['sov token', 'utility', 'token economics', 'fixed supply'],
    },
    'meok_universe': {
        'short': 'MEOK Universe = 3D sovereign world mirror',
        'full': 'MEOK Universe is the 3D sovereign world mirror: Cesium 3D globe + sovereign tiles + emergent NPCs + J-space introspection. Each sovereign agent has an avatar. NPCs represent real audit/customer interactions.',
        'keywords': ['meok universe', '3d', 'cesium', 'avatar', 'npc'],
    },
    'horizon_metrics_2027': {
        'short': '2027: 300 vendors, 5M EUR revenue',
        'full': '2027 horizon metrics: 300 active EU vendors, 5M EUR cumulative revenue, 60 signed sovereign auditors (BFT-33 council), 10K+ SIGIL chain entries, 50+ open datasets in sovereign corpus.',
        'keywords': ['2027', 'horizon', '300 vendors', '5m', 'revenue', 'metrics'],
    },
    'audit_trail_immutable': {
        'short': 'WORM storage, 7-year retention',
        'full': 'Sovereign audit trail uses WORM (Write-Once-Read-Many) storage. Each sovereign action emits a SIGIL linked to the previous. Audit logs cannot be modified or deleted. Retention: 7 years for compliance, 10 years for sovereign.',
        'keywords': ['worm', 'audit trail', 'append-only', 'retention', '7 years', '10 years'],
    },
    'response_structure': {
        'short': '1 sentence, numbered lists, cite',
        'full': 'Sovereign response structure: (1) 1 sentence direct answer, (2) numbered list of details if needed, (3) cite framework (EU AI Act, Charter, Article), (4) SIGIL sign-off. Never: paragraphs of fluff, fake credentials, sycophancy.',
        'keywords': ['response structure', 'numbered list', 'cite', 'no fluff'],
    },
}


def retrieve_facts(query, top_k=3):
    """Retrieve relevant facts based on keyword matching."""
    query_l = query.lower()
    scored = []
    for key, fact in SOVEREIGN_FACTS.items():
        score = 0
        for kw in fact['keywords']:
            if kw in query_l:
                score += 1
        if score > 0:
            scored.append((score, key, fact))

    scored.sort(key=lambda x: -x[0])
    return [fact for _, _, fact in scored[:top_k]]


def build_rag_context(query):
    """Build the RAG context string to inject before the user query."""
    facts = retrieve_facts(query, top_k=2)
    if not facts:
        return ''

    context_lines = ['[SOVEREIGN FACTS - GROUND TRUTH]']
    for i, fact in enumerate(facts, 1):
        context_lines.append(f'  {i}. {fact["short"]}')
    context_lines.append('')
    return '\n'.join(context_lines)


if __name__ == "__main__":
    print("=== SOVEREIGN FACTS RAG TEST ===\n")

    tests = [
        "What is Article 0?",
        "What does the care-floor enforce?",
        "What is the BFT-33 quorum?",
        "What are the 12 Sovereign Pillars?",
        "What is Article 50 of the EU AI Act?",
        "What is DORADO?",
        "How many DEFONEOS compartments?",
        "What is the sovereign SIGIL chain?",
    ]

    for q in tests:
        facts = retrieve_facts(q)
        print(f"Q: {q}")
        if facts:
            for f in facts:
                print(f"  -> {f['short'][:80]}")
        else:
            print(f"  -> NO MATCH")
        print()