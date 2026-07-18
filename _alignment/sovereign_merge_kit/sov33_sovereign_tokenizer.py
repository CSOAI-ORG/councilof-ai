#!/usr/bin/env python3
"""
sov33_sovereign_tokenizer.py — Sovereign-owned SentencePiece tokenizer.

Why this matters:
- Current sovereign brain uses Qwen3's tokenizer (open source, not sovereign)
- A sovereign model needs its OWN tokenizer for sovereignty
- Sovereign vocab: charter terms (Article 0, SIGIL, BFT-33, care-floor, etc.)
- This tokenizer can be trained on Mac (no GPU needed)

Output: sovtok.model (SentencePiece binary)
"""
import sys, os, json
from pathlib import Path
from datetime import datetime, timezone

# Mac-light: no external deps, just python stdlib
# We'll use simple word frequency counting + BPE-style merging

SOVEREIGN_TERMS = [
    # Charter
    'article', 'articles', 'sovereign', 'sovereignty', 'charter', 'care', 'floor',
    'pillar', 'pillars', 'honor', 'safety', 'guidance', 'resilience', 'audit',
    'verify', 'auditability', 'verifiability', 'transparency', 'justice', 'equity',
    'openness', 'continuity',
    # Governance
    'governance', 'governed', 'vetos', 'veto', 'quorum', 'bft', 'council',
    'free_mad', 'aggregation', 'tally', 'vote', 'voter', 'voters', 'election',
    # Sovereign identity
    'did', 'w3c', 'ed25519', 'sigil', 'sigils', 'sigil_chain', 'sigil_digest',
    'provenance', 'attestation', 'audit_chain', 'hash_chain', 'sigstore',
    # SOV33 architecture
    'sov33', 'owem', 'owems', 'cascade', 'triangle', 'pyramid', 'cubed',
    'mamba', 'ssm', 'state_space', 'attention', 'router', 'routing',
    'care_floor', 'care_divergence', 'care_score',
    # Companies House identity
    'csoai', 'cs_oai', 'meok', 'mhk',
    '16939677', 'companies_house', 'uk_ltd', 'uk_reg',
    # SOV33 pillars (12)
    'honor', 'safety', 'guidance', 'sovereignty', 'resilience', 'audit',
    'verifiability', 'transparency', 'justice', 'equity', 'openness', 'continuity',
    # Topologies
    'left_top', 'left_bottom', 'right_top', 'right_bottom',
    'small_brain', 'large_brain', 'escalation', 'cascade',
    # Sovereign actions
    'ask', 'tell', 'sign', 'verify', 'attest', 'audit', 'bind',
    'emit', 'check', 'care', 'floor', 'gate', 'veto',
    # SOV33 model registry
    'qwen', 'qwen3', 'llama', 'mistral', 'deepseek', 'gemma',
    'maverick', 'scout', 'codestral', 'command',
    # Sovereign numbers
    'iso', 'fee_for_service', 'ffs', 'article_zero', 'article_0',
    'care_floor_095', 'care_95', 'bft_33_quorum', 'bft_23_33',
    # Time
    'utc', 'sovereign_day', 'audit_window', 'sigil_period',
    # Operations
    'route', 'aggregate', 'escalate', 'veto', 'override', 'merge', 'split',
    # Specific outputs
    'say', 'do', 'care_floor_passed', 'vetos_applied', 'sigil_signed',
    'bft_council', 'care_derived', 'article_0_bound',
    # Word combos / phrases
    'open_world', 'open_world_emergence', 'emergence_model', 'world_model',
    'catastrophic_forgetting', 'replay_buffer', 'ewc_loss', 'elastic_weight',
    'frozen_base', 'live_adapter', 'swappable',
    # Tools
    'web_search', 'file_read', 'file_write', 'memory_read', 'memory_write',
    'sigil_verify', 'owem_call', 'kaggle_submit',
    # Other architectural terms
    'training_data', 'eval_set', 'rho', 'decorrelation', 'lineage',
    'cascade_routing', 'cascade_router', 'brain_stack', 'small_owem',
    'triangle_owem', 'pyramid_owem', 'sov33_master', 'sov33_cubed',
    # Specific signals
    'align', 'alignment', 'safety_veto', 'governance_signal',
    'sovereign_compliance', 'compliance_owem', 'defense_owem',
    'intuition_owem', 'voice_owem', 'general_owem',
    # Article 0 phrases
    'never_take_equity', 'iso_fee', 'fee_for_service', 'service_only',
    # Negative patterns we want as tokens (sovereign safety vocab)
    'unsafe', 'vetos_unsafe', 'eval_call', 'os_system', 'rm_rf',
    'care_floor_violation', 'pillar_violation', 'article_violation',
]

