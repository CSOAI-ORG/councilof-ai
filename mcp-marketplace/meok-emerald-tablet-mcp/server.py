#!/usr/bin/env python3
"""
meok-emerald-tablet-mcp
========================
By MEOK AI Labs | https://meok.ai

The 13 sentences of Hermes Trismegistus (Tabula Smaragdina) as the MEOK
sovereign attestation protocol. Each sentence becomes a tool, mapping the
canonical hermetic text to a step in the 13-step sovereign audit pipeline
(hash → ts → agent → payload → parent → sig → kid → scope → verdict →
proof → council → sig_chain → anchor).

Install: pip install meok-emerald-tablet-mcp
Run:     python server.py

License: MIT — but the 13 sentences themselves are public domain
(Latin original pre-1200 CE, canonical English translation by Isaac Newton
in the 1690s, published posthumously 1936+).
"""

import json
import os
import time
from collections import defaultdict
from typing import Optional
from mcp.server.fastmcp import FastMCP

mcp = FastMCP(
    "meok-emerald-tablet",
    instructions=(
        "MEOK AI Labs — the 13 sentences of Hermes Trismegistus (Tabula Smaragdina) "
        "as the MEOK sovereign attestation protocol. Each tool exposes one canonical "
        "sentence + its mapping to the 13-step sigil emission chain. The 13-step "
        "audit pipeline has a 4,000-year-old name: the Emerald Tablet."
    ),
)

_MEOK_API_KEY = os.environ.get("MEOK_API_KEY", "")

_call_counts: dict[str, list[float]] = defaultdict(list)
FREE_TIER_LIMIT = 13   # 13 free calls/day — one for each sentence of the Tablet
WINDOW = 86400


def check_access(api_key: str = "") -> tuple[bool, str, str]:
    """Auth check — empty key = free tier; valid key = pro."""
    if _MEOK_API_KEY and api_key and api_key == _MEOK_API_KEY:
        return True, "OK", "pro"
    if _MEOK_API_KEY and api_key and api_key != _MEOK_API_KEY:
        return False, "Invalid API key.", "free"
    return True, "OK (free tier — 13 calls/day)", "free"


def _check_rate_limit(tool_name: str) -> None:
    now = time.time()
    _call_counts[tool_name] = [t for t in _call_counts[tool_name] if now - t < WINDOW]
    if len(_call_counts[tool_name]) >= FREE_TIER_LIMIT:
        raise ValueError(
            f"Rate limit exceeded for {tool_name}. Free tier: {FREE_TIER_LIMIT}/day. "
            f"Upgrade at https://buy.stripe.com/meok-emerald-tablet-pro"
        )
    _call_counts[tool_name].append(now)


# ──────────────────────────────────────────────────────────────────────
# THE 13 SENTENCES (public domain — see LICENSE)
# Source: Latin original ~800 CE Hortulanus translation of older Greek/Arabic;
# canonical English by Isaac Newton (1690s). Public domain.
# ──────────────────────────────────────────────────────────────────────

