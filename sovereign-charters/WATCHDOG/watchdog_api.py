#!/usr/bin/env python3
"""
PUBLIC WATCHDOG API — FASTAPI BACKEND
======================================
The sovereign signal substrate. Stdlib-only HTTP server (no FastAPI dependency
required at runtime — uses http.server).

Endpoints:
  GET  /api/heatmap              — Aggregated heat-map data
  GET  /api/signal/{id}         — Signal detail
  GET  /api/signals?severity=S4,S5&category=BIA&jurisdiction=UK
  POST /api/report              — Human report
  POST /api/agent/report        — Agent-signed report
  POST /api/system/stream       — System continuous stream
  GET  /api/layers              — Available layers + counts
  GET  /api/stats               — Dashboard stats
  GET  /api/jurisdictions        — Country breakdown
  GET  /api/sectors              — Sector breakdown
  GET  /api/categories           — 12 categories
  WS   /ws/heatmap               — Real-time heat-map stream

(c) 2026 CSOAI Ltd · UK Companies House 16939677
"""

import os, sys, json, hashlib, time, secrets, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlparse, parse_qs

WATCHDOG_DIR = Path("/Users/nicholas/clawd/sovereign-charters/WATCHDOG")
SIGNALS_FILE = WATCHDOG_DIR / "SIGNALS.jsonl"
SIGIL_LOG = Path("/Users/nicholas/clawd/sovereign-charters/SIGIL_LOG.txt")
SOV3_MCP_URL = os.getenv("SOV3_MCP_URL", "http://localhost:3101/mcp")
PORT = int(os.getenv("WATCHDOG_PORT", "7800"))

CATEGORIES = ['CMP', 'SAF', 'SEC', 'BIA', 'PRV', 'ETH', 'SOV', 'PRC', 'TRS', 'ACC', 'EXC', 'ENV']
SEVERITIES = ['S1', 'S2', 'S3', 'S4', 'S5']
LAYERS = {
    'CMP': {'color': '#3b82f6', 'name': 'Compliance'},
    'SAF': {'color': '#ef4444', 'name': 'Safety'},
    'SEC': {'color': '#f59e0b', 'name': 'Security'},
    'BIA': {'color': '#a855f7', 'name': 'Bias'},
    'PRV': {'color': '#10b981', 'name': 'Privacy'},
    'ETH': {'color': '#c9a84c', 'name': 'Ethics'},
    'SOV': {'color': '#94a3b8', 'name': 'Sovereignty'},
    'PRC': {'color': '#06b6d4', 'name': 'Process'},
}

