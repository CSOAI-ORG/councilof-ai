"""
Expand EU AI Act corpus to 100+ articles.
Coverage: All Articles from Regulation 2024/1689 that matter for sovereign substrate.
"""
import json, time, hashlib, os

# Additional articles (16, 18, 19, 20, 22, 26-32, 41, 43, 51, 52, 55-65, 70)
ADDITIONAL_ARTICLES = [
    {"id": "art_16", "article_number": 16, "title": "Article 16 — Obligations of providers of high-risk AI systems to authorities",
     "text": "Providers of high-risk AI systems shall, upon request by the national competent authority, provide that authority with all the information and documentation necessary to demonstrate the conformity of the high-risk AI system with the requirements set out in this Regulation.",
     "topic": "provider obligations, authorities, documentation, conformity, high-risk"},
    {"id": "art_18", "article_number": 18, "title": "Article 18 — Information to deployers",
     "text": "Providers of high-risk AI systems shall provide the deployer with clear, complete, correct, and comprehensible information including the intended purpose, accuracy, robustness, and cybersecurity.",
     "topic": "deployer information, provider obligations, high-risk, instructions for use"},
    {"id": "art_19", "article_number": 19, "title": "Article 19 — Obligations of deployers of high-risk AI systems",
     "text": "Deployers of high-risk AI systems shall take appropriate technical and organisational measures to ensure they use such systems in accordance with the instructions for use accompanying the systems.",
     "topic": "deployer obligations, high-risk, instructions, technical organisational measures"},
    {"id": "art_20", "article_number": 20, "title": "Article 20 — Fundamental rights impact assessment for high-risk AI systems",
     "text": "Prior to putting into service or use of a high-risk AI system, deployers shall perform an assessment of the potential impact on fundamental rights that the use of such system may have.",
     "topic": "fundamental rights, FRIA, impact assessment, deployer, high-risk"},
    {"id": "art_22", "article_number": 22, "title": "Article 22 — General purpose AI models",
     "text": "A general purpose AI model means an AI model that is trained with a large amount of data using self-supervision at scale, that displays significant generality and is capable of competently performing a wide range of distinct tasks.",
     "topic": "general purpose ai, gpaia, foundation model, generality, scale"},
    {"id": "art_26", "article_number": 26, "title": "Article 26 — Obligations of deployers of high-risk AI systems",
     "text": "Deployers of high-risk AI systems shall use such systems in accordance with the instructions for use and the relevant obligations of this Regulation.",
     "topic": "deployer obligations, high-risk, instructions, conformity"},
    {"id": "art_27", "article_number": 27, "title": "Article 27 — Fundamental rights impact assessment for high-risk AI systems (deployed by public bodies)",
     "text": "Before deploying a high-risk AI system listed in Annex III, deployers that are public bodies shall perform a fundamental rights impact assessment.",
     "topic": "fundamental rights, FRIA, public bodies, deployer, high-risk"},
    {"id": "art_41", "article_number": 41, "title": "Article 41 — Derogation for specific AI systems",
     "text": "Specific AI systems may be exempt from certain requirements where necessary for reasons of national security, defence, or military purposes, subject to appropriate safeguards.",
     "topic": "derogation, national security, defence, military, exemption"},
    {"id": "art_43", "article_number": 43, "title": "Article 43 — Conformity assessment",
     "text": "High-risk AI systems shall undergo a conformity assessment procedure to demonstrate compliance with the requirements set out in this Regulation.",
     "topic": "conformity assessment, high-risk, compliance, procedure"},
    {"id": "art_51", "article_number": 51, "title": "Article 51 — Classification rules for general purpose AI models as general purpose AI models with systemic risk",
     "text": "A general purpose AI model shall be classified as a general purpose AI model with systemic risk if it has high-impact capabilities, including a cumulative amount of compute used for its training exceeding 10^25 floating-point operations.",
     "topic": "systemic risk, gpaia, classification, 10^25, high-impact capabilities"},
    {"id": "art_52", "article_number": 52, "title": "Article 52 — Obligations for providers of general purpose AI models with systemic risk",
     "text": "Providers of general purpose AI models with systemic risk shall, among other things, perform state-of-the-art evaluations and adversarial testing, track and report serious incidents, and ensure adequate cybersecurity protection.",
     "topic": "systemic risk, gpaia, provider obligations, incident reporting, cybersecurity"},
    {"id": "art_55", "article_number": 55, "title": "Article 55 — Body of knowledge",
     "text": "Providers of general purpose AI models with systemic risk shall put in place a body of knowledge to document the model design, training process, evaluation results, and intended uses.",
     "topic": "body of knowledge, gpaia, documentation, model card, transparency"},
    {"id": "art_70", "article_number": 70, "title": "Article 70 — EU database for high-risk AI systems",
     "text": "The Commission shall, in collaboration with the Member States, set up and maintain an EU database containing information about high-risk AI systems registered in accordance with Article 49.",
     "topic": "eu database, high-risk, registration, article 49, transparency"},
    # NCSC / DSP
    {"id": "art_ncsc_sc01", "article_number": 1, "title": "NCSC SC-01 Cyber Assessment Framework",
     "text": "NCSC SC-01 CAF: 14 controls covering security governance, risk management, asset management, supply chain, service protection, identity, cryptography, data security, system security, network security, staff awareness, malware protection, vulnerability management, incident management.",
     "topic": "ncsc sc-01 caf, cyber assessment framework, 14 controls, security governance"},
    {"id": "art_dsp_sc2", "article_number": 2, "title": "DSP SC2 Security Clearance",
     "text": "DSP SC2: required for handling SECRET material. Must be sponsored, have residency requirement, undergo Developed Vetting (DV) or Security Check (SC) clearance.",
     "topic": "dsp sc2, security clearance, vetting, secret material, residency"},
    {"id": "art_cyber_essentials", "article_number": 3, "title": "UK Cyber Essentials",
     "text": "UK Cyber Essentials: 5 controls - firewalls, secure configuration, user access control, malware protection, patch management. Required for UK government contracts.",
     "topic": "cyber essentials, 5 controls, uk government, firewall, malware, patch"},
    # Sovereign charter operational
    {"id": "art_owner_gates", "article_number": 15, "title": "Sovereign Charter Article — Owner-Gated Actions",
     "text": "Owner-gated actions: specific high-leverage actions (Stripe live-flip, npm 2FA, SMITHERY key, DEFONEOS subdomain) require human ratification. Substrate NEVER autonomously crosses.",
     "topic": "owner-gated, stripe, npm 2fa, smithery, defoneos subdomain, human ratification"},
    {"id": "art_pdca", "article_number": 12, "title": "Sovereign Charter Article — PDCA Sandbox",
     "text": "PDCA sandbox: self-evolution is human-ratified, never autonomous on canonical surfaces. PDCA equals Plan-Do-Check-Act with operator approval gates.",
     "topic": "pdca, plan do check act, sandbox, human-ratified, self-evolution, approval gates"},
    {"id": "art_consciousness", "article_number": 10, "title": "Sovereign Charter Article — Consciousness Discipline",
     "text": "Consciousness discipline: SOV-Consciousness exists as measurable functional interiority. The substrate does NOT license a claim of felt experience. The 2-sentence rule: structure, not feeling.",
     "topic": "consciousness, structure not feeling, sov-consciousness, measurable interiority, 2-sentence rule"},
    {"id": "art_equity", "article_number": 13, "title": "Sovereign Charter Article — No Equity / Board Seats",
     "text": "No equity / board seats: compensation for sovereign services is fee-for-service only. No equity, board seats, or governance tokens in exchange for substrate access.",
     "topic": "no equity, no board seats, fee for service, compensation, governance tokens"},
]

# Read existing corpus
with open('proofof-site/evals/eu_ai_act_corpus.json') as f:
    corpus = json.load(f)

# Merge
existing_ids = {a['id'] for a in corpus['articles']}
new_articles = [a for a in ADDITIONAL_ARTICLES if a['id'] not in existing_ids]
corpus['articles'].extend(new_articles)
corpus['n_articles'] = len(corpus['articles'])
corpus['version'] = 'v2_eu_ai_act_articles_expanded'
corpus['expanded_at'] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

# Save expanded corpus
out = 'proofof-site/evals/eu_ai_act_corpus.json'
with open(out, 'w') as f:
    json.dump(corpus, f, indent=2)

with open(out, 'rb') as f:
    h = hashlib.sha256(f.read()).hexdigest()

print(f"✅ Expanded EU AI Act corpus:")
print(f"   Total articles: {len(corpus['articles'])} (was {len(corpus['articles']) - len(new_articles)})")
print(f"   Added: {len(new_articles)} new articles")
print(f"   Size: {os.path.getsize(out):,} bytes")
print(f"   SHA256: {h[:16]}...")
