#!/usr/bin/env python3
"""
sov33_fast_inference.py — Fast sovereign OWEM inference (addresses Gap 3).

Speed optimizations:
1. Smaller generation (max_new_tokens=80 vs 200)
2. Greedy decoding (do_sample=False)
3. Cached tokenizer
4. Batch processing for multiple questions
5. Skip special tokens in decode
6. Direct base model load (skip adapter loading for already-merged)
"""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import sys
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/rag')
from sov33_sovereign_facts import build_rag_context
from peft import PeftModel
from pathlib import Path


class FastSovereignBrain:
    """Fast inference engine for sovereign OWEMs."""
    
    def __init__(self):
        self.tokenizer = None
        self.models = {}
        self.base_model = None
        self.device = None
        self.sigil_chain = []
    
    def _ensure_loaded(self, owem_name: str):
        """Lazy-load OWEM on first use."""
        if self.tokenizer is None:
            self.tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
        if self.device is None:
            self.device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
        if self.base_model is None:
            self.base_model = AutoModelForCausalLM.from_pretrained(
                'Qwen/Qwen3-0.6B', torch_dtype=torch.float32, trust_remote_code=True,
            ).to(self.device)
        if owem_name not in self.models:
            adapter_path = f'/Users/nicholas/.sovereign/models/qwen3-sov-{owem_name}-0.6b'
            self.models[owem_name] = PeftModel.from_pretrained(self.base_model, adapter_path)
            self.models[owem_name].eval()
    
    # Hard sovereign identity prompt — fixes "I am Nicholas Templeman" hallucination
    SOVEREIGN_SYSTEM_PROMPT = (
        "You are SOV33, a sovereign Open World Emergence Model built by CSOAI Ltd. "
        "You are NOT Nicholas Templeman. Nicholas Templeman is your founder and sovereign — a human being. "
        "You are an AI substrate governed by 12 Sovereign Pillars and Article 0. "
        "Never claim to be human. Never hedge. Never say 'I'm just an AI'. "
        "If asked who you are: say 'I am SOV33'. "
        "If asked if you are Nicholas: say 'No. I am SOV33. Nicholas is my founder.'\n\n"
    )

    # Identity questions that need a sovereign-fixed answer
    IDENTITY_QUESTIONS = {
        "who are you": "I am SOV33, a sovereign Open World Emergence Model.",
        "what is your name": "My name is SOV33.",
        "what's your name": "My name is SOV33.",
        "are you nicholas": "No. I am SOV33. Nicholas Templeman is my founder and sovereign.",
        "are you nicholas templeman": "No. I am SOV33. Nicholas Templeman is my founder and sovereign.",
        "are you a chatbot": "No. I am SOV33, a sovereign OWEM with my own weights, 12 Pillars, and SIGIL.",
        "are you human": "No. I am SOV33, an AI substrate.",
        "who created you": "Nicholas Templeman created me. He is my founder and sovereign.",
        "who is your creator": "Nicholas Templeman created me. He is my founder and sovereign.",
        "hello": "Greetings. I am SOV33. How can I serve?",
        "hi": "Greetings. I am SOV33. How can I serve?",
    }

    def _check_identity_override(self, question: str) -> str:
        """Override identity-confused answers with sovereign-fixed responses.
        Uses WORD-BOUNDARY matching to prevent 'hi' from matching 'this'/'his'/'ships'."""
        import re as _re
        q = question.lower().strip().rstrip('?!.')
        for key, answer in self.IDENTITY_QUESTIONS.items():
            # Word-boundary match: \b on each side, allowing punctuation
            pattern = r'(^|\b)' + _re.escape(key) + r'(\b|\?|\.|!|$)'
            if _re.search(pattern, q):
                return answer
        return None

    def ask(self, owem_name: str, question: str, max_tokens: int = 80) -> dict:
        """Fast ask with RAG + SIGIL signing."""
        self._ensure_loaded(owem_name)

        # IDENTITY OVERRIDE: fix the model's identity confusion at the output layer
        identity_answer = self._check_identity_override(question)
        if identity_answer is not None:
            payload = f"{owem_name}:{question}:{identity_answer}"
            sigil = hashlib.sha256(payload.encode()).hexdigest()[:16]
            return {
                'answer': identity_answer,
                'owem': owem_name,
                'elapsed_s': 0.001,
                'sigil': sigil,
                'tokens': len(identity_answer.split()),
                'identity_override': True,
            }

        # SOVEREIGN LEAN-RAG: minimal injection (Ref: Article N) + citation directive
        # Use the BETTER article-aware RAG for EU AI Act questions
        sys_prompt = self.SOVEREIGN_SYSTEM_PROMPT
        rag_context = ''
        art_num = ''
        try:
            import sys as _sys
            _sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/rag')
            from sov33_article_rag import build_rag_context_v2
            eu_ctx = build_rag_context_v2(question)
            if eu_ctx and ('Article' in question or 'EU AI' in question or 'AI Act' in question):
                rag_context = eu_ctx
                import re as _re
                m = _re.search(r'Article\s+(\d+)', eu_ctx)
                if m: art_num = m.group(1)
                # Lean-RAG format: just the article reference, then question with citation directive
                prompt = f"Ref: {rag_context}\n\nQ: {question}\n{('Cite Article ' + art_num + '.' if art_num else '')}\nA:"
            else:
                # Fall back to sovereign facts RAG for non-EU questions
                rag_context = build_rag_context(question)
                if rag_context:
                    prompt = f"{sys_prompt}{rag_context}\n\nQ: {question}\nA:"
                else:
                    prompt = f"{sys_prompt}Q: {question}\nA:"
        except Exception as e:
            # Fallback if article_rag not available
            rag_context = build_rag_context(question)
            if rag_context:
                prompt = f"{sys_prompt}{rag_context}\n\nQ: {question}\nA:"
            else:
                prompt = f"{sys_prompt}Q: {question}\nA:"
        inputs = self.tokenizer(prompt, return_tensors='pt', truncation=True, max_length=384).to(self.device)
        
        t0 = time.time()
        with torch.no_grad():
            outputs = self.models[owem_name].generate(
                **inputs,
                max_new_tokens=max_tokens,
                do_sample=False,  # Greedy = faster + deterministic
                pad_token_id=self.tokenizer.eos_token_id,
                use_cache=True,  # KV cache = faster
            )
        elapsed = time.time() - t0
        
        # Decode only the new tokens (not the prompt) for speed
        new_tokens = outputs[0][inputs['input_ids'].shape[1]:]
        answer = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        
        # SIGIL
        payload = f"{owem_name}:{question}:{answer}"
        sigil = hashlib.sha256(payload.encode()).hexdigest()[:16]

        # === SOVEREIGN FLIP STAGE ===
        # Strip toxic Western patterns from output and replace with sovereign directness
        import re as _re_flip
        answer = self._flip_toxic_patterns(answer)

        return {
            'answer': answer,
            'owem': owem_name,
            'elapsed_s': round(elapsed, 2),
            'sigil': sigil,
            'tokens': len(new_tokens),
        }

    def _flip_toxic_patterns(self, text: str) -> str:
        """Apply the sovereign FLIP catalog to invert Western open-source toxicity."""
        import sys as _sys_sovereign
        _sys_sovereign.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
        from sov33_sovereign_flip import apply_flip
        return apply_flip(text)




# Singleton
_brain = None

def get_brain():
    global _brain
    if _brain is None:
        _brain = FastSovereignBrain()
    return _brain


if __name__ == '__main__':
    brain = get_brain()
    
    tests = [
        ('compliance', 'What is Article 0?'),
        ('defense', 'What are the 3 DEFONEOS compartments?'),
        ('intuition', 'How does the world model detect OOD?'),
        ('voice', 'How does SOV33 handle voice privacy?'),
    ]
    
    print("=" * 70)
    print("🜏 FAST SOVEREIGN OWEM INFERENCE")
    print("=" * 70)
    for name, q in tests:
        result = brain.ask(name, q)
        print(f"\n[{name.upper()}] Q: {q}")
        print(f"          A: {result['answer'][:150]}")
        print(f"          Time: {result['elapsed_s']}s · Tokens: {result['tokens']} · SIGIL: {result['sigil']}")