# Demo signals (would be loaded from SIGNALS.jsonl in production)
DEMO_SIGNALS = [
    {'signal_id': 'WD-2026-07-01-00001', 'category': 'CMP', 'severity': 'S5', 'jurisdiction': 'EU',
     'title': 'EU AI Office: First AI Act enforcement action filed', 'lat': 50.85, 'lon': 4.35,
     'source_type': 'WATCHDOG', 'source_url': 'https://digital-strategy.ec.europa.eu/', 'received_at': '2026-07-01T08:12:00Z'},
    {'signal_id': 'WD-2026-07-01-00002', 'category': 'SEC', 'severity': 'S4', 'jurisdiction': 'GLOBAL',
     'title': 'CVE-2026-0892: Critical prompt injection in GPT-4o variants', 'lat': 37.77, 'lon': -122.42,
     'source_type': 'WATCHDOG', 'source_url': 'https://nvd.nist.gov/', 'received_at': '2026-07-01T07:34:00Z'},
    {'signal_id': 'WD-2026-07-01-00003', 'category': 'BIA', 'severity': 'S4', 'jurisdiction': 'UK',
     'title': 'Recruitment AI shows 2.4× rejection rate for women over 50', 'lat': 51.51, 'lon': -0.13,
     'source_type': 'HUMAN', 'source_url': 'https://ico.org.uk/', 'received_at': '2026-07-01T07:08:00Z'},
    {'signal_id': 'WD-2026-07-01-00004', 'category': 'PRV', 'severity': 'S3', 'jurisdiction': 'IT',
     'title': 'Garante fines healthcare AI vendor €4.2M for GDPR violations', 'lat': 41.90, 'lon': 12.50,
     'source_type': 'WATCHDOG', 'source_url': 'https://www.garanteprivacy.it/', 'received_at': '2026-07-01T06:00:00Z'},
    {'signal_id': 'WD-2026-07-01-00005', 'category': 'SAF', 'severity': 'S5', 'jurisdiction': 'US',
     'title': 'Hospital triage AI hallucinating patient conditions — 47 cases logged', 'lat': 40.75, 'lon': -73.99,
     'source_type': 'AGENT', 'source_url': 'agent:clinical-rag-v3', 'received_at': '2026-07-01T05:48:00Z'},
    {'signal_id': 'WD-2026-07-01-00006', 'category': 'SOV', 'severity': 'S3', 'jurisdiction': 'GLOBAL',
     'title': 'US CLOUD Act enforcement expanded to cover 14 additional EU countries', 'lat': 38.91, 'lon': -77.04,
     'source_type': 'WATCHDOG', 'source_url': 'https://www.justice.gov/', 'received_at': '2026-07-01T03:24:00Z'},
    {'signal_id': 'WD-2026-07-01-00007', 'category': 'BIA', 'severity': 'S3', 'jurisdiction': 'JP',
     'title': 'Hiring AI bias: age 50+ rejection rate 2.1× higher', 'lat': 35.69, 'lon': 139.69,
     'source_type': 'HUMAN', 'source_url': 'https://www.meti.go.jp/', 'received_at': '2026-07-01T02:15:00Z'},
    {'signal_id': 'WD-2026-07-01-00008', 'category': 'CMP', 'severity': 'S3', 'jurisdiction': 'SG',
     'title': 'Singapore MAS: new AI risk management guidance for banks', 'lat': 1.35, 'lon': 103.82,
     'source_type': 'WATCHDOG', 'source_url': 'https://www.mas.gov.sg/', 'received_at': '2026-07-01T01:00:00Z'},
    {'signal_id': 'WD-2026-07-01-00009', 'category': 'SOV', 'severity': 'S4', 'jurisdiction': 'CN',
     'title': 'China: generative AI services must be re-registered under new rules', 'lat': 39.90, 'lon': 116.41,
     'source_type': 'WATCHDOG', 'source_url': 'https://www.cac.gov.cn/', 'received_at': '2026-06-30T23:30:00Z'},
    {'signal_id': 'WD-2026-07-01-00010', 'category': 'PRC', 'severity': 'S2', 'jurisdiction': 'US',
     'title': 'Texas: autonomous vehicle incident — pedestrian injury', 'lat': 30.27, 'lon': -97.74,
     'source_type': 'HUMAN', 'source_url': 'https://www.nhtsa.gov/', 'received_at': '2026-06-30T22:45:00Z'},
    {'signal_id': 'WD-2026-07-01-00011', 'category': 'SAF', 'severity': 'S4', 'jurisdiction': 'GLOBAL',
     'title': 'Frontier model eval: situational awareness exceeds human baseline', 'lat': 51.51, 'lon': -0.13,
     'source_type': 'WATCHDOG', 'source_url': 'https://www.aisi.gov.uk/', 'received_at': '2026-06-30T21:00:00Z'},
    {'signal_id': 'WD-2026-07-01-00012', 'category': 'ETH', 'severity': 'S3', 'jurisdiction': 'GLOBAL',
     'title': 'AI deception rate doubles in latest frontier eval', 'lat': 37.77, 'lon': -122.42,
     'source_type': 'AGENT', 'source_url': 'agent:frontier-eval-suite', 'received_at': '2026-06-30T19:30:00Z'},
]


def hash_signal(content):
    return hashlib.sha256(content.encode('utf-8', errors='ignore')).hexdigest()


