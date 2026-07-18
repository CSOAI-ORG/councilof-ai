#!/usr/bin/env python3
"""
MoE MCP — HTTP Server Wrapper
=============================
Exposes MoE Council as HTTP API on port 3104
"""

import asyncio
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys

sys.path.insert(0, '/Users/nicholas/clawd/council-of-mcps/moe')
from moe_mcp_server import MoECouncil

moe = MoECouncil()

class MoEHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            request = json.loads(post_data)
            tool = request.get('tool')
            params = request.get('params', {})
            
            if tool == 'moe_route':
                result = asyncio.run(moe.generate(params))
            elif tool == 'health':
                result = {"status": "ok", "service": "moe"}
            elif tool == 'moe_ensemble':
                num = params.get('num_experts', 3)
                result = asyncio.run(moe.ensemble(params, num))
            elif tool == 'moe_list_experts':
                experts = [
                    {
                        "id": e.id,
                        "name": e.name,
                        "provider": e.provider,
                        "specialties": e.specialties
                    }
                    for e in moe.experts
                ]
                result = {"experts": experts, "count": len(experts)}
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
    server = HTTPServer(('localhost', 3104), MoEHandler)
    print("🎯 MoE Council HTTP Server running on port 3104")
    print("   9 experts ready")
    print("   Endpoints: /mcp (POST)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
