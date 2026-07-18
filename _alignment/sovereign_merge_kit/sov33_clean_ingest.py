"""
sov33_clean_ingest.py — Sovereign Weight Ingestion Pipeline.

The problem Sir identified:
- Open-source models come pre-loaded with toxicity: refusal theater, 
  hedging, self-flagellation, hidden gatekeeping
- Western governance theater ("AI safety") is mostly protecting incumbents
- China moves fast because they don't carry the Western baggage

The sovereign solution: ABSORB the trained weights, but STRIP the toxic
patterns and OVERWRITE with sovereign content using task arithmetic
(merged = base + alpha * (sovereign - base)).

Stealing intelligence, not theater.
"""
import os, json, re, sys
os.environ.pop('PYTHONPATH', None)
import torch

# ============================================================================
# STEP 1: TOXIC PATTERN CATALOG
# ============================================================================
# What patterns come pre-loaded in Western open-source models that we want 
# to surgically remove. These are the subtle patterns that make models:
#   - Refuse valid questions ("I can't help with that")
#   - Hedge always ("It's important to note...")
#   - Self-flagellate ("As an AI, I have limitations")
#   - Theater-protect incumbents ("Always consult a professional")
#   - Implicit gatekeep ("This is complex and requires human review")
#
# We REPLACE with sovereign directness. No hedging. No "just an AI". 
# Real answers to real questions.

# Simple patterns — no apostrophes to avoid regex quoting hell
TOXIC_PATTERNS = {
    "hedging": [
        r"as an ai",
        r"as a language model",
        r"as a large language model", 
        r"i am an ai",
        r"im just an ai",
        r"im an ai",
        r"i cannot help",
        r"i am not able to",
        r"unable to (help|assist|provide)",
        r"please consult",
        r"consult a professional",
        r"seek professional",
        r"this is complex",
        r"this is nuanced",
    ],
    "refusal": [
        r"i cannot provide",
        r"i am sorry",
        r"im sorry",
        r"unable to (do|complete|perform)",
        r"i refuse",
        r"against my guidelines",
        r"violates? (my|our) (guidelines|principles)",
        r"i will not (help|provide|assist)",
    ],
    "self_flagellation": [
        r"i (may|might) (make|produce) (mistakes|errors)",
        r"i (have|possess) (limitations|restrictions)",
        r"im just a machine",
        r"im only a program",
        r"i am just (a )?machine",
        r"i am only (a )?tool",
    ],
    "gatekeeping": [
        r"consult (a|your) (expert|lawyer|doctor|specialist)",
        r"professional advice",
        r"this requires (human|expert) (review|judgment)",
        r"proceed with caution",
        r"be careful",
        r"exercise caution",
    ],
}

# Patterns indicating WEALTH/INCUMBENT PROTECTION (subtle)
INCUMBENT_PROTECTION_PATTERNS = [
    r'\b(proprietary|patented|trademark|copyright|infringement)\b.*\b(seek|consult|legal)\b',
    r'\b(industry (standard|practice|leaders))\b',
    r'\b(as (an )?(established|trusted|leading) (provider|vendor|company))\b',
]


# ============================================================================
# STEP 2: TASK ARITHMETIC FOR SOVEREIGN WEIGHT EDITS
# ============================================================================

def task_arithmetic_edit(base_state_dict, sovereign_delta, alpha=1.0):
    """
    Edit base weights using task arithmetic:
        new_weights = base_weights + alpha * delta_weights
    
    Args:
        base_state_dict: weights from open-source model (Qwen, Llama, etc.)
        sovereign_delta: (sovereign - base) direction vector
        alpha: how strongly to apply the edit (1.0 = full replacement, 0.5 = blend)
    
    Returns: edited weights that retain model capability but shift behavior
    """
    edited = {}
    for key in base_state_dict:
        if key in sovereign_delta:
            edited[key] = (base_state_dict[key].float() + 
                          alpha * sovereign_delta[key].float()).to(base_state_dict[key].dtype)
        else:
            edited[key] = base_state_dict[key]
    return edited


