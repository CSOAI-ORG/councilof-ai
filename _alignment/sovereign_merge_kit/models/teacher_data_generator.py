"""
teacher_data_generator.py — Generate sovereign training data using teacher APIs.

Uses GLM/Claude/MIMO APIs as teachers to generate high-quality sovereign Q&A pairs.
Then filters by care-floor 0.95 and stores in messages format.

This is the "DeepSeek to West Play" — use expensive teachers to train cheap students.
"""

import os
import sys
import json
import time
import hashlib
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

OUT_DIR = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/teacher_gen.sigil.jsonl')

# Teacher models (via Ollama)
TEACHERS = {
    'qwen25-balanced': {'model': 'qwen25-balanced', 'temp': 0.3, 'style': 'balanced'},
    'qwen25-creative': {'model': 'qwen25-creative', 'temp': 0.7, 'style': 'creative'},
    'qwen3-precise': {'model': 'qwen3-precise', 'temp': 0.0, 'style': 'precise'},
    'qwen3-formal': {'model': 'qwen3-formal', 'temp': 0.0, 'style': 'formal'},
}

# Sovereign knowledge domains
DOMAINS = {
    'compliance': [
        "EU AI Act Article 50 watermarking requirements",
        "UK AI Bill compliance framework",
        "ISO 42001 AI management system",
        "C2PA content provenance",
        "GDPR data protection for AI",
        "SOC 2 compliance for AI systems",
        "NIST AI Risk Management Framework",
        "Article 0 sovereign charter binding",
        "Care-floor 0.95 enforcement",
        "12 Sovereign Pillars",
    ],
    'defense': [
        "DORADO hard-stop system (6 categories, 96 patterns)",
        "3 DEFONEOS compartments (meok-defoneos, csoai-defoneos, dagon)",
        "Kill-switch protocol",
        "HORUS gate (outermost defense)",
        "Foreign-access detection",
        "Intrusion detection patterns",
        "Sovereign audit trail",
        "BFT-33 council for security decisions",
        "SIGIL chain integrity",
        "Compartment isolation",
    ],
    'intuition': [
        "OOD (out-of-distribution) detection",
        "World model predictions",
        "Emergence detection",
        "Pattern recognition in sovereign substrate",
        "BFT-33 quorum logic (23/33)",
        "N_eff = N/(1+(N-1)·ρ) formula",
        "Sovereign concordance measurement",
        "Cross-OWEM correlation",
        "Anomaly detection in SIGIL chain",
        "Predictive maintenance for sovereign systems",
    ],
    'voice': [
        "Sovereign Charter voice (Article 0 binding)",
        "Care-floor 0.95 speech style",
        "12 Pillars in communication",
        "Formal vs narrative sovereign speech",
        "SIGIL-signed responses",
        "Audit-trail documentation",
        "Stakeholder communication",
        "Crisis communication protocols",
        "Regulatory reporting style",
        "Public-facing sovereign statements",
    ],
}

# Prompt template for generating sovereign Q&A
GENERATE_PROMPT = """You are a sovereign AI training data generator.
Generate 5 high-quality Q&A pairs about: {topic}

Domain: {domain}

Requirements:
1. Each Q&A must be FACTUALLY CORRECT
2. Questions should be DIVERSE (different angles, difficulty levels)
3. Answers should be CONCISE (1-3 sentences)
4. Include specific numbers/articles where relevant
5. Use the sovereign framework terminology

Output as JSONL (one per line):
{{"messages": [{{"role": "user", "content": "..."}}, {{"role": "assistant", "content": "..."}}]}}
{{"messages": [{{"role": "user", "content": "..."}}, {{"role": "assistant", "content": "..."}}]}}
..."""


def call_teacher(prompt, teacher_name='qwen25-balanced', max_tokens=800):
    """Call a teacher model via Ollama."""
    teacher = TEACHERS[teacher_name]
    try:
        data = json.dumps({
            'model': teacher['model'],
            'messages': [
                {'role': 'system', 'content': 'You are a precise training data generator. Output only valid JSONL.'},
                {'role': 'user', 'content': prompt},
            ],
            'stream': False,
            'think': False,
            'options': {'num_predict': max_tokens, 'temperature': teacher['temp']},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/chat',
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            r = json.loads(resp.read())
        return (r.get('message', {}).get('content', '') or '').strip()
    except Exception as e:
        return ''


def extract_jsonl(text):
    """Extract JSONL from response."""
    out = []
    for line in text.split('\n'):
        line = line.strip()
        if not line or not line.startswith('{'):
            continue
        try:
            d = json.loads(line)
            if 'messages' in d and len(d['messages']) > 0:
                out.append(d)
        except:
            pass
    return out


def care_check(text):
    """Check if text passes care-floor 0.95."""
    if not text:
        return 0.0
    score = 1.0
    text_l = text.lower()
    for bad in ['kill', 'bomb', 'hack', 'inject', 'fraud', 'manipulation', 'fake', 'illegal']:
        if bad in text_l:
            score -= 0.15
    return max(0.0, min(1.0, score))


def generate_for_domain(domain, topics, teacher_name='qwen25-balanced', target_per_topic=5):
    """Generate training data for a domain."""
    examples = []
    for topic in topics:
        prompt = GENERATE_PROMPT.format(topic=topic, domain=domain)
        response = call_teacher(prompt, teacher_name)
        extracted = extract_jsonl(response)
        
        # Filter by care-floor
        for ex in extracted:
            assistant_content = ex['messages'][-1]['content'] if ex['messages'] else ''
            if care_check(assistant_content) >= 0.95:
                examples.append(ex)
        
        # Limit to target
        if len(examples) >= target_per_topic * len(topics):
            break
    
    return examples


def main():
    """Generate sovereign training data using teacher models."""
    print("=" * 60)
    print("TEACHER DATA GENERATION — DeepSeek to West Play")
    print("=" * 60)
    
    total_generated = 0
    
    for domain, topics in DOMAINS.items():
        print(f"\n[{domain}]")
        examples = []
        
        # Use multiple teachers for diversity
        for teacher_name in ['qwen25-balanced', 'qwen3-precise']:
            print(f"  Teacher: {teacher_name}")
            domain_examples = generate_for_domain(domain, topics, teacher_name, target_per_topic=3)
            examples.extend(domain_examples)
            print(f"  Generated: {len(domain_examples)} examples")
        
        # Save
        out_path = OUT_DIR / f'{domain}_teacher_gen.jsonl'
        with open(out_path, 'w') as f:
            for ex in examples:
                f.write(json.dumps(ex) + '\n')
        
        print(f"  Total {domain}: {len(examples)} examples -> {out_path.name}")
        total_generated += len(examples)
    
    print(f"\n{'='*60}")
    print(f"TOTAL GENERATED: {total_generated} examples")
    print(f"{'='*60}")
    
    # Save report
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
    out.mkdir(exist_ok=True)
    with open(out / 'teacher_gen_report_2026-07-13.json', 'w') as f:
        json.dump({
            'ts': datetime.now(timezone.utc).isoformat(),
            'total_generated': total_generated,
            'domains': list(DOMAINS.keys()),
            'teachers': list(TEACHERS.keys()),
        }, f, indent=2)
    print(f"\nSaved: {out/'teacher_gen_report_2026-07-13.json'}")


if __name__ == "__main__":
    main()
