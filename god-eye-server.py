#!/usr/bin/env python3
"""
God's Eye Web Viewer
Simple server to view scan results in browser
"""

import http.server
import socketserver
import socket
import os
from pathlib import Path

PORT = 7777
HTML_FILE = Path(__file__).parent / "god-eye-viewer.html"

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/god-eye-viewer.html'
        return super().do_GET()
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def find_free_port(start_port=PORT):
    for port in range(start_port, start_port + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('', port)) != 0:
                return port
    raise RuntimeError("No free ports")

def main():
    os.chdir(Path(__file__).parent)
    port = find_free_port()
    
    with socketserver.TCPServer(("", port), Handler) as httpd:
        print(f"""
🌐 God's Eye Web Viewer Started!

📊 URL: http://localhost:{port}

To view results:
1. Run a scan: ./god-eye-binary -d target.com -o report.json -f json
2. Open the URL above in your browser
3. Click "Load JSON Report" and select the report.json file

Press Ctrl+C to stop
""")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n👋 Server stopped")

if __name__ == "__main__":
    main()
