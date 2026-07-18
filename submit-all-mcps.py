#!/usr/bin/env python3
"""
SUBMIT ALL MCPS TO EVERY PLATFORM
Glama + Smithery + Pulse + mcpservers.org
"""

import requests
import json
import time

# API Keys
GLAMA_KEY = "dfcecbca-d8a5-47ad-be79-ce6ef7fb8172"
SMITHERY_KEY = "85122bd6-b874-4ff0-a8ec-9d1b4dbdb842"

# MCPs to submit
MCPS = [
    {
        "name": "care-membrane-mcp",
        "description": "AI governance with care ethics. Validate AI actions against 16-probe care membrane framework based on Noddings/Tronto care ethics.",
        "github": "https://github.com/CSOAI-ORG/care-membrane-mcp",
        "category": "AI Governance",
        "tags": ["ai-governance", "compliance", "care-ethics", "meok"]
    },
    {
        "name": "eu-ai-act-compliance-mcp",
        "description": "EU AI Act compliance checking and risk classification. Automated compliance validation for high-risk AI systems.",
        "github": "https://github.com/CSOAI-ORG/eu-ai-act-compliance-mcp",
        "category": "Compliance",
        "tags": ["eu-ai-act", "compliance", "regulation", "gdpr"]
    },
    {
        "name": "proofof-ai-mcp",
        "description": "Digital content verification and deepfake detection. Verify text authenticity, detect AI-generated images, generate blockchain-anchored certificates.",
        "github": "https://github.com/CSOAI-ORG/proofof-ai-mcp",
        "category": "Security",
        "tags": ["deepfake", "verification", "c2pa", "content-authenticity"]
    },
    {
        "name": "ai-self-audit-mcp",
        "description": "AI systems that audit their own compliance in real-time. Continuous monitoring for EU AI Act, ISO 42001, NIST AI RMF.",
        "github": "https://github.com/CSOAI-ORG/ai-self-audit-mcp",
        "category": "Compliance",
        "tags": ["audit", "compliance", "self-monitoring", "governance"]
    },
    {
        "name": "web-research-mcp",
        "description": "Intelligent web research with source validation. Automated research synthesis with citation tracking.",
        "github": "https://github.com/CSOAI-ORG/web-research-mcp",
        "category": "Research",
        "tags": ["research", "web-scraping", "citations", "knowledge"]
    },
    {
        "name": "memory-search-mcp",
        "description": "Long-term memory and context retrieval for AI agents. Semantic search across conversation history.",
        "github": "https://github.com/CSOAI-ORG/memory-search-mcp",
        "category": "Memory",
        "tags": ["memory", "search", "semantic", "context"]
    },
    {
        "name": "code-executor-mcp",
        "description": "Secure code execution in sandboxed environments. Run Python, JavaScript, and shell commands safely.",
        "github": "https://github.com/CSOAI-ORG/code-executor-mcp",
        "category": "Development",
        "tags": ["code-execution", "sandbox", "developer-tools"]
    },
    {
        "name": "agent-orchestrator-mcp",
        "description": "Multi-agent orchestration with capability-based routing. Coordinate teams of AI agents.",
        "github": "https://github.com/CSOAI-ORG/agent-orchestrator-mcp",
        "category": "Orchestration",
        "tags": ["orchestration", "multi-agent", "workflow"]
    },
    {
        "name": "agent-delegation-mcp",
        "description": "Create and delegate tasks to specialized agents. Auto-matching based on capabilities.",
        "github": "https://github.com/CSOAI-ORG/agent-delegation-mcp",
        "category": "Automation",
        "tags": ["delegation", "task-management", "automation"]
    },
    {
        "name": "agent-negotiation-mcp",
        "description": "Multi-agent negotiation framework with deal evaluation and auction support.",
        "github": "https://github.com/CSOAI-ORG/agent-negotiation-mcp",
        "category": "AI Economy",
        "tags": ["negotiation", "auctions", "multi-agent", "economy"]
    }
]

def submit_to_glama(mcp):
    """Submit to Glama"""
    url = "https://glama.ai/api/mcp-servers"
    headers = {
        "Authorization": f"Bearer {GLAMA_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "name": mcp["name"],
        "description": mcp["description"],
        "repositoryUrl": mcp["github"],
        "category": mcp["category"],
        "tags": mcp["tags"]
    }
    
    try:
        response = requests.post(url, json=data, headers=headers, timeout=30)
        if response.status_code in [200, 201]:
            return True, "Submitted"
        elif response.status_code == 409:
            return True, "Already exists"
        else:
            return False, f"HTTP {response.status_code}"
    except Exception as e:
        return False, str(e)

def submit_to_smithery(mcp):
    """Submit to Smithery"""
    url = "https://smithery.ai/api/mcp-servers"
    headers = {
        "Authorization": f"Bearer {SMITHERY_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "name": mcp["name"],
        "description": mcp["description"],
        "repositoryUrl": mcp["github"],
        "tags": mcp["tags"]
    }
    
    try:
        response = requests.post(url, json=data, headers=headers, timeout=30)
        if response.status_code in [200, 201]:
            return True, "Submitted"
        elif response.status_code == 409:
            return True, "Already exists"
        else:
            return False, f"HTTP {response.status_code}"
    except Exception as e:
        return False, str(e)

def main():
    print("🚀 SUBMITTING TO ALL PLATFORMS")
    print("=" * 70)
    print()
    
    results = []
    
    for i, mcp in enumerate(MCPS, 1):
        print(f"[{i}/10] {mcp['name']}")
        
        # Glama
        success_glama, msg_glama = submit_to_glama(mcp)
        status_glama = "✅" if success_glama else "❌"
        print(f"   Glama: {status_glama} {msg_glama}")
        
        # Smithery
        success_smithery, msg_smithery = submit_to_smithery(mcp)
        status_smithery = "✅" if success_smithery else "❌"
        print(f"   Smithery: {status_smithery} {msg_smithery}")
        
        results.append({
            "mcp": mcp["name"],
            "glama": success_glama,
            "smithery": success_smithery
        })
        
        time.sleep(1)  # Rate limiting
        print()
    
    # Summary
    print("=" * 70)
    print("📊 SUBMISSION SUMMARY")
    print()
    
    glama_success = sum(1 for r in results if r["glama"])
    smithery_success = sum(1 for r in results if r["smithery"])
    
    print(f"Glama: {glama_success}/10 submitted")
    print(f"Smithery: {smithery_success}/10 submitted")
    print()
    print("📋 MANUAL SUBMISSIONS REQUIRED:")
    print("   - Pulse MCP: https://www.pulsemcp.com/submit")
    print("   - mcpservers.org: https://mcpservers.org/submit")
    print()
    print("🎉 Done! Check your email for approval notifications.")

if __name__ == "__main__":
    main()
