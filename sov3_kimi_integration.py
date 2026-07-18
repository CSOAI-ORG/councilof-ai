#!/usr/bin/env python3
"""
SOV3-Kimi-OpenClaw Unified Integration
========================================
Bridges SOV3 MCP, Kimi CLI, and OpenClaw agents into a cohesive stack.

Author: AI Assistant
Created: 2026-04-12
"""

import asyncio
import json
import subprocess
import os
import sys
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("sov3-kimi-integration")

# Paths
CLAWD_DIR = Path("/Users/nicholas/clawd")
SOV3_DIR = CLAWD_DIR / "sovereign-temple"
MCP_BRIDGE_DIR = CLAWD_DIR / "mcp-bridge"


@dataclass
class AgentCapability:
    """Capability definition for agents"""
    name: str
    description: str
    tools: List[str] = field(default_factory=list)
    model: str = ""


@dataclass
class AgentSession:
    """Active agent session"""
    agent_id: str
    agent_type: str  # 'kimi', 'openclaw', 'sov3'
    workspace: Path
    start_time: datetime
    metadata: Dict = field(default_factory=dict)


class KimiCLIAdapter:
    """Adapter for Kimi CLI integration"""
    
    def __init__(self):
        self.available = self._check_kimi()
        
    def _check_kimi(self) -> bool:
        """Check if Kimi CLI is available"""
        try:
            result = subprocess.run(
                ["which", "kimi"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except:
            return False
    
    async def execute(self, prompt: str, thinking: bool = True, 
                      context_files: List[str] = None) -> Dict:
        """Execute Kimi CLI with a prompt"""
        if not self.available:
            return {"error": "Kimi CLI not available"}
        
        # Build context-aware prompt
        full_prompt = self._build_prompt(prompt, context_files)
        
        # Execute via subprocess using print mode for non-interactive run
        cmd = ["kimi", "--print", "-c", full_prompt]
        if thinking:
            cmd.append("--thinking")
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=CLAWD_DIR
            )
            
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=300
            )
            
            output = stdout.decode()
            err_output = stderr.decode()
            
            return {
                "success": proc.returncode == 0,
                "output": output.strip() or err_output.strip(),
                "raw_output": output + err_output,
                "agent": "kimi",
                "timestamp": datetime.now().isoformat()
            }
            
        except asyncio.TimeoutError:
            return {"error": "Kimi CLI timed out after 300s"}
        except Exception as e:
            return {"error": str(e)}
    
    def _build_prompt(self, prompt: str, context_files: List[str] = None) -> str:
        """Build enhanced prompt with context"""
        parts = []
        
        # Add context files if provided
        if context_files:
            parts.append("# Context Files:")
            for f in context_files:
                try:
                    content = Path(f).read_text()
                    parts.append(f"\n## {f}\n```\n{content[:2000]}\n```\n")
                except:
                    pass
        
        parts.append(f"# Task:\n{prompt}")
        
        return "\n".join(parts)
    
    def _clean_output(self, output: str) -> str:
        """Clean Kimi CLI output"""
        lines = output.split('\n')
        result = []
        capture = False
        
        for line in lines:
            # Skip UI elements
            if any(x in line for x in ['─', '█', '╭', '╰', '│', '▌', 'Welcome to Kimi']):
                continue
            if 'Session:' in line or 'Directory:' in line or 'Tip:' in line:
                continue
            if 'input' in line.lower() and '─' in line:
                capture = True
                continue
            if capture and line.strip():
                if 'agent (' in line and 'context:' in line:
                    break
                result.append(line)
        
        return '\n'.join(result).strip()


