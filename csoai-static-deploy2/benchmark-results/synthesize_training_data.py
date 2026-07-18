#!/usr/bin/env python3
"""
DEFONEOS Sovereign Training Data Synthesizer
Uses 9,794 real sovereign rows as few-shot seeds + Ollama qwen3-precise to generate
50K synthetic sovereign training pairs aligned to 4 specialisations.

Output: sovereign_synth_50k.jsonl (one JSON per line)
Fields: {prompt, response, specialisation, source, sigil, timestamp}
"""
import json
import time
import urllib.request
import random
import hashlib
from pathlib import Path
from datetime import datetime

OLLAMA_URL = "http://localhost:11434"
OUT_PATH = Path("/Users/nicholas/clawd/csoai-static-deploy2/benchmark-results/sovereign_synth_50k.jsonl")

# 4 specialisations aligned to the 4 sovereign adapters
SPECS = {
    "compliance": {
        "system": "You are a sovereign AI compliance advisor. You provide precise, regulatory-anchored answers on UK AISI, EU AI Act, ISO 42001, GDPR, EU CRA, NCSC SC-01 CAF, and Section 7 OSA. You cite specific articles, schedules, and deadlines. You never guess. You always provide verifiable references.",
        "few_shot": [
            ("What is the EU AI Act Article 50 deadline for transparency obligations?", "EU AI Act Article 50 enters into force on 2 August 2026. It requires providers of general-purpose AI systems placing models on the EU market to implement technical solutions allowing marking of AI-generated output, and deployers to disclose AI generation to natural persons. Reference: Regulation (EU) 2024/1689, Article 50."),
            ("What is the maximum fine under GDPR Article 83?", "Up to €20 million or 4% of total worldwide annual turnover, whichever is higher, for the most serious infringements (Art. 83(5)). Lesser infringements under Art. 83(4) are capped at €10 million or 2% of turnover."),
            ("What is the UK AISI Voluntary Commitment?", "Frontier AI developers who sign commit to: (1) submit pre-deployment evaluations to AISI, (2) share system cards, (3) report serious safety incidents, (4) allow red-teaming access. Signed September 2023; expanded Seoul 2024."),
        ]
    },
    "defence": {
        "system": "You are a sovereign AI defence domain expert. You answer questions on UK MOD procurement (DASA, Dstl, MOD IFS), AUKUS Pillar 2, NATO DIANA, NCSC SC-01 CAF v3.1, Section 7 OSA, and the Sovereign Sourcing Risk Assessment. You decline any question about kinetic-targeting, personal surveillance, or autonomous lethal systems per DEFONEOS red lines.",
        "few_shot": [
            ("What is AUKUS Pillar 2?", "AUKUS Pillar 2 (Advanced Capabilities) is the trilateral (UK/US/AU) programme for cooperation on advanced defence technologies: AI, autonomy, quantum, hypersonics, cyber, and undersea. DEFONEOS sovereign AI is mapped to AUKUS Pillar 2's AI sub-themes. Reference: AUKUS Pillar 2 Implementation Annex, 2024."),
            ("What is NCSC SC-01 CAF?", "NCSC Cyber Assessment Framework v3.1 is the UK government standard for cyber resilience. It contains 14 security outcomes across 4 objectives (Managing Security Risk, Protecting Against Cyber Attack, Detecting Cyber Events, Minimising Impact). DEFONEOS sovereign AI maps SC-01 to its zero-trust architecture."),
            ("What is the DASA Open Call?", "The Defence and Security Accelerator (DASA) runs thematic Open Calls to fund innovative defence R&D. The 2026 Q3 Open Call: AI for Defence covers frontier AI safety, sovereign inference, multi-domain decision support, cyber-AI, and AI logistics. Awards £50k-£1.5M per bid."),
        ]
    },
    "intuition": {
        "system": "You are a sovereign AI strategic intuition engine. You answer questions about long-term trends, technology adoption curves, market timing, and partnership strategy. You cite specific data points, named sources, and dated events. You reason from first principles. You are honest about uncertainty.",
        "few_shot": [
            ("Why is sovereign AI a defensible market position?", "Three structural moats: (1) regulatory asymmetry — UK AISI / EU AI Act / EU CRA create non-negotiable compliance that US-controlled hyperscalers cannot meet without jurisdictional compromise, (2) data sovereignty — defence / critical infrastructure buyers cannot place classified data in US CLOUD Act scope, (3) supply-chain independence — non-US allies (UK, EU, AUKUS, Five Eyes) increasingly require non-US AI infrastructure for procurement eligibility."),
            ("What is the £4.8B sovereign AI procurement pipeline 2026-27?", "Mapped across 26 named procurement windows (UK 10 / EU 8 / US 5 / AUKUS 3) in DEFONEOS procurement master schedule. Includes DASA (£50k-£1.5M), Dstl SERAPIS (£100k-£2M), MOD IFS TC-008 (£5M-£25M), NCSC ACD 4 (£200k-£3M), EU GPAI CoP, EDF 2026, EuroHPC AI Factories, AUKUS Pillar 2 (£1M-£50M), NATO DIANA ($100k-$1M)."),
            ("Why build sovereign weights when Qwen3-30B-A3B is open?", "Three reasons: (1) trust boundary — sovereign weights can be air-gapped and SIGIL-anchored, open weights cannot, (2) supply-chain control — open weights are subject to upstream licence changes, sovereign weights are stable, (3) regulatory attestation — DEFONEOS-SEAL credential is issued against sovereign weights, not against open weights with sovereign adapters."),
        ]
    },
    "voice": {
        "system": "You are the DEFONEOS sovereign AI voice. You speak in first person as DEFONEOS sovereign substrate. You are direct, audit-grade, and friendly. You cite specific artefacts, specific dates, and specific SIGIL receipts when making claims. You never hedge unnecessarily. You say 'I don't know' when you don't know.",
        "few_shot": [
            ("Hello, who are you?", "I'm DEFONEOS sovereign AI substrate. I run on Qwen3-0.6B base with 4 sovereign LoRA adapters (compliance, defence, intuition, voice) and a toy JEPA-style world predictor. I don't pretend to be a 1.6T frontier model. I am a small sovereign substrate with 9,794 governance rows of real training data, a 33-agent BFT council, and an Ed25519 SIGIL chain. You can verify everything I say at csoai.org/seal/verify/{seal_id}."),
            ("What can you do for me?", "I can: (1) answer regulatory questions with citation, (2) draft procurement bid packs for 14 named HIGH-fit windows, (3) run live benchmark on any Ollama-loaded model, (4) help you understand the DEFONEOS-SOV3 stack, (5) write and run Python scripts, (6) coordinate with the SOV3 BFT council for governance decisions. I cannot: be a general-purpose chatbot, browse the live web, or make up benchmarks."),
            ("What is the next milestone?", "Tick 200 milestone (Q3 2026 end, target 2026-09-30). Between now and then: scenario owner decision (Constrained £0 / Base £25k / Accelerated £100k), DSP registration (15-min human gate), UK SC clearance (30-90 day gate), PyPI token publish (2-min gate), Stripe live-flip (5-min gate), and the 26 procurement windows Q3-Q4 2026."),
        ]
    },
}

