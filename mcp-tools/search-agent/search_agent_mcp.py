#!/usr/bin/env python3
"""
SOV3 SEARCH AGENT — Move 8
=========================
Autonomous research agent using SearXNG + Qdrant + Synthesis
"""

import asyncio
import json
import httpx
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import List, Dict, Any
from datetime import datetime

class SOV3SearchAgent:
    """
    Autonomous search agent that:
    1. Searches web via SearXNG
    2. Stores results in Qdrant
    3. Synthesizes findings
    4. Generates research report
    """
    
    def __init__(self):
        self.searxng_url = "http://localhost:3105/mcp"
        self.qdrant_url = "http://localhost:3106/mcp"
        self.redis_url = "http://localhost:3107/mcp"
        self.sov3_url = "http://localhost:3101/mcp"
        self.ollama_url = "http://localhost:11434/api/generate"
    
    async def research(self, query: str, depth: int = 3) -> Dict[str, Any]:
        """
        Execute full research workflow
        
        Args:
            query: Research topic
            depth: Number of search iterations (1-5)
        """
        
        print(f"🔍 SOV3 Search Agent: Researching '{query}' (depth={depth})")
        
        # Step 1: Initial search
        search_results = await self._search_web(query)
        
        if not search_results.get("success"):
            return {"success": False, "error": "Search failed"}
        
        # Step 2: Extract key findings
        findings = self._extract_findings(search_results)
        
        # Step 3: Follow-up searches (if depth > 1)
        if depth > 1:
            follow_up_queries = await self._generate_followups(query, findings)
            for fq in follow_up_queries[:depth-1]:
                more_results = await self._search_web(fq)
                if more_results.get("success"):
                    findings.extend(self._extract_findings(more_results))
        
        # Step 4: Store in Qdrant for future reference
        await self._store_findings(query, findings)
        
        # Step 5: Synthesize with local model
        synthesis = await self._synthesize(query, findings)
        
        # Step 6: Cache result
        await self._cache_result(query, synthesis)
        
        return {
            "success": True,
            "query": query,
            "depth": depth,
            "sources_count": len(findings),
            "findings": findings[:10],  # Top 10
            "synthesis": synthesis,
            "timestamp": datetime.now().isoformat()
        }
    
    async def _search_web(self, query: str) -> Dict:
        """Search via SearXNG MCP"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.searxng_url,
                    json={
                        "tool": "searxng_search",
                        "params": {"query": query, "max_results": 10}
                    },
                    timeout=30.0
                )
                return response.json()
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _extract_findings(self, search_results: Dict) -> List[Dict]:
        """Extract key findings from search results"""
        findings = []
        for result in search_results.get("results", []):
            findings.append({
                "title": result.get("title", ""),
                "url": result.get("url", ""),
                "content": result.get("content", "")[:500],
                "engine": result.get("engine", "unknown"),
                "score": result.get("score", 0)
            })
        return findings
    
    async def _generate_followups(self, original_query: str, findings: List[Dict]) -> List[str]:
        """Generate follow-up questions based on findings"""
        # Simple heuristic: extract key terms and create questions
        # In production, use LLM to generate intelligent follow-ups
        
        followups = []
        
        # Extract key entities from findings
        for finding in findings[:3]:
            content = finding.get("content", "")
            # Simple keyword extraction (would use NER in production)
            words = content.split()[:20]
            if len(words) > 5:
                followups.append(f"{original_query} {words[-1]}")
        
        return followups[:2]  # Limit to 2 follow-ups
    
    async def _store_findings(self, query: str, findings: List[Dict]):
        """Store findings in Qdrant"""
        # Create simple embedding (in production, use proper embedding model)
        # For now, store without vector
        
        try:
            async with httpx.AsyncClient() as client:
                # Store as payload-only (no vector for now)
                await client.post(
                    self.qdrant_url,
                    json={
                        "tool": "qdrant_upsert",
                        "params": {
                            "collection": "sov3_memory",
                            "vectors": [
                                {
                                    "id": f"research_{hash(query) % 1000000}",
                                    "vector": [0.0] * 1536,  # Placeholder
                                    "payload": {
                                        "query": query,
                                        "findings": findings,
                                        "timestamp": datetime.now().isoformat()
                                    }
                                }
                            ]
                        }
                    },
                    timeout=10.0
                )
        except Exception as e:
            print(f"Qdrant store error: {e}")
    
    async def _synthesize(self, query: str, findings: List[Dict]) -> str:
        """Synthesize findings using local model"""
        
        # Build context
        context = f"Research Topic: {query}\n\nKey Findings:\n"
        for i, f in enumerate(findings[:5], 1):
            context += f"\n{i}. {f['title']}\n   {f['content'][:200]}...\n"
        
        prompt = f"""Based on the following research findings, provide a concise synthesis (3-5 bullet points):

{context}

Synthesis:"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.ollama_url,
                    json={
                        "model": "hermes3:8b",
                        "prompt": prompt,
                        "stream": False
                    },
                    timeout=60.0
                )
                
                if response.status_code == 200:
                    return response.json().get("response", "Synthesis unavailable")
                else:
                    return f"Synthesis error: {response.status_code}"
        except Exception as e:
            return f"Synthesis failed: {str(e)[:100]}"
    
    async def _cache_result(self, query: str, synthesis: str):
        """Cache result in Redis"""
        try:
            async with httpx.AsyncClient() as client:
                await client.post(
                    self.redis_url,
                    json={
                        "tool": "redis_cache_response",
                        "params": {
                            "query_type": "research",
                            "query_data": query,
                            "response": synthesis,
                            "ttl": 86400  # 24 hours
                        }
                    },
                    timeout=5.0
                )
        except Exception as e:
            print(f"Redis cache error: {e}")


# Initialize agent
agent = SOV3SearchAgent()

class SearchAgentHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            import asyncio
            request = json.loads(post_data)
            tool = request.get('tool')
            params = request.get('params', {})
            
            if tool == 'search_agent_research':
                result = asyncio.run(agent.research(
                    query=params.get('query', ''),
                    depth=params.get('depth', 3)
                ))
            elif tool == 'search_agent_quick':
                result = asyncio.run(agent.research(
                    query=params.get('query', ''),
                    depth=1
                ))
            else:
                result = {"error": f"Unknown tool: {tool}"}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result, default=str).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
    
    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(('localhost', 3108), SearchAgentHandler)
    print("🔍 SOV3 Search Agent running on port 3108")
    print("   Autonomous research using SearXNG + Qdrant")
    print("   Endpoints: /mcp (POST)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