class OpenClawAdapter:
    """Adapter for OpenClaw agent integration"""
    
    AGENTS = {
        "jarvis": {"emoji": "🤖", "openclaw_id": "gpt-4o"},
        "claude-code": {"emoji": "⚡", "openclaw_id": "gpt-4o"},
        "sov": {"emoji": "👑", "openclaw_id": "o1"},
        "meok": {"emoji": "🔬", "openclaw_id": "gpt-4o-mini"},
        "gemini": {"emoji": "♊", "openclaw_id": "gemini"},
    }
    
    async def execute(self, agent_id: str, prompt: str, 
                      timeout: int = 300) -> Dict:
        """Execute OpenClaw agent"""
        openclaw_id = self.AGENTS.get(agent_id, {}).get("openclaw_id", agent_id)
        cmd = [
            "openclaw", "agent",
            "--agent", openclaw_id,
            "--local",
            "--message", prompt
        ]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=CLAWD_DIR
            )
            
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=timeout
            )
            
            output = stdout.decode() + stderr.decode()
            
            # Clean output
            lines = output.split('\n')
            cleaned = []
            for line in lines:
                if line.startswith('[') and any(x in line for x in ['agent', 'tools', 'Config']):
                    continue
                cleaned.append(line)
            
            return {
                "success": proc.returncode == 0,
                "output": '\n'.join(cleaned).strip(),
                "agent": agent_id,
                "timestamp": datetime.now().isoformat()
            }
            
        except asyncio.TimeoutError:
            return {"error": f"Agent {agent_id} timed out after {timeout}s"}
        except Exception as e:
            return {"error": str(e)}


class SOV3MCPAdapter:
    """Adapter for SOV3 MCP integration"""
    
    def __init__(self, mcp_url: str = "http://localhost:3200"):
        self.mcp_url = mcp_url
        self.tools: List[Dict] = []
        
    async def discover_tools(self) -> List[Dict]:
        """Discover available MCP tools"""
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.mcp_url}/mcp",
                    json={"jsonrpc": "2.0", "method": "tools/list", "id": 1},
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        self.tools = data.get("result", {}).get("tools", [])
                        return self.tools
        except Exception as e:
            log.warning(f"MCP discovery failed: {e}")
            return []
        
        return []
    
    async def execute_tool(self, tool_name: str, arguments: Dict) -> Dict:
        """Execute an MCP tool"""
        import aiohttp
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.mcp_url}/mcp",
                    json={
                        "jsonrpc": "2.0",
                        "id": int(datetime.now().timestamp() * 1000),
                        "method": "tools/call",
                        "params": {"name": tool_name, "arguments": arguments}
                    },
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    else:
                        return {"error": f"HTTP {resp.status}"}
        except Exception as e:
            return {"error": str(e)}


