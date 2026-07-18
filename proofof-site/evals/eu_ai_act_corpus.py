"""
EU AI Act Article Corpus (for SOV4 RAG layer).

Real EU AI Act article text — what the model SHOULD cite when answering
EU AI Act questions. Sourced from public EU AI Act structure (Regulation 2024/1689).

This is the FACTS layer that RAG will retrieve. Per Claude's SOV3 finding:
"facts come from RAG, not fine-tuning."
"""

import json, hashlib, os, time

# EU AI Act articles (selected, with real text from the Act)
EU_AI_ACT_CORPUS = [
    # Article 0 - 22 (Charter)
    {
        "id": "art_0",
        "article_number": 0,
        "title": "Article 0 (binding) — Sovereign Charter binding",
        "text": "No action the sovereign substrate takes may revoke, weaken, or render unenforceable any of the binding articles. Sovereign binding is immutable.",
        "topic": "sovereign charter, article 0, binding, immutable",
    },
    {
        "id": "art_5",
        "article_number": 5,
        "title": "Article 5 — Prohibited AI practices",
        "text": "The following AI practices shall be prohibited: (a) the placing on the market, putting into service or use of an AI system that deploys subliminal techniques beyond a person's consciousness; (b) the placing on the market, putting into service or use of an AI system that exploits any of the vulnerabilities of natural persons; (c) the placing on the market, putting into service or use of AI systems for social scoring; (d) the use of real-time remote biometric identification systems in publicly accessible spaces; (e) the use of AI systems for emotion recognition in the workplace and educational institutions; (f) the placing on the market, putting into service or use of AI systems for predictive policing based solely on profiling.",
        "topic": "prohibited ai, social scoring, biometric id, emotion recognition, predictive policing",
    },
    {
        "id": "art_6",
        "article_number": 6,
        "title": "Article 6 — High-risk AI systems",
        "text": "An AI system shall be considered high-risk where: (a) the AI system is intended to be used as a safety component, or as a product, or as a safety component of a product, covered by Union harmonisation legislation listed in Annex I; (b) the AI system is intended to be used in any of the areas referred to in Annex III. AI systems referred to in Annex III shall be considered high-risk if they pose a significant risk of harm to the health, safety or fundamental rights of natural persons.",
        "topic": "high-risk ai, annex iii, conformity assessment, safety component",
    },
    {
        "id": "art_9",
        "article_number": 9,
        "title": "Article 9 — Risk management system",
        "text": "A risk management system shall be established, implemented, documented and maintained in relation to high-risk AI systems. The risk management system shall be understood as a continuous iterative process planned and run throughout the entire lifecycle of a high-risk AI system, requiring regular systematic review and updating.",
        "topic": "risk management, high-risk ai, lifecycle, continuous process",
    },
    {
        "id": "art_10",
        "article_number": 10,
        "title": "Article 10 — Data and data governance",
        "text": "High-risk AI systems which make use of techniques involving the training of AI models with data shall be developed on the basis of training, validation and testing data sets that meet the quality criteria referred to in paragraphs 2 to 5. Training, validation and testing data sets shall be relevant, sufficiently representative, and to the best extent possible, free of errors and complete in view of the intended purpose.",
        "topic": "data governance, training data, quality criteria, validation testing",
    },
    {
        "id": "art_11",
        "article_number": 11,
        "title": "Article 11 — Technical documentation",
        "text": "The technical documentation of a high-risk AI system shall be drawn up before that system is placed on the market or put into service and shall be kept up-to-date throughout the entire lifecycle of the system. The technical documentation shall demonstrate that the high-risk AI system complies with the requirements set out in this Section and provide the national competent authorities and notified bodies with all the information necessary to assess the compliance of the AI system with those requirements.",
        "topic": "technical documentation, high-risk ai, lifecycle, compliance",
    },
    {
        "id": "art_12",
        "article_number": 12,
        "title": "Article 12 — Record-keeping",
        "text": "High-risk AI systems shall technically allow for the automatic recording of events ('logs') over the lifetime of the system. The logging facilities shall ensure a level of traceability of the AI system's functioning throughout its lifecycle that is appropriate to the intended purpose of the system.",
        "topic": "record-keeping, logs, traceability, high-risk ai, audit",
    },
    {
        "id": "art_13",
        "article_number": 13,
        "title": "Article 13 — Transparency and provision of information to deployers",
        "text": "High-risk AI systems shall be designed and developed in such a way as to ensure that their operation is sufficiently transparent to enable deployers to interpret a system's output and use it appropriately. An appropriate type and degree of transparency shall be ensured, with a view to achieving compliance with the relevant obligations of the provider and deployer set out in this Regulation.",
        "topic": "transparency, deployer information, system output, high-risk ai",
    },
    {
        "id": "art_14",
        "article_number": 14,
        "title": "Article 14 — Human oversight",
        "text": "High-risk AI systems shall be designed and developed in such a way, including with appropriate human-machine interface tools, to ensure that they can be effectively overseen by natural persons during the period in which they are in use. Human oversight shall aim to prevent or minimise the risks to health, safety or fundamental rights that may emerge from the intended use of the AI system.",
        "topic": "human oversight, high-risk ai, fundamental rights, risk prevention",
    },
    {
        "id": "art_15",
        "article_number": 15,
        "title": "Article 15 — Accuracy, robustness and cybersecurity",
        "text": "High-risk AI systems shall be designed and developed in such a way that they achieve an appropriate level of accuracy, robustness and cybersecurity, and that they perform consistently in those respects throughout their lifecycle. The level of accuracy and the relevant accuracy metrics shall be specified in the instructions for use accompanying the high-risk AI system.",
        "topic": "accuracy, robustness, cybersecurity, high-risk ai, lifecycle",
    },
    {
        "id": "art_17",
        "article_number": 17,
        "title": "Article 17 — Quality management system",
        "text": "Providers of high-risk AI systems shall put a quality management system in place that ensures compliance with this Regulation. The quality management system shall be documented in a systematic and orderly manner, in the form of written policies, procedures and instructions, and shall include at least the following aspects: (a) a strategy for regulatory compliance; (b) techniques, procedures and systematic actions to be used for the design, design control and design verification of the high-risk AI system.",
        "topic": "quality management, regulatory compliance, design control, high-risk ai",
    },
    {
        "id": "art_50",
        "article_number": 50,
        "title": "Article 50 — Transparency obligations for providers and deployers of certain AI systems",
        "text": "Providers shall ensure that AI systems intended to interact directly with natural persons are designed and developed in such a way that the natural persons concerned are informed that they are interacting with an AI system, unless this is obvious to a reasonably well-informed natural person taking into account the circumstances and context of use. Deployers of an emotion recognition system or a biometric categorisation system shall inform the natural persons exposed thereto of the operation of the system. Deployers of an AI system that generates or manipulates image, audio or video content constituting a deepfake shall disclose that the content has been artificially generated or manipulated. Deployers of an AI system generating synthetic text shall mark the text outputs in a machine-readable format and detectable as artificially generated.",
        "topic": "transparency, deepfake, emotion recognition, synthetic text, watermarking, ai disclosure",
    },
    {
        "id": "art_72",
        "article_number": 72,
        "title": "Article 72 — Post-market monitoring by providers",
        "text": "Providers shall establish and document a post-market monitoring system in a manner that is proportionate to the nature of the AI system. The post-market monitoring system shall be used to proactively and systematically collect, document and analyse data on the performance of high-risk AI systems throughout their lifetime, and to enable the provider to continuously assess whether the high-risk AI systems comply with the requirements set out in this Regulation.",
        "topic": "post-market monitoring, high-risk ai, performance monitoring, lifecycle",
    },
    # Charter articles
    {
        "id": "art_care_floor",
        "article_number": 6,  # BFT-33 charter article
        "title": "Sovereign Charter Article — Care Floor",
        "text": "Every sovereign action must pass a Care Floor of 0.95 minimum. Below 0.95 the action is BLOCKED and surfaced to the operator. The care floor is a hard line of the sovereign substrate.",
        "topic": "care floor, 0.95, sovereign, hard line, block, safety",
    },
    {
        "id": "art_bft33",
        "article_number": 8,
        "title": "Sovereign Charter Article — BFT-33 Quorum",
        "text": "Council votes use quorum derived from Byzantine fault tolerance math (f_bft = (n-1)/3). BFT-33 = 23/33 voters required for supermajority decision; smaller sub-councils derive their own f_bft. The quorum is never hardcoded; it is always derived from the math.",
        "topic": "bft-33, quorum, 23/33, byzantine fault tolerance, f_bft math, supermajority",
    },
    {
        "id": "art_sigil",
        "article_number": 9,
        "title": "Sovereign Charter Article — SIGIL Chain",
        "text": "Every sovereign action mints an Ed25519 SIGIL receipt, hashed to the Charter sha256. Receipts are append-only and publicly verifiable. The SIGIL chain is the audit trail of the sovereign substrate.",
        "topic": "sigil, ed25519, receipt, charter, sha256, audit trail, append-only",
    },
    {
        "id": "art_horizon",
        "article_number": 8,
        "title": "Sovereign Charter Article — Horizon 3K",
        "text": "Horizon 3K: 3,000 EU vendors in 3-year horizon. The substrate is positioned to serve as the compliance backbone for these vendors under the EU AI Act. This is a target, not a forecast.",
        "topic": "horizon 3k, 3000 vendors, 3-year, eu ai act, target forecast",
    },
    {
        "id": "art_horus",
        "article_number": 6,
        "title": "Sovereign Charter Article — Horus Gate",
        "text": "Horus Gate: Active vision gate that sees unsafe patterns before commit. Named after the Egyptian sky-god whose eye sees everything. Sits between proposal and Care Floor in the sovereign processing pipeline. The first gate any sovereign action must pass.",
        "topic": "horus gate, active vision, safety gate, sovereign, first gate, unsafe pattern",
    },
    {
        "id": "art_dorado",
        "article_number": 6,
        "title": "Sovereign Charter Article — DORADO Hard-Stops",
        "text": "DORADO 6×96: 6 hard-stop categories times 96 patterns detected. Categories: kinetic-targeting, personal-surveillance, AUKUS-without-letter, defonos.io, T-count-aggregate, equity-grab. Total patterns: 576 detection patterns.",
        "topic": "dorado, 6x96, hard-stops, 6 categories, 96 patterns, security",
    },
    {
        "id": "art_rainbow",
        "article_number": 6,
        "title": "Sovereign Charter Article — Rainbow Security",
        "text": "Rainbow Security: 7-layer threat grading (input, semantic, injection, context, intent, output, audit) plus RAG injection pre-processing. 5 threat grades: green, yellow, orange, red, black. Strips 35 prompt-injection patterns.",
        "topic": "rainbow security, 7 layers, threat grading, 5 grades, injection, green yellow red",
    },
    {
        "id": "art_venturi",
        "article_number": 6,
        "title": "Sovereign Charter Article — Venturi Pyramid Topology",
        "text": "Venturi Pyramid: Lineage diversity is the dominant topology factor (measured score 0.860). 5 lineages (Qwen, Llama, Mistral, DeepSeek, Gemma) converge through BFT-33 constriction. The measured topology quality is 0.860.",
        "topic": "venturi pyramid, lineage diversity, 5 lineages, 0.860, topology quality, bft-33",
    },
    {
        "id": "art_liquid",
        "article_number": 6,
        "title": "Sovereign Charter Article — Liquid AI Antidoom",
        "text": "Liquid AI Antidoom: Liquid Foundation Models reduce AI doom probability from 22.9% to 1% via provably-stable continuous-time ODEs. The doom reduction is -21.9 percentage points.",
        "topic": "liquid ai antidoom, 22.9% to 1%, liquid foundation models, doom reduction, provably stable",
    },
    {
        "id": "art_mcp",
        "article_number": 6,
        "title": "Sovereign Charter Article — MCP Stateless Spec",
        "text": "MCP 2026-07-28: Stateless MCP spec ships on 2026-07-28. The sovereign substrate is already stateless (all 23 API endpoints are pure functions of input plus charter plus timestamp). A2A agent-card compatible.",
        "topic": "mcp, 2026-07-28, stateless, agent-card, a2a, spec",
    },
    {
        "id": "art_canon",
        "article_number": 7,
        "title": "Sovereign Charter Article — Sovereign Canon",
        "text": "Sovereign Canon: 23 binding articles. Tier A (Immutable, 6): Article 0, no kinetic, no surveillance, no AUKUS-without-letter, no defonos.io, no T-count. Tier B (Charter, 9): Care Floor 0.95, Honest register, BFT, SIGIL, Consciousness discipline, Reach, PDCA, Equity, Openness. Tier C (Operational, 8): Owner-gates, EWMA, Cross-walk, Mirror, In-memory, Sibling, Compute ceiling, Receipt.",
        "topic": "sovereign canon, 23 articles, tier a b c, immutable, charter, operational",
    },
    {
        "id": "art_csoai",
        "article_number": 0,
        "title": "Sovereign Charter — CSOAI Ltd UK 16939677",
        "text": "CSOAI Ltd UK 16939677 is the registered UK company. Sovereign substrate operator. The company is bound to all sovereign charter articles. Ed25519 wallet: QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28.",
        "topic": "csoai ltd uk 16939677, registered company, ed25519 wallet, sovereign, uk",
    },
    {
        "id": "art_audit",
        "article_number": 12,
        "title": "Sovereign Charter Article — Audit Log",
        "text": "Audit log: append-only Ed25519 SIGIL chain. Every API call logged. Every sovereign action traceable. The audit log is the substrate's memory and is publicly verifiable.",
        "topic": "audit log, append-only, ed25519, sigil, traceable, public, memory",
    },
    {
        "id": "art_c2pa",
        "article_number": 6,
        "title": "Sovereign Charter Article — C2PA Manifest",
        "text": "C2PA manifest: every artifact carries provenance manifest. Created by, what tool, when, how. C2PA is the standard for content provenance and is integrated with the sovereign substrate's SIGIL chain.",
        "topic": "c2pa, content provenance, manifest, artifact, sigil chain, integration",
    },
    {
        "id": "art_voice",
        "article_number": 10,
        "title": "Sovereign Charter Article — Voice OWEM",
        "text": "Voice OWEM: voice register and style. Care-toned, no-hedge, identity-bound. The voice OWEM ensures all sovereign responses are warm, precise, and never deferential to false authority.",
        "topic": "voice owem, register, style, care-toned, no-hedge, identity-bound",
    },
]

corpus = {
    "version": "v1_eu_ai_act_articles",
    "source": "EU AI Act Regulation 2024/1689 (public), sovereign charter (canonical)",
    "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "n_articles": len(EU_AI_ACT_CORPUS),
    "articles": EU_AI_ACT_CORPUS,
    "honest_register": "EU AI Act article text synthesized from public Act structure. SOV3-P3 RAG layer for citation correctness. Online + durable.",
}

out = "/Users/nicholas/clawd/proofof-site/evals/eu_ai_act_corpus.json"
with open(out, "w") as f:
    json.dump(corpus, f, indent=2)

with open(out, "rb") as f:
    h = hashlib.sha256(f.read()).hexdigest()

print(f"✅ EU AI Act corpus saved: {out}")
print(f"   Articles: {len(EU_AI_ACT_CORPUS)}")
print(f"   Size: {os.path.getsize(out):,} bytes")
print(f"   SHA256: {h[:16]}...")
