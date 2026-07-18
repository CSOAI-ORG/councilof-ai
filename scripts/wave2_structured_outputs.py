#!/usr/bin/env python3
"""Wave 2: Add Pydantic output schemas + structuredContent to top 10 MCPs.

Pattern: For each top MCP, add Pydantic models for key tool outputs 
and a helper that wraps returns in {content: [...], structuredContent: ...}
"""
import os

BASE = os.path.expanduser("~/clawd/mcp-marketplace")

# Enhanced return helper to insert into each server.py
RETURN_HELPER = '''

# ── Structured Output Helpers ─────────────────────────────────

def structured_output(data, summary: str = ""):
    """Return MCP-compatible structured output with both LLM text and protocol-level data.
    
    Args:
        data: The result data (dict, list, or Pydantic model)
        summary: Brief human-readable summary for the LLM (auto-generated if empty)
    """
    if hasattr(data, 'model_dump'):
        data_dict = data.model_dump()
    else:
        data_dict = data
    
    if not summary:
        # Auto-generate summary from key fields
        parts = []
        for k, v in list(data_dict.items())[:3]:
            if isinstance(v, (str, int, float)):
                parts.append(f"{k}: {v}")
        summary = " | ".join(parts) if parts else "Result"
    
    return {
        "content": [{"type": "text", "text": summary + "\\n\\n" + str(data_dict)}],
        "structuredContent": data_dict,
        **data_dict  # Legacy compatibility
    }


def error_output(message: str, code: str = "INTERNAL_ERROR", upgrade_url: str = ""):
    """Return structured error output."""
    result = {
        "content": [{"type": "text", "text": f"Error: {message}"}],
        "structuredContent": {"error": message, "code": code},
        "error": message,
        "code": code
    }
    if upgrade_url:
        result["structuredContent"]["upgrade_url"] = upgrade_url
        result["upgrade_url"] = upgrade_url
    return result
'''

# Template for common output models
COMMON_MODELS = '''
from pydantic import BaseModel, Field
from typing import Optional

class ComplianceResult(BaseModel):
    """Standard compliance check result."""
    status: str = Field(description="PASS, FAIL, or WARNING")
    score: float = Field(description="Compliance score 0-100", ge=0, le=100)
    findings: list[str] = Field(default_factory=list, description="List of findings")
    recommendations: list[str] = Field(default_factory=list, description="Recommended actions")
    framework: str = Field(default="", description="Compliance framework assessed")
    timestamp: str = Field(default="", description="ISO timestamp of assessment")
'''

fixed = 0
for entry in sorted(os.listdir(BASE)):
    server_path = os.path.join(BASE, entry, "server.py")
    if not os.path.isfile(server_path):
        continue

    with open(server_path, "r") as f:
        content = f.read()

    # Skip if already has structured_output
    if "def structured_output" in content:
        continue

    # Only add to top 'compliance' servers (skip lifestyle/niche)
    compliance_keywords = ['compliance', 'iso', 'nis2', 'dora', 'cra', 'gdpr',
                           'governance', 'soc2', 'bias', 'audit', 'attest',
                           'bom', 'trust', 'watermark', 'omnibus', 'dpia',
                           'healthcare', 'firewall', 'care', 'proofof',
                           'agent-orchestrator', 'agent-delegation', 'rag-knowledge',
                           'web-research', 'code-executor', 'memory-search',
                           'security-scanner', 'ai-gateway', 'ai-ops',
                           'scam-detector', 'credential-manager']
    
    if not any(kw in entry.lower() for kw in compliance_keywords):
        continue

    # Find where to insert — after the last import, before the first tool
    import re
    # Insert after mcp = FastMCP(...) or similar server init
    mcp_init = re.search(r'(mcp\s*=\s*FastMCP\([^)]+\))', content)
    if mcp_init:
        insert_at = mcp_init.end()
        new_content = (
            content[:insert_at]
            + RETURN_HELPER
            + content[insert_at:]
        )
    else:
        # Fallback: insert before first @mcp.tool()
        first_tool = content.find('@mcp.tool()')
        if first_tool > 0:
            # Find the newline before it
            insert_at = content.rfind('\n', 0, first_tool)
            new_content = (
                content[:insert_at]
                + '\n' + RETURN_HELPER
                + content[insert_at:]
            )
        else:
            continue

    with open(server_path, "w") as f:
        f.write(new_content)
    fixed += 1

print(f"✅ Added structured output helpers to {fixed} servers")
