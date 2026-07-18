#!/usr/bin/env python3
"""
SearXNG MCP Tool — Web Search Integration
========================================
Port: 3105
Function: Self-hosted meta-search for SOV3
"""

import json
import httpx
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import List, Dict, Any

SEARXNG_URL = "http://localhost:8080"

class SearXNGClient:
    """Client for SearXNG meta-search"""
    
    async def search(
        self,
        query: str,
        categories: List[str] = None,
        engines: List[str] = None,
        language: str = "en-US",
        safesearch: int = 0,
        max_results: int = 10
    ) -> Dict[str, Any]:
        """
        Search using SearXNG meta-search
        
        Args:
            query: Search query
            categories: ['general', 'images', 'news', 'videos', 'it', 'science']
            engines: Specific engines to use
            language: Language code
            safesearch: 0=off, 1=moderate, 2=strict
            max_results: Max results to return
        """
        
        params = {
            "q": query,
            "format": "json",
            "language": language,
            "safesearch": safesearch
        }
        
        if categories:
            params["categories"] = ",".join(categories)
        if engines:
            params["engines"] = ",".join(engines)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{SEARXNG_URL}/search",
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Process results
                    results = []
                    for result in data.get("results", [])[:max_results]:
                        results.append({
                            "title": result.get("title", ""),
                            "url": result.get("url", ""),
                            "content": result.get("content", ""),
                            "engine": result.get("engine", "unknown"),
                            "score": result.get("score", 0)
                        })
                    
                    return {
                        "success": True,
                        "query": query,
                        "results_count": len(results),
                        "results": results,
                        "engines_used": list(set(r["engine"] for r in results)),
                        "search_url": f"{SEARXNG_URL}/search?q={query.replace(' ', '+')}"
                    }
                else:
                    return {
                        "success": False,
                        "error": f"SearXNG returned {response.status_code}",
                        "query": query
                    }
                    
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query": query
            }
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get SearXNG instance stats"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{SEARXNG_URL}/stats",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "stats": response.json()
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Stats endpoint returned {response.status_code}"
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Initialize client
searxng = SearXNGClient()

class SearXNGHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            import asyncio
            request = json.loads(post_data)
            tool = request.get('tool')
            params = request.get('params', {})
            
            if tool == 'searxng_search':
                result = asyncio.run(searxng.search(
                    query=params.get('query', ''),
                    categories=params.get('categories'),
                    engines=params.get('engines'),
                    language=params.get('language', 'en-US'),
                    safesearch=params.get('safesearch', 0),
                    max_results=params.get('max_results', 10)
                ))
            elif tool == 'searxng_stats':
                result = asyncio.run(searxng.get_stats())
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
    server = HTTPServer(('localhost', 3105), SearXNGHandler)
    print("🔍 SearXNG MCP Tool running on port 3105")
    print("   Self-hosted meta-search for SOV3")
    print("   Endpoints: /mcp (POST)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
