#!/usr/bin/env python3
"""Add the CSOAI/MEOK Labs MCP section to a fork's README.md and commit + push.

This is the inner loop of the upstream-PR play. It edits one fork's README
to add the CSOAI section, commits it, and pushes the feature branch.

The actual PR opening (against the upstream repo) is the next step.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path.home() / "clawd"
FORKS_DIR = ROOT / "forks"

# (fork_dir, upstream_repo, upstream_branch, README_anchor, new_section_text)
FORKS = [
    {
        "fork_dir": "awesome-mcp-servers-csoai",
        "upstream": "CSOAI-ORG/awesome-mcp-servers-csoai",  # self-target (the fork IS the awesome list)
        "branch": "main",
        "anchor": r"^## (Contributing|Contents|License)",
        "section": """## CSOAI/MEOK Labs MCP Servers

*531 MIT-licensed MCP servers, the largest open-source MCP organization on GitHub. 97-component Ed25519-signed OSCAL Layer-0 proof. 479 deploy-ready.*

- **[eu-ai-act-compliance-mcp](https://github.com/CSOAI-ORG/eu-ai-act-compliance-mcp)** — 18 tools, 410 verbatim articles from EUR-Lex.
- **[regulatory-webhook-mcp](https://github.com/CSOAI-ORG/regulatory-webhook-mcp)** — Push-notify EU AI Act/NIS2/DORA.
- **[oscal-generator-mcp](https://github.com/CSOAI-ORG/oscal-generator-mcp)** — NIST OSCAL + Ed25519 signer.
- **[csoai-governance-crosswalk-mcp](https://github.com/CSOAI-ORG/csoai-governance-crosswalk-mcp)** — 13 frameworks × 52 articles.
- **[solvency-ii-mcp](https://github.com/CSOAI-ORG/solvency-ii-mcp)** — First OSS Solvency II implementation.
- **[mica-crypto-mcp](https://github.com/CSOAI-ORG/mica-crypto-mcp)** — EU MiCA (Reg 2023/1114).
- **[cra-compliance-mcp](https://github.com/CSOAI-ORG/cra-compliance-mcp)** — EU Cyber Resilience Act.
- **[22 legacy bridges](https://github.com/orgs/CSOAI-ORG/repositories?q=bridge-mcp)** — COBOL · HL7/FHIR · SCADA · FIX · ISO 20022 · ACORD · SAP · Oracle · etc.

""",
    },
    {
        "fork_dir": "awesome-compliance-csoai",
        "upstream": "theopenlane/awesome-compliance",
        "branch": "main",
        "anchor": r"^## (Contents|Contributing|License|Index)",
        "section": """## MCP Servers (Model Context Protocol)

*531 MIT-licensed MCP servers from CSOAI/MEOK Labs — the largest open-source MCP organization on GitHub. 97-component Ed25519-signed OSCAL Layer-0 proof. 479 deploy-ready.*

- **[CSOAI/MEOK Labs MCP fleet](https://github.com/orgs/CSOAI-ORG/repositories?q=mcp)** — 531 MCPs across 7 hives covering the EU AI Act, GDPR, DORA, NIS2, ISO 42001, NIST AI RMF, HIPAA, SOX, PCI-DSS, Solvency II, ACORD, ISO 20022 + 22 legacy bridges.
- **[oscal-generator-mcp](https://github.com/CSOAI-ORG/oscal-generator-mcp)** — Machine-readable NIST OSCAL generator + Ed25519 signer. FedRAMP RFC-0024 wedge.
- **[csoai-governance-crosswalk-mcp](https://github.com/CSOAI-ORG/csoai-governance-crosswalk-mcp)** — 13 frameworks × 52 articles. The named crosswalk for AI governance.
- **[eu-ai-act-compliance-mcp](https://github.com/CSOAI-ORG/eu-ai-act-compliance-mcp)** — EU AI Act compliance with 410 verbatim articles from EUR-Lex. 18 tools.

""",
    },
    {
        "fork_dir": "awesome-eu-ai-act-genaigurus",
        "upstream": "GenAI-Gurus/awesome-eu-ai-act",
        "branch": "main",
        "anchor": r"^## (Contents|Contributing|License|Index)",
        "section": """## MCP Servers (CSOAI/MEOK Labs)

*531 MIT-licensed MCP servers — the largest open-source MCP organization on GitHub. 97-component Ed25519-signed OSCAL Layer-0 proof. 479 deploy-ready.*

- **[meok-defoneos-mcp](https://github.com/CSOAI-ORG/meok-defoneos-mcp)** — 7 MCPs (airspace / BVLOS / firmware attestation / governance / TAK / OSPD / cyber) wrapped into a sovereign UK defence-AI governance surface. 28-domain compliance.
- **[cra-compliance-mcp](https://github.com/CSOAI-ORG/cra-compliance-mcp)** — EU Cyber Resilience Act (Reg 2024/2847). Products with digital elements, CE marking, SBOM.
- **[mica-crypto-mcp](https://github.com/CSOAI-ORG/mica-crypto-mcp)** — EU MiCA (Reg 2023/1114) for crypto-asset issuers, exchanges, CASPs.
- **[oscal-generator-mcp](https://github.com/CSOAI-ORG/oscal-generator-mcp)** — Machine-readable NIST OSCAL + Ed25519 signer.
- **[solvency-ii-mcp](https://github.com/CSOAI-ORG/solvency-ii-mcp)** — First OSS Solvency II implementation (€10T market, ~5,000 firms).

""",
    },
    {
        "fork_dir": "awesome-legaltech",
        "upstream": "Vaquill-AI/awesome-legaltech",
        "branch": "main",
        "anchor": r"^## (Contents|Contributing|License|Index)",
        "section": """## MCP Servers (CSOAI/MEOK Labs)

*531 MIT-licensed MCP servers — the largest open-source MCP organization on GitHub. 97-component Ed25519-signed OSCAL Layer-0 proof. 479 deploy-ready.*

- **[oscal-generator-mcp](https://github.com/CSOAI-ORG/oscal-generator-mcp)** — Machine-readable NIST OSCAL (FedRAMP RFC-0024) + Ed25519.
- **[csoai-governance-crosswalk-mcp](https://github.com/CSOAI-ORG/csoai-governance-crosswalk-mcp)** — 13 governance frameworks × 52 articles crosswalked.
- **[solvency-ii-mcp](https://github.com/CSOAI-ORG/solvency-ii-mcp)** — First OSS Solvency II Pillar 1+3 implementation.
- **[contract-review-ai-mcp](https://github.com/CSOAI-ORG/contract-review-ai-mcp)** — Contract review automation.
- **[eu-ai-act-compliance-mcp](https://github.com/CSOAI-ORG/eu-ai-act-compliance-mcp)** — 410 verbatim EUR-Lex articles, 18 tools.

""",
    },
]


def main():
    edited = 0
    committed = 0
    pushed = 0
    failed = 0
    for f in FORKS:
        fork_dir = FORKS_DIR / f["fork_dir"]
        readme = fork_dir / "README.md"
        if not readme.is_file():
            print(f"  ✗ {f['fork_dir']} (no README.md)")
            failed += 1
            continue
        text = readme.read_text()
        if "CSOAI/MEOK Labs" in text and "csoai-mcp-servers" not in text:
            print(f"  ⊘ {f['fork_dir']} (already has CSOAI section)")
            continue
        if "CSOAI/MEOK Labs" in text and "csoai-mcp-servers" in text:
            print(f"  ⊘ {f['fork_dir']} (already edited this session)")
            continue
        # Insert before the anchor
        new_text, n = re.subn(f["anchor"], f["section"].rstrip() + "\n\n" + r"\1", text, count=1, flags=re.MULTILINE)
        if n == 0:
            # Try anchoring at the end of the file (before the License section)
            license_match = re.search(r"^## License", text, re.MULTILINE)
            if license_match:
                pos = license_match.start()
                new_text = text[:pos] + f["section"].rstrip() + "\n\n" + text[pos:]
            else:
                new_text = text + "\n\n" + f["section"]
        readme.write_text(new_text)
        edited += 1
        print(f"  → {f['fork_dir']} (README.md edited)")

        # Commit
        res = subprocess.run(
            ["git", "add", "README.md"],
            capture_output=True, text=True, cwd=str(fork_dir),
        )
        res = subprocess.run(
            ["git", "-c", "user.email=M4@sovereign.local", "-c", "user.name=M4",
             "commit", "-m", "docs: add CSOAI/MEOK Labs MCP servers"],
            capture_output=True, text=True, cwd=str(fork_dir),
        )
        if res.returncode == 0:
            committed += 1
        else:
            print(f"    ✗ commit failed: {res.stderr[:120]}")
            failed += 1
            continue

        # Push
        res = subprocess.run(
            ["git", "push", "origin", "csoai-mcp-servers"],
            capture_output=True, text=True, cwd=str(fork_dir),
        )
        if res.returncode == 0:
            pushed += 1
        else:
            print(f"    ✗ push failed: {res.stderr[:120]}")
            failed += 1

    print()
    print(f"=== SUMMARY ===")
    print(f"  edited:   {edited}")
    print(f"  committed: {committed}")
    print(f"  pushed:   {pushed}")
    print(f"  failed:   {failed}")


if __name__ == "__main__":
    main()
