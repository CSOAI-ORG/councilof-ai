#!/usr/bin/env python3
"""Open the generated Council companion locally, without installing a service.

Run from this repository or the CI preview bundle:
  python3 scripts/serve-council-native-panel.py --open

Only two static page paths are served. No directory browsing, private backend
proxy, credential loading, model inference or automatic task execution.
"""
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import argparse
import base64
import hashlib
import json
import re
import webbrowser


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8794)
    parser.add_argument('--open', action='store_true', help='Open the preview in your default browser')
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error('Choose an unprivileged port between 1024 and 65535')
    root = Path(__file__).resolve().parent.parent
    directory = root / 'public' / 'native-panel'
    page = (directory / 'index.html').read_bytes()
    resource = json.loads((directory / 'resource.json').read_text(encoding='utf-8'))
    digest = hashlib.sha256(page).hexdigest()
    if digest != resource['sha256'] or page.decode('utf-8') != resource['text']:
        raise ValueError('Generated panel bytes do not match the resource; rebuild or obtain the exact reviewed bundle')
    scripts = re.findall(rb'<script type="module">(.*?)</script>', page, re.S)
    if len(scripts) != 1:
        raise ValueError('Expected one bundled module script')
    sri = base64.b64encode(hashlib.sha256(scripts[0]).digest()).decode('ascii')

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            if self.path not in ('/', '/index.html'):
                self.send_error(404)
                return
            self.send_response(200)
            self.send_header('content-type', 'text/html; charset=utf-8')
            self.send_header('content-length', str(len(page)))
            self.send_header('cache-control', 'no-store')
            self.send_header('referrer-policy', 'no-referrer')
            self.send_header('x-content-type-options', 'nosniff')
            self.send_header('permissions-policy', 'camera=(), microphone=(), geolocation=()')
            self.send_header('content-security-policy', "default-src 'none'; script-src 'sha256-" + sri + "'; style-src 'unsafe-inline'; connect-src https://councilof.ai; img-src data:; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
            self.end_headers()
            self.wfile.write(page)

        def log_message(self, *_):
            pass

    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    url = f'http://127.0.0.1:{args.port}/'
    print(f'Local preview: {url}\nHTML SHA-256: {digest}\nCtrl+C stops this preview. No background startup is installed.', flush=True)
    if args.open:
        webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
