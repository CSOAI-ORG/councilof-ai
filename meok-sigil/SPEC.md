# MEOK SIGIL — Specification v0.1

**SIGIL** = **S**overeign **I**nter-a**G**ent **I**nterchange **L**anguage.
A compact, deterministic, token-efficient protocol for AI agents to communicate, with a lossless human-readable translator and a signable audit digest.

> **What SIGIL is not:** it is *not* David Wynn Miller's "Quantum Grammar / Parse-Syntax," which is pseudo-legal and has no computational meaning. SIGIL is a real controlled DSL — rigid grammar, **one line → exactly one parse** — in the lineage of Lojban, Attempto Controlled English, and emergent agent-communication research (Gibberlink, Droidspeak).

---

## 1. Grammar

```
LINE    := OPCODE ("|" FIELD)*
OPCODE  := single character
FIELD   := text with no unescaped "|"
```

One line, pipe-delimited, opcode first. No nesting. Deterministic: a line parses exactly one way.

## 2. Field kinds

| kind | wire form | decodes to |
|------|-----------|-----------|
| `s` | text | string |
| `int` | `5` | integer |
| `float` | `0.82` | float |
| `list` | `A,B,C` | list |
| `choice` | `+` `-` `~` | `APPROVE` `REJECT` `ABSTAIN` |
| `kv*` | `k1:v1\|k2:v2` (trailing, variadic) | dict |

## 3. Core vocabulary (v0.1)

| op | name | shape | example |
|----|------|-------|---------|
| `P` | propose | `P\|id\|topic\|opts` | `P\|ad6d\|Prioritise Q3\|A,B,C` |
| `V` | vote | `V\|agent\|prop\|choice\|conf` | `V\|jarvis\|ad6d\|+\|0.82` |
| `M` | memory | `M\|key\|value\|salience` | `M\|decision/ad6d\|leans A\|0.88` |
| `Q` | query | `Q\|pattern\|k` | `Q\|revenue\|5` |
| `C` | care | `C\|subject\|score\|dims` | `C\|prop-ad6d\|0.91\|attunement,reciprocity` |
| `H` | handoff | `H\|from\|to\|task` | `H\|orion\|hourman\|draft plan` |
| `S` | state | `S\|k:v\|k:v…` | `S\|consciousness:0.525\|agents:46` |
| `A` | alert | `A\|level\|msg` | `A\|info\|supermajority reached` |

## 4. Three layers

1. **Machine** — `encode(dict) ⇄ parse(line)`. Lossless: `encode(parse(x)) == x`.
2. **Human** — `gloss(line) → English`. The translator. Always available, on demand.
3. **Audit** — `digest(line) → 16-char SHA-256`. Sign it with the MEOK attestation engine → tamper-evident, auditor-readable agent transcript.

## 5. Emergence (extensibility)

Built-in and agent-invented opcodes share one code path (the **registry**). An agent calls `register(OpSpec(...))` to mint a new opcode at runtime; it is immediately encodable, parseable, and **auto-glossed** to English. `export_registry()` / `import_registry()` persist an evolved language across sessions. This is how SOV3 "uses its own language" while staying legible.

## 6. Why it matters (the business edge)

Emergent agent protocols (Gibberlink, Droidspeak) make AI comms *faster* but *opaque* — which regulators reject. SIGIL is fast **and** human-readable **and** signable. That maps directly to:
- **EU AI Act Art 12** (record-keeping / automatic logs)
- **EU AI Act Art 14** (human oversight)

→ **"verifiable agent communication"**: a tamper-evident, auditor-readable record of *how* a multi-agent system reached a decision. No competitor pairs a fast agent protocol with a signed, human-readable transcript.

## 7. Benchmark (real tokenizer)

`python3 -m sigil.benchmark` measures verbose English vs SIGIL on a realistic SOV3 council corpus using tiktoken (o200k_base BPE). Representative result: **~1.9× denser, ~48% fewer tokens, 100% lossless round-trip.** (Absolute counts vary by model; the ratio holds across modern BPE tokenizers.)

## 8. CLI

```
sigil gloss   'V|jarvis|ad6d|+|0.82'   # → "Agent jarvis votes APPROVE on proposal ad6d (confidence 0.82)."
sigil parse   'V|jarvis|ad6d|+|0.82'   # → JSON
sigil digest  'V|jarvis|ad6d|+|0.82'   # → 8cc4a6002bb8201a
sigil manifest                          # → the current language
sigil bench                             # → token benchmark
```

---

© 2026 MEOK AI LTD (CSOAI). Reference implementation MIT. Spec CC BY 4.0.