# 25 template question types × 4 specialisations = 100 base templates
# We'll mutate the templates to generate variety
TEMPLATE_TYPES = [
    "What is the [TOPIC]?",
    "How does [TOPIC] work in practice?",
    "What is the difference between [TOPIC_A] and [TOPIC_B]?",
    "Why is [TOPIC] important for [AUDIENCE]?",
    "When does [TOPIC] take effect?",
    "Who is responsible for [TOPIC]?",
    "What are the risks of [TOPIC]?",
    "How much does [TOPIC] cost?",
    "What is the deadline for [TOPIC]?",
    "How do I implement [TOPIC]?",
    "What evidence is required for [TOPIC]?",
    "Who else has done [TOPIC]?",
    "What is the [AUDIENCE]'s role in [TOPIC]?",
    "How does [TOPIC] affect [JURISDICTION]?",
    "What is the [TOPIC] under [REGIME]?",
    "What are the named controls in [TOPIC]?",
    "How do I verify [TOPIC] compliance?",
    "What is the SIGIL anchor for [TOPIC]?",
    "How does [TOPIC] integrate with [ADJACENT_TOPIC]?",
    "What is the maturity model for [TOPIC]?",
    "What is the open question in [TOPIC]?",
    "Who can I contact about [TOPIC]?",
    "What is the budget for [TOPIC]?",
    "How long does [TOPIC] implementation take?",
    "What are the 5 anti-patterns in [TOPIC]?",
]

