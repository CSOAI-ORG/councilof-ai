#!/usr/bin/env python3
"""
SovSpace Showcase SIGIL feed — server that reads ~/.sovereign/*.sigil.jsonl
and serves as /api/sigil/recent for the SovSpace Showcase HTML.

Run:
  $ sovereign-sovspace-serve     # starts a tiny HTTP server on :8200
  $ sovereign-sovspace-serve 8888  # custom port

Then open http://localhost:8200/sovspace-showcase.html in a browser.
"""

import sys
import os
import json
import http.server
import socketserver
from pathlib import Path
import glob
import time
from datetime import datetime, timezone

SIGIL_DIR = Path.home() / '.sovereign'
SHOWCASE_HTML = Path(__file__).parent / 'sovspace-showcase.html'

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8200


def read_recent_hops(limit=24):
    """Read recent SIGIL hops across all chains."""
    hops = []
    for chain_file in SIGIL_DIR.glob('*.sigil.jsonl'):
        try:
            lines = chain_file.read_text().splitlines()
            for line in lines[-limit:]:
                if not line.strip(): continue
                h = json.loads(line)
                h['chain'] = chain_file.stem.replace('.sigil', '')
                hops.append(h)
        except Exception as e:
            pass
    # Sort by ts
    hops.sort(key=lambda h: h.get('ts', ''), reverse=True)
    return hops[:limit]


def read_dashboard():
    """Aggregate substrate stats."""
    sigil_count = 0
    for chain_file in SIGIL_DIR.glob('*.sigil.jsonl'):
        sigil_count += sum(1 for _ in chain_file.open())
    return {
        'sigil_count': sigil_count,
        'n_chains': len(list(SIGIL_DIR.glob('*.sigil.jsonl'))),
        'last_check': datetime.now(timezone.utc).isoformat(),
    }


class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/' or self.path == '/index.html':
            self.path = '/sovspace-showcase.html'
        if self.path == '/sovspace-showcase.html':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            with open(SHOWCASE_HTML, 'rb') as f:
                self.wfile.write(f.read())
            return
        if self.path.startswith('/api/sigil/recent'):
            # Extract limit from query string
            limit = 24
            if '?' in self.path:
                qs = self.path.split('?', 1)[1]
                for kv in qs.split('&'):
                    if kv.startswith('limit='):
                        try: limit = int(kv.split('=')[1])
                        except: pass
            hops = read_recent_hops(limit)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.wfile.write(json.dumps(hops).encode())
            return
        if self.path == '/api/dashboard':
            stats = read_dashboard()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.wfile.write(json.dumps(stats).encode())
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, format, *args):
        pass  # quiet


def main():
    print(f"🜏 SovSpace Showcase server on http://localhost:{PORT}/sovspace-showcase.html")
    print(f"   SIGIL feed: http://localhost:{PORT}/api/sigil/recent")
    print(f"   Dashboard: http://localhost:{PORT}/api/dashboard")
    print(f"   Source: {SHOWCASE_HTML}")
    print(f"   SIGIL dir: {SIGIL_DIR}")
    print()
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()


if __name__ == '__main__':
    main()
