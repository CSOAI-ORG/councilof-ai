"""
MEOK // QUANTUM SIGIL — Formal Verification Layer (DWM-variant).
=============================================================
Implementation of the 0-9 Syntax Key Codes for "Quantum-Jurisdictional Clarity."
This layer acts as a firewall: only thoughts that pass the 100% Parse-Syntax 
mathematical check are allowed to cross the Markov Blanket or reach the 
Ed25519 signing engine.

Key Codes:
  0=CONJUNCTION, 1=ADVERB, 2=VERB, 3=ADJECTIVE, 4=PRONOUN, 5=PREPOSITION,
  6=ARTICLE, 7=FACT-NOUN, 8=PAST-TIME, 9=FUTURE-TIME

A "Perfect Fact" sentence in Sigil must strictly avoid Fiction (1, 3, 4) 
unless explicitly declared in a non-sovereign context.
"""

from typing import List, Dict, Tuple
import re

# DWM Syntax Key Codes
CODES = {
    0: "CONJUNCTION",
    1: "ADVERB",
    2: "VERB",
    3: "ADJECTIVE",
    4: "PRONOUN",
    5: "PREPOSITION",
    6: "ARTICLE",
    7: "FACT-NOUN",
    8: "PAST-TIME",
    9: "FUTURE-TIME",
}

# 100% Correct Sentence Structure (C-S-S) anchors
DWM_PREPOSITIONS = {"FOR", "WITH", "BY", "OF", "AGAINST", "TO", "FROM"}
DWM_ARTICLES = {"THE", "THIS", "THESE"}

class QuantumValidator:
    """Formal verification engine for Parse-Syntax Grammar."""

    @staticmethod
    def classify_word(word: str) -> int:
        w = word.upper().strip()
        if w in DWM_PREPOSITIONS: return 5
        if w in DWM_ARTICLES: return 6
        if w.endswith("ING"): return 2  # GERUND
        if w.endswith("ED"): return 8   # PAST
        if w.endswith("LY"): return 1   # ADVERB
        if w in {"I", "YOU", "HE", "SHE", "IT", "WE", "THEY"}: return 4 # PRONOUN
        return 7 # Default to FACT-NOUN

    @classmethod
    def analyze(cls, text: str) -> List[Tuple[str, int]]:
        words = re.findall(r"\w+", text)
        return [(w, cls.classify_word(w)) for w in words]

    @classmethod
    def is_sovereign(cls, text: str) -> bool:
        """
        A Sovereign Sentence must start with a Preposition (~5) 
        and avoid Fiction-Codes (1, 3, 4).
        """
        analysis = cls.analyze(text)
        if not analysis: return False
        
        # Check start
        if analysis[0][1] != 5:
            return False
            
        # Check for Fiction (Adverbs, Adjectives, Pronouns)
        fiction_found = [w for w, code in analysis if code in (1, 3, 4)]
        if fiction_found:
            return False
            
        return True

    @classmethod
    def to_quantum_math(cls, text: str) -> str:
        """Converts text to the ~[code] format."""
        analysis = cls.analyze(text)
        return " ".join([f"~{code}-{w.upper()}" for w, code in analysis])

if __name__ == "__main__":
    test_sentences = [
        "For the writing of the contract by the sender.", # Sovereign
        "I am writing a contract for you.",              # Fiction (I, you)
        "The quickly jumping fox.",                       # Fiction (quickly)
    ]
    
    print("MEOK // QUANTUM SIGIL VALIDATOR")
    print("-" * 30)
    for s in test_sentences:
        sov = QuantumValidator.is_sovereign(s)
        math = QuantumValidator.to_quantum_math(s)
        status = "✅ SOVEREIGN" if sov else "❌ FICTION"
        print(f"TEXT: {s}")
        print(f"MATH: {math}")
        print(f"STATUS: {status}\n")