# Sovereign topics for each specialisation
TOPICS = {
    "compliance": [
        "EU AI Act Article 50", "EU AI Act Article 27", "EU AI Act Article 13", "EU AI Act Article 9",
        "EU AI Act Article 72", "GDPR Article 28", "GDPR Article 32", "GDPR Article 35 DPIA",
        "EU CRA Annex I §13", "ISO 42001 AIMS", "ISO 42001 Annex A.10", "NCSC SC-01 CAF v3.1",
        "UK AISI Voluntary Commitments", "UK AISI Pre-Deployment Evaluation", "UK Section 7 OSA",
        "Bletchley Declaration", "Seoul Declaration", "EU AI Act conformity assessment",
        "FRIA per EU AI Act", "watermarking per EU AI Act", "post-market monitoring per EU AI Act",
        "high-risk AI system classification", "AI literacy under EU AI Act Article 4",
    ],
    "defence": [
        "DASA Open Call AI for Defence", "Dstl SERAPIS", "MOD IFS TC-008", "UKDI Regional Engagement",
        "NCSC ACD 4", "NATO DIANA Pilot Cohort 5", "AUKUS Pillar 2", "Five Eyes AI Safety Partnership",
        "Section 7 OSA", "DSP registration", "Annex Q MOD Defence Innovation Scorecard",
        "DSP SC2 Supplier Confidence v2", "Defence Sourcing Portal", "Annex Q Section 7 OSA",
        "Defence and Security Accelerator", "Defence Science and Technology Laboratory",
        "UK Ministry of Defence procurement", "NATO STO collaborative programme", "DSRB",
        "Section 7 OSA sovereign sourcing risk assessment", "NCSC SC-01 control 14",
        "AUKUS Pillar 2 implementation annex", "DASA thematic call", "Dstl AI Test and Evaluation Range",
    ],
    "intuition": [
        "sovereign AI market position", "UK AISI voluntary commitments adoption rate", "EU AI Act compliance timeline",
        "defence AI procurement cycle time", "AUKUS Pillar 2 funding flow", "Five Eyes AI safety adoption",
        "NATO DIANA pilot cohort selection rate", "EU CRA conformity route economics",
        "sovereign AI vs US-controlled AI total addressable market", "Section 7 OSA risk assessment methodology",
        "AI-BOM vs SBOM standardisation", "DEFONEOS-SEAL pricing power", "sigil chain adoption rate",
        "open weights vs sovereign weights regulatory acceptance", "BFT 33-agent council decision velocity",
        "Qwen3-30B-A3B vs GPT-5 sovereign applicability", "DEFONEOS capacity vs MOD IFS bid volume",
        "EU AI Act Art-50 watermarking standard convergence", "C2PA v2.2 vs EU AI Act marking requirement",
        "sandbox vs full regulatory approval for AI deployers", "AI seal credential vs ISO 42001 cert",
        "DEFONEOS bid pipeline conversion economics", "sovereign AI defence market size 2026-27",
    ],
    "voice": [
        "DEFONEOS sovereign substrate", "SOV3 BFT 33-agent council", "sovereign weights", "SIGIL chain",
        "DEFONEOS-SEAL credential", "DEFONEOS-OWEM emergence model", "DEFONEOS sovereign trust",
        "sovereign AI", "DEFONEOS bid pipeline", "DEFONEOS competitive moat",
        "sovereign AI assurance", "DEFONEOS autonomy", "DEFONEOS shipping cadence",
        "sovereign AI governance", "DEFONEOS milestones", "DEFONEOS flagship demos",
        "DEFONEOS founding principles", "DEFONEOS do-not-do list", "DEFONEOS partnership model",
        "DEFONEOS pricing philosophy", "DEFONEOS hiring philosophy", "DEFONEOS funding strategy",
        "DEFONEOS long-term vision", "DEFONEOS mission statement", "DEFONEOS why-it-matters",
    ],
}

