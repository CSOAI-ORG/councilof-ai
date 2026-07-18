#!/bin/bash
# GLAMA SUBMISSION AUTOMATION
# Opens Glama submission page for each MCP

echo "🚀 OPENING GLAMA SUBMISSION PAGES"
echo "================================"
echo ""
echo "Submit each MCP at: https://glama.ai/mcp-servers"
echo ""

MCPS=(
  "care-membrane-mcp:AI governance with care ethics"
  "eu-ai-act-compliance-mcp:EU AI Act compliance checking"
  "proofof-ai-mcp:Digital content verification and deepfake detection"
  "ai-self-audit-mcp:AI systems that audit their own compliance"
  "web-research-mcp:Intelligent web research with source validation"
  "memory-search-mcp:Long-term memory and context retrieval"
  "code-executor-mcp:Secure code execution in sandboxed environments"
  "agent-orchestrator-mcp:Multi-agent orchestration with routing"
  "agent-delegation-mcp:Create and delegate tasks to specialized agents"
  "agent-negotiation-mcp:Multi-agent negotiation framework"
)

for item in "${MCPS[@]}"; do
  IFS=':' read -r name desc <<< "$item"
  echo "📎 $name"
  echo "   Description: $desc"
  echo "   GitHub: https://github.com/CSOAI-ORG/$name"
  echo "   Submit: https://glama.ai/mcp-servers"
  echo ""
  
  # Open browser (macOS)
  # open "https://glama.ai/mcp-servers"
done

echo "================================"
echo "✅ Copy the details above into Glama"
echo "📋 Template available at: ~/clawd/GLAMA_SUBMISSIONS.md"
