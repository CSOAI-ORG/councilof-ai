#!/usr/bin/env python3
"""
SOV3 LOCAL STATIC SERVER — until sov3.csoai.org is live
=======================================================

Serves the csoai.org/ static files locally on port 8888.
This is what curl -sSL https://sov3.csoai.org/install.sh should return.
In production, Vercel does this for us. For now, localhost:8888.

Visit:
  http://localhost:8888/install.sh        (the installer)
  http://localhost:8888/                   (landing)
  http://localhost:8888/open-hands/        (Open Hands OS)
  http://localhost:8888/launch/            (launch dashboard)
  ...all 100+ pages
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8888
ROOT = Path("/Users/nicholas/clawd/csoai.org").resolve()


class SovereignStaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # Add CORS for sovereign interoperability
        self.send_header("X-Sovereign", "true")
        self.send_header("X-DORADO", "WEST")
        self.send_header("X-SIGIL-Chain", "live")
        # CORS for cross-origin
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def log_message(self, format, *args):
        # Quieter logs
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), format % args))


if __name__ == "__main__":
    print(f"🜏 SOV3 Local Static Server")
    print(f"   Serving: {ROOT}")
    print(f"   URL:     http://localhost:{PORT}")
    print(f"")
    print(f"   KEY URLs:")
    print(f"   http://localhost:{PORT}/install.sh         ← THE INSTALLER (mirrors sov3.csoai.org)")
    print(f"   http://localhost:{PORT}/                    ← csoai.org landing")
    print(f"   http://localhost:{PORT}/open-hands/         ← Open Hands OS")
    print(f"   http://localhost:{PORT}/launch/             ← Launch dashboard")
    print(f"   http://localhost:{PORT}/ornith/benchmarks   ← Ornith benchmarks")
    print(f"   http://localhost:{PORT}/dorado/             ← SOV3 DORADO")
    print(f"   http://localhost:{PORT}/twinstore/          ← TwinStore")
    print(f"   http://localhost:{PORT}/compliance/         ← UK AI Bill + EU AI Act")
    print(f"")
    print(f"   Press Ctrl+C to stop")
    print(f"")

    try:
        with socketserver.TCPServer(("", PORT), SovereignStaticHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🜏 Server stopped.")
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"⚠️ Port {PORT} in use. Try: python3 static-server.py {PORT+1}")
        else:
            raise