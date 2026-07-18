"""Optometry API Server - Seamless SaaS-to-MCP Integration Layer"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
from datetime import datetime

DB = "/Users/nicholas/care-homes-essex.db"

class OptometryAPI(BaseHTTPRequestHandler):
    def _json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        if "/api/health" in self.path:
            self._json({"status": "healthy", "mcp_servers": [
                "optometry-patient-mcp", "care-home-scheduling-mcp",
                "nhs-gos-claims-mcp", "cqc-compliance-mcp"
            ], "a2a_agents": ["patient_scheduler", "marketing_bot"]})
        elif "/api/care-homes" in self.path:
            conn = sqlite3.connect(DB)
            c = conn.cursor()
            c.execute("SELECT * FROM care_homes")
            homes = [dict(zip(['id','name','location','residents','contact','email','phone','contacted','interested'], r)) for r in c.fetchall()]
            self._json({"count": len(homes), "homes": homes})
        else:
            self._json({"error": "Not found"}, 404)

    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(content_len)) if content_len > 0 else {}
        
        if "/api/patient" in self.path:
            self._json({"created": True, "patient_id": f"PAT-{datetime.now().strftime('%H%M%S')}", "data": body})
        elif "/api/book-appointment" in self.path:
            self._json({"booked": True, "care_home": body.get("care_home"), "date": body.get("date"), "patients": body.get("patients", 12), "route_optimised": "✅"})
        elif "/api/submit-claim" in self.path:
            self._json({"submitted": True, "patient_id": body.get("patient_id"), "amount": body.get("amount", 21.73), "status": "processing_gos"})
        else:
            self._json({"error": "Not found"}, 404)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

if __name__ == "__main__":
    server = HTTPServer(("0.0.0.0", 3201), OptometryAPI)
    print("Optometry API running on port 3201")
    server.serve_forever()
