#!/usr/bin/env python3
"""Sovereign Webhook Server — for sovereign events (new signup, new SIGIL, etc).
Honest register: local webhook dispatcher. Stdlib only.
"""

import hashlib
import http.server
import json
import os
import socketserver
import threading
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
LOG = SC / 'webhook_events.jsonl'

EVENTS = []


def emit_event(event_type, payload):
    ts = datetime.now(timezone.utc).isoformat()
    event = {
        'ts': ts,
        'type': event_type,
        'id': hashlib.sha256(f'{event_type}|{ts}|{json.dumps(payload)}'.encode()).hexdigest()[:16],
        'payload': payload,
    }
    EVENTS.append(event)
    with open(LOG, 'a') as f:
        f.write(json.dumps(event) + '\n')
    return event


class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args, **kwargs):
        pass

    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'events': len(EVENTS)}).encode())
        elif self.path.startswith('/events'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(EVENTS[-20:]).encode())
        elif self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            html = '''<!DOCTYPE html><html><head><title>CSOAI Webhook</title></head>
<body style="background:#050816;color:#e8eefc;font-family:system-ui;padding:32px;">
<h1>CSOAI Sovereign Webhook Server</h1>
<p>Active: ''' + str(len(EVENTS)) + ''' events processed</p>
<h2>Endpoints</h2>
<ul style="line-height:1.8;">
<li>GET /health — health check</li>
<li>GET /events — last 20 events</li>
<li>POST /webhook — receive sovereign event</li>
</ul>
</body></html>'''
            self.wfile.write(html.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == '/webhook':
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length) if length else b'{}'
            try:
                payload = json.loads(raw)
            except Exception:
                payload = {'raw': raw.decode('utf-8', errors='ignore')}
            event_type = payload.get('type', 'unknown')
            event = emit_event(event_type, payload)
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ok': True, 'event_id': event['id']}).encode())
        else:
            self.send_response(404)
            self.end_headers()


def main():
    port = int(os.getenv('PORT', 7800))
    now = datetime.now(timezone.utc).isoformat()
    print(f'\n📡 SOVEREIGN WEBHOOK SERVER — {now}')
    print(f'Listening on http://0.0.0.0:{port}')

    # Emit some demo events
    emit_event('server.start', {'port': port, 'ts': now})
    emit_event('daily_loop.complete', {'phases': 6, 'master_sigil': '055d7b46d7707babcb5d800ae00ad5aa'})
    emit_event('sov.bench.complete', {'examples': 14484, 'accuracy_pct': 72.0})
    emit_event('charter.health.complete', {'avg_score': 67.1, 'needs_work': 13})
    emit_event('crosswalk.validated', {'high': 6, 'medium': 2})

    server = socketserver.TCPServer(('0.0.0.0', port), WebhookHandler)
    print(f'Webhook server live. Visit http://localhost:{port}/')

    import hashlib
    sigil = hashlib.sha256(f'webhook|{now}|{port}'.encode()).hexdigest()[:32]
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|WEBHOOK-SERVER. port={port} demo_events={5}\n')

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down')
        server.shutdown()


if __name__ == '__main__':
    main()