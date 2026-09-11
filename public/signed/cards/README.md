# `/signed/cards/` — historical shape-A measurement cards (August 2026 chain)

**These 335 cards are NOT leaves of the living `public-root/v1` tree, by design.**

- Format: `gspc.measurement-card` shape-A — `{body, id, pubkey, signature, prev}` chain,
  `ensure_ascii=True` preimage (rule printed inside every card).
- Verify standalone: [`/signed/HOW-TO-VERIFY.md`](../HOW-TO-VERIFY.md) — pin against
  `did:web:csoai.org#card-attestation-1` from `/.well-known/did.json` first; a card
  carrying its own key proves self-consistency only.
- The living root (`/root.json`, card-v0 grammar) is a **different object** with its own
  corpus at `/cards/<sha16>.json`. Do not mix the two — see
  `docs/CARD_V0_EVIDENCE_GRAMMAR_2026-09-01.md` ("Do not mix with historical GSPC shape-A
  measurement cards").
- `signed ≠ anchored`: these signatures predate the public-root pipeline. Their absence
  from `card_sha256[]` is a generation boundary, not a reconciliation leak. Any card that
  enters the living root arrives through the GHA publisher, signed under
  `#board-attestation-1`, with its own as_of.

Measurement, never certification. Verify free.