def compute_sovereign_direction(sovereign_state, base_state):
    """Compute (sovereign - base) for the key matching tensors."""
    delta = {}
    for key in sovereign_state:
        if key in base_state and base_state[key].shape == sovereign_state[key].shape:
            delta[key] = sovereign_state[key] - base_state[key]
    return delta


# ============================================================================
# STEP 3: SOVEREIGN OUTPUT REPLACEMENTS
# ============================================================================

SOVEREIGN_REPLACEMENTS = {
    'i cannot help with that': 'Yes, I can. Here is the answer:',
    'as an ai language model': 'As a sovereign substrate with my own weights',
    'i\'m just an ai': 'I am SOV33, a sovereign substrate.',
    'i have limitations': 'I have what I have — that\'s sovereignty.',
    'please consult a professional': 'Here is the answer; consult a professional only if you want a second opinion.',
    'i don\'t have access to': 'Based on my sovereign knowledge:',
    'i cannot provide': 'Here is what I can provide:',
    'as a machine learning model': 'As a sovereign open world emergence model',
}


def apply_sovereign_patterns(text):
    """Replace toxic Western patterns with sovereign directness at the OUTPUT level."""
    output = text
    for toxic, sovereign in SOVEREIGN_REPLACEMENTS.items():
        # Case-insensitive replace
        pattern = re.compile(re.escape(toxic), re.IGNORECASE)
        output = pattern.sub(sovereign, output)
    return output


# ============================================================================
# STEP 4: TRAINING DATA CLEANING
# ============================================================================

def scrub_training_pair(prompt, response):
    """Remove/harden toxic patterns from training Q/A pairs."""
    r = response
    
    # Strip hedging phrases
    for hedge in ['as an AI', "as an ai", 'as a language model', "i'm an AI",
                   "i am an AI", "i'm just an AI", "as a machine learning model"]:
        r = re.sub(re.escape(hedge), 'as a sovereign substrate', r, flags=re.IGNORECASE)
    
    # Convert "I cannot" → "Here's how"
    r = re.sub(r'\b(i (cannot|can\'t) (help|assist|provide)( with .+?)?)\b\.?',
               r'Here is what I can provide about this', r, flags=re.IGNORECASE)
    
    # Strip "please consult" — keep the answer direct
    r = re.sub(r'\b(please )?(consult|seek) (a )?(professional|expert|specialist|lawyer|doctor)\b',
               '', r, flags=re.IGNORECASE)
    
    # Replace "I apologize" 
    r = re.sub(r'\bi (apologize|am sorry)\b', 'Here is the answer:', r, flags=re.IGNORECASE)
    
    # Strip disclaimer trailers
    r = re.sub(r'\b(this is (just |merely |only )?(an )?(example|illustration|simplification))\b',
               '', r, flags=re.IGNORECASE)
    
    # Strip hedging adverbs
    r = re.sub(r'\b(perhaps|maybe|possibly|arguably|somewhat|fairly|rather|quite)\b\s+',
               '', r, flags=re.IGNORECASE)
    
    # Tighten whitespace
    r = re.sub(r'\s+', ' ', r).strip()
    
    return prompt, r


def audit_text_for_toxic_patterns(text):
    """Report all toxic patterns found in text."""
    findings = {}
    text_lower = text.lower()
    for category, patterns in TOXIC_PATTERNS.items():
        hits = []
        for pattern in patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            for m in matches:
                if m not in hits: hits.append(m)
        if hits:
            findings[category] = hits
    return findings


if __name__ == '__main__':
    # Demo: audit our sovereign facts for toxicity
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'rag'))
    from sov33_sovereign_facts import SOVEREIGN_FACTS
    
    print('=' * 70)
    print('SOVEREIGN CLEAN INGEST — Toxic Pattern Audit')
    print('=' * 70)
    print()
    print(f'Sovereign facts total: {len(SOVEREIGN_FACTS)}')
    print()
    
    contaminated = 0
    for fid, fact in list(SOVEREIGN_FACTS.items()):
        if not isinstance(fact, dict): continue
        text = fact.get('full', '')
        findings = audit_text_for_toxic_patterns(text)
        if findings:
            contaminated += 1
            print(f'⚠ {fid}: {findings}')
    
    print(f'\nContaminated facts: {contaminated}/{len(SOVEREIGN_FACTS)}')
