"""MEOK ONE — SBT bridge (off-chain intent builder, stdlib only, ZERO network).

The honest scaffold for "own your AI forever" as a soulbound token on Solana.

WHAT THIS IS  ·  Given a character + an owner wallet, this builds the EXACT mint payload
                 ("intent") the soulbound-token program expects — token id, type, charter
                 reference, metadata, and the PDA seeds. It is consumed by the authorized
                 signer (solana-sbt/client/sbt_client.ts) to actually mint.

WHAT THIS IS NOT  ·  It does NOT sign, send, fund, create wallets, or touch a chain. No
                     private keys, no solana libs, no money movement. Going live is a
                     human-authorized step (see MEOK_SBT_RUNBOOK.md). Until then every
                     intent is returned with status="intent" and minted=False.

The on-chain program (solana-sbt/src/lib.rs, native solana-program 2.0, soulbound by
design — there is no transfer instruction) defines 5 SBT types mapped to Charter Articles.
A hatched/owned character mints a CharacterGenesis SBT (Article 6 — Material Covenant Bond).
"""
import os
import hashlib

# Public program id (from solana-sbt/client/sbt_client.ts — a placeholder until Nick deploys).
PROGRAM_ID = os.environ.get("MEOK_SBT_PROGRAM_ID", "Dyd7JtmmuA3RZZupk98mqRQ8uySZV9FwTE6aNYmxPxpo")

# SBT type enum — MUST match solana-sbt/src/lib.rs `enum SbtType` ordering.
SBT_TYPES = {
    "AgentIdentity": 0,        # Charter Art. 2  — Safety Case
    "SafetyCertification": 1,  # Charter Art. 10.2 — Risk-Based Licensing
    "VerifierReputation": 2,   # Charter Art. 11 — Byzantine Council Review
    "CharacterGenesis": 3,     # Charter Art. 6  — Material Covenant Bond  (← own-your-AI)
    "EnterpriseTrust": 4,      # Charter Art. 8  — Prosperity Fund
}
CHARTER_REF = {
    "AgentIdentity": "2", "SafetyCertification": "10.2", "VerifierReputation": "11",
    "CharacterGenesis": "6", "EnterpriseTrust": "8",
}


def network() -> str:
    """Target cluster — devnet until Nick authorizes mainnet."""
    return os.environ.get("MEOK_SBT_NETWORK", "devnet")


def is_live() -> bool:
    """On-chain minting is OFF until explicitly authorized (env MEOK_SBT_LIVE=1)."""
    return os.environ.get("MEOK_SBT_LIVE", "").lower() in ("1", "true", "yes")


def genesis_token_id(char_id: str) -> int:
    """Deterministic u64 token id from a character id — same character → same SBT id."""
    h = hashlib.sha256(f"genesis:{char_id}".encode()).hexdigest()
    return int(h[:16], 16)  # fits u64


def status() -> dict:
    """The honest on-chain posture (no secrets, no network calls)."""
    return {
        "program_id": PROGRAM_ID,
        "network": network(),
        "live": is_live(),
        "standard": "soulbound (non-transferable) — native Solana program, 5 Charter-mapped types",
        "ownership_today": "per-user roster (yours across devices via SOV3) — off-chain, live now",
        "boundary": ("meok-one builds mint INTENTS only; it never signs, sends, funds, or holds "
                     "keys. Minting is a human-authorized step — see MEOK_SBT_RUNBOOK.md."),
        "source": "solana-sbt/ (program + client + tests)",
    }


def mint_intent(character: dict, owner_pubkey: str = None) -> dict:
    """Build the CharacterGenesis SBT mint intent for a character.

    Returns the full payload a signer needs — but does NOT mint. `minted` is always False
    here; `status` is "live-ready" only when is_live() AND an owner wallet is supplied (the
    actual signed tx is still the authorized signer's job).
    """
    cid = str(character.get("id") or character.get("name") or "unknown")
    sbt_type = "CharacterGenesis"
    token_id = genesis_token_id(cid)
    meta = {
        "name": character.get("name"),
        "archetype": character.get("archetype"),
        "care_style": character.get("care_style"),
        "emoji": character.get("emoji") or (character.get("visual") or {}).get("emoji"),
        "tagline": character.get("tagline"),
        "kind": "MEOK character — hatched & owned",
    }
    # PDA seeds exactly as the program derives them: ["sbt", owner, [type], token_id_le]
    pda_seeds = ["sbt", owner_pubkey or "<owner_wallet>", [SBT_TYPES[sbt_type]],
                 f"{token_id}.to_le_bytes()"]
    ready = bool(is_live() and owner_pubkey)
    return {
        "intent": "mint",
        "minted": False,                       # never true here — this module does not mint
        "status": "live-ready" if ready else "intent",
        "program_id": PROGRAM_ID,
        "network": network(),
        "sbt_type": sbt_type,
        "sbt_type_index": SBT_TYPES[sbt_type],
        "token_id": token_id,
        "charter_reference": CHARTER_REF[sbt_type],
        "owner": owner_pubkey,                  # the wallet the SBT binds to (soulbound)
        "expires_at": 0,                        # never expires
        "metadata": meta,                       # → metadata_uri (IPFS/Arweave) at mint time
        "pda_seeds": pda_seeds,
        "next_step": ("hand this intent to solana-sbt/client/sbt_client.ts run by the authorized "
                      "issuer to sign+send — meok-one will not."),
        "boundary": "NOT minted. No keys, no network, no funds touched by meok-one.",
    }


if __name__ == "__main__":
    import json
    print(json.dumps(status(), indent=2))
    demo = {"id": "gen_demo123", "name": "Nimbus", "archetype": "explorer",
            "care_style": "gentle", "emoji": "🔭", "tagline": "your curious companion"}
    print(json.dumps(mint_intent(demo, owner_pubkey=None), indent=2))