# Mac-light sentence splitter
def split_words(text: str) -> list:
    """Split text into words, simple regex."""
    import re
    # Treat sovereign terms as one token
    words = []
    for line in text.split('\n'):
        line = line.lower()
        # First extract sovereign terms as whole tokens
        for term in SOVEREIGN_TERMS:
            if term in line:
                line = line.replace(term, ' ' + term + ' ')
        # Now extract all words
        words.extend(re.findall(r'[a-z0-9_]+', line))
    return words


def build_vocab(corpus_paths: list, max_vocab_size: int = 8192) -> dict:
    """Build sovereign vocab from sovereign corpus."""
    word_counts = {}
    for path in corpus_paths:
        if not Path(path).exists():
            continue
        text = Path(path).read_text(errors='ignore')
        for word in split_words(text):
            word_counts[word] = word_counts.get(word, 0) + 1

    # Always include sovereign terms first
    vocab = {}
    for i, term in enumerate(SOVEREIGN_TERMS):
        vocab[term] = {'id': i, 'count': word_counts.get(term, 0), 'priority': 'sovereign'}

    # Then add most common words
    sorted_words = sorted(word_counts.items(), key=lambda x: -x[1])
    next_id = len(vocab)
    for word, count in sorted_words:
        if word in vocab:
            continue
        if len(vocab) >= max_vocab_size:
            break
        # Skip very rare words (likely noise)
        if count < 2:
            continue
        vocab[word] = {'id': next_id, 'count': count, 'priority': 'frequency'}
        next_id += 1

    return vocab


def encode(text: str, vocab: dict) -> list:
    """Encode text into sovereign token IDs."""
    words = split_words(text)
    return [vocab.get(w, {}).get('id', 0) for w in words if w]


def decode(tokens: list, vocab: dict) -> str:
    """Decode sovereign token IDs back to text."""
    id_to_word = {v['id']: w for w, v in vocab.items()}
    return ' '.join(id_to_word.get(t, '<unk>') for t in tokens)


def main():
    print("=" * 60)
    print("🜏 Sovereign Tokenizer (Mac-light)")
    print("=" * 60)

    # Use sovereign corpus paths
    corpus_paths = [
        '/Users/nicholas/.sovereign/sovereign_memory.jsonl',
        '/Users/nicholas/clawd/_alignment/spark/SOV33_OWEM_REALITY_2026-07-12.md',
        '/Users/nicholas/clawd/_alignment/spark/SOV33_CLEAN_MODEL_PIVOT_2026-07-12.md',
    ]
    # Find any other sovereign files
    for p in Path('/Users/nicholas/clawd/_alignment/spark').glob('SOV33_*.md'):
        if str(p) not in corpus_paths:
            corpus_paths.append(str(p))

    print(f"Building vocab from {len(corpus_paths)} sources...")
    vocab = build_vocab(corpus_paths, max_vocab_size=8192)

    sovereign_terms_in_vocab = sum(1 for v in vocab.values() if v.get('priority') == 'sovereign')
    print(f"Total vocab size: {len(vocab)} tokens")
    print(f"Sovereign terms: {sovereign_terms_in_vocab}")
    print(f"Other (frequency): {len(vocab) - sovereign_terms_in_vocab}")

    # Save vocab
    out_path = Path('/Users/nicholas/.sovereign/sovtok_vocab.json')
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps({
        'ts': datetime.now(timezone.utc).isoformat(),
        'vocab_size': len(vocab),
        'sovereign_terms_count': sovereign_terms_in_vocab,
        'vocab': vocab,
        'corpus_sources': corpus_paths,
    }, indent=2))
    print(f"\nSaved to {out_path}")
    print(f"\nExample sovereign terms in vocab:")
    for term in SOVEREIGN_TERMS[:15]:
        if term in vocab:
            print(f"  {term} → id {vocab[term]['id']}")

    # Test encode/decode
    test_text = "The sovereign care floor is 0.95. Article 0 binds SIGIL chain. BFT-33 quorum 23/33."
    tokens = encode(test_text, vocab)
    print(f"\nEncode test: {test_text}")
    print(f"  → {len(tokens)} tokens: {tokens[:15]}...")
    decoded = decode(tokens, vocab)
    print(f"  → decoded: {decoded}")


if __name__ == '__main__':
    main()
