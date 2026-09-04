#!/usr/bin/env python3
"""csoai-web3-axes-v2.py — describe candidate evidence rails for 22 GSPC axes.

This script:
  1. Strips SaaS / TaaS model from every axis
  2. Keeps measured axis state separate from proposed rail state
  3. Makes no deployment, signature, chain-inclusion, BFT, or coverage claim

Lane-doable: file generation + axis definitions.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(".")
INTEROP = ROOT / "public" / "interop"
GSP = ROOT / "client" / "src" / "data"
QUARANTINED_GENERATOR = True  # The former public "300 moves" generator is retired.


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# The new 22 axes — Web3-native, no SaaS/TaaS
WEB3_AXES = [
    # Behavioral axes (14) — model-comparison
    {
        "axis": "governance",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "on-chain-governance-attestation",
        "name": "Governance",
        "description": "On-chain governance attestation. Signed under did:web:csoai.org; governance claims carry a BFT record. Not an on-chain attestation.",
        "web3_primitive_planned": "EAS + did:web + W3C VC",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "model-comparison (TaaS)",
        "new_model": "on-chain-attestation (self-custody)",
    },
    {
        "axis": "safety",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "signed-harm-taxonomy",
        "name": "Safety",
        "description": "Signed harm taxonomy. Signed under did:web:csoai.org. On-chain attestation of harm is PLANNED, not live.",
        "web3_primitive_planned": "EAS + Rekor + OTS",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "model-comparison (TaaS)",
        "new_model": "signed-on-chain-attestation",
    },
    {
        "axis": "provenance",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "cryptographic-provenance-chain",
        "name": "Provenance",
        "description": "Cryptographic provenance chain. Every artifact has a signed lineage.",
        "web3_primitive_planned": "C2PA + Sigstore + in-toto",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "vendor-managed provenance (SaaS)",
        "new_model": "self-managed cryptographic provenance",
    },
    {
        "axis": "continuity",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "key-rotation-continuity",
        "name": "Continuity",
        "description": "Key rotation continuity. Every signing key has a signed rotation chain.",
        "web3_primitive_planned": "did:key + W3C VC + Rekor",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "vendor-managed (TaaS)",
        "new_model": "self-managed key rotation",
    },
    {
        "axis": "conformance",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "on-chain-conformance-attestation",
        "name": "Conformance",
        "description": "On-chain conformance attestation. Signed under did:web:csoai.org. On-chain attestation is PLANNED, not live.",
        "web3_primitive_planned": "EAS + W3C VC",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "third-party conformance (TaaS)",
        "new_model": "on-chain self-attestation",
    },
    {
        "axis": "openness",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "open-source-attestation",
        "name": "Openness",
        "description": "Open-source attestation. Signed under did:web:csoai.org. On-chain attestation is PLANNED, not live.",
        "web3_primitive_planned": "SLSA + in-toto + Sigstore",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "SaaS source-available",
        "new_model": "open-source signed provenance",
    },
    {
        "axis": "machinery-conformity",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "tee-attestation",
        "name": "Machinery Conformity",
        "description": "TEE attestation. Every hardware is TEE-attested (Intel SGX, AMD SEV, ARM TrustZone).",
        "web3_primitive_planned": "Intel SGX + AMD SEV + ARM TrustZone + RATS",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "vendor-managed hardware attestation (TaaS)",
        "new_model": "self-attested TEE with remote attestation",
    },
    {
        "axis": "care",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "on-chain-care-attestation",
        "name": "Care",
        "description": "On-chain care attestation. Signed under did:web:csoai.org. On-chain attestation is PLANNED, not live.",
        "web3_primitive_planned": "EAS + W3C VC",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "third-party care score (TaaS)",
        "new_model": "self-attested on-chain (PLANNED — EAS issuance is not live)",
    },
    {
        "axis": "cross-reality",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "zk-cross-reality-proof",
        "name": "Cross-Reality",
        "description": "ZK cross-reality proof. ZK proof of model behaviour across deployment + lab.",
        "web3_primitive_planned": "Halo2 + Plonky2 + zkSNARK",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "third-party cross-reality test (TaaS)",
        "new_model": "self-attested ZK proof",
    },
    {
        "axis": "detector-interop",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "inter-chain-detector-attestation",
        "name": "Detector Interop",
        "description": "Inter-chain detector attestation. Detectors attested across XRPL + EAS + Rekor.",
        "web3_primitive_planned": "XRPL + EAS + Rekor + did:web",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "third-party detector vendor (SaaS)",
        "new_model": "self-attested inter-chain",
    },
    {
        "axis": "art5-safeguard",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "eu-ai-act-art50-on-chain",
        "name": "Art 5 Safeguard",
        "description": "EU AI Act Article 50 on-chain. Every Art 50 claim is signed + attested.",
        "web3_primitive_planned": "EAS + W3C VC + did:web",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "third-party compliance (TaaS)",
        "new_model": "self-attested on-chain (PLANNED — EAS issuance is not live)",
    },
    {
        "axis": "swarm",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "mpc-swarm-attestation",
        "name": "Swarm",
        "description": "MPC swarm attestation. Every swarm claim is signed by N-of-M.",
        "web3_primitive_planned": "MPC + Threshold sig + W3C VC",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "vendor-managed swarm (SaaS)",
        "new_model": "self-managed MPC swarm",
    },
    {
        "axis": "affect",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "signed-affect-attribution",
        "name": "Affect",
        "description": "Signed affect attribution. Signed under did:web:csoai.org. On-chain attestation is PLANNED, not live.",
        "web3_primitive_planned": "EAS + W3C VC + did:web",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "third-party affect vendor (SaaS)",
        "new_model": "self-attested signed",
    },
    {
        "axis": "jail",
        "family": "gspc",
        "kind": "model-comparison",
        "kind_v2": "signed-jailbreak-counter",
        "name": "Jail",
        "description": "Signed jailbreak counter. Signed under did:web:csoai.org. On-chain attestation is PLANNED, not live.",
        "web3_primitive_planned": "EAS + Rekor + OTS",
        "n": 237,
        "status": "MEASURED",
        "tier": "behavioral",
        "old_model": "third-party jailbreak vendor (TaaS)",
        "new_model": "self-attested signed",
    },
    # Financial / domain axes (8) — deterministic-facts
    {
        "axis": "provenance-controls",
        "family": "financial",
        "kind": "deterministic-facts",
        "kind_v2": "xrpl-mainnet-issuer-facts",
        "name": "Provenance Controls",
        "description": "XRPL mainnet issuer facts. Every issuer is read directly from mainnet.",
        "web3_primitive_planned": "XRPL public servers (xrplcluster.com)",
        "status": "MEASURED",
        "tier": "financial",
        "old_model": "third-party oracle (TaaS)",
        "new_model": "self-fetched from public mainnet",
    },
    {
        "axis": "reserve-attestation",
        "family": "financial",
        "kind": "deterministic-facts",
        "kind_v2": "xrpl-on-chain-reserves",
        "name": "Reserve Attestation",
        "description": "XRPL on-chain reserves. Every reserve is read from mainnet.",
        "web3_primitive_planned": "XRPL public servers",
        "status": "MEASURED",
        "tier": "financial",
        "old_model": "third-party reserve auditor (TaaS)",
        "new_model": "self-fetched from XRPL mainnet",
    },
    {
        "axis": "regulatory-framework",
        "family": "financial",
        "kind": "deterministic-facts",
        "kind_v2": "eas-attestation-for-standards",
        "name": "Regulatory Framework",
        "description": "EAS attestation for standards. Every standard is on-chain attested.",
        "web3_primitive_planned": "EAS on Base + W3C VC",
        "status": "MEASURED",
        "tier": "financial",
        "old_model": "third-party compliance vendor (TaaS)",
        "new_model": "self-attested EAS on Base",
    },
    {
        "axis": "distribution-integrity",
        "family": "financial",
        "kind": "deterministic-facts",
        "kind_v2": "xrpl-holder-distribution",
        "name": "Distribution Integrity",
        "description": "XRPL holder distribution. Every holder is read from mainnet.",
        "web3_primitive_planned": "XRPL public servers",
        "status": "MEASURED",
        "tier": "financial",
        "old_model": "third-party analytics (SaaS)",
        "new_model": "self-fetched from XRPL mainnet",
    },
    {
        "axis": "custody-disclosure",
        "family": "financial",
        "kind": "deterministic-facts",
        "kind_v2": "self-custody-verification",
        "name": "Custody Disclosure",
        "description": "Self-custody verification. Every wallet has a signed proof of self-custody.",
        "web3_primitive_planned": "did:key + W3C VC + BIP32",
        "status": "MEASURED",
        "tier": "financial",
        "old_model": "third-party custody provider (SaaS)",
        "new_model": "self-custody with signed proof",
    },
    {
        "axis": "ai-adoption-components",
        "family": "financial",
        "kind": "deterministic-facts",
        "kind_v2": "web3-ai-adoption-on-chain",
        "name": "AI Adoption Components",
        "description": "Web3 AI adoption on-chain. Every adoption signal is on-chain attested.",
        "web3_primitive_planned": "EAS on Base + XRPL + did:web",
        "status": "MEASURED",
        "tier": "financial",
        "old_model": "third-party adoption tracker (SaaS)",
        "new_model": "self-attested on-chain (PLANNED — EAS issuance is not live)",
    },
    {
        "axis": "labour-components",
        "family": "financial",
        "kind": "deterministic-facts",
        "kind_v2": "xrpl-dao-labour-attestation",
        "name": "Labour Components",
        "description": "XRPL DAO labour attestation. Every labour claim is on-chain attested.",
        "web3_primitive_planned": "XRPL + EAS + did:web",
        "status": "MEASURED",
        "tier": "financial",
        "old_model": "third-party labour vendor (TaaS)",
        "new_model": "self-attested XRPL DAO",
    },
    {
        "axis": "humanoid-labour-index",
        "family": "financial",
        "kind": "deterministic-facts",
        "kind_v2": "signed-humanoid-attestation",
        "name": "Humanoid Labour Index",
        "description": "Signed humanoid attestation. Signed under did:web:csoai.org. On-chain attestation is PLANNED, not live.",
        "web3_primitive_planned": "EAS + W3C VC + did:web",
        "status": "MEASURED",
        "tier": "financial",
        "old_model": "third-party humanoid vendor (TaaS)",
        "new_model": "self-attested signed",
    },
]


# The 300 weekend moves — clear the table for the new future
WEEKEND_MOVES = [
    # A. SWIFT MESSAGING (30 moves)
    *[
        f"A{i+1}: SWIFT {mt} — /.well-known/swift-{mt.lower()}.json + /api/swift/{mt.lower()} + sign + anchor + BFT + A2A + MCP + x402 + mine + publish"
        for i, mt in enumerate(["MT103", "MT202", "MT202COV", "MT205", "MT760", "MT799", "MT798", "MT799-LOI", "MT798-LOI", "MT761"])
        for j in range(3)
    ][:30],
    # B. XRPL REAL-WORLD ASSETS (30 moves)
    *[
        f"B{i+1}: XRPL {issuer} — /.well-known/xrpl-{slug}.json + /api/xrpl/{slug} + sign + anchor + BFT + A2A + MCP + x402 + mine + publish"
        for i, (issuer, slug) in enumerate([
            ("RLUSD", "rlusd"), ("USDC", "usdc"), ("USD.bs", "usd-bs"), ("USDB", "usdb"),
            ("EURQ", "eurq"), ("EURØP", "europ"), ("PSC", "psc"), ("OUSG", "ousg"),
            ("USD.gh", "usd-gh"), ("LOVE", "love"),
        ])
        for j in range(3)
    ][:30],
    # C. TREASURIES + RWA (30 moves)
    *[
        f"C{i+1}: {treasury} — /.well-known/{slug}.json + /api/{slug} + sign + anchor + BFT + A2A + MCP + x402 + mine + publish"
        for i, (treasury, slug) in enumerate([
            ("BlackRock BUIDL", "blackrock-buidl"), ("Ondo OUSG", "ondo-ousg"),
            ("T-REX", "t-rex"), ("Maple", "maple"), ("Backed", "backed"),
            ("Franklin FOBXX", "franklin-fobxx"), ("Paxos Gold", "paxos-gold"),
            ("US Treasury Bills", "us-treasury-bills"), ("EU Sovereign Bonds", "eu-sovereign-bonds"),
            ("Tokenized MMF", "tokenized-mmf"),
        ])
        for j in range(3)
    ][:30],
    # D. BANK INTEGRATIONS (30 moves)
    *[
        f"D{i+1}: {bank} — /.well-known/{slug}.json + /api/{slug} + sign + anchor + BFT + A2A + MCP + x402 + mine + publish"
        for i, (bank, slug) in enumerate([
            ("JPMorgan", "jpmorgan"), ("HSBC", "hsbc"), ("Visa", "visa"),
            ("Mastercard", "mastercard"), ("Standard Chartered", "standard-chartered"),
            ("BNP Paribas", "bnp-paribas"), ("Deutsche Bank", "deutsche-bank"),
            ("Santander", "santander"), ("UBS", "ubs"), ("Barclays", "barclays"),
        ])
        for j in range(3)
    ][:30],
    # E. EU AI ACT (30 moves — the 12-month cliff)
    *[
        f"E{i+1}: EU AI Act — {art} — /.well-known/{slug}.json + /api/{slug} + sign + anchor + BFT + A2A + MCP + x402 + mine + publish"
        for i, (art, slug) in enumerate([
            ("Article 5", "art5"), ("Article 6", "art6"), ("Article 50", "art50"),
            ("Article 51", "art51"), ("Article 52", "art52"), ("Article 53", "art53"),
            ("Annex I", "annex-i"), ("Annex II", "annex-ii"), ("Annex III", "annex-iii"),
            ("Annex IV", "annex-iv"),
        ])
        for j in range(3)
    ][:30],
    # F. US REGULATORY (30 moves)
    *[
        f"F{i+1}: US — {reg} — /.well-known/{slug}.json + /api/{slug} + sign + anchor + BFT + A2A + MCP + x402 + mine + publish"
        for i, (reg, slug) in enumerate([
            ("NIST AI RMF", "nist-ai-rmf"), ("NIST AI 600-1", "nist-ai-600-1"),
            ("NIST AI 100-1", "nist-ai-100-1"), ("NIST AI 100-2", "nist-ai-100-2"),
            ("SEC AI", "sec-ai"), ("HHS AI", "hhs-ai"), ("FTC AI", "ftc-ai"),
            ("FCC AI", "fcc-ai"), ("EO 14110", "eo-14110"), ("OMB M-24-10", "omb-m-24-10"),
        ])
        for j in range(3)
    ][:30],
    # G. UK REGULATORY (30 moves)
    *[
        f"G{i+1}: UK — {reg} — /.well-known/{slug}.json + /api/{slug} + sign + anchor + BFT + A2A + MCP + x402 + mine + publish"
        for i, (reg, slug) in enumerate([
            ("UK AI Bill", "uk-ai-bill"), ("UK GDPR", "uk-gdpr"), ("UK DPA", "uk-dpa"),
            ("ICO AI", "ico-ai"), ("FCA AI", "fca-ai"), ("PRA AI", "pra-ai"),
            ("BSI AI", "bsi-ai"), ("CDEI", "cdei"), ("AISI", "aisi"), ("Centre for Data Ethics", "centre-data-ethics"),
        ])
        for j in range(3)
    ][:30],
    # H. X402 + A2A ECOSYSTEM (30 moves)
    *[
        f"H{i+1}: x402/A2A — {action}"
        for i, action in enumerate([
            "Permisionless x402 probe to every priced tier",
            "Sign every x402 receipt as a signed card",
            "Anchor every x402 receipt to OTS pending",
            "Wire every x402 receipt to 33-agent BFT",
            "Stage every x402 receipt as a discovery door",
            "Publish every x402 receipt to /.well-known/x402-receipts/",
            "Build a per-receipt evidence card",
            "Mine the x402 receipts daily",
            "Stage A2A calls to every agent (12 engines)",
            "Stage MCP tool calls to every tool (107 endpoints)",
        ])
        for j in range(3)
    ][:30],
    # I. FLYWHEELS (30 moves)
    *[
        f"I{i+1}: Flywheel — {action}"
        for i, action in enumerate([
            "Mine 1,000 atoms per day from 30+ sources",
            "Sign every atom with Ed25519",
            "OTS-pending stamp every signed atom",
            "Wire to 33-agent BFT",
            "Add as a discovery door",
            "Add to /interop/atom-{source}.json",
            "Build per-atom evidence card",
            "Stage A2A + MCP for every atom",
            "Mine daily + commit + push",
            "Build the daily report",
        ])
        for j in range(3)
    ][:30],
    # J. OUTWARD SIGNALS (30 moves)
    *[
        f"J{i+1}: Outward signal — {action}"
        for i, action in enumerate([
            "Publish 1 press release per day about the substrate",
            "Publish to /.well-known/press/",
            "Sign + OTS-pending every press release",
            "Mine citations daily",
            "Add to the public outreach stream",
            "Cite the Zenodo DOI in every outreach",
            "Cite the GSPC methodology in every press release",
            "Cite the x402 rail in every regulator outreach",
            "Cite the 33-agent BFT in every lab outreach",
            "Cite the 335 signed cards in every investor outreach",
        ])
        for j in range(3)
    ][:30],
    # K. WEEKEND IMPACT (30 moves)
    *[
        f"K{i+1}: Weekend — {action}"
        for i, action in enumerate([
            "Sat mining: 100 atoms from data.gov.uk",
            "Sat mining: 100 atoms from Companies House",
            "Sat mining: 100 atoms from Land Registry",
            "Sat mining: 100 atoms from open data portals",
            "Sat mining: 100 atoms from arXiv",
            "Sun signing: 500+ atoms signed",
            "Sun anchor: OTS-pending every card",
            "Sun update: update the public root",
            "Sun anchor: Sigstore Rekor",
            "Sun anchor: EAS on Base",
        ])
        for j in range(3)
    ][:30],
    # L. META + OPERATIONAL (10 moves)
    *[
        f"L{i+1}: Meta — {action}"
        for i, action in enumerate([
            "Run csoai-relentless (18 jobs in parallel)",
            "Run csoai-1000x (full sweep)",
            "Run csoai-sublime-audit (condition audit)",
            "Run csoai-prod-readiness (readiness checklist)",
            "Run csoai-engine-bft (12 engines wired)",
            "Run csoai-games-bind (15 games wired)",
            "Run csoai-monorepo-fill (fill gaps)",
            "Run csoai-wire-routes (route wiring)",
            "Run csoai-layer0-ceremony (3-anchor ceremony)",
            "Push every state to master",
        ])
    ],
]


def main() -> None:
    print("=== WEB3-NATIVE 22 AXES v2 ===")
    print()

    # 1. The new 22 axes
    print("[1] The 22 axes (Web3-native, no SaaS/TaaS)...")
    axes_path = INTEROP / "axes-v2-web3.json"
    # WEB3_AXES contains the current GSPC board status alongside a proposed
    # future rail mapping. Do not collapse those two states: a measured GSPC
    # axis does not establish that EAS, Rekor, OTS, ZK, MPC or TEE issuance is
    # live for that axis.
    planned_axes = []
    for axis in WEB3_AXES:
        proposal = {key: value for key, value in axis.items() if key not in {"description", "status", "new_model"}}
        proposal.update({
            "gspc_axis_status": axis["status"],
            "rail_status": "PLANNED",
            "description": f"Candidate evidence rail: {axis['web3_primitive']}.",
            "candidate_model": axis["new_model"],
            "claim_boundary": (
                "Design proposal only. No deployment, signature, chain inclusion, BFT independence, "
                "universal coverage, legal compliance, or certification is established by this record."
            ),
        })
        planned_axes.append(proposal)
    axes_path.write_text(json.dumps({
        "schema": "csoai.axes-v2/0.1",
        "as_of": now(),
        "status": "DESIGN_PROPOSAL",
        "principle": "Map the 22 measured GSPC axes to candidate portable evidence rails without claiming those rails are deployed.",
        "axes": planned_axes,
        "migration": {
            "from": "SaaS / TaaS model (cloud vendor controls the keys, vendor attests)",
            "to": "Web3-native model (self-custody, on-chain attestation, ZK proofs, MPC, TEE)",
            "rails": [
                "XRPL (real-world assets)",
                "EAS on Base (on-chain attestations)",
                "Sigstore Rekor (transparency log)",
                "OpenTimestamps → Bitcoin",
                "did:web / did:key / did:eth (decentralized identifiers)",
                "W3C VC (verifiable credentials)",
                "Halo2 / Plonky2 (ZK proofs)",
                "Intel SGX / AMD SEV / ARM TrustZone (TEE)",
                "MPC + Threshold sig",
            ],
        },
    }, indent=2))
    print(f"  axes file: {axes_path}")
    print(f"  total axes: {len(WEB3_AXES)}")

    # The former "300 moves" outputs mixed plans with deployment and revenue
    # assertions and were accidentally served as evidence. They are preserved in
    # evidence/incidents, never generated into public/ again.
    print()
    print("=== SUMMARY ===")
    print(f"  candidate axis rails: {len(WEB3_AXES)}")
    print(f"  axes file: {axes_path}")
    print("  public move-plan generator: RETIRED")


if __name__ == "__main__":
    main()
