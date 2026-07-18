Title (74 chars):
Show HN: Sovereign Layer Zero Charter v1.0 – signed root for AI governance

Body:

We are releasing the Sovereign Layer Zero Charter v1.0, the root governance document for an open AI substrate.

What it is: one Markdown charter binding every downstream charter, framework cross-walk, and SIGIL receipt in our federation to one signed root.

Who it is for: developers, compliance teams, regulators, and researchers needing a public governance root for AI systems.

Why we think it is interesting:
- Plain text Markdown. Diff it, fork it, audit every line.
- Every compliance claim is Bitcoin OpenTimestamps-anchored - the timeline is verifiable without trusting us.
- Cross-walks 236 frameworks (EU AI Act, GDPR, ISO 42001, NIST AI RMF, DORA) at article level.
- Fork under MIT and emit your own SIGIL-signed derivative charter.

How it works: actions go through the Universal Witness Engine (UWE) - hash, Ed25519 + PQC ML-DSA-65 sign, append to a public SIGIL chain anchored to Bitcoin via OpenTimestamps. The Charter defines entries, who emits them, and how a 33-agent BFT council resolves conflicts.

How to use: git clone CSOAI-ORG/SOVEREIGN-LAYER-ZERO-CHARTER, open proofof.ai/audit/77ab0e6f9d6c77e8, then sign something with the included CLI.

SHA-256: df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054

We do not know if UWE/SIGIL is the right primitive for AI governance. Pushback on BFT, cross-walk granularity, and Bitcoin OTS vs a permissioned ledger is welcome. CC0 1.0.
