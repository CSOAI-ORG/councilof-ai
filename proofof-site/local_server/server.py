#!/usr/bin/env python3
"""local_server.py — Backup deployment: runs the SAME index.py endpoints locally.

Per EAT-781 (Vercel alternatives):
- Vercel has intermittent flakiness (cold starts, serverless limits, deploy delays)
- This runs the SAME Flask app via Flask dev server
- Persistent, no cold-starts, full Python 3.14 access (can use all the libraries Vercel can't)
- Can be exposed via tunnel or local port

Usage:
  python server.py 8080

Endpoints: ALL 86 routes from index.py are available (no Vercel routing layer)
"""
import sys
import os

# Add the api/ directory to the path
api_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "api")
sys.path.insert(0, api_dir)
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

# Import the index module
import index as ix
app = ix.app  # The Flask app from index.py

# Allow CORS for local testing
@app.after_request
def cors(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"SOV4 Local Server — http://localhost:{port}")
    print(f"  Endpoints: 86")
    print(f"  CORS: enabled (localhost dev)")
    print(f"  Press Ctrl+C to stop")
    app.run(host="127.0.0.1", port=port, debug=False)