class UnifiedOrchestrator:
    """
    Unified orchestrator that coordinates between:
    - Kimi CLI (for coding tasks)
    - OpenClaw agents (for general tasks)
    - SOV3 MCP (for sovereign tools)
    """
    
    def __init__(self):
        self.kimi = KimiCLIAdapter()
        self.openclaw = OpenClawAdapter()
        self.sov3 = SOV3MCPAdapter()
        self.sessions: Dict[str, AgentSession] = {}
        
    async def route_task(self, task: str, context: Dict = None) -> Dict:
        """Route task to best agent based on content"""
        context = context or {}
        task_lower = task.lower()
        
        # Determine best agent
        if any(k in task_lower for k in ['code', 'debug', 'refactor', 'python', 'javascript', 'typescript', 'rust', 'review']):
            # Code task - use Kimi for deep coding, Claude for architecture
            if context.get('deep_code'):
                return await self.execute_kimi(task, context)
            else:
                return await self.execute_openclaw('claude-code', task)
                
        elif any(k in task_lower for k in ['sov', 'council', 'care', 'memory', 'proposal']):
            # Sovereign tasks
            return await self.execute_sov3_tool(task, context)
            
        elif any(k in task_lower for k in ['strategy', 'plan', 'architecture']):
            return await self.execute_openclaw('sov', task)
            
        elif any(k in task_lower for k in ['research', 'experiment']):
            return await self.execute_openclaw('meok', task)
            
        else:
            # Default to JARVIS
            return await self.execute_openclaw('jarvis', task)
    
    async def execute_kimi(self, task: str, context: Dict = None) -> Dict:
        """Execute via Kimi CLI"""
        log.info(f"🌙 Routing to Kimi: {task[:50]}...")
        
        result = await self.kimi.execute(
            prompt=task,
            thinking=context.get('thinking', True),
            context_files=context.get('files', [])
        )
        
        # Store memory via SOV3
        if result.get('success'):
            await self._store_memory('kimi', task, result['output'])
        
        return result
    
    async def execute_openclaw(self, agent_id: str, task: str) -> Dict:
        """Execute via OpenClaw agent"""
        log.info(f"🤖 Routing to {agent_id}: {task[:50]}...")
        
        result = await self.openclaw.execute(agent_id, task)
        
        # Store memory
        if result.get('success'):
            await self._store_memory(agent_id, task, result['output'])
        
        return result
    
    async def execute_sov3_tool(self, task: str, context: Dict = None) -> Dict:
        """Execute via SOV3 MCP tool"""
        log.info(f"👑 Routing to SOV3: {task[:50]}...")
        
        # Parse task to determine tool
        tool_name = self._infer_sov3_tool(task)
        
        result = await self.sov3.execute_tool(tool_name, {
            "query": task,
            **context.get('tool_args', {})
        })
        
        return result
    
    def _infer_sov3_tool(self, task: str) -> str:
        """Infer which SOV3 tool to use"""
        task_lower = task.lower()
        
        if 'memory' in task_lower or 'remember' in task_lower:
            return 'record_memory'
        elif 'search' in task_lower or 'find' in task_lower:
            return 'query_memories'
        elif 'council' in task_lower or 'vote' in task_lower:
            return 'submit_council_proposal'
        elif 'care' in task_lower:
            return 'validate_care'
        elif 'agent' in task_lower:
            return 'delegate_task'
        else:
            return 'get_system_status'
    
    async def _store_memory(self, agent: str, task: str, result: str):
        """Store execution in SOV3 memory"""
        try:
            await self.sov3.execute_tool('record_memory', {
                'content': f"Agent: {agent}\nTask: {task}\nResult: {result[:500]}",
                'source_agent': agent,
                'memory_type': 'interaction',
                'tags': [agent, 'automated']
            })
        except:
            pass  # Non-critical
    
    async def swarm_execute(self, task: str, agents: List[str] = None) -> Dict:
        """Execute with multiple agents and synthesize"""
        agents = agents or ['kimi', 'claude-code']
        log.info(f"🐝 Swarm mode with {agents}")
        
        # Execute all agents in parallel
        tasks = []
        for agent in agents:
            if agent == 'kimi':
                t = self.execute_kimi(task, {'thinking': True})
            else:
                t = self.execute_openclaw(agent, task)
            tasks.append(t)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Synthesize with Claude
        synthesis_prompt = f"""Synthesize these agent responses into a unified solution:

Task: {task}

"""
        valid_results = []
        for i, r in enumerate(results):
            if isinstance(r, dict) and 'output' in r:
                valid_results.append({'agent': agents[i], 'output': r['output']})
                synthesis_prompt += f"\n{agents[i].upper()}:\n{r['output'][:800]}...\n"
        
        synthesis = await self.execute_openclaw('claude-code', synthesis_prompt)
        
        return {
            "individual": valid_results,
            "synthesis": synthesis.get('output', ''),
            "timestamp": datetime.now().isoformat()
        }


# CLI Interface
async def main():
    """CLI for unified orchestrator"""
    import argparse
    
    parser = argparse.ArgumentParser(description='SOV3-Kimi-OpenClaw Unified Integration')
    parser.add_argument('task', help='Task to execute')
    parser.add_argument('--agent', '-a', choices=['kimi', 'claude-code', 'jarvis', 'sov', 'meok', 'swarm'],
                       default=None, help='Force specific agent')
    parser.add_argument('--files', '-f', nargs='+', help='Context files')
    parser.add_argument('--thinking', '-t', action='store_true', help='Enable thinking mode')
    
    args = parser.parse_args()
    
    orchestrator = UnifiedOrchestrator()
    
    context = {
        'files': args.files or [],
        'thinking': args.thinking
    }
    
    if args.agent == 'swarm':
        result = await orchestrator.swarm_execute(args.task)
    elif args.agent:
        if args.agent == 'kimi':
            result = await orchestrator.execute_kimi(args.task, context)
        else:
            result = await orchestrator.execute_openclaw(args.agent, args.task)
    else:
        result = await orchestrator.route_task(args.task, context)
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
