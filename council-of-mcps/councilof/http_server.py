#!/usr/bin/env python3
"""
CouncilOf MCP — HTTP Server Wrapper
====================================
Exposes CouncilOf as HTTP API on port 3103
"""

import asyncio
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
import sys

# Add parent to path
sys.path.insert(0, '/Users/nicholas/clawd/council-of-mcps/councilof')
from councilof_mcp_server import CouncilOfMCP

# Initialize council
council = CouncilOfMCP()

class CouncilOfHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            request = json.loads(post_data)
            tool = request.get('tool')
            params = request.get('params', {})
            
            # Route to appropriate method
            if tool == 'councilof_vote':
                result = asyncio.run(council.vote(params))
            elif tool == 'health':
                result = {"status": "ok", "service": "councilof"}
            elif tool == 'councilof_audit':
                result = asyncio.run(council.audit(params.get('work_product', {})))
            elif tool == 'councilof_get_node_status':
                nodes = [
                    {"id": n.id, "name": n.name, "type": n.node_type, "status": n.status}
                    for n in council.nodes
                ]
                result = {"nodes": nodes, "total": len(nodes)}
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
        # Suppress default logging
        pass

def run_server():
    server = HTTPServer(('localhost', 3103), CouncilOfHandler)
    print("⚖️  CouncilOf MCP HTTP Server running on port 3103")
    print("   33 council members ready")
    print("   Endpoints: /mcp (POST)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
