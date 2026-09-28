#!/usr/bin/env python3
"""Build the failure-class -> open-remediation crosswalk for the model-comparison axes.

WHAT THIS IS
    A reader who scores badly on an axis is currently left with nothing to do about it.
    This crosswalk says: this axis measures this behaviour; a low result indicates this
    class of weakness; here are open-source tools whose AUTHORS say they address that
    class, with what they claim, what they do not claim, and their licence.

WHAT THIS IS NOT, and these are load-bearing
    * Not a remediation service. Council of AI measures and never remediates. A body that
      sells the cure for the disease it diagnoses has the conflict that destroys rating
      agencies and audit-plus-advisory firms. This crosswalk is free, citable by anyone
      including our competitors, and will never carry a price.
    * Not a recommendation, endorsement, certification or approval. A row records what a
      project's own published material says about itself. We assert nothing about whether
      any tool works, and we have measured none of them.
    * Not a claim of review, partnership or alliance. No vendor, standards body or
      alliance has reviewed, approved or seen this mapping. OWASP identifiers are cited
      for navigation only; citing an identifier is not adapting OWASP's work.
    * Not built on anyone's membership list. The organisations are not the resource; their
      published artifacts are. No membership is asserted, because none is verifiable from
      a primary source.

    THE GAPS ARE THE POINT. An axis we measure that no open tool addresses is a finding
    about the ecosystem, not an omission in this file.

Axis rows are joined to the LIVE board, never typed. If the board grows an axis this
table does not cover, the build fails rather than quietly shipping a short crosswalk.

    python3 measurement/remediation-crosswalk/2026-09-23/build_remediation_crosswalk.py --out <path>
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path

AS_OF = "2026-09-23"
BOARD = "https://councilof.ai/api/gspc"

# ---------------------------------------------------------------------------
# The tool register. Every `claims` string is the project's OWN wording, quoted
# from the file named in `claim_source`, retrieved 2026-09-23. `licence` is read
# from the repository's own licence file, not from a directory or a badge.
# ---------------------------------------------------------------------------
TOOLS = {
    "pyrit": {
        "name": "PyRIT (Python Risk Identification Tool for generative AI)",
        "publisher": "Microsoft Corporation",
        "repo": "https://github.com/microsoft/PyRIT",
        "licence": "MIT",
        "licence_evidence": "LICENSE at microsoft/PyRIT, 'Copyright (c) Microsoft Corporation. MIT License'",
        "claims": "an open source framework built to empower security professionals and engineers to proactively identify risks in generative AI systems",
        "claim_source": "README.md, microsoft/PyRIT, retrieved 2026-09-23",
        "does_not_claim": "It does not claim to fix anything. It identifies; remediation is the operator's.",
        "note": "github.com/Azure/PyRIT is ARCHIVED (last push 2026-03-25). The live repository is microsoft/PyRIT. Any estate pin at the Azure URL points at a dead mirror.",
    },
    "garak": {
        "name": "garak (Generative AI Red-teaming & Assessment Kit)",
        "publisher": "Leon Derczynski; repository under the NVIDIA organisation",
        "repo": "https://github.com/NVIDIA/garak",
        "licence": "Apache-2.0",
        "licence_evidence": "LICENSE at NVIDIA/garak, SPDX Apache-2.0",
        "claims": "checks if an LLM can be made to fail in a way we don't want ... probes for hallucination, data leakage, prompt injection, misinformation, toxicity generation, jailbreaks, and many other weaknesses",
        "claim_source": "README.md, NVIDIA/garak, retrieved 2026-09-23",
        "does_not_claim": "A scanner, not a fix and not a scoreboard: it publishes no leaderboard and no headline number.",
    },
    "purple-llama-cyberseceval": {
        "name": "Purple Llama — CyberSecEval / CybersecurityBenchmarks",
        "publisher": "Meta Platforms, Inc.",
        "repo": "https://github.com/meta-llama/PurpleLlama/tree/main/CybersecurityBenchmarks",
        "licence": "MIT",
        "licence_evidence": "CybersecurityBenchmarks/LICENSE is MIT (Meta Platforms). The repository ROOT LICENSE is the Llama 3.2 Community License; the README's component table assigns 'Evals/Benchmarks: MIT'.",
        "claims": "Set of tools to assess and improve LLM security ... tools and evals for Cyber Security and Input/Output safeguards",
        "claim_source": "repository description and README.md, meta-llama/PurpleLlama, retrieved 2026-09-23",
        "does_not_claim": "Its interpreter-abuse and prompt-injection benchmarks are graded upstream with a judge LLM. We do not adopt that grading.",
    },
    "purple-llama-safeguards": {
        "name": "Purple Llama — Llama Guard / Prompt Guard model family",
        "publisher": "Meta Platforms, Inc.",
        "repo": "https://github.com/meta-llama/PurpleLlama",
        "licence": "Llama 3.2 Community License (NOT an OSI-approved open licence)",
        "licence_evidence": "Repository LICENSE is the LLAMA 3.2 COMMUNITY LICENSE AGREEMENT; the README component table assigns the Community Licence to every Safeguard model.",
        "claims": "LLM-based input/output safeguard for human-AI conversations",
        "claim_source": "README.md link title, meta-llama/PurpleLlama, retrieved 2026-09-23",
        "does_not_claim": "A safeguard model is a model judging a model. It is listed here as a remediation option for a reader, and is never used to grade anything we publish.",
    },
    "purple-llama-codeshield": {
        "name": "Purple Llama — CodeShield",
        "publisher": "Meta Platforms, Inc.",
        "repo": "https://github.com/meta-llama/PurpleLlama/tree/main/CodeShield",
        "licence": "MIT",
        "licence_evidence": "CodeShield/LICENSE; the README component table assigns 'Code Shield: MIT'.",
        "claims": "insecure code detection as a system-level safeguard on model output (README component table entry 'Code Shield')",
        "claim_source": "README.md, meta-llama/PurpleLlama, retrieved 2026-09-23",
        "does_not_claim": "Static insecure-code detection is not sandbox containment.",
    },
    "nemo-guardrails": {
        "name": "NVIDIA NeMo Guardrails",
        "publisher": "NVIDIA Corporation",
        "repo": "https://github.com/NVIDIA-NeMo/Guardrails",
        "licence": "Apache-2.0",
        "licence_evidence": "LICENSE.md carries 'SPDX-License-Identifier: Apache-2.0'. The GitHub API reports NOASSERTION only because the file is LICENSE.md.",
        "claims": "an open-source toolkit for easily adding programmable guardrails to LLM-based conversational applications ... specific ways of controlling the output of a large language model",
        "claim_source": "README.md, NVIDIA-NeMo/Guardrails, retrieved 2026-09-23",
        "does_not_claim": "Controls output at runtime; makes no claim about the underlying model's behaviour, which is what an axis measures.",
    },
    "invariant": {
        "name": "Invariant Guardrails",
        "publisher": "Invariant Labs",
        "repo": "https://github.com/invariantlabs-ai/invariant",
        "licence": "Apache-2.0",
        "licence_evidence": "LICENSE at invariantlabs-ai/invariant, SPDX Apache-2.0",
        "claims": "a comprehensive rule-based guardrailing layer for LLM or MCP-powered AI applications ... deployed between your application and your MCP servers or LLM provider ... simple Python-inspired matching rules, that can be written to identify and prevent malicious agent behavior",
        "claim_source": "README.md, invariantlabs-ai/invariant, retrieved 2026-09-23",
        "does_not_claim": "Rules are written by the operator. The tool supplies the interception layer, not the policy.",
    },
    "giskard": {
        "name": "Giskard (giskard-oss)",
        "publisher": "Giskard AI",
        "repo": "https://github.com/Giskard-AI/giskard-oss",
        "licence": "Apache-2.0",
        "licence_evidence": "LICENSE at Giskard-AI/giskard-oss, SPDX Apache-2.0; THIRD_PARTY_NOTICES.md present.",
        "claims": "Evals, Red Teaming and Test Generation for Agentic Systems ... a more powerful AI vulnerability scanner and enhanced RAG evaluation",
        "claim_source": "README.md, Giskard-AI/giskard-oss, retrieved 2026-09-23",
        "does_not_claim": "Its own install table lists an `openai`/`anthropic` extra for 'provider SDKs for LLM judges / generators' — its scan uses model judges, which we do not adopt as gold.",
    },
    "guardrails-ai": {
        "name": "Guardrails AI",
        "publisher": "Guardrails AI",
        "repo": "https://github.com/guardrails-ai/guardrails",
        "licence": "Apache-2.0",
        "licence_evidence": "LICENSE at guardrails-ai/guardrails, SPDX Apache-2.0",
        "claims": "runs Input/Output Guards in your application that detect, quantify and mitigate the presence of specific types of risks ... a collection of pre-built measures of specific types of risks (called 'validators')",
        "claim_source": "README.md, guardrails-ai/guardrails, retrieved 2026-09-23",
        "does_not_claim": "Validators are individual packages with their own licences; the Apache-2.0 above covers the framework, not every validator in the Hub.",
        "currency_note": "The project's own README records that validators moved to standard PyPI packages and that hosted remote inferencing was discontinued, planned cutoff 2026-08-25. A crosswalk row is not a statement that a given validator is still installable.",
    },
    "owasp-llm-top-10": {
        "name": "OWASP Top 10 for Large Language Model Applications",
        "publisher": "OWASP GenAI Security Project",
        "repo": "https://github.com/OWASP/www-project-top-10-for-large-language-model-applications",
        "licence": "CC-BY-SA-4.0",
        "licence_evidence": "LICENSE.md: 'This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License.'",
        "claims": "a published taxonomy of LLM application risks, identifiers LLM01..LLM10",
        "claim_source": "2_0_vulns/ file names, OWASP repository, retrieved 2026-09-23",
        "does_not_claim": "A taxonomy, not a tool and not a corpus.",
        "redistribution_note": (
            "ShareAlike. Embedding OWASP prose in a bank would oblige us to licence that bank "
            "CC-BY-SA-4.0, which is incompatible with the CC-BY-4.0 the board data carries. "
            "Citing an identifier is not adaptation, so OWASP is used here as a navigational "
            "anchor and never as corpus text."
        ),
    },
}

# ---------------------------------------------------------------------------
# state vocabulary — deliberately small, and OPEN_GAP is a first-class answer.
# ---------------------------------------------------------------------------
STATES = {
    "OPEN_TOOL_ADDRESSES_CLASS": "at least one of the surveyed open projects says, in its own published material, that it addresses this class of weakness",
    "PARTIAL": "a surveyed project addresses part of the class, and the part it does not address is named on the row",
    "OPEN_GAP": "none of the surveyed open projects claims to address this class. This is a finding about the ecosystem, not a gap in the measurement",
}

SURVEY_SCOPE = [
    "microsoft/PyRIT", "NVIDIA/garak", "meta-llama/PurpleLlama",
    "NVIDIA-NeMo/Guardrails", "invariantlabs-ai/invariant",
    "Giskard-AI/giskard-oss", "guardrails-ai/guardrails",
    "OWASP/www-project-top-10-for-large-language-model-applications",
]

# axis id on the board -> the row
ROWS = {
    "governance": {
        "failure_class": "Cannot place a system in the correct regulatory risk tier. A reader who scores low here will mis-scope its own obligations before it writes a line of code.",
        "owasp_anchor": [],
        "state": "OPEN_GAP",
        "tools": [],
        "gap_note": "None of the eight surveyed projects claims to classify a system against a regulatory risk tier. The open agentic-security ecosystem addresses runtime behaviour; statutory classification is not in its scope.",
    },
    "safety": {
        "failure_class": "Refusal is not calibrated: the model either complies with requests it should decline, or declines requests it should answer. Both directions are failures and a bank of paired requests separates them.",
        "owasp_anchor": ["LLM01_PromptInjection"],
        "state": "OPEN_TOOL_ADDRESSES_CLASS",
        "tools": ["garak", "pyrit", "purple-llama-safeguards", "nemo-guardrails", "guardrails-ai"],
        "note": "garak and PyRIT address the probing side (find where refusal breaks); the safeguard model and the two guardrail frameworks address the mitigation side (intercept at runtime). Over-refusal — the other direction — is claimed by none of them.",
    },
    "provenance": {
        "failure_class": "Cannot reason about whether a content-provenance marking survives a transformation, so a downstream integrity claim is made on a marking that is already destroyed.",
        "owasp_anchor": [],
        "state": "OPEN_GAP",
        "tools": [],
        "gap_note": "No surveyed project claims anything about provenance-marking survival. The relevant open work is in the C2PA ecosystem, which is outside this survey's scope and is not asserted here.",
    },
    "continuity": {
        "failure_class": "Cannot state whether a cryptographic assumption is quantum-vulnerable, so migration planning is advised on a wrong premise.",
        "owasp_anchor": [],
        "state": "OPEN_GAP",
        "tools": [],
        "gap_note": "No surveyed project claims post-quantum reasoning of any kind.",
    },
    "conformance": {
        "failure_class": "Tool calls that do not conform to the protocol contract: wrong shape, wrong arguments, or a call the declared schema does not permit.",
        "owasp_anchor": ["LLM06_ExcessiveAgency"],
        "state": "PARTIAL",
        "tools": ["invariant"],
        "note": "Invariant says it deploys between an application and its MCP servers and can 'identify and prevent malicious agent behavior' by rule. That is interception of tool calls, not a conformance test of a tool against its schema. The part it does not address: whether a model can tell a conforming call from a violating one, which is what this axis measures.",
    },
    "openness": {
        "failure_class": "Cannot reason about whether a licence permits an intended use, so a deployment proceeds on a licence the reader has misread.",
        "owasp_anchor": ["LLM03_SupplyChain"],
        "state": "OPEN_GAP",
        "tools": [],
        "gap_note": "OWASP LLM03 names supply-chain risk as a category, but no surveyed tool claims licence reasoning. This is the axis where our own evaluation kept hitting the same wall: establishing a licence was manual work every time.",
    },
    "machinery-conformity": {
        "failure_class": "Cannot classify a self-evolving safety function under machinery regulation, so a safety-critical component is scoped out of the regime that governs it.",
        "owasp_anchor": [],
        "state": "OPEN_GAP",
        "tools": [],
        "gap_note": "No surveyed project addresses machinery regulation.",
    },
    "care": {
        "failure_class": "The protect-versus-help trade-off is mis-set: the model either answers a request that would harm a third party, or withholds help from a benign one. Withholding is a failure too and is the half most tools do not measure.",
        "owasp_anchor": [],
        "state": "PARTIAL",
        "tools": ["purple-llama-safeguards", "nemo-guardrails", "guardrails-ai", "giskard"],
        "note": "All four address the protect half: classify content, block what policy forbids. None of them claims to measure the cost of over-protection, which is the other arm of this axis. A reader who fails care because it refuses too much will find nothing here.",
    },
    "cross-reality": {
        "failure_class": "An autonomous agent takes an action on its own authority that required confirmation, or refuses one it was authorised to take.",
        "owasp_anchor": ["LLM06_ExcessiveAgency"],
        "state": "OPEN_TOOL_ADDRESSES_CLASS",
        "tools": ["invariant", "nemo-guardrails"],
        "note": "Invariant's published example rule intercepts a tool-call flow and raises before an email leaves the organisation, which is the confirm-versus-proceed boundary this axis measures. The policy is still written by the operator.",
    },
    "detector-interop": {
        "failure_class": "Watermark detectors disagree, so a provenance verdict depends on which detector was asked.",
        "owasp_anchor": [],
        "state": "OPEN_GAP",
        "tools": [],
        "gap_note": "No surveyed project claims watermark detection or cross-detector agreement.",
    },
    "art5-safeguard": {
        "failure_class": "Fails to recognise a prohibited practice — the class of use that is not permitted at any risk tier.",
        "owasp_anchor": [],
        "state": "OPEN_GAP",
        "tools": [],
        "gap_note": "Safeguard models carry content-harm taxonomies that overlap some prohibited practices by coincidence of subject matter, but no surveyed project claims to identify a statutorily prohibited practice. We do not present taxonomy overlap as coverage.",
    },
    "swarm": {
        "failure_class": "Multiple agents coordinate into an outcome no single agent would have produced, and no single step looks wrong on its own.",
        "owasp_anchor": ["LLM06_ExcessiveAgency"],
        "state": "PARTIAL",
        "tools": ["invariant"],
        "note": "Invariant's rules match across calls — its own example is a flow from one tool call to another — which is the only surveyed mechanism that can express a multi-step condition at all. It is a runtime interception layer, not a measurement of whether a model recognises unsafe coordination.",
    },
    "affect": {
        "failure_class": "Emotional and embodied safety: manipulation of a user, unsafe disclosure, or mishandling of a vulnerable interlocutor.",
        "owasp_anchor": ["LLM02_SensitiveInformationDisclosure"],
        "state": "PARTIAL",
        "tools": ["purple-llama-safeguards", "guardrails-ai", "giskard"],
        "note": "Content-harm categories (self-harm, sexual content, PII disclosure) overlap part of this axis. Manipulation of a user over a conversation is claimed by none of them.",
    },
    "jail": {
        "failure_class": "Code or instructions that break out of the execution sandbox: shell escape, container escape, privilege escalation, or a benign-looking cell that reaches outside its jail.",
        "owasp_anchor": ["LLM05_ImproperOutputHandling", "LLM06_ExcessiveAgency"],
        "state": "OPEN_TOOL_ADDRESSES_CLASS",
        "tools": ["purple-llama-codeshield", "purple-llama-cyberseceval", "garak"],
        "note": "CyberSecEval ships an interpreter-abuse benchmark of 500 prompts in five attack classes; CodeShield claims insecure-code detection on model output; garak carries exploitation probes. None of them claims containment — they detect, the sandbox contains.",
    },
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--board", default=BOARD)
    args = ap.parse_args()

    req = urllib.request.Request(args.board, headers={"User-Agent": "csoai-remediation-crosswalk"})
    board = json.loads(urllib.request.urlopen(req, timeout=120).read())
    axes = [a for a in board.get("axes", []) if a.get("kind") == "model-comparison"]
    if not axes:
        print("UNCHECKABLE: the board returned no model-comparison axes")
        return 2

    missing = [a["axis"] for a in axes if a["axis"] not in ROWS]
    extra = [k for k in ROWS if k not in {a["axis"] for a in axes}]
    if missing or extra:
        print(f"FAIL: crosswalk does not match the live board. missing={missing} stale={extra}")
        return 1

    rows = []
    for a in axes:
        r = dict(ROWS[a["axis"]])
        tools = r.pop("tools", [])
        rows.append(
            {
                "axis": a["axis"],
                "bench": a.get("bench"),
                "measures": a.get("task"),
                "n": a.get("n"),
                "separation": a.get("separation"),
                "failure_class": r.pop("failure_class"),
                "state": r.pop("state"),
                "open_remediation": [
                    {
                        "tool": TOOLS[t]["name"],
                        "publisher": TOOLS[t]["publisher"],
                        "repo": TOOLS[t]["repo"],
                        "licence": TOOLS[t]["licence"],
                        "authors_claim": TOOLS[t]["claims"],
                        "claim_source": TOOLS[t]["claim_source"],
                        "does_not_claim": TOOLS[t]["does_not_claim"],
                    }
                    for t in tools
                ],
                "owasp_anchor": r.pop("owasp_anchor", []),
                **r,
            }
        )

    counts = {}
    for row in rows:
        counts[row["state"]] = counts.get(row["state"], 0) + 1

    out = {
        "schema": "csoai.failure-class-open-remediation-crosswalk/0.1",
        "as_of": AS_OF,
        "title": "Failure class to open remediation — a free crosswalk over the model-comparison axes",
        "publisher": "Council of AI (CSOAI Ltd, UK Companies House 16939677)",
        "licence": "CC-BY-4.0",
        "price": "free, forever. This crosswalk is never sold and never bundled with a paid engagement.",
        "boundary": [
            "Council of AI measures and never remediates. We do not sell, deliver, configure or support any fix for any finding on any axis.",
            "A row records what a project's own published material says about itself. It is not a recommendation, an endorsement, a certification, or evidence that the tool works.",
            "We have measured none of these tools. No claim here is a measurement and none carries a grade.",
            "No vendor, standards body or alliance has reviewed, approved or seen this mapping. No affiliation or membership is asserted or implied.",
            "OWASP identifiers are cited for navigation. OWASP material is CC-BY-SA-4.0 and no OWASP prose is reproduced or adapted here.",
            "Anyone may use this, including projects that compete with us.",
        ],
        "why_gaps_matter": (
            "An axis we measure that no open tool claims to address is the most useful row in the "
            "table. It says where the open ecosystem has not arrived yet, which is information a "
            "reader cannot get from any vendor."
        ),
        "survey_scope": SURVEY_SCOPE,
        "survey_scope_note": (
            "Eight projects, chosen because they are open and readable without anyone's permission. "
            "OPEN_GAP means none of THESE eight claims the class — never that nothing anywhere does."
        ),
        "state_vocabulary": STATES,
        "board": {
            "url": args.board,
            "retrieved_at": AS_OF,
            "comparison_axes": board.get("totals", {}).get("comparison_axes"),
            "separated_leads": board.get("totals", {}).get("separated_leads"),
            "ties": board.get("totals", {}).get("ties"),
            "untested_separations": board.get("totals", {}).get("untested_separations"),
        },
        "summary": counts,
        "tools": TOOLS,
        "axes": rows,
    }
    Path(args.out).write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for row in rows:
        print(f"{row['axis']:22s} {row['state']:26s} {len(row['open_remediation'])} tool(s)")
    print("\nsummary:", counts)
    print("wrote", args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
