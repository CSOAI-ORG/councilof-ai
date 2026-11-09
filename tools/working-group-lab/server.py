#!/usr/bin/env python3
"""Loopback-only feasibility lab. Synthetic comments; no accounts or approval authority."""
import argparse
import json
import sqlite3
from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
MAX_BODY = 16384

class Store:
    def __init__(self, path, catalog):
        self.path, self.catalog = str(path), catalog
        self.ids = {d["id"] for d in catalog["documents"]}
        with closing(self.connect()) as db, db:
            db.executescript("""
              CREATE TABLE IF NOT EXISTS events(
                seq INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id TEXT NOT NULL,
                kind TEXT NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL
              );
              CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events
                BEGIN SELECT RAISE(ABORT, 'append-only'); END;
              CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events
                BEGIN SELECT RAISE(ABORT, 'append-only'); END;
            """)
    def connect(self):
        return sqlite3.connect(self.path, timeout=5)
    def snapshot(self):
        with closing(self.connect()) as db:
            rows = db.execute("SELECT seq,document_id,kind,payload,created_at FROM events ORDER BY seq").fetchall()
        events = [dict(seq=r[0],documentId=r[1],kind=r[2],payload=json.loads(r[3]),at=r[4],actor="local-demo-user") for r in rows]
        return {"mode":"LOCAL_SYNTHETIC_LAB","authenticatedHuman":False,"catalog":self.catalog,"events":events,"authority":"none"}
    def append(self, body):
        if not isinstance(body,dict) or set(body) - {"documentId","kind","body","commentId","reason","expectedRevision"}:
            raise ValueError("Unknown fields. No decision or authority operation is supported.")
        doc, kind, rev = body.get("documentId"), body.get("kind"), body.get("expectedRevision")
        if doc not in self.ids or kind not in ("comment","hide"):
            raise ValueError("Unknown document or operation.")
        if type(rev) is not int or rev < 0:
            raise ValueError("Expected revision must be a nonnegative integer.")
        if kind == "comment":
            text = body.get("body")
            if not isinstance(text,str) or not text.strip() or len(text)>4000 or "\0" in text:
                raise ValueError("Comment must contain 1–4000 characters.")
            payload = {"body":text.strip()}
        else:
            if type(body.get("commentId")) is not int or not isinstance(body.get("reason"),str) or not body["reason"].strip() or len(body["reason"])>500:
                raise ValueError("Hiding requires a comment ID and a 1–500 character reason.")
            payload = {"commentId":body["commentId"],"reason":body["reason"].strip()}
        with closing(self.connect()) as db, db:
            db.execute("BEGIN IMMEDIATE")
            current = db.execute("SELECT count(*) FROM events WHERE document_id=?",(doc,)).fetchone()[0]
            if current != rev:
                raise RuntimeError("Revision conflict. Reload the discussion and review the latest events.")
            if kind == "hide":
                comment = db.execute("SELECT 1 FROM events WHERE seq=? AND document_id=? AND kind='comment'",(body["commentId"],doc)).fetchone()
                if not comment: raise ValueError("Comment is not in this document.")
            db.execute("INSERT INTO events(document_id,kind,payload,created_at) VALUES(?,?,?,?)",(doc,kind,json.dumps(payload),datetime.now(timezone.utc).isoformat()))
        return {"state":"LOCAL_LAB_EVENT_SAVED","revision":rev+1,"authority":"none"}

def make_server(database, port=0):
    registry = json.loads((ROOT/"council-os/working-groups.json").read_text())
    tracker = json.loads((ROOT/"council-os/working-group-tracker.json").read_text())
    store = Store(database,{**tracker,"schema":"csoai.working-group-catalog/1","groups":registry["groups"]})
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args): pass
        def reply(self, status, value, mime="application/json"):
            body = json.dumps(value).encode() if mime=="application/json" else value
            self.send_response(status)
            self.send_header("Content-Type",mime)
            self.send_header("Content-Length",str(len(body)))
            self.send_header("Cache-Control","no-store")
            self.send_header("X-Content-Type-Options","nosniff")
            self.send_header("Referrer-Policy","no-referrer")
            self.send_header("Content-Security-Policy","default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'")
            self.end_headers()
            self.wfile.write(body)
        def correct_host(self):
            return self.headers.get("Host") == "127.0.0.1:"+str(self.server.server_port)
        def do_GET(self):
            if not self.correct_host(): return self.reply(403,{"error":"Loopback host required."})
            if self.path == "/api/state": return self.reply(200,store.snapshot())
            allowed = {"/":("index.html","text/html; charset=utf-8"),"/app.js":("app.js","text/javascript; charset=utf-8")}
            if self.path not in allowed: return self.reply(404,{"error":"Not found."})
            file,mime=allowed[self.path]
            self.reply(200,(Path(__file__).parent/file).read_bytes(),mime)
        def do_POST(self):
            origin="http://127.0.0.1:"+str(self.server.server_port)
            if not self.correct_host() or self.headers.get("Origin") != origin or self.headers.get("X-Council-Lab") != "local-synthetic":
                return self.reply(403,{"error":"Same-origin local lab request required."})
            if self.path != "/api/events": return self.reply(404,{"error":"No such lab operation."})
            if self.headers.get("Content-Type") != "application/json": return self.reply(415,{"error":"JSON required."})
            try:
                size=int(self.headers.get("Content-Length","0"))
                if size<1 or size>MAX_BODY: return self.reply(413,{"error":"Body limit exceeded."})
                body=json.loads(self.rfile.read(size).decode("utf-8"))
                self.reply(201,store.append(body))
            except RuntimeError as exc: self.reply(409,{"error":str(exc)})
            except (ValueError,UnicodeError) as exc: self.reply(400,{"error":str(exc)})
        def do_OPTIONS(self): self.reply(403,{"error":"No cross-origin access."})
    server=ThreadingHTTPServer(("127.0.0.1",port),Handler)
    server.store=store
    return server

if __name__ == "__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--db",required=True,help="Dedicated synthetic lab database path; never production storage")
    parser.add_argument("--port",type=int,default=0)
    args=parser.parse_args()
    path=Path(args.db).resolve()
    if not path.parent.is_dir(): parser.error("Database parent directory must exist.")
    server=make_server(path,args.port)
    print(json.dumps({"url":"http://127.0.0.1:"+str(server.server_port),"database":str(path),"mode":"LOCAL_SYNTHETIC_LAB"}),flush=True)
    try: server.serve_forever()
    except KeyboardInterrupt: pass
    finally: server.server_close()