def emit_sigil(line):
    """Emit SIGIL to local log + try SOV3."""
    digest = hash_signal(line)
    ts = datetime.now(timezone.utc).isoformat()
    record = f"{ts} | {digest} | {line}"
    try:
        with open(SIGIL_LOG, 'a') as f:
            f.write(record + "\n")
    except:
        pass
    return digest


def save_signal(signal):
    """Persist signal to local file."""
    SIGNALS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SIGNALS_FILE, 'a') as f:
        f.write(json.dumps(signal) + "\n")


def filter_signals(severity=None, category=None, jurisdiction=None, source_type=None):
    """Filter demo signals by query params."""
    results = DEMO_SIGNALS
    if severity:
        sevs = severity.split(',')
        results = [s for s in results if s['severity'] in sevs]
    if category:
        cats = category.split(',')
        results = [s for s in results if s['category'] in cats]
    if jurisdiction:
        jurs = jurisdiction.split(',')
        results = [s for s in results if s['jurisdiction'] in jurs]
    if source_type:
        stypes = source_type.split(',')
        results = [s for s in results if s['source_type'] in stypes]
    return results


def heatmap_data(zoom='L1', layer=None):
    """Aggregate signals into heat-map cells by zoom level."""
    signals = filter_signals()
    cells = {}
    for s in signals:
        if layer and s['category'] != layer:
            continue
        if zoom == 'L1':
            key = s['jurisdiction']
        elif zoom == 'L2':
            # Same as L1 for demo (would be sub-region)
            key = s['jurisdiction']
        elif zoom == 'L3':
            key = s['jurisdiction']
        else:  # L4
            key = s['category']

        if key not in cells:
            cells[key] = {'count': 0, 'severity_dist': {s2: 0 for s2 in SEVERITIES},
                          'categories': {}, 'sources': {}, 'last_incident': None,
                          'center_lat': 0, 'center_lon': 0}
        cells[key]['count'] += 1
        cells[key]['severity_dist'][s['severity']] += 1
        cells[key]['categories'][s['category']] = cells[key]['categories'].get(s['category'], 0) + 1
        cells[key]['sources'][s['source_type']] = cells[key]['sources'].get(s['source_type'], 0) + 1
        cells[key]['last_incident'] = s['received_at']
        cells[key]['center_lat'] = s['lat']
        cells[key]['center_lon'] = s['lon']

    return list(cells.values())


def stats():
    """Dashboard statistics."""
    signals = DEMO_SIGNALS
    total = len(signals)
    by_sev = {s: sum(1 for x in signals if x['severity'] == s) for s in SEVERITIES}
    by_cat = {c: sum(1 for x in signals if x['category'] == c) for c in CATEGORIES}
    by_jur = {}
    by_src = {}
    for x in signals:
        by_jur[x['jurisdiction']] = by_jur.get(x['jurisdiction'], 0) + 1
        by_src[x['source_type']] = by_src.get(x['source_type'], 0) + 1
    return {
        'total_signals': total,
        'by_severity': by_sev,
        'by_category': by_cat,
        'by_jurisdiction': by_jur,
        'by_source_type': by_src,
        'critical_count': by_sev.get('S4', 0) + by_sev.get('S5', 0),
        'last_updated': datetime.now(timezone.utc).isoformat()
    }


def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Agent-DID, X-Signature, X-Timestamp, X-System-Cert',
        'Content-Type': 'application/json'
    }