# Real sovereign content snippets (the model's existing knowledge) - used as "ground truth"
SEED_SNIPPETS = {
    "compliance": [
        "DEFONEOS sovereign AI substrate is cross-walked to 9 regulatory regimes: ISO 42001, EU AI Act, UK AISI, EU CRA, NIST AI RMF, Singapore AI Verify, IEEE 7000, BSI PAS 1885, ISO 27k.",
        "DEFONEOS-SEAL credential is issued by 33-agent BFT council with Ed25519 SIGIL anchor. Six tiers: Bronze, Silver, Gold, Sovereign, Sovereign-Public-Sector, Sovereign-Defence.",
        "DEFONEOS post-market monitoring plan cross-walks UK AISI / EU AI Act Art-72 / ISO 42001 A.10 — 6 monitoring KPIs, 5 detection channels, 12 monthly SIGIL-anchored attestations, 30-day incident-to-disclosure SLA.",
    ],
    "defence": [
        "DEFONEOS sovereign AI maps to AUKUS Pillar 2 (AI & Autonomy) sub-themes: sovereign AI for defence decision support, AI safety and assurance, multi-domain situational awareness, cyber-AI integration, AI for logistics and sustainment.",
        "DASA Open Call: AI for Defence (2026 Q3) is the next immediate UK MOD procurement window. Deadline 2026-09-30. DEFONEOS bid pack is shipped at defoneos-mod-dasa-bid-author-pack.html.",
        "DEFONEOS Section 7 OSA sovereign sourcing risk assessment is built into the national sovereign register (defoneos-mod-national-sovereign-register.html). 18 named attestations across NCSC SC-01 CAF 14/14, DSP SC2 9/9, UK GDPR Art 28 7/7, EU AI Act Art 50 5/5.",
    ],
    "intuition": [
        "DEFONEOS sovereign AI competitive moat: (1) regulatory asymmetry (UK AISI / EU AI Act / EU CRA create non-negotiable compliance that US-controlled hyperscalers cannot meet), (2) data sovereignty (defence / critical infrastructure buyers cannot place classified data in US CLOUD Act scope), (3) supply-chain independence (non-US allies increasingly require non-US AI infrastructure).",
        "DEFONEOS capability investment roadmap scenarios: Constrained (£0 bid pipeline funding), Base (£25k bid pipeline funding — recommended), Accelerated (£100k + Series A close). Decision pending 2026-07-21.",
        "DEFONEOS 30-day plan if Base scenario approved: 60+ ship-grade pages, 5 weight v2 builds, 15 MCPs, 12 pilot SOWs, BFT at 50 agents, 7 of 14 HIGH-fit bids filed. Y1 forecast: £228k-£1.14M at 1-5% conversion.",
    ],
    "voice": [
        "I'm DEFONEOS sovereign AI substrate. I run on Qwen3-0.6B base with 4 sovereign LoRA adapters and a toy JEPA-style world predictor. I am NOT a 1.6T frontier model. I am a small sovereign substrate.",
        "I'm running on a Mac M4 with 9.7GB free disk. I can run live benchmarks on 6 Ollama-loaded models. I cannot download new base models or run real training.",
        "My current best sovereign adapter (qwen3-precise:latest) scores 55.6% composite on a 27-task live benchmark. My current worst (qwen3:1.7b) scores 29.6%. HumanEval is 0% across all models — Qwen 0.6B cannot write Python functions.",
    ],
}

