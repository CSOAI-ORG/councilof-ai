#!/usr/bin/env python3
"""
Ralph MCP — HTTP Server Wrapper
===============================
Exposes Ralph CEO as HTTP API on port 3201
"""

import asyncio
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import uuid
from datetime import datetime

sys.path.insert(0, '/Users/nicholas/clawd/council-of-mcps/ralph')
from ralph_mcp_server import RalphCEO, Task

ralph = RalphCEO()

class RalphHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            request = json.loads(post_data)
            tool = request.get('tool')
            params = request.get('params', {})
            
            if tool == 'ralph_execute_task':
                task = Task(
                    id=str(uuid.uuid4()),
                    description=params.get('task_description', ''),
                    success_criteria=params.get('success_criteria', ''),
                    max_attempts=params.get('max_attempts', 10),
                    timeout_minutes=params.get('timeout_minutes', 30)
                )
                result = asyncio.run(ralph.execute_task(task))
            elif tool == 'health':
                result = {"status": "ok", "service": "ralph"}
            elif tool == 'ralph_check_status':
                task_id = params.get('task_id', '')
                task = ralph.tasks.get(task_id)
                if task:
                    result = {
                        "task_id": task_id,
                        "status": task.status,
                        "attempts": task.attempts
                    }
                else:
                    result = {"error": f"Task {task_id} not found"}
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
    server = HTTPServer(('localhost', 3201), RalphHandler)
    print("👔 Ralph CEO HTTP Server running on port 3201")
    print("   Persistent execution ready")
    print("   Endpoints: /mcp (POST)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
