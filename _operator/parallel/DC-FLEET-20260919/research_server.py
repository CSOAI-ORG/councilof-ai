"""Loopback-only, read-only evidence viewer. No uploads or trading endpoints."""
import argparse
from http.server import BaseHTTPRequestHandler,ThreadingHTTPServer
import json
from pathlib import Path
import threading
import time
import research_bridge
HERE=Path(__file__).resolve().parent
CACHE={'at':0.0,'value':None}
LOCK=threading.Lock()

def current():
    with LOCK:
        if time.monotonic()-CACHE['at']>30 or CACHE['value'] is None:
            CACHE['value']=research_bridge.combined()
            CACHE['at']=time.monotonic()
        return CACHE['value']

class Handler(BaseHTTPRequestHandler):
    server_version='CSOAIReadOnly/1'
    def permitted(self):
        port=self.server.server_port
        hosts={f'127.0.0.1:{port}',f'localhost:{port}'}
        origins={f'http://{host}' for host in hosts}
        return self.headers.get('Host') in hosts and self.headers.get('Origin') in origins|{None}
    def respond(self,status,body,content_type):
        self.send_response(status)
        self.send_header('Content-Type',content_type)
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-store')
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Content-Security-Policy',"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'")
        self.end_headers();self.wfile.write(body)
    def do_GET(self):
        if not self.permitted():
            self.respond(403,b'Forbidden','text/plain');return
        if self.path=='/':
            self.respond(200,(HERE/'research_dashboard.html').read_bytes(),'text/html; charset=utf-8')
        elif self.path=='/health':
            self.respond(200,b'{"service":"csoai-readonly-research","orders":false}','application/json')
        elif self.path=='/api/report':
            try:
                body=json.dumps(current(),allow_nan=False).encode()
                self.respond(200,body,'application/json')
            except Exception:
                self.respond(503,b'{"status":"UNCHECKABLE"}','application/json')
        else:self.respond(404,b'Not found','text/plain')
    def do_POST(self):self.respond(405,b'Read only','text/plain')
    do_PUT=do_POST
    do_DELETE=do_POST
    do_PATCH=do_POST
    def log_message(self,format,*args):pass

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=8090)
    args=parser.parse_args()
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
