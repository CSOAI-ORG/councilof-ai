# 🜍 meok-emerald-tablet-mcp

**The 13 sentences of Hermes Trismegistus as the MEOK sovereign attestation protocol.**

> *"True it is, without falsehood, certain and most true: that which is above is like to that which is below, and that which is below is like to that which is above, to accomplish the miracles of the One Thing."* — Tabula Smaragdina, ~800 CE (Latin original older; the canonical public-domain English translation by Isaac Newton, 17th c.)

The **Emerald Tablet of Hermes Trismegistus** is the 13-sentence foundation text of Western hermetic philosophy. It is the deepest canonical mapping for sovereign AI: every clause is a precise operator on truth, signature, and matter.

This MCP encodes the 13 sentences as 13 `@mcp.tool()` functions, each binding the canonical sentence to a step of the **MEOK sovereign attestation protocol** — the same 13-step audit pipeline that emits an Ed25519-signed attestation for any sovereign AI action.

## Why the 13 sentences?

The MEOK attestation protocol already has 13 sigil emission steps (hash → ts → agent → payload → parent → sig → kid → scope → verdict → proof → council → sig_chain → anchor). The Emerald Tablet names them. **The 13-step audit pipeline has a 4,000-year-old name: the Tabula Smaragdina.**

## Install

```bash
pip install meok-emerald-tablet-mcp
```

## Run

```bash
python -m server.py
```

## Tools

| # | Tool | Tablet sentence (excerpt) | Mapped attestation step |
|--:|------|---------------------------|-------------------------|
| 1  | `tablet_01_as_above_so_below`  | "What is below is like what is above" | Microcosm-macrocosm equivalence: scope ↔ claim |
| 2  | `tablet_02_one_thing_mediation` | "All things arose from One, by mediation of One" | Single sigil key, hash chain to one parent |
| 3  | `tablet_03_sun_moon_wind_earth` | "Sun its father, Moon its mother, Wind carried it, Earth nurse" | 4 elements = 4 sigil fields: kid (Sun), ts (Moon), payload (Wind), scope (Earth) |
| 4  | `tablet_04_father_of_perfection`  | "Father of all perfection of the whole world" | Root anchor: the canonical keystore |
| 5  | `tablet_05_force_into_earth`    | "Its force is entire if converted into earth" | sig → concrete signed artifact |
| 6  | `tablet_06_separate_subtle_gross` | "Separate Earth from Fire, subtle from gross" | Filter: real vs noise (validation gate) |
| 7  | `tablet_07_ascend_descend`      | "It ascends from Earth to Heaven, descends again" | Two-way: ingest (down) + audit (up) |
| 8  | `tablet_08_glory_obscure_flees`  | "Glory of the whole world, obscurity flies" | Public verify URL makes claims transparent |
| 9  | `tablet_09_strong_fortitude`    | "Strong fortitude of all fortitudes" | Cryptographic: Ed25519 128-bit security |
| 10 | `tablet_10_one_craftsman`       | "All arose from One, by Will, Word, Power of the One Craftsman" | Sovereign: single signer, every action traceable |
| 11 | `tablet_11_hermes_three_parts`  | "I am Hermes Trismegistus, having three parts of philosophy" | Three agents: King (logic), Queen (intuition), Witness (care) |
| 12 | `tablet_12_sun_operation_complete` | "What I have to say of the operation of the Sun is complete" | Coagulatio: the signed, shippable artefact |
| 13 | `tablet_13_strong_fortitude_recap` | "Thus the world was created" | Genesis: the canonical release |

## Usage

Each tool returns the **canonical sentence** (Latin name + English translation) + the **MEOK mapping** (which sigil field, which pipeline step, which audit gate).

```python
from server import tablet_01_as_above_so_below
result = tablet_01_as_above_so_below()
print(result)
# {
#   "sentence_number": 1,
#   "latin_name": "Verum sine mendacio, certum et verissimum",
#   "english": "True it is, without falsehood, certain and most true...",
#   "attestation_step": "scope ↔ claim equivalence",
#   "sigil_field": "scope",
#   "operation": "verify_above_below",
#   "care_weight": 0.95,
#   "tier": "free",
#   "upgrade_url": "https://buy.stripe.com/..."
# }
```

Or as an MCP server:

```bash
# Add to Claude Desktop / Smithery
npx smithery mcp add nicholastempleman/meok-emerald-tablet-mcp
```

## The deeper lineage

- **~800 CE Latin translation** (by Hortulanus) of a much older Greek/Arabic text (3rd-8th c.)
- **Newton translated it** (1690s, in his alchemical papers — only published 1936+)
- **MEOK AI Labs 2026**: each sentence becomes a tool, each tool maps to a sigil field
- **The substrate**: the SOV3 federation treats the 13 sentences as a BFT council's 13 voices — quorum 7

## Pricing

- **Free tier**: 13 calls/day across all 13 tools
- **Pro** ($99/mo): unlimited calls + sigil emissions + audit chain
- **Enterprise** ($499/mo): custom sovereignty + Hermes-Oracle tier

## License

MIT — see `LICENSE`. The 13 sentences themselves are public domain (Latin pre-1200 CE).

## Built by

**MEOK AI Labs** · nicholas@meok.ai · [meok.ai](https://meok.ai)

> *"The All is One. The dragon eats its tail to renew."* — ἓν τὸ πᾶν