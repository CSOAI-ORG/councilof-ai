"""
CSOAI Local Signup Server
=========================
A Flask server that serves the signup page AND the /api/signup endpoint locally.
Use this for development and testing before deploying to Vercel.

Run: python3 local_signup_server.py
Then open: http://localhost:5000
"""
import sys
import os
from pathlib import Path

# Add parent to path for signup_api import
sys.path.insert(0, str(Path(__file__).parent))

from flask import Flask, request, jsonify, send_from_directory
from signup_api import signup, authenticate, record_usage

app = Flask(__name__, static_folder=None)


@app.route('/')
def index():
    """Serve the signup page."""
    return send_from_directory(Path(__file__).parent, 'signup.html')


@app.route('/api/signup', methods=['POST', 'OPTIONS'])
def api_signup():
    """Signup endpoint. Mirrors the Vercel serverless function."""
    if request.method == 'OPTIONS':
        return ('', 204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        })

    data = request.get_json() or {}
    result = signup(
        email=data.get('email', ''),
        name=data.get('name', ''),
        company=data.get('company', ''),
    )

    status_code = 201 if result.get('status') == 'created' else 200
    return (jsonify(result), status_code, {
        'Access-Control-Allow-Origin': '*',
    })


@app.route('/api/verify-key', methods=['POST'])
def api_verify_key():
    """Verify an API key. Returns signup record or error."""
    data = request.get_json() or {}
    api_key = data.get('api_key', '')
    result = authenticate(api_key)
    status_code = 200 if result.get('authenticated') else 401
    return (jsonify(result), status_code, {
        'Access-Control-Allow-Origin': '*',
    })


@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "service": "csoai-signup"})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f'🜏 CSOAI Signup Server running on http://localhost:{port}')
    print(f'   Signup page: http://localhost:{port}/')
    print(f'   API endpoint: http://localhost:{port}/api/signup')
    app.run(host='0.0.0.0', port=port, debug=True)