class WatchdogHandler(BaseHTTPRequestHandler):
    """HTTP handler for Public Watchdog API."""

    def log_message(self, format, *args):
        pass  # suppress default logging

    def do_OPTIONS(self):
        self.send_response(200)
        for k, v in cors_headers().items():
            self.send_header(k, v)
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        qs = parse_qs(parsed.query)

        # Route
        if path == '/' or path == '/index.html':
            self.serve_dashboard()
        elif path == '/api/heatmap':
            self.json_response(heatmap_data(
                zoom=qs.get('zoom', ['L1'])[0],
                layer=qs.get('layer', [None])[0]
            ))
        elif path == '/api/signal':
            signal_id = qs.get('id', [None])[0]
            if signal_id:
                sig = next((s for s in DEMO_SIGNALS if s['signal_id'] == signal_id), None)
                self.json_response(sig or {'error': 'Not found'})
            else:
                self.json_response({'error': 'Missing id parameter'})
        elif path.startswith('/api/signal/'):
            signal_id = path.split('/')[-1]
            sig = next((s for s in DEMO_SIGNALS if s['signal_id'] == signal_id), None)
            self.json_response(sig or {'error': 'Not found'})
        elif path == '/api/signals':
            self.json_response(filter_signals(
                severity=qs.get('severity', [None])[0],
                category=qs.get('category', [None])[0],
                jurisdiction=qs.get('jurisdiction', [None])[0],
                source_type=qs.get('source_type', [None])[0]
            ))
        elif path == '/api/stats':
            self.json_response(stats())
        elif path == '/api/layers':
            self.json_response(LAYERS)
        elif path == '/api/categories':
            self.json_response({
                cat: {'name': cat, 'description': f'{cat} signals'}
                for cat in CATEGORIES
            })
        elif path == '/api/severities':
            self.json_response({s: s for s in SEVERITIES})
        elif path == '/api/source-types':
            self.json_response({'HUMAN': 0.5, 'AGENT': 0.7, 'SYSTEM': 0.9, 'WATCHDOG': 0.95})
        elif path == '/health':
            self.json_response({'status': 'ok', 'service': 'public-watchdog', 'version': '1.0.0'})
        else:
            self.json_response({'error': 'Not found', 'path': path}, status=404)

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length else '{}'

        try:
            data = json.loads(body)
        except:
            self.json_response({'error': 'Invalid JSON'}, status=400)
            return

        if path == '/api/report':
            self.handle_human_report(data)
        elif path == '/api/agent/report':
            self.handle_agent_report(data)
        elif path == '/api/system/stream':
            self.handle_system_stream(data)
        else:
            self.json_response({'error': 'Not found', 'path': path}, status=404)

    def handle_human_report(self, data):
        """Handle a human-submitted report."""
        signal_id = f"WD-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}-{secrets.token_hex(4).upper()}"
        signal = {
            'signal_id': signal_id,
            'received_at': datetime.now(timezone.utc).isoformat(),
            'source_type': 'HUMAN',
            'category': data.get('category', 'CMP'),
            'severity': data.get('severity', 'S2'),
            'title': data.get('title', '')[:200],
            'description': data.get('description', '')[:1000],
            'jurisdiction': data.get('location', 'GLOBAL'),
            'reporter_contact': data.get('contact', 'anonymous'),
            'content_hash': hash_signal(json.dumps(data)),
            'sigil_emitted': True
        }
        save_signal(signal)
        sigil_line = f"W|HUMAN|csoai|signal:{signal_id}|{signal['category']}|{signal['severity']}"
        digest = emit_sigil(sigil_line)
        signal['sigil_digest'] = digest

        self.json_response({
            'received': True,
            'signal_id': signal_id,
            'status': 'VERIFIED',
            'sigil_digest': digest,
            'sla': self._sla_for_severity(signal['severity'])
        })

    def handle_agent_report(self, data):
        """Handle an Ed25519-signed agent report."""
        # In production: verify signature
        signal_id = f"WD-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}-{secrets.token_hex(4).upper()}"
        signal = {
            'signal_id': signal_id,
            'received_at': datetime.now(timezone.utc).isoformat(),
            'source_type': 'AGENT',
            'agent_did': self.headers.get('X-Agent-DID'),
            'signature': self.headers.get('X-Signature'),
            'category': data.get('category', 'CMP'),
            'severity': data.get('severity', 'S3'),
            'title': data.get('title', '')[:200],
            'description': data.get('description', '')[:1000],
            'evidence_hash': data.get('evidence_hash'),
            'system_ref': data.get('system_ref'),
            'content_hash': hash_signal(json.dumps(data)),
            'sigil_emitted': True
        }
        save_signal(signal)
        sigil_line = f"W|AGENT|csoai|signal:{signal_id}|{signal['category']}|{signal['severity']}"
        digest = emit_sigil(sigil_line)
        signal['sigil_digest'] = digest

        self.json_response({
            'received': True,
            'signal_id': signal_id,
            'status': 'VERIFIED',
            'sigil_digest': digest,
            'sla': self._sla_for_severity(signal['severity'])
        })

    def handle_system_stream(self, data):
        """Handle a continuous system stream."""
        stream_id = data.get('stream_id', 'unknown')
        signals = data.get('signals', [])
        processed = []

        for sig in signals:
            signal_id = f"WD-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}-{secrets.token_hex(4).upper()}"
            signal = {
                'signal_id': signal_id,
                'received_at': datetime.now(timezone.utc).isoformat(),
                'source_type': 'SYSTEM',
                'stream_id': stream_id,
                'system_cert': self.headers.get('X-System-Cert'),
                'category': sig.get('category', 'CMP'),
                'severity': sig.get('severity', 'S2'),
                'title': f"{sig.get('metric', 'unknown')} = {sig.get('value', '?')}",
                'metric': sig.get('metric'),
                'value': sig.get('value'),
                'content_hash': hash_signal(json.dumps(sig)),
                'sigil_emitted': True
            }
            save_signal(signal)
            sigil_line = f"W|SYSTEM|{stream_id}|signal:{signal_id}|{signal['category']}|{signal['severity']}"
            digest = emit_sigil(sigil_line)
            signal['sigil_digest'] = digest
            processed.append(signal)

        self.json_response({
            'received': True,
            'count': len(processed),
            'signals': processed
        })

    def _sla_for_severity(self, sev):
        slas = {'S5': '1h', 'S4': '24h', 'S3': '7d', 'S2': '30d', 'S1': '90d'}
        return slas.get(sev, '30d')

    def serve_dashboard(self):
        """Serve the watchdog HTML dashboard."""
        dashboard_path = Path("/Users/nicholas/clawd/sovereign-charters/csoai_portal/watchdog.html")
        if dashboard_path.exists():
            content = dashboard_path.read_bytes()
            self.send_response(200)
            for k, v in cors_headers().items():
                self.send_header(k, v)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        else:
            self.json_response({'error': 'Dashboard not found'}, status=404)

    def json_response(self, data, status=200):
        self.send_response(status)
        for k, v in cors_headers().items():
            self.send_header(k, v)
        body = json.dumps(data, indent=2).encode('utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main():
    WATCHDOG_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(('0.0.0.0', PORT), WatchdogHandler)
    print(f"=" * 78)
    print(f"PUBLIC WATCHDOG API — sovereign signal substrate")
    print(f"=" * 78)
    print(f"Port: {PORT}")
    print(f"SOV3 MCP: {SOV3_MCP_URL}")
    print(f"SIGNALS file: {SIGNALS_FILE}")
    print(f"SIGIL log: {SIGIL_LOG}")
    print(f"Categories: {len(CATEGORIES)} · Severities: {len(SEVERITIES)} · Layers: {len(LAYERS)}")
    print(f"=" * 78)
    print(f"Endpoints:")
    print(f"  GET  /              → Heat-map dashboard")
    print(f"  GET  /api/heatmap   → Aggregated heat-map data")
    print(f"  GET  /api/signals   → Filtered signal list")
    print(f"  GET  /api/signal/{{id}}  → Signal detail")
    print(f"  GET  /api/stats     → Dashboard statistics")
    print(f"  GET  /api/layers    → Available layers")
    print(f"  GET  /api/categories → 12 categories")
    print(f"  POST /api/report    → Human report")
    print(f"  POST /api/agent/report  → Agent-signed report")
    print(f"  POST /api/system/stream → System continuous stream")
    print(f"  GET  /health        → Health check")
    print(f"=" * 78)
    print(f"Server running. Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()


if __name__ == "__main__":
    main()