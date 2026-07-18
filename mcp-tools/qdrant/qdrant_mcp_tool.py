#!/usr/bin/env python3
"""
Qdrant MCP Tool — Vector Search Integration
==========================================
Port: 3106
Function: High-performance vector search for SOV3
"""

import json
import httpx
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import List, Dict, Any, Optional
import uuid

QDRANT_URL = "http://localhost:6333"

class QdrantClient:
    """Client for Qdrant vector database"""
    
    def __init__(self):
        self.url = QDRANT_URL
        self.default_collection = "sov3_memory"
    
    async def create_collection(
        self,
        name: str,
        dimension: int = 1536,
        distance: str = "Cosine"
    ) -> Dict[str, Any]:
        """Create a new collection"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.url}/collections/{name}",
                    json={
                        "vectors": {
                            "size": dimension,
                            "distance": distance
                        }
                    },
                    timeout=10.0
                )
                
                if response.status_code in [200, 201]:
                    return {
                        "success": True,
                        "collection": name,
                        "dimension": dimension,
                        "distance": distance
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Qdrant returned {response.status_code}",
                        "response": response.text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def upsert(
        self,
        collection: str,
        vectors: List[Dict[str, Any]],
        wait: bool = True
    ) -> Dict[str, Any]:
        """
        Upsert vectors into collection
        
        vectors: [{"id": "uuid", "vector": [...], "payload": {...}}]
        """
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.url}/collections/{collection}/points?wait={'true' if wait else 'false'}",
                    json={"points": vectors},
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "operation_id": result.get("operation_id"),
                        "status": result.get("status"),
                        "points_count": len(vectors)
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Qdrant returned {response.status_code}",
                        "response": response.text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def search(
        self,
        collection: str,
        vector: List[float],
        top_k: int = 10,
        filter_conditions: Optional[Dict] = None,
        with_payload: bool = True
    ) -> Dict[str, Any]:
        """Search for similar vectors"""
        
        try:
            payload = {
                "vector": vector,
                "limit": top_k,
                "with_payload": with_payload
            }
            
            if filter_conditions:
                payload["filter"] = filter_conditions
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.url}/collections/{collection}/points/search",
                    json=payload,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "success": True,
                        "results": result.get("result", []),
                        "count": len(result.get("result", [])),
                        "collection": collection
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Qdrant returned {response.status_code}",
                        "response": response.text
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_collection_info(self, collection: str) -> Dict[str, Any]:
        """Get collection information"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.url}/collections/{collection}",
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "info": response.json().get("result", {})
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Qdrant returned {response.status_code}"
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def delete_points(
        self,
        collection: str,
        point_ids: List[str]
    ) -> Dict[str, Any]:
        """Delete points by ID"""
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.url}/collections/{collection}/points/delete",
                    json={"points": point_ids},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "deleted_count": len(point_ids)
                    }
                else:
                    return {
                        "success": False,
                        "error": f"Qdrant returned {response.status_code}"
                    }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }


# Initialize client
qdrant = QdrantClient()

class QdrantHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            import asyncio
            request = json.loads(post_data)
            tool = request.get('tool')
            params = request.get('params', {})
            
            if tool == 'qdrant_create_collection':
                result = asyncio.run(qdrant.create_collection(
                    name=params.get('name', 'sov3_memory'),
                    dimension=params.get('dimension', 1536),
                    distance=params.get('distance', 'Cosine')
                ))
            elif tool == 'qdrant_upsert':
                result = asyncio.run(qdrant.upsert(
                    collection=params.get('collection', 'sov3_memory'),
                    vectors=params.get('vectors', []),
                    wait=params.get('wait', True)
                ))
            elif tool == 'qdrant_search':
                result = asyncio.run(qdrant.search(
                    collection=params.get('collection', 'sov3_memory'),
                    vector=params.get('vector', []),
                    top_k=params.get('top_k', 10),
                    filter_conditions=params.get('filter'),
                    with_payload=params.get('with_payload', True)
                ))
            elif tool == 'qdrant_get_collection_info':
                result = asyncio.run(qdrant.get_collection_info(
                    collection=params.get('collection', 'sov3_memory')
                ))
            elif tool == 'qdrant_delete_points':
                result = asyncio.run(qdrant.delete_points(
                    collection=params.get('collection', 'sov3_memory'),
                    point_ids=params.get('point_ids', [])
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
    server = HTTPServer(('localhost', 3106), QdrantHandler)
    print("🎯 Qdrant MCP Tool running on port 3106")
    print("   High-performance vector search for SOV3")
    print("   Endpoints: /mcp (POST)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