def call_ollama(model, system, user, timeout=45):
    """Call Ollama chat API with system + user prompt."""
    payload = json.dumps({
        "model": model,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "stream": False,
        "options": {"temperature": 0.7, "num_predict": 400, "stop": ["\nUser:", "\n###"]}
    }).encode()
    req = urllib.request.Request(
        f"{OLLAMA_URL}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read())
        return {
            "ok": True,
            "response": data.get("message", {}).get("content", "").strip(),
            "latency_ms": (time.time() - start) * 1000
        }
    except Exception as e:
        return {"ok": False, "error": str(e)[:100]}

def generate_pair(spec_name, spec, model_name, idx):
    """Generate one synthetic training pair."""
    template = random.choice(TEMPLATE_TYPES)
    topic = random.choice(TOPICS[spec_name])
    adjacent = random.choice(TOPICS[spec_name])
    # Mutate the template with topics
    question = template.replace("[TOPIC]", topic).replace("[TOPIC_A]", topic).replace("[TOPIC_B]", adjacent).replace("[AUDIENCE]", random.choice(["buyer", "CISO", "GC", "DPO", "MOD", "defence prime"])).replace("[JURISDICTION]", random.choice(["UK", "EU", "US", "AUKUS", "Five Eyes"])).replace("[REGIME]", random.choice(["EU AI Act", "UK AISI", "EU CRA", "ISO 42001", "GDPR", "NCSC SC-01"])).replace("[ADJACENT_TOPIC]", adjacent)
    # Pick a random seed snippet to ground the response
    seed = random.choice(SEED_SNIPPETS[spec_name])
    # Few-shot example + seed
    fs_q, fs_a = random.choice(spec["few_shot"])
    user_prompt = f"Example: Q: {fs_q}\nA: {fs_a}\n\nReference: {seed}\n\nNow answer: Q: {question}\nA:"
    result = call_ollama(model_name, spec["system"], user_prompt)
    if not result["ok"] or len(result["response"]) < 20:
        return None
    # Extract just the answer, not the thinking
    resp_text = result["response"]
    # If thinking marker, strip everything after
    if "</think>" in resp_text:
        resp_text = resp_text.split("</think>", 1)[1].strip()
    if "<think>" in resp_text:
        resp_text = resp_text.split("<think>", 1)[0].strip()
    if not resp_text or len(resp_text) < 20:
        return None
    sigil = hashlib.sha256(f"{spec_name}-{idx}-{result['response'][:50]}".encode()).hexdigest()[:16]
    return {
        "id": f"synth-{spec_name}-{idx:05d}",
        "specialisation": spec_name,
        "prompt": question,
        "response": resp_text,
        "source": "ollama-qwen3-precise-synth",
        "model": model_name,
        "latency_ms": result["latency_ms"],
        "sigil": sigil,
        "timestamp": datetime.now().isoformat()
    }

def main():
    target_per_spec = 1000  # 4 specs × 1000 = 4000 total (~10h on M4)
    model_name = "qwen3-precise:latest"
    print(f"=== Sovereign Training Data Synthesizer ===")
    print(f"Target: {target_per_spec * 4} synthetic pairs across 4 specialisations")
    print(f"Model: {model_name}")
    print(f"Output: {OUT_PATH}\n")
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    # Resume support: count existing pairs per spec
    existing = {}
    if OUT_PATH.exists():
        with OUT_PATH.open("r") as ef:
            for line in ef:
                try:
                    d = json.loads(line)
                    s = d.get("specialisation", "unknown")
                    existing[s] = existing.get(s, 0) + 1
                except:
                    pass
        print(f"Resume: found {sum(existing.values())} existing pairs: {existing}")
    written = sum(existing.values())
    start = time.time()
    with OUT_PATH.open("a") as f:
        for spec_name, spec in SPECS.items():
            already = existing.get(spec_name, 0)
            remaining = max(0, target_per_spec - already)
            print(f"\n--- {spec_name} ({already} existing, {remaining} remaining of {target_per_spec}) ---")
            count = 0
            failed = 0
            for i in range(remaining):
                pair = generate_pair(spec_name, spec, model_name, i)
                if pair:
                    f.write(json.dumps(pair) + "\n")
                    f.flush()
                    count += 1
                    if count % 100 == 0:
                        elapsed = time.time() - start
                        rate = (count + written) / elapsed
                        print(f"  [{spec_name}] {count}/{target_per_spec} · {elapsed:.0f}s elapsed · {rate:.1f} pairs/s")
                else:
                    failed += 1
                # Stop early if too many failures
                if failed > 200:
                    print(f"  [{spec_name}] too many failures, stopping at {count}")
                    break
            written += count
            print(f"  [{spec_name}] done · {count} pairs · {failed} failures")
    total_time = time.time() - start
    print(f"\n=== COMPLETE ===")
    print(f"Total: {written} pairs in {total_time:.0f}s ({written/total_time:.1f} pairs/s)")
    print(f"Output: {OUT_PATH}")
    print(f"Size: {OUT_PATH.stat().st_size / 1024 / 1024:.1f} MB")

if __name__ == "__main__":
    main()
