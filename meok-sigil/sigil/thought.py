"""
MEOK ONE — the Thought bus: one canonical thought, many representations.
=======================================================================
A Thought is ONE structured intent (the same dict SIGIL encodes). It can be
PROJECTED into many forms and, where lossless, LIFTED back. This is the substrate
that lets SOV3 "think in all ways" — symbolic, human, latent, visual, audit —
without ever losing the canonical truth.

Representations (and honest reversibility):
  • sigil    compact line          CANONICAL  (sigil <-> intent is lossless)
  • text     English (gloss)        one-way    (human view; text->thought not guaranteed)
  • latent   numeric vector         one-way    (for neural nets; see honesty note)
  • visual   Mermaid diagram        one-way    (render a thought / a whole stream)
  • audit    signed digest          one-way    (tamper-evident; sign with attestation)

SIGIL is the lossless SPINE. Every other view is a projection off it, so the
canonical thought is never ambiguous — exactly what an auditable system needs.

HONESTY NOTE on `latent`: the built-in embedder is a DETERMINISTIC STRUCTURAL
hash-embedding (the "hashing trick" / feature hashing) — real and reproducible,
but NOT semantic. Pass embedder=<fn> (e.g. an Ollama / sentence-transformers call)
for a true semantic vector. The interface is the point; the default is a stand-in
that never pretends to be more than it is.
"""

import hashlib
import math
import re

from . import encode, parse, gloss, digest


def _safe(label: str, n: int = 42) -> str:
    """Sanitize a label for a Mermaid node (no quotes/pipes/newlines)."""
    s = label.replace('"', "'").replace("|", "/").replace("\n", " ").strip()
    return (s[:n] + "…") if len(s) > n else s


class Thought:
    """One canonical thought, projectable into any representation."""

    def __init__(self, intent: dict):
        self.intent = dict(intent)

    # ---- constructors ----
    @classmethod
    def from_sigil(cls, line: str) -> "Thought":
        return cls(parse(line))

    @classmethod
    def from_intent(cls, d: dict) -> "Thought":
        return cls(d)

    # ---- projections ----
    def to_sigil(self) -> str:
        """Canonical lossless form."""
        return encode(self.intent)

    def to_text(self) -> str:
        """Human-readable English (the translator)."""
        return gloss(self.to_sigil())

    def to_audit(self) -> str:
        """Stable digest — sign with the MEOK attestation engine."""
        return digest(self.to_sigil())

    def to_latent(self, dim: int = 32, embedder=None):
        """Numeric vector for neural nets. Default = deterministic structural
        hash-embedding (NOT semantic). Pass embedder(text)->list[float] for real."""
        if embedder is not None:
            return embedder(self.to_text())
        vec = [0.0] * dim
        for tok in re.findall(r"\w+", self.to_text().lower()):
            h = int(hashlib.sha1(tok.encode()).hexdigest(), 16)
            vec[h % dim] += 1.0 if (h >> 8) & 1 else -1.0
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [round(x / norm, 4) for x in vec]

    def to_mermaid_node(self, nid: str) -> str:
        """One Mermaid node for this thought."""
        op = self.intent["op"]
        return f'{nid}["{_safe(self.to_text())}"]'

    def __repr__(self):
        return f"Thought({self.to_sigil()!r})"


class ThoughtStream:
    """An ordered set of thoughts (e.g. a council exchange) renderable as text,
    a visual graph, a latent matrix, or a tamper-evident audit chain."""

    def __init__(self):
        self.thoughts = []

    def add_sigil(self, line: str) -> "ThoughtStream":
        self.thoughts.append(Thought.from_sigil(line))
        return self

    def add(self, t: Thought) -> "ThoughtStream":
        self.thoughts.append(t)
        return self

    # ---- text view ----
    def to_text(self) -> str:
        return "\n".join(t.to_text() for t in self.thoughts)

    # ---- latent view (for neural nets) ----
    def to_latent_matrix(self, dim: int = 32, embedder=None):
        return [t.to_latent(dim, embedder) for t in self.thoughts]

    # ---- audit view: chained digests = tamper-evident sequence ----
    def audit_chain(self):
        chain, prev = [], ""
        for t in self.thoughts:
            link = hashlib.sha256((prev + t.to_audit()).encode()).hexdigest()[:16]
            chain.append({"sigil": t.to_sigil(), "digest": t.to_audit(), "chain": link})
            prev = link
        return chain

    # ---- visual view: a Mermaid flowchart of the deliberation ----
    def to_mermaid(self) -> str:
        """Render the exchange as a graph: a proposal anchors votes/care/decisions.
        Deterministic, dependency-free, renders in any Mermaid viewer."""
        lines = ["flowchart TD"]
        prop_id = None
        for i, t in enumerate(self.thoughts):
            nid = f"n{i}"
            op = t.intent["op"]
            shape_open, shape_close = "[", "]"          # default rectangle
            if op == "P":
                shape_open, shape_close = "([", "])"     # stadium = proposal anchor
                prop_id = nid
            elif op == "V":
                ch = t.intent.get("choice", "")
                shape_open, shape_close = ("{{", "}}") if ch == "ABSTAIN" else ("[", "]")
            elif op == "A":
                shape_open, shape_close = ">", "]"        # flag = outcome/alert
            lines.append(f'    {nid}{shape_open}"{_safe(t.to_text())}"{shape_close}')
            # link votes / care / memory / alert back to the proposal they concern
            if prop_id and nid != prop_id and op in ("V", "C", "M", "A"):
                edge = "-.->" if op == "M" else "-->"
                lines.append(f"    {prop_id} {edge} {nid}")
        return "\n".join(lines)


# ---- demo ------------------------------------------------------------------

if __name__ == "__main__":
    COUNCIL = [
        "P|ad6d|Prioritise Q3: apex-unblock vs TUI vs partnership|A,B,C",
        "V|jarvis|ad6d|+|0.82",
        "V|sophie|ad6d|~|0.41",
        "V|orion|ad6d|+|0.77",
        "C|prop-ad6d|0.91|attunement,reciprocity,non-maleficence",
        "M|decision/ad6d|council leans A, care-aligned|0.88",
        "A|info|2/3 supermajority — ad6d ADOPTED",
    ]
    stream = ThoughtStream()
    for line in COUNCIL:
        stream.add_sigil(line)

    print("=" * 72)
    print("MEOK ONE — one thought, every representation")
    print("=" * 72)

    t = Thought.from_sigil("V|jarvis|ad6d|+|0.82")
    print("\nA single thought, five ways:")
    print(f"  sigil   {t.to_sigil()}")
    print(f"  text    {t.to_text()}")
    print(f"  audit   {t.to_audit()}")
    lat = t.to_latent(dim=8)
    print(f"  latent  {lat}  (dim=8, structural hash-embedding)")
    print(f"  visual  {t.to_mermaid_node('n0')}")

    print("\n--- the whole council exchange as a VISUAL graph (Mermaid) ---")
    print(stream.to_mermaid())

    print("\n--- as a tamper-evident AUDIT CHAIN ---")
    for link in stream.audit_chain():
        print(f"  {link['chain']}  <-  {link['sigil']}")

    print("\n--- as a LATENT MATRIX for neural nets ---")
    mat = stream.to_latent_matrix(dim=8)
    print(f"  {len(mat)} thoughts x {len(mat[0])} dims  (feed to an NN / clustering / similarity)")
    print(f"  thought[1] = {mat[1]}")
    print("\none canonical thought · five representations · all lossless-or-honest ✓")