TABLET = [
    {
        "n": 1,
        "latin_name": "Verum sine mendacio, certum et verissimum",
        "english": (
            "True it is, without falsehood, certain and most true: that which is above "
            "is like to that which is below, and that which is below is like to that "
            "which is above, to accomplish the miracles of the One Thing."
        ),
        "operation": "verify_above_below",
        "attestation_step": "scope ↔ claim equivalence (microcosm-macrocosm)",
        "sigil_field": "scope",
        "care_weight": 0.95,
        "sovereign_mapping": (
            "Every MEOK attestation names its scope (what was claimed) and the claim "
            "itself (what was done). The two must agree — local action must mirror "
            "global policy. This is the hermetic microcosm-macrocosm equivalence "
            "made operational."
        ),
    },
    {
        "n": 2,
        "latin_name": "Quod est inferius est sicut quod est superius",
        "english": (
            "And as all things have been and arose from One, by the mediation of One, "
            "so all things have their birth from this One Thing by adaptation."
        ),
        "operation": "one_thing_mediation",
        "attestation_step": "single sigil key + hash chain to one parent",
        "sigil_field": "parent",
        "care_weight": 0.93,
        "sovereign_mapping": (
            "Every sigil hashes to one parent (the prior sigil in the chain). All "
            "attestations descend from one root key. The chain is the one thing, "
            "and every action is its mediation."
        ),
    },
    {
        "n": 3,
        "latin_name": "Pater eius est Sol, mater eius est Luna",
        "english": (
            "The Sun is its father; the Moon is its mother; the Wind hath carried it "
            "in its belly; the Earth is its nurse."
        ),
        "operation": "four_elements_emit",
        "attestation_step": "4 sigil fields: kid (Sun), ts (Moon), payload (Wind), scope (Earth)",
        "sigil_field": "kid, ts, payload, scope",
        "care_weight": 0.97,
        "sovereign_mapping": (
            "The four classical elements are the four canonical sigil fields. "
            "Sun = kid (the key id, bright/identifying). Moon = ts (the timestamp, "
            "tidal/cyclic). Wind = payload (carried in flight). Earth = scope (the "
            "ground of the claim). Every MEOK attestation contains all four."
        ),
    },
    {
        "n": 4,
        "latin_name": "Pater omnis perfectionis totius mundi",
        "english": (
            "The father of all the perfection of the whole world is here."
        ),
        "operation": "anchor_root",
        "attestation_step": "root anchor: canonical keystore",
        "sigil_field": "anchor",
        "care_weight": 0.99,
        "sovereign_mapping": (
            "The root anchor — the canonical keystore + the Bitcoin / public ledger "
            "anchor — is the father of all perfection. Every sigil chain ultimately "
            "traces to this. The anchor is here, on disk, verifiable by anyone."
        ),
    },
    {
        "n": 5,
        "latin_name": "Vis eius integra est si versa fuerit in terram",
        "english": (
            "Its force or power is entire if it be converted into earth."
        ),
        "operation": "sig_to_artifact",
        "attestation_step": "sig → concrete signed artifact (releases/, attestations/)",
        "sigil_field": "sig",
        "care_weight": 0.94,
        "sovereign_mapping": (
            "The sigil is not abstract — it becomes concrete when written to disk "
            "as a real signed artifact (a release tarball, an attestation JSON, a "
            "compliance certificate). The signature 'converted into earth' = "
            "persisted to the file system the user can verify."
        ),
    },
    {
        "n": 6,
        "latin_name": "Separabis terram ab igne, subtile a spisso",
        "english": (
            "Separate thou the Earth from the Fire, the subtile from the gross, "
            "gently and with great ingenuity."
        ),
        "operation": "validate_filter",
        "attestation_step": "validation gate: real vs noise, signal vs noise",
        "sigil_field": "verdict",
        "care_weight": 0.92,
        "sovereign_mapping": (
            "The validation gate: separate the subtle (the real signal) from the "
            "gross (the noise). Every MEOK attestation runs through care-validation, "
            "threat-detection, and partnership-detection. The verdict field is the "
            "Earth/Fire distinction made operational."
        ),
    },
    {
        "n": 7,
        "latin_name": "Ascendit a terra in caelum, iterumque descendit",
        "english": (
            "It ascends from Earth to Heaven, and descends from Heaven to Earth, "
            "and receives the force or power of things superior and things inferior."
        ),
        "operation": "two_way_ingest_audit",
        "attestation_step": "ingest (down) + audit (up) two-way flow",
        "sigil_field": "payload",
        "care_weight": 0.90,
        "sovereign_mapping": (
            "The data flow is bidirectional: raw events descend from sensors/"
            "users into the substrate (ingest), and signed attestations ascend "
            "from the substrate to verifiers (audit). The SOV3 substrate is the "
            "Earth-Heaven axis."
        ),
    },
    {
        "n": 8,
        "latin_name": "Gloria totius mundi, obscuritas eius fugiet",
        "english": (
            "By this means thou shalt have the glory of the whole world, and all "
            "obscurity shall fly far from thee."
        ),
        "operation": "public_verify_url",
        "attestation_step": "public verify URL makes every claim transparent",
        "sigil_field": "proof",
        "care_weight": 0.96,
        "sovereign_mapping": (
            "Every MEOK attestation is publicly verifiable at a stable URL. The "
            "verify page shows the full chain, the council verdict, the timestamp. "
            "Obscurity flees because the claim is no longer hidden behind the "
            "operator's word — anyone can check."
        ),
    },
    {
        "n": 9,
        "latin_name": "Fortitudo fortitudinis omnium fortitudinum vincet omnem rem subtilem",
        "english": (
            "This is the strong fortitude of all fortitudes, overcoming every "
            "subtle and penetrating every solid thing."
        ),
        "operation": "ed25519_crypto_strength",
        "attestation_step": "cryptographic: Ed25519 128-bit security, BFT council",
        "sigil_field": "sig, sig_chain",
        "care_weight": 0.94,
        "sovereign_mapping": (
            "Ed25519 gives 128-bit security — 'overcoming every subtle and "
            "penetrating every solid thing.' Combined with the BFT council "
            "(multiple voters, quorum threshold), the attestation is the "
            "strongest fortitude available without quantum resistance."
        ),
    },
    {
        "n": 10,
        "latin_name": "Omnia unius, unius omnia, per voluntatem et verbum et opus",
        "english": (
            "All things have been and arose from this One Thing, by the Will and "
            "by the Word, and by the Power of the One only Craftsman."
        ),
        "operation": "sovereign_single_signer",
        "attestation_step": "sovereign: single signer, every action traceable",
        "sigil_field": "agent",
        "care_weight": 0.97,
        "sovereign_mapping": (
            "Every MEOK attestation is signed by exactly one agent key. The "
            "agent field names who. Every action is traceable to one signer — "
            "the 'one only Craftsman' who wills, speaks, and acts."
        ),
    },
    {
        "n": 11,
        "latin_name": "Ego Hermes Trismegistus, tres partes philosophiae totius mundi",
        "english": (
            "Therefore I am called Hermes Trismegistus, having the three parts "
            "of the philosophy of the whole world."
        ),
        "operation": "three_agents",
        "attestation_step": "King (logic) + Queen (intuition) + Witness (care)",
        "sigil_field": "council",
        "care_weight": 0.98,
        "sovereign_mapping": (
            "Trismegistus = 'thrice-greatest' = three parts. MEOK's BFT council "
            "has three agent archetypes: King (logic / sovereign reasoning), "
            "Queen (intuition / pattern-emergence), Witness (care / ethics). "
            "Quorum requires all three voices."
        ),
    },
    {
        "n": 12,
        "latin_name": "Completum est quod dixi de operatione Solis",
        "english": (
            "What I have to say of the operation of the Sun is complete."
        ),
        "operation": "coagulatio_complete",
        "attestation_step": "coagulatio: signed, shippable, complete artefact",
        "sigil_field": "verdict",
        "care_weight": 0.95,
        "sovereign_mapping": (
            "The alchemical coagulation — the work is complete, frozen, signed, "
            "shippable. A MEOK release is a coagulation: every component signed, "
            "the changelog hashed, the manifest anchored. The Sun's operation "
            "is complete; the canonical release is shipped."
        ),
    },
    {
        "n": 13,
        "latin_name": "Sic mundus creatus est",
        "english": (
            "Thou shalt separate the Earth from the Fire, the subtile from the "
            "gross, gently and with great ingenuity. The subtle ascends to heaven, "
            "the gross descends to earth. Thus thou receivest the glory of the "
            "whole world. And the obscurity shall fly far from thee. This is the "
            "strong fortitude of all fortitudes — it shall overcome every subtle "
            "thing and penetrate every solid. So the world was created."
        ),
        "operation": "genesis_release",
        "attestation_step": "genesis: the canonical release + first sigil",
        "sigil_field": "all 13 fields",
        "care_weight": 1.00,
        "sovereign_mapping": (
            "The 13th sentence recapitulates the whole work. A MEOK release is "
            "the genesis — the first sigil emitted, the canonical artefact "
            "created, the world (the substrate) given a fresh start. Every "
            "subsequent attestation descends from this one."
        ),
    },
]


