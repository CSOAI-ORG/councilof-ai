#!/usr/bin/env python3
"""
SOV3 Health Dashboard — Move 10
===============================
Real-time status of all SOV3 components
Port: 3109
"""

import json
import asyncio
import httpx
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
from typing import Dict, List, Any

class HealthMonitor:
    """Monitor all SOV3 components"""
    
    def __init__(self):
        self.components = {
            # Core Services
            "sov3_core": {"url": "http://localhost:3101/mcp", "tool": "get_system_status"},
            "councilof": {"url": "http://localhost:3103/mcp", "tool": "councilof_get_node_status"},
            "moe": {"url": "http://localhost:3104/mcp", "tool": "moe_list_experts"},
            "ralph": {"url": "http://localhost:3201/mcp", "tool": "ralph_check_status"},
            
            # MCP Tools
            "searxng_mcp": {"url": "http://localhost:3105/mcp", "tool": "searxng_stats"},
            "qdrant_mcp": {"url": "http://localhost:3106/mcp", "tool": "qdrant_get_collection_info"},
            "redis_mcp": {"url": "http://localhost:3107/mcp", "tool": "redis_health"},
            "search_agent": {"url": "http://localhost:3108/mcp", "tool": "search_agent_quick"},
            
            # Infrastructure
            "searxng": {"url": "http://localhost:8080/healthz", "type": "http"},
            "qdrant": {"url": "http://localhost:6333/healthz", "type": "http"},
            "redis": {"url": "http://localhost:6379", "type": "tcp"},
            "ollama": {"url": "http://localhost:11434/api/tags", "type": "http"},
        }
    
    async def check_all(self) -> Dict[str, Any]:
        """Check health of all components"""
        
        results = {}
        healthy_count = 0
        
        for name, config in self.components.items():
            status = await self._check_component(name, config)
            results[name] = status
            if status.get("healthy"):
                healthy_count += 1
        
        total = len(self.components)
        health_percentage = (healthy_count / total) * 100 if total > 0 else 0
        
        return {
            "timestamp": datetime.now().isoformat(),
            "overall_health": {
                "healthy": healthy_count,
                "total": total,
                "percentage": round(health_percentage, 1),
                "status": "healthy" if health_percentage >= 90 else "degraded" if health_percentage >= 70 else "critical"
            },
            "components": results
        }
    
    async def _check_component(self, name: str, config: Dict) -> Dict:
        """Check single component"""
        
        start_time = datetime.now()
        
        try:
            url = config.get("url", "")
            check_type = config.get("type", "mcp")
            
            async with httpx.AsyncClient() as client:
                if check_type == "http":
                    response = await client.get(url, timeout=5.0)
                    healthy = response.status_code == 200
                elif check_type == "tcp":
                    # Simple TCP check
                    import socket
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(2)
                    parts = url.replace("http://", "").split(":")
                    host = parts[0]
                    port = int(parts[1]) if len(parts) > 1 else 80
                    result = sock.connect_ex((host, port))
                    healthy = result == 0
                    sock.close()
                else:
                    # MCP check
                    response = await client.post(
                        url,
                        json={"tool": config.get("tool", "health"), "params": {}},
                        timeout=5.0
                    )
                    healthy = response.status_code == 200
            
            elapsed = (datetime.now() - start_time).total_seconds()
            
            return {
                "healthy": healthy,
                "latency_ms": round(elapsed * 1000, 2),
                "url": url,
                "last_check": datetime.now().isoformat()
            }
            
        except Exception as e:
            elapsed = (datetime.now() - start_time).total_seconds()
            return {
                "healthy": False,
                "error": str(e)[:50],
                "latency_ms": round(elapsed * 1000, 2),
                "url": config.get("url"),
                "last_check": datetime.now().isoformat()
            }
    
    def generate_html_dashboard(self, health: Dict) -> str:
        """Generate HTML dashboard"""
        
        overall = health.get("overall_health", {})
        status_color = {
            "healthy": "#00ff00",
            "degraded": "#ffaa00",
            "critical": "#ff0000"
        }.get(overall.get("status"), "#ff0000")
        
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>SOV3 Health Dashboard</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            margin: 0;
            padding: 20px;
        }}
        .header {{
            text-align: center;
            padding: 20px;
            border-bottom: 2px solid #333;
        }}
        .header h1 {{
            color: #00ff88;
            margin: 0;
            font-size: 2.5em;
        }}
        .overall {{
            text-align: center;
            padding: 30px;
            background: #1a1a1a;
            border-radius: 10px;
            margin: 20px 0;
        }}
        .health-percentage {{
            font-size: 4em;
            font-weight: bold;
            color: {status_color};
        }}
        .status {{
            font-size: 1.5em;
            color: {status_color};
            text-transform: uppercase;
            letter-spacing: 2px;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }}
        .card {{
            background: #1a1a1a;
            border-radius: 8px;
            padding: 15px;
            border-left: 4px solid #333;
        }}
        .card.healthy {{
            border-left-color: #00ff88;
        }}
        .card.unhealthy {{
            border-left-color: #ff4444;
        }}
        .card h3 {{
            margin: 0 0 10px 0;
            color: #fff;
        }}
        .card .status-badge {{
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
        }}
        .card.healthy .status-badge {{
            background: #00ff8833;
            color: #00ff88;
        }}
        .card.unhealthy .status-badge {{
            background: #ff444433;
            color: #ff4444;
        }}
        .latency {{
            color: #888;
            font-size: 0.9em;
            margin-top: 8px;
        }}
        .timestamp {{
            text-align: center;
            color: #666;
            margin-top: 20px;
            font-size: 0.9em;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 SOV3 HEALTH DASHBOARD</h1>
        <p>Real-time System Status</p>
    </div>
    
    <div class="overall">
        <div class="health-percentage">{overall.get('percentage', 0)}%</div>
        <div class="status">{overall.get('status', 'UNKNOWN').upper()}</div>
        <p>{overall.get('healthy', 0)}/{overall.get('total', 0)} components healthy</p>
    </div>
    
    <div class="grid">
"""
        
        for name, status in health.get("components", {}).items():
            healthy = status.get("healthy", False)
            card_class = "healthy" if healthy else "unhealthy"
            badge = "ONLINE" if healthy else "OFFLINE"
            latency = status.get("latency_ms", 0)
            error = status.get("error", "")
            
            html += f"""
        <div class="card {card_class}">
            <h3>{name.upper().replace('_', ' ')}</h3>
            <span class="status-badge">{badge}</span>
            <div class="latency">Latency: {latency}ms</div>
            {f'<div style="color: #ff6666; font-size: 0.85em; margin-top: 5px;">{error}</div>' if error else ''}
        </div>
"""
        
        html += f"""
    </div>
    
    <div class="timestamp">
        Last updated: {health.get('timestamp', 'N/A')}
    </div>
</body>
</html>
"""
        
        return html


# Initialize monitor
monitor = HealthMonitor()

class DashboardHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Serve HTML dashboard"""
        if self.path == '/' or self.path == '/dashboard':
            import asyncio
            health = asyncio.run(monitor.check_all())
            html = monitor.generate_html_dashboard(health)
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(html.encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """API endpoint"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            import asyncio
            request = json.loads(post_data)
            tool = request.get('tool')
            
            if tool == 'health_check_all':
                result = asyncio.run(monitor.check_all())
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
    server = HTTPServer(('localhost', 3109), DashboardHandler)
    print("📊 SOV3 Health Dashboard running on port 3109")
    print("   Dashboard: http://localhost:3109")
    print("   API: POST http://localhost:3109 (tool: health_check_all)")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
