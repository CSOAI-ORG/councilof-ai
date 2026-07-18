"""
SIGIL benchmark — baselines + benchmarks with a REAL tokenizer (tiktoken).

Measures, on a corpus of realistic agent exchanges:
  • token count: verbose English baseline vs SIGIL (real BPE, not chars/4)
  • compression ratio + % tokens saved
  • determinism: encode->parse->encode == original (lossless, single parse)

Honest note on the tokenizer: we use tiktoken o200k_base (GPT-4o-class BPE).
Claude's tokenizer differs in absolute counts, but the RATIO between verbose
English and compact SIGIL is representative across modern BPE tokenizers.
"""

import sys

from . import encode, parse, gloss

try:
    import tiktoken
    _ENC = tiktoken.get_encoding("o200k_base")
    def ntok(s: str) -> int: return len(_ENC.encode(s))
    TOKENIZER = "tiktoken/o200k_base (real BPE)"
except Exception:  # pragma: no cover
    def ntok(s: str) -> int: return max(1, round(len(s) / 4))
    TOKENIZER = "chars/4 proxy (tiktoken unavailable)"


# (structured intent, verbose English an LLM would naturally emit)
CORPUS = [
    ({"op": "P", "id": "ad6d", "topic": "Prioritise Q3: apex-unblock vs TUI-distribution vs partnership", "options": ["A", "B", "C"]},
     'New council proposal ad6d: "Prioritise Q3: apex-unblock vs TUI-distribution vs partnership". The available options are A, B, and C.'),
    ({"op": "V", "agent": "jarvis", "prop": "ad6d", "choice": "APPROVE", "conf": "0.82"},
     "Agent jarvis votes to APPROVE proposal ad6d with a confidence of 0.82."),
    ({"op": "V", "agent": "sophie", "prop": "ad6d", "choice": "ABSTAIN", "conf": "0.41"},
     "Agent sophie votes to ABSTAIN on proposal ad6d with a confidence of 0.41."),
    ({"op": "V", "agent": "orion", "prop": "ad6d", "choice": "APPROVE", "conf": "0.77"},
     "Agent orion votes to APPROVE proposal ad6d with a confidence of 0.77."),
    ({"op": "C", "subject": "proposal-ad6d", "score": "0.91", "dims": ["attunement", "reciprocity", "non-maleficence"]},
     "Care assessment of proposal-ad6d scored 0.91 across the dimensions attunement, reciprocity, and non-maleficence."),
    ({"op": "M", "key": "decision/ad6d", "value": "council leans A (apex-unblock), care-aligned", "salience": "0.88"},
     'Store a memory under decision/ad6d with the value "council leans A (apex-unblock), care-aligned" at salience 0.88.'),
    ({"op": "Q", "pattern": "Q3 revenue prioritisation", "k": 5},
     'Retrieve the top 5 memories matching the pattern "Q3 revenue prioritisation".'),
    ({"op": "H", "frm": "orion", "to": "hourman", "task": "draft the apex-unblock execution plan"},
     "Hand off from orion to hourman the task: draft the apex-unblock execution plan."),
    ({"op": "S", "fields": {"consciousness": "0.525", "agents": "46", "care": "0.967", "khaldunian_warn": "false"}},
     "Current state: consciousness is 0.525, there are 46 active agents, care alignment is 0.967, and there is no Khaldunian warning."),
    ({"op": "A", "level": "info", "msg": "2/3 supermajority reached — proposal ad6d ADOPTED"},
     "Alert (info level): a two-thirds supermajority was reached, so proposal ad6d is ADOPTED."),
]


def run(verbose: bool = True) -> dict:
    sig_tok = eng_tok = 0
    lossless = True
    for intent, english in CORPUS:
        line = encode(intent)
        # determinism / lossless: round-trip must be identity
        if encode(parse(line)) != line:
            lossless = False
        st, et = ntok(line), ntok(english)
        sig_tok += st
        eng_tok += et
        if verbose:
            print(f"\n  SIGIL  ({st:>3}t)  {line}")
            print(f"  ENGL   ({et:>3}t)  {english}")
            print(f"  gloss          {gloss(line)}")

    ratio = eng_tok / sig_tok if sig_tok else 0
    saved = (1 - sig_tok / eng_tok) * 100 if eng_tok else 0
    result = {
        "tokenizer": TOKENIZER,
        "messages": len(CORPUS),
        "english_tokens": eng_tok,
        "sigil_tokens": sig_tok,
        "ratio": round(ratio, 2),
        "pct_saved": round(saved, 1),
        "lossless_roundtrip": lossless,
    }
    if verbose:
        print("\n" + "=" * 70)
        print(f"  tokenizer: {TOKENIZER}")
        print(f"  {len(CORPUS)} messages | English {eng_tok}t vs SIGIL {sig_tok}t "
              f"=> {ratio:.2f}x denser, {saved:.0f}% fewer tokens")
        print(f"  lossless round-trip (encode->parse->encode == original): {lossless}")
        print("=" * 70)
    return result


if __name__ == "__main__":
    run(verbose="--quiet" not in sys.argv)
