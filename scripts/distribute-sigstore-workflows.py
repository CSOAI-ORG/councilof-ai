import os
import shutil

flagships = [
    "care-membrane-mcp",
    "eu-ai-act-compliance-mcp",
    "dora-compliance-mcp",
    "nis2-compliance-mcp",
    "gdpr-compliance-ai-mcp",
    "iso-42001-ai-mcp",
    "pci-dss-mcp",
    "hipaa-compliance-mcp",
    "agent-audit-logger-mcp",
    "mcp-scorecard-mcp",
    "meok-mcp-test-mcp",
    "soc2-compliance-ai-mcp",
    "meok-sdk-python", # adjusted from meok-sdk
    "haulage-uk-compliance-mcp", # another likely flagship
    "risk-assessment-ai-mcp"
]

template_src = "/Users/nicholas/clawd/scripts/templates/pypi-sigstore-publish.yml"
marketplace_dir = "/Users/nicholas/clawd/mcp-marketplace"

for name in flagships:
    repo_path = os.path.join(marketplace_dir, name)
    if not os.path.exists(repo_path):
        # try without -mcp
        repo_path = os.path.join(marketplace_dir, name.replace("-mcp", ""))
        if not os.path.exists(repo_path):
            print(f"Skipping {name}, not found in marketplace")
            continue
            
    workflow_dir = os.path.join(repo_path, ".github", "workflows")
    os.makedirs(workflow_dir, exist_ok=True)
    
    dest = os.path.join(workflow_dir, "pypi-publish.yml")
    shutil.copy(template_src, dest)
    print(f"Added Sigstore workflow to {name}")
