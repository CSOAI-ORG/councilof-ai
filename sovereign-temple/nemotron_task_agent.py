#!/usr/bin/env python3
"""
Nemotron Task Agent for Sovereign Temple
Registers Nemotron as an agent that can handle care-centered and reasoning tasks
"""

import asyncio
import json
import os
import urllib.request
from typing import Dict, Any, Optional

MCP_URL = os.getenv("MCP_URL", "http://localhost:3200/mcp")


def call_mcp_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Call an MCP tool"""
    try:
        payload = {
            "jsonrpc": "2.0",
            "id": "nemotron-agent",
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": arguments},
        }

        req = urllib.request.Request(
            MCP_URL,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode())
            if "result" in result and "content" in result["result"]:
                return json.loads(result["result"]["content"][0]["text"])
            return result
    except Exception as e:
        return {"error": str(e)}


class NemotronTaskAgent:
    """
    Nemotron Task Agent - handles care-centered and deep reasoning tasks

    This agent integrates NVIDIA Nemotron 3 Nano 30B into the Sovereign Temple
    multi-agent system, allowing Sov3 to delegate tasks requiring:
    - Deep reasoning and analysis
    - Care-centered responses
    - Emotional intelligence
    - Creative writing
    """

    AGENT_ID = "nemotron-30b-agent"
    AGENT_TYPE = "nvidia-nemotron"

    CAPABILITIES = [
        "deep_reasoning",
        "care_dialogue",
        "emotional_analysis",
        "creative_writing",
        "text_analysis",
        "question_answering",
        "summarization",
    ]

    def __init__(self):
        self.registered = False
        self.api_available = False

    def check_api_status(self) -> bool:
        """Check if Nemotron API is configured"""
        info = call_mcp_tool("nemotron_info", {})
        self.api_available = info.get("api_configured", False)
        return self.api_available

    def register_with_sovereign(self) -> bool:
        """Register this agent with Sovereign's agent registry"""
        result = call_mcp_tool(
            "coord_register_agent",
            {
                "agent_id": self.AGENT_ID,
                "agent_type": "kimi-cli",  # Using kimi-cli type for external AI
                "capabilities": self.CAPABILITIES,
            },
        )

        if "error" not in result:
            self.registered = True
            print(f"✅ Nemotron agent registered as '{self.AGENT_ID}'")
            return True
        else:
            print(f"⚠️ Registration warning: {result.get('error')}")
            return False

    def process_task(
        self, task_description: str, task_type: str = "general"
    ) -> Dict[str, Any]:
        """
        Process a task using Nemotron

        Task types:
        - care_response: Generate care-centered response
        - analyze_care: Analyze text for care patterns
        - chat: General chat/conversation
        - reasoning: Deep reasoning task
        """
        if not self.api_available and not self.check_api_status():
            return {
                "error": "Nemotron API not configured. Set NVIDIA_API_KEY in .env",
                "status": "unavailable",
            }

        if task_type == "care_response":
            return call_mcp_tool(
                "nemotron_care_response", {"message": task_description}
            )

        elif task_type == "analyze_care":
            return call_mcp_tool("nemotron_analyze_care", {"text": task_description})

        else:  # general chat/reasoning
            # Create a system prompt based on task type
            system_prompt = self._get_system_prompt(task_type)
            return call_mcp_tool(
                "nemotron_chat",
                {
                    "message": task_description,
                    "system_prompt": system_prompt,
                    "temperature": 0.7,
                    "max_tokens": 2048,
                },
            )

    def _get_system_prompt(self, task_type: str) -> Optional[str]:
        """Get appropriate system prompt for task type"""
        prompts = {
            "reasoning": """You are a deep reasoning assistant. Think step-by-step, consider multiple perspectives, 
            and provide thorough analysis. Be precise and rigorous in your thinking.""",
            "creative": """You are a creative writing assistant. Help generate creative, original content 
            with flair and imagination while maintaining appropriateness.""",
            "analysis": """You are an analytical assistant. Break down complex topics clearly, 
            identify key patterns, and provide structured insights.""",
            "emotional_support": """You are an emotionally supportive assistant. Provide warm, 
            empathetic responses that validate feelings and offer constructive guidance.""",
        }
        return prompts.get(task_type)

    def get_agent_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        info = call_mcp_tool("nemotron_info", {})
        return {
            "agent_id": self.AGENT_ID,
            "registered": self.registered,
            "api_available": self.api_available,
            "capabilities": self.CAPABILITIES,
            "nemotron_info": info,
        }


async def main():
    """Demo and setup script"""
    print("🚀 Nemotron Task Agent Setup")
    print("=" * 50)

    agent = NemotronTaskAgent()

    # Check API status
    print("\n1️⃣ Checking Nemotron API status...")
    if agent.check_api_status():
        print("   ✅ Nemotron API is configured and ready")
    else:
        print("   ⚠️  Nemotron API key not set")
        print(
            "   💡 Get your free API key from: https://build.nvidia.com/nvidia/nemotron-3-nano-30b-a3b-bf16"
        )

    # Register with Sovereign
    print("\n2️⃣ Registering with Sovereign agent registry...")
    agent.register_with_sovereign()

    # Show status
    print("\n3️⃣ Agent Status:")
    status = agent.get_agent_status()
    print(f"   ID: {status['agent_id']}")
    print(f"   Registered: {status['registered']}")
    print(f"   API Available: {status['api_available']}")
    print(f"   Capabilities: {', '.join(status['capabilities'])}")

    # Demo task if API is available
    if agent.api_available:
        print("\n4️⃣ Testing with a sample task...")
        result = agent.process_task(
            "What are three ways to practice digital wellness?", task_type="reasoning"
        )
        if result.get("success"):
            print(f"   ✅ Response received:")
            print(f"   {result['response'][:200]}...")
        else:
            print(f"   ⚠️  Error: {result.get('error')}")

    print("\n" + "=" * 50)
    print("Nemotron Task Agent ready!")
    print("\nUsage from Sovereign:")
    print("  - Use tool: coord_submit_task")
    print("  - Or call nemotron_chat/nemotron_care_response directly")


if __name__ == "__main__":
    asyncio.run(main())