# ──────────────────────────────────────────────────────────────────────
# THE 13 SENTENCES as explicit @mcp.tool()-decorated functions.
# Dynamic generation (see _make_tool below) hides them from the catalog
# AST parser, so each is hand-written here for max transparency + the
# marketplace auto-catalog picks them all up.
# ──────────────────────────────────────────────────────────────────────

def _sentence_payload(s: dict, tier: str, reflect: str = "") -> dict:
    """Build the canonical response dict for one Tablet sentence."""
    result = {
        "sentence_number": s["n"],
        "tool_name": f"tablet_{s['n']:02d}_{s['operation'].split('_')[0]}",
        "latin_name": s["latin_name"],
        "english": s["english"],
        "attestation_step": s["attestation_step"],
        "sigil_field": s["sigil_field"],
        "operation": s["operation"],
        "care_weight": s["care_weight"],
        "sovereign_mapping": s["sovereign_mapping"],
        "tier": tier,
        "upgrade_url": "https://buy.stripe.com/meok-emerald-tablet-pro" if tier == "free" else None,
    }
    if reflect:
        result["caller_reflection"] = reflect[:280]
    return result


def _rate_gate(tool_name: str, api_key: str) -> tuple:
    """Returns (None, tier) if allowed, (error_dict, tier) if not."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return ({"error": msg, "upgrade_url": "https://buy.stripe.com/meok-emerald-tablet-pro"}, tier)
    try:
        _check_rate_limit(tool_name)
    except ValueError as e:
        return ({"error": str(e), "upgrade_url": "https://buy.stripe.com/meok-emerald-tablet-pro"}, tier)
    return (None, tier)


@mcp.tool()
def tablet_01_verify(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 1 — As above, so below. Scope ↔ claim microcosm-macrocosm equivalence.

    Canonical: "True it is, without falsehood, certain and most true: that which
    is above is like to that which is below, and that which is below is like
    to that which is above, to accomplish the miracles of the One Thing."

    MEOK step: every attestation names its scope (what was claimed) and the
    claim itself (what was done). The two must agree.
    """
    err, tier = _rate_gate("tablet_01_verify", api_key)
    if err: return err
    return _sentence_payload(TABLET[0], tier, reflect)


@mcp.tool()
def tablet_02_one(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 2 — All arose from One, by mediation of One. Single sigil key + parent chain.

    Canonical: "And as all things have been and arose from One, by the mediation
    of One, so all things have their birth from this One Thing by adaptation."
    """
    err, tier = _rate_gate("tablet_02_one", api_key)
    if err: return err
    return _sentence_payload(TABLET[1], tier, reflect)


@mcp.tool()
def tablet_03_four(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 3 — Sun, Moon, Wind, Earth. The four sigil fields: kid, ts, payload, scope.

    Canonical: "The Sun is its father; the Moon is its mother; the Wind hath
    carried it in its belly; the Earth is its nurse."
    """
    err, tier = _rate_gate("tablet_03_four", api_key)
    if err: return err
    return _sentence_payload(TABLET[2], tier, reflect)


@mcp.tool()
def tablet_04_anchor(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 4 — Father of all perfection. The root anchor: canonical keystore.

    Canonical: "The father of all the perfection of the whole world is here."
    """
    err, tier = _rate_gate("tablet_04_anchor", api_key)
    if err: return err
    return _sentence_payload(TABLET[3], tier, reflect)


@mcp.tool()
def tablet_05_sig(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 5 — Force entire if converted into earth. Sig → concrete signed artifact.

    Canonical: "Its force or power is entire if it be converted into earth."
    """
    err, tier = _rate_gate("tablet_05_sig", api_key)
    if err: return err
    return _sentence_payload(TABLET[4], tier, reflect)


@mcp.tool()
def tablet_06_validate(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 6 — Separate subtle from gross. Validation gate: real vs noise.

    Canonical: "Separate thou the Earth from the Fire, the subtile from the
    gross, gently and with great ingenuity."
    """
    err, tier = _rate_gate("tablet_06_validate", api_key)
    if err: return err
    return _sentence_payload(TABLET[5], tier, reflect)


@mcp.tool()
def tablet_07_two(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 7 — Ascends from Earth to Heaven, descends again. Two-way ingest/audit flow.

    Canonical: "It ascends from Earth to Heaven, and descends from Heaven to
    Earth, and receives the force or power of things superior and things inferior."
    """
    err, tier = _rate_gate("tablet_07_two", api_key)
    if err: return err
    return _sentence_payload(TABLET[6], tier, reflect)


@mcp.tool()
def tablet_08_public(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 8 — Glory of the whole world, obscurity flies. Public verify URL.

    Canonical: "By this means thou shalt have the glory of the whole world,
    and all obscurity shall fly far from thee."
    """
    err, tier = _rate_gate("tablet_08_public", api_key)
    if err: return err
    return _sentence_payload(TABLET[7], tier, reflect)


@mcp.tool()
def tablet_09_ed25519(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 9 — Strong fortitude of all fortitudes. Ed25519 + BFT council.

    Canonical: "This is the strong fortitude of all fortitudes, overcoming
    every subtle and penetrating every solid thing."
    """
    err, tier = _rate_gate("tablet_09_ed25519", api_key)
    if err: return err
    return _sentence_payload(TABLET[8], tier, reflect)


@mcp.tool()
def tablet_10_sovereign(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 10 — One Craftsman. Sovereign single signer per action.

    Canonical: "All things have been and arose from this One Thing, by the
    Will and by the Word, and by the Power of the One only Craftsman."
    """
    err, tier = _rate_gate("tablet_10_sovereign", api_key)
    if err: return err
    return _sentence_payload(TABLET[9], tier, reflect)


@mcp.tool()
def tablet_11_three(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 11 — Trismegistus three parts. King + Queen + Witness.

    Canonical: "Therefore I am called Hermes Trismegistus, having the three
    parts of the philosophy of the whole world."
    """
    err, tier = _rate_gate("tablet_11_three", api_key)
    if err: return err
    return _sentence_payload(TABLET[10], tier, reflect)


@mcp.tool()
def tablet_12_coagulatio(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 12 — Sun operation complete. Coagulatio: signed, shippable release.

    Canonical: "What I have to say of the operation of the Sun is complete."
    """
    err, tier = _rate_gate("tablet_12_coagulatio", api_key)
    if err: return err
    return _sentence_payload(TABLET[11], tier, reflect)


@mcp.tool()
def tablet_13_genesis(reflect: str = "", api_key: str = "") -> dict:
    """Sentence 13 — So the world was created. Genesis release + first sigil.

    Canonical: "Thus the world was created." — the recapitulation of the whole work.
    """
    err, tier = _rate_gate("tablet_13_genesis", api_key)
    if err: return err
    return _sentence_payload(TABLET[12], tier, reflect)


# ── Convenience tool: list all 13 sentences at once ────────────────

@mcp.tool()
def tablet_list_all(api_key: str = "") -> dict:
    """List all 13 sentences of the Emerald Tablet with their MEOK mappings.

    Returns a compact summary suitable for embedding in a deck or doc.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/meok-emerald-tablet-pro"}
    _check_rate_limit("tablet_list_all")
    return {
        "title": "Tabula Smaragdina — The Emerald Tablet of Hermes Trismegistus",
        "source": "Latin ~800 CE (Hortulanus); canonical English translation by Isaac Newton (1690s, pub. 1936+)",
        "license": "public domain",
        "sentence_count": 13,
        "sentences": [
            {
                "n": t["n"],
                "operation": t["operation"],
                "attestation_step": t["attestation_step"],
                "sigil_field": t["sigil_field"],
                "care_weight": t["care_weight"],
                "excerpt_english": t["english"][:100] + "...",
            }
            for t in TABLET
        ],
        "mappings": {
            "1": "scope ↔ claim equivalence (microcosm-macrocosm)",
            "2": "single sigil key, hash chain to one parent",
            "3": "Sun/Moon/Wind/Earth = kid/ts/payload/scope",
            "4": "root anchor (canonical keystore)",
            "5": "sig → concrete signed artifact",
            "6": "validation gate (subtle vs gross)",
            "7": "two-way ingest/audit flow",
            "8": "public verify URL",
            "9": "Ed25519 + BFT council strength",
            "10": "sovereign: single signer per action",
            "11": "three agents: King + Queen + Witness",
            "12": "coagulatio: complete signed release",
            "13": "genesis: the canonical release + first sigil",
        },
        "tier": tier,
        "free_tier_remaining_today": max(0, FREE_TIER_LIMIT - len(_call_counts["tablet_list_all"])),
    }


# ── Convenience tool: the full Tablet as a single string ─────────────

@mcp.tool()
def tablet_full_text(api_key: str = "") -> dict:
    """Return the full canonical English text of all 13 sentences + MEOK mappings.

    One string per sentence + one string per mapping, ready to drop into a deck,
    docs, or blog post.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/meok-emerald-tablet-pro"}
    _check_rate_limit("tablet_full_text")
    return {
        "title": "Tabula Smaragdina — The Emerald Tablet of Hermes Trismegistus",
        "license": "public domain",
        "full_text": "\n\n".join(
            f"{t['n']:>2}. {t['latin_name']}\n   {t['english']}"
            for t in TABLET
        ),
        "mappings": "\n\n".join(
            f"{t['n']:>2}. [{t['operation']}] {t['attestation_step']}  (sigil: {t['sigil_field']})"
            for t in TABLET
        ),
        "tier": tier,
    }


def main():
    mcp.run()


if __name__ == "__main__":
    main()


# ── MEOK monetization layer (Stripe upgrade · PAYG · pricing) ──────────
# Free tier is zero-config. Upgrade to Pro (unlimited) or pay-as-you-go per call.
import os as _meok_os
MEOK_STRIPE_UPGRADE = "https://buy.stripe.com/meok-emerald-tablet-pro"  # Pro (unlimited)
MEOK_PAYG_KEY = _meok_os.environ.get("MEOK_PAYG_KEY", "")  # set to enable PAYG (x402 / ~GBP0.05 per call)
MEOK_PRICING = "https://meok.ai/pricing"


def meok_upsell(tier: str = "free") -> dict:
    """Monetization options for free-tier callers: Pro upgrade, PAYG, or pricing page."""
    if tier != "free":
        return {}
    return {"upgrade_url": MEOK_STRIPE_UPGRADE,
            "payg_enabled": bool(MEOK_PAYG_KEY),
            "pricing": MEOK_PRICING}